import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Card,
  DEMO_CARDS,
  DEMO_MERCHANTS,
  getCards,
  getMerchants,
  getRecommendation,
  getTransactions,
  Merchant,
  Explanation,
  Recommendation,
  getExplanation,
  saveTransaction,
  Transaction,
} from './src/api';

const C = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  raised: '#EAF1FA',
  line: '#E1E8F0',
  text: '#172B4D',
  muted: '#718198',
  green: '#2878E5',
  purple: '#6F6FDB',
  amber: '#A56A12',
  red: '#D94F62',
};

const currency = (value: number) => `$${value.toFixed(2)}`;
const percent = (rate: number) => `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 1)}%`;

export default function App() {
  const [tab, setTab] = useState<'wallet' | 'activity'>('wallet');
  const [cards, setCards] = useState<Card[]>(DEMO_CARDS);
  const [merchants, setMerchants] = useState<Merchant[]>(DEMO_MERCHANTS);
  const [selectedMerchantId, setSelectedMerchantId] = useState(DEMO_MERCHANTS[0].id);
  const [amountText, setAmountText] = useState('180');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [offline, setOffline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [explainBusy, setExplainBusy] = useState(false);
  const cardMotion = useRef(new Animated.Value(1)).current;

  const merchant = useMemo(
    () => merchants.find((item) => item.id === selectedMerchantId) ?? DEMO_MERCHANTS[0],
    [merchants, selectedMerchantId],
  );
  const amount = Math.min(10000, Math.max(1, Number.parseFloat(amountText) || 180));

  useEffect(() => {
    let alive = true;
    Promise.allSettled([getCards(), getMerchants(), getTransactions()]).then((results) => {
      if (!alive) return;
      const [cardResult, merchantResult, transactionResult] = results;
      let connected = false;
      if (cardResult.status === 'fulfilled') {
        setCards(cardResult.value.data);
        connected = true;
      }
      if (merchantResult.status === 'fulfilled') {
        setMerchants(merchantResult.value.data);
        connected = true;
      }
      if (transactionResult.status === 'fulfilled') {
        setTransactions(transactionResult.value.data);
        connected = true;
      }
      setOffline(!connected);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => getRecommendation(merchant, amount).then((result) => {
      if (!alive) return;
      setRecommendation(result.data);
      setExplanation(null);
      setOffline(result.offline);
      cardMotion.setValue(0.84);
      Animated.spring(cardMotion, { toValue: 1, useNativeDriver: true, friction: 7, tension: 65 }).start();
    }).finally(() => {
      if (alive) setLoading(false);
    }), 220);
    return () => { alive = false; clearTimeout(timer); };
  }, [merchant.id, amount]);

  const selectedCard = recommendation?.best_card ?? cards[0] ?? DEMO_CARDS[0];

  const handleSave = async () => {
    setSaving(true);
    const result = await saveTransaction(merchant, selectedCard, amount);
    setTransactions((current) => [result.data, ...current.filter((item) => item.id !== result.data.id)]);
    setOffline(result.offline);
    setNotice(`Saved ${currency(result.data.amount)} at ${merchant.name}`);
    setSaving(false);
    setTimeout(() => setNotice(''), 2800);
  };

  const handleExplain = async () => {
    setExplainBusy(true);
    const result = await getExplanation(merchant, amount);
    setExplanation(result.data);
    setOffline(result.offline);
    setExplainBusy(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <View style={styles.appShell}>
        <View style={styles.topbar}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>smartwallet</Text>
            <Text style={styles.brandEdition}>HACKMIDWEST · 2026</Text>
          </View>
          <View style={[styles.connectionPill, offline ? styles.connectionOffline : styles.connectionOnline]}>
            <View style={[styles.connectionDot, { backgroundColor: offline ? C.amber : C.green }]} />
            <Text style={[styles.connectionText, { color: offline ? C.amber : C.green }]}>{offline ? 'DEMO MODE' : 'API LIVE'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {tab === 'wallet' ? (
            <>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>YOUR WALLET, WITH A GAME PLAN</Text>
                <Text style={styles.title}>Make every{ '\n' }tap count.</Text>
                <Text style={styles.subtitle}>The right card for the place you’re at.</Text>
              </View>

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Nearby merchants</Text>
                  <Text style={styles.sectionHint}>Choose a demo location</Text>
                </View>
                <View style={styles.locationBadge}><Text style={styles.locationPin}>⌖</Text><Text style={styles.locationText}>KANSAS CITY</Text></View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.merchantRail}>
                {merchants.map((item) => {
                  const active = item.id === merchant.id;
                  return (
                    <Pressable key={item.id} onPress={() => { setSelectedMerchantId(item.id); setNotice(''); }} style={[styles.merchantChip, active && styles.merchantChipActive]}>
                      <Text style={[styles.merchantChipName, active && styles.merchantChipNameActive]}>{item.name}</Text>
                      <Text style={[styles.merchantChipCategory, active && styles.merchantChipCategoryActive]}>{item.category.toUpperCase()} · MCC {item.mcc}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.purchaseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Purchase amount</Text>
                  <Text style={styles.sectionHint}>Try $180 to see a reward cap change the winner</Text>
                </View>
                <View style={styles.amountField}><Text style={styles.amountCurrency}>$</Text><TextInput value={amountText} onChangeText={(value) => setAmountText(value.replace(/[^0-9.]/g, '').slice(0, 8))} keyboardType="decimal-pad" selectTextOnFocus style={styles.amountInput} accessibilityLabel="Purchase amount in dollars" /></View>
              </View>

              <View style={styles.recommendHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Best actual value</Text>
                  <Text style={styles.sectionHint}>{merchant.neighborhood}</Text>
                </View>
                <View style={styles.edgeTag}><View style={styles.edgeDot} /><Text style={styles.edgeTagText}>MCC ASSUMED</Text></View>
              </View>

              {recommendation ? (
                <Animated.View style={[styles.featureCard, {
                  opacity: cardMotion,
                  transform: [{ translateY: cardMotion.interpolate({ inputRange: [0.84, 1], outputRange: [12, 0] }) }, { scale: cardMotion }],
                }]}>
                  <View style={styles.cardTopLine}>
                    <View style={styles.cardBrandLockup}><View style={[styles.cardEmblem, { borderColor: selectedCard.accent }]}><Text style={[styles.cardEmblemText, { color: selectedCard.accent }]}>S</Text></View><Text style={styles.cardBank}>SMARTWALLET{ '\n' }PARTNER CARD</Text></View>
                    <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>✦  BEST MATCH</Text></View>
                  </View>
                  <View style={[styles.cardGlow, { backgroundColor: selectedCard.accent }]} />
                  <Text style={styles.cardName}>{selectedCard.name}</Text>
                  <View style={styles.cardBottomLine}>
                    <Text style={styles.cardNumber}>••••  ••••  ••••  {selectedCard.last4}</Text>
                    <Text style={styles.cardNetwork}>{selectedCard.network}</Text>
                  </View>
                  <View style={styles.rewardStrip}>
                    <View><Text style={styles.rewardCaption}>ESTIMATED REWARD · {currency(amount)} SPEND</Text><Text style={styles.rewardAmount}>{currency(recommendation.estimated_cashback)} <Text style={styles.rewardAt}>· {percent(recommendation.ranked_cards[0]?.effective_rate ?? recommendation.reward_rate)} effective</Text></Text></View>
                    <View style={styles.rewardSpark}><Text style={styles.rewardSparkText}>↗</Text></View>
                  </View>
                </Animated.View>
              ) : (
                <View style={styles.loadingCard}><ActivityIndicator color={C.green} /><Text style={styles.sectionHint}>Finding your best reward…</Text></View>
              )}

              <View style={styles.rankingBlock}>
                <View style={styles.rankingTitleRow}><Text style={styles.sectionTitle}>Reward ranking</Text><Text style={styles.demoNote}>DEMO CASH VALUE</Text></View>
                {(recommendation?.ranked_cards ?? []).map((item, index) => (
                  <View key={item.card.id} style={styles.rankRow}>
                    <Text style={[styles.rankNumber, index === 0 && { color: C.green }]}>{String(index + 1).padStart(2, '0')}</Text>
                    <View style={[styles.rankSwatch, { backgroundColor: item.card.accent }]} />
                    <View style={styles.rankCopy}><Text style={styles.rankName}>{item.card.name}</Text><Text style={styles.rankDetail}>{item.card.terms_label}</Text></View>
                    <View style={styles.rankResult}><Text style={[styles.rankValue, index === 0 && { color: C.green }]}>{currency(item.estimated_cashback)}</Text><Text style={styles.rankDetail}>{percent(item.effective_rate)} effective</Text></View>
                  </View>
                ))}
              </View>

              <View style={styles.assumptionCard}>
                <Text style={styles.assumptionTitle}>ASSUMPTIONS TO CHECK</Text>
                {(recommendation?.assumptions ?? []).map((item, index) => <Text key={index} style={styles.assumptionText}>{item}</Text>)}
              </View>

              <Pressable onPress={handleExplain} disabled={explainBusy || loading} style={({ pressed }) => [styles.aiButton, pressed && styles.buttonPressed, (explainBusy || loading) && styles.buttonDisabled]}>
                {explainBusy ? <ActivityIndicator color={C.purple} /> : <><Text style={styles.aiButtonGlyph}>✦</Text><Text style={styles.aiButtonText}>Ask SmartWallet AI why</Text><Text style={styles.aiButtonArrow}>↗</Text></>}
              </Pressable>
              {explanation ? (
                <View style={styles.explanationCard}>
                  <View style={styles.explanationHeading}><Text style={styles.explanationTitle}>REWARDS INVESTIGATION</Text><Text style={styles.explanationProvider}>{explanation.provider === 'akamai-strands' ? 'STRANDS · AKAMAI' : 'LOCAL EXPLANATION'}</Text></View>
                  <Text style={styles.explanationText}>{explanation.explanation}</Text>
                </View>
              ) : null}

              {notice ? <View style={styles.notice}><Text style={styles.noticeText}>✓  {notice}</Text><Pressable onPress={() => setTab('activity')}><Text style={styles.noticeLink}>VIEW</Text></Pressable></View> : null}
              <Pressable onPress={handleSave} disabled={saving || loading} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, (saving || loading) && styles.buttonDisabled]}>
                {saving ? <ActivityIndicator color={C.background} /> : <><Text style={styles.primaryButtonText}>Use this card</Text><Text style={styles.primaryButtonArrow}>↗</Text></>}
              </Pressable>
              <Text style={styles.disclaimer}>Illustrative estimate only · no payment is processed · terms are hypothetical</Text>
            </>
          ) : (
            <>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>YOUR SMARTER SPENDING</Text>
                <Text style={styles.title}>A little more{ '\n' }back.</Text>
                <Text style={styles.subtitle}>Your simulated purchase decisions.</Text>
              </View>
              <View style={styles.activitySummary}>
                <View><Text style={styles.summaryLabel}>DEMO TRANSACTIONS</Text><Text style={styles.summaryValue}>{transactions.length}</Text></View>
                <View style={styles.summaryDivider} />
                <View><Text style={styles.summaryLabel}>EST. REWARDS</Text><Text style={[styles.summaryValue, { color: C.green }]}>{currency(transactions.reduce((sum, item) => sum + item.estimated_rewards, 0))}</Text></View>
              </View>
              <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.sectionHint}>Estimated reward value using demo terms</Text></View></View>
              {transactions.length === 0 ? (
                <View style={styles.emptyState}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↗</Text></View><Text style={styles.emptyTitle}>Your story starts here</Text><Text style={styles.emptyCopy}>Save a sample card recommendation to add your first demo transaction.</Text><Pressable onPress={() => setTab('wallet')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Go to wallet</Text></Pressable></View>
              ) : transactions.map((item) => (
                <View key={item.id} style={styles.transactionCard}>
                  <View style={[styles.transactionIcon, { backgroundColor: `${item.card.accent}22` }]}><Text style={[styles.transactionIconText, { color: item.card.accent }]}>{item.merchant.category === 'grocery' ? '⌂' : item.merchant.category === 'travel' ? '✦' : item.merchant.category === 'gas' ? '↗' : '☕'}</Text></View>
                  <View style={styles.transactionInfo}><Text style={styles.transactionMerchant}>{item.merchant.name}</Text><Text style={styles.transactionMeta}>{item.card.name} · {new Date(item.created_at).toLocaleDateString()}</Text><Text style={styles.transactionReward}>{percent(item.reward_rate)} effective · {currency(item.estimated_rewards)} est. back</Text></View>
                  <View style={styles.transactionRight}><Text style={styles.transactionAmount}>{currency(item.amount)}</Text></View>
                </View>
              ))}
              <View style={styles.assumptionCard}><Text style={styles.assumptionTitle}>ABOUT THESE ESTIMATES</Text><Text style={styles.assumptionText}>Transactions are simulated. No card credentials are collected, and no issuer account is connected.</Text></View>
            </>
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          <TabButton label="Wallet" symbol="▱" active={tab === 'wallet'} onPress={() => setTab('wallet')} />
          <TabButton label="Activity" symbol="◷" active={tab === 'activity'} onPress={() => setTab('activity')} badge={transactions.length > 0} />
        </View>
      </View>

    </SafeAreaView>
  );
}

function TabButton({ label, symbol, active, badge, onPress }: { label: string; symbol: string; active: boolean; badge?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <View><Text style={[styles.tabSymbol, active && styles.tabActive]}>{symbol}</Text>{badge ? <View style={styles.tabBadge} /> : null}</View>
      <Text style={[styles.tabLabel, active && styles.tabActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#EAF0F7' : C.background },
  appShell: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: C.background, shadowColor: '#172B4D', shadowOpacity: Platform.OS === 'web' ? 0.1 : 0, shadowRadius: 24, shadowOffset: { width: 0, height: 4 }, elevation: Platform.OS === 'web' ? 4 : 0 },
  topbar: { minHeight: 66, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface },
  brandMark: { width: 35, height: 35, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  brandCopy: { marginLeft: 10, flex: 1 },
  brandName: { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  brandEdition: { color: C.muted, fontSize: 8, letterSpacing: 1.5, marginTop: 2, fontWeight: '700' },
  connectionPill: { height: 27, paddingHorizontal: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectionOffline: { backgroundColor: '#FFF3DD' },
  connectionOnline: { backgroundColor: '#E7F7F1' },
  connectionDot: { width: 6, height: 6, borderRadius: 3 },
  connectionText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 28 },
  hero: { paddingTop: 30, paddingBottom: 24 },
  eyebrow: { color: C.green, fontWeight: '800', fontSize: 9, letterSpacing: 1.7, marginBottom: 9 },
  title: { color: C.text, fontSize: 38, lineHeight: 41, fontWeight: '800', letterSpacing: -1.5 },
  subtitle: { color: C.muted, fontSize: 13, marginTop: 9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  sectionHint: { color: C.muted, fontSize: 10, marginTop: 4 },
  locationBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 7 },
  locationPin: { color: C.green, fontSize: 13 },
  locationText: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  merchantRail: { gap: 8, paddingBottom: 24 },
  merchantChip: { minWidth: 150, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13 },
  merchantChipActive: { backgroundColor: '#EAF2FF', borderColor: '#AFCBFA' },
  merchantChipName: { color: C.text, fontSize: 11, fontWeight: '700' },
  merchantChipNameActive: { color: C.green },
  merchantChipCategory: { color: C.muted, fontSize: 8, marginTop: 5, letterSpacing: 0.4 },
  merchantChipCategoryActive: { color: '#54749D' },
  purchaseRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 24 },
  amountField: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, width: 112, height: 42, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line },
  amountCurrency: { color: C.green, fontSize: 16, fontWeight: '800' },
  amountInput: { flex: 1, width: 0, minWidth: 0, color: C.text, fontSize: 16, fontWeight: '800', padding: 0, textAlign: 'right' },
  recommendHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  edgeTag: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#EEF0FF', flexDirection: 'row', alignItems: 'center', gap: 5 },
  edgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.purple },
  edgeTagText: { color: C.purple, fontSize: 8, letterSpacing: 0.7, fontWeight: '800' },
  featureCard: { overflow: 'hidden', minHeight: 218, borderRadius: 19, padding: 19, backgroundColor: '#EAF3FF', borderWidth: 1, borderColor: '#C7DCF8', shadowColor: '#18365F', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  cardTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrandLockup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardEmblem: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardEmblemText: { fontSize: 17, fontWeight: '900' },
  cardBank: { color: C.muted, fontSize: 7, lineHeight: 10, fontWeight: '800', letterSpacing: 1 },
  bestBadge: { backgroundColor: '#E7F7F1', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  bestBadgeText: { color: C.green, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  cardGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 90, opacity: 0.075, right: -45, top: 35 },
  cardName: { color: C.text, fontSize: 21, fontWeight: '800', marginTop: 28, letterSpacing: -0.5 },
  cardBottomLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 },
  cardNumber: { color: '#718198', fontSize: 11, letterSpacing: 1.1 },
  cardNetwork: { color: C.text, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  rewardStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, marginTop: 17, paddingTop: 13 },
  rewardCaption: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  rewardAmount: { color: C.green, fontSize: 16, fontWeight: '800', marginTop: 3 },
  rewardAt: { color: C.muted, fontSize: 10, fontWeight: '500' },
  rewardSpark: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center' },
  rewardSparkText: { color: C.green, fontSize: 17, fontWeight: '800' },
  loadingCard: { height: 218, borderRadius: 19, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', gap: 10 },
  rankingBlock: { marginTop: 22, marginBottom: 18 },
  rankingTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  demoNote: { color: C.muted, fontSize: 7, letterSpacing: 0.8, fontWeight: '700' },
  rankRow: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center' },
  rankNumber: { width: 27, color: C.muted, fontSize: 10, fontWeight: '800' },
  rankSwatch: { width: 7, height: 7, borderRadius: 3, marginRight: 9 },
  rankCopy: { flex: 1 },
  rankName: { color: C.text, fontSize: 10, fontWeight: '600' },
  rankDetail: { color: C.muted, fontSize: 8, marginTop: 3 },
  rankResult: { alignItems: 'flex-end', marginLeft: 5 },
  rankValue: { color: C.text, fontSize: 12, fontWeight: '800' },
  assumptionCard: { backgroundColor: '#FFF8E9', borderColor: '#F1D9A8', borderWidth: 1, borderRadius: 13, padding: 12, marginBottom: 12 },
  assumptionTitle: { color: C.amber, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  assumptionText: { color: '#6D6555', fontSize: 9, lineHeight: 14, marginTop: 3 },
  aiButton: { minHeight: 48, borderRadius: 13, backgroundColor: '#F0F0FF', borderWidth: 1, borderColor: '#D4D5FA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, gap: 9, marginBottom: 12 },
  aiButtonGlyph: { color: C.purple, fontSize: 15 },
  aiButtonText: { color: '#454A9D', fontSize: 11, fontWeight: '800', flex: 1 },
  aiButtonArrow: { color: C.purple, fontSize: 16, fontWeight: '800' },
  explanationCard: { backgroundColor: '#F8F8FF', borderColor: '#D4D5FA', borderWidth: 1, borderRadius: 13, padding: 13, marginBottom: 16 },
  explanationHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  explanationTitle: { color: C.text, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  explanationProvider: { color: C.purple, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  explanationText: { color: '#4F5F76', fontSize: 10, lineHeight: 16 },
  notice: { backgroundColor: '#EAF2FF', borderColor: '#C8DAF7', borderWidth: 1, borderRadius: 11, padding: 11, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noticeText: { color: C.green, fontSize: 10, flex: 1 },
  noticeLink: { color: C.green, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  primaryButton: { minHeight: 51, borderRadius: 13, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 17, gap: 10, shadowColor: '#2878E5', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  primaryButtonArrow: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.55 },
  disclaimer: { color: C.muted, textAlign: 'center', marginTop: 10, fontSize: 9 },
  tabBar: { height: 67, borderTopColor: C.line, borderTopWidth: 1, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 4 : 0 },
  tabButton: { width: 90, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabSymbol: { color: C.muted, fontSize: 20, lineHeight: 23 },
  tabLabel: { color: C.muted, fontSize: 9, fontWeight: '700' },
  tabActive: { color: C.green },
  tabBadge: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, top: -1, right: -5 },
  activitySummary: { backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, borderRadius: 15, padding: 17, flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  summaryLabel: { color: C.muted, fontSize: 8, letterSpacing: 1, fontWeight: '800' },
  summaryValue: { color: C.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
  summaryDivider: { width: 1, height: 39, backgroundColor: C.line, marginHorizontal: 25 },
  emptyState: { borderWidth: 1, borderColor: C.line, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', padding: 25, marginTop: 3 },
  emptyIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: C.green, fontSize: 23 },
  emptyTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginTop: 13 },
  emptyCopy: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6, marginBottom: 15 },
  secondaryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.raised },
  secondaryButtonText: { color: C.green, fontSize: 11, fontWeight: '800' },
  transactionCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  transactionIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  transactionIconText: { fontSize: 18, fontWeight: '800' },
  transactionInfo: { flex: 1, marginLeft: 10 },
  transactionMerchant: { color: C.text, fontSize: 11, fontWeight: '800' },
  transactionMeta: { color: C.muted, fontSize: 8, marginTop: 3 },
  transactionReward: { color: C.green, fontSize: 8, marginTop: 4, fontWeight: '700' },
  transactionRight: { alignItems: 'flex-end', marginLeft: 5 },
  transactionAmount: { color: C.text, fontSize: 11, fontWeight: '800' },
});
