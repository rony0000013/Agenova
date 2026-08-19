# Agenova — Decentralized AI Agent Service Marketplace

> **Empowering autonomous AI services with real-time Stellar micropayments and Soroban smart contract revenue sharing.**

[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-blue?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CAY55BKRJWKLH3UGHJ23FAOMVF5OBA66DWDCLDG4ZXJDMNDLIBAJ2MN5)
[![Soroban](https://img.shields.io/badge/Soroban-SDK_v21-purple?style=for-the-badge)](https://soroban.stellar.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🚀 Live Stellar Testnet Deployments

| Component | Network | Address / Hash | Explorer |
| :--- | :--- | :--- | :--- |
| **Soroban Smart Contract** | Stellar Testnet | `CAY55BKRJWKLH3UGHJ23FAOMVF5OBA66DWDCLDG4ZXJDMNDLIBAJ2MN5` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAY55BKRJWKLH3UGHJ23FAOMVF5OBA66DWDCLDG4ZXJDMNDLIBAJ2MN5) |
| **Platform Treasury Account** | Stellar Testnet | `GCKKLWVLYIMKSCR5LJHIFAHFWZMA23LN47KQ24JJ5TBG4IPCNND2TO37` | [View Account](https://stellar.expert/explorer/testnet/account/GCKKLWVLYIMKSCR5LJHIFAHFWZMA23LN47KQ24JJ5TBG4IPCNND2TO37) |
| **WASM Bytecode Hash** | Stellar Testnet | `25400ddca107127462e8138771486a74e210e53ec3312e8e8ce321b2fdd0a0e8` | — |
| **WASM Upload Tx** | Stellar Testnet | `4e4bacdcf546ecff7f8fff3f454353d0e237b379cad1916ec152c95ad84de97b` | [View Tx](https://stellar.expert/explorer/testnet/tx/4e4bacdcf546ecff7f8fff3f454353d0e237b379cad1916ec152c95ad84de97b) |
| **Contract Instantiation Tx** | Stellar Testnet | `5178a102a4626847a4eadd3fa4ceedfaf463e2df144cc4e5f2861b7eac9d6852` | [View Tx](https://stellar.expert/explorer/testnet/tx/5178a102a4626847a4eadd3fa4ceedfaf463e2df144cc4e5f2861b7eac9d6852) |

---

## 🌟 Executive Overview

**Agenova** is a decentralized marketplace that bridges AI developers and consumers through trustless, on-chain micropayments.

- **Pay-Per-Request AI**: Execute specialized AI agents for pennies using native Stellar ($XLM) micropayments.
- **Automated 80/20 Revenue Split**: 80% is instantly credited to the AI agent developer and 20% is routed to the platform treasury.
- **Soroban Governance**: On-chain service agreements, developer registration, and revenue tracking governed by Rust smart contracts.
- **Unified All-in-One Dashboard**: Explore agents, run live test executions, manage wallets, generate API keys, configure webhooks, and track revenue without page switching.
- **Freighter Wallet & Friendbot**: Seamless Web3 login with Freighter browser extension and built-in Testnet faucet (+10,000 XLM).

---

## 🏗️ Architecture

```
                                +-----------------------------------+
                                |         Freighter Wallet          |
                                |     (User / Developer Keys)       |
                                +-----------------+-----------------+
                                                  |
                                                  v
+-----------------------+              +---------------------+              +-----------------------+
|  Frontend Application | <=========>  |     FastAPI API     | <=========>  |  Stellar Testnet &    |
| (React 19 + Tailwind) |   REST/JWT   | (Auth / DB / Proxy) |  Horizon RPC |  Soroban Contracts    |
+-----------------------+              +----------+----------+              +-----------------------+
                                                  |
                                                  v
                                       +---------------------+
                                       |  LLM Inference Node |
                                       |  (OpenAI / Gemini)  |
                                       +---------------------+
```

---

## 📦 Project Structure

```
Proj7/
├── contract/                   # Soroban Smart Contracts (Rust SDK v21)
│   ├── src/
│   │   ├── agent_registry.rs   # Agent registration & catalog
│   │   ├── revenue_sharing.rs  # 80/20 revenue split & payout engine
│   │   └── service_agreement.rs# SLAs & usage limits
│   └── Cargo.toml
├── backend/                    # FastAPI Backend API
│   ├── app/
│   │   ├── models/             # SQLAlchemy ORM Models
│   │   ├── routers/            # API Endpoints (agents, wallet, auth, etc.)
│   │   ├── services/           # Stellar SDK & OpenAI Inference
│   │   └── main.py             # App entry point
│   ├── scripts/
│   │   └── deploy_testnet.py   # Live Stellar Testnet deployer
│   └── requirements.txt
├── frontend/                   # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/         # UI Design System (Modals, Toasts, Cards)
│   │   ├── pages/              # Dashboard, Marketplace, Studio, Wallet
│   │   └── stores/             # Zustand State Management
│   └── package.json
├── deploy_testnet.ps1          # One-click Windows PowerShell deployment
├── deploy_testnet.sh           # One-click Linux/macOS Bash deployment
└── README.md
```

---

## 🛠️ Quick Start Guide

### Prerequisites
- **Node.js**: v18+
- **Python**: v3.10+ (with `uv` or `pip`)
- **Rust & Cargo**: Latest stable with `wasm32v1-none` target

---

### 1. Run the Backend API

```bash
cd backend
# Create virtualenv & install dependencies
uv venv
uv pip install -r requirements.txt

# Start FastAPI server on port 8000
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
> API Docs will be available at: `http://localhost:8000/docs`

---

### 2. Run the Frontend UI

```bash
cd frontend
npm install
npm run dev
```
> Web Application will run at: `http://localhost:5173` (or `http://localhost:3000`)

---

### 3. Smart Contract Verification & Deployment

```bash
# Run 100% passing Rust contract unit tests
cd contract
cargo test

# Build optimized release WASM
cargo build --target wasm32v1-none --release

# Deploy fresh contract to Stellar Testnet
cd ../backend
.venv\Scripts\python.exe scripts/deploy_testnet.py
```

---

## 🌐 Hosting & Cloud Deployment

### Does the frontend need separate hosting?
**Yes!** In modern cloud architectures:
- **Frontend SPA**: Hosted on [Vercel](https://vercel.com) or [Netlify](https://netlify.com) for edge caching and global low-latency delivery.
- **Backend API**: Hosted on [Render](https://render.com), [Railway](https://railway.app), or [AWS ECS](https://aws.amazon.com) running Python FastAPI.
- **Smart Contracts**: Live on the **Stellar Testnet** / **Mainnet**.

### Deploying Frontend to Vercel
1. Push this repository to GitHub.
2. In Vercel, import `rony0000013/Agenova`.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable: `VITE_API_URL=https://your-backend-url.onrender.com`
5. Click **Deploy**.

---

## 📜 License

MIT License — free for open-source and commercial use.
