import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { blogAdmin } from "@/lib/blog/http";

export const metadata: Metadata = {
  title: "Blog management | VIDYA",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function BlogAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await blogAdmin())) redirect("/admin/login");
  return children;
}
