// Requires `npm run build` unless --dev is passed. Starts a server on a free loopback
// port with a disposable database. It never contacts the configured Turso DB.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { checkBlogBrowser } from "./blog-browser.mjs";
import { blogCheckConfig } from "./blog-check-config.mjs";

const require = createRequire(import.meta.url);
const development = process.argv.includes("--dev");
const temporaryRoot = resolve(tmpdir());
const directory = mkdtempSync(join(temporaryRoot, "vidya-blog-smoke-"));
const databasePath = join(directory, "smoke.db");
const username = "smoke-editor";
const password = randomBytes(18).toString("hex");
const sqlite = new DatabaseSync(databasePath);
sqlite.exec(
  "CREATE TABLE admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL)",
);
sqlite
  .prepare(
    "INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)",
  )
  .run(username, await bcrypt.hash(password, 10), Date.now());
sqlite.close();
const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const port = socket.address().port;
await new Promise((done) => socket.close(done));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    development ? "dev" : "start",
    ...(development ? ["--webpack"] : []),
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: process.cwd(),
    windowsHide: true,
    env: {
      ...process.env,
      ...blogCheckConfig(
        directory,
        development
          ? ".next/blog-development-check"
          : existsSync(".next/blog-production-check/BUILD_ID")
            ? ".next/blog-production-check"
            : ".next",
      ),
      NODE_ENV: development ? "development" : "production",
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      VIDYA_DATABASE_PATH: databasePath,
      SITE_URL: origin,
      SESSION_SECRET: randomBytes(32).toString("hex"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverLog = "";
child.stdout.on("data", (chunk) => {
  serverLog = (serverLog + chunk.toString()).slice(-6000);
});
child.stderr.on("data", (chunk) => {
  serverLog = (serverLog + chunk.toString()).slice(-6000);
});
child.on("error", (error) => {
  serverLog += error.message;
});
let cookie = "";
async function request(
  path,
  { method = "GET", body, authenticated = true, requestOrigin = origin } = {},
) {
  const headers = {};
  // Force blocking metadata so status and canonical tags can be checked as
  // seen by HTML-only crawlers, rather than streamed metadata responses.
  headers["User-Agent"] = "Twitterbot";
  if (authenticated && cookie) headers.Cookie = cookie;
  if (method !== "GET") headers.Origin = requestOrigin;
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  return fetch(`${origin}${path}`, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
}
async function jsonRequest(path, options, expected = 200) {
  const response = await request(path, options);
  const body = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(body)}`);
  return body;
}
async function assertHiddenArticle(slug) {
  const response = await request(`/blog/${slug}`, { authenticated: false });
  // Next's loading boundary can stream the shell before notFound(), returning
  // 200 plus noindex. Assert the actual privacy/SEO contract in either mode.
  assert.ok([200, 404].includes(response.status));
  const html = await response.text();
  assert.ok(html.includes("Article not found"));
  assert.ok(html.includes('name="robots" content="noindex"'));
  assert.ok(!html.includes("Start with curiosity"));
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited: ${serverLog}`);
    try {
      const response = await request("/admin/login", { authenticated: false });
      if (response.status === 200) {
        ready = true;
        break;
      }
    } catch {
      /* Server starting. */
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  assert.ok(ready, `Server did not start: ${serverLog}`);
  for (let id = 1; id <= 10; id++) {
    const image = await request(
      `/_next/image?url=${encodeURIComponent(`/assests/team/${id}.webp`)}&w=384&q=75`,
      { authenticated: false },
    );
    assert.equal(image.status, 200, `Team portrait ${id} optimization failed`);
    assert.ok(image.headers.get("content-type")?.startsWith("image/"));
    const metadata = await sharp(
      Buffer.from(await image.arrayBuffer()),
    ).metadata();
    assert.ok(metadata.width > 0);
  }
  assert.equal(
    (await request("/api/admin/blog", { authenticated: false })).status,
    401,
  );
  assert.equal(
    (await request("/api/admin/blog/categories", { authenticated: false }))
      .status,
    401,
  );
  assert.equal(
    (
      await request("/api/admin/blog/media", {
        method: "POST",
        authenticated: false,
      })
    ).status,
    401,
  );
  const login = await request("/api/admin/login", {
    method: "POST",
    body: { username, password },
    authenticated: false,
  });
  assert.equal(login.status, 200);
  const sessionCookie = login.headers.get("set-cookie");
  assert.ok(sessionCookie?.includes("HttpOnly"));
  assert.equal(sessionCookie?.includes("Secure"), !development);
  cookie = sessionCookie.split(";")[0];
  await jsonRequest(
    "/api/admin/blog/categories",
    {
      method: "POST",
      body: { name: "Olympiad Guides", slug: "olympiad-guides" },
      requestOrigin: "https://untrusted.example",
    },
    403,
  );
  await jsonRequest(
    "/api/admin/blog/categories",
    {
      method: "POST",
      body: { name: "Olympiad Guides", slug: "olympiad-guides" },
    },
    201,
  );
  const categories = await jsonRequest("/api/admin/blog/categories");
  const upload = new FormData();
  const image = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: "#16324f" },
  })
    .png()
    .toBuffer();
  upload.set("file", new Blob([image], { type: "image/png" }), "study.png");
  const media = await jsonRequest(
    "/api/admin/blog/media",
    { method: "POST", body: upload },
    201,
  );
  assert.equal(
    (await request(media.url, { authenticated: false })).status,
    404,
  );
  assert.equal((await request(media.url)).status, 200);
  const badUpload = new FormData();
  badUpload.set(
    "file",
    new Blob(["not an image"], { type: "image/png" }),
    "fake.png",
  );
  await jsonRequest(
    "/api/admin/blog/media",
    { method: "POST", body: badUpload },
    400,
  );
  const input = {
    title: "A guide to Olympiad preparation",
    slug: "olympiad-preparation",
    excerpt: "Practical ideas for curious students.",
    author: "VIDYA Editor",
    categoryId: categories[0].id,
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Start with curiosity" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Practice consistently and ask thoughtful questions.",
            },
          ],
        },
        {
          type: "orderedList",
          attrs: { start: 1, type: null },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Build a study routine" }],
                },
              ],
            },
          ],
        },
      ],
    },
    imageId: media.id,
    imageAlt: "A navy study illustration",
    status: "draft",
    featured: true,
    seoTitle: "Olympiad preparation | VIDYA",
    seoDescription: "Practical preparation for Olympiads in Nepal.",
  };
  const post = await jsonRequest(
    "/api/admin/blog",
    { method: "POST", body: input },
    201,
  );
  await assertHiddenArticle(post.slug);
  const preview = await request(`/admin/blog/${post.id}/preview`);
  assert.equal(preview.status, 200);
  assert.ok((await preview.text()).includes("Private preview"));
  assert.ok(
    [302, 307].includes(
      (
        await request(`/admin/blog/${post.id}/preview`, {
          authenticated: false,
        })
      ).status,
    ),
  );
  const published = await jsonRequest(`/api/admin/blog/${post.id}`, {
    method: "PUT",
    body: { ...input, status: "published", version: post.version },
  });
  const article = await request(`/blog/${post.slug}`, { authenticated: false });
  assert.equal(article.status, 200);
  const html = await article.text();
  assert.ok(html.includes("application/ld+json"));
  assert.ok(html.includes("BlogPosting"));
  assert.ok(html.includes(`href="${origin}/blog/${post.slug}"`));
  assert.ok(html.includes('property="og:type" content="article"'));
  assert.ok(html.includes("Start with curiosity"));
  assert.ok(html.includes("Build a study routine"));
  const listing = await request("/blog?q=thoughtful&category=olympiad-guides", {
    authenticated: false,
  });
  assert.equal(listing.status, 200);
  assert.ok((await listing.text()).includes(input.title));
  const publicImage = await request(`${media.url}?w=640`, {
    authenticated: false,
  });
  assert.equal(publicImage.status, 200);
  assert.equal(publicImage.headers.get("content-type"), "image/webp");
  const resized = await sharp(
    Buffer.from(await publicImage.arrayBuffer()),
  ).metadata();
  assert.equal(resized.width, 640);
  const sitemap = await request("/sitemap.xml", { authenticated: false });
  assert.ok((await sitemap.text()).includes(`/blog/${post.slug}`));
  await checkBlogBrowser({ origin, cookie, directory, development });
  await jsonRequest(
    `/api/admin/blog/${post.id}`,
    {
      method: "PUT",
      body: { ...input, status: "published", version: post.version },
    },
    409,
  );
  await jsonRequest(
    `/api/admin/blog/categories/${categories[0].id}`,
    { method: "DELETE" },
    409,
  );
  const draft = await jsonRequest(`/api/admin/blog/${post.id}`, {
    method: "PUT",
    body: { ...input, version: published.version },
  });
  await assertHiddenArticle(post.slug);
  assert.equal(
    (await request(media.url, { authenticated: false })).status,
    404,
  );
  const unpublishedSitemap = await request("/sitemap.xml", {
    authenticated: false,
  });
  assert.ok(!(await unpublishedSitemap.text()).includes(`/blog/${post.slug}`));
  await jsonRequest(`/api/admin/blog/${post.id}`, {
    method: "DELETE",
    body: { version: draft.version },
  });
  await jsonRequest(`/api/admin/blog/categories/${categories[0].id}`, {
    method: "DELETE",
  });
  console.log(
    `Blog ${development ? "development" : "production"} HTTP smoke checks passed: team images, auth, CSRF, uploads, preview, publishing, metadata, search, media variants, sitemap, conflicts, unpublish and deletion.`,
  );
} catch (error) {
  console.error(error);
  console.error("Server output:", serverLog);
  process.exitCode = 1;
} finally {
  const exited =
    child.exitCode !== null ? Promise.resolve() : once(child, "exit");
  if (child.exitCode === null) {
    // next dev launches another Node process on Windows; killing only its
    // wrapper leaves the server and SQLite file open. Stop our own tree.
    if (development && process.platform === "win32") {
      const stopped = spawnSync(
        "taskkill",
        ["/PID", String(child.pid), "/T", "/F"],
        { windowsHide: true, stdio: "ignore" },
      );
      if (stopped.status !== 0 && child.exitCode === null) child.kill();
    } else child.kill();
  }
  await exited;
  if (!resolve(directory).startsWith(`${temporaryRoot}${sep}vidya-blog-smoke-`))
    throw new Error("Invalid smoke directory.");
  rmSync(directory, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}
