# Togetherly — Design System

Status: **proposal, awaiting approval.** No token values in `src/index.css` have been changed yet.
Scope: this document describes the design language for the whole product. It is written against the
code that exists today (44 source files, 9 routes) so every rule can be traced to a real usage site.

---

## 1. Identity

A quiet, private, editorial space for two people living apart. The reference direction is the
botanical butterfly artwork: warm paper, muted botanical green, dusty rose, pale butter, charcoal
ink. Nothing should read as a dashboard, a social feed, or a sale.

Four principles govern every decision below.

1. **Paper first.** The page is a warm sheet; content rests on it, it is not boxed into it.
2. **Colour is for meaning, not decoration.** Sage, rose and butter each carry a job. If a use
   does not communicate something, it gets a neutral.
3. **Type does the hierarchy, not size inflation.** Five levels, deliberately spaced.
4. **Contrast is a hard floor, not a preference.** See §3.

### What this system explicitly rejects

Gradients (the one decorative blur in `AuthShell` is scheduled for removal), neon, glass effects,
card-on-card nesting, borders used as decoration, more than one accent colour per component, and
headings larger than the page title tier.

---

## 2. Brand palette (immutable)

These six values are the brand. They are reproduced **verbatim** and are never substituted,
lightened or hue-shifted.

| Token | Hex | Role |
|---|---|---|
| `bg` | `#E7DFD1` | Page background — the warm sheet |
| `surface` | `#F5F0E8` | Card, sheet, header, and input interior |
| `charcoal` | `#403A38` | All body text and iconography |
| `sage` | `#B8C68B` | Primary brand accent — calm, growth, "their" side |
| `rose` | `#C9829D` | Emotional accent — reactions, active state, "you" side |
| `butter` | `#E8E5AD` | Highlight fill — celebration, countdown, next meeting |

### 2.1 Why the brand six are fills, not text

Measured WCAG ratios against the two surfaces:

| Foreground | On `surface` | On `bg` | Verdict |
|---|---|---|---|
| `charcoal` | **9.84** | **8.44** | pass |
| `rose` | 2.58 | 2.22 | fails — fill/decorative only |
| `sage` | 1.61 | 1.38 | fails — fill/decorative only |
| `butter` | 1.14 | 1.02 | fails — fill/decorative only |
| `charcoal` on `rose` fill | 3.81 | — | large text / UI strokes only |
| `charcoal` on `sage` fill | 6.11 | — | pass |
| `charcoal` on `butter` fill | **8.64** | — | pass — the correct way to use butter |

So the brand hues are sound as **backgrounds and graphic fills**, and unsound as **ink**. Rather
than darken the brand or import new colours, each hue is extended into a same-hue ramp: hue and
saturation are locked to the brand hex, only lightness moves. The brand hex always sits at step
`500`. This is one colour family per hue, not a new colour.

---

## 3. Accessibility rules

Non-negotiable floors, applied to every value in §4.

| Use | Minimum ratio |
|---|---|
| Body text, labels, links | **4.5:1** |
| Text ≥ 24px (or ≥ 18.5px bold), icons, graphic strokes | **3:1** |
| Focus indicator against its background | **3:1** |
| Adjacent same-family fills that must be told apart | 1.2:1 (target, not a requirement) |

**Precedence rule.** When a brand step cannot reach the floor, move down the ramp — never up the
font size, never to a different hue. Two consequences worth stating plainly:

- **Butter is never a text colour.** Its best achievable ratio on `surface` is 2.07 even at the
  darkest same-hue step. Butter is only ever a fill with `charcoal` on top.
- **Rose text must be `rose-700` or darker — and `rose-800` once it sits on the page background.**
  `rose-600` measures 4.41 — just short of the body
  floor — so it is restricted to large headings and icon strokes.

---

## 4. Token reference

Every value below is a same-hue derivation of a brand hex. Ratios are stated against `surface`,
because cards are where text actually lives.

### 4.1 Sand — neutral family (hue 38°, from the page background)

| Token | Hex | On `surface` | Use |
|---|---|---|---|
| `sand-50` | `#FAF8F5` | 1.07 | Raised interior: inputs, selected chip, primary-button label |
| `sand-100` | `#F5F0E8` | 1.00 | **`surface`** — cards, header, bottom bar |
| `sand-200` | `#F1ECE4` | 1.04 | Hover fill on a card |
| `sand-300` | `#EAE3D7` | 1.12 | Dividers, input borders |
| `sand-400` | `#E3DAC9` | 1.22 | Focus-adjacent borders, table rules |
| `sand-500` | `#D9CCB5` | 1.40 | Disabled fill, switch track, skeleton |
| `sand-600` | `#E7DFD1` | 1.17 | **`bg`** — page background |

### 4.2 Ink — text family (hue 15°, from charcoal)

| Token | Hex | On `surface` | Use |
|---|---|---|---|
| `ink-900` | `#403A38` | **9.84** | **`charcoal`** — headings, body, icons |
| `ink-700` | `#574F4C` | 7.04 | Emphasised secondary text |
| `ink-500` | `#675E5A` | 5.57 | Secondary text, descriptions, **timestamps** |
| `ink-400` | `#7A6F6B` | 4.29 | Large text and icon strokes only — *not* body |
| `ink-300` | `#A09692` | 2.55 | Disabled text, decorative marks. Never content |

> **Defect being fixed here.** `--color-ink-300` is currently `#9C8F86` (**3.04**) and is used
> **37 times** for timestamps, hints and inactive nav labels — below the body floor. Migrating
> those call sites to `ink-500` (5.57) is the single largest a11y correction in the app.

### 4.3 Rose — emotional accent (hue 337°, sat 40%)

| Token | Hex | On `surface` | Use |
|---|---|---|---|
| `rose-50` | `#F9F1F4` | 1.02 | Tinted panel background |
| `rose-100` | `#F4E6EB` | 1.07 | Active tab fill, reaction chip resting |
| `rose-200` | `#EDD4DD` | 1.23 | Chip border, selection tint |
| `rose-300` | `#E3BFCD` | 1.47 | Avatar ring, hairline accents |
| `rose-400` | `#D9A6B9` | 1.83 | Decorative graphic fill only |
| `rose-500` | `#C9829D` | 2.58 | **brand `rose`** — solid fills, `charcoal` text on top |
| `rose-600` | `#B24D73` | 4.41 | Large headings, icon strokes, chart ink |
| `rose-700` | `#A7486C` | **4.89** on `sand-100` · 4.19 on `sand-400` | Text accent **on a card surface only** |
| `rose-800` | `#9D4466` | 5.36 on `sand-100` · 4.62 on `sand-400` | Primary button fill, and every accent on the page background: links, active labels, eyebrows |
| `rose-900` | `#8E3E5C` | 6.18 | Button hover / active, pressed states |
| `rose-950` | `#59263A` | 10.50 | Focus ring, highest-emphasis ink on rose tints |

> **Defect being fixed here.** The primary button is currently `rose-500 #C2626A` with cream text
> = **3.87** (AA-large only, on every CTA in the product). The replacement is `rose-800` fill with
> `sand-50` label = **5.36**, hovering to `rose-900` = **6.18**. Brand recognition is preserved
> because `rose-500` keeps its role as the fill colour for chips, avatars and active tabs.

### 4.4 Sage — calm accent (hue 74°, sat 34%)

| Token | Hex | On `surface` | Use |
|---|---|---|---|
| `sage-50` | `#F7F8F1` | 1.06 | Tinted panel background |
| `sage-100` | `#F0F3E7` | 1.01 | Success/info resting fill |
| `sage-200` | `#E6EBD6` | 1.08 | Chip fill |
| `sage-300` | `#D9E1C1` | 1.20 | Chip border |
| `sage-400` | `#CBD5AA` | 1.36 | Decorative graphic fill |
| `sage-500` | `#B8C68B` | 1.61 | **brand `sage`** — solid fills, `charcoal` text on top |
| `sage-600` | `#96AB54` | 2.24 | Large graphic strokes |
| `sage-700` | `#788943` | 3.39 | Icon strokes, UI-only contrast (3:1 tier) |
| `sage-800` | `#606D36` | **4.95** | **Text accent** — calm/peaceful states, "connected" confirmations |
| `sage-900` | `#485228` | 7.37 | Emphasis, hover on sage text |

### 4.5 Butter — highlight fill (hue 57°, sat 56%)

| Token | Hex | On `surface` | Charcoal on it | Use |
|---|---|---|---|---|
| `butter-50` | `#FCFBF3` | 1.09 | 10.76 | Warmest interior |
| `butter-100` | `#F9F9EB` | 1.07 | 10.52 | Panel tint |
| `butter-200` | `#F5F4DB` | 1.02 | 10.02 | Chip fill |
| `butter-300` | `#EFEDC7` | 1.05 | 9.36 | Chip border / celebration band |
| `butter-400` | `#E8E5AD` | 1.15 | **8.57** | **brand `butter`** — highlight fill, countdown card |
| `butter-500` | `#E0DC8F` | 1.25 | 7.87 | Solid graphic fill |
| `butter-600` | `#D7D270` | 1.39 | 7.10 | Border for butter fills |

No butter step is a text colour (§3). `butter-700 #CDC64C` exists only for graphic strokes at
1.57 and is not exposed as a token unless needed.

### 4.6 Family retirement

| Current family | Occurrences | Disposition |
|---|---|---|
| `cream-50…400` | 77 | Re-pointed to the `sand` values. Token name kept so no component edits are required. |
| `ink-900/700/500/300` | 142 | Re-pointed to §4.2. `ink-300` misuse corrected separately. |
| `rose-50…600` | 136 | Re-pointed to §4.3. Note `rose-500` *darkens* in meaning: uses that were text move to `rose-700`. |
| `peach-50…500` | 12 | Retired. Warmth is already carried by `butter` and `sand`. |
| `lavender-50…500` | 12 | Retired. Conflicts with the botanical direction. |
| `sky-soft / sky-deep` | 5 | Retired. Sad/tired moods move to `sage` and `ink` families (§7.2). |
| `sage-soft / sage-deep` | 9 | Replaced by the full `sage` ramp. |

**Migration strategy.** Token *names* stay; token *values* are re-pointed inside `@theme` in
`src/index.css`. Colour adoption is then a one-file change instead of ~350 class edits across 24
components. The exceptions that genuinely need component edits are the `ink-300` text call sites,
the primary-button contrast fix, and `mood.js` (§7.2).

---

## 5. Typography

### 5.1 Families

Already correct and unchanged: **Fraunces** (serif, optical size 9–144, weights 400/500/600) for
display, **Manrope** (400/500/600/700) for UI. Loaded in `index.html:15`, bound as `--font-display`
and `--font-sans`, and applied to `h1–h3` in the base layer. No new webfont requests will be added.

### 5.2 The five levels

| Level | Token | Family / weight | Size / line-height | Mobile | Element | Where |
|---|---|---|---|---|---|---|
| **1 — Page title** | `text-3xl` → `sm:text-4xl` (built-in pair, no new token) | Fraunces 500 | 30 / 36 | 36 / 40 | `h1` | One per page, always |
| **2 — Section heading** | `title-section` | Fraunces 500 | 20 / 28 | — | `h2` | Section and card-group titles |
| **3 — Card heading** | `title-card` | Fraunces 500 | 18 / 26 | — | `h3` | Card titles, month labels |
| **4 — Body** | `body` | Manrope 400 | 15 / 24 | — | `p` | Default UI text |
| | `body-lead` | Manrope 400 | 16 / 26 | — | `p` | Hero + intro paragraphs only |
| **5 — Metadata** | `meta` | Manrope 400/500 | 13 / 18 | — | `span` `time` | Timestamps, counts, captions |
| | `eyebrow` | Manrope 600 | 13 / 18, +0.06em, uppercase | — | `p` | Above a page title only |

Two supplementary styles, not additional levels:

- `figure` — Fraunces 500, 28 / 1 (invitation code on Connect). The two milestone cards
  (`CoupleCounter`, `CountdownCard`) are the other sanctioned exception: their numerals run the
  built-in `text-3xl` → `sm:text-4xl` pair on the butter fill. No other display type above 24px is
  allowed inside the app shell.
- `label` — Manrope 500, 14 / 20. Form labels and tab labels. `text-[11px]` in the mobile tab bar
  moves here.

### 5.3 Rules

- One level 1 per screen. Never two.
- A heading may not render larger than the level above it. See the `AuthShell` inversion in §9.
- Body copy is `body` (15px) by default. `text-sm`/14px is demoted to metadata-adjacent uses, and
  `text-xs`/12px becomes the floor — nothing below 12px ships.
- Measure: prose capped at 65ch (`max-w-prose`), never full container width.
- Line-height is fixed per level above; ad-hoc `leading-[1.02]`-style overrides are removed except
  the landing hero.

---

## 6. Spacing

Built on Tailwind's 4px grid, restricted to a named set. The current code uses **14 distinct
`gap-*`, 15 `py-*`, 11 `px-*` and 7 `p-*` values**; the scale below is the whole allowance.

### 6.1 Scale

`s0 0` · `s1 4` · `s2 8` · `s3 12` · `s4 16` · `s5 20` · `s6 24` · `s8 32` · `s10 40` · `s12 48` · `s16 64` · `s20 80`

Half-steps `10` (`-1.5`, `-2.5`) and `14` (`-3.5`) are **not** in the scale and are replaced by 8 or
12. The only exemptions are non-layout micro-values: the 6px bullet dot in `AuthShell`, the `-10px`
avatar overlap, and hairline `mt-0.5` optical nudges.

### 6.2 Application

| Concern | Value | Tokens | Status today |
|---|---|---|---|
| Page gutter | 20 → 32 at ≥640 | `s5` / `s8` | **already consistent** (`px-5 sm:px-8` in all 4 shells) |
| Content container | 1152px, centred | `max-w-6xl` | **already consistent** (10 uses) |
| Single-column form column | 448px | `max-w-md` | consistent for auth; prose tiers (`xs`/`sm`/`lg`/`xl`/`2xl`) collapse to `max-w-prose` |
| Page header → first block | 28 → **32** | `s8` | `space-y-7` (28) in Dashboard/Memories — normalise |
| Between page sections | 32 mobile / 40 desktop | `s8` / `s10` | marketing already uses `py-20`; app pages vary |
| Card interior | 20 → 24 at ≥640 | `s5` / `s6` | **already the standard** (`Card` = `p-5 sm:p-6`) |
| Between stacked cards | 16 / 24 | `s4` / `s6` | `gap-4`, `gap-6` — conforms |
| Within-card rhythm | 4 / 8 / 12 only | `s1` `s2` `s3` | currently `1.5/2/2.5/3/3.5/4` — trim to 4/8/12 |
| Icon-to-label gap | 8 | `s2` | `gap-2` — conforms |
| Title → description | 12 | `s3` | `mt-3` — conforms |

### 6.3 Restraint

- **No card inside a card.** Two-level nesting exists today in `Connect` and is flattened.
- **Borders only where they do work.** The `surface` utility currently paints
  `border border-cream-200` on *every* card. Shadow alone should separate a card from the sheet;
  borders stay on inputs and on the two intentionally-flagged panels.
- **Whitespace beats dividers.** Prefer a step up the scale over a rule or a new card.

---

## 7. Radius, elevation, colour-in-context

### 7.1 Radius — 4 values

Current code uses 7 (`xl`, `2xl`, `3xl`, `4xl`, `5xl`, `full`, `t`) with `4xl = 2rem` and
`5xl = 2.75rem`. That roundness reads as a bubbly consumer app, not an editorial product.

| Token | Value | Replaces | Used by |
|---|---|---|---|
| `--radius-card` | **20px** | `rounded-4xl` (32px) | all cards via `surface` |
| `--radius-inner` | 14px | `rounded-2xl` / `3xl` | chips, inputs, thumbnails, inner panels |
| `--radius-photo` | 16px | `rounded-3xl` | photo corners inside a card |
| `--radius-pill` | 9999px | `rounded-full` | buttons, avatars, tabs, mood chips |

Implementation note: redefining `--radius-4xl` and `--radius-5xl` in `@theme` to 20px and 16px
propagates to every card without touching a component. Individual `rounded-2xl`/`3xl` call sites
then get reconciled to `inner`/`photo` in a pass over the JSX.

### 7.2 Elevation

Two levels, already correct and kept.

- `shadow-soft` — resting card. Re-anchor the RGB from `43 37 35` to `64 58 56` (charcoal).
- `shadow-lift` — hover on an interactive card, and modals. Nothing else uses a shadow.

Mood chips are the one place colour is systemic, so the mapping is fixed here:

| Mood | Fill | Text | Note |
|---|---|---|---|
| Happy 😊 | `butter-200` | `ink-900` | butter is fill-only |
| Loved 🥰 | `rose-100` | `rose-700` | 4.89 ✓ |
| Excited 🤩 | `butter-300` | `ink-700` | |
| Sad 😔 | `sand-300` | `ink-700` | neutral, deliberately desaturated |
| Tired 😴 | `sand-200` | `ink-500` | |
| Missing You 🥹 | `rose-50` | `rose-800` | 5.36 ✓ |
| Peaceful 😌 | `sage-200` | `sage-800` | 4.95 ✓ |
| Stressed 😵‍💫 | `sand-500` | `ink-700` | |

Class strings must remain **literal per mood** in `src/lib/mood.js` — Tailwind v4's scanner reads
source text and cannot see runtime-composed class names.

### 7.3 Semantic colour assignment

| Meaning | Family | Why |
|---|---|---|
| Your content / your actions | rose | emotional, active |
| Their content / their presence | sage | calm, the other side |
| Shared milestone (counter, countdown) | butter | celebration, no urgency |
| Destructive | `rose-900` on `rose-50` | no red is introduced; severity is carried by weight, size and copy |
| Disabled | `sand-500` fill, `ink-300` text | |
| Focus ring | `rose-800` | 5.36 on surface — see below |

> **Defect.** `:focus-visible { outline-rose-400 }` (current `#D98086`) measures ≈2.6 on the sheet,
> below the 3:1 non-text floor. `rose-950` gives 10.50 but reads as a black bar; the shipped ring is
> `rose-800` (`#9D4466`) — 5.36 on `sand-100`, 4.60 on `sand-400`, still comfortably over 3:1.

### 7.4 Motion

- Durations: `150ms` micro (chip press, icon), `200ms` all colour/shadow transitions. Nothing longer.
- Properties: `transition-colors`, `transition-shadow`, `opacity`. **No translate, scale, parallax
  or spring** on content. One exception: modal enter at 200ms opacity+scale ≤1.02.
- `prefers-reduced-motion` is already global in `index.css:88-95`. Keep.
- Number tickers (countdown) change content only; they never animate position.

---

## 8. Component contract rules

Every shared component must satisfy this checklist — it is the review gate for §7 of the brief.

- [ ] Documented purpose and its one job; no page-specific logic inside it.
- [ ] Sizes come from the token set only (`sm/md/lg`, never an ad-hoc pixel string).
- [ ] **Hover** — colour or shadow change, 200ms, no layout shift.
- [ ] **Focus** — visible `rose-800` ring, 2px, offset 2px, never removed.
- [ ] **Active/pressed** — one step darker than hover.
- [ ] **Disabled** — `sand-500`/`ink-300`, `cursor-not-allowed`, excluded from tab order where honest.
- [ ] **Loading** — own the spinner or skeleton state; a caller must never bolt one on.
- [ ] **Empty** — via `EmptyState`, always with exactly one action.
- [ ] **Error** — inline under the field (`Field`), `aria-invalid` set, message states what to do.
- [ ] **No duplication** — one component per job; if two render the same thing, one is deleted.

### Current conformance

| Rule | Status |
|---|---|
| Variants/sizes | ✅ `Button` 4 × 3 |
| Loading | ✅ `Button loading`, `LoadingSpinner` |
| Error | ✅ `Field` + 5 form call sites, `aria-invalid` wired |
| Empty | ✅ `EmptyState` in `Dashboard`, `Memories` |
| Focus | ⚠️ global ring exists, fails contrast (§7.3) |
| Hover | ✅ `Card hover`, `Button` variants |
| Disabled | ⚠️ opacity only, no token colours |
| No duplication | ✅ since P7 — the reaction/author *rule* is single-sourced; `PhotoCard` and `MemoryCard` stay separate layouts (§9.4 finding 16) |

---

## 9. Audit of the current UI against this system

Findings are ordered by cost to fix, not severity of taste. Each cites the exact line.

This is the pre-P1 snapshot; what happened to each finding is recorded in §10's shipped records. Two
rows are struck inline rather than left as history, because the fix that landed is **not** the fix
proposed here — 16 (the rule converged, the containers stayed) and 20 (new pages, not new links).

### 9.1 Blocking against the brief

| # | Finding | Evidence |
|---|---|---|
| 1 | **Settings & Privacy page does not exist.** Wireframe 12 has no route; its controls are two `<h2>` sections inside Profile. | `App.jsx:34-37` (4 child routes), `Profile.jsx:113`, `Profile.jsx:150` |
| 2 | **No notification access** in the authenticated shell. The only occurrence of the concept is a quiet-hours label. | `Profile.jsx:130`; absent from `AppShell.jsx:34-62` |
| 3 | **Profile is unreachable from navigation.** Both avatars render in the header but are not links; logout is the only control. | `AppShell.jsx:44-53` |

### 9.2 Accessibility defects (independent of the palette)

| # | Finding | Ratio | Fix |
|---|---|---|---|
| 4 | `text-ink-300` used 37× for timestamps, hints, inactive tabs | **3.04** | → `ink-500` (5.57) |
| 5 | Primary button `rose-500` + cream label, on every CTA | **3.87** | → `rose-800` fill |
| 6 | Focus ring `rose-400` | ≈2.6 | → `rose-800` (5.36) — shipped |
| 7 | Mobile tab labels at `text-[11px]` | size | → 12px floor + `label` token |

### 9.3 Hierarchy and rhythm

| # | Finding | Evidence |
|---|---|---|
| 8 | **Heading level inversion**: the auth card's `h2` renders at `text-4xl` (36px) *above* the page's own `h1` at `text-3xl` (30px). A level-2 heading is larger than the level-1 title it sits under. | `AuthShell.jsx:17` vs `AuthShell.jsx:52` |
| 9 | **No type scale.** Sizes hand-picked per site: `text-3xl` ×14, `text-4xl` ×12, no `--text-*` tokens defined. | whole tree |
| 10 | **Invitation code competes with its page title** — `text-3xl → sm:text-4xl` display type in a card body. | `Connect.jsx:91` |
| 11 | **Section level inconsistent**: `h2` renders at `text-xl` in Connect/Profile but `text-lg` for the equivalent tier in Dashboard ("Their recent moods") and Memories (month label). | `Connect.jsx:87`, `Profile.jsx:76` vs `Dashboard.jsx:172`, `Memories.jsx:105` |
| 12 | **No spacing scale**: 14 `gap-*`, 15 `py-*`, 11 `px-*`, 7 `p-*` values; half-steps `1.5/2.5/3.5` interleaved with integers. | grep of all JSX |
| 13 | **Arbitrary one-off values**: `text-[11px]`, `text-[15px]`, `h-[26rem]`, `h-[30rem]`, `text-[3.4rem]`, `tracking-[0.18em]`, `grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]`. | `AppShell.jsx:20`, `AuthShell.jsx:11`, `Connect.jsx:91`, `Landing.jsx:83` |
| 14 | **Every card carries a border** via the `surface` utility — contradicts §5 of the brief. | `index.css:85` |
| 15 | **Radius sprawl**: 7 values, with 32px and 44px tokens in active use. | `index.css:52-53` |

### 9.4 Structure and colour

| # | Finding | Detail |
|---|---|---|
| 16 | ~~**Same "update" rendered three ways**~~ — **closed in P7, differently than scoped.** Dashboard had already collapsed to two when it adopted `PhotoCard`; the third was never a card but an inline block. What was actually duplicated three times was the *rule* — which reaction surface an update gets, and which author object resolves — and that is single-sourced now (`UpdateReactions`, `DataContext.personById`). `PhotoCard` and `MemoryCard` stay separate on purpose; see `COMPONENT_ARCHITECTURE.md` §8. | `ReactionBar.jsx`, `DataProvider.jsx`, `COMPONENT_ARCHITECTURE.md` §8 |
| 17 | **Off-identity palette in active use.** `peach-*` ×12, `lavender-*` ×12, `sky-*` ×5 — none belong to the botanical direction, almost all in mood chips. | `src/lib/mood.js` |
| 18 | **Decorative blur** on the auth panel (`bg-rose-400/45 blur-2xl`) is the one gradient-adjacent ornament; the brief rules it out. | `AuthShell.jsx:33-37` |
| 19 | **`theme-color` meta** is still the old cream `#FBF7F1`; will mismatch the new beige sheet on mobile. | `index.html:10` |
| 20 | ~~**Footer links are inert** (`href="#"`) including "Privacy"~~ — **closed in P6.** Every footer link now resolves; "Privacy" and "Terms" reach new public pages rather than Settings behind the auth guard, and "Our story"/"Support" were dropped for having no destination. | `Footer.jsx`, `pages/Legal.jsx`, `lib/legal.js` |

---

## 10. Proposed changes, in approval order

| Phase | Change | Files | Risk |
|---|---|---|---|
| **P1** | Re-point `@theme` values to §4 (`cream`→`sand`, `ink`, `rose`, `sage`, add `butter`, retire `peach`/`lavender`/`sky`); define radius §7.1; drop the card border in `surface` | `index.css` only | Low — names preserved, no JSX edits |
| **P2** | Correct the 4 a11y defects (§9.2): `ink-300` call sites, primary button, focus ring, mobile tab label size | `index.css`, `Button.jsx`, `AppShell.jsx`, + `ink-300` sites | Low |
| **P3** | Re-map the 8 mood chips to §7.2, keeping literal class strings | `mood.js` | Low |
| **P4** | Type-scale tokens; fix findings 8–11, 13–15 | `index.css`, `AuthShell.jsx`, `Connect.jsx`, `Dashboard.jsx`, `Memories.jsx` | Medium — visual, contained |
| **P5** | **Structural**: Settings & Privacy page + route, notification entry, clickable profile, split preferences out of Profile, remove auth blur, update `theme-color` | `App.jsx`, `AppShell.jsx`, new `Settings.jsx`, `Profile.jsx`, `index.html` + 6 more | **Higher — needs explicit approval** |
| **P6** | **Frontend cleanup** (as approved): one shared unlink confirmation across Connect and Settings; public Privacy/Terms pages so the footer can be wired; audit every nav link, button, the account menu and logout. | new `ConfirmUnlink.jsx`, `Legal.jsx`, `lib/legal.js`; `Connect.jsx`, `Settings.jsx`, `Footer.jsx`, `Landing.jsx`, `App.jsx` | Low — additive; no behaviour removed |
| ~~P6 as first scoped~~ | ~~Converge the 3 update presentations onto one `UpdateCard`~~ — **not the work P6 became.** Taken up in P7 and closed there: the rule converged, the containers did not. | 3 components + 3 pages | Medium — refactor, verify behaviour preserved |
| **P7** | **Remaining frontend work before the backend**: single-source the update presentation rule, isolate mock state per session, preserve the attempted route through authentication, and give the daily-update composer its own route. | new `NewUpdate.jsx`, `lib/redirect.js`; `ReactionBar.jsx`, `DataProvider.jsx`, `App.jsx`, `Dashboard.jsx`, `Memories.jsx`, `Login.jsx`, `SignUp.jsx`, `Landing.jsx` | Medium — touches a working publish flow |
| **P8** | **Functional consistency audit** — the §5 half of the same brief, run as a sweep rather than a feature list: dead buttons, wrong destinations, missing loading/empty states, inconsistent validation, logout through Back and direct URL, responsive damage. Fix only what is genuinely broken. | `lib/date.js`, `Profile.jsx`, `Connect.jsx`, `CountdownCard.jsx`, `CoupleCounter.jsx`, `DataProvider.jsx` | Low — four contained defects, no layout or token change |

P1–P4 changed no page's structure. **P5 added screens that did not exist** and is now shipped
(§10.2); **P6 added two public routes and one shared dialog** (§10.3); **P7 moved one existing
screen onto its own route and closed finding 16** (§10.4), which was the last structural item the
audit held back for a later phase.

### 10.1 P1–P4 — shipped record

P1, P2, P3 and P4 are implemented; so are P5 (§10.2), P6 (§10.3) and P7 (§10.4). Two decisions from
the approved design brief landed differently than §4–§7 anticipated, and the tables above now defer to
this list:

- **Milestone colour.** `CoupleCounter` and `CountdownCard` are butter cards (`bg-butter-200`,
  `shadow-soft`, no border) with rose icon wells and charcoal numerals, per your instruction.
  §7.3's "shared milestone → butter" row is now the shipped behaviour, and open question 3 is closed.
- **Auth panel.** `AuthShell`'s aside is `bg-sage-500` with `text-ink-900` headings and
  `text-ink-700` body — the largest single contrast win in the app (2.58 → 6.11 on the headline).
  Its display statement is an `h2` capped at `text-3xl` so it never exceeds the page `h1`.

Deviations from the written spec:

| Item | Spec | Shipped | Why |
|---|---|---|---|
| Focus ring | `rose-950` (10.50) | `rose-800` `#9D4466` | 5.36 on `sand-100`, 4.60 on `sand-400` — clears the 3:1 non-text floor with room, but reads as a ring rather than a black bar. |
| Page-title token | named `title-page` | built-in `text-3xl` → `sm:text-4xl` | A second name for the same pair would be dead weight; 7 h1 sites already use it. Line-height at the top step is 40, not 44. |
| Marketing section h2 | `title-section` (20) | `text-2xl` → `sm:text-3xl` (24→30) | The landing page is a marketing surface; the app's 20px tier reads as under-scaled there. Hero keeps its exempt treatment. |
| `text-sm` / `text-xs` | new `body` / `meta` names | existing names re-pointed (15 / 13) | Renaming ≈355 call sites for no visual gain; the values moved instead. |
| `surface` | keeps its 1px border | border removed | The one P1 change that touched markup: two panels that relied on `surface` for their border width (`Connect`, `Profile`) now declare `border` explicitly. |
| Eyebrow + accent text | `rose-700` | `rose-800` | Measured in-browser, `rose-700` on the `sand-400` page background is **4.19** — under the 4.5 floor at 13px. `rose-800` measures 4.62 there and 5.36 on `sand-100`. Applies to the eyebrow pattern, the "Newest" label, auth-page links and the active nav/tab label. |
| Auth panel body copy | `ink-700` / `ink-500` on sage | `ink-900` throughout | `ink-700` on `sage-500` measures **4.37** and `ink-500` **3.45**. Nothing lighter than charcoal clears AA on the sage fill, so the panel's hierarchy is now carried by size and style (the closing quote is serif italic) instead of by colour. |

Verification after these edits: `oxlint` clean (0 warnings, 0 errors, 44 files), `vite build` clean
(42.90 kB CSS / 8.03 kB gzip), and no call site references a retired token
(`peach` / `lavender` / `sky` / `sage-soft` / `sage-deep` / `cream-400`).

A computed-style contrast sweep over the rendered DOM — every visible text node, foreground and
background resolved through the ancestor stack with oklab→sRGB conversion and alpha compositing,
4.5:1 body / 3:1 large-text thresholds — reports **0 failures on all six routes** (`/`, `/login`,
`/app`, `/app/memories`, `/app/connect`, `/app/profile`) at both 1280px (342 nodes) and 390px
(278 nodes). Text sitting on photographs is excluded; that is handled by the scrim, not by tokens.

Heading audit at 1280px found no level inversions: `/login` renders its aside `h2` and page `h1` at
the same 30px, and every app page's `h1` is 36px against 20px `h2`s. No route overflows
horizontally at 390px (`scrollWidth === clientWidth` on all nine routes, including 404).

### 10.2 P5 — shipped record

Navigation was the whole phase: the four items the brief asked for (profile access, notification
access, a settings destination, meaningful endpoints) were either inert or absent.

**The arrangement.** Primary nav stays in whichever surface belongs to the viewport; secondary nav
(bell, account menu) stays in the sticky top bar at *every* width. That is what keeps the mobile
bottom bar at exactly four tabs instead of six — the crowding the brief warned about is avoided by
never adding to that bar, rather than by shrinking it.

**Two colour decisions landed here**, both from the "do not randomly introduce other colours" rule:

| Item | Was | Now | Why |
|---|---|---|---|
| `theme-color` (mobile browser chrome) | `#FBF7F1` | `#E7DFD1` | A pre-botanical off-white that survived P1 because it lives in `index.html`, not `@theme`. Every other surface moved to the six approved hexes; the phone's status bar did not, so the app's own background colour was visibly wrong in Chrome Android and iOS Safari. |
| Favicon `public/heart.svg` | `#FBF7F1` rect, `#D98086` heart | `#FAF8F5` rect, `#C9829D` heart | Same two retired values, hardcoded in markup. The rect now matches `cream-50` and the heart matches `rose-500`, which is what `Logo.jsx` renders. |

**The auth blur is gone.** `AuthShell`'s `bg-butter-300/60 blur-2xl` circle was deleted along with
the `relative z-10` layering and `overflow-hidden` that existed only to sit above it. The sage panel
is a flat field with charcoal type; the glow was the "unnecessary gradient" the brief rules out, and
butter is meant to mean *milestone*, not decoration.

**Unplanned fix: the nav swap moved from `md` to `lg`.** At a 768px viewport with a scrollbar the
top bar offers 689px of content box; logo (132) + four tabs (458) + the account cluster (142) + two
`gap-4` need 764px, so the row overflowed by 43px on every authenticated page. This predates P5 —
the old avatars-plus-logout cluster was 110px, so the row was already ~11px over — and the bell
widened it. 1024px is the first width where the top bar genuinely fits, so tablets keep the bottom
bar. Verified: 0px overflow on all ten routes at 390, 768, 1024 and 1280.

**Deviation from the brief's notification spec.** Rows deep-link to `/app/memories?open=<id>` rather
than to a `/app/notifications` route. A panel already shows the six recent things; a page showing
the same list is a second destination for no gain. This required making the memory modal
addressable, which it now is (`useSearchParams`, `replace: true` on dismiss).

Verification after these edits: `oxlint` clean (0 warnings, 0 errors, 49 files), `vite build` clean
(44.61 kB CSS / 8.36 kB gzip, 285.83 kB JS / 88.55 kB gzip). The computed-style contrast sweep was
rerun over `/app`, `/app/settings`, `/app/profile`, `/app/memories`, `/app/connect` and `/` with
both header panels open — **0 failures across 359 text nodes**. Sixteen nodes on `/app/memories`
sit on the photo scrim and are excluded by method, not by judgement: the worst case (cream-50 type
over `from-ink-900/70` composited onto a pure-white photograph) measures **4.97**, so it clears AA
against any image.

### 10.3 P6 — shipped record

A cleanup phase, so the test was whether anything got *simpler* without anything getting rewritten.

**One unlink confirmation, not one generic dialog.** Connect called `unlinkPartner()` on click while
Settings already asked first — two entry points, two promises about the same destructive act. The
extracted component is `couple/ConfirmUnlink`, scoped to *unlinking a partner*, reading `partner`
from `useData()` so neither caller passes it. A generic `ConfirmDialog` was the obvious alternative
and was rejected: the unlink and delete questions name different subjects, carry different
consequences and need different follow-through (navigate vs `signOut()`), so a shared shell would
have had to be told at each call site what the component should already know. Delete keeps its own
`Modal` in `Settings.jsx` for the same reason.

Connect mounts the dialog **outside** the `connected ? … : …` branch. Confirming flips that branch
underneath the open dialog, so a dialog inside the branch it destroys unmounts mid-dismiss.

**The footer needed new pages, not new links.** All eight `href="#"` were inert, and "Privacy" could
not point at `/app/settings#privacy` from a public page — `RequireAuth` bounces that click back to
`/login`. So `/privacy` and `/terms` were added outside the guard, one `Legal` shell rendered twice
from two objects in `lib/legal.js`. "Our story" and "Support" were deleted rather than given a
destination, because inventing a page to fill a footer slot is how dead links come back.

The footer's section links are absolute (`/#features`) because the footer also renders on the legal
pages, which do not contain those anchors. That needs a scroll-to-hash effect in `Landing.jsx`:
`<Link to="/#features">` sets the fragment but React has not painted the target yet, so the browser
has nothing to jump to.

**Copy written against the build, not a launch.** Both documents state that the preview stores
nothing off-device and name the Stage 3 gaps; both carry "v0.1, running on sample data" and are
flagged for legal review before any public launch. No support email is invented, and governing law
is listed as undecided rather than assumed.

Verification: `oxlint` clean (0 warnings, 0 errors, **52 files**, up from 49), `vite build` clean
(**45.11 kB** CSS / 8.41 kB gzip, **296.55 kB** JS / 92.04 kB gzip). All ten rendered routes swept
at 390 / 768 / 1280 — **0 horizontal page overflow, 0 clipped text nodes** (the detector's only hits
at 390 were `sr-only` spans, which Tailwind clips by design), **0 dead links**, **0 unlabeled
buttons**. Logout clears `localStorage["togetherly.session"]`, lands on `/`, and both browser-Back
and a fresh load of `/app/memories` resolve to `/login`. `ConfirmUnlink` renders byte-identical
copy on Connect and Settings; cancelling leaves the connection intact; Escape closes it and restores
body scroll.

### 10.4 P7 — shipped record

Four items, all of them "finish the frontend before the backend". None of them were visual, so the
test for this phase was whether anything got *single-sourced* without anything getting rewritten.

**The rule, not the container.** Three surfaces each re-decided the same two questions — is this my
update (so: read-only `ReactionSummary`) or my partner's (so: interactive `ReactionBar`), and who
wrote this. `UpdateReactions` now owns the first, `DataContext.personById` the second; Dashboard ×2,
the Memories modal and the new confirmation card all ask the same component. Getting the rule in one
place matters more than it looks: a fourth surface appearing in Stage 3 would have been free to get it
backwards, and "you can react to your own post" is the kind of bug that reaches production quietly.
`PhotoCard` and `MemoryCard` were **not** merged — see `COMPONENT_ARCHITECTURE.md` §8 for the
`<article>`-vs-`<button>` reason.

**The composer became a destination.** `/app/new` renders the existing `DailyUpdateForm` full-page;
Dashboard's two buttons navigate instead of expanding a form inline. One path to publish, and wireframe
08 finally has an address. The 900 ms demo round-trip moved out of the page into `publishUpdate()`, so
every caller gets the same pending state and the same Stage 3 seam.

**A lint rule changed the design, for the better.** The first version passed the published update to
Dashboard through router state and flashed a confirmation there — which `react(set-state-in-effect)`
correctly flagged, because an effect that calls `setState` starts another render. Dropping cross-page
transient state and confirming **in place** on `/app/new` (state set from the publish *result*, an
event) removed the double render, kept Dashboard's `useEffect`/`useNavigate` footprint smaller than it
started, and made `/app/new` a complete screen rather than a form that hands its outcome to someone
else.

**Auth redirects were a race, not a gap.** The deep link arrived at `/login` intact — `location.state`
had it — and then got lost anyway, because `signIn()` flips `isAuthenticated` while the form's own
`navigate()` is still in flight. Whichever of the two renders first wins, and they disagreed: the guard
aimed at `/app`, the form aimed at the preserved path. Both now call the same `redirectTarget(from,
fallback)` from `lib/redirect.js`, so the destination is identical whichever fires; `/signup` passes
`/app/connect` as its fallback because a brand-new space has no partner yet. The helper rejects any
`from` that does not start with a single `/` — a stored path must never become a way off the site.
`/forgot-password` is deliberately left outside both guards: it is how a signed-out person gets back in.

**Session isolation is one `key`.** `DataProvider` sits above the route guard, so it cannot unmount
with the protected tree; `SessionScope` re-keys it on `user?.id`. That covers updates, reactions,
notifications, the connection state and Profile edits simultaneously, with no reset actions scattered
through the provider — and it deletes itself once Stage 3 fetches per user.

Verification: `oxlint` clean (0 warnings, 0 errors, **54 files**, up from 52), `vite build` clean
(**45.19 kB** CSS / 8.43 kB gzip, **299.41 kB** JS / 92.59 kB gzip, 1759 modules). The last two
builds differ because the convergence pass finished with the two small removals it had been
holding back: the landing hero's hand-rolled letter avatar now renders through `Avatar`, and the
dead `personById` export is gone from `mockData.js` — the lookup lives on `DataContext` instead.
A cold load of
`/app/memories?open=upd-01` while signed out lands on `/login` and returns to the **same URL with the
modal open**; signed-in visits to `/login` and `/signup` resolve to `/app` and `/app/connect`.
Publishing from `/app/new` was exercised end to end — validation message, real pending state, the
wireframe-08 confirmation, the echoed card, and both footer buttons. Convergence was checked by
counting reaction controls per card: the partner's card renders 5 interactive buttons and no summary,
your own card renders the summary and 0 buttons. Session isolation was checked by publishing, signing
out (`session: null`, path `/`), signing back in, and confirming the post is gone and the bell badge is
restored to "Notifications, 3 unread". Twelve routes swept at 390 / 768 / 1280: **0 overflow, 0
clipped, 0 dead links** on every one; `/login` and `/signup` were re-swept separately while signed out,
because behind the guard they render the dashboard instead of themselves. The `Avatar` swap was then
re-checked against the markup it replaced: computed 36×36, `border-radius` full, `rgb(244,230,235)`
fill, `rgb(167,72,108)` text, Fraunces 15px/600 — identical to the inline span, with the inherited
`shrink-0` inert in a non-flex parent. The hero is `display:none` below `lg`, so 390 has nothing to
regress; `/` at 1280 and `/app/memories` both load with a clean console.

### 10.5 P8 — shipped record

P7 shipped items 1–4 of the brief; this closes item 5, the functional consistency audit, which is a
sweep rather than a feature. Four defects surfaced. Three were reachable by an ordinary user doing
ordinary things; the fourth was a lie in a comment.

**A cleared date unmounted the application.** `Profile.jsx` derived its date inputs with
`new Date(value).toISOString().slice(0, 10)`, and `toISOString()` throws `RangeError` on an invalid
date. Native date inputs expose a clear affordance, so one click on the × beside "Next meeting" wrote
`''` into context, threw during render, and React tore down the whole tree — a blank page until
reload. The fix is not a try/catch at the call site. `lib/date.js` now parses through one `timeValue`
helper that yields `null` for anything unparseable, and every consumer decides what absence looks
like: `daysBetween` returns 0, `countdownTo` returns `isSet: false`, `formatDate` returns `''`. The
two counters gained unset text — "Set your anniversary", "Pick a date and the clock starts." — which
is the empty state those cards never had and could not previously need.

**Profile accepted a blank name.** `saveEdit()` computed `initials` as `name.trim().charAt(0) || '?'`
and then saved the untrimmed original anyway, so `   ` became the page heading: `/app/profile` read
"& Sparkles", the avatar became a literal question mark, and every interpolated greeting degraded. This
was the only required-text field in the app that did not reject empty input — the auth forms, the
composer and the invite code all do. It now rejects inline through `Field`'s existing `error` prop,
keeps the dialog open, and trims on save.

**The copy-code button could fail silently.** `copyCode()` awaited `navigator.clipboard.writeText`
with no catch. The clipboard is absent in insecure contexts and rejects on denied permission, so the
rejection escaped, the label stayed "Copy code", and the user had no signal. Two unhandled rejections
per click, measured. It now catches and reads "Could not copy" — and because the code is already set
in `text-figure` above the button, the failure has an obvious manual route rather than needing a new
one.

**`loading` was fake, and the comment said otherwise.** `DataProvider` held `useState(true)` behind a
450 ms timer "so every screen already handles the loading state". No screen but `Memories` read it,
and `Memories` paid 450 ms of spinner over data already in memory. The timer is gone; `loading` is now
an honest constant that Stage 3 will drive, and `Memories` keeps the branch it will drive.

One thing the audit found and left alone: the section-jump chips in Settings sit in an
`overflow-x-auto` rail, so three of them measure off-screen at 390px. That is the pattern working, not
overflowing — the document itself does not scroll sideways. `DailyUpdateForm` is also the one form
without `noValidate`; it has no `required` attributes, so nothing triggers native validation and
adding the attribute would change nothing.

Verification: `oxlint` clean (0 warnings, 0 errors, 54 files), `vite build` clean (1759 modules,
**45.19 kB** CSS / 8.43 kB gzip — unchanged, no token or utility added — **300.03 kB** JS / 92.84 kB
gzip). Each fix was reproduced before being fixed and re-checked after: clearing both dates leaves the
tree mounted, `NaN` and "Invalid Date" appear nowhere, and the unset text renders within 60 ms of the
change rather than on the next clock tick; a blank name is refused with the dialog open and a padded
valid one saves trimmed; a rejecting clipboard yields "Could not copy" with zero unhandled rejections
and a resolving one still yields "Copied". Publishing from `/app/new` was re-run end to end because
`DataProvider` changed. Logout was tested the way the brief asked — Back from `/` lands on `/login` and
stays there with 0 protected articles rendered, and a direct load of `/app/connect` while signed out
redirects and then returns to `/app/connect` after login. Routes re-swept at 390 and 1280: 0 overflow,
0 clipped outside the intentional scroller.

---

## 11. Open questions

1. Does the botanical reference carry any texture (paper grain, pressed-flower illustration) that
   should become a background treatment, or is the identity purely chromatic? I cannot see the
   image — it is not in the workspace.
2. ~~Notifications: a badge count on a bell, or a real panel? Stage 3 gives Supabase Realtime a route
   to power it; today there is no notification data model at all.~~ — **answered 2026-10-31: both,
   in P5.** A bell with a badge opens a panel of the six most recent items, and `seedNotifications` +
   four `DataProvider` members are the model. Stage 3 swaps the seed for a Realtime channel without
   touching a page.
3. ~~Days-together and countdown figures currently use `rose`/`cream` accents. Confirm **butter** as
   the milestone colour~~ — **answered 2026-10-31: butter, shipped in P1.**
