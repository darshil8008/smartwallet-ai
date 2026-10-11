# Mobile integration notes

The four tabs are Wallet, Activity, Insights, and Profile. For the submission recording, the mobile app uses a curated local catalog of four published products and eight Kansas City businesses around 330 W 9th St. GET /api/cards and /api/merchants still serve synthetic catalogs; they intentionally do not overwrite the presentation catalogs. POST endpoints still receive the selected full card objects, with product IDs and issuer names. The backend must evaluate submitted reward_rules rather than hardcode the earlier card IDs.

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

Insights groups saved activity by merchant and calculates a similar future purchase using the current selected cards and cap usage. It is deterministic, not an AI-generated claim. Benefits are a supported subset of published product rules, not personalized issuer promotions. Citi assumes eligible payment to receive the second 1%; portal-only offers and introductory bonuses are excluded. Card ownership and prior spend are assumed.

Preferences, cap overrides, and simulated activity last for the app session. No new profile, deals, or history endpoints are required or assumed. Persistent history and live offers need a separate agreed API contract.

## Verify

Run from frontend:

    node --test tests/api.test.cjs
    npm run typecheck

Manual checks: groceries select Amex, dining selects Chase, books select Citi; set Amex grocery spending to $5,980 and try $180 to show the cap changing the winner; remove a card and check the next recommendation; remove all cards and add one again; save two purchases at the same merchant and inspect Insights; plan a purchase from Insights; check Activity totals remain unchanged after card edits.

Web needs backend CORS support for the localhost origin, OPTIONS, POST, and Content-Type. Native mobile testing is still required. Credentials for AI inference stay on the backend.

## Submission catalog sources (checked 2026-10-10)

Source URLs are stored with each card and merchant in src/catalog.ts. Artwork is product-inspired native UI, not issuer-provided artwork. The selected address is fixed, not GPS-detected. Merchant categories remain assumed and payment MCCs are unverified. No payment or issuer-account connection is made.
