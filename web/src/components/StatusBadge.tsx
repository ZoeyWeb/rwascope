import type { IssuerStatus } from '../types/licenses';
import { STATUS_META } from '../utils/sarm';

interface Props {
  status: IssuerStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const m = STATUS_META[status] ?? STATUS_META.under_review;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${className}`}
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}
