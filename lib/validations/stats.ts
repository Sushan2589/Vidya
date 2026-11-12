import { z } from "zod";

export const siteStatsSchema = z.object({
  studentsGuided: z.coerce.number().int().nonnegative(),
  provincesReached: z.coerce.number().int().min(1).max(7),
  volunteers: z.coerce.number().int().nonnegative(),
});

export type SiteStatsInput = z.infer<typeof siteStatsSchema>;
