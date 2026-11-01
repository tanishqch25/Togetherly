# Togetherly — User Flow

Status: **documented from the running implementation**, with target-state additions marked `NEW`.
Route map, guards, state names and destinations below are all verified against
`src/App.jsx:20-45`, `src/context/AuthProvider.jsx`, and `src/context/DataProvider.jsx`.

---

## 1. Model

Two people, one shared space, two devices. Everything in the app is an **update** — one photo
(optional), one mood, one line of text — published once a day and visible only to the partner.
Reactions are the only asynchronous reply. The product's job is to make the daily exchange take
under ninety seconds and to accumulate those exchanges into a browsable record.

Actors: `you` (`ME`) and `them` (`PARTNER`). Both are the same role; the app is symmetric.

---

## 2. Route map (as built)

| # | Route | Page | Shell | Guard | Wireframe |
|---|---|---|---|---|---|
| 1 | `/` | Landing | Marketing + Footer | public | 01 |
| 2 | `/login` | Login | `AuthShell` (split) | public | 02 |
| 3 | `/signup` | Sign Up | `AuthShell` | public | 03 |
| 4 | `/forgot-password` | Forgot Password | `AuthShell` | public | 04 |
| 5 | `/app/connect` *(unlinked)* | Connect · invitation | `AppShell` | `RequireAuth` | 05 |
| 6 | `/app/connect` *(linked)* | Connect · linked | `AppShell` | `RequireAuth` | 06 |
| 7 | `/app` | Dashboard | `AppShell` | `RequireAuth` | 07 |
| 8 | `/app/new` | Daily Update composer | `AppShell` | `RequireAuth` | 08 |
| 9 | `/app/memories` | Memories gallery | `AppShell` | `RequireAuth` | 09 |
| 10 | `/app/memories` → modal | Individual memory | over `AppShell` | `RequireAuth` | 10 |
| 11 | `/app/profile` | Couple Profile | `AppShell` | `RequireAuth` | 11 |
| 12 | `/app/settings` | Settings & Privacy | `AppShell` | `RequireAuth` | 12 |
| 13 | `/privacy` | Privacy Policy | Marketing + Footer | public | 13 |
| 14 | `/terms` | Terms of Service | Marketing + Footer | public | 13 |
| — | `/app/memories?open=<id>` | Individual memory, deep-linked | over `AppShell` | `RequireAuth` | 10 |
| — | header bell | Notification panel | popover on `AppShell` | `RequireAuth` | Global chrome |
| — | `*` | NotFound | bare | public | — |

### 2.1 Guard

```
RequireAuth  →  isAuthenticated ? <Outlet/> : <Navigate to="/login" replace state={{ from: pathname + search }}/>
RequireGuest →  isAuthenticated ? <Navigate to={redirectTarget(from, fallback)} replace/> : <Outlet/>
```

`AuthProvider.jsx` exposes `{ user, isAuthenticated, pending, signIn, signUp, signOut }`,
where `isAuthenticated = Boolean(session?.user)`. The mock session is persisted in
`localStorage["togetherly.session"]` in a shape deliberately identical to Supabase's
`{ user: { id, email, ... } }`, so Stage 2 replaces the provider internals without touching a
single page.

**Both guards aim at one destination (`lib/redirect.js`).** Signing in flips
`isAuthenticated` while the form's own `navigate()` is still in flight, so `RequireGuest` on
`/login` and the page's submit handler are both live at that instant. If they disagreed, whichever
won would decide where the person lands — and the won deep link would be the loser. They read the
same `redirectTarget(location.state?.from, fallback)`, so the outcome is the same either way: the
preserved path if there is one, `/app` after a login, `/app/connect` after a signup. `/signup` is
where a brand-new space has no partner yet, so its fallback differs.
`/forgot-password` is deliberately **not** guest-guarded: it is the way back in for someone signed
out who has forgotten the password.

A stored `from` is only honoured when it starts with a single `/` — never `//`, never an absolute
URL — so a redirect captured before sign-out cannot become a way off the site.

---

## 3. Primary flows

### Flow A — First-run: arrival to linked space

```
/  Landing
 │   [Get started — free]                       (Landing.jsx:94)
 ▼
/signup  Sign Up
 │   name · email · password · confirm → [Create my space]   (pending = 700ms simulation)
 ▼   signIn/signUp writes session → isAuthenticated true
/app  Dashboard   ← lands here after signup
 │   first-run copy invites linking
 ▼
/app/connect  (status = 'pending')
 │   A) generate: [Create invitation code] → code TLSH-4827 shown → copy / regenerate
 │   B) receive : enter partner's 4-4 code → [Join their space]
 ▼
/app/connect  (status = 'connected')  →  redirect /app
```

Alphabet used for codes excludes visually ambiguous characters (`O/0`, `I/1`):
`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, grouped `XXXX-XXXX`.

> Note on state: `mockData.js:211` seeds `status: 'pending'`, but `DataProvider.jsx:20` initialises
> the live connection as `connected` so the demo shows a populated product. The pending path is
> reachable via **Unlink** (`unlinkPartner`, `DataProvider.jsx:91`), which since P6 always sits
> behind `ConfirmUnlink`. The two branches are separate screens — wireframes 05 and 06.

### Flow B — Daily loop (the product's reason to exist)

```
/app  Dashboard
 ├─ reads partner's newest update + relativeTime
 ├─ [Add today's update] / [Share another moment]  →  /app/new
 └─ partner's card: [ReactionButton × 5]  toggleReaction(updateId, reactionId, ME)
      self-authored card shows ReactionSummary (read-only) — you cannot react to yourself

/app/new  composer, its own route inside AppShell
 ├─ PhotoUploader → optional photo, preview, 10MB + image-type validation
 ├─ MoodSelector → 8 moods, single-select
 ├─ Textarea → one line, 280 max
 ├─ already posted today → sage-free note with that day's mood, publishing still allowed
 └─ [Publish]  publishUpdate({photo, moodId, message})   (900ms round-trip lives in the provider)
      ▼ confirmation replaces the form, in place
      "Published. They will see it the moment they open their phone."
      own PhotoCard echoed back · [Share another moment] resets the form · [Back to today] → /app
```

The composer is a destination rather than an expansion, so notifications, the Memories empty state
and the dashboard CTA all have one address to point at (`/app/new`) instead of having to know how to
open a widget on someone else's page.

Terminal states: nothing posted today → `EmptyState` with one action; publish failure → inline
error under the offending field; photo too large → `PhotoUploader` error line, form still editable.

### Flow C — Looking back

```
/app  →  [Memories quick link]  or  bottom tab "Saved"
 ▼
/app/memories
 ├─ grouped descending by monthKey (lib/date.js)
 ├─ month header (h2) + grid of MemoryCard
 ├─ loading  → Card + LoadingSpinner "Collecting your memories"    (Memories.jsx:98-101)
 ├─ empty    → Card + EmptyState + [Write today's update] → /app/new (Memories.jsx:102-113)
 ▼ click a card
Modal (wireframe 10)
 ├─ full PhotoCard, author, timestamp, mood
 ├─ reactions: ReactionBar if theirs · ReactionSummary if yours  (Memories.jsx:134-136)
 └─ [Close] → returns to the same scroll position
```

`selectedId` (not a snapshot object) is stored, and the update is looked up live from context, so a
reaction toggled inside the modal is visible immediately on close.

### Flow D — Milestones and identity

```
/app  Dashboard  → CoupleCounter (days together) · CountdownCard (next meeting)
/app/profile     → PartnerCard ×2 with [Edit]
                    ▼ Modal: avatar upload · name · nickname · city → [Save changes]
                 → Couple details: anniversary · next meeting · both cities → save
                 → Preferences (4 switches)          ── moved out to Settings in P5
                 → Your space: unlink, sign out      ── moved out to Settings in P5
```

Edits made in Profile propagate to the Dashboard header avatars and to Memories author names,
because both read `useData()` rather than the seed object.

### Flow E — Session exit

```
header avatars [Your account ▾] → panel → [Log out]  →  signOut() → clears session → /
Connect / Settings → unlink → ConfirmUnlink → [Unlink partner] → /app/connect (invite view)
Settings → delete my space → Modal → [Delete my space] → signOut() → /
```

Before P5 the header's icon-only logout button called `navigate('/')` and nothing else: the landing
page appeared, `localStorage["togetherly.session"]` survived, and pressing Back returned you to a
"logged out" app. It now runs the same `signOut()` the Profile page used.

Verified in P6: `signOut()` clears `localStorage["togetherly.session"]` to `null`, the app lands on
`/`, and both browser-Back and a fresh load of `/app/memories` resolve to `/login` — no authenticated
content renders without a session. Cancelling `ConfirmUnlink` leaves the connection intact; Escape
closes it and unlocks body scroll.

**The mock space does not survive the session (P7).** `DataProvider` sits above the route guard —
so it cannot unmount with the protected tree — and `App.jsx` re-keys it on the signed-in user:

```
<SessionScope>  ≡  <DataProvider key={user?.id ?? 'anonymous'}>
```

Signing out changes the key, the provider remounts and re-seeds. Verified: publish an update, mark
all notifications read, sign out, sign in — the update is gone, the badge is back to `3 unread`, and
the timeline holds the two seed moments. Without the key, a shared device handed one person's
private timeline to the next. Stage 3 makes this moot by fetching per-user from Supabase; the key
stays as the belt-and-braces until then, and costs nothing.

### Flow F — Notifications and settings (shipped in P5, wireframes 11–12)

```
header [bell ▸ badge ●3]  →  disclosure panel, six most recent
   ├─ ♥ Sparkles reacted with Proud     → /app/memories?open=upd-02
   ├─ ▤ Sparkles checked in             → /app/memories?open=upd-01
   ├─ ⛶ 34 days until you see Sparkles  → /app/memories?open=… (or /app when no update backs it)
   ├─ ⛓ Your invite code is still live  → /app
   └─ [Mark all read]  disabled at zero unread

header avatars → panel: [Your profile] /app/profile · [Settings & Privacy] /app/settings · [Log out]

/app/settings
   ├─ #check-ins      reminder on/off, quiet hours, reminder time select (disabled with the nudge)
   ├─ #notifications  their check-in, sound on reactions, milestone days
   ├─ #recap          Beta chip, consent line, switch disabled, [Preview an example recap] modal
   ├─ #privacy        visibility select (fixed, shown as fact), data export row disabled
   └─ #danger         open Connect · unlink partner · delete my space (both confirmed)
```

`seedNotifications` in `lib/mockData.js` is the model: `{ id, kind, actorId, updateId?, title?,
body?, reactionId?, createdAt, read }`. `DataProvider` owns the list and exposes `notifications`,
`unreadCount`, `markNotificationRead(id)` and `markAllNotificationsRead()`; opening a row marks that
row read. No notification data existed before P5. There is still no server push — Stage 3 replaces
the seed with Supabase Realtime behind the same four context members, so no page changes.

---

## 4. State matrix

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Global data (`useData`) | `loading` — constant `false` until Stage 3 gives it a fetch; only `Memories` branches on it | n/a | n/a (mock) | n/a |
| Login / Sign Up | `pending` → button `loading` | — | per-field `errors` + `aria-invalid` | redirect `/app` |
| Forgot Password | button `loading` | — | inline `error` | confirmation panel + [Back to log in] (`ForgotPassword.jsx:51`) |
| Dashboard | partner card skeleton via `EmptyState` | "not posted today yet" heading | publish error inline | flash message |
| PhotoUploader | preview render | dropzone prompt | type/size message | thumbnail + [Remove] |
| Memories | `LoadingSpinner` in a Card | `EmptyState` + one action | — | grid |
| Memory modal | — | "No reactions yet." (`ReactionBar.jsx:24`) | — | live reaction counts |
| Connect | button `loading` | pending state = invitation UI | invalid/expired code message | linked confirmation (`Connect.jsx:61`) |
| Profile edit | [Save changes] | — | blank name rejected inline, dialog stays open | trimmed name propagates everywhere |
| Couple counters | live 1s tick | cleared date → "Set your anniversary" / "Pick a date and the clock starts." | — | a new date applies on the same render, not on the next tick |

---

## 5. Navigation contract

### Primary nav — sticky top bar, `lg` and up
`Logo` ← left. Centre: **Home · Memories · Connect · Profile**, each with a Lucide icon, active
state `rose-100` fill + `rose-800` text. `max-w-6xl`, `px-5 → sm:px-8`.

### Secondary nav — right of the top bar, at every width
**[bell ●n]** then the two avatars + chevron. Both open `Menu` disclosure panels; the cluster is
`relative` and each `Menu` root is `static`, so a 336px panel aligns to the cluster's right edge
(34→370 inside a 390px viewport) instead of running off-screen from the bell.

### Bottom bar — fixed, below `lg`
Four items, `flex-1` equal width, icon + label, safe-area inset applied
(`pb-[env(safe-area-inset-bottom)]`). Labels are the short forms: Home · Saved · Connect · You two.
Main content reserves `pb-28` so nothing sits under the bar. **The bar stays at four items** —
notifications and settings reach through the top bar, which is what keeps it uncrowded at 390px.

The swap moved from `md` to `lg` in P5. At 768px with a scrollbar the top bar offers 689px of
content box and the row needs 764px, so it overflowed by 43px — a defect that predates the bell and
that the bell widened. Tablets now get the bottom bar and an uncluttered top bar.

### Active-page indication
`NavLink` `isActive` drives both bars. `/app` uses `end` so it does not stay active on
`/app/memories`. The account menu's rows are `NavLink`s too, so "Your profile" lights while
`/app/profile` is open. Correct as built.

### Back/forward and deep links
Browser history works (BrowserRouter). In-app back links exist on Memories, Profile and Settings
(`← Back to today`). `/app/memories?open=<id>` is now a real deep link: the modal initialises from
the query and closing rewrites the URL with `replace: true`, so Back dismisses the memory.
Still open: none for this section. `RequireAuth` now preserves the attempted path with its query
string — a cold load of `/app/memories?open=upd-01` signed out arrives at the memory modal after
login — and authenticated visitors on `/login` and `/signup` are redirected onward.

---

## 6. Gaps against the brief's §3/§4 requirements

| Requirement | Status |
|---|---|
| Consistent nav across all authenticated pages | ✅ single `AppShell`, 5 routes |
| Clearly labelled items, active indication | ✅ |
| Profile access from navigation | ✅ top tab, bottom "You two", and the avatar menu all reach `/app/profile` |
| Notification access from navigation | ✅ header bell + unread badge at every width, panel deep-links to the memory |
| Mobile bottom nav, no overflow | ✅ four items at 390px; secondary nav stays in the top bar |
| Top bar, no overflow | ✅ fixed in P5 by moving the nav swap to `lg` — was 43px over at 768px |
| Settings & Privacy page (wireframe 12) | ✅ `/app/settings`, fed by Profile's relocated controls |
| Individual memory view (wireframe 10) | ✅ modal, not a route (deliberate — see `WIREFRAMES.md` 10), now with `?open=` |
| Daily update composer (wireframe 08) | ✅ `/app/new`, its own route inside `AppShell` since P7. Was inline on Dashboard |
| One update, one set of presentation rules | ✅ `UpdateReactions` owns the self/other rule; `personById` lives in context. `PhotoCard` and `MemoryCard` stay distinct on purpose — see `COMPONENT_ARCHITECTURE.md` §8 |
| Deep link survives the login round-trip | ✅ `RequireAuth` stores `from` (path + query); verified end-to-end at `/app/memories?open=upd-01` |
| Signed-in visitor kept out of login/signup | ✅ `RequireGuest`, aiming at the same destination the form does |
| New session never inherits the last one's data | ✅ `DataProvider` re-keyed per user in `App.jsx` |
| AI recap with consent | ✅ opt-in switch, disabled and labelled Beta; no API wired, per Stage 1 constraint |
| Every nav item has a real destination | ✅ in-app, and ✅ in the public footer since P6 — the eight inert `href="#"` rows are gone; the footer now points at `/`, three Landing anchors, `/signup`, `/privacy` and `/terms`. "Our story" and "Support" were dropped rather than left without a destination. See `WIREFRAMES.md` 01 |
| Privacy / Terms reachable without signing in | ✅ `/privacy` and `/terms`, both outside `RequireAuth`, rendered by one `Legal` shell over `lib/legal.js` |
| Every button does something real | ✅ audited P8 — zero `href="#"`, zero `TODO`, zero `alert()`, zero `console.log`. The two disabled buttons in Settings (`Download my data`, "who can see my updates") are honest, labelled and explained in place, not stubs. |
| A cleared date input cannot break a screen | ✅ fixed in P8. `toDateInput` called `.toISOString()` on `''`, which throws — clearing "Next meeting" unmounted the whole app. `lib/date.js` now routes every parse through `timeValue` and the two counters have unset text. |
| Logout survives Back and direct URL | ✅ verified P8. Logout clears `togetherly.session` and lands on `/`; Back steps to `/login` and stays there — 0 protected articles rendered. Direct loads of `/app/*` redirect with the path preserved. |
| Required text rejected everywhere | ✅ P8 closed the last gap: Profile accepted a blank name and rendered the header as "& Sparkles" with a "?" avatar. It now rejects inline, trims on save, and matches the auth forms. |
| Clipboard failure is visible | ✅ `Connect.copyCode` had no `catch`, so a denied or unavailable clipboard left the button looking dead. It now reads "Could not copy" and the code stays on screen to copy by hand. |
