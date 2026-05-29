import { useState } from 'react';

interface Props {
  issuer: { name: string; ticker: string; logo_url?: string };
  size?: number;
  className?: string;
}

export default function IssuerLogo({ issuer, size = 32, className = '' }: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = (() => {
    const t = issuer.ticker;
    if (t.toLowerCase() === 'pending') return issuer.name.slice(0, 2).toUpperCase();
    return t.slice(0, 2).toUpperCase();
  })();

  const Fallback = (
    <div
      className={`rounded-full flex items-center justify-center bg-ed-ink text-white font-medium flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.38)) }}
    >
      {initials}
    </div>
  );

  if (!issuer.logo_url || imgError) return Fallback;

  return (
    <img
      src={issuer.logo_url}
      alt={issuer.name}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-ed-surface-cool flex-shrink-0 ${className}`}
      onError={() => setImgError(true)}
    />
  );
}
