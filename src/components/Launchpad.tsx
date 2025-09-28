import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useState } from "react";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  LENGTH_SIZE,
  TYPE_SIZE,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import { PinataSDK } from "pinata";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

function Launchpad() {
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [decimals, setDecimals] = useState<number>(9);
  const [supply, setSupply] = useState<number>(1000);

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [desc, setDesc] = useState<string>("");
  const [msg, setMsg] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  const createToken = async (metaDataURL: string) => {
    if (!wallet.publicKey || name === "" || symbol === "" || imgFile == null || desc === "") {
      toast.error("Please fill all required details");
      return;
    }

    const mint = Keypair.generate();

    const metadata = {
      mint: mint.publicKey,
      name: name,
      symbol: symbol,
      uri: metaDataURL,
      additionalMetadata: [],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen
    );

    // Transaction 1 — Create the Mint & Metadata
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: lamports,
        space: mintLen,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mint.publicKey,
        wallet.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMint2Instruction(
        mint.publicKey,
        Number(decimals),
        wallet.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        metadata: mint.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      })
    );

    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.partialSign(mint);

    await wallet.sendTransaction(transaction, connection);
    setMsg((prev) => [...prev, "✅ Mint Created : " + mint.publicKey.toBase58()]);

    const associatedToken = getAssociatedTokenAddressSync(
      mint.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    setMsg((prev) => [...prev, "📦 ATA Address : " + associatedToken.toBase58()]);


    // Transaction 2 — Create Associated Token Account (ATA)
    const transaction2 = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedToken,
        wallet.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await wallet.sendTransaction(transaction2, connection);

    // Transaction 3 — Mint Tokens into ATA
    const transaction3 = new Transaction().add(
      createMintToInstruction(
        mint.publicKey,
        associatedToken,
        wallet.publicKey,
        Number(supply),
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
    await wallet.sendTransaction(transaction3, connection);

    setMsg((prev) => [...prev, "🎉 Token Minted!"]);
    setLoading(false);
    toast.success("Token Minted Successfully!");
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (name === "" || symbol === "" || imgFile == null || desc === "") {
      toast.error("Please fill all required details");
      setLoading(false);
      return;
    }

    try {
      const pinata = new PinataSDK({
        pinataJwt: import.meta.env.VITE_PINATA_JWT,
        pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
      });

      const uploadIMG = await pinata.upload.public.file(imgFile);
      const cid = uploadIMG.cid;
      const imgURL = `${import.meta.env.VITE_PINATA_GATEWAY}/${cid}`;

      const metaDataJSON = {
        name: name,
        symbol: symbol,
        description: desc,
        image: imgURL,
      };

      const upload_JSON = await pinata.upload.public.json({
        content: metaDataJSON,
        name: "meta_data_JSON.json",
      });
      const metaDATAcid = upload_JSON.cid;
      const meta_data_URL = `${import.meta.env.VITE_PINATA_GATEWAY}/${metaDATAcid}`;

      await createToken(meta_data_URL);
    } catch (error) {
      console.error(error);
      toast.error("Error uploading to Pinata or creating token");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100%] w-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-5xl font-bold text-center mb-4">Token Launchpad </h1>
      <p className="font-bold text-center text-xl">Create and deploy your very own Solana SPL token in minutes — no coding required</p>
      <div className="w-full max-w-2xl rounded-lg shadow-2xl p-8 mt-10">
        

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Token Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg  border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Token Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full p-3 rounded-lg  border border-gray-700 focus:outline-none focus:border-indigo-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Decimals"
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              className="w-full p-3 rounded-lg  border border-gray-700 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder="Supply"
              value={supply}
              onChange={(e) => setSupply(Number(e.target.value))}
              className="w-full p-3 rounded-lg  border border-gray-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <textarea
            placeholder="Token Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full p-3 rounded-lg  border border-gray-700 focus:outline-none focus:border-indigo-500"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImgFile(e.target.files?.[0] || null)}
            className="w-full p-2 rounded-lg  border border-gray-700 text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#6C2DC7] file:text-white hover:file:bg-[#8A2BE2]"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#6C2DC7] hover:bg-[#8A2BE2] cursor-pointer transition-colors py-3 rounded-lg font-semibold text-white flex items-center justify-center"
          >
            
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Mint Token"}
          </button>
        </div>

        {msg.length > 0 && (
          <div className="mt-6 p-4 rounded-lg text-sm space-y-1 overflow-y-auto max-h-40 border border-gray-800">
            {msg.map((m, i) => (
              <p key={i} className="text-gray-300">{m}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Launchpad;
