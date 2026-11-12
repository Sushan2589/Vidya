import db from "./index";

export interface SiteStats {
  studentsGuided: number;
  provincesReached: number;
  volunteers: number;
  updatedAt?: number;
}

export const DEFAULT_SITE_STATS: SiteStats = {
  studentsGuided: 11500,
  provincesReached: 6,
  volunteers: 120,
};

export async function getSiteStats(): Promise<SiteStats> {
  try {
    const result = await db.execute(
      "SELECT students_guided, provinces_reached, volunteers, updated_at FROM site_stats WHERE id = 1"
    );

    if (!result.rows || result.rows.length === 0) {
      return DEFAULT_SITE_STATS;
    }

    type DbRow = Record<string, unknown> & Record<number, unknown>;
    const row = result.rows[0] as DbRow;
    return {
      studentsGuided: Number(
        row.students_guided ?? row[0] ?? DEFAULT_SITE_STATS.studentsGuided
      ),
      provincesReached: Number(
        row.provinces_reached ?? row[1] ?? DEFAULT_SITE_STATS.provincesReached
      ),
      volunteers: Number(
        row.volunteers ?? row[2] ?? DEFAULT_SITE_STATS.volunteers
      ),
      updatedAt: Number(row.updated_at ?? row[3] ?? 0),
    };
  } catch (error) {
    console.error("Error reading site_stats:", error);
    return DEFAULT_SITE_STATS;
  }
}

export async function updateSiteStats(stats: {
  studentsGuided: number;
  provincesReached: number;
  volunteers: number;
}): Promise<SiteStats> {
  const now = Date.now();
  await db.execute({
    sql: `
      INSERT OR REPLACE INTO site_stats (id, students_guided, provinces_reached, volunteers, updated_at)
      VALUES (1, ?, ?, ?, ?)
    `,
    args: [stats.studentsGuided, stats.provincesReached, stats.volunteers, now],
  });

  return {
    studentsGuided: stats.studentsGuided,
    provincesReached: stats.provincesReached,
    volunteers: stats.volunteers,
    updatedAt: now,
  };
}

