import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

const Slide1 = () => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black">
      <img src="/assets/reveal_logo_web.png" className="w-56 z-10" />
      <span className="text-white text-5xl">Prove only</span>

      <Suspense
        fallback={
          <span className="bg-gradient-to-r from-[#24F5F8] via-[#5C00E5] to-[#9100E5] text-transparent bg-clip-text">
            what matters.
          </span>
        }
      >
        <div className="bg-gradient-to-r from-[#24F5F8] via-[#5C00E5] to-[#9100E5] text-transparent bg-clip-text text-8xl">
          <EncryptedText
            text="what matters."
            //   encryptedClassName=""
            //   revealedClassName="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 text-transparent bg-clip-text"
            revealDelayMs={100}
          />
        </div>
      </Suspense>
      <div className="text-white pt-4 text-lg font-medium opacity-60">
        Reveal shows what your digital identity leaks — and how to stop it.
      </div>
    </div>
  );
};

export default Slide1;
