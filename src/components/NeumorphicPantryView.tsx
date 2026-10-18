"use client";

import React, { useState, useEffect } from "react";
import {
  getPantryItems,
  savePantryItem,
  deletePantryItem,
  updatePantryItemQuantity,
  PantryItem,
} from "@/utils/pantryStorage";

interface NeumorphicPantryViewProps {
  onOpenScanner: () => void;
  activeSubTab?: "pantry" | "cook-now" | "grocery";
}

// Initial Malaysian pantry defaults from Stitch design
const DEFAULT_INITIAL_ITEMS: Omit<PantryItem, "id" | "dateAdded">[] = [
  {
    name: "Organic Spinach",
    nameMalay: "Bayam Hijau",
    emoji: "🥬",
    category: "Produce",
    quantity: 1,
    unit: "ikat",
    culinaryNote: "Fresh crisp green leaves from local grocer",
  },
  {
    name: "Farm Fresh Eggs",
    nameMalay: "Telur Ayam Gred A",
    emoji: "🥚",
    category: "Dairy",
    quantity: 6,
    unit: "biji",
    culinaryNote: "Rich in protein, best for sunny side up or fried rice",
  },
  {
    name: "Chicken Breast",
    nameMalay: "Dada Ayam Segar",
    emoji: "🍗",
    category: "Proteins",
    quantity: 2,
    unit: "ketul",
    culinaryNote: "Lean protein, refrigerated",
  },
  {
    name: "Roma Tomatoes",
    nameMalay: "Tomato Roma",
    emoji: "🍅",
    category: "Produce",
    quantity: 4,
    unit: "biji",
    culinaryNote: "Plump ripe red tomatoes",
  },
  {
    name: "Garlic Bulb",
    nameMalay: "Bawang Putih",
    emoji: "🧄",
    category: "Staples",
    quantity: 1,
    unit: "labu",
    culinaryNote: "Aromatic foundation for Malaysian stir-fries",
  },
  {
    name: "Sweet Soy Sauce",
    nameMalay: "Kicap Manis Cap Kipas Udang",
    emoji: "🍶",
    category: "Seasoning",
    quantity: 250,
    unit: "ml",
    culinaryNote: "Habhal's authentic sweet soy sauce",
  },
];

export default function NeumorphicPantryView({
  onOpenScanner,
  activeSubTab = "pantry",
}: NeumorphicPantryViewProps) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Manual Form States
  const [manualName, setManualName] = useState<string>("");
  const [manualQty, setManualQty] = useState<number>(1);
  const [manualUnit, setManualUnit] = useState<string>("biji");
  const [manualCat, setManualCat] = useState<string>("produce");

  // Load items from local storage
  const refreshItems = () => {
    let current = getPantryItems();
    if (current.length === 0) {
      DEFAULT_INITIAL_ITEMS.forEach((item) => savePantryItem(item));
      current = getPantryItems();
    }
    setItems(current);
  };

  useEffect(() => {
    refreshItems();
  }, []);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory === "all") return true;
    const cat = (item.category || "").toLowerCase();
    if (selectedCategory === "produce") return cat.includes("produce") || cat.includes("vegetable") || cat.includes("fruit");
    if (selectedCategory === "proteins") return cat.includes("protein") || cat.includes("meat") || cat.includes("seafood") || cat.includes("chicken");
    if (selectedCategory === "seasoning") return cat.includes("seasoning") || cat.includes("sauce") || cat.includes("condiment");
    if (selectedCategory === "dairy") return cat.includes("dairy") || cat.includes("egg");
    if (selectedCategory === "staples") return cat.includes("staple") || cat.includes("grain") || cat.includes("pantry");
    return true;
  });

  // Handle Steppers
  const handleIncreaseQty = (item: PantryItem) => {
    const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
    const newQty = item.quantity + step;
    updatePantryItemQuantity(item.id, newQty);
    refreshItems();
  };

  const handleDecreaseQty = (item: PantryItem) => {
    const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
    const newQty = item.quantity - step;
    if (newQty <= 0) {
      deletePantryItem(item.id);
    } else {
      updatePantryItemQuantity(item.id, newQty);
    }
    refreshItems();
  };

  const handleDelete = (id: string) => {
    deletePantryItem(id);
    refreshItems();
  };

  // Submit Manual Add
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    savePantryItem({
      name: manualName.trim(),
      nameMalay: manualName.trim(),
      emoji: getCategoryEmoji(manualCat),
      category: manualCat.charAt(0).toUpperCase() + manualCat.slice(1),
      quantity: manualQty,
      unit: manualUnit,
      culinaryNote: "Manually added to pantry",
    });

    setManualName("");
    setManualQty(1);
    setIsManualModalOpen(false);
    refreshItems();
  };

  function getCategoryEmoji(cat: string): string {
    switch (cat.toLowerCase()) {
      case "produce":
        return "🥬";
      case "proteins":
        return "🍗";
      case "seasoning":
        return "🍶";
      case "dairy":
        return "🥚";
      case "staples":
        return "🌾";
      default:
        return "🥗";
    }
  }

  // If activeSubTab is Cook Now
  if (activeSubTab === "cook-now") {
    return (
      <div className="flex flex-col w-full pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Banner */}
        <section className="w-full neo-raised rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full neo-recessed-pill flex items-center justify-center text-[#006948]">
                <span className="material-symbols-outlined text-lg">skillet</span>
              </div>
              <span className="font-bold text-base text-[#161c22]">Smart Recipe Engine</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neo-recessed text-[#006948] text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse"></span>
              Pantry Matched
            </span>
          </div>
          <p className="text-xs text-[#3d4a42]">
            ZeroWaste Chef analyzed your stored ingredients and generated high-affinity Malaysian dishes with 0% food waste.
          </p>
        </section>

        {/* Recipe Cards List */}
        <div className="flex flex-col gap-3">
          {/* Recipe 1 */}
          <article className="w-full neo-raised rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full neo-recessed text-[#006948] font-bold uppercase tracking-wider">
                  100% In Pantry
                </span>
                <h3 className="font-bold text-base text-[#161c22] mt-1">Ayam Masak Kicap Manis</h3>
                <p className="text-xs text-[#3d4a42]">Classic Malaysian braised sweet soy sauce chicken</p>
              </div>
              <span className="text-3xl p-1 rounded-xl neo-sunken">🍗</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#3d4a42] pt-1 border-t border-[#dde3eb]">
              <span className="material-symbols-outlined text-sm text-[#006948]">timer</span>
              <span>25 mins</span>
              <span>&bull;</span>
              <span>Using: Chicken Breast, Kicap Manis, Garlic</span>
            </div>

            <button
              onClick={() => alert("Recipe: Heat oil, sauté crushed garlic, sear chicken cubes, glaze generously with Kicap Manis Cap Kipas Udang, simmer until caramelized. Enjoy with steamed rice!")}
              className="mt-1 w-full py-2.5 rounded-xl neo-raised-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <span className="material-symbols-outlined text-base">soup_kitchen</span>
              <span>Start Cooking</span>
            </button>
          </article>

          {/* Recipe 2 */}
          <article className="w-full neo-raised rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full neo-recessed text-[#006948] font-bold uppercase tracking-wider">
                  100% In Pantry
                </span>
                <h3 className="font-bold text-base text-[#161c22] mt-1">Sayur Bayam Tumis Bawang Putih</h3>
                <p className="text-xs text-[#3d4a42]">Quick garlic wok-tossed green spinach</p>
              </div>
              <span className="text-3xl p-1 rounded-xl neo-sunken">🥬</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#3d4a42] pt-1 border-t border-[#dde3eb]">
              <span className="material-symbols-outlined text-sm text-[#006948]">timer</span>
              <span>10 mins</span>
              <span>&bull;</span>
              <span>Using: Organic Spinach, Garlic, Pinch of Salt</span>
            </div>

            <button
              onClick={() => alert("Recipe: Heat wok on high flame with 1 tbsp cooking oil. Sauté crushed garlic until golden. Toss in fresh spinach leaves for 90 seconds until tender. Serve immediately!")}
              className="mt-1 w-full py-2.5 rounded-xl neo-raised-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <span className="material-symbols-outlined text-base">soup_kitchen</span>
              <span>Start Cooking</span>
            </button>
          </article>

          {/* Recipe 3 */}
          <article className="w-full neo-raised rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full neo-recessed text-[#825100] font-bold uppercase tracking-wider">
                  Quick Breakfast
                </span>
                <h3 className="font-bold text-base text-[#161c22] mt-1">Telur Mata Goyang Kicap Cili</h3>
                <p className="text-xs text-[#3d4a42]">Sunny-side up eggs with aromatic sweet soy drizzle</p>
              </div>
              <span className="text-3xl p-1 rounded-xl neo-sunken">🍳</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#3d4a42] pt-1 border-t border-[#dde3eb]">
              <span className="material-symbols-outlined text-sm text-[#006948]">timer</span>
              <span>5 mins</span>
              <span>&bull;</span>
              <span>Using: Eggs, Sweet Soy Sauce</span>
            </div>

            <button
              onClick={() => alert("Recipe: Fry fresh eggs with crispy edges and runny yolk. Plate and drizzle 1 tbsp of Kicap Manis over the yolks. Perfect comfort food!")}
              className="mt-1 w-full py-2.5 rounded-xl neo-raised-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <span className="material-symbols-outlined text-base">soup_kitchen</span>
              <span>Start Cooking</span>
            </button>
          </article>
        </div>
      </div>
    );
  }

  // If activeSubTab is Grocery
  if (activeSubTab === "grocery") {
    return (
      <div className="flex flex-col w-full pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
        <section className="w-full neo-raised rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full neo-recessed-pill flex items-center justify-center text-[#006948]">
                <span className="material-symbols-outlined text-lg">shopping_basket</span>
              </div>
              <span className="font-bold text-base text-[#161c22]">Smart Restock Planner</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neo-recessed text-[#006948] text-[10px] font-bold">
              3 Low Items
            </span>
          </div>
          <p className="text-xs text-[#3d4a42]">
            Keep your zero-waste kitchen stocked with essential Malaysian culinary aromatics and staples.
          </p>
        </section>

        <div className="flex flex-col gap-2.5">
          {[
            { name: "Serai (Lemongrass)", reason: "Essential for Tom Yam & Rendang", qty: "3 stalks" },
            { name: "Cili Padi (Bird's Eye Chili)", reason: "Low stock in fridge", qty: "100g" },
            { name: "Bawang Merah (Shallots)", reason: "Daily Malaysian aroma base", qty: "500g" },
            { name: "Santan Kelapa (Coconut Milk)", reason: "Curry & Laksa staple", qty: "1 box (200ml)" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="w-full neo-raised rounded-2xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-[#006948] accent-[#006948] cursor-pointer"
                />
                <div>
                  <h4 className="text-xs font-bold text-[#161c22]">{item.name}</h4>
                  <p className="text-[10px] text-[#3d4a42]">{item.reason}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full neo-sunken text-[#006948]">
                {item.qty}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Smart Pantry Tab
  return (
    <div className="flex flex-col w-full pb-28 font-['Plus_Jakarta_Sans',sans-serif] text-[#161c22]">
      {/* 1. Top Stats Live Banner */}
      <section className="w-full neo-raised rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full neo-recessed-pill flex items-center justify-center text-[#006948]">
              <span className="material-symbols-outlined text-lg">eco</span>
            </div>
            <span className="text-base font-bold text-[#161c22] tracking-tight">Pantry Vitality</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neo-recessed text-[#006948] text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse"></span>
            Live Storage
          </span>
        </div>

        {/* 2 Neomorphic Stat Wells */}
        <div className="grid gap-3 grid-cols-2">
          <div className="neo-recessed rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-[#161c22] tracking-tight">{items.length}</span>
            <span className="text-[11px] text-[#576574] font-medium leading-tight mt-0.5">Stored Items</span>
          </div>
          <div className="neo-recessed rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-[#006948] tracking-tight">
              {Math.max(3, Math.floor(items.length * 0.7))}
            </span>
            <span className="text-[11px] text-[#006948] font-semibold leading-tight mt-0.5">Ready Meals</span>
          </div>
        </div>
      </section>

      {/* 2. Filter Chips Horizontal Scroll */}
      <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-2 py-1 mb-4">
        {[
          { id: "all", label: `All (${items.length})` },
          { id: "produce", label: "Produce" },
          { id: "proteins", label: "Proteins" },
          { id: "seasoning", label: "Seasoning" },
          { id: "dairy", label: "Dairy & Eggs" },
          { id: "staples", label: "Staples" },
        ].map((chip) => {
          const isActive = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              className={`flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                isActive
                  ? "neo-recessed-active text-[#006948]"
                  : "neo-raised-button text-[#576574] hover:text-[#161c22]"
              }`}
              type="button"
            >
              {isActive && <span className="material-symbols-outlined text-sm">check</span>}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Smart Pantry Items List */}
      <div className="flex flex-col gap-3 w-full">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 neo-recessed rounded-2xl">
            <div className="w-14 h-14 rounded-full neo-raised flex items-center justify-center text-[#006948] mb-2">
              <span className="material-symbols-outlined text-3xl">shopping_basket</span>
            </div>
            <h4 className="text-sm font-bold text-[#161c22]">No items in this category</h4>
            <p className="text-xs text-[#576574] mt-1 max-w-xs">
              Tap the camera button to scan fresh produce or seasonings.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="w-full neo-raised rounded-2xl p-3.5 flex flex-col gap-2 transition-all relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl neo-recessed flex items-center justify-center text-2xl flex-shrink-0">
                  {item.emoji || "🥗"}
                </div>
                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-[#161c22] truncate">
                      {item.name}
                    </h3>
                    <button
                      aria-label="Remove item"
                      onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full neo-raised-danger text-[#ba1a1a] hover:text-red-700 active:scale-95 transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">delete_outline</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-[#576574] truncate">
                      {item.category || "Pantry"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Portion Stepper */}
              <div className="flex items-center justify-between pt-1 border-t border-[#dde3eb]">
                <span className="text-xs text-[#576574] font-semibold">Available Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => handleDecreaseQty(item)}
                    className="w-8 h-8 rounded-full neo-raised-button flex items-center justify-center text-[#ba1a1a] active:scale-90 transition-transform"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">remove</span>
                  </button>
                  <div className="neo-recessed-pill rounded-full py-1.5 px-3 min-w-[64px] text-center">
                    <span className="text-xs font-bold text-[#161c22]">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => handleIncreaseQty(item)}
                    className="w-8 h-8 rounded-full neo-raised-primary text-white flex items-center justify-center active:scale-90 transition-transform"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Persistent Floating Kitchen Controls Dock */}
      <div className="fixed bottom-24 right-4 z-40 flex items-center gap-2.5">
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="h-11 px-3.5 rounded-full neo-raised-button text-[#006948] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
          type="button"
        >
          <span className="material-symbols-outlined text-lg">edit_note</span>
          <span>+ Manual</span>
        </button>

        <button
          onClick={onOpenScanner}
          className="h-11 px-4 rounded-full neo-raised-primary text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
          type="button"
        >
          <span className="material-symbols-outlined text-xl">photo_camera</span>
          <span>Scan</span>
        </button>
      </div>

      {/* Manual Entry Bottom Sheet / Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-[#f0f4f9] neo-raised rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 neo-recessed-pill rounded-full mx-auto"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006948] text-2xl">add_circle</span>
                <h2 className="text-base font-bold text-[#161c22]">Add Ingredient Manually</h2>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full neo-raised-button text-[#576574]"
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3.5">
              {/* Item Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-[#576574]">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kicap Pekat, Bell Pepper, Halia"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="h-11 px-3.5 rounded-xl neo-recessed bg-transparent border-0 outline-none text-xs text-[#161c22] placeholder:text-zinc-400"
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-[#576574]">Quantity</label>
                  <div className="h-11 rounded-xl neo-recessed flex items-center justify-between px-2">
                    <button
                      type="button"
                      onClick={() => setManualQty((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg neo-raised-button flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#161c22]">{manualQty}</span>
                    <button
                      type="button"
                      onClick={() => setManualQty((q) => q + 1)}
                      className="w-7 h-7 rounded-lg neo-raised-primary text-white flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-[#576574]">Unit Type</label>
                  <select
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    className="h-11 px-3 rounded-xl neo-recessed bg-transparent border-0 outline-none text-xs font-semibold text-[#161c22]"
                  >
                    <option value="biji">biji (seeds / small fruits / eggs)</option>
                    <option value="buah">buah (large fruits / items)</option>
                    <option value="batang">batang (stalks / roots)</option>
                    <option value="ikat">ikat (bunches / bundles)</option>
                    <option value="ketul">ketul (pieces / blocks / meat)</option>
                    <option value="labu">labu (heads / bulbs)</option>
                    <option value="ulas">ulas (cloves / segments)</option>
                    <option value="botol">botol (bottles)</option>
                    <option value="tin">tin (cans)</option>
                    <option value="bungkus">bungkus (packets / packs)</option>
                    <option value="pcs">pcs (pieces)</option>
                    <option value="g">g (grams)</option>
                    <option value="kg">kg (kilograms)</option>
                    <option value="ml">ml (milliliters)</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-[#576574]">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["produce", "proteins", "seasoning", "dairy", "staples"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setManualCat(c)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                        manualCat === c
                          ? "neo-recessed-active text-[#006948] font-bold"
                          : "neo-raised-button text-[#576574]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full h-11 rounded-full neo-raised-primary text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Save to Pantry</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
