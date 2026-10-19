# 🚀 Solana Token Launchpad

A simple and interactive launchpad for creating custom tokens on the Solana Devnet. Add your token details, upload a logo, set the initial supply, and mint your token directly to your wallet.

## ✨ Features

- Create custom tokens using Token-2022
- Set token name, symbol, decimals, and supply
- Upload token logos and metadata to IPFS using Pinata
- Connect a Solana wallet
- Preview token details before creation
- View mint and token account addresses

## 🛠️ Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Solana Web3.js
- SPL Token-2022
- Solana Wallet Adapter
- Pinata IPFS

## ⚙️ Getting Started

```bash
git clone https://github.com/Ketan1317/SOL-Token-Launchpad.git
cd SOL-Token-Launchpad
npm install
```

Create a `.env` file and configure your Pinata credentials:

```env
VITE_PINATA_JWT=your_pinata_jwt
VITE_PINATA_GATEWAY=your_pinata_gateway
```

Start the development server:

```bash
npm run dev
```

## 🌐 Network

This project currently uses **Solana Devnet**. Tokens created here are for testing and have no real-world monetary value.

## ⚠️ Security

Never commit secrets or API credentials to GitHub. For production deployments, move Pinata authentication to a secure backend.

## 📄 License

Add a license if you intend to distribute or reuse this project publicly.
