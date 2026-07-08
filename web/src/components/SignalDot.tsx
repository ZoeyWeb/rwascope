import type { Signal } from '../types/signal';
import { SIGNAL_META } from '../utils/sarm';
import { useSarmSignals } from '../hooks/useSarmSignals';

interface Props {
  signal: Signal;
  size?: number;
  title?: string;
  className?: string;
}

export default function SignalDot({ signal, size = 10, title, className = '' }: Props) {
  const { signals } = useSarmSignals();
  const meta = signals[signal] ?? SIGNAL_META.gray;
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size, background: meta.color }}
      title={title ?? meta.label}
    />
  );
}
