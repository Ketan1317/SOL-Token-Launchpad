import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// useConnection() → React hook that gives you the Solana connection object (RPC client) from the ConnectionProvider
// useWallet() → Hook that gives wallet state and helper methods (wallet.publicKey, wallet.sendTransaction(...), wallet.signTransaction, wallet.connected)
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
// Keypair → generate new Solana keypairs (used to create the new mint account)
// SystemProgram → Solana built-in program used to create accounts (createAccount)
// Transaction → build transactions that combine multiple instructions
import React, { useRef, useState } from "react";
import {
  createAssociatedTokenAccountInstruction, // create the Associated Token Account (ATA) to hold tokens for a wallet and a mint
  createInitializeMetadataPointerInstruction, // create an on-chain metadata pointer extension slot for the mint
  createInitializeMint2Instruction, // initialize an SPL token mint
  createMintToInstruction, // mint tokens into an ATA.
  ExtensionType,
  getAssociatedTokenAddressSync, // deterministic calculation of the ATA address for owner + mint
  getMintLen, // returns required account space (bytes) for a min
  TOKEN_2022_PROGRAM_ID, // program id for token-2022
  LENGTH_SIZE,
  TYPE_SIZE, // constants used to compute serialized metadata length
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
// pack - serializes metadata into bytes so you can compute the length
// createInitializeInstruction → sets up the on-chain metadata account with name, symbol, and uri.
import { PinataSDK } from "pinata";
import toast from "react-hot-toast";

function Launchpad() {
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [decimals, setDecimals] = useState<number>(9);
  const [supply, setSupply] = useState<number>(1000);

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [desc, setDesc] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  const createToken = async (metaDataURL: string) => {
    if (
      !wallet.publicKey ||
      name == "" ||
      symbol == "" ||
      imgFile == null ||
      desc == ""
    ) {
      toast.error(
        "Please Ensure That you have filled all the neccessary Details"
      );
      return;
    }
    const mint = Keypair.generate(); // Generates a new keypair that will be the mint account (the token's address).

    // Metadata object used by pack() to calculate bytes length and later to initialize the metadata pointer
    const metadata = {
      mint: mint.publicKey,
      name: name,
      symbol: symbol,
      uri: metaDataURL,
      additionalMetadata: [],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]); // mintLen → amount of space (bytes) required for a mint account
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length; // pack(metadata).length → the serialized metadata length in bytes
    // getMinimumBalanceForRentExemption(...) → asks the RPC how many lamports are required to make the new account rent-exempt. This ensures your created account won’t get reclaimed.
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen
    );

    // Building the first transaction (create mint account + initialize extensions)
    const transaction = new Transaction().add(
        // creates a new account on-chain with space equal to mintLen and owned by TOKEN_2022_PROGRAM_ID (this will be the mint account)
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: lamports,
        space: mintLen,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      // initializes the metadata pointer extension for the mint
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
        uri: metadata.name,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      })
    );
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.partialSign(mint);
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (name == "" || symbol == "" || imgFile == null || desc == "") {
      toast.error(
        "Please Ensure That you have filled all the neccessary Details"
      );
      return;
    }

    // PINATA config
    const pinata = new PinataSDK({
      pinataJwt: import.meta.env.VITE_PINATA_JWT,
      pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
    });

    // Uploading image to get cid
    const uploadIMG = await pinata.upload.public.file(imgFile);
    const cid = uploadIMG.cid;
    const imgURL = `${import.meta.env.VITE_PINATA_GATEWAY}/${cid}`;

    const metaDataJSON = {
      name: name,
      symbol: symbol,
      description: desc,
      image: imgURL,
    };

    // uploading the meta Data
    const upload_JSON = await pinata.upload.public.json({
      content: metaDataJSON,
      name: "meta_data_JSON.json",
    });
    const metaDATAcid = upload_JSON.cid;
    const meta_data_URL = `${
      import.meta.env.VITE_PINATA_GATEWAY
    }/${metaDATAcid}`;

    // Finally creating the token
    createToken(meta_data_URL);
  };

  return <></>;
}

export default Launchpad;
