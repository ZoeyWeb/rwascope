# Design System Audit — RWAscope
> Scope: `tailwind.config.js` + `screens/Intelligence/index.tsx`
> Date: 2026-05-27 · Status: report only, no fixes applied

---

## 1. Color Tokens

All `ed-*` colour tokens are defined in `tailwind.config.js` lines 60–109.

### Active tokens

| Token | Hex | Intelligence usage | Section |
|---|---|---|---|
| `ed-ink` | `#1A1A2E` | Active filter pill bg, active bar fill, hover text, subscribe border, region labels active state | Filter pills, Region Activity, Hero link hover, Subscribe form |
| `ed-ink-hover` | `#2A2A42` | Hover state on card titles and nav links | ItemCard title hover, HeroSection link |
| `ed-text-primary` | `#1A1A2E` | Card titles, H2/H3 headings, input text | HeroSection H1, ItemCard title, EditorialGrid1 headings, NarrativeSection |
| `ed-text-secondary` | `#52525B` | Body copy, Forward View items, filter pill inactive | ItemCard summary, ForwardView list, SubscribeSection body |
| `ed-text-muted` | `#78716C` | Eyebrow labels, metadata rows, date/region chips, empty states | Every eyebrow, meta row in ItemCard, RegionActivity labels |
| `ed-text-faint` | `#A8A29E` | AI disclosure footnotes, "No spam" text, subscribe placeholder | WeeklyBrief AI note, SubscribeSection footer, ItemCard AI note |
| `ed-canvas` | `#FAFAF9` | Root page background | `bg-ed-canvas` on outer wrapper (line 1179) |
| `ed-surface` | `#FFFFFF` | Legacy block components (HighlightsBlock, NarrativesBlock, WeeklyBriefCard, EditorNoteBlock) | Legacy helper components (lines 841–1016) |
| `ed-surface-cool` | `#F4F5F7` | Full-bleed background for WeeklyBriefSection and EditorialGrid1 | WeeklyBriefSection (line 96), EditorialGrid1 (line 153) |
| `ed-surface-sunken` | `#F5F4F1` | Full-bleed background for NarrativeSection | NarrativeSection (line 729) |
| `ed-hairline` | `#E7E5E4` | Section dividers (1px), item list `divide-y`, filter bar borders, region bar track | SectionDivider, ItemCard border-t, TimelineSection filter bar |
| `ed-hairline-faint` | `#F0EFEC` | Inner item list `divide-y` (softer), Load more border | ItemCard list dividers in NewsSection and TimelineSection |
| `ed-incident` | `#B91C1C` | Significance badge ("Landmark"/"Major"), error text in SubscribeSection | ItemCard meta row (line 370), SubscribeSection error (line 822) |

### Deprecated tokens (kept to avoid build errors — do not use in new components)

These tokens are marked `// deprecated` in `tailwind.config.js` lines 85–109 but are **still actively referenced** in `PolicyImpactCard.tsx` and `AdminReview.tsx`:

| Token | Hex | Still used in | Notes |
|---|---|---|---|
| `ed-accent` | `#5E5C75` | Not found in Intelligence | Safe to remove from Intelligence |
| `ed-accent-hover` | `#4E4C65` | Not found in Intelligence | Safe to remove from Intelligence |
| `ed-surface-hover` | `#F5F5F4` | Not found in Intelligence | — |
| `ed-divider-faint` | `#F0EFEC` | — | Duplicate of `ed-hairline-faint` |
| `ed-divider` | `#E7E5E4` | `PolicyImpactCard.tsx` lines 29, 37, 52, 67 | Active use despite deprecated label |
| `ed-divider-strong` | `#D6D3D1` | Not found in Intelligence | — |
| `ed-type-policy` | `#B45309` | `PolicyImpactCard.tsx` line 18 | Active use despite deprecated label |
| `ed-type-institution` | `#6D28D9` | Not found in Intelligence | — |
| `ed-type-project` | `#047857` | Not found in Intelligence | — |
| `ed-type-research` | `#1D4ED8` | Not found in Intelligence | — |
| `ed-type-data` | `#475569` | Not found in Intelligence | — |
| `ed-type-incident` | `#B91C1C` | Not found in Intelligence (replaced by `ed-incident`) | Exact same hex as `ed-incident` |
| `ed-type-regulatory` | `#B45309` | Not found in Intelligence | Exact same hex as `ed-type-policy` |
| `ed-chip-bg` | `#F5F4F1` | Not found in Intelligence | — |
| `ed-chip-text` | `#44403C` | Not found in Intelligence | — |
| `ed-info-bg` | `#F0F4FF` | `PolicyImpactCard.tsx` line 67 | Active use despite deprecated label |
| `ed-info-text` | `#1E3A8A` | `PolicyImpactCard.tsx` lines 68, 69, 75 | Active use despite deprecated label |
| `ed-warn-bg` | `#FEFAEB` | `PolicyImpactCard.tsx` line 18 | Active use despite deprecated label |
| `ed-warn-text` | `#854D0E` | `PolicyImpactCard.tsx` lines 21, 22, 24, 30 | Active use despite deprecated label |
| `ed-success-bg` | `#F0FDF4` | `PolicyImpactCard.tsx` line 37 | Active use despite deprecated label |
| `ed-success-text` | `#166534` | `PolicyImpactCard.tsx` lines 38, 41 | Active use despite deprecated label |
| `ed-hk-bg` | `#EFF6FB` | `HKObservation.tsx` | Active HK-specific token |
| `ed-hk-border` | `#D6E4EE` | `HKObservation.tsx` | Active HK-specific token |
| `ed-hk-text` | `#0C447C` | `HKObservation.tsx` | Active HK-specific token |

> **Observation:** `PolicyImpactCard.tsx` uses 7 tokens that are marked deprecated in `tailwind.config.js`. The deprecated annotation is misleading — these tokens have active consumers.

---

## 2. Typography Tokens

All `text-ed-*` tokens are defined in `tailwind.config.js` lines 133–147.

### Token reference table

| Token | Size | Line-height | Letter-spacing | Weight | Level |
|---|---|---|---|---|---|
| `text-ed-page-h1` | 5rem (80px) | 1.05 | −0.025em | 600 | **H1** |
| `text-ed-hero-h1` | 4rem (64px) | 4.4rem | −0.03em | 600 | H1 (alt) |
| `text-ed-section-h2` | 2.625rem (42px) | 3rem | −0.025em | 600 | **H2** |
| `text-ed-section-h2-light` | 2.625rem (42px) | 3rem | −0.025em | 400 | H2 (light variant) |
| `text-ed-block-h3` | 1.5rem (24px) | 1.875rem | −0.015em | 600 | **H3** |
| `text-ed-item-h4` | 1.0625rem (17px) | 1.5rem | −0.005em | 500 | **H4** |
| `text-ed-body-lg` | 1.125rem (18px) | 1.875rem | — | 400 | **Body (large)** |
| `text-ed-body` | 0.9375rem (15px) | 1.625rem | — | 400 | **Body** |
| `text-ed-meta` | 0.8125rem (13px) | 1.125rem | — | 400 (tabular-nums) | **Meta / caption** |
| `text-ed-eyebrow` | 0.6875rem (11px) | 1rem | 0.18em | 500 | **Eyebrow** |
| `text-ed-lede` | 1.375rem (22px) | 2rem | −0.005em | 400 | **Lede / subhead** |

### Usage in Intelligence

| Level | Token(s) | Elements |
|---|---|---|
| **H1** | `text-ed-page-h1` | HeroSection `<h1>` "Intelligence" (line 67) |
| **H2** | `text-ed-section-h2` | NewsSection `<h2>` "Latest News" (line 501); WeeklyBriefCard `<h2>` (legacy, line 1006) |
| **H2 light** | `text-ed-section-h2-light` | NewsSection subhead "Recent regulatory…" (line 502); NarrativeSection description (line 736) |
| **H3** | `text-ed-block-h3` | EditorialGrid1 column headings (lines 158, 188); SubscribeSection `<h2>` (line 791); ItemCard title non-compact (line 379); EditorNoteBlock heading (legacy, line 987) |
| **H4** | `text-ed-item-h4` | ItemCard title compact (line 379); EditorialGrid2 narrative names (line 248); EditorialGrid1 highlight titles (line 176) |
| **Lede** | `text-ed-lede` | HeroSection paragraph (line 70) |
| **Body (large)** | `text-ed-body-lg` | EditorNoteSection blockquote (line 332) |
| **Body** | `text-ed-body` | ItemCard summary, Forward View items, SubscribeSection, RegionActivity empty state |
| **Eyebrow** | `text-ed-eyebrow` | All section labels ("Weekly Brief", "Active Narratives", "Narrative", "Latest News", "Key Changes", "Policy → Market", "Editor's Note") |
| **Meta** | `text-ed-meta` | Dates, region chips, event type labels, filter count, AI disclosure, Load more button, "Updated weekly" |

### Hardcoded sizes bypassing tokens

Two places in `WeeklyBriefSection` use raw Tailwind sizes instead of tokens:

```tsx
// line 104 — WeeklyBriefSection headline
<h2 className="text-[2rem] font-semibold leading-tight ...">

// line 118 — highlight region label
<p className="text-[11px] uppercase tracking-widest ...">

// line 121 — highlight body text
<p className="text-[14px] ...">
```

These bypass the editorial scale entirely. `text-[2rem]` sits between `text-ed-block-h3` (1.5rem) and `text-ed-section-h2` (2.625rem) with no matching token.

---

## 3. Spacing Tokens

All `ed-*` spacing tokens are in `tailwind.config.js` lines 117–127.

| Token | Value | Intended context |
|---|---|---|
| `ed-hero` | 6rem (96px) | Hero section `pt`/`pb`; SubscribeSection `py` |
| `ed-section` | 8rem (128px) | `my` on `SectionDivider`; `mt` on footer disclaimer (line 1230) |
| `ed-section-lg` | 4rem (64px) | `py` on NarrativeSection full-bleed (line 729) |
| `ed-section-md` | 2.5rem (40px) | `py` on EditorialGrid1 (line 153), NewsSection (line 496) |
| `ed-section-sm` | 1.5rem (24px) | `py` on EditorNoteSection (line 327); footer disclaimer (line 1230) |
| `ed-block` | 2.5rem (40px) | Alias of `ed-section-md`; used as `p-ed-block` in legacy EditorNoteBlock (line 983) and WeeklyBriefCard (line 996) |
| `ed-item` | 1.5rem (24px) | Alias of `ed-section-sm`; not found in Intelligence index |
| `ed-sub` *(deprecated)* | 1.5rem (24px) | Alias of `ed-item`; not found anywhere |

### Observations

- `ed-block` and `ed-section-md` are identical (both 2.5rem / 40px) — two names for the same value.
- `ed-item` and `ed-section-sm` are identical (both 1.5rem / 24px) — two names for the same value.
- `ed-sub` is a third alias for the same 1.5rem value, marked deprecated but still present.
- Most inter-item spacing in lists (`mb-2`, `mb-3`, `mb-4`, `mb-6`, `mb-8`, `mb-10`, `mb-12`) uses raw Tailwind multiples rather than ed-* tokens.

---

## 4. Layout Patterns

Patterns appearing ≥ 2 times across `Intelligence/index.tsx`.

### 4a. Hero section

Used once at page top. Template:

```tsx
<section className="pt-ed-hero pb-ed-hero">
  <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-8">
    {/* Category / breadcrumb label */}
  </div>
  <h1 className="text-ed-page-h1 text-ed-text-primary mb-10">
    {/* Page title */}
  </h1>
  <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mb-12">
    {/* One-sentence description */}
  </p>
  <div className="flex items-center gap-6 text-ed-meta text-ed-text-muted flex-wrap">
    {/* Meta row: last updated · optional admin link */}
  </div>
</section>
```

### 4b. Eyebrow + content block (appears in EditorialGrid2, EditorNoteSection, NewsSection, NarrativeSection)

```tsx
<section>
  <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-{n}">
    {/* Section label */}
  </div>
  {/* Content — no H2 between eyebrow and content */}
</section>
```

Note: `mb` value after eyebrow is inconsistent — `mb-4`, `mb-8`, `mb-10` all appear.

### 4c. Full-bleed colour section (appears 3 times)

```tsx
<section className="py-{spacing} relative w-screen left-1/2 -translate-x-1/2 bg-{surface}">
  <div className="max-w-[1200px] mx-auto px-8">
    {/* Content */}
  </div>
</section>
```

Instances:
- WeeklyBriefSection: `py-4 bg-ed-surface-cool` (line 96) — uses raw `py-4` not a token
- EditorialGrid1: `py-ed-section-md bg-ed-surface-cool` (line 153)
- NarrativeSection: `py-ed-section-lg bg-ed-surface-sunken` (line 729)

### 4d. Two-column editorial grid with divider (appears in EditorialGrid1 and EditorialGrid2)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-ed-hairline">
  <div className="md:pr-16">
    {/* Left column */}
  </div>
  <div className="md:pl-16 mt-16 md:mt-0">
    {/* Right column */}
  </div>
</div>
```

The `mt-16` on the right column (mobile stacking offset) is a raw Tailwind value, not an ed-* spacing token.

### 4e. Paginated list with Load more (appears in NewsSection and TimelineSection)

```tsx
// State
const PAGE_SIZE = 20; // defined independently in both components
const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

// List
<ul className="divide-y divide-ed-hairline-faint">
  {items.slice(0, visibleCount).map(item => (
    <li className="py-{n} first:pt-0">
      <ItemCard ... />
    </li>
  ))}
</ul>

// Load more
{items.length > visibleCount && (
  <div className="flex justify-center pt-{n} mt-{n} border-t border-ed-hairline-faint">
    <button
      onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
      className="text-ed-meta uppercase tracking-wider text-ed-text-secondary hover:text-ed-ink transition-colors"
    >
      Load more →
    </button>
  </div>
)}
```

`PAGE_SIZE = 20` is duplicated at line 483 (NewsSection) and line 561 (TimelineSection).

### 4f. Section divider

```tsx
function SectionDivider() {
  return (
    <div className="my-ed-section">
      <div className="h-px bg-ed-hairline" />
    </div>
  );
}
```

---

## 5. Component Inventory

### Extracted to `web/src/components/` (reusable)

| Component | File | Props interface | Notes |
|---|---|---|---|
| `PolicyImpactCard` | `components/PolicyImpactCard.tsx` | `{ eventTitle: string; impact: PolicyImpact }` | Used in Intelligence context; references 7 deprecated tokens |
| `DisclaimerBanner` | `components/DisclaimerBanner.tsx` | (unknown — not read for this audit) | Required on scoring pages |
| `DataMilestoneCard` | `components/DataMilestoneCard.tsx` | (unknown) | Not used in Intelligence index |
| `NarrativeSubscribeButton` | `components/NarrativeSubscribeButton.tsx` | (unknown) | Not used in Intelligence index |
| `Layout` | `components/Layout.tsx` | (unknown) | Page shell |
| `PageLayout` | `components/PageLayout.tsx` | (unknown) | Page structure |
| `TopNav` | `components/TopNav.tsx` | (unknown) | Global nav |

### Inline in `Intelligence/index.tsx` (not reusable yet)

| Component | Lines | Props | Notes |
|---|---|---|---|
| `SectionDivider` | 51–57 | none | Stateless, 4 lines — trivial to extract |
| `HeroSection` | 61–90 | `{ isAdmin: boolean }` | Page-specific |
| `WeeklyBriefSection` | 94–135 | `{ brief: IntelligenceWeeklyBrief }` | Full-bleed section; contains hardcoded font sizes |
| `EditorialGrid1` | 139–208 | `{ highlights, forwardItems, onScrollToItem }` | Two-col highlights/forward view |
| `EditorialGrid2` | 212–321 | `{ narratives, activity, activeNarrative, activeRegion, onSelectNarrative, onSelectRegion }` | Two-col narratives/region |
| `EditorNoteSection` | 325–341 | `{ note: EditorNote }` | Blockquote layout |
| `ItemCard` | 345–478 | `{ item, isExpanded, onToggle, compact? }` | Core card with expand animation — most reusable |
| `NewsSection` | 482–536 | `{ items: IntelligenceItem[] }` | Paginated list (own expandedIds state) |
| `TimelineSection` | 540–649 | 8 props | Filter + paginated list; owns `visibleCount` |
| `RegionActivityStrip` | 653–701 | `{ activity, activeRegion, onSelectRegion }` | Horizontal bar chart |
| `NarrativeSection` | 705–763 | 8 props (wraps RegionActivityStrip + TimelineSection) | Full-bleed wrapper |
| `SubscribeSection` | 767–829 | none | Newsletter form with own state |

### Legacy helper components (preserved, not used in main render)

These 6 components at lines 831–1017 are **dead code** in the current layout — they appear to be the v1 block-based layout that was replaced by the current editorial grid design:

| Component | Lines |
|---|---|
| `HighlightsBlock` | 833–870 |
| `ForwardViewBlock` | 872–893 |
| `NarrativesBlock` | 895–936 |
| `RegionActivityBlock` | 938–978 |
| `EditorNoteBlock` | 980–992 |
| `WeeklyBriefCard` | 994–1017 |

---

## 6. Interaction Patterns

### 6a. Item card expand/collapse

**Implementation:** `expandedIds: Set<string>` in parent state. Toggled by `toggleExpanded(id)`. Card reads `isExpanded` prop.

**Expand animation:** CSS grid rows trick — no JS height measurement:
```tsx
// ItemCard lines 394–399
<div style={{
  display: 'grid',
  gridTemplateRows: isExpanded ? '1fr' : '0fr',
  transition: 'grid-template-rows 0.3s ease',
}}>
  <div className="overflow-hidden">...</div>
</div>
```

**State ownership:**
- `NewsSection` owns its own `expandedIds` (line 485) — isolated
- `TimelineSection` receives `expandedIds` + `onToggleExpanded` from parent `IntelligenceHome` (line 1038) — shared across highlights cross-scroll
- **Issue:** Two separate expand state systems for two lists on the same page

**Reusability:** `ItemCard` itself is reusable. The state management pattern is not shared — duplicated in NewsSection and lifted in main.

### 6b. Filter pill toggle (Type + Region)

**Implementation:** `activeEventType` and `activeRegion` in `IntelligenceHome` state (lines 1036–1037). Passed down to `TimelineSection` and `EditorialGrid2`.

**Active style:**
```tsx
className={`px-3 py-1 text-ed-meta uppercase tracking-wider transition-colors ${
  active ? 'bg-ed-ink text-white' : 'text-ed-text-secondary hover:text-ed-ink'
}`}
```

**Region filter appears in 3 places with slightly different rendering:**
- `TimelineSection` filter row (lines 591–611) — text pill buttons
- `EditorialGrid2` region activity bar chart (lines 283–315) — bar + count layout
- `RegionActivityStrip` (lines 666–698) — vertical column bar layout

All three call `onSelectRegion` but render the active state differently. The horizontal bar in `EditorialGrid2` and the vertical column bar in `RegionActivityStrip` are functionally the same widget with different visual encodings — no shared component.

**Reusability:** The pill button pattern (`px-3 py-1 text-ed-meta uppercase`) could be a shared `FilterPill` component. Not currently extracted.

### 6c. Load more (pagination)

**Implementation:** `visibleCount` state, incremented by `PAGE_SIZE` on click.

```tsx
<button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
  Load more →
</button>
```

Appears in:
- `NewsSection` line 524
- `TimelineSection` line 637

`PAGE_SIZE = 20` is hardcoded in both (lines 483, 561). Load more resets when filter changes via `useEffect(() => { setVisibleCount(PAGE_SIZE); }, [items])` in `TimelineSection` only (line 563) — `NewsSection` does not reset on re-render.

**Reusability:** Not extracted.

### 6d. Cross-scroll to highlighted item

**Implementation:** `scrollToItem(id)` in `IntelligenceHome` (lines 1138–1146). Adds item to `expandedIds` then calls `scrollIntoView` after 50ms timeout.

```tsx
function scrollToItem(id: string) {
  setExpandedIds(prev => new Set([...prev, id]));
  const el = itemRefs.current[id];
  if (el) {
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  } else if (timelineRef.current) {
    timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

Called from `EditorialGrid1` highlight clicks (line 168). The 50ms `setTimeout` is a workaround for the expand animation needing a frame to render before the element has height.

**Reusability:** Tightly coupled to `itemRefs` ref map structure — not extracted.

### 6e. External source links

**Pattern:**
```tsx
<a
  href={item.source_url}
  target="_blank"
  rel="noopener noreferrer"
  className="text-ed-meta text-ed-text-secondary hover:text-ed-ink transition-colors"
  onClick={e => e.stopPropagation()}
>
  Source →
</a>
```

`e.stopPropagation()` prevents the parent `<article onClick={onToggle}>` from firing. Appears in `ItemCard` line 461–470. The `rel="noopener noreferrer"` is correctly set.

---

## 7. Current Issues

Issues identified in the Intelligence design — up to 8, ordered by impact.

### Issue 1 — Dead legacy components inflate the file by ~180 lines

`HighlightsBlock`, `ForwardViewBlock`, `NarrativesBlock`, `RegionActivityBlock`, `EditorNoteBlock`, `WeeklyBriefCard` (lines 831–1017) are defined but never called in the current render tree. They represent the previous v1 card layout. The file is 1242 lines; removing dead code would reduce it by ~15%.

### Issue 2 — Deprecated token annotation is misleading

`tailwind.config.js` marks 20 tokens as `// deprecated` but `PolicyImpactCard.tsx` actively uses 7 of them (`ed-divider`, `ed-type-policy`, `ed-warn-bg`, `ed-warn-text`, `ed-success-bg`, `ed-success-text`, `ed-info-bg`, `ed-info-text`). The `ed-hk-*` family is also flagged deprecated but used throughout `HKObservation.tsx`. The deprecated comment creates confusion about which tokens are safe to remove.

### Issue 3 — `AdminReview.tsx` uses hardcoded hex values instead of tokens

`EditForm` in `AdminReview.tsx` (lines 57, 64, 67, 70) uses raw hex strings:
```tsx
className="... text-[#737C7F] ..."         // should be text-ed-text-muted
className="bg-[#F1F4F6] border-[#DBE4E7]"  // should be bg-ed-surface-cool border-ed-hairline
className="text-[#2B3437]"                 // should be text-ed-text-primary
className="focus:border-[#5E5C75]"         // should be focus:border-ed-accent (deprecated) or ed-ink
```
These bypass the token system entirely. If a token value changes, the admin UI will diverge visually.

### Issue 4 — Two region activity widgets with no shared component

`EditorialGrid2` (lines 283–315) and `RegionActivityStrip` (lines 666–698) both render region → bar → count charts with the same data and the same `onSelectRegion` callback. They have different visual orientations (horizontal grid vs vertical column) but are otherwise the same interaction. Neither is extracted into a shared component, so styling changes require updating two places.

### Issue 5 — `PAGE_SIZE` duplicated and `visibleCount` not reset in NewsSection

`PAGE_SIZE = 20` is declared independently at line 483 and line 561. More critically, `NewsSection` does not reset `visibleCount` when the underlying `items` prop changes — unlike `TimelineSection` which has `useEffect(() => setVisibleCount(PAGE_SIZE), [items])`. If `NewsSection`'s data is filtered upstream, the user can see a stale "Load more" count.

### Issue 6 — WeeklyBriefSection uses hardcoded font sizes

The weekly brief headline and highlight text use `text-[2rem]`, `text-[11px]`, and `text-[14px]` (lines 104, 118, 121) instead of editorial scale tokens. `text-[2rem]` has no corresponding token — it falls between `text-ed-block-h3` (1.5rem) and `text-ed-section-h2` (2.625rem). The `text-[11px]` and `text-[14px]` sizes duplicate `text-ed-eyebrow` (11px) and `text-ed-body` (15px) approximately but not exactly.

### Issue 7 — Eyebrow spacing below labels is inconsistent

The gap between eyebrow label and the next element varies with no apparent rule:
- `mb-4` — NarrativeSection (line 733)
- `mb-5` — Legacy blocks (lines 842, 906, 950)
- `mb-8` — HeroSection (line 64), EditorNoteSection (line 328)
- `mb-10` — EditorialGrid2 left and right columns (lines 234, 276)

No token governs "distance from eyebrow to following heading/content". This produces slightly different visual rhythms across sections.

### Issue 8 — `ed-block` and `ed-section-md` are identical; `ed-item` and `ed-section-sm` are identical

The spacing token table has two naming systems that collide:

| Token A | Token B | Shared value |
|---|---|---|
| `ed-section-md` | `ed-block` | 2.5rem (40px) |
| `ed-section-sm` | `ed-item` | 1.5rem (24px) |
| `ed-item` | `ed-sub` *(deprecated)* | 1.5rem (24px) |

Three tokens at the same value create ambiguity about which to use. `ed-section-md` and `ed-block` appear in the same file on different sections with no distinction in semantics.
