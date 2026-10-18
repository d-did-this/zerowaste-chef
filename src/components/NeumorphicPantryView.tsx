"use client";

import React, { useState, useEffect } from "react";
import {
  getPantryItems,
  savePantryItem,
  deletePantryItem,
  updatePantryItemQuantity,
  PantryItem,
  LAST_UPDATED_KEY,
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
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("just now");

  const refreshRelativeTime = () => {
    if (typeof window === "undefined") return;
    const tsStr = localStorage.getItem(LAST_UPDATED_KEY);
    if (!tsStr) {
      setLastUpdatedText("just now");
      return;
    }
    const diffMs = Date.now() - parseInt(tsStr, 10);
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) {
      setLastUpdatedText("just now");
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      setLastUpdatedText(`${mins}m ago`);
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      setLastUpdatedText(`${hours}h ago`);
    } else {
      const days = Math.floor(diffSec / 86400);
      setLastUpdatedText(`${days}d ago`);
    }
  };

  // Load items from local storage
  const refreshItems = () => {
    let current = getPantryItems();
    if (current.length === 0) {
      DEFAULT_INITIAL_ITEMS.forEach((item) => savePantryItem(item));
      current = getPantryItems();
    }
    setItems(current);
    refreshRelativeTime();
  };

  useEffect(() => {
    refreshItems();
    refreshRelativeTime();
    const timer = setInterval(refreshRelativeTime, 15000);
    return () => clearInterval(timer);
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



  // If activeSubTab is Cook Now (Coming Soon in v2.1)
  if (activeSubTab === "cook-now") {
    return (
      <div className="flex flex-col w-full pb-28 font-['Plus_Jakarta_Sans',sans-serif] text-[#161c22]">
        <div className="w-full bg-[#f0f4f9] rounded-3xl p-6 flex flex-col items-center text-center shadow-[6px_6px_18px_rgba(115,138,168,0.55),-5px_-5px_14px_rgba(255,255,255,0.98)] border border-[#004d34]/20 my-auto">
          {/* Skeuomorphic Embossed Pan Dial */}
          <div className="w-20 h-20 rounded-full skeuo-shutter-ring flex items-center justify-center mb-4 text-[#006948]">
            <span className="material-symbols-outlined text-4xl">skillet</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/60 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Coming Soon
          </div>

          <h2 className="text-lg font-extrabold text-[#161c22] tracking-tight mb-1">
            Smart Recipe Engine
          </h2>
          <span className="text-xs text-[#006948] font-bold uppercase tracking-wider mb-3">
            v2.1 Feature
          </span>

          <p className="text-xs text-[#576574] leading-relaxed max-w-xs mb-6">
            ZeroWaste Chef is training high-affinity Malaysian culinary models to generate zero-waste recipes directly from your live pantry inventory.
          </p>

          <button
            onClick={onOpenScanner}
            className="w-full max-w-xs py-3.5 px-5 rounded-2xl neo-bulge-primary text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            <span>Scan Ingredients to Pantry</span>
          </button>
        </div>
      </div>
    );
  }

  // If activeSubTab is Grocery (Coming Soon in v2.1)
  if (activeSubTab === "grocery") {
    return (
      <div className="flex flex-col w-full pb-28 font-['Plus_Jakarta_Sans',sans-serif] text-[#161c22]">
        <div className="w-full bg-[#f0f4f9] rounded-3xl p-6 flex flex-col items-center text-center shadow-[6px_6px_18px_rgba(115,138,168,0.55),-5px_-5px_14px_rgba(255,255,255,0.98)] border border-[#004d34]/20 my-auto">
          {/* Skeuomorphic Embossed Basket Dial */}
          <div className="w-20 h-20 rounded-full skeuo-shutter-ring flex items-center justify-center mb-4 text-[#006948]">
            <span className="material-symbols-outlined text-4xl">shopping_basket</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/60 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Coming Soon
          </div>

          <h2 className="text-lg font-extrabold text-[#161c22] tracking-tight mb-1">
            Smart Grocery Restock
          </h2>
          <span className="text-xs text-[#006948] font-bold uppercase tracking-wider mb-3">
            v2.1 Feature
          </span>

          <p className="text-xs text-[#576574] leading-relaxed max-w-xs mb-6">
            Automated threshold restock planner will forecast when your Malaysian aromatics and staples run low and create smart shopping lists.
          </p>

          <button
            onClick={onOpenScanner}
            className="w-full max-w-xs py-3.5 px-5 rounded-2xl neo-bulge-primary text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">kitchen</span>
            <span>Check Digital Pantry</span>
          </button>
        </div>
      </div>
    );
  }

  // Default: Smart Pantry Tab
  return (
    <div className="flex flex-col w-full pb-28 font-['Plus_Jakarta_Sans',sans-serif] text-[#161c22]">
      {/* 1. Top Stats Live Banner (Digital Pantry with Clean Green Card) */}
      <section className="w-full bg-gradient-to-br from-[#006948] via-[#004d34] to-[#003824] rounded-2xl p-4 mb-4 text-white shadow-md border border-[#007f57]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#003824] border border-[#00855d] flex items-center justify-center text-white shadow-inner">
              <span className="material-symbols-outlined text-lg">eco</span>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight block text-white">Digital Pantry</span>
              <span className="text-[10px] text-emerald-100 font-medium leading-none block">Zero-Waste Live Inventory</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#003824]/90 border border-[#00855d] text-emerald-200 text-[10px] font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Updated {lastUpdatedText}
          </span>
        </div>

        {/* 2 Neomorphic Stat Wells with Clean Green Theme */}
        <div className="grid gap-3 grid-cols-2">
          <div className="bg-[#003824]/90 border border-[#005a3c] rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-2xl font-black text-white tracking-tight">{items.length}</span>
            <span className="text-[11px] text-emerald-100 font-medium leading-tight mt-0.5">Stored Items</span>
          </div>
          <div className="bg-[#003824]/90 border border-[#005a3c] rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-2xl font-black text-white tracking-tight">
              {Math.max(3, Math.floor(items.length * 0.7))}
            </span>
            <span className="text-[11px] text-emerald-200 font-semibold leading-tight mt-0.5">Ready Meals</span>
          </div>
        </div>
      </section>

      {/* 2. Filter Chips Wrapped Section with Dark Green Theme */}
      <section className="w-full bg-[#004d34] rounded-2xl p-3 mb-4 shadow-md border border-[#006948]/60 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">tune</span>
            Categories
          </span>
          <span className="text-[10px] text-emerald-100 font-semibold">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="w-full flex flex-wrap gap-2">
          {[
            { id: "all", label: `All (${items.length})`, icon: "inventory_2" },
            { id: "produce", label: "Produce", icon: "nutrition" },
            { id: "proteins", label: "Proteins", icon: "set_meal" },
            { id: "seasoning", label: "Seasoning", icon: "soup_kitchen" },
            { id: "dairy", label: "Dairy & Eggs", icon: "egg_alt" },
            { id: "staples", label: "Staples", icon: "rice_bowl" },
          ].map((chip) => {
            const isActive = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  isActive
                    ? "bg-white text-[#004d34] shadow-sm font-extrabold scale-[1.02]"
                    : "bg-[#006041]/85 hover:bg-[#00704c] text-white border border-[#007b54]"
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </section>

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
              className="w-full bg-[#f0f4f9] rounded-2xl p-3.5 flex flex-col gap-2 transition-all relative overflow-hidden shadow-[5px_5px_15px_rgba(10,30,20,0.18),-4px_-4px_12px_rgba(255,255,255,0.95)] border border-[#004d34]/25 hover:border-[#004d34]/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl neo-recessed flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl select-none"
                    />
                  ) : (
                    <span className="text-2xl select-none">{item.emoji || "🥗"}</span>
                  )}
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

      {/* Floating Circular Camera Scan Button at Right Bottom */}
      <div className="fixed bottom-24 right-5 z-40">
        <button
          onClick={onOpenScanner}
          aria-label="Scan Ingredients"
          className="w-14 h-14 rounded-full neo-bulge-primary text-white flex items-center justify-center active:scale-90 transition-all shadow-[6px_6px_20px_rgba(0,40,25,0.5),-4px_-4px_12px_rgba(255,255,255,0.95)] border-2 border-white/70 hover:scale-105"
          type="button"
          title="Scan Produce with Camera"
        >
          <span className="material-symbols-outlined text-2xl">photo_camera</span>
        </button>
      </div>
    </div>
  );
}
