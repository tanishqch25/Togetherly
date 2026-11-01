# Togetherly — Database Migrations (Stage 3B-1)

**Status: written and statically validated. Not executed.** Five SQL files in
[`supabase/migrations/`](supabase/migrations) implement the approved schema — ten
tables, their keys, constraints and indexes, plus the two authorisation helpers. No Supabase project exists
yet, no credentials were created, no environment file was touched, and nothing has been applied to any
database, local or remote. Every "validated" claim in §8 below means *inspected and checked statically*,
never *run*.

**The specification is [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md).** This
document explains what the migrations do and why; the spec is what decides whether they are right. Where the
two disagree, §8.4 records the one place they do.

**Not in this phase, by design:** Row Level Security *policies* (Stage 3B-2), the profile-creation trigger
and `bootstrap_space()` (3C), the invitation workflow functions (3D), notification fan-out triggers (3F),
storage buckets and policies (§6, 3E), and any React integration whatsoever. Mock data is untouched and the
frontend still runs entirely on `src/lib/mockData.js`.

---

## 1. The five files, in apply order

Files are numbered so that the apply order is obvious from the name and so later stages can append without
renaming anything. The prefix is a `YYYYMMDDHHMMSS` version stamp, which is what the Supabase CLI treats as
the migration's identity.

| # | File | Creates | Spec |
|---|---|---|---|
| 1 | [`20261101000100_core_identity_and_partnerships.sql`](supabase/migrations/20261101000100_core_identity_and_partnerships.sql) | `profiles`, `partnerships`, `partnership_members` | §2.1–§2.3 |
| 2 | [`20261101000200_invitations.sql`](supabase/migrations/20261101000200_invitations.sql) | `invitations`, `invitation_attempts` | §2.4–§2.5 |
| 3 | [`20261101000300_timeline.sql`](supabase/migrations/20261101000300_timeline.sql) | `updates`, `reactions`, `notifications` | §2.6–§2.8 |
| 4 | [`20261101000400_preferences_and_meetings.sql`](supabase/migrations/20261101000400_preferences_and_meetings.sql) | `user_preferences`, `scheduled_meetings` | §2.9–§2.10 |
| 5 | [`20261101000500_authorisation_functions.sql`](supabase/migrations/20261101000500_authorisation_functions.sql) | `current_partnership()`, `email_is_verified()` | §3.1, §3.5 |

The order is a dependency chain, not a convenience. Files 1–4 are tables only, and each references tables
created in the same or an earlier file: `partnership_members` needs both `partnerships` and `profiles`;
`invitations` needs `partnerships`; `updates` needs `profiles`; `reactions` and `notifications` need
`updates`; `user_preferences` needs `profiles`. File 5 is last because `current_partnership()` queries
`partnership_members` — PostgreSQL resolves the column names inside a `language sql` body when the function
is *created*, so the table has to exist first.

**Total: 10 tables · 77 columns · 21 foreign keys · 17 CHECK constraints · 14 explicit indexes · 2
functions.**

Dependencies that must be stated plainly: these migrations require a **Supabase project**, not a bare
PostgreSQL server. `auth.users`, `auth.uid()` and the `authenticated` role are Supabase objects; on vanilla
Postgres files 1 and 5 fail loudly at those references, which is the correct behaviour rather than a bug.

---

## 2. Every table and what it is for

### 2.1 `profiles` — who you are

One row per authenticated user. Created by a trigger in Stage 3C, never by the client.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | Also a FK to `auth.users (id)`, `on delete cascade`. The primary key *is* the auth user's id, so there is no mapping table to drift. |
| `display_name` | `text not null` | 1–40 characters after trimming. |
| `nickname` | `text` | ≤40, nullable. |
| `city` | `text` | ≤80, nullable. Free text — nothing may parse a timezone out of it. |
| `avatar_path` | `text` | A storage object key, never a URL. Useless to anyone who obtains it, because the `avatars` bucket is private (§6.2). |
| `created_at` / `updated_at` | `timestamptz not null` | `updated_at` defaults to `now()`; no trigger maintains it, because §2.1 does not define one. The provider sets it in the same statement that edits the row. |

Deliberately absent: a `role` column (nobody is an admin inside a couple), a `timezone` column (a timezone
is a setting, so it lives in `user_preferences`), and an `initials` column (derivable from `display_name`;
a stored copy can only disagree with the name).

### 2.2 `partnerships` — the space itself

One row per couple space. It exists from the moment a signed-up user bootstraps, so the "create space →
invite partner" flow has something to hang an invitation on while only one person is in it.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | Generated. |
| `anniversary` | `date` | Nullable. Powers the days-together counter. |
| `timezone_label` | `text` | Display caption only, e.g. `'EST ↔ GMT'` — exactly what the UI stores today. The real IANA zones are in `user_preferences`. |
| `created_by` | `uuid` | FK → `profiles`, `on delete set null`. **Provenance only.** Grants no power: no policy and no feature may treat the creator as an owner. |
| `created_at` | `timestamptz not null` | |

There is **no `status` column and no `connected_at` column**, and that is the most consequential omission in
the schema. Whether a space is connected is fully determined by how many *active* rows
`partnership_members` holds for it. A stored flag would be a second source of truth able to contradict the
first, and with membership history living in the same table it would have to be re-derived correctly on
every unlink and re-link. The ceiling is a constraint; completion is a count read at query time.

### 2.3 `partnership_members` — the ceiling, the history, and the one-space rule

One row per **seat-occupancy episode**, not one row per person. `left_at is null` means "currently in this
space"; `left_at` set means "was in this space, permanently recorded". Both kinds live in this one table,
which is what makes *one space at a time*, *history preserved* and *unlinking deletes nothing* three
compatible requirements instead of three arguments.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | Surrogate — see §5.1 for why it is not `(partnership_id, slot)`. |
| `partnership_id` | `uuid not null` | FK → `partnerships`, `on delete cascade`. |
| `slot` | `smallint not null` | `check (slot in (1, 2))`. A seat, not a role. |
| `user_id` | `uuid not null` | FK → `profiles`, `on delete cascade`. |
| `joined_at` | `timestamptz not null` | |
| `left_at` | `timestamptz` | `null` = open membership (i.e. currently a member). |
| `left_reason` | `text` | Only `'unlinked_by_self'` in v1. Required exactly when `left_at` is. |
| `invited_by` | `uuid` | FK → `profiles`, `on delete set null`. Audit only: who brought this person in. Grants nothing. |

The table-level `check ((left_at is null and left_reason is null) or (left_at is not null and left_reason
is not null))` means a row is either open or closed-with-a-reason, never half-and-half. Its practical value
is against a mistake rather than an attack: a bare `update … set left_at = now()` — the shape an unlink
takes — is rejected unless it also says why, so nobody can create history that cannot be interpreted.

### 2.4 `invitations` — hashed, shown once

A join code is a bearer credential to someone's private photographs, so it is stored the way a password is:
as a fingerprint.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `partnership_id` | `uuid not null` | FK → `partnerships`, `on delete cascade`. |
| `code_hash` | `text not null` | `sha256` of the **normalised** code (`upper()`, hyphens and spaces stripped). Unique, permanently. |
| `created_by` | `uuid not null` | FK → `profiles`, `on delete cascade`. |
| `expires_at` | `timestamptz not null` | 7 days, as the UI already promises. `check (expires_at > created_at)`. |
| `redeemed_at` | `timestamptz` | Single-use proof. |
| `redeemed_by` | `uuid` | FK → `profiles`, `on delete set null` — a redeemed invitation stays as evidence the space was joined even if that profile later goes. |
| `revoked_at` | `timestamptz` | Set by rotation (§4.5). Rotation is mandatory inside `issue_invitation()`, so a retired predecessor is the *expected* reason an honest person's code fails. |
| `created_at` | `timestamptz not null` | |

Two things are missing on purpose. There is **no `code` column** — nothing live to steal at rest is the
whole of D7. And there is **no partial hint** (nothing like `TLS••••••7`): an 8-character code over a
32-symbol alphabet is ~40 bits, and revealing 4 of 8 characters leaves ~20 bits — about a million
candidates, which is not a security margin. Either show the code or show none of it.

### 2.5 `invitation_attempts` — throttling telemetry

Server-written only. The redeem function (Stage 3D) inserts here; no client ever reads it.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `attempted_at` | `timestamptz not null` | |
| `ip_key` | `text not null` | `sha256(client_ip \|\| current_date::text)`, truncated, computed by the caller. Hashed because a table of security telemetry that leaks raw addresses is its own incident; salted by date because that keeps "this address tried 30 codes this minute" countable without storing a secret. |
| `actor_user_id` | `uuid` | FK → `profiles`, `on delete set null` — the attempt is a fact about the space, not the person; deleting an account must not erase evidence of an attack. |
| `code_hash` | `text` | Always a hash, never plaintext, consistent with §2.5. Nullable: a throttled attempt can be refused before any code is looked up. |
| `partnership_id` | `uuid` | FK → `partnerships`, `on delete set null`. |
| `outcome` | `text not null` | One of nine: `joined`, `invalid_code`, `expired`, `revoked`, `already_redeemed`, `space_full`, `already_in_a_space`, `unverified_email`, `throttled`. |

`revoked` earns its own value because rotation is mandatory, so a retired code is a more common failure than
a typo. `unverified_email` (D14) is recorded *before* the code is looked up, so an unverified caller never
burns a `code_hash` match.

### 2.6 `updates` — one published moment

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `partnership_id` | `uuid not null` | FK → `partnerships`, `on delete cascade`. Denormalised (derivable from the author) but stored, because every policy and index needs it and deriving it means a subquery on the hottest read in the app. |
| `author_id` | `uuid not null` | FK → `profiles`, **`on delete restrict`** — the single most important line in the phase. See §5.3. |
| `mood_id` | `text not null` | CHECK over the 8 ids from [`src/lib/mood.js`](src/lib/mood.js). |
| `message` | `text not null` | 1–280 after `btrim()`, matching `DailyUpdateForm`'s own limit. |
| `photo_path` | `text` | Storage object key, never a URL. The mock's `photo` field is also a path, so the shape survives; only how the client turns it into an image changes (private bucket + 15-minute signed URLs, §6.4). |
| `created_at` | `timestamptz not null` | |
| `edited_at` | `timestamptz` | Nullable and unused in v1 (D9: no edit flow). Reserved because an audit trail is cheap to reserve and expensive to backfill once rows exist. |

No `deleted_at` column. D9 defers deletion, it does not forbid it, and the cascades are already in place —
so shipping deletion later costs one column plus one policy, without soft-delete plumbing on every index and
query for a feature nobody has asked for.

### 2.7 `reactions` — normalised, idempotent

Replaces the mock's `{ reactionId: [userId, …] }` map. The map is reconstructible from this with one grouped
select, and §7.2 requires the provider to rebuild it so `reactionCount()` / `hasReacted()` in
[`src/lib/reaction.js`](src/lib/reaction.js) keep working unchanged.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `update_id` | `uuid not null` | FK → `updates`, `on delete cascade`. A gesture attached to a moment: if the moment goes, the gesture goes rather than orbiting nothing. |
| `user_id` | `uuid not null` | FK → `profiles`, `on delete cascade` — deliberately *not* restrict. A person's reaction is their own gesture, not a shared record; letting it go with them keeps counts honest without rewriting anybody's memories. |
| `reaction_id` | `text not null` | CHECK over the 5 ids from `src/lib/reaction.js`. |
| `created_at` | `timestamptz not null` | |

`unique (update_id, user_id, reaction_id)` is the table constraint that makes `toggleReaction` idempotent at
the storage layer: toggle-on is an insert that fails `23505` if already present, toggle-off is a delete that
matches zero rows if absent. No read-modify-write, so two taps from two devices cannot produce a double
count. Note what is **not** in the key — one person may hold *several* reaction types on one update (the
seed's `upd-01` has `heart` and `miss` from the same user), so this is not a single-choice field.

### 2.8 `notifications` — each person's own inbox

Read state belongs to the individual (D5): there is no shared `read` boolean, and no 3B-2 policy will make
one person's inbox readable by the other.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `recipient_id` | `uuid not null` | FK → `profiles`, `on delete cascade`. Explicit and new relative to the mock, whose list is implicitly "mine". |
| `actor_id` | `uuid` | FK → `profiles`, `on delete set null`. A person deleting their account must not delete the notification someone else received; the row becomes system-styled, which the CHECK below already permits. |
| `partnership_id` | `uuid` | FK → `partnerships`, `on delete cascade`. |
| `kind` | `text not null` | `reaction`, `checkin`, `milestone`, `connection`. |
| `update_id` | `uuid` | FK → `updates`, `on delete cascade` — the bell can never deep-link to a moment that is gone. |
| `reaction_id` | `text` | Left **unconstrained** on purpose (§2.8): a display hint copied from a reaction row that already validated it. Re-checking here would let a notification survive being *wrong* but not being *self-contradictory* — the weaker guarantee. Flagged in §11 of the spec. |
| `title` / `body` | `text` | Only for `milestone` / `connection` rows. |
| `read_at` | `timestamptz` | Strictly more information than the mock's boolean `read`, same `!read_at` test, and it lets a future "you were away for three days" work. |
| `created_at` | `timestamptz not null` | |

`check (actor_id is not null or title is not null)` says exactly what the UI already draws: `reaction` and
`checkin` rows are *rendered* from actor + update, `milestone` and `connection` rows carry their own copy.

Nothing in v1 writes these from the client. Triggers on `updates` and `reactions` do (§5.3, Stage 3F), so a
notification cannot be forged or missed and both partners get one without either frontend remembering to
send it. Those triggers must resolve "the other member" as the other *open* member, or a departed person
keeps receiving a space's notifications and nothing in the schema will complain.

### 2.9 `user_preferences` — one row per user, keyed by that user

The primary key *is* `user_id`, so a missing row is the only possible default and nothing has to invent one
at read time. Every default below is copied from the current initial state in
[`src/pages/Settings.jsx`](src/pages/Settings.jsx), so the first real load looks
identical to today.

| Column | Type | Default |
|---|---|---|
| `user_id` | `uuid` **PK** | FK → `profiles`, `on delete cascade`. |
| `daily_reminder` | `boolean not null` | `true` |
| `reminder_time` | `time not null` | `'21:00'` — a wall-clock hour in the zone below, not an interval. The UI restricts it to its four options; the database deliberately does not, so adding an option costs no migration. |
| `timezone` | `text not null` | `'UTC'` — an IANA name (`'Asia/Kolkata'`), seeded once from `Intl.DateTimeFormat().resolvedOptions().timeZone` at bootstrap and editable after. |
| `quiet_hours` | `boolean not null` | `false` |
| `partner_checkins` | `boolean not null` | `true` |
| `reaction_sounds` | `boolean not null` | `true` |
| `milestones` | `boolean not null` | `true` |
| `weekly_recap` | `boolean not null` | `false` — the switch exists in the UI and is labelled Beta. **No AI API is connected and no recap is generated.** This is a consent flag with nothing behind it, which is the honest way to ship a consent toggle ahead of the feature. |
| `updated_at` | `timestamptz not null` | `now()` |

`check (timezone ~ '^[A-Za-z0-9_+/-]{1,64}$')` is a **shape** guard, not an existence guard: it accepts
nonsense like `'Not/AZone'`. Real validation is one line in the client, where `Intl` throws `RangeError` on
an unknown zone. A DB-side existence check against `pg_timezone_names` is possible but buys little, since
nothing but this app writes the column. Note also that a named zone plus `timestamptz` is exactly the
combination that survives a clock change; storing an offset like `'+05:30'` would not.

### 2.10 `scheduled_meetings` — the plan behind the countdown

The brief asks for a table where today there is one scalar (`couple.nextMeeting`), so this is a shape change
rather than a rename: a couple plans more than one future visit, and the row that is not yet planned costs
nothing to reserve.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` **PK** | |
| `partnership_id` | `uuid not null` | FK → `partnerships`, `on delete cascade`. |
| `starts_at` | `timestamptz not null` | A full timestamp, not a date — `CountdownCard` already displays hours, minutes and seconds, so a date would break the existing UI. |
| `label` | `text` | ≤80, nullable. |
| `created_by` | `uuid` | FK → `profiles`, `on delete set null`. Cancelling a visit because someone deleted their account is not the same as the visit having been cancelled. |
| `created_at` | `timestamptz not null` | |
| `cancelled_at` | `timestamptz` | Soft cancel, not a delete: "when are we next meeting" must never resurrect a cancelled plan, and the record of the plan is worth keeping. |

No data backfill. §2.10 describes migrating the current `couple.nextMeeting` value into one row, but that
value lives in `mockData.js` and no database has ever held it, so there is nothing to carry across. The
frontend contract keeps `couple.nextMeeting` and the provider populates it from this table in Stage 3G.

---

## 3. Constraints and indexes worth knowing

### 3.1 Foreign key delete behaviour, as one table

Twenty-one foreign keys, each with an **explicit** `on delete` rule — no rule is left to PostgreSQL's
default (`NO ACTION`), because a rule nobody wrote down is a rule nobody can review.

| Rule | Count | Where |
|---|---|---|
| `cascade` | 13 | Rows that exist *only* for their parent: `partnership_members` → both sides, `invitations` → space and issuer, `updates` → space, `reactions` → update and user, `notifications` → recipient, space and update, `user_preferences` → user, `scheduled_meetings` → space, `profiles` → `auth.users`. |
| `set null` | 7 | Rows that must survive the person: `partnerships.created_by`, `partnership_members.invited_by`, `invitations.redeemed_by`, `invitation_attempts.actor_user_id` and `.partnership_id`, `notifications.actor_id`, `scheduled_meetings.created_by`. |
| `restrict` | 1 | **`updates.author_id`** — the only override of a natural default, and the reason an account deletion cannot erase a partner's history (§5.3). |

### 3.2 The indexes

14 explicit indexes; 6 of them are **partial** (they carry a `where`), and 2 of those are also **unique** —
those two are §5.1's whole enforcement mechanism.

| Index | Table | Kind | Serves |
|---|---|---|---|
| `members_active_slot_idx` | partnership_members | **unique, partial** (`where left_at is null`) on `(partnership_id, slot)` | THE two-member ceiling (§5.1) |
| `members_active_user_idx` | partnership_members | **unique, partial** (`where left_at is null`) on `(user_id)` | one open space per person (D1) — and the guarantee that lets `current_partnership()` return a single value |
| `members_partnership_active_idx` | partnership_members | partial (`where left_at is null`) on `(partnership_id)` | every "who is in this space now" read |
| `members_history_idx` | partnership_members | on `(user_id, joined_at desc)` | history reads: "how long were you together" |
| `invitations_hash_unique` | invitations | **unique, permanent** on `(code_hash)` | a redeem resolves to at most one row; also blocks re-using a copied hash |
| `invitations_open_idx` | invitations | partial (`where redeemed_at is null and revoked_at is null`) | "does this space have a live invite?" as an index-only lookup |
| `invitation_attempts_ip_idx` | invitation_attempts | on `(ip_key, attempted_at desc)` | the 15-minute per-address window |
| `invitation_attempts_code_idx` | invitation_attempts | on `(code_hash, attempted_at desc)` | the hourly per-code window |
| `updates_partnership_recent_idx` | updates | on `(partnership_id, created_at desc)` | the timeline query |
| `updates_author_idx` | updates | on `(author_id)` | "my latest update", and the `restrict` check itself |
| `reactions_update_idx` | reactions | on `(update_id)` | the grouped select rebuilding the reaction map |
| `notifications_inbox_idx` | notifications | partial (`where read_at is null`) on `(recipient_id, created_at desc)` | the badge count and the panel's default query |
| `notifications_all_idx` | notifications | on `(recipient_id, created_at desc)` | the full inbox, read included |
| `meetings_next_idx` | scheduled_meetings | partial (`where cancelled_at is null`) on `(partnership_id, starts_at)` | "the next one", which is exactly `starts_at > now() and cancelled_at is null order by starts_at limit 1` |

Plus one table-level `unique (update_id, user_id, reaction_id)` on `reactions`, which PostgreSQL backs with
its own automatically named index.

`invitations_hash_unique` is **not** partial, unlike the two membership indexes, and that asymmetry is
deliberate: the hash must stay unique against closed rows too, or a retired code could be re-issued as if it
were new.

### 3.3 The CHECK constraints, grouped by what they defend

- **Vocabulary, copied from the frontend so the two cannot drift silently:** `mood_id` (8), `reaction_id`
  (5), `notification.kind` (4), `invitation_attempts.outcome` (9), `slot` (2), `left_reason` (1). The
  mood and reaction lists are byte-identical *and in the same order* as `src/lib/mood.js` and
  `src/lib/reaction.js`; §8.3 records that as a checked fact. The tradeoff is real and tracked in spec §11:
  adding a mood to the frontend without a migration becomes an insert error.
- **Lengths and non-emptiness, always through `btrim()`** so a message of four spaces is not a message:
  `display_name` 1–40, `nickname` ≤40, `city` ≤80, `message` 1–280, `label` ≤80.
- **Self-consistency of a row** — the ones that catch a bug in someone's own code:
  `partnership_members` open/closed pairing; `invitations.expires_at > created_at`; `redeemed_at is null or
  redeemed_by is not null` (a redemption that does not say who is not a redemption); `revoked_at is null or
  redeemed_at is null` (a row cannot be both used and retired — if it ever is, the row lock in §4.2 step 6
  leaked, and this makes that loud instead of quiet); `notifications.actor_id is not null or title is not
  null`.
- **Shape of a string:** `timezone ~ '^[A-Za-z0-9_+/-]{1,64}$'`.

### 3.4 Row Level Security is *enabled* on all ten tables, with zero policies

Ten `alter table … enable row level security` statements and no `create policy` anywhere. This is the one
judgment call in the phase that goes slightly beyond the letter of "do not implement RLS policies yet", so
it is stated plainly rather than buried:

Supabase's default privileges grant `anon` and `authenticated` `select/insert/update/delete` on every new
table in the `public` schema. A table created here and left RLS-disabled until 3B-2 is applied would
therefore be world-readable through the publishable key in the interim. Enabling RLS is not a policy, and
RLS with zero policies denies everything — it fails closed, which is the safe interim state, whereas
leaving it off fails open. **If you would rather 3B-1 touched nothing RLS-related, deleting the ten
`alter table` lines from files 1–4 is a clean revert; they are grouped at the bottom of each file for
exactly that reason.**

`invitation_attempts` is the one table that is *finished* here: RLS enabled plus zero policies means the
client can neither select nor insert, by construction rather than by convention. Absence beats a policy
that says `using (false)`, because there is then nothing for someone to "fix" later.

---

## 4. Database functions

Two, both in file 5. §10 assigns everything else to later stages, and they genuinely cannot be written yet
— `bootstrap_space()` and the profile trigger need a real `auth.users` row to hang on (3C);
`issue_invitation()`, `accept_invitation()` and `unlink_partnership()` are the invitation workflow (3D);
the notification fan-out triggers are 3F.

### 4.1 `current_partnership() → uuid`

Returns the **open** partnership id for the signed-in user, or `null`. Written exactly as §3.1 specifies.
Thirteen of §3.2's twenty-one policies resolve the space through this one function, which is what keeps the
authorisation rule from drifting across thirteen hand-written copies of it.

Three properties carry their weight:

- **`security definer`** lets it read `partnership_members` without itself being subject to that table's
  policy. Without it: the policy refers to the helper, the helper reads the table, the table applies the
  policy — infinite recursion. PostgreSQL reports that as an error rather than a leak, but it is still an
  error on every single request.
- **`set search_path = public`** pins name resolution. A security-definer function without it is a
  search-path hijack: the definer's privileges used against whatever schema happens to be first in the
  caller's path.
- **No `limit 1`.** The select returns at most one row because `members_active_user_idx` allows at most one
  open membership per person. If that index were ever dropped, the function raises `21000` "more than one
  row" — loud, not quiet. A `limit 1` would turn "the one-space rule has been broken" into "you randomly
  get one of them".

Fails closed by arithmetic: a user with no open membership gets `null`, and `null = anything` is `null`,
which is not `true` — so they match no policy on any partnership-scoped table. This single `where` clause is
the one place the closed-row filter does authorisation work, and the mechanism behind the §3.4 audit
invariant: it is why preserving history does not scatter `left_at is null` through the whole design.

`revoke execute … from public` then `grant execute … to authenticated` keeps the callable surface as narrow
as the useful surface.

### 4.2 `email_is_verified() → boolean`

D14's enforcement primitive. Confirmation state lives on `auth.users`, which the `authenticated` role cannot
select, so the check needs a privilege the client does not have.

Enforced in the workflow functions, **not** in the signup button: `bootstrap_space()` step 0,
`accept_invitation()` *before* the code is looked up, and `issue_invitation()`. If the check lived in
`AuthProvider`, anyone holding a valid JWT from any other path would walk straight past it.

`coalesce(…, false)` is deliberately absent: a user with no `auth.users` row gets `null`, and `null` in a
policy or an `if` is not `true` — the same fail-closed arithmetic as §4.1. `stable` because nothing it reads
changes within a transaction and it is called per policy evaluation, so the planner may cache it.

**The body is built at migration time rather than written as a literal.** This is the one deviation from the
spec text, §8.4 explains why, and it is the thing to look at first in review.

---

## 5. How the rules are actually enforced

### 5.1 "A space holds at most two" — a constraint, not a check

Two objects, together:

```sql
slot smallint not null check (slot in (1, 2))
create unique index members_active_slot_idx
  on public.partnership_members (partnership_id, slot) where left_at is null;
```

The CHECK means there is no seat 3, so a third member is not *detected* — it is unrepresentable. The partial
unique index means at most one **open** row per seat. Together: two open rows maximum, and a third insert
fails `23505` on one of the two depending on whether the attacker reuses a seat or invents one.

The reason this is an index and not a trigger is the race. A `before insert` trigger that counts the space's
members and raises at 3 reads "how many are there?", and under two concurrent transactions both see 2, both
pass, and the space has three members. A unique index is checked by the same btree-uniqueness machinery as a
primary key, at insert time, inside the write lock: two simultaneous inserts into a vacant seat resolve to
one winner and one `23505`. The predicate only decides *which rows participate*, not *how strictly they are
enforced* — that is the part that is easy to misread about a partial unique index.

`slot` grants nothing. Nothing gives slot 1 extra rights, and because seats are reused after a departure,
**slot 1 is not "the founder" in any authoritative sense** — which is why no policy may read `slot` as a
role and why `partnerships.created_by` is provenance only.

### 5.2 Why `partnership_members` has its own `id`

An earlier draft keyed this table on `(partnership_id, slot)`. That is wrong once rows survive unlinking:
when the slot-2 partner leaves and a new partner is invited, the new row also wants `slot = 2`, and the
composite key would reject the couple's *next* relationship as a duplicate of the last one. Seats are
reusable; closed rows are records, not occupants. So the primary key is the table's own `id`, and the open
rows are keyed by partial unique indexes instead.

The same reasoning replaced a permanent `unique (user_id)` with `members_active_user_idx … where left_at is
null`. A permanent unique says "this person appears once, ever", which forces unlinking to **DELETE** the
row — the irreversible action D3 refuses. History and the one-space-at-a-time rule coexist only because
that index counts open rows.

### 5.3 How unlinking and deletion preserve shared history

Three separate threats, three different mechanisms:

- **Unlink (D3) deletes nothing.** It sets `left_at` and `left_reason` on one row. The space, its updates,
  its reactions and its meetings all stay; the departed person simply stops matching
  `current_partnership()`, and so stops passing every partnership-scoped policy. No cascade fires, because
  nothing is deleted. This is also why the ceiling is a partial index — a permanent one would have made
  re-linking impossible.
- **Account deletion (D13, out of v1) cannot take the partner's memories.** `updates.author_id` is
  `on delete restrict` while everything around it cascades. Deleting a user drops their `auth.users` row,
  which cascades to `profiles`, which *would* cascade straight through `updates` and silently erase the
  OTHER person's history. `restrict` aborts the whole chain in one statement, so the operation fails loudly
  and whoever holds the console has to choose deliberately. Because it is one statement, the same
  restriction also protects the membership history in `partnership_members` from the same cascade. The
  migration that ships account deletion will have to answer two questions D13 defers: what happens to the
  *space*, and what "anonymise" means for rows the other person still reads.
- **Space deletion (D12) does not exist in v1**, so `… on delete cascade` from `partnerships` is a
  correctness guarantee for a path that is closed, not a live data-loss route. The Settings control that
  promised it is removed in §7.3 item 12 rather than left pointing at something else.

Where a row should survive *the person* rather than die with them, the rule is `set null`: notifications
received from a deleted account become system-styled rows, a redeemed invitation keeps existing as evidence
the space was joined, `created_by` on a space simply goes empty.

### 5.4 A solo space is a legal state everywhere

Nothing in any of the five files requires a second row. One member inserts, and every constraint is
satisfied: `slot in (1,2)` picks one of two seats, the partial unique indexes have one open row each, no
CHECK mentions a partner. "Connected" is `count(*) … where left_at is null = 2` evaluated at read time
(§2.2), so the solo state is not an error condition the schema has to be argued out of — it is just fewer
rows. This is what makes spec §10's acceptance criterion (c) — *a one-member partnership inserts, reads and
passes every policy* — a schema property rather than a 3B-2 hope.

---

## 6. SQL concepts a beginner needs for these files

Ordered roughly by how much of this schema they unlock.

- **Table / column / type.** A table is a set of rows with the same shape. `uuid`, `text`, `boolean`,
  `smallint`, `date`, `time`, `timestamptz` are the types used here.
- **Primary key (`primary key`).** The column that identifies a row uniquely and is never null. `profiles`
  and `user_preferences` are keyed by the user id itself; everything else uses a generated `id`.
- **Foreign key (`references … on delete …`).** A promise that a value exists in another table, plus what
  happens when that other row goes: `cascade` (take mine too), `set null` (keep mine, blank the pointer),
  `restrict` (refuse to delete theirs). Choosing among these *is* the data-retention design here — see §5.3.
- **`not null` and `default`.** A required column, and the value used when the client omits it. `default
  now()` and `default gen_random_uuid()` mean the client never has to supply them.
- **`check` constraints.** A boolean expression every row must satisfy. The cheapest possible guard, and the
  one that catches your own bugs — a zero-length message, a backdated expiry, a redemption with no redeemer.
- **Index.** A second copy of the data ordered by the columns you query, so "newest 20 for this partnership"
  is a seek instead of a scan of every row. Costs a little on every write; saves a lot on every read.
- **Unique index.** The same, but rejects duplicates. `23505 unique_violation` is the error PostgreSQL
  raises. Idempotent toggling (§2.7) relies on catching that error and treating it as success.
- **Partial index (`where …`).** An index that only contains rows matching a predicate — smaller, and able
  to express rules about a *subset* that a plain unique constraint cannot. The key insight of this schema:
  "at most one open membership per person" is a rule about open rows only, so it can only be written as a
  partial index.
- **Surrogate key.** A `id` that means nothing, used because the natural key (`partnership_id, slot`) stops
  being unique once history is preserved (§5.1).
- **`timestamptz` vs `date` vs `time`.** A stored instant (always UTC, displayed in the reader's zone), a
  calendar day with no instant, and a wall-clock time with no day. `starts_at` is a full timestamp because
  the countdown shows seconds; `reminder_time` is a `time` because it means "9pm *here*"; `anniversary` is a
  `date` because nobody wants their anniversary to move when they fly to another zone.
- **`gen_random_uuid()`.** Core PostgreSQL since v13, so no extension is needed — which is why no
  `create extension pgcrypto` appears anywhere in these files.
- **`text` vs `varchar(n)`.** Identical performance in PostgreSQL; `text` + a `check` says the limit where
  the error message is legible and can be changed without a type rewrite.
- **`~` (regex match), `btrim`, `char_length`.** The shape guard and the honest length check — `btrim` first,
  so four spaces is not a 4-character name.
- **Functions: `language sql` vs `plpgsql`.** A thin expression versus the procedural language. Matters here
  because `language sql` bodies are parsed *and their columns resolved* at `CREATE FUNCTION` time (§8.4).
- **`stable` / `volatile`.** Whether repeated calls in one statement can be cached. `stable` promises the
  answer only depends on the data, not the clock or random numbers.
- **`security definer` + `set search_path`.** Run with the *author's* privileges, so it can read a table the
  caller cannot — which is how an email-confirmation check works when `authenticated` may not select
  `auth.users`. Always pin `search_path`, or the elevated privileges resolve names against the caller's
  schema. That combination is the standard hardening for these helpers and is why both functions here have it.
- **`revoke` / `grant`.** Who may call it. `revoke … from public` then `grant … to authenticated` is
  default-deny, default-deny with an exception.
- **`create or replace function`.** Re-runnable definition. Note what it does *not* make re-runnable: a bare
  `create table` fails the second time. These five files are meant to apply exactly once — which is what the
  version-stamped filename convention is for.
- **Dollar quoting (`$$ … $$`, `$fn$ … $fn$`).** Lets a string contain single quotes and semicolons without
  escaping. Nesting different tags (`$fn$` inside `$$`, `$body$` inside `$fn$`) is what lets one string
  contain a complete function definition.
- **`DO $$ … $$`** — an anonymous block of procedural SQL, run once at migration time, leaving nothing
  behind. Used here to look at the catalog and decide what to create (§8.4).
- **`format()` with positional parameters (`%1$s`)** — string templating inside SQL. Safe *here* because the
  substituted value comes from a catalog read filtered by an IN-list of two literals, never from user input.
- **`pg_attribute` / `pg_class` / `pg_namespace`** — the system catalog, i.e. PostgreSQL's description of
  itself. Queryable, which is how a migration can ask "does this column exist?" without a hard failure.
- **Transactions and atomicity.** `supabase db push` applies one migration per transaction: if it fails,
  none of it lands. That is why file 5's `raise exception` on a missing column is the right behaviour — it
  rolls the whole migration back rather than leaving a half-built space.
- **Race conditions.** Two sessions doing the same thing at once. The schema's answers are all "make the bad
  state unrepresentable, then let the error be the guard" — a unique index for the seat, a unique triple for
  the reaction, no `limit 1` so a broken rule shouts.
- **RLS.** A per-row policy evaluated for every query, in the database, so a client cannot ask for rows it
  may not see no matter how it phrases the request. Enabled here, with zero policies, so everything is
  currently invisible — the safe interim state. Policies are 3B-2.
- **Normalisation vs denormalisation.** `updates.partnership_id` is derivable from the author and stored
  anyway, because deriving it means a join on the app's hottest read. The tradeoff is that a bug could make
  them disagree; the policy in 3B-2 must therefore check both.

---

## 7. Phase boundary — deliberately absent

| Absent | Stage | Why it cannot be written now |
|---|---|---|
| All RLS policies (§3.2, §3.3, §3.4 audit) | **3B-2** | This phase's brief. Ten tables currently have RLS enabled and no policies, so they are readable by nobody. |
| `handle_new_user()` trigger, `bootstrap_space()` | 3C | Both need a real `auth.users` row and a live `authenticated` role. |
| `issue_invitation()`, `accept_invitation()`, `unlink_partnership()` | 3D | The invitation workflow, including the hash/rotate/throttle logic these tables were shaped for. |
| Notification fan-out triggers | 3F | They write `notifications` from writes to `updates`/`reactions`; all three must exist first (they do) but they are the workflow, not the foundation. |
| Storage buckets, file-size limits, `onAfterUpload` EXIF strip, signed URLs | 3E | §6. Nothing here references a bucket; `avatar_path` and `photo_path` are plain `text`. |
| `deleted_at` on `updates` | deferred (D9) | No delete flow in v1. Cascades are already correct so it costs one column later. |
| Permanent partnership deletion | refused (D12) | Preserving shared history is the decision; there is no delete policy to add. |
| Account deletion flow | out of v1 (D13) | `updates.author_id … restrict` is the structural protection until it is designed. |
| `create extension` of any kind | never needed | `gen_random_uuid()` is core; no `pgcrypto`. |
| Any client insert into `invitation_attempts` | refused by design | RLS enabled, zero policies. Only the Stage 3D redeem function writes it. |
| Supabase client, React wiring, `.env` changes, mock-data removal | 3G | This phase touches no file under `src/`. |

---

## 8. Validation performed, and its results

### 8.1 What was and was not possible

**No migration was executed.** The brief permits local Postgres or the Supabase CLI for isolated validation
*only if already available*; none is available on this machine — checked for and absent: `psql`,
`postgres`, `pg_ctl`, `initdb`, `supabase`, `docker`, `pg_config`. Installing one is new infrastructure and
needs your approval, so it was not done. And these migrations could not run on bare Postgres anyway:
`auth.users`, `auth.uid()` and the `authenticated` role only exist in a Supabase project.

So validation is **static**: a throwaway Node script (kept outside the repository, in the OS temp
directory, so it is not part of the project and not published here) that
strips comments and dollar-quoted bodies, splits the files into statements, and checks the schema
against the spec. It is a parser-free structural check, **not** a SQL grammar validator and **not** a
substitute for applying the migrations.

### 8.2 What it checked, and the result

Last run, all checks green (`PROBLEMS: none`):

```
TABLES 10 · INDEXES 14 · FUNCTIONS 1 (+1 built by a DO block)
RLS enabled on 10/10 · create policy statements found: 0
```

- **Inventory** — exactly the ten tables named in the brief, no duplicates, no extras; 5 files, apply order
  verified so every `references` target is defined by an earlier statement.
- **Column parity with spec §2** — all 77 columns across all ten tables match §2 exactly, name for name.
- **Primary keys** — declared on all ten.
- **Foreign keys** — 21, each with an explicit `on delete` rule (13 `cascade`, 7 `set null`, 1 `restrict`);
  every target exists and is defined earlier.
- **Indexes** — 14, every indexed column present on its table; 6 partial, 2 of those also unique.
- **CHECK identifiers** — every column named in a CHECK is a real column on that table.
- **Vocabulary drift** — `mood_id`'s 8 values and `reaction_id`'s 5 are identical to `src/lib/mood.js` and
  `src/lib/reaction.js`, in the same order. This is the §11 drift risk checked rather than commented.
- **Function bodies** — `current_partnership()` reads `auth.uid()` and filters `left_at is null`; both
  helpers have `execute` revoked from `public` and granted to `authenticated` only.
- **Rename tolerance** — the `email_is_verified()` builder was rendered for all three catalog scenarios
  (both columns, only `email_confirmed_at`, only `confirmed_at`) and produces valid SQL in each, and raises
  in the fourth (neither) rather than defaulting every user to unverified.
- **Hygiene**, run against comment-stripped SQL so prose does not trip it: no `create policy`, no
  `create extension`/`pgcrypto`, no `insert into` / `update public.` / `delete from` (schema-only, as the
  brief requires), no `service_role`, no JWT-shaped `eyJ…`, no `supabase_url`/`anon_key`, no `drop table`,
  no `truncate`. **None of the 12 present.**
- **No environment file touched**, by construction: nothing in this phase reads or writes `.env`,
  `.env.local` or `.env.example`.

### 8.3 One real defect, found and fixed

`notifications` was transcribed from §2.8 **without its `id uuid primary key default gen_random_uuid()`**.
The first validator pass did not check for primary keys, so it reported clean. Fixed by restoring the column
and by adding two checks that would have caught it — a per-table primary-key check and the per-table
column-parity check against §2. Both now pass (11 columns on `notifications`). Three validator false
positives were also corrected along the way (a body-stripper hiding `auth.uid()`, `String.match` with `/g`
returning full matches instead of capture groups, and comment prose naming `pgcrypto` and `truncate`), so
the clean run is a clean run against checks that actually work.

### 8.4 The one deviation from the spec text, and the one judgment call

Both are in §3.4 and §4.2 and are called out here because they are the two things worth reviewing first:

1. **`email_is_verified()` is built, not written.** §3.5 documents
   `coalesce(u.email_confirmed_at, u.confirmed_at)` as a single static body and says "whichever exists, the
   function reads". That cannot be true of a `language sql` function: the body is parsed and its column
   references resolved at `CREATE FUNCTION` time, so naming *both* requires *both* to exist — and a current
   Supabase project has only `email_confirmed_at`. Written literally, the documented function fails to
   create on exactly the projects the `coalesce` was there to protect. This is a genuine contradiction in the
   spec rather than a preference, so the resolution keeps both documented properties: a catalog read picks
   whichever of the two names this project has, the body is assembled with `format()`, and if neither exists
   the migration `raise exception`s rather than letting everyone read as permanently unverified. Nothing
   user-controlled reaches the executed string — the only two names it can ever choose are literals in the
   `in (…)`. **BACKEND_ARCHITECTURE.md §3.5 has been updated to record this**; its §3.1 code fence, which
   was broken, is fixed in the same pass.
2. **RLS enabled with zero policies in 3B-1** rather than left off until 3B-2, so the ten tables are not
   world-readable through Supabase's default grants in the interim. Reverting it is ten deleted lines.

### 8.5 What still cannot be claimed

The spec's §10 acceptance criteria for this phase are behavioural — *(a) a third open member in a slot →
`23505`, (b) a second open membership for one person → `23505`, (c) a one-member partnership inserts and
passes every policy, (d) a closed row grants nothing, (e) user B selects zero rows from user A's space,
(f) the §3.4 audit as one script*. **None of them have been run.** (c), (d), (e) and (f) additionally
depend on 3B-2's policies existing, so they cannot be satisfied before then. (a) and (b) are pure
constraint properties and are argued from the indexes in §5.1–§5.2, but that is an argument, not a test.

The honest first-run checklist, for when you have created the project and choose to apply these:

1. `supabase db push` (or paste files 1–5 into the SQL editor in order, accepting that the editor does not
   record migration versions).
2. Insert two open rows for one space in slots 1 and 2 — both succeed. Insert a third — expect `23505`.
3. Insert a second open membership for one user — expect `23505`; close the first
   (`left_at`, `left_reason`) and re-insert — succeeds.
4. Insert a solo space (one member, one row) — succeeds.
5. `select public.current_partnership()` as each of the two test users, and as a third with nothing.
6. `select count(*) from pg_tables where schemaname='public' and rowsecurity` — expect 10.
7. `select polname from pg_policies` — expect zero rows until 3B-2.
8. Confirm the auth.users column probe: `select attname from pg_attribute where …relname='users' and
   attname in ('email_confirmed_at','confirmed_at')` — tells you which body got built.
9. `select public.email_is_verified()` — expect `false` for an unverified user, never an error.
