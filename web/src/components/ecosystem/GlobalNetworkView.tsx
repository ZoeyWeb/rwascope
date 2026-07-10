/**
 * GlobalNetworkView — D3 force-directed graph of cross-region RWA entity connections.
 * D3 owns the SVG DOM; React manages loading state and the sidebar panel.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import type { EcosystemData } from '../../types/ecosystem';
import type { Region } from './RegionSelector';

// ── Region colours ─────────────────────────────────────────────────────────────
const REGION_COLORS: Record<string, string> = {
  HK: '#ef4444',
  SG: '#f97316',
  US: '#3b82f6',
  EU: '#8b5cf6',
  AE: '#10b981',
  CH: '#f59e0b',
  JP: '#ec4899',
};

// ── Entity-name normalisation for cross-region matching ───────────────────────
function normaliseEntityName(raw: string): string {
  return raw
    .replace(/\s*[—–]\s*.+$/, '')                      // strip "— Libeara Platform" suffixes
    .replace(/\s*\([^)]*\)/g, '')                       // strip parentheticals
    .replace(
      /\b(Inc\.?|Ltd\.?|LLC|LLP|AG|SA|Pte\.?|B\.V\.|Holdings?|Limited|Corp\.?|Global|International|Group|Investments?|Securities?|Capital|Digital|Financial|Bank|Fund|Asset Management)\b/gi,
      '',
    )
    .replace(/[,\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CrossRegionEntity {
  normalisedName: string;
  displayName: string;
  regions: string[];
  rolesByRegion: Record<string, string>;
}

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  fullName: string;
  color: string;
  participantCount: number;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  entities: CrossRegionEntity[];
  weight: number;
}

interface SidebarState {
  type: 'node' | 'link';
  title: string;
  entities?: CrossRegionEntity[];
  nodeInfo?: { fullName: string; participantCount: number; color: string };
}

// ── Cross-region entity extraction ────────────────────────────────────────────

function buildCrossRegionEntities(
  allData: Record<string, EcosystemData>,
): CrossRegionEntity[] {
  const entityMap = new Map<string, { displayName: string; regions: Set<string>; roles: Map<string, string> }>();

  for (const [regionId, data] of Object.entries(allData)) {
    for (const layer of data.layers) {
      for (const p of layer.participants) {
        const key = normaliseEntityName(p.full_name || p.name);
        if (!key || key.length < 3) continue;
        if (!entityMap.has(key)) {
          entityMap.set(key, { displayName: p.full_name || p.name, regions: new Set(), roles: new Map() });
        }
        const entry = entityMap.get(key)!;
        entry.regions.add(regionId);
        if (!entry.roles.has(regionId)) {
          entry.roles.set(regionId, p.role?.slice(0, 100) ?? '');
        }
      }
    }
  }

  return Array.from(entityMap.entries())
    .filter(([, v]) => v.regions.size >= 2)
    .map(([k, v]) => ({
      normalisedName: k,
      displayName: v.displayName,
      regions: Array.from(v.regions),
      rolesByRegion: Object.fromEntries(v.roles),
    }));
}

function buildGraph(
  regions: Region[],
  allData: Record<string, EcosystemData>,
  getName?: (id: string, fallback: string) => string,
): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const activeRegions = regions.filter(r => r.status !== 'planned' && allData[r.id]);
  const crossEntities = buildCrossRegionEntities(allData);

  const nodes: NetworkNode[] = activeRegions.map(r => {
    const data = allData[r.id];
    const count = data.layers.reduce((sum, l) => sum + l.participants.length, 0);
    return {
      id: r.id,
      label: r.id,
      fullName: getName ? getName(r.id, r.name) : r.name,
      color: REGION_COLORS[r.id] ?? '#737C7F',
      participantCount: count,
    };
  });

  const linkMap = new Map<string, NetworkLink>();
  for (const entity of crossEntities) {
    const regionList = entity.regions.filter(rid => allData[rid]);
    for (let i = 0; i < regionList.length; i++) {
      for (let j = i + 1; j < regionList.length; j++) {
        const key = [regionList[i], regionList[j]].sort().join('—');
        if (!linkMap.has(key)) {
          linkMap.set(key, {
            source: regionList[i],
            target: regionList[j],
            entities: [],
            weight: 0,
          });
        }
        const link = linkMap.get(key)!;
        link.entities.push(entity);
        link.weight = link.entities.length;
      }
    }
  }

  return { nodes, links: Array.from(linkMap.values()) };
}

// ── Sidebar panel ─────────────────────────────────────────────────────────────

function SidePanel({ sidebar, onClose }: { sidebar: SidebarState; onClose: () => void }) {
  const { t } = useTranslation('ecosystemMap');
  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-[#0D0F18] border-l border-[#2B3437] overflow-y-auto z-10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2B3437]">
        <span className="text-xs font-bold text-white truncate">{sidebar.title}</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white ml-2 shrink-0">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {sidebar.type === 'node' && sidebar.nodeInfo && (
          <div>
            <div className="text-xs text-slate-400 mb-1">{t('network.sidebar.fullName')}</div>
            <div className="text-sm text-white font-medium">{sidebar.nodeInfo.fullName}</div>
            <div className="text-xs text-slate-500 mt-2">{t('network.sidebar.publicParticipants', { count: sidebar.nodeInfo.participantCount })}</div>
          </div>
        )}
        {sidebar.type === 'link' && sidebar.entities && (
          <>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              {t('network.sidebar.sharedEntity', { count: sidebar.entities.length })}
            </div>
            {sidebar.entities.map(e => (
              <div key={e.normalisedName} className="rounded-lg border border-[#2B3437] p-3">
                <div className="text-xs font-semibold text-white mb-1.5">{e.displayName}</div>
                {e.regions.map(rid => (
                  <div key={rid} className="flex gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: (REGION_COLORS[rid] ?? '#737C7F') + '25', color: REGION_COLORS[rid] ?? '#737C7F' }}
                    >
                      {rid}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-snug">
                      {e.rolesByRegion[rid] ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Mobile fallback: simple entity list ───────────────────────────────────────

function MobileList({ allData, regions }: { allData: Record<string, EcosystemData>; regions: Region[] }) {
  const { t } = useTranslation('ecosystemMap');
  const crossEntities = buildCrossRegionEntities(allData);
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-4">
        {t('network.mobileList.crossRegionCount', { count: crossEntities.length })}
      </p>
      {crossEntities.map(e => (
        <div key={e.normalisedName} className="rounded-lg border border-[#2B3437] p-3">
          <div className="text-xs font-semibold text-white mb-1.5">{e.displayName}</div>
          <div className="flex flex-wrap gap-1">
            {e.regions.map(rid => {
              const r = regions.find(x => x.id === rid);
              return (
                <span
                  key={rid}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: (REGION_COLORS[rid] ?? '#737C7F') + '25', color: REGION_COLORS[rid] ?? '#737C7F' }}
                >
                  {r?.name ?? rid}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface GlobalNetworkViewProps {
  regions: Region[];
  projectCount: number;
  assetClassCount: number;
}

export default function GlobalNetworkView({ regions, projectCount, assetClassCount }: GlobalNetworkViewProps) {
  const { t } = useTranslation('ecosystemMap');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

  const [allData, setAllData] = useState<Record<string, EcosystemData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState<SidebarState | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Load all region JSON files
  useEffect(() => {
    const active = regions.filter(r => r.status !== 'planned' && r.data_file);
    Promise.all(
      active.map(r =>
        fetch(`/data/ecosystem/${r.data_file}`)
          .then(res => res.json())
          .then((data: EcosystemData) => [r.id, data] as const)
          .catch(() => null),
      ),
    ).then(results => {
      const map: Record<string, EcosystemData> = {};
      for (const r of results) {
        if (r) map[r[0]] = r[1];
      }
      setAllData(map);
      setLoading(false);
    });
  }, [regions]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const closeSidebar = useCallback(() => setSidebar(null), []);

  // Build and render D3 force graph
  useEffect(() => {
    if (!svgRef.current || !allData || loading || isMobile) return;

    const { nodes, links } = buildGraph(regions, allData,
      (id, fallback) => t('shared.regionName.' + id, { defaultValue: fallback }));
    if (nodes.length === 0) return;

    const el = svgRef.current;
    const W = el.clientWidth || 700;
    const H = 480;

    // Cleanup previous simulation
    if (simulationRef.current) simulationRef.current.stop();
    const svg = d3.select(el);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${W} ${H}`);

    // Defs: arrowhead marker
    const defs = svg.append('defs');
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    // Layer order: links → nodes → labels
    const linkGroup = svg.append('g').attr('class', 'links');
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const labelGroup = svg.append('g').attr('class', 'labels');

    const maxWeight = Math.max(...links.map(l => l.weight), 1);

    // Links
    const linkSel = linkGroup
      .selectAll<SVGLineElement, NetworkLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', '#3b3f50')
      .attr('stroke-width', d => 1 + (d.weight / maxWeight) * 4)
      .attr('stroke-opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseenter', function (_, d) {
        d3.select(this).attr('stroke', '#5E5C75').attr('stroke-opacity', 1);
      })
      .on('mouseleave', function (_, d) {
        const srcId = typeof d.source === 'string' ? d.source : (d.source as NetworkNode).id;
        const tgtId = typeof d.target === 'string' ? d.target : (d.target as NetworkNode).id;
        const isActive = sidebar?.type === 'link' && sidebar.title.includes(srcId) && sidebar.title.includes(tgtId);
        d3.select(this).attr('stroke', isActive ? '#5E5C75' : '#3b3f50').attr('stroke-opacity', isActive ? 1 : 0.7);
      })
      .on('click', (_, d) => {
        const src = typeof d.source === 'string' ? d.source : (d.source as NetworkNode).id;
        const tgt = typeof d.target === 'string' ? d.target : (d.target as NetworkNode).id;
        setSidebar({
          type: 'link',
          title: t('network.sidebar.linkTitle', { src, tgt, count: d.weight }),
          entities: d.entities,
        });
      });

    // Link weight labels (only if weight > 1)
    linkGroup
      .selectAll<SVGTextElement, NetworkLink>('text')
      .data(links.filter(l => l.weight > 1))
      .join('text')
      .attr('fill', '#5E5C75')
      .attr('font-size', 9)
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => `${d.weight}`);

    // Nodes
    const nodeSel = nodeGroup
      .selectAll<SVGCircleElement, NetworkNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => 22 + Math.sqrt(d.participantCount) * 1.5)
      .attr('fill', d => d.color + '22')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (_, d) {
        d3.select(this).attr('fill', d.color + '44').attr('stroke-width', 3);
        // highlight connected links
        linkSel
          .attr('stroke', l => {
            const s = typeof l.source === 'string' ? l.source : (l.source as NetworkNode).id;
            const t = typeof l.target === 'string' ? l.target : (l.target as NetworkNode).id;
            return (s === d.id || t === d.id) ? d.color : '#3b3f50';
          })
          .attr('stroke-opacity', l => {
            const s = typeof l.source === 'string' ? l.source : (l.source as NetworkNode).id;
            const t = typeof l.target === 'string' ? l.target : (l.target as NetworkNode).id;
            return (s === d.id || t === d.id) ? 1 : 0.2;
          });
      })
      .on('mouseleave', function (_, d) {
        d3.select(this).attr('fill', d.color + '22').attr('stroke-width', 2);
        linkSel.attr('stroke', '#3b3f50').attr('stroke-opacity', 0.7);
      })
      .on('click', (_, d) => {
        setSidebar({
          type: 'node',
          title: `${d.fullName} (${d.id})`,
          nodeInfo: { fullName: d.fullName, participantCount: d.participantCount, color: d.color },
        });
      });

    // Node labels
    const labelSel = labelGroup
      .selectAll<SVGTextElement, NetworkNode>('text')
      .data(nodes)
      .join('text')
      .attr('fill', d => d.color)
      .attr('font-size', 11)
      .attr('font-weight', 700)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('pointer-events', 'none')
      .text(d => d.label);

    // Participant-count sub-labels
    const sublabelSel = labelGroup
      .selectAll<SVGTextElement, NetworkNode>('text.sub')
      .data(nodes)
      .join('text')
      .attr('class', 'sub')
      .attr('fill', '#737C7F')
      .attr('font-size', 8)
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => `${d.participantCount}p`);

    // D3 force simulation
    const sim = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links).id(d => d.id).strength(0.3).distance(170))
      .force('charge', d3.forceManyBody<NetworkNode>().strength(-600))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide<NetworkNode>(d => 30 + Math.sqrt(d.participantCount) * 1.5))
      .on('tick', () => {
        linkSel
          .attr('x1', d => Math.max(30, Math.min(W - 30, (d.source as NetworkNode).x!)))
          .attr('y1', d => Math.max(30, Math.min(H - 30, (d.source as NetworkNode).y!)))
          .attr('x2', d => Math.max(30, Math.min(W - 30, (d.target as NetworkNode).x!)))
          .attr('y2', d => Math.max(30, Math.min(H - 30, (d.target as NetworkNode).y!)));

        // mid-link labels
        linkGroup.selectAll<SVGTextElement, NetworkLink>('text')
          .attr('x', d => {
            const sx = Math.max(30, Math.min(W - 30, (d.source as NetworkNode).x!));
            const tx = Math.max(30, Math.min(W - 30, (d.target as NetworkNode).x!));
            return (sx + tx) / 2;
          })
          .attr('y', d => {
            const sy = Math.max(30, Math.min(H - 30, (d.source as NetworkNode).y!));
            const ty = Math.max(30, Math.min(H - 30, (d.target as NetworkNode).y!));
            return (sy + ty) / 2 - 5;
          });

        nodeSel
          .attr('cx', d => { d.x = Math.max(40, Math.min(W - 40, d.x!)); return d.x; })
          .attr('cy', d => { d.y = Math.max(40, Math.min(H - 40, d.y!)); return d.y; });

        labelSel
          .attr('x', d => d.x!)
          .attr('y', d => d.y! - 4);

        sublabelSel
          .attr('x', d => d.x!)
          .attr('y', d => d.y! + 8);
      });

    // Drag behaviour
    const drag = d3.drag<SVGCircleElement, NetworkNode>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = Math.max(40, Math.min(W - 40, event.x));
        d.fy = Math.max(40, Math.min(H - 40, event.y));
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeSel.call(drag as d3.DragBehavior<SVGCircleElement, NetworkNode, NetworkNode | d3.SubjectPosition>);
    simulationRef.current = sim;

    return () => { sim.stop(); };
  }, [allData, loading, isMobile, regions]);

  // Cross-region entity count (for hero banner sub-line)
  const crossCount = allData ? buildCrossRegionEntities(allData).length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">progress_activity</span>
      </div>
    );
  }

  if (!allData) {
    return <div className="p-8 text-slate-400">{t('network.unavailable')}</div>;
  }

  const activeRegionCount = Object.keys(allData).length;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className="rounded-xl border border-[#2B3437] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #0D0F18 0%, #16163a 100%)' }}
      >
        <div>
          <div className="text-xs font-bold text-[#5E5C75] uppercase tracking-widest mb-1.5">
            {t('network.heroBanner.eyebrow')}
          </div>
          <div className="text-lg font-bold text-white font-headline">
            <span className="text-[#ef4444]">{activeRegionCount}</span>
            <span className="text-slate-400 mx-1.5">{t('network.heroBanner.regions')}</span>
            <span className="text-[#737C7F] mx-1">×</span>
            <span className="text-[#f97316] mx-1.5">{assetClassCount}</span>
            <span className="text-slate-400 mr-1.5">{t('network.heroBanner.assetClasses')}</span>
            <span className="text-[#737C7F] mx-1">×</span>
            <span className="text-[#3b82f6] mx-1.5">{projectCount}</span>
            <span className="text-slate-400">{t('network.heroBanner.projects')}</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {t('network.heroBanner.attribution')}
          </div>
        </div>
        <div className="flex gap-4 shrink-0">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{crossCount}</div>
            <div className="text-[10px] text-slate-500">{t('network.heroBanner.crossRegionEntities')}</div>
          </div>
        </div>
      </div>

      {/* Graph area */}
      <div className="rounded-xl border border-[#2B3437] bg-[#0D0F18] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#2B3437] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5E5C75]">hub</span>
          <span className="text-sm font-bold text-white">{t('network.graph.title')}</span>
          <span className="ml-auto text-[10px] text-slate-600">
            {t('network.graph.instruction')}
          </span>
        </div>

        {isMobile ? (
          <div className="p-4">
            <MobileList allData={allData} regions={regions} />
          </div>
        ) : (
          <div ref={containerRef} className="relative" style={{ height: '480px' }}>
            <svg ref={svgRef} className="w-full h-full" />
            {sidebar && (
              <SidePanel sidebar={sidebar} onClose={closeSidebar} />
            )}
          </div>
        )}
      </div>

      {/* Region colour legend */}
      <div className="flex flex-wrap gap-3">
        {regions
          .filter(r => r.status !== 'planned' && allData[r.id])
          .map(r => (
            <div key={r.id} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: REGION_COLORS[r.id] ?? '#737C7F' }}
              />
              {t('shared.regionName.' + r.id, { defaultValue: r.name })}
            </div>
          ))}
      </div>

      <p className="text-[10px] text-slate-700">
        {t('network.footnote')}
      </p>
    </div>
  );
}
