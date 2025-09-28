import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import '@solana/wallet-adapter-react-ui/styles.css';
import Launchpad from "./components/Launchpad";
import { BackgroundBeamsWithCollision } from "./components/ui/background-beams-with-collision";



function App() {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="bg-[#0b0e13] h-[100%] w-screen text-white flex items-center justify-center relative">
            <BackgroundBeamsWithCollision>
            <div className="absolute top-4 right-4 z-10">
              <WalletMultiButton />
            </div>
            <Launchpad />
            </BackgroundBeamsWithCollision>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
