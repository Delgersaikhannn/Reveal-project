"use client";

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { usePublicClient } from "wagmi";

export default function VerifierPortal() {
  const [proofInput, setProofInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const publicClient = usePublicClient();

  const verifyProof = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const proof = JSON.parse(proofInput);
      const steps = [];

      // Step 1: Verify Signature
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

      // Step 2: Check Expiry
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

      // Step 3: On-Chain Verification
      steps.push({ name: "On-Chain Verification", status: "checking" });

      //   const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
      const provider = new ethers.JsonRpcProvider(
        "https://ethereum-sepolia-rpc.publicnode.com",
      );
      //   /https://ethereum-sepolia-rpc.publicnode.com
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
      console.error("Verification error:", error);
      setVerificationResult({
        success: false,
        error: error.message || "Verification failed",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative max-w-7xl mx-auto px-6 py-12">
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

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Verifier Portal
          </h1>
          <p className="text-slate-400 text-lg">
            Verify selective disclosure proofs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Paste Proof Payload
              </h2>
              <textarea
                value={proofInput}
                onChange={(e) => setProofInput(e.target.value)}
                placeholder='{\n  "claim": {...},\n  "signature": "0x...",\n  "signer": "0x..."\n}'
                className="w-full h-96 px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
              <button
                onClick={verifyProof}
                disabled={!proofInput || isVerifying}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isVerifying ? "Verifying..." : "Verify Proof"}
              </button>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Verification Steps
              </h2>

              {!verificationResult && (
                <div className="text-center py-12 text-slate-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Paste a proof and click verify
                </div>
              )}

              {verificationResult?.steps && (
                <div className="space-y-3 mb-6">
                  {verificationResult.steps.map((step: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800"
                    >
                      {step.status === "passed" && (
                        <svg
                          className="w-6 h-6 text-emerald-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      {step.status === "failed" && (
                        <svg
                          className="w-6 h-6 text-red-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      {step.status === "checking" && (
                        <svg
                          className="w-6 h-6 text-cyan-400 flex-shrink-0 animate-spin"
                          viewBox="0 0 24 24"
                        >
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
                      )}
                      <span className="text-white font-medium">
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {verificationResult && (
                <div className="space-y-4">
                  <div
                    className={`p-6 rounded-2xl border-2 ${
                      verificationResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    {verificationResult.success ? (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500 mx-auto mb-4 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-emerald-400 mb-2">
                          ✅ Access Granted
                        </h3>
                        <p className="text-emerald-300 mb-2">
                          Condition satisfied
                        </p>
                        <p className="text-sm text-emerald-400/70">
                          ⏱ Expires in{" "}
                          {Math.floor(
                            (verificationResult.proof.claim.expiresAt -
                              Math.floor(Date.now() / 1000)) /
                              60,
                          )}{" "}
                          minutes
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500 mx-auto mb-4 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-red-400 mb-2">
                          {verificationResult.error === "Proof expired"
                            ? "❌ Proof Expired"
                            : "Proof Invalid"}
                        </h3>
                        <p className="text-red-300">
                          {verificationResult.error === "Proof expired"
                            ? "Please request a new proof from the user"
                            : verificationResult.error || "Access Denied"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Technical Details - Only show on success */}
                  {verificationResult.success && verificationResult.proof && (
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() =>
                          setShowTechnicalDetails(!showTechnicalDetails)
                        }
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-300">
                          Technical details
                        </span>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            showTechnicalDetails ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {showTechnicalDetails && (
                        <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Verified wallet
                            </div>
                            <div className="text-sm font-mono text-cyan-400">
                              {verificationResult.proof.signer.slice(0, 10)}...
                              {verificationResult.proof.signer.slice(-8)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Verification module
                            </div>
                            <div className="text-sm font-mono text-slate-300">
                              {verificationResult.proof.claim.claimType ===
                                "NFT_OWNERSHIP" && "ERC721 Ownership"}
                              {verificationResult.proof.claim.claimType ===
                                "ERC20_MIN_BALANCE" && "ERC20 Balance"}
                              {verificationResult.proof.claim.claimType ===
                                "WALLET_AGE_DAYS" && "Wallet Age"}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 italic pt-2 border-t border-slate-800">
                            This proof is self-issued by the user and verified
                            cryptographically on-chain.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
