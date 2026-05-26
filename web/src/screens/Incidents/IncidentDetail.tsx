import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Incident, IncidentSeverity, IncidentScope, IncidentStatus, IncidentSource } from '../../types/incidents';
import {
  SEVERITY_META, INCIDENT_STATUS_META, SCOPE_META,
  INCIDENT_TYPE_LABELS, INCIDENT_ASSET_LABELS, SOURCE_TYPE_LABELS, formatLossUsd,
} from '../../utils/incidents';
import DisclaimerBanner from '../../components/DisclaimerBanner';

// ── Primitive badges ──────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const m = SEVERITY_META[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: IncidentScope }) {
  const m = SCOPE_META[scope];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tracking-wide"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const m = INCIDENT_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ id, title, icon, children }: { id?: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white rounded-xl border border-[#DBE4E7] p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#5E5C75]">{icon}</span>
        <h2 className="text-base font-black text-[#2B3437]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-[#F1F4F6] last:border-0">
      <span className="text-xs uppercase tracking-widest font-bold text-[#737C7F] sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-[#2B3437] flex-1">{value}</span>
    </div>
  );
}

// ── Cite-this box ─────────────────────────────────────────────────────────────

function CiteBox({ incident }: { incident: Incident }) {
  const [copied, setCopied] = useState(false);
  const url = `https://rwa-index.com/incidents/${incident.slug}`;
  const citation = `RWA-Index. (${incident.lastUpdatedAt.slice(0, 4)}). ${incident.title}. Tokenization Incident Database. Retrieved ${new Date().toISOString().slice(0, 10)}, from ${url}`;

  const copy = () => {
    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#F8FAFB] rounded-lg border border-[#DBE4E7] p-3 space-y-2">
      <div className="text-xs font-bold text-[#737C7F] uppercase tracking-wider">Cite this entry</div>
      <p className="text-xs text-[#737C7F] leading-relaxed font-mono break-all">{citation}</p>
      <button
        onClick={copy}
        className="flex items-center gap-1 text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors font-bold"
      >
        <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
        {copied ? 'Copied!' : 'Copy citation'}
      </button>
    </div>
  );
}

// ── Source list item ──────────────────────────────────────────────────────────

function SourceItem({ src, index }: { src: IncidentSource; index: number }) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span className="text-[#5E5C75] font-bold shrink-0">[{index + 1}]</span>
      <span>
        <a
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#5E5C75] underline hover:text-[#2B3437] break-all"
        >
          {src.title}
          <span className="material-symbols-outlined text-xs ml-0.5 align-middle">open_in_new</span>
        </a>
        {'. '}
        <em>{src.publication}</em>
        {src.date ? `, ${src.date}` : ''}.
        {' '}
        <span className="text-xs text-[#737C7F] rounded px-1 py-0.5 bg-[#F1F4F6]">
          {SOURCE_TYPE_LABELS[src.type]}
        </span>
      </span>
    </li>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function IncidentDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch('/data/incidents/incidents.json')
      .then(r => r.json())
      .then((data: Incident[]) => {
        setAllIncidents(data);
        const found = data.find(i => i.slug === slug);
        if (found) setIncident(found);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#5E5C75]">progress_activity</span>
    </div>
  );

  if (notFound || !incident) return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <div className="text-4xl mb-4">🔍</div>
      <h1 className="text-xl font-black text-[#2B3437] mb-2">Incident not found</h1>
      <p className="text-sm text-[#737C7F] mb-6">No incident with slug "{slug}" exists in the database.</p>
      <Link to="/incidents" className="text-[#5E5C75] underline text-sm">← Back to Incident Database</Link>
    </div>
  );

  const relatedIncidents = allIncidents.filter(i => incident.relatedIncidentSlugs.includes(i.slug));
  const narrativeParas = incident.narrative.split('\n\n').filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/incidents" className="hover:text-[#2B3437] transition-colors">Incident Database</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437] truncate max-w-xs">{incident.title}</span>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6 min-w-0">

          {/* Section 1: Header */}
          <div className="bg-white rounded-xl border border-[#DBE4E7] p-5 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={incident.severity} />
              <ScopeBadge scope={incident.scope} />
              <StatusBadge status={incident.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#2B3437] leading-tight">{incident.title}</h1>
            <p className="text-sm text-[#737C7F] leading-relaxed">{incident.summary}</p>
            {incident.hkRelevance && (
              <div className="flex items-start gap-2 bg-[#FCE4EC] rounded-lg px-3 py-2 border border-[#F48FB1]">
                <span className="material-symbols-outlined text-[#9e3f4e] text-sm shrink-0 mt-0.5">location_on</span>
                <p className="text-xs text-[#9e3f4e]"><strong>HK relevance:</strong> {incident.hkRelevance}</p>
              </div>
            )}
          </div>

          {/* Section 2: Quick Facts */}
          <Section id="facts" title="Quick Facts" icon="fact_check">
            <InfoRow label="Date" value={incident.endDate ? `${incident.date} – ${incident.endDate}` : incident.date} />
            <InfoRow label="Primary Entity" value={<strong>{incident.primaryEntity}</strong>} />
            {incident.issuerOrOperator && <InfoRow label="Issuer / Operator" value={incident.issuerOrOperator} />}
            <InfoRow label="Asset Type" value={INCIDENT_ASSET_LABELS[incident.assetClass]} />
            <InfoRow label="Incident Type" value={INCIDENT_TYPE_LABELS[incident.type]} />
            <InfoRow
              label="Est. Loss (USD)"
              value={incident.estimatedLossUsd
                ? <><strong className="text-[#ea580c]">{formatLossUsd(incident.estimatedLossUsd)}</strong>{' '}
                    {incident.estimatedLossNote && <span className="text-xs text-[#737C7F]">— {incident.estimatedLossNote}</span>}
                  </>
                : <span className="text-[#737C7F] text-xs">{incident.estimatedLossNote ?? '—'}</span>
              }
            />
            <InfoRow label="Affected Parties" value={incident.affectedParties.join(', ')} />
            <InfoRow label="Jurisdictions" value={incident.jurisdictions.join(', ')} />
            {incident.hkRelevance && <InfoRow label="HK Nexus" value={incident.hkRelevance} />}
            <InfoRow
              label="Lead Regulator"
              value={incident.regulatoryResponse.length > 0
                ? incident.regulatoryResponse[0].regulator
                : '—'
              }
            />
          </Section>

          {/* Section 3: Timeline */}
          {incident.timeline.length > 0 && (
            <Section id="timeline" title="Timeline" icon="timeline">
              <div className="relative pl-5 border-l-2 border-[#DBE4E7] space-y-4">
                {incident.timeline.map((entry, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white bg-[#5E5C75]" />
                    <div className="font-mono text-xs text-[#5E5C75] mb-0.5">{entry.date}</div>
                    <p className="text-sm text-[#737C7F] leading-relaxed">
                      {entry.event}
                      {entry.sourceUrl && (
                        <a
                          href={entry.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-[#5E5C75] hover:text-[#2B3437]"
                        >
                          <span className="material-symbols-outlined text-xs align-middle">open_in_new</span>
                        </a>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Section 4: Narrative */}
          <Section id="narrative" title="What Happened" icon="description">
            <div className="space-y-3">
              {narrativeParas.map((para, i) => (
                <p key={i} className="text-sm text-[#737C7F] leading-relaxed">{para}</p>
              ))}
            </div>
          </Section>

          {/* Section 5: Regulatory Response */}
          {incident.regulatoryResponse.length > 0 && (
            <Section id="regulatory" title="Regulatory Response" icon="gavel">
              <div className="space-y-4">
                {incident.regulatoryResponse.map((r, i) => (
                  <div key={i} className="border border-[#DBE4E7] rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#2B3437] text-sm">{r.regulator}</div>
                        <div className="text-xs text-[#737C7F]">{r.jurisdiction} · {r.date}</div>
                      </div>
                      {r.sourceUrl && (
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#5E5C75] hover:text-[#2B3437] shrink-0"
                        >
                          Source
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-[#737C7F]"><strong>Action:</strong> {r.actionType}</p>
                    <p className="text-xs text-[#737C7F]"><strong>Outcome:</strong> {r.outcome}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Section 6: Framework Mapping */}
          {(incident.frameworkMapping.sarm || incident.frameworkMapping.rarm) && (
            <Section id="framework" title="Framework Mapping" icon="account_tree">
              <p className="text-xs text-[#737C7F] bg-[#F8FAFB] rounded-lg px-3 py-2 border border-[#DBE4E7]">
                Each incident is mapped to the SARM (stablecoin) and/or RARM (RWA) analytical frameworks.
                This is the academic contribution of this database: linking real events to structured risk dimensions.
              </p>

              {incident.frameworkMapping.sarm && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-[#2B3437]">SARM Dimensions Implicated</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'reserveImplicated', label: 'Reserve Quality' },
                      { key: 'redemptionImplicated', label: 'Redemption Mechanics' },
                      { key: 'governanceImplicated', label: 'Governance' },
                    ].map(({ key, label }) => {
                      const implicated = incident.frameworkMapping.sarm![key as keyof typeof incident.frameworkMapping.sarm] as boolean;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold border"
                          style={{
                            color: implicated ? '#9e3f4e' : '#737C7F',
                            background: implicated ? '#FCE4EC' : '#F9FAFB',
                            borderColor: implicated ? '#F48FB1' : '#E5E7EB',
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {implicated ? 'warning' : 'check_circle'}
                          </span>
                          {label}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-[#737C7F] leading-relaxed">{incident.frameworkMapping.sarm.explanation}</p>
                </div>
              )}

              {incident.frameworkMapping.rarm && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-[#2B3437]">RARM Layers Implicated</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'legalJurisdictional', label: 'Legal & Jurisdictional' },
                      { key: 'assetValuationOracles', label: 'Asset Valuation & Oracles' },
                      { key: 'custodyAssetControl', label: 'Custody & Asset Control' },
                      { key: 'kycAmlPermissioning', label: 'KYC/AML & Permissioning' },
                      { key: 'secondaryMarketLiquidity', label: 'Secondary Market Liquidity' },
                      { key: 'settlementFinality', label: 'Settlement Finality' },
                    ].map(({ key, label }) => {
                      const implicated = incident.frameworkMapping.rarm![key as keyof typeof incident.frameworkMapping.rarm] as boolean;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold border"
                          style={{
                            color: implicated ? '#9e3f4e' : '#737C7F',
                            background: implicated ? '#FCE4EC' : '#F9FAFB',
                            borderColor: implicated ? '#F48FB1' : '#E5E7EB',
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {implicated ? 'warning' : 'check_circle'}
                          </span>
                          <span className="leading-tight">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-[#737C7F] leading-relaxed">{incident.frameworkMapping.rarm.explanation}</p>
                </div>
              )}
            </Section>
          )}

          {/* Section 7: Lessons */}
          <Section id="lessons" title="Lessons &amp; Patterns" icon="lightbulb">
            <p className="text-sm text-[#737C7F] leading-relaxed">{incident.lessons}</p>
            {relatedIncidents.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#737C7F] uppercase tracking-wider">Related incidents</div>
                <div className="flex flex-col gap-2">
                  {relatedIncidents.map(r => (
                    <Link
                      key={r.slug}
                      to={`/incidents/${r.slug}`}
                      className="flex items-center gap-2 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                      {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Section 8: Sources */}
          <Section id="sources" title="Sources &amp; Citations" icon="menu_book">
            <ol className="space-y-2 list-none">
              {incident.sources.map((src, i) => (
                <SourceItem key={i} src={src} index={i} />
              ))}
            </ol>
          </Section>

          {/* Section 9: Disclaimer */}
          <div className="bg-[#F8FAFB] rounded-xl border border-[#DBE4E7] p-5 space-y-2">
            <div className="text-xs font-bold text-[#737C7F] uppercase tracking-wider">Disclaimer</div>
            <p className="text-xs text-[#737C7F] leading-relaxed">
              This entry is compiled from publicly available information including regulatory filings, court records,
              official statements, and media reporting. RWA-Index does not allege wrongdoing beyond what is
              documented in cited public sources. Where investigations are ongoing, the entry reflects publicly
              known information at last update date.{' '}
              <strong>Last updated: {incident.lastUpdatedAt}.</strong>
            </p>
            {incident.revisionNotes && incident.revisionNotes.length > 0 && (
              <div className="pt-2 border-t border-[#DBE4E7] space-y-1">
                <div className="text-xs font-bold text-[#737C7F]">Revision notes:</div>
                {incident.revisionNotes.map((n, i) => (
                  <p key={i} className="text-xs text-[#737C7F]">{n.date}: {n.note}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">

          {/* Status + severity */}
          <div className="bg-white rounded-xl border border-[#DBE4E7] p-4 space-y-3">
            <div className="flex flex-col gap-2">
              <SeverityBadge severity={incident.severity} />
              <ScopeBadge scope={incident.scope} />
              <StatusBadge status={incident.status} />
            </div>
            {incident.estimatedLossUsd && (
              <div>
                <div className="text-xs text-[#737C7F] font-bold uppercase tracking-wider mb-1">Estimated Loss</div>
                <div className="text-2xl font-black" style={{ color: SEVERITY_META[incident.severity].color }}>
                  {formatLossUsd(incident.estimatedLossUsd)}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-[#737C7F] font-bold uppercase tracking-wider mb-1">Date</div>
              <div className="text-sm font-bold text-[#2B3437]">
                {incident.date}{incident.endDate ? ` – ${incident.endDate}` : ''}
              </div>
            </div>
          </div>

          {/* Entities */}
          <div className="bg-white rounded-xl border border-[#DBE4E7] p-4 space-y-2">
            <div className="text-xs text-[#737C7F] font-bold uppercase tracking-wider">Primary Entity</div>
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#EAEFF1] text-xs text-[#2B3437] font-bold">
                {incident.primaryEntity}
              </span>
            </div>
            {incident.issuerOrOperator && (
              <>
                <div className="text-xs text-[#737C7F] font-bold uppercase tracking-wider pt-1">Issuer / Operator</div>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#EAEFF1] text-xs text-[#2B3437]">
                  {incident.issuerOrOperator}
                </span>
              </>
            )}
          </div>

          {/* Jurisdictions */}
          <div className="bg-white rounded-xl border border-[#DBE4E7] p-4 space-y-2">
            <div className="text-xs text-[#737C7F] font-bold uppercase tracking-wider">Jurisdictions</div>
            <div className="flex flex-wrap gap-1">
              {incident.jurisdictions.map(j => (
                <span key={j} className="inline-flex items-center px-2 py-0.5 rounded bg-[#EAEFF1] text-xs font-bold text-[#5E5C75]">{j}</span>
              ))}
            </div>
          </div>

          {/* Cross-references to Licenses */}
          {incident.relatedIssuerSlugs.length > 0 && (
            <div className="bg-white rounded-xl border border-[#DBE4E7] p-4 space-y-2">
              <div className="text-xs text-[#737C7F] font-bold uppercase tracking-wider">Related Issuers</div>
              {incident.relatedIssuerSlugs.map(s => (
                <Link
                  key={s}
                  to={`/licenses/${s}`}
                  className="flex items-center gap-1.5 text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  Licence profile: {s}
                </Link>
              ))}
            </div>
          )}

          {/* Related incidents */}
          {relatedIncidents.length > 0 && (
            <div className="bg-white rounded-xl border border-[#DBE4E7] p-4 space-y-2">
              <div className="text-xs text-[#737C7F] font-bold uppercase tracking-wider">Related Incidents</div>
              {relatedIncidents.map(r => (
                <Link
                  key={r.slug}
                  to={`/incidents/${r.slug}`}
                  className="flex items-start gap-1.5 text-xs text-[#5E5C75] hover:text-[#2B3437] transition-colors leading-tight"
                >
                  <span className="material-symbols-outlined text-sm shrink-0">arrow_forward</span>
                  {r.title}
                </Link>
              ))}
            </div>
          )}

          {/* Cite this entry */}
          <CiteBox incident={incident} />

          {/* Methodology link */}
          <Link
            to="/incidents/methodology"
            className="flex items-center gap-1.5 text-xs text-[#737C7F] hover:text-[#5E5C75] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">info</span>
            Inclusion & severity methodology
          </Link>
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link to="/incidents" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          All incidents
        </Link>
        <Link to="/incidents/methodology" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          Methodology
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
