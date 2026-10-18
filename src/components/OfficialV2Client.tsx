"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import NeumorphicScannerView from "@/components/NeumorphicScannerView";
import NeumorphicPantryView from "@/components/NeumorphicPantryView";

export default function OfficialV2Client() {
  const [activeTab, setActiveTab] = useState<"scanner" | "pantry" | "cook-now" | "grocery">("scanner");

  return (
    <div className="bg-[#f0f4f9] text-[#1e293b] min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#6cf8bb] selection:text-[#002113]">
      {/* Stitch Fixed Header */}
      <header className="fixed top-0 w-full z-50 neo-bar-top backdrop-blur-md">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-3">
          {/* Left: Navigation & Branding */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/official_v1.0"
              aria-label="Previous Version"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-[#1e293b] active:scale-95 transition-all shrink-0"
              title="Back to Classic v1.0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#1e293b] tracking-tight truncate flex items-center gap-1.5">
                <span>
                  {activeTab === "scanner" && "Scanner HUD"}
                  {activeTab === "pantry" && "Smart Pantry AI"}
                  {activeTab === "cook-now" && "Cook Now"}
                  {activeTab === "grocery" && "Grocery Restock"}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#006948]/15 text-[#006948] font-black border border-[#006948]/25">
                  v2.0
                </span>
              </span>
              <span className="text-[10px] text-[#006948] uppercase font-bold tracking-wider truncate">
                ZeroWaste Chef
              </span>
            </div>
          </div>

          {/* Right: Quick actions (Changelog & Test Suite) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/changelog"
              aria-label="View Changelog"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-[#576574] hover:text-[#006948] active:scale-95 transition-transform"
              title="Changelog"
            >
              <span className="material-symbols-outlined text-lg">history_edu</span>
            </Link>
            <Link
              href="/test_02/v4"
              aria-label="Test Suite"
              className="min-h-[42px] min-w-[42px] rounded-2xl neo-raised flex items-center justify-center text-[#576574] hover:text-[#006948] active:scale-95 transition-transform"
              title="Test Suite (v4 / Gemini / Gallery)"
            >
              <span className="material-symbols-outlined text-lg">science</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto pt-20 pb-24 px-4 flex flex-col">
        {activeTab === "scanner" && (
          <Suspense
            fallback={
              <div className="w-full py-20 flex flex-col items-center justify-center text-xs text-[#576574] space-y-2">
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
      </main>

      {/* Fixed Google Stitch Tactile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#f0f4f9]/95 backdrop-blur-md neo-raised">
        <div className="h-20 max-w-md mx-auto grid grid-cols-4 items-center px-1">
          {/* 1. Scanner Tab */}
          <button
            onClick={() => setActiveTab("scanner")}
            className={`h-14 flex flex-col items-center justify-center gap-1 rounded-2xl mx-1 transition-all ${
              activeTab === "scanner"
                ? "neo-recessed-darkgreen font-bold text-white shadow-inner"
                : "text-[#576574] hover:text-[#1e293b]"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-[11px]">Scanner</span>
          </button>

          {/* 2. Pantry Tab */}
          <button
            onClick={() => setActiveTab("pantry")}
            className={`h-14 flex flex-col items-center justify-center gap-1 rounded-2xl mx-1 transition-all ${
              activeTab === "pantry"
                ? "neo-recessed-darkgreen font-bold text-white shadow-inner"
                : "text-[#576574] hover:text-[#1e293b]"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">kitchen</span>
            <span className="text-[11px]">Pantry</span>
          </button>

          {/* 3. Cook Now Tab */}
          <button
            onClick={() => setActiveTab("cook-now")}
            className={`h-14 flex flex-col items-center justify-center gap-1 rounded-2xl mx-1 transition-all ${
              activeTab === "cook-now"
                ? "neo-recessed-darkgreen font-bold text-white shadow-inner"
                : "text-[#576574] hover:text-[#1e293b]"
            }`}
            type="button"
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">skillet</span>
              <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.2 rounded-full neo-raised-primary text-white text-[9px] leading-3 font-bold uppercase tracking-tight">
                Ready
              </span>
            </div>
            <span className="text-[11px] font-semibold">Cook Now</span>
          </button>

          {/* 4. Grocery Tab */}
          <button
            onClick={() => setActiveTab("grocery")}
            className={`h-14 flex flex-col items-center justify-center gap-1 rounded-2xl mx-1 transition-all ${
              activeTab === "grocery"
                ? "neo-recessed-darkgreen font-bold text-white shadow-inner"
                : "text-[#576574] hover:text-[#1e293b]"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            <span className="text-[11px] font-semibold">Grocery</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
