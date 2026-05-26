import type {
  ComplianceMatrix,
  ComplianceCell,
  ComplianceJurisdiction,
  ComplianceIssue,
  ComplianceSignal,
} from '../types/compliance';

export const SIGNAL_META: Record<
  ComplianceSignal,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  open: {
    label: 'Open',
    color: '#065f46',
    bg: '#d1fae5',
    border: '#6ee7b7',
    dot: '#10b981',
  },
  conditional: {
    label: 'Conditional',
    color: '#92400e',
    bg: '#fef3c7',
    border: '#fcd34d',
    dot: '#f59e0b',
  },
  restricted: {
    label: 'Restricted',
    color: '#991b1b',
    bg: '#fee2e2',
    border: '#fca5a5',
    dot: '#ef4444',
  },
  placeholder: {
    label: 'Pending',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#d1d5db',
    dot: '#9ca3af',
  },
};

/** Look up a single cell by jurisdiction + issue codes. */
export function getCell(
  matrix: ComplianceMatrix,
  jurisdiction: string,
  issue: string
): ComplianceCell | undefined {
  return matrix.cells.find(
    (c) => c.jurisdiction === jurisdiction && c.issue === issue
  );
}

/** All cells for a given jurisdiction code. */
export function getCellsByJurisdiction(
  matrix: ComplianceMatrix,
  jurisdiction: string
): ComplianceCell[] {
  return matrix.cells.filter((c) => c.jurisdiction === jurisdiction);
}

/** All cells for a given issue code. */
export function getCellsByIssue(
  matrix: ComplianceMatrix,
  issue: string
): ComplianceCell[] {
  return matrix.cells.filter((c) => c.issue === issue);
}

/** Look up a jurisdiction definition by code. */
export function getJurisdiction(
  matrix: ComplianceMatrix,
  code: string
): ComplianceJurisdiction | undefined {
  return matrix.jurisdictions.find((j) => j.code === code);
}

/** Look up an issue definition by code. */
export function getIssue(
  matrix: ComplianceMatrix,
  code: string
): ComplianceIssue | undefined {
  return matrix.issues.find((i) => i.code === code);
}

/** Count of non-placeholder cells across the whole matrix. */
export function populatedCellCount(matrix: ComplianceMatrix): number {
  return matrix.cells.filter((c) => c.status_signal !== 'placeholder').length;
}

/**
 * Build a plain-text citation string for a cell's primary reference.
 * Falls back to a generic string if no references exist.
 */
export function buildCellCitation(cell: ComplianceCell): string {
  if (!cell.references.length) {
    return `${cell.jurisdiction.toUpperCase()} — ${cell.issue} (RWA-Index Compliance Map, no primary source on file)`;
  }
  const ref = cell.references[0];
  const year = ref.date ? ref.date.slice(0, 4) : 'n.d.';
  return `${ref.title} (${year}). Retrieved from ${ref.url}`;
}
