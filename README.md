# Makedon Transfer Money

**Global Money Transfer Platform** - Fast, Secure, 1% Commission

| | |
|---|---|
| **Location** | 1000 Skopje, Republic of North Macedonia |
| **Email** | makedontransfermoney@proton.me |
| **Innovator** | Doc. Dr. Sande Smiljanov |
| **License** | All rights reserved |

---

## Platform Overview

Makedon Transfer Money is a world-class global money transfer platform built in Skopje, North Macedonia. It offers international money transfers with only **1% commission** to **190+ countries** with **no limits**.

### Key Differentiators
- MKD as primary currency with NBRSM (National Bank of Republic of North Macedonia) exchange rates
- **7 unique WORLD-FIRST features** (no competitor has these!)
- **5 Super Tools 10+++** (Multi-Currency, Recurring, Bill Pay, Referral, Insurance)
- **22+ integrated Macedonian institutions and 9 banks** with real URLs
- **4 AI Agents** (Kimi, GPT, Harvey, Claude) working simultaneously
- **PEP Network** - 45+ Passive Earning Partners
- **Real Passive Income** - All partners earn real money from every transaction (70/30 split)
- **Sanctioned Assets Liberation** - Unique system for legally releasing frozen assets
- Complete Macedonian Bill Pay from diaspora
- Free transfer insurance on every transfer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | tRPC 11 + Hono + Drizzle ORM |
| Database | MySQL (TiDB) |
| Auth | OAuth 2.0 + JWT |
| i18n | react-i18next (50+ languages, Macedonian primary) |
| PWA | Service Worker + Manifest |
| AI | 4 Integrated AI Agents |

---

## Project Structure

```
app/
├── api/                    # Backend API
│   ├── auth-router.ts      # Authentication
│   ├── commission-router.ts # Commission, security, crypto, QR
│   ├── exchange-router.ts  # Exchange rates (NBRSM)
│   ├── fraud-router.ts     # Fraud detection + Interpol
│   ├── recipient-router.ts # Recipients management
│   ├── super-tools-router.ts # 5 Super Tools API
│   ├── pep-router.ts       # PEP Network + Real Partner Income
│   ├── tax-router.ts       # Tax center (UJP/NBRM)
│   ├── transfer-router.ts  # Core transfers
│   ├── unique-router.ts    # 7 World-First features
│   ├── middleware.ts       # tRPC middleware
│   └── queries/            # Database queries
│       ├── commission.ts
│       ├── connection.ts
│       ├── fraud.ts
│       ├── pep.ts
│       ├── pep-earnings.ts
│       ├── superTools.ts
│       ├── tax.ts
│       ├── transfers.ts
│       ├── unique.ts
│       └── users.ts
├── db/
│   └── schema.ts           # 40 database tables
├── src/
│   ├── pages/              # 28 pages
│   ├── components/         # Reusable components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   └── App.tsx             # Main router
└── public/                 # Static assets
```

---

## Features (30+)

### Core
- [x] Global Money Transfers (190+ countries)
- [x] **1% Commission** (lowest in industry)
- [x] Real-time NBRSM Exchange Rates
- [x] MKD as Primary Currency
- [x] Multi-Currency Accounts (10 currencies)
- [x] Recurring Transfers
- [x] Transfer History & Tracking
- [x] Commission Tracking
- [x] Recipient Management

### PEP Network (Passive Earning Partners) - UNIQUE
- [x] **45+ Partners** across 10 categories
- [x] **Real Passive Income** - partners earn from every transaction
- [x] **70/30 Revenue Split** - 70% to partners, 30% to platform
- [x] **Automatic Distribution** - AI-powered payout system
- [x] Partner categories: Banks, Telecom, Internet, Utilities, Government, International, Payment Systems, Crypto

### Sanctioned Assets Liberation - WORLD FIRST
- [x] **Russia-Ukraine War** frozen assets (EUR300+ billion)
- [x] **China & North Korea** sanctions
- [x] **Switzerland WWII** captured funds
- [x] **Central Bank Reserves**
- [x] **Oligarch & Individual sanctions**
- [x] **Trade Receivables**
- [x] 6 integrated verification institutions (IMF, World Bank, EIB, EBRD, BIS, ICC)

### 7 World-First Unique Features
- [x] **Money Journey** - 3D animated map of money path
- [x] **AI Currency Oracle** - AI-powered rate predictions
- [x] **Sande's Golden Book** - Hall of Fame
- [x] **Family Pool** - Shared family account
- [x] **Video Message** - Send video with money
- [x] **Emergency Cash Network** - 30-minute cash delivery
- [x] **AI Negotiator** - 4 AI agents negotiate best rates

### 5 Super Tools (10+++)
- [x] **Multi-Currency** - 10 currency accounts
- [x] **Recurring** - Automated scheduled transfers
- [x] **Bill Pay** - 20+ Macedonian institutions
- [x] **Referral** - Lifetime passive income program
- [x] **Insurance** - Free transfer insurance

### Security & Compliance
- [x] 2FA Authentication
- [x] Security Audit Logs
- [x] Fraud Detection (12 types)
- [x] PANIC Button (emergency freeze)
- [x] Interpol Integration
- [x] National ID Verification

### Financial Tools
- [x] Tax Center (UJP/NBRM integration)
- [x] Analytics Dashboard
- [x] SWOT Analysis
- [x] Crypto Payments (BTC, ETH, LTC, USDT)
- [x] QR Code Generation

### AI Features
- [x] 4 AI Agents (Kimi, GPT, Harvey, Claude)
- [x] AI Chatbot with Fee Calculator
- [x] AI Negotiator (4-agent bidding)
- [x] AI Currency Oracle

### Other
- [x] i18n Translator (50+ languages, Macedonian primary)
- [x] PWA (Progressive Web App)
- [x] Transaction Flow Visualization (20 steps)
- [x] 100 EUR Demo page
- [x] 20+ Integrated Macedonian Institutions
- [x] 9 Banking Partners

---

## Macedonian Bill Pay Partners (20+)

### Public Utilities (5)
- EVN Macedonia (evn.mk)
- Vodovod Skopje (vodovod-skopje.com.mk)
- ESM / Power Plants (esm.com.mk)
- Communal Hygiene (e.khigiena.com.mk)
- BEG District Heating (beg.com.mk)

### Telecommunications (2)
- Macedonian Telecom (telekom.mk)
- A1 Macedonia (a1.mk)

### Government Institutions (4)
- UJP - Public Revenue Office (ujp.gov.mk)
- City of Skopje (skopje.gov.mk)
- UVMK / Water & Sewage (e-portal.uvmk.gov.mk)
- e-Services eGov (uslugi.gov.mk)

### Health & Pensions (2)
- FZOM - Health Insurance Fund (fzom.gov.mk)
- PIOM - Pension Insurance (piom.com.mk)

### Banking Partners (9)
- Komercijalna Banka (online.kb.mk)
- Stopanska Banka (stb.com.mk)
- NLB Banka (nlb.mk)
- Halkbank (halkbank.mk)
- ProCredit Banka (pcb.mk)
- Silk Road Banka (srb.mk)
- UniBanka (unibank.mk)
- Alta Banka (altabanka.com.mk)
- TTK Banka (ttk.com.mk)

---

## Database Schema (38 Tables)

**Core:** users, recipients, transfers, exchangeRates, transactionLogs, supportedCountries

**Financial:** commissionLogs, emailNotifications, securityAuditLog, cryptoTransactions, qrCodes, partnerEarnings

**Security:** fraudAlerts, blockedUsers, idVerifications, verificationCodes, interpolReports, frozenAssets

**Tax:** taxRecords, taxPayments

**Unique Features:** transferJourneys, currencyPredictions, goldenBookEntries, familyPools, familyPoolMembers, videoMessages, emergencyRequests, negotiationBids

**Super Tools:** multiCurrencyAccounts, recurringTransfers, billPayments, referrals, transferInsurances

**PEP Network:** passiveEarningPartners, partnerEarnings

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Copyright

Copyright (c) 2025 Makedon Transfer Money. All rights reserved.

Innovated by **Doc. Dr. Sande Smiljanov**

No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the express **oral and written consent** of Doc. Dr. Sande Smiljanov.

---

## Contact

- **Email:** makedontransfermoney@proton.me
- **Location:** 1000 Skopje, Republic of North Macedonia
- **Innovator:** Doc. Dr. Sande Smiljanov
