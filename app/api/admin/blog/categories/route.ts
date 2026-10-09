import { categorySchema } from "@/lib/validations/blog";
import { listCategories, saveCategory } from "@/lib/blog/repository";
import {
  blogFailure,
  blogJson,
  readJson,
  requireBlogAdmin,
  requireSameOrigin,
} from "@/lib/blog/http";

export async function GET() {
  try {
    await requireBlogAdmin();
    return blogJson(await listCategories());
  } catch (error) {
    return blogFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    await requireBlogAdmin();
    requireSameOrigin(request);
    const category = await saveCategory(
      categorySchema.parse(await readJson(request)),
    );
    return blogJson({ ok: true, ...category }, 201);
  } catch (error) {
    return blogFailure(error);
  }
}
