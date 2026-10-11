import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  Card, Merchant, Recommendation, Explanation, Transaction, BackendRecommendation, BackendExplanation,
  DEMO_CARDS, DEMO_MERCHANTS, normalizeCard, normalizeMerchant,
  buildPurchase, calculateRecommendation, normalizeRecommendation, localExplanation,
} from './contracts';
export type { Card, Merchant, Recommendation, Explanation, Transaction, RankedCard } from './contracts';
export { DEMO_CARDS, DEMO_MERCHANTS, convertCardForBackend } from './contracts';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const defaultHost = Platform.OS === 'android'
  ? (Constants.isDevice ? expoHost ?? 'localhost' : '10.0.2.2')
  : Platform.OS === 'ios' && Constants.isDevice ? expoHost ?? 'localhost' : 'localhost';
export const API_URL = (configuredUrl || 'http://' + defaultHost + ':8000').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit, timeoutMs = 15000): Promise<{ data: T; offline: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(API_URL + path, {
      ...init, signal: controller.signal,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    });
    if (!response.ok) throw new Error(path + ' returned HTTP ' + response.status + ': ' + (await response.text()).slice(0, 600));
    return { data: (await response.json()) as T, offline: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function getCards() {
  const result = await request<Parameters<typeof normalizeCard>[0][]>('/api/cards');
  if (!Array.isArray(result.data) || result.data.length === 0) throw new Error('Card catalog is empty or invalid');
  return { ...result, data: result.data.map(normalizeCard) };
}
export async function getMerchants() {
  const result = await request<Parameters<typeof normalizeMerchant>[0][]>('/api/merchants');
  if (!Array.isArray(result.data) || result.data.length === 0) throw new Error('Merchant catalog is empty or invalid');
  return { ...result, data: result.data.map(normalizeMerchant) };
}
// The deployed service has not documented a history schema; do not render unknown data.
export async function getTransactions(): Promise<{ data: Transaction[]; offline: boolean }> {
  throw new Error('Transaction history is local for this demo');
}
export async function getRecommendation(merchant: Merchant, amount: number, cards: Card[] = DEMO_CARDS): Promise<{ data: Recommendation; offline: boolean }> {
  const purchase = buildPurchase(merchant, amount, cards);
  try {
    const result = await request<BackendRecommendation>('/api/recommend', {
      method: 'POST', body: JSON.stringify(purchase),
    });
    return { ...result, data: normalizeRecommendation(result.data, merchant, amount, cards) };
  } catch (error) {
    console.warn('Recommendation API failed; using local demo calculation.', error);
    return { offline: true, data: calculateRecommendation(merchant, amount, cards) };
  }
}
export async function getExplanation(merchant: Merchant, amount: number, _question?: string, recommendation?: Recommendation, cards: Card[] = DEMO_CARDS): Promise<{ data: Explanation; offline: boolean }> {
  const purchase = buildPurchase(merchant, amount, cards);
  try {
    const result = await request<BackendExplanation>('/api/agent/explain', {
      method: 'POST', body: JSON.stringify({ purchase }),
    }, 60000);
    const raw = result.data;
    if (typeof raw.explanation !== 'string' || !raw.explanation.trim() || typeof raw.ai_generated !== 'boolean' || typeof raw.source !== 'string') throw new Error('Unexpected explanation response');
    return { offline: false, data: {
      explanation: raw.explanation,
      provider: raw.ai_generated ? 'akamai-strands' : 'deterministic-fallback',
      agent_used: raw.ai_generated,
      assumptions: (recommendation ?? calculateRecommendation(merchant, amount, cards)).assumptions,
    } };
  } catch (error) {
    console.warn('AI explanation API failed; using local explanation.', error);
    return { offline: true, data: localExplanation(recommendation ?? calculateRecommendation(merchant, amount, cards)) };
  }
}
export async function saveTransaction(merchant: Merchant, card: Card, amount: number, cards: Card[] = DEMO_CARDS, recommendation?: Recommendation): Promise<{ data: Transaction; offline: boolean }> {
  // Keep simulated purchases on-device; the new API does not document a save endpoint.
  const comparison = recommendation ?? calculateRecommendation(merchant, amount, cards);
  const ranking = comparison.ranked_cards.find(item => item.card.id === card.id);
  return { offline: true, data: {
    id: 'TX-' + Math.random().toString(16).slice(2, 8).toUpperCase(),
    merchant, card, amount, reward_rate: ranking?.effective_rate ?? 0,
    estimated_rewards: ranking?.estimated_cashback ?? 0, created_at: new Date().toISOString(),
    extra_rewards: Math.max(0, Math.round(((ranking?.estimated_cashback ?? 0) - comparison.ranked_cards[comparison.ranked_cards.length - 1].estimated_cashback) * 100) / 100),
    baseline_card_name: comparison.ranked_cards[comparison.ranked_cards.length - 1].card.name,
  } };
}
