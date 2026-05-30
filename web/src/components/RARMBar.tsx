import type { RARMBlock } from '../types/assets';
import { RARM_LAYER_KEYS, RARM_LAYER_META, RARM_SIGNAL_META } from '../utils/rarm';

export function RARMBar({ rarm, size = 8, gap = 4 }: { rarm: RARMBlock; size?: number; gap?: number }) {
  return (
    <div className="flex items-center" style={{ gap }}>
      {RARM_LAYER_KEYS.map(k => {
        const layer = rarm[k];
        const meta = RARM_SIGNAL_META[layer.signal];
        return (
          <span
            key={k}
            className="rounded-full inline-block"
            style={{ width: size, height: size, background: meta.dot }}
            title={`${RARM_LAYER_META[k].shortLabel}: ${meta.label}`}
          />
        );
      })}
    </div>
  );
}
