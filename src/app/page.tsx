import React from "react";
import CameraView from "@/components/CameraView";
import { MALAYSIAN_INGREDIENTS_DB } from "@/utils/malaysianIngredients";
import { Sparkles, Leaf } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 font-sans">
      {/* App Navigation Bar */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              ZeroWaste Chef
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                MY AI
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Malaysian Kitchen Vision & Pantry Logger
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>75+ Local Items</span>
        </div>
      </header>

      {/* Main Vision Input & Digital Pantry Pipeline */}
      <section className="flex-1 flex flex-col justify-center items-center my-auto w-full">
        <CameraView />
      </section>

      {/* Malaysian Dataset Carousel Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Localized Pantry Scope ({MALAYSIAN_INGREDIENTS_DB.length}+ Ingredients)
          </span>
          <span className="text-emerald-400 font-mono text-[10px]">UTeM Group 23</span>
        </div>

        {/* Scrollable Badges of Supported Malaysian Staples */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {MALAYSIAN_INGREDIENTS_DB.slice(0, 25).map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 font-semibold"
            >
              <span>{item.emoji}</span>
              <span>{item.nameMalay}</span>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
