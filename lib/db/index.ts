/// <reference types="bun" />
import { Database } from "bun:sqlite";

// One file-backed SQLite DB. Bun's built-in driver — no package to install,
// no native compilation step.
const db = new Database(process.env.DATABASE_PATH || "vidya.db");
db.exec("PRAGMA journal_mode = WAL;");

// Runs once per process start. CREATE TABLE IF NOT EXISTS makes this safe
// to run every time — first run creates the tables, every run after that
// is a no-op. This replaces the old `drizzle-kit push` migration step.
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

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
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    category TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timeline_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
`);


function migrateEventsTable(db: Database) {
  const existingCols = new Set(
    (db.query(`PRAGMA table_info(events)`).all() as { name: string }[]).map(
      (c) => c.name
    )
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
      db.run(`ALTER TABLE events ADD COLUMN ${name} ${ddl}`);
    }
  }
 
  // slug can't carry a UNIQUE constraint via ALTER TABLE ADD COLUMN, so
  // backfill any existing rows first, then add the unique index separately.
  if (!existingCols.has("slug")) {
    const rows = db.query(`SELECT id, title FROM events`).all() as {
      id: number;
      title: string;
    }[];
    for (const row of rows) {
      const slug =
        row.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") + `-${row.id}`;
      db.run(`UPDATE events SET slug = $slug WHERE id = $id`, {
        $slug: slug,
        $id: row.id,
      });
    }
    db.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS events_slug_idx ON events(slug)`
    );
  }
}
 
migrateEventsTable(db);

export default db;
