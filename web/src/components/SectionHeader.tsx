import type { ReactNode } from 'react';

export default function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-ed-section-h2 text-ed-ink">{children}</h2>
  );
}
