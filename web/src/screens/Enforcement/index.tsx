import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { EnforcementAction, EnforcementDataset } from '../../types/enforcement';
import rawData from '../../../public/data/enforcement/enforcement.json';
import { Eyebrow } from '../../components/Eyebrow';
import { BigStat, BigStatRibbon } from '../../components/BigStat';

const enforcementData = rawData as unknown as EnforcementDataset;
type Action = EnforcementAction;

const ENFT_STATS = {
  actionsCount:    enforcementData.actions.length,
  regulatorsCount: new Set(enforcementData.actions.map(a => a.regulator)).size,
  penaltyStr:      `$${(enforcementData.actions.reduce((s, a) => s + a.penalty_usd, 0) / 1e9).toFixed(1)}B+`,
  ongoingCount:    enforcementData.actions.filter(a => a.status === 'ongoing').length,
};

const STATUS_COLORS: Record<string, string> = {
  settled:   'bg-[#2E7D32]/10 text-[#2E7D32]',
  closed:    'bg-[#5E5C75]/10 text-[#5E5C75]',
  ongoing:   'bg-[#e09d2b]/10 text-[#e09d2b]',
  dismissed: 'bg-[#9e3f4e]/10 text-[#9e3f4e]',
  appealed:  'bg-[#9e3f4e]/10 text-[#9e3f4e]',
  overturned:'bg-[#2E7D32]/10 text-[#2E7D32]',
};

const ACTION_ICONS: Record<string, string> = {
  charges:    'gavel',
  settlement: 'handshake',
  order:      'policy',
  ban:        'block',
  warning:    'warning',
  investigation: 'search',
};

const REGULATORS = ['All', 'SEC', 'CFTC', 'NYDFS', 'MAS', 'SFC'];
const JURISDICTIONS = ['All', 'US', 'HK', 'SG'];
const STATUSES = ['All', 'ongoing', 'settled', 'closed', 'dismissed'];

function fmt(n: number, note: string | null): string {
  if (n > 0) return '$' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n.toLocaleString());
  return note ?? '—';
}

export default function EnforcementTracker() {
  const [regulator, setRegulator] = useState('All');
  const [jurisdiction, setJurisdiction] = useState('All');
  const [status, setStatus] = useState('All');
  const [rwaOnly, setRwaOnly] = useState(false);

  const filtered = useMemo(() => {
    return [...enforcementData.actions]
      .sort((a, b) => b.action_date.localeCompare(a.action_date))
      .filter(a => {
        if (regulator !== 'All' && a.regulator !== regulator) return false;
        if (jurisdiction !== 'All' && a.jurisdiction !== jurisdiction) return false;
        if (status !== 'All' && a.status !== status) return false;
        if (rwaOnly && !a.rwa_relevant) return false;
        return true;
      });
  }, [regulator, jurisdiction, status, rwaOnly]);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-ed-section-md pb-ed-section-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <Eyebrow>Intelligence · Enforcement Tracker</Eyebrow>
          <h1 className="text-4xl md:text-ed-hero-h1 text-ed-ink mt-ed-section-sm">
            Enforcement Tracker
          </h1>
          <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
            Regulatory and legal actions by SEC, CFTC, SFC, MAS, and other agencies
            against RWA, stablecoin, and tokenized finance entities.
          </p>
        </div>
      </section>

      {/* ── Stats ribbon ──────────────────────────────────────────────────── */}
      <BigStatRibbon cols={4}>
        <BigStat value={ENFT_STATS.actionsCount}    label="Actions tracked" />
        <BigStat value={ENFT_STATS.regulatorsCount} label="Regulators" />
        <BigStat value={ENFT_STATS.penaltyStr}      label="Penalties (partial)" />
        <BigStat value={ENFT_STATS.ongoingCount}    label="Ongoing" valueColor="#e09d2b" />
      </BigStatRibbon>

      {/* Filters */}
      <div className="bg-white border-b border-[#DBE4E7] sticky top-20 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <FilterChips label="Regulator" value={regulator} options={REGULATORS} onChange={setRegulator} />
          <FilterChips label="Jurisdiction" value={jurisdiction} options={JURISDICTIONS} onChange={setJurisdiction} />
          <FilterChips label="Status" value={status} options={STATUSES} onChange={setStatus} />

          <button
            onClick={() => setRwaOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              rwaOnly
                ? 'bg-[#5E5C75] text-white border-[#5E5C75]'
                : 'bg-white text-[#737C7F] border-[#DBE4E7] hover:border-[#5E5C75]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">filter_alt</span>
            RWA-relevant only
          </button>

          <span className="ml-auto text-xs text-[#737C7F]">
            {filtered.length} action{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Action list */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {filtered.length === 0 && (
          <p className="text-sm text-[#737C7F] text-center py-12">No actions match the current filters.</p>
        )}
        {filtered.map(action => (
          <ActionCard key={action.slug} action={action} />
        ))}

        <p className="text-xs text-[#737C7F] text-center pt-4">
          {enforcementData.actions.length} actions on record · updated {enforcementData.updated_at}
        </p>
      </div>
    </div>
  );
}

function FilterChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-[#737C7F]">{label}:</span>
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            value === o
              ? 'bg-[#2B3437] text-white'
              : 'bg-[#F1F4F6] text-[#737C7F] hover:bg-[#DBE4E7]'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

type SourceItem = { label: string; url: string };
function normalizeSource(s: SourceItem | string): SourceItem {
  if (typeof s === 'string') return { label: s, url: s };
  return s;
}

function ActionCard({ action }: { action: Action }) {
  const [open, setOpen] = useState(false);
  const icon = ACTION_ICONS[action.action_type] ?? 'gavel';
  const statusCls = STATUS_COLORS[action.status] ?? 'bg-[#F1F4F6] text-[#737C7F]';

  return (
    <div className="bg-white border border-[#DBE4E7] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-[#EAEFF1] transition-colors"
      >
        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-[#F1F4F6] flex items-center justify-center text-[#5E5C75]">
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#2B3437] bg-[#F1F4F6] px-2 py-0.5 rounded">
              {action.regulator}
            </span>
            <span className="text-xs text-[#737C7F]">{action.jurisdiction}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusCls}`}>
              {action.status}
            </span>
            {action.rwa_relevant && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32]">
                RWA
              </span>
            )}
            <span className="text-xs text-[#737C7F] ml-auto">{action.action_date}</span>
          </div>

          <div className="text-sm font-semibold text-[#2B3437]">{action.target_entity}</div>
          <div className="text-xs text-[#737C7F] mt-0.5 capitalize">
            {action.action_type}
            {action.penalty_usd > 0 || action.penalty_note
              ? ' · ' + fmt(action.penalty_usd, action.penalty_note)
              : ''}
          </div>
        </div>

        <span
          className="material-symbols-outlined text-[18px] text-[#737C7F] shrink-0 mt-1 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#F1F4F6]">
          <p className="mt-4 text-sm text-[#2B3437] leading-relaxed">{action.summary}</p>

          {(action.rarm_layers.length > 0 || action.sarm_blocks.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {action.rarm_layers.map(l => (
                <span key={l} className="text-xs px-2 py-0.5 rounded bg-[#5E5C75]/10 text-[#5E5C75] font-medium capitalize">
                  RARM · {l}
                </span>
              ))}
              {action.sarm_blocks.map(b => (
                <span key={b} className="text-xs px-2 py-0.5 rounded bg-[#2B3437]/10 text-[#2B3437] font-medium capitalize">
                  SARM · {b}
                </span>
              ))}
            </div>
          )}

          {action.lessons.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5E5C75] mb-2">
                Key precedents
              </div>
              <ul className="space-y-1.5">
                {action.lessons.map((l, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[#2B3437] leading-relaxed">
                    <span className="shrink-0 mt-0.5 text-[#5E5C75]">·</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(action.related_incident_slugs.length > 0 || action.related_issuer_slugs.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {action.related_incident_slugs.map(slug => (
                <Link
                  key={slug}
                  to={`/incidents/${slug}`}
                  className="flex items-center gap-1 text-xs text-[#5E5C75] hover:text-[#2B3437] font-medium border border-[#DBE4E7] px-2.5 py-1 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">link</span>
                  Related incident →
                </Link>
              ))}
              {action.related_issuer_slugs.map(slug => (
                <Link
                  key={slug}
                  to={`/licenses/${slug}`}
                  className="flex items-center gap-1 text-xs text-[#5E5C75] hover:text-[#2B3437] font-medium border border-[#DBE4E7] px-2.5 py-1 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">account_balance</span>
                  Same entity in HK Licensing →
                </Link>
              ))}
            </div>
          )}

          {action.sources.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(action.sources as unknown as (SourceItem | string)[]).map((raw, i) => {
                const s = normalizeSource(raw);
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    {s.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
