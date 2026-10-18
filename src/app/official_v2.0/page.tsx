import React, { Suspense } from "react";
import Link from "next/link";
import NeumorphicScannerView from "@/components/NeumorphicScannerView";

export const metadata = {
  title: "ZeroWaste Chef v2.0 | Neumorphic Scanner HUD",
  description:
    "Official v2.0 flagship release featuring Stitch Neumorphic Soft-UI design and dual-stage Hybrid Intelligence.",
};

export default function OfficialV2Page() {
  return (
    <div className="bg-[#eef2f6] text-[#161c22] min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#6cf8bb] selection:text-[#002113]">
      {/* Stitch Fixed Header */}
      <header className="fixed top-0 w-full z-50 neo-bar-top backdrop-blur-md">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-3">
          {/* Left: Back button & Titles */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/official_v1.0"
              aria-label="Previous Version"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-[#161c22] active:scale-95 transition-all shrink-0"
              title="Back to v1.0 / v1.1"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#161c22] tracking-tight truncate flex items-center gap-1.5">
                <span>Scanner HUD</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#006948]/15 text-[#006948] font-black border border-[#006948]/25">
                  v2.0
                </span>
              </span>
              <span className="text-[10px] text-[#006948] uppercase font-bold tracking-wider truncate">
                ZeroWaste Kitchen &bull; Hybrid
              </span>
            </div>
          </div>

          {/* Right: Quick actions (Changelog & Test Suites) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/changelog"
              aria-label="View Changelog"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-[#3d4a42] hover:text-[#006948] active:scale-95 transition-transform"
              title="Changelog"
            >
              <span className="material-symbols-outlined text-lg">history_edu</span>
            </Link>
            <Link
              href="/test_02/v4"
              aria-label="Test Suite"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-[#3d4a42] hover:text-[#006948] active:scale-95 transition-transform"
              title="Test Suite (v4 / Gemini / Gallery)"
            >
              <span className="material-symbols-outlined text-lg">science</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto pt-20 pb-8 px-4 flex flex-col">
        <Suspense
          fallback={
            <div className="w-full py-20 flex flex-col items-center justify-center text-xs text-[#3d4a42] space-y-2">
              <div className="w-6 h-6 border-2 border-[#006948]/30 border-t-[#006948] rounded-full animate-spin" />
              <span>Loading Neumorphic Vision HUD...</span>
            </div>
          }
        >
          <NeumorphicScannerView engine="hybrid" />
        </Suspense>

        {/* Footer info */}
        <footer className="mt-6 text-center text-[10px] text-[#6d7a72] flex flex-col items-center space-y-0.5">
          <div>ZeroWaste Chef v2.0 &bull; UTeM Workshop 2 (BAXU 3923)</div>
          <div>Stitch Neumorphic HUD &bull; MobileNet v4 Edge + Gemini Cloud</div>
        </footer>
      </main>
    </div>
  );
}
