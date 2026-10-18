"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationHeader() {
  const pathname = usePathname() || "";

  const isV2 = pathname.includes("/v2") || pathname === "/test_01" || pathname === "/";
  const isV3 = pathname.includes("/v3");
  const isV4 = pathname.includes("/v4");
  const isGemini = pathname.includes("/gemini");
  const isGallery = pathname.includes("/tester");
  const isTable = pathname.includes("/table");

  return (
    <div className="w-full font-mono text-zinc-100">
      {/* Clean 6-Tab Navigation Bar */}
      <div className="grid grid-cols-6 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
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

        <Link
          href="/table"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isTable
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          TABLE
        </Link>
      </div>
    </div>
  );
}
