/**
 * Mobile RARM Framework Overview (Self-Assessment)
 *
 * COMPLIANCE: This screen is an educational overview of the RARM framework.
 * It does not compute or display platform-generated scores or risk tiers.
 * The full interactive due diligence workbook is available on the web app
 * (login required) at /score.
 *
 * Note: The mobile app does not support authenticated due diligence sessions.
 * The sliders here are a visual demonstration of the six RARM dimensions only.
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

const assetClasses = [
  { id: 'private-credit', label: 'Private Credit', sub: 'Institutional Debt' },
  { id: 'real-estate', label: 'Real Estate', sub: 'Commercial/Industrial' },
  { id: 'treasuries', label: 'Treasuries', sub: 'Gov-Backed Yield' },
  { id: 'commodities', label: 'Commodities', sub: 'Hard Assets/Logistics' },
];

const layerConfig = [
  { id: 1, label: 'Legal & Jurisdictional', ticks: ['On-Chain', 'Standard SPV', 'Multi-Juri'] },
  { id: 2, label: 'Asset Valuation & Oracles', ticks: ['Real-time', 'Weekly', 'Annual'] },
  { id: 3, label: 'Custody & Asset Control', ticks: ['Smart Contract', 'Qualified', 'Physical'] },
  { id: 4, label: 'KYC / AML Permissioning', ticks: ['Protocol ZK', 'Whitelist', 'Manual'] },
  { id: 5, label: 'Secondary Market Liquidity', ticks: ['DEX / AMM', 'Bulletin Bd.', 'OTC'] },
  { id: 6, label: 'Settlement Finality', ticks: ['Stablecoin DVP', 'T+1 Wire', 'Manual Escrow'] },
];

// Start with no scores (null = not assessed)
const initialScores: Record<number, number | null> = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };

export default function SelfAssessment() {
  const [selectedClass, setSelectedClass] = useState('real-estate');
  const [scores, setScores] = useState<Record<number, number | null>>(initialScores);

  const scoredCount = Object.values(scores).filter((v) => v !== null).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTag}>
          <Text style={styles.heroTagText}>RARM FRAMEWORK</Text>
          <View style={styles.heroTagLine} />
        </View>
        <Text style={styles.heroTitle}>Due Diligence Framework</Text>
        <Text style={styles.heroDesc}>
          The RARM (RWA Asset Risk Matrix) is an academic methodology for structured
          due diligence on tokenized real-world asset protocols. All scoring reflects
          your own professional judgment.
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Layers Scored</Text>
            <Text style={styles.statCardValue}>{scoredCount} / 6</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.outline }]}>
            <Text style={styles.statCardLabel}>Asset Class</Text>
            <Text style={[styles.statCardValue, { color: colors.onSurface, fontSize: 14 }]}>
              {assetClasses.find((c) => c.id === selectedClass)?.label ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Educational notice */}
      <View style={styles.notice}>
        <MaterialIcons name="school" size={18} color={colors.primary} />
        <View style={styles.noticeText}>
          <Text style={styles.noticeTitle}>Academic Research Tool</Text>
          <Text style={styles.noticeDesc}>
            Scores entered here are for your own private analysis. RWAscope does not
            generate, publish, or distribute ratings for any protocol. Use the web
            app to save and generate a due diligence checklist.
          </Text>
        </View>
      </View>

      {/* Asset Class */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>01. Asset Class Selection</Text>
        {assetClasses.map((cls) => {
          const active = selectedClass === cls.id;
          return (
            <TouchableOpacity
              key={cls.id}
              style={[styles.assetBtn, active && styles.assetBtnActive]}
              onPress={() => setSelectedClass(cls.id)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={[styles.assetBtnLabel, active && styles.assetBtnLabelActive]}>
                  {cls.label}
                </Text>
                <Text style={[styles.assetBtnSub, active && styles.assetBtnSubActive]}>
                  {cls.sub}
                </Text>
              </View>
              <MaterialIcons
                name={active ? 'check-circle' : 'chevron-right'}
                size={20}
                color={active ? colors.onPrimary : colors.primary}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sliders */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>02. Six-Layer RARM Matrix</Text>
        <View style={styles.sliderCard}>
          {layerConfig.map((layer) => {
            const val = scores[layer.id];
            return (
              <View key={layer.id} style={styles.layerBlock}>
                <View style={styles.layerHeader}>
                  <View>
                    <Text style={styles.layerNum}>
                      Layer {String(layer.id).padStart(2, '0')}
                    </Text>
                    <Text style={styles.layerTitle}>{layer.label}</Text>
                  </View>
                  <Text style={styles.layerScore}>
                    {val !== null ? String(val).padStart(2, '0') : '—'}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={5}
                  step={1}
                  value={val ?? 0}
                  onValueChange={(v) => setScores((prev) => ({ ...prev, [layer.id]: v }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.surfaceContainerHighest}
                  thumbTintColor={colors.primary}
                />
                <View style={styles.tickRow}>
                  {layer.ticks.map((t) => (
                    <Text key={t} style={styles.tick}>{t}</Text>
                  ))}
                </View>
              </View>
            );
          })}
          <View style={styles.sliderActions}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>OPEN FULL WORKBOOK (WEB)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setScores(initialScores)}
            >
              <Text style={styles.secondaryBtnText}>RESET</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Framework cards */}
      <View style={styles.bentoRow}>
        {[
          { icon: 'description' as const, title: 'RARM Methodology', desc: 'Six-layer framework for structured RWA protocol due diligence.' },
          { icon: 'lock' as const, title: 'Private Storage', desc: 'Your assessments are stored privately. Never published or shared.' },
        ].map((card) => (
          <View key={card.title} style={styles.bentoCard}>
            <MaterialIcons name={card.icon} size={22} color={colors.primary} />
            <Text style={styles.bentoTitle}>{card.title}</Text>
            <Text style={styles.bentoDesc}>{card.desc}</Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          RWAscope is an academic research tool. It does not provide credit ratings,
          investment advice, or any regulated financial service. All assessments
          reflect the user's own professional judgment.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { padding: 24, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '30' },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  heroTagText: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1.5 },
  heroTagLine: { height: 1, width: 32, backgroundColor: colors.primary },
  heroTitle: { fontSize: 28, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5, marginBottom: 8 },
  heroDesc: { fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: colors.surfaceContainer, padding: 16, borderLeftWidth: 2, borderLeftColor: colors.primary },
  statCardLabel: { fontSize: 10, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', marginBottom: 4 },
  statCardValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  notice: { flexDirection: 'row', gap: 12, padding: 16, margin: 16, backgroundColor: colors.surfaceContainerLowest, borderLeftWidth: 4, borderLeftColor: colors.primary + '50' },
  noticeText: { flex: 1 },
  noticeTitle: { fontSize: 11, fontWeight: '700', color: colors.onSurface, marginBottom: 4, letterSpacing: 0.5 },
  noticeDesc: { fontSize: 11, color: colors.onSurfaceVariant, lineHeight: 17 },
  section: { padding: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  assetBtn: { backgroundColor: colors.surfaceContainerLowest, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '30' },
  assetBtnActive: { backgroundColor: colors.primary },
  assetBtnLabel: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  assetBtnLabelActive: { color: colors.onPrimary },
  assetBtnSub: { fontSize: 10, color: colors.outline, textTransform: 'uppercase', marginTop: 2 },
  assetBtnSubActive: { color: colors.primaryFixed },
  sliderCard: { backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant + '30', padding: 20, gap: 28 },
  layerBlock: { gap: 8 },
  layerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  layerNum: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  layerTitle: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  layerScore: { fontSize: 22, fontWeight: '900', color: colors.primary },
  slider: { marginVertical: -4 },
  tickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tick: { fontSize: 9, color: colors.outline, textTransform: 'uppercase', letterSpacing: 0.3 },
  sliderActions: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.outlineVariant + '20' },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: colors.onPrimary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.outline, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: colors.onSurface, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  bentoRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  bentoCard: { flex: 1, backgroundColor: colors.surfaceContainer, padding: 16, gap: 6 },
  bentoTitle: { fontSize: 13, fontWeight: '700', color: colors.onSurface },
  bentoDesc: { fontSize: 11, color: colors.onSurfaceVariant, lineHeight: 16 },
  disclaimer: { margin: 16, padding: 12, backgroundColor: colors.surfaceContainerLowest, borderLeftWidth: 3, borderLeftColor: colors.outlineVariant + '40' },
  disclaimerText: { fontSize: 10, color: colors.onSurfaceVariant, lineHeight: 16 },
});
