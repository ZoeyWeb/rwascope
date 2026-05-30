# RWAscope Design Language

**Version:** 1.0.2
**Date:** 2026-05-30
**Status:** Authoritative reference for all UI work
**Maintainer:** Zoey (Yizhou Wen)
**Scope:** All pages under `web/src/screens/`

> This document is the single source of truth for visual decisions on RWAscope.
> When in doubt — design language wins over current implementation.
> Anti-patterns in §9 are blacklisted, no exceptions.

---

## 1. Core Principles

These are non-negotiable. Every component, page, and token must honour them.

1. **Editorial > UI**
   RWAscope reads like a research publication, not a SaaS dashboard. Long-form structure, generous typography hierarchy, restrained colour. Bloomberg / Stripe Press / a16z Future as references — not Linear, Notion, or Vercel marketing pages.

2. **Hairlines, not boxes**
   Section boundaries are 1px dividers (`ed-hairline`) and full-bleed background colour shifts. No rounded card containers. No drop shadows. `borderRadius.DEFAULT = 0` is intentional and global.

3. **Type hierarchy is sacred**
   Every size on screen comes from the 11-token typography scale (§2.2). No `text-[2rem]`, no inline `style={{ fontSize: ... }}`, no `leading-[1.55]`. If a needed size doesn't exist, add a token — don't bypass.

4. **Colour discipline**
   Maximum two surface colours per page (canvas + one accent surface). The accent rotates between cool grey (`ed-surface-cool`) and warm sand (`ed-surface-sunken`) — never both on the same page. Semantic colour is reserved for `ed-incident` (red). No purple, no blue, no green chips in default UI.

5. **Size with intent**
   Hero sections can dominate; body sections compress by content density. A page should have visible amplitude — not uniform vertical rhythm. Section padding choices (§2.3) are deliberate, not decorative.

---

## 2. Token System

### 2.1 Colour tokens

**Active tokens — use these in all new code.**

| Token               | Hex       | Role                                                         |
|---------------------|-----------|--------------------------------------------------------------|
| `ed-ink`            | `#1A1A2E` | Active fills, primary CTA, hover ink                         |
| `ed-ink-hover`      | `#2A2A42` | Hover state on titles, links                                 |
| `ed-text-primary`   | `#1A1A2E` | Body headings, input text (same hex as ink, semantic split)  |
| `ed-text-secondary` | `#52525B` | Body copy, secondary metadata                                |
| `ed-text-muted`     | `#78716C` | Eyebrow labels, captions, inactive chip text                 |
| `ed-text-faint`     | `#A8A29E` | Footnotes, disclaimers, placeholder                          |
| `ed-canvas`         | `#FAFAF9` | Root page background                                         |
| `ed-surface`        | `#FFFFFF` | White card / inline content surface                          |
| `ed-surface-cool`   | `#F4F5F7` | Full-bleed cool-grey section background                      |
| `ed-surface-sunken` | `#F5F4F1` | Full-bleed warm-sand section background                      |
| `ed-hairline`       | `#E7E5E4` | 1px dividers, primary borders                                |
| `ed-hairline-faint` | `#F0EFEC` | 1px inner dividers (lists)                                   |
| `ed-incident`       | `#B91C1C` | Severity badges, error text — **only semantic accent**       |
| `ed-hk-text`        | `#0C447C` | HK-specific locale text (legitimate variant, not deprecated) |

**Deprecated tokens — see §9 for migration plan. Do not introduce in new code.**

> **Active deprecated tokens still in use:** `ed-accent` (NarrativeTimelineView line 248), `ed-divider`, `ed-info-*`, `ed-warn-*`, `ed-success-*`, `ed-type-policy` (all in PolicyImpactCard.tsx). Migration is Task 10.

### 2.2 Typography tokens

All sizes come from `tailwind.config.js` `fontSize` extension. Eleven tokens, hierarchical.

| Token                     | Size           | Line-height | Tracking  | Weight | Use                                |
|---------------------------|----------------|-------------|-----------|--------|------------------------------------|
| `text-ed-page-h1`         | 5rem (80px)    | 1.05        | −0.025em  | 600    | Page hero on Intelligence only     |
| `text-ed-hero-h1`         | 4rem (64px)    | 4.4rem      | −0.03em   | 600    | Alt hero (Projects, Market, etc.)  |
| `text-ed-section-h2`      | 2.625rem (42px)| 3rem        | −0.025em  | 600    | Section headers (Brief, News…)     |
| `text-ed-section-h2-light`| 2.625rem (42px)| 3rem        | −0.025em  | 400    | Light variant for editorial leads  |
| `text-ed-lede`            | 1.375rem (22px)| 2rem        | −0.005em  | 400    | Subhead / standfirst paragraph     |
| `text-ed-block-h3`        | 1.5rem (24px)  | 1.875rem    | −0.015em  | 600    | Sub-block headers within section   |
| `text-ed-item-h4`         | 1.0625rem (17px)| 1.5rem     | −0.005em  | 500    | Card / item title                  |
| `text-ed-body-lg`         | 1.125rem (18px)| 1.875rem    | —         | 400    | Featured body (lede paragraph)     |
| `text-ed-body`            | 0.9375rem (15px)| 1.625rem   | —         | 400    | Default body copy                  |
| `text-ed-meta`            | 0.8125rem (13px)| 1.125rem   | —         | 400 †  | Captions, dates, disclaimers       |
| `text-ed-eyebrow`         | 0.6875rem (11px)| 1rem       | 0.18em    | 500    | Section / block label (uppercase)  |

† `tabular-nums` enabled for numeric alignment.

**Rules:**
- A size is either in this table or doesn't exist. No `text-[Xrem]` arbitrary values anywhere.
- `font-weight` and `letter-spacing` are baked into tokens — do not re-apply via `font-semibold` or `tracking-widest` on a tokened element.
- `leading-*` overrides are forbidden on tokened text.
- 14px (intermediate body) is **not in the scale**. If a sub-body size is needed, debate the hierarchy — don't add a token silently.

**Semantic mapping** (canonical):
- Disclaimer / footnote → `text-ed-meta` (not eyebrow — eyebrow is a label semantic)
- Eyebrow → only for section-level uppercase labels above an H2/H3
- Card title → `text-ed-item-h4`
- Card summary → `text-ed-body`

### 2.3 Spacing tokens

| Token              | Value       | Use                                              |
|--------------------|-------------|--------------------------------------------------|
| `ed-section`       | 8rem (128px)| Margin between top-level page sections           |
| `ed-hero`          | 6rem (96px) | Hero / subscribe section padding                 |
| `ed-section-lg`    | 4rem (64px) | Major sub-block padding (Narrative full-bleed)   |
| `ed-section-md`    | 2.5rem (40px)| Secondary block padding (News, EditorialGrid)   |
| `ed-section-sm`    | 1.5rem (24px)| Compact block padding (EditorNote)              |
| `ed-section-xs` †  | 1rem (16px) | Tight inline block padding                       |

† **Add this token in Task 5.** Currently missing.

**Aliases to delete** (Task 4): `ed-block` (= `ed-section-md`), `ed-item` (= `ed-section-sm`), `ed-sub` (= `ed-section-sm`).

### 2.4 Eyebrow spacing rule

Two distinct roles. Pick the right one before applying margin.

**Role A — section-eyebrow** (opens a full-width content block, paired with a section heading)

| Following element           | `mb-` on eyebrow |
|-----------------------------|-----------------|
| H1 (`page-h1` / `hero-h1`) | `mb-8` (32px)   |
| H2 (`section-h2`)          | `mb-4` (16px)   |
| H3 (`block-h3`)            | `mb-3` (12px)   |

**Role B — micro-eyebrow** (inside a card or compact container, tight to its title)

| Following element       | `mb-` on eyebrow |
|-------------------------|-----------------|
| Item title (`item-h4`)  | `mb-1` (4px)    |
| Body / body-lg          | `mb-2` (8px)    |

**N/A contexts** — do not use `<Eyebrow>` for:
- Horizontal flex-row labels → use `text-ed-meta uppercase` directly
- Inline badge / chip text

**Decision rule:** eyebrow inside a card, column, or compact container → Role B (micro). Eyebrow opening a full-width section → Role A (section-eyebrow). When in doubt, ask: does this eyebrow have a section H2 below it? If yes → Role A.

### 2.5 Border radius

Global `borderRadius.DEFAULT = 0`. Only `rounded-full` is permitted, and only for circular elements (avatars, dots). **No `rounded-md`, no `rounded-lg`.** This is what defines the editorial silhouette.

---

## 3. Layout Patterns

Six patterns. Reach for these before inventing new layout.

### 3.1 Page hero (Intelligence model)

```tsx
<section className="bg-ed-canvas pt-ed-hero pb-ed-section-lg">
  <div className="max-w-[1200px] mx-auto px-6">
    <Eyebrow>SECTION LABEL</Eyebrow>
    <h1 className="text-ed-page-h1">Page title</h1>
    <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-6">
      Standfirst paragraph.
    </p>
    <div className="text-ed-meta text-ed-text-muted mt-8">
      Updated weekly
    </div>
  </div>
</section>
```

### 3.2 Full-bleed coloured section

Used for Weekly Brief (`ed-surface-cool`) and Narrative (`ed-surface-sunken`).

```tsx
<section className="bg-ed-surface-cool py-ed-section-md">
  <div className="max-w-[1200px] mx-auto px-6">
    <Eyebrow>WEEKLY BRIEF</Eyebrow>
    <h2 className="text-ed-section-h2 mt-4">Section title</h2>
    {/* content */}
  </div>
</section>
```

**Rule:** A page can have at most one `cool` and one `sunken` section, alternating. Never two of the same surface in sequence.

### 3.3 Eyebrow + content block

```tsx
<div>
  <Eyebrow>BLOCK LABEL</Eyebrow>
  <h3 className="text-ed-block-h3 mt-3">Block heading</h3>
  {/* content */}
</div>
```

Use the `<Eyebrow>` component (§4.2) — never inline `text-ed-eyebrow text-ed-text-muted` repeated.

### 3.4 Two-column editorial grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-[1fr,1px,1fr] gap-x-12">
  <div>{/* left column */}</div>
  <div className="bg-ed-hairline" aria-hidden /> {/* vertical hairline */}
  <div>{/* right column */}</div>
</div>
```

The 1px hairline column is the divider — don't `border-r` the left column.

### 3.5 Paginated list with Load more

```tsx
const { visible, loadMore, canLoadMore } = usePagination(items, 20);

<ul className="divide-y divide-ed-hairline-faint">
  {visible.map(item => <ItemCard key={item.id} item={item} />)}
</ul>
{canLoadMore && (
  <button onClick={loadMore} className="mt-6 ...">Load more →</button>
)}
```

Task 7 extracts `usePagination`. It must reset `visibleCount` when the source array identity changes (the current NewsSection bug).

### 3.6 Stats Ribbon (`<BigStatRibbon>` / `<BigStat>`)

Used immediately below the hero on data-intensive pages (Projects, Assets, Licenses, Compliance). Shows 4–5 key counts at a glance.

```tsx
import { BigStat, BigStatRibbon } from '../../components/BigStat';

<BigStatRibbon>               {/* cols={5} for 5-stat pages */}
  <BigStat value={42}    label="Total" />
  <BigStat value={29}    label="Active"   valueColor="#2E7D32" />
  <BigStat value={12}    label="Pending"  valueColor="#e09d2b" />
  <BigStat value="$1.2B" label="TVL" />
</BigStatRibbon>
```

**Rules:**
- Background: `bg-ed-surface-cool` (cool grey, full-bleed). Never `sunken` — reserve warm sand for narrative sections.
- Grid: `grid-cols-2 sm:grid-cols-4` (or `sm:grid-cols-5`). Divided by `divide-x divide-ed-hairline`.
- Number: `text-ed-section-h2 font-semibold text-ed-text-primary tabular-nums`. Optional `valueColor` for signal colours (green/amber/red/gray).
- Label: `text-ed-eyebrow text-ed-text-muted uppercase` below the number with `mt-2`.
- Default number colour is `text-ed-text-primary` (no signal). Add `valueColor` only where the count has a status meaning (licensed = green, restricted = red, etc.).
- Forbidden: rounded corners, drop shadow, boxed border around individual stats, progress bars, percentage bars.

### 3.7 Section divider

```tsx
<div className="border-t border-ed-hairline my-ed-section" />
```

A bare hairline with `ed-section` margin top+bottom. No "fancy" dividers, no labelled separators.

**Note:** section numbering shifted to 3.7 after insertion of Stats Ribbon (§3.6) in v1.0.2.

---

## 4. Core Components

Six. Anything reusable across two+ pages should already exist here. If you need a 7th, add it to §4 before using it.

### 4.1 `<ItemCard>` — `components/ItemCard.tsx`
Status: **to extract from Intelligence/index.tsx lines 343–477.**
Props: `item`, `expanded`, `onToggle`. Renders eyebrow (type) + title + summary + expand body + Source link. Accordion via `grid-template-rows` transition.

### 4.2 `<Eyebrow>` — `components/Eyebrow.tsx`
Status: **to extract (Task 6).**
```tsx
<Eyebrow className="mb-4">SECTION LABEL</Eyebrow>
// renders: <div className="text-ed-eyebrow text-ed-text-muted uppercase">SECTION LABEL</div>
```
No tracking override allowed — token bakes it in.

### 4.3 `<SectionHeader>` — `components/SectionHeader.tsx`
Status: **to extract (Task 6).**
Pairs eyebrow + H2 with the §2.4 spacing rule applied.
```tsx
<SectionHeader eyebrow="WEEKLY BRIEF" title="This Week's Highlights" />
```

### 4.4 `<FilterPill>` — `components/FilterPill.tsx`
Status: **to extract (Task 8).**
Used in Narrative TYPE/REGION filters, Projects directory filters (later). Single visual rule:
```tsx
<button className={cn(
  "px-3 py-1 text-ed-meta uppercase tracking-wider transition-colors",
  active ? "bg-ed-ink text-white" : "text-ed-text-secondary hover:text-ed-ink"
)} />
```

### 4.5 `<RegionActivityChart>` — `components/RegionActivityChart.tsx`
Status: **to extract + merge (Task 9).**
EditorialGrid2 and RegionActivityStrip are the same chart. Merge to one component with `variant: 'inline' | 'strip'`.
Horizontal bars only. `ed-ink` fill on active, `ed-hairline` track. No donut, no pie, no stacked.

### 4.6 `<SectionDivider>` — already in Intelligence/index.tsx 49–55, extract as-is.

---

## 5. Reusable Hooks

### 5.1 `usePagination(items, pageSize)` — `hooks/usePagination.ts`
Status: **to extract (Task 7).**
Returns `{ visible, loadMore, canLoadMore }`. **Resets `visibleCount` via `useEffect` when `items` reference changes** — fixes the NewsSection stale-count bug.

### 5.2 `useExpandedSet<T>(): [Set<T>, toggle, expand, collapse]` — `hooks/useExpandedSet.ts`
Status: **to extract.**
Consolidates the two separate expansion systems (NewsSection's own state, TimelineSection's parent-owned state) into one shared hook.

### 5.3 `useScrollToItem(setExpanded)` — `hooks/useScrollToItem.ts`
Status: **to extract.**
Encapsulates the 50ms-after-expand `scrollIntoView` workaround.

---

## 6. Intelligence Cleanup Checklist

Status as of 2026-05-27. Total estimated effort: ~5 hours.

| # | Task                                                    | Effort | Status |
|---|---------------------------------------------------------|--------|--------|
| 1 | Delete 6 legacy block components (~180 lines dead code) | 15min  | ✅ Done |
| 2 | WeeklyBriefSection — replace 4 hardcoded sizes with tokens | 30min | ✅ Done |
| 3 | AdminReview.tsx — replace 5 hardcoded hex with tokens   | 30min  | ✅ Done |
| 4 | Remove spacing aliases (`ed-block`, `ed-item`, `ed-sub`) | 20min | ✅ Done |
| 5 | Add `ed-section-xs` (16px) token                        | 10min  | ✅ Done |
| 6 | Extract `<Eyebrow>` + `<SectionHeader>` components      | 45min  | ✅ Done (extracted `<Eyebrow>`, deferred `<SectionHeader>`) |
| 7 | Extract `usePagination` hook (fixes NewsSection reset bug) | 45min | ✅ Done |
| 8 | Extract `<FilterPill>` component                        | 30min  | ✅ Done |
| 9 | Merge two RegionActivity widgets into `<RegionActivityChart variant>` | 1h | ✅ Done (also deleted EditorialGrid2 dead code, 108 lines) |
| 10| Fix deprecated-token annotation (audit doc + migrate PolicyImpactCard) | 1h | ✅ Done (Layer 1 only; Layer 2/2b deferred to v1.1) |

> **Cleanup pass 1 complete (2026-05-27).** Net change: ~530 lines deleted (legacy + dead code), 4 new components/hooks extracted (Eyebrow, FilterPill, RegionActivityChart, usePagination), 29 deprecated token sites renamed to active tokens, 2 zero-use tokens deleted from config.

### Task 2 — canonical mapping

WeeklyBriefSection (`Intelligence/index.tsx` lines 93–134):

| Line | Current                                          | Replace with    | Notes                                |
|------|--------------------------------------------------|-----------------|--------------------------------------|
| 103  | `text-[2rem] font-semibold leading-tight`        | `text-ed-section-h2` | Token bakes weight + line-height |
| 117  | `text-[11px] uppercase tracking-widest`          | `text-ed-eyebrow` | Token bakes tracking (0.18em)       |
| 120  | `text-[14px] text-ed-text-secondary leading-[1.55]` | `text-ed-body text-ed-text-secondary` | 14px not in scale → 15px |
| 127  | `text-[11px] text-ed-text-faint tracking-wide`   | `text-ed-meta text-ed-text-faint` | Disclaimer ≠ eyebrow semantically |

### Task 3 — AdminReview hex replacements

| Hex       | Replace with          | Role                  |
|-----------|-----------------------|-----------------------|
| `#737C7F` | `text-ed-text-muted`  | Muted text            |
| `#F1F4F6` | `bg-ed-surface-cool`  | Cool surface          |
| `#DBE4E7` | `border-ed-hairline`  | Border                |
| `#2B3437` | `text-ed-text-primary`| Primary text          |
| `#5E5C75` | **Decide**: drop (was `ed-accent`, deprecated) — replace with `ed-ink` |

---

## 7. Applying to Projects

Information architecture for the Projects page. Execute after cleanup §6 lands.

```
Projects (page)
├── Hero                    — RARM perspective, ~50 projects
├── At a Glance             — 3-col: New This Month / Recently Scored / Watchlist
├── Directory               — Filtered + paginated <ProjectCard> list
│                             RARM scoring expands inline (accordion, same pattern as ItemCard)
├── Postmortems             — Failure-case library (Terra/UST, USDC SVB, Tangible USDR…)
│                             Full-bleed `ed-surface-sunken`
└── Methodology footer      — Link to RARM paper + scoring criteria
```

**Constraints (non-negotiable):**
- ❌ No KPI dashboard
- ❌ No rounded card + shadow
- ❌ No donut/pie for RARM scores — horizontal bar (matches `<RegionActivityChart>`)
- ❌ Filter pills limited to 4 axes: asset class / region / RARM band / status
- ❌ No comparison view in v1

**Re-uses from Intelligence:**
- `<ItemCard>` pattern → `<ProjectCard>`
- `<FilterPill>` directly
- `<RegionActivityChart variant="inline">` for regional distribution in At a Glance
- `usePagination` for Directory + Postmortems
- Full-bleed pattern (§3.2): At a Glance `cool`, Postmortems `sunken`

---

## 8. Other Pages — Skeletons

### Market
Hero + live rated-asset table (Bloomberg-terminal-style, mono numerals via `tabular-nums`) + detail panel. No chip soup. Active row → ed-ink left rule, no card.

### Framework
Long-form editorial. Section-h2 + body-lg + numbered tables. Six-layer RARM grid as a table, not boxes.

### Ecosystem
Global network view. Region clusters as map dots + horizontal-bar regional activity. Maximum two surface colours per page rule applies.

---

## 9. Anti-Patterns / Known Debt

### Anti-patterns (blacklist)

- `text-[Xrem]` / `text-[Xpx]` arbitrary font sizes
- `style={{ fontSize: ... }}` inline
- `leading-[X]` / `tracking-[X]` on tokened elements
- `rounded-md` / `rounded-lg` / `shadow-md` / `shadow-lg`
- Coloured chips (purple/green/blue) outside `ed-incident` red
- Donut / pie charts
- Dashboard-style KPI tiles: boxed, shadowed, rounded, independent card-per-stat
- Two `ed-surface-cool` or two `ed-surface-sunken` sections back-to-back
- "Showing X of Y" totals when total is editorial filler, not user-actionable
- Eyebrow-sized section headers (eyebrow is a label, H2 is the header)

### Known debt — schedule for v1.1

**Deferred to v1.1 — visual-delta token decisions**

The following deprecated tokens were NOT migrated in Cleanup pass 1 because they involve visible colour change, not pure renames. Each requires a deliberate visual review before migration.

- **`ed-accent` (#5E5C75, 16 uses)** — The interactive accent across NarrativeTimelineView (links, spinners, stripes, "Expected Next" labels, quarter labels, count badges, Back link), HKObservation (links, spinners, related-projects buttons, Back link), DataMilestoneCard (source link), NarrativeSubscribeButton. Migrating to `ed-ink` (#1A1A2E) is a page-level aesthetic shift from soft purple-grey to dark navy. Decision needed: keep purple-grey identity for narrative-flavoured pages, or unify to ink across the system.

- **`ed-chip-text` (#44403C, 3+ uses)** — No exact active equivalent. Nearest is `ed-text-secondary` (#52525B) or `ed-text-muted` (#78716C), both cooler and lighter. Visible chip text shift either way. Decision needed alongside a future `<Chip>` component extraction.

- **`ed-divider-strong` (#D6D3D1, 1 use)** — Used for HKObservation source-tab hover border. Pending alongside the source-tab redesign (see below). Likely renamed to `ed-hairline-strong` when source-tab is extracted.

**Deferred to v1.1 — semantic colour islands**

Three components use the old semantic colour families (`ed-warn-*`, `ed-info-*`, `ed-success-*`, `ed-type-*`) deliberately — colour communicates meaning. These are exempt from the "no coloured chips" rule in §9 Anti-Patterns, analogous to AdminReview's admin-only colours.

- **`PolicyImpactCard.tsx`** — Four-layer regulatory flow (warn → neutral → success → info) where colour encodes the macro impact direction. Section backgrounds, not badges; a `<SemanticBadge>` abstraction does not fit. v1.1 decision: rename token families (e.g. `ed-signal-warn-*`) and document the four-flow palette, or redesign the card without semantic colour.

- **`DataMilestoneCard.tsx`** — Uses `ed-type-research` pervasively (border, icon, eyebrow, drivers label, change value) as the data-milestone identity colour. v1.1 decision tied to the broader `ed-type-*` palette review.

- **`DisclaimerBanner.tsx`** — Uses `ed-warn-bg/text` correctly for amber regulatory disclaimer. Lowest-risk migration: rename to `ed-signal-warn-*` with no visual change.

**Deferred to v1.1 — pending component extractions**

- **`<Chip>` component** — Currently 3+ chip implementations across files (RegionChip in NarrativeTimelineView, SourceChip in HKObservation, region chip in DataMilestoneCard). Extract during Projects directory build when chip volume increases.

- **`<SectionHeader>` component** — Only 3 clean eyebrow+H2 pairings exist on Intelligence today (below the 2+ page threshold). Re-evaluate after Projects build — likely meets threshold then.

- **`<SemanticBadge>` component** — Initially proposed for PolicyImpactCard internal labels (① ② ③ ④) but on closer look, these are card-internal labels with semantic backgrounds, not standalone badges. Hold until Projects scoring layers reveal a real reusable pattern.

- **HKObservation source-tab** — Bordered tab with count badge; visual style distinct from `<FilterPill>`. Extract during HKObservation refactor in v1.1.

**AdminReview.tsx admin-only colours** — 4 hardcoded hex sets are deliberately exempt from this document's colour rules. They use semantic colours outside the editorial palette: approval green (`#E1F5EE` / `#085041`), reject soft-red (`#FEF2F2` / hover `#fde8ea`), event-type chip purple (`#EEEDFE` / `#5B21B6`), and landmark amber (`#854F0B`). These are admin-interface semantics, not editorial UI — an admin reviewing a queue needs unambiguous approve/reject affordance. Each callsite is annotated `// admin-only, not part of editorial system` in source. No migration planned.

**Font family conflict** — `web/src/index.css` `@layer base` sets `body: 'Space Grotesk'`, `h1–h6: 'Manrope'`. `tailwind.config.js` `fontFamily` (Inter) is dead code for bare element selectors — only applies via explicit `font-*` utility. No visual bug today, but a decision is owed:
- **Option A:** Adopt Space Grotesk + Manrope as the editorial type stack. Update `tailwind.config.js` to match. Editorial leans confirm this direction.
- **Option B:** Switch to Inter everywhere. Remove `@layer base` font rules.
- **Decision deferred to v1.1.** Default in cleanup: leave both untouched.

**14px body sub-size question** — currently no 14px token. WeeklyBriefSection's 14px → 15px in Task 2. If a 14px lookalike becomes visually necessary on Projects or Market, reopen the typography scale debate before adding `text-ed-body-sm`. Default: don't add.

**Spacing aliases — RESOLVED** — `ed-block`/`ed-item`/`ed-sub` removed in Task 4. `ed-section-xs` added in Task 5. Current spacing scale: `ed-section-xs/sm/md/lg` + `ed-hero` + `ed-section`.

---

## 10. Versioning

| Version | Date       | Change                                                |
|---------|------------|-------------------------------------------------------|
| 1.0     | 2026-05-27 | Initial document. Reconstructed after `web/docs/design-language.md` was found missing post-handoff. Based on `web/docs/design-system-audit.md`, `tailwind.config.js`, `web/src/index.css`, and prior session decisions (memory525, memory527). |
| 1.0.1   | 2026-05-27 | Cleanup pass 1 complete. §6 all tasks ✅. §9 v1.1 deferred items detailed: ed-accent visual delta, semantic colour islands (PolicyImpactCard / DataMilestoneCard / DisclaimerBanner), pending extractions (Chip, SectionHeader, SemanticBadge, source-tab). |
| 1.0.2   | 2026-05-30 | Add Stats Ribbon pattern (§3.6) as `<BigStat>` + `<BigStatRibbon>`. Migrate Projects, Assets, Licenses, Compliance. Anti-pattern updated: KPI tiles rule now targets boxed/shadowed/rounded variants; editorial big-number grid (bg-ed-surface-cool, hairline dividers) is canonical. Remove shared `Stat` inline component (superseded). |

**Change protocol:** Any new token, new component, or change to Anti-Patterns requires a version bump and a row in this table. Cleanup tasks §6 land under v1.0 — they're enforcement, not change.

---

*End of design language v1.0.*
