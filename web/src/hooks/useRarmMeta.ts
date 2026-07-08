import { useTranslation } from 'react-i18next';
import { RARM_LAYER_KEYS, RARM_LAYER_META, RARM_SIGNAL_META } from '../utils/rarm';
import type { RARMBlock, RARMSignal } from '../types/assets';

export interface RarmLayerMeta {
  label: string;
  shortLabel: string;
  description: string;
  index: number;
}

export interface RarmSignalMeta {
  label: string;
  dot: string;
  bg: string;
  color: string;
  border: string;
}

export function useRarmMeta(): {
  layers: Record<keyof RARMBlock, RarmLayerMeta>;
  signals: Record<RARMSignal, RarmSignalMeta>;
} {
  const { t } = useTranslation('rarm');
  const layers = Object.fromEntries(
    RARM_LAYER_KEYS.map(k => [k, {
      label:       t(`layers.${k}.label`),
      shortLabel:  t(`layers.${k}.shortLabel`),
      description: t(`layers.${k}.description`),
      index:       RARM_LAYER_META[k].index,
    }]),
  ) as Record<keyof RARMBlock, RarmLayerMeta>;

  const signalKeys: RARMSignal[] = ['green', 'yellow', 'red', 'gray'];
  const signals = Object.fromEntries(
    signalKeys.map(k => [k, {
      label:  t(`signals.${k}`),
      dot:    RARM_SIGNAL_META[k].dot,
      bg:     RARM_SIGNAL_META[k].bg,
      color:  RARM_SIGNAL_META[k].color,
      border: RARM_SIGNAL_META[k].border,
    }]),
  ) as Record<RARMSignal, RarmSignalMeta>;

  return { layers, signals };
}
