import { useTranslation } from 'react-i18next';
import type { IssuerStatus } from '../types/licenses';
import { STATUS_META } from '../utils/sarm';

interface Props {
  status: IssuerStatus;
  className?: string;
}

function statusT(status: string, t: (k: string, opts?: Record<string, unknown>) => string, fallback: string) {
  const key = status.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return t(`statusFilters.${key}`, { defaultValue: fallback });
}

export default function StatusBadge({ status, className = '' }: Props) {
  const { t } = useTranslation('licensesMap');
  const m = STATUS_META[status] ?? STATUS_META.under_review;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${className}`}
      style={{ color: m.color, background: m.bg }}
    >
      {statusT(status, t, m.label)}
    </span>
  );
}
