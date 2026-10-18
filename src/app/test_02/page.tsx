import React, { Suspense } from "react";
import ParallelCompareView from "@/components/ParallelCompareView";

export const metadata = {
  title: "Multi-Model Parallel Scanner (V2 vs V3 vs V4) | ZeroWaste Chef",
};

export default function Test02Page() {
  return (
    <main className="min-h-screen bg-black text-white p-3 sm:p-5 flex flex-col items-center selection:bg-neutral-800">
      <div className="w-full max-w-4xl flex flex-col space-y-3">
        <header className="flex justify-between items-center pb-2 border-b border-zinc-900">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <h1 className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-200">
              ZeroWaste Chef
            </h1>
            <span className="text-zinc-700">&bull;</span>
            <span className="text-[10px] font-mono text-zinc-400">Test 02: Parallel Engine Comparator</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">UTeM Group 23</span>
        </header>

        <Suspense
          fallback={
            <div className="text-zinc-500 font-mono text-xs text-center py-16">
              Loading Multi-Engine Parallel Scanner...
            </div>
          }
        >
          <ParallelCompareView />
        </Suspense>
      </div>
    </main>
  );
}
