"use client";

import React from "react";
import { Trash2, Package, Sparkles } from "lucide-react";
import { PantryItem } from "@/utils/pantryStorage";

interface PantryListProps {
  items: PantryItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export default function PantryList({
  items,
  onDeleteItem,
  onClearAll,
}: PantryListProps) {
  if (items.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-300">Your Pantry is Empty</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Scan or take a picture of an ingredient above to record it in your digital pantry database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-extrabold text-white">Active Digital Pantry</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
            {items.length} items
          </span>
        </div>

        <button
          onClick={onClearAll}
          className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Item Cards List */}
      <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                {item.emoji}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {item.nameMalay}
                  </span>
                  <span className="text-[10px] text-slate-400">({item.name})</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400 font-medium">
                    {item.category}
                  </span>
                  {item.confidence && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.confidence}% AI
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Quantity Pill */}
              <div className="text-right">
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {item.quantity}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1">
                  {item.unit}
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
