import { Card, Merchant, Transaction, calculateRecommendation } from './contracts';

export type SpendOverrides = Record<string, Record<string, number>>;
export function walletCards(catalog: Card[], removedIds: string[], overrides: SpendOverrides): Card[] {
  return catalog.filter(card => !removedIds.includes(card.id)).map(card => ({
    ...card,
    bonus_rules: card.bonus_rules.map(rule => ({
      ...rule, spent_to_date: overrides[card.id]?.[rule.category] ?? rule.spent_to_date,
    })),
  }));
}
const cents = (amount: number) => Math.round(amount * 100) / 100;
export function rewardSummary(transactions: Transaction[]) {
  return {
    count: transactions.length,
    spent: cents(transactions.reduce((sum, item) => sum + item.amount, 0)),
    rewards: cents(transactions.reduce((sum, item) => sum + item.estimated_rewards, 0)),
    extra: cents(transactions.reduce((sum, item) => sum + (item.extra_rewards ?? 0), 0)),
  };
}
export function spendingInsights(transactions: Transaction[], cards: Card[]) {
  const groups = new Map<string, { merchant: Merchant; count: number; spend: number; rewards: number; last: string }>();
  for (const item of transactions) {
    const group = groups.get(item.merchant.id) ?? { merchant: item.merchant, count: 0, spend: 0, rewards: 0, last: item.created_at };
    group.count += 1;
    group.spend += item.amount;
    group.rewards += item.estimated_rewards;
    if (item.created_at > group.last) group.last = item.created_at;
    groups.set(item.merchant.id, group);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).slice(0, 4).map(group => {
    const average = cents(group.spend / group.count);
    const next = cards.length ? calculateRecommendation(group.merchant, average, cards) : null;
    return { ...group, spend: cents(group.spend), rewards: cents(group.rewards), average, next };
  });
}

export function recordPurchaseSpend(card: Card, merchant: Merchant, amount: number, overrides: SpendOverrides): SpendOverrides {
  const rule = card.bonus_rules.find(item => item.category === merchant.category && item.cap_amount !== null);
  if (!rule) return overrides;
  const spent = overrides[card.id]?.[rule.category] ?? rule.spent_to_date;
  return { ...overrides, [card.id]: { ...overrides[card.id], [rule.category]: Math.round((spent + amount) * 100) / 100 } };
}
