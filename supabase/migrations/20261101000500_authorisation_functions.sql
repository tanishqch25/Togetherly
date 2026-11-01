-- ============================================================================
-- Togetherly — migration 5 of 5: the two authorisation helpers
-- Stage 3B-1 · specification: BACKEND_ARCHITECTURE.md §3.1, §3.5
--
-- Creates: current_partnership(), email_is_verified()
--
-- These are the only two functions that belong in this phase. §10 assigns the
-- rest to later stages, and they genuinely cannot be written yet: bootstrap_space()
-- and the profile trigger need a real auth.users row to hang on (3C);
-- issue_invitation(), accept_invitation() and unlink_partnership() are the
-- invitation workflow (3D); the notification fan-out triggers are 3F. Writing
-- them now would mean writing them against a schema nothing has validated.
--
-- Both functions here answer one question about the CURRENT user, and both are
-- used by the Stage 3B-2 policies rather than by the client. Thirteen of §3.2's
-- twenty-one policies resolve the space through current_partnership(), which is
-- what keeps the authorisation rule from drifting across thirteen hand-written
-- copies of it.
--
-- REQUIREMENT: these need a Supabase project, not a bare PostgreSQL server —
-- auth.users, auth.uid() and the `authenticated` role are all Supabase objects.
-- On vanilla Postgres the CREATE statements fail loudly. That is correct.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- current_partnership() (§3.1) — the one helper every policy uses
-- ---------------------------------------------------------------------------
-- Returns the OPEN partnership id for the signed-in user, or null.
--
-- Three properties carry their weight:
--
--   security definer — lets it read partnership_members without itself being
--     subject to that table's policy. Without it, the policy refers to the
--     helper, the helper reads the table, the table applies the policy: infinite
--     recursion, which PostgreSQL reports as an error rather than a leak, but an
--     error on every single request all the same.
--   set search_path — pins name resolution. A security-definer function without
--     it is a search-path hijack: the definer's privileges used against whatever
--     schema happens to be first in the caller's path.
--   no limit 1 — see below.

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

-- Fails closed by arithmetic rather than by an explicit guard: a user with no
-- OPEN membership gets null, and `null = anything` is null, which is not true, so
-- they match no policy on any partnership-scoped table. This single where clause
-- is the one place the closed-row filter does authorisation work — the reason
-- preserving history (§2.3.1) does not scatter `left_at is null` through the whole
-- design, and the mechanism behind the §3.4 audit invariant.
--
-- The select returns at most one row because members_active_user_idx allows at
-- most one open membership per person. If that index were ever dropped, this
-- function would raise 21000 "more than one row" — a loud failure rather than a
-- quiet one. That is why there is no `limit 1`: a limit would turn "the
-- one-space rule has been broken" into "you randomly get one of them".

revoke execute on function public.current_partnership() from public;
grant  execute on function public.current_partnership() to authenticated;


-- ---------------------------------------------------------------------------
-- email_is_verified() (§3.5) — D14's enforcement primitive
-- ---------------------------------------------------------------------------
-- Confirmation state lives on auth.users, which the `authenticated` role cannot
-- select, so the check needs a privilege the client does not have. It therefore
-- goes in one more security-definer helper beside the other.
--
-- Enforced in the workflow functions, NOT in the signup button: bootstrap_space()
-- step 0, accept_invitation() before the code is looked up, and issue_invitation().
-- If the check lived in AuthProvider, anyone holding a valid JWT from any other
-- path would walk straight past it (§3.5).
--
-- WHY THIS IS BUILT RATHER THAN WRITTEN. The specification asks for
-- coalesce(u.email_confirmed_at, u.confirmed_at) so the function survives
-- Supabase renaming the column. That cannot be a single static SQL body: a
-- `language sql` function is parsed and its column references resolved at
-- CREATE FUNCTION time, so naming BOTH columns requires BOTH to exist — and a
-- current Supabase project has only email_confirmed_at. Written literally, the
-- documented function fails to create on exactly the projects the coalesce was
-- there to protect.
--
-- So the body is assembled from whichever of the two columns this project
-- actually has, which preserves both documented properties: it reads whichever
-- name exists, and if neither does the migration raises rather than letting
-- everyone read as permanently unverified. The names come from a catalog read
-- filtered by an IN-list of two literals, so nothing user-controlled reaches the
-- executed string.

do $$
declare
  v_cols text;
begin
  select string_agg(a.attname, ', ' order by (a.attname = 'email_confirmed_at') desc)
    into v_cols
  from pg_attribute a
  join pg_class     c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth'
    and c.relname = 'users'
    and a.attname in ('email_confirmed_at', 'confirmed_at')
    and a.attnum > 0
    and not a.attisdropped;

  if v_cols is null then
    raise exception
      'auth.users has neither email_confirmed_at nor confirmed_at — refusing to create email_is_verified() rather than silently treating every user as unverified';
  end if;

  execute format(
    $fn$create or replace function public.email_is_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $body$
  select coalesce(%1$s) is not null
  from   auth.users u
  where  u.id = auth.uid();
$body$;$fn$,
    v_cols);
end
$$;

-- Note what is deliberately absent: coalesce(…, false). A user with no auth.users
-- row gets null, and null in a policy or an `if` is not true — the same
-- fail-closed arithmetic as current_partnership(). `stable` because nothing it
-- reads changes within a transaction, and it is called per policy evaluation, so
-- the planner may cache it.

revoke execute on function public.email_is_verified() from public;
grant  execute on function public.email_is_verified() to authenticated;
