-- ============================================================================
-- Togetherly — migration 4 of 5: per-person settings and planned visits
-- Stage 3B-1 · specification: BACKEND_ARCHITECTURE.md §2.9, §2.10
--
-- Creates: user_preferences, scheduled_meetings
--
-- One of these tables is private to a single person and the other is shared by
-- the couple. That distinction is the reason they are separate tables, and 3B-2
-- encodes it: user_preferences is keyed to auth.uid() and never to a partnership,
-- so your partner sees neither your timezone nor your toggles.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- user_preferences (§2.9) — one row per user, keyed by that user
-- ---------------------------------------------------------------------------
-- Keying the primary key to the user means a missing row is the only possible
-- default, so nothing has to invent one at read time. Every default below is
-- copied from Settings.jsx's current initial state, so the first real load looks
-- identical to today.

create table public.user_preferences (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  daily_reminder     boolean not null default true,
  -- A time, not an interval: it is a wall-clock hour in the zone below. The app
  -- restricts it to the four REMINDER_TIMES options; the database deliberately
  -- does not, because adding an option should not need a migration.
  reminder_time      time not null default '21:00',
  -- IANA name — 'Asia/Kolkata', 'Europe/London' — seeded once from
  -- Intl.DateTimeFormat().resolvedOptions().timeZone at bootstrap (§4.1 step 4)
  -- and editable afterwards. 'UTC' is only the fallback if inference failed.
  --
  -- A named zone plus timestamptz is exactly the combination that survives a
  -- clock change; storing an offset like '+05:30' would not.
  --
  -- This CHECK is a SHAPE guard, not an existence guard: it accepts nonsense like
  -- 'Not/AZone'. Real validation is one line in the client, where Intl throws
  -- RangeError on an unknown zone. A DB-side existence check against
  -- pg_timezone_names is possible but buys little, since nothing but this app
  -- writes the column.
  timezone           text not null default 'UTC'
                       check (timezone ~ '^[A-Za-z0-9_+/-]{1,64}$'),
  quiet_hours        boolean not null default false,
  partner_checkins   boolean not null default true,
  reaction_sounds    boolean not null default true,
  milestones         boolean not null default true,
  -- The switch exists in the UI and is labelled Beta; no recap is generated and NO
  -- AI API is connected. This column is a consent flag with nothing behind it,
  -- which is the honest way to ship a consent toggle ahead of the feature.
  weekly_recap       boolean not null default false,
  updated_at         timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- scheduled_meetings (§2.10) — the plan behind the countdown
-- ---------------------------------------------------------------------------
-- The brief asks for this table and today there is one scalar
-- (couple.nextMeeting), so this is a shape change rather than a rename. A couple
-- plans more than one future visit, and the row that is not yet planned costs
-- nothing to reserve.

create table public.scheduled_meetings (
  id              uuid primary key default gen_random_uuid(),
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  -- A full timestamp, not a date: CountdownCard already displays hours, minutes
  -- and seconds, so a date would break the existing UI.
  starts_at       timestamptz not null,
  label           text check (label is null or char_length(btrim(label)) <= 80),
  -- Set null rather than cascade: cancelling a visit because someone deleted their
  -- account is not the same as the visit having been cancelled.
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  -- Soft cancel, not a delete: "when are we next meeting" must never resurrect a
  -- cancelled plan, and the record of the plan is worth keeping.
  cancelled_at    timestamptz
);

-- CountdownCard needs "the next one", which is
--   … and starts_at > now() and cancelled_at is null order by starts_at limit 1
-- and this partial index serves exactly that predicate.
create index meetings_next_idx on public.scheduled_meetings (partnership_id, starts_at)
  where cancelled_at is null;

-- No data backfill here. §2.10 describes migrating the current couple.nextMeeting
-- value into one row, but that value lives in mockData.js and no database has
-- ever held it, so there is nothing to carry across. The frontend contract keeps
-- `couple.nextMeeting` (§7.2) and the provider will populate it from this table in
-- Stage 3G.


-- ---------------------------------------------------------------------------
-- Row Level Security — see the note in migration 1
-- ---------------------------------------------------------------------------
-- Enabled now, policies in Stage 3B-2. For user_preferences the eventual policy
-- set is deliberately NOT partnership-scoped (§3.2), which is what makes D5's
-- "your settings are yours" true.

alter table public.user_preferences   enable row level security;
alter table public.scheduled_meetings enable row level security;
