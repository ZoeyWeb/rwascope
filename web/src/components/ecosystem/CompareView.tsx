/**
 * CompareView — side-by-side ecosystem map for two regions,
 * with a "Shared Entities" central strip.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// ── Minimal region inline map ─────────────────────────────────────────────────

const RARM_COLOR: Record<string, string> = {
  green: '#4ade80',
  yellow: '#facc15',
  red: '#f87171',
  gray: '#737C7F',
};

function MiniParticipantChip({ p, color }: { p: EcosystemParticipant; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all"
        style={{
          borderColor: open ? color : '#2B3437',
          color: open ? '#fff' : '#94a3b8',
          background: open ? color + '30' : 'transparent',
        }}
      >
        {p.rarm_signal && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: RARM_COLOR[p.rarm_signal] }} />
        )}
        {p.name}
        <span className="material-symbols-outlined text-[10px]" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div
          className="absolute z-20 top-full mt-1 left-0 min-w-[220px] max-w-[290px] rounded-lg border p-3 bg-[#0F1117] shadow-xl text-left"
          style={{ borderColor: color }}
        >
          <div className="text-[11px] font-bold text-white mb-1">{p.full_name}</div>
          <p className="text-[10px] text-slate-400 leading-relaxed">{p.role}</p>
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {p.tags.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 bg-[#2B3437] text-slate-500 rounded">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniLayerCard({ layer }: { layer: EcosystemLayer }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-lg border mb-2 overflow-hidden transition-all"
      style={{ borderColor: expanded ? layer.border : layer.border + '44' }}
    >
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
        onClick={() => setExpanded(e => !e)}
        style={{ background: expanded ? layer.bg : 'transparent' }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: layer.color + '20', color: layer.color, border: `1.5px solid ${layer.color}70` }}
        >
          {layer.order}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold leading-tight" style={{ color: layer.color }}>{layer.label}</div>
          <div className="text-[9px] text-slate-600 mt-0.5">{layer.participants.length} participants</div>
        </div>
        <span
          className="material-symbols-outlined text-[14px]"
          style={{ color: layer.color + '90', transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          expand_more
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1">
          <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{layer.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {layer.participants.map(p => (
              <MiniParticipantChip key={p.id} p={p} color={layer.color} />
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
  const [expanded, setExpanded] = useState(true);
  const [openCard, setOpenCard] = useState<string | null>(null);

  if (entities.length === 0) return null;

  return (
    <div className="mx-0 sm:mx-6 my-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-t-xl border border-b-0 border-[#5E5C75] bg-[#5E5C75]/10 text-left"
      >
        <span className="material-symbols-outlined text-[#5E5C75] text-[16px]">link</span>
        <span className="text-xs font-bold text-[#a29bfe]">
          {entities.length} Shared Entit{entities.length === 1 ? 'y' : 'ies'}
        </span>
        <span className="text-[10px] text-slate-500 ml-1">
          — present in both {regionAName} and {regionBName}
        </span>
        <span
          className="material-symbols-outlined text-slate-500 text-[16px] ml-auto"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          expand_more
        </span>
      </button>
      {expanded && (
        <div className="border border-[#5E5C75]/40 rounded-b-xl bg-[#0D0F18] p-4">
          <div className="flex flex-wrap gap-2">
            {entities.map(e => (
              <div key={e.normalisedName} className="relative">
                <button
                  onClick={() => setOpenCard(openCard === e.normalisedName ? null : e.normalisedName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all"
                  style={{
                    borderColor: openCard === e.normalisedName ? '#5E5C75' : '#3b3f50',
                    color: openCard === e.normalisedName ? '#fff' : '#94a3b8',
                    background: openCard === e.normalisedName ? '#5E5C7530' : 'transparent',
                  }}
                >
                  <span className="material-symbols-outlined text-[12px] text-[#5E5C75]">sync_alt</span>
                  {e.displayName.split('(')[0].trim()}
                </button>
                {openCard === e.normalisedName && (
                  <div className="absolute z-20 top-full mt-1 left-0 min-w-[280px] max-w-[340px] rounded-xl border border-[#5E5C75]/60 p-4 bg-[#0F1117] shadow-xl">
                    <div className="text-xs font-bold text-white mb-3">{e.displayName}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] font-bold text-[#5E5C75] uppercase tracking-wider mb-1">
                          {regionAName}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{e.roleA}</p>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-[#5E5C75] uppercase tracking-wider mb-1">
                          {regionBName}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{e.roleB}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Region column ─────────────────────────────────────────────────────────────

function RegionColumn({
  id,
  name,
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
              className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
                r.id === activeId
                  ? 'border-[#5E5C75] bg-[#5E5C75]/20 text-white'
                  : 'border-[#2B3437] text-slate-500 hover:text-slate-300'
              }`}
            >
              {r.id}
            </button>
          ))}
      </div>

      {/* Region title */}
      <div className="mb-3">
        <div className="text-sm font-bold text-white">{data.meta.title}</div>
        <div className="text-[10px] text-slate-600 mt-0.5">
          v{data.meta.version} · {new Date(data.meta.last_compiled).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#1A1A2E] rounded-lg p-2 text-center border border-[#2B3437]">
          <div className="text-base font-bold text-white">{data.stats.regulators}</div>
          <div className="text-[9px] text-slate-500">Regulators</div>
        </div>
        <div className="bg-[#1A1A2E] rounded-lg p-2 text-center border border-[#2B3437]">
          <div className="text-base font-bold text-white">
            {data.layers.reduce((s, l) => s + l.participants.length, 0)}
          </div>
          <div className="text-[9px] text-slate-500">Participants</div>
        </div>
        <div className="bg-[#1A1A2E] rounded-lg p-2 text-center border border-[#2B3437]">
          <div className="text-base font-bold text-white">{data.gaps?.length ?? 0}</div>
          <div className="text-[9px] text-slate-500">Gaps</div>
        </div>
      </div>

      {/* Layers */}
      <div>
        {sortedLayers.map(layer => (
          <MiniLayerCard key={layer.id} layer={layer} />
        ))}
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

  const sharedEntities =
    dataA && dataB ? findSharedEntities(dataA, dataB) : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-base font-bold text-white">
          {regionAName}
          <span className="mx-2 text-[#5E5C75]">↔</span>
          {regionBName}
          <span className="text-slate-500 font-normal text-sm ml-2">Ecosystem Comparison</span>
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">progress_activity</span>
        </div>
      ) : (
        <>
          {/* Shared entities strip */}
          {sharedEntities.length > 0 && (
            <SharedEntitiesStrip
              entities={sharedEntities}
              regionAName={regionAName}
              regionBName={regionBName}
            />
          )}

          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row gap-6">
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
              <div className="w-px flex-1 bg-[#2B3437]" />
              <span className="text-[#5E5C75] font-bold text-xs rotate-0">↔</span>
              <div className="w-px flex-1 bg-[#2B3437]" />
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
