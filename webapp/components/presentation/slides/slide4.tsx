import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

interface Slide4Props {
  isActive: boolean;
}

const Slide4 = ({ isActive }: Slide4Props) => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black px-8 py-12 overflow-y-auto">
      {/* How it Works */}
      <div className="max-w-7xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-4xl md:text-5xl font-bold text-white">
            How It Works
          </h3>
          <p className="text-lg md:text-xl text-slate-400">
            Architecture Overview
          </p>
        </div>

        {/* Three Columns */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Client-side */}
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl transition-all" />
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 space-y-4 h-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white">Client-side</h4>
              </div>
              <p className="text-sm text-purple-300 font-semibold">
                Wallet Extension
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-purple-400 flex-shrink-0">1.</span>
                  <span>
                    User selects a claim (e.g. owns NFT X, DAO member)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 flex-shrink-0">2.</span>
                  <span>Extension generates scoped, time-limited claim</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 flex-shrink-0">3.</span>
                  <span>User signs claim locally (EIP-712)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 flex-shrink-0">4.</span>
                  <span className="font-semibold text-purple-300">
                    Wallet address not shared by default
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* On-chain */}
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-xl transition-all" />
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 space-y-4 h-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white">On-chain</h4>
              </div>
              <p className="text-sm text-cyan-300 font-semibold">
                Smart Contract
              </p>
              <div className="space-y-3">
                <p className="text-sm text-slate-300 font-semibold">
                  Verifies:
                </p>
                <ul className="space-y-2 text-sm text-slate-300 pl-4">
                  <li className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Signature validity</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Expiration & nonce (replay protection)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Claim module logic (e.g. NFT ownership)</span>
                  </li>
                </ul>
                <div className="bg-cyan-500/10 rounded-lg px-3 py-2 border border-cyan-500/30">
                  <p className="text-sm font-semibold text-cyan-300">
                    Returns: ✓ valid / ✗ invalid
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verifier */}
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl transition-all" />
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 space-y-4 h-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-emerald-400"
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
                </div>
                <h4 className="text-xl font-bold text-white">Verifier</h4>
              </div>
              <p className="text-sm text-emerald-300 font-semibold">
                DApp / DAO / Service
              </p>
              <div className="space-y-3">
                <p className="text-sm text-slate-300 font-semibold">
                  Receives:
                </p>
                <ul className="space-y-2 text-sm text-slate-300 pl-4">
                  <li className="flex gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>The signed claim</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>Proof metadata (scope + expiry)</span>
                  </li>
                </ul>
                <p className="text-sm text-slate-300">
                  Calls the contract to verify
                </p>
                <div className="bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/30">
                  <p className="text-sm font-semibold text-emerald-300">
                    Learns only the outcome, not the wallet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Privacy Guarantee */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-cyan-500/50 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl">🔑</div>
              <div className="space-y-2">
                <h5 className="text-xl font-bold text-cyan-300">
                  Key Privacy Guarantee
                </h5>
                <p className="text-slate-300 leading-relaxed">
                  At no point does the verifier learn the user's wallet address,
                  transaction history, or exact balance — only whether the claim
                  is valid.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Future + One-liner */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">🔮</div>
            <div>
              <p className="text-sm text-slate-400 leading-relaxed">
                This design is{" "}
                <span className="text-purple-400 font-semibold">
                  ZK-compatible
                </span>{" "}
                in the future, but today prioritizes auditability, speed, and
                real-world usability.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">💡</div>
            <div>
              <p className="text-sm text-emerald-400 font-semibold leading-relaxed">
                Selective disclosure without ZK overhead — privacy by design,
                deployable today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slide4;
