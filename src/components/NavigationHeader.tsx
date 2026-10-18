"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationHeader() {
  const pathname = usePathname() || "";

  const isTest01 =
    pathname.startsWith("/test_01") ||
    pathname === "/" ||
    pathname === "/v2" ||
    pathname === "/v3" ||
    pathname === "/v4" ||
    pathname === "/gemini" ||
    pathname === "/tester";

  const isTest02 = pathname.startsWith("/test_02");
  const isTable = pathname.startsWith("/table");

  return (
    <div className="w-full flex flex-col space-y-2 font-mono text-zinc-100">
      {/* Primary Top Nav Tier: TEST 01 | TEST 02 | TABLE */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
        <Link
          href="/test_01/v2"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isTest01
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          TEST 01
        </Link>

        <Link
          href="/test_02"
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            isTest02
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          TEST 02 (COMPARE)
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

      {/* Subtabs for TEST 01: V2 | V3 | V4 | GEMINI | BENCHMARK */}
      {isTest01 && (
        <div className="grid grid-cols-5 gap-1 p-1 bg-black border border-zinc-900 rounded-lg text-center text-[11px]">
          <Link
            href="/test_01/v2"
            className={`py-1.5 px-1 font-semibold rounded-md transition-all ${
              pathname.includes("/v2") || pathname === "/test_01" || pathname === "/"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            V2
          </Link>
          <Link
            href="/test_01/v3"
            className={`py-1.5 px-1 font-semibold rounded-md transition-all ${
              pathname.includes("/v3")
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            V3
          </Link>
          <Link
            href="/test_01/v4"
            className={`py-1.5 px-1 font-semibold rounded-md transition-all ${
              pathname.includes("/v4")
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            V4
          </Link>
          <Link
            href="/test_01/gemini"
            className={`py-1.5 px-1 font-semibold rounded-md transition-all ${
              pathname.includes("/gemini")
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            GEMINI
          </Link>
          <Link
            href="/test_01/tester"
            className={`py-1.5 px-1 font-semibold rounded-md transition-all ${
              pathname.includes("/tester")
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            BENCHMARK
          </Link>
        </div>
      )}
    </div>
  );
}
