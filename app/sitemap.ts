import type { MetadataRoute } from "next";
import { sitemapPosts } from "@/lib/blog/repository";
import { siteOrigin, articleUrl } from "@/lib/blog/seo";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sitemapPosts();
  return [
    ...["", "/about", "/contact", "/olympiads", "/resources", "/blog"].map(
      (path) => ({
        url: `${siteOrigin()}${path}`,
        changeFrequency: "weekly" as const,
      }),
    ),
    ...posts.map((post) => ({
      url: articleUrl(post.slug),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
    })),
  ];
}
