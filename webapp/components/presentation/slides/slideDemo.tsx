"use client";

import { useState } from "react";
import {
  useAccount,
  useSignTypedData,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";

type ClaimType =
  | "NFT_OWNERSHIP"
  | "ERC20_MIN_BALANCE"
  | "WALLET_AGE_DAYS"
  | null;
type TabType = "create" | "proof" | "verify";

const DEPLOYED_MODULES = {
  ERC721: "0x5867eaF2a28034124bC05583EB6Ee20323e01EE3",
  ERC20DAO: "0xAc93B403c21e9c2fdfFdD760e85efaFaf532Aedf",
  WALLETAGE: "0x2142385a6662C6008052E925DaEdD43F7847322b",
};

const SEPOLIA_CHAIN_ID = 11155111;

const SlideDemo = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { login, authenticated } = usePrivy();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();

  const [activeTab, setActiveTab] = useState<TabType>("create");
  const [claimType, setClaimType] = useState<ClaimType>(null);
  const [nftAddress, setNftAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [walletAgeDays, setWalletAgeDays] = useState("90");
  const [expiryMinutes, setExpiryMinutes] = useState("60");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<any>(null);

  // Verify state
  const [proofInput, setProofInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleGenerateProof = async () => {
    if (!authenticated || !isConnected || !address) {
      login();
      return;
    }

    setIsGenerating(true);

    try {
      if (chainId !== SEPOLIA_CHAIN_ID) {
        await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const expiresAt = timestamp + parseInt(expiryMinutes) * 60;
      const nonce = ethers.hexlify(ethers.randomBytes(32));

      let module = "";
      let data = "";
      let claimTypeName = "";

      if (claimType === "NFT_OWNERSHIP") {
        module = DEPLOYED_MODULES.ERC721;
        data = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address"],
          [nftAddress],
        );
        claimTypeName = "NFT_OWNERSHIP";
      } else if (claimType === "ERC20_MIN_BALANCE") {
        module = DEPLOYED_MODULES.ERC20DAO;
        const minBalanceWei = ethers.parseEther(minBalance);
        data = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256"],
          [tokenAddress, minBalanceWei],
        );
        claimTypeName = "ERC20_MIN_BALANCE";
      } else if (claimType === "WALLET_AGE_DAYS") {
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
        salt: ethers.id("MyVerifierApp") as `0x${string}`,
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

      const proof = {
        claim: value,
        signature,
        signer: address,
        domain,
        types,
      };

      setGeneratedProof(proof);
      setActiveTab("proof");
    } catch (error: any) {
      alert(error.message || "Failed to generate proof");
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyProof = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const proof = JSON.parse(proofInput);
      const steps = [];

      steps.push({ name: "Signature Verification", status: "checking" });
      const recovered = ethers.verifyTypedData(
        proof.domain,
        proof.types,
        proof.claim,
        proof.signature,
      );

      if (recovered.toLowerCase() !== proof.signer.toLowerCase()) {
        steps[0].status = "failed";
        setVerificationResult({
          success: false,
          steps,
          error: "Invalid signature",
        });
        setIsVerifying(false);
        return;
      }
      steps[0].status = "passed";

      steps.push({ name: "Expiry Check", status: "checking" });
      const now = Math.floor(Date.now() / 1000);
      if (now > proof.claim.expiresAt) {
        steps[1].status = "failed";
        setVerificationResult({
          success: false,
          steps,
          error: "Proof expired",
        });
        setIsVerifying(false);
        return;
      }
      steps[1].status = "passed";

      steps.push({ name: "On-Chain Verification", status: "checking" });
      const provider = new ethers.JsonRpcProvider(
        "https://ethereum-sepolia-rpc.publicnode.com",
      );
      const abi = [
        "function verify(address user, bytes data) view returns (bool)",
      ];
      const contract = new ethers.Contract(proof.claim.module, abi, provider);

      const isValid = await contract.verify(recovered, proof.claim.data);

      if (!isValid) {
        steps[2].status = "failed";
        setVerificationResult({
          success: false,
          steps,
          error: "On-chain verification failed",
        });
        setIsVerifying(false);
        return;
      }
      steps[2].status = "passed";

      setVerificationResult({ success: true, steps, proof });
    } catch (error: any) {
      setVerificationResult({
        success: false,
        error: error.message || "Verification failed",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyProof = () => {
    if (generatedProof) {
      navigator.clipboard.writeText(JSON.stringify(generatedProof, null, 2));
      setProofInput(JSON.stringify(generatedProof, null, 2));
      setActiveTab("verify");
    }
  };

  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col bg-black px-8 py-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-white mb-2">Live Demo</h3>
          <p className="text-slate-400">
            Working extension. Smart contracts live on Sepolia.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === "create"
                ? "bg-emerald-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            1. Create Proof
          </button>
          <button
            onClick={() => setActiveTab("proof")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === "proof"
                ? "bg-cyan-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            disabled={!generatedProof}
          >
            2. View Proof
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === "verify"
                ? "bg-blue-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            3. Verify
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
          {activeTab === "create" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setClaimType("NFT_OWNERSHIP")}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    claimType === "NFT_OWNERSHIP"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">
                    NFT Ownership
                  </div>
                </button>
                <button
                  onClick={() => setClaimType("ERC20_MIN_BALANCE")}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    claimType === "ERC20_MIN_BALANCE"
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">
                    Token Balance
                  </div>
                </button>
                <button
                  onClick={() => setClaimType("WALLET_AGE_DAYS")}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    claimType === "WALLET_AGE_DAYS"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">
                    Wallet Age
                  </div>
                </button>
              </div>

              {claimType === "NFT_OWNERSHIP" && (
                <input
                  type="text"
                  placeholder="NFT Contract Address (0x...)"
                  value={nftAddress}
                  onChange={(e) => setNftAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              )}

              {claimType === "ERC20_MIN_BALANCE" && (
                <>
                  <input
                    type="text"
                    placeholder="Token Contract Address"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Minimum Balance"
                    value={minBalance}
                    onChange={(e) => setMinBalance(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </>
              )}

              {claimType && (
                <button
                  onClick={handleGenerateProof}
                  disabled={isGenerating || !isConnected}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-white disabled:opacity-50"
                >
                  {isGenerating
                    ? "Generating..."
                    : !authenticated
                      ? "Connect Wallet"
                      : "Generate Proof"}
                </button>
              )}
            </div>
          )}

          {activeTab === "proof" && generatedProof && (
            <div className="space-y-4">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-emerald-500/30">
                <div className="text-emerald-400 text-sm font-semibold mb-2">
                  ✓ Proof Generated
                </div>
                <div className="text-xs text-slate-400">
                  Claim: {generatedProof.claim.claimType}
                </div>
              </div>
              <button
                onClick={copyProof}
                className="w-full py-3 bg-cyan-500 rounded-xl font-semibold text-white"
              >
                Copy & Verify →
              </button>
            </div>
          )}

          {activeTab === "verify" && (
            <div className="space-y-4">
              <textarea
                value={proofInput}
                onChange={(e) => setProofInput(e.target.value)}
                placeholder="Paste proof JSON here..."
                className="w-full h-32 px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
              <button
                onClick={verifyProof}
                disabled={!proofInput || isVerifying}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-white disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Verify Proof"}
              </button>

              {verificationResult && (
                <div
                  className={`p-4 rounded-xl ${
                    verificationResult.success
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  <div
                    className={`text-center font-semibold ${
                      verificationResult.success
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {verificationResult.success ? "✅ Verified" : "❌ Failed"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideDemo;
