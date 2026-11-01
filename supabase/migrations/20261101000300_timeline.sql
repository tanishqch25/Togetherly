-- ============================================================================
-- Togetherly — migration 3 of 5: the shared timeline
-- Stage 3B-1 · specification: BACKEND_ARCHITECTURE.md §2.6, §2.7, §2.8
--
-- Creates: updates, reactions, notifications
--
-- These are the rows the product is actually for, so the delete behaviour on
-- every foreign key here is a decision rather than a default. The short version:
-- a person leaving (D3) or a person being deleted (D13) must never be able to
-- take the OTHER person's memories with them, and the one cascade that would
-- have done so is the one turned into RESTRICT.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- updates (§2.6) — one published moment
-- ---------------------------------------------------------------------------
create table public.updates (
  id              uuid primary key default gen_random_uuid(),
  -- Denormalised: derivable from the author. Stored anyway because every policy
  -- and every index needs it, and deriving it means a subquery in the hot path of
  -- the one table the app reads constantly.
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  -- ON DELETE RESTRICT — the one place the approved decisions override a Postgres
  -- default, and the most important line in this file (§2.6).
  --
  -- Deleting a user drops their auth.users row, which cascades to profiles, which
  -- would cascade straight through here and silently erase the OTHER person's
  -- history. D3 forbids that outcome and v1 has no account-deletion flow to design
  -- around, so the right setting is the one that fails loudly: the database
  -- refuses, and whoever is holding the console has to choose deliberately.
  -- Because the whole chain is one statement, this restriction also protects the
  -- membership history in partnership_members from the same cascade.
  author_id       uuid not null references public.profiles (id) on delete restrict,
  -- A hard list copied from src/lib/mood.js. THE TWO MUST CHANGE TOGETHER: adding
  -- a mood to the frontend without a migration turns into an insert error. The
  -- drift risk is accepted and tracked in §11.
  mood_id         text not null check (mood_id in
                    ('happy','loved','excited','sad','tired','missing_you','peaceful','stressed')),
  -- 280 characters, matching DailyUpdateForm's own limit. btrim() so a message of
  -- four spaces is not a message.
  message         text not null check (char_length(btrim(message)) between 1 and 280),
  -- A storage object key, never a URL. Today's mock `photo` field holds a path
  -- too, so the shape survives — but how the client turns it into a displayable
  -- image changes (private bucket + 15-minute signed URLs, §6.4).
  photo_path      text,
  created_at      timestamptz not null default now(),
  -- Nullable and unused in v1 (D9: no edit flow). Kept because an audit trail is
  -- cheap to reserve and expensive to backfill once rows already exist.
  edited_at       timestamptz
);

-- The timeline query: one partnership, newest first.
create index updates_partnership_recent_idx on public.updates (partnership_id, created_at desc);
-- "my latest update", and the restrict-on-delete check itself.
create index updates_author_idx on public.updates (author_id);

-- No deleted_at column. D9 defers update deletion; it does not forbid it. The
-- cascades below are already in place, so shipping deletion later costs one
-- column plus one policy — which is the extensibility the brief asked for,
-- without soft-delete plumbing on every index and query for a feature nobody has
-- asked for yet (§2.6).


-- ---------------------------------------------------------------------------
-- reactions (§2.7) — normalised, one row per person per type per update
-- ---------------------------------------------------------------------------
-- Replaces the mock's { reactionId: [userId, …] } map. The map is reconstructible
-- from this with one grouped select, and §7.2 requires the provider to rebuild it
-- so lib/reaction.js keeps working unchanged.

create table public.reactions (
  id              uuid primary key default gen_random_uuid(),
  -- Cascade from the update: a reaction is a gesture attached to a moment, so if
  -- the moment ever goes the gesture goes with it rather than orbiting nothing.
  update_id       uuid not null references public.updates (id) on delete cascade,
  -- Cascade from the profile, deliberately NOT restrict: a person's reaction is
  -- their own gesture rather than a shared record, and letting it go with them
  -- keeps counts honest without rewriting anybody's memories (§2.6).
  user_id         uuid not null references public.profiles (id) on delete cascade,
  -- Copied from src/lib/reaction.js; same change-together rule as mood_id.
  reaction_id     text not null check (reaction_id in
                    ('heart','sparkle','miss','laugh','proud')),
  created_at      timestamptz not null default now(),

  -- The triple that makes toggleReaction idempotent at the storage layer:
  -- toggle-on is an insert that fails 23505 if already present, toggle-off is a
  -- delete that matches zero rows if absent. No read-modify-write, so two taps
  -- from two devices cannot produce a double count.
  --
  -- Note what is NOT in the key: a person may hold SEVERAL reaction types on one
  -- update (the seed's upd-01 has heart and miss from the same user), so this is
  -- not a single-choice field.
  unique (update_id, user_id, reaction_id)
);

-- Serves the grouped select that rebuilds the reaction map for a whole timeline.
create index reactions_update_idx on public.reactions (update_id);


-- ---------------------------------------------------------------------------
-- notifications (§2.8) — each person's own inbox
-- ---------------------------------------------------------------------------
-- Read state belongs to the individual (D5): there is no shared `read` boolean
-- here, and no policy in 3B-2 will make one person's inbox readable by the other.

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  -- Explicit and new relative to the mock, whose list is implicitly "mine".
  recipient_id    uuid not null references public.profiles (id) on delete cascade,
  -- Set null, not cascade: a person deleting their account must not delete the
  -- notification another person received. It becomes a system-styled row, which
  -- the CHECK below already permits.
  actor_id        uuid references public.profiles (id) on delete set null,
  partnership_id  uuid references public.partnerships (id) on delete cascade,
  kind            text not null check (kind in ('reaction','checkin','milestone','connection')),
  -- Cascade from updates so the bell can never deep-link to a moment that is gone.
  update_id       uuid references public.updates (id) on delete cascade,
  -- Left unconstrained on purpose (§2.8): it is a display hint copied from a
  -- reaction row that already validated it. Re-checking it here would let a
  -- notification survive being wrong but not being self-contradictory, which is
  -- the weaker of the two guarantees. Flagged in §11.
  reaction_id     text,
  title           text,
  body            text,
  -- Strictly more information than the mock's boolean `read`, same !read_at test,
  -- and it lets a future "you were away for three days" feature work.
  read_at         timestamptz,
  created_at      timestamptz not null default now(),

  -- A row either has a person behind it or has its own copy. That is exactly the
  -- distinction the UI already draws: reaction/checkin rows are RENDERED from
  -- actor + update, while milestone/connection rows carry title/body.
  check (actor_id is not null or title is not null)
);

-- The badge count and the panel's default query, both over unread rows only.
create index notifications_inbox_idx on public.notifications (recipient_id, created_at desc)
  where read_at is null;
create index notifications_all_idx on public.notifications (recipient_id, created_at desc);

-- Who writes these: not the client. Triggers on updates and reactions create them
-- (§5.3), so a notification cannot be forged or missed and both partners get one
-- without either frontend remembering to send it. Those triggers are Stage 3F —
-- note that they must resolve "the other member" as the other OPEN member, or a
-- departed person keeps receiving a space's notifications and nothing in the
-- schema will complain (§2.3.1, §5.3).


-- ---------------------------------------------------------------------------
-- Row Level Security — see the note in migration 1
-- ---------------------------------------------------------------------------
-- Enabled now with no policies; the policies arrive in Stage 3B-2. The absence of
-- an updates delete policy is the whole of D9, and the absence of any
-- partnership-wide read is the whole of D5 — both are 3B-2's job to make true.

alter table public.updates       enable row level security;
alter table public.reactions     enable row level security;
alter table public.notifications enable row level security;
