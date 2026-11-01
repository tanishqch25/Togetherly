# Togetherly — Wireframes

Twelve screens, numbered exactly as specified in the brief, plus **13** — the public legal pages,
added in P6 and outside the brief's set. Every wireframe documents the
**reading order** of what the code renders today, with a label per region, button placement, mobile
behaviour and the destination of every action. Deviations and additions are marked `NEW` and tie
back to `DESIGN_SYSTEM.md` §9.

Legend: `[ ]` button · `( )` radio/switch · `<nav>` navigation · `▾` popover · `≡` menu · `▢` image

---

## Global chrome — the two navigation surfaces

Everything authenticated shares one shell (`AppShell.jsx`). It is drawn once here rather than
repeated inside each wireframe.

```
DESKTOP  ≥1024px — sticky top bar, 1152px container
┌──────────────────────────────────────────────────────────────────────────────┐
│ A  Logo        B  Home  Memories  Connect  Profile      C(▾)  D(●3)          │
└──────────────────────────────────────────────────────────────────────────────┘
   A brand → /app
   B primary nav, active = rose-100 fill + rose-800 text
   C account menu: the two avatars + chevron → ▾ panel
                         Emerson · Toronto, Canada with Sparkles
                           ♥ Your profile      → /app/profile
                           ⚙ Settings & Privacy → /app/settings
                           ⎋ Log out           → signOut() → /
   D notification bell + unread badge → ▾ panel, six most recent rows

TABLET / MOBILE  <1024px — fixed bottom bar, safe-area inset applied
┌──────────────────────────────────────────────────────────────────────────────┐
│ A Logo                                                        C(▾)  D(●3)     │
├──────────────────────────────────────────────────────────────────────────────┤
│                         page content (pb-28 reserved)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│      ⌂ Home      ▤ Saved       Connect      ♥ You two                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

Active state is `NavLink isActive`; `/app` uses `end` so Home does not stay lit on child routes.

**The swap sits at `lg`, not `md`.** Logo (132px) + four top tabs (458px) + the account cluster
(142px) + two `gap-4` need 764px of content box; a 768px viewport with a scrollbar offers 689px, so
the bar overflowed by 43px. Tablets keep the bottom bar and get the uncluttered top bar instead.

**Secondary navigation never enters the bottom bar.** Bell and account menu live in the sticky top
bar at every width, which is what holds the mobile bar at exactly four tabs. Both disclosure panels
anchor to that cluster (`Menu rootClassName="static"` over a `relative` wrapper) rather than to
their own trigger — anchored to the bell alone the 336px panel ran from x=−66 to x=270 at 390px.
Measured after the fix: 34 → 370 inside a 390px viewport.

---

## 01 — Landing

**Purpose** Convince one person in a long-distance relationship that this is a private space for
two, not another social product. Single conversion goal: start an account.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1 <nav> Togetherly      Features  Memories  How it works    [Log in][Get…] │
├───────────────────────────────────────────┬──────────────────────────────────┤
│ 2 (eyebrow pill) For long-distance couples│                                  │
│   3 H1  "Distance means so little when    │ 4 ▢ hero-couple.png              │
│           someone means so much."         │    h-[26rem] → sm:h-[30rem]      │
│   5 body-lead  Togetherly is a quiet,     │   ┌─────────────┐                │
│      private space for two people apart…  │   │ 6 ▢ Sparkles│  7 ┌─────────┐ │
│   8 [Get started — free]  [Log in]        │   │  8 min ago  │  │ 1,342     │ │
│   9 meta  Built for one couple. No feeds, │   │ (mood chip) │  │ DAYS TOG. │ │
│      no followers, no ads.                │   └─────────────┘  └───────────┘ │
├───────────────────────────────────────────┴──────────────────────────────────┤
│ 10 H2 Everything a daily check-in needs                                      │
│    11 intro body-lead                                                        │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐                                    │
│    │12 ▢ icon │ │12        │ │12        │   6 feature cards, 3×2 @ lg,        │
│    │ H3 title │ │ H3       │ │ H3       │   2×1 @ sm, 1×1 @ base              │
│    │ body     │ │ body     │ │ body     │   (photo day · 8 moods · reactions  │
│    └──────────┘ └──────────┘ └──────────┘    · memory · countdowns · private) │
├──────────────────────────────────────────────────────────────────────────────┤
│ 13 ┌─ surface panel ─────────────────────────────────────────────────────┐   │
│    │ H2 Your relationship, kept properly        │ 14 ▢ ▢ ▢ 3-image      │   │
│    │ body-lead                                  │      collage 2-col    │   │
│    │ 15 ✓ photo+mood+message kept together      │                       │   │
│    │    ✓ organised month by month              │                       │   │
│    │    ✓ tap to reopen the full day            │                       │   │
│    └─────────────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 16 H2 (centred) Three steps, then it is yours                                │
│    ┌────────────┐ ┌────────────┐ ┌────────────┐                              │
│    │ 01 numeral │ │ 02         │ │ 03         │  create space · invite       │
│    │ H3 + body  │ │ H3 + body  │ │ H3 + body  │  partner · show up daily     │
│    └────────────┘ └────────────┘ └────────────┘                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ 17 ┌── solid rose band ──────────────────────────────────────────────────┐   │
│    │        ▢ sunset icon   H2 (cream) Tonight, tell them about your day  │   │
│    │        body (rose-100) Set up in under two minutes                   │   │
│    │        [Create your space]   [I already have one]   ← centred        │   │
│    └──────────────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 18 Logo · "Made for the people waiting at the other end of a phone call."     │
│ 19 <footer> Logo + tagline + "Built for two people" chip                     │
│             Product: Features · Memories · How it works · Create your space  │
│             Legal:  Privacy Policy · Terms of Service                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 nav → 2 eyebrow → 3 H1 → 5 supporting paragraph → 8 primary CTA pair → 9
assurance line → 4/6/7 hero visual cluster → 10–12 feature grid → 13–15 memory showcase → 16 steps
→ 17 closing band → 18–19 footer.

**Buttons and placement** `Get started — free` (primary, `lg`) is left-aligned in the hero at
`Landing.jsx:94`, `Log in` (secondary) immediately right of it; the same pair repeats inverted
inside the closing band (17) as `Create your space` (secondary on rose) and `I already have one`
(ghost). Nav (1) carries a third pair right-aligned on desktop only.

**Actions → destinations** Features/Memories/How it works are in-page anchors (`#features`
`#memories` `#rituals`, `scroll-mt-24`). All CTAs → `/signup` or `/login`. The footer is fully wired
as of P6 — no `href="#"` remains. Because the footer also renders on the public legal pages, its
section links are absolute (`/#features`, not `#features`) and `Landing.jsx` gained a scroll-to-hash
effect: `<Link to="/#features">` sets the fragment but React has not painted the anchor yet, so the
browser cannot jump on its own. Privacy Policy → `/privacy` and Terms of Service → `/terms` are
public, outside `RequireAuth` — the P5 note that "Privacy" could not point at `/app/settings#privacy`
from here still holds, which is exactly why the two new pages exist rather than a link to Settings.
"Our story" and "Support" were **removed** instead of being given destinations, because no page for
them exists and an invented one is worse than a shorter footer.

**Mobile** Nav collapses to `≡` (`MarketingNav.jsx:24-35`); the panel stacks the three anchor links
then two full-width buttons, and locks body scroll while open. Hero grid → single column, visual
below copy. Floating cards (6) and (7) are hidden below `sm` and `lg`. Feature grid 3→2→1. Panel
(13) stacks text above collage. Band (17) padding drops to `px-6 py-14`, buttons wrap.

**Deltas** 3 H1 is `text-4xl → sm:text-5xl → lg:text-[3.4rem]` — acceptable, this is the marketing
hero, exempt from the app's `title-page` cap. 11 `text-3xl → sm:text-4xl` on a section heading is
not: sections 10/13/16 should drop to `title-section` (20–22px) per `DESIGN_SYSTEM.md` §5.2. 16's
numerals are `rose-200` (1.23:1) — decorative, but they should read as `rose-600` graphic ink.

---

## 02 — Login

**Purpose** Return an established user to their shared space in under ten seconds.

```
┌──────────────────────────────┬───────────────────────────────────────────────┐
│ 1  brand panel (lg+ only)    │  2  < Logo />        [Back to site →]         │
│    Togetherly wordmark       ├───────────────────────────────────────────────┤
│                              │  3  eyebrow   WELCOME BACK                    │
│    4  H2  "Distance means    │  4  H1  Log in to your space                  │
│        so little…"           │  5  body  Two people, one private timeline…   │
│                              │                                               │
│    6  • One photo, one mood, │  6  ┌ Email ─────────┐  ┌ Password ─────────┐ │
│        one line a day        │     │ (text input)   │  │ (••••••••)   👁   │ │
│    • Reactions that answer   │     └────────────────┘  └───────────────────┘ │
│      without a conversation  │      right-aligned: [Forgot password?]        │
│    • A timeline of the whole │                                               │
│      long-distance year      │  7  [        Log in        ]  full-width lg   │
│                              │                                               │
│    7  "The best part of my   │  8  New here?  Create your space  → /signup   │
│      day…"                   │                                               │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

**Reading order** 2 mobile logo row (hidden `lg+`) → 3 eyebrow → 4 H1 → 5 description → 6 field
group (email, then password with the forgot link directly beneath it, right-aligned —
`Login.jsx:72`) → 7 submit → 8 footer link pair.

**Buttons** `Log in` is full-width, `size="lg"`, primary, `loading={pending}` (`Login.jsx:78`). No
secondary button; the escape hatches are text links.

**Actions → destinations** Submit → `signIn(email, password)` → on success `/app`; per-field errors
render under each input. `Forgot password?` → `/forgot-password`. `Create your space` → `/signup`.
`Back to site` → `/`.

**Mobile** Brand panel hidden (`lg:flex`); logo row (2) appears; single column, `px-5 py-10`,
form column `max-w-md`. Full-bleed beige sheet — no card.

**Deltas** 4 `H2` renders at `text-4xl` while the page `H1` renders `text-3xl` — the level-2
heading is larger than the page title (`AuthShell.jsx:17` vs `:52`). Fix in P4: panel quote becomes
`title-page` 30px, the form's H1 keeps 30px. The rose panel is a flat `rose-500` fill today with a
blurred circle ornament (`AuthShell.jsx:33-37`); `NEW` P5 removes the blur and re-points the panel
to `sage-500` with `charcoal` text — 6.11:1, versus 2.58 for cream-on-rose. This is also the
highest-contrast fix available anywhere in the auth flow.

---

## 03 — Sign Up

**Purpose** Create the private space. The account exists before the partner does, so this screen
must not ask for anything partner-related.

```
┌──────────────────────────────┬───────────────────────────────────────────────┐
│ 1 brand panel (same as 02)   │  2 < Logo />            [Back to site →]      │
│                              ├───────────────────────────────────────────────┤
│                              │  3 eyebrow  START YOUR SPACE                  │
│                              │  4 H1  Create your space                      │
│                              │  5 body  Free for two people…                 │
│                              │                                               │
│                              │  6  ┌ Your name ───────────┐                  │
│                              │     ┌ Email ───────────────┐                  │
│                              │     ┌ Password ────────────┐  min 8           │
│                              │     ┌ Confirm password ────┐                  │
│                              │                                               │
│                              │  7  [    Create my space    ] full-width lg   │
│                              │                                               │
│                              │  8  Already have a space?  [Log in]  ghost    │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

**Reading order** 2 → 3 → 4 → 5 → 6 four stacked fields (`SignUp.jsx:54,64,74,84`) → 7 submit → 8
cross-link.

**Buttons** `Create my space` full-width `lg` primary with `loading` state. `Log in` ghost,
full-width, below (`SignUp.jsx:104`).

**Actions → destinations** Submit validates all four fields client-side, then `signUp()` →
`/app/connect` (first-run, see 05). `Log in` → `/login`.

**Mobile** Identical single column; brand panel hidden. Fields are full-width stacked, never paired.

**Deltas** No password-strength or match affordance beyond inline errors — `NEW` suggestion for P5:
a `sage-700` ✓ against the confirm field once both match, so the user learns before submitting. The
confirmation copy that a partner still needs inviting should appear as a `meta` line under 7, not a
new component.

---

## 04 — Forgot Password

**Purpose** Single-field recovery, then a clear dead-end back to login.

```
┌──────────────────────────────┬───────────────────────────────────────────────┐
│ 1 brand panel                │  2 < Logo />           [Back to site →]       │
│                              ├───────────────────────────────────────────────┤
│                              │  3 eyebrow  ACCOUNT RECOVERY                  │
│                              │  4 H1  Reset your password                    │
│                              │  5 body  We'll email a link…                  │
│                              │                                               │
│                              │  6 ┌ Email ─────────────┐                     │
│                              │  7 [   Send reset link  ] full-width lg       │
│                              │  8 ← Back to log in                           │
└──────────────────────────────┴───────────────────────────────────────────────┘

STATE 04.b — after a successful send (replaces 3–7 in place):
┌──────────────────────────────────────────────────────────────────────────────┐
│ 9 ✓ sage check · H1  Check your inbox                                        │
│ 10 body  If that address has a space, the link is on its way.                │
│ 11 [   Back to log in   ] full-width secondary   (ForgotPassword.jsx:51)     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 2 → 3 → 4 → 5 → 6 email field → 7 send → 8 text link. On success the form is
replaced by 9 → 10 → 11.

**Buttons** `Send reset link` primary full-width `lg`; after success `Back to log in` secondary
full-width. Both states have exactly one primary action.

**Actions → destinations** → `resetPasswordForEmail` (Stage 2 stub, `ForgotPassword.jsx:25`) →
success panel → `/login`. Link 8 → `/login`.

**Mobile** Same single column. Error message sits under the field, never as a toast.

**Deltas** The success state is the only place a confirmation icon appears in the product; standardise
it as a `sage-800` check on `sage-100` in a reusable `StatusPanel` rather than ad-hoc markup.

---

## 05 — Partner Invitation (unlinked)

**Purpose** Create the second half of the space. Both halves of the pairing UI live on one screen,
so a user can generate or consume a code without navigating.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ <nav AppShell>                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 eyebrow  LINK YOUR SPACE                                                    │
│ 2 H1  Connect with your partner                                               │
│ 3 body  Two codes, one direction. Generate yours, or enter theirs.            │
│                                                                               │
│ 4 ┌── status banner · sand-200, dashed ─────────────────────────────────────┐ │
│   │ ( ) Not connected yet — you and Sparkles are still two separate spaces  │ │
│   └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌───────────────────────────────────┬────────────────────────────────────────┐│
│ │ 5 ▢ PartnerCard  YOU              │ 6 ▢ PartnerCard  THEIR SPACE           ││
│ │   E avatar · Emerson "Emmy"        │   ? avatar · awaiting invite           ││
│ │   Toronto                          │   (disabled, ink-300)                 ││
│ └───────────────────────────────────┴────────────────────────────────────────┘│
│                                                                               │
│ ┌── A: your invitation code ─────────────────────────────────────────────────┐│
│ │ 7 H2  Your invitation code                                                 ││
│ │ 8 body  Send this to Sparkles or read it out on a call.                    ││
│ │ 9 ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                                       ││
│ │   ╎      TLSH-4827               ╎   figure 24–32px, +0.18em tracking      ╎│
│ │   ╎   Expires 7 November 2026    ╎   meta                                   ╎│
│ │   └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘                                       ││
│ │ 10 [⧉ Copy code]   [↻ New code]                                            ││
│ │ 11 meta  Codes are single-use…                                              ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ ┌── B: join with their code ─────────────────────────────────────────────────┐│
│ │ 12 H2  Already have their code?                                            ││
│ │ 13 ┌ Partner's invitation code ─┐   hint XXXX-XXXX                         ││
│ │ 14 [        Join their space        ]  full-width lg primary               ││
│ └────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 → 2 → 3 → 4 status → 5/6 the two spaces side by side → 7 → 8 → 9 the code
itself → 10 actions → 11 conditions → 12 → 13 → 14 submit.

**Buttons and placement** `Copy code` (primary `md`) and `New code` (secondary `md`) sit as a
left-aligned pair directly under the code (`Connect.jsx:100,104`) — they act on region 9 and must
stay adjacent to it. `Join their space` (primary `lg`, full width) belongs to region B and sits
inside it (`Connect.jsx:135`). Separating these two groups is the whole point of the two-panel
layout; they are never adjacent in reading order.

**Actions → destinations** Copy → clipboard, label swaps to `Copied` with a ✓. If the clipboard is
unavailable (insecure context) or permission is denied the label swaps to `Could not copy` instead —
caught in P8, because the rejection used to escape and the button simply looked dead. The code itself
is always visible at region 9 in `figure` type, so a failed copy has a manual route without needing a
new one. `New code` →
`regenerateInvite()`, region 9 repaints and a short "A new code is ready" line appears. `Join their
space` → `joinWithCode(code)`; success sets `connection.status = 'connected'` and swaps the page to
wireframe 06; failure puts the error under 13 (`Connect.jsx:143`).

**Mobile** Regions 5/6 stack. Panels A and B stack full width. The code keeps its `figure` size at
32px — it has to be legible while read aloud over a call, which is the primary use case. `Copy
code` / `New code` become a two-up row that wraps to full-width buttons below 380px.

**Deltas** 9 is currently `font-display text-3xl → sm:text-4xl` in `rose-600` (4.41 — large-text
compliant) but it visually competes with the page H1 in region 2. `NEW`: cap at the `figure` token
(32px), keep `rose-700`. The dashed `rose-200` box on `cream-100` becomes `sand-300` dashed on
`sand-50` so the code block reads as a coupon, not an error.

---

## 06 — Partner Connection (linked)

**Purpose** Confirm the link exists, show both halves as one space, and offer the recovery path.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ <nav AppShell>                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 eyebrow  LINKED · 2 H1  You and Sparkles share one space                   │
│ 3 body  Every update lands in the same timeline from here on.                │
│                                                                               │
│ 4 ┌── sage confirmation band ────────────────────────────────────────────────┐│
│ │   ✓  Connected since 14 February 2023        [Unlink] ← right-aligned sm  ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│ 5 ┌───────────────────────────┬───────────────────────────┐                   │
│   │ ▢ Emerson "Emmy"          │ ▢ Sparkles "Sparky"       │   PartnerCard ×2  │
│   │ Toronto · E               │ Manchester · S            │   (Connect.jsx:80)│
│   │ "You"                     │ "Connected partner"       │                   │
│ └───────────────────────────┴───────────────────────────┘                   │
│ 6 timezone note  EST ↔ GMT · 5 hours apart                                   │
│                                                                               │
│ 7 [→ Dashboard]  [→ Memories]                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 → 2 → 3 → 4 confirmation + unlink → 5 the two people → 6 the gap between them →
7 onward links.

**Buttons** `Unlink` is secondary `sm`, right-aligned in the confirmation band — deliberately the
least prominent control on the page. Closed in P6: the call was immediate (`Connect.jsx:72`), a
data-loss risk on a misclick, and it disagreed with `/app/settings#danger`, which already gated the
same action behind a confirmation. Both entry points now render one `couple/ConfirmUnlink`, so the
two ask the identical question with the identical consequences. The dialog is mounted *outside* the
`connected ? … : …` branch — confirming flips that branch underneath it, and a dialog living inside
the branch it destroys would unmount mid-dismiss.

**Actions → destinations** `Unlink` → `unlinkPartner()` → status returns to `pending`, page swaps to
wireframe 05. 7 → `/app`, `/app/memories`. Region 5 → `/app/profile`.

**Mobile** 5 stacks; 6 wraps under it; unlink stays in the band, never full-width.

**Deltas** `NEW` P5 adds region 4's sage band (today the linked state is shown by a rose-tinted
`Card`, `Connect.jsx:61`) so the two states of this screen are told apart by hue, not by copy —
sage carries "calm/established", rose carries "your action".

---

## 07 — Main Dashboard

**Purpose** Answer one question on arrival: *where are we right now?* Then make today's check-in
the loudest possible action on the page.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ <nav AppShell>                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 eyebrow  GOOD MORNING, EMMY        ← greeting by hour + nickname           │
│ 2 H1  Sparkles checked in 8 hours ago.  ← or "…has not posted today yet."    │
│ 3 body  Sparkles is in Manchester. Post a photo and a line…                  │
│                                                                               │
│ 4 ┌ CoupleCounter ────────────┐ ┌ CountdownCard ────────────────┐             │
│   │ figure 1,342  days together│ │ figure 34d 06h 12m to Sparkles│           │
│   │ since 14 Feb 2023          │ │ 6 Nov · Manchester            │            │
│   └────────────────────────────┘ └───────────────────────────────┘           │
│   (2 columns ≥sm, stacked below sm — Dashboard.jsx:84)                        │
│                                                                               │
│ ┌── primary column 1.45fr ──────────────────┬── aside 1fr ─────────────────┐ │
│ │ 5 section  H2 "From Sparkles" [✨ Newest]  │ 9 [▢ Memories                │ │
│ │   ┌──────────────────────────────────┐    │     16 moments, by month]    │ │
│ │   │ ▢ photo  (or 6 mood text tile)   │    │ 10 [▢ Your profile           │ │
│ │   │ Sparkles · 8 hours ago · (missing you)│   │     Emerson & Sparkles]   │ │
│ │   │ message text                     │    │ 11 ┌ Card ─────────────────┐  │ │
│ │   │ 7 [♥1][✦2][🌸0][☺0][👍1]          │    │ │  H2 Their recent moods  │  │ │
│ │   └──────────────────────────────────┘    │ │ (chip) 8 hours ago       │  │ │
│ │   — or, if they have not posted —          │ │ (chip) yesterday         │  │ │
│ │  6' ▢ EmptyState  “No update from          │ │ (chip) 2 days ago        │  │ │
│ │      Sparkles yet”   ·   no action here    │ │ (chip) 3 days ago        │  │ │
│ │                                            │ └──────────────────────────┘  │ │
│ │ 8 section  H2 "Your update"  [ ✎ CTA ]     │                               │ │
│ │      ↑ ghost sm, right of the H2 → /app/new│                               │ │
│ │      label: 'Add today’s update' or,       │                               │ │
│ │      once anything exists, 'Share another  │                               │ │
│ │      moment'.  No inline form any more.    │                               │ │
│ │                                            │                               │ │
│ │   — when nothing is posted —               │                               │ │
│ │  8' ▢ EmptyState  “You have not posted     │                               │ │
│ │      yet”  ·  [ Write your first update ]  │                               │ │
│ │   — once something exists —                │                               │ │
│ │  8″ ▢ PhotoCard + UpdateReactions          │                               │ │
│ │      read-only: not your own update        │                               │ │
│ │  8‴ meta  You already shared today — that  │                               │ │
│ │      is the streak Sparkles is looking for.│                               │ │
│ └────────────────────────────────────────────┴───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 → 2 → 3 → 4 milestone pair → 5 their update with 7 reactions → 8 your update →
9/10 quick links → 11 recent-mood history. The partner's day always precedes yours: the product is
about *them* first. Aside (9–11) is right-hand on `lg+`, and on tablet/mobile it falls below
section 8 in source order — never above.

**Buttons** There is no primary CTA inside region 8 any more. The way in is a `ghost` `sm` button at
the right of that section's header row (`Dashboard.jsx:101-109`), labelled `Add today’s update` or,
once anything exists, `Share another moment`; it navigates to `/app/new`. Region 5's header carries a
`Newest` marker rather than a button, and region 8's empty state keeps a `sm` primary of its own
(`Dashboard.jsx:124-126`) because an empty column needs the louder affordance. Reaction buttons (7)
are a horizontal row beneath the message inside the same card — never floating over the photo. Quick
links (9, 10) are whole cards, tappable anywhere.

**Actions → destinations** Both region-8 buttons → `/app/new` (wireframe 08); the page, not the
dashboard, shows the form and the confirmation. Coming back, the published card appears at 8″ because
`updates` is React state, not a fetch — no navigation is needed to refresh it. Reaction (7) →
`toggleReaction`, count updates live; your own card shows the read-only summary instead (8″), which is
the rule `UpdateReactions` owns. 9 → `/app/memories`. 10 → `/app/profile`. `6'` has no action: the
partner's silence is not something you can fix from here.

**Mobile** Everything becomes one column: 1 → 2 → 3 → 4a → 4b → 5 → 7 → 8 → 9 → 10 → 11. The
milestone pair stacks at <640px. `pb-28` keeps region 11 clear of the bottom bar. Reaction row
stays 5-up; at 320px it compresses to `gap-2` with icon-only buttons and `aria-label` per reaction.

**Deltas** Region 11's `H2` used to render `text-lg` against `text-xl` in regions 5 and 8
(`DESIGN_SYSTEM.md` §9.3 finding 11); all three are on the `title-section` token now, so one tier is
one size. `NEW`: a notification-affordance line under 2 when the partner has posted but the user has
not reacted.

---

## 08 — Daily Update Composer (`/app/new`)

**Purpose** Publish one day in under ninety seconds. Exactly one photo, one mood, one line. A route
now, not an inline expansion: guarded by `RequireAuth`, rendered by `AppShell`, so it can be
deep-linked and landed on from anywhere.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ <nav AppShell>                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 ← Back to today  (Link → /app)                                             │
│ 2 eyebrow  NEW UPDATE  →  3 H1  Tell Sparkles about your day                 │
│ 4 body  A photo and one line is enough. It lands on their phone the          │
│     moment you publish.                                                      │
│ 5 banner  (mood chip) You already shared 8 hours ago — publishing again      │
│     adds another moment to the timeline.   (only if already posted today)    │
│                                                                              │
│ ┌── 6 the form card (DailyUpdateForm) ─────────────────────────────────────┐ │
│ │ H2  Your daily update     meta "Only they will see this"                 │ │
│ │                                                                          │ │
│ │     ┌╌╌╌ PhotoUploader ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐   │ │
│ │     ╎ ▢  [ Choose a photo ]   "Optional — one image, 10MB max"       ╎   │ │
│ │     ╎ [📷 Take a photo]  capture="environment"  ·  mobile only        ╎   │ │
│ │     └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘   │ │
│ │ 7'  — once picked —  ▢ preview  [Remove]                                 │ │
│ │ 7'' error line  "That file is over 10MB."  (rose-700, inline)            │ │
│ │                                                                          │ │
│ │ 8 label  How are you feeling?   radiogroup, 8 moods                      │ │
│ │   (😊 Happy)  (🥰 Loved)  (🤩 Excited)  (😔 Sad)                             │ │
│ │   (😴 Tired)  (🥹 Missing You)  (😌 Peaceful)  (😵 Stressed)                 │ │
│ │   4-up ≥sm, 2-up <sm · selected = rose tint + 1° tilt                    │ │
│ │                                                                          │ │
│ │ 9 label  A message for them                                              │ │
│ │   textarea rows=4 · max 280 · counter "0/280 characters"                 │ │
│ │                                                                          │ │
│ │ 10 meta  Published updates join your shared timeline.                    │ │
│ │ 11 [ Publish update ]  primary, lg — the only submit. No Cancel:         │ │
│ │      region 1 is the way out.                                            │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ — after publishing, the same route swaps its body for —                      │
│ C1 H1  That is on their phone.                                               │
│ C2 sage band  ✓ Published. They will see it the moment they open their       │
│     phone.                                                                   │
│ C3 ▢ PhotoCard (the update just made) + 'No reactions yet'                   │
│ C4 [ Share another moment ] primary → an empty form again                    │
│    [ Back to today ] secondary → /app                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 back link → 2 eyebrow → 3 title → 4 assurance → 5 the "already shared today"
banner, only when it is true → 6 the form card → 7 photo (optional, but first inside the card,
because it is the thing the partner opens) → 8 mood grid → 9 message → 10 assurance line → 11 submit.
After publishing the header swaps to C1 and the body to C2–C4; the reading order restarts at the top.

**Buttons and placement** `Publish update` is the only primary in the body, right-aligned in the
form's last row (`DailyUpdateForm.jsx:73-79`) and it shows `Publishing` while the request is in
flight. There is no `Cancel`: wireframe 07 used one because the composer was inline and had to be
collapsed; as a route, the way out is the back link (1) and `Back to today` (C4), which is a normal
page exit rather than a form action. `Choose a photo` is secondary inside region 7, centred in the
dropzone — it must not be confused with submitting the form. `Remove` is a small ghost text button
pinned to the preview's corner, never centred under it. C4 pairs a primary (`Share another moment`)
with a secondary (`Back to today`), left-aligned, in that order.

**Actions → destinations** Publish → validates message then mood (`DailyUpdateForm.jsx:19-29`), then
`publishUpdate()` (`NewUpdate.jsx:22-27`) → the route re-renders as C1–C4, still on `/app/new`. Share
another moment → clears the confirmation and shows an empty form (`NewUpdate.jsx:64`). Back to
today → `/app`. Photo → `onChange(File)`; invalid type/size routes to `onError` → 7''. Nothing
leaves the page: the published card (C3) is the same `PhotoCard` the dashboard renders.

**Mobile** The page is one column, `pb-28` above the bottom tab bar. Mood grid is `grid-cols-2`
below `sm` (8 tiles = 4 rows, each ~73px tall) and 4-up from `sm` up (`MoodSelector.jsx:5`). The
textarea keeps `rows=4`; there is no viewport-specific height. `Take a photo` is only rendered on
coarse pointers. The C3 card is full-width; the C4 buttons wrap rather than stacking.

**Deltas** Shipped in P7 as `/app/new` (`pages/NewUpdate.jsx`), which is what wireframe 08 always
wanted to be: a route, deep-linkable, reachable from the dashboard, the empty state, and the future
notification shortcut. Three things changed against the original sketch, all deliberate. The composer
no longer expands inline on 07 — one path to publish, not two. The confirmation lives on this page
instead of flashing on the dashboard, so the result of an action appears where the action happened.
And `Cancel` is gone: inline editors need a way to collapse, routed pages do not. The 1° tilt on the
selected mood is kept as a state affordance (amendment to `DESIGN_SYSTEM.md` §7.4: transform is banned
for ornament, allowed for state). Region 8 is still a `<p>`, not an `h3`, so the form card carries two
headings rather than three — the one markup nit in this wireframe that P7 did not pick up.

---

## 09 — Memories Gallery

**Purpose** Let a whole year of long distance be read like a scrapbook, not scrolled like a chat.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ <nav AppShell>                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 eyebrow  YOUR TIMELINE   ·  2 H1  Memories                                  │
│   3 body  16 moments between the two of you, filed by month…                  │
│                                        4 ( ) All moments  ( ) With photos     │
│                                           filter chips, right-aligned ≥sm     │
├──────────────────────────────────────────────────────────────────────────────┤
│ 5 ┌── LOADING (replaces 6 entirely) ────────────────────────────────────────┐ │
│   │        ◌ Collecting your memories                                        │ │
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 5'── EMPTY (replaces 6) ── Card + EmptyState ▢ + "Nothing filed yet"          │
│        + [ Add today's update ] → /app                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ 6  ── October 2026 ─────────────────────── h2 month label + rule             │
│    ┌────────┐ ┌────────┐ ┌────────┐                                            │
│    │▢ photo │ │▢ photo │ │ ▢ mood │   MemoryCard · 3-up ≥lg, 2-up ≥sm,        │
│    │ Sparkles│ │ Emmy   │ │  text  │   tile fills the cell when photo-less     │
│    │ 8h ago │ │ 1d ago │ │ 2d ago │   ♥3 ✦1 counts in the footer               │
│    └────────┘ └────────┘ └────────┘                                            │
│    ┌────────┐                                                                  │
│    │▢ photo │                                                                  │
│    └────────┘                                                                  │
│ 6  ── September 2026 ──────────────────── next month block, same structure    │
│ 6  ── August 2026 ─────────────────────                                         │
│    … months in strict descending order                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ 7 ← Back to today                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 → 2 → 3 with 4 (the filter) to its right on `sm+`, directly below on mobile →
5 or 5' if applicable → 6 month blocks newest-first, each block's cards in newest-first row order →
7 back link.

**Buttons** Filter chips are right-aligned in the header (`Memories.jsx:64-80`) so the timeline
itself starts at the left margin — reading order is never interrupted by controls. Each chip is a
toggle button with `aria-pressed`. Cards have no visible button: the whole tile is the target. 5'
carries exactly one action.

**Actions → destinations** Card → opens wireframe 10 as a modal over the current grid, scroll
position preserved on close. Filter → re-filters `visible`, month groups recompute, no navigation.
Back link → `/app`. Empty-state action → `/app`.

**Mobile** Header stacks 1/2/3 above 4; chips scroll horizontally rather than wrapping to 3 rows.
Grid 1-up at <640px with taller tiles. The month label sticks to the top of its group while that
group scrolls.

**Deltas** Region 3 uses `text-ink-500` correctly but the month label uses `text-lg` (18) as a
`h2` while Connect/Profile use `text-xl` for the same tier. `NEW` P5: month count (`4 moments`)
added right of the label as `meta`, and a year separator when the timeline crosses 31 December.

---

## 10 — Individual Memory View

**Purpose** Reopen one day completely — the photo at full size, the mood, the words, and the
reactions it earned.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ░░ scrim (page dimmed, grid still mounted underneath) ░░                      │
│   ┌── modal · max-w-3xl · radius card · shadow-lift ─────────────────────┐    │
│   │ 1  ── October 2026 · Tuesday ── eyebrow          [ ✕ Close ]        │    │
│   │ 2  H1  Sparkles' update                            ← title slot      │    │
│   │    ┌──────────────────────────────────────────────────────────────┐  │    │
│   │    │ 3  ▢▢▢▢▢▢▢▢▢▢▢▢ full-bleed photo ▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢  │  │    │
│   │    │        (or the mood-tinted text tile when there is no photo) │  │    │
│   │    └──────────────────────────────────────────────────────────────┘  │    │
│   │ 4  ▢ Sparkles "Sparky" · (🥹 Missing You) · 8h ago · 14 Oct, 19:24   │    │
│   │ 5  body  Rained the whole walk home. All I wanted was your           │    │
│   │          terrible playlist.                                          │    │
│   │  ───────────────────────────────────────────────────────────────────  │    │
│   │ 6a THEIRS →  [♥ Love 3] [✦ Adore 1] [🌸 Miss you 0] [☺ Haha] [👍 1]  │    │
│   │    (interactive ReactionBar — toggle any, count updates live)         │    │
│   │ 6b MINE   →  ♥ 3 · ✦ 1 · 👍 1     (read-only ReactionSummary)         │    │
│   │    (or "No reactions yet." when empty)                                │    │
│   └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 breadcrumb + close → 2 title → 3 the image → 4 attribution row (avatar, name,
mood chip, relative time, absolute timestamp) → 5 the message → divider → 6 reactions.

**Buttons** `✕ Close` top-right (1). Esc, scrim click and the close button all dismiss, and focus
returns to the card that opened it. The footer region holds reaction toggles only — never actions,
because the primary verb already happened.

**Actions → destinations** Reaction → `toggleReaction(update.id, reaction.id, ME)`; the modal reads
`selected` live from context, so the count changes immediately and the grid behind it is already
correct when dismissed (`Memories.jsx:129-136`). Close → back to 09.

P5 made this view addressable: opening a card writes `?open=<updateId>` and closing deletes it with
`replace: true`, so the URL and the layer stay in step and Back dismisses rather than unwinding the
whole gallery. That is what lets a notification row deep-link to
`/app/memories?open=upd-02` and land on the memory itself — verified end to end, including the
unread badge dropping from 3 to 2 as the row is followed.

**Mobile** The modal becomes a full-height sheet with a drag handle and `90dvh`; the photo
shrinks to 55% of the sheet and the message stays readable without scrolling. Reaction row stays
5-up; below 360px it wraps to 3 + 2 rather than shrinking the tap targets. Body scrolls behind the
scrim (locked while open).

**Deltas** 4 currently shows relative time only; the absolute date is what makes a scrapbook
navigable, so both are shown, relative first. 6a/6b is chosen by `selected.authorId === ME` — the
read-only variant exists so a user cannot react to their own memory. Region 2 also drops from the
page `title-page` tier to `title-section`: this is a view, not a page.

---

## 11 — Couple Profile

**Purpose** The shared identity: who you both are, when this began, when it next closes.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ <nav AppShell>                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 eyebrow  YOUR TWO           ·  2 H1  Emerson & Sparkles                     │
│   3 body  Toronto ↔ Manchester · together since 14 February 2023              │
├──────────────────────────────────────────────────────────────────────────────┤
│ 4 ┌──────────── PartnerCard ────────────┐ ┌─────────────────────────────┐     │
│   │ ▢ T (avatar 96)   [Edit ▸]          │ │ ▢ S        PartnerCard      │     │
│   │ H2 Emerson        "You"             │ │ H2 Sparkles "Your partner"  │     │
│   │ meta nickname "Emmy"                │ │ meta nickname "Sparky"      │     │
│   │ meta Toronto · EST                  │ │ meta Manchester · GMT       │     │
│   └─────────────────────────────────────┘ └─────────────────────────────┘     │
│ 5 ┌ CoupleCounter ────────────┐ ┌ CountdownCard ────────────────┐             │
│   │ figure 1,342 days together │ │ figure 34d 06h · 6 Nov        │           │
│   └────────────────────────────┘ └───────────────────────────────┘             │
├──────────────────────────────────────────────────────────────────────────────┤
│ 6 ┌── Card as=section ───────────────────────────────────────────────────────┐│
│   │ H2  Couple details                                                       ││
│   │ ┌ Anniversary ────┐ ┌ Next meeting ───┐                                  ││
│   │ │ (date 2026-02-14)│ (date)           │  2-up ≥sm                       ││
│   │ └─────────────────┘ └─────────────────┘                                  ││
│   │ ┌ Your city ──────┐ ┌ Their city ─────┐                                  ││
│   │ └─────────────────┘ └─────────────────┘                                  ││
│   │ ⓘ  no save step — each field writes to context as you type               ││
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 7 ┌── Card as=section ───────────────────────────────────────────────────────┐│
│   │ H2  Settings & Privacy                                                    ││
│   │ body  "Reminders, quiet hours, reaction sounds, the weekly recap and the  ││
│   │        two irreversible actions now live together on one page."           ││
│   │                                    [ ⚙ Open settings ] → /app/settings    ││
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 8 ── removed: preferences and space controls now live in wireframe 12 ────────│
├──────────────────────────────────────────────────────────────────────────────┤
│ 9 ← Back to today                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

STATE 11.b — [Edit ▸] modal (Profile.jsx:139-194)
┌── modal ────────────────────────────────────────────────────────┐
│ H2 Edit Emerson                          [ Cancel ]             │
│ ▢ avatar 96 · [Change photo] → hidden file input               │
│ ┌ Name ────────┐ ┌ Nickname ─────┐ ┌ City ────────┐            │
│ [              Save changes ]                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 → 2 → 3 → 4 the two people, you always left → 5 the two counters → 6 editable
shared facts → 7 the one exit into settings → 9 back. Edit modal (11.b) is a layer over region 4,
never a separate route.

**Buttons** `Edit` is a ghost text button top-right of each PartnerCard. Region 6 has **no save
button** — the four fields write straight through `editCouple()` / `editPartner()` and the card says
so in its own subline ("Changes apply to your counters immediately"), which is why the wireframe's
original `[ Save couple details ]` was struck in P8 rather than built. Modal footer carries
`Cancel` (ghost, left) then `Save changes` (primary, right). `Change photo` is secondary, adjacent
to the avatar it affects.

**Actions → destinations** `Edit` → 11.b → `editPartner()` → region 4, header avatars and every
Memories author name update together (all read `useData()`). Region 6 → `editCouple()` → counters
5 recompute. Region 7 → `/app/settings`. Nothing else on this page navigates away.

**Mobile** 4 stacks (you first). 5 stacks. Region 6 fields go single-column. 9 back link becomes
the header's left affordance.

**Unset states (P8)** Region 5 is the only place on the page whose content can be removed rather than
edited: a native date input has a clear affordance, and clearing it writes `''`. Both cards now carry
text for that — `Set your anniversary` under the day figure, and `No date set` plus
`Pick a date and the clock starts.` in place of the four-unit row. Neither is a new component; they
are the cards' own fallback copy, and they exist because the alternative was a crash — pre-P8 the
cleared value reached `toISOString()` during render and unmounted the tree.

**Validation (P8)** The modal's `Name` field is required and rejects blank or whitespace-only input
inline through `Field`'s existing error slot, leaving the modal open. `Nickname` and `City` stay
optional, and the saved name is trimmed. This was the last required-text field in the app without a
guard; the auth forms, the composer and the invite code all already had one.

**Deltas** Closed in P5. Profile carried three jobs — identity, preferences, session control; it now
carries identity plus one doorway. `Switch` left the page's import list with the preferences card.
The timezone/city meta line stayed because it explains the counters, not the account.

---

## 12 — Settings & Privacy

**Purpose** One place for everything that should not need re-finding: delivery of the daily nudge,
the sound of a reaction, the recap, and the two irreversible actions — unlink and delete.
**Shipped in P5** as `src/pages/Settings.jsx`, routed at `/app/settings`. Regions 5, 6 and 9 moved
out of Profile; 7 and 8 are new.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ <nav AppShell>                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1 ← Back to today       ·  2 eyebrow SETTINGS → H1  Settings & Privacy        │
│   3 body  Emerson & Sparkles — everything here shapes how the two of you      │
│           experience the space. Nothing is sent anywhere until you switch it   │
│           on.                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌── in-page nav (horizontal scroll chip row) ────────────────────────────────┐ │
│ │ 4  ( Check-ins )  ( Notifications )  ( Weekly recap )  ( Privacy )  ( Your space ) │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ 5 ┌── #check-ins ────────────────────────────────────────────────────────────┐│
│   │ H2 Check-ins                                                             ││
│   │ ┌──────────────────────────────────────────────────────────────────────┐ ││
│   │ │ Daily check-in reminder            Reminds you at 21:00 their time    │││
│   │ │                                                            ( on )     │││
│   │ ├──────────────────────────────────────────────────────────────────────┤ ││
│   │ │ Quiet hours                      No pings between 00:00 and 07:00     │││
│   │ │                                                            ( on )     │││
│   │ ├──────────────────────────────────────────────────────────────────────┤ ││
│   │ │ Reminder time                    [ 21:00 ▾ ]                          │││
│   │ └──────────────────────────────────────────────────────────────────────┘ ││
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 6 ┌── #notifications ────────────────────────────────────────────────────────┐│
│   │ H2 Notifications                                                         ││
│   │ Sound on their reactions                        ( off )                   ││
│   │ Their daily check-in                            ( on )                    ││
│   │ Milestone days (anniversary, countdown hit)      ( on )                    ││
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 7 ┌── #recap ────────────────────────────────────────────────────────────────┐│
│   │ H2 Weekly couple recap                                        Beta        ││
│   │ body  Togetherly can write a short Sunday summary of your week — moods,   ││
│   │       photos and the days you missed each other.                          ││
│   │ ⚠ consent line  Nothing is sent anywhere until you switch this on. You    ││
│   │   can turn it off and delete every recap. No third-party AI is connected   ││
│   │   in this version of the product.                                         ││
│   │ Enable the recap                             ( off )                       ││
│   │ [ Preview an example recap ]  secondary                                    ││
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 8 ┌── #privacy ──────────────────────────────────────────────────────────────┐│
│   │ H2 Privacy                                                               ││
│   │ Who can see my updates       [ Only Sparkles ▾ ]  (fixed, shown as fact)  ││
│   │ meta  Only the two of you. There is no other option yet — photos live in ││
│   │       your shared space.                                                 ││
│   │ ── rule ──                                                                ││
│   │ Data export   A full export of everything you have written.  [⤓ Download]││
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 9 ┌── #danger  rose-50 panel, rose-200 rule ─────────────────────────────────┐│
│   │ H2 Your space                                                            ││
│   │ Manage your connection   Regenerate the invite code or re-link.           ││
│   │                    [ Open Connect ]  secondary sm  → /app/connect        ││
│   │ Unlink Sparkles    Hides the shared timeline from both accounts.         ││
│   │                    [ Unlink partner ]  secondary sm                      ││
│   │ Delete my space    Removes your account and every update you wrote.       ││
│   │                    [ Delete my space ]  destructive sm                   ││
│   └──────────────────────────────────────────────────────────────────────────┘│
│ 10 meta  Togetherly v0.1 · Stage 1, running on mock data · switches here      │
│          apply to this session only                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 back → 2 title → 3 context line → 4 section nav → 5 check-ins → 6
notifications → 7 AI recap → 8 privacy → 9 destructive actions last, always last → 10 version.
Irreversible things are never near the top of a settings page.

**Buttons and placement** Every switch row puts the label and its explanation on the left, the
`( )` control on the right — one alignment for the whole page. `Reminder time` uses a select
(`21:00 ▾`) rather than a free-text field, and is `disabled` while the reminder itself is off.
Region 7's `Preview an example recap` is secondary and sits below the consent line, never beside
the switch: previewing is not the same decision as enabling. Region 9's three buttons are `sm`,
right-aligned inside their rows, visually separated from the rest of the page by the panel's
`rose-50` fill. Unlink and delete each open a confirmation modal that names the partner or the
account; the modal asks nothing further, because neither action destroys data in Stage 1 — unlink
only hides the shared timeline and delete only clears the local mock session. As of P6 the unlink
modal is `couple/ConfirmUnlink`, the same instance Connect renders; delete keeps its own `Modal` in
`Settings.jsx`, because this is the only page that can end a session and a shared
"are you sure" would have to be told at each call site what it should already know.

**Actions → destinations** 1 → `/app`. 4 → `scrollIntoView` on `#check-ins` … `#danger`, each
section carrying `scroll-mt-24`. Switches → local state now, `PATCH /profiles` in Stage 3.
`Unlink partner` → `unlinkPartner()` → `/app/connect` in pending state. `Delete my space` →
`signOut()` → `/`. Download → Stage 3 job, disabled with a `meta` reason until then.

**Mobile** Region 4 is a horizontally scrolling chip row. Switch rows keep label-left/control-right
all the way down to 320px. Region 9's rows are the exception: below `sm` the button drops onto its
own line, right-aligned, because a 150px pill beside a 180px text column turned the descriptions
into five-line ribbons. Panel 9 keeps its tint so it cannot be mistaken for another settings group.
Sheets appear from the bottom for the confirmation modals (`Modal` is already bottom-anchored
below `sm`).

**Deltas closed in P5** Additive screen. Regions 5, 6 and 9 moved out of `Profile.jsx` unchanged in
behaviour; region 7 existed only as a single switch; region 8 did not exist. Removing them from
Profile is the only deletion, and it is a relocation rather than a rewrite. Two departures from the
original target: the recap switch is `disabled` (not merely off) so the Stage 1 constraint reads as
a platform state instead of a personal choice, and the danger panel gained a third row pointing at
`/app/connect` because unlinking from here without a re-link path was a dead end.

---

## 13 — Public Legal Pages (Privacy Policy, Terms of Service)

`/privacy` and `/terms`. `pages/Legal.jsx`, fed by the `PRIVACY` and `TERMS` objects in
`lib/legal.js`. One shell, two documents — the pages differ only in the object passed in, which
is why they are wireframed as a single screen.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1 slim public header: Logo        [Log in]  [Get started]                    │
│ 2 eyebrow  PRIVACY  (or TERMS OF SERVICE)                                    │
│ 3 H1  Privacy Policy                                                         │
│ 4 meta  Last updated 31 October 2026 · Togetherly v0.1, sample data          │
│ 5 intro paragraph                                                            │
│ 6 ┌ section ───────────────────────────────────────────────┐                 │
│ 6 │ H2  What this preview stores                           │                 │
│ 6 │ p   body                                               │                 │
│ 6 │ •   rose-400 dot + line                                │                 │
│ 6 │ •   rose-400 dot + line                                │                 │
│ 6 └────────────────────────────────────────────────────────┘                 │
│ 7 (6 repeated nine times — the section list lives in legal.js)               │
│ 8 footer row   ← Back to Togetherly        Privacy ⇄ Terms                   │
│ 9 <Footer/>    same component the landing page uses                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reading order** 1 → 2 → 3 → 4 → 5 → the section run (6–7) → 8 → 9.

**Why this is a route and not a modal** A policy has to be reachable without an account, from a
search result, and from the footer of every public page. `/app/settings#privacy` is a *personal
preference* surface behind `RequireAuth`; it is not the document someone linking to your privacy
policy expects. The two were confused in the P5 footer, which is why every footer legal link was
inert.

**Buttons** Region 1 reuses `Button` `ghost` (Log in) and default (Get started) — the same pair as
`MarketingNav`, so the header behaves identically on the landing page and on these pages. Region 8
is a plain `Link` pair, not buttons: they navigate, they do not act.

**Actions → destinations** Logo → `/`. Log in → `/login`. Get started → `/signup`.
← Back to Togetherly → `/`. The cross-link toggles between `/privacy` and `/terms`. The footer's
Product column links are absolute `/#features` and resolve back through the landing page's
scroll-to-hash effect — a bare `#features` here would point at an anchor this page does not contain.

**Typography** Body measure is capped at `max-w-3xl`, narrower than any other page in the app,
because this is the only content in the product meant to be read linearly. H1 uses the landing
display size; H2 uses `--text-title-section`; paragraphs `text-sm leading-relaxed` in `ink-700`.
No card, no shadow, no surface fill — a policy inside a card reads as another settings group.

**Mobile** Region 1 keeps logo plus the two CTAs; 6–7 reflow at full measure; 8 stacks. Verified at
390px with no horizontal overflow.

**Deltas closed in P6** Additive. These pages did not exist, which is the reason the footer could
not be wired. The copy is written against what this build actually does — the app stores nothing
off-device, so the documents say so and name the Stage 3 gaps rather than describing a finished
policy. Both carry a `v0.1, running on sample data` line and are flagged for legal review before
any public launch.

---

## Cross-screen rules

1. Every authenticated page starts at a level-1 title and never two.
2. Every list has all three states — loading, empty with one action, populated. Never a bare gap.
3. The destructive action on any screen is the visually least prominent thing present.
4. One primary button per screen region; secondary actions are text links.
5. Rose = your action, sage = their state, butter = shared milestone (`DESIGN_SYSTEM.md` §7.3).
6. Nothing renders below 12px. Nothing animates except colour, shadow and ≤1.02 modal scale.
