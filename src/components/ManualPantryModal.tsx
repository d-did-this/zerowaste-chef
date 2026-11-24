"use client";

import React, { useMemo, useState } from "react";
import { LocalIngredient, MALAYSIAN_INGREDIENTS_DB } from "@/utils/malaysianIngredients";
import { PantryItem } from "@/utils/pantryStorage";

export type QuickPickCategory = "all" | "fresh" | "meat" | "fridge" | "pantry";

interface ManualPantryModalProps {
  onClose: () => void;
  onAddItems: (items: Array<Omit<PantryItem, "id" | "dateAdded">>) => void;
  quantifierList: Array<{ unit: string; en: string }>;
}

const CUSTOM_CATEGORIES = [
  { key: "Produce", label: "Produce", emoji: "🥬" },
  { key: "Proteins", label: "Proteins", emoji: "🍗" },
  { key: "Dairy & Eggs", label: "Dairy & Eggs", emoji: "🥚" },
  { key: "Herbs", label: "Herbs", emoji: "🌿" },
  { key: "Seasoning", label: "Seasoning", emoji: "🧂" },
  { key: "Staples", label: "Staples", emoji: "🍚" },
] as const;

const EMOJI_PRESETS = ["🥬", "🥚", "🍗", "🧅", "🧄", "🍅", "🧀", "🥛", "🌶️", "🧂", "🍞", "🍚"];

// Extra everyday essentials alongside Malaysian DB staples for the Quick Select grid
const QUICK_ESSENTIALS: LocalIngredient[] = [
  { id: "q_milk", name: "Milk", nameMalay: "Susu Segar", emoji: "🥛", category: "Pantry & Seasonings", defaultUnit: "kotak", keywords: ["milk", "dairy", "fridge"] },
  { id: "q_bread", name: "Bread", nameMalay: "Roti", emoji: "🍞", category: "Pantry & Seasonings", defaultUnit: "bungkus", keywords: ["bread", "bakery"] },
  { id: "q_cheese", name: "Cheddar Cheese", nameMalay: "Keju", emoji: "🧀", category: "Pantry & Seasonings", defaultUnit: "pcs", keywords: ["cheese", "cheddar", "dairy"] },
  { id: "q_butter", name: "Butter", nameMalay: "Mentega", emoji: "🧈", category: "Pantry & Seasonings", defaultUnit: "pcs", keywords: ["butter", "dairy"] },
  { id: "q_yogurt", name: "Plain Yogurt", nameMalay: "Yogurt", emoji: "🥣", category: "Pantry & Seasonings", defaultUnit: "pcs", keywords: ["yogurt", "dairy"] },
  { id: "q_rice", name: "Rice", nameMalay: "Beras", emoji: "🍚", category: "Pantry & Seasonings", defaultUnit: "kg", keywords: ["rice", "beras", "grain"] },
  { id: "q_noodles", name: "Yellow Noodles", nameMalay: "Mee Kuning", emoji: "🍜", category: "Pantry & Seasonings", defaultUnit: "bungkus", keywords: ["noodle", "pasta", "mee"] },
  { id: "q_apples", name: "Apples", nameMalay: "Epal", emoji: "🍎", category: "Citrus & Fruits", defaultUnit: "biji", keywords: ["apple", "fruit"] },
  { id: "q_bananas", name: "Bananas", nameMalay: "Pisang", emoji: "🍌", category: "Citrus & Fruits", defaultUnit: "sikat", keywords: ["banana", "pisang", "fruit"] },
];

function mapQuickFilter(item: LocalIngredient): QuickPickCategory {
  const n = `${item.name} ${item.keywords.join(" ")}`.toLowerCase();
  if (/milk|cheese|butter|yogurt|egg|telur|tofu|tempeh/.test(n)) return "fridge";
  if (item.category === "Proteins & Seafood") return "meat";
  if (item.category === "Pantry & Seasonings") return "pantry";
  return "fresh";
}

function mapStorageCategory(item: LocalIngredient): string {
  const n = item.name.toLowerCase();
  if (/egg|telur|milk|cheese|butter|yogurt/.test(n)) return "Dairy & Eggs";
  if (item.category === "Proteins & Seafood") return "Proteins";
  if (item.category === "Herbs & Leaves") return "Herbs";
  if (item.category === "Pantry & Seasonings") return "Seasoning";
  if (item.category === "Aromatics & Spices") return "Aromatics & Spices";
  return "Produce";
}

export default function ManualPantryModal({
  onClose,
  onAddItems,
  quantifierList,
}: ManualPantryModalProps) {
  const [mode, setMode] = useState<"quick" | "custom">("quick");
  const [hasSwitchedMode, setHasSwitchedMode] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Mode A: Quick Select Grid
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat, setFilterCat] = useState<QuickPickCategory>("all");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Mode B: Custom Typed Entry
  const [customName, setCustomName] = useState("");
  const [customMalay, setCustomMalay] = useState("");
  const [customCat, setCustomCat] = useState<string>("Produce");
  const [customEmoji, setCustomEmoji] = useState<string>("🥬");
  const [customQty, setCustomQty] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<string>("biji");
  const [customNote, setCustomNote] = useState<string>("");

  const requestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const catalogItems = useMemo(() => {
    const merged: LocalIngredient[] = [...QUICK_ESSENTIALS];
    for (const dbItem of MALAYSIAN_INGREDIENTS_DB) {
      if (!merged.some((m) => m.name.toLowerCase() === dbItem.name.toLowerCase())) {
        merged.push(dbItem);
      }
    }
    return merged;
  }, []);

  const filteredQuickItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogItems.filter((item) => {
      if (filterCat !== "all" && mapQuickFilter(item) !== filterCat) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.nameMalay.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [catalogItems, searchQuery, filterCat]);

  const selectedItems = useMemo(
    () => catalogItems.filter((item) => Boolean(selectedIds[item.id])),
    [catalogItems, selectedIds]
  );

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmQuickAdd = () => {
    if (selectedItems.length === 0) return;
    const payload: Array<Omit<PantryItem, "id" | "dateAdded">> = selectedItems.map((item) => ({
      name: item.name,
      nameMalay: item.nameMalay,
      emoji: item.emoji,
      category: mapStorageCategory(item),
      quantity: 1,
      unit: item.defaultUnit,
      confidence: 100,
      engineUsed: "Quick Pantry Picker",
      culinaryNote: `Added manually (${item.nameMalay})`,
    }));
    onAddItems(payload);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddItems([
      {
        name: customName.trim(),
        nameMalay: customMalay.trim() || customName.trim(),
        emoji: customEmoji,
        category: customCat,
        quantity: Math.max(1, customQty),
        unit: customUnit,
        confidence: 100,
        engineUsed: "Manual Entry",
        culinaryNote: customNote.trim() || `Added manually to Digital Pantry.`,
      },
    ]);
  };

  return (
    <div
      className={`absolute inset-0 z-[35] bg-black/45 backdrop-blur-xs flex flex-col justify-end pb-[74px] overflow-hidden ${
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full h-[94%] bg-[var(--zw-bg)] rounded-t-[34px] neo-raised flex flex-col overflow-hidden shadow-2xl ${
          isClosing ? "animate-modal-sheet-slide-out" : "animate-modal-sheet-bounce-in"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Manual Add to Pantry"
      >
        {/* Top Bar */}
        <header className="px-4 pt-3 pb-2.5 shrink-0">
          <div className="w-10 h-1 neo-sunken rounded-full mx-auto mb-2.5" />

          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-extrabold text-foreground tracking-tight leading-tight">
                What do you already have?
              </h2>
              <p className="text-[10px] font-semibold text-[#006948]">
                Tap items from the grid or type your own
              </p>
            </div>

            <button
              onClick={requestClose}
              className="w-8 h-8 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-all cursor-pointer shrink-0"
              type="button"
              aria-label="Close Manual Entry"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* 2-Way Segmented Mode Switcher */}
          <div className="mt-2.5 p-1 rounded-2xl neo-sunken relative grid grid-cols-2 gap-1">
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-6px)] rounded-xl bg-[#004730] shadow-sm pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.25,0.64,1)]"
              style={{
                transform: mode === "custom" ? "translateX(calc(100% + 4px))" : "translateX(0)",
              }}
            />
            <button
              onClick={() => {
                setHasSwitchedMode(true);
                setMode("quick");
              }}
              className={`relative z-10 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                mode === "quick" ? "text-white" : "text-[#64748B] hover:text-[#004730]"
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>Quick Select</span>
            </button>
            <button
              onClick={() => {
                setHasSwitchedMode(true);
                setMode("custom");
              }}
              className={`relative z-10 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                mode === "custom" ? "text-white" : "text-[#64748B] hover:text-[#004730]"
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">keyboard</span>
              <span>Type Custom</span>
            </button>
          </div>
        </header>

        {/* Body */}
        {mode === "quick" ? (
          <div
            key="manual-quick"
            className={`flex-1 flex flex-col overflow-hidden px-4 ${
              hasSwitchedMode ? "animate-slide-in-left" : ""
            }`}
          >
            {/* Search & Filter Row */}
            <div className="flex flex-col gap-2 pb-2.5 shrink-0">
              <div className="w-full neo-sunken rounded-2xl px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-muted">search</span>
                <input
                  type="text"
                  placeholder="Search foods (e.g. eggs, bawang, chicken)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none w-full text-xs font-semibold text-foreground placeholder:text-muted/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-5 h-5 rounded-full neo-raised-sm flex items-center justify-center text-muted cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "fresh", label: "Fresh" },
                    { key: "meat", label: "Meat" },
                    { key: "fridge", label: "Fridge" },
                    { key: "pantry", label: "Pantry" },
                  ] as const
                ).map((pill) => {
                  const active = filterCat === pill.key;
                  return (
                    <button
                      key={pill.key}
                      onClick={() => setFilterCat(pill.key)}
                      className={`px-3 py-1 rounded-full text-[10.5px] font-extrabold transition-all cursor-pointer shrink-0 ${
                        active
                          ? "bg-[#004730] text-white shadow-xs"
                          : "neo-raised-sm text-[#475569] hover:text-[#004730]"
                      }`}
                      type="button"
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-Column Quick Pick Grid matching screenshot */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-3">
              {filteredQuickItems.length === 0 ? (
                <div className="rounded-2xl p-5 neo-sunken text-center flex flex-col items-center gap-2 mt-2">
                  <p className="text-xs font-bold text-foreground">No matching items found</p>
                  <button
                    onClick={() => {
                      setCustomName(searchQuery.trim());
                      setHasSwitchedMode(true);
                      setMode("custom");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#004730] text-white text-[11px] font-extrabold cursor-pointer active:scale-95"
                    type="button"
                  >
                    Type &ldquo;{searchQuery.trim() || "Custom"}&rdquo; Instead
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 p-0.5">
                  {filteredQuickItems.slice(0, 84).map((item) => {
                    const isSelected = Boolean(selectedIds[item.id]);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`relative rounded-2xl p-2 flex flex-col items-center justify-between gap-1.5 min-h-[82px] transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? "neo-raised ring-2 ring-[#006948] bg-emerald-500/5"
                            : "neo-raised-sm hover:translate-y-[-1px]"
                        }`}
                        type="button"
                        aria-pressed={isSelected}
                      >
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#006948] text-white flex items-center justify-center shadow-xs animate-chip-pop">
                            <span
                              className="material-symbols-outlined font-black"
                              style={{ fontSize: "11px", lineHeight: 1 }}
                            >
                              check
                            </span>
                          </span>
                        )}
                        <div className="w-10 h-10 rounded-xl neo-sunken flex items-center justify-center text-2xl shrink-0">
                          {item.emoji}
                        </div>
                        <span className="text-[10px] font-bold text-foreground leading-[1.15] text-center line-clamp-2">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Add CTA */}
            <footer className="py-3 border-t border-black/5 shrink-0">
              <button
                onClick={handleConfirmQuickAdd}
                disabled={selectedItems.length === 0}
                className="w-full h-11 rounded-2xl bg-[#004730] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                type="button"
              >
                <span className="material-symbols-outlined text-base">inventory_2</span>
                <span>
                  {selectedItems.length > 0
                    ? `Add ${selectedItems.length} Selected to Pantry`
                    : "Tap items above to select"}
                </span>
              </button>
            </footer>
          </div>
        ) : (
          /* Mode B: Type Custom Form */
          <form
            key="manual-custom"
            onSubmit={handleSubmitCustom}
            className={`flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar px-4 pb-3 gap-3 ${
              hasSwitchedMode ? "animate-slide-in-right" : ""
            }`}
          >
            <div className="flex flex-col gap-3 pt-1">
              {/* Ingredient Name & Local Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted px-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coconut Milk, Tempeh, Beef..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full neo-sunken rounded-2xl px-3.5 py-2.5 text-xs font-bold text-foreground placeholder:text-muted/60 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted px-1">
                  Local / Malay Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Santan Kelapa..."
                  value={customMalay}
                  onChange={(e) => setCustomMalay(e.target.value)}
                  className="w-full neo-sunken rounded-2xl px-3.5 py-2 text-xs font-semibold text-foreground placeholder:text-muted/60 outline-none"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted px-1">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_CATEGORIES.map((c) => {
                    const active = customCat === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => {
                          setCustomCat(c.key);
                          setCustomEmoji(c.emoji);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer ${
                          active
                            ? "bg-[#004730] text-white shadow-xs"
                            : "neo-raised-sm text-foreground"
                        }`}
                        type="button"
                      >
                        <span>{c.emoji}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emoji Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {EMOJI_PRESETS.map((em) => (
                  <button
                    key={em}
                    onClick={() => setCustomEmoji(em)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 cursor-pointer transition-all ${
                      customEmoji === em ? "neo-sunken ring-2 ring-[#006948]" : "neo-raised-sm"
                    }`}
                    type="button"
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="neo-sunken rounded-2xl p-1.5 flex items-center justify-between">
                  <button
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl neo-raised-sm text-rose-600 font-black flex items-center justify-center cursor-pointer active:scale-90"
                    type="button"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-[#004730]">{customQty}</span>
                  <button
                    onClick={() => setCustomQty((q) => q + 1)}
                    className="w-8 h-8 rounded-xl neo-raised-sm text-[#004730] font-black flex items-center justify-center cursor-pointer active:scale-90"
                    type="button"
                  >
                    +
                  </button>
                </div>

                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="neo-sunken rounded-2xl px-3 py-2 text-xs font-extrabold text-[#004730] outline-none cursor-pointer"
                >
                  {quantifierList.map((u) => (
                    <option key={u.unit} value={u.unit}>
                      {u.unit} ({u.en})
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Note */}
              <input
                type="text"
                placeholder="Notes (optional, e.g. Fridge top shelf)..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full neo-sunken rounded-2xl px-3.5 py-2 text-xs font-semibold text-foreground placeholder:text-muted/60 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!customName.trim()}
              className="w-full h-11 rounded-2xl bg-[#004730] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-45 shrink-0"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Add Custom Item to Pantry</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
