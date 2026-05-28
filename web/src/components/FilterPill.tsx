import { ReactNode } from 'react';

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function FilterPill({ active, onClick, children, className = '' }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-ed-meta uppercase tracking-wider transition-colors ${
        active
          ? 'bg-ed-ink text-white'
          : 'text-ed-text-secondary hover:text-ed-ink'
      } ${className}`.trim()}
    >
      {children}
    </button>
  );
}
