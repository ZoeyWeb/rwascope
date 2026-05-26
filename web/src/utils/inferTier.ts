import type { IntelligenceItem } from '../types/intelligence';

// Compiled at module load — not inside the function — for performance
const _SOVEREIGN_BODIES =
  /FATF|BIS|IOSCO|FSB|IMF|BCBS|SEC|CFTC|HKMA|SFC|MAS|VARA|FSA|FCA|ESMA|BaFin|ECB|FED|OCC|Treasury/;

// Standalone legislation signals in the title (no event_type dependency)
const _LEGISLATION_IN_TITLE = /cap\.?\s*\d+|ordinance|act\b|directive|enacted/i;

// Broader keyword set used when event_type === 'regulation' is explicit
const _REGULATION_KEYWORDS = /act\b|ordinance|regulation|directive|effective|enacted/i;
const _CAP_PATTERN = /cap\.\s*\d+/i;

const _FIRST_LICENCE = /first|inaugural|grants?\s+licen[cs]e|issues?\s+licen[cs]e/i;
const _SOVEREIGN_INFRA = /Ensemble|Agor[áa]|mBridge|Guardian|Helvetia|Pine|Mariana/i;
const _SYSTEMIC_FAILURE = /collapse|depeg|insolvency|bankruptcy|liquidation|halted|froze/i;
const _REGULATORY_SIGNAL =
  /regulation|framework|licens|finalise|finaliz|publish|establish|operationa/i;

export function inferTier(item: IntelligenceItem): 'milestone' | 'news' | 'forward' {
  if (item.is_forward_view) return 'forward';
  if (item.significance === 'landmark') return 'milestone';

  // Legislation with explicit event_type (original check, unchanged)
  if (
    item.event_type === 'regulation' &&
    (_REGULATION_KEYWORDS.test(item.title) ||
      item.tags?.some(t => _REGULATION_KEYWORDS.test(t) || _CAP_PATTERN.test(t)))
  ) {
    return 'milestone';
  }

  // Title-based legislation detection — independent of event_type
  if (_LEGISLATION_IN_TITLE.test(item.title)) {
    return 'milestone';
  }

  // First licence issuance / inaugural events
  if (_FIRST_LICENCE.test(item.title) && item.event_type !== 'project') {
    return 'milestone';
  }

  // International standards bodies and sovereign regulators
  if (_SOVEREIGN_BODIES.test(item.source_entity ?? '') || _SOVEREIGN_BODIES.test(item.title)) {
    return 'milestone';
  }

  // Sovereign infrastructure programmes
  if (_SOVEREIGN_INFRA.test(item.title)) {
    return 'milestone';
  }

  // Systemic failures of major significance
  if (item.significance === 'major' && _SYSTEMIC_FAILURE.test(item.title)) {
    return 'milestone';
  }

  // Fallback: event_type absent, sovereign source, and regulatory signal in title
  if (
    !item.event_type &&
    _SOVEREIGN_BODIES.test(item.source_entity ?? '') &&
    _REGULATORY_SIGNAL.test(item.title)
  ) {
    return 'milestone';
  }

  if (item.is_data_snapshot) return 'news';
  return 'news';
}
