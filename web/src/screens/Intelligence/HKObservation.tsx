import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { IntelligenceItem, IntelligenceMeta } from '../../types/intelligence';
import { REGION_META } from '../../types/intelligence';
import DisclaimerBanner from '../../components/DisclaimerBanner';
import { intelligenceApi } from '../../api/client';

const RARM_LAYERS: Array<{ key: string; label: string }> = [
  { key: 'legal',      label: 'L1 Legal & Regulatory' },
  { key: 'valuation',  label: 'L2 Asset Valuation' },
  { key: 'custody',    label: 'L3 Custody & Security' },
  { key: 'kyc',        label: 'L4 KYC / Counterparty' },
  { key: 'liquidity',  label: 'L5 Liquidity & Market' },
  { key: 'settlement', label: 'L6 Settlement & Ops' },
];

function getAffectedLayers(item: IntelligenceItem): string[] {
  const t = item.tags.join(' ').toLowerCase();
  const affected: string[] = [];
  if (t.includes('legal') || t.includes('licens') || t.includes('regulat')) affected.push('legal');
  if (t.includes('valuat') || t.includes('pricing'))                         affected.push('valuation');
  if (t.includes('custody'))                                                  affected.push('custody');
  if (t.includes('aml') || t.includes('kyc') || t.includes('fatf'))          affected.push('kyc');
  if (t.includes('liquid') || t.includes('redemption'))                      affected.push('liquidity');
  if (t.includes('settlement') || t.includes('cbdc'))                        affected.push('settlement');
  return affected;
}

// Source → chip text (no per-source colour — all neutral except HKMA which gets hk-text)
function SourceChip({ name }: { name: string }) {
  if (name === 'HKMA') {
    return (
      <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 bg-ed-hk-bg text-ed-hk-text">
        {name}
      </span>
    );
  }
  return (
    <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 bg-ed-surface-sunken text-ed-chip-text">
      {name}
    </span>
  );
}

function HKPolicyCard({
  item,
  expanded,
  onToggle,
}: {
  item: IntelligenceItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const affectedLayers = getAffectedLayers(item);

  return (
    <div className="relative border-b border-ed-hairline-faint hover:bg-ed-surface-cool transition-colors">
      {/* HK blue left stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-ed-hk-text" />

      <button onClick={onToggle} className="w-full text-left pl-6 pr-10 py-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <SourceChip name={item.source_name} />
          <span className="text-ed-meta tabular-nums text-ed-text-muted font-mono">{item.event_date}</span>
          {item.tags.slice(0, 2).map(t => (
            <span key={t} className="text-[11px] px-2 py-0.5 bg-ed-surface-sunken text-ed-text-muted">
              {t}
            </span>
          ))}
          <span className="ml-auto text-ed-text-faint material-symbols-outlined transition-transform text-[18px]"
                style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
            expand_more
          </span>
        </div>
        <h3 className="text-ed-block-h3 text-ed-text-primary mb-1.5">{item.title}</h3>
        <p className="text-ed-body text-ed-text-secondary leading-relaxed line-clamp-2">{item.policy_summary}</p>
      </button>

      {expanded && (
        <div className="pl-6 pr-4 pb-6 pt-4 border-t border-ed-hairline-faint space-y-5">
          <p className="text-ed-body text-ed-text-secondary leading-relaxed">{item.policy_summary}</p>

          {item.key_changes.length > 0 && (
            <div>
              <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-3">Key changes</p>
              <ul className="space-y-2">
                {item.key_changes.map((c, i) => (
                  <li key={i} className="flex gap-2.5 text-ed-body text-ed-text-secondary leading-relaxed">
                    <span className="font-semibold shrink-0 mt-0.5 text-ed-hk-text">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {affectedLayers.length > 0 && (
            <div className="bg-ed-surface-sunken p-4">
              <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-3">RARM layer impact</p>
              <div className="flex flex-wrap gap-2">
                {RARM_LAYERS.filter(l => affectedLayers.includes(l.key)).map(layer => (
                  <span
                    key={layer.key}
                    className="text-ed-meta px-2.5 py-1.5 bg-ed-hk-bg text-ed-hk-text border border-ed-hk-border"
                  >
                    {layer.label}
                  </span>
                ))}
              </div>
              <p className="text-ed-meta text-ed-text-faint mt-2">
                Indicative only — assess against your specific use case.
              </p>
            </div>
          )}

          {item.market_impact.hk_relevance && (
            <div className="bg-ed-hk-bg border-l-2 border-ed-hk-text p-3">
              <p className="text-ed-eyebrow uppercase text-ed-hk-text mb-1.5">HK market implication</p>
              <p className="text-ed-body text-ed-hk-text leading-relaxed">{item.market_impact.hk_relevance}</p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t border-ed-hairline-faint flex-wrap">
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              {item.source_name} official source
            </a>
            {item.source_note && (
              <span className="text-ed-meta text-ed-text-muted italic">{item.source_note}</span>
            )}
          </div>

          <div className="pt-2 border-t border-ed-hairline-faint">
            <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-3">Explore related</p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-ed-hairline text-ed-meta text-ed-accent hover:border-ed-ink hover:text-ed-ink transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">folder_open</span>
                Related projects
              </Link>
              <Link
                to="/intelligence"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-ed-hairline text-ed-meta text-ed-accent hover:border-ed-ink hover:text-ed-ink transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">public</span>
                Global timeline
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const HK_SOURCES = ['all', 'HKMA', 'SFC', 'HKEx'] as const;
type HKSourceFilter = typeof HK_SOURCES[number];

export default function HKObservation() {
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [meta, setMeta] = useState<IntelligenceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<HKSourceFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    intelligenceApi.hk()
      .then(res => {
        setItems(res.items.filter(i => i.rwa_relevant));
        setMeta(res.meta);
      })
      .catch(() => setError('Failed to load HK observation data.'))
      .finally(() => setLoading(false));
  }, []);

  const hkItems = useMemo(() => {
    return items
      .filter(i => activeSource === 'all' || i.source_name === activeSource)
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  }, [items, activeSource]);

  const sourceCounts = useMemo(() => ({
    all:  items.length,
    HKMA: items.filter(i => i.source_name === 'HKMA').length,
    SFC:  items.filter(i => i.source_name === 'SFC').length,
    HKEx: items.filter(i => i.source_name === 'HKEx').length,
  }), [items]);

  // Keep import alive
  void REGION_META;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-4xl text-ed-accent">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-ed-type-incident text-ed-body">{error}</div>
    );
  }

  return (
    <div className="bg-ed-canvas min-h-screen">
      <DisclaimerBanner text="Content is curated from HKMA, SFC, and HKEx official sources. RARM layer impact indicators are editorial and indicative only — not legal or compliance advice." />

      <div className="max-w-screen-2xl mx-auto px-6 py-16">
        <div className="space-y-ed-section">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-ed-meta text-ed-text-muted mb-4">
              <Link to="/intelligence" className="hover:text-ed-text-primary transition-colors">Intelligence</Link>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-ed-text-secondary">HK Observation</span>
            </div>
            <p className="text-ed-eyebrow uppercase text-ed-text-muted mb-3">HK Observation</p>
            <h1 className="text-4xl md:text-ed-page-h1 text-ed-text-primary mb-2">
              HK Regulatory Watch
            </h1>
            <p className="text-ed-body text-ed-text-secondary leading-relaxed max-w-2xl">
              HKMA · SFC · HKEx announcements relevant to RWA tokenization, mapped to the RARM
              six-layer framework. HKMA maintains a measured regulatory cadence — this column updates
              at the regulator's pace, not artificially padded.
            </p>
            {meta && (
              <div className="mt-3 flex items-center gap-2 text-ed-meta text-ed-text-muted">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                Last compiled: {meta.last_compiled}
                <span className="mx-1">·</span>
                {sourceCounts.all} HK items
              </div>
            )}
          </div>

          {/* RARM layer reference */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RARM_LAYERS.map(l => (
              <div key={l.key} className="flex items-center gap-2 px-3 py-2 bg-ed-surface-sunken border border-ed-hairline">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-ed-hk-text" />
                <span className="text-ed-meta text-ed-text-muted">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Timeline card */}
          <div className="bg-ed-surface shadow-ed-card overflow-hidden">
            {/* Source filter tray */}
            <div className="bg-ed-surface-sunken px-ed-block py-4 flex items-center gap-2 flex-wrap">
              <span className="text-ed-meta uppercase text-ed-text-muted w-14 shrink-0">Source</span>
              {HK_SOURCES.map(s => {
                const count = sourceCounts[s] ?? 0;
                const active = activeSource === s;
                return (
                  <button
                    key={s}
                    onClick={() => setActiveSource(s)}
                    className={`px-3.5 py-1.5 text-ed-body font-medium transition-colors whitespace-nowrap border rounded ${
                      active
                        ? 'bg-ed-ink text-white border-ed-ink'
                        : 'bg-transparent text-ed-text-secondary border-ed-hairline hover:bg-ed-surface hover:border-ed-divider-strong'
                    }`}
                  >
                    {s === 'all' ? 'All sources' : s}
                    {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>

            <div className="px-ed-block py-3 border-b border-ed-hairline-faint">
              <p className="text-ed-meta text-ed-text-muted">
                Showing {hkItems.length} item{hkItems.length !== 1 ? 's' : ''}
              </p>
            </div>

            {hkItems.length === 0 ? (
              <div className="text-center py-16 text-ed-body text-ed-text-muted px-ed-block">
                No HK items match the current filter.
              </div>
            ) : (
              <div>
                {hkItems.map(item => (
                  <HKPolicyCard
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-ed-hairline">
            <Link
              to="/intelligence"
              className="inline-flex items-center gap-1.5 text-ed-meta text-ed-accent hover:text-ed-ink transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Back to Global Intelligence
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
