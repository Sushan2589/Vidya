import { createClient } from "@tursodatabase/serverless/compat";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let db: any;

if (url && authToken) {
  // Turso/libSQL client for production.
  db = createClient({
    url,
    authToken,
  });
} else {
  // Local fallback using node:sqlite when remote Turso credentials are not configured.
  const sqliteModule = (process as any).getBuiltinModule
    ? (process as any).getBuiltinModule("node:sqlite")
    : eval("require")("node:sqlite");
  const { DatabaseSync } = sqliteModule;
  const sqlite = new DatabaseSync("vidya_local.db");
  sqlite.exec("PRAGMA journal_mode = WAL;");

  db = {
    async execute(input: string | { sql: string; args?: unknown[] }) {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? [] : (input.args ?? []);
      const trimmed = sql.trim().toUpperCase();

      if (trimmed.startsWith("SELECT") || trimmed.startsWith("PRAGMA")) {
        const stmt = sqlite.prepare(sql);
        const rawRows = stmt.all(...(args as any[]));
        const rows = rawRows.map((r: any) => {
          const vals = Object.values(r);
          for (const [k, v] of Object.entries(r)) {
            (vals as any)[k] = v;
          }
          return vals;
        });
        return { rows };
      } else {
        const stmt = sqlite.prepare(sql);
        const info = stmt.run(...(args as any[]));
        return {
          rows: [],
          lastInsertRowid: info.lastInsertRowid,
          changes: info.changes,
        };
      }
    },
    async batch(statements: (string | { sql: string; args?: unknown[] })[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await this.execute(stmt));
      }
      return results;
    },
  };
}

/**
 * Initialize the database schema.
 *
 * This runs once when this module is loaded in a server process.
 * CREATE TABLE IF NOT EXISTS makes it safe to run repeatedly.
 */
async function initializeDatabase() {
  await db.batch(
    [
      `
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
      `,
      

      `
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT '',
        level TEXT NOT NULL DEFAULT '',
        summary TEXT NOT NULL DEFAULT '',
        details TEXT NOT NULL DEFAULT '',
        eligibility TEXT NOT NULL DEFAULT '',
        syllabus TEXT NOT NULL DEFAULT '',
        held_in TEXT NOT NULL DEFAULT '',
        date TEXT,
        location TEXT,
        registration_link TEXT,
        image_url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
      `,

      `
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        category TEXT,
        created_at INTEGER NOT NULL
      )
      `,

      `
      CREATE TABLE IF NOT EXISTS timeline_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
      `,
      // Newsletter subscribers
      `
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
      `,

      // Popups and Notices
      `
      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        notice_type TEXT NOT NULL DEFAULT 'popup_combo',
        image_url TEXT,
        image_fit TEXT DEFAULT 'contain',
        tag TEXT DEFAULT 'Important Notice',
        heading TEXT,
        description TEXT,
        design_style TEXT DEFAULT 'gold',
        button_text TEXT,
        button_url TEXT,
        display_location TEXT DEFAULT 'popup',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      )
      `,

      `
      CREATE TABLE IF NOT EXISTS site_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        value TEXT NOT NULL DEFAULT '0',
        suffix TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0
      )
      `,

      `
      CREATE TABLE IF NOT EXISTS news_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        href TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
      `,

      `
      CREATE TABLE IF NOT EXISTS initiatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        start_date TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
      `,
    ],
    "write"
  );

  await db.execute(`
    INSERT OR IGNORE INTO site_stats (key, label, value, suffix, sort_order)
    VALUES
      ('students_guided', 'Students Guided', '9000', '+', 1),
      ('provinces_reached', 'Provinces Reached', '5', '', 2),
      ('volunteers', 'Volunteers', '100', '+', 3)
  `);

  await db.execute(`
    INSERT OR IGNORE INTO news_articles (title, description, href, sort_order)
    VALUES
      ('Hamrakura', 'VIDYA’s outreach and learning initiatives were featured in a leading Nepalese media platform, highlighting our work in building academic opportunities for young students.', 'https://hamrakura.com/news-details/220727/2026-09-16', 1),
      ('Artha Bulletin', 'Our efforts to inspire students through olympiad awareness, leadership, and digital learning were highlighted in a national story on youth academic growth.', 'https://arthabulletin.com/2026/09/09/%e0%a4%ae%e0%a4%be%e0%a4%a7%e0%a5%8d%e0%a4%af%e0%a4%ae%e0%a4%bf%e0%a4%95-%e0%a4%b5%e0%a4%bf%e0%a4%a6%e0%a5%8d%e0%a4%af%e0%a4%be%e0%a4%b2%e0%a4%af%e0%a4%b9%e0%a4%b0%e0%a5%82%e0%a4%ae%e0%a4%be-%e0%a4%93/', 2)
  `);

  await db.execute(`
    INSERT OR IGNORE INTO initiatives (title, description, image_url, start_date, sort_order)
    VALUES
      ('Outreach Campaigns', 'VIDYA has been leading outreach campaigns to raise awareness about olympiads and opportunities across Nepal. What began as our first initiative has now grown into a sustained effort, reaching over 9,000 students across 36 schools to date.', 'https://i.ibb.co/m5BSVjfN/Outreach-VIDYA.jpg', 'May 2025', 1),
      ('VIDYA X JCI Edutech', 'In an era shaped by technology and AI, VIDYA has collaborated with JCI Jr. to conduct awareness sessions across Chandragiri Municipality, reaching more than 1,000 students. These sessions provide valuable knowledge about AI, technology, and its practical applications.', 'https://i.ibb.co/qMhPbBsQ/image-025.jpg', 'July 2026', 2),
      ('Opportunity Connect Nepal', 'VIDYA is building an online community for Nepali students where aspiring learners can connect with international delegates and build a strong network to help them prepare for olympiads, hackathons, and competitive exams.', 'https://i.ibb.co/FbzXJ0sF/Screenshot-2026-10-08-185002.png', 'August 2026', 3),
      ('Weekly Olympiad Workshops', 'VIDYA hosts weekly olympiad workshops featuring international participants and medalists as keynote speakers. These sessions cover a wide range of topics, including international mathematics, physics, chemistry, biology, AI, and astronomy olympiads, among others.', 'https://i.ibb.co/35Z3rXkc/image-031.jpg', 'August 2026', 4)
  `);

  try {
    const adminCheck = await db.execute("SELECT COUNT(*) AS count FROM admin_users");
    const count = Number(adminCheck.rows[0]?.count ?? adminCheck.rows[0]?.[0] ?? 0);
    if (count === 0) {
      const bcrypt = require("bcryptjs");
      const hash = await bcrypt.hash("admin1234", 10);
      await db.execute({
        sql: "INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)",
        args: ["admin", hash, Date.now()],
      });
    }
  } catch {
    // ignore if admin exists or error
  }
}

/**
 * Adds missing columns to an existing events table.
 *
 * Safe to run repeatedly.
 */
async function migrateEventsTable() {
  const result = await db.execute(
    "PRAGMA table_info(events)"
  );



  const existingCols = new Set(
    result.rows.map((row: any) => String(row.name))
  );

  const newColumns: [string, string][] = [
    ["slug", "TEXT"],
    ["subject", "TEXT NOT NULL DEFAULT ''"],
    ["level", "TEXT NOT NULL DEFAULT ''"],
    ["summary", "TEXT NOT NULL DEFAULT ''"],
    ["details", "TEXT NOT NULL DEFAULT ''"],
    ["eligibility", "TEXT NOT NULL DEFAULT ''"],
    ["syllabus", "TEXT NOT NULL DEFAULT ''"],
    ["held_in", "TEXT NOT NULL DEFAULT ''"],
    ["image_url", "TEXT"],
    ["sort_order", "INTEGER NOT NULL DEFAULT 0"],
  ];

  for (const [name, ddl] of newColumns) {
    if (!existingCols.has(name)) {
      await db.execute(
        `ALTER TABLE events ADD COLUMN ${name} ${ddl}`
      );
    }
  }

  // slug cannot be added with UNIQUE through ALTER TABLE.
  // Backfill existing events first, then create the unique index.
  if (!existingCols.has("slug")) {
    const rows = await db.execute(
      "SELECT id, title FROM events"
    );

    for (const row of rows.rows) {
      const id = Number(row.id);
      const title = String(row.title ?? "");

      const slug =
        title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") + `-${id}`;

      await db.execute({
        sql: `
          UPDATE events
          SET slug = ?
          WHERE id = ?
        `,
        args: [slug, id],
      });
    }

    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS events_slug_idx
      ON events(slug)
    `);
  }
}


async function migrateTimelineTable() {
  const result = await db.execute("PRAGMA table_info(timeline_items)");
  const existingCols = new Set(result.rows.map((r: any) => String(r.name)));
  if (!existingCols.has("image_url")) {
    await db.execute(`ALTER TABLE timeline_items ADD COLUMN image_url TEXT`);
  }
}

async function migrateNoticesTable() {
  const result = await db.execute("PRAGMA table_info(notices)");
  const existingCols = new Set(result.rows.map((r: any) => String(r.name || r[1])));
  if (existingCols.size > 0) {
    if (!existingCols.has("display_location")) {
      await db.execute(`ALTER TABLE notices ADD COLUMN display_location TEXT DEFAULT 'popup'`);
    }
  }
}

/**
 * Initialize schema before the database client is exported.
 *
 * Top-level await ensures that routes importing this module
 * don't start querying before the tables exist.
 */
await initializeDatabase();
await migrateEventsTable();
await migrateTimelineTable();
await migrateNoticesTable();

export { db };
export default db;