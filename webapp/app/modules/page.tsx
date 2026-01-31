"use client";

import Link from "next/link";

const MODULES = [
  {
    name: "ERC721 Ownership Module",
    address: "0x5867eaF2a28034124bC05583EB6Ee20323e01EE3",
    description:
      "Verifies that a user owns at least one NFT from a specified ERC721 contract",
    verifies: "NFT ownership (balanceOf > 0)",
    network: "Sepolia",
    explorer:
      "https://sepolia.etherscan.io/address/0x5867eaF2a28034124bC05583EB6Ee20323e01EE3#code",
    color: "from-emerald-500 to-cyan-500",
    icon: (
      <svg
        className="w-6 h-6"
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
    ),
  },
  {
    name: "ERC20 Balance Module",
    address: "0xAc93B403c21e9c2fdfFdD760e85efaFaf532Aedf",
    description:
      "Verifies that a user's token balance meets or exceeds a specified minimum threshold",
    verifies: "Token balance ≥ minBalance",
    network: "Sepolia",
    explorer:
      "https://sepolia.etherscan.io/address/0xAc93B403c21e9c2fdfFdD760e85efaFaf532Aedf#code",
    color: "from-cyan-500 to-blue-500",
    icon: (
      <svg
        className="w-6 h-6"
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
    ),
  },
  {
    name: "Wallet Age Module",
    address: "0x2142385a6662C6008052E925DaEdD43F7847322b",
    description:
      "Verifies wallet age based on off-chain derived data. Pure function for hackathon safety",
    verifies: "Wallet age ≥ 90 days",
    network: "Sepolia",
    explorer:
      "https://sepolia.etherscan.io/address/0x2142385a6662C6008052E925DaEdD43F7847322b#code",
    color: "from-blue-500 to-purple-500",
    icon: (
      <svg
        className="w-6 h-6"
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
    ),
  },
];

export default function ModulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
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
            Verification Modules
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Stateless, read-only smart contracts that verify on-chain claims
            without storing any data
          </p>
        </div>

        {/* Trust Model */}
        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                How It Works
              </h2>
              <div className="space-y-2 text-slate-300">
                <p>
                  • <strong className="text-white">Verifiers</strong> choose
                  which modules they trust based on the contract address
                </p>
                <p>
                  • <strong className="text-white">Users</strong> choose what
                  claims to disclose from their wallet
                </p>
                <p>
                  • <strong className="text-white">Modules</strong> are
                  stateless view functions that read on-chain state
                </p>
                <p>
                  • <strong className="text-white">No storage</strong> — modules
                  don't store any user data on-chain
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="space-y-6">
          {MODULES.map((module, index) => (
            <div key={index} className="group relative">
              <div
                className={`absolute inset-0 bg-gradient-to-r ${module.color} opacity-5 rounded-2xl blur-xl group-hover:opacity-10 transition-opacity`}
              />
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all">
                <div className="flex items-start gap-6">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0`}
                  >
                    {module.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {module.name}
                        </h3>
                        <p className="text-slate-400">{module.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                          Stateless
                        </span>
                        <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                          Read-Only
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">
                          Verifies
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {module.verifies}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">
                          Network
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {module.network}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">
                          Contract Address
                        </div>
                        <div className="text-sm font-mono text-cyan-400">
                          {module.address.slice(0, 10)}...
                          {module.address.slice(-8)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <a
                        href={module.explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View on Etherscan (Verified Source)
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Note */}
        <div className="mt-12 bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"
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
            <div className="text-sm text-slate-300">
              <strong className="text-white">
                All modules are verified on Etherscan.
              </strong>{" "}
              You can inspect the source code to understand exactly what each
              module verifies. No surprises, no hidden behavior.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
