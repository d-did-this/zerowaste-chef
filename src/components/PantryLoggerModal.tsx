"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  X,
  Search,
  Plus,
  Minus,
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

  const [isChangingItem, setIsChangingItem] = useState<boolean>(
    !initialData.confidence || initialData.confidence === 0 || initialData.name === "Select Ingredient"
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-md bg-black border border-zinc-800 rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log to Digital Pantry</h3>
            <p className="text-[11px] text-zinc-500">Record In-Stock Kitchen Produce</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Detected Ingredient Display Card */}
        {!isChangingItem ? (
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
                  {selectedIngredient.emoji}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white">
                      {selectedIngredient.nameMalay}
                    </h2>
                    {initialData.confidence && (
                      <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 font-mono text-[10px] border border-zinc-800">
                        {initialData.confidence}% AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedIngredient.name} • {selectedIngredient.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChangingItem(true)}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Change
              </button>
            </div>

            {initialData.culinaryNote && (
              <div className="flex items-start space-x-2 p-2 rounded-lg bg-zinc-900/60 text-[11px] text-zinc-400 border border-zinc-900">
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-zinc-500" />
                <p className="leading-snug">{initialData.culinaryNote}</p>
              </div>
            )}
          </div>
        ) : (
          /* Search & Select Alternative Ingredient */
          <div className="flex flex-col space-y-2 max-h-56">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Malaysian database..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white font-mono"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto space-y-1 pr-1 divide-y divide-zinc-900">
              {filteredIngredients.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => handleSelectFromDb(ing)}
                  className="w-full p-2 flex items-center justify-between text-left hover:bg-zinc-900 rounded-xl transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{ing.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{ing.nameMalay}</div>
                      <div className="text-[10px] text-zinc-500">{ing.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500">{ing.defaultUnit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity and Local Unit controls */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">Quantity</label>
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 hover:text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider">Unit (Ukuran)</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs font-bold text-white focus:outline-none"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} className="bg-black text-white">
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5"
        >
          <span>Save to Pantry</span>
        </button>
      </div>
    </div>
  );
}
