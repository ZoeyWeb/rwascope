import { AlertTriangle } from 'lucide-react';

interface Props {
  text: string;
  className?: string;
}

export default function DisclaimerBanner({ text, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-3 bg-ed-warn-bg px-4 py-2.5 ${className}`}>
      <AlertTriangle size={14} strokeWidth={1.5} className="text-ed-warn-text shrink-0" />
      <p className="text-xs leading-relaxed text-ed-warn-text">{text}</p>
    </div>
  );
}
