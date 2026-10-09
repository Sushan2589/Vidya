import { BlogAdminList } from "@/components/blog/admin/BlogAdminList";
import { listPosts } from "@/lib/blog/repository";
import { requireBlogAdmin } from "@/lib/blog/http";

export default async function BlogAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  await requireBlogAdmin();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const status =
    params.status === "draft" || params.status === "published"
      ? params.status
      : undefined;
  const listing = await listPosts({
    admin: true,
    search,
    status,
    page:
      Number.parseInt(typeof params.page === "string" ? params.page : "1") || 1,
  });
  return <BlogAdminList listing={listing} search={search} status={status} />;
}
