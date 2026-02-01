"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import Slide1 from "./slides/slide1";
import Slide2 from "./slides/slide2";
import Slide3 from "./slides/slide3";
import Slide4 from "./slides/slide4";
import Slide5 from "./slides/slide5";
import Slide6 from "./slides/slideDemo";
import Slide0 from "./slides/slide0";

interface Section {
  title: string;
  description: string;
  gradient: string;
  content?: React.FC<{ isActive: boolean }>;
}

const sections: Section[] = [
  {
    title: "Reveal",
    description:
      "Prove only what matters without exposing your full wallet history",
    gradient: "from-emerald-500 to-cyan-500",
    content: Slide0,
  },

  {
    title: "The Problem",
    description: "Control exactly what information you share with verifiers",
    gradient: "from-cyan-500 to-blue-500",
    content: Slide2,
  },
  {
    title: "The Solution",
    description:
      "Cryptographically verified claims without revealing underlying data",
    gradient: "from-blue-500 to-purple-500",
    content: Slide3,
  },
  {
    title: "Time-Bounded Security",
    description:
      "Proofs expire automatically to prevent unauthorized replay attacks",
    gradient: "from-purple-500 to-pink-500",
    content: Slide4,
  },
  {
    title: "On-Chain Verification",
    description: "Smart contracts validate your claims against blockchain data",
    gradient: "from-pink-500 to-rose-500",
    content: Slide6,
  },
  {
    title: "On-Chain Verification",
    description: "Smart contracts validate your claims against blockchain data",
    gradient: "from-pink-500 to-rose-500",
    content: Slide5,
  },
  {
    title: "Reveal",
    description:
      "Prove only what matters without exposing your full wallet history",
    gradient: "from-emerald-500 to-cyan-500",
    content: Slide1,
  },
];

export default function InfiniteScrollPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const isAnimating = useRef(false);

  const goToSlide = (index: number) => {
    if (isAnimating.current) return;

    isAnimating.current = true;
    const currentSection = sectionsRef.current[currentSlide];
    const nextSection = sectionsRef.current[index];

    if (!currentSection || !nextSection) return;

    // Set initial state for next slide immediately
    gsap.set(nextSection, { opacity: 0, y: 100 });

    // Animate out current slide
    gsap.to(currentSection, {
      opacity: 0,
      y: -100,
      duration: 0.5,
      ease: "power2.in",
    });

    // Animate in next slide
    gsap.to(nextSection, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.2,
      onComplete: () => {
        isAnimating.current = false;
      },
    });

    setCurrentSlide(index);
  };

  const nextSlide = () => {
    const next = (currentSlide + 1) % sections.length;
    goToSlide(next);
  };

  const prevSlide = () => {
    const prev = (currentSlide - 1 + sections.length) % sections.length;
    goToSlide(prev);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]); // Re-attach listener when currentSlide changes

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="relative h-full ">
        {sections.map((section, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) sectionsRef.current[index] = el;
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center "
            style={{
              opacity: index === 0 && currentSlide === 0 ? 1 : 0,
              pointerEvents: index === currentSlide ? "auto" : "none",
            }}
          >
            {" "}
            {/* <h2 className="text-5xl md:text-xl font-bold text-white absolute left-4 top-4">
              {section.title}
            </h2> */}
            {section.content && (
              <section.content isActive={index === currentSlide} />
            )}
            {/* Background gradient effect */}
            {/* <div
              className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-10 blur-3xl`}
            /> */}
          </div>
        ))}
      </div>

      {/* Navigation arrows at bottom right */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4">
        {/* Slide indicator */}
        <div className="flex items-center gap-2">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-slate-600 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {/* Prev button */}
        <button
          onClick={prevSlide}
          className="group w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm flex items-center justify-center hover:bg-slate-700/50 hover:border-slate-600 transition-all"
          aria-label="Previous slide"
        >
          <svg
            className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next button */}
        <button
          onClick={nextSlide}
          className="group w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm flex items-center justify-center hover:bg-slate-700/50 hover:border-slate-600 transition-all"
          aria-label="Next slide"
        >
          <svg
            className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
    </div>
  );
}
