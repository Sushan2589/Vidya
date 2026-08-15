# VIDYA — session update (Olympiads + Resources wired to DB)

Companion to the original `PROJECT_CONTEXT.md` handoff doc. That doc
describes the admin panel as it existed after the first build; this
one covers what changed after it — specifically, connecting the
public Olympiads and Resources pages to the database instead of
hardcoded arrays. Read the original doc first for stack/auth/color
context, this one for what's new.

## What changed this session

### 1. Olympiads — full detail model, not just a card grid

The public `OlympiadsSection.tsx` used to render a hardcoded local
array (`slug`, `name`, `subject`, `level`, `summary`, `heldIn`,
optional `image`). It now fetches from the `events` table, which
gained several columns to support a full detail view per olympiad:

- `slug` (unique, auto-generated from title on create, re-generated
  on title change if it collides)
- `subject`, `level` — short tags shown on the card
- `summary` — short card teaser (existing `description` column was
  effectively renamed/repurposed for this role)
- `details` — long-form text shown only in the detail view
- `eligibility`, `syllabus` — stored as **plain newline-separated
  text**, not JSON — admin form is just a textarea, one item per
  line, split into bullet lists on the frontend
- `held_in` — display text like "Held annually, July" (separate from
  the existing exact `date` column, which is now optional)
- `image_url`, `registration_link`, `sort_order` — as named

Clicking a card morphs it into a full-screen detail view using
`motion`'s shared `layoutId` between the card and the overlay (the
card's image/border literally animate into the full-screen
position, rather than a generic modal fading in). This was the
signature interaction we chose since the codebase already leans on
`motion` elsewhere.

The detail overlay is **same-page state** (`openSlug` in
`OlympiadsSection`), not a separate route — so it is not
independently bookmarkable/shareable right now. Flagged as a
possible future change (`/olympiads/[slug]` as a real route) if
that's ever wanted.

### 2. Resources — DB wiring only, no schema change needed

Unlike Olympiads, the Resources admin panel + `api/admin/resources`
routes were **already fully built and wired to the DB** before this
session (`id`, `title`, `description`, `file_url`, `category`,
`created_at`). Only the public page needed work — it was a hardcoded
array with an invented `format` field ("PDF · 12 pages") and a fixed
3-category tab set that don't exist in the schema.

Fixed by:
- Deriving the format label from the file URL's extension instead of
  a stored field (falls back to "Link" for URLs with no recognizable
  extension)
- Making category tabs dynamic — built from whatever distinct
  `category` values actually exist in the data, plus "Uncategorized"
  for null, instead of a hardcoded list
- Making each card a real `<a href={fileUrl}>` — the original had a
  non-functional download button with no `onClick`

### 3. New public API routes

Both are **read-only, unauthenticated, deliberately outside
`/api/admin/*`** so the existing `middleware.ts` guard (which only
matches `/admin/*` and `/api/admin/*`) leaves them open:

- `app/api/events/route.ts` — GET only, feeds the public Olympiads
  page
- `app/api/resources/route.ts` — GET only, feeds the public
  Resources page

The admin CRUD routes (`app/api/admin/events/...`,
`app/api/admin/resources/...`) are unchanged in purpose — still
behind auth, still the only place that can write.

## Gotchas hit this session (worth knowing before touching events/ again)

- **The `events` table already had both `created_at` and `updated_at`
  as `NOT NULL` columns with no default**, which the original handoff
  doc didn't mention. Any raw INSERT/UPDATE against `events` must set
  both explicitly (`datetime('now')`) — they don't auto-populate.
  Worth checking whether `resources` and `timeline` have the same
  pattern before writing raw SQL against them.
- **`next/image` needs `remotePatterns` configured per external
  host.** Since olympiad/resource images come from admin-entered URLs
  (external, arbitrary hosts — IOE, Unsplash, etc.) rather than a
  fixed small set, `next.config.ts` uses a wildcard
  `{ protocol: "https", hostname: "**" }` rather than listing hosts
  one at a time. Reasonable here because the field is only ever
  populated through the authenticated single-admin panel, not a
  public form — revisit this if that ever changes (multiple admins,
  or public submissions).
- Turbopack / Next dev server hot-reload doesn't always pick up
  changes to files that touch `bun:sqlite` or `next.config.ts`
  cleanly — a full restart (`rm -rf .next && bun dev`) resolved a
  couple of "fixed it and it's still failing" moments this session
  that turned out to be stale compiled output, not code bugs.

## Project structure (current)

```
my-bun-app/
├── app/
│   ├── (site)/                    public site route group
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── (dashboard)/           route group — sidebar/logout shell
│   │       ├── layout.tsx
│   │       ├── page.tsx           dashboard (counts)
│   │       ├── events/page.tsx    Olympiads admin CRUD
│   │       ├── resources/page.tsx Resources admin CRUD
│   │       └── timeline/page.tsx  Timeline admin CRUD
│   ├── api/
│   │   ├── admin/
│   │   │   ├── events/
│   │   │   │   ├── route.ts       GET (list), POST (create) — auth required
│   │   │   │   └── [id]/route.ts  PUT, DELETE — auth required
│   │   │   ├── resources/
│   │   │   │   ├── route.ts       GET, POST — auth required
│   │   │   │   └── [id]/route.ts  PUT, DELETE — auth required
│   │   │   ├── timeline/          same shape as events/resources
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── events/route.ts        NEW — public GET, no auth
│   │   └── resources/route.ts     NEW — public GET, no auth
│   ├── favicon.ico
│   ├── globals.css                brand tokens + shadcn OKLCH theme
│   └── layout.tsx
├── components/
│   ├── OlympiadsSection.tsx       public — fetches /api/events, card + detail overlay
│   ├── ResourcesSection.tsx       public — fetches /api/resources, dynamic categories
│   └── ...                        Hero, About, Contact, etc. (unchanged)
├── lib/
│   ├── db/index.ts                bun:sqlite client, CREATE TABLE + migration helpers
│   ├── session.ts                 edge-safe: cookie create/verify (jose, no DB import)
│   ├── auth.ts                    DB-backed password check, route-handler only
│   └── validations/
│       └── event.ts               zod schema + slugify() for events
├── scripts/
│   └── seed-admin.ts              bun run scripts/seed-admin.ts <user> <pass>
├── spec/                          (present in project, not yet covered in handoff docs)
├── middleware.ts                  guards /admin/* and /api/admin/*
├── next.config.ts                 images.remotePatterns (wildcard https host)
└── .env                           DATABASE_PATH, SESSION_SECRET
```

## Not yet built (carried over from original handoff, still true)

- Gallery section (same CRUD pattern as Events/Resources/Timeline)
- Real file uploads (Resources/Olympiad images currently store an
  external URL, not an uploaded file)
- Shareable/bookmarkable URLs for individual olympiad detail views
  (currently same-page overlay state only)
- Timeline page — admin CRUD exists per original handoff, public
  About page wiring not covered in this session
