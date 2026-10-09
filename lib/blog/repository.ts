import { randomBytes } from "node:crypto";
import db from "../db";
import type { BlogPostInput, CategoryInput } from "../validations/blog";
import {
  contentSchema,
  contentMediaIds,
  contentText,
  readingMinutes,
} from "./content";
import type {
  BlogCategory,
  BlogListing,
  BlogPost,
  BlogPostSummary,
} from "./types";

type Row = Record<string, unknown> | unknown[];
function values(row: Row) {
  return Array.isArray(row) ? row : Object.values(row);
}
export class BlogError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const SUMMARY_COLUMNS = `p.id, p.title, p.slug, p.excerpt, p.author, p.category_id, c.name AS category_name, c.slug AS category_slug,
  p.image_id, p.image_alt, p.status, p.featured, p.reading_minutes, p.published_at, p.created_at, p.updated_at, p.version`;
const JOIN = `FROM blog_posts p JOIN blog_categories c ON c.id = p.category_id`;
function summary(row: Row): BlogPostSummary {
  const v = values(row);
  return {
    id: Number(v[0]),
    title: String(v[1]),
    slug: String(v[2]),
    excerpt: String(v[3]),
    author: String(v[4]),
    categoryId: Number(v[5]),
    categoryName: String(v[6]),
    categorySlug: String(v[7]),
    imageId: v[8] ? String(v[8]) : null,
    imageAlt: String(v[9]),
    status: v[10] === "published" ? "published" : "draft",
    featured: Boolean(Number(v[11])),
    readingMinutes: Number(v[12]),
    publishedAt: v[13] == null ? null : Number(v[13]),
    createdAt: Number(v[14]),
    updatedAt: Number(v[15]),
    version: Number(v[16]),
  };
}
function fullPost(row: Row): BlogPost {
  const v = values(row);
  return {
    ...summary(row),
    content: contentSchema.parse(JSON.parse(String(v[17]))),
    seoTitle: String(v[18]),
    seoDescription: String(v[19]),
  };
}
function changed(result: { rowsAffected?: number; changes?: number }) {
  return Number(result.rowsAffected ?? result.changes ?? 0);
}
export const PAGE_SIZE = 9;

export async function listCategories(
  publicOnly = false,
): Promise<BlogCategory[]> {
  const result =
    await db.execute(`SELECT c.id, c.name, c.slug, COUNT(p.id) FROM blog_categories c
    LEFT JOIN blog_posts p ON p.category_id = c.id ${publicOnly ? "AND p.status = 'published'" : ""}
    GROUP BY c.id, c.name, c.slug ${publicOnly ? "HAVING COUNT(p.id) > 0" : ""} ORDER BY c.name COLLATE NOCASE`);
  return result.rows.map((row: Row) => {
    const v = values(row);
    return {
      id: Number(v[0]),
      name: String(v[1]),
      slug: String(v[2]),
      postCount: Number(v[3]),
    };
  });
}

export async function listPosts(
  options: {
    search?: string;
    category?: string;
    page?: number;
    admin?: boolean;
    status?: "draft" | "published";
  } = {},
): Promise<BlogListing> {
  const search = (options.search || "").trim().slice(0, 120);
  const conditions = options.admin ? ["1 = 1"] : ["p.status = 'published'"];
  const args: (string | number)[] = [];
  if (options.admin && options.status) {
    conditions.push("p.status = ?");
    args.push(options.status);
  }
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      "(p.title LIKE ? ESCAPE '\\' OR p.excerpt LIKE ? ESCAPE '\\' OR p.search_text LIKE ? ESCAPE '\\')",
    );
    args.push(escaped, escaped, escaped);
  }
  if (options.category) {
    conditions.push("c.slug = ?");
    args.push(options.category);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const count = await db.execute({
    sql: `SELECT COUNT(*) ${JOIN} ${where}`,
    args,
  });
  const total = Number(values(count.rows[0])[0]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(options.page || 1)));
  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS} ${JOIN} ${where}
    ORDER BY ${options.admin ? "p.updated_at" : "p.published_at"} DESC, p.id DESC LIMIT ? OFFSET ?`,
    args: [...args, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  });
  return { posts: result.rows.map(summary), total, page, pages };
}

export async function getFeaturedPost(): Promise<BlogPostSummary | null> {
  const result =
    await db.execute(`SELECT ${SUMMARY_COLUMNS} ${JOIN} WHERE p.status = 'published'
    ORDER BY p.featured DESC, p.published_at DESC, p.id DESC LIMIT 1`);
  return result.rows[0] ? summary(result.rows[0]) : null;
}
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS}, p.content_json, p.seo_title, p.seo_description ${JOIN}
    WHERE p.slug = ? AND p.status = 'published'`,
    args: [slug],
  });
  return result.rows[0] ? fullPost(result.rows[0]) : null;
}
export async function getAdminPost(id: number): Promise<BlogPost | null> {
  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS}, p.content_json, p.seo_title, p.seo_description ${JOIN} WHERE p.id = ?`,
    args: [id],
  });
  return result.rows[0] ? fullPost(result.rows[0]) : null;
}
export async function relatedPosts(post: BlogPost): Promise<BlogPostSummary[]> {
  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS} ${JOIN} WHERE p.status = 'published' AND p.id != ?
    ORDER BY CASE WHEN p.category_id = ? THEN 0 ELSE 1 END, p.published_at DESC, p.id DESC LIMIT 3`,
    args: [post.id, post.categoryId],
  });
  return result.rows.map(summary);
}

async function assertReferences(input: BlogPostInput) {
  const category = await db.execute({
    sql: "SELECT id, name, slug FROM blog_categories WHERE id = ?",
    args: [input.categoryId],
  });
  if (!category.rows.length)
    throw new BlogError("Choose an existing category.");
  const ids = [
    ...new Set([
      ...(input.imageId ? [input.imageId] : []),
      ...contentMediaIds(input.content),
    ]),
  ];
  for (const id of ids) {
    const media = await db.execute({
      sql: "SELECT id FROM blog_media WHERE id = ?",
      args: [id],
    });
    if (!media.rows.length)
      throw new BlogError(
        "An article image no longer exists. Upload it again.",
      );
  }
  const categoryValues = values(category.rows[0]);
  return { name: String(categoryValues[1]), slug: String(categoryValues[2]) };
}
function writeArgs(input: BlogPostInput) {
  return [
    input.title,
    input.slug,
    input.excerpt,
    JSON.stringify(input.content),
    contentText(input.content),
    input.author,
    input.categoryId,
    input.imageId,
    input.imageAlt,
    input.status,
    input.featured ? 1 : 0,
    readingMinutes(input.content),
    input.seoTitle,
    input.seoDescription,
    `|${contentMediaIds(input.content).join("|")}|`,
  ];
}
function uniqueError(error: unknown): never {
  if (/unique/i.test(String(error)))
    throw new BlogError("That slug or name is already in use.", 409);
  throw error;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const category = await assertReferences(input);
  const now = Date.now();
  try {
    const result = await db.execute({
      sql: `INSERT INTO blog_posts
      (title, slug, excerpt, content_json, search_text, author, category_id, image_id, image_alt, status, featured, reading_minutes,
       seo_title, seo_description, media_ids, published_at, created_at, updated_at) VALUES (${Array(18).fill("?").join(",")})`,
      args: [
        ...writeArgs(input),
        input.status === "published" ? now : null,
        now,
        now,
      ],
    });
    // Do not perform a second remote fetch after a successful write: a network
    // failure there would report an error even though the draft was saved.
    return {
      ...input,
      id: Number(result.lastInsertRowid),
      categoryName: category.name,
      categorySlug: category.slug,
      readingMinutes: readingMinutes(input.content),
      publishedAt: input.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
  } catch (error) {
    uniqueError(error);
  }
}
export async function updatePost(
  id: number,
  input: BlogPostInput,
): Promise<BlogPost> {
  const current = await getAdminPost(id);
  if (!current) throw new BlogError("Article not found.", 404);
  if (input.version !== current.version)
    throw new BlogError(
      "This article was changed elsewhere. Reload before editing.",
      409,
    );
  const category = await assertReferences(input);
  // Preserve the original publication date through edits and unpublish/republish.
  const publishedAt =
    current.publishedAt ?? (input.status === "published" ? Date.now() : null);
  const updatedAt = Date.now();
  try {
    const result = await db.execute({
      sql: `UPDATE blog_posts SET title=?, slug=?, excerpt=?, content_json=?, search_text=?, author=?,
      category_id=?, image_id=?, image_alt=?, status=?, featured=?, reading_minutes=?, seo_title=?, seo_description=?,
      media_ids=?, published_at=?, updated_at=?, version=version+1 WHERE id=? AND version=?`,
      args: [...writeArgs(input), publishedAt, updatedAt, id, input.version],
    });
    if (!changed(result))
      throw new BlogError(
        "This article was changed elsewhere. Reload before editing.",
        409,
      );
    return {
      ...input,
      id,
      categoryName: category.name,
      categorySlug: category.slug,
      readingMinutes: readingMinutes(input.content),
      publishedAt,
      createdAt: current.createdAt,
      updatedAt,
      version: current.version + 1,
    };
  } catch (error) {
    uniqueError(error);
  }
}
export async function deletePost(id: number, version: number) {
  const result = await db.execute({
    sql: "DELETE FROM blog_posts WHERE id = ? AND version = ?",
    args: [id, version],
  });
  if (!changed(result))
    throw new BlogError(
      "Article was removed or changed elsewhere. Reload the list.",
      409,
    );
}

export async function saveCategory(input: CategoryInput, id?: number) {
  try {
    const result = id
      ? await db.execute({
          sql: "UPDATE blog_categories SET name = ?, slug = ? WHERE id = ?",
          args: [input.name, input.slug, id],
        })
      : await db.execute({
          sql: "INSERT INTO blog_categories (name, slug) VALUES (?, ?)",
          args: [input.name, input.slug],
        });
    if (id && !changed(result)) throw new BlogError("Category not found.", 404);
    return { id: id || Number(result.lastInsertRowid), ...input, postCount: 0 };
  } catch (error) {
    uniqueError(error);
  }
}
export async function deleteCategory(id: number) {
  const result = await db.execute({
    sql: "DELETE FROM blog_categories WHERE id = ? AND NOT EXISTS (SELECT 1 FROM blog_posts WHERE category_id = ?)",
    args: [id, id],
  });
  if (!changed(result))
    throw new BlogError("Category is in use or no longer exists.", 409);
}

export async function storeMedia(data: Buffer, width: number, height: number) {
  const id = randomBytes(16).toString("hex");
  await db.execute({
    sql: "INSERT INTO blog_media (id, data_base64, width, height, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [id, data.toString("base64"), width, height, Date.now()],
  });
  return { id, width, height, url: `/api/blog/media/${id}` };
}
export async function getMedia(id: string, admin = false) {
  // Only validated image-node references enter media_ids; text mentioning a
  // URL cannot make a private upload public. Never read whole articles here.
  if (!admin) {
    const visible = await db.execute({
      sql: "SELECT 1 FROM blog_posts WHERE status = 'published' AND (image_id = ? OR instr(media_ids, ?) > 0) LIMIT 1",
      args: [id, `|${id}|`],
    });
    if (!visible.rows.length) return null;
  }
  const result = await db.execute({
    sql: "SELECT data_base64, width, height FROM blog_media WHERE id = ?",
    args: [id],
  });
  if (!result.rows[0]) return null;
  const v = values(result.rows[0]);
  return {
    data: Buffer.from(String(v[0]), "base64"),
    width: Number(v[1]),
    height: Number(v[2]),
  };
}
export async function sitemapPosts(): Promise<
  { slug: string; updatedAt: number }[]
> {
  const result = await db.execute(
    "SELECT slug, updated_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 49000",
  );
  return result.rows.map((row: Row) => {
    const v = values(row);
    return { slug: String(v[0]), updatedAt: Number(v[1]) };
  });
}
