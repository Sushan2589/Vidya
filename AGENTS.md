# Vidya Olympiad agent instructions

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 1. Project overview

VIDYA promotes academic Olympiad awareness and opportunities for students in Nepal. This is an existing collaborative project: one Next.js App Router application serves the public website, admin dashboard, and API. Public pages cover Home, About, Contact, Olympiads, and Resources. Events, resources, timeline items, and notices are database-backed; initiatives, team information, media links, and homepage statistics are currently hardcoded. Historical notes in `spec/` and the README can be stale; verify against current code.

## 2. Technology stack

- Frontend: Next.js 16.2.12, React 19.2.4, strict TypeScript.
- Backend: Next.js route handlers; no separate backend framework.
- Runtime: Node.js. Use npm with the matching `package-lock.json`; no `packageManager` field or workspaces are declared. A stale `bun.lock` also exists.
- Database: `@tursodatabase/serverless/compat` for Turso, or a local `node:sqlite` adapter. Raw SQL; no active ORM.
- Authentication/validation: bcryptjs, jose JWTs, Zod.
- Styling/UI: Tailwind CSS v4 through PostCSS, shadcn configuration, Motion, custom Aceternity-style effects, icon libraries, and dnd-kit for timeline ordering.
- Email: EmailJS Node SDK in the contact endpoint.
- Checks: ESLint 9 with Next.js presets. No automated test suite, test runner, or test script is configured.

## 3. Repository structure

- `app/layout.tsx`: root metadata, fonts, global loading screen, and notices.
- `app/(site)/`: public `page.tsx` routes and the Navbar/Footer layout. Route groups do not change URLs.
- `app/admin/login/`: login page. `app/admin/(dashboard)/`: dashboard shell and content-management pages.
- `app/api/`: public `route.ts` endpoints. `app/api/admin/`: protected management endpoints, including `[id]` handlers.
- `components/`: reusable sections and UI; `components/ui/`: shared visual primitives. Reuse these before adding equivalents.
- `lib/db/index.ts`: database adapter, table definitions, and inline migration helpers. Database models currently live as SQL here, not in an ORM models directory.
- `lib/auth.ts`, `lib/session.ts`: credentials and sessions. `lib/validations/`: shared input schemas. `lib/utils.ts`: `cn` utility. Put justified shared server services/utilities under `lib/`, following nearby organization; no separate service framework exists.
- `scripts/seed-admin.ts`: admin provisioning/reset script. `public/assests/`: existing brand assets; preserve the current path spelling.
- `spec/`, `new.md`: requirements and historical context, not authoritative descriptions of current behavior.

## 4. Development commands

Run from the repository root:

| Purpose | Command/status |
| --- | --- |
| Install from npm lockfile | `npm ci` |
| Development | `npm run dev` → `next dev` |
| Production build | `npm run build` → `next build` |
| Production server | `npm start` → `next start` |
| Lint | `npm run lint` → `eslint` |
| Tests | No configured command |
| Dedicated typecheck | No configured script |
| Database migrations | No CLI/script; database imports execute inline initialization/migrations |
| Admin seed/reset | Script exists, but its instructions still use Bun; no verified Node execution command is configured |

Installation is the npm lockfile workflow, not a claim that installation/build has passed in this checkout. On Windows, use `npm.cmd` if PowerShell blocks the npm shim. Never invent missing scripts or use Bun instructions from the README to restore old runtime scripts. Application startup and build evaluation can import database code and write schema/data; account for this before running checks.

## 5. Coding conventions

- Follow nearby TypeScript/JavaScript formatting, naming, imports, and file organization. Use the existing `@/*` root alias where appropriate.
- Prefer readable, maintainable, type-safe code; existing `any` usage is not a reason to add more.
- Reuse components, `cn`, validation schemas, and database/session helpers. Avoid duplicate logic, unnecessary abstractions, and unnecessary dependencies.
- Keep server-only database/credential code out of client components and out of the middleware session import graph.
- Use client components for browser state/effects and interaction; retain server components where existing behavior permits.
- Dynamic API handlers currently await `params: Promise<{ id: string }>`; check the installed Next.js guides before changing framework APIs.

## 6. UI/UX guidelines

Preserve the current visual identity: navy `#16324F`, gold `#C9A227`, cream `#ddddd6`, off-white `#F3F1EA`, Geist body/UI text, and Cormorant Garamond serif headings. Match existing spacing, rounded cards/buttons, responsive layouts, and restrained Motion effects. `app/globals.css` also contains generic shadcn OKLCH tokens; do not assume all brand colors are tokenized.

Reuse established components and patterns rather than redesigning unrelated pages. Ensure keyboard access, meaningful labels, visible focus, appropriate contrast, and responsive behavior. Resources currently link to external URLs; Olympiad details use a same-page overlay, not a dedicated article route.

## 7. Backend and database guidelines

- Follow existing Next.js `GET`/`POST`/`PUT`/`PATCH`/`DELETE` route handlers and `NextResponse.json` responses. Public content GET endpoints are outside `/api/admin`; contact/newsletter accept public POST requests.
- Use Zod for untrusted structured input, parameterized SQL for values, and explicit row-to-JSON mapping. Keep validation failures at 400, unauthorized requests at 401, missing records at 404, and unexpected failures at 500 where applicable. Existing error handling is uneven; do not copy defects blindly.
- Reuse `lib/db/index.ts`. Both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` select Turso; otherwise the adapter opens `vidya_local.db` with WAL, even in production.
- Existing tables: `admin_users`, `events`, `resources`, `timeline_items`, `newsletter_subscribers`, and `notices`.
- Schema creation and additive migration helpers run on module import through top-level await. No migration ledger or versioned migration directory exists. Follow this architecture for focused work; justify any architectural replacement.
- Verify schema and adapter compatibility before changing queries. Event handlers reference `updated_at`, which the checked-in schema/migrations do not create. The local adapter returns `changes`, while some handlers expect `rowsAffected`; local batch operations are sequential and not transactional. Row access varies between numeric and named properties.
- Credential checks use `lib/auth.ts`; cookie/JWT helpers use `lib/session.ts`. Middleware guards `/admin/*` and `/api/admin/*`, with login exceptions. No granular roles/permissions or session revocation store exists.

## 8. Security guidelines

- Never expose or commit secrets, credentials, session tokens, or environment values. Document variable names only: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, and `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PRIVATE_KEY`, `EMAILJS_PUBLIC_KEY`.
- Validate untrusted input and enforce authorization on the server. New protected endpoints must use the established admin protection or an explicit server-side session check; UI visibility is not authorization.
- Preserve bcrypt verification and signed JWT cookie behavior: HTTP-only, SameSite=Lax, Secure in production, seven-day lifetime. Keep session helpers free of database imports for middleware use.
- Existing default-admin provisioning and fallback signing secret are security debt, not recommended practices. Do not reproduce their values in documentation/logs or add new insecure fallbacks.
- Do not perform destructive database operations without explicit approval. Treat provisioning, password resets, and import-triggered database writes as real mutations.

## 9. Collaboration and Git

Assume multiple developers contribute. Inspect status/diffs and preserve unrelated changes; do not overwrite teammates' work. Keep changes focused on the requested task. Do not perform broad refactoring without approval, and do not automatically commit, push, rebase, or reset. Do not remove historical files or alternate lockfiles merely because they appear stale; understand their purpose and the requested scope first.

## 10. Agent workflow

1. Read `AGENTS.md`, inspect relevant files and Git status, and consult installed Next.js guides. If dependencies/docs are unavailable, report the limitation rather than guessing or installing without authorization.
2. Understand current behavior and distinguish verified implementation from historical notes or assumptions.
3. Propose a concise implementation plan for substantial changes.
4. Implement only the scope authorized by the task; request clarification when a material expansion is needed.
5. Run relevant available checks when authorized and safe, considering import-triggered database writes. Do not claim tests exist or checks passed without evidence.
6. Report changed files, check/test results, and unresolved issues or limitations.

## 11. Planned features

Future work, not implemented functionality:

- Admin panel improvements beyond existing event/resource/timeline/notice management.
- Blog management system.
- Public blog listing and article pages.
- Blog publishing workflow.
- Expanded SEO and content management beyond current root metadata and existing content CRUD.

Initiative admin pages/APIs are placeholders, not completed management functionality. Do not implement planned features unless requested.

## 12. Node.js migration notes

- Commit `2b14469` changed dev/build/start scripts from `bun --bun next ...` to direct Next.js commands. Current application code has no active Bun-specific imports or `Bun.*` APIs.
- No application Node version is pinned. The npm lockfile declares Next.js's Node requirement as `>=20.9.0` and shadcn's as `>=20.18.1`; these are dependency requirements, not proof that the local SQLite path works on every such version.
- Inspection observed Node 22.14.0 with `node:sqlite` available and reporting an experimental warning. Use a Node release that supports the required builtin; verify the chosen deployment/runtime before promising compatibility. `@types/node` currently targets 20.x and does not pin runtime.
- `package-lock.json` root dependencies match `package.json`. `bun.lock` is stale, including missing `@emailjs/nodejs` and an older Node types range. No pnpm/Yarn lockfile is present.
- Remaining Bun artifacts include `@types/bun`, the `my-bun-app` package name, `trustedDependencies`/`ignoreScripts` fields, README/seed usage instructions, and historical comments/specs. Do not assume Bun install-policy fields enforce npm behavior.
- Admin seeding still needs a supported Node TypeScript execution workflow. Database adapter/schema mismatches also need validation on both local SQLite and Turso.
- No Dockerfile, CI workflow, automated test configuration, or verified deployment target was found. Do not infer hosting from starter assets or `.gitignore` entries.
