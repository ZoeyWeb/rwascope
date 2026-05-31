import type { ReactNode } from 'react';

export default function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl md:text-ed-section-h2 text-ed-ink">{children}</h2>
  );
}
