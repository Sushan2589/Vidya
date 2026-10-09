import { z } from "zod";
import { contentSchema, contentText, MEDIA_ID_PATTERN } from "../blog/content";

const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:-[\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*$/u,
    "Use letters, numbers and single hyphens.",
  );
export const categorySchema = z
  .object({ name: z.string().trim().min(1).max(80), slug })
  .strict();
export const blogPostSchema = z
  .object({
    title: z.string().trim().min(1, "Add an article title.").max(180),
    slug,
    excerpt: z.string().trim().max(320),
    content: contentSchema,
    author: z.string().trim().min(1, "Add an author name.").max(100),
    categoryId: z.number().int().positive("Choose or create a category."),
    imageId: z.string().regex(MEDIA_ID_PATTERN).nullable(),
    imageAlt: z.string().trim().max(300),
    status: z.enum(["draft", "published"]),
    featured: z.boolean(),
    seoTitle: z.string().trim().max(70),
    seoDescription: z.string().trim().max(180),
    version: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((post, ctx) => {
    if (post.status === "published") {
      if (!post.excerpt)
        ctx.addIssue({
          code: "custom",
          path: ["excerpt"],
          message: "Add an excerpt before publishing.",
        });
      if (!contentText(post.content).trim())
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Write article content before publishing.",
        });
      if (!post.imageId || !post.imageAlt)
        ctx.addIssue({
          code: "custom",
          path: ["imageId"],
          message:
            "Upload a featured image and add alt text before publishing.",
        });
    }
  });

export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
