import { CategoryManager } from "@/components/blog/admin/CategoryManager";
import { listCategories } from "@/lib/blog/repository";
import { requireBlogAdmin } from "@/lib/blog/http";

export default async function BlogCategoriesPage() {
  await requireBlogAdmin();
  return <CategoryManager categories={await listCategories()} />;
}
