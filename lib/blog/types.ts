import type { ContentNode } from "./content";

export type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  postCount: number;
};
export type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  imageId: string | null;
  imageAlt: string;
  status: "draft" | "published";
  featured: boolean;
  readingMinutes: number;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
  version: number;
};
export type BlogPost = BlogPostSummary & {
  content: ContentNode;
  seoTitle: string;
  seoDescription: string;
};
export type BlogListing = {
  posts: BlogPostSummary[];
  total: number;
  page: number;
  pages: number;
};
