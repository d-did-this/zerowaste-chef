"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  addCustomGroceryItem,
  clearAllGroceryItems,
  clearCheckedGroceryItems,
  formatGroceryQty,
  getGroceryStepSize,
  GROCERY_UNITS,
  GroceryItem,
  removeGroceryItem,
  restockCheckedGroceryItemsToPantry,
  restoreGroceryListSnapshot,
  toggleGroceryItem,
  updateGroceryItem,
} from "@/utils/groceryStorage";
import { launchToNavTab } from "@/utils/flyToNavAnimation";
import { inferGroceryCategoryVisual } from "@/utils/foodSemantics";
import { getThemePalette, ThemeId } from "@/utils/themeStorage";

function splitNeedSquare(item: GroceryItem): { num: string; unit: string } {
  const raw = (item.recipeAmountLabel || "").replace(/\([^)]*\)/g, "").trim();
  if (!raw) {
    if (item.recipeAmountLabel && /need|taste|little/i.test(item.recipeAmountLabel)) {
      return { num: "As", unit: "Needed" };
    }
    return { num: formatGroceryQty(item.quantity), unit: item.unit || "pcs" };
  }
  const m = raw.match(/^([\d./~-]+)\s+(.+)$/);
  if (m) {
    return { num: m[1], unit: m[2].slice(0, 7) };
  }
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    return { num: parts[0], unit: parts.slice(1).join(" ").slice(0, 7) };
  }
  return { num: raw.slice(0, 5), unit: "item" };
}

interface GroceryRestockViewProps {
  groceryItems: GroceryItem[];
  setGroceryItems: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  onPantryRefresh: () => void;
  onGoToPantry: () => void;
  onStartMealLookup: () => void;
  showToast: (msg: string, action?: { label: string; onClick: () => void }) => void;
  themeId?: ThemeId;
}

export default function GroceryRestockView({
  groceryItems,
  setGroceryItems,
  onPantryRefresh,
  onGoToPantry,
  onStartMealLookup,
  showToast,
  themeId = "pandan-hero",
}: GroceryRestockViewProps) {
  const palette = getThemePalette(themeId);
  const isPandanHero = palette.isHeroDark;
  const showFoodAccents = palette.showCategoryLabels;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevRectsRef = useRef<Record<string, DOMRect>>({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const flipCleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [crossingIds, setCrossingIds] = useState<Record<string, boolean>>({});
  const [isDockingToPantry, setIsDockingToPantry] = useState<boolean>(false);
  const [headerMode, setHeaderMode] = useState<"none" | "edit" | "delete">("none");

  // Custom Add Item form state
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newQty, setNewQty] = useState<string>("1");
  const [newUnit, setNewUnit] = useState<string>("pcs");
  const [newNote, setNewNote] = useState<string>("");

  // Inline Edit state for a single row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editQty, setEditQty] = useState<string>("1");
  const [editUnit, setEditUnit] = useState<string>("pcs");
  const [editNote, setEditNote] = useState<string>("");

  const orderedItems = useMemo(
    () => [
      ...groceryItems.filter((i) => !i.checked),
      ...groceryItems.filter((i) => i.checked),
    ],
    [groceryItems]
  );

  const pendingCount = groceryItems.filter((i) => !i.checked).length;
  const checkedCount = groceryItems.filter((i) => i.checked).length;

  useEffect(() => {
    const timers = timeoutsRef.current;
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t));
      if (flipCleanupRef.current) clearTimeout(flipCleanupRef.current);
    };
  }, []);

  // FLIP (First-Last-Invert-Play) animation so items glide visibly & slowly to/from bottom on reorder
  useLayoutEffect(() => {
    const prevRects = prevRectsRef.current;
    const keys = Object.keys(prevRects);
    if (keys.length === 0) return;

    const movingEls: HTMLDivElement[] = [];

    for (const item of orderedItems) {
      const el = cardRefs.current[item.id];
      const prev = prevRects[item.id];
      if (!el || !prev) continue;

      const next = el.getBoundingClientRect();
      const deltaY = prev.top - next.top;
      if (Math.abs(deltaY) < 1) continue;

      el.style.transition = "none";
      el.style.transform = `translateY(${deltaY}px)`;
      // Keep downward-sliding crossed items visually above upward-shifting items
      if (deltaY < 0) {
        el.style.zIndex = "20";
        el.style.position = "relative";
        el.style.boxShadow = "0 12px 26px -6px rgba(0, 71, 48, 0.18)";
      }
      movingEls.push(el);
    }

    prevRectsRef.current = {};
    if (movingEls.length === 0) return;

    if (flipCleanupRef.current) {
      clearTimeout(flipCleanupRef.current);
      flipCleanupRef.current = null;
    }

    // Force layout flush so the inverted transform applies before transition starts
    void movingEls[0].getBoundingClientRect();

    requestAnimationFrame(() => {
      for (const el of movingEls) {
        el.style.transition =
          "transform 1050ms cubic-bezier(0.42, 0, 0.2, 1), opacity 550ms ease 250ms, box-shadow 500ms ease";
        el.style.transform = "translateY(0)";
      }
      flipCleanupRef.current = setTimeout(() => {
        for (const el of movingEls) {
          el.style.transition = "";
          el.style.transform = "";
          el.style.zIndex = "";
          el.style.position = "";
          el.style.boxShadow = "";
        }
        flipCleanupRef.current = null;
      }, 1100);
    });
  }, [orderedItems]);

  const snapshotCardPositions = () => {
    const rects: Record<string, DOMRect> = {};
    for (const [id, el] of Object.entries(cardRefs.current)) {
      if (el) rects[id] = el.getBoundingClientRect();
    }
    prevRectsRef.current = rects;
  };

  const handleToggleItemAnimated = (item: GroceryItem) => {
    if (headerMode === "edit") {
      handleStartEdit(item);
      return;
    }

    // If unchecking a crossed item, glide it smoothly back up
    if (item.checked) {
      snapshotCardPositions();
      setGroceryItems(toggleGroceryItem(item.id));
      return;
    }

    // Prevent double-trigger while already playing cross-out sweep
    if (crossingIds[item.id]) return;

    // Stage 1 (0-720ms): Stay bright in place while checkbox pops & emerald cross line sweeps across title
    setCrossingIds((prev) => ({ ...prev, [item.id]: true }));

    // Stage 2 (720ms+): Snapshot positions and slowly glide item down to bottom via FLIP
    timeoutsRef.current[item.id] = setTimeout(() => {
      snapshotCardPositions();
      setGroceryItems(toggleGroceryItem(item.id));
      setCrossingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      delete timeoutsRef.current[item.id];
    }, 720);
  };

  const handleAdjustQuantity = (item: GroceryItem, deltaSign: 1 | -1) => {
    const step = getGroceryStepSize(item.unit, item.quantity);
    const minVal = step >= 50 ? 25 : step < 1 ? 0.25 : 1;
    const nextQty = Math.max(minVal, Math.round((item.quantity + deltaSign * step) * 100) / 100);
    setGroceryItems(updateGroceryItem(item.id, { quantity: nextQty }));
  };

  const handleStartEdit = (item: GroceryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
    setEditNote(item.recipeName);
    setIsAddingCustom(false);
  };

  const handleSaveEdit = (id: string) => {
    const parsedQty = Number(editQty);
    if (!editName.trim()) {
      showToast("Please enter an item name.");
      return;
    }
    const updated = updateGroceryItem(id, {
      name: editName.trim(),
      quantity: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1,
      unit: editUnit,
      recipeName: editNote.trim() || "Personal List",
    });
    setGroceryItems(updated);
    setEditingId(null);
    showToast("Grocery item updated.");
  };

  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast("Please enter what you need to buy.");
      return;
    }
    const parsedQty = Number(newQty);
    const updated = addCustomGroceryItem({
      name: newName.trim(),
      quantity: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1,
      unit: newUnit,
      recipeName: newNote.trim() || "Personal List",
    });
    setGroceryItems(updated);
    setNewName("");
    setNewQty("1");
    setNewUnit("pcs");
    setNewNote("");
    setIsAddingCustom(false);
    showToast("Added to your grocery list!");
  };

  const handleBatchRestockChecked = () => {
    if (isDockingToPantry) return;
    const checkedItems = orderedItems.filter((i) => i.checked);
    if (checkedItems.length === 0) return;

    setIsDockingToPantry(true);

    const flySpecs = checkedItems.map((item) => ({
      label: item.name,
      subtitle: `${formatGroceryQty(item.quantity)} ${item.unit} • To Pantry`,
      sourceRect: cardRefs.current[item.id]?.getBoundingClientRect() ?? null,
      tone: "emerald" as const,
    }));

    launchToNavTab({
      targetTab: "pantry",
      items: flySpecs,
      badgeText: `+${checkedItems.length}`,
      badgeTone: "emerald",
      staggerMs: 185,
      durationMs: 1380,
      onDockImpact: () => {
        snapshotCardPositions();
        const { restockedCount, remainingItems } = restockCheckedGroceryItemsToPantry();
        if (restockedCount > 0) {
          setGroceryItems(remainingItems);
          onPantryRefresh();
          showToast(`Added ${restockedCount} item${restockedCount > 1 ? "s" : ""} to Digital Pantry!`);
        }
      },
      onAllComplete: () => {
        setIsDockingToPantry(false);
      },
    });
  };

  const deleteWithUndo = (toastMsg: string, performDelete: () => GroceryItem[]) => {
    const prevSnapshot = [...groceryItems];
    setGroceryItems(performDelete());
    showToast(toastMsg, {
      label: "Undo",
      onClick: () => {
        setGroceryItems(restoreGroceryListSnapshot(prevSnapshot));
        showToast("Restored item(s) to Grocery List!");
      },
    });
  };

  const toggleHeaderMode = (target: "edit" | "delete") => {
    setIsAddingCustom(false);
    setEditingId(null);
    setHeaderMode((prev) => (prev === target ? "none" : target));
  };

  const openFloatingAdd = () => {
    setHeaderMode("none");
    setEditingId(null);
    setIsAddingCustom((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }, 20);
      }
      return next;
    });
  };

  return (
    <div className="meal-flow-scope flex-1 flex flex-col overflow-hidden relative">
      {/* Uniform Header Bar */}
      <header className="h-16 px-3.5 flex items-center justify-between neo-bar-top backdrop-blur-md rounded-t-[32px] z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-[#004730] shrink-0">
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground tracking-tight truncate">
              Smart Grocery
            </span>
            <span className="text-[9.5px] text-[#006948] font-semibold truncate">
              Cross off items, then add to Pantry
            </span>
          </div>
        </div>

        {/* Top Header Edit + Delete Mode Toggles */}
        {groceryItems.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => toggleHeaderMode("edit")}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                headerMode === "edit"
                  ? "bg-[#004730] text-white shadow-sm"
                  : "neo-raised-sm text-[#004730] hover:scale-105 active:scale-95"
              }`}
              title={headerMode === "edit" ? "Done Editing" : "Edit Items"}
              aria-label={headerMode === "edit" ? "Done Editing" : "Edit Items"}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {headerMode === "edit" ? "check" : "edit"}
              </span>
            </button>

            <button
              onClick={() => toggleHeaderMode("delete")}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                headerMode === "delete"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "neo-raised-sm text-muted hover:text-rose-600 active:scale-95"
              }`}
              title={headerMode === "delete" ? "Done Deleting" : "Manage / Delete Items"}
              aria-label={headerMode === "delete" ? "Done Deleting" : "Manage / Delete Items"}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {headerMode === "delete" ? "check" : "delete_sweep"}
              </span>
            </button>
          </div>
        )}
      </header>

      <div
        ref={scrollContainerRef}
        className="flex-1 p-3.5 flex flex-col gap-3 overflow-y-auto no-scrollbar"
      >
        {/* Top Grocery Hero Card: Digital Pantry-Matched Design with Circular Progress Ring & Bar (Pandan Hero & Minimalist Clay) */}
        <section
          className={`w-full rounded-2xl p-3.5 flex flex-col gap-2.5 shrink-0 transition-all duration-300 ${
            isPandanHero ? "neo-pandan-hero" : "neo-raised"
          }`}
        >
          {(() => {
            const totalCount = groceryItems.length;
            const donePct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
            const radius = 20;
            const viewBoxSize = 52;
            const center = viewBoxSize / 2;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference * (1 - donePct / 100);
            const ringLabel = `${String(checkedCount).padStart(2, "0")}/${String(totalCount).padStart(2, "0")}`;

            return (
              <>
                {/* Top Card Header Row matching Digital Pantry */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isPandanHero
                          ? "neo-pandan-sunken text-amber-300"
                          : "neo-sunken text-[#004730]"
                      }`}
                      style={isPandanHero ? undefined : { color: palette.primaryBg }}
                    >
                      <span className="material-symbols-outlined text-base">shopping_bag</span>
                    </div>
                    <span
                      className={`text-xs tracking-tight ${
                        isPandanHero ? "font-extrabold text-white" : "font-bold text-foreground"
                      }`}
                    >
                      Restock Tracker
                    </span>
                  </div>
                </div>

                {/* Digital Pantry-Style Sunken Block with Circular Progress Ring */}
                <div
                  className={`w-full rounded-xl py-2.5 px-3.5 flex items-center justify-between gap-3 ${
                    isPandanHero ? "neo-pandan-sunken" : "neo-sunken"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isPandanHero ? "text-emerald-100/85" : "text-muted"
                      }`}
                    >
                      TO BUY ITEMS
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span
                        className={`text-xl font-extrabold tracking-tight leading-none ${
                          isPandanHero ? "text-white" : "text-foreground"
                        }`}
                      >
                        {pendingCount}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isPandanHero ? "text-emerald-100/75" : "text-muted"
                        }`}
                      >
                        remaining
                      </span>
                    </div>
                  </div>

                  {/* Unified Circular Progress Ring (01/20 format across all themes) */}
                  <div className="relative flex items-center justify-center shrink-0 w-[52px] h-[52px]">
                    <svg
                      className="w-[52px] h-[52px] -rotate-90"
                      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                      aria-hidden="true"
                    >
                      <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={isPandanHero ? "rgba(255,255,255,0.16)" : "rgba(0,71,48,0.12)"}
                        strokeWidth="4"
                      />
                      <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={palette.primaryRingStroke}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="transition-[stroke-dashoffset] duration-500 ease-out"
                      />
                    </svg>
                    <span
                      className={`absolute font-extrabold leading-none tabular-nums text-[9.5px] ${
                        isPandanHero ? "text-amber-300" : ""
                      }`}
                      style={isPandanHero ? undefined : { color: palette.primaryBg }}
                    >
                      {ringLabel}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onStartMealLookup}
              className={`py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                isPandanHero
                  ? "neo-amber-cta text-[#142419] font-black"
                  : "text-white font-extrabold shadow-sm active:scale-95"
              }`}
              style={isPandanHero ? undefined : { backgroundColor: palette.primaryBg }}
              title="Browse recipes for ingredients"
              type="button"
            >
              <span className="material-symbols-outlined text-base">manage_search</span>
              <span>Recipes</span>
            </button>

            <button
              onClick={onGoToPantry}
              className={`py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                isPandanHero
                  ? "neo-emerald-glass-btn text-white font-black"
                  : "neo-button text-[#004730] font-extrabold active:scale-95"
              }`}
              title="Go to Digital Pantry"
              type="button"
            >
              <span className="material-symbols-outlined text-base">kitchen</span>
              <span>Pantry</span>
            </button>
          </div>

          {/* Contextual Edit Mode Bar */}
          {headerMode === "edit" && groceryItems.length > 0 && (
            <div
              className={`pt-2 border-t flex items-center justify-between gap-2 animate-pop-up px-1 ${
                isPandanHero ? "border-white/15" : "border-black/5"
              }`}
            >
              <span className={`text-[10px] font-bold ${isPandanHero ? "text-amber-200" : "text-[#004730]"}`}>
                Tap Edit on any item to customize name or amount
              </span>
              <button
                onClick={() => toggleHeaderMode("edit")}
                className={`text-[10px] font-extrabold underline cursor-pointer shrink-0 ${
                  isPandanHero ? "text-white" : "text-[#004730]"
                }`}
                type="button"
              >
                Done
              </button>
            </div>
          )}

          {/* Contextual Delete Mode Bar */}
          {headerMode === "delete" && groceryItems.length > 0 && (
            <div
              className={`pt-2 border-t flex items-center justify-between gap-2 animate-pop-up px-1 ${
                isPandanHero ? "border-white/15" : "border-black/5"
              }`}
            >
              <span className={`text-[10px] font-bold ${isPandanHero ? "text-rose-200" : "text-rose-700"}`}>
                Tap &times; on items to remove
              </span>
              <div className="flex items-center gap-1.5">
                {checkedCount > 0 && (
                  <button
                    onClick={() =>
                      deleteWithUndo("Removed checked items", clearCheckedGroceryItems)
                    }
                    className={`px-2.5 py-1 rounded-lg text-[9.5px] font-extrabold cursor-pointer ${
                      isPandanHero
                        ? "neo-emerald-glass-btn text-white"
                        : "neo-raised-sm text-foreground"
                    }`}
                    type="button"
                  >
                    Clear Done ({checkedCount})
                  </button>
                )}
                <button
                  onClick={() => {
                    setHeaderMode("none");
                    deleteWithUndo("Grocery list cleared", clearAllGroceryItems);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[9.5px] font-extrabold cursor-pointer active:scale-95"
                  type="button"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Option 4 Batch Top Action Card: Appears Only When Items Are Crossed Off */}
        {checkedCount > 0 && headerMode === "none" && (
          <button
            onClick={handleBatchRestockChecked}
            disabled={isDockingToPantry}
            className="w-full rounded-2xl px-3.5 py-2.5 bg-[#004730] text-white flex items-center justify-between gap-2.5 shadow-md active:scale-[0.99] transition-all cursor-pointer animate-pop-up shrink-0 disabled:opacity-90"
            aria-label="Add Crossed to Pantry"
            type="button"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-xs font-black shrink-0">
                {checkedCount}
              </span>
              <div className="text-left min-w-0">
                <div className="text-xs font-extrabold leading-tight">
                  {isDockingToPantry ? "Moving to Pantry..." : "Add Crossed to Pantry"}
                </div>
                <div className="text-[9.5px] text-white/80 leading-tight">
                  {isDockingToPantry
                    ? "Docking ticked items into stock"
                    : `Moves ticked item${checkedCount > 1 ? "s" : ""} to stock`}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-lg shrink-0">
              {isDockingToPantry ? "south" : "arrow_forward"}
            </span>
          </button>
        )}

        {/* Custom Item Creation Card */}
        {isAddingCustom && (
          <form
            onSubmit={handleCreateCustomItem}
            className="w-full neo-raised rounded-2xl p-3.5 flex flex-col gap-2.5 animate-pop-up shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#004730] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>Add Custom Item to Buy</span>
              </span>
              <button
                onClick={() => setIsAddingCustom(false)}
                className="w-6 h-6 rounded-full neo-raised-sm flex items-center justify-center text-muted cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <input
              type="text"
              placeholder="Item name (e.g. Coconut Milk, Garlic)..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full neo-sunken rounded-xl px-3 py-2 text-xs font-bold text-foreground placeholder:text-muted/60 outline-none"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1 neo-sunken rounded-xl px-2 py-1">
                <span className="text-[10px] font-bold text-muted pl-1">Qty</span>
                <input
                  type="number"
                  step="any"
                  min="0.25"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full bg-transparent text-xs font-extrabold text-center text-foreground outline-none py-1"
                />
              </div>

              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="neo-sunken rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-[#004730] outline-none cursor-pointer"
              >
                {GROCERY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Note / Recipe (optional, e.g. Weekly Restock)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full neo-sunken rounded-xl px-3 py-1.5 text-[11px] font-semibold text-foreground placeholder:text-muted/60 outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                onClick={() => setIsAddingCustom(false)}
                className="px-3 py-1.5 rounded-xl neo-button text-[11px] font-bold text-muted cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#004730] text-white text-[11px] font-extrabold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Add to List
              </button>
            </div>
          </form>
        )}

        {/* Grocery List Items */}
        {orderedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pb-16">
            <div className="w-16 h-16 rounded-full neo-sunken flex items-center justify-center mb-3 text-[#004730]">
              <span className="material-symbols-outlined text-3xl">shopping_bag</span>
            </div>
            <h3 className="text-sm font-extrabold text-foreground mb-1">
              Your Grocery List Is Clear
            </h3>
            <p className="text-[11px] text-muted leading-relaxed max-w-xs">
              Tap the floating + button below to add custom groceries, or tap Shop Missing on any recipe to pull exact amounts.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pb-20">
            {orderedItems.map((item) => {
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl p-3 neo-raised flex flex-col gap-2 animate-pop-up"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#004730]">
                        Edit Grocery Item
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          deleteWithUndo(`Removed ${item.name}`, () => removeGroceryItem(item.id));
                        }}
                        className="text-[10px] font-extrabold text-rose-600 inline-flex items-center gap-0.5 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                        <span>Delete</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full neo-sunken rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0.25"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        className="neo-sunken rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-center text-foreground outline-none"
                      />
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="neo-sunken rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-[#004730] outline-none cursor-pointer"
                      >
                        {GROCERY_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="For recipe / note..."
                      className="w-full neo-sunken rounded-xl px-3 py-1.5 text-[11px] font-semibold text-foreground outline-none"
                    />

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-xl neo-button text-[10.5px] font-bold text-muted cursor-pointer"
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#004730] text-white text-[10.5px] font-extrabold active:scale-95 cursor-pointer"
                        type="button"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              const needDisplay = splitNeedSquare(item);
              const isCrossing = Boolean(crossingIds[item.id]);
              const showCrossedVisual = item.checked || isCrossing;
              const aisle = inferGroceryCategoryVisual(item.name);
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    cardRefs.current[item.id] = el;
                  }}
                  className={`rounded-2xl bg-[var(--zw-bg)] px-3.5 py-3 flex items-center justify-between gap-3 transition-[box-shadow,transform,opacity] duration-500 ${
                    item.checked && isDockingToPantry
                      ? "neo-sunken scale-95 opacity-35"
                      : item.checked
                      ? "neo-sunken"
                      : isCrossing
                      ? "neo-raised ring-2 ring-[#006948]/30"
                      : "neo-raised"
                  }`}
                >
                  {/* Left: Circular Check + Title/Recipe + Clean Pill Stepper */}
                  <div
                    className={`flex items-start gap-2.5 flex-1 min-w-0 transition-opacity duration-500 ${
                      item.checked ? "opacity-65" : "opacity-100"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleItemAnimated(item)}
                      className={`w-[22px] h-[22px] rounded-full shrink-0 mt-0.5 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                        showCrossedVisual
                          ? "bg-[#006948] text-white shadow-xs"
                          : "neo-sunken text-transparent hover:ring-1 hover:ring-[#004730]/30"
                      }`}
                      aria-label={item.checked ? `Uncheck ${item.name}` : `Check ${item.name}`}
                      type="button"
                    >
                      <span
                        className={`material-symbols-outlined text-[13px] font-black ${
                          isCrossing ? "animate-check-pop" : ""
                        }`}
                      >
                        check
                      </span>
                    </button>

                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleItemAnimated(item)}
                        className="text-left cursor-pointer min-w-0"
                        type="button"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {showFoodAccents && (
                            <span
                              className="w-[17px] h-[17px] rounded-full inline-flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: aisle.bg,
                                color: aisle.text,
                                borderColor: aisle.border,
                              }}
                              title={aisle.label}
                              aria-label={aisle.label}
                            >
                              <span
                                className="material-symbols-outlined shrink-0"
                                style={{ fontSize: "10px", lineHeight: 1 }}
                              >
                                {aisle.icon}
                              </span>
                            </span>
                          )}
                          <span
                            className={`relative inline-block max-w-full text-[13.5px] font-extrabold leading-tight truncate transition-colors duration-300 ${
                              item.checked ? "text-muted" : "text-foreground"
                            }`}
                          >
                            {item.name}
                            {showCrossedVisual && (
                              <span
                                className={`absolute left-0 top-1/2 w-full rounded-full pointer-events-none origin-left ${
                                  isCrossing
                                    ? "h-[2.5px] bg-[#006948] animate-strike-sweep"
                                    : "h-[2px] -translate-y-1/2 bg-[#475569]"
                                }`}
                              />
                            )}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-[#64748B] truncate mt-0.5">
                          {item.recipeName}
                        </div>
                      </button>

                      {/* Clean White-Pill Stepper */}
                      <div className="inline-flex items-center w-fit rounded-xl bg-white/60 p-0.5 gap-0.5 shadow-inner">
                        <button
                          onClick={() => handleAdjustQuantity(item, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-[#004730] flex items-center justify-center font-extrabold shadow-xs active:scale-90 cursor-pointer"
                          aria-label={`Decrease quantity for ${item.name}`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">remove</span>
                        </button>

                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2 min-w-[54px] text-center text-[11px] font-extrabold text-[#004730] cursor-pointer hover:underline"
                          title="Tap to edit item & amount"
                          type="button"
                        >
                          {formatGroceryQty(item.quantity)} {item.unit}
                        </button>

                        <button
                          onClick={() => handleAdjustQuantity(item, 1)}
                          className="w-6 h-6 rounded-lg bg-white text-[#004730] flex items-center justify-center font-extrabold shadow-xs active:scale-90 cursor-pointer"
                          aria-label={`Increase quantity for ${item.name}`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Orange Need Square (or Edit/Delete button in header modes) */}
                  <div className="shrink-0 flex items-center">
                    {headerMode === "delete" ? (
                      <button
                        onClick={() =>
                          deleteWithUndo(`Removed ${item.name}`, () => removeGroceryItem(item.id))
                        }
                        className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center active:scale-95 cursor-pointer shadow-sm"
                        title={`Remove ${item.name}`}
                        aria-label={`Remove ${item.name}`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[17px]">close</span>
                      </button>
                    ) : headerMode === "edit" ? (
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-2.5 py-1.5 rounded-xl neo-button text-[#004730] text-[10px] font-extrabold inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                        title={`Edit ${item.name}`}
                        aria-label={`Edit ${item.name}`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                        <span>Edit</span>
                      </button>
                    ) : (
                      <div
                        className={`w-[48px] h-[48px] rounded-[13px] text-white flex flex-col items-center justify-center shadow-sm transition-colors duration-500 ${
                          item.checked ? "bg-slate-400" : "bg-[#EA580C]"
                        }`}
                        title={`Recipe requires ${item.recipeAmountLabel || `${item.quantity} ${item.unit}`}`}
                      >
                        <span className="text-[13.5px] font-extrabold leading-none">
                          {needDisplay.num}
                        </span>
                        <span className="text-[7px] font-extrabold uppercase tracking-[0.04em] mt-[2px] leading-none">
                          {needDisplay.unit}
                        </span>
                        <span className="text-[6px] font-bold uppercase tracking-[0.02em] text-white/85 mt-[1.5px] leading-none">
                          Need
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Floating Add Icon Button */}
      <button
        onClick={openFloatingAdd}
        className="absolute bottom-3 right-3.5 w-12 h-12 rounded-full bg-[#004730] text-white flex items-center justify-center z-30 cursor-pointer active:scale-90 hover:scale-105 transition-all border-2 border-white/60"
        style={{
          boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.35), -2px -2px 6px rgba(255, 255, 255, 0.7)",
        }}
        title={isAddingCustom ? "Close Add Form" : "Add Custom Item"}
        aria-label="Add Custom Item"
        type="button"
      >
        <span className="material-symbols-outlined text-2xl">
          {isAddingCustom ? "close" : "add"}
        </span>
      </button>
    </div>
  );
}
