"use client";

import { useAccount } from "wagmi";
import Link from "next/link";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
          <div className="text-center space-y-8">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-slate-300 font-medium">
                Privacy-First Protocol
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="text-white">Prove only</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 text-transparent bg-clip-text">
                what matters.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Generate privacy-preserving proofs from your wallet.
              <br />
              No history shared. No signatures stored on-chain.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link
                href="/create"
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105"
              >
                <span className="relative z-10">Create Proof</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 blur transition-opacity" />
              </Link>

              <Link
                href="/verify"
                className="px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-xl font-semibold text-lg text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all"
              >
                Verify Proof
              </Link>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Choose what to prove
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Select NFT ownership, token balance, or DAO membership. You
                  control what to disclose.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Sign a scoped claim
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Create a time-bounded proof with EIP-712 signature. Expires
                  automatically.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Verifier checks on-chain
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Your claim is verified against on-chain data. No wallet
                  history exposed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notes */}
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-12">
            <div className="flex items-center gap-3 mb-8">
              <svg
                className="w-8 h-8 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-white">
                Security & Privacy
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-emerald-400 font-semibold">
                  No History Shared
                </div>
                <p className="text-sm text-slate-400">
                  Your full transaction history stays private
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-cyan-400 font-semibold">
                  Off-Chain Signatures
                </div>
                <p className="text-sm text-slate-400">
                  No on-chain storage of your proofs
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-blue-400 font-semibold">Time-Bounded</div>
                <p className="text-sm text-slate-400">
                  Proofs expire automatically to prevent replay
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Model */}
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-white">Trust Model</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Verifiers choose which modules they trust. Users choose what to
              disclose.
            </p>
          </div>

          <Link href="/modules">
            <div className="group cursor-pointer bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    View Verification Modules
                  </h3>
                  <p className="text-slate-400">
                    Explore deployed smart contracts on Sepolia
                  </p>
                </div>
                <svg
                  className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
