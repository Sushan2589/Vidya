import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import {
  contentSchema,
  EMPTY_CONTENT,
  jsonLd,
  readingMinutes,
  safeLink,
  slugifyBlog,
} from "../lib/blog/content";
import { blogPostSchema } from "../lib/validations/blog";
import type { BlogPostInput } from "../lib/validations/blog";
import { prepareBlogImage } from "../lib/blog/images";
import { articleStructuredData } from "../lib/blog/seo";
import {
  createPost,
  deleteCategory,
  deletePost,
  getAdminPost,
  getFeaturedPost,
  getMedia,
  getPostBySlug,
  listCategories,
  listPosts,
  relatedPosts,
  saveCategory,
  sitemapPosts,
  storeMedia,
  updatePost,
} from "../lib/blog/repository";
import { postToInput } from "../lib/blog/forms";
import db from "../lib/db";

test("editor-supported images inside quotes and list items can be saved", () => {
  const image = { type: "image", attrs: { src: `/api/blog/media/${"a".repeat(32)}`, alt: "A study diagram" } };
  const paragraph = { type: "paragraph", content: [{ type: "text", text: "A quoted idea" }] };
  const schema = getSchema([StarterKit, ImageExtension]);
  const documents = [
    { type: "doc", content: [{ type: "blockquote", content: [paragraph, image, paragraph] }] },
    { type: "doc", content: [{ type: "bulletList", content: [{ type: "listItem", content: [paragraph, image] }] }] },
    { type: "doc", content: [{ type: "blockquote", content: [{ type: "blockquote", content: [paragraph, image] }] }] },
  ];
  for (const document of documents) {
    schema.nodeFromJSON(document).check();
    assert.equal(contentSchema.safeParse(document).success, true);
  }
  assert.equal(contentSchema.safeParse({ type: "doc", content: [{ type: "paragraph", content: [image] }] }).success, false);
});

test("acknowledged writes do not fetch again and falsely report save failure", async () => {
  const category = await saveCategory({
    name: "Save reliability",
    slug: "save-reliability",
  });
  const input = blogPostSchema.parse({
    title: "A partial draft",
    slug: "partial-draft",
    excerpt: "",
    content: EMPTY_CONTENT,
    author: "Editor",
    categoryId: category.id,
    imageId: null,
    imageAlt: "",
    status: "draft",
    featured: false,
    seoTitle: "",
    seoDescription: "",
  });
  const execute = db.execute.bind(db);
  async function withoutPostWriteRead<T>(operation: () => Promise<T>) {
    let committed = false;
    db.execute = async (
      statement: string | { sql: string; args?: unknown[] },
    ) => {
      if (committed) throw new Error("fetch failed after commit");
      const result = await execute(statement);
      const sql = typeof statement === "string" ? statement : statement.sql;
      if (/^(INSERT INTO|UPDATE) blog_posts/i.test(sql.trim()))
        committed = true;
      return result;
    };
    try {
      return await operation();
    } finally {
      db.execute = execute;
    }
  }
  const created = await withoutPostWriteRead(() => createPost(input));
  assert.deepEqual(await getAdminPost(created.id), created);
  const updated = await withoutPostWriteRead(() =>
    updatePost(created.id, {
      ...postToInput(created),
      title: "Updated partial draft",
    }),
  );
  assert.deepEqual(await getAdminPost(updated.id), updated);
  await deletePost(updated.id, updated.version);
  await deleteCategory(category.id);
});

test("inline image layout stays within safe responsive bounds", () => {
  const image = (attrs: Record<string, unknown>) => ({ type: "doc", content: [{ type: "image", attrs: { src: `/api/blog/media/${"a".repeat(32)}`, alt: "Students studying", ...attrs } }] });
  assert.equal(contentSchema.safeParse(image({ displayWidth: 40, align: "left", title: "Study session" })).success, true);
  assert.equal(contentSchema.safeParse(image({})).success, true);
  for (const attrs of [{ displayWidth: 24 }, { displayWidth: 101 }, { align: "absolute" }, { style: "position:fixed" }]) {
    assert.equal(contentSchema.safeParse(image(attrs)).success, false);
  }
});

test("editor link attributes survive validation without allowing arbitrary attributes", () => {
  const document = (attrs: Record<string, unknown>) => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Olympiad guide", marks: [{ type: "link", attrs }] }] }] });
  const attrs = { href: "https://example.com/guide", target: null, rel: "noopener noreferrer nofollow", class: null, title: null };
  assert.equal(contentSchema.safeParse(document(attrs)).success, true);
  assert.equal(contentSchema.safeParse(document({ ...attrs, title: "Read the guide" })).success, true);
  assert.equal(contentSchema.safeParse(document({ ...attrs, onclick: "alert(1)" })).success, false);
  assert.equal(contentSchema.safeParse(document({ ...attrs, href: "javascript:alert(1)" })).success, false);
});

test("rich content rejects scripts, unsafe URLs, private URL tricks and excessive depth", () => {
  assert.equal(safeLink("javascript:alert(1)"), false);
  assert.equal(safeLink("data:text/html,test"), false);
  assert.equal(safeLink("https://user:password@example.com"), false);
  assert.equal(safeLink("https://example.com/guide"), true);
  assert.equal(
    contentSchema.safeParse({
      type: "doc",
      content: [{ type: "script", text: "alert(1)" }],
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "link",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "https://example.com/image.svg", alt: "Image" },
        },
      ],
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Heading" }],
        },
      ],
    }).success,
    false,
  );
  let nested: unknown = { type: "paragraph" };
  for (let depth = 0; depth < 20; depth++)
    nested = { type: "blockquote", content: [nested] };
  assert.equal(
    contentSchema.safeParse({ type: "doc", content: [nested] }).success,
    false,
  );
});

test("reading time, Unicode slugs and structured data serialization", () => {
  assert.equal(readingMinutes(EMPTY_CONTENT), 1);
  assert.equal(
    readingMinutes({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: Array(401).fill("curiosity").join(" ") },
          ],
        },
      ],
    }),
    3,
  );
  assert.equal(slugifyBlog("  Learning & Curiosity! "), "learning-curiosity");
  assert.equal(slugifyBlog("नेपालका विद्यार्थी"), "नेपालका-विद्यार्थी");
  assert.ok(
    !jsonLd({ title: "</script><script>alert(1)</script>" }).includes("<"),
  );
});

test("publishing requires content, excerpt, featured image and alt text", () => {
  const draft = {
    title: "Draft",
    slug: "draft",
    excerpt: "",
    content: EMPTY_CONTENT,
    author: "Editor",
    categoryId: 1,
    imageId: null,
    imageAlt: "",
    status: "draft",
    featured: false,
    seoTitle: "",
    seoDescription: "",
  };
  assert.equal(blogPostSchema.safeParse(draft).success, true);
  assert.equal(
    blogPostSchema.safeParse({ ...draft, status: "published" }).success,
    false,
  );
  assert.equal(
    blogPostSchema.safeParse({ ...draft, categoryId: -1 }).success,
    false,
  );
});

test("uploads reject fake images/SVG and re-encode real raster images", async () => {
  await assert.rejects(prepareBlogImage(Buffer.from("not an image")));
  await assert.rejects(
    prepareBlogImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
      ),
    ),
  );
  const source = await sharp({
    create: { width: 2000, height: 1000, channels: 3, background: "#16324f" },
  })
    .png()
    .toBuffer();
  const image = await prepareBlogImage(source);
  const metadata = await sharp(image.data).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(image.width, 1600);
  assert.equal(image.height, 800);
});

test("database lifecycle: draft privacy, publication, search, pagination, conflicts, related articles and unpublish", async () => {
  await saveCategory({ name: "Olympiad Guides", slug: "olympiad-guides" });
  await saveCategory({ name: "Student Stories", slug: "student-stories" });
  const categories = await listCategories();
  const guide = categories.find((item) => item.slug === "olympiad-guides")!;
  const story = categories.find((item) => item.slug === "student-stories")!;
  const image = await prepareBlogImage(
    await sharp({
      create: { width: 64, height: 40, channels: 3, background: "#16324f" },
    })
      .png()
      .toBuffer(),
  );
  const media = await storeMedia(image.data, image.width, image.height);
  const input: BlogPostInput = {
    title: "Preparing for Olympiads",
    slug: "preparing-for-olympiads",
    excerpt: "A student's guide",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Practice builds confidence and curiosity." },
          ],
        },
      ],
    },
    author: "VIDYA Editor",
    categoryId: guide.id,
    imageId: media.id,
    imageAlt: "A study desk",
    status: "draft",
    featured: true,
    seoTitle: "Olympiad preparation",
    seoDescription: "Build curiosity with practice.",
  };
  const draft = await createPost(input);
  assert.deepEqual(
    await getAdminPost(draft.id),
    draft,
    "Create response must match the stored draft.",
  );
  assert.equal((await listPosts({ admin: true, status: "draft" })).total, 1);
  assert.equal(
    (await listPosts({ admin: true, status: "published" })).total,
    0,
  );
  assert.equal(await getPostBySlug(draft.slug), null);
  assert.equal((await listPosts()).total, 0);
  assert.equal(await getMedia(media.id), null);
  assert.ok(await getMedia(media.id, true));
  await assert.rejects(
    createPost(input),
    (error: unknown) =>
      error instanceof Error && "status" in error && error.status === 409,
  );
  const published = await updatePost(draft.id, {
    ...postToInput(draft),
    status: "published",
  });
  assert.ok(published.publishedAt);
  assert.deepEqual(
    await getAdminPost(published.id),
    published,
    "Update response must match the stored article.",
  );
  assert.equal(published.version, 2);
  assert.equal((await getPostBySlug(draft.slug))?.id, draft.id);
  assert.ok(await getMedia(media.id));
  assert.equal((await getFeaturedPost())?.id, draft.id);
  assert.equal((await listPosts({ search: "confidence" })).total, 1);
  assert.equal((await listPosts({ search: "%" })).total, 0);
  assert.equal((await listPosts({ search: "' OR 1=1 --" })).total, 0);
  assert.equal((await listPosts({ category: "student-stories" })).total, 0);
  await assert.rejects(
    updatePost(draft.id, postToInput(draft)),
    /changed elsewhere/,
  );
  await assert.rejects(deleteCategory(guide.id), /in use/);
  assert.equal(
    articleStructuredData(published).mainEntityOfPage["@id"],
    "https://vidya.example/blog/preparing-for-olympiads",
  );
  for (let index = 0; index < 11; index++)
    await createPost({
      ...input,
      title: `Student Story ${index}`,
      slug: `student-story-${index}`,
      status: "published",
      categoryId: story.id,
      featured: false,
    });
  const firstPage = await listPosts();
  const secondPage = await listPosts({ page: 2 });
  assert.equal(firstPage.total, 12);
  assert.equal(firstPage.posts.length, 9);
  assert.equal(secondPage.posts.length, 3);
  assert.equal((await listPosts({ page: 999 })).page, 2);
  assert.equal(
    new Set([...firstPage.posts, ...secondPage.posts].map((post) => post.id))
      .size,
    12,
  );
  assert.equal((await relatedPosts(published)).length, 3);
  assert.equal((await sitemapPosts()).length, 12);
  const unpublished = await updatePost(published.id, {
    ...postToInput(published),
    status: "draft",
  });
  assert.equal(await getPostBySlug(unpublished.slug), null);
  assert.equal((await sitemapPosts()).length, 11);
  assert.equal(unpublished.publishedAt, published.publishedAt);
  await assert.rejects(deletePost(unpublished.id, 1), /changed elsewhere/);
  await deletePost(unpublished.id, unpublished.version);
  assert.equal(await getAdminPost(unpublished.id), null);
  await deleteCategory(guide.id);
});
