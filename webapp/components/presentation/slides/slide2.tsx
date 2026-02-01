import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

const Slide2 = () => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black px-8">
      {/* The Problem */}
      <div className="max-w-6xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h3 className="text-5xl md:text-6xl font-bold text-rose-400">
            The Problem
          </h3>
          <p className="text-xl md:text-2xl text-slate-400">
            Current verification methods expose too much
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Problem 1 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-rose-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-rose-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-white">
                  Full History Exposed
                </h4>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">
                Connecting your wallet reveals every transaction, balance, and
                NFT you own. No privacy, no control.
              </p>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-400"
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
                <h4 className="text-2xl font-bold text-white">
                  All-or-Nothing
                </h4>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">
                Can't prove you own an NFT without exposing your entire
                collection and wallet address.
              </p>
            </div>
          </div>

          {/* Problem 3 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-400"
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
                <h4 className="text-2xl font-bold text-white">Privacy Leaks</h4>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">
                Your wallet becomes linked to your identity, enabling tracking
                across platforms and applications.
              </p>
            </div>
          </div>

          {/* Problem 4 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-pink-400"
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
                </div>
                <h4 className="text-2xl font-bold text-white">
                  Security Risks
                </h4>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">
                Exposed holdings make you a target for phishing, scams, and
                social engineering attacks.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom emphasis */}
        <div className="text-center pt-4">
          <p className="text-2xl text-rose-400 font-semibold">
            There has to be a better way...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Slide2;
