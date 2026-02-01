import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

interface Slide0Props {
  isActive: boolean;
}

const Slide0 = ({ isActive }: Slide0Props) => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black">
      <img src="/assets/reveal_logo_web.png" className="w-56 z-10" />
      <Suspense
        fallback={
          <span className="bg-gradient-to-r from-[#24F5F8] via-[#5C00E5] to-[#9100E5] text-transparent bg-clip-text">
            Reveal
          </span>
        }
      >
        <div className="bg-gradient-to-r from-[#24F5F8] via-[#5C00E5] to-[#9100E5] text-transparent bg-clip-text text-8xl">
          <EncryptedText
            text="Reveal"
            //   encryptedClassName=""
            //   revealedClassName="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 text-transparent bg-clip-text"
            revealDelayMs={100}
          />
        </div>
      </Suspense>

      <div className="text-white pt-4 text-lg font-medium opacity-60">
        Identity privacy protocol.
      </div>
    </div>
  );
};

export default Slide0;
