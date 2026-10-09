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
  const sqlite = new DatabaseSync(process.env.VIDYA_DATABASE_PATH || "vidya_local.db");
  // Next's build/server workers may initialize the same local database together.
  sqlite.exec("PRAGMA busy_timeout = 10000;");
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");

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
      `CREATE TABLE IF NOT EXISTS blog_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE
      )`,
      `CREATE TABLE IF NOT EXISTS blog_media (
        id TEXT PRIMARY KEY,
        data_base64 TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT NOT NULL DEFAULT '',
        content_json TEXT NOT NULL,
        search_text TEXT NOT NULL DEFAULT '',
        media_ids TEXT NOT NULL DEFAULT '|',
        author TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES blog_categories(id),
        image_id TEXT REFERENCES blog_media(id),
        image_alt TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
        featured INTEGER NOT NULL DEFAULT 0,
        reading_minutes INTEGER NOT NULL DEFAULT 1,
        seo_title TEXT NOT NULL DEFAULT '',
        seo_description TEXT NOT NULL DEFAULT '',
        published_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE INDEX IF NOT EXISTS blog_posts_public_idx ON blog_posts(status, published_at DESC, id DESC)`,
      `CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON blog_posts(category_id, status, published_at DESC)`,
      

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
    ],
    "write"
  );

  try {
    const adminCheck = await db.execute("SELECT COUNT(*) AS count FROM admin_users");
    const count = Number(adminCheck.rows[0]?.count ?? adminCheck.rows[0]?.[0] ?? 0);
    if (count === 0 && process.env.NODE_ENV !== "production") {
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
