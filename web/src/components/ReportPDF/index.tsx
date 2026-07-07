/**
 * ReportPDF — @react-pdf/renderer document + download helper.
 *
 * This file is ONLY imported dynamically (via import()) when the user clicks
 * "Download PDF", so @react-pdf/renderer never loads in the main bundle.
 *
 * Usage:
 *   const { generateReportPDF } = await import('../../components/ReportPDF');
 *   await generateReportPDF(report, issuers, incidents, assets);
 */

import {
  Document, Page, Text, View, StyleSheet, pdf, Link as PdfLink,
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import type { Report } from '../../types/reports';
import type { Issuer } from '../../types/licenses';
import type { Incident } from '../../types/incidents';
import type { Asset } from '../../types/assets';
import {
  aggregateLicensesData,
  aggregateIncidentsData,
  aggregateAssetsData,
  formatTvlM,
} from '../../utils/reports';
import { SARM_DIMENSION_KEYS } from '../../utils/sarm';
import { RARM_LAYER_KEYS, ASSET_CATEGORY_LABELS } from '../../utils/rarm';

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2B3437',
    lineHeight: 1.5,
  },
  coverPage: {
    backgroundColor: '#1A1A2E',
    paddingTop: 80,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
  },
  // Cover
  coverBrand: { fontSize: 11, color: '#9aa0a6', letterSpacing: 2, marginBottom: 48 },
  coverQuarter: { fontSize: 11, color: '#9aa0a6', marginBottom: 8 },
  coverTitle: { fontSize: 24, color: '#ffffff', fontFamily: 'Helvetica-Bold', lineHeight: 1.3, marginBottom: 20 },
  coverAbstract: { fontSize: 10, color: '#b0b8c1', lineHeight: 1.6, marginBottom: 40 },
  coverMeta: { fontSize: 9, color: '#6b7280', marginBottom: 4 },
  coverDisclaimer: {
    marginTop: 'auto',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#2B3437',
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  // TOC
  tocTitle: { fontSize: 16, color: '#2B3437', fontFamily: 'Helvetica-Bold', marginBottom: 24 },
  tocRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  tocLabel: { fontSize: 10, color: '#2B3437', flex: 1 },
  tocDots: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#DBE4E7', borderBottomStyle: 'dotted', marginHorizontal: 6, marginBottom: 3 },
  tocPage: { fontSize: 10, color: '#737C7F', width: 20, textAlign: 'right' },
  // Sections
  sectionTitle: { fontSize: 14, color: '#1A1A2E', fontFamily: 'Helvetica-Bold', marginBottom: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#DBE4E7' },
  subheading: { fontSize: 11, color: '#1A1A2E', fontFamily: 'Helvetica-Bold', marginTop: 12, marginBottom: 4 },
  body: { fontSize: 10, color: '#2B3437', lineHeight: 1.6, marginBottom: 6 },
  placeholder: { fontSize: 10, color: '#737C7F', fontStyle: 'italic', marginBottom: 6 },
  // Stats table
  statsRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  statBox: { flex: 1, borderWidth: 1, borderColor: '#DBE4E7', borderRadius: 4, padding: 8 },
  statLabel: { fontSize: 8, color: '#737C7F', marginBottom: 2 },
  statValue: { fontSize: 14, color: '#1A1A2E', fontFamily: 'Helvetica-Bold' },
  // Data table
  table: { marginTop: 8, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F1F4F6', borderBottomWidth: 1, borderBottomColor: '#DBE4E7', paddingVertical: 4, paddingHorizontal: 4 },
  tableHeaderCell: { fontSize: 8, color: '#737C7F', fontFamily: 'Helvetica-Bold', flex: 1 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F4F6', paddingVertical: 4, paddingHorizontal: 4 },
  tableCell: { fontSize: 9, color: '#2B3437', flex: 1 },
  // Signal dot
  signalDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4, marginTop: 1 },
  signalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  // Footer
  footer: {
    position: 'absolute', bottom: 28, left: 56, right: 56,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { fontSize: 8, color: '#b0b8c1' },
  // Citations
  citationItem: { flexDirection: 'row', marginBottom: 6 },
  citationNumber: { fontSize: 9, color: '#737C7F', width: 20 },
  citationText: { fontSize: 9, color: '#2B3437', flex: 1, lineHeight: 1.5 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripBold(text: string) {
  return text.replace(/\*\*/g, '');
}

function isPreviewPara(para: string) {
  return para.trim().startsWith('[PREVIEW');
}

function isBoldHeading(para: string) {
  return /^\*\*(.+)\*\*$/.test(para.trim());
}

function renderPdfNarrative(narrative: string) {
  return narrative.split('\n\n').map((para, i) => {
    if (isBoldHeading(para)) {
      return (
        <Text key={i} style={s.subheading}>
          {stripBold(para.trim())}
        </Text>
      );
    }
    if (isPreviewPara(para)) {
      return <Text key={i} style={s.placeholder}>{para.trim()}</Text>;
    }
    return <Text key={i} style={s.body}>{stripBold(para.trim())}</Text>;
  });
}

// ── Page number component workaround ─────────────────────────────────────────

function PageFooter({ title }: { title: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{title}</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

// ── Auto section content (PDF — data tables instead of charts) ────────────────

function LicensesPdfSection({ issuers }: { issuers: Issuer[] }) {
  const data = aggregateLicensesData(issuers);
  return (
    <View>
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statLabel}>Total Applicants</Text>
          <Text style={s.statValue}>{data.totalApplicants}</Text>
        </View>
        {Object.entries(data.byStatus).map(([k, v]) => (
          <View key={k} style={s.statBox}>
            <Text style={s.statLabel}>{k.replace(/_/g, ' ')}</Text>
            <Text style={s.statValue}>{v}</Text>
          </View>
        ))}
      </View>

      <Text style={s.subheading}>SARM Signal Distribution</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { flex: 2 }]}>Dimension</Text>
          <Text style={s.tableHeaderCell}>Green</Text>
          <Text style={s.tableHeaderCell}>Yellow</Text>
          <Text style={s.tableHeaderCell}>Red</Text>
          <Text style={s.tableHeaderCell}>Gray</Text>
        </View>
        {SARM_DIMENSION_KEYS.map(dim => {
          const dist = data.sarmSignalDistribution[dim] ?? {};
          return (
            <View key={dim} style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 2 }]}>
                {dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
              <Text style={s.tableCell}>{dist.green ?? 0}</Text>
              <Text style={s.tableCell}>{dist.yellow ?? 0}</Text>
              <Text style={s.tableCell}>{dist.red ?? 0}</Text>
              <Text style={s.tableCell}>{dist.gray ?? 0}</Text>
            </View>
          );
        })}
      </View>
      <Text style={s.placeholder}>
        Gray = insufficient public data; not a negative signal. Assessments based on public disclosures only.
      </Text>
    </View>
  );
}

function AssetsPdfSection({ assets, rarmLayerLabels }: { assets: Asset[]; rarmLayerLabels: Record<string, string> }) {
  const data = aggregateAssetsData(assets);
  return (
    <View>
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statLabel}>Profiled Assets</Text>
          <Text style={s.statValue}>{data.totalAssets}</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statLabel}>Total TVL (est.)</Text>
          <Text style={s.statValue}>{formatTvlM(data.totalTvlUsd)}</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statLabel}>Categories</Text>
          <Text style={s.statValue}>{Object.keys(data.byCategory).length}</Text>
        </View>
      </View>

      <Text style={s.subheading}>TVL by Category</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { flex: 2 }]}>Category</Text>
          <Text style={s.tableHeaderCell}>Assets</Text>
          <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>TVL (est.)</Text>
        </View>
        {Object.entries(data.byCategory).map(([cat, v]) => (
          <View key={cat} style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 2 }]}>{ASSET_CATEGORY_LABELS[cat] ?? cat}</Text>
            <Text style={s.tableCell}>{v.count}</Text>
            <Text style={[s.tableCell, { flex: 1.5 }]}>{formatTvlM(v.tvlUsd)}</Text>
          </View>
        ))}
      </View>

      <Text style={s.subheading}>RARM Layer Signal Distribution</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { flex: 2 }]}>Layer</Text>
          <Text style={s.tableHeaderCell}>Low Risk</Text>
          <Text style={s.tableHeaderCell}>Moderate</Text>
          <Text style={s.tableHeaderCell}>Elevated</Text>
          <Text style={s.tableHeaderCell}>Insuff. Data</Text>
        </View>
        {RARM_LAYER_KEYS.map(key => {
          const dist = data.layerSignalDistribution[key] ?? {};
          return (
            <View key={key} style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 2 }]}>{rarmLayerLabels[key]}</Text>
              <Text style={s.tableCell}>{dist.green ?? 0}</Text>
              <Text style={s.tableCell}>{dist.yellow ?? 0}</Text>
              <Text style={s.tableCell}>{dist.red ?? 0}</Text>
              <Text style={s.tableCell}>{dist.gray ?? 0}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function IncidentsPdfSection({
  incidents, periodStart, periodEnd,
}: { incidents: Incident[]; periodStart: string; periodEnd: string }) {
  const data = aggregateIncidentsData(incidents, periodStart, periodEnd);
  return (
    <View>
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statLabel}>In Period</Text>
          <Text style={s.statValue}>{data.totalInPeriod}</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statLabel}>All-Time Total</Text>
          <Text style={s.statValue}>{data.totalAllTime}</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statLabel}>HK-Related (all-time)</Text>
          <Text style={s.statValue}>{incidents.filter(i => i.scope === 'hk-related').length}</Text>
        </View>
      </View>

      {data.totalInPeriod === 0 && (
        <Text style={s.placeholder}>
          No incidents meeting inclusion thresholds were recorded in the reporting period.
          All-time distributions shown below for context.
        </Text>
      )}

      <Text style={s.subheading}>All-Time Severity Distribution</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { flex: 2 }]}>Severity</Text>
          <Text style={s.tableHeaderCell}>All-Time</Text>
          <Text style={s.tableHeaderCell}>In Period</Text>
        </View>
        {['critical', 'high', 'medium', 'low'].map(sev => (
          <View key={sev} style={s.tableRow}>
            <View style={[s.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
              <View style={[s.signalDot, {
                backgroundColor: { critical: '#9e3f4e', high: '#e09d2b', medium: '#5E5C75', low: '#737C7F' }[sev] ?? '#737C7F',
              }]} />
              <Text>{sev.charAt(0).toUpperCase() + sev.slice(1)}</Text>
            </View>
            <Text style={s.tableCell}>{data.allTimeBySeverity[sev] ?? 0}</Text>
            <Text style={s.tableCell}>{data.bySeverity[sev] ?? 0}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── PDF Document ──────────────────────────────────────────────────────────────

interface ReportDocProps {
  report: Report;
  issuers: Issuer[];
  incidents: Incident[];
  assets: Asset[];
  rarmLayerLabels: Record<string, string>;
}

function ReportDocument({ report, issuers, incidents, assets, rarmLayerLabels }: ReportDocProps) {
  const published = new Date(report.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const tocPages: Record<string, number> = {};
  let page = 3; // cover = 1, toc = 2
  for (const sec of report.sections) {
    tocPages[sec.id] = page;
    page++;
  }

  return (
    <Document
      title={report.title}
      author={report.authors.join(', ')}
      subject={`${report.quarter} Quarterly Report`}
      keywords="RWA tokenization Hong Kong stablecoin RARM SARM"
    >
      {/* ── Cover page ─────────────────────────────────────────────────── */}
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverBrand}>RWA-INDEX</Text>
        <Text style={s.coverQuarter}>{report.quarter} · {report.status.toUpperCase()}</Text>
        <Text style={s.coverTitle}>{report.title}</Text>
        <Text style={s.coverAbstract}>{report.abstract}</Text>
        <Text style={s.coverMeta}>Published: {published}</Text>
        <Text style={s.coverMeta}>Period: {report.periodStart} – {report.periodEnd}</Text>
        <Text style={s.coverMeta}>Authors: {report.authors.join(', ')}</Text>
        <Text style={s.coverMeta}>Pages: {report.pageCount ?? '—'}</Text>
        <Text style={s.coverMeta}>https://rwa-index.com/reports/{report.slug}</Text>
        <Text style={s.coverDisclaimer}>
          This report is published for academic and research purposes only. It does not constitute investment advice,
          financial product disclosure, credit rating, or regulatory opinion. RWA-Index Research is not a licensed
          credit rating agency. All SARM/RARM signal assessments are based solely on publicly available information.
        </Text>
      </Page>

      {/* ── Table of Contents ────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Text style={s.tocTitle}>Table of Contents</Text>
        {report.sections.map(sec => (
          <View key={sec.id} style={s.tocRow}>
            <Text style={s.tocLabel}>{sec.title}</Text>
            <View style={s.tocDots} />
            <Text style={s.tocPage}>{tocPages[sec.id]}</Text>
          </View>
        ))}
        <PageFooter title={report.title} />
      </Page>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      {report.sections.map(sec => (
        <Page key={sec.id} size="A4" style={s.page}>
          <Text style={s.sectionTitle}>{sec.title}</Text>

          {sec.narrative && renderPdfNarrative(sec.narrative)}

          {sec.type === 'auto-licenses' && (
            <LicensesPdfSection issuers={issuers} />
          )}
          {sec.type === 'auto-assets' && (
            <AssetsPdfSection assets={assets} rarmLayerLabels={rarmLayerLabels} />
          )}
          {sec.type === 'auto-incidents' && (
            <IncidentsPdfSection
              incidents={incidents}
              periodStart={report.periodStart}
              periodEnd={report.periodEnd}
            />
          )}
          {sec.type === 'auto-market' && (
            <View>
              <Text style={s.body}>
                Live market TVL data is available at https://rwa-index.com/market
              </Text>
              {sec.manualCommentary && renderPdfNarrative(sec.manualCommentary)}
            </View>
          )}

          {sec.manualCommentary && sec.type !== 'auto-market' && (
            <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#DBE4E7' }}>
              <Text style={{ fontSize: 8, color: '#737C7F', marginBottom: 6, letterSpacing: 1 }}>
                ANALYST COMMENTARY
              </Text>
              {renderPdfNarrative(sec.manualCommentary)}
            </View>
          )}

          <PageFooter title={report.title} />
        </Page>
      ))}

      {/* ── References ──────────────────────────────────────────────────── */}
      {report.citations.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>References</Text>
          {report.citations.map((c, i) => (
            <View key={c.id} style={s.citationItem}>
              <Text style={s.citationNumber}>[{i + 1}]</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.citationText}>{c.text}</Text>
                {c.url && (
                  <PdfLink src={c.url} style={{ fontSize: 8, color: '#5E5C75' }}>
                    {c.url}
                  </PdfLink>
                )}
              </View>
            </View>
          ))}
          <PageFooter title={report.title} />
        </Page>
      )}
    </Document>
  );
}

// ── Export: download helper ───────────────────────────────────────────────────

export async function generateReportPDF(
  report: Report,
  issuers: Issuer[],
  incidents: Incident[],
  assets: Asset[],
  rarmLayerLabels: Record<string, string>,
): Promise<void> {
  const doc = (
    <ReportDocument
      report={report}
      issuers={issuers}
      incidents={incidents}
      assets={assets}
      rarmLayerLabels={rarmLayerLabels}
    />
  );
  const blob = await pdf(doc).toBlob();
  saveAs(blob, `rwa-index-${report.slug}.pdf`);
}
