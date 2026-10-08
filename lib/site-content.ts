import db from "@/lib/db";

export type SiteStats = {
  studentsGuided: number;
  provincesReached: number;
  volunteers: number;
};

export type NewsArticle = {
  title: string;
  description: string;
  href: string;
};

export type Initiative = {
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
};

const defaultStats: SiteStats = {
  studentsGuided: 9000,
  provincesReached: 5,
  volunteers: 100,
};

const defaultNews: NewsArticle[] = [
  {
    title: "Hamrakura",
    description:
      "VIDYA’s outreach and learning initiatives were featured in a leading Nepalese media platform, highlighting our work in building academic opportunities for young students.",
    href: "https://hamrakura.com/news-details/220727/2026-09-16",
  },
  {
    title: "Artha Bulletin",
    description:
      "Our efforts to inspire students through olympiad awareness, leadership, and digital learning were highlighted in a national story on youth academic growth.",
    href: "https://arthabulletin.com/2026/09/09/%e0%a4%ae%e0%a4%be%e0%a4%a7%e0%a5%8d%e0%a4%af%e0%a4%ae%e0%a4%bf%e0%a4%95-%e0%a4%b5%e0%a4%bf%e0%a4%a6%e0%a5%8d%e0%a4%af%e0%a4%be%e0%a4%b2%e0%a4%af%e0%a4%b9%e0%a4%b0%e0%a5%82%e0%a4%ae%e0%a4%be-%e0%a4%93/",
  },
];

const defaultInitiatives: Initiative[] = [
  {
    title: "Outreach Campaigns",
    description:
      "VIDYA has been leading outreach campaigns to raise awareness about olympiads and opportunities across Nepal. What began as our first initiative has now grown into a sustained effort, reaching over 9,000 students across 36 schools to date.",
    imageUrl: "https://i.ibb.co/m5BSVjfN/Outreach-VIDYA.jpg",
    startDate: "May 2025",
  },
  {
    title: "VIDYA X JCI Edutech",
    description:
      "In an era shaped by technology and AI, VIDYA has collaborated with JCI Jr. to conduct awareness sessions across Chandragiri Municipality, reaching more than 1,000 students. These sessions provide valuable knowledge about AI, technology, and its practical applications.",
    imageUrl: "https://i.ibb.co/qMhPbBsQ/image-025.jpg",
    startDate: "July 2026",
  },
  {
    title: "Opportunity Connect Nepal",
    description:
      "VIDYA is building an online community for Nepali students where aspiring learners can connect with international delegates and build a strong network to help them prepare for olympiads, hackathons, and competitive exams.",
    imageUrl: "https://i.ibb.co/FbzXJ0sF/Screenshot-2026-10-08-185002.png",
    startDate: "August 2026",
  },
  {
    title: "Weekly Olympiad Workshops",
    description:
      "VIDYA hosts weekly olympiad workshops featuring international participants and medalists as keynote speakers. These sessions cover a wide range of topics, including international mathematics, physics, chemistry, biology, AI, and astronomy olympiads, among others.",
    imageUrl: "https://i.ibb.co/35Z3rXkc/image-031.jpg",
    startDate: "August 2026",
  },
];

function normalizeNumber(value: unknown, fallback: number) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? number : fallback;
}

export async function getSiteContent() {
  const statsResult = await db.execute(
    "SELECT key, value, label, suffix FROM site_stats ORDER BY sort_order ASC, id ASC"
  );

  const stats = { ...defaultStats };
  for (const row of statsResult.rows as Array<Record<string, unknown>>) {
    const key = String(row.key ?? "");
    const value = String(row.value ?? "");

    if (key === "students_guided") {
      stats.studentsGuided = normalizeNumber(value, defaultStats.studentsGuided);
    }
    if (key === "provinces_reached") {
      stats.provincesReached = normalizeNumber(value, defaultStats.provincesReached);
    }
    if (key === "volunteers") {
      stats.volunteers = normalizeNumber(value, defaultStats.volunteers);
    }
  }

  const newsResult = await db.execute(
    "SELECT title, description, href FROM news_articles WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC"
  );

  const news =
    (newsResult.rows as Array<Record<string, unknown>>).length > 0
      ? (newsResult.rows as Array<Record<string, unknown>>).map((row) => ({
          title: String(row.title || ""),
          description: String(row.description || ""),
          href: String(row.href || ""),
        }))
      : defaultNews;

  const initiativeResult = await db.execute(
    "SELECT title, description, image_url AS imageUrl, start_date AS startDate FROM initiatives WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC"
  );

  const initiatives =
    (initiativeResult.rows as Array<Record<string, unknown>>).length > 0
      ? (initiativeResult.rows as Array<Record<string, unknown>>).map((row) => ({
          title: String(row.title || ""),
          description: String(row.description || ""),
          imageUrl: String(row.imageUrl || ""),
          startDate: String(row.startDate || ""),
        }))
      : defaultInitiatives;

  return {
    stats,
    news,
    initiatives,
  };
}
