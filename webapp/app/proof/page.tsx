"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProofGenerated() {
  const router = useRouter();
  const [proof, setProof] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const storedProof = sessionStorage.getItem("latestProof");
    if (!storedProof) {
      router.push("/create");
      return;
    }
    setProof(JSON.parse(storedProof));
    setShowSuccess(true);
  }, [router]);

  const copyProof = () => {
    if (proof) {
      navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExpiryTime = () => {
    if (!proof) return "";
    const expiresAt = proof.claim.expiresAt;
    const date = new Date(expiresAt * 1000);
    return date.toLocaleString();
  };

  const getRemainingTime = () => {
    if (!proof) return "";
    const now = Math.floor(Date.now() / 1000);
    const remaining = proof.claim.expiresAt - now;
    if (remaining < 0) return "Expired";
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (!proof) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Success Animation */}
        {showSuccess && (
          <div className="flex justify-center mb-8 animate-bounce">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <svg
                className="w-10 h-10 text-white"
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
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Proof Generated!
          </h1>
          <p className="text-slate-400">
            Your privacy-preserving proof is ready
          </p>
        </div>

        {/* Proof Summary Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 space-y-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">Claim Type</div>
              <div className="text-xl font-semibold text-white">
                {proof.claim.claimType}
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              ⏳ Pending Verification
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="text-sm text-slate-500 italic">
              💡 This proof is self-issued and reveals only the minimum required
              information. Identity is verified cryptographically after the
              verifier checks this proof.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <div className="text-sm text-slate-400 mb-1">Expires At</div>
              <div className="text-sm text-white">{getExpiryTime()}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">
                ⏱ Time Remaining
              </div>
              <div className="text-sm text-emerald-400 font-semibold">
                {getRemainingTime()}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          <button
            onClick={copyProof}
            className="w-full py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-white hover:bg-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg
                  className="w-5 h-5 text-emerald-400"
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
                Copied!
              </>
            ) : (
              <>
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Proof Payload
              </>
            )}
          </button>

          <Link href="/verify">
            <button className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02]">
              Send to Verifier →
            </button>
          </Link>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-amber-400">
              <strong>Privacy Notice:</strong> Only share this proof with the
              verifier who requested it. This proof is time-bounded and will
              expire automatically.
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
