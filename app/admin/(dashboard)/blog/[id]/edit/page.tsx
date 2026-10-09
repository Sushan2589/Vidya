import { notFound } from "next/navigation";
import { BlogEditorForm } from "@/components/blog/admin/BlogEditorForm";
import { getAdminPost, listCategories } from "@/lib/blog/repository";
import { requireBlogAdmin } from "@/lib/blog/http";

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const username = await requireBlogAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const post = await getAdminPost(id);
  if (!post) notFound();
  return (
    <BlogEditorForm
      key={post.id}
      initialPost={post}
      categories={await listCategories()}
      username={username}
      reviewInitially={
        (await searchParams).review === "1" && post.status === "draft"
      }
    />
  );
}
