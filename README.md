# Togetherly

A private space for long-distance couples: one photo, one mood, one line a day.

**Current status: the whole app is built and interactive, and it runs entirely on mock data.**
The database schema exists as reviewed migration files that were **written and statically validated
but never applied** — no Supabase project is connected, no query executes, and no Row Level Security
policy exists yet. `src/lib/supabase.js` only constructs a client when both env vars are present, so
the app behaves identically with or without credentials.

## Stack

React 18 · Vite 8 · Tailwind CSS v4 · React Router 7 · Lucide · Supabase JS (installed, not yet called) · oxlint

Tailwind v4 is configured entirely in `src/index.css` through `@theme` — there is no
`tailwind.config.js` or PostCSS file. The botanical palette (sand, ink, rose, sage, butter, cream) and
the Fraunces + Manrope type scale are defined there as design tokens; `DESIGN_SYSTEM.md` documents
them and `WIREFRAMES.md` documents every screen.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

Auth is mocked: any valid email plus a 6+ character password signs you into the demo space, and the
session persists in `localStorage`. Every couple, update, reaction and notification on screen is
sample data from `src/lib/mockData.js` — there are no real users and no server.

## Structure

```
src/
  lib/          dates, moods, reactions, mock data, legal copy, post-auth
                redirect rule, Supabase guard
  context/      AuthProvider + DataProvider (the only place data is mutated)
  components/   layout/ · ui/ · updates/ · memories/ · couple/
  pages/        Landing · Legal · auth/ (Login, SignUp, ForgotPassword)
                Dashboard · NewUpdate · Memories · Connect · Profile · Settings
supabase/
  migrations/   five SQL files: ten tables, indexes, constraints, two helpers
```

Screens never talk to `mockData.js` directly — they read through `useData()`. That is what lets the
backend phases replace the provider internals with queries without touching a single component.

## Documentation

| File | What it holds |
| --- | --- |
| `DESIGN_SYSTEM.md` | Palette tokens, type scale, spacing, component styling rules |
| `USER_FLOW.md` | Journey from landing to a connected couple space |
| `WIREFRAMES.md` | Every screen, labelled, at desktop and mobile widths |
| `COMPONENT_ARCHITECTURE.md` | Component tree, props, ownership of state |
| `BACKEND_ARCHITECTURE.md` | The authoritative schema, authorisation and phase specification |
| `DATABASE_MIGRATIONS.md` | Migration-by-migration explanation of what was written and why |

## Preparing for Supabase

```bash
cp .env.example .env.local   # then fill in the project URL + publishable key
```

`.env.local` is git-ignored and `.env.example` ships with both values empty. `src/lib/supabase.js`
exports `isSupabaseConfigured`; when both variables are present it creates a real client and
`AuthProvider` starts trusting `onAuthStateChange` instead of `localStorage`. Only the publishable
(anon) key belongs in a `VITE_` variable — the `service_role` key must never reach the browser.

The migrations in `supabase/migrations/` are **not applied to anything**. They were authored against
`BACKEND_ARCHITECTURE.md` and checked statically — by parsing, since no Postgres, `psql` or Supabase
CLI is available in the environment they were written in. Row Level Security is deliberately absent:
each table has `enable row level security` with zero policies, which is the fail-closed state, and the
policies themselves are the next phase.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project setup, design system, all pages and components on mock data | Done |
| 2 | Supabase auth, database schema, partner invitations | In progress |
| 3 | Storage uploads, real updates, reactions, memories from the DB | Not started |
| 4 | Realtime, notifications, meeting countdown enhancements | Not started |

Phase 2 is split into reviewed slices, tracked in `BACKEND_ARCHITECTURE.md` §10:

| Slice | Scope | Status |
| --- | --- | --- |
| 3B-0 | Remove direct mock-identity imports from pages, add the Dashboard loading branch | Shipped |
| 3B-1 | The five migration files: ten tables, indexes, constraints, two authorisation helpers | Written, statically validated, **not executed** |
| 3B-2 | All Row Level Security policies | Not started |
| 3C–3H | Auth wiring, invitations, storage, reactions, realtime, preferences, retiring mock data | Not started |

An optional AI weekly couple recap is planned behind a consent toggle. It is deliberately absent
here — the switch is off by default in Settings, no recap is generated, and no AI API is integrated.
The preview dialog shows what one would look like, written from the sample data already on screen.
