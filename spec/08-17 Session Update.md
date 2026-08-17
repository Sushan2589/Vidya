# VIDYA Admin — Session Update

**Date:** August 17, 2026
**Scope:** Timeline feature (public + admin), Turso row-mapping bug fixes, admin responsiveness, sign-in cleanup

---

## Where the project stands

The VIDYA site (public Hero/About/Contact/Olympiads/Resources + a password-protected `/admin` panel) already had working Events and Resources admin CRUD on Turso. This session added the missing **Timeline** feature end-to-end and fixed a data-mapping bug that was silently affecting Events, Resources, and Timeline alike.

---

## 1. Timeline — public + admin, now fully wired

- **New public route:** `app/api/timeline/route.ts` (GET, no auth) — mirrors `app/api/events/route.ts` and `app/api/resources/route.ts`. Feeds the public About page.
- **`components/AboutTimeline.tsx`** — rewritten to fetch from `/api/timeline` instead of a hardcoded `milestones` array. Same visual design (scroll-linked gold line, medallions, alternating left/right layout) kept intact. Added a loading state and hides the section entirely if there are zero entries.
- **Admin CRUD** already existed (`app/admin/(dashboard)/timeline/page.tsx`, `app/api/admin/timeline/route.ts` + `[id]/route.ts`) — confirmed working end-to-end this session.

### `sort_order` behavior (clarified this session)
- Controls display order on the public About page (`ORDER BY sort_order ASC`) — **independent of the free-text `year` field**.
- Whichever entry has the **highest** `sort_order` renders last and gets the gold pulsing "Now" badge in `AboutTimeline.tsx`.
- Admin Timeline page now **auto-suggests the next order number** (`max(sortOrder) + 1`) as a placeholder in the Order field when adding a new entry — leave it blank to auto-place at the end ("latest at bottom"). Typing a number still overrides it for inserting mid-timeline.
- **Known dependency:** this only works if `EMPTY_FORM.sortOrder` is `""`, not `"0"` — confirmed fixed.

---

## 2. Bug fix: Turso row shape (Events, Resources, Timeline admin GET/POST/PUT)

**Root cause:** `db.execute()` behaves differently depending on how it's called:
- `db.execute({ sql, args })` (object form, used for parameterized queries) → rows support named property access reliably.
- `db.execute(\`raw string\`)` (string-only form, used in every GET handler since they take no params) → named access is **not reliable** — returning `result.rows` directly meant `event.id`, `item.id`, etc. came back `undefined`.

**Symptom:** React "Each child in a list should have a unique key prop" warning on `EventsPage` — because `event.id` was `undefined` for every row, so every `<li key={event.id}>` collided.

**Fix applied to all three admin route files** (`admin/events/route.ts`, `admin/resources/route.ts` + `[id]/route.ts`, `admin/timeline/route.ts` + `[id]/route.ts`):
- Added a `toValues(row)` helper that normalizes a row to a real array whether Turso returns an array-like or object-like row (`Array.isArray(row) ? row : Object.values(row)`).
- Added per-route `mapEventRow` / `mapResourceRow` / `mapTimelineRow` functions that build the named JSON object explicitly from `toValues(row)[index]`.
- No `any`, no unsafe casts — typed as `Record<string, unknown> | unknown[]`.
- POST/PUT handlers that return the just-created/updated row now run it through the same mapper before responding.

**Not touched (were already safe):** `api/resources/route.ts` (public) already used index-based mapping — was the reference pattern this fix was extended from. DELETE handlers and the events `[id]/route.ts` PUT (which only returns `{ slug }`, not a full row) needed no changes.

---

## 3. Dashboard count bug

`app/admin/(dashboard)/page.tsx` was calling an `async countOf()` without awaiting it — `card.count` was a `Promise`, not a number, so counts wouldn't render correctly.

**Fix:** `DashboardPage` is now `async`, awaits all three counts via `Promise.all` before building the `cards` array.

---

## 4. Admin responsiveness

`app/admin/(dashboard)/layout.tsx` rebuilt:
- **Mobile (`<md`):** top bar with logo + hamburger toggle → slide-down drawer with nav links. Sidebar fully hidden.
- **Desktop (`md+`):** sidebar restored, nav-only (see below).
- `main` padding scales down on small screens (`px-4 py-6` → `md:px-8 md:py-8`).

Login page (`admin/login/page.tsx`) and dashboard grid (`grid-cols-1 sm:grid-cols-3`) were already responsive — no changes needed there.

**Still open / not yet done:** list rows in Events/Resources/Timeline admin pages (`flex items-start justify-between` with Edit/Delete buttons) may still feel tight on very narrow phones — buttons don't wrap below the text yet. Suggested fix (not yet applied): `flex-col sm:flex-row` on those `<li>` rows.

---

## 5. Sign-out button placement

Original layout had "Sign out" pinned at the bottom of the sidebar nav — required scrolling past nav items to reach as nav grows.

**Fix:** moved Sign out out of the sidebar entirely into a **persistent top bar**:
- Desktop: new top bar above `main`, page label on the left, "Sign out" button top-right — always visible, no scrolling.
- Mobile: Sign out icon button sits directly in the mobile top bar next to the hamburger — reachable in one tap without opening the drawer.

---

## 6. Login whitespace trim

`admin/login/page.tsx` was sending `username`/`password` to `/api/admin/login` exactly as typed, with no trimming — stray leading/trailing whitespace (common with mobile autocomplete or pasted passwords) would silently fail the hash comparison in `lib/auth.ts` with a generic "invalid credentials" error.

**Fix:** trim both fields at submit time only (not on every keystroke, so typing isn't disrupted):
```ts
body: JSON.stringify({
  username: username.trim(),
  password: password.trim(),
}),
```
Note: trimming the password is a deliberate choice here since it's a single controlled admin account (seeded via `scripts/seed-admin.ts`) — would need reconsidering if the panel ever supports multiple self-chosen admin passwords.

---

## Also cleared this session (lint/warnings)

- `react-hooks/exhaustive-deps` on `EventsPage`, `ResourcesPage`, `TimelinePage` — loaders wrapped in `useCallback`, effects list them as deps.
- `react-hooks/set-state-in-effect` on the same three — resolved with a targeted `eslint-disable-next-line` on the loader call site (a data-fetch-in-effect pattern the rule discourages by design; full fix would mean adopting SWR/React Query, judged out of scope for this admin panel's size).
- `TimelinePage`'s suggested-order value is now derived via `useMemo` from `items` directly, instead of being pushed into `form` state from inside the loader (was the original cause of the `set-state-in-effect` warning before the disable-comment approach was chosen).

---

## Not yet built (carried over from earlier handoff, still open)

- Gallery section (same CRUD pattern as Events/Resources/Timeline)
- Real file uploads for Resources (currently external URL only)
- Public Olympiads page (`OlympiadsSection.tsx`) still needs to pull from the `events` table instead of its hardcoded array — Events admin CRUD + public `/api/events` route exist and are ready for this wiring
- Mobile polish on admin list-item action buttons (see §4)
