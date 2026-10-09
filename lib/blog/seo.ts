import type { BlogPost } from "./types";

export function siteOrigin() {
  const value =
    process.env.SITE_URL ||
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  if (!value)
    throw new Error(
      "Set SITE_URL to the public website origin for canonical URLs and the sitemap.",
    );
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must be an http(s) origin without a path, credentials or query.",
    );
  }
  return url.origin;
}
export function articleUrl(slug: string) {
  return `${siteOrigin()}/blog/${encodeURIComponent(slug)}`;
}
export function articleStructuredData(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.imageId
      ? [`${siteOrigin()}/api/blog/media/${post.imageId}`]
      : undefined,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "VIDYA" },
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: new Date(post.updatedAt).toISOString(),
    articleSection: post.categoryName,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl(post.slug) },
  };
}
export function formatBlogDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(timestamp);
}
