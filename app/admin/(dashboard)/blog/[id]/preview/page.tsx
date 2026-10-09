import { notFound } from "next/navigation";
import { ArticleView } from "@/components/blog/ArticleView";
import { getAdminPost } from "@/lib/blog/repository";
import { requireBlogAdmin } from "@/lib/blog/http";

export default async function PreviewArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBlogAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const post = await getAdminPost(id);
  if (!post) notFound();
  return (
    <div className="py-4">
      <ArticleView post={post} preview />
    </div>
  );
}
