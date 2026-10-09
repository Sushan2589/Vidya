# VIDYA blog implementation and operations

## What is implemented

- `/blog`: database-backed article cards, URL-based search/category filters, nine articles per page, and loading/empty/error states. The listing starts directly at “Explore the journal.”
- `/blog/[slug]`: server-rendered published articles, author/date/reading time, responsive images, controlled rich-content rendering, sharing and related articles.
- `/admin/blog`: authenticated article management; `/new`, `/[id]/edit`, `/[id]/preview`, and `/categories` support drafts, publishing/unpublishing, deletion, categories, SEO fields and previews.
- The Tiptap editor supports headings, paragraphs, formatting, lists, quotes, code, links and inline image uploads. Unsaved previews use the same article renderer without publishing or saving automatically.
- Canonical/Open Graph/Twitter metadata, escaped BlogPosting JSON-LD, `/sitemap.xml`, and `/robots.txt`. Drafts are omitted from public queries and the sitemap. Next.js may stream a 200 shell for a missing article; its not-found response contains `noindex` and no draft content.
- Existing public navigation and admin sidebar link to the blog. Existing VIDYA typography, colors, spacing and layouts are preserved.

## Data and migrations

Three additive tables and two indexes are defined in `lib/db/index.ts`:

- `blog_categories`: unique names and slugs.
- `blog_posts`: unique slug; excerpt; validated content JSON; derived searchable text, inline image references and reading time; author/category/image; draft/published status; featured flag; SEO fields; timestamps; optimistic edit version.
- `blog_media`: random image ID, WebP data stored as base64, dimensions and creation time.
- Public ordering and category/status indexes support listing queries.

These definitions execute through the existing import-time database initialization. There is no separate migration command. No existing content tables are removed or rewritten. Back up the deployment database before rollout. Verification uses isolated SQLite databases and does not run against Turso or the developer's default database.

The local adapter now enables foreign keys and a busy timeout to protect references and support concurrent Next.js initialization. New blog SQL uses unique column aliases and handles both `changes` and `rowsAffected`. Existing event-schema/adapter debt outside the blog is not repaired by this feature.

## Configuration and security

- `SITE_URL`: required in production; the public origin, e.g. `https://your-domain.example`, without paths or query strings. Used for canonical URLs, metadata, sitemap and mutation origin checks. Development defaults to `http://localhost:3000`.
- `SESSION_SECRET`: production now requires at least 32 characters. Use a strong random secret; changing it invalidates current sessions. JWT cookie behavior and the existing authentication provider remain unchanged.
- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`: unchanged. Configure both for Turso; otherwise the existing Node SQLite fallback applies.
- `VIDYA_DATABASE_PATH`: optional local database path; defaults to `vidya_local.db`. Verification scripts set their own disposable path and explicitly clear Turso configuration.

Use a Node runtime supporting `node:sqlite`; checks were performed with Node 22.14.0. No environment secret values are included in source documentation. Public SEO requires the actual deployment origin, not a development placeholder.

Every new admin handler checks the signed session and confirms the admin account still exists. Mutations require a matching Origin and reject cross-site requests. Input is validated with Zod, bodies are size-limited, values use parameterized SQL, and stale article writes return 409 rather than overwriting another editor's work. Categories in use cannot be deleted.

Production no longer auto-provisions the hardcoded development admin. Provision a real admin using the team's existing account process before deployment; rotate any previously provisioned default credentials. This change does not automatically reset existing accounts.

## Image storage and rich content

No upload provider existed. Images use the existing database. With Turso they persist across server instances without introducing another service. The SQLite fallback requires a persistent disk and a suitable single-host deployment; do not use ephemeral local storage for production content. Authenticated uploads accept static JPEG/PNG/WebP up to 5 MB and 16 million input pixels, re-encode to WebP, remove metadata, resize to at most 1600 pixels, and cap stored output at 2 MB. SVG and invalid images are rejected.

The media endpoint checks publication or authentication for every request and serves responsive width variants through a custom Next Image loader. Draft/unused uploads are private, and media responses are not publicly cached, so unpublishing does not leave an application cache serving private images. Previously downloaded public images cannot be recalled.

Rich content is stored as bounded, allowlisted JSON, not arbitrary HTML. Public rendering uses React elements; links allow http/https/mailto only, and image nodes reference validated uploaded media. Reading time is derived at 200 words per minute.

Deleting a post does not automatically delete its images; media can be reused and destructive cleanup is intentionally avoided. Monitor database size. A high-volume media library would warrant moving media behind a dedicated storage adapter/CDN, retaining the same blog model and authentication.

## Admin workflow follow-up

The editor now separates writing, cover image and article details. A persistent
toolbar shows private/public visibility, saved time or unsaved changes, and
save/preview/review actions. Drafts can be saved without content, introduction
or images once a title, author and category are provided. Categories can be
created and selected inline. Optional URL/SEO and inline-link/image tools are
collapsed. Publication has an explicit checklist and confirmation action;
drafts are never published from the article list with a single toggle. List
filters separate drafts and published articles, and unpublishing asks for
confirmation. Image sizing/crop controls remain future work.

Create/update responses are built from the acknowledged write rather than
fetching the article again after committing. A second remote read failure can
therefore no longer turn a successful save into an apparent failure. Connection
loss during the write itself remains uncertain; the UI preserves edits and asks
the editor to check the list before retrying. Failed cover previews have a retry
action and do not change saved article data. Admin media reads avoid redundant
publication checks. A failed remote-storage connection receives a 503 response.

Missing responsive `sizes` on Olympiad cards and overlays were corrected. These
warnings are separate from upstream image-host timeouts. The feature does not
rewrite database image URLs or promise external host/Turso availability. The
reported approximate “key not found” error could not be uniquely identified
without the full message; validation and persisted-save responses are covered
by the regression checks.

Verification output now uses `.next/blog-production-check` and
`.next/blog-development-check`, with a disposable TypeScript configuration.
The isolated checks use Next's supported Webpack mode: this Next/Turbopack
version failed to resolve its synthetic Sharp package alias under a custom
output directory. Ordinary development/build commands still use their existing
defaults. Default-output Turbopack behavior is not established by the isolated
Webpack verification.
`VIDYA_CHECK_DIST_DIR` and `VIDYA_CHECK_TSCONFIG` are optional check-script
overrides; ordinary dev/build commands keep the existing defaults. Production
smoke checks prefer the isolated build when present. No application environment
variable or database migration is required for these UX changes.

Follow-up files: `components/blog/admin/BlogEditorForm.tsx`,
`components/blog/admin/BlogAdminList.tsx`, `components/blog/admin/RichTextEditor.tsx`,
`components/blog/admin/api.ts`, `components/blog/BlogImage.tsx`,
`components/OlympiadsSection.tsx`, `lib/blog/repository.ts`, `lib/blog/http.ts`,
`lib/validations/blog.ts`, admin blog list/edit pages, admin blog/category APIs,
public blog media API, `next.config.ts`, `scripts/blog-check-config.mjs`,
`scripts/build-blog-check.mjs`, `scripts/blog-smoke.mjs`,
`scripts/blog-browser.mjs`, `tests/blog.test.ts`, and this document.

Final UX verification passed: six Node regression tests, scoped ESLint,
TypeScript, the isolated Webpack production build, and development/production
HTTP plus browser checks. Browser coverage includes inline category creation,
field errors, incomplete draft save/reopen, repeated save without duplication,
image retry, mobile layout, preview, and reviewed publication. The saved-time
display uses explicit Nepal timezone and 24-hour formatting to avoid
server/browser hydration mismatches. Screenshots were visually inspected.
No shared database was queried or migrated during verification. The earlier
approximate error message and actual Turso connectivity remain unverified.

## Verification commands

| Command                                        | Purpose                                                                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                       | Install from the updated npm lockfile                                                                                                           |
| `npm run dev`                                  | Existing development server                                                                                                                     |
| `npm run build`                                | Existing production build; can initialize the configured DB                                                                                     |
| `npm run build:isolated`                       | Production build with disposable local DB and test signing secret                                                                               |
| `npm run test:blog`                            | Node tests using the existing TypeScript compiler and an isolated DB                                                                            |
| `npm run test:blog:smoke`                      | Requires a build; starts an isolated production server and checks HTTP behavior; uses installed Chrome/Edge for browser coverage when available |
| `npm run lint`                                 | Full repository ESLint; historical errors may remain                                                                                            |
| `npm exec -- tsc --noEmit --incremental false` | TypeScript check after Next has generated its environment/types                                                                                 |

Unit checks cover unsafe rich content, publication validation, reading time, Unicode slugs, images, draft privacy, search/pagination, edit conflicts, category protection, related articles, sitemap data and unpublishing. HTTP checks cover authentication, CSRF, uploads, private previews, public metadata/media, publication and deletion. Browser checks exercise desktop/mobile layouts and real editor → unsaved preview → upload → save draft → publish behavior. They create no permanent sample articles.

Browser screenshots are generated under `.next/blog-browser-check/` and are ignored build artifacts. The browser helper adds no browser automation dependency. Turso integration still requires verification against a team's non-production Turso database; local tests do not establish remote service availability.

Dependency additions are the Tiptap React/ProseMirror/starter/image packages and an explicit current `sharp` dependency for upload processing. No new database, authentication provider or test framework was introduced. Existing dependency advisories and the deprecated middleware convention require a separate dependency/runtime maintenance task; no blanket audit fix or unrelated upgrade is applied.

## Changed-file inventory

Image-loading follow-up: an npm override aligns Next.js's Sharp dependency with
the application's Sharp version. Loading Next's older native Sharp before the
newer blog Sharp reproduced a Windows native-library collision and broken WASM
fallback; using one version prevents this conflict. Existing team portraits now live
under `public/assests/team/` instead of redirecting GitHub page URLs. The smoke
runner checks all ten portraits through Next Image and accepts `--dev` to verify
development uploads as well as production. No dependency downgrade or additional
runtime package is needed.

Image follow-up verification: the isolated production build, TypeScript, focused
lint, five blog test suites, production HTTP/browser checks, and development
HTTP/browser behavior passed. These checks load all ten portraits through Next
Image before uploading and resizing blog media in the same server process.

Initial blog verification: all five blog test suites, the isolated production build (including TypeScript), scoped blog ESLint, production HTTP smoke checks, and Chrome/Edge browser checks passed. Repository-wide lint reports 17 existing errors and four warnings outside the new blog code. After Sharp alignment, the production dependency audit reports 17 remaining advisories requiring separate maintenance. Remote Turso behavior was not tested.

Image follow-up files: `components/TeamSection.tsx`, `package.json`,
`package-lock.json`, `scripts/blog-smoke.mjs`, `scripts/blog-browser.mjs`,
`public/assests/team/{1..10}.webp`, `public/assests/team/README.md`, and this document.

Existing files changed for integration:

- `app/admin/(dashboard)/layout.tsx`
- `app/globals.css`
- `components/Navbar.tsx`
- `components/Footer.tsx`
- `lib/db/index.ts`
- `lib/session.ts`
- `package.json`
- `package-lock.json`

New files:

- `app/(site)/blog/page.tsx`
- `app/(site)/blog/[slug]/page.tsx`
- `app/(site)/blog/loading.tsx`
- `app/(site)/blog/error.tsx`
- `app/(site)/blog/not-found.tsx`
- `app/admin/(dashboard)/blog/layout.tsx`
- `app/admin/(dashboard)/blog/page.tsx`
- `app/admin/(dashboard)/blog/new/page.tsx`
- `app/admin/(dashboard)/blog/[id]/edit/page.tsx`
- `app/admin/(dashboard)/blog/[id]/preview/page.tsx`
- `app/admin/(dashboard)/blog/categories/page.tsx`
- `app/admin/(dashboard)/blog/loading.tsx`
- `app/admin/(dashboard)/blog/error.tsx`
- `app/api/admin/blog/route.ts`
- `app/api/admin/blog/[id]/route.ts`
- `app/api/admin/blog/categories/route.ts`
- `app/api/admin/blog/categories/[id]/route.ts`
- `app/api/admin/blog/media/route.ts`
- `app/api/blog/media/[id]/route.ts`
- `app/sitemap.ts`
- `app/robots.ts`
- `components/blog/ArticleCard.tsx`
- `components/blog/ArticleContent.tsx`
- `components/blog/ArticleView.tsx`
- `components/blog/BlogImage.tsx`
- `components/blog/ShareButtons.tsx`
- `components/blog/admin/BlogAdminList.tsx`
- `components/blog/admin/BlogEditorForm.tsx`
- `components/blog/admin/CategoryManager.tsx`
- `components/blog/admin/RichTextEditor.tsx`
- `components/blog/admin/api.ts`
- `lib/blog/content.ts`
- `lib/blog/forms.ts`
- `lib/blog/http.ts`
- `lib/blog/images.ts`
- `lib/blog/repository.ts`
- `lib/blog/seo.ts`
- `lib/blog/types.ts`
- `lib/validations/blog.ts`
- `scripts/build-blog-check.mjs`
- `scripts/test-blog.mjs`
- `scripts/blog-smoke.mjs`
- `scripts/blog-browser.mjs`
- `tests/blog.test.ts`
- `spec/BLOG.md`

The pre-existing `AGENTS.md` change is preserved and was not modified as part of this implementation. `bun.lock` is left untouched; npm's lockfile remains the current installation source.

### Journal and publishing UX follow-up

The public listing now starts at “Explore the journal”; the oversized introduction and featured-article banner are removed. The featured flag is retained in storage for compatibility.

The editor’s Link toolbar opens dedicated text/URL controls, preserves the selection, supports inserting links without a selection, and accepts Enter to apply or Escape to cancel. Existing text formatting is preserved when linking selected text. The strict content validator accepts Tiptap’s verified nullable link `title` attribute; unsafe URL protocols and unknown attributes remain rejected.

“Review & publish” opens the checklist and current article preview together. “Keep editing” returns to the form, and incomplete articles cannot be published. Browser checks cover manually inserted and pasted HTML links through draft saving and public publication. No new environment variables or schema migrations are required by this follow-up.

### Article image layout

Listing covers are omitted from article views. Inline images default to 75% width. Select an image in the editor and pull its corner to adjust width (25–100%), or drag the image to move it between paragraphs. Nearby controls provide centered or left/right text wrapping, description, caption, and removal. Width and alignment are validated JSON attributes, so no SQL migration is needed. Left/right layouts automatically stack at full width on screens up to 640px. Preview and public articles share the renderer; existing images without layout attributes use the centered default. No canvas or new dependency is introduced.

Files changed for this refinement: `components/blog/ArticleView.tsx`, `components/blog/ArticleContent.tsx`, `components/blog/admin/RichTextEditor.tsx`, `lib/blog/content.ts`, `app/globals.css`, `tests/blog.test.ts`, `scripts/blog-browser.mjs`, and `spec/BLOG.md`.

### Direct image editing (current flow)

Content validation accepts the installed editor's block images inside block quotes and list items. Previously these supported placements failed saving with `Invalid content nesting.` Quotes contain floated images with `display: flow-root`. Regression checks compare the server validator with the editor schema and exercise a quoted image through draft saving and publication. No schema migration or environment changes are required.

Article pages and article previews no longer render the listing cover image. Listing cards and social metadata still use it. The editor now has an Image toolbar button that uploads at the cursor. Select the image and drag its bottom-right handle to resize it; arrow keys on that handle adjust size accessibly. Drag the image itself to move it between paragraphs. Small options directly below the selected image provide left/center/right wrapping, removal, a required accessibility description, and an optional caption. The former separate sizing slider/panel and pre-upload description step are removed. The existing validated JSON layout attributes and publication authorization remain in use; no new dependencies, database migrations, or environment variables are required.

Files changed: `components/blog/ArticleView.tsx`, `components/blog/admin/BlogEditorForm.tsx`, `components/blog/admin/RichTextEditor.tsx`, `components/blog/admin/ArticleImageView.tsx`, `app/globals.css`, `scripts/blog-browser.mjs`, and `spec/BLOG.md`.
