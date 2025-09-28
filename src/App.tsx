import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import Launchpad from "./components/Launchpad";
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="bg-[#0b0e13] h-screen w-screen text-white flex items-center justify-center relative">
            <Toaster />
            <div className="absolute top-4 right-4 z-10">
              <WalletMultiButton>Connect</WalletMultiButton>
            </div>
            <Launchpad />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;