"use client";

interface Slide4Props {
  isActive: boolean;
}

const Slide4 = ({ isActive }: Slide4Props) => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black px-8 py-12 overflow-y-auto">
      <div className="max-w-7xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-4xl md:text-5xl font-bold text-white">
            How It Works
          </h3>
          <p className="text-lg md:text-xl text-slate-400">Architecture Flow</p>
        </div>

        {/* Flow Diagram */}
        <div className="relative">
          <div className="flex items-center justify-between gap-4 relative">
            {/* Step 1: Client-side */}
            <div className="flex-1 relative">
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl transition-all" />
                <div className="relative bg-slate-900/60 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-purple-400"
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
                    <div>
                      <div className="text-xs text-purple-400 font-semibold">
                        STEP 1
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        Client-side
                      </h4>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex gap-2">
                      <span className="text-purple-400 flex-shrink-0">•</span>
                      <span>User selects claim</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 flex-shrink-0">•</span>
                      <span>Generate time-limited claim</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 flex-shrink-0">•</span>
                      <span>Sign with EIP-712</span>
                    </li>
                  </ul>
                  <div className="bg-purple-500/10 rounded-lg px-3 py-2 border border-purple-500/30">
                    <p className="text-xs font-semibold text-purple-300">
                      📦 Signed Proof
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center gap-1 -mx-2 z-10">
              <svg
                className="w-12 h-12 text-cyan-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
              </svg>
              <div className="text-xs text-cyan-400 font-semibold whitespace-nowrap">
                Submit
              </div>
            </div>

            {/* Step 2: On-chain */}
            <div className="flex-1 relative">
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-xl transition-all" />
                <div className="relative bg-slate-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-cyan-400"
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
                    <div>
                      <div className="text-xs text-cyan-400 font-semibold">
                        STEP 2
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        Smart Contract
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-cyan-300 font-semibold">
                      Verifies:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-300">
                      <li className="flex gap-2">
                        <span className="text-cyan-400">✓</span>
                        <span>Signature valid</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400">✓</span>
                        <span>Not expired</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400">✓</span>
                        <span>Claim logic passed</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-cyan-500/10 rounded-lg px-3 py-2 border border-cyan-500/30">
                    <p className="text-xs font-semibold text-cyan-300">
                      ✓ Valid / ✗ Invalid
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="flex flex-col items-center gap-1 -mx-2 z-10">
              <svg
                className="w-12 h-12 text-emerald-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
              </svg>
              <div className="text-xs text-emerald-400 font-semibold whitespace-nowrap">
                Result
              </div>
            </div>

            {/* Step 3: Verifier */}
            <div className="flex-1 relative">
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl transition-all" />
                <div className="relative bg-slate-900/60 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex itemscenter justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-emerald-400"
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
                    <div>
                      <div className="text-xs text-emerald-400 font-semibold">
                        STEP 3
                      </div>
                      <h4 className="text-lg font-bold text-white">Verifier</h4>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex gap-2">
                      <span className="text-emerald-400 flex-shrink-0">•</span>
                      <span>Receives validation result</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 flex-shrink-0">•</span>
                      <span>Learns claim outcome only</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400 flex-shrink-0">•</span>
                      <span>No wallet address exposed</span>
                    </li>
                  </ul>
                  <div className="bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/30">
                    <p className="text-xs font-semibold text-emerald-300">
                      🎯 Grant Access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Highlight */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-cyan-500/50 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 text-3xl">🔐</div>
              <div className="space-y-1">
                <h5 className="text-lg font-bold text-cyan-300">
                  Zero Knowledge About Your Wallet
                </h5>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Verifier only learns whether the claim is valid — never your
                  wallet address, balance, or transaction history.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Benefits */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">⚡</div>
            <div>
              <p className="text-sm font-semibold text-purple-400 mb-1">
                Real-time Verification
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                On-chain validation provides instant, auditable results without
                ZK complexity.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">🛡️</div>
            <div>
              <p className="text-sm font-semibold text-emerald-400 mb-1">
                Time-Bounded Security
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Expiring proofs prevent replay attacks and limit exposure
                windows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slide4;
