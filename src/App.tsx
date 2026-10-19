
import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Toaster } from "react-hot-toast";

import "@solana/wallet-adapter-react-ui/styles.css";

import Launchpad from "./components/Launchpad";
import { BackgroundBeamsWithCollision } from "./components/ui/background-beams-with-collision";

function App() {
  const endpoint = "https://api.devnet.solana.com";

  const wallets = useMemo(
    () => [new UnsafeBurnerWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="relative min-h-screen overflow-hidden bg-[#080910] text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.17),transparent_65%)]"
            />

            <BackgroundBeamsWithCollision>
              <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
                <a href="#" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-xl font-bold text-violet-300">
                    ◎
                  </div>
                  <div>
                    <p className="font-semibold tracking-tight text-white">
                      Solana Launchpad
                    </p>
                    <p className="text-xs text-gray-500">
                      Token creation studio
                    </p>
                  </div>
                </a>

                <div className="flex items-center gap-3">
                  <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300 sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Solana Devnet
                  </span>

                  <WalletMultiButton className="!h-10 !rounded-xl !bg-violet-600 !px-4 !text-sm !font-semibold hover:!bg-violet-500" />
                </div>
              </header>

              <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-8 sm:pt-14">
                <Launchpad />
              </main>

              <footer className="relative z-10 border-t border-white/[0.07] px-5 py-6 text-center">
                <p className="text-xs text-gray-500">
                  Built for Solana developers · Devnet only · Test tokens have no real-world value
                </p>
              </footer>
            </BackgroundBeamsWithCollision>

            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: "#171724",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                },
              }}
            />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
