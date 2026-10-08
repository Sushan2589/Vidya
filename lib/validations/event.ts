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
  registrationLink: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
});

export type EventInput = z.infer<typeof eventSchema>;

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}