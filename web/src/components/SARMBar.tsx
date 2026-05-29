import type { SARMBlock } from '../types/licenses';
import { SARM_DIMENSION_KEYS } from '../utils/sarm';
import SignalDot from './SignalDot';

interface Props {
  sarm: SARMBlock;
  size?: number;
  gap?: number;
  className?: string;
}

export default function SARMBar({ sarm, size = 8, gap = 4, className = '' }: Props) {
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap }}
      title="SARM dimension signals"
    >
      {SARM_DIMENSION_KEYS.map(key => (
        <SignalDot key={key} signal={sarm[key].signal} size={size} title={sarm[key].label} />
      ))}
    </div>
  );
}
