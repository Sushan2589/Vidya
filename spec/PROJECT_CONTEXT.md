# VIDYA — project context & handoff notes

For an AI or developer picking this up cold. Written after building the
admin panel; covers what the project is, its visual identity, and what
exists so far.

## What this is

**VIDYA** ("Visionary Initiatives for Developing Youth Academics") is a
website for an organization that runs/promotes academic Olympiads for
students in Nepal. Tagline: "Thinkers over Memorizers" / "Where
Curiosity Begins."

Public site has (at least): Home, About (includes a milestones
timeline), Contact, Olympiads, Resources. This handoff is specifically
about the **admin panel** built on top of it — the public pages
themselves aren't included here.

## Tech stack

- **Next.js** (App Router — routes use `app/`, async `params` in
  dynamic API routes, so Next 15+)
- **Bun** as the runtime and package manager (not Node/npm)
- **Tailwind CSS v4** (`@import "tailwindcss"` syntax, `@theme inline`
  token mapping — not the old `tailwind.config.js` approach)
- **shadcn/ui** is set up (`@import "shadcn/tailwind.css"` in
  globals.css) but the admin panel doesn't use its components — plain
  Tailwind utility classes throughout, kept dependency-light
- **motion** (Framer Motion's successor package) used on the public
  Hero section
- **SQLite via `bun:sqlite`**, raw SQL, no ORM (see "Why no ORM" below)
- **jose** for signed session cookies, **zod** for API input validation

## Color scheme & type system

Pulled from `globals.css` and the `Hero.tsx` component (source of
truth — reference those files directly if unsure):

| Token | Value | Used for |
|---|---|---|
| Navy | `#16324F` | primary text, headings, buttons, borders (at low opacity) |
| Navy hover | `#1D3F63` | button hover state |
| Gold | `#C9A227` | accent — underlines, eyebrow text, active-state highlights, focus rings |
| Cream/parchment | `#ddddd6` | page background |
| Off-white card | `#F3F1EA` | card/panel backgrounds, button text-on-navy |
| Sage green | `#8FA88A` | decorative laurel line art only (low opacity) |

Fonts: `--font-serif` (Cormorant) for display headings (`font-serif`
class), sans (Geist) for body/UI text. The admin panel uses serif for
page titles (`h1`) and sans for everything else — matches the public
site's pairing.

The globals.css also defines a full shadcn-style OKLCH theme
(`--background`, `--primary`, `--chart-1..5`, dark mode variants,
etc.) for shadcn components generally, but the brand-specific palette
above (navy/gold/cream) is what's actually used in the Hero and in the
admin panel — treat navy/gold/cream as *the* brand colors, and the
OKLCH shadcn tokens as generic scaffolding underneath it.

Radius scale: `--radius: 0.625rem` base, with `sm/md/lg/xl/2xl/3xl/4xl`
multiples defined in `@theme inline`. Admin panel uses `rounded-lg`
(inputs), `rounded-xl`/`rounded-2xl` (cards), `rounded-full` (buttons,
pill nav).

## What's been built: the admin panel

Password-protected `/admin` section for managing site content that
would otherwise be hardcoded. Single admin user (no multi-user, no
sign-up flow — provisioned via a CLI script).

### Manages
- **Events** — Olympiad dates/events (title, description, date,
  location, registration link)
- **Resources** — downloadable/linked resources (title, description,
  file URL, category)
- **Timeline items** — feeds the milestones timeline on the About page
  (year, title, description, sort order)
- Dashboard home just shows counts of each, links into each section

### Not yet built (mentioned as later work)
- **Gallery** — user said "later" during requirements gathering. Same
  pattern (table + admin CRUD page + API routes) extends directly to
  it when needed.
- **File uploads** — Resources currently store a URL (external link),
  not an uploaded file. If real uploads are wanted, needs local
  storage under `public/uploads` or a provider (S3, etc.) wired in.
- **Public pages are not yet wired to read from these tables** — the
  admin CRUD is live, but Home/About/Resources still need their
  server components updated to query `db` instead of using hardcoded
  content. See the "Wiring the public pages" section of
  `vidya-admin/README.md` for the pattern.

### Architecture decisions worth knowing

**Auth is stateless, not session-table-backed.** Login checks a
bcrypt hash (via `Bun.password`) against the one row in `admin_users`,
then sets an httpOnly cookie containing a **signed JWT** (`jose`,
HS256) — not a session ID that gets looked up in the DB. This was a
deliberate choice: Next.js middleware runs on the **edge runtime**,
which cannot load `bun:sqlite`. A stateless JWT lets `middleware.ts`
verify the cookie without touching the database at all.

This is why auth-related code is split into **two files**:
- `lib/session.ts` — cookie creation/verification only, `jose` +
  `next/headers`, **no DB import**, safe to pull into middleware
- `lib/auth.ts` — the actual password check, imports the DB, **only
  ever called from route handlers**, never from middleware

If you ever see auth behaving strangely after a refactor, check
whether something reintroduced a DB import into a file that
`middleware.ts` transitively imports — that will break in production
even if it works in dev.

**Why no ORM.** Originally built with Drizzle ORM, then intentionally
ripped out in favor of raw `bun:sqlite` queries at the user's request
— reasoning was that 3–4 small tables in a single-admin site don't
justify the extra dependency and abstraction. `lib/db/index.ts` now
opens the database and runs `CREATE TABLE IF NOT EXISTS` for all
tables on first import (replaces what would've been a migration
step). API routes hand-write SQL with `$namedParam` bindings and
manually alias `snake_case` columns to `camelCase` in `SELECT`
statements (e.g. `registration_link AS registrationLink`) so the
JSON responses match what the React components expect. If someone
wants to reintroduce type safety without a full ORM, `zod` schemas
already exist per-route and could be extended to validate/parse
DB reads too, not just writes.

**Route group for the sidebar shell.** `app/admin/(dashboard)/`
is a route group (parens = doesn't affect the URL) so that
`app/admin/(dashboard)/layout.tsx` — the sidebar/logout shell — wraps
Dashboard/Events/Resources/Timeline, but *not* `/admin/login`, which
needs to render standalone without the authenticated-looking chrome.

### File map

```
lib/
  db/index.ts     bun:sqlite client + inline CREATE TABLE statements
  session.ts       edge-safe: cookie create/verify (jose, no DB)
  auth.ts           DB-backed: password check; re-exports session.ts
scripts/
  seed-admin.ts     bun run scripts/seed-admin.ts <user> <pass>
middleware.ts        guards /admin/* and /api/admin/*
app/
  admin/login/page.tsx
  admin/(dashboard)/layout.tsx     sidebar + logout
  admin/(dashboard)/page.tsx       dashboard (counts)
  admin/(dashboard)/events/page.tsx
  admin/(dashboard)/resources/page.tsx
  admin/(dashboard)/timeline/page.tsx
  api/admin/login/route.ts
  api/admin/logout/route.ts
  api/admin/events/route.ts            GET (list), POST (create)
  api/admin/events/[id]/route.ts       PUT (update), DELETE
  api/admin/resources/...              same shape as events
  api/admin/timeline/...               same shape as events
.env.example        DATABASE_PATH, SESSION_SECRET
README.md            setup instructions (install, seed, run)
```

Full setup/run instructions live in `vidya-admin/README.md` — this
file is context, that one is the how-to.
