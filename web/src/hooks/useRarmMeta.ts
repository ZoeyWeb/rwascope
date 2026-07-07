import { useTranslation } from 'react-i18next';
import { RARM_LAYER_KEYS, RARM_LAYER_META } from '../utils/rarm';
import type { RARMBlock } from '../types/assets';

export interface RarmLayerMeta {
  label: string;
  shortLabel: string;
  description: string;
  index: number;
}

export function useRarmMeta(): { layers: Record<keyof RARMBlock, RarmLayerMeta> } {
  const { t } = useTranslation('rarm');
  const layers = Object.fromEntries(
    RARM_LAYER_KEYS.map(k => [k, {
      label:       t(`layers.${k}.label`),
      shortLabel:  t(`layers.${k}.shortLabel`),
      description: t(`layers.${k}.description`),
      index:       RARM_LAYER_META[k].index,
    }]),
  ) as Record<keyof RARMBlock, RarmLayerMeta>;
  return { layers };
}
