export type BonusRule = {
  category: string;
  rate: number;
  cap_amount: number | null;
  spent_to_date: number;
  period?: string;
};

export type Card = {
  id: string;
  name: string;
  network: string;
  last4: string;
  accent: string;
  terms_label: string;
  exclusions: string[];
  base_rate: number;
  bonus_rules: BonusRule[];
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
  extra_rewards?: number;
  baseline_card_name?: string;
};
type CatalogCard = {
  id: string;
  display_name: string;
  base_rate: number;
  bonus_rules: BonusRule[];
};
type CatalogMerchant = {
  id: string;
  name: string;
  category: string;
  mcc_status?: string;
};
export type BackendRecommendation = {
  merchant_name: string;
  purchase_amount: number;
  recommended_card: string;
  rankings: {
    card_id: string;
    card_name: string;
    estimated_cashback: number;
    effective_rate: number;
    explanation: string;
  }[];
};
export type BackendExplanation = {
  recommended_card: string;
  explanation: string;
  source: string;
  ai_generated: boolean;
};
const round = (value: number) => Math.round(value * 100) / 100;
const category = (value: string) => value === 'grocery' ? 'groceries' : value;
const money = (value: number) => '$' + value.toFixed(2);
const percent = (value: number) => Number((value * 100).toFixed(2)) + '%';

export function normalizeCard(raw: CatalogCard, index = 0): Card {
  if (!raw.id || !raw.display_name || !Number.isFinite(raw.base_rate) || raw.base_rate < 0 || raw.base_rate > 1 || !Array.isArray(raw.bonus_rules)) {
    throw new Error('Unexpected card catalog format');
  }
  const rules = raw.bonus_rules.map(rule => {
    if (!rule.category || !Number.isFinite(rule.rate) || rule.rate < 0 || rule.rate > 1 ||
        (rule.cap_amount != null && (!Number.isFinite(rule.cap_amount) || rule.cap_amount < 0)) ||
        (rule.spent_to_date != null && (!Number.isFinite(rule.spent_to_date) || rule.spent_to_date < 0))) {
      throw new Error('Invalid card reward rule');
    }
    return { ...rule, category: category(rule.category), cap_amount: rule.cap_amount ?? null, spent_to_date: rule.spent_to_date ?? 0 };
  });
  return {
    id: raw.id,
    name: raw.display_name.replace(/\s*\(Demo\)$/, ''),
    network: 'DEMO',
    last4: ['2048', '7731', '0916'][index % 3],
    accent: ['#8C7CFF', '#55D6BE', '#F2B66D'][index % 3],
    terms_label: [
      ...rules.map(rule => percent(rule.rate) + ' ' + rule.category + (rule.cap_amount !== null ? ' up to ' + money(rule.cap_amount) + ' (' + (rule.period?.replace(/_/g, ' ') ?? 'demo period') + '), then ' + percent(raw.base_rate) : '')),
      percent(raw.base_rate) + ' on other purchases',
    ].join('; '),
    exclusions: [],
    base_rate: raw.base_rate,
    bonus_rules: rules,
  };
}

export function normalizeMerchant(raw: CatalogMerchant): Merchant {
  if (!raw.id || !raw.name || !raw.category) throw new Error('Unexpected merchant catalog format');
  return {
    id: raw.id, name: raw.name, category: category(raw.category),
    mcc: 'unverified', neighborhood: 'Kansas City demo directory',
    category_status: raw.mcc_status ?? 'assumed',
    category_source: 'Demo directory; payment-network MCC not verified',
  };
}

export const DEMO_CARDS = [
  { id: 'card_a', display_name: 'BonusMax (Demo)', base_rate: 0.01, bonus_rules: [{ category: 'groceries', rate: 0.05, cap_amount: 500, spent_to_date: 480, period: 'demo_quarter' }] },
  { id: 'card_b', display_name: 'GroceryPlus (Demo)', base_rate: 0.01, bonus_rules: [{ category: 'groceries', rate: 0.03, cap_amount: null, spent_to_date: 0, period: 'unlimited' }] },
  { id: 'card_c', display_name: 'Everyday2 (Demo)', base_rate: 0.02, bonus_rules: [] },
].map(normalizeCard);

export const DEMO_MERCHANTS = [
  { id: 'm_grocery', name: 'Crossroads Grocer (Demo)', category: 'groceries' },
  { id: 'm_dining', name: 'Downtown Kitchen (Demo)', category: 'dining' },
  { id: 'm_coffee', name: 'Morning Cup (Demo)', category: 'dining' },
  { id: 'm_gas', name: 'City Fuel (Demo)', category: 'gas' },
  { id: 'm_travel', name: 'Terminal Hotel (Demo)', category: 'travel' },
  { id: 'm_other', name: 'Neighborhood Books (Demo)', category: 'other' },
].map(normalizeMerchant);

export function convertCardForBackend(card: Card) {
  const baseRate = round(card.base_rate * 100);
  return {
    card_id: card.id, card_name: card.name, issuer: 'Demo Issuer',
    reward_rules: [
      ...card.bonus_rules.map(rule => ({
        category: category(rule.category), cashback_rate: round(rule.rate * 100),
        spending_cap: rule.cap_amount, amount_spent: rule.spent_to_date,
        fallback_rate: baseRate,
      })),
      { category: 'all', cashback_rate: baseRate, spending_cap: null, amount_spent: 0, fallback_rate: baseRate },
    ],
  };
}
export function buildPurchase(merchant: Merchant, amount: number, cards: Card[]) {
  if (!Number.isFinite(amount) || amount <= 0 || cards.length === 0) throw new Error('A positive purchase amount and at least one card are required');
  return { merchant_name: merchant.name, category: category(merchant.category), amount, cards: cards.map(convertCardForBackend) };
}

export function calculateRecommendation(merchant: Merchant, amount: number, cards: Card[]): Recommendation {
  buildPurchase(merchant, amount, cards);
  const ranked_cards: RankedCard[] = cards.map(card => {
    const rule = card.bonus_rules.find(rule => category(rule.category) === category(merchant.category));
    const rate = rule?.rate ?? card.base_rate;
    const cap = rule?.cap_amount ?? null;
    const spent = rule?.spent_to_date ?? 0;
    const capped_spend = cap === null ? amount : Math.min(amount, Math.max(0, cap - spent));
    const uncapped_spend = amount - capped_spend;
    const cashback = round(capped_spend * rate + uncapped_spend * card.base_rate);
    return { card, reward_rate: rate, effective_rate: cashback / amount, estimated_cashback: cashback, capped_spend, uncapped_spend, reward_cap: cap, category_spend_to_date: spent, applied_conditions: [card.terms_label] };
  }).sort((a, b) => b.estimated_cashback - a.estimated_cashback);
  const best = ranked_cards[0];
  return {
    merchant, best_card: best.card, reward_rate: best.reward_rate, amount,
    estimated_cashback: best.estimated_cashback,
    comparison_value: round(best.estimated_cashback - ranked_cards[ranked_cards.length - 1].estimated_cashback),
    ranked_cards, demo: true,
    assumptions: [
      'Merchant category is assumed to be ' + category(merchant.category) + '; actual payment MCC is not verified.',
      'Card terms, card ownership, activation, and category spend-to-date are hypothetical demo data.',
      'Reward caps use the demo period specified in the catalog.',
      'Actual issuer exclusions and transaction coding can change rewards.',
    ],
  };
}

export function normalizeRecommendation(raw: BackendRecommendation, merchant: Merchant, amount: number, cards: Card[]): Recommendation {
  const local = calculateRecommendation(merchant, amount, cards);
  if (raw.purchase_amount !== amount || raw.merchant_name !== merchant.name ||
      !Array.isArray(raw.rankings) || raw.rankings.length !== cards.length ||
      new Set(raw.rankings.map(row => row.card_id)).size !== cards.length) {
    throw new Error('Unexpected recommendation response');
  }
  const ranked_cards = raw.rankings.map(row => {
    const details = local.ranked_cards.find(item => item.card.id === row.card_id);
    if (!details || !Number.isFinite(row.estimated_cashback) || row.estimated_cashback < 0 ||
        Math.abs(details.estimated_cashback - row.estimated_cashback) > 0.011 || typeof row.explanation !== 'string') {
      throw new Error('Recommendation does not match the submitted card rules');
    }
    return { ...details, estimated_cashback: row.estimated_cashback,
      effective_rate: row.estimated_cashback / amount,
      applied_conditions: [details.card.terms_label, row.explanation] };
  }).sort((a, b) => b.estimated_cashback - a.estimated_cashback);
  // The service returns a card name; accept its ID as well, but never invent a winner.
  const best = ranked_cards.find(row => row.card.id === raw.recommended_card || row.card.name === raw.recommended_card);
  if (!best || best.estimated_cashback !== ranked_cards[0].estimated_cashback) throw new Error('Invalid recommended card');
  return { ...local, best_card: best.card, reward_rate: best.reward_rate,
    estimated_cashback: best.estimated_cashback, ranked_cards,
    comparison_value: round(best.estimated_cashback - ranked_cards[ranked_cards.length - 1].estimated_cashback) };
}

export function localExplanation(comparison: Recommendation): Explanation {
  const lines = [
    'For ' + money(comparison.amount) + ' at ' + comparison.merchant.name + ', ' + comparison.best_card.name + ' has the highest estimated reward: ' + money(comparison.estimated_cashback) + '.',
    ...comparison.ranked_cards.map(item => {
      const calculation = item.uncapped_spend > 0
        ? money(item.capped_spend) + ' at ' + percent(item.reward_rate) + ' + ' + money(item.uncapped_spend) + ' at ' + percent(item.card.base_rate) + ' after the bonus cap.'
        : money(comparison.amount) + ' at ' + percent(item.reward_rate) + '.';
      const cap = item.reward_cap !== null ? ' Cap: ' + money(item.reward_cap) + '; assumed spending so far: ' + money(item.category_spend_to_date) + '.' : '';
      const difference = round(comparison.estimated_cashback - item.estimated_cashback);
      const outcome = item.card.id === comparison.best_card.id ? ' Recommended.' : difference > 0 ? ' ' + money(difference) + ' less than the recommended card.' : ' Ties the recommended card.';
      return item.card.name + ': ' + money(item.estimated_cashback) + ' (' + percent(item.effective_rate) + ' effective). ' + calculation + cap + outcome;
    }),
    'The recommendation compares estimated dollars after caps, rather than headline rates.',
    'Local explanation: the AI explanation request failed. No AI agent was used for this explanation.',
    ...comparison.assumptions,
  ];
  return { explanation: lines.join('\n\n'), provider: 'deterministic-fallback', agent_used: false, assumptions: comparison.assumptions };
}
