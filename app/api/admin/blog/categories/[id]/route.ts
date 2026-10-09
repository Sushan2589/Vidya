import { categorySchema } from "@/lib/validations/blog";
import { deleteCategory, saveCategory } from "@/lib/blog/repository";
import {
  blogFailure,
  blogJson,
  numericId,
  readJson,
  requireBlogAdmin,
  requireSameOrigin,
} from "@/lib/blog/http";

type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Context) {
  try {
    await requireBlogAdmin();
    requireSameOrigin(request);
    await saveCategory(
      categorySchema.parse(await readJson(request)),
      numericId((await params).id),
    );
    return blogJson({ ok: true });
  } catch (error) {
    return blogFailure(error);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    await requireBlogAdmin();
    requireSameOrigin(request);
    await deleteCategory(numericId((await params).id));
    return blogJson({ ok: true });
  } catch (error) {
    return blogFailure(error);
  }
}
