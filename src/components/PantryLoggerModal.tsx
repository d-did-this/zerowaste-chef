"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  X,
  Search,
  Plus,
  Minus,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  LocalIngredient,
  MALAYSIAN_INGREDIENTS_DB,
  searchIngredients,
} from "@/utils/malaysianIngredients";
import { savePantryItem, PantryItem } from "@/utils/pantryStorage";

interface DetectionResult {
  id?: string;
  name: string;
  nameMalay?: string;
  emoji?: string;
  category?: string;
  confidence?: number;
  suggestedQuantity?: number;
  suggestedUnit?: string;
  culinaryNote?: string;
  engineUsed?: string;
}

interface PantryLoggerModalProps {
  initialData: DetectionResult;
  onClose: () => void;
  onItemAdded: (item: PantryItem) => void;
}

const COMMON_UNITS = [
  "biji",
  "batang",
  "ikat",
  "helai",
  "ketul",
  "ekor",
  "g",
  "kg",
  "bungkus",
  "kotak",
  "tin",
  "papan",
  "keping",
  "botol",
  "sikat",
  "pcs",
];

export default function PantryLoggerModal({
  initialData,
  onClose,
  onItemAdded,
}: PantryLoggerModalProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<LocalIngredient>({
    id: initialData.id || "custom_item",
    name: initialData.name,
    nameMalay: initialData.nameMalay || initialData.name,
    emoji: initialData.emoji || "🥗",
    category: (initialData.category as LocalIngredient["category"]) || "Vegetables & Greens",
    defaultUnit: (initialData.suggestedUnit as LocalIngredient["defaultUnit"]) || "biji",
    keywords: [],
  });

  const [quantity, setQuantity] = useState<number>(
    initialData.suggestedQuantity && initialData.suggestedQuantity > 0
      ? initialData.suggestedQuantity
      : 1
  );
  const [unit, setUnit] = useState<string>(
    initialData.suggestedUnit || selectedIngredient.defaultUnit || "biji"
  );

  const [isChangingItem, setIsChangingItem] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredIngredients = searchIngredients(searchQuery);

  const handleSelectFromDb = (ing: LocalIngredient) => {
    setSelectedIngredient(ing);
    setUnit(ing.defaultUnit);
    setIsChangingItem(false);
  };

  const handleSave = () => {
    const saved = savePantryItem({
      name: selectedIngredient.name,
      nameMalay: selectedIngredient.nameMalay,
      emoji: selectedIngredient.emoji,
      category: selectedIngredient.category,
      quantity: Number(quantity),
      unit: unit,
      confidence: initialData.confidence,
      engineUsed: initialData.engineUsed,
      culinaryNote: initialData.culinaryNote,
    });

    onItemAdded(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 overflow-hidden flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Log to Digital Pantry</h3>
              <p className="text-xs text-slate-400">Module 1 Vision & Inventory Input</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detected Ingredient Display Card */}
        {!isChangingItem ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/60 shadow-lg flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner">
                  {selectedIngredient.emoji}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-extrabold text-white">
                      {selectedIngredient.nameMalay}
                    </h2>
                    {initialData.confidence && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                        {initialData.confidence}% Match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {selectedIngredient.name} •{" "}
                    <span className="text-emerald-400">{selectedIngredient.category}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChangingItem(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
              >
                Change
              </button>
            </div>

            {/* Culinary Note if available */}
            {initialData.culinaryNote && (
              <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-950/60 text-xs text-slate-400 border border-slate-800">
                <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{initialData.culinaryNote}</p>
              </div>
            )}
          </div>
        ) : (
          /* Search & Select Alternative Ingredient */
          <div className="flex flex-col space-y-2 max-h-56">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 75+ Malaysian ingredients..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/50">
              {filteredIngredients.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => handleSelectFromDb(ing)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{ing.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{ing.nameMalay}</div>
                      <div className="text-[10px] text-slate-400">{ing.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10">
                    {ing.defaultUnit}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsChangingItem(false)}
              className="text-xs text-slate-400 hover:text-white py-1 text-center"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Quantity and Malaysian Unit Selectors */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Quantity Selector */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Quantity</label>
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden p-1">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Localized Malaysian Unit Selector */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Unit (Ukuran)</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-11 bg-slate-950 border border-slate-700 rounded-xl px-3 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} className="bg-slate-900 text-white font-normal">
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Confirm & Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Save to My Digital Pantry</span>
        </button>
      </div>
    </div>
  );
}
