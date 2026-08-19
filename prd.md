**Product Requirements Document**

**Project 7: AI Agent Service Marketplace**

**Executive Summary**

AI Agent Service Marketplace is a decentralized platform where developers publish AI agents that

users access through Stellar micropayments. Soroban governs service agreements and revenue

sharing, while Corsair connects external productivity and developer platforms.

**Problem Statement**

AI services are fragmented across providers, rely on expensive subscription models, and lack

transparent revenue sharing and seamless workflow automation.

**Objectives**

Enable pay-per-use AI services, transparent revenue distribution, programmable service

agreements, and automated third-party integrations.

**Target Users**

AI Developers, Businesses, Individual Users, Enterprises, Platform Administrators.

**Core Features**

AI agent marketplace, pay-per-request billing, subscription plans, agent ratings, usage analytics,

prompt history, revenue dashboard, API access, developer portal.

**Technology Stack**

Frontend: Next.js. Backend: NestJS. Database: PostgreSQL. Blockchain: Stellar + Soroban.

Automation: Corsair. AI APIs: OpenAI and other LLM providers.

**Stellar Integration**

Micropayments using XLM or Stellar assets, x402-secured AI API requests, instant creator payouts,

recurring subscriptions, multisignature treasury wallets.

**Soroban Smart Contracts**

Service Agreement Contract, Revenue Sharing Contract, Subscription Contract, Agent Registry

Contract, and Usage Settlement Contract.

**Corsair Integrations**

GitHub, Gmail, Slack, Notion, Google Drive, CRM platforms, webhook automation, OAuth-secured

integrations for enterprise workflows.

**User Flow**

Developer publishes AI agent **→** User discovers agent **→** Payment processed via Stellar **→**

Soroban validates entitlement and revenue split **→** AI executes request **→** Corsair synchronizes

**external workflows.****Functional Requirements**

Authentication, wallet management, agent publishing, billing, subscriptions, API key management,

analytics, integrations, reporting, administration.

**Non-Functional Requirements**

High availability, scalable inference integration, secure secret management, low-latency request

handling, immutable audit logs.

**Security**

OAuth2, RBAC, encrypted API keys, signed webhooks, multisignature wallets, blockchain audit

trail, abuse detection and rate limiting.

**API Modules**

Authentication, Agents, Billing, Wallets, Payments, Usage, Integrations, Notifications, Analytics,

Admin.

**Database Entities**

Users, AI Agents, Subscriptions, Wallets, Transactions, Usage Logs, Revenue Shares,

Integrations, Notifications, Audit Logs.

**Development Roadmap**

Phase 1: Marketplace and authentication. Phase 2: Stellar micropayments and x402. Phase 3:

Soroban smart contracts. Phase 4: Corsair integrations. Phase 5: Analytics and production

deployment.



General Questions

1. Tech Stack Preference
   Your PRD specifies Next.js + NestJS + PostgreSQL + Stellar/Soroban. My default environment uses React + FastAPI + MongoDB. Which do you prefer?

Ans: Option A: Insist on Next.js + NestJS + PostgreSQL

2. Blockchain & Micropayment Settlement Architecture
   The PRD mentions x402-secured AI API requests and pay-per-request micropayments using Stellar. How should we execute the micropayment verification flow for the MVP?

Ans: Option A: On-Chain Hash/Memo Verification (Recommended: Pre-funded user balance or per-request Stellar Testnet XLM transactions with on-chain hash validation via backend before AI execution).

3. Payment Models Supported
   Should the initial build support both pay-per-request micropayments and recurring subscriptions?

Ans: Option A: Pay-per-request XLM micropayments only (pure Web3 pay-as-you-go).

4. Corsair Automation Scope
   "Corsair" handles external workflow synchronizations (GitHub, Slack, Notion, Google Drive). How should this be handled for the MVP?

Ans: Option B: Include light webhooks (e.g., export AI output directly to JSON/Markdown or trigger external webhook URLs upon execution).

5. Core MVP Focus
   Where should we concentrate the primary user experience for the first pass?

Ans: Option C (Balanced Marketplace MVP): End-to-end flow: Developer registers agent → User discovers & pays via Stellar → Live AI execution & streaming response → On-chain revenue split record.

Constraint Questions

1. Hosting Environment & Stack Constraint
   My primary hosting setup has pre-configured services tuned for React (Port 3000) + FastAPI (Port 8001) with MongoDB. Moving to NestJS + PostgreSQL involves local container configuration overhead.

How do you want to proceed?

Ans: Option A (Fastest Path): React + FastAPI + PostgreSQL (or MongoDB) — preserving all Stellar micropayments, AI agent execution, and revenue tracking.

2. Stellar Testnet Keypair Setup
   For verifying micropayments and routing developer payouts on the Stellar Testnet:

Ans: Option B (Manual Keys): You will supply pre-existing Stellar Testnet keys.

3. User Wallet Connection
   How should marketplace users authenticate and authorize XLM micropayments?

Ans: Option A: Freighter Wallet Extension (User signs each request or deposits into a prepaid platform smart escrow).

4. UI Design Aesthetic & Theme
   Which visual style best suits this AI Marketplace?

Ans: Option B (Modern SaaS / Clean Glassmorphism): Deep indigo/slate, sleek blur cards, high-contrast typography, crisp metrics charts.

Product-Specific Technical Questions

1. AI Model Execution Engine
   How should the marketplace actually execute the AI agents?

Ans: Option A: Use live LLM API keys (OpenAI / Anthropic / Gemini / Groq) provided by the backend to run pre-configured specialized prompts.

2. Response Streaming vs. Polling
   AI request execution can take several seconds. Should the execution interface support real-time token streaming?

Ans: Option B: Standard async HTTP POST response (Simpler, returns full payload once generated).

3. Revenue Split Execution Model
   When a user pays $XLM for an agent invocation (e.g., 80% to Developer, 20% to Platform Treasury):

Ans: Option A: Real-Time On-Chain Split: Backend splits and submits two output payments in the same Stellar transaction envelope.
