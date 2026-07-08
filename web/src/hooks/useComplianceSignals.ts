import { useTranslation } from 'react-i18next';
import { SIGNAL_META } from '../utils/compliance';
import type { ComplianceSignal } from '../types/compliance';

export interface ComplianceSignalMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}

export function useComplianceSignals(): { signals: Record<ComplianceSignal, ComplianceSignalMeta> } {
  const { t } = useTranslation('compliance');
  const signals = Object.fromEntries(
    (['open', 'conditional', 'restricted', 'placeholder'] as ComplianceSignal[]).map(k => [
      k,
      { ...SIGNAL_META[k], label: t(`signals.${k}`) },
    ]),
  ) as Record<ComplianceSignal, ComplianceSignalMeta>;
  return { signals };
}
