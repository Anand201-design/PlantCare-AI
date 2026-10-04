import React, { useEffect, useState } from "react";
import { Check, Loader2, Leaf } from "lucide-react";

const STEPS = [
  "Image processed",
  "Plant identified",
  "Disease analysis",
  "Nutrition analysis",
  "Health analysis",
];

export const LoadingAnalysis: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-10 flex items-center justify-center">
      <div className="relative overflow-hidden max-w-md w-full bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[24px] p-7 shadow-[0_4px_16px_rgba(22,58,45,0.05)] space-y-6">
        {/* Forest Green Botanical Plant & Leaf Background Design */}
        <svg
          viewBox="0 0 420 460"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-90 dark:opacity-55 z-0"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="procPlantGradTop" x1="425" y1="-10" x2="285" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.38" />
              <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="procPlantGradSecondary" x1="425" y1="65" x2="335" y2="195" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#163A2D" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="procPlantGradBottom" x1="-10" y1="465" x2="145" y2="330" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.14" />
            </linearGradient>
          </defs>

          {/* Top-right overhanging botanical plant branch & leaves */}
          <path
            d="M425 -10 C345 12, 285 65, 310 155 C365 130, 405 68, 425 -10 Z"
            fill="url(#procPlantGradTop)"
          />
          <path
            d="M415 -5 C365 42, 338 92, 310 155"
            stroke="#176B4D"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          <path
            d="M362 50 L392 42 M342 82 L378 72 M326 112 L356 105 M362 50 L346 26 M342 82 L326 56"
            stroke="#176B4D"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <path
            d="M425 65 C372 85, 345 125, 362 182 C395 158, 415 115, 425 65 Z"
            fill="url(#procPlantGradSecondary)"
          />

          {/* Bottom-left ascending botanical plant stem & leaf cluster */}
          <path
            d="M-10 465 C32 395, 78 345, 138 305"
            stroke="#176B4D"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.38"
          />
          <path
            d="M-10 465 C35 385, 98 355, 140 405 C85 440, 35 458, -10 465 Z"
            fill="url(#procPlantGradBottom)"
          />
          <path
            d="M-5 458 C42 428, 88 415, 140 405"
            stroke="#176B4D"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <path
            d="M45 385 C28 352, 42 318, 76 315 C78 348, 62 372, 45 385 Z"
            fill="url(#procPlantGradTop)"
          />
          <path
            d="M45 385 C56 358, 66 336, 76 315"
            stroke="#176B4D"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <path
            d="M88 342 C112 325, 138 332, 140 356 C116 360, 98 352, 88 342 Z"
            fill="#176B4D"
            fillOpacity="0.22"
          />
        </svg>

        {/* Top Loader Icon + Heading */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B] relative shadow-2xs">
            <Loader2 className="w-7 h-7 animate-spin text-[#176B4D] dark:text-[#8EAD9B]" />
            <Leaf className="w-3.5 h-3.5 absolute text-[#176B4D] dark:text-[#8EAD9B]" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              Analyzing your plant...
            </h3>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-1">
              Running botanical identification and foliar health checks
            </p>
          </div>
        </div>

        {/* Checklist */}
        <ul className="relative z-10 space-y-2.5 pt-2">
          {STEPS.map((step, index) => {
            const isDone = index <= activeIndex;
            const isCurrent = index === activeIndex;
            return (
              <li
                key={step}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs transition-all duration-300 ${
                  isDone
                    ? "bg-[#F0F6F1]/95 dark:bg-[#1D3B2D]/95 border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3] font-semibold"
                    : "bg-[#F6F9F5]/90 dark:bg-[#12281E]/90 border-[#DCE7DF]/60 dark:border-[#244737]/60 text-[#668074] dark:text-[#B0C9BA]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? "bg-[#176B4D] dark:bg-[#2D8A62] text-white"
                        : "bg-[#E4F0E7] dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#668074]"
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>
                  <span>{step}</span>
                </div>
                <span className="text-[11px] text-[#176B4D] dark:text-[#8EAD9B] font-medium">
                  {isCurrent ? "Processing..." : isDone ? "Completed" : "Pending"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
