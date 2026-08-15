// ---------------------------------------------------------------------------
// MERGE INTO: wherever your existing event zod schema lives
// (e.g. lib/validations/event.ts, or inline in api/admin/events/route.ts)
// ---------------------------------------------------------------------------

import { z } from "zod";

// eligibility / syllabus are authored in the admin form as one item per
// line (like a plain textarea) and stored as newline-separated TEXT in
// SQLite — no need for a JSON column or a join table for a handful of
// bullet points per olympiad.
export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  level: z.string().min(1, "Level is required"), // e.g. "Grades 9–12"
  summary: z.string().min(1, "Short summary is required").max(200),
  details: z.string().min(1, "Full description is required"),
  eligibility: z.string().optional().default(""), // newline-separated
  syllabus: z.string().optional().default(""), // newline-separated
  heldIn: z.string().min(1, "e.g. 'Held annually, July'"),
  date: z.string().optional(),
  location: z.string().optional(),
  registrationLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export type EventInput = z.infer<typeof eventSchema>;

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}