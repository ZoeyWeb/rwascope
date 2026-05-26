import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

const frictionCards = [
  { layer: 'Layer 01', icon: 'gavel' as const, title: 'Legal & Regulatory', desc: 'Jurisdictional fragmentation and static legacy contracts create significant onboarding latency.', value: '82.4%', trendIcon: 'trending-up' as const, trendColor: colors.primaryDim, borderColor: colors.primary },
  { layer: 'Layer 02', icon: 'calculate' as const, title: 'Valuation Integrity', desc: 'Oracle latency and periodic manual appraisal cycles inhibit high-frequency RWA pricing.', value: '45.1%', trendIcon: 'remove' as const, trendColor: colors.primaryDim, borderColor: colors.primary },
  { layer: 'Layer 04', icon: 'water-drop' as const, title: 'Secondary Liquidity', desc: 'Depth of order books for illiquid private credit vs. institutional-grade treasuries.', value: '91.8%', trendIcon: 'warning' as const, trendColor: colors.error, borderColor: colors.error },
];

const matrixRows = [
  { label: 'Legal & Structuring (L1)', sub: 'KYC/AML & Local Law', cells: [{ v: '94/100', hi: true }, { v: '12/100', hi: false }, { v: '88/100', hi: true }], delta: '+4.2%', err: true },
  { label: 'Valuation Dynamics (L2)', sub: 'NAV Calculation Frequency', cells: [{ v: '65/100', hi: false }, { v: '04/100', hi: false }, { v: '52/100', hi: false }], delta: '-1.8%', err: false },
  { label: 'Secondary Liquidity (L4)', sub: 'Exit Velocity & Slippage', cells: [{ v: '82/100', hi: true }, { v: '08/100', hi: false }, { v: '96/100', hi: true }], delta: '+12.4%', err: true },
];

const barData = [40, 45, 42, 50, 55, 62, 58, 60, 75, 82, 88, 91];
const barColors = [
  colors.surfaceContainer, colors.surfaceContainer, colors.surfaceContainer, colors.surfaceContainer,
  colors.primary, colors.primary, colors.primaryDim, colors.primaryDim,
  '#4f0116', colors.error, colors.errorContainer, colors.error,
];

export default function FrictionAnalysis() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Analysis</Text>
          <Text style={styles.breadcrumbSep}>/</Text>
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: '700' }]}>Tokenization Friction</Text>
        </View>
        <Text style={styles.headerTitle}>Asset Class Liquidity & Structural Barriers</Text>
        <Text style={styles.headerDesc}>
          Quantitative assessment of market entry barriers across RWA categories. Visualizing the inverse relationship between legal complexity and on-chain velocity.
        </Text>
      </View>

      {/* Friction Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
        {frictionCards.map((card) => (
          <View key={card.title} style={[styles.frictionCard, { borderLeftColor: card.borderColor }]}>
            <Text style={[styles.frictionLayer, { color: card.borderColor }]}>{card.layer}</Text>
            <Text style={styles.frictionTitle}>{card.title}</Text>
            <Text style={styles.frictionDesc}>{card.desc}</Text>
            <View style={styles.frictionBottom}>
              <View>
                <Text style={styles.frictionValue}>{card.value}</Text>
                <Text style={styles.frictionIndexLabel}>Friction Index</Text>
              </View>
              <MaterialIcons name={card.trendIcon} size={22} color={card.trendColor} />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Cross-Asset Matrix */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cross-Asset Friction Matrix</Text>
        <View style={styles.legendRow}>
          {[{ color: colors.error + '60', label: 'Critical' }, { color: colors.primary + '60', label: 'Substantial' }, { color: colors.outline + '60', label: 'Nominal' }].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.matrixCard}>
          <View style={styles.matrixHeaderRow}>
            <Text style={[styles.matrixHead, { flex: 2 }]}>Layer</Text>
            {['RE', 'T-Bills', 'PE', 'Δ'].map((h) => (
              <Text key={h} style={[styles.matrixHead, { flex: 1, textAlign: h === 'Δ' ? 'right' : 'left' }]}>{h}</Text>
            ))}
          </View>
          {matrixRows.map((row, ri) => (
            <View key={row.label} style={[styles.matrixRow, ri < matrixRows.length - 1 && styles.matrixRowBorder]}>
              <View style={{ flex: 2 }}>
                <Text style={styles.matrixRowLabel}>{row.label}</Text>
                <Text style={styles.matrixRowSub}>{row.sub}</Text>
              </View>
              {row.cells.map((cell, ci) => (
                <View key={ci} style={[styles.matrixCell, { flex: 1, backgroundColor: cell.hi ? colors.error + '15' : colors.outline + '10' }]}>
                  <Text style={styles.matrixCellText}>{cell.v}</Text>
                </View>
              ))}
              <Text style={[styles.matrixDelta, { flex: 1, color: row.err ? colors.error : colors.onSurface }]}>{row.delta}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.section}>
        <Text style={styles.chartTitle}>Historical Friction Trend (24M)</Text>
        <View style={styles.barChart}>
          {barData.map((h, i) => (
            <View key={i} style={[styles.bar, { height: `${h}%`, backgroundColor: barColors[i] }]} />
          ))}
        </View>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>Q1 2022</Text>
          <Text style={styles.chartLabel}>Terminal Baseline</Text>
          <Text style={styles.chartLabel}>Q1 2024</Text>
        </View>
      </View>

      {/* Insight Card */}
      <View style={styles.insightCard}>
        <View style={styles.insightInner}>
          <Text style={styles.insightTitle}>Protocol Insight</Text>
          <Text style={styles.insightText}>
            Transitioning from T+2 settlement to atomic swap reduces L3 friction by 68.2%, however structural legal debt remains the primary bottleneck for Real Estate portfolios.
          </Text>
        </View>
      </View>

      {/* Export */}
      <View style={styles.exportRow}>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>Terminal Status: Nominal</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={styles.exportBtnText}>EXPORT ANALYSIS (PDF)</Text>
          <MaterialIcons name="download" size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { padding: 20, paddingBottom: 24 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  breadcrumbText: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  breadcrumbSep: { color: colors.outline, fontSize: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5, lineHeight: 34, marginBottom: 10 },
  headerDesc: { fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20 },
  cardsScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  frictionCard: { width: 240, padding: 16, borderLeftWidth: 4, backgroundColor: colors.surfaceContainerLow },
  frictionLayer: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  frictionTitle: { fontSize: 16, fontWeight: '700', color: colors.onSurface, marginTop: 4, marginBottom: 8 },
  frictionDesc: { fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, marginBottom: 16 },
  frictionBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  frictionValue: { fontSize: 22, fontWeight: '700', color: colors.onSurface },
  frictionIndexLabel: { fontSize: 9, color: colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.onSurface, marginBottom: 12 },
  legendRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10 },
  legendText: { fontSize: 9, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  matrixCard: { borderWidth: 1, borderColor: colors.outlineVariant + '30', backgroundColor: colors.surfaceContainerLowest },
  matrixHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '30' },
  matrixHead: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  matrixRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  matrixRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '20' },
  matrixRowLabel: { fontSize: 12, fontWeight: '700', color: colors.onSurface },
  matrixRowSub: { fontSize: 9, color: colors.onSurfaceVariant, marginTop: 2 },
  matrixCell: { flex: 1, padding: 4, alignItems: 'flex-start', justifyContent: 'center' },
  matrixCellText: { fontSize: 11, fontWeight: '700', color: colors.onSurface },
  matrixDelta: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  chartTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.onSurface, marginBottom: 12 },
  barChart: { height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { flex: 1 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabel: { fontSize: 9, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  insightCard: { backgroundColor: colors.primary, margin: 20, padding: 20 },
  insightInner: {},
  insightTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  insightText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 19 },
  exportRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, alignItems: 'center' },
  statusChip: { flex: 1, backgroundColor: colors.inverseSurface, padding: 12, borderLeftWidth: 2, borderLeftColor: colors.primary },
  statusChipText: { color: colors.inverseOnSurface, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 16 },
  exportBtnText: { color: colors.onPrimary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
});
