import { EncryptedText } from "@/components/ui/encrypted-text";
import { Suspense, useEffect, useRef } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { gsap } from "gsap";

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-[#f44336] p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
          // variant="white"
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 shadow-[0px_0px_20px_0px_#2e2e2e]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-white md:text-2xl/[1.875rem] ">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem]  md:text-base/[1.375rem] text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

interface Slide2Props {
  isActive: boolean;
}

const Slide2 = ({ isActive }: Slide2Props) => {
  const cardsRef = useRef<HTMLUListElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (cardsRef.current) {
      const cards = Array.from(cardsRef.current.querySelectorAll("li"));

      if (isActive && !hasAnimated.current) {
        // Set initial state for all cards
        cards.forEach(card => {
          gsap.set(card, { opacity: 0, y: 30 });
        });

        // Animate each card with increasing delay
        cards.forEach((card, index) => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.5 + (index * 0.3), // Each card waits 0.3s longer than previous
          });
        });
        
        hasAnimated.current = true;
      } else if (!isActive && hasAnimated.current) {
        // Reset when slide becomes inactive
        cards.forEach(card => {
          gsap.set(card, { opacity: 0, y: 30 });
        });
        hasAnimated.current = false;
      }
    }
  }, [isActive]);

  return (
    <div className="font-bold tracking-tight h-full w-full flex flex-col items-center justify-center bg-black px-8">
      {/* The Problem */}
      <div className="max-w-6xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h3 className="text-5xl md:text-6xl font-bold text-[#f44336]">
            The Problem
          </h3>
          <p className="text-xl md:text-2xl text-[#bfbfbf] font-medium">
            Current verification methods expose too much
          </p>
        </div>

        <ul
          ref={cardsRef}
          className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2"
        >
          <GridItem
            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
            // icon={<div className="h-4 w-4 text-black dark:text-neutral-400" />}
            icon={
              <svg
                className="w-6 h-6 text-[#f44336]"
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
            }
            title="Full History Exposed"
            description="Connecting your wallet reveals every transaction, balance, and
                NFT you own. No privacy, no control."
          />

          <GridItem
            area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
            // icon={
            //   <Settings className="h-4 w-4 text-black dark:text-neutral-400" />
            // }
            icon={
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
            }
            title=" All-or-Nothing"
            description="Can't prove you own an NFT without exposing your entire
                collection and wallet address."
          />

          <GridItem
            area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
            icon={
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
            }
            // icon={<Lock className="h-4 w-4 text-black dark:text-neutral-400" />}
            title="Privacy Leaks"
            description="Your wallet becomes linked to your identity, enabling tracking
                across platforms and applications."
          />

          <GridItem
            area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
            icon={
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
            }
            // icon={
            //   <Sparkles className="h-4 w-4 text-black dark:text-neutral-400" />
            // }
            title="Security Risks"
            description="  Exposed holdings make you a target for phishing, scams, and
                social engineering attacks."
          />

          <GridItem
            area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
            icon={
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
            }
            // icon={
            //   <Search className="h-4 w-4 text-black dark:text-neutral-400" />
            // }
            title="Security Risks"
            description="  Exposed holdings make you a target for phishing, scams, and
                social engineering attacks."
          />
        </ul>

        {/* <div className="grid md:grid-cols-2 gap-6">
       
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

    
        <div className="text-center pt-4">
          <p className="text-2xl text-rose-400 font-semibold">
            There has to be a better way...
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Slide2;
