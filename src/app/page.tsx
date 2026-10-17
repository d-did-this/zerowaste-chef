import React from "react";
import CameraView from "@/components/CameraView";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col justify-between p-3 sm:p-5 font-sans selection:bg-white selection:text-black">
      {/* Clean Minimalist Monochrome Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-3 border-b border-zinc-900">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-tight text-white flex items-center gap-1.5 uppercase">
            ZeroWaste Chef
            <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded border border-zinc-800 text-zinc-400">
              v2.4
            </span>
          </h1>
          <p className="text-[11px] font-mono text-zinc-500">
            Vision Pipeline & Digital Inventory • UTeM Group 23
          </p>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 text-[10px] font-mono text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
          <span>LIVE PIPELINE</span>
        </div>
      </header>

      {/* Main Vision Input & Digital Pantry Pipeline */}
      <section className="flex-1 flex flex-col justify-center items-center my-auto w-full py-2">
        <CameraView />
      </section>

      {/* Minimal Monochrome Footer */}
      <footer className="w-full max-w-md mx-auto pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-600">
        <span>CNN MobileNet & Gemini Multi-Modal</span>
        <span>UTeM FAIX</span>
      </footer>
    </main>
  );
}
