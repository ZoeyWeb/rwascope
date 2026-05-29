/**
 * CompareView — side-by-side ecosystem map for two regions,
 * with a "Shared Entities" central strip.
 */

import { useState, useEffect } from 'react';
import type { EcosystemData, EcosystemLayer, EcosystemParticipant } from '../../types/ecosystem';
import type { Region } from './RegionSelector';

// ── Entity-name normalisation (matches GlobalNetworkView) ─────────────────────
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

// ── Compute shared entities ────────────────────────────────────────────────────
interface SharedEntity {
  normalisedName: string;
  displayName: string;
  roleA: string;
  roleB: string;
  participant: EcosystemParticipant;
}

function findSharedEntities(
  dataA: EcosystemData,
  dataB: EcosystemData,
): SharedEntity[] {
  const mapB = new Map<string, EcosystemParticipant>();
  for (const layer of dataB.layers) {
    for (const p of layer.participants) {
      const key = normaliseEntityName(p.full_name || p.name);
      if (key.length >= 3) mapB.set(key, p);
    }
  }

  const seen = new Set<string>();
  const results: SharedEntity[] = [];

  for (const layer of dataA.layers) {
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
  }

  return results;
}

// ── RARM signal colours (dots only) ──────────────────────────────────────────

const RARM_COLOR: Record<string, string> = {
  green: '#4ade80',
  yellow: '#facc15',
  red:   '#f87171',
  gray:  '#737C7F',
};

// ── Mini participant chip ─────────────────────────────────────────────────────

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

// ── Mini layer card ────────────────────────────────────────────────────────────

function MiniLayerCard({ layer }: { layer: EcosystemLayer }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t border-ed-hairline">
      <button
        className="w-full flex items-center gap-2.5 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="text-ed-eyebrow text-ed-text-faint tabular-nums w-5 shrink-0">
          {String(layer.order).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-ed-meta text-ed-text-primary leading-tight">{layer.label}</div>
          <div className="text-ed-eyebrow text-ed-text-muted mt-0.5">{layer.participants.length} participants</div>
        </div>
        <span
          className="material-symbols-outlined text-[14px] text-ed-text-muted"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          expand_more
        </span>
      </button>
      {expanded && (
        <div className="pb-3 pl-7">
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

// ── Shared Entities strip ─────────────────────────────────────────────────────

function SharedEntitiesStrip({
  entities,
  regionAName,
  regionBName,
}: {
  entities: SharedEntity[];
  regionAName: string;
  regionBName: string;
}) {
  const [openCard, setOpenCard] = useState<string | null>(null);

  if (entities.length === 0) return null;

  return (
    <section className="border-y border-ed-hairline py-ed-section-sm my-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-ed-eyebrow uppercase text-ed-text-muted">Shared Entities</div>
        <div className="text-ed-meta text-ed-text-primary tabular-nums">{entities.length}</div>
        <div className="text-ed-meta text-ed-text-secondary">
          — present in both {regionAName} and {regionBName}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {entities.map(e => (
          <div key={e.normalisedName} className="relative">
            <button
              onClick={() => setOpenCard(openCard === e.normalisedName ? null : e.normalisedName)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-ed-hairline text-ed-meta text-ed-text-primary hover:border-ed-ink hover:bg-ed-surface-cool transition-colors"
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
    </section>
  );
}

// ── Region column ─────────────────────────────────────────────────────────────

function RegionColumn({
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
  const sortedLayers = [...data.layers].sort((a, b) => a.order - b.order);
  const totalParticipants = data.layers.reduce((s, l) => s + l.participants.length, 0);

  return (
    <div className="flex-1 min-w-0">
      {/* Region selector */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {regions
          .filter(r => r.status !== 'planned')
          .map(r => (
            <button
              key={r.id}
              onClick={() => onChange(r.id)}
              className={`px-3 py-1 border text-ed-eyebrow uppercase transition-colors ${
                r.id === activeId
                  ? 'border-ed-ink bg-ed-surface-cool text-ed-text-primary'
                  : 'border-ed-hairline text-ed-text-muted hover:text-ed-text-primary hover:border-ed-ink'
              }`}
            >
              {r.id}
            </button>
          ))}
      </div>

      {/* Region title */}
      <div className="mb-4">
        <div className="text-ed-block-h3 text-ed-text-primary">{data.meta.title}</div>
        <div className="text-ed-meta text-ed-text-muted mt-1">
          v{data.meta.version} · {new Date(data.meta.last_compiled).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-6 border-t border-ed-hairline pt-ed-section-sm mb-ed-section-sm">
        <div>
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">Regulators</div>
          <div className="text-ed-section-h2 text-ed-text-primary mt-2 tabular-nums">{data.stats.regulators}</div>
        </div>
        <div>
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">Participants</div>
          <div className="text-ed-section-h2 text-ed-text-primary mt-2 tabular-nums">{totalParticipants}</div>
        </div>
        <div>
          <div className="text-ed-eyebrow uppercase text-ed-text-muted">Gaps</div>
          <div className="text-ed-section-h2 text-ed-text-primary mt-2 tabular-nums">{data.gaps?.length ?? 0}</div>
        </div>
      </div>

      {/* Layers */}
      <div>
        {sortedLayers.map(layer => (
          <MiniLayerCard key={layer.id} layer={layer} />
        ))}
        <div className="border-t border-ed-hairline" />
      </div>
    </div>
  );
}

// ── Main CompareView ─────────────────────────────────────────────────────────

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
  const regionAName = regions.find(r => r.id === regionAId)?.name ?? regionAId;
  const regionBName = regions.find(r => r.id === regionBId)?.name ?? regionBId;

  const sharedEntities = dataA && dataB ? findSharedEntities(dataA, dataB) : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-ed-block-h3 text-ed-text-primary">
          {regionAName}
          <span className="mx-2 text-ed-text-secondary">↔</span>
          {regionBName}
        </h2>
        <div className="text-ed-meta text-ed-text-secondary mt-1">Ecosystem Comparison</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="material-symbols-outlined animate-spin text-4xl text-ed-accent">
            progress_activity
          </span>
        </div>
      ) : (
        <>
          {sharedEntities.length > 0 && (
            <SharedEntitiesStrip
              entities={sharedEntities}
              regionAName={regionAName}
              regionBName={regionBName}
            />
          )}

          <div className="flex flex-col md:flex-row gap-8">
            {dataA && (
              <RegionColumn
                id={regionAId}
                name={regionAName}
                data={dataA}
                regions={regions}
                activeId={regionAId}
                onChange={onRegionAChange}
              />
            )}

            {/* Divider */}
            <div className="hidden md:flex flex-col items-center gap-2 pt-12">
              <div className="w-px flex-1 bg-ed-hairline" />
              <span className="text-ed-text-muted text-xs">↔</span>
              <div className="w-px flex-1 bg-ed-hairline" />
            </div>

            {dataB && (
              <RegionColumn
                id={regionBId}
                name={regionBName}
                data={dataB}
                regions={regions}
                activeId={regionBId}
                onChange={onRegionBChange}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
