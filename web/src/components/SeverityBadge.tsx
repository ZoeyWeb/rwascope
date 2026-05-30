import type { IncidentSeverity } from '../types/incident';

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  catastrophic: '#9e3f4e',
  critical:     '#e09d2b',
  major:        '#737C7F',
};

interface Props {
  severity: IncidentSeverity;
  className?: string;
}

export default function SeverityBadge({ severity, className = '' }: Props) {
  return (
    <span
      className={`text-ed-meta uppercase tracking-[0.1em] font-medium ${className}`}
      style={{ color: SEVERITY_COLOR[severity] }}
    >
      {severity}
    </span>
  );
}
