import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense } from "react";

interface Slide1Props {
  isActive: boolean;
}

const Slide1 = ({ isActive }: Slide1Props) => {
  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black">
      <img
        src="/assets/fake_bank_statement.png"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-70 opacity-40"
      />
      {/* <img src="/assets/reveal_logo_web.png" className="w-56 z-10" /> */}
      <span className="text-white text-5xl z-10">
        "Would you share your bank statement to sign into Facebook?"
      </span>
    </div>
  );
};

export default Slide1;
