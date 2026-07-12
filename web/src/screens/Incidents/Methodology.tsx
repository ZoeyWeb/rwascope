import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import type { IncidentSeverity } from '../../types/incidents';
import { SEVERITY_META, SEVERITY_THRESHOLDS, INCIDENT_TYPE_LABELS, INCIDENT_STATUS_META } from '../../utils/incidents';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-[#2B3437] border-b border-[#DBE4E7] pb-2">{title}</h2>
      {children}
    </div>
  );
}

function SeverityChip({ severity }: { severity: IncidentSeverity }) {
  const m = SEVERITY_META[severity];
  const { t } = useTranslation('incidentsMap');
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.dot }} />
      {t(`shared.severity.${severity}`)}
    </span>
  );
}

export default function IncidentsMethodology() {
  const { t } = useTranslation('incidentsMethodology');
  const { t: tMap } = useTranslation('incidentsMap');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#737C7F]">
        <Link to="/incidents" className="hover:text-[#2B3437] transition-colors">{t('breadcrumb.database')}</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#2B3437]">{t('breadcrumb.current')}</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-[#2B3437]">{t('title')}</h1>
        <p className="text-sm text-[#737C7F] mt-2 max-w-2xl">{t('lede')}</p>
      </div>

      {/* 1. Purpose */}
      <Section title={t('sections.purpose.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.purpose.p1')}</p>
          <p>{t('sections.purpose.p2')}</p>
          <p>{t('sections.purpose.p3')}</p>
        </div>
      </Section>

      {/* 2. Inclusion criteria */}
      <Section title={t('sections.inclusionCriteria.title')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FCE4EC] border border-[#F48FB1] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black text-[#9e3f4e] bg-white border border-[#F48FB1]">HK</span>
              <span className="font-bold text-[#9e3f4e] text-sm">{t('sections.inclusionCriteria.hk.title')}</span>
            </div>
            <p className="text-xs text-[#9e3f4e] leading-relaxed">
              <Trans i18nKey="sections.inclusionCriteria.hk.intro" ns="incidentsMethodology" components={{ em: <em /> }} />
            </p>
            <ul className="text-xs text-[#9e3f4e] space-y-1 list-disc list-outside ml-4 leading-relaxed">
              {(t('sections.inclusionCriteria.hk.bullets', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="text-xs text-[#9e3f4e]">{t('sections.inclusionCriteria.hk.note')}</p>
          </div>

          <div className="bg-[#ECEFF1] border border-[#CFD8DC] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black text-[#5E5C75] bg-white border border-[#CFD8DC]">GLOBAL</span>
              <span className="font-bold text-[#5E5C75] text-sm">{t('sections.inclusionCriteria.global.title')}</span>
            </div>
            <p className="text-xs text-[#737C7F] leading-relaxed">
              <Trans i18nKey="sections.inclusionCriteria.global.intro" ns="incidentsMethodology" components={{ em: <em /> }} />
            </p>
            <ul className="text-xs text-[#737C7F] space-y-1 list-disc list-outside ml-4 leading-relaxed">
              {(t('sections.inclusionCriteria.global.bullets', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="text-xs text-[#737C7F]">{t('sections.inclusionCriteria.global.note')}</p>
          </div>
        </div>
      </Section>

      {/* 3. Severity rubric */}
      <Section title={t('sections.severityRubric.title')}>
        <p className="text-sm text-[#737C7F]">{t('sections.severityRubric.intro')}</p>
        <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-32">{t('sections.severityRubric.tableHeaders.level')}</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">{t('sections.severityRubric.tableHeaders.threshold')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F6]">
              {SEVERITY_THRESHOLDS.map(row => (
                <tr key={row.level}>
                  <td className="px-4 py-3"><SeverityChip severity={row.level} /></td>
                  <td className="px-4 py-3 text-sm text-[#737C7F]">{t(`severityThresholds.${row.level}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4. Incident types */}
      <Section title={t('sections.incidentTypes.title')}>
        <div className="divide-y divide-[#F1F4F6] rounded-xl border border-[#DBE4E7] overflow-hidden">
          {([
            'de-pegging',
            'smart-contract-exploit',
            'custody-incident',
            'redemption-failure',
            'regulatory-action',
            'governance-failure',
            'bank-failure-spillover',
            'sanctions',
            'other',
          ] as import('../../types/incidents').IncidentType[]).map((type) => (
            <div key={type} className="px-4 py-3 flex items-baseline gap-3">
              <span className="text-xs font-bold text-[#5E5C75] w-44 shrink-0">{tMap(`shared.type.${type}`)}</span>
              <p className="text-sm text-[#737C7F]">{t(`sections.incidentTypes.definitions.${type}`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Status definitions */}
      <Section title={t('sections.statusDefs.title')}>
        <div className="divide-y divide-[#F1F4F6] rounded-xl border border-[#DBE4E7] overflow-hidden">
          {Object.entries(INCIDENT_STATUS_META).map(([key, meta]) => (
            <div key={key} className="px-4 py-3 flex items-center gap-4">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap w-36 justify-center"
                style={{ color: meta.color, background: meta.bg }}
              >
                {tMap(`shared.status.${key === 'under-investigation' ? 'underInvestigation' : key}`)}
              </span>
              <p className="text-sm text-[#737C7F]">
                {t(`sections.statusDefs.definitions.${key}`)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Source hierarchy */}
      <Section title={t('sections.sourceHierarchy.title')}>
        <p className="text-sm text-[#737C7F]">{t('sections.sourceHierarchy.intro')}</p>
        <div className="rounded-xl border border-[#DBE4E7] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFB] border-b border-[#DBE4E7]">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-8">{t('sections.sourceHierarchy.tableHeaders.tier')}</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F] w-44">{t('sections.sourceHierarchy.tableHeaders.type')}</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-[#737C7F]">{t('sections.sourceHierarchy.tableHeaders.examples')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F6]">
              {(['1', '2', '3', '4', '5'] as const).map((tier, i) => {
                const sourceTypeKeys = ['regulatory-filing', 'court-record', 'official-statement', 'major-media', 'industry-media'] as const;
                return (
                  <tr key={tier}>
                    <td className="px-4 py-3 font-black text-[#5E5C75]">{tier}</td>
                    <td className="px-4 py-3 font-bold text-[#2B3437] text-xs">{tMap(`shared.sourceType.${sourceTypeKeys[i]}`)}</td>
                    <td className="px-4 py-3 text-xs text-[#737C7F]">{t(`sections.sourceHierarchy.tierExamples.${tier}`)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 7. Update policy */}
      <Section title={t('sections.updatePolicy.title')}>
        <div className="space-y-3 text-sm text-[#737C7F] leading-relaxed">
          <p>{t('sections.updatePolicy.p1')}</p>
          <p>{t('sections.updatePolicy.p2')}</p>
          <p>{t('sections.updatePolicy.p3')}</p>
        </div>
      </Section>

      {/* 8. What this database does NOT do */}
      <Section title={t('sections.scopeLimitations.title')}>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-amber-900">{t('sections.scopeLimitations.header')}</p>
          <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-outside ml-4 leading-relaxed">
            {(t('sections.scopeLimitations.bullets', { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 9. Submit */}
      <Section title={t('sections.submissions.title')}>
        <p className="text-sm text-[#737C7F] leading-relaxed">
          <Trans
            i18nKey="sections.submissions.body"
            ns="incidentsMethodology"
            components={{
              email: <a href="mailto:research@rwa-index.com" className="text-[#5E5C75] underline hover:text-[#2B3437]" />,
            }}
          />
        </p>
      </Section>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DBE4E7]">
        <Link to="/incidents" className="flex items-center gap-1.5 text-sm text-[#5E5C75] hover:text-[#2B3437] transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('nav.backLink')}
        </Link>
        <span className="text-xs text-[#737C7F]">{t('nav.version')}</span>
      </div>
    </div>
  );
}
