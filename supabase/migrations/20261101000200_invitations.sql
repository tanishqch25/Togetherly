-- ============================================================================
-- Togetherly — migration 2 of 5: invitations and join telemetry
-- Stage 3B-1 · specification: BACKEND_ARCHITECTURE.md §2.4, §2.5
--
-- Creates: invitations, invitation_attempts
--
-- Both tables exist to make one sentence true: the database may know that an
-- invitation exists, and may never hold a live credential. Under D7 the
-- plaintext code is created inside a function, hashed, and returned exactly once
-- — so nothing in this file can be replayed by someone who copies the table.
--
-- The functions that write these rows (issue_invitation, accept_invitation) are
-- Stage 3D. This file only fixes the shape they must fit.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- invitations (§2.5) — hashed, shown once
-- ---------------------------------------------------------------------------
-- A code is a bearer credential to someone's private photographs, so it is
-- stored the way a password is: as a fingerprint.

create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  -- Cascade with the space. Note what this does NOT do: nothing in v1 deletes a
  -- partnership at all (D12), so this cascade is a correctness guarantee for a
  -- path that does not exist yet, not a live data-loss route.
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  -- sha256 of the NORMALISED code — upper() with hyphens and spaces stripped.
  -- Normalisation is part of the hash contract: issuer, redeemer and lookup must
  -- all fold the same way, or a code typed in lowercase simply fails to resolve
  -- and looks like a broken feature rather than a wrong code.
  --
  -- There is deliberately no `code` column: there is nothing to steal at rest,
  -- which is the whole point of D7. There is also no partial-hint column
  -- (nothing like 'TLS••••••7'): an 8-character code over a 32-symbol alphabet is
  -- ~40 bits, and revealing 4 of the 8 characters leaves ~20 bits — about a
  -- million candidates, which an offline attacker treats as a Tuesday. Either
  -- show the code or show none of it (§4.4).
  code_hash       text not null,
  created_by      uuid not null references public.profiles (id) on delete cascade,
  -- 7 days from creation, as the UI already promises.
  expires_at      timestamptz not null,
  -- Single-use proof. Both null and unrevoked = still open.
  redeemed_at     timestamptz,
  -- Set null rather than cascading: a redeemed invitation should keep existing as
  -- evidence that the space was joined, even if the joiner's profile goes away.
  redeemed_by     uuid references public.profiles (id) on delete set null,
  -- Set by rotation (§4.5). Rotation is mandatory inside issue_invitation(), so a
  -- retired predecessor is the EXPECTED reason an honest person's code fails.
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),

  -- Guards the columns, not the application's arithmetic: a zero-length or
  -- backdated validity window is always a bug whoever wrote it.
  check (expires_at > created_at),
  -- A redemption that does not say who redeemed it is not a redemption.
  check (redeemed_at is null or redeemed_by is not null),
  -- A row cannot be both used and retired. If it ever were, the row lock in
  -- §4.2 step 6 had leaked — this makes that loud instead of quiet.
  check (revoked_at is null or redeemed_at is null)
);

-- Two live codes can never collide, so a redeem request resolves to at most one
-- row. It also blocks an attacker who has copied a *hash* from re-using it as a
-- fresh invitation. Not partial: the hash must stay unique against closed rows
-- too, or a retired code could be re-issued as if it were new.
create unique index invitations_hash_unique on public.invitations (code_hash);

-- Partial so "does this partnership have a live invite?" is an index-only lookup.
create index invitations_open_idx on public.invitations (partnership_id)
  where redeemed_at is null and revoked_at is null;


-- ---------------------------------------------------------------------------
-- invitation_attempts (§2.4) — the rate limiting D4 approved
-- ---------------------------------------------------------------------------
-- Server-written security telemetry. It exists so that code redemption can be
-- throttled, and so the product can later ask "is regenerating codes confusing
-- people?". Only the redeem function writes it (Stage 3D); no client ever reads
-- it — see the RLS note at the bottom of this file.

create table public.invitation_attempts (
  id              uuid primary key default gen_random_uuid(),
  attempted_at    timestamptz not null default now(),
  -- sha256(client_ip || current_date::text), truncated, computed by the caller.
  -- Hashed rather than raw because a table of security telemetry that leaks
  -- identities is its own incident. Salting by date still keeps "this address
  -- tried 30 codes this minute" countable, and needs no stored secret.
  ip_key          text not null,
  -- Set null on deletion: the attempt is a fact about the space, not about the
  -- person, and dropping an account must not erase evidence of attacks.
  actor_user_id   uuid references public.profiles (id) on delete set null,
  -- Always a hash, never plaintext — consistent with §2.5. The database holds no
  -- live code, not even in its logs table. Nullable because a throttled attempt
  -- can be refused before any code is looked at.
  code_hash       text,
  partnership_id  uuid references public.partnerships (id) on delete set null,
  -- The full set of outcomes §4.2 can record. Two of these earn a note:
  --   'revoked' is its own value because rotation is mandatory, so a retired code
  --     is a more common reason for failure than a typo;
  --   'unverified_email' is D14's refusal, recorded BEFORE the code is looked up,
  --     so an unverified caller never burns a code_hash match.
  outcome         text not null check (outcome in
                    ('joined','invalid_code','expired','revoked','already_redeemed',
                     'space_full','already_in_a_space','unverified_email','throttled'))
);

-- The two throttling windows (§2.4): per ip_key (>10 failures in 15 min → reject
-- further attempts) and per code_hash (>5 failures in 1 hour → notify the owner,
-- keep accepting).
--
-- Both indexes therefore serve the SOURCE, never the target. This is the rule the
-- table exists to encode: a bad guess is answered against the address that made
-- it. If five wrong guesses disabled an invitation, an attacker could deny an
-- honest couple their one-time join for the price of five requests. Locking is
-- applied to the source, never the target (§2.4).
create index invitation_attempts_ip_idx
  on public.invitation_attempts (ip_key, attempted_at desc);
create index invitation_attempts_code_idx
  on public.invitation_attempts (code_hash, attempted_at desc);


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- See the long note in migration 1: RLS is enabled before any policy exists so
-- that Supabase's default table grants cannot leave these rows readable in the
-- interim. Stage 3B-2 adds the policies for invitations.
--
-- invitation_attempts is the ONE table in the design that is finished here and
-- needs nothing in 3B-2: RLS enabled plus zero policies means the client can
-- neither select nor insert, by construction rather than by convention. Absence
-- beats a policy that says using (false), because there is nothing for someone to
-- "fix" later (§3.2).
--
-- Retention: ~100 bytes per row, unbounded. pg_cron is deferred by D10, so the
-- planned stopgap is the redeem function deleting rows older than 30 days
-- whenever it writes (Stage 3D). Flagged in §11 as an accepted loose end.

alter table public.invitations          enable row level security;
alter table public.invitation_attempts  enable row level security;
