import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

interface Slide5Props {
  isActive: boolean;
}

const Slide5 = ({ isActive }: Slide5Props) => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black px-8 py-12 overflow-y-auto">
      {/* Commercial Potential */}
      <div className="max-w-7xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">💼</div>
          <h3 className="text-4xl md:text-5xl font-bold text-white">
            Commercial Potential
          </h3>
        </div>

        {/* Primary Market */}
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl transition-all" />
          <div className="relative bg-slate-900/60 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎯</div>
              <h4 className="text-2xl font-bold text-white">Primary Market</h4>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20">
              <h5 className="text-xl font-bold text-blue-300 mb-3">
                Web3 Logins & Token Gating
              </h5>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>DAO access without wallet exposure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>NFT / token-gated content</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Privacy-first alternatives to "Connect Wallet"</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg px-4 py-3 border border-blue-500/20">
              <p className="text-blue-300 font-semibold text-center">
                Fits DAOs, communities, events, and creator platforms
                immediately
              </p>
            </div>
          </div>
        </div>

        {/* Monetization Model */}
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl transition-all" />
          <div className="relative bg-slate-900/60 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💰</div>
              <h4 className="text-2xl font-bold text-white">
                Monetization Model
              </h4>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Freemium for Users */}
              <div className="bg-slate-800/40 rounded-xl p-5 border border-emerald-500/20 space-y-3">
                <h5 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Freemium for Users
                </h5>

                <div className="space-y-2">
                  <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <p className="text-sm font-semibold text-emerald-300 mb-2">
                      Free Tier:
                    </p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      <li className="flex gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>Generate limited claims</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>Basic privacy controls</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg p-3 border border-emerald-400/40">
                    <p className="text-sm font-semibold text-emerald-200 mb-2">
                      Pro Tier:
                    </p>
                    <ul className="space-y-1 text-sm text-slate-200">
                      <li className="flex gap-2">
                        <span className="text-emerald-300">★</span>
                        <span>Advanced claim history</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-300">★</span>
                        <span>Expiration controls</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-300">★</span>
                        <span>Verifier management</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Subscription for Verifiers */}
              <div className="bg-slate-800/40 rounded-xl p-5 border border-cyan-500/20 space-y-3">
                <h5 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Subscription for Verifiers / DAOs
                </h5>

                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-400/40 space-y-3">
                  <p className="text-sm font-semibold text-cyan-300">
                    Paid Dashboard:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-200">
                    <li className="flex gap-2">
                      <span className="text-cyan-400">📊</span>
                      <span>Verification analytics</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-400">🛡️</span>
                      <span>Abuse prevention</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-400">⚙️</span>
                      <span>Custom claim modules</span>
                    </li>
                  </ul>
                  <div className="bg-cyan-500/20 rounded-lg px-3 py-2 border border-cyan-400/30 mt-3">
                    <p className="text-sm font-bold text-cyan-200 text-center">
                      Monthly SaaS-style fee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why This Market Wins */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-2xl" />
          <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-purple-500/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚀</div>
              <h4 className="text-2xl font-bold text-white">
                Why This Market Wins
              </h4>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30 text-center space-y-2">
                <div className="text-3xl">🌐</div>
                <p className="text-purple-300 font-semibold">
                  Every Web3 app needs login
                </p>
              </div>

              <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/30 text-center space-y-2">
                <div className="text-3xl">⚡</div>
                <p className="text-pink-300 font-semibold">
                  Wallet exposure is a known pain point
                </p>
              </div>

              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30 text-center space-y-2">
                <div className="text-3xl">✨</div>
                <p className="text-cyan-300 font-semibold">
                  No ZK infra required → fast adoption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slide5;
