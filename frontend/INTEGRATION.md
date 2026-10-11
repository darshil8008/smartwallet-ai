# Mobile integration notes

The four tabs are Wallet, Activity, Insights, and Profile. Supported cards come from GET /api/cards; the offline catalog matches the teammate's card_a/card_b/card_c examples.

## Request contract

- POST /api/recommend receives { merchant_name, category, amount, cards }.
- POST /api/agent/explain receives { purchase: { merchant_name, category, amount, cards } }.
- Every card contains card_id, card_name, issuer, and reward_rules.
- Every reward rule contains category, cashback_rate, spending_cap, amount_spent, and fallback_rate.
- Catalog decimal rates are multiplied by 100 once at the request boundary. UI calculations retain decimal rates.
- Each card includes the all-category base rule.
- Profile removes cards from both request bodies and updates amount_spent for assumed cap usage. It preserves the catalog IDs and reward rates.
- Saving a matching simulated purchase increments that card's assumed category spending.

## Frontend-only features

Activity records estimated reward and an additional-reward comparison against the lowest-reward card available at the time of saving. Historical estimates remain snapshots when the wallet changes.

Insights groups saved activity by merchant and calculates a similar future purchase using the current selected cards and cap usage. It is deterministic, not an AI-generated claim. Benefits are hypothetical catalog rules, not current issuer promotions.

Preferences, cap overrides, and simulated activity last for the app session. No new profile, deals, or history endpoints are required or assumed. Persistent history and live offers need a separate agreed API contract.

## Verify

Run from frontend:

    node --test tests/api.test.cjs
    npm run typecheck

Manual checks: remove GroceryPlus and check the next recommendation; edit BonusMax's assumed spending; remove all cards and add one again; save two purchases at the same merchant and inspect Insights; plan a purchase from Insights; check Activity totals remain unchanged after card edits.

Web needs backend CORS support for the localhost origin, OPTIONS, POST, and Content-Type. Native mobile testing is still required. Credentials for AI inference stay on the backend.
