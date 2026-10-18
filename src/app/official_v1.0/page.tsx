import React, { Suspense } from "react";
import CameraView from "@/components/CameraView";

export const metadata = {
  title: "ZeroWaste Chef v1.0 | Official Hybrid Vision",
  description: "Official flagship release of ZeroWaste Chef featuring dual-stage Hybrid Intelligence (MobileNet v4 Edge + Gemini Vision Cloud).",
};

export default function OfficialV1Page() {
  return (
    <main className="min-h-screen bg-black text-white p-3 sm:p-5 flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col space-y-3">
        {/* Flagship Release Header */}
        <header className="flex justify-between items-center pb-2 border-b border-zinc-900">
          <div>
            <h1 className="text-sm font-mono font-bold tracking-widest uppercase text-zinc-100 flex items-center gap-1.5">
              <span>ZeroWaste Chef</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
              UTeM Workshop 2 &bull; Group 23 &bull; Official Hybrid Production
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-emerald-400 font-medium bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
              HYBRID ONLY
            </span>
          </div>
        </header>

        {/* Camera View strictly locked to Hybrid Mode */}
        <Suspense fallback={<div className="text-zinc-500 font-mono text-xs text-center py-10">Initializing Hybrid Vision Engine...</div>}>
          <CameraView engine="hybrid" />
        </Suspense>
      </div>
    </main>
  );
}
