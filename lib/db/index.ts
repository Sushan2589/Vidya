import { createClient } from "@tursodatabase/serverless/compat";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set");
}

if (!authToken) {
  throw new Error("TURSO_AUTH_TOKEN is not set");
}

// Turso/libSQL client.
// Unlike bun:sqlite, this client is asynchronous.
const db = createClient({
  url,
  authToken,
});

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
    ],
    "write"
  );
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
    result.rows.map((row) => String(row.name))
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
  const existingCols = new Set(result.rows.map((r) => String(r.name)));
  if (!existingCols.has("image_url")) {
    await db.execute(`ALTER TABLE timeline_items ADD COLUMN image_url TEXT`);
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

export { db };
export default db;