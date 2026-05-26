import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

const layers = [
  { id: '01', icon: 'gavel' as const, title: 'Legal & Jurisdictional', desc: 'Evaluation of legal wrappers, SPV structures, and cross-border enforceability.', criticality: 'High', bg: colors.surfaceContainerLow },
  { id: '02', icon: 'account-balance' as const, title: 'Asset Custody', desc: 'Mapping the physical/digital custody chain and qualified custodians in bankruptcy-remote setups.', criticality: 'Severe', bg: colors.surfaceContainerLowest },
  { id: '03', icon: 'storage' as const, title: 'Data Integrity (PoR)', desc: 'Proof of Reserve mechanisms, oracle reliability, and off-chain to on-chain reconciliation.', criticality: 'Moderate', bg: colors.surfaceContainerLow },
  { id: '04', icon: 'security' as const, title: 'Smart Contract Risk', desc: 'Audit history, formal verification results, and emergency pause/upgradability controls.', criticality: 'High', bg: colors.surfaceContainerLowest },
  { id: '05', icon: 'payments' as const, title: 'Secondary Liquidity', desc: 'Market depth, AMM vs CLOB integration, and institutional liquidity backstops.', criticality: 'Low', bg: colors.surfaceContainerLow },
  { id: '06', icon: 'verified-user' as const, title: 'Identity & AML', desc: 'KYC/KYB registry requirements, ZK-proof privacy options, and jurisdictional whitelist enforcement.', criticality: 'High', bg: colors.surfaceContainerLowest },
];

const weightMatrix = [
  { cls: 'Real Estate', w: [0.35, 0.15, 0.20, 0.10, 0.10, 0.10] },
  { cls: 'Gov. Treasuries', w: [0.10, 0.40, 0.05, 0.15, 0.20, 0.10] },
  { cls: 'Private Equity', w: [0.30, 0.20, 0.10, 0.10, 0.05, 0.25] },
  { cls: 'Trade Finance', w: [0.20, 0.10, 0.30, 0.20, 0.10, 0.10] },
  { cls: 'Commodities', w: [0.15, 0.25, 0.40, 0.10, 0.05, 0.05] },
];

export default function FrameworkMethodology() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>Methodology</Text>
        <Text style={styles.breadcrumbSep}>/</Text>
        <Text style={[styles.breadcrumbText, { color: colors.primary }]}>Institutional Framework</Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          Six-Layer Framework{' '}
          <Text style={{ color: colors.primaryDim }}>Methodology</Text>
        </Text>
        <Text style={styles.heroDesc}>
          A forensic decomposition of real-world asset tokenization, standardizing the evaluation of institutional grade risk.
        </Text>
      </View>

      {/* RARM Overview */}
      <View style={styles.rarmCard}>
        <Text style={styles.rarmProtocol}>STRUCTURAL PROTOCOL</Text>
        <Text style={styles.rarmTitle}>The Relative Asset Risk Matrix (RARM)</Text>
        <Text style={styles.rarmDesc}>
          The RARM framework functions as a multi-dimensional risk aggregator, synthesizing granular data across six fundamental layers of asset tokenization. The methodology produces a normalized institutional rating quantifying operational integrity and legal enforceability.
        </Text>
        <View style={styles.rarmBadges}>
          {['v2.4.0_STABLE', 'ISO-20022 COMPLIANT'].map((b) => (
            <View key={b} style={styles.rarmBadge}>
              <Text style={styles.rarmBadgeText}>{b}</Text>
            </View>
          ))}
        </View>
        <View style={styles.rarmNote}>
          <MaterialIcons name="info" size={14} color={colors.primary} />
          <Text style={styles.rarmNoteText}>COEFFICIENTS UPDATED DAILY</Text>
        </View>
      </View>

      {/* Layer Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Framework Layers</Text>
        {layers.map((layer) => (
          <TouchableOpacity key={layer.id} style={[styles.layerCard, { backgroundColor: layer.bg }]} activeOpacity={0.8}>
            <View style={styles.layerCardTop}>
              <Text style={styles.layerCardId}>LAYER_{layer.id}</Text>
              <MaterialIcons name="arrow-forward" size={18} color={colors.outline} />
            </View>
            <MaterialIcons name={layer.icon} size={32} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.layerCardTitle}>{layer.title}</Text>
            <Text style={styles.layerCardDesc}>{layer.desc}</Text>
            <Text style={styles.layerCardCrit}>Criticality: {layer.criticality}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Weight Matrix */}
      <View style={styles.section}>
        <View style={styles.matrixHeader}>
          <View>
            <Text style={styles.matrixTitle}>Asset-Class Weight Matrix</Text>
            <Text style={styles.matrixSubtitle}>Sensitivity distribution across tokenization verticals.</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn}>
            <MaterialIcons name="download" size={14} color={colors.onPrimary} />
            <Text style={styles.exportBtnText}>CSV</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.tableHeader}>
              {['Asset Class', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((h) => (
                <Text key={h} style={[styles.tableHead, h === 'Asset Class' ? { width: 120 } : { width: 48 }]}>{h}</Text>
              ))}
            </View>
            {weightMatrix.map((row, ri) => (
              <View key={row.cls} style={[styles.tableRow, ri % 2 === 0 && { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.tableCell, styles.tableCellBold, { width: 120 }]}>{row.cls}</Text>
                {row.w.map((v, i) => (
                  <Text key={i} style={[styles.tableCell, { width: 48, color: colors.outline }]}>
                    {v.toFixed(2)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footerSection}>
        <View style={styles.footerRow}>
          <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.footerMono}>NODE_CLUSTER_01: NOMINAL</Text>
        </View>
        <Text style={styles.footerMono}>Protocol: v4.1.2-beta</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 20, paddingBottom: 0 },
  breadcrumbText: { fontSize: 10, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 1 },
  breadcrumbSep: { color: colors.outline, fontSize: 10 },
  hero: { padding: 20, paddingBottom: 24 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: colors.onSurface, letterSpacing: -1, lineHeight: 42 },
  heroDesc: { fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 22, marginTop: 10 },
  rarmCard: { backgroundColor: colors.surfaceContainer, borderLeftWidth: 6, borderLeftColor: colors.primary, padding: 20, margin: 16 },
  rarmProtocol: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 2, marginBottom: 6 },
  rarmTitle: { fontSize: 20, fontWeight: '900', color: colors.onSurface, marginBottom: 12 },
  rarmDesc: { fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20, marginBottom: 16 },
  rarmBadges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rarmBadge: { borderWidth: 1, borderColor: colors.outlineVariant + '50', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surfaceContainerLowest },
  rarmBadgeText: { fontSize: 10, fontFamily: 'monospace', color: colors.onSurface },
  rarmNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rarmNoteText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  section: { padding: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  layerCard: { padding: 20, marginBottom: 8, borderTopWidth: 1, borderTopColor: colors.primary + '30' },
  layerCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  layerCardId: { fontSize: 11, fontFamily: 'monospace', color: colors.outline },
  layerCardTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: 6 },
  layerCardDesc: { fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20, marginBottom: 10 },
  layerCardCrit: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  matrixHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  matrixTitle: { fontSize: 20, fontWeight: '800', color: colors.onSurface },
  matrixSubtitle: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8 },
  exportBtnText: { color: colors.onPrimary, fontSize: 11, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.surfaceContainerHigh, paddingVertical: 8 },
  tableHead: { fontSize: 10, fontWeight: '700', color: colors.onSurface, textTransform: 'uppercase', paddingHorizontal: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '20' },
  tableCell: { fontSize: 12, paddingHorizontal: 8, color: colors.onSurface },
  tableCellBold: { fontWeight: '700' },
  footerSection: { padding: 20, borderTopWidth: 1, borderTopColor: colors.outlineVariant + '20', gap: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  footerMono: { fontSize: 11, fontFamily: 'monospace', color: colors.outline },
});
