import { CardFace } from './CardFace';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Merchant, Transaction } from './contracts';
import { rewardSummary, spendingInsights } from './walletState';

const color = { text: '#172B4D', muted: '#53657D', blue: '#2468C9', line: '#DBE4F0', purple: '#5C56BA' };
const money = (value: number) => '$' + value.toFixed(2);
const rate = (value: number) => Number((value * 100).toFixed(2)) + '%';

function Hero({ eyebrow, title, copy, avatar }: { eyebrow: string; title: string; copy: string; avatar?: string }) {
  return <View style={s.hero}>
    <View style={s.heroRow}><View style={s.heroCopy}><Text style={s.eyebrow}>{eyebrow}</Text><Text accessibilityRole="header" style={s.title}>{title}</Text></View>
      {avatar ? <View accessibilityLabel="Profile initials" style={s.profileAvatar}><Text style={s.avatarInitials}>{avatar}</Text></View> : null}
    </View>
    <Text style={s.body}>{copy}</Text>
  </View>;
}

function Action({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, secondary && s.secondary, pressed && s.pressed, disabled && s.disabled]}><Text style={[s.actionText, secondary && s.secondaryText]}>{title}</Text></Pressable>;
}
function Footnote({ children }: { children: React.ReactNode }) {
  return <View style={s.note}><Text style={s.noteText}>{children}</Text></View>;
}

export function ActivityScreen({ transactions, onWallet }: { transactions: Transaction[]; onWallet: () => void }) {
  const summary = rewardSummary(transactions);
  return <>
    <Hero eyebrow="YOUR SPENDING STORY" title="A little more back." copy="A record of the purchase decisions you saved." />
    <View style={s.metrics}>
      <View style={s.metric}><Text style={s.caption}>Estimated rewards</Text><Text style={s.metricValue}>{money(summary.rewards)}</Text></View>
      <View style={s.metric}><Text style={s.caption}>Additional rewards</Text><Text style={s.metricValue}>{money(summary.extra)}</Text></View>
    </View>
    <Text style={s.caption}>Additional rewards compare each saved choice with the lowest-reward card in your wallet at that time.</Text>
    <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.heading}>Recent activity</Text><Text style={s.caption}>{summary.count} saved</Text></View>
    {!transactions.length ? <View style={s.panel}><Text style={s.heading}>Your story starts here</Text><Text style={s.body}>Choose a merchant and save a simulated purchase from Wallet. Your rewards and spending patterns will appear here.</Text><Action title="Go to Wallet" onPress={onWallet} /></View> : transactions.map(item =>
      <View key={item.id} style={s.panel}>
        <View style={s.row}><View style={[s.swatch, { backgroundColor: item.card.accent }]} /><Text style={s.heading}>{item.merchant.name}</Text></View>
        <Text style={s.caption}>{item.card.name} · {new Date(item.created_at).toLocaleDateString()}</Text>
        <View style={s.sectionHeading}><Text style={s.body}>{money(item.amount)} purchase</Text><Text style={s.value}>{money(item.estimated_rewards)} estimated</Text></View>
        <Text style={s.caption}>{rate(item.reward_rate)} effective reward{item.extra_rewards != null ? ' · ' + money(item.extra_rewards) + ' additional' : ''}</Text>
        {item.baseline_card_name ? <Text style={s.caption}>Compared with {item.baseline_card_name} at the time of saving.</Text> : null}
      </View>
    )}
    <Footnote>Simulated purchases and reward estimates. Activity is stored for this app session; no payment or bank-account connection is made.</Footnote>
  </>;
}

export function InsightsScreen({ transactions, cards, onPlan, onActivity }: { transactions: Transaction[]; cards: Card[]; onPlan: (merchant: Merchant, amount: number) => void; onActivity: () => void }) {
  const insights = spendingInsights(transactions, cards);
  return <>
    <Hero eyebrow="LOOKING ONE PURCHASE AHEAD" title="Make a habit of more." copy="Find useful patterns in your saved activity and plan your next purchase." />
    <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.heading}>Your frequent stops</Text><Text style={s.caption}>From saved activity</Text></View>
    {!insights.length ? <View style={s.panel}><Text style={s.heading}>A little history goes a long way</Text><Text style={s.body}>Save coffee, breakfast, groceries, or other purchases in Wallet. This summary will group your recorded visits and compare your cards for a similar next purchase.</Text><Action title="View Activity" onPress={onActivity} secondary /></View> : insights.map(item =>
      <View key={item.merchant.id} style={s.panel}>
        <Text style={s.heading}>{item.merchant.name}</Text>
        <Text style={s.caption}>{item.count > 1 ? 'Frequent stop' : 'Recent purchase'} · {item.count} recorded {item.count === 1 ? 'visit' : 'visits'}</Text>
        <Text style={s.body}>You recorded {money(item.spend)} in purchases and {money(item.rewards)} in estimated rewards. Your average purchase was {money(item.average)}.</Text>
        {item.next ? <>
          <View style={s.recommendation}><Text style={s.eyebrow}>FOR A SIMILAR NEXT PURCHASE</Text><Text style={s.heading}>{item.next.best_card.name}</Text><Text style={s.body}>Estimated {money(item.next.estimated_cashback)} back on {money(item.average)}, using your current wallet and assumed cap usage.</Text></View>
          <Action title="Plan this purchase" onPress={() => onPlan(item.merchant, item.average)} secondary />
        </> : <Text style={s.body}>Add a card in Profile to compare your next purchase.</Text>}
      </View>
    )}
    <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.heading}>Benefits in your wallet</Text></View>
    {cards.length ? cards.map(card => <View key={card.id} style={s.panel}>
      <CardFace card={card} compact />
      <Text style={s.body}>{card.terms_label}</Text>
      {card.bonus_rules.filter(rule => rule.cap_amount !== null).map(rule => <Text key={rule.category} style={s.caption}>{money(Math.max(0, (rule.cap_amount ?? 0) - rule.spent_to_date))} of bonus-eligible {rule.category} spending remains in the current cap period.</Text>)}
    </View>) : <Text style={s.body}>Your wallet is empty. Add supported cards in Profile.</Text>}
    <Footnote>Benefits use published product terms, not personalized issuer offers. Planning suggestions are calculated locally from saved purchases; they do not predict future offers or verify a merchant's payment category.</Footnote>
  </>;
}

export type UserProfile = { name: string; contact: string; email: string };

export function ProfileScreen({ catalog, cards, onToggle, onSpend, profile, onProfile }: { catalog: Card[]; cards: Card[]; onToggle: (id: string) => void; onSpend: (id: string, category: string, amount: number) => void; profile: UserProfile; onProfile: (profile: UserProfile) => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const selected = new Set(cards.map(card => card.id));
  return <>
    <Hero eyebrow="YOUR WALLET, YOUR CHOICES" title="Make it yours." avatar={profile.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'U'} copy="Choose the supported cards you want SmartWallet to compare." />
    <View style={s.panel}>
      <Text accessibilityRole="header" style={s.heading}>Your profile</Text>
      <Text style={s.label}>Name</Text>
      <TextInput accessibilityLabel="Profile name" style={s.profileInput} placeholder="Your name" placeholderTextColor={color.muted} value={profile.name} onChangeText={name => onProfile({ ...profile, name })} autoComplete="off" maxLength={80} />
      <Text style={s.label}>Contact number</Text>
      <TextInput accessibilityLabel="Profile contact number" style={s.profileInput} placeholder="Phone number" placeholderTextColor={color.muted} value={profile.contact} onChangeText={contact => onProfile({ ...profile, contact })} keyboardType="phone-pad" autoComplete="off" maxLength={30} />
      <Text style={s.label}>Email</Text>
      <TextInput accessibilityLabel="Profile email" style={s.profileInput} placeholder="you@example.com" placeholderTextColor={color.muted} value={profile.email} onChangeText={email => onProfile({ ...profile, email })} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="off" maxLength={160} />
      <Text style={s.caption}>Profile details stay in this app session.</Text>
    </View>
    <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.heading}>My cards</Text><View style={s.row}><Text style={s.caption}>{cards.length} selected</Text><Pressable accessibilityRole="button" accessibilityLabel="Add another card" onPress={() => setAddOpen(true)} style={({ pressed }) => [s.addButton, pressed && s.pressed]}><Text style={s.addSymbol}>+</Text></Pressable></View></View>
    {addOpen ? <AddCardModal onClose={() => setAddOpen(false)} /> : null}
    {catalog.map(card => {
      const owned = selected.has(card.id);
      return <View key={card.id} style={[s.panel, owned && s.selectedPanel]}>
        <CardFace card={card} compact />
        <Text style={s.body}>{card.terms_label}</Text>
        <Action title={owned ? 'Remove from wallet' : 'Add to wallet'} onPress={() => onToggle(card.id)} secondary />
        {owned ? card.bonus_rules.filter(rule => rule.cap_amount !== null).map(rule => <View key={rule.category} style={s.capEditor}>
          <Text style={s.label}>Assumed {rule.category} spending so far</Text>
          <View style={s.inputRow}><Text style={s.body}>$</Text><CapInput value={rule.spent_to_date} label={card.name + " assumed " + rule.category + " spending"} onCommit={value => onSpend(card.id, rule.category, value)} /></View>
          <Text style={s.caption}>Cap: {money(rule.cap_amount ?? 0)} · {rule.period?.replace(/_/g, ' ') ?? 'current period'}. Saving a matching simulated purchase on this card updates this spending amount.</Text>
        </View>) : null}
      </View>;
    })}
    <Footnote>Card selection and cap usage apply to Wallet, Insights, and both backend requests. Preferences last for this app session. No card number, CVV, or issuer password is needed.</Footnote>
  </>;
}


function AddCardModal({ onClose }: { onClose: () => void }) {
  const [details, setDetails] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [submitted, setSubmitted] = useState(false);
  const clear = () => setDetails({ name: '', number: '', expiry: '', cvv: '' });
  const close = () => { clear(); onClose(); };
  return <Modal visible transparent animationType="fade" onRequestClose={close}>
    <KeyboardAvoidingView style={s.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View accessibilityViewIsModal style={s.modalPanel}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.modalContent}>
          <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.heading}>{submitted ? 'Coming soon' : 'Add a card'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close add card" onPress={close} style={s.addButton}><Text style={s.addSymbol}>{'\u00d7'}</Text></Pressable></View>
          {submitted ? <><Text accessibilityLiveRegion="polite" style={s.body}>Card addition coming soon.</Text><Text style={s.caption}>Your entries were cleared. No card was added or saved.</Text><Action title="Done" onPress={close} /></> : <>
            <Text style={s.caption}>Preview the upcoming card setup. Entries are discarded on submit or close. Use sample details.</Text>
            <Text style={s.label}>Card name</Text><TextInput accessibilityLabel="New card name" style={s.profileInput} placeholder="Card product or nickname" placeholderTextColor={color.muted} value={details.name} onChangeText={name => setDetails({ ...details, name })} maxLength={80} autoComplete="off" />
            <Text style={s.label}>Card number</Text><TextInput accessibilityLabel="New card number" style={s.profileInput} placeholder="0000 0000 0000 0000" placeholderTextColor={color.muted} value={details.number} onChangeText={number => setDetails({ ...details, number: number.replace(/[^0-9 ]/g, '').slice(0, 23) })} keyboardType="number-pad" autoComplete="off" autoCorrect={false} />
            <View style={s.formRow}>
              <View style={s.formColumn}><Text style={s.label}>Expiry</Text><TextInput accessibilityLabel="New card expiry" style={s.profileInput} placeholder="MM/YY" placeholderTextColor={color.muted} value={details.expiry} onChangeText={text => { const digits = text.replace(/[^0-9]/g, '').slice(0, 4); setDetails({ ...details, expiry: digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits }); }} keyboardType="number-pad" autoComplete="off" /></View>
              <View style={s.formColumn}><Text style={s.label}>CVV</Text><TextInput accessibilityLabel="New card CVV" style={s.profileInput} placeholder="CVV" placeholderTextColor={color.muted} value={details.cvv} onChangeText={cvv => setDetails({ ...details, cvv: cvv.replace(/[^0-9]/g, '').slice(0, 4) })} keyboardType="number-pad" secureTextEntry autoComplete="off" autoCorrect={false} /></View>
            </View>
            <Action title="Add card" onPress={() => { clear(); setSubmitted(true); }} />
          </>}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}


function CapInput({ value, label, onCommit }: { value: number; label: string; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setDraft(String(value)); }, [value]);
  return <View style={{ flex: 1 }}>
    <TextInput style={s.input} value={draft} keyboardType="decimal-pad" selectTextOnFocus accessibilityLabel={label}
      onChangeText={text => { setDraft(text.replace(/[^0-9.]/g, '')); setInvalid(false); }}
      onBlur={() => {
        const parsed = Number(draft);
        if (!draft.trim() || !Number.isFinite(parsed) || parsed < 0 || parsed > 1000000) {
          setInvalid(true); setDraft(String(value)); return;
        }
        const amount = Math.round(parsed * 100) / 100;
        setDraft(String(amount)); onCommit(amount);
      }} />
    {invalid ? <Text style={s.caption}>Enter an amount between $0 and $1,000,000.</Text> : null}
  </View>;
}

const s = StyleSheet.create({
  profileInput: { minHeight: 48, borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: "#F7FAFE", color: color.text, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#EAF2FF", alignItems: "center", justifyContent: "center" },
  addSymbol: { color: color.blue, fontSize: 27, lineHeight: 32, fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(17,35,60,0.5)", justifyContent: "center", padding: 20 },
  modalPanel: { maxHeight: "90%", width: "100%", maxWidth: 480, alignSelf: "center", borderRadius: 22, backgroundColor: "#FFFFFF", overflow: "hidden" },
  modalContent: { padding: 22, gap: 12 },
  formRow: { flexDirection: "row", gap: 14 },
  formColumn: { flex: 1, gap: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCopy: { flex: 1, gap: 10 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2468C9', borderWidth: 3, borderColor: '#D8E7FB', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: .5 },
  hero: { paddingTop: 30, paddingBottom: 24, gap: 10 },
  eyebrow: { color: color.blue, fontSize: 13, lineHeight: 19, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: color.text, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  heading: { color: color.text, fontSize: 19, lineHeight: 26, fontWeight: '700', flexShrink: 1 },
  body: { color: color.muted, fontSize: 16, lineHeight: 25, flexShrink: 1 },
  caption: { color: color.muted, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  label: { color: color.text, fontSize: 15, lineHeight: 23, fontWeight: '600' },
  panel: { backgroundColor: '#FFFFFF', borderColor: color.line, borderWidth: 1, borderRadius: 18, padding: 18, gap: 10, marginBottom: 14 },
  selectedPanel: { borderColor: '#AFCAF0' },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 22, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metric: { flex: 1, minWidth: 140, borderRadius: 18, padding: 17, borderWidth: 1, borderColor: color.line, backgroundColor: '#FFFFFF', gap: 6 },
  metricValue: { fontSize: 30, lineHeight: 38, fontWeight: '800', color: color.blue },
  value: { color: color.blue, fontSize: 16, lineHeight: 24, fontWeight: '700' },
  action: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: color.blue, paddingHorizontal: 16, paddingVertical: 12, marginTop: 4 },
  actionText: { color: '#FFFFFF', fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  secondary: { backgroundColor: '#EAF2FF' },
  secondaryText: { color: color.blue },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  note: { backgroundColor: '#FFF8E9', borderWidth: 1, borderColor: '#F1D9A8', borderRadius: 14, padding: 16, marginTop: 10, marginBottom: 12 },
  noteText: { color: '#6D6555', fontSize: 14, lineHeight: 23 },
  recommendation: { backgroundColor: '#F0F0FF', padding: 14, borderRadius: 12, gap: 8 },
  capEditor: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: 16, marginTop: 6, gap: 8 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: color.line, borderRadius: 12, paddingHorizontal: 14 },
  input: { flex: 1, color: color.text, fontSize: 18, paddingVertical: 12, minHeight: 48 },
});
