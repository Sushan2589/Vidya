import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().optional().default(""),
  level: z.string().optional().default(""), // e.g. "Grades 9–12"
  summary: z.string().max(200).optional().default(""),
  details: z.string().optional().default(""),
  eligibility: z.string().optional().default(""), // newline-separated
  syllabus: z.string().optional().default(""), // newline-separated
  heldIn: z.string().optional().default(""),
  date: z.string().min(1, "Date is required"),
  location: z.string().optional().default(""),
  registrationLink: z.string().min(1, "Registration link is required").url("Must be a valid URL"),
  imageUrl: z
    .string()
    .min(1, "Image is required")
    .refine(
      (val) => val.startsWith("data:image/") || /^https?:\/\//.test(val),
      "Must be an image URL or an uploaded image"
    ),
});

export type EventInput = z.infer<typeof eventSchema>;

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}