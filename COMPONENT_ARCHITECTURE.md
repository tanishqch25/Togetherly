# Togetherly — Component Architecture

Status: **documented from the existing tree.** 28 components, 12 pages, 7 lib modules, 2 contexts —
all present and working. Sections 5 and 8 are the only prescriptive parts; everything else is a
description of what is built.

---

## 1. Layer model

Strict downward dependencies. A layer may import from layers above it, never below.

```
        ┌─────────────────────────────────────────────────────┐
  L5    │  pages/            route-level composition only      │
        ├─────────────────────────────────────────────────────┤
  L4    │  components/layout  shells, nav, chrome              │
        ├─────────────────────────────────────────────────────┤
  L3    │  components/        couple · memories · updates      │
        │   components/ui/    primitives (no domain knowledge) │
        ├─────────────────────────────────────────────────────┤
  L2    │  context/           AuthProvider · DataProvider      │
        │                     useAuth · useData (hooks only)   │
        ├─────────────────────────────────────────────────────┤
  L1    │  lib/       date · mood · reaction · legal ·       │
        │                     redirect · mockData · supabase   │
        ├─────────────────────────────────────────────────────┤
  L0    │  index.css          @theme tokens · surface utility  │
        └─────────────────────────────────────────────────────┘
```

Two rules that are already enforced and must stay:

- **`ui/` knows nothing about couples.** No `ui/` component imports from `lib/mood`, `lib/reaction`,
  `lib/mockData` or `context/`. Verified across all 8 primitives.
- **Components never import seed data.** `lib/mockData` is read only by `DataProvider`; every
  consumer goes through `useData()`. This is what makes Stage 3 a provider swap rather than a
  refactor. (`AppShell` originally broke this rule by importing the seed `couple`, which is why
  header avatars ignored profile edits; corrected to `useData()` at `AppShell.jsx:26`.)

---

## 2. Directory

```
src/
├─ index.css                        tokens (§4 DESIGN_SYSTEM) + @utility surface
├─ main.jsx · App.jsx               BrowserRouter · RequireAuth · route table
├─ lib/
│  ├─ date.js      MS_PER_DAY timeValue dayStart daysBetween isToday daysTogether
│  │               countdownTo relativeTime formatTimestamp
│  │               formatDate monthKey monthLabel
│  ├─ mood.js      MOODS[8] getMood(id)          ← literal Tailwind chip classes
│  ├─ reaction.js  REACTIONS[5] getReaction reactionCount hasReacted
│  ├─ mockData.js  ME PARTNER couple partnerOf seedUpdates invitation
│  │               seedNotifications
│  ├─ legal.js     PRIVACY TERMS      ← structured page copy, not JSX
│  ├─ redirect.js  redirectTarget     ← one destination rule, shared by both guards
│  └─ supabase.js  isSupabaseConfigured · supabase (null-safe)
├─ context/
│  ├─ AuthProvider.jsx   useAuth.js
│  └─ DataProvider.jsx   useData.js
├─ components/
│  ├─ layout/  AppShell AuthShell MarketingNav Footer Logo
│  │           NotificationsMenu AccountMenu
│  ├─ ui/      Button Card Field Input Textarea Select Avatar Modal Menu Switch
│  │           LoadingSpinner EmptyState
│  ├─ updates/  DailyUpdateForm PhotoUploader MoodSelector MoodBadge
│  │            PhotoCard ReactionBar ReactionSummary ReactionButton
│  ├─ memories/ MemoryCard
│  └─ couple/   CoupleCounter CountdownCard PartnerCard ConfirmUnlink
└─ pages/
   ├─ Landing Connect Dashboard NewUpdate Memories Profile Settings NotFound
   ├─ Legal        ← one shell, rendered twice via /privacy and /terms
   └─ auth/    Login SignUp ForgotPassword
```

`Input`, `Textarea` and `Select` are three named exports from `Field.jsx` (not separate files) — one
wrapper owns label, hint and error markup for all three, and they share one `CONTROL` class string.

---

## 3. Primitive contract (`components/ui/`)

| Component | Props | Job | States owned |
|---|---|---|---|
| `Button` | `variant sm/md/lg/ghost/soft` · `size sm/md/lg` · `fullWidth` · `loading` · `to` \| `href` \| native | One clickable thing. Renders `Link`, `a` or `button` from the same classes. | hover, focus, active, disabled, loading |
| `Card` | `as` (element) · `padded` · `hover` · `className` · rest | The `surface` shell. `p-5 sm:p-6` is the canonical interior padding. | hover (shadow only) |
| `Field.Input` | `label` · `hint` · `error` · `id` · rest | Label + control + hint + error, wired by generated id. | error (`aria-invalid`), focus |
| `Field.Textarea` | + `rows = 4` | As above, multiline. | error, focus |
| `Field.Select` | `label` · `hint` · `error` · `id` · `children` | Native `<select>` in the same wrapper; `appearance-none` plus a pointer-events-none `ChevronDown` so the arrow is decoration and the control stays keyboard-native. | error, focus, disabled |
| `Avatar` | `src` · `initials` · `name` · `size xs…xl` · `ring` | Face or letter. `name` becomes the accessible label. | image-missing → initials |
| `Modal` | `open` · `onClose` · `title` · `children` · `footer` | Layered dialog, scrim + Esc dismissal, focus contained. | open/closed |
| `Menu` | `trigger` · `label` · `className` · `rootClassName` · `panelClassName` · `children` | Disclosure popover: trigger button + right-aligned panel. Closes on outside `pointerdown`, on Esc (focus returns to the trigger) and when a link inside is followed; focuses the first control on open. `rootClassName="static"` hands positioning to a `relative` ancestor. | open/closed, focus |
| `Switch` | `label` · `description` · `checked` · `onChange` · `disabled` | A single setting row, label left / control right. | on, off, disabled |
| `LoadingSpinner` | `label` · `className` | The only spinner. `label` is the visible *and* announced text. | loading |
| `EmptyState` | `icon` · `title` · `description` · `action` | Replaces a list when there is none. Exactly one `action`. | empty |

**Why the context split is a component rule, not a style preference.** `createContext` + the
consumer hook live in `useAuth.js` / `useData.js`; the provider component lives in
`AuthProvider.jsx` / `DataProvider.jsx`. Mixing them in one file makes React Fast Refresh refuse
the module and `oxlint`'s `react(only-export-components)` flag it. Any new context follows the same
two-file shape.

---

## 4. Domain components

| Component | Props | Composition | Notes |
|---|---|---|---|
| `PhotoUploader` | `onChange` · `error` · `onError` | dropzone + two hidden inputs (picker, `capture="environment"`) | Owns the blob URL: created in the handler, revoked by a cleanup-only effect. 10MB / image-type validation routed out through `onError`. |
| `MoodSelector` | `value` · `onChange` | `role="radiogroup"` → 8 buttons `role="radio"` `aria-checked` | Tapping the selected mood clears it (`onChange(null)`). Classes come from `lib/mood` literals. |
| `MoodBadge` | `moodId` · `size` · `className` | read-only chip | The display half of a mood; `MoodSelector` is the input half. Never merge them. |
| `ReactionButton` | `reaction` · `count` · `active` · `onClick` | one toggle | Knows nothing about updates. |
| `ReactionBar` | `update` · `currentUserId` · `onToggle` | maps `REACTIONS` → `ReactionButton` | Interactive. Counts from `update.reactions[id].length`. |
| `ReactionSummary` | `update` | maps `REACTIONS` → counts | **Read-only, and that is the point**: shown when `authorId === ME`, because you cannot react to your own update. Falls back to "No reactions yet." |
| `PhotoCard` | `update` · `author` · `footer` | photo (or mood-tinted text tile) + attribution + message + slotted footer | The generic "one update" presentation. `footer` is where reactions are injected. |
| `MemoryCard` | `update` · `onOpen` | compact grid tile → opens the modal | Deliberately not `PhotoCard`: different density, different affordance. |
| `DailyUpdateForm` | `onSubmit` · `publishing` | `Card` → `PhotoUploader` → `MoodSelector` → `Textarea` → actions | Validates message then mood; resets and re-keys the uploader after publish so the blob preview is dropped. |
| `CoupleCounter` | `anniversary` · `className` | figure + meta | `daysTogether` = `daysBetween + 1`. |
| `CountdownCard` | `target` · `className` | figure + date | `countdownTo` → `{isArrived, days, hours, minutes, seconds}`. |
| `PartnerCard` | `person` · `relation` · `onEdit` | `Avatar` + name + nickname + city | `onEdit` omitted → the edit button is not rendered (Connect vs Profile). |
| `NotificationsMenu` | none (reads `useData`) | `Menu` → header row + `ul` of `Link`s | Maps `notification.kind` to an icon and a sentence. A row with an `updateId` deep-links to `/app/memories?open=<id>` and marks itself read; one without lands on `/app`. Shows six, never more. |
| `AccountMenu` | none (reads `useAuth`, `useData`) | `Menu` → identity row + two `NavLink`s + sign-out button | The avatars are the account entry point, not decoration. `Log out` runs `signOut()` then `navigate('/')` — the old header button skipped the first half. |

---

## 5. Duplication found, and what converged

One data shape is presented in six places:

| Site | Component | Shape |
|---|---|---|
| `Dashboard.jsx:84` partner's latest | `PhotoCard` | large, footer = interactive reactions |
| `Dashboard.jsx:112` own latest | `PhotoCard` | large, footer = read-only summary |
| `NewUpdate.jsx:57` just published | `PhotoCard` | large, footer = read-only summary |
| `Memories.jsx:143` modal | `PhotoCard` | large, footer chosen by author |
| `Memories.jsx:128` grid tile | `MemoryCard` | compact |
| `Landing.jsx:128` hero mock | hand-written markup | decorative clone |

The audit that produced this table asked for a single `UpdateCard` with a `density` prop. **P7 did not
do that, and the table is the reason:** by the time the phase ran, four of the six sites already
rendered `PhotoCard`. What was still duplicated was not the container but the two *decisions* made
around it, re-derived at each call site:

1. **which reaction surface an update gets** — `authorId === ME` means read-only `ReactionSummary`,
   anything else means the interactive `ReactionBar`. Now `UpdateReactions`, one export, four callers.
2. **which person wrote a given id** — `Memories.jsx` carried its own lookup closure over the seed
   array, so a name edited in Profile could resolve against a stale copy of it. Now
   `DataContext.personById`, built from the live `couple.partners`.

`PhotoCard` and `MemoryCard` stay two components; §8 has the `<article>`-vs-`<button>` reasoning. The
`Landing.jsx` clone keeps its own markup for the same kind of reason — 240px of marketing art is not a
fifth consumer of the update surface — but its hand-rolled letter avatar was deleted in favour of
`Avatar`, which was the only genuinely duplicated piece of it.

The live rule is easy to lose in a refactor, so it is worth stating what has to stay true after any
change here: reaction counts inside the modal are read from `selectedId` + lookup, never snapshotted;
your own update is never reactable; and a brand-new session never sees the previous one's cards.

---

## 6. State ownership

| Concern | Owner | Consumers | Stage 3 replacement |
|---|---|---|---|
| Session | `AuthProvider` (`localStorage["togetherly.session"]`) | `RequireAuth`, the 3 auth pages, `AppShell` | `supabase.auth.onAuthStateChange` — the shape already matches `session.user` |
| Couple, updates, connection | `DataProvider` | every `/app/*` page + `AppShell` | `select` queries + Realtime channel |
| Notifications | `DataProvider` — `notifications` `unreadCount` `markNotificationRead` `markAllNotificationsRead`, seeded from `seedNotifications` | `NotificationsMenu` (badge + panel), `Memories` (read on open) | a `notifications` table + Realtime `postgres_changes`; the four members are already the whole surface, so no page changes |
| Mutations | `DataProvider` — `publishUpdate` `toggleReaction` `editPartner` `editCouple` `regenerateInvite` `joinWithCode` `unlinkPartner` | pages call, never set state themselves | Storage upload + insert, RPC, upsert |
| Transient form state | the page or form component | — | unchanged |
| Derived facts (`relativeTime`, `daysTogether`, `monthKey`) | pure functions in `lib/date.js`, called during render | — | unchanged |

Nothing in a component writes to another component's state. `loading` is owned by `DataProvider` and
read by every page — a page must not invent its own `loading`, which is a bug that was actually fixed
here. It is currently the constant `false`: the mock space is in memory on the first render, so the
450 ms timer that used to stand in for the Stage 3 fetch only ever made `Memories` wait half a second
over data it already had. `Memories` keeps the branch, which is what Stage 3 will drive. The
demo publish round-trip (`publishUpdate`, 900ms) is owned by the same place for the same reason: a
page that wants a pending state calls, it does not `await` a timer itself.

All of that state is **per session**. `App.jsx` wraps the provider in `SessionScope`, which renders
`<DataProvider key={user?.id ?? 'anonymous'}>` — signing out and back in remounts the provider, so the
next session starts from the seed rather than from whatever the last one wrote. Stage 3 replaces the
mechanism, not the rule: queries are keyed to the authenticated user, so a fresh mount is what a
fresh user needs anyway.

---

## 7. Interaction-state coverage

Per `DESIGN_SYSTEM.md` §8, checked against real code:

| State | Where it is implemented | Gap |
|---|---|---|
| hover | `Button` 4 variants; `Card hover` → `shadow-lift`; nav tabs → `sand-200` fill; `QuickLink` → shadow | none |
| focus | global `:focus-visible` outline 2px, offset 2, `rose-800` (`index.css:121-123`) | none — was `rose-400` ≈2.6, corrected in P2 to 5.36 on `sand-100` |
| pressed | `Button` primary `active:bg-rose-950` (`Button.jsx:6`) | only primary has an active step; secondary/soft/ghost stop at hover |
| disabled | `disabled:opacity-55` + `cursor-not-allowed` (`Button.jsx:21`) | opacity only; should use `sand-500`/`ink-300` tokens |
| loading | `Button loading` spinner; `LoadingSpinner`; `publishing` on the composer; `DataProvider.loading` | `Card` has no skeleton variant. `loading` is a constant `false` until Stage 3 gives it a fetch to describe, so only `Memories` has a branch to show it in. |
| empty | `EmptyState` at `Dashboard.jsx:91` and `:119`, `Memories.jsx:104`; the two counters fall back to their own one-line unset text (`CoupleCounter.jsx:19`, `CountdownCard.jsx:47`) | `Connect` and `Profile` cannot be empty, so no `EmptyState` — but Profile owns the only user-editable dates, hence the counter fallbacks |
| error | `Field` (`aria-invalid` + message) × 10 call sites; `PhotoUploader` message | no global route/async error boundary |

---

## 8. Component additions

### Shipped in P5

| Component | Layer | Purpose |
|---|---|---|
| `Menu` | `ui/` | the disclosure primitive both header panels share. Planned as two bespoke popovers; one primitive with a `rootClassName` escape hatch covers both and keeps the outside-click/Esc/focus rules in a single place. |
| `NotificationsMenu` | `layout/` | replaces the planned `NotificationBell` — the bell is only the trigger, so the component owns trigger + panel. |
| `AccountMenu` | `layout/` | replaces the planned `AvatarMenu`. Makes the inert avatars the account entry point. |
| `Field.Select` | `ui/` (named export of `Field.jsx`) | the reminder-time and visibility controls in Settings. |
| `pages/Settings.jsx` | `pages/` | `/app/settings`, wireframe 12. |
| `ConfirmUnlink` | `couple/` | `NEW` P6 — the single partner-unlink confirmation, shared by Connect and Settings. Reads `partner` from `useData()` so neither caller passes it. |
| `pages/Legal.jsx` | `pages/` | `NEW` P6 — one public shell rendered twice (`/privacy`, `/terms`) from the two objects in `lib/legal.js`. Outside `RequireAuth`, so it carries the marketing `Footer`. |

One planned primitive was **not** extracted, deliberately:

- `SettingsSection` — `Section` and `Row` are local to `Settings.jsx`. Nothing else on the app
  renders an H2-plus-switch-rows block, so lifting them would be a second consumer that does not
  exist. They move to `ui/` the moment a second page wants them.

`ConfirmDialog`, by contrast, **was** extracted in P6 — but not under that name, and not as a
generic dialog. The two confirmations in Settings (unlink, delete) and the new one on Connect are
not the same question, so they are not the same component: `ConfirmUnlink` owns the partner-scoped
consequences and the avatar, while delete keeps its own `Modal` in `Settings.jsx` because it is the
only page that can end a session. The generic name implied a props-driven "are you sure" that would
have had to be told, at both call sites, what it was already supposed to know. `Connect.jsx`'s
immediate `unlinkPartner()` — the outstanding caller flagged in the P5 audit — now routes through
the shared dialog.

### Shipped in P7

| Component | Layer | Purpose |
|---|---|---|
| `UpdateReactions` | `updates/` (named export of `ReactionBar.jsx`) | owns the self/other rule: yours renders `ReactionSummary`, theirs renders the interactive `ReactionBar`. Three surfaces (Dashboard ×2, the Memories modal, the `/app/new` confirmation) used to each decide for themselves. |
| `pages/NewUpdate.jsx` | `pages/` | `/app/new`, wireframe 08 as a real destination. Renders the existing `DailyUpdateForm` and confirms in place. |
| `lib/redirect.js` | `lib/` | `redirectTarget(from, fallback)` — one rule for post-authentication navigation, used by both guards and both forms. Security-relevant: it is what stops a stored `from` becoming an off-site redirect. |
| `DataContext.personById` | `context/` | live author lookup, replacing the closure `Memories.jsx` kept re-implementing. |
| `SessionScope` | `App.jsx` | re-keys `DataProvider` on the signed-in user so mock state cannot cross sessions. |

`UpdateCard`, as planned in earlier drafts, was **not** built — and finding 16 turned out to be
partly stale. The "three presentations" had already collapsed to two when Dashboard adopted
`PhotoCard` for its own latest update. What remained duplicated was the *rule* (which reaction
surface, which author), not the container, and the rule is now single-sourced.

Merging `PhotoCard` and `MemoryCard` into one component with a `density` prop was considered and
rejected. They share almost nothing that is worth sharing: one is an `<article>` with a `footer`
slot and a fixed 240–288px photo, the other is a `<button>` with a gradient caption overlay, a hover
scale and a letter-style fallback for text-only updates. A discriminating prop would have meant
`{isTile ? <button> : <article>}` around nearly every line — two components wearing one name, and
every future change to either now has to be tested against both. The photo element is the only real
overlap and the two differ in height, alt semantics and transform, so there is no atom worth
extracting either.

One more duplicate fell out of the same pass, on the marketing side: the landing hero's floating
update card hardcoded its own letter avatar (`inline-flex h-9 w-9 … bg-rose-100 text-rose-700`),
which is exactly what `Avatar size="sm"` emits. It renders through `Avatar` now. The card itself is
not `PhotoCard` and should not become one — see §8 "Still proposed".

### Still proposed

| Component | Layer | Purpose | Blocking wireframe |
|---|---|---|---|
| `StatusPanel` | `ui/` | sage ✓ confirmation band; used by forgot-password success and the linked state | 04, 06 |
| `SegmentedControl` | `ui/` | replaces the hand-rolled filter chips in `Memories.jsx:78-95` | 09 |

Two items from this list are now closed: `UpdateCard` (resolved above — the rule converged, the
containers stayed) and `/app/new` (shipped as `pages/NewUpdate.jsx`).

One block should still be **deleted** as part of this work, not rewritten: the duplicated chip markup
in `Memories.jsx:78-95`, once `SegmentedControl` exists.

The hand-built update card in the landing hero (`Landing.jsx:128-139`) is **not** on that list. It is
marketing art at `max-w-[15rem]`, floated over a photograph, not a second consumer of the update
surface — replacing it with `PhotoCard` would recrop the hero. What it did duplicate was a letter
avatar, and that now renders through `Avatar`; the composition itself stays hand-built on purpose.

---

## 9. Rules for new code

1. Ask in order: does a `ui/` primitive cover it → can a domain component take a new prop → only
   then a new component. Never a new page-local copy of an existing one.
2. New visual constants go in `@theme` first, then get used. No arbitrary `text-[15px]`-style
   values in JSX (`DESIGN_SYSTEM.md` §6.1 bans this class of edit; 10 exist today).
3. Tailwind v4 cannot see class names built at runtime. Colour sets for moods and reactions stay as
   **literal strings in `lib/`** — do not "clean this up" into a computed map.
4. Every new list gets loading + empty + populated in the same commit.
5. Screens read data through `useData()` / `useAuth()`. A page importing `lib/mockData` directly is
   a bug, except `ME` (the current user id), which pages legitimately need for self/other checks.
6. Context files stay split (`useX.js` hook + `XProvider.jsx`) or Fast Refresh and lint both break.
7. A component with `onEdit`, `footer` or `action` props renders nothing for that affordance when
   the prop is absent. Do not add an `readOnly` boolean where an omitted prop already says it.
