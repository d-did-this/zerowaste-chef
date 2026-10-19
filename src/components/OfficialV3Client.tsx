"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import NeumorphicScannerView from "@/components/NeumorphicScannerView";
import NeumorphicPantryView from "@/components/NeumorphicPantryView";

export default function OfficialV3Client() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<"scanner" | "pantry" | "cook-now" | "grocery">("pantry");

  // Force pure light mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("zerowaste_chef_theme");
    }
  }, []);

  return (
    <div className="bg-[#E0E5EC] text-foreground min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#6cf8bb] selection:text-[#002113]">
      {/* Stitch Fixed Header */}
      <header className="fixed top-0 w-full z-50 neo-bar-top backdrop-blur-md">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-3">
          {/* Left: Branding Emblem & Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-[#006948] shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl">eco</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground tracking-tight truncate flex items-center gap-1.5">
                <span>
                  {activeTab === "scanner" && "Scanner HUD"}
                  {activeTab === "pantry" && "Digital Pantry"}
                  {activeTab === "cook-now" && "Cook Now"}
                  {activeTab === "grocery" && "Grocery Restock"}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#006948]/15 text-[#006948] font-black border border-[#006948]/25">
                  v3.0
                </span>
              </span>
              <span className="text-[10px] text-[#006948] uppercase font-bold tracking-wider truncate">
                ZeroWaste Chef
              </span>
            </div>
          </div>

          {/* Right: Quick actions (Fullscreen, Changelog, Isolated Previews) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-muted hover:text-[#006948] active:scale-95 transition-transform cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
            <Link
              href="/changelog"
              aria-label="View Changelog"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-muted hover:text-[#006948] active:scale-95 transition-transform"
              title="Changelog"
            >
              <span className="material-symbols-outlined text-lg">history_edu</span>
            </Link>
            <a
              href="/design-preview.html"
              aria-label="3-Screen Canvas Studio"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-muted hover:text-[#006948] active:scale-95 transition-transform"
              title="Multi-Screen Studio Canvas"
            >
              <span className="material-symbols-outlined text-lg">view_carousel</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area with Smooth Tab Switch Animation */}
      <main className="flex-1 w-full max-w-md mx-auto pt-20 pb-28 px-4 flex flex-col">
        <div key={activeTab} className="w-full animate-tab-content flex-1 flex flex-col">
          {activeTab === "scanner" && (
            <Suspense
              fallback={
                <div className="w-full py-20 flex flex-col items-center justify-center text-xs text-muted space-y-2">
                  <div className="w-6 h-6 border-2 border-[#006948]/30 border-t-[#006948] rounded-full animate-spin" />
                  <span>Loading Vision HUD...</span>
                </div>
              }
            >
              <NeumorphicScannerView engine="hybrid" />
            </Suspense>
          )}

          {activeTab === "pantry" && (
            <NeumorphicPantryView
              activeSubTab="pantry"
              onOpenScanner={() => setActiveTab("scanner")}
            />
          )}

          {activeTab === "cook-now" && (
            <NeumorphicPantryView
              activeSubTab="cook-now"
              onOpenScanner={() => setActiveTab("scanner")}
            />
          )}

          {activeTab === "grocery" && (
            <NeumorphicPantryView
              activeSubTab="grocery"
              onOpenScanner={() => setActiveTab("scanner")}
            />
          )}
        </div>
      </main>

      {/* Floating Tactile Neumorphic Bottom Navigation Dock */}
      <nav className="fixed bottom-3 inset-x-3 max-w-md mx-auto z-40">
        <div className="bg-[#E0E5EC]/95 backdrop-blur-lg rounded-3xl p-1.5 neo-raised grid grid-cols-4 items-center gap-1">
          {/* 1. Scanner Tab */}
          <button
            onClick={() => setActiveTab("scanner")}
            className={`h-14 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "neo-crater font-bold"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-[11px] leading-tight">Scanner</span>
          </button>

          {/* 2. Pantry Tab */}
          <button
            onClick={() => setActiveTab("pantry")}
            className={`h-14 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === "pantry"
                ? "neo-crater font-bold"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">kitchen</span>
            <span className="text-[11px] leading-tight">Pantry</span>
          </button>

          {/* 3. Cook Now Tab (Coming Soon) */}
          <button
            onClick={() => setActiveTab("cook-now")}
            className={`h-14 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all relative cursor-pointer ${
              activeTab === "cook-now"
                ? "neo-crater font-bold"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">skillet</span>
            <span className="text-[10px] leading-tight font-semibold">Cook Now</span>
            <span
              className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                activeTab === "cook-now"
                  ? "bg-[#004730]/20 text-[#004730]"
                  : "bg-amber-100 text-amber-800 border border-amber-300/50"
              }`}
            >
              Soon
            </span>
          </button>

          {/* 4. Grocery Restock Tab (Coming Soon) */}
          <button
            onClick={() => setActiveTab("grocery")}
            className={`h-14 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all relative cursor-pointer ${
              activeTab === "grocery"
                ? "neo-crater font-bold"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            <span className="text-[10px] leading-tight font-semibold">Grocery</span>
            <span
              className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                activeTab === "grocery"
                  ? "bg-[#004730]/20 text-[#004730]"
                  : "bg-amber-100 text-amber-800 border border-amber-300/50"
              }`}
            >
              Soon
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
