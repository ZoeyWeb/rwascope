/**
 * CompareView — side-by-side ecosystem map for two regions,
 * with a "Shared Entities" full-bleed anchor strip.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { EcosystemData, EcosystemLayer, EcosystemParticipant } from '../../types/ecosystem';
import type { Region } from './RegionSelector';

// ── Entity-name normalisation ─────────────────────────────────────────────────
function normaliseEntityName(raw: string): string {
  return raw
    .replace(/\s*[—–]\s*.+$/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(
      /\b(Inc\.?|Ltd\.?|LLC|LLP|AG|SA|Pte\.?|B\.V\.|Holdings?|Limited|Corp\.?|Global|International|Group|Investments?|Securities?|Capital|Digital|Financial|Bank|Fund|Asset Management)\b/gi,
      '',
    )
    .replace(/[,\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ── Shared-entity type ────────────────────────────────────────────────────────
interface SharedEntity {
  normalisedName: string;
  displayName: string;
  roleA: string;
  roleB: string;
  participant: EcosystemParticipant;
}

function findSharedEntities(dataA: EcosystemData, dataB: EcosystemData): SharedEntity[] {
  const mapB = new Map<string, EcosystemParticipant>();
  for (const layer of dataB.layers)
    for (const p of layer.participants) {
      const key = normaliseEntityName(p.full_name || p.name);
      if (key.length >= 3) mapB.set(key, p);
    }

  const seen = new Set<string>();
  const results: SharedEntity[] = [];

  for (const layer of dataA.layers)
    for (const p of layer.participants) {
      const key = normaliseEntityName(p.full_name || p.name);
      if (key.length < 3 || seen.has(key)) continue;
      const matchB = mapB.get(key);
      if (matchB) {
        seen.add(key);
        results.push({
          normalisedName: key,
          displayName: p.full_name || p.name,
          roleA: p.role?.slice(0, 100) ?? '—',
          roleB: matchB.role?.slice(0, 100) ?? '—',
          participant: p,
        });
      }
    }

  return results;
}

// ── RARM dot colours ──────────────────────────────────────────────────────────
const RARM_COLOR: Record<string, string> = {
  green: '#4ade80',
  yellow: '#facc15',
  red:   '#f87171',
  gray:  '#737C7F',
};

// ── Mini participant chip (with popup) ────────────────────────────────────────
function MiniParticipantChip({ p }: { p: EcosystemParticipant }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-ed-hairline text-ed-meta text-ed-text-primary hover:border-ed-ink hover:bg-ed-surface-cool transition-colors"
      >
        {p.rarm_signal && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: RARM_COLOR[p.rarm_signal] }} />
        )}
        {p.name}
        <span className="material-symbols-outlined text-[12px]">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 min-w-[220px] max-w-[290px] border border-ed-hairline p-3 bg-ed-surface text-left">
          <div className="text-ed-meta font-semibold text-ed-text-primary mb-1">{p.full_name}</div>
          <p className="text-ed-meta text-ed-text-secondary leading-relaxed">{p.role}</p>
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {p.tags.map(t => (
                <span key={t} className="text-ed-eyebrow uppercase px-1.5 py-0.5 bg-ed-surface-cool text-ed-text-muted">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mini layer accordion row ──────────────────────────────────────────────────
function MiniLayerCard({ layer }: { layer: EcosystemLayer }) {
  const { t } = useTranslation('ecosystemMap');
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t border-ed-hairline">
      <button
        className={`w-full flex items-center gap-2.5 py-ed-section-sm text-left
          border-l-2 transition-colors pl-3
          ${expanded
            ? 'border-ed-ink bg-ed-surface-sunken'
            : 'border-transparent hover:bg-ed-surface-sunken hover:border-ed-ink'
          }`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="text-ed-eyebrow text-ed-text-faint tabular-nums w-5 shrink-0">
          {String(layer.order).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-ed-meta text-ed-text-primary leading-tight">{t('shared.layerLabel.' + layer.id, { defaultValue: layer.label })}</div>
          <div className="text-ed-eyebrow text-ed-text-muted mt-0.5">{t('compare.column.participantCount', { count: layer.participants.length })}</div>
        </div>
        <span
          className="material-symbols-outlined text-[14px] text-ed-text-muted mr-2"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          expand_more
        </span>
      </button>
      {expanded && (
        <div className="pb-3 pl-11">
          <p className="text-ed-meta text-ed-text-secondary leading-relaxed mb-3">{layer.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {layer.participants.map(p => (
              <MiniParticipantChip key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared Entities — full-bleed cool strip ───────────────────────────────────
function SharedEntitiesStrip({
  entities,
  regionAName,
  regionBName,
}: {
  entities: SharedEntity[];
  regionAName: string;
  regionBName: string;
}) {
  const { t } = useTranslation('ecosystemMap');
  const [openCard, setOpenCard] = useState<string | null>(null);

  if (entities.length === 0) return null;

  return (
    <section className="w-screen left-1/2 -translate-x-1/2 relative bg-ed-surface-cool border-y border-ed-hairline py-ed-section-md mb-ed-section">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[auto_1fr] md:gap-12 md:items-start">
          {/* Left: count + label */}
          <div>
            <div className="text-ed-eyebrow uppercase text-ed-text-muted">{t('compare.sharedEntities.eyebrow')}</div>
            <div className="text-[64px] leading-none font-semibold text-ed-text-primary mt-3 tabular-nums">
              {entities.length}
            </div>
            <div className="text-ed-meta text-ed-text-muted mt-2 max-w-[180px]">
              {t('compare.sharedEntities.presentIn', { regionA: regionAName, regionB: regionBName })}
            </div>
          </div>

          {/* Right: chips with role popup */}
          <div className="flex flex-wrap gap-2 pt-2">
            {entities.map(e => (
              <div key={e.normalisedName} className="relative">
                <button
                  onClick={() => setOpenCard(openCard === e.normalisedName ? null : e.normalisedName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ed-surface border border-ed-hairline text-ed-meta text-ed-text-primary hover:border-ed-ink transition-colors"
                >
                  ⇄ {e.displayName.split('(')[0].trim()}
                </button>
                {openCard === e.normalisedName && (
                  <div className="absolute z-20 top-full mt-1 left-0 min-w-[280px] max-w-[340px] border border-ed-hairline p-4 bg-ed-surface">
                    <div className="text-ed-meta font-semibold text-ed-text-primary mb-3">{e.displayName}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">{regionAName}</div>
                        <p className="text-ed-meta text-ed-text-secondary leading-snug">{e.roleA}</p>
                      </div>
                      <div>
                        <div className="text-ed-eyebrow uppercase text-ed-text-muted mb-1">{regionBName}</div>
                        <p className="text-ed-meta text-ed-text-secondary leading-snug">{e.roleB}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Region column ─────────────────────────────────────────────────────────────
function RegionColumn({
  id,
  data,
  regions,
  activeId,
  onChange,
}: {
  id: string;
  name: string;
  data: EcosystemData;
  regions: Region[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation('ecosystemMap');
  const sortedLayers = [...data.layers].sort((a, b) => a.order - b.order);
  const totalParticipants = data.layers.reduce((s, l) => s + l.participants.length, 0);

  return (
    <div className="min-w-0">
      {/* Header tile: selector + title + version */}
      <div className="bg-ed-surface-cool border border-ed-hairline px-6 py-5 mb-ed-section-sm">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {regions
            .filter(r => r.status !== 'planned')
            .map(r => (
              <button
                key={r.id}
                onClick={() => onChange(r.id)}
                className={`px-3 py-1 border text-ed-eyebrow uppercase transition-colors ${
                  r.id === activeId
                    ? 'border-ed-ink bg-ed-surface text-ed-text-primary'
                    : 'border-ed-hairline text-ed-text-muted hover:text-ed-text-primary hover:border-ed-ink'
                }`}
              >
                {r.id}
              </button>
            ))}
        </div>
        <h2 className="text-ed-block-h3 text-ed-text-primary">{t('meta.title', { region: t('shared.regionName.' + id, { defaultValue: data.meta.title }) })}</h2>
        <div className="text-ed-meta text-ed-text-muted mt-1 tabular-nums">
          {t('compare.column.versionDate', {
            version: data.meta.version,
            date: new Date(data.meta.last_compiled).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 py-ed-section-sm border-b border-ed-hairline mb-0">
        <div>
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">{t('compare.column.regulators')}</div>
          <div className="text-2xl md:text-ed-section-h2 text-ed-text-primary mt-2 tabular-nums">{data.stats.regulators}</div>
        </div>
        <div>
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">{t('compare.column.participants')}</div>
          <div className="text-2xl md:text-ed-section-h2 text-ed-text-primary mt-2 tabular-nums">{totalParticipants}</div>
        </div>
        <div>
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">{t('compare.column.gaps')}</div>
          <div className="text-2xl md:text-ed-section-h2 text-ed-text-primary mt-2 tabular-nums">{data.gaps?.length ?? 0}</div>
        </div>
      </div>

      {/* Layer accordion */}
      <div>
        {sortedLayers.map(layer => (
          <MiniLayerCard key={layer.id} layer={layer} />
        ))}
        <div className="border-t border-ed-hairline" />
      </div>
    </div>
  );
}

// ── Main CompareView ──────────────────────────────────────────────────────────
interface CompareViewProps {
  regions: Region[];
  regionAId: string;
  regionBId: string;
  onRegionAChange: (id: string) => void;
  onRegionBChange: (id: string) => void;
}

export default function CompareView({
  regions,
  regionAId,
  regionBId,
  onRegionAChange,
  onRegionBChange,
}: CompareViewProps) {
  const { t } = useTranslation('ecosystemMap');
  const [dataA, setDataA] = useState<EcosystemData | null>(null);
  const [dataB, setDataB] = useState<EcosystemData | null>(null);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingB, setLoadingB] = useState(true);

  useEffect(() => {
    setLoadingA(true);
    const r = regions.find(x => x.id === regionAId);
    if (!r?.data_file) { setLoadingA(false); return; }
    fetch(`/data/ecosystem/${r.data_file}`)
      .then(res => res.json())
      .then((d: EcosystemData) => { setDataA(d); setLoadingA(false); })
      .catch(() => setLoadingA(false));
  }, [regionAId, regions]);

  useEffect(() => {
    setLoadingB(true);
    const r = regions.find(x => x.id === regionBId);
    if (!r?.data_file) { setLoadingB(false); return; }
    fetch(`/data/ecosystem/${r.data_file}`)
      .then(res => res.json())
      .then((d: EcosystemData) => { setDataB(d); setLoadingB(false); })
      .catch(() => setLoadingB(false));
  }, [regionBId, regions]);

  const loading = loadingA || loadingB;
  const regionAName = t('shared.regionName.' + regionAId, { defaultValue: regions.find(r => r.id === regionAId)?.name ?? regionAId });
  const regionBName = t('shared.regionName.' + regionBId, { defaultValue: regions.find(r => r.id === regionBId)?.name ?? regionBId });
  const sharedEntities = dataA && dataB ? findSharedEntities(dataA, dataB) : [];

  return (
    <div>
      {/* Hero */}
      <section className="py-ed-section-md md:py-ed-hero">
        <div className="text-ed-eyebrow uppercase text-ed-text-muted">{t('compare.eyebrow')}</div>
        <h1 className="text-4xl md:text-ed-hero-h1 text-ed-text-primary mt-4">
          {regionAName}
          <span className="mx-3 text-ed-text-secondary">↔</span>
          {regionBName}
        </h1>
        <p className="text-ed-lede text-ed-text-secondary mt-ed-section-sm max-w-3xl">
          {t('compare.lede')}
        </p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="material-symbols-outlined animate-spin text-4xl text-ed-accent">
            progress_activity
          </span>
        </div>
      ) : (
        <>
          {/* Shared entities — full-bleed cool anchor */}
          {sharedEntities.length > 0 && (
            <SharedEntitiesStrip
              entities={sharedEntities}
              regionAName={regionAName}
              regionBName={regionBName}
            />
          )}

          {/* Two-column grid with center spine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 relative">
            {dataA && (
              <div className="pr-0 md:pr-12">
                <RegionColumn
                  id={regionAId}
                  name={regionAName}
                  data={dataA}
                  regions={regions}
                  activeId={regionAId}
                  onChange={onRegionAChange}
                />
              </div>
            )}
            {dataB && (
              <div className="pl-0 md:pl-12 md:border-l md:border-ed-hairline">
                <RegionColumn
                  id={regionBId}
                  name={regionBName}
                  data={dataB}
                  regions={regions}
                  activeId={regionBId}
                  onChange={onRegionBChange}
                />
              </div>
            )}
            {/* Centre ↔ badge — desktop only */}
            {dataA && dataB && (
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-ed-canvas border border-ed-hairline items-center justify-center text-ed-text-secondary">
                ↔
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
