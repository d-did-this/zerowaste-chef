"use client";

import React from "react";
import { Trash2, Package } from "lucide-react";
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
      <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center flex flex-col items-center justify-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-semibold text-zinc-300">Pantry Storage Empty</h4>
          <p className="text-[11px] font-mono text-zinc-600 mt-0.5">
            Logged ingredients from the scanner will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-2 font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white tracking-wider uppercase">Pantry Inventory</span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 text-[10px] border border-zinc-800">
            {items.length} records
          </span>
        </div>

        <button
          onClick={onClearAll}
          className="text-[10px] text-zinc-500 hover:text-white transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Item Cards List */}
      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
                {item.emoji}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white">
                    {item.nameMalay}
                  </span>
                  <span className="text-[10px] text-zinc-500">({item.name})</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center space-x-2">
                  <span>{item.category}</span>
                  {item.confidence && (
                    <span className="text-zinc-400">
                      • {item.confidence}% AI
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-white">
                {item.quantity} {item.unit}
              </span>

              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-600 hover:text-red-400 transition-all opacity-80 group-hover:opacity-100"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
