# SmartWallet AI

SmartWallet AI is an AI-powered credit-card rewards optimization application built for Hack Midwest 2026.

## Live Application

**Website:** https://smartwallet.172.232.30.221.sslip.io

The application is publicly deployed on Akamai Cloud with HTTPS. No local installation is required to use the web application.

## Technology Stack

- **Frontend:** Expo, React Native, TypeScript
- **Backend:** Python, FastAPI, Pydantic
- **AI Agent:** AWS Strands Agents SDK
- **AI Inference:** Akamai AI Inference
- **Cloud Hosting:** Akamai Cloud, Ubuntu, Caddy

## Project Structure

- `frontend/` — Official application with Wallet, Activity, Insights, and Profile
- `backend/` — Rewards engine, FastAPI endpoints, and Strands agent
- `data/` — Synthetic test catalogs
- `deployment/` — Backend preview utilities
- `scripts/` — Validation and inference tests

## Features

- Compare estimated rewards from supported credit cards.
- Recommend the highest-reward card for a selected purchase.
- Account for reward categories, spending caps, and fallback rates.
- Generate AI-powered explanations using AWS Strands and Akamai.
- Track simulated purchases and view spending insights.
- Manage supported cards and assumed spending in the Profile tab.

## Local Development (Optional)

The application is already publicly deployed. These instructions are only for developers who want to run or modify the source code.

From the repository root:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npx expo start --web --port 8083
```

Open `http://localhost:8083`.

## Testing

From `frontend/`:

```powershell
node --test tests/api.test.cjs
npm run typecheck
```

From `backend/`, after installing the backend dependencies:

```bash
python -m pytest -q tests/
```

## Prototype Disclosures

SmartWallet AI calculates estimated rewards using modeled card terms and assumed merchant categories. Purchases are simulated; no payment processing or bank-account integration occurs. Profile information and simulated activity are stored only in application-session memory. The card-addition preview does not enroll or connect a credit card.