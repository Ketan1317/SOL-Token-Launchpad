
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
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
import {
  ImagePlus,
  Coins,
  FileText,
  Hash,
  Layers3,
  Loader2,
  Upload,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Sparkles,
  X,
} from "lucide-react";

function Launchpad() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState(1000);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [mintAddress, setMintAddress] = useState("");
  const [ataAddress, setAtaAddress] = useState("");

  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    if (!imgFile) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(imgFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imgFile]);

  const addMessage = (message: string) => {
    setMsg((previous) => [...previous, message]);
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Unable to copy this value");
    }
  };

  const createToken = async (metaDataURL: string) => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      throw new Error("Connect a wallet before creating your token.");
    }

    const mint = Keypair.generate();

    const metadata = {
      mint: mint.publicKey,
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      uri: metaDataURL,
      additionalMetadata: [],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen
    );

    const latestBlockhash = await connection.getLatestBlockhash("confirmed");

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports,
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
        decimals,
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
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.partialSign(mint);

    const mintSignature = await wallet.sendTransaction(
      transaction,
      connection
    );

    await connection.confirmTransaction(
      {
        signature: mintSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed"
    );

    setMintAddress(mint.publicKey.toBase58());
    addMessage(`Mint created: ${mint.publicKey.toBase58()}`);

    const associatedToken = getAssociatedTokenAddressSync(
      mint.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    setAtaAddress(associatedToken.toBase58());

    const ataBlockhash = await connection.getLatestBlockhash("confirmed");
    const transaction2 = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedToken,
        wallet.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );

    transaction2.feePayer = wallet.publicKey;
    transaction2.recentBlockhash = ataBlockhash.blockhash;

    const ataSignature = await wallet.sendTransaction(
      transaction2,
      connection
    );

    await connection.confirmTransaction(
      {
        signature: ataSignature,
        blockhash: ataBlockhash.blockhash,
        lastValidBlockHeight: ataBlockhash.lastValidBlockHeight,
      },
      "confirmed"
    );

    addMessage(`Token account created: ${associatedToken.toBase58()}`);

    const baseUnits = BigInt(supply) * 10n ** BigInt(decimals);
    const mintBlockhash = await connection.getLatestBlockhash("confirmed");

    const transaction3 = new Transaction().add(
      createMintToInstruction(
        mint.publicKey,
        associatedToken,
        wallet.publicKey,
        baseUnits,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    transaction3.feePayer = wallet.publicKey;
    transaction3.recentBlockhash = mintBlockhash.blockhash;

    const supplySignature = await wallet.sendTransaction(
      transaction3,
      connection
    );

    await connection.confirmTransaction(
      {
        signature: supplySignature,
        blockhash: mintBlockhash.blockhash,
        lastValidBlockHeight: mintBlockhash.lastValidBlockHeight,
      },
      "confirmed"
    );

    addMessage(`Successfully minted ${supply.toLocaleString()} ${symbol.toUpperCase()}`);
    toast.success("Your token was created successfully!");
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!wallet.publicKey) {
      toast.error("Connect your wallet first.");
      return;
    }

    if (!name.trim() || !symbol.trim() || !imgFile || !desc.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (name.trim().length > 32 || symbol.trim().length > 10) {
      toast.error("Name must be at most 32 characters and symbol at most 10.");
      return;
    }

    if (
      !Number.isInteger(decimals) ||
      decimals < 0 ||
      decimals > 9 ||
      !Number.isSafeInteger(supply) ||
      supply <= 0
    ) {
      toast.error("Enter valid decimals (0–9) and a positive whole-number supply.");
      return;
    }

    if (imgFile.size > 5 * 1024 * 1024) {
      toast.error("Choose an image smaller than 5 MB.");
      return;
    }

    setLoading(true);
    setMsg([]);
    setMintAddress("");
    setAtaAddress("");

    try {
      const jwt = import.meta.env.VITE_PINATA_JWT;
      const gateway = import.meta.env.VITE_PINATA_GATEWAY?.replace(/\/$/, "");

      if (!jwt || !gateway) {
        throw new Error("Pinata configuration is missing.");
      }

      const pinata = new PinataSDK({
        pinataJwt: jwt,
        pinataGateway: gateway,
      });

      const uploadIMG = await pinata.upload.public.file(imgFile);
      const imgURL = `https://${gateway}/${uploadIMG.cid}`;

      const metadataJSON = {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        description: desc.trim(),
        image: imgURL,
      };

      const uploadJSON = await pinata.upload.public.json({
        content: metadataJSON,
        name: `${symbol.trim().toUpperCase()}-metadata.json`,
      });

      const metadataURL = `https://${gateway}/${uploadJSON.cid}`;

      await createToken(metadataURL);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Token creation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b0c14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 hover:border-white/20 focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/10";

  const labelClass =
    "mb-2 flex items-center gap-2 text-sm font-medium text-gray-200";

  return (
    <section className="mx-auto w-full max-w-6xl">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-4 py-2 text-xs font-medium text-violet-200">
          <Sparkles size={14} />
          YOUR TOKEN. YOUR VISION.
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Launch your token
          <span className="mt-2 block bg-gradient-to-r from-violet-300 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            on Solana.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
          Bring your idea on-chain. Define your token, add your branding,
          and create a Token-2022 asset on Solana Devnet.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Form panel */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#10111b]/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <Coins size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-white">Token configuration</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Define the details of your new asset
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <label className={labelClass} htmlFor="token-name">
                <FileText size={15} className="text-violet-300" />
                Token name <span className="text-violet-300">*</span>
              </label>
              <input
                id="token-name"
                value={name}
                maxLength={32}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Solana Community"
                className={inputClass}
              />
              <p className="mt-1.5 text-right text-xs text-gray-600">
                {name.length}/32
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="token-symbol">
                  <Hash size={15} className="text-violet-300" />
                  Token symbol <span className="text-violet-300">*</span>
                </label>
                <input
                  id="token-symbol"
                  value={symbol}
                  maxLength={10}
                  onChange={(e) =>
                    setSymbol(e.target.value.replace(/\s/g, "").toUpperCase())
                  }
                  placeholder="e.g. SC"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-600">
                  Up to 10 characters
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="token-decimals">
                  <Layers3 size={15} className="text-violet-300" />
                  Decimals
                </label>
                <select
                  id="token-decimals"
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value))}
                  className={inputClass}
                >
                  {[0, 2, 4, 6, 8, 9].map((value) => (
                    <option key={value} value={value} className="bg-[#10111b]">
                      {value} {value === 9 ? "(standard default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="token-supply">
                <Coins size={15} className="text-violet-300" />
                Initial supply <span className="text-violet-300">*</span>
              </label>
              <input
                id="token-supply"
                type="number"
                min="1"
                step="1"
                value={supply}
                onChange={(e) => setSupply(Number(e.target.value))}
                className={inputClass}
              />
              <p className="mt-2 text-xs leading-5 text-gray-500">
                The number of whole tokens minted to your wallet.
                Decimals determine how each token can be divided.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="token-description">
                <FileText size={15} className="text-violet-300" />
                Description <span className="text-violet-300">*</span>
              </label>
              <textarea
                id="token-description"
                value={desc}
                maxLength={500}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="What is your token about? Share its purpose and vision..."
                className={`${inputClass} resize-y`}
              />
              <p className="mt-1.5 text-right text-xs text-gray-600">
                {desc.length}/500
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="token-image">
                <ImagePlus size={15} className="text-violet-300" />
                Token logo <span className="text-violet-300">*</span>
              </label>

              <label
                htmlFor="token-image"
                className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-7 text-center transition hover:border-violet-400/50 hover:bg-violet-500/[0.04]"
              >
                {imagePreview ? (
                  <div className="flex w-full flex-col items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Token logo preview"
                      className="h-24 w-24 rounded-2xl border border-white/10 object-cover shadow-lg"
                    />
                    <p className="max-w-full break-all text-sm font-medium text-white">
                      {imgFile?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((imgFile?.size ?? 0) / 1024).toFixed(1)} KB · Click to replace
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300 transition group-hover:scale-105">
                      <Upload size={21} />
                    </div>
                    <p className="text-sm font-medium text-gray-200">
                      Drop your logo here or{" "}
                      <span className="text-violet-300">browse files</span>
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      PNG, JPG, WEBP · Maximum 5 MB
                    </p>
                  </>
                )}
              </label>

              <input
                id="token-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                    toast.error("Choose a PNG, JPG, or WEBP image.");
                    e.target.value = "";
                    return;
                  }

                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Image must be smaller than 5 MB.");
                    e.target.value = "";
                    return;
                  }

                  setImgFile(file);
                }}
              />

              {imgFile && (
                <button
                  type="button"
                  onClick={() => setImgFile(null)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-red-300"
                >
                  <X size={14} />
                  Remove image
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-900/30 focus:outline-none focus:ring-4 focus:ring-violet-400/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Creating your token...
                </>
              ) : (
                <>
                  Create token
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              Your wallet must approve the transactions. Network fees and
              account rent may apply on Devnet.
            </p>
          </div>
        </div>

        {/* Live preview and status */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#10111b]/90 backdrop-blur-xl">
            <div className="border-b border-white/[0.07] px-6 py-5">
              <p className="text-sm font-semibold text-white">Live preview</p>
              <p className="mt-1 text-xs text-gray-500">
                A preview of your token branding
              </p>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.10] via-[#11121c] to-fuchsia-500/[0.05] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Coins size={27} className="text-violet-300" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-white">
                      {name.trim() || "Your Token"}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-violet-300">
                      {symbol.trim().toUpperCase() || "SYMBOL"}
                    </p>
                    <span className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-1 text-[10px] font-medium text-emerald-300">
                      DEVNET PREVIEW
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/[0.08] pt-5">
                  <p className="text-xs text-gray-500">Initial supply</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                    {Number.isSafeInteger(supply) && supply > 0
                      ? supply.toLocaleString()
                      : "—"}
                    <span className="ml-2 text-sm font-medium text-gray-400">
                      {symbol.trim().toUpperCase()}
                    </span>
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Decimals</span>
                    <span className="font-medium text-gray-300">{decimals}</span>
                  </div>
                </div>

                <p className="mt-4 line-clamp-4 break-words text-sm leading-6 text-gray-400">
                  {desc.trim() || "Your token description will appear here."}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-3">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-300" />
                <p className="text-xs leading-5 text-gray-400">
                  This preview is illustrative. Wallets and explorers may
                  display token metadata differently.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10111b]/90 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <Wallet size={19} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Launch status
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Your on-chain progress
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                ["Token metadata", "Logo, name and description"],
                ["Mint account", "Token identity on Solana"],
                ["Token account", "Account receiving your supply"],
              ].map(([title, subtitle], index) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xs text-gray-400">
                    {msg.length > index + 1 ? (
                      <CheckCircle2 size={15} className="text-emerald-300" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{title}</p>
                    <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {mintAddress && (
              <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-3">
                <p className="mb-2 text-xs font-medium text-emerald-300">
                  Mint address
                </p>
                <p className="break-all font-mono text-xs leading-5 text-gray-300">
                  {mintAddress}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void copyText(mintAddress)}
                    className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200"
                  >
                    <Copy size={13} /> Copy address
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200"
                  >
                    Explorer <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            )}

            {ataAddress && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="mb-2 text-xs text-gray-500">Associated token account</p>
                <p className="break-all font-mono text-xs leading-5 text-gray-400">
                  {ataAddress}
                </p>
                <button
                  type="button"
                  onClick={() => void copyText(ataAddress)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200"
                >
                  <Copy size={13} /> Copy address
                </button>
              </div>
            )}

            {msg.length > 0 && (
              <div
                aria-live="polite"
                className="mt-4 max-h-48 space-y-3 overflow-y-auto rounded-xl border border-white/[0.07] bg-black/20 p-4"
              >
                {msg.map((message, index) => (
                  <p key={`${index}-${message}`} className="break-words text-xs leading-5 text-gray-300">
                    <CheckCircle2 size={13} className="mr-2 inline text-emerald-300" />
                    {message}
                  </p>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Launchpad;
