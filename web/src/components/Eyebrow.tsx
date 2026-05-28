import { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <div className={`text-ed-eyebrow uppercase text-ed-text-muted ${className}`.trim()}>
      {children}
    </div>
  );
}
