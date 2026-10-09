import type { BlogPost } from "./types";
import type { BlogPostInput } from "../validations/blog";

export function postToInput(post: BlogPost): BlogPostInput {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    categoryId: post.categoryId,
    imageId: post.imageId,
    imageAlt: post.imageAlt,
    status: post.status,
    featured: post.featured,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    version: post.version,
  };
}
