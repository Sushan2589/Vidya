import { blogPostSchema } from "@/lib/validations/blog";
import { createPost, listPosts } from "@/lib/blog/repository";
import {
  blogFailure,
  blogJson,
  readJson,
  requireBlogAdmin,
  requireSameOrigin,
} from "@/lib/blog/http";

export async function GET(request: Request) {
  try {
    await requireBlogAdmin();
    const query = new URL(request.url).searchParams;
    return blogJson(
      await listPosts({
        admin: true,
        status:
          query.get("status") === "draft"
            ? "draft"
            : query.get("status") === "published"
              ? "published"
              : undefined,
        search: query.get("q") || "",
        page: Number.parseInt(query.get("page") || "1") || 1,
      }),
    );
  } catch (error) {
    return blogFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    await requireBlogAdmin();
    requireSameOrigin(request);
    return blogJson(
      await createPost(blogPostSchema.parse(await readJson(request))),
      201,
    );
  } catch (error) {
    return blogFailure(error);
  }
}
