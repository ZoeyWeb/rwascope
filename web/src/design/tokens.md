# Editorial Layer — Design Token Guide

Prefix: `ed-`. All tokens live in `tailwind.config.js → theme.extend`.  
The existing M3 tokens (`primary`, `on-surface`, `outline`, etc.) are untouched; this layer sits on top.

---

## Primary & Accent

| Token | HEX | Use |
|---|---|---|
| `ed-ink` | `#1A1A2E` | Main CTA buttons, active nav state, strong emphasis. Same as TopNav background. |
| `ed-ink-hover` | `#2A2A42` | Hover state for `ed-ink` buttons. |
| `ed-accent` | `#5E5C75` | Secondary accent: icon colour, link colour, pill-button active state. |
| `ed-accent-hover` | `#4E4C65` | Hover for `ed-accent` interactive elements. |

**Pairing rule:** Use `ed-ink` for the one primary action per screen (e.g. Subscribe). Use `ed-accent` for all supporting interactive elements (links, icon buttons, filter chips active).

---

## Text Hierarchy

| Token | HEX | Use |
|---|---|---|
| `ed-text-primary` | `#1F2937` | Page H1, card titles, body copy main text. |
| `ed-text-secondary` | `#52525B` | Supporting copy, card subtitles, form labels. |
| `ed-text-muted` | `#78716C` | Timestamps, meta lines, section eyebrow labels. |
| `ed-text-faint` | `#A8A29E` | Placeholder text, disabled state, decorative dots. |

**Pairing rule:** Step through the hierarchy — never jump from `ed-text-primary` directly to `ed-text-faint` in adjacent elements. Always one step at a time.

---

## Surface Hierarchy

| Token | HEX | Use |
|---|---|---|
| `ed-canvas` | `#FAFAF9` | Outer page background (`<body>` / outermost wrapper). Warm off-white. |
| `ed-surface` | `#FFFFFF` | Card backgrounds, modals, dropdowns. Pure white sits above the canvas. |
| `ed-surface-hover` | `#F5F5F4` | Hover state for list rows, sidebar items. |
| `ed-surface-sunken` | `#F5F4F1` | Recessed surfaces: filter chip container, code blocks, read-only inputs. |

**Pairing rule:** `ed-canvas` + `ed-surface`. The shadow `shadow-ed-card` defines the card boundary — do not add a `1px solid` border on top of a shadow card. Pick one: shadow OR border, never both.

---

## Dividers (three tiers)

| Token | HEX | Use |
|---|---|---|
| `ed-divider-faint` | `#F0EFEC` | Between list items within a block. Barely visible. |
| `ed-divider` | `#E7E5E4` | Between sub-sections within a card, or between card rows. Standard. |
| `ed-divider-strong` | `#D6D3D1` | Table header bottom line, tab underline, major section break. |

**Rule:** If in doubt, use `ed-divider`. Step up to `ed-divider-strong` only at structural boundaries (tabs, table heads). Step down to `ed-divider-faint` only inside a dense list.

---

## Event-Type Colours (`ed-type-*`)

**Only for indicator dots (8–10px) and 11–12px inline tags. Never as block backgrounds.**

| Token | HEX | Tailwind equiv | Event type |
|---|---|---|---|
| `ed-type-policy` | `#B45309` | amber-700 | regulation, policy |
| `ed-type-institution` | `#6D28D9` | violet-700 | institutional |
| `ed-type-project` | `#047857` | emerald-700 | project |
| `ed-type-research` | `#1D4ED8` | blue-700 | research |
| `ed-type-data` | `#475569` | slate-600 | data_milestone |
| `ed-type-incident` | `#B91C1C` | red-700 | incident |
| `ed-type-regulatory` | `#B45309` | (same as policy) | regulatory action |

Tag pattern: `bg-ed-surface-sunken text-ed-type-{x} text-ed-eyebrow px-2 py-0.5`

---

## Region Chips (`ed-chip-*`)

**All regions use the same neutral chip. No per-region colour.**

```
bg-ed-chip-bg text-ed-chip-text   →  ed-chip-bg #F5F4F1 / ed-chip-text #44403C
```

Active/selected region chip: `bg-ed-ink text-white`. This removes the rainbow-region pattern and keeps the timeline scannable.

---

## Status Surfaces

For contextual callout blocks (Forward View, HK Observation, warning banners).

| Token pair | Use |
|---|---|
| `ed-info-bg` / `ed-info-text` | Informational note (neutral blue tint). |
| `ed-warn-bg` / `ed-warn-text` | Warning, AI-generated label, landmark badge. |
| `ed-success-bg` / `ed-success-text` | Success state (e.g. email subscribed). |
| `ed-hk-bg` / `ed-hk-border` / `ed-hk-text` | HK Observation CTA and Forward View block. Replaces all `#0C447C` / `#E6F1FB` inline styles. |

---

## Spacing Rhythm

| Token | Value | Use |
|---|---|---|
| `ed-section` | 48px | Gap between major page sections. |
| `ed-block` | 32px | Padding inside a card/block. |
| `ed-sub` | 24px | Gap between sub-sections within a card. |
| `ed-item` | 20px | Gap between list items. |

Usage: `mt-ed-section`, `p-ed-block`, `gap-ed-sub`, `space-y-ed-item`.

---

## Shadows

| Token | Use |
|---|---|
| `shadow-ed-card` | Default card: replaces `border border-[#DBE4E7]` on white-background cards. |
| `shadow-ed-card-hover` | Elevated state on hover/expanded. |
| `shadow-ed-inset` | Subtle top-edge inset for sunken surfaces. |

**Anti-pattern:** Do not combine `shadow-ed-card` with `border`. The shadow ring (`0 0 0 1px`) already provides the edge definition.

---

## Typography Scale

| Token | Size / Leading | Use |
|---|---|---|
| `text-ed-page-h1` | 32px / 2.4rem, -0.02em, 700 | Page-level H1 (`Global RWA Intelligence`). |
| `text-ed-section-h2` | 22px / 1.75rem, -0.015em, 600 | Section headings (`Full Timeline`). |
| `text-ed-block-h3` | 16px / 1.5rem, -0.01em, 600 | Card / item title. |
| `text-ed-eyebrow` | 11px / 1rem, +0.12em, 600 | ALL CAPS section eyebrow labels (`THIS WEEK'S HIGHLIGHTS`). |
| `text-ed-body` | 14px / 1.5rem, 400 | Body copy, list items, descriptions. |
| `text-ed-meta` | 12px / 1rem, 500 | Dates, source names, counts, tag labels. |

---

## Anti-Patterns

```
✗  Region tags with per-region colour  →  use ed-chip-* for all regions
✗  1px solid border on shadow cards   →  shadow-ed-card includes its own ring
✗  Card nested inside card (card-in-card depth > 1)
✗  Saturated amber-100 / blue-100 status colours  →  use ed-warn-bg / ed-info-bg
✗  Hard-coded hex literals in .tsx files  →  always map to an ed-* token
✗  ed-type-* as a block background  →  only dots and inline tags
```

---

## Inline Style Migrations (Step 3 TODO)

Locations confirmed by grep. Do not touch these until Step 3 is approved.

### `Intelligence/index.tsx`

| Current inline style | Target token(s) |
|---|---|
| `style={{ borderLeft: '4px solid #e09d2b' }}` (Editor's Note) | `border-l-2 border-ed-type-policy` |
| `SIG_COLORS.landmark: { bg: '#FAEEDA', color: '#854F0B' }` | `bg-ed-warn-bg text-ed-warn-text` |
| `style={{ borderColor: '#D0E4F4', background: '#E6F1FB' }}` (Forward View) | `bg-ed-hk-bg border-ed-hk-border` |
| `style={{ color: '#0C447C' }}` (Forward View text, HK CTA) | `text-ed-hk-text` |
| `style={{ background: '#E6F1FB', borderColor: '#D0E4F4', color: '#0C447C' }}` (HK CTA link chip) | `bg-ed-hk-bg border-ed-hk-border text-ed-hk-text` |
| `REGION_META` dynamic `bg` / `color` per-region colours | Remove per-region colour; all chips → `bg-ed-chip-bg text-ed-chip-text`; active → `bg-ed-ink text-white` |
| `EVENT_TYPE_META` dynamic `bg` / `color` per-type colours | Map `color` → `ed-type-{type}`; `bg` → `ed-surface-sunken` |

### `components/PolicyImpactCard` / `components/DataMilestoneCard`

Audit these files in Step 3 — likely contain matching amber/green inline styles.

### `components/DisclaimerBanner`

Audit for amber colour usage; migrate to `ed-warn-bg / ed-warn-text` if found.
