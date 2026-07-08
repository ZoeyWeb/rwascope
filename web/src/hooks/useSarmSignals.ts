import { useTranslation } from 'react-i18next';
import { SIGNAL_META } from '../utils/sarm';
import type { SARMSignal } from '../types/licenses';

export interface SarmSignalMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export function useSarmSignals(): { signals: Record<SARMSignal, SarmSignalMeta> } {
  const { t } = useTranslation('sarm');
  const signals = Object.fromEntries(
    (['green', 'yellow', 'red', 'gray'] as SARMSignal[]).map(k => [
      k,
      { ...SIGNAL_META[k], label: t(`signals.${k}`) },
    ]),
  ) as Record<SARMSignal, SarmSignalMeta>;
  return { signals };
}
