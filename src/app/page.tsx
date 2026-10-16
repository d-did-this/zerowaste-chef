import React from "react";
import CameraView from "@/components/CameraView";
import { TARGET_INGREDIENTS } from "@/utils/ingredientClassifier";
import { Sparkles, Leaf } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 font-sans">
      {/* App Navigation Bar */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              ZeroWaste Chef
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                Vision v1
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-Time Kitchen Ingredient Classifier
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>MobileNet CNN</span>
        </div>
      </header>

      {/* Vision Input Pipeline Container */}
      <section className="flex-1 flex flex-col justify-center items-center my-auto">
        <CameraView />
      </section>

      {/* Target Scope Ingredients Quick Bar */}
      <footer className="w-full max-w-md mx-auto pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Target Scope ({TARGET_INGREDIENTS.length}+ Ingredients)
          </span>
          <span className="text-emerald-400 font-mono">100% Client-Side</span>
        </div>

        {/* Scrollable Badges of Supported Kitchen Staples */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TARGET_INGREDIENTS.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium"
            >
              <span>{item.emoji}</span>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
