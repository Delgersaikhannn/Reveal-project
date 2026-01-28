"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { ethers } from "ethers";
import { CHAIN_NAMES } from "@/lib/config";
import { ApprovalScanner } from "@/lib/approvalScanner";
import type { TokenApproval as ScannerApproval } from "@/types/approvals";
import { revokeERC20Approval, revokeNFTApproval } from "@/lib/revoke";
import {
  generatePrivacyPassport,
  getStoredPassport,
  isPassportExpired,
  PASSPORT_RULES,
  type PrivacyPassport,
  type PassportRule,
} from "@/lib/passport";

type UnifiedApproval = {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenType: "ERC-20" | "ERC-721" | "ERC-1155";
  spenderAddress: string;
  spenderName: string;
  approvalAmount: string;
  isUnlimited: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  lastUpdated?: number;
};

function shorten(address?: string | null): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Home() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();
  const connecting = connectStatus === "pending";
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const extensionAddress = searchParams.get("address");
  const extensionChainId = searchParams.get("chainId");
  const extensionDomain = searchParams.get("domain");

  const defaultChain = chainId || Number(Object.keys(CHAIN_NAMES)[0]);
  const [selectedChain, setSelectedChain] = useState<number>(defaultChain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<UnifiedApproval[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{
    id: string;
    label: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [passport, setPassport] = useState<PrivacyPassport | null>(null);
  const [generatingPassport, setGeneratingPassport] = useState(false);

  useEffect(() => {
    if (extensionChainId) {
      const parsedChainId = parseInt(extensionChainId.replace("0x", ""), 16);
      if (parsedChainId && CHAIN_NAMES[parsedChainId]) {
        setSelectedChain(parsedChainId);
      }
    }
  }, [extensionChainId]);

  useEffect(() => {
    if (!extensionChainId && chainId && CHAIN_NAMES[chainId]) {
      setSelectedChain(chainId);
    }
  }, [chainId, extensionChainId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Load stored Privacy Passport on address/chain change
  useEffect(() => {
    if (!address || !selectedChain) {
      setPassport(null);
      return;
    }
    const stored = getStoredPassport(address, selectedChain);
    if (stored && !isPassportExpired(stored)) {
      setPassport(stored);
    } else {
      setPassport(null);
    }
  }, [address, selectedChain]);

  const isChainMismatch = isConnected && chainId !== selectedChain;
  const selectedChainName = CHAIN_NAMES[selectedChain];

  const statusPill = useMemo(() => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
          Connected
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
        <span className="h-2 w-2 rounded-full bg-gray-400" aria-hidden />
        Disconnected
      </div>
    );
  }, [isConnected]);

  async function handleScan() {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const scanner = new ApprovalScanner(selectedChain);
      const scannerApprovals = await scanner.scanWallet(address);

      const unified: UnifiedApproval[] = scannerApprovals.map((a) => ({
        tokenAddress: a.tokenAddress,
        tokenName: a.tokenName,
        tokenSymbol: a.tokenSymbol,
        tokenType: a.tokenType,
        spenderAddress: a.spenderAddress,
        spenderName: a.spenderName,
        approvalAmount: a.approvalAmount,
        isUnlimited: a.isUnlimited,
        riskLevel: a.riskLevel,
        lastUpdated: Date.now(),
      }));

      setApprovals(unified);
      if (!unified.length) {
        setError("No approvals found on this chain.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch approvals. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  function allowanceLabel(item: UnifiedApproval) {
    return item.approvalAmount;
  }

  function badgeClass(item: UnifiedApproval) {
    const base = "px-2 py-1 rounded-full text-xs font-semibold";
    if (item.tokenType === "ERC-20") return `${base} bg-blue-100 text-blue-700`;
    if (item.tokenType === "ERC-721")
      return `${base} bg-emerald-100 text-emerald-700`;
    return `${base} bg-indigo-100 text-indigo-700`;
  }

  async function handleRevoke(approval: UnifiedApproval) {
    if (!address) return;
    if (selectedChain !== chainId) {
      setError("Switch to the selected chain to revoke.");
      return;
    }

    const id = `${approval.tokenType}-${approval.tokenAddress}-${approval.spenderAddress}`;
    setConfirming({
      id,
      label: `${approval.tokenSymbol || approval.tokenType} → ${
        approval.spenderName || "Spender"
      }`,
      onConfirm: async () => {
        setRevokingId(id);
        setError(null);
        try {
          if (approval.tokenType === "ERC-20") {
            await revokeERC20Approval(
              approval.tokenAddress,
              approval.spenderAddress,
              selectedChain,
            );
          } else {
            await revokeNFTApproval(
              approval.tokenAddress,
              approval.spenderAddress,
              selectedChain,
            );
          }
          setToast("Revoke submitted. Check wallet for tx status.");
          await handleScan();
        } catch (err) {
          console.error(err);
          setError("Revoke failed. Please check your wallet.");
        } finally {
          setRevokingId(null);
          setConfirming(null);
        }
      },
    });
  }

  async function handleTestApproval() {
    if (!address) {
      setError("No wallet connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Switch to ApeChain
      await switchChain({ chainId: 33139 });

      // Get provider from window.ethereum
      if (!window.ethereum) {
        throw new Error("No ethereum provider found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenAddress = "0xb351e977742b413797ab40e21007962ec9b1df5f";
      const testSpenderAddress = "0x1111111111111111111111111111111111111111";
      const amount = ethers.parseUnits("1000", 18);

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer,
      );

      const tx = await tokenContract.approve(testSpenderAddress, amount);

      setToast("Approval transaction submitted! Waiting for confirmation...");
      await tx.wait();
      setToast(
        `✅ Test approval created successfully!\n\n` +
          `Token: ${tokenAddress}\n` +
          `Spender: ${testSpenderAddress}\n` +
          `Amount: 1000 tokens\n\n` +
          `Now click "Scan My Approvals" to see it!`,
      );
    } catch (err: any) {
      setError(err.message || "Failed to create test approval");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePassport() {
    if (!address) {
      setError("No wallet connected");
      return;
    }

    setGeneratingPassport(true);
    setError(null);

    try {
      const newPassport = await generatePrivacyPassport({
        address,
        chainId: selectedChain,
        rules: Object.keys(PASSPORT_RULES) as PassportRule[],
        approvals: approvals.map((a) => ({
          token: a.tokenAddress,
          spender: a.spenderAddress,
          allowance: a.approvalAmount,
          isUnlimited: a.isUnlimited,
          lastUpdated: a.lastUpdated || Date.now(),
        })),
      });

      setPassport(newPassport);
      setToast(
        `✅ Privacy Passport generated!\n\n` +
          `${newPassport.rulesVerified.length}/${Object.keys(PASSPORT_RULES).length} rules verified\n` +
          `Valid for 30 days\n\n` +
          `Your wallet address is hidden via cryptographic commitment.`,
      );
    } catch (err: any) {
      setError(err.message || "Failed to generate Privacy Passport");
      console.error(err);
    } finally {
      setGeneratingPassport(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
              Ape
            </div>
            <div>
              <div className="font-semibold text-gray-900">Ape Approvals</div>
              <div className="text-sm text-gray-500">
                Multichain approval manager
              </div>
            </div>
            {extensionDomain && (
              <span className="ml-3 px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                Opened from {extensionDomain}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {statusPill}
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">{shorten(address)}</span>
                <span className="text-gray-400">•</span>
                <span>{CHAIN_NAMES[chainId] || `Chain ${chainId}`}</span>
              </div>
            )}
            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Disconnect
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-700 font-semibold mb-2">
                Safety-first
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Revoke risky approvals in seconds
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Scan your wallet across Ethereum, Arbitrum, and ApeChain.
                Identify unlimited allowances and NFT operators, then revoke
                them from a single table.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <div className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
                {extensionAddress ? (
                  <>Scanning {shorten(extensionAddress)}</>
                ) : (
                  "Wallet not linked"
                )}
              </div>
              <div className="text-sm text-gray-600">
                Selected chain: {selectedChainName || "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Connect wallet
                </h2>
                <p className="text-sm text-gray-600">
                  Choose a connector to start scanning approvals.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  disabled={connecting}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {connector.name}
                  {connecting ? " (connecting...)" : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {isConnected && (
          <div className="space-y-6">
            {isChainMismatch && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3">
                Switch your wallet to {selectedChainName} to revoke approvals.
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Wallet</div>
                <div className="font-semibold text-gray-900">
                  {shorten(address)}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Selected chain</div>
                <div className="font-semibold text-gray-900">
                  {selectedChainName}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">
                  Approvals found
                </div>
                <div className="font-semibold text-gray-900">
                  {approvals.length}
                </div>
              </div>
            </div>

            {/* Privacy Passport Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-4xl">🛡️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Privacy Passport
                    </h2>
                    {passport && !isPassportExpired(passport) && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✓ Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Prove your wallet is safe — without revealing your wallet.
                    Generate a cryptographic proof that verifies security
                    properties without exposing addresses or balances.
                  </p>

                  {passport && !isPassportExpired(passport) ? (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500">Status</div>
                            <div className="font-semibold text-green-700">
                              Verified
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Rules Passed</div>
                            <div className="font-semibold text-gray-900">
                              {passport.rulesVerified.length}/
                              {Object.keys(PASSPORT_RULES).length}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Valid Until</div>
                            <div className="font-semibold text-gray-900">
                              {new Date(
                                passport.expiresAt,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Chain</div>
                            <div className="font-semibold text-gray-900">
                              {CHAIN_NAMES[passport.chainId]}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Verified Security Properties:
                        </div>
                        <div className="space-y-2">
                          {passport.rulesVerified.map((ruleId) => {
                            const rule = PASSPORT_RULES[ruleId];
                            return (
                              <div
                                key={ruleId}
                                className="flex items-start gap-2 text-sm"
                              >
                                <span className="text-green-600 flex-shrink-0 mt-0.5">
                                  ✓
                                </span>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {rule.name}
                                  </div>
                                  <div className="text-gray-600">
                                    {rule.description}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {passport.rulesFailed.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <div className="text-sm font-medium text-amber-900 mb-2">
                            ⚠️ Security Concerns:
                          </div>
                          <div className="space-y-2">
                            {passport.rulesFailed.map((ruleId) => {
                              const rule = PASSPORT_RULES[ruleId];
                              return (
                                <div
                                  key={ruleId}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="text-amber-600 flex-shrink-0 mt-0.5">
                                    ✗
                                  </span>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {rule.name}
                                    </div>
                                    <div className="text-gray-700">
                                      {rule.description}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleGeneratePassport}
                        disabled={generatingPassport || !approvals.length}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                      >
                        {generatingPassport
                          ? "Generating..."
                          : "Regenerate Passport"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-700 mb-3">
                          Generate a Privacy Passport to prove:
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600">
                          {Object.entries(PASSPORT_RULES).map(([id, rule]) => (
                            <li key={id} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{rule.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={handleGeneratePassport}
                        disabled={generatingPassport || !approvals.length}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        title={
                          !approvals.length
                            ? "Scan your approvals first to generate a passport"
                            : ""
                        }
                      >
                        {generatingPassport
                          ? "Generating Passport..."
                          : "🛡️ Generate Privacy Passport"}
                      </button>
                      {!approvals.length && (
                        <p className="text-xs text-gray-500 text-center">
                          Scan your approvals first to generate a passport
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select chain to scan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(CHAIN_NAMES).map(([id, name]) => {
                  const chainIdNum = parseInt(id, 10);
                  const isSelected = chainIdNum === selectedChain;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedChain(chainIdNum);
                        if (chainIdNum !== chainId) {
                          switchChain({ chainId: chainIdNum });
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="font-medium">{name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Approval scanner
                  </h2>
                  <p className="text-sm text-gray-600">
                    Fetch ERC20 allowances and NFT operators from the last known
                    approvals.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleTestApproval}
                    // disabled={loading || selectedChain !== 33139}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    title={
                      selectedChain !== 33139
                        ? "Switch to ApeChain to create test approval"
                        : ""
                    }
                  >
                    {loading ? "Processing..." : "🧪 Make Test Approval"}
                  </button>
                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Scanning..." : "Scan now"}
                  </button>
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            {approvals.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active approvals
                  </h3>
                  <div className="text-sm text-gray-600">
                    {approvals.length} item{approvals.length > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b text-gray-600">
                      <tr>
                        <th className="py-2 pr-4">Token</th>
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Spender / Operator</th>
                        <th className="py-2 pr-4">Allowance</th>
                        <th className="py-2 pr-4">Risk</th>
                        <th className="py-2 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {approvals.map((item) => {
                        const id = `${item.tokenType}-${item.tokenAddress}-${item.spenderAddress}`;
                        const riskColorMap = {
                          low: "bg-green-100 text-green-800",
                          medium: "bg-yellow-100 text-yellow-800",
                          high: "bg-orange-100 text-orange-800",
                          critical: "bg-red-100 text-red-800",
                        };
                        return (
                          <tr key={id} className="align-middle">
                            <td className="py-3 pr-4 text-gray-900">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-600">
                                  {item.tokenSymbol?.slice(0, 3) ||
                                    item.tokenType.slice(0, 3)}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {item.tokenName || item.tokenSymbol}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-[220px]">
                                    {item.tokenAddress}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-gray-900">
                              <span className={badgeClass(item)}>
                                {item.tokenType}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-900">
                              <div className="font-medium">
                                {item.spenderName}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[220px]">
                                {item.spenderAddress}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-gray-900">
                              {allowanceLabel(item)}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${riskColorMap[item.riskLevel]}`}
                              >
                                {item?.riskLevel?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <button
                                onClick={() => handleRevoke(item)}
                                disabled={revokingId === id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {revokingId === id ? "Revoking..." : "Revoke"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm text-amber-900">
                  <div className="font-medium mb-1">
                    Privacy & Security Notice
                  </div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      <strong>Read-Only Extension</strong>: Never modifies
                      transactions or accesses private keys
                    </li>
                    <li>
                      <strong>You Sign Everything</strong>: Each revoke requires
                      your wallet signature
                    </li>
                    <li>
                      <strong>Local Risk Scoring</strong>: No external API calls
                      for privacy assessment
                    </li>
                    <li>
                      <strong>Gas Fees Apply</strong>: Revoking approvals
                      creates on-chain transactions
                    </li>
                    <li>
                      <strong>Your Responsibility</strong>: Review all
                      transactions before signing
                    </li>
                  </ul>
                  <p className="mt-2 text-xs">
                    See{" "}
                    <a
                      href="/SECURITY.md"
                      className="underline"
                      target="_blank"
                    >
                      SECURITY.md
                    </a>{" "}
                    for full disclosure
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>
            Multichain Approval Manager • Built with Next.js, wagmi, and Alchemy
          </p>
          <p className="mt-2">Always review transactions before signing</p>
        </div>
      </footer>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm revoke
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              You are about to revoke approval for {confirming.label} on{" "}
              {selectedChainName}.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirming(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirming.onConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Confirm revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
