import { Leaf } from "lucide-react";

/**
 * The dark-green "GREEN BOX" packaging graphic in the hero -- built as real
 * layered HTML/CSS (front + side panel, angled via CSS transforms) rather
 * than a photo/render, since no stock or generated image could ever carry
 * this exact wordmark/branding. Produce sits on top of this, absolutely
 * positioned by the caller, so it visually reads as coming out of the open
 * top edge between the two panels.
 */
export function GreenBoxGraphic({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative mx-auto flex h-[46%] w-[85%] items-stretch" style={{ perspective: "1200px" }}>
        {/* Side panel -- angled away via rotateY, sits behind/right of the front panel */}
        <div
          className="relative -ms-6 w-[38%] rounded-e-2xl bg-gradient-to-br from-deep-700 to-deep-900 shadow-[inset_-8px_0_16px_rgba(0,0,0,0.25)]"
          style={{ transform: "rotateY(-32deg)", transformOrigin: "left center" }}
        >
          <p className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1 text-center text-[0.55rem] leading-tight font-extrabold tracking-wide text-brand-100/90 uppercase sm:text-[0.65rem]">
            <span>Fresher</span>
            <span>Food</span>
            <span>Brighter</span>
            <span>Days</span>
          </p>
        </div>

        {/* Front panel -- the main branded face */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1.5 rounded-s-2xl rounded-e-md bg-gradient-to-br from-deep-600 via-deep-700 to-deep-800 px-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.08),0_30px_50px_-20px_rgba(14,27,20,0.6)]">
          <Leaf className="h-5 w-5 text-brand-300 sm:h-6 sm:w-6" aria-hidden="true" />
          <p className="text-lg font-black tracking-wide text-[#f4f2e6] uppercase drop-shadow-sm sm:text-2xl">Green Box</p>
        </div>

        {/* Open-top inner rim, suggesting the box has real depth */}
        <div className="pointer-events-none absolute inset-x-[6%] -top-2 h-3 rounded-full bg-deep-900/40 blur-[2px]" aria-hidden="true" />
      </div>

      {/* Grounding shadow */}
      <div className="mx-auto -mt-1 h-4 w-[70%] rounded-full bg-deep-900/20 blur-md" aria-hidden="true" />
    </div>
  );
}
