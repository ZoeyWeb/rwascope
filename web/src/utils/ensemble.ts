import type {
  EnsembleData,
  EnsembleMilestone,
  EnsembleUseCase,
  EnsembleInstitution,
  EnsemblePhase,
  InstitutionType,
} from '../types/ensemble';

/** Project Ensemble public launch date — used for "days since launch" stat. */
const LAUNCH_DATE = '2024-03-07';

// ── Phase / status visual metadata ───────────────────────────────────────────

export const PHASE_META: Record<
  EnsemblePhase,
  { label: string; color: string; bg: string; border: string }
> = {
  'pre-launch': {
    label: 'Pre-Launch',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#d1d5db',
  },
  sandbox: {
    label: 'Sandbox',
    color: '#92400e',
    bg: '#fef3c7',
    border: '#fcd34d',
  },
  pilot: {
    label: 'Pilot',
    color: '#065f46',
    bg: '#d1fae5',
    border: '#6ee7b7',
  },
};

export const PHASE_DOT: Record<EnsemblePhase, string> = {
  'pre-launch': '#9ca3af',
  sandbox: '#f59e0b',
  pilot: '#10b981',
};

export const USE_CASE_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  announced:            { label: 'Announced',           color: '#6b7280', bg: '#f3f4f6' },
  'in-progress':        { label: 'In Progress',         color: '#065f46', bg: '#d1fae5' },
  completed:            { label: 'Completed',           color: '#1e40af', bg: '#dbeafe' },
  'not-publicly-detailed': { label: 'Not Publicly Detailed', color: '#6b7280', bg: '#f3f4f6' },
};

export const INSTITUTION_TYPE_META: Record<
  InstitutionType,
  { label: string; color: string; bg: string }
> = {
  regulator:      { label: 'Regulator',       color: '#1e40af', bg: '#dbeafe' },
  bank:           { label: 'Bank',            color: '#065f46', bg: '#d1fae5' },
  'asset-manager':{ label: 'Asset Manager',   color: '#92400e', bg: '#fef3c7' },
  technology:     { label: 'Technology',      color: '#5b21b6', bg: '#ede9fe' },
  custodian:      { label: 'Custodian',       color: '#6b7280', bg: '#f3f4f6' },
  academia:       { label: 'Academia',        color: '#6b7280', bg: '#f3f4f6' },
};

export const MILESTONE_TYPE_LABELS: Record<string, string> = {
  announcement:       'Announcement',
  'use-case':         'Use Case',
  'institution-joined':'Institution Joined',
  'cross-border':     'Cross-Border',
  'sfc-coordination': 'SFC Coordination',
};

export const THEME_ACCENT: Record<string, string> = {
  fixed_income:       '#5E5C75',
  liquidity_management: '#0369a1',
  green_finance:      '#15803d',
  trade_finance:      '#b45309',
};

// ── Filter helpers ────────────────────────────────────────────────────────────

export function getMilestonesByPhase(
  data: EnsembleData,
  phase: EnsemblePhase
): EnsembleMilestone[] {
  return data.milestones.filter((m) => m.phase === phase);
}

export function getMilestonesByYear(
  data: EnsembleData,
  year: number
): EnsembleMilestone[] {
  return data.milestones.filter((m) => m.date.startsWith(String(year)));
}

export function getUseCasesByTheme(
  data: EnsembleData,
  theme: string
): EnsembleUseCase[] {
  return data.use_cases.filter((uc) => uc.theme === theme);
}

export function getInstitutionsByType(
  data: EnsembleData,
  type: InstitutionType
): EnsembleInstitution[] {
  return data.institutions.filter((i) => i.type === type);
}

export function getInstitutionsByPhase(
  data: EnsembleData,
  phase: EnsemblePhase
): EnsembleInstitution[] {
  return data.institutions.filter((i) => i.phases.includes(phase));
}

export function getInstitution(
  data: EnsembleData,
  slug: string
): EnsembleInstitution | undefined {
  return data.institutions.find((i) => i.slug === slug);
}

export function getUseCase(
  data: EnsembleData,
  slug: string
): EnsembleUseCase | undefined {
  return data.use_cases.find((uc) => uc.slug === slug);
}

/** Number of days from the public project launch date (2024-03-07) to today. */
export function getDaysSinceLaunch(): number {
  const launch = new Date(LAUNCH_DATE).getTime();
  const now = new Date().getTime();
  return Math.floor((now - launch) / (1000 * 60 * 60 * 24));
}

/**
 * Build a plain-text citation for a tracker page.
 * kind: 'tracker' | 'milestone' | 'institution' | 'use-case'
 * slug: optional identifier for milestone/institution/use-case
 */
export function buildCitation(
  data: EnsembleData,
  kind: 'tracker' | 'milestone' | 'institution' | 'use-case',
  slug?: string
): string {
  const compiled = data.last_compiled;
  const base = `RWA-Index Research. (${compiled}). Project Ensemble Public Tracker`;

  if (kind === 'tracker') {
    return `${base}. Retrieved from https://rwa-index.com/ensemble`;
  }
  if (kind === 'milestone' && slug) {
    const m = data.milestones.find((x) => x.date === slug || x.title === slug);
    if (m) {
      return `${base} — Milestone: ${m.title} (${m.date}). Retrieved from https://rwa-index.com/ensemble/timeline`;
    }
  }
  if (kind === 'institution' && slug) {
    const inst = getInstitution(data, slug);
    if (inst) {
      return `${base} — Institution: ${inst.name}. Retrieved from https://rwa-index.com/ensemble/institutions/${slug}`;
    }
  }
  if (kind === 'use-case' && slug) {
    const uc = getUseCase(data, slug);
    if (uc) {
      return `${base} — Use Case: ${uc.title}. Retrieved from https://rwa-index.com/ensemble/use-cases`;
    }
  }
  return `${base}. Retrieved from https://rwa-index.com/ensemble`;
}
