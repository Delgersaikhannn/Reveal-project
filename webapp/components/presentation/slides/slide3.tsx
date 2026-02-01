import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

const Slide3 = () => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black px-8">
      {/* The Solution */}
      <div className="max-w-7xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h3 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 text-transparent bg-clip-text">
            The Solution: Reveal
          </h3>
          <p className="text-xl md:text-2xl text-slate-400">
            Privacy-preserving proof generation
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="flex items-center justify-center gap-8 md:gap-12">
          {/* Wallet */}
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-emerald-500/50 rounded-3xl p-8 space-y-4 w-64">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-white text-center">
                Your Wallet
              </h4>
              <p className="text-slate-400 text-sm text-center leading-relaxed">
                Full transaction history, NFTs, tokens
              </p>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="flex-shrink-0">
            <svg
              className="w-12 h-12 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>

          {/* Masking Layer */}
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-cyan-500/50 rounded-3xl p-8 space-y-4 w-80">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-white text-center">
                Masking Layer
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-cyan-500/10 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-cyan-300 text-sm font-semibold">
                    Selective disclosure
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-cyan-500/10 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-cyan-300 text-sm font-semibold">
                    Time-bound proofs
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-cyan-500/10 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-cyan-300 text-sm font-semibold">
                    Zero-knowledge
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="flex-shrink-0">
            <svg
              className="w-12 h-12 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>

          {/* Verifier */}
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-blue-500/50 rounded-3xl p-8 space-y-4 w-64">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-white text-center">
                Verifier
              </h4>
              <p className="text-slate-400 text-sm text-center leading-relaxed">
                Only sees what you choose to prove
              </p>
            </div>
          </div>
        </div>

        {/* Key Benefit */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p className="text-xl md:text-2xl text-cyan-300 font-semibold">
              Verifier never receives your full wallet data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slide3;
