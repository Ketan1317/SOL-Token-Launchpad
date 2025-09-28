# Solana Faucet (React + Vite)

A simple **Solana Devnet Faucet** built with **React**, **Vite**, **Tailwind CSS**, and **Solana Wallet Adapter**.  
Allows users to connect their wallet, request an airdrop, and see their SOL balance.

---

## Features

- Connect Solana wallets (Phantom, etc.) using `@solana/wallet-adapter-react`.
- Request SOL airdrops from Devnet.
- View wallet balance in real-time.
- Responsive UI with Tailwind CSS.
- Toast notifications for errors and success.
- Loading state handling for airdrops.

---

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Solana Web3.js
- @solana/wallet-adapter-react
- React Toastify

---

## Getting Started

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd solana-faucet

Install dependencies
npm install

Run the development server
npm run dev
Open http://localhost:5173 to see the app.
