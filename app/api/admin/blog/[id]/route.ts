import { z } from "zod";
import { blogPostSchema } from "@/lib/validations/blog";
import {
  BlogError,
  deletePost,
  getAdminPost,
  updatePost,
} from "@/lib/blog/repository";
import {
  blogFailure,
  blogJson,
  numericId,
  readJson,
  requireBlogAdmin,
  requireSameOrigin,
} from "@/lib/blog/http";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    await requireBlogAdmin();
    const post = await getAdminPost(numericId((await params).id));
    if (!post) throw new BlogError("Article not found.", 404);
    return blogJson(post);
  } catch (error) {
    return blogFailure(error);
  }
}
export async function PUT(request: Request, { params }: Context) {
  try {
    await requireBlogAdmin();
    requireSameOrigin(request);
    return blogJson(
      await updatePost(
        numericId((await params).id),
        blogPostSchema.parse(await readJson(request)),
      ),
    );
  } catch (error) {
    return blogFailure(error);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    await requireBlogAdmin();
    requireSameOrigin(request);
    const { version } = z
      .object({ version: z.number().int().positive() })
      .strict()
      .parse(await readJson(request));
    await deletePost(numericId((await params).id), version);
    return blogJson({ ok: true });
  } catch (error) {
    return blogFailure(error);
  }
}
