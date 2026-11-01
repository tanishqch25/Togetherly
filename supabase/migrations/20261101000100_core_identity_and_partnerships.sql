-- ============================================================================
-- Togetherly — migration 1 of 5: identity and the couple space
-- Stage 3B-1 · specification: BACKEND_ARCHITECTURE.md §2.1, §2.2, §2.3
--
-- Creates: profiles, partnerships, partnership_members
--
-- This file holds the two rules the whole product rests on:
--
--   1. A couple space holds AT MOST two people — check (slot in (1,2)) plus the
--      partial unique index members_active_slot_idx.
--   2. A space is VALID with only one person in it — nothing in this file
--      requires a second row. "Connected" is a count of open rows read at query
--      time, never a stored flag (§2.2).
--
-- Ceiling and completion are different objects, and the schema keeps them
-- apart on purpose: one is a constraint that cannot be raced, the other is
-- derived state that cannot go stale.
--
-- No extensions are used. gen_random_uuid() is core PostgreSQL (since v13) and
-- Supabase runs 15+, so pgcrypto is not needed.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- profiles (§2.1) — one row per authenticated user
-- ---------------------------------------------------------------------------
-- Created by a trigger on auth.users in stage 3C, never by the client. This is
-- a pure display-identity table: no role column (there is no admin inside a
-- couple), no timezone column (a timezone is a setting, so it lives in
-- user_preferences, §2.9) and no initials column (it is derived from
-- display_name, because a stored copy can only drift from the name).
--
-- Every column here is self-editable and nothing else (D2).

create table public.profiles (
  -- The cascade from auth.users is what deletes this row when an account is
  -- removed. §2.6 explains why updates REFUSES to follow that cascade, which is
  -- what stops an account deletion erasing a partner's shared history.
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(btrim(display_name)) between 1 and 40),
  nickname      text check (nickname is null or char_length(btrim(nickname)) <= 40),
  -- Free text, matching today's "Mumbai, India". Nothing may parse a timezone
  -- out of this value — it is a caption the user types about where they are.
  city          text check (city is null or char_length(btrim(city)) <= 80),
  -- A storage object path, never a URL (§6.2). The avatars bucket is private,
  -- so this string is useless to anyone who obtains it.
  avatar_path   text,
  created_at    timestamptz not null default now(),
  -- No trigger maintains this. The spec (§2.1) does not define one, so the
  -- provider sets it in the same update that changes the row (stage 3G).
  updated_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- partnerships (§2.2) — the couple space itself
-- ---------------------------------------------------------------------------
-- One row per space. It exists from the moment a signed-up user bootstraps, so
-- the "create space → invite partner" flow has something to attach an
-- invitation to while only one person is in it.
--
-- There is deliberately NO status column and NO connected_at column. Whether a
-- space is connected is fully determined by how many ACTIVE rows
-- partnership_members holds for it. A stored flag would be a second source of
-- truth that can disagree with the first, and — with membership history living
-- in the same table — it would have to be re-derived correctly on every unlink
-- and re-link.

create table public.partnerships (
  id              uuid primary key default gen_random_uuid(),
  -- Profile edits this; it is the "since" date behind the days-together counter.
  anniversary     date,
  -- Display-only free text, e.g. 'IST ↔ GMT' — exactly what the UI stores today.
  -- The real IANA zones live in user_preferences (§2.9). This is a caption, not
  -- a value anything computes from.
  timezone_label  text,
  -- Provenance only. It grants no power: no policy, and no feature, may treat
  -- the creator as an owner (§3.2, §2.3 "slot grants nothing").
  -- On delete set null, not cascade: deleting a person must not delete the
  -- space or the other person's history inside it.
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- partnership_members (§2.3) — the ceiling, the history, and the one-active rule
-- ---------------------------------------------------------------------------
-- One row per seat-occupancy episode. A row with left_at null is a person
-- currently in the space; a row with left_at set is a permanent record of a
-- person who was in it. Both live in this one table, which is what makes
-- "one space at a time", "history preserved" and "unlink deletes nothing" three
-- compatible requirements instead of three arguments.

create table public.partnership_members (
  -- The primary key is the table's own id, NOT (partnership_id, slot). That was
  -- the previous draft, and it is wrong once rows survive unlinking: when the
  -- slot-2 partner leaves and a new partner is invited, the new row also wants
  -- slot = 2, and a composite key would reject the couple's next relationship as
  -- a duplicate of the last one. Seats are reusable; closed rows are records,
  -- not occupants. The open rows are keyed by a partial unique index instead.
  id              uuid primary key default gen_random_uuid(),
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  -- The seat in the couple. Two legal values means there is no seat 3, so a
  -- third member is not detected — it is unrepresentable. A seat, not a role:
  -- nothing grants slot 1 extra rights, and because seats are reused after a
  -- departure, slot 1 is not "the founder" in any authoritative sense.
  slot            smallint not null check (slot in (1, 2)),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  joined_at       timestamptz not null default now(),
  -- null = currently a member. Set = historical row, kept forever.
  left_at         timestamptz,
  -- Why the seat emptied. Required whenever left_at is, so an accidental
  -- `update … set left_at = now()` is rejected rather than silently creating
  -- history nobody can interpret.
  left_reason     text check (left_reason in ('unlinked_by_self')),
  -- Audit only: who brought this person in. Grants nothing.
  invited_by      uuid references public.profiles (id) on delete set null,

  -- A row is open, or it is closed and says why; never one without the other.
  check ((left_at is null and left_reason is null)
      or (left_at is not null and left_reason is not null))
);

-- THE CEILING (§2.3.3): at most one OPEN row per partnership per slot, and there
-- are only two slots. This is what enforces "maximum two members", and it is
-- checked by the same btree-uniqueness machinery as a primary key — the where
-- predicate only decides which rows participate, not how strictly they are
-- enforced. Two simultaneous inserts into the same vacant seat resolve to one
-- winner and one 23505, so there is no count to race on and no window in which
-- both transactions see "only one member so far".
--
-- The obvious alternative — a trigger that counts and raises — is weaker: two
-- concurrent inserts both count 1, both pass, and you have three members.
create unique index members_active_slot_idx
  on public.partnership_members (partnership_id, slot)
  where left_at is null;

-- ONE OPEN SPACE PER PERSON (D1). Note the predicate: this is what replaced a
-- permanent unique (user_id), which said "this person appears once, ever" and
-- therefore forced unlinking to DELETE the row — the irreversible action D3
-- refuses. History and the one-at-a-time rule coexist only because this index
-- counts open rows.
create unique index members_active_user_idx
  on public.partnership_members (user_id)
  where left_at is null;

-- Serves current_partnership() (§3.1) and every "who is in this space now" read.
create index members_partnership_active_idx
  on public.partnership_members (partnership_id) where left_at is null;

-- History reads: "how long were you together", "who was this space".
create index members_history_idx
  on public.partnership_members (user_id, joined_at desc);


-- ---------------------------------------------------------------------------
-- Row Level Security: enabled here, policies deliberately absent
-- ---------------------------------------------------------------------------
-- Enabling RLS is not a policy, and it belongs in this file rather than 3B-2 for
-- one reason: Supabase's default privileges grant anon and authenticated on
-- every new table in the public schema, so a table created here and left
-- RLS-disabled until 3B-2 is applied would be world-readable through the
-- publishable key in the interim. Enabled with zero policies denies everything,
-- which is the safe interim state and fails closed rather than open.
--
-- The policies themselves are Stage 3B-2 (§3.2). Nothing in this migration
-- grants a client access to anything.

alter table public.profiles            enable row level security;
alter table public.partnerships        enable row level security;
alter table public.partnership_members enable row level security;
