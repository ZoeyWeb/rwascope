import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LOCALES = [
  { key: 'en',       label: 'EN' },
  { key: 'zh-Hans',  label: '简' },
  { key: 'zh-Hant',  label: '繁' },
] as const;

export default function LocaleSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = LOCALES.find(l => l.key === i18n.language)?.label ?? 'EN';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-[#2B3437]/50 rounded transition-colors"
        aria-label="Select language"
      >
        {currentLabel}
        <span className="material-symbols-outlined text-[14px] opacity-40">expand_more</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-1 z-50">
          <div className="bg-[#13141f] border border-[#2B3437] rounded-lg shadow-xl overflow-hidden py-1">
            {LOCALES.map(locale => (
              <button
                key={locale.key}
                type="button"
                onClick={() => { i18n.changeLanguage(locale.key); setOpen(false); }}
                className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                  locale.key === i18n.language
                    ? 'text-white bg-[#2B3437]'
                    : 'text-slate-400 hover:text-white hover:bg-[#2B3437]/50'
                }`}
              >
                {locale.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
