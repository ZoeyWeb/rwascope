/**
 * AssessmentPDF — @react-pdf/renderer document for the private due diligence workbook.
 *
 * Dynamically imported only — never loads in the main bundle:
 *   const { generateAssessmentPDF } = await import('../../components/AssessmentPDF');
 *   await generateAssessmentPDF(assessment, userName);
 *
 * COMPLIANCE: This PDF is the user's own private record, attributed to the user.
 * It is not a platform rating, credit assessment, or published document.
 */

import {
  Document, Page, Text, View, StyleSheet, pdf,
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import type { AssessmentOut } from '../../api/client';

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 52,
    paddingBottom: 52,
    paddingHorizontal: 52,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2B3437',
    lineHeight: 1.5,
  },
  coverPage: {
    backgroundColor: '#1A1A2E',
    paddingTop: 80,
    paddingBottom: 52,
    paddingHorizontal: 52,
    fontFamily: 'Helvetica',
  },
  coverBrand: { fontSize: 10, color: '#9aa0a6', letterSpacing: 2, marginBottom: 56 },
  coverLabel: { fontSize: 9, color: '#737C7F', marginBottom: 6, letterSpacing: 1 },
  coverTitle: { fontSize: 26, color: '#ffffff', fontFamily: 'Helvetica-Bold', lineHeight: 1.25, marginBottom: 10 },
  coverSub: { fontSize: 12, color: '#9aa0a6', marginBottom: 6 },
  coverPreparer: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  coverScore: { fontSize: 40, color: '#4ade80', fontFamily: 'Helvetica-Bold', marginTop: 32 },
  coverScoreLabel: { fontSize: 9, color: '#6b7280', marginTop: 4, letterSpacing: 1 },
  coverDisclaimer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2B3437',
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#1A1A2E',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#DBE4E7',
  },
  layerBox: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F8FAFB',
    borderWidth: 1,
    borderColor: '#DBE4E7',
    borderRadius: 4,
  },
  layerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  layerTag: { fontSize: 9, color: '#5E5C75', fontFamily: 'Helvetica-Bold' },
  layerName: { fontSize: 11, color: '#1A1A2E', fontFamily: 'Helvetica-Bold' },
  layerAvg: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  scoreBar: {
    height: 4,
    backgroundColor: '#DBE4E7',
    borderRadius: 2,
    marginBottom: 10,
  },
  scoreBarFill: { height: 4, borderRadius: 2 },
  indicatorRow: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F6',
  },
  indicatorScore: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 18,
    marginRight: 6,
    marginTop: 1,
  },
  indicatorLabel: { fontSize: 9, color: '#2B3437', flex: 1 },
  indicatorRationale: { fontSize: 8, color: '#737C7F', fontStyle: 'italic', marginTop: 2 },
  checklistBox: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#F8FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#5E5C75',
  },
  checklistLayerName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1A1A2E', marginBottom: 4 },
  checklistItem: { fontSize: 9, color: '#2B3437', marginBottom: 2 },
  redFlagItem: { fontSize: 9, color: '#9e3f4e', marginBottom: 2 },
  disclaimer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 4,
    fontSize: 8,
    color: '#7c3a1a',
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute', bottom: 24, left: 52, right: 52,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { fontSize: 8, color: '#9aa0a6' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const LAYER_NAMES: Record<number, string> = {
  1: 'Legal & Regulatory',
  2: 'Valuation & Transparency',
  3: 'Custody & Security',
  4: 'KYC / Counterparty',
  5: 'Liquidity & Market',
  6: 'Settlement & Ops',
};

function scoreColor(score: number): string {
  if (score >= 4) return '#4ade80';
  if (score >= 3) return '#facc15';
  if (score >= 2) return '#fb923c';
  return '#f87171';
}

function rarmColor(score: number): string {
  if (score >= 7) return '#4ade80';
  if (score >= 5) return '#facc15';
  if (score >= 3) return '#fb923c';
  return '#f87171';
}

// ── Document ──────────────────────────────────────────────────────────────────

function AssessmentDocument({
  assessment,
  userName,
  reportDate,
}: {
  assessment: AssessmentOut;
  userName: string;
  reportDate: string;
}) {
  // Build layer groupings
  const layerMap = new Map<number, typeof assessment.sub_scores>();
  assessment.sub_scores.forEach(s => {
    const arr = layerMap.get(s.layer_number) ?? [];
    arr.push(s);
    layerMap.set(s.layer_number, arr);
  });

  const layers = Array.from(layerMap.entries()).sort(([a], [b]) => a - b);

  const layerAvgs = layers.map(([lNum, scores]) => {
    const vals = scores.map(s => s.final_score ?? s.user_score);
    return { lNum, avg: vals.reduce((a, b) => a + b, 0) / vals.length, scores };
  });

  return (
    <Document
      title={`Due Diligence — ${assessment.protocol_name}`}
      author={userName}
      subject="Private RARM Due Diligence Workbook"
    >
      {/* ── Cover ── */}
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverBrand}>RWA-INDEX</Text>
        <Text style={s.coverLabel}>PRIVATE DUE DILIGENCE REPORT</Text>
        <Text style={s.coverTitle}>{assessment.protocol_name}</Text>
        <Text style={s.coverSub}>{assessment.asset_class.replace(/_/g, ' ')}</Text>
        {assessment.chains && (
          <Text style={{ ...s.coverSub, fontSize: 10 }}>{assessment.chains}</Text>
        )}

        {assessment.rarm_score != null && (
          <>
            <Text style={s.coverScore}>{assessment.rarm_score.toFixed(1)}</Text>
            <Text style={s.coverScoreLabel}>RARM SCORE — USER'S OWN CALCULATION</Text>
          </>
        )}

        <View style={{ marginTop: 32 }}>
          <Text style={s.coverPreparer}>Prepared by: {userName}</Text>
          <Text style={s.coverPreparer}>Date: {reportDate}</Text>
          <Text style={s.coverPreparer}>Status: {assessment.status}</Text>
        </View>

        <Text style={s.coverDisclaimer}>
          This document is a private due diligence workbook prepared by the user named above
          using the RARM (RWA Asset Risk Matrix) academic methodology provided by RWA-Index.
          It does not constitute a credit rating, investment advice, or any regulated financial
          service. The RARM Score is the user's own calculation — not a platform rating.
          RWA-Index does not endorse, verify, or publish this assessment.
        </Text>
      </Page>

      {/* ── Layer Summary ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Layer Summary</Text>

        {layerAvgs.map(({ lNum, avg }) => {
          const pct = (avg / 5) * 100;
          return (
            <View key={lNum} style={s.layerBox} wrap={false}>
              <View style={s.layerHeader}>
                <View>
                  <Text style={s.layerTag}>L{lNum}</Text>
                  <Text style={s.layerName}>{LAYER_NAMES[lNum] ?? `Layer ${lNum}`}</Text>
                </View>
                <Text style={{ ...s.layerAvg, color: scoreColor(avg) }}>
                  {avg.toFixed(1)}<Text style={{ fontSize: 9, color: '#737C7F' }}>/5</Text>
                </Text>
              </View>
              <View style={s.scoreBar}>
                <View
                  style={{
                    ...s.scoreBarFill,
                    width: `${pct}%`,
                    backgroundColor: scoreColor(avg),
                  }}
                />
              </View>
            </View>
          );
        })}

        <Footer reportDate={reportDate} userName={userName} />
      </Page>

      {/* ── Sub-indicator Details ── */}
      {layers.map(([lNum, subs]) => (
        <Page key={lNum} size="A4" style={s.page}>
          <Text style={s.sectionTitle}>
            L{lNum} — {LAYER_NAMES[lNum] ?? `Layer ${lNum}`}
          </Text>

          {subs.map(sub => {
            const score = sub.final_score ?? sub.user_score;
            return (
              <View key={sub.indicator_key} style={s.indicatorRow} wrap={false}>
                <Text style={{ ...s.indicatorScore, color: scoreColor(score) }}>{score}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.indicatorLabel}>{sub.indicator_label}</Text>
                  {sub.rationale ? (
                    <Text style={s.indicatorRationale}>{sub.rationale}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          <Footer reportDate={reportDate} userName={userName} />
        </Page>
      ))}

      {/* ── AI Checklist ── */}
      {assessment.ai_checklist && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>AI Due Diligence Checklist</Text>
          <Text style={{ fontSize: 9, color: '#737C7F', marginBottom: 10 }}>
            AI-generated research questions and red flags. Not scores or ratings.
            Model: {assessment.ai_checklist.model_used}
          </Text>

          {assessment.ai_checklist.overall_notes ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: '#2B3437', lineHeight: 1.6 }}>
                {assessment.ai_checklist.overall_notes}
              </Text>
            </View>
          ) : null}

          {assessment.ai_checklist.checklist.map((layer, i) => (
            <View key={i} style={s.checklistBox} wrap={false}>
              <Text style={s.checklistLayerName}>
                L{layer.layer_number} — {layer.layer_name}
              </Text>

              {layer.questions_to_verify.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 8, color: '#5E5C75', fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
                    Verify:
                  </Text>
                  {layer.questions_to_verify.map((q, qi) => (
                    <Text key={qi} style={s.checklistItem}>• {q}</Text>
                  ))}
                </View>
              )}

              {layer.red_flags_to_consider.length > 0 && (
                <View>
                  <Text style={{ fontSize: 8, color: '#9e3f4e', fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
                    Red flags:
                  </Text>
                  {layer.red_flags_to_consider.map((rf, rfi) => (
                    <Text key={rfi} style={s.redFlagItem}>⚠ {rf}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <Footer reportDate={reportDate} userName={userName} />
        </Page>
      )}

      {/* ── Disclaimer page ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Legal Disclaimer</Text>
        <View style={s.disclaimer}>
          <Text>
            This document is a private due diligence workbook prepared by {userName} using the
            RARM (RWA Asset Risk Matrix) framework, an academic methodology developed at HKUST
            and published in Digital Finance (Springer). The RARM Score shown (if any) is the
            user's own calculation based on their sub-indicator assessments — it is not a credit
            rating, investment grade, financial recommendation, or platform-generated rating.
          </Text>
          {'\n'}
          <Text>
            RWA-Index does not endorse, verify, guarantee, or publish this assessment. All
            opinions, scores, and evidence notes are the sole responsibility of {userName}.
            This workbook is for internal research and due diligence purposes only and must
            not be relied upon as a substitute for independent professional advice.
          </Text>
          {'\n'}
          <Text>
            RWA-Index is not a credit rating agency, investment adviser, or regulated financial
            service provider. Use of this framework does not establish any advisory relationship
            between the user and RWA-Index.
          </Text>
          {'\n'}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>
            Generated: {reportDate} · rwa-index.com
          </Text>
        </View>
        <Footer reportDate={reportDate} userName={userName} />
      </Page>
    </Document>
  );
}

function Footer({ reportDate, userName }: { reportDate: string; userName: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        Private Due Diligence — Prepared by {userName}
      </Text>
      <Text style={s.footerText}>{reportDate} · rwa-index.com</Text>
    </View>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateAssessmentPDF(
  assessment: AssessmentOut,
  userName: string,
): Promise<void> {
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const docElement = (
    <AssessmentDocument
      assessment={assessment}
      userName={userName}
      reportDate={reportDate}
    />
  );

  const blob = await pdf(docElement).toBlob();
  const safeName = assessment.protocol_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  saveAs(blob, `rwa-dd-${safeName}.pdf`);
}
