"use client";

import { useState } from "react";
import {
  useAccount,
  useSignTypedData,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";

type ClaimType =
  | "NFT_OWNERSHIP"
  | "ERC20_MIN_BALANCE"
  | "WALLET_AGE_DAYS"
  | null;

const DEPLOYED_MODULES = {
  ERC721: "0x5867eaF2a28034124bC05583EB6Ee20323e01EE3",
  ERC20DAO: "0xAc93B403c21e9c2fdfFdD760e85efaFaf532Aedf",
  WALLETAGE: "0x2142385a6662C6008052E925DaEdD43F7847322b",
};

const SEPOLIA_CHAIN_ID = 11155111;

export default function CreateProof() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { login, authenticated } = usePrivy();
  const router = useRouter();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();

  const [claimType, setClaimType] = useState<ClaimType>(null);
  const [nftAddress, setNftAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [walletAgeDays, setWalletAgeDays] = useState("90");
  const [expiryMinutes, setExpiryMinutes] = useState("60");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateProof = async () => {
    if (!authenticated || !isConnected || !address) {
      login();
      return;
    }

    setIsGenerating(true);

    try {
      // Switch to Sepolia if not already on it
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
        } catch (switchError: any) {
          console.error("Chain switch error:", switchError);
          alert("Please switch to Sepolia network to create a proof");
          setIsGenerating(false);
          return;
        }
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const expiresAt = timestamp + parseInt(expiryMinutes) * 60;
      const nonce = ethers.hexlify(ethers.randomBytes(32));

      let module = "";
      let data = "";
      let claimTypeName = "";

      if (claimType === "NFT_OWNERSHIP") {
        if (!nftAddress || !ethers.isAddress(nftAddress)) {
          alert("Please enter a valid NFT contract address");
          setIsGenerating(false);
          return;
        }
        module = DEPLOYED_MODULES.ERC721;
        data = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address"],
          [nftAddress],
        );
        claimTypeName = "NFT_OWNERSHIP";
      } else if (claimType === "ERC20_MIN_BALANCE") {
        if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
          alert("Please enter a valid token contract address");
          setIsGenerating(false);
          return;
        }
        if (!minBalance || parseFloat(minBalance) <= 0) {
          alert("Please enter a valid minimum balance");
          setIsGenerating(false);
          return;
        }
        module = DEPLOYED_MODULES.ERC20DAO;
        const minBalanceWei = ethers.parseEther(minBalance);
        data = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256"],
          [tokenAddress, minBalanceWei],
        );
        claimTypeName = "ERC20_MIN_BALANCE";
      } else if (claimType === "WALLET_AGE_DAYS") {
        if (!walletAgeDays || parseInt(walletAgeDays) < 0) {
          alert("Please enter a valid wallet age");
          setIsGenerating(false);
          return;
        }
        module = DEPLOYED_MODULES.WALLETAGE;
        data = ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256"],
          [parseInt(walletAgeDays)],
        );
        claimTypeName = "WALLET_AGE_DAYS";
      }

      const domain = {
        name: "SelectiveDisclosureWallet",
        version: "1",
        chainId: SEPOLIA_CHAIN_ID,
        salt: ethers.id("MyVerifierApp"),
      };

      const types = {
        Claim: [
          { name: "claimType", type: "string" },
          { name: "module", type: "address" },
          { name: "data", type: "bytes" },
          { name: "timestamp", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      };

      const value = {
        claimType: claimTypeName,
        module,
        data,
        timestamp,
        expiresAt,
        nonce,
      };

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Claim",
        message: value,
      });

      // Store proof in sessionStorage
      const proof = {
        claim: value,
        signature,
        signer: address,
        domain,
        types,
      };

      sessionStorage.setItem("latestProof", JSON.stringify(proof));
      router.push("/proof");
    } catch (error: any) {
      console.error("Error generating proof:", error);
      alert(error.message || "Failed to generate proof");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Create Proof</h1>
          <p className="text-slate-400 text-lg">
            Generate a privacy-preserving proof from your wallet
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 space-y-8">
          {/* Claim Type Selector */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              1. Choose Claim Type
            </label>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setClaimType("NFT_OWNERSHIP")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  claimType === "NFT_OWNERSHIP"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      NFT Ownership
                    </div>
                    <div className="text-sm text-slate-400">
                      Prove you own an NFT from a specific collection
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setClaimType("ERC20_MIN_BALANCE")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  claimType === "ERC20_MIN_BALANCE"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Token Balance
                    </div>
                    <div className="text-sm text-slate-400">
                      Prove you hold a minimum token balance
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setClaimType("WALLET_AGE_DAYS")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  claimType === "WALLET_AGE_DAYS"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Wallet Age</div>
                    <div className="text-sm text-slate-400">
                      Prove your wallet age meets a threshold
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Claim Details */}
          {claimType && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                2. Enter Claim Details
              </label>

              {claimType === "NFT_OWNERSHIP" && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    NFT Contract Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={nftAddress}
                    onChange={(e) => setNftAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              {claimType === "ERC20_MIN_BALANCE" && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Token Contract Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Minimum Balance (in tokens)
                    </label>
                    <input
                      type="number"
                      placeholder="10"
                      value={minBalance}
                      onChange={(e) => setMinBalance(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </>
              )}

              {claimType === "WALLET_AGE_DAYS" && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Minimum Wallet Age (days)
                  </label>
                  <input
                    type="number"
                    placeholder="90"
                    value={walletAgeDays}
                    onChange={(e) => setWalletAgeDays(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {/* Proof Scope */}
          {claimType && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                3. Set Proof Expiry
              </label>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Valid for (minutes)
                </label>
                <select
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-slate-600 transition-colors"
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="1440">24 hours</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  ⏰ This proof will expire automatically to prevent replay
                  attacks
                </p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {claimType && (
            <div className="pt-4">
              <button
                onClick={handleGenerateProof}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Proof...
                  </span>
                ) : !authenticated ? (
                  "🔐 Connect Wallet to Sign"
                ) : (
                  "🔐 Sign Claim"
                )}
              </button>
            </div>
          )}

          {!isConnected && (
            <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 text-sm">
                Please connect your wallet to create a proof
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
