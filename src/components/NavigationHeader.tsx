"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function NavigationHeader() {
  const pathname = usePathname() || "";

  // 1. Official v1.0 Header (Hybrid Only, Clean production design)
  const isOfficial = pathname.startsWith("/official_v1.0") || pathname.startsWith("/official");
  if (isOfficial) {
    return (
      <div className="w-full font-mono text-zinc-100 mb-1">
        <div className="flex items-center justify-between p-2.5 px-3 bg-zinc-950 border border-emerald-500/40 rounded-xl shadow-lg shadow-emerald-950/20">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              OFFICIAL v1.1
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold uppercase tracking-wider">
              Hybrid Only
            </span>
            <span className="hidden sm:inline text-zinc-600">&bull;</span>
            <span className="hidden sm:inline text-zinc-400">V4 Edge &rarr; Gemini Cloud</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Test 02 Suite Navigation (Strictly V4, GEMINI, GALLERY only)
  const isTest02 = pathname.startsWith("/test_02");
  if (isTest02) {
    const isV4 = pathname.includes("/v4");
    const isGemini = pathname.includes("/gemini");
    const isGallery = pathname.includes("/gallery") || pathname.includes("/tester");

    return (
      <div className="w-full font-mono text-zinc-100">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
          <Link
            href="/test_02/v4"
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              isV4
                ? "bg-white text-black shadow-sm font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            V4
          </Link>

          <Link
            href="/test_02/gemini"
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              isGemini
                ? "bg-white text-black shadow-sm font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            GEMINI
          </Link>

          <Link
            href="/test_02/gallery"
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              isGallery
                ? "bg-white text-black shadow-sm font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            GALLERY
          </Link>
        </div>
      </div>
    );
  }

  // 3. Test 01 Suite Navigation (V2, V3, V4, GEMINI, GALLERY - Table completely removed)
  const isV2 = pathname.includes("/v2") || pathname === "/test_01" || pathname === "/";
  const isV3 = pathname.includes("/v3");
  const isV4 = pathname.includes("/v4");
  const isGemini = pathname.includes("/gemini");
  const isGallery = pathname.includes("/tester") || pathname.includes("/gallery");

  return (
    <div className="w-full font-mono text-zinc-100">
      <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
        <Link
          href="/test_01/v2"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isV2
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          V2
        </Link>

        <Link
          href="/test_01/v3"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isV3
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          V3
        </Link>

        <Link
          href="/test_01/v4"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isV4
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          V4
        </Link>

        <Link
          href="/test_01/gemini"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isGemini
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          GEMINI
        </Link>

        <Link
          href="/test_01/tester"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isGallery
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          GALLERY
        </Link>
      </div>
    </div>
  );
}
