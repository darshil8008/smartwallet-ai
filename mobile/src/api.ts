import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type Card = {
  id: string;
  name: string;
  network: string;
  last4: string;
  accent: string;
  terms_label: string;
  exclusions: string[];
};

export type Merchant = {
  id: string;
  name: string;
  category: string;
  mcc: string;
  neighborhood: string;
  category_status: string;
  category_source: string;
};

export type RankedCard = {
  card: Card;
  reward_rate: number;
  effective_rate: number;
  estimated_cashback: number;
  capped_spend: number;
  uncapped_spend: number;
  reward_cap: number | null;
  category_spend_to_date: number;
  applied_conditions: string[];
};
export type Recommendation = {
  merchant: Merchant;
  best_card: Card;
  reward_rate: number;
  amount: number;
  estimated_cashback: number;
  comparison_value: number;
  ranked_cards: RankedCard[];
  assumptions: string[];
  demo: boolean;
};
export type Explanation = {
  explanation: string;
  provider: 'akamai-strands' | 'deterministic-fallback';
  agent_used: boolean;
  assumptions: string[];
};
export type Transaction = {
  id: string;
  merchant: Merchant;
  card: Card;
  amount: number;
  reward_rate: number;
  estimated_rewards: number;
  created_at: string;
};
const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const defaultHost = Platform.OS === 'android'
  ? (Constants.isDevice ? expoHost ?? 'localhost' : '10.0.2.2')
  : Platform.OS === 'ios' && Constants.isDevice
    ? expoHost ?? 'localhost'
    : 'localhost';
export const API_URL = (configuredUrl || `http://${defaultHost}:8000`).replace(/\/$/, '');

export const DEMO_CARDS: Card[] = [
  { id: 'capped-grocery', name: 'Card A · Capped Grocery', network: 'VISA', last4: '2048', accent: '#8C7CFF', terms_label: '5% on first $500/month, then 1%', exclusions: ['Wholesale clubs may not qualify'] },
  { id: 'grocery-plus', name: 'Card B · Grocery Plus', network: 'MASTERCARD', last4: '7731', accent: '#55D6BE', terms_label: '3% on eligible grocery purchases', exclusions: ['Merchant category must qualify as grocery'] },
  { id: 'flat-cash', name: 'Card C · Flat 2% Cash', network: 'VISA', last4: '0916', accent: '#F2B66D', terms_label: '2% cash back on eligible purchases', exclusions: [] },
];

export const DEMO_MERCHANTS: Merchant[] = [
  { id: 'river-market', name: 'River Market Grocer', category: 'grocery', mcc: '5411', neighborhood: 'River Market, Kansas City', category_status: 'assumed', category_source: 'SmartWallet demo directory' },
  { id: 'union-coffee', name: 'Union Coffee', category: 'dining', mcc: '5814', neighborhood: 'Crossroads, Kansas City', category_status: 'assumed', category_source: 'SmartWallet demo directory' },
  { id: 'skyline-stay', name: 'Skyline Hotel', category: 'travel', mcc: '7011', neighborhood: 'Downtown, Kansas City', category_status: 'assumed', category_source: 'SmartWallet demo directory' },
  { id: 'westside-fuel', name: 'Westside Fuel', category: 'gas', mcc: '5541', neighborhood: 'Westside, Kansas City', category_status: 'assumed', category_source: 'SmartWallet demo directory' },
];

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; offline: boolean }> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return { data: (await response.json()) as T, offline: false };
  } catch {
    throw new Error('SmartWallet API is unavailable');
  }
}

export async function getCards() {
  return request<Card[]>('/api/cards');
}

export async function getMerchants() {
  return request<Merchant[]>('/api/merchants');
}

export async function getTransactions() {
  return request<Transaction[]>('/api/history');
}

export async function getRecommendation(merchant: Merchant, amount: number): Promise<{ data: Recommendation; offline: boolean }> {
  try {
    return await request<Recommendation>('/api/recommend', {
      method: 'POST',
      body: JSON.stringify({ merchant_id: merchant.id, amount }),
    });
  } catch {
    const ranked_cards = DEMO_CARDS.map((card) => {
      const capped = card.id === 'capped-grocery' && merchant.category === 'grocery';
      const rate = card.id === 'flat-cash' ? 0.02 : card.id === 'grocery-plus' && merchant.category === 'grocery' ? 0.03 : capped ? 0.05 : 0.01;
      const cap = capped ? 500 : null;
      const spent = capped ? 480 : 0;
      const capped_spend = cap === null ? amount : Math.min(amount, Math.max(0, cap - spent));
      const uncapped_spend = amount - capped_spend;
      const cashback = Math.round((capped_spend * rate + uncapped_spend * (capped ? 0.01 : rate)) * 100) / 100;
      return {
        card,
        reward_rate: rate,
        effective_rate: amount ? cashback / amount : 0,
        estimated_cashback: cashback,
        capped_spend,
        uncapped_spend,
        reward_cap: cap,
        category_spend_to_date: spent,
        applied_conditions: [card.terms_label],
      };
    });
    ranked_cards.sort((a, b) => b.estimated_cashback - a.estimated_cashback);
    return {
      offline: true,
      data: {
        merchant,
        best_card: ranked_cards[0].card,
        reward_rate: ranked_cards[0].reward_rate,
        amount,
        estimated_cashback: ranked_cards[0].estimated_cashback,
        comparison_value: Math.round((ranked_cards[0].estimated_cashback - ranked_cards[ranked_cards.length - 1].estimated_cashback) * 100) / 100,
        ranked_cards,
        assumptions: [
          `Merchant category is assumed to be ${merchant.category}; actual payment MCC is not verified.`,
          'Card terms and category spend-to-date are hypothetical demo data.',
          ...(merchant.category === 'grocery' ? ['For this grocery scenario, Card A assumes $480 of its $500 monthly cap has already been used.'] : []),
          'Actual issuer exclusions and transaction coding can change rewards.',
        ],
        demo: true,
      },
    };
  }
}

export async function getExplanation(merchant: Merchant, amount: number, question?: string) {
  try {
    return await request<Explanation>('/api/agent/explain', {
      method: 'POST',
      body: JSON.stringify({ merchant_id: merchant.id, amount, question }),
    });
  } catch {
    return {
      offline: true,
      data: {
        explanation: 'The recommendation is based on the saved hypothetical card terms. Confirm the merchant category and issuer rules; the mobile demo could not reach the explanation API.',
        provider: 'deterministic-fallback' as const,
        agent_used: false,
        assumptions: [`Merchant category is assumed to be ${merchant.category}.`],
      },
    };
  }
}

export async function saveTransaction(merchant: Merchant, card: Card, amount: number) {
  try {
    return await request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ merchant_id: merchant.id, card_id: card.id, amount }),
    });
  } catch {
    const recommendation = await getRecommendation(merchant, amount);
    const ranking = recommendation.data.ranked_cards.find((item) => item.card.id === card.id);
    return {
      offline: true,
      data: {
        id: `TX-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        merchant,
        card,
        amount,
        reward_rate: ranking?.effective_rate ?? 0,
        estimated_rewards: ranking?.estimated_cashback ?? 0,
        created_at: new Date().toISOString(),
      },
    };
  }
}
