// ── Module 7: Quarterly Reports — Types ──────────────────────────────────────

export type ReportStatus = 'preview' | 'published' | 'revised';

export type SectionType =
  | 'manual'
  | 'auto-licenses'
  | 'auto-incidents'
  | 'auto-assets'
  | 'auto-market'
  | 'mixed';

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  /** Narrative text for manual/mixed sections. Paragraphs separated by \n\n.
   *  Standalone **bold** lines become headings. Lines starting with [PREVIEW render italic. */
  narrative?: string;
  /** Human-written commentary appended below auto-aggregated content */
  manualCommentary?: string;
}

export interface ReportCitation {
  id: string;
  text: string;
  url?: string;
}

export interface ChangelogEntry {
  date: string;
  note: string;
}

export interface Report {
  slug: string;
  quarter: string;           // e.g. "Q1 2026"
  title: string;
  status: ReportStatus;
  publishedAt: string;       // ISO date
  lastUpdatedAt: string;
  pageCount?: number;
  abstract: string;          // 1-2 sentences shown on library card
  periodStart: string;       // ISO date — start of reporting period
  periodEnd: string;         // ISO date — end of reporting period
  isPreview: boolean;
  sections: ReportSection[];
  authors: string[];
  citations: ReportCitation[];
  changelog: ChangelogEntry[];
}
