const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function compile(name, dependencies = {}) {
  const module = { exports: {} };
  const context = {
    module, exports: module.exports, process: { env: {} }, console: { warn() {} },
    AbortController, setTimeout, clearTimeout,
    fetch: async () => { throw new Error('Offline'); },
    require: id => dependencies[id],
  };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, context);
  return { context, exports: module.exports };
}
const contracts = compile('contracts').exports;
const cards = contracts.DEMO_CARDS;
const merchant = contracts.DEMO_MERCHANTS[0];
const plain = value => JSON.parse(JSON.stringify(value));
const liveRanking = {
  merchant_name: merchant.name, purchase_amount: 180, recommended_card: 'GroceryPlus',
  rankings: [
    { card_id: 'card_b', card_name: 'GroceryPlus', estimated_cashback: 5.4, effective_rate: 3, explanation: '3% groceries' },
    { card_id: 'card_c', card_name: 'Everyday2', estimated_cashback: 3.6, effective_rate: 2, explanation: '2% flat' },
    { card_id: 'card_a', card_name: 'BonusMax', estimated_cashback: 2.6, effective_rate: 1.44, explanation: 'Cap reached' },
  ],
};
function apiHarness() {
  return compile('api', {
    './contracts': contracts,
    'react-native': { Platform: { OS: 'web' } },
    'expo-constants': { default: { expoConfig: {}, isDevice: false } },
  });
}
test('purchase converts decimal rates once, preserves caps, and supplies unmatched-category rules', () => {
  const purchase = contracts.buildPurchase(merchant, 180, cards);
  assert.equal(purchase.category, 'groceries');
  assert.equal(purchase.cards[0].reward_rules[0].cashback_rate, 5);
  assert.equal(purchase.cards[0].reward_rules[0].spending_cap, 500);
  assert.equal(purchase.cards[0].reward_rules[0].amount_spent, 480);
  assert.equal(purchase.cards[0].reward_rules[0].fallback_rate, 1);
  assert.equal(purchase.cards[1].reward_rules[0].cashback_rate, 3);
  assert.equal(purchase.cards[2].reward_rules[0].category, 'all');
  assert.equal(purchase.cards[2].reward_rules[0].cashback_rate, 2);
  assert.throws(() => contracts.buildPurchase(merchant, 0, cards));
  assert.throws(() => contracts.buildPurchase(merchant, 180, []));
});
test('catalog supplies UI fields without claiming a verified MCC or real card network', () => {
  const card = contracts.normalizeCard({ id: 'x', display_name: 'Example (Demo)', base_rate: .0175, bonus_rules: [] });
  assert.equal(card.name, 'Example');
  assert.equal(card.network, 'DEMO');
  assert.equal(contracts.convertCardForBackend(card).reward_rules[0].cashback_rate, 1.75);
  assert.equal(contracts.normalizeMerchant({ id: 'x', name: 'Example', category: 'grocery' }).category, 'groceries');
  assert.equal(merchant.mcc, 'unverified');
});
test('local ranking uses the submitted catalog and cap arithmetic for grocery and other categories', () => {
  const grocery = contracts.calculateRecommendation(merchant, 180, cards);
  assert.deepEqual(plain(grocery.ranked_cards.map(row => row.estimated_cashback)), [5.4, 3.6, 2.6]);
  const other = contracts.calculateRecommendation(contracts.DEMO_MERCHANTS[5], 180, cards);
  assert.equal(other.best_card.id, 'card_c');
  assert.equal(other.estimated_cashback, 3.6);
  const custom = [{ ...cards[2], id: 'custom', name: 'Custom', base_rate: .04 }];
  assert.equal(contracts.calculateRecommendation(merchant, 180, custom).estimated_cashback, 7.2);
});
test('backend rankings map IDs to artwork and keep UI percentage rates as fractions', () => {
  const mapped = contracts.normalizeRecommendation(liveRanking, merchant, 180, cards);
  assert.equal(mapped.best_card.id, 'card_b');
  assert.equal(mapped.ranked_cards[0].card.accent, cards[1].accent);
  assert.ok(Math.abs(mapped.ranked_cards[0].effective_rate - .03) < 1e-12);
  assert.throws(() => contracts.normalizeRecommendation({ ...liveRanking, recommended_card: 'Unknown' }, merchant, 180, cards));
  assert.throws(() => contracts.normalizeRecommendation({ ...liveRanking, purchase_amount: 200 }, merchant, 180, cards));
  assert.throws(() => contracts.normalizeRecommendation({ ...liveRanking, rankings: liveRanking.rankings.slice(1) }, merchant, 180, cards));
});
test('recommendation sends purchase directly, explanation wraps it, and source flag controls AI label', async () => {
  const { context, exports: api } = apiHarness();
  const requests = [];
  context.fetch = async (url, init) => {
    requests.push({ url, init });
    return { ok: true, json: async () => url.endsWith('/api/recommend') ? liveRanking : { recommended_card: 'GroceryPlus', explanation: 'Tool-backed response', source: 'strands-akamai', ai_generated: true } };
  };
  const result = await api.getRecommendation(merchant, 180, cards);
  assert.equal(result.offline, false);
  assert.equal(JSON.parse(requests[0].init.body).cards[0].reward_rules[0].cashback_rate, 5);
  const explained = await api.getExplanation(merchant, 180, undefined, result.data, cards);
  assert.deepEqual(JSON.parse(requests[1].init.body), { purchase: plain(contracts.buildPurchase(merchant, 180, cards)) });
  assert.equal(explained.data.agent_used, true);
  assert.equal(explained.data.provider, 'akamai-strands');
  context.fetch = async () => ({ ok: true, json: async () => ({ recommended_card: 'GroceryPlus', explanation: 'Server fallback', source: 'deterministic', ai_generated: false }) });
  assert.equal((await api.getExplanation(merchant, 180, undefined, result.data, cards)).data.agent_used, false);
});
test('offline explanation retains comparison and malformed successful responses cannot masquerade as live', async () => {
  const { context, exports: api } = apiHarness();
  const recommendation = await api.getRecommendation(merchant, 180, cards);
  const explanation = await api.getExplanation(merchant, 180, undefined, recommendation.data, cards);
  for (const value of ['$5.40', '$3.60', '$2.60', '$20.00 at 5%', '$160.00 at 1%', '$2.80 less']) assert.ok(explanation.data.explanation.includes(value));
  assert.equal(explanation.offline, true);
  assert.equal(explanation.data.agent_used, false);
  context.fetch = async () => ({ ok: true, json: async () => ({ explanation: 'Unverified response' }) });
  assert.equal((await api.getExplanation(merchant, 180, undefined, recommendation.data, cards)).offline, true);
  assert.equal((await api.getRecommendation(merchant, 180, cards)).offline, true);
});

const walletState = compile('walletState', { './contracts': contracts }).exports;
test('profile card removal and cap edits affect requests and ranking without changing IDs or rates', () => {
  const selected = walletState.walletCards(cards, ['card_b'], { card_a: { groceries: 500 } });
  const purchase = contracts.buildPurchase(merchant, 180, selected);
  assert.deepEqual(plain(purchase.cards.map(card => card.card_id)), ['card_a', 'card_c']);
  assert.equal(purchase.cards[0].reward_rules[0].amount_spent, 500);
  assert.equal(purchase.cards[0].reward_rules[0].cashback_rate, 5);
  assert.equal(contracts.calculateRecommendation(merchant, 180, selected).best_card.id, 'card_c');
  assert.equal(cards[0].bonus_rules[0].spent_to_date, 480);
  assert.equal(walletState.walletCards(cards, cards.map(card => card.id), {}).length, 0);
});
test('saving a capped purchase updates its assumed usage, including repeated purchases', () => {
  const first = walletState.recordPurchaseSpend(cards[0], merchant, 20, {});
  assert.equal(first.card_a.groceries, 500);
  const second = walletState.recordPurchaseSpend(cards[0], merchant, 180, first);
  assert.equal(second.card_a.groceries, 680);
  const dining = walletState.recordPurchaseSpend(cards[0], contracts.DEMO_MERCHANTS[1], 10, second);
  assert.equal(dining, second);
  assert.equal(walletState.recordPurchaseSpend(cards[1], merchant, 180, {}).card_b, undefined);
});
test('saved comparisons remain historical snapshots while insights use the current wallet', async () => {
  const { exports: api } = apiHarness();
  const comparison = contracts.calculateRecommendation(merchant, 180, cards);
  const saved = (await api.saveTransaction(merchant, cards[1], 180, cards, comparison)).data;
  assert.equal(saved.extra_rewards, 2.8);
  assert.equal(saved.baseline_card_name, 'BonusMax');
  const second = { ...saved, id: 'another', amount: 60, estimated_rewards: 1.8, extra_rewards: .4 };
  const summary = walletState.rewardSummary([saved, second]);
  assert.equal(summary.spent, 240);
  assert.equal(summary.rewards, 7.2);
  assert.equal(summary.extra, 3.2);
  const insights = walletState.spendingInsights([saved, second], [cards[2]]);
  assert.equal(insights[0].count, 2);
  assert.equal(insights[0].average, 120);
  assert.equal(insights[0].next.best_card.id, 'card_c');
  assert.equal(insights[0].next.estimated_cashback, 2.4);
  assert.equal(walletState.spendingInsights([saved], [])[0].next, null);
  assert.equal(walletState.spendingInsights([], cards).length, 0);
  assert.equal(walletState.rewardSummary([saved, second]).extra, 3.2);
});
