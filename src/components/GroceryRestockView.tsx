"use client";

import React, { useRef, useState } from "react";
import {
  addCustomGroceryItem,
  clearAllGroceryItems,
  clearCheckedGroceryItems,
  formatGroceryQty,
  getGroceryStepSize,
  GROCERY_UNITS,
  GroceryItem,
  removeGroceryItem,
  restockGroceryItemToPantry,
  toggleGroceryItem,
  updateGroceryItem,
} from "@/utils/groceryStorage";

interface GroceryRestockViewProps {
  groceryItems: GroceryItem[];
  setGroceryItems: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  onPantryRefresh: () => void;
  onGoToPantry: () => void;
  onStartMealLookup: () => void;
  showToast: (msg: string) => void;
}

export default function GroceryRestockView({
  groceryItems,
  setGroceryItems,
  onPantryRefresh,
  onGoToPantry,
  onStartMealLookup,
  showToast,
}: GroceryRestockViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  const orderedItems = [
    ...groceryItems.filter((i) => !i.checked),
    ...groceryItems.filter((i) => i.checked),
  ];

  const pendingCount = groceryItems.filter((i) => !i.checked).length;
  const checkedCount = groceryItems.filter((i) => i.checked).length;

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
      {/* Header with Top Edit & Delete Controls Side-by-Side */}
      <header className="h-16 px-3 flex items-center justify-between neo-bar-top backdrop-blur-md rounded-t-[32px] z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-[#004730] shrink-0">
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground tracking-tight">Smart Grocery</span>
              <span className="px-1.5 py-0.5 rounded-full neo-sunken text-[9px] font-extrabold text-[#004730]">
                {pendingCount} To Buy
              </span>
            </div>
            <span className="text-[9.5px] text-muted font-semibold truncate">
              Recipe Quantities &bull; Custom Restock
            </span>
          </div>
        </div>

        {/* Top Header Edit + Delete Mode Toggles */}
        {groceryItems.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleHeaderMode("edit")}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                headerMode === "edit"
                  ? "bg-[#004730] text-white shadow-sm"
                  : "neo-raised-sm text-[#004730] hover:scale-105 active:scale-95"
              }`}
              title={headerMode === "edit" ? "Done Editing" : "Edit Items"}
              aria-label={headerMode === "edit" ? "Done Editing" : "Edit Items"}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {headerMode === "edit" ? "check" : "edit"}
              </span>
            </button>

            <button
              onClick={() => toggleHeaderMode("delete")}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                headerMode === "delete"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "neo-raised-sm text-muted hover:text-rose-600 active:scale-95"
              }`}
              title={headerMode === "delete" ? "Done Deleting" : "Manage / Delete Items"}
              aria-label={headerMode === "delete" ? "Done Deleting" : "Manage / Delete Items"}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
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
        {/* Clean Quick Navigation Card: Just Recipes and Pantry */}
        <section className="w-full neo-raised rounded-2xl p-2.5 flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onStartMealLookup}
              className="py-2 px-3 rounded-xl neo-button text-[#004730] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="Browse recipes for ingredients"
              type="button"
            >
              <span className="material-symbols-outlined text-base">manage_search</span>
              <span>Recipes</span>
            </button>

            <button
              onClick={onGoToPantry}
              className="py-2 px-3 rounded-xl neo-button text-[#004730] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="Go to Digital Pantry"
              type="button"
            >
              <span className="material-symbols-outlined text-base">kitchen</span>
              <span>Pantry</span>
            </button>
          </div>

          {/* Contextual Edit Mode Bar */}
          {headerMode === "edit" && groceryItems.length > 0 && (
            <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2 animate-pop-up px-1">
              <span className="text-[10px] font-bold text-[#004730]">
                Tap Edit on any item to customize name or amount
              </span>
              <button
                onClick={() => toggleHeaderMode("edit")}
                className="text-[10px] font-extrabold text-[#004730] underline cursor-pointer shrink-0"
                type="button"
              >
                Done
              </button>
            </div>
          )}

          {/* Contextual Delete Mode Bar */}
          {headerMode === "delete" && groceryItems.length > 0 && (
            <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2 animate-pop-up px-1">
              <span className="text-[10px] font-bold text-rose-700">
                Tap &times; on items to remove
              </span>
              <div className="flex items-center gap-1.5">
                {checkedCount > 0 && (
                  <button
                    onClick={() => {
                      setGroceryItems(clearCheckedGroceryItems());
                      showToast("Removed checked items.");
                    }}
                    className="px-2.5 py-1 rounded-lg neo-raised-sm text-[9.5px] font-extrabold text-foreground cursor-pointer"
                    type="button"
                  >
                    Clear Done ({checkedCount})
                  </button>
                )}
                <button
                  onClick={() => {
                    setGroceryItems(clearAllGroceryItems());
                    setHeaderMode("none");
                    showToast("Grocery list cleared.");
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
          <div className="flex flex-col gap-2.5 pb-16">
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
                          setGroceryItems(removeGroceryItem(item.id));
                          setEditingId(null);
                          showToast(`Removed '${item.name}'.`);
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

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-3 flex flex-col gap-2 transition-all ${
                    item.checked ? "neo-sunken opacity-75" : "neo-raised"
                  }`}
                >
                  {/* Top Row: Clean Checkbox, Name + Source, and Action Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => {
                        if (headerMode === "edit") {
                          handleStartEdit(item);
                        } else {
                          setGroceryItems(toggleGroceryItem(item.id));
                        }
                      }}
                      className="flex items-start gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                      type="button"
                    >
                      <span
                        className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                          item.checked ? "text-[#006948]" : "text-slate-400"
                        }`}
                      >
                        {item.checked ? "check_box" : "check_box_outline_blank"}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-[12.5px] font-extrabold leading-snug ${
                            item.checked ? "line-through text-muted" : "text-foreground"
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="text-[10px] text-muted truncate mt-0.5">
                          {item.recipeName}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {headerMode === "delete" ? (
                        <button
                          onClick={() => {
                            setGroceryItems(removeGroceryItem(item.id));
                            showToast(`Removed '${item.name}'.`);
                          }}
                          className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center active:scale-95 cursor-pointer shadow-xs"
                          title={`Remove ${item.name}`}
                          aria-label={`Remove ${item.name}`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      ) : headerMode === "edit" ? (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 rounded-xl neo-button text-[#004730] text-[9.5px] font-extrabold inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                          title={`Edit ${item.name}`}
                          aria-label={`Edit ${item.name}`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                          <span>Edit</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const updated = restockGroceryItemToPantry(item);
                            setGroceryItems(updated);
                            onPantryRefresh();
                            showToast(
                              `Restocked ${formatGroceryQty(item.quantity)} ${item.unit} ${item.name} to Pantry!`
                            );
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#004730] text-white text-[9.5px] font-extrabold active:scale-95 transition-all cursor-pointer"
                          title="Move to Digital Pantry"
                          type="button"
                        >
                          + Pantry
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Interactive Quantity -/+ Stepper & Specific Recipe Amount */}
                  <div className="flex items-center justify-between gap-2 pl-7">
                    <div className="inline-flex items-center gap-1 p-0.5 rounded-xl neo-sunken">
                      <button
                        onClick={() => handleAdjustQuantity(item, -1)}
                        className="w-6 h-6 rounded-lg neo-raised-sm flex items-center justify-center text-[#004730] font-extrabold active:scale-90 cursor-pointer"
                        aria-label={`Decrease quantity for ${item.name}`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>

                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-2 min-w-[56px] text-center text-[10.5px] font-extrabold text-[#004730] cursor-pointer"
                        title="Tap to edit item & amount"
                        type="button"
                      >
                        {formatGroceryQty(item.quantity)} {item.unit}
                      </button>

                      <button
                        onClick={() => handleAdjustQuantity(item, 1)}
                        className="w-6 h-6 rounded-lg neo-raised-sm flex items-center justify-center text-[#004730] font-extrabold active:scale-90 cursor-pointer"
                        aria-label={`Increase quantity for ${item.name}`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>

                    {item.recipeAmountLabel && (
                      <span className="text-[9.5px] font-bold text-[#64748B] truncate">
                        Recipe: {item.recipeAmountLabel}
                      </span>
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
