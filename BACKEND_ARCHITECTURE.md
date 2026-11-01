# Togetherly — Backend Architecture (Stage 3A)

**Status: schema approved; the tables exist as migration files, the policies do not.** No Supabase project
exists, no credentials have been created, no environment file was touched and no package was added.
Two frontend/DB slices have shipped on paper: **3B-0** (the five `ME` import removals plus the `Dashboard`
loading branch — §1.1, §10) changed five page files and no behaviour, and **3B-1** wrote the ten tables,
their indexes, constraints and the two authorisation helpers into
[`supabase/migrations/`](supabase/migrations) — statically validated only, never
executed, RLS enabled with zero policies. **Row Level Security policies are Stage 3B-2.**
See [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md) for the migration-by-migration
read of what 3B-1 built, including the one place it deviates from §3.5.

**Revised 2026-10-31 after the decision review.** D1–D11 are approved (with D7, D8 and the timezone
placement changed), and so are the four that were open: D12 (no space deletion in v1), D13 (account
deletion out of v1), D14 (verified email required) and D15 (friendly solo-space wording). §9 is now the
complete decision record; §2–§8 and §10–§11 carry the consequences. The two corrections called out in
review — history must survive, and "two is the ceiling" is not "two is required" — are resolved in §2.3.1
and §2.3.2.

The product invariant this whole design is built around:

> A couple space holds **at most two** people and is **complete at exactly two**. One person creates the
> space and waits alone in it; they invite precisely one other; that person accepts and the space becomes
> connected. No third person can ever join. No groups, no multi-partner spaces.
>
> **Two members is a ceiling enforced by the database. Two members is not a precondition for a valid
> row** — a one-member partnership is a normal, expected, long-lived state. §2.3.2 keeps the two ideas
> apart on purpose, because the easiest way to build this wrong is to write a constraint that requires a
> partner and then find that signup itself violates it.

---

## 1. What the code actually does today

I read the current source rather than the docs, because the docs make a claim that is no longer true.

### 1.1 The finding that changes the migration plan

`README.md` states: *"Screens never talk to `mockData.js` directly — they read through `useData()`.
That is what lets Stage 3 replace the provider internals with queries without touching a single
component."*

**It was false, and it was load-bearing.** Five pages imported the hardcoded mock user id directly —
the table below records the finding as it stood when it was made, so the line numbers are pre-3B-0:

| File | Import | Used for |
|---|---|---|
| [Connect.jsx:9](src/pages/Connect.jsx#L9) | `ME` | `couple.partners.find(p => p.id === ME)` at `:16` |
| [Dashboard.jsx:13](src/pages/Dashboard.jsx#L13) | `ME` | author filtering, `currentUserId={ME}` at `:87`, `:115` |
| [Memories.jsx:13](src/pages/Memories.jsx#L13) | `ME` | `currentUserId={ME}` at `:147` |
| [NewUpdate.jsx:10](src/pages/NewUpdate.jsx#L10) | `ME` | `authorId` and `currentUserId={ME}` at `:60` |
| [Profile.jsx:12](src/pages/Profile.jsx#L12) | `ME` | deciding which partner is "you" at `:19` |

`ME` is the literal string `'user-me'`. When Stage 3 puts a real Supabase `auth.uid()` behind these
screens, every one of these comparisons silently evaluates to `false`. The app would not crash — it
would render as though the signed-in person had never posted anything and could react to their own
updates. That failure mode is quiet, which is why it must be fixed as part of the wiring phase and
not discovered later.

The fix is small and mechanical (read `currentUser.id` from `useData()` instead of importing `ME`).
I listed it as **3B-0** in the plan so it could not be forgotten.

**Status — done.** All five imports are gone, and `Dashboard` has its `loading` branch. Verified with
`grep '\bME\b' src`: the only surviving references are [AuthProvider.jsx](src/context/AuthProvider.jsx)
(the mock session, replaced by 3C), [DataProvider.jsx](src/context/DataProvider.jsx)
(the provider seam Stage 3 replaces — that is where the id *should* be referenced) and
[mockData.js](src/lib/mockData.js) (sample data). No page reads it. The app is
unchanged on mock data, which was the point: the defect was latent, and it is now impossible rather
than merely noticed.

`Landing.jsx:20` also imports `couple`. That one is correct and stays — the landing page is marketing
and shows sample data by design.

### 1.2 Data shapes in use today

Everything below is from [mockData.js](src/lib/mockData.js) and
[DataProvider.jsx](src/context/DataProvider.jsx). The schema in §2 maps onto
these one-for-one, which is what keeps the UI untouched.

**Couple** (`mockData.js:23`) — `id`, `anniversary` (ISO), `nextMeeting` (ISO), `timezoneLabel`
(a hand-written string, `'EST ↔ GMT'`), `partners[2]`.

**Partner** — `id`, `name`, `nickname`, `city` (free text, `"Toronto, Canada"`), `avatarUrl`,
`initials` (derived, first letter).

**Update** (`:56`) — `id`, `authorId`, `moodId`, `message` (≤280, enforced in
[DailyUpdateForm.jsx:9](src/components/updates/DailyUpdateForm.jsx#L9)),
`photo` (a `/mocks/*.png` path or `null`), `createdAt`, `reactions`.

**Reactions** are stored denormalised as `{ reactionId: [userId, …] }`. The vocabulary is fixed at
five ids in [reaction.js:3](src/lib/reaction.js#L3): `heart`, `sparkle`,
`miss`, `laugh`, `proud`. Moods are fixed at eight ids in
[mood.js:10](src/lib/mood.js#L10). A person may hold several reaction types on
one update (`upd-01` has `heart:[ME]` and `miss:[ME]`), so it is not a single-choice field.

**Notification** (`:214`) — `id`, `kind` (one of `reaction` / `checkin` / `milestone` /
`connection`, per [NotificationsMenu.jsx:9](src/components/layout/NotificationsMenu.jsx#L9)),
`actorId` (nullable — system rows have none), `updateId` (nullable deep link), `reactionId`,
`title`/`body` (only for system rows), `createdAt`, `read` (boolean).

**Invitation** (`:204`) — `code` in `TLSH-4827` format, `expiresAt`, `status`. The alphabet is 32
characters excluding `I O 0 1` and the generator is client-side
([DataProvider.jsx:14-21](src/context/DataProvider.jsx#L14)).

### 1.3 Operations the provider exposes

`DataContext` is the entire integration surface — `couple`, `currentUser`, `partner`, `personById`,
`updates`, `connection`, `notifications`, `unreadCount`, `loading`, and the nine mutators
`publishUpdate`, `toggleReaction`, `editPartner`, `editCouple`, `regenerateInvite`, `joinWithCode`,
`unlinkPartner`, `markNotificationRead`, `markAllNotificationsRead`. §7.2 maps each one.

### 1.4 Three things the docs do not mention

**Preferences are not persisted anywhere.** `Settings.jsx:68` holds all seven toggles in a local
`useState`. Navigating away and back resets them. The page presents them as account settings; they
are currently a demo. `user_preferences` in §2.9 exists to make that honest.

**`nextMeeting` is a single scalar, not a list.** The brief asks for `scheduled_meetings`, which is
the right long-term shape, but it means a migration rather than a rename. §2.10 covers it.

**The avatar upload already exists and goes nowhere.** `WIREFRAMES.md:715` draws it, and
[Profile.jsx:47-51](src/pages/Profile.jsx#L47) runs it: pick a file, `URL.createObjectURL`,
preview in the modal. The blob is discarded when the draft is closed, and the caption under the button says
so ([Profile.jsx:161](src/pages/Profile.jsx#L161)). What the design docs do not say is that
this is a second, separate storage surface — a mutable, per-user, private bucket with its own revision path and
its own signed-URL problem, distinct from the update photos (§6.2, §6.4). It is mapped in §7.2 so nobody
discovers it as a leftover in 3E.

### 1.5 What is already correct for a backend

- [supabase.js](src/lib/supabase.js) reads `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` and exports `isSupabaseConfigured`. Only the publishable key is ever in
  client-visible code — the design below keeps it that way.
- `SessionScope` ([App.jsx:52](src/App.jsx#L52)) already re-keys the data
  provider on `user?.id`, which is exactly the per-user remount a real backend needs. No change.
- `AuthProvider` already switches to `onAuthStateChange` when configured, and its mock session shape
  (`{ user: { id, email } }`) matches Supabase's.
- `personById` is a live lookup over context rather than a snapshot, so a renamed partner propagates —
  the same property the real schema gives us via joins.
- Photo upload already validates `image/*` and a 10 MB ceiling client-side
  ([PhotoUploader.jsx:4,22-27](src/components/updates/PhotoUploader.jsx#L4)).
  Server-side rules in §6.5 mirror them.

---

## 2. Proposed schema

Ten tables (was nine; `invitation_attempts` is added because D4 was approved).

Schema name: `public`. All ids `uuid default gen_random_uuid()`. All timestamps
`timestamptz not null default now()`. `auth.uid()` is Supabase's session user id.

### 2.1 `profiles`

One row per authenticated user. Created by a trigger on `auth.users`, never by the client.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `references auth.users(id) on delete cascade` |
| `display_name` | text | `check (char_length(trim(display_name)) between 1 and 40)` |
| `nickname` | text null | ≤ 40 |
| `city` | text null | free text, ≤ 80 — matches today's `"Toronto, Canada"` |
| `avatar_path` | text null | storage object path, not a URL |
| `created_at` / `updated_at` | timestamptz | |

```sql
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(btrim(display_name)) between 1 and 40),
  nickname      text check (nickname is null or char_length(btrim(nickname)) <= 40),
  city          text check (city is null or char_length(btrim(city)) <= 80),
  avatar_path   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

**No `timezone` column — it moved to `user_preferences` (approved).** An earlier draft of this document
put the IANA zone on `profiles`. The review moved it: a timezone is a setting that changes your
behaviour (when pings arrive), not a fact about your identity, and it belongs beside the quiet-hours
toggle that consumes it. §2.9 carries it now. The consequence for this table is only that `profiles`
stays a pure display-identity table.

The reason a real zone is needed at all: Settings promises "hold every ping between midnight and 7am
*your time*" and Profile says "reminders follow your local time". A city string cannot deliver that —
there is no reliable parse from `"Toronto, Canada"` to a zone, and the existing `timezoneLabel` is a
hand-typed string, not data.

**No `initials` column.** Today `initials` is stored and can drift from `name`. The `Avatar`
component already derives a fallback from `initials`; deriving it from `display_name` server-side or
in the selector removes a field that can only go stale.

**Every column here is self-editable and nothing else (D2 approved).** One person's name, nickname and
city are that person's to change. The policy in §3.2 enforces it, and §7.3 lists the one UI change that
follows — Profile stops offering "Edit Sparkles".

**No `role` column.** There is no admin, owner or member distinction inside a couple — §3.1 explains
why symmetry is the safer default here.

### 2.2 `partnerships`

The couple space itself. One row per space; it exists from the moment someone signs up, so the
"create space → invite partner" flow has something to attach the invitation to.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `anniversary` | date null | Profile edits it |
| `timezone_label` | text null | display-only free text, e.g. `EST ↔ GMT` — exactly what the UI stores today. The *real* zones live in `user_preferences` (§2.9); this is a caption, not a computation. |
| `created_by` | uuid | `references profiles(id) on delete set null` — provenance only, grants no power |
| `created_at` | timestamptz | |

```sql
create table public.partnerships (
  id              uuid primary key default gen_random_uuid(),
  anniversary     date,
  timezone_label  text,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);
```

There is deliberately **no `status` column, and no `connected_at` column**. Whether a space is
connected is fully determined by how many *active* rows `partnership_members` holds for it: one means
"waiting for the invitation", two means connected. A column that repeats that is a second source of
truth that can disagree with the first — and with membership history now living in the same table
(§2.3), a stored flag would also have to be re-derived correctly on every unlink and re-link. The
frontend's `connection.status` is derived in one selector instead (§7.2).

The one thing worth persisting later is *when* a space first connected, if a "connected on" anniversary
ever ships. That is a `connected_at` with a backfill story, and it is not in v1.

### 2.3 `partnership_members` — the ceiling, the history, and the one-active rule

Rewritten after your review. Two corrections land here: `unique (user_id)` was permanent, which makes
historical membership rows impossible without deleting them; and the draft conflated "holds at most
two" with "requires two". §2.3.1 and §2.3.2 are the direct answers.

```sql
create table public.partnership_members (
  id              uuid primary key default gen_random_uuid(),
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  slot            smallint not null check (slot in (1, 2)),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  joined_at       timestamptz not null default now(),
  left_at         timestamptz,
  left_reason     text check (left_reason in ('unlinked_by_self')),
  invited_by      uuid references public.profiles (id) on delete set null,

  -- a row is open, or it is closed and says why; never one without the other
  check ((left_at is null and left_reason is null)
      or (left_at is not null and left_reason is not null))
);

-- THE CEILING: one open row per slot, and there are only two slots.
create unique index members_active_slot_idx
  on public.partnership_members (partnership_id, slot)
  where left_at is null;

-- ONE OPEN SPACE PER PERSON (D1).
create unique index members_active_user_idx
  on public.partnership_members (user_id)
  where left_at is null;

create index members_partnership_active_idx
  on public.partnership_members (partnership_id) where left_at is null;
create index members_history_idx
  on public.partnership_members (user_id, joined_at desc);
```

| Column | Purpose |
|---|---|
| `slot` | The seat in the couple. `check (slot in (1,2))` means there is no slot 3. A seat, not a role — nothing grants slot 1 extra rights (§3.2). |
| `left_at` | `null` = currently a member. Set = historical row, kept forever. This is what makes D1 and D3 compatible. |
| `left_reason` | Why the seat emptied. Required whenever `left_at` is, so an accidental `update … set left_at = now()` is rejected rather than silently re-interpreting history. |
| `members_active_slot_idx` | At most one **open** row per `(partnership_id, slot)` — the two-member ceiling. |
| `members_active_user_idx` | At most one **open** membership per person — one space at a time, no groups, history still allowed. |
| `invited_by` | Audit only: who brought this person in. |

**Why the primary key changed.** The previous draft keyed the table `(partnership_id, slot)`. That key
is wrong once history lives here: when the slot-2 partner unlinks and a new partner is invited, the new
row also wants `slot = 2`, and the primary key would reject the couple's next relationship as a
duplicate of the last one. The table is therefore keyed by its own `id`, and the *open* rows are keyed
by a partial unique index instead. Slots are reusable seats; closed rows are records, not occupants.

**`left_reason` has exactly one value, and that is deliberate.** In v1 the only way a seat empties is its
occupant choosing to leave (§4.6). `unlinked_by_partner` is not in the list because nothing lets one
member remove the other; `account_deleted` is not in it because account deletion is not a v1 path (§11).
A CHECK list is a claim about what the system does, and a value nothing ever writes is a claim later
readers will believe.

#### 2.3.1 One open partnership, history preserved (D1 + D3)

`unique (user_id)` said "a person appears in this table once, ever". That is stronger than the product
rule, and it is the wrong strength: it forces unlinking to **delete** the row, which is exactly the
irreversible action D3 refuses to take. The partial index states the real rule — a person may hold at
most one **open** membership — so history and the one-at-a-time rule coexist:

| Situation | Old design (`unique (user_id)`) | This design |
|---|---|---|
| Emerson unlinks from Sparkles | row deleted, or moved to a second table | row stays; gets `left_at` + `left_reason='unlinked_by_self'` |
| Sparkles later invites someone new | blocked by the dead row's slot | allowed; the closed row is not an occupant of slot 2 |
| Emerson joins a new couple | impossible without deleting evidence | allowed — `members_active_user_idx` only counts open rows |
| "how long were you together" / "who was this space" | needs the deleted row back | `min(joined_at)`, `max(left_at)` from rows that were never removed |

This also **retires the separate history table** this document previously proposed as optional. Two
tables holding the same fact, with a move between them at unlink time, made unlink a two-write operation
that had to be transactional forever; one table with an open/closed flag makes it a single-row update
that either commits or does not.

**The cost, stated honestly.** Every authorisation read must now filter `where left_at is null`. In
this design there are exactly two places that do: `current_partnership()` (§3.1) and `members_select`
(§3.2). Two is controllable. The risk is a third being written later and forgetting, so phase 3B's exit
test includes an explicit assertion that a closed membership grants nothing — see §11.

#### 2.3.2 Two as a ceiling, not two as a requirement

These are different things and the schema treats them differently:

| | "A partnership has **at most** two members" | "A partnership is **connected** when it has two" |
|---|---|---|
| Where it lives | the database | derived state, in one selector |
| Mechanism | `check (slot in (1,2))` + `members_active_slot_idx` | count of open membership rows: 1 → `pending`, 2 → `connected` |
| Violation looks like | `23505 unique violation` — the insert does not happen | nothing can violate it; it is a read, not a rule |
| Who can bypass it | nobody, including a hand-written insert in the dashboard console | n/a |

Consequences of the right column being *derived* rather than enforced:

- **No constraint requires a second member.** A one-member partnership is valid, visible and possibly
  long-lived — it is the state every signup starts in, and the state a space returns to after an unlink.
  Nothing in §2 blocks a `partnerships` row with one occupant, and `invitations` deliberately points at
  such a row.
- **`partner` becomes nullable for the first time.** The mock always has two people, so every consumer
  assumes it. Against the real schema a solo account makes `partner === null`, and
  [Dashboard.jsx:45](src/pages/Dashboard.jsx#L45) dereferences `partner.id` inside
  a `useMemo` dependency array — that throws on the first render of a brand-new account. Ten sites read
  `partner.name` unguarded today (Dashboard, Connect, NewUpdate, Settings, Profile, AccountMenu,
  NotificationsMenu, ConfirmUnlink). §7.3 item 7 makes "make the app tolerate a solo space" an explicit
  migration task rather than a surprise, because it is the one approved decision that changes runtime
  behaviour, not just storage.
- **Nothing fires on "became connected".** No trigger flips a status, because there is no status to
  flip. The joiner learns it from the accept-invite response; the waiting partner learns it from a
  Realtime insert on `partnership_members` (§5.2). Both are notifications of a fact that remains
  readable from the rows themselves.

#### 2.3.3 How the ceiling is enforced

To add a third **open** member you must insert a row for partnership `X`. `check (slot in (1,2))`
limits the choices to two values; `members_active_slot_idx` allows at most one open row per value. So a
third open member is not *detected* — it is unrepresentable. There is no count to race on, no trigger to
win a race against, and no window in which two concurrent inserts both see "only one member so far".
Two simultaneous inserts into the same vacant slot resolve to one winner and one `23505`, because a
partial unique index is checked by the same btree-uniqueness machinery as a primary key; the `where`
predicate only decides which rows participate, not how strictly they are enforced.

Compare the obvious alternative — a trigger that runs `select count(*) … if n >= 2 raise` — and you can
see why it is worse: two simultaneous inserts both count 1, both pass, and you have three members.
Closing that hole requires an advisory lock, which is a serialisation point you now have to reason about
forever. Slots make the illegal state unrepresentable instead of detecting it.

What changed from the previous draft is only the *predicate*: the primary key enforced
"one row per partnership-slot, ever", which is the wrong rule once rows survive unlinking; the partial
index enforces "one open row per partnership-slot", which is the rule you approved. The ceiling itself
is exactly as strong as it was.

### 2.4 `invitation_attempts` — the rate limiting D4 approved

Server-written security telemetry, invisible to every client, existing so that code redemption can be
throttled.

```sql
create table public.invitation_attempts (
  id              uuid primary key default gen_random_uuid(),
  attempted_at    timestamptz not null default now(),
  ip_key          text not null,
  actor_user_id   uuid references public.profiles (id) on delete set null,
  code_hash       text,
  partnership_id  uuid references public.partnerships (id) on delete set null,
  outcome         text not null check (outcome in
                    ('joined','invalid_code','expired','revoked','already_redeemed',
                     'space_full','already_in_a_space','unverified_email','throttled'))
);

create index invitation_attempts_ip_idx   on public.invitation_attempts (ip_key,   attempted_at desc);
create index invitation_attempts_code_idx on public.invitation_attempts (code_hash, attempted_at desc);
```

| Decision | Why |
|---|---|
| Hashed IP, not raw | `ip_key` is `sha256(client_ip \|\| current_date::text)` truncated. A table of security telemetry that leaks identities is its own incident. Salting by date still keeps "this address tried 30 codes this minute" countable, and needs no stored secret. |
| `code_hash`, never plaintext | consistent with §2.5 — the database never holds a live code, not even in its logs table. |
| `revoked` is its own outcome | rotation is mandatory (§4.5), so a retired code is the *expected* reason an honest person's code fails — more common than a typo. Telemetry that cannot tell the two apart cannot answer "is regenerating codes confusing people?", which is the one product question this table exists to answer. |
| Two throttling windows | per `ip_key` (roughly: >10 failures in 15 min → reject further attempts) and per `code_hash` (>5 failures in 1 hour → notify the code's owner, keep accepting). |
| **Never lock a code** | if five bad guesses disable an invitation, an attacker can deny an honest couple their one-time join for the price of five requests. Locking is applied to the *source*, never the *target*. This is the sort of "security hardening" that arrives later as a bug report. |
| No RLS policies at all | with RLS enabled and zero policies, the client can neither select nor insert. Only the redeem function writes. |
| Retention | ~100 bytes per row, unbounded. `pg_cron` is deferred by D10, so the stopgap is the redeem function deleting rows older than 30 days whenever it runs a write — cheap, no timer. §11 keeps this as an accepted loose end rather than pretending it is solved. |

### 2.5 `invitations` — hashed, shown once

D7 changed this table's shape. A code is a bearer credential, and the review decided the database may
not hold live credentials at rest. The design principle is unchanged and now sharper:
**the client may see that an invitation exists, and may never redeem one; the plaintext exists in exactly
one place — the response that creates it.**

```sql
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  code_hash       text not null,
  created_by      uuid not null references public.profiles (id) on delete cascade,
  expires_at      timestamptz not null,
  redeemed_at     timestamptz,
  redeemed_by     uuid references public.profiles (id) on delete set null,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),

  check (expires_at > created_at),
  check (redeemed_at is null or redeemed_by is not null),
  check (revoked_at is null or redeemed_at is null)
);

create unique index invitations_hash_unique on public.invitations (code_hash);
create index invitations_open_idx on public.invitations (partnership_id)
  where redeemed_at is null and revoked_at is null;
```

| Column | Purpose |
|---|---|
| `code_hash` | `sha256` of the **normalised** code — `upper()` with hyphens and spaces stripped. Normalisation is part of the hash contract: the issuer, the redeemer and the lookup must all fold the same way, or a code typed in lowercase simply fails to resolve and looks like a broken feature. |
| *no* `code` column | there is nothing to steal at rest. This is the whole point of D7. |
| *no* partial hint column | the previous draft floated showing `TLS••••••7`. Do not: an 8-character code from a 32-symbol alphabet is ~40 bits; printing 4 of the 8 characters leaves ~20 bits, about a million candidates, which is not a rate-limit problem any more. Either show the code or show none of it. |
| `expires_at` | 7 days from creation, as the UI already promises. |
| `redeemed_at` / `redeemed_by` | single-use proof. Both null and unrevoked = still open. |
| `revoked_at` | set by regeneration (§4.5). The `check` stops a row being both redeemed and retired, which would mean the lock in §4.2 leaked. |
| `invitations_hash_unique` | two live codes can never collide, so a redeem request resolves to at most one row. It also blocks an attacker who has copied a *hash* from re-using it as a fresh invitation. |
| `invitations_open_idx` | partial index so "does this partnership have a live invite?" is an index-only lookup. |

**What this table can no longer answer, on purpose.** It cannot tell you what the code was — that is the
point of D7. It still answers everything the UI needs: whether a live invitation exists
(`redeemed_at is null and revoked_at is null and expires_at > now()`), who minted it, when it expires,
and who used it. The plaintext exists only in the one response that created it, and afterwards only in
whatever the user copied or read aloud.

### 2.6 `updates`

```sql
create table public.updates (
  id              uuid primary key default gen_random_uuid(),
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  author_id       uuid not null references public.profiles (id) on delete restrict,
  mood_id         text not null check (mood_id in
                    ('happy','loved','excited','sad','tired','missing_you','peaceful','stressed')),
  message         text not null check (char_length(btrim(message)) between 1 and 280),
  photo_path      text,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz
);

create index updates_partnership_recent_idx on public.updates (partnership_id, created_at desc);
create index updates_author_idx on public.updates (author_id);
```

The `mood_id` CHECK is a hard list copied from `mood.js`. **The two must change together** — adding a
mood to the frontend without a migration turns into an insert error. §11 flags this as a coupling.

`partnership_id` is denormalised (derivable from the author). It is stored anyway because every RLS
policy and every index needs it, and deriving it means a subquery in the hot path of the only table
the app reads constantly.

`photo_path` holds a storage object key, never a URL. Today's `photo` field holds a path too, so the
shape survives — but see §7.3, because how the client turns it into a displayable image changes.

**No edit and no delete in v1 (D9 approved).** There is no update-an-edit-flow in the UI today, and no
delete affordance either, so this table has `insert` and `select` paths only — §3.2 gives it no delete
policy at all. "Keep the architecture extensible" is satisfied without speculative columns: the
foreign keys already cascade (`reactions`, and `notifications.update_id`), so a later `deleted_at`
column plus one policy is the whole cost of adding deletion. What is deliberately *not* done now is
soft-delete plumbing on every index and query for a feature nobody has asked for yet — see §11.

**`author_id` is `on delete restrict`, not `cascade` — the one place the approved decisions collide with a
Postgres default.** Deleting a user in Supabase drops the `auth.users` row, and a cascade chain follows it
straight through `profiles` into `updates`, so a deleted account would silently erase the *other*
person's history. D3 forbids that outcome, and v1 has no account-deletion flow to design around, so the
right setting is the one that fails loudly: the database refuses, and whoever is holding the console has
to make an explicit choice. When account deletion is eventually built it wants a deactivation path
(anonymise the profile, close the membership row, leave the content alone) — that is §11's open question,
not a column I add today. `reactions.user_id` keeps `on delete cascade`: a person's reaction is their own
gesture rather than a shared record, and letting it go with them keeps counts honest without rewriting
anybody's memories.

`edited_at` is nullable, unused in v1, and kept because an audit trail is cheap to reserve and
expensive to backfill once rows already exist.

### 2.7 `reactions`

Normalised, one row per person per reaction type per update. This replaces the
`{ reactionId: [userId, …] }` map, and the map is reconstructible from it with one grouped select.

```sql
create table public.reactions (
  id              uuid primary key default gen_random_uuid(),
  update_id       uuid not null references public.updates (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  reaction_id     text not null check (reaction_id in
                    ('heart','sparkle','miss','laugh','proud')),
  created_at      timestamptz not null default now(),

  unique (update_id, user_id, reaction_id)
);

create index reactions_update_idx on public.reactions (update_id);
```

`unique (update_id, user_id, reaction_id)` makes `toggleReaction` idempotent at the storage layer:
toggle-on is an insert that fails constraint `23505` if already present, toggle-off is a delete that
matches zero rows if absent. No read-modify-write, and two taps from two devices cannot produce a
double count. Allowing several reaction types per person per update matches the mock data
(`upd-01` has `heart:[ME]` and `miss:[ME]`).

Cascade from `updates` means that when update deletion eventually ships — D9 defers it, it does not
forbid it — the reaction rows go with it instead of orbiting a moment that is gone.

### 2.8 `notifications`

```sql
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  recipient_id    uuid not null references public.profiles (id) on delete cascade,
  actor_id        uuid references public.profiles (id) on delete set null,
  partnership_id  uuid references public.partnerships (id) on delete cascade,
  kind            text not null check (kind in ('reaction','checkin','milestone','connection')),
  update_id       uuid references public.updates (id) on delete cascade,
  reaction_id     text,
  title           text,
  body            text,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),

  check (actor_id is not null or title is not null)
);

create index notifications_inbox_idx on public.notifications (recipient_id, created_at desc)
  where read_at is null;
create index notifications_all_idx on public.notifications (recipient_id, created_at desc);
```

Notes on the mapping from today's shape:

- `recipient_id` is new and explicit. The mock list is implicitly "mine"; a real table must say whose.
- `read` boolean → `read_at` timestamp. Strictly more information, same `!read_at` check, and it lets
  a future "you were away for three days" feature work.
- The CHECK says a row either has a person behind it or has its own copy. That is exactly the
  distinction the UI already draws: reaction/checkin rows are *rendered* from `actorId` + `updateId`
  ([NotificationsMenu.jsx:21-31](src/components/layout/NotificationsMenu.jsx#L21)),
  milestone/connection rows carry `title`/`body`.
- `reaction_id` is left unconstrained here. It is a display hint copied from a reaction row that
  already validated it; re-checking it would mean a notification survives being wrong but not being
  self-contradictory. Flagged in §11.
- `on delete cascade` from `updates` means deleting a moment removes the notification that pointed at
  it, so the bell can never deep-link to a 404.
- The partial index serves the badge count (`unreadCount`) and the panel's default query.

**Who writes these.** Not the client directly. Triggers on `updates` and `reactions` create them
(§5.3), so a notification cannot be forged or missed, and both partners get one without either
frontend having to remember to send it.

### 2.9 `user_preferences`

One row per user, keyed by that user, so a missing row is the only possible default.

```sql
create table public.user_preferences (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  daily_reminder     boolean not null default true,
  reminder_time      time not null default '21:00',
  timezone           text not null default 'UTC'
                       check (timezone ~ '^[A-Za-z0-9_+/-]{1,64}$'),
  quiet_hours        boolean not null default false,
  partner_checkins   boolean not null default true,
  reaction_sounds    boolean not null default true,
  milestones         boolean not null default true,
  weekly_recap       boolean not null default false,
  updated_at         timestamptz not null default now()
);
```

**`timezone` lives here (approved).** IANA name — `Asia/Kolkata`, `Europe/London` — defaulting to the
browser's own zone, `'UTC'` only as the fallback if inference fails. Placing it beside the toggles that
consume it means the row that answers "when may I ping this person?" is a single primary-key read, and
it keeps `profiles` a pure identity table (§2.1).

| Detail | Decision |
|---|---|
| Where the default comes from | `Intl.DateTimeFormat().resolvedOptions().timeZone`, captured once when the preferences row is first created and stored. Never trusted per-request; it is a stored preference the user can change. |
| Validation | the CHECK is a shape guard, not an existence guard — `^[A-Za-z0-9_+/-]{1,64}$` accepts nonsense like `Not/AZone`. Real validation is one line in the client (`new Intl.DateTimeFormat(undefined, { timeZone: value })` throws `RangeError` on an unknown zone). A DB-side existence check against `pg_timezone_names` is possible in a trigger but buys little, since nothing but this app writes the column. |
| DST | free. `timestamptz` plus a named zone is exactly the combination that survives a clock change; storing an offset like `+05:30` would not. |
| Is it shared with the partner? | no. Two zones, one per row; the countdown already shows a single meeting instant, which renders correctly in each viewer's own zone. |
| UI | one new Settings row under Quiet hours, plus the existing `timezoneLabel` caption on Profile stays hand-editable. This is the only genuinely new control the approved decisions require; it belongs in the Settings group that already exists, using the current `SettingRow` shape. |

Every default is copied from `Settings.jsx:68-76`, so the first real load looks identical to today.
`reminder_time` is a `time` restricted in the app to the four options in `REMINDER_TIMES`; I would
not enforce that list in the database, since adding an option should not need a migration.

`weekly_recap` exists because the UI already has the switch. It is disabled and labelled Beta, no
recap is generated, and **no AI API is connected** — the column is a consent flag with nothing
behind it, which is the honest way to ship a consent toggle ahead of the feature.

### 2.10 `scheduled_meetings`

The brief asks for this table; today there is one scalar. The table is the better shape — a couple
plans more than one future visit — and the migration is one row.

```sql
create table public.scheduled_meetings (
  id              uuid primary key default gen_random_uuid(),
  partnership_id  uuid not null references public.partnerships (id) on delete cascade,
  starts_at       timestamptz not null,
  label           text check (label is null or char_length(btrim(label)) <= 80),
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  cancelled_at    timestamptz
);

create index meetings_next_idx on public.scheduled_meetings (partnership_id, starts_at)
  where cancelled_at is null;
```

`CountdownCard` needs "the next one", which is
`… and starts_at > now() and cancelled_at is null order by starts_at limit 1`. The partial index
serves exactly that. `starts_at` is a full timestamp because the countdown already displays hours,
minutes and seconds — a `date` would break the existing UI.

Migration: insert one row from the current `couple.nextMeeting` value. The scalar is then dropped
from the schema but **kept in the frontend contract** (§7.2) so no component changes.

### 2.11 Relationship summary

```
auth.users ──1:1── profiles ──1:1── user_preferences  (+ timezone, per §2.9)
                    │
                    │  1 OPEN membership per person (members_active_user_idx)
                    │  + any number of closed rows = history
                    ▼
          partnership_members ──N:1── partnerships
             slot 1 │ slot 2            │
        1 OPEN row   │                   ├──1:N── invitations (code_hash) ──1:N── invitation_attempts
        per slot     │                   │
        (the ceiling)│                   ├──1:N── scheduled_meetings
                    │                    └──1:N── updates ──1:N── reactions
                    │                         └──1:N── notifications (as update_id)
                    └──1:N── notifications (as recipient_id, actor_id)
```

Every child of `partnerships` carries `partnership_id`, so every RLS policy is one comparison against
one helper function. That uniformity is the point: there is no table whose access rule has to be reasoned
about separately. `invitation_attempts` carries it too, and is the one table in the design with no policy
at all — the client cannot see it, by construction rather than by convention.

---

## 3. Row Level Security

`enable row level security` on all ten tables. The client uses the publishable key only; there is no
service-role key in the browser, in the bundle, or in any file this project contains.

### 3.1 One helper, used by every policy

```sql
create or replace function public.current_partnership()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select partnership_id
  from   public.partnership_members
  where  user_id = auth.uid()
    and  left_at is null;
$$;

revoke execute on function public.current_partnership() from public;
grant  execute on function public.current_partnership() to authenticated;
```

Three properties matter:

- **`security definer`** lets it read `partnership_members` without itself being subject to
  `partnership_members`' policy. Without this, the policy on that table refers to the helper, which
  reads that table, which refers to the policy — infinite recursion, which PostgreSQL reports as a
  error, not a leak. It is still the right call to write it this way deliberately.
- **`set search_path`** pins the function's name resolution. A security-definer function without it
  is a search-path hijack.
- **Returns `null` for a user with no *open* membership**, and `null = anything` is `null`, i.e. not
  `true`. A user with no partnership — or one who unlinked last week — therefore matches no policy on a
  partnership-scoped table. Fails closed by arithmetic rather than by an explicit guard. This is the
  single place the closed-row filter does authorisation work: one clause, used by every policy, and the
  reason preserving history does not scatter `left_at is null` through the whole design.

The `select` returns at most one row because `members_active_user_idx` allows at most one open
membership per person; if that index were ever dropped this function would raise `21000 more than one
row`, which is a loud failure rather than a quiet one. That is a feature, and it is why there is no
`limit 1` here — a `limit 1` would turn "the one-space rule has been broken" into "you randomly get one
of them".

### 3.2 Policies

**`profiles`** — you and your partner, nobody else.

```sql
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or id in (
    select user_id from public.partnership_members
    where partnership_id = public.current_partnership()
      and left_at is null));

create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- no insert policy: the bootstrap trigger creates rows (§4.1)
-- no delete policy: a profile goes with its auth.users row; §2.6 explains why updates refuse that cascade
```

The `left_at is null` inside the subquery is technically redundant — `members_select` already hides
closed rows — and it is written anyway on purpose. A policy whose correctness depends on *another*
table's policy being right is the kind of coupling that survives review and dies in a refactor six
months later. Where a predicate is cheap, state it twice rather than inherit it.

`profiles_update` is `id = auth.uid()` and nothing else, **which is D2, approved**: you may edit your own
name, nickname, city and avatar; you may not edit your partner's. That means today's Profile UI is
offering something the backend will refuse — the modal titled "Edit Sparkles", and the city field wired
straight to `editPartner(partner.id, …)` at
[Profile.jsx:99-100](src/pages/Profile.jsx#L99). §7.3 item 8 removes the affordance
rather than letting the policy return a confusing error. Your partner's *display* of you is not theirs to
set, and one person renaming the other is the kind of thing that seems charming and turns into a
grievance.

**`partnerships`** — members read and edit the shared facts.

```sql
create policy partnerships_select on public.partnerships for select to authenticated
  using (id = public.current_partnership());

create policy partnerships_update on public.partnerships for update to authenticated
  using (id = public.current_partnership())
  with check (id = public.current_partnership());
-- no insert policy: created inside the signup RPC (§4.1)
-- no delete policy: nothing in v1 destroys a shared space (D3 + D12, both approved)
```

**`partnership_members`** — read the people you are *currently* with; never write this table yourself.

```sql
create policy members_select on public.partnership_members for select to authenticated
  using (partnership_id = public.current_partnership()
         and left_at is null);
-- no insert / update / delete policy at all.
```

This is the most important line in §3. Membership changes only through `security definer` paths: the
signup RPC (§4.1), the redeem function (§4.2) and the unlink RPC (§4.6). If the client could insert
here it could pick `slot = 2` in someone else's partnership — `members_active_slot_idx` would stop it
only if that slot were already occupied, which is exactly the kind of "the bug is the feature" defence
you do not want to rely on. Removing the write policy removes the question.

Two consequences of the new column, both intended:

- **Closed rows are invisible to everyone, including the person they describe.** The row that says
  "Emerson was in this space until October" is readable by no client — `members_select` requires
  `partnership_id = current_partnership()`, and a closed row by definition is not in your current
  partnership (your current partnership, per §3.1, is the open one). History is durable in storage and
  private in practice; only a `security definer` function or an operator in the dashboard can read it,
  which is the right shape for D3's "preserve, do not expose".
- **`slot` grants nothing.** Because slots are reused after a departure (§2.3), slot 1 is not "the
  founder" in any authoritative sense — it is simply the seat filled at signup. No policy, and no
  feature, may treat it as a role. `partnerships.created_by` is the provenance column if that question
  ever needs answering, and it too grants no power.

**`invitations`** — read your own; issuing, redeeming and retiring are all server-side.

```sql
create policy invitations_select on public.invitations for select to authenticated
  using (partnership_id = public.current_partnership());
-- no insert policy: issuing mints a credential, so it is `issue_invitation()` (§4.1)
-- no update policy: retiring the predecessor happens inside that same call (§4.5)
-- no delete policy: redemption history is never discarded by a client
```

With D7 in place, this policy is *safe in a way it could not be before*: the columns it exposes are
`code_hash`, two timestamps and two person ids. Nothing in the table is a credential, so a future bug in
this policy can leak the metadata of an invitation without leaking an invitation.

There is deliberately no `invitations_insert`. An earlier draft let the client mint rows and used a
counting `with check` to refuse once the couple was full; issuing now needs a cryptographic random, a
hash, and a plaintext value returned exactly once, all of which belong in a function rather than a
policy. The capacity check moved with it — `issue_invitation()` refuses a two-member space with a clean
error, and `members_active_slot_idx` stays the actual guarantee. Policies layer on top of constraints;
they never replace them.

**`invitation_attempts`** — the one table with no policy at all.

```sql
alter table public.invitation_attempts enable row level security;
-- zero policies. RLS enabled + no policies = the client selects nothing and inserts nothing.
```

Only the redeem function writes it; only an operator reads it. Absence-by-construction beats a policy
that says `using (false)`, because there is nothing for someone to "fix" later.

**`updates`**

```sql
create policy updates_select on public.updates for select to authenticated
  using (partnership_id = public.current_partnership());

create policy updates_insert on public.updates for insert to authenticated
  with check (author_id = auth.uid()
              and partnership_id = public.current_partnership());
-- no update policy: there is no edit-a-published-moment feature
-- no delete policy: D9 approved, no update deletion in v1
```

The absence of `updates_delete` is the whole of D9. Adding deletion later is one policy plus a decision
about whose posts you may delete (yours only is the obvious answer, and the storage trigger in §6.4 needs
one too), so keeping the door unlocked in the schema and closed in the policy is the extensible shape.

`author_id = auth.uid()` is the load-bearing half of the insert policy. Without it a partner could
post as the other person. The mock `publishUpdate` already stamps `authorId` from context
([DataProvider.jsx:53](src/context/DataProvider.jsx#L53)); the policy makes it
impossible to fake rather than merely unlikely.

**`reactions`**

```sql
create policy reactions_select on public.reactions for select to authenticated
  using (exists (select 1 from public.updates u
                 where u.id = reactions.update_id
                   and u.partnership_id = public.current_partnership()));

create policy reactions_insert on public.reactions for insert to authenticated
  with check (user_id = auth.uid()
              and exists (select 1 from public.updates u
                          where u.id = reactions.update_id
                            and u.partnership_id = public.current_partnership()));

create policy reactions_delete on public.reactions for delete to authenticated
  using (user_id = auth.uid());
-- no update policy: toggle is delete + insert
```

The `user_id = auth.uid()` on both insert and delete is what stops one partner clearing the other's
reactions.

**`notifications`**

```sql
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = auth.uid());

create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid()              -- cannot reassign
              and actor_id is not distinct from notifications.actor_id
              and kind     is not distinct from notifications.kind
              and update_id is not distinct from notifications.update_id);

create policy notifications_delete on public.notifications for delete to authenticated
  using (recipient_id = auth.uid());
-- no insert policy: triggers create these (§5.3)
```

`notifications_select` is `recipient_id = auth.uid()` and *nothing else* — not partnership-scoped.
**This is D5, approved:** your partner's unread state is not visible to you, and neither is your inbox
visible to them. The consequence to remember is that a future "Sparkles hasn't opened your update in
four days" feature cannot be built on this table as designed — it would need either a deliberate
relaxation or a separate read-state table. Flagged now so the choice is made on purpose later, not
under deadline pressure.

The update policy's `is not distinct from` clauses are the substance of "mark as read is the only
write a client may make". A bare `recipient_id = auth.uid()` would let a recipient rewrite a
notification's text. `markAllNotificationsRead` becomes an update that sets `read_at` on every
matching row, which this permits.

**`user_preferences`**

```sql
create policy prefs_select on public.user_preferences for select to authenticated
  using (user_id = auth.uid());
create policy prefs_upsert on public.user_preferences for insert to authenticated
  with check (user_id = auth.uid());
create policy prefs_update on public.user_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Not partnership-visible. Your reminder time, your quiet-hours switch and your timezone are yours — they
are the three inputs a scheduler needs, and none of them is couple data. Your partner sees neither your
zone nor your toggles. If a future feature wants "notify me when my partner is awake", that is a new
decision about exposing `timezone`, not a query change.

**`scheduled_meetings`**

```sql
create policy meetings_select on public.scheduled_meetings for select to authenticated
  using (partnership_id = public.current_partnership());
create policy meetings_insert on public.scheduled_meetings for insert to authenticated
  with check (partnership_id = public.current_partnership()
              and created_by = auth.uid());
create policy meetings_update on public.scheduled_meetings for update to authenticated
  using (partnership_id = public.current_partnership());
create policy meetings_delete on public.scheduled_meetings for delete to authenticated
  using (partnership_id = public.current_partnership());
```

Symmetric on purpose: either partner plans and either cancels. Today's UI has one shared date field
editable by both, so this preserves behaviour rather than inventing a rule.

### 3.3 What an unrelated — or former — user can see

| Who | `current_partnership()` returns | Result |
|---|---|---|
| someone with no membership at all | `null` | every `partnership_id = null` comparison is `null`, i.e. not `true` → zero rows on `partnerships`, `partnership_members`, `invitations`, `updates`, `reactions`, `scheduled_meetings` |
| a **former** member (only closed rows) | `null`, because §3.1 filters `left_at is null` | identical to the row above. Their own history is not readable by them either — D3 preserves the data for the *remaining* member, it does not keep a departing member inside the space |
| a brand-new account (one open row) | its own partnership id | their own space: no updates, no partner, one live invitation. This is the D-approved "initially one member" state, and it is reachable through every read path without a special case |
| either of the above, guessing at people | — | `profiles` yields nothing: they are not you and not your partner |
| anyone, anywhere | — | `notifications` and `user_preferences` are keyed to `auth.uid()`; `invitation_attempts` has no policy at all |

The one place a stranger can still learn something is `profiles`: a guessing client can issue the query
and receive an empty set, which is a different response from an error, and so confirms that a given uuid
exists. That is a user-enumeration surface inherent to any public-ish id space, and it is not worth
contorting the schema for a product where signup is by email link rather than by username. If it ever
matters, it is fixed by making `profiles_select` require a membership row for *both* sides, not by
adding a table.

### 3.4 The active-membership audit

Your third standing requirement was phrased as a rule, not a preference: *every partnership data access
policy checks active membership, not historical membership alone.* It is worth stating as an invariant
because it is the one place where D1's history and D3's preservation could quietly rot into a privacy bug
— a departed member keeps reading a space they left.

**The invariant:** no policy on any partnership-scoped table may reference `partnership_members` without
either going through `current_partnership()` or carrying `left_at is null` itself.

The reason that is cheap to hold is §3.1: eleven of the fifteen policies in §3.2 resolve the space through
one function, and that function's single `where` clause is what makes them all active-only. Auditing them
is therefore a grep, not a reading exercise.

| Policy | How it checks |
|---|---|
| `partnerships_select`, `partnerships_update` | `id = current_partnership()` |
| `members_select` | `partnership_id = current_partnership()`, **and** `left_at is null` written twice on purpose |
| `profiles_select` | subquery over `partnership_members` with its own `left_at is null` — does not inherit `members_select` |
| `invitations_select`, `updates_select`, `updates_insert`, `meetings_*` (four) | `partnership_id = current_partnership()` |
| `reactions_select`, `reactions_insert` | `exists` over `updates`, which is itself `current_partnership()`-scoped |
| `notifications_*`, `prefs_*` | keyed to `auth.uid()` — not partnership-scoped at all, so the question does not arise |
| `invitation_attempts` | **no policy**, therefore no read path |

Two of those rows deserve a note rather than a tick. `members_select` is the only table where a closed row
*is* the subject matter, and it still refuses to show one (§3.2) — history is durable, not readable, which
is exactly D3's "preserve, do not expose". `profiles_select` is the only policy that reads
`partnership_members` directly, so it repeats the predicate instead of trusting another table's policy.

**The 3B exit test for this rule** is the one I would not let slip: after an unlink, the departed account
must select zero rows from `updates`, `reactions`, `invitations`, `scheduled_meetings` **and** the ex-partner's
`profiles` row, in a single scripted run. The mechanism is one function; the *proof* is that the function
returns `null` for a person whose only row is closed (§3.3, row 2).

### 3.5 Email verification (D14 approved)

"Require verified email before creating or accepting a partnership invitation" has a specific meaning here
that is easy to under-read: it is not about spam, it is about the invitation being a **bearer credential to
someone's private photographs**. An unverified address can be typed without being owned, so without this
rule a signup can claim an address, hold the invite code hostage, or redeem one into a space it has no
claim to. Verification closes the cheapest version of both.

The check needs a privilege the client does not have — confirmation state lives on `auth.users`, which the
`authenticated` role cannot select — so it goes in one more `security definer` helper, next to the other:

```sql
create or replace function public.email_is_verified()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(u.email_confirmed_at, u.confirmed_at) is not null
  from auth.users u
  where u.id = auth.uid();
$$;
revoke execute on function public.email_is_verified() from public;
grant  execute on function public.email_is_verified() to authenticated;
```

Three honest details in those eight lines:

- **`coalesce(email_confirmed_at, confirmed_at)`** because Supabase renamed the column and older projects
  still carry the old name. The *contract* is: read whichever name exists, and if neither does fail loudly
  at migration time rather than quietly treating nobody as ever verified.
- **`coalesce(…, false)`** is deliberately absent: a user with no `auth.users` row gets `null`, and `null`
  in a policy or a `if` is not `true`. Fails closed the same way `current_partnership()` does.
- **`stable`** because it reads nothing that changes within a transaction, and it is called per policy
  evaluation, so the planner may cache it.

**As built in 3B-1, this is the one place the migration differs from the block above.** The body cannot be
a single static SQL statement: a `language sql` function is parsed and its column references resolved at
`CREATE FUNCTION` time, so naming *both* columns requires *both* to exist — and a current Supabase project
has only `email_confirmed_at`. Written literally, the function above fails to create on exactly the
projects the `coalesce` was there to protect. `20261101000500_authorisation_functions.sql` therefore reads
`pg_attribute` for whichever of the two names this project has, assembles the body with `format()` from
that catalog result, and raises if the list comes back empty. Both properties above survive; the
`undefined column` failure mode is replaced by an explicit `raise exception` that says what is wrong.
Nothing user-controlled reaches the executed string — the only two names it can ever pick are literals in
the `in (…)`, and it is a `DO` block, not a view of arbitrary input.

Where it is enforced — and this is the part that must not be a frontend check:

1. **`bootstrap_space()` refuses** (step 0 of §4.1) unless the caller's email is verified. No space, no
   seat, no preferences row, no invitation.
2. **`accept_invitation()` refuses** (before the code is even looked up, §4.2) — an unverified account
   cannot join a couple's space whatever code it holds. Refusing *before* the lookup also means the
   attempts table records `unverified_email` rather than burning a `code_hash` match.
3. **`issue_invitation()` refuses**, which is the same rule as 1 arriving late: a space that somehow exists
   without verification should not be handing out credentials.

A `security definer` function is the enforcement point, **not** the signup button. That distinction is the
whole value of the rule: if the check lived in `AuthProvider`, anyone with a valid JWT from any other path
would walk straight past it.

**What D14 changes about the signup flow** is the more interesting consequence, and it is a UX fact rather
than a schema one. With "Confirm email" enabled in Supabase, `signUp()` returns a user object and **no
session** — the user cannot be authenticated until they click the link. So the space is not created at
signup; it is created on the first authenticated session *after* the click. §4.1 is written for that, and
`/signup`'s existing redirect to `/app/connect` ([App.jsx:69](src/App.jsx#L69))
gains one intermediate state: "check your inbox". The app already has no such screen, so this is §7.3
item 11's real work, not a one-line config change.

---

## 4. Invitation workflow

### 4.1 Signup: creating the space, alone

Five writes must be atomic. The profile row, the space, the founder's seat, the preferences row that
carries the browser timezone, and the first invitation. A user with a profile but no space sees an empty
app; a space with no slot-1 member is an invitation pointing at nothing.

```
signUp(email, password)      [client also reads its own IANA zone here and passes it]
  → Supabase creates auth.users row and sends the confirmation mail
  → NO SESSION YET (D14). The client shows "check your inbox" and stops.
  → user clicks the link; Supabase sets email_confirmed_at and the app gets a real session
  → on first authenticated session: trigger on_auth_user_insert has already created the profiles row
  → RPC bootstrap_space(p_timezone text)                               (security definer)
      0. if not public.email_is_verified() then raise 'email_not_verified'   → nothing is written
      1. if p_timezone !~ '^[A-Za-z0-9_+/-]{1,64}$' then p_timezone := 'UTC'
      2. insert into partnerships (created_by) values (auth.uid())                     → pid
      3. insert into partnership_members (partnership_id, slot, user_id)
           values (pid, 1, auth.uid())          ← ONE open member. Valid, expected, not provisional.
      4. insert into user_preferences (user_id, timezone) values (auth.uid(), p_timezone)
      5. revoke the space's stale open invitations, then mint a fresh one (§4.5)
         → returns { code: 'TLSH-4827' }  — the plaintext exists only in this response
```

Four things this shape gets right:

- **Nothing has to be true about the second person.** Step 3 leaves the space with one member and the
  flow still succeeds, which is the §2.3.2 distinction working as intended: the ceiling is a constraint,
  completion is a count.
- **Double-signup is stopped by the index, not by an `if`.** A second call to `bootstrap_space` tries to
  open a second membership row for the same person; `members_active_user_idx` rejects it with `23505`
  and the whole transaction rolls back. A defensive check inside the function would be nicer error text
  and no extra safety, which is why the safety is not placed there.
- **The space is created after verification, not before.** This is D14's actual cost: the write set moves
  from "at signup" to "at first verified session", so the call now has two possible triggers (`/signup`
  landing, and any later session start) and a duplicate becomes an *expected* outcome rather than a bug.
  The index stays the guarantee; step 0 is the reason it can be reached twice. The client treats a
  `23505` here as "you already have a space — go to it", and the function's duplicate branch returns
  `{ already: true, code: null }`. `code: null` is not a shortfall: under D7 the plaintext was never
  retrievable, so a second call *cannot* honestly produce one, which is precisely why Connect shows
  "live until <date>" plus a generate button rather than the code (§7.3 item 1).
- **An unverified account cannot get a space, a seat, or a credential** — and the same three refusals
  apply to `issue_invitation()` (§4.5) and to redemption (§4.2), so the rule is not a door with an open
  window beside it.

`/signup` already redirects to `/app/connect`
([App.jsx:69](src/App.jsx#L69)), which is the right destination *after* verification —
"your space exists, now invite someone". Under D14 it is no longer the right destination *immediately*:
the first session does not exist yet, so the route needs one intermediate state ("check your inbox", with
a resend action) before it reaches Connect. That is a page-state change inside the existing routes, not a
new route, and §7.3 item 11 carries it.

**The code is generated inside the function, from the database's own randomness.** Two independent
reasons. First, `Math.random()` in a browser is not a cryptographic source, and the 32-symbol alphabet
only yields its nominal ~40 bits if the generator is unbiased
([DataProvider.jsx:14-21](src/context/DataProvider.jsx#L14) currently uses exactly
that, which is fine for a mock and not fine for a credential). Second, under D7 the plaintext must never
be sent *to* the database — it is created there, hashed there, and the hash is what the row keeps, so a
client-side generator would have to send the secret to be hashed anyway.

### 4.2 Redeeming: the Edge Function

`POST /functions/v1/accept-invite` with `{ code }`, authenticated by the caller's own user JWT. The
function is deliberately thin: it exists because it is the only place that can see the caller's IP
address, which is what D4's rate limit needs. It holds **no privileged key** — every write happens
inside one `security definer` RPC, so there is no service-role secret to store, ship or leak.

```
1. verify caller JWT                                  → uid
2. if not public.email_is_verified()                  (D14)
     → log 'unverified_email', return 403             ← before the code is looked up at all
3. ip_key = sha256(client ip + today's date)
4. count recent failures for ip_key in invitation_attempts
     over threshold → log 'throttled', return 429
5. normalise the submitted code: upper(), strip '-' and spaces
   h = sha256hex(normalised)
6. select * from invitations
     where code_hash   = h
       and redeemed_at is null
       and revoked_at  is null
       and expires_at  > now()
     for update                                       ← row lock
7.   no row? log 'invalid_code', commit, return 404
     -- step 6 filtered expired / revoked / redeemed rows out, so a miss here has four possible reasons
     -- and only one of them is a lie. A second, index-only lookup by hash decides which, and the UI is
     -- told the difference — "that code expired, ask for a new one" is the difference between a solved
     -- problem and a support email. What is never distinguished is a hash that does not exist at all:
     -- every non-existent code answers identically, so the response cannot be used to confirm a guess.
     -- (The enumeration risk of the other four is nil in practice: a redeemed or expired code grants
     -- nothing even when its existence is confirmed, and an active one is never in this branch — it
     -- succeeds, which is the only outcome worth attacking for.)
8.   exists (select 1 from partnership_members
             where user_id = uid and left_at is null)?
     → log 'already_in_a_space', return 409
9.   find the vacant seat:
     select s from generate_series(1,2) s
     where not exists (select 1 from partnership_members m
                       where m.partnership_id = inv.partnership_id
                         and m.slot = s and m.left_at is null)
     limit 1
   no vacant seat? → log 'space_full', return 409
10.  insert into partnership_members (partnership_id, slot, user_id, invited_by)
     values (inv.partnership_id, seat, uid, inv.created_by)
     ← if a concurrent redemption already took that seat, this raises 23505 and this
       transaction loses. That is the designed outcome, not an accident.
11.  update invitations set redeemed_at = now(), redeemed_by = uid where id = inv.id
12.  insert notifications, kind='connection' — one for the person who waited, one for the joiner
13.  log 'joined', commit
14.  return { partnershipId, slot: seat }
```

Steps 6–12 are a single `security definer` function; the Edge Function wraps it to add the IP-aware
throttle and to translate Postgres errors into the handful of codes the UI can render (§7.3 item 4). The
telemetry write in step 4/7/13 is inside the same definer function, because the client has no insert path
to `invitation_attempts` (§3.2).

**Step 2 is before step 5 on purpose.** Checking verification after hashing would mean an unverified caller
can still exercise the code-lookup path — the one thing D14 exists to prevent — and it would let the attempts
table record a `code_hash` for a person who should never have reached it. Ordering the cheap, caller-owned
check first also keeps the expensive `sha256` + indexed lookup off the path of the two refusals that need
neither.

**Note step 9, not "insert into slot 2".** The seat is *derived*, which matters now that seats are
reusable. Normal case: founder holds seat 1, joiner takes seat 2. But if the **founder** is the one who
unlinked and the remaining partner issues the next invitation, the vacant seat is 1. Code that hardcodes
"the joiner is always slot 2" silently encodes the old permanent-key model, and it fails only in the
re-link case — the one nobody demos. Asking which seat is empty is the same amount of work and is
correct in both.

### 4.3 The four attacks, answered one at a time

**"A third person joins an existing partnership."** Impossible at the storage layer. Step 9 must pick a
seat; `check (slot in (1,2))` offers two values and `members_active_slot_idx` permits one open row per
value, so the insert either fails on the index or fails on the CHECK. This holds if step 8 is deleted, if
the function has a bug, or if someone writes the table by hand in the dashboard console. The function's
check exists to return a *nice error*; the index exists to make the state unrepresentable. Defence in
depth means the constraint gets the last word, and it does.

**"An invitation is accepted twice."** Step 10 sets `redeemed_at`, and step 5 filters on
`redeemed_at is null`. The second attempt finds no row → 404. And because step 5 locks the row, the two
attempts cannot both sit in step 5 at once. Under D7 there is a second reason it cannot happen: a replay
of a captured request carries the same `code_hash`, so it hits the same locked row and the same dead end
— the hash being stable is what makes it usable as a lookup key at all.

**"Two people claim the same invitation simultaneously."** This is the interesting one, and it is why
step 5 says `for update`. Both transactions reach step 5; the first acquires a row lock on the
invitation; the second **blocks** on that same lock rather than reading a stale `redeemed_at is null`.
When the first commits, the second resumes, re-evaluates its predicate against the now-committed row
(`redeemed_at` set under read committed, or a retry under repeatable read) and exits at step 6. Exactly
one winner.

And if the locking were somehow wrong, step 9 still has to satisfy `members_active_slot_idx` — two open
rows in the same partnership and the same seat means one PostgreSQL error. Locking gives a clean 404;
the index gives correctness. Both are present because they do different jobs. Note that swapping the
primary key for a partial unique index (§2.3) did **not** weaken this: the uniqueness check is the same
btree machinery, and the predicate only decides which rows take part in it.

**"A user accesses another couple's private data."** Every read goes through
`partnership_id = current_partnership()`, derived from a table the client cannot write and which returns
`null` for anyone whose only rows are closed. There is no policy anywhere that accepts a partnership id
supplied by the request. Enumerating an update UUID gets you zero rows, because access is established by
membership, not by the identifier. The one value a client does supply — the invitation code — is not an
authorisation, it is a capability to fill exactly one vacant seat in one space; it expires, it works
once, it is stored only as a hash, and every failed attempt against it is recorded against the caller's
address rather than against the code (§2.4).

### 4.4 The hashed code, and what it actually costs

D7 approved the textbook shape: store only a hash, show the plaintext once, and make regeneration the
recovery path. It is worth stating precisely what that buys and what it does not, because "we hash the
code" is the kind of sentence that gets written and then assumed to be a complete answer.

**What the UI loses, and why it is survivable.** The Connect screen today shows the live code
persistently and invites you to read it aloud
([Connect.jsx:89-99](src/pages/Connect.jsx#L89)). Under D7 it shows the code
**once**, in the moment it is minted, with copy and "read this out now" affordances; after that the
screen shows only "an invitation is live, expires in N days" and a "Generate a new code" button. That is
region 9 of wireframe 06, and it is a real visible change — §7.3 item 1. If the code is lost, the
recovery is one click and costs the couple nothing except re-sending it.

**What the hash resists.** An 8-character code over a 32-symbol alphabet is 32^8 ≈ 2^40 — about a
trillion. That is comfortably unguessable *online* under D4's rate limit, and it is **not** unguessable
*offline*: SHA-256 is fast, so someone holding a dumped `invitations` table can grind candidates. The
difference is what hashing is for:

| Table leaks | plaintext `code` column | hashed `code_hash` column |
|---|---|---|
| Attacker outcome | instantly holds every live invitation, i.e. the ability to join every not-yet-complete couple | must brute-force each still-open ~40-bit code, one row at a time, with no way to tell a near-miss from a miss |
| Rows worth attacking | all of them | only `redeemed_at is null and revoked_at is null and expires_at > now()` — at most one per couple |

That is a genuine improvement and it is not a total one, which is why D4 (rate limiting) and the 7-day
expiry are part of the same decision rather than extras.

**The two levers if this ever needs more.** A server-side pepper (HMAC with a secret) would make offline
grinding require the secret too, but it cannot be rotated without invalidating every live invitation and
it adds a credential to manage — not worth it at this scale, and explicitly not chosen. The cheap lever
is length: a 12-character code in three groups is ~2^60 and needs only a generator change plus the input
mask, no schema change and no new secret. If this table ever grows a second use, take that one first.

**One rule the design does not bend:** no partial hints. Not `TLS••••••7`, not "the code starts with
your initials". Revealing 4 of 8 characters leaves ~20 bits, and 2^20 is a Tuesday for an offline
attacker — a hint column would undo the hashing while looking like a courtesy.

### 4.5 Issuing and rotating

`issue_invitation()` is the only path that creates an invitation row (§3.2 gives the client no insert
policy) and it always rotates:

```
1. refuse if the caller's email is unverified (D14) → 'email_not_verified'
2. refuse if the space already holds two open members  → clean error, not a crash
3. update invitations set revoked_at = now()
     where partnership_id = X and redeemed_at is null and revoked_at is null
4. generate a code from database randomness, normalise, hash
5. insert into invitations (partnership_id, code_hash, created_by, expires_at)
     values (X, h, auth.uid(), now() + interval '7 days')
6. return { code }        -- the plaintext leaves here and exists nowhere else
```

Rotation is not optional *inside* the function. If step 3 were skipped, two codes would be live at once
and the sentence the UI already tells users — "Generating a new code retires the old one immediately"
([Connect.jsx:112-114](src/pages/Connect.jsx#L112)) — would be false. Today
`regenerateInvite` mints a code and leaves the old one in place
([DataProvider.jsx:88-95](src/context/DataProvider.jsx#L88)); the backend is what
makes the copy true. Steps 3 and 4 being one call is also why the provider has one method for both
"first code" and "replacement code".

Step 3 also has a privacy consequence beyond tidiness: an invitation belonging to a space that has just
changed shape should not outlive the change, so `unlink_partnership()` (§4.6) calls the same rotation
logic rather than leaving a stale seat available to whoever happens to have the old code.

### 4.6 Unlinking (D3 approved)

`unlink_partnership()` — `security definer`, callable by any open member, and the only way a seat ever
empties in v1:

```
1. update partnership_members set left_at = now(), left_reason = 'unlinked_by_self'
     where user_id = auth.uid() and left_at is null;          -- exactly one row: mine
2. revoke the space's live invitation (a code to a seat that just changed shape)
3. insert notifications, kind='connection' for whoever remains
4. return { remainingMembers }
```

Nothing here deletes an update, a reaction, a photo, a meeting or a partnership row. `partnerships` has
no delete policy (§3.2) and `updates` none either (D9), so "unlinking does not destroy history" is a
property of the grant set, not a promise in a comment. The departing member simply stops resolving a
`current_partnership()` — their closed row grants nothing (§3.1) — and the remaining member keeps every
row the couple made. A later "Delete my space" is a different, destructive operation, and D12 has now
decided it does not exist in v1 (§11).

**The one thing this settles and one it does not.** It settles that the actor is the one who leaves,
because D3's own words are "the departing member" and "the remaining member". It does not settle the
copy: today's confirmation is titled "Unlink Sparkles" and says "you will not see theirs"
([ConfirmUnlink.jsx:17-30](src/components/couple/ConfirmUnlink.jsx#L17)), which
reads like a mutual dissolution. Under the approved rule the honest label is closer to "Leave this
space" — a wording change in one component, listed in §7.3 item 9 and flagged in §11 rather than
silently applied.

---

## 5. Realtime

### 5.1 What to publish

```sql
alter publication supabase_realtime add table public.updates;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.partnership_members;
```

Nothing else. `profiles` and `partnerships` change rarely and are read on navigation; `invitations` must
not be broadcast — under D7 it no longer carries a live code, but a subscription on it would still be a
way to watch another couple's signup and rotation activity, which is a fact about them;
`user_preferences` is single-reader by construction (and now holds a timezone, which is nobody else's
business either — §3.2); `scheduled_meetings` drives a countdown that already ticks client-side every
second ([CountdownCard.jsx:22](src/components/couple/CountdownCard.jsx#L22)) and
only needs a refetch on the write that changed it.

`partnership_members` is published for one event and needs the other two ignored: a publication is
per-table, so the client subscription filters to `INSERT` (§5.2). Unlinking is an `UPDATE` on a row that
immediately stops matching your own select policy, so it is never delivered — which is correct, and is
why §4.6 writes a notification instead of relying on the socket.

**Realtime respects RLS**, so a `postgres_changes` subscription delivers only rows the subscriber may
select. That is the property that makes broadcasting `reactions` safe: you receive your partner's
reactions on your updates, and nothing from any other couple. It requires the policies in §3 to be
right, which is another reason they are partnership-scoped rather than id-scoped.

### 5.2 Per-feature design

| Feature | Mechanism | Latency budget |
|---|---|---|
| Partner posts an update | `INSERT` on `updates` → prepend to the timeline, light the "New" chip on Dashboard region 5 | instant |
| Partner reacts | `INSERT`/`DELETE` on `reactions` → recount that update's chips | instant |
| Bell badge | `INSERT` on `notifications` → increment `unreadCount` | instant |
| Countdown to a new meeting | no channel; refetch on the mutation | n/a |
| "Your partner joined" — waiting member | `INSERT` on `partnership_members` (`new.partnership_id` = my space) → refetch the space once; `connection.status` re-derives to `connected` (§2.3.2) | ~1 s |
| "Your partner joined" — the joiner | the accept-invite response; no subscription needed | instant |
| "Your partner left" | **no membership event arrives** — the updated row has `left_at` set, so it no longer matches the subscriber's `members_select` and Realtime correctly withholds it. §4.6's `notifications` insert is the signal instead | ~1 s |

The last row is the interesting one, and it is not a defect. Realtime evaluating RLS means a person who
has just lost access cannot be told what they lost access to through the channel they were authorised on.
The remaining member still learns it, because §4.6 writes to *their* inbox and they can always read their
own notifications. Same event, two correct paths, and no code that has to remember which rows are safe to
send to whom.

Reactions need both `INSERT` and `DELETE` events because toggle is modelled as those two operations
(§2.7). Subscribing only to inserts would leave a stale count after your partner un-reacts — the
exact class of bug where the data is right and the screen is not.

### 5.3 Notification fan-out is a trigger, not a client job

If the client wrote notifications, your partner's badge would depend on *your* browser staying open,
and a notification could be forged against someone else. Instead:

```
after insert on updates     → notify the other OPEN member (kind='checkin', update_id=new.id)
after insert on reactions   → notify the update's author (kind='reaction', reaction_id, update_id)
```

"Other member" in the first line means *other open member* — the trigger resolves the recipient through
the same `left_at is null` filter the policies use (§2.3.1). A trigger that forgets that predicate will
faithfully deliver a departed person's notifications to a person who no longer has a space, and nothing
in the schema will complain.

The two `kind='connection'` rows are different: they are written by §4.2 and §4.6 themselves, not by a
trigger, because they describe a *transition* between states rather than a fact visible in one row.

Both trigger functions are `security definer`, because the inserting user has no insert policy on
`notifications` by design. They must skip the self case — an author cannot notify themselves, and
`reactions` on your own update is already blocked in the UI by `UpdateReactions`'s rule that your own
card shows a summary rather than buttons.

Milestone notifications ("34 days until you see Sparkles", `kind='milestone'`, `actor_id` null) come
from a scheduled job, not a trigger — Supabase's `pg_cron` or a scheduled Edge Function. **D10 approved
as deferred**, so in the shipped v1 these simply do not arrive; nothing else in the app is degraded and no
column exists in anticipation. This remains the only place in the design that needs a timer.

### 5.4 The one thing Realtime will not do for you

It is not a queue and not a source of truth. A client that misses events while backgrounded must
resync on reconnect — Supabase emits a reconnect signal; the handler refetches the timeline and the
inbox. Building the UI as "subscription appends to a fetched list" rather than "subscription *is* the
list" keeps that recovery trivial.

---

## 6. Storage

### 6.1 Two buckets, both private

| Bucket | Contents | Visibility | File-size limit |
|---|---|---|---|
| `update-photos` | one image per update | private | 10 MB — matches the copy the UI already shows |
| `avatars` | one per user | private | 5 MB — rendered at 96 px at most (§6.5) |

Separate, as the brief suggests, because the two have different lifecycles and different cardinality.
An update photo is permanent, one-per-row, and deleted with its update. An avatar is mutable,
one-per-*user*, and replacing it must delete the predecessor or you accumulate orphans forever. A
shared bucket with a folder convention gets the deletion rule wrong eventually.

Private for both. A public bucket makes every URL a bearer capability: anyone who has the link sees
the photo forever, and links leak through chat history, browser prefetch and screenshot tools. These
are photographs of one person's face and their partner's handwriting. The whole product promise is
"built for one couple, no feeds, no followers" ([Landing.jsx](src/pages/Landing.jsx))
— public storage contradicts it for the price of a few milliseconds per page load.

### 6.2 Paths carry the authorisation

```
update-photos/{partnership_id}/{author_id}/{update_uuid}.{ext}
avatars/{user_id}/{revision_uuid}.{ext}
```

The partnership id is the first path segment, so a storage policy is a prefix comparison and the
object's location *is* its ownership. The `update_uuid` is generated client-side before upload, which
lets the insert and the object refer to the same id and makes a retried upload idempotent rather than
duplicative.

The `revision_uuid` under `avatars` exists so that changing an avatar is upload-then-delete rather than
overwrite: the new object is written, `profiles.avatar_path` is repointed, and only then is the old
revision deleted. Overwriting in place would let a failed upload leave the row pointing at a half-written
file, and a signed URL minted for the old path would then serve the new picture. The cost is a transient
orphan between the two steps, which is why the delete policy below covers `avatars` as well as photos —
cleanup is the client's own privilege, not a sweep.

### 6.3 Policies

```sql
create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'update-photos'
         and (storage.foldername(name))[1] = public.current_partnership()::text);

create policy photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'update-photos'
              and (storage.foldername(name))[1] = public.current_partnership()::text
              and (storage.foldername(name))[2] = auth.uid()::text);

create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'update-photos'
         and (storage.foldername(name))[1] = public.current_partnership()::text
         and (storage.foldername(name))[2] = auth.uid()::text);
-- avatars: same three, bucket_id = 'avatars', foldername[1] = auth.uid()
```

Segment 2 pinned to `auth.uid()` on write means you cannot deposit a file into your partnership under
your partner's name, which matters because the delete policy trusts that same segment.

### 6.4 Signed URLs — 15 minutes (D8, as changed)

`createSignedUrls(paths, 900)` — the plural form, one request for the whole batch. The flow: fetch the
timeline (rows carry `photo_path`), collect the non-null paths, request signed URLs for all of them in a
single call, then render.

The earlier draft recommended an hour. Fifteen minutes is what was approved, and it changes the refresh
logic rather than the architecture:

| | 1 hour | 15 minutes (this design) |
|---|---|---|
| Leaked-link window | 60 min | 15 min |
| Refreshes per typical session | ~1 | ~4, or ~1 per return-to-the-app |
| Batch calls for a 16-photo timeline | 1 | 1 — the count does not scale with images, only with refreshes |
| Failure mode if refresh is forgotten | rare | guaranteed, on a tab left open through a meal |

Two rules make 15 minutes feel like nothing, and both belong in the provider rather than a component:

1. **Re-sign on visibility, not on a timer.** When the document becomes visible again, if the cached
   URLs are older than ~12 minutes, refetch the batch for the rows currently in memory. No interval, no
   background polling, no battery cost while the app is shut.
2. **Re-sign once on image error, then stop.** An expired URL surfaces as a broken `<img>`. One retry per
   path, and if it fails again the card shows the existing no-photo fallback rather than looping. The
   second half of that rule is the important half: a naive retry-on-error against an authority problem
   becomes a request loop.

What an already-painted `<img>` does **not** need is refreshing — expiry bites only on a new request, so
a photo the user is looking at stays on screen. What does bite is lazy-loaded imagery: an
`loading="lazy"` card scrolled into view after 20 minutes requests a dead URL. Either sign the visible
window generously (rule 1 covers it) or drop `loading="lazy"` from `MemoryCard`; §7.3 item 6 records
this as a decision to check during 3E rather than discover in production.

`PhotoCard` and `MemoryCard` take `update.photo` as a string today
([PhotoCard.jsx](src/components/updates/PhotoCard.jsx)), so the *component*
contract survives — the provider resolves paths to URLs before handing rows to the page. That is the one
genuinely new thing `DataProvider` does, and it is why §7.1 can promise that no component ever has to
know a signed URL exists.

**Avatars are the same problem, at a smaller size.** `profiles.avatar_path` is a private object in the
`avatars` bucket (§6.2), so `Avatar`'s `src` cannot be the stored value either — it needs a signed URL too,
and it is subject to the same two rules above. The batch is at most two paths instead of sixteen, and the
rendering sites are persistent rather than scrolled (`AppShell`, `AccountMenu`, `PhotoCard`'s author line),
so the failure mode of forgetting this is a header avatar that breaks on a long-lived tab. It is one
resolution step in the provider, not a new mechanism.

**Deletion.** Three paths are worth naming; in v1 only one of them deletes anything.

- **Update deleted → cannot happen in v1** (D9 approved). When it does ship, the object must go with the
  row via a `before delete` trigger rather than a sweep: a sweep leaves a window where an orphaned photo
  is billed and unreachable, and a trigger is a normal pattern from a security-definer context.
- **Unlinking → delete nothing (D3 approved).** Both people made the shared history; one leaving does not
  erase the other's. The partnership and its updates stay, the departed member simply loses
  `current_partnership()` and therefore loses access, and §4.6 is a single `UPDATE` on one membership row
  rather than a cascade with a side of guilt. Storage objects are untouched.
- **Space deletion → does not exist in v1 (D12 approved).** "Do not implement permanent partnership
  deletion in v1. Preserve shared history." There is therefore no delete policy on `partnerships`, no
  client path that can reach one, and no storage sweep. The Settings control that promised this is removed
  (§7.3 item 12) rather than left pointing at something else.
- **Account deletion → out of v1 by decision (D13 approved), and when it ships it is a designed
  conversation, not a cascade.** The contract he set is: explicit confirmation, a clear statement of the
  consequences, and *never* silently deleting the other partner's shared memories. §2.6 already enforces
  the last clause structurally — `on delete restrict` on `updates.author_id` means dropping a user from the
  dashboard fails loudly instead of quietly removing that person's partner's history — and storage needs
  the same thinking, since Supabase does not cascade into `storage.objects` at all. Two questions that
  bullet does not answer, and must before it is built: what happens to the *partnership* when one of its
  two people is deleted (the space keeps existing with one member, exactly as after an unlink, is the
  obvious shape), and what "anonymise" means for rows the other person still reads. Nothing is blocked by
  the gap: there is no delete-my-account flow to build in v1.

### 6.5 Size and type validation

Client-side already: `accept="image/*"`, `type.startsWith('image/')`, 10 MB
([PhotoUploader.jsx:4,22-27](src/components/updates/PhotoUploader.jsx#L4)).
That is a courtesy; it is trivially bypassed by any HTTP client. Server-side needs its own:

- Bucket file-size limit set to 10 MB, matching the copy the UI already shows ("JPG or PNG, up to
  10 MB") so the promise and the rule agree.
- Allowed MIME list on the **bucket**: `image/jpeg`, `image/webp`, `image/png`. HEIC is admitted at the
  *file input* and re-encoded to JPEG before it reaches storage, so the bucket never holds a format most
  browsers cannot draw.
- **A re-encode step is mandatory, not a nicety (D6 approved).** A phone photo carries GPS coordinates
  in EXIF, and this is an app about where two people are; it also neutralises a polyglot file (valid JPEG
  header, executable payload) and cuts storage cost. Two places do it, for different reasons:

  1. **Client, before upload:** `createImageBitmap(file, { imageOrientation: 'from-image' })` → draw to
     canvas → `canvas.toBlob('image/jpeg', 0.85)`. A canvas cannot emit EXIF, so the coordinates never
     leave the device and the upload does not carry them either. Applying orientation *while* decoding is
     the trick that keeps the photo the right way round once the metadata is gone — discard orientation
     first and every camera shot lands sideways.
  2. **Server, after upload:** a bucket `onAfterUpload` transform that re-encodes again. This has to
     exist because step 1 is a courtesy: anything talking to the storage API directly can skip it, and a
     privacy rule that only holds when the official client is used is not a rule.

  One honest caveat for phase 3E: the server-side hook is plan- and rollout-dependent. If it is not
  available when we get there, the fallbacks in order of preference are (a) upload via a small Edge
  Function that strips then puts the object, costing one extra hop on a rare action, or (b) reject any
  uploaded object that still carries an EXIF/TIFF marker, which is detection rather than repair. Do not
  resolve this on paper — check what the project actually offers, then pick.

- Because the client re-encode has to decode anyway, "is this an image?" is answered by the decoder
  rather than by `file.type`, which is the only server-side MIME check worth trusting.

Note that `accept="image/*"` on iOS also admits HEIC, which browsers other than Safari cannot render.
Re-encoding to JPEG on upload fixes that as a side effect — one step, three problems.

**The same rules apply to the `avatars` bucket, and today only one of them is even attempted.** The
update picker checks type *and* size ([PhotoUploader.jsx:22-27](src/components/updates/PhotoUploader.jsx#L22));
the avatar picker checks type alone ([Profile.jsx:49](src/pages/Profile.jsx#L49)), so a
24 MB camera roll frame is accepted there right now. That is a two-line fix, not a design question, but the
part worth stating is that **an avatar is a photograph of a person and carries EXIF like any other** — D6's
strip has to run on this path too, or the app would publish GPS coordinates in its header. The bucket limit
here should be lower than 10 MB (the rendered size is at most 96 px; 5 MB is generous), which is the one place
the two buckets deliberately differ.

---

## 7. Frontend integration mapping

### 7.1 The promise

`DataContext`'s value shape is the seam. Every page reads through `useData()`; if the provider
produces the same keys with the same shapes, no component, no layout, no token and no wireframe
changes. That is the design goal of this section, and the approved decisions narrow it honestly:
**everything survives except what D7, D2 and the solo-space rule require.** Those three change four
components' content while keeping every one of their layouts, plus one caption line in Profile's edit modal
that exists only to describe the mock (§1.4). §7.3 is the complete list — there is no fifth component where
the design system has to move.

### 7.2 Operation by operation

| `DataContext` member | Today | Becomes | UI impact |
|---|---|---|---|
| `loading` | constant `false` (`DataProvider.jsx:34`) | true until the initial fetch resolves | `Memories` already had the branch; `Dashboard` got one in **3B-0** |
| `currentUser` | `partners.find(p => p.id === ME)` | `profiles` row for `auth.uid()` | none |
| `partner` | `partnerOf(ME)` — always a person | the other **open** member joined to `profiles`, **or `null`** | **10 call sites must tolerate null** (§2.3.2) |
| `personById` | lookup over `couple.partners` | same, over the open-member map already fetched | none |
| `couple` | seed object | `partnerships` row + open members; `nextMeeting` from `scheduled_meetings`; `timezoneLabel` stays hand-edited text | none |
| `updates[]` | `seedUpdates` | `updates` + grouped `reactions`, newest first | none |
| `updates[].reactions` | `{id:[userId]}` | reconstructed by one `group by` — **keep this shape**, `reactionCount`/`hasReacted` in `lib/reaction.js` already read it | none |
| `updates[].photo` | `/mocks/x.png` | signed URL resolved by the provider, 15-minute expiry (§6.4) | none |
| `currentUser.avatarUrl` / `partner.avatarUrl` | `/mocks` path, or a `createObjectURL` blob | `profiles.avatar_path` resolved to a signed URL by the provider — same 15-minute rules as a timeline photo | none; `Avatar` takes a `src` string ([Avatar.jsx:8](src/components/ui/Avatar.jsx#L8)) and keeps taking one |
| *(avatar write — `Profile.jsx:47-51`)* | `URL.createObjectURL`, preview only, discarded on save | same canvas strip (§6.5) → upload to `avatars/{user_id}/{revision_uuid}.jpg` → `update profiles set avatar_path` | the "Uploads are local until Stage 3 storage" caption at [Profile.jsx:161](src/pages/Profile.jsx#L161) stops being true and gets deleted |
| `connection.status` | `'connected'`/`'pending'` hardcoded in seed | **derived from the open-member count**: 2 → `connected`, 1 → `pending` (§2.3.2) | none — the values are identical, they simply become true |
| `connection.invite` | `{code, expiresAt, status}` | an open `invitations` row: `expiresAt` + live/retired + `redeemedBy`. **No code** — the plaintext exists only in the issue response (D7) | **Connect's code panel changes** — show-once, then a "generate a new code" affordance |
| `notifications[]` / `unreadCount` | seed list | `notifications` where `recipient_id = me` | none |
| `publishUpdate({photo,moodId,message})` | 900 ms timer + `createObjectURL` | canvas re-encode → upload → insert → return row | none; the timer comment at `:46-49` is the marked seam |
| `toggleReaction(updateId, reactionId)` | map rewrite | insert or delete, `23505` treated as success | none |
| `editPartner(id, patch)` | `setCouple`, any partner | `update profiles` — **own row only** (D2) | **Profile loses "Edit Sparkles"** and the partner-city input |
| `editCouple(patch)` | `setCouple` | `update partnerships` (+ `scheduled_meetings` for `nextMeeting`) | none |
| `regenerateInvite()` | `buildCode()` client-side | `issue_invitation()`: retire + mint + hash, returns the plaintext once | Connect shows the fresh code in the show-once panel |
| `joinWithCode(code)` | returns `true` unconditionally | `POST accept-invite`; can now fail: `invalid_code`, `expired`, `revoked`, `already_redeemed`, `space_full`, `already_in_a_space`, `unverified_email`, `throttled` | **needs a real failure path** — the UI has no error state for any of these |
| `unlinkPartner()` | sets status `'pending'` | `unlink_partnership()`: closes my row, revokes the live code, notifies whoever stays | wording should read "Leave this space" (§4.6) |
| `markNotificationRead` / `markAll…` | map rewrite | `update … set read_at = now()` | none |
| Settings `prefs` | `useState` in `Settings.jsx:68` | `user_preferences` — **must move into context** | none, but it starts persisting for the first time |
| *(nothing today)* | — | `user_preferences.timezone`, seeded from `Intl` at signup | **one new Settings row** (§2.9) |

### 7.3 What must change in code (the complete list)

Twelve items. They are ordered by how visible they are, not by phase — items 1, 7, 8, 9, 10 and 12 touch
components; the rest live in `src/context/`, `src/lib/` and the import lines.

1. **Connect: the invitation code becomes show-once (D7).** Today the panel renders
   `connection.invite.code` on every visit ([Connect.jsx:89-99](src/pages/Connect.jsx#L89)).
   It becomes: a code shown in the moment it is minted, with copy + "read it out now"; after that, only
   "live until <date>" and the generate button. Region 9 of wireframe 06 and the matching block in
   `WIREFRAMES.md` change; nothing else on the page does.
2. ~~Remove the five `ME` imports (§1.1) — read `currentUser.id` from `useData()`.~~ **done (3B-0).**
3. ~~Add a `loading` branch to `Dashboard`, matching `Memories.jsx:98-101`.~~ **done (3B-0).**
4. Move `prefs` from `Settings.jsx:68` into `DataContext` as `preferences` + `setPreference`.
5. Give `joinWithCode` a real error surface — it currently cannot fail
   ([DataProvider.jsx:97-102](src/context/DataProvider.jsx#L97)) and it will be able
   to return eight distinct things (§7.2). Each needs one sentence of copy; "that code did not work" is the
   wrong level of vague for `already_in_a_space`, and `expired` versus `revoked` versus `invalid_code` are
   three different next actions for the person reading them.
6. Add the signed-URL step to the provider — batch `createSignedUrls(paths, 900)`, re-sign on visibility
   change, retry once on error (§6.4) — for `updates[].photo` **and** for `profiles.avatar_path`, so no
   component ever receives a raw path. While there, decide whether `MemoryCard` keeps `loading="lazy"`
   or drops it, and delete the now-false "Uploads are local until Stage 3 storage" caption in Profile.
7. **Make the app tolerate a space with one member.** `partner` becomes nullable, which has never been
   true in this codebase. The sites are Dashboard (`:45` — `partner.id` inside a `useMemo` dependency
   array, so it throws rather than degrades), `:56-60`, `:75`, `:86`, `:93`, `:134`, `:151`, `:158-167`;
   Connect `:77`, `:91`, `:98`, `:129`; NewUpdate `:84`; Settings `:112`, `:166`, `:218`, `:241`;
   Profile `:58`, `:67`, `:99-100`; AccountMenu `:50`, `:59`; NotificationsMenu `:24`, `:29`;
   ConfirmUnlink `:17-30`. The honest fix is one shared guard — a `SoloSpace` band, not twenty
   conditionals — and `partner === null` becomes a state the UI has to be designed for rather than one it
   happens to avoid.
   **The approved copy is a single sentence, reused:** *"Your space is ready. Invite your partner to
   join."* It goes on the Dashboard where the partner greeting currently sits, and every other null-partner
   site degrades to it or to a shorter variant ("Waiting for your partner") rather than inventing its own.
   Two properties worth keeping if the wording is ever revised: it states that the space *exists and works*
   (it is not a broken state), and it names the one action available (invite) — which is exactly where
   Connect already is. Nothing in it promises a second person is expected, required, or overdue.
8. **Remove partner editing from Profile (D2).** The "Edit Sparkles" modal and the "Their city" input at
   [Profile.jsx:99-100](src/pages/Profile.jsx#L99) go; `editPartner` in the
   provider narrows to "edit myself". The partner's details stay displayed, which is what the page is for.
9. Retitle the unlink confirmation so it says what actually happens: one person leaves, the space and its
   history stay. The copy at [ConfirmUnlink.jsx:30-31](src/components/couple/ConfirmUnlink.jsx#L30)
   already promises "Nothing is erased — re-link with a new code to pick the timeline back up", which is
   exactly D3; only the "Unlink {name}?" title and the "you will not see theirs" framing need to change.
10. Add one Settings row for the timezone (§2.9), inside the group that already holds quiet hours, using
    the existing `SettingRow` shape and the existing select-style control — no new component.
11. **`AuthProvider`, and email verification is now part of it (D14).** Replace the three mock bodies with
    `supabase.auth.*`; the `{ user }` shape is already compatible. Signup additionally reads `Intl…timeZone`
    and passes it to `bootstrap_space` (§4.1). What D14 adds is a *state the app has never had*: after
    `signUp()` there is no session, so the signup screen must hold "check your inbox" with a resend action,
    and `bootstrap_space` moves to the first authenticated session instead of the signup click
    ([AuthProvider.jsx:48-56](src/context/AuthProvider.jsx#L48) currently accepts any
    syntactically valid email and goes straight to a signed-in mock). The Supabase project setting
    ("Confirm email") is Emerson's to switch in the dashboard; the code has to behave correctly either way,
    because on the mock path there is no email at all.
12. **Remove the "Delete my space" row from Settings (D12).** [Settings.jsx:260-271](src/pages/Settings.jsx#L260)
    offers a button titled "Delete my space" whose description promises "Removes your account and every
    update you wrote. This one cannot be undone", and whose confirm modal then admits it only signs you out
    ([Settings.jsx:311-314](src/pages/Settings.jsx#L311)). Under D12 nothing in v1
    destroys a partnership, so the honest move is to delete the row and its modal, not to re-scope it: a
    control that says *delete* and performs *sign out* is worse than no control, because a user who believes
    they deleted their account will not come back to find their data waiting. Unlink (§4.6) is the one exit
    v1 offers, and it is already on this same screen. Account deletion returns as its own designed feature
    with D13's explicit-confirmation contract, in a later stage.

Items 1–6 are the wiring the previous draft already promised. Items 7–12 are what the approved decisions
added: item 7 and item 12 are the ones I would budget real time for, because neither is a schema concern —
item 7 is the first time this app has two legitimate states instead of one, and item 12 is a promise the UI
already makes that the product has now decided not to keep.

**What does not change:** no route, no layout grid, no spacing scale, no `index.css` token, no palette
value, no type style, no card shape. `WIREFRAMES.md` needs region 9 of wireframe 06 redrawn and the
Profile unlink labels updated; the other eleven wireframes survive untouched.

### 7.4 What stays

All 28 components under `src/components/` keep their props, their layouts and their place in the tree.
All 12 pages keep their markup structure. Six things change *content* inside components that survive:
the Connect code panel's state (item 1), Profile's edit affordances (item 8), the unlink label (item 9),
one added Settings row (item 10), the deleted Settings row (item 12) — plus the null-partner guard (item 7),
which is a render condition rather than a redesign. Item 7 is the one addition: a solo band, probably
composed from the existing `Card` + `EmptyState` rather than a new primitive, so the component count may
become 29 in 3C without any layout changing. The botanical palette, the type scale, the two navigation
surfaces, the four
public routes, `lib/mood.js`, `lib/reaction.js`, `lib/date.js`, `lib/legal.js`, `lib/redirect.js`.
`SessionScope` — already keyed on `user?.id`, which is exactly right once the id is real. `mockData.js`
and `Landing.jsx`'s import of `couple` stay for the marketing page's sample data.

---

## 8. Beginner-friendly explanation

**What a database is doing here.** Think of the database as a filing cabinet that lives on someone
else's computer. Your app asks it for papers and it hands them back. "Postgres" is the brand of
cabinet; a "table" is one drawer with a fixed shape; a "row" is one sheet in that drawer; a "column"
is a labelled box every sheet must fill in.

**The two-person rule, explained by the drawer.** The important trick in this design is how we make
"never more than two" impossible to break. We do not write a rule that says "check whether there are
already two, and refuse if so" — because two people asking at the same instant both get told "only one so
far, go ahead". Instead the drawer has exactly two chairs, numbered 1 and 2, and every sheet must name a
chair. There is no chair 3. So a third person does not need to be *detected*; there is simply nowhere to
put them. The cabinet's own shape is the enforcement. That is stronger than a rule, because rules can be
skipped and shapes cannot.

**Two is a ceiling, not a doorway.** The same drawer carries the half that is easy to get wrong: nothing
requires both chairs to be filled. Signing up puts one person in chair 1 and the space is entirely valid —
empty chair, waiting, one live invitation. "Connected" only means both chairs happen to be occupied, and
you can always tell by looking, which is exactly why there is no status column. A status would be a note
about the chairs taped to the front of the cabinet, and notes go stale.

**When somebody leaves, their sheet stays.** Unlinking tears nothing out. The row that says "this person
sat in chair 1 until October" keeps its shape and gains a leaving date, and the chair becomes free for
whoever is invited next. The ceiling still works because it only counts *seated* sheets: old sheets are
excluded from the comparison, so they can neither block a new arrival nor let a third one in. That single
trick is what makes "one space at a time, history preserved, nothing deleted" three requirements that fit
in one table instead of three arguments.

**RLS — the receptionist.** Row Level Security is a policy attached to each drawer that decides, per
sheet, what you are allowed to see. It runs *inside* the database, before any data is sent to your
browser, so the app never has to remember to filter. The policy for almost every drawer reduces to
one question: "does this sheet belong to the couple this person is in?" There is one shared helper
that answers that question, so the same rule is written the same way everywhere and cannot drift.

The crucial part: **your browser cannot lie about this.** The app you are looking at is running on
the user's computer, and anything on their computer they can edit. So the client is treated as a
polite suggestion, and the database re-checks everything. When the app says "show me update #57", the
database does not care what the app wanted — it checks membership first, and shows nothing if you are
not in that couple.

**Why invitations go through a server function.** Joining a couple is the one moment where someone
must be allowed to do something RLS would normally refuse (add themselves to a space they are not yet
in). So that single action happens in a small piece of code we run on the server, which holds a key
we never send to the browser. The browser's only involvement is "here is the code the user typed".
This is why the design keeps saying *publishable key in the client, privileged key on the server* —
the publishable key is safe to publish precisely because it can do nothing the policies allow.

**Why the invitation code appears once.** A code is a key, so the cabinet keeps only its *fingerprint*:
a hash. That is enough to recognise a code someone hands over and nowhere near enough to reconstruct one,
so a copy of the whole table hands an attacker a puzzle instead of a set of keys. The price is visible in
the product: the Connect screen can tell you an invitation is live and when it expires, but it cannot show
you the code again. Losing it is an expected outcome, and the answer is the button that already exists —
"generate a new code", which retires the old key in the same breath as minting the new one. What the
design will not do is half-reveal it, because printing four of eight characters leaves an attacker only
about a million possibilities to try, and that is not a hint, it is most of the key.

**Why photos are private.** A photo in cloud storage has a URL, and a URL is a password that anyone
who sees it can use. A public bucket means the URL works forever for whoever finds it. A private
bucket means the app asks the server for a link that expires in fifteen minutes, so a leaked link dies
on its own. It costs one extra round trip per screen and buys the actual privacy the product promises.
Two things ride along with that re-encode, and they are the reason it is mandatory rather than
optional: a photo from a phone quietly carries the exact coordinates where it was taken, and redrawing
the picture before storing it loses that the way re-typing a letter loses the original handwriting; and
a file whose header says "JPEG" but whose payload says something else stops being a threat the moment it
has to survive being decoded and drawn.

**Why Realtime is not the source of truth.** The live feed is a notification that something changed,
not a copy of the data. If your phone sleeps in your pocket and misses three events, the app refetches
when it wakes. Built the other way round, a dropped connection silently gives you a wrong timeline
that looks perfectly up to date — the worst kind of bug, because nothing appears broken.

---

## 9. Decision record — approved 2026-10-31

Eleven decisions reviewed, eleven approved, and the four open questions answered on the same day. Two
decisions changed from my recommendation (D7, D8), one was approved with a different mechanism than I
proposed (D1), the timezone moved tables, and two technical corrections were required. D12–D15 are the four
answers. All of it is reflected in §2–§8; this section is the contract, readable on its own.

| # | Decision | Approved | Where it lands |
|---|---|---|---|
| **D1** | One partnership at a time, historical partnerships preserved | **Yes — mechanism changed** | `left_at` + `members_active_user_idx`, §2.3.1. *Not* `unique (user_id)` |
| **D2** | A user edits only their own profile | **Yes** | `profiles_update` (§3.2); §7.3 item 8 removes "Edit Sparkles" |
| **D3** | Unlinking never deletes shared history; the departing member loses access; no permanent deletion in v1 | **Yes** | §4.6 (one `UPDATE`), §6.4 deletion paths, `on delete restrict` (§2.6) |
| **D4** | Rate-limit invitation redemption | **Yes** | `invitation_attempts` (§2.4) + steps 2–3 of §4.2 |
| **D5** | Unread-notification state is private to each user | **Yes** | `notifications_select` is `recipient_id = auth.uid()` only (§3.2) |
| **D6** | Strip EXIF/GPS and safely re-encode before storage | **Yes, mandatory** | §6.5 — client canvas re-encode **and** a server-side pass |
| **D7** | Hashed codes, original shown once, secure replacement | **Yes — changed from my recommendation** | `code_hash` (§2.5), §4.4, `issue_invitation()` (§4.5), §7.3 item 1 |
| **D8** | Signed-URL expiry | **Yes, at 15 minutes** (my 1 hour was not chosen) | §6.4, with the two refresh rules that make 15 minutes safe |
| **D9** | No update deletion in v1, architecture stays extensible | **Yes** | no `updates_delete` policy exists (§3.2); the cascades are already there for later |
| **D10** | Defer `pg_cron` and milestone scheduling | **Yes** | §5.3 — milestone notifications simply do not arrive in v1 |
| **D11** | CHECK constraints for the mood and reaction vocabularies | **Yes** | §2.6 and §2.7; the drift risk stays in §11 |
| **D12** | No permanent partnership deletion in v1; shared history is preserved | **Yes** | `partnerships` keeps no delete policy (§3.2); the "Delete my space" row is removed from Settings (§7.3 item 12) |
| **D13** | Account deletion stays out of v1 until its consequences are designed; when it ships it needs explicit confirmation and must never silently delete the other partner's shared memories | **Yes — deferred** | §6.4 "Account deletion", §11's retained contract, `on delete restrict` (§2.6) |
| **D14** | Email must be verified before a space is created or an invitation accepted | **Yes** | `email_is_verified()` (§3.5), step 0 of §4.1, step 2 of §4.2, §7.3 item 11 |
| **D15** | The solo space reads as a friendly waiting state | **Yes, copy approved** | §7.3 item 7: "Your space is ready. Invite your partner to join." |

### 9.1 Your four additional rules

| Rule | How the schema reads it |
|---|---|
| IANA timezone in `user_preferences`, defaulting to the browser's | §2.9 — `timezone text not null default 'UTC'`, written at signup (§4.1 step 4). Shape-checked in the database, existence-checked in the client, where `Intl` throws on a bogus zone |
| A partnership may initially have one member while the invitation waits | §2.3.2 — nothing in the schema requires a second row. The consequence is that `partner` becomes nullable for the first time, which is §7.3 item 7 rather than a schema problem |
| The database must enforce a maximum of two members | §2.3.3 — `check (slot in (1,2))` plus `members_active_slot_idx`. Enforced by uniqueness, which has no race, rather than by counting, which always does |
| A partnership becomes fully connected when the second member joins | §2.2 — derived, never stored: the count of open membership rows *is* the state. The waiting partner learns it from a Realtime `INSERT` on `partnership_members` (§5.2); the joiner learns it from the accept response |

### 9.2 Correction 1 — a permanent `UNIQUE(user_id)` cannot coexist with history

`unique (user_id)` says "this person appears in this table once, for all time". Under D1 + D3 that is not
merely untidy, it is self-contradictory: history must survive, so the row cannot be deleted, so a second
relationship is impossible, so the constraint silently rewrites your product rule into "one partnership per
*lifetime*". What changed, item by item:

| | Proposal you reviewed | After the correction |
|---|---|---|
| Key | `primary key (partnership_id, slot)` | `primary key (id)`; the seats are keyed by a **partial** unique index |
| One-space rule | `unique (user_id)` | `unique (user_id) where left_at is null` |
| Departure | delete the row, or move it into `partnership_membership_history` | set `left_at` + `left_reason`; the row never moves and never dies |
| Seat reuse | impossible — the dead row still holds the key | normal, and why the redeem function asks which seat is vacant instead of hardcoding 2 (§4.2) |
| History table | recommended, kept separately | **dropped.** One table with an open/closed flag makes unlink a single-row update rather than a two-table move that must be transactional forever |
| Cost | none | two places must carry `left_at is null` to be correct — §3.1 and `members_select` — plus one written twice deliberately, `profiles_select` (§3.4) |

The paired check — open rows have no reason, closed rows must have one — exists so that a future
`update … set left_at = now()` without a reason is refused rather than silently creating history nobody
can interpret. `left_reason` has one legal value today because one thing can empty a seat in v1 (§2.3).

### 9.3 Correction 2 — the ceiling and the completion are different objects

- **A maximum of two** is a constraint: `check (slot in (1,2))` + `members_active_slot_idx`. Violations
  are impossible rather than discouraged, and they are impossible for a hand-written `insert` in the
  console too.
- **Complete at two** is a derived fact: `count(open rows) = 2`. No column, trigger, status or check
  expresses it, because a one-member partnership is a *correct* partnership — it is where every account
  begins and where a space returns after an unlink.
- **The test that proves they are distinct**, and the one I would not skip in 3C: signup must succeed while
  the space holds one member, and the same signup must fail if it is somehow run twice. A schema that gets
  one of those two right has collapsed the rules into each other — requiring two members blocks signup, and
  failing to block a second open membership silently permits a group.

### 9.4 Net schema delta from what you reviewed

```
partnership_members        + id, + left_at, + left_reason
                           − primary key (partnership_id, slot)
                           − unique (user_id)
                           + unique index (partnership_id, slot) where left_at is null
                           + unique index (user_id)             where left_at is null
partnership_membership_history
                           − removed entirely (superseded by the two columns above)
invitation_attempts          new table (D4)
invitations              code → code_hash, + revoked_at, unique index on code_hash
profiles                 − timezone (moved)
user_preferences       + timezone
updates                author_id: on delete cascade → on delete restrict
                           − updates_delete policy (D9)
partnerships               still no status column, now with the reason written down (§2.2)
```

Table count: nine → **ten**.

### 9.5 What the four answers changed

None of the four needed a new table, which is the useful signal. Two needed a new function, one removed a
user-visible control, and one is a sentence.

| Answer | Schema consequence | Interface consequence |
|---|---|---|
| **D12** no permanent partnership deletion | none — `partnerships` already had no delete policy, so the approval confirms a grant set rather than changing it | the "Delete my space" row and its modal are removed from Settings (§7.3 item 12). Unlink stays the only exit |
| **D13** account deletion deferred, with explicit confirmation and never silently deleting shared history | `on delete restrict` on `updates.author_id` (§2.6) is now the *enforcement* of that clause, not a placeholder for a decision | nothing in v1. When it ships it is a consequences-screen, not a confirm dialog |
| **D14** verified email required before creating or accepting an invitation | new `security definer` helper `email_is_verified()` (§3.5); no new column, no new table; `invitation_attempts.outcome` gains `'unverified_email'` and `'revoked'` | signup holds at "check your inbox" until a session exists; `bootstrap_space` moves to first session (§4.1) |
| **D15** the solo space reads as a friendly waiting state | none | one approved sentence, reused: *"Your space is ready. Invite your partner to join."* (§7.3 item 7) |

Two things worth naming as the cost of D14, because they are the parts a reviewer would otherwise call
oversight. First, the space is no longer created at the signup click, so a duplicate `bootstrap_space`
becomes an expected event rather than a bug — §4.1 keeps the index as the guarantee and gives the duplicate
a clean `{ already: true, code: null }` answer. Second, an unverified account that holds a valid code cannot
redeem it, so the person who was *given* the code has to also *click the link* before the couple can connect;
that is the intended friction, and it is why the invitation flow's copy in Connect should tell the joiner to
verify first.

**The third standing requirement — active, not historical, membership in every access path — is now an
auditable invariant with its own section (§3.4)** and its own 3B exit test, rather than a property someone
has to trust the helper for.

---

## 10. Phased implementation plan

Each phase leaves the app running. `isSupabaseConfigured` is the switch: with no env file, the mock
path is used, so **every phase below is testable without touching your credentials**, and the mock
app keeps working until you deliberately remove it.

| Phase | Scope | Files touched | §7.3 items | Exit test |
|---|---|---|---|---|
| **3B-0** | ~~Remove the five `ME` imports; add the `Dashboard` loading branch~~ **shipped 2026-10-31** | 5 pages | 2, 3 | Lint + build clean; app behaves identically on mock data; no `ME` import survives a grep — **all three met** |
| **3B-1** | Migrations: **ten** tables, both partial unique indexes, the open/closed check pair, `current_partnership()`, `email_is_verified()` (§2, §3.1, §3.5) — **written 2026-11-01, statically validated, not executed; awaiting review** | new `supabase/migrations/*.sql` ×5 | none | Static: all 10 tables and every column match §2; 14 indexes; all FKs carry an explicit `on delete` rule; mood/reaction CHECK lists byte-identical to `lib/mood.js` + `lib/reaction.js`; zero `create policy` statements. **The (a)–(f) checks below need a real database and are 3B-2's or the first apply's job.** |
| **3B-2** | All RLS policies (§3.2, §3.3, §3.4) on the ten tables that already have RLS enabled with none | same directory, new migration | none | (a) a third open member in a slot → `23505`; (b) a second open membership for one person → `23505`; (c) **a one-member partnership inserts, reads and passes every policy**; (d) a closed row grants nothing to anyone; (e) user B selects zero rows from user A's space; **(f) the §3.4 audit as one script: after an unlink, the departed account selects zero rows from `updates`, `reactions`, `invitations`, `scheduled_meetings` and the ex-partner's `profiles` row** |
| **3C** | Auth wiring: profile bootstrap trigger, `bootstrap_space()`, real `signIn`/`signUp`/`signOut`, **email confirmation (§4.1's new ordering)**, preferences row seeded with the browser timezone, the solo-band copy | `AuthProvider.jsx`, `DataProvider.jsx`, `Dashboard.jsx` | 7, 11 | Signup holds at "check your inbox", and **no space exists until the link is clicked**; verifying then landing produces one space with one member and one code; a second `bootstrap_space` cannot produce a second open row (clean `already: true`, or `23505` if two calls race — both leave exactly one row); an unverified account cannot redeem a valid code |
| **3D** | `issue_invitation()`, the `accept-invite` function, `invitation_attempts`, `unlink_partnership()`, a real `joinWithCode`, and the Settings delete-row removal | `DataProvider.jsx`, `Connect.jsx`, `Settings.jsx` | 1, 5, 9, 12 | Each of the four attacks in §4.3 attempted and refused; the rate limit trips and returns 429; a code is visible once and then never again; all eight join failures render their own sentence; after an unlink the stayer reads every update and the leaver reads none, and no row was deleted to get there |
| **3E** | `updates`, both buckets, storage policies, canvas EXIF strip, batch 15-minute signed URLs for photos **and avatars** | `DataProvider.jsx`, `PhotoUploader.jsx`, `Profile.jsx` | 6 | A photo posted on one device appears on the other; a third account cannot reach the object or its URL; a stored object carries no EXIF; a URL older than 15 minutes refreshes instead of rendering broken; the "Change photo" upload survives a reload |
| **3F** | `reactions`, notification triggers, Realtime on four tables, the `SessionScope` remount test | `DataProvider.jsx`, `AppShell.jsx` | none | Two browsers side by side: react → count moves and badge lights within ~1 s; a partner joining lights the waiting member; **nothing** arrives for a member who has left |
| **3G** | `user_preferences` wiring, `scheduled_meetings`, `editCouple`, own-profile-only editing | `Settings.jsx`, `Profile.jsx` | 4, 8, 10 | Toggles and timezone survive a reload; the UI does not offer to edit your partner and a direct attempt is refused by RLS; the countdown survives a re-plan |
| **3H** | Retire mock data from the app path; keep `mockData.js` for Landing | `mockData.js`, `Landing.jsx` | — | Full regression sweep at 390 / 768 / 1280 |

Order rationale, and what the approvals changed in it: 3B-0 first, because it is a latent correctness bug
independent of the backend and reviewable on its own. 3B's exit test now includes case (c) — the
one-member space — specifically because that is where a schema that confuses ceiling with completion
fails (§9.3). **Item 7 moved into 3C**: the solo space first *exists* there, so "the app must tolerate a
null partner" cannot be a later cleanup, and it is the one item on the list that is a design task rather
than a wiring task. 3C before 3D because you cannot test invitations without two accounts; 3D is now
bigger than the draft's version, since rotation, hashing, telemetry and unlink all live in the same
surface. 3E before 3F because reactions are meaningless without something to react to. Nothing in 3B–3D
touches the design system; 3D and 3G touch component *content*, which §7.4 lists exactly.

**What I will not do in any phase** without you asking: create the Supabase project, generate or
handle keys, edit `.env`/`.env.local`, install a package, or add an AI feature.

---

## 11. Risks, and the record of what was asked

Nine risks are listed. Eight remain live; the first was closed by 3B-0 and stays so the next reader knows
it was considered. Five questions were put to you across the two drafts and all five are now answered;
they are kept below as **A** entries with their answers, because the next reader of this document needs both
halves — a decision with no question attached looks arbitrary, and a question with no answer attached looks
open.

**R — `loading` on Dashboard.** *(closed by 3B-0 — the branch exists, so this is now only a reminder not
to remove it.)* The risk was that `loading` is a constant today, so `Dashboard` has no branch for it, and
the moment it became real a cold load would show the "You have not posted yet" empty state for the
duration of the fetch — a lie, briefly. 3B-0 fixed it while the fix was cheap; `Dashboard.jsx` now returns
a `LoadingSpinner` before any of the empty-state logic can run.

**R — Two sources of truth for moods and reactions.** `mood.js` and `reaction.js` define the
vocabularies in the frontend; the CHECK constraints define them in the database. They will drift.
Mitigations, in ascending order of effort: a comment in each file naming its counterpart; a test that
asserts the two lists match; or a real lookup table the client reads. I would take the comment now and
revisit if either set changes.

**R — an inferred timezone quietly goes stale.** The decision is settled; the behaviour is not. The zone is
captured once, from the browser, at signup (§4.1). Travel, a VPN or a moved laptop does not re-run that
capture, so reminders drift away from the person. Cheap mitigation in 3G: on sign-in, compare the stored
zone with what `Intl` says now and, if it changed, *offer* the update once — never silently overwrite a
setting the user may have set by hand.

**R — 15-minute URLs are only safe if the refresh exists.** D8 turned this from a performance note into a
correctness note. A batch call means the request *count* is not the risk; the risk is a tab left open past
expiry and a `loading="lazy"` card whose URL was never signed. The two rules in §6.4 — re-sign on
visibility change, retry once per path on error — are the feature rather than the extras. Without them the
app quietly loses photographs, which is the worst possible failure for an app whose entire purpose is
keeping them.

**R — `left_at is null` is load-bearing in two places, and it only takes one more to break it.** §2.3.1
accepts the cost; it is worth saying plainly as the maintenance risk it is. Any future read of
`partnership_members` that forgets the predicate hands a departed person a live space, and PostgreSQL will
not complain about the omission. The defences are 3B's exit test (d) and a convention: `current_partnership()`
is what new code reaches for, and a direct read of that table in a review is a question, not a style note.

**R — a hashed 40-bit code is not unbreakable, only unhurried.** §4.4 gives the arithmetic rather than
pretending: SHA-256 is fast, so a dumped table can be ground offline, and what makes that acceptable is
that only unredeemed, unexpired rows are worth grinding — at most one per couple — and D4 closes the online
path. If that ever reads as too thin, the lever is code *length* (12 characters is ~2^60 and costs a
generator line plus the input mask), not a pepper nobody would rotate.

**R — unlink behaviour is decided; the wording is not.** D3 plus §4.6 settle what happens: one person
departs, nothing is deleted, the space continues with whoever remains, and re-linking is a fresh
invitation — a closed row never blocks the same two people starting again. What remains is the copy.
"Unlink Sparkles" describes a mutual act, and the body text underneath it already promises the approved
behaviour ([ConfirmUnlink.jsx:30-31](src/components/couple/ConfirmUnlink.jsx#L30)),
so the two disagree with each other today. §7.3 item 9 fixes it in 3D; I have not written the replacement
sentence here because it is your voice, not mine.

**R — `SessionScope` will now do real work.** Re-keying on `user?.id` was a mock-state convenience;
against a backend it becomes the thing that prevents a logout/login cycle leaving the previous
couple's rows in memory. That is good, but it also means a bug in the remount is now a privacy bug
rather than a cosmetic one. It deserves an explicit test in 3F.

**R — Edge Function cost and cold starts.** One function, called rarely (joining is a once-per-couple
event), so this is a non-issue at this scale. Noted only so that "why is there a function?" has an
answer later.

**A — Do you want soft deletes anywhere?** Answered by D9 + D3 + D12: no, and now nothing in v1 deletes at
all, so there is nothing to soften. If update deletion ships later, `deleted_at` costs a clause on every
policy and index — the same class of risk as `left_at`, one more predicate that has to be remembered forever
(§3.4) — so it should arrive as a decision and not as a default.

**A — "Delete my space" (D12, answered 2026-10-31).** *Do not implement permanent partnership deletion in
v1. Preserve shared history.* So the question the paragraph above was asking — what should that button do? —
has a fourth answer: it should not exist. The row and its modal come out of Settings (§7.3 item 12), because
a control named "delete" that only signs you out is the one outcome worse than no control: the user stops
looking for their data. Unlink (§4.6) is the only exit in v1, and for a solo space it is a clean one — leaving
an empty space destroys nothing because nothing was shared yet. `partnerships` keeps no delete policy, so
there is no path to defend.

**A — Account deletion (D13, answered).** *Out of v1 until its consequences are fully designed; explicit
confirmation, a clear statement of consequences, never silently deleting the other partner's shared
memories.* The schema clause that makes the last part structural is already in place — `on delete restrict`
on `updates.author_id` (§2.6) means removing a user from the dashboard *fails* rather than erasing that
person's partner's memories, so a future flow has to be written deliberately to do something the database
will not do for it. What remains to design then is named in §6.4: what happens to the partnership when one of
its two people is deleted, and what "anonymise" means for rows the other person still reads. Deferred, not
forgotten.

**A — The solo space (D15, answered).** *Use a friendly waiting state such as "Your space is ready. Invite
your partner to join."* That sentence is now the one approved string (§7.3 item 7), which closes the design
question the paragraph above raised — five screens did not each need a sentence of tone, they needed one
place to say it and everywhere else to point at it. The engineering consequence is unchanged and still the
largest item on the list: `partner` is nullable for the first time in this codebase, and Dashboard,
Memories, Connect, Profile and Settings can each be reached alone, so the null path has to be built and
tested rather than avoided.

**A — Email verification (D14, answered).** *Yes — verified email required before creating or accepting a
partnership invitation.* It was not addressed anywhere in the previous draft; §3.5 is that gap closed, with
the enforcement in `security definer` functions rather than in the signup button, and §4.1 carries the flow
change it forces: the space is created after the click, not at the signup. The practical reason this was
worth insisting on is in §3.5's first paragraph — an invite code is a bearer credential to someone's private
photographs, and an address can be typed without being owned.

---

## 12. Where this document stands

The schema is approved and the four remaining decisions are answered, so §9 is now a closed record rather
than a proposal: **D1–D15**, with the answers folded into §2 (two active members, max), §3.4 (the
active-membership audit), §3.5 (verified email), §4 (invitation flow), §6.4 (no space deletion in v1) and
§7.3 (the solo-space copy). Nothing in the database layer is implemented yet, and per your instruction
nothing will be until you say so: no Supabase project, no credentials, no env file, no migration.

**3B-0 is shipped** — frontend-only, reversible, mock data untouched. Five pages stopped importing `ME`,
and `Dashboard` has a loading branch. Lint and the production build are clean and the app behaves
identically; see §1.1 and §10.

What I need from you next is one of:

1. **"Start 3B"** — the first migration: `partnerships`, `partnership_members`, `profiles`, the two
   partial unique indexes, `current_partnership()` and its RLS policies. This is the phase where §3.4's
   invariant stops being a promise and gets a check. Still no credentials needed — migrations are written
   as files and applied by you.
2. **Changes to the final schema** — §9.4 is the delta in one screen and §2.3 is the part that moved most,
   so those two are the fastest place to look.
3. **A re-read of anything below the decision record** — §8 is the plain-language version of the whole
   design if you want the shape of it without the SQL.

I am not asking for a project URL, a key, or any credential at any point in this stage. Those are yours to
create and enter, and the design assumes nothing about them beyond `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` already being read at
[supabase.js](src/lib/supabase.js).
