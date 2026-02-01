import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

const Slide0 = () => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black">
      <img src="/assets/reveal_logo_web.png" className="w-56 z-10" />
      <span className="text-white text-5xl">Reveal</span>

      <div className="text-white pt-4 text-lg font-medium opacity-60">
        Reveal shows what your digital identity leaks — and how to stop it.
      </div>
    </div>
  );
};

export default Slide0;
