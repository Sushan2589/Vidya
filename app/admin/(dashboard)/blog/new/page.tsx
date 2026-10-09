import { BlogEditorForm } from "@/components/blog/admin/BlogEditorForm";
import { listCategories } from "@/lib/blog/repository";
import { requireBlogAdmin } from "@/lib/blog/http";

export default async function NewArticlePage() {
  const username = await requireBlogAdmin();
  return (
    <BlogEditorForm categories={await listCategories()} username={username} />
  );
}
