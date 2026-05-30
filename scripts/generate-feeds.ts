/**
 * generate-feeds.ts — Atom 1.0 feed generator for RWAscope
 *
 * Usage (from web/):
 *   pnpm feeds:incidents   → web/public/feeds/incidents.xml
 *   pnpm feeds:weekly      → web/public/feeds/weekly-brief.xml
 *   pnpm feeds:all         → both
 *
 * Data sources:
 *   incidents  → web/public/data/projects/projects.json (entries with incident_id)
 *   weekly     → web/public/data/intelligence/intelligence.json (weekly_brief key)
 *
 * NOTE: weekly brief history — intelligence.json only stores the latest brief.
 * TODO: append briefs to a briefs-archive.json on each weekly generation so
 *       this feed can grow to 20 entries. Until then, only 1 entry is emitted.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WEB_DIR = resolve(__dirname, '../web');
const PUBLIC_DIR = join(WEB_DIR, 'public');
const FEEDS_DIR = join(PUBLIC_DIR, 'feeds');
const BASE_URL = 'https://rwa-index.com';

mkdirSync(FEEDS_DIR, { recursive: true });

// ── helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIso(dateStr: string): string {
  return `${dateStr}T00:00:00Z`;
}

function trunc(s: string, max = 280): string {
  if (!s) return '';
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

// ── Incident Registry feed ────────────────────────────────────────────────────

interface PostmortemField {
  root_cause?: string;
  what_failed?: unknown[];
  outcome?: string;
  rarm_lesson?: string;
}

interface CitationMeta {
  short_title: string;
  publisher?: string;
  first_published_year?: number;
}

interface IncidentProject {
  incident_id: string;
  incident_date: string;
  severity: string;
  primary_asset_class: string;
  affected_rarm_layers: string[];
  permalink: string;
  citation_meta: CitationMeta;
  postmortem: PostmortemField;
  summary?: string;
  name?: string;
}

function generateIncidentsFeed(): void {
  const raw = JSON.parse(
    readFileSync(join(PUBLIC_DIR, 'data/projects/projects.json'), 'utf-8')
  ) as IncidentProject[];

  const incidents = raw
    .filter(p => p.incident_id && p.postmortem)
    .sort((a, b) => b.incident_date.localeCompare(a.incident_date));

  const latestUpdated = incidents.length ? toIso(incidents[0].incident_date) : new Date().toISOString();

  const entries = incidents.map(inc => {
    const summaryText = trunc(
      inc.postmortem?.root_cause ||
      inc.summary ||
      ''
    );

    const layerList = (inc.affected_rarm_layers || []).join(' · ');
    const layerCats = (inc.affected_rarm_layers || [])
      .map(l => `    <category term="rarm:${esc(l)}"/>`)
      .join('\n');

    const contentLines = [
      `<p><strong>Incident ID:</strong> ${esc(inc.incident_id)}</p>`,
      `<p><strong>Date:</strong> ${esc(inc.incident_date)}</p>`,
      `<p><strong>Severity:</strong> ${esc(inc.severity)}</p>`,
      `<p><strong>Asset class:</strong> ${esc(inc.primary_asset_class)}</p>`,
      layerList ? `<p><strong>Affected RARM layers:</strong> ${esc(layerList)}</p>` : '',
      summaryText ? `<p>${esc(summaryText)}</p>` : '',
      `<p><a href="${BASE_URL}${inc.permalink}">Read full postmortem →</a></p>`,
    ].filter(Boolean).join('\n        ');

    return `  <entry>
    <title>${esc(`${inc.incident_id} · ${inc.citation_meta.short_title}`)}</title>
    <link href="${BASE_URL}${inc.permalink}" rel="alternate" type="text/html"/>
    <id>${BASE_URL}${inc.permalink}</id>
    <published>${toIso(inc.incident_date)}</published>
    <updated>${toIso(inc.incident_date)}</updated>
    <category term="${esc(inc.primary_asset_class)}"/>
    <category term="severity:${esc(inc.severity)}"/>
${layerCats}
    <summary type="text">${esc(summaryText)}</summary>
    <content type="html"><![CDATA[
        ${contentLines}
      ]]></content>
  </entry>`;
  });

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>RWAscope Incident Registry</title>
  <subtitle>Structured postmortems of tokenized real-world asset failures. Built at HKUST Crypto-Fintech Lab.</subtitle>
  <link href="${BASE_URL}/feeds/incidents.xml" rel="self" type="application/atom+xml"/>
  <link href="${BASE_URL}/incidents" rel="alternate" type="text/html"/>
  <id>${BASE_URL}/feeds/incidents.xml</id>
  <updated>${latestUpdated}</updated>
  <author>
    <name>RWAscope Research</name>
    <uri>${BASE_URL}</uri>
  </author>
  <icon>${BASE_URL}/favicon.ico</icon>
  <logo>${BASE_URL}/press/logo-mark.svg</logo>
  <rights>© 2026 RWAscope · HKUST Crypto-Fintech Lab</rights>

${entries.join('\n\n')}
</feed>
`;

  writeFileSync(join(FEEDS_DIR, 'incidents.xml'), xml, 'utf-8');
  console.log(`✓ incidents.xml — ${incidents.length} entries`);
}

// ── Weekly Brief feed ─────────────────────────────────────────────────────────

interface WeeklyBrief {
  generated_at?: string;
  period_start?: string;
  period_end?: string;
  headline?: string;
  highlights?: string[];
}

interface IntelligenceJson {
  weekly_brief?: WeeklyBrief;
}

function generateWeeklyBriefFeed(): void {
  const raw = JSON.parse(
    readFileSync(join(PUBLIC_DIR, 'data/intelligence/intelligence.json'), 'utf-8')
  ) as IntelligenceJson;

  const brief = raw.weekly_brief;
  if (!brief) {
    console.warn('! weekly-brief.xml — no weekly_brief in intelligence.json, skipping');
    return;
  }

  const weekLabel = brief.period_start || brief.generated_at || 'unknown';
  const publishedDate = brief.generated_at ? toIso(brief.generated_at) : new Date().toISOString();
  const entryId = `${BASE_URL}/intelligence?brief=${weekLabel}`;

  const highlightItems = (brief.highlights || [])
    .map(h => `            <li>${esc(h)}</li>`)
    .join('\n');

  const contentHtml = `<h2>${esc(brief.headline || '')}</h2>
          <ul>
${highlightItems}
          </ul>
          <p><em>AI-generated summary — verify against source.</em></p>
          <p><a href="${BASE_URL}/intelligence">View on RWAscope →</a></p>`;

  const summaryText = trunc(brief.headline || `RWA Weekly Brief — Week of ${weekLabel}`);

  const entry = `  <entry>
    <title>${esc(`Weekly Brief · Week of ${weekLabel}`)}</title>
    <link href="${entryId}" rel="alternate" type="text/html"/>
    <id>${entryId}</id>
    <published>${publishedDate}</published>
    <updated>${publishedDate}</updated>
    <summary type="text">${esc(summaryText)}</summary>
    <content type="html"><![CDATA[
          ${contentHtml}
        ]]></content>
  </entry>`;

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>RWAscope Weekly Brief</title>
  <subtitle>Weekly policy-to-market intelligence on tokenized real-world assets. HKUST Crypto-Fintech Lab.</subtitle>
  <link href="${BASE_URL}/feeds/weekly-brief.xml" rel="self" type="application/atom+xml"/>
  <link href="${BASE_URL}/intelligence" rel="alternate" type="text/html"/>
  <id>${BASE_URL}/feeds/weekly-brief.xml</id>
  <updated>${publishedDate}</updated>
  <author>
    <name>RWAscope Research</name>
    <uri>${BASE_URL}</uri>
  </author>
  <icon>${BASE_URL}/favicon.ico</icon>
  <logo>${BASE_URL}/press/logo-mark.svg</logo>
  <rights>© 2026 RWAscope · HKUST Crypto-Fintech Lab</rights>
  <!-- TODO: weekly brief archive — intelligence.json only stores the latest brief.
       Implement briefs-archive.json append on generation to grow this feed. -->

${entry}
</feed>
`;

  writeFileSync(join(FEEDS_DIR, 'weekly-brief.xml'), xml, 'utf-8');
  console.log(`✓ weekly-brief.xml — 1 entry (archive TODO: see script header)`);
}

// ── entry ─────────────────────────────────────────────────────────────────────

const mode = process.argv[2] || 'all';
if (mode === 'incidents' || mode === 'all') generateIncidentsFeed();
if (mode === 'weekly' || mode === 'all') generateWeeklyBriefFeed();
