import React, { Suspense } from "react";
import CameraView from "@/components/CameraView";

export const metadata = {
  title: "MobileNet v4 Scanner | Test 02 | ZeroWaste Chef",
};

export default function Test02V4Page() {
  return (
    <main className="min-h-screen bg-black text-white p-3 sm:p-5 flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col space-y-3">
        <header className="flex justify-between items-center pb-2 border-b border-zinc-900">
          <h1 className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-200">
            ZeroWaste Chef
          </h1>
          <span className="text-[10px] font-mono text-zinc-500">UTeM Group 23 &bull; Test 02 &bull; V4</span>
        </header>

        <Suspense fallback={<div className="text-zinc-500 font-mono text-xs text-center py-10">Loading CNN v4 Scanner...</div>}>
          <CameraView engine="cnn_v4" />
        </Suspense>
      </div>
    </main>
  );
}
