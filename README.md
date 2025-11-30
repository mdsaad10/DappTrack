# 🌍 DappTrack - Government Transparency Platform

[![Aptos](https://img.shields.io/badge/Aptos-Testnet-blue)](https://aptos.dev)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178c6)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)

**DappTrack** is a blockchain-based transparency platform built on Aptos that enables governments and NGOs to track donations, manage funds, and provide public accountability for all expenses with immutable proof storage on IPFS.

## ✨ Features

### 🎯 Core Functionality
- **Track Donations** - Monitor all donations with organization and project-level filtering
- **Make Donations** - Donate APT to specific projects within organizations
- **Verify Expenses** - Public transparency with IPFS-backed expense proofs
- **Project Delivery** - Track project status and completion
- **Audit Trail** - Complete timeline of all donations and expenses
- **User Guide** - Comprehensive documentation for all user types

### 🔐 Blockchain Features
- **Aptos Smart Contracts** - Immutable transaction records on Aptos blockchain
- **Wallet Integration** - Support for Petra, Pontem, and Martian wallets
- **IPFS Storage** - Decentralized proof document storage via Pinata
- **Public Verification** - Anyone can audit expenses without wallet connection
- **Real-time Updates** - Auto-refresh for latest blockchain data

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Aptos wallet (Petra recommended)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mdsaad31/DappTrack.git
cd DappTrack/dapptrack
```

2. **Install dependencies**
```bash
npm install
cd backend && npm install && cd ..
```

3. **Configure environment**
```bash
# Create .env file with required variables
# See DEPLOYMENT_GUIDE.md for details
```

4. **Start development servers**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm start
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📁 Project Structure

```
dapptrack/
├── frontend/              # React frontend
│   ├── pages/            # Application pages
│   ├── components/       # UI components
│   ├── entry-functions/  # Blockchain writes
│   └── view-functions/   # Blockchain reads
├── backend/              # Express API
│   └── server.js         # API + IPFS
├── contract/             # Move contracts
│   └── sources/          # Smart contracts
└── public/               # Static assets
```

## 🔧 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, Aptos SDK, Pinata IPFS
- **Blockchain:** Aptos Testnet, Move language
- **Storage:** IPFS via Pinata

## 📦 Smart Contract

**Deployed on Aptos Testnet:**  
`0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b`

[View on Explorer](https://explorer.aptoslabs.com/account/0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b?network=testnet)

## 🌐 Deployment

### Build for Production
```bash
npm run build
```

### Deploy
- **Vercel:** `vercel --prod`
- **Netlify:** `netlify deploy --prod --dir=dist`

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.

## 📝 License

Apache 2.0 License - see [LICENSE](LICENSE)

## 🔗 Links

- **Documentation:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Aptos Docs:** https://aptos.dev

---

**⭐ Star this repo if you find it helpful!**

**Built with Aptos blockchain 🚀**
