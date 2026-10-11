import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './contracts';
// Product-inspired native artwork, without payment credentials.
export function CardFace({ card, compact = false, recommended = false }: { card: Card; compact?: boolean; recommended?: boolean }) {
  const ink = card.ink ?? '#172B4D';
  const isAmex = card.id === 'amex-blue-cash-everyday';
  return <View accessibilityLabel={(card.issuer ?? '') + ' ' + card.name} style={[s.face, compact && s.compact, { backgroundColor: card.surface ?? '#EAF3FF' }]}>
    <View pointerEvents="none" style={[s.orbit, { borderColor: ink }]} /><View pointerEvents="none" style={[s.orbit, s.secondOrbit, { borderColor: ink }]} />
    {card.id === 'citi-double-cash' ? <View pointerEvents="none" style={s.citiBand} /> : null}
    <View style={s.top}><Text style={[s.issuer, { color: ink }, isAmex && s.amex]}>{isAmex ? 'AMERICAN\nEXPRESS' : card.issuer ?? 'SMARTWALLET'}</Text>{recommended ? <View style={s.badge}><Text style={s.badgeText}>BEST MATCH</Text></View> : null}</View>
    <View style={s.middle}><View style={s.chip}><View style={s.chipLine} /><View style={s.chipLine} /></View><Text style={[s.contactless, { color: ink }]}>{'\u2769\u2769\u2769'}</Text></View>
    <Text style={[s.name, compact && s.compactName, { color: ink }]}>{card.name}</Text>
    <View style={s.bottom}><Text style={[s.label, { color: ink }]}>SELECTED CARD</Text><Text style={[s.network, { color: ink }]}>{card.network}</Text></View>
  </View>;
}
const s = StyleSheet.create({
  face: { overflow: 'hidden', borderRadius: 16, minHeight: 206, padding: 20, borderWidth: 1, borderColor: '#B5C6D9', justifyContent: 'space-between', gap: 12 },
  compact: { minHeight: 180, padding: 17 },
  orbit: { position: 'absolute', width: 300, height: 300, right: -70, top: -140, borderRadius: 160, borderWidth: 30, opacity: .055, transform: [{ rotate: '-25deg' }] },
  secondOrbit: { right: -140, top: -90, borderWidth: 2, opacity: .15 },
  citiBand: { position: 'absolute', width: '150%', height: 70, right: -40, bottom: -38, backgroundColor: '#69C0D4', transform: [{ rotate: '-13deg' }] },
  top: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  issuer: { fontSize: 19, fontWeight: '800', letterSpacing: -.5 },
  amex: { fontSize: 13, lineHeight: 15, borderWidth: 1, borderColor: '#397DAF', padding: 5, textAlign: 'center', letterSpacing: 1 },
  badge: { backgroundColor: '#E7F7F1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { color: '#216543', fontSize: 12, fontWeight: '800' },
  middle: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  chip: { width: 36, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#B59F68', backgroundColor: '#E0D4AD', justifyContent: 'space-evenly' },
  chipLine: { height: 1, backgroundColor: '#B59F68' },
  contactless: { fontSize: 19, opacity: .65 },
  name: { fontSize: 26, fontWeight: '700', letterSpacing: -.7 },
  compactName: { fontSize: 23 },
  bottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, opacity: .75 },
  network: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
