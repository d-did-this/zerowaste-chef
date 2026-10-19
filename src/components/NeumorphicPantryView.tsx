"use client";

import React, { useState, useEffect } from "react";
import {
  getPantryItems,
  savePantryItem,
  deletePantryItem,
  updatePantryItemQuantity,
  updatePantryItemUnit,
  PantryItem,
  LAST_UPDATED_KEY,
} from "@/utils/pantryStorage";

interface NeumorphicPantryViewProps {
  onOpenScanner: () => void;
  activeSubTab?: "pantry" | "cook-now" | "grocery";
}

const DEFAULT_INITIAL_ITEMS: Omit<PantryItem, "id" | "dateAdded">[] = [
  {
    name: "Sweet Corn",
    nameMalay: "Jagung Manis",
    emoji: "🌽",
    category: "Produce",
    quantity: 2,
    unit: "batang",
    culinaryNote: "Fresh Cameron sweet corn",
    imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Baby Spinach",
    nameMalay: "Bayam Hijau",
    emoji: "🥬",
    category: "Produce",
    quantity: 1,
    unit: "ikat",
    culinaryNote: "Farm fresh crisp green leaves",
    imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Kampung Eggs",
    nameMalay: "Telur Ayam Gred A",
    emoji: "🥚",
    category: "Dairy",
    quantity: 10,
    unit: "biji",
    culinaryNote: "Free-range kampung eggs",
    imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Roma Tomatoes",
    nameMalay: "Tomato Roma",
    emoji: "🍅",
    category: "Produce",
    quantity: 4,
    unit: "biji",
    culinaryNote: "Plump ripe red tomatoes",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Chicken Breast",
    nameMalay: "Dada Ayam Segar",
    emoji: "🍗",
    category: "Proteins",
    quantity: 500,
    unit: "g",
    culinaryNote: "Lean fresh protein",
    imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Kicap Manis",
    nameMalay: "Kicap Manis Cap Kipas Udang",
    emoji: "🍶",
    category: "Seasoning",
    quantity: 1,
    unit: "botol",
    culinaryNote: "Authentic Malaysian sweet soy sauce",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Garlic Cloves",
    nameMalay: "Bawang Putih",
    emoji: "🧄",
    category: "Staples",
    quantity: 1,
    unit: "labu",
    culinaryNote: "Aromatic foundation for Malaysian cooking",
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=300&q=80",
  },
];

const QUANTIFIER_OPTIONS = [
  { unit: "biji", en: "pieces (round)" },
  { unit: "batang", en: "stalks / cobs" },
  { unit: "helai", en: "leaves" },
  { unit: "biji / buah", en: "fruits" },
  { unit: "ekor", en: "whole (fish/meat)" },
  { unit: "ketul", en: "pieces (meat)" },
  { unit: "keping", en: "slices" },
  { unit: "ikat", en: "bunch" },
  { unit: "g", en: "grams" },
  { unit: "kg", en: "kilos" },
  { unit: "botol", en: "bottles" },
  { unit: "cup", en: "cups" },
  { unit: "kotak", en: "boxes" },
  { unit: "paket", en: "packs" },
];

export default function NeumorphicPantryView({
  onOpenScanner,
  activeSubTab = "pantry",
}: NeumorphicPantryViewProps) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("expiry");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("2m ago");

  // Dropdown states
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);

  // Quantifier re-selector state
  const [activeQuantifierItemId, setActiveQuantifierItemId] = useState<string | null>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const refreshRelativeTime = () => {
    if (typeof window === "undefined") return;
    const tsStr = localStorage.getItem(LAST_UPDATED_KEY);
    if (!tsStr) {
      setLastUpdatedText("2m ago");
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

  // Filter & Sort
  const getFilteredAndSortedItems = () => {
    let result = items.filter((item) => {
      if (selectedCategory === "all") return true;
      const cat = (item.category || "").toLowerCase();
      if (selectedCategory === "produce") return cat.includes("produce") || cat.includes("vegetable") || cat.includes("fruit");
      if (selectedCategory === "proteins") return cat.includes("protein") || cat.includes("meat") || cat.includes("seafood") || cat.includes("chicken");
      if (selectedCategory === "seasoning") return cat.includes("seasoning") || cat.includes("sauce") || cat.includes("condiment");
      if (selectedCategory === "dairy") return cat.includes("dairy") || cat.includes("egg");
      if (selectedCategory === "staples") return cat.includes("staple") || cat.includes("grain") || cat.includes("pantry");
      return true;
    });

    result = [...result].sort((a, b) => {
      if (selectedSort === "name") {
        return a.name.localeCompare(b.name);
      } else if (selectedSort === "qty") {
        return b.quantity - a.quantity;
      } else if (selectedSort === "recent") {
        return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
      }
      return 0; // default expiry order
    });

    return result;
  };

  // Stepper Handlers
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
      setItemToDelete(item);
    } else {
      updatePantryItemQuantity(item.id, newQty);
      refreshItems();
    }
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deletePantryItem(itemToDelete.id);
      showToast(`Removed ${itemToDelete.name} from Pantry`);
      setItemToDelete(null);
      refreshItems();
    }
  };

  const handleSelectUnit = (unit: string) => {
    if (activeQuantifierItemId) {
      updatePantryItemUnit(activeQuantifierItemId, unit);
      setActiveQuantifierItemId(null);
      showToast(`Updated quantifier to '${unit}'`);
      refreshItems();
    }
  };

  const categories = [
    { id: "all", label: `All (${items.length})`, icon: "inventory_2" },
    { id: "produce", label: "Produce", icon: "nutrition" },
    { id: "proteins", label: "Proteins", icon: "set_meal" },
    { id: "seasoning", label: "Seasoning", icon: "soup_kitchen" },
    { id: "dairy", label: "Dairy & Eggs", icon: "egg_alt" },
    { id: "staples", label: "Staples", icon: "rice_bowl" },
  ];

  const sortOptions = [
    { id: "expiry", label: "Expiring Soon", icon: "hourglass_top" },
    { id: "name", label: "Item Name (A-Z)", icon: "sort_by_alpha" },
    { id: "recent", label: "Recently Added", icon: "schedule" },
    { id: "qty", label: "Quantity / Portion", icon: "inventory_2" },
  ];

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0];
  const currentSortObj = sortOptions.find((s) => s.id === selectedSort) || sortOptions[0];
  const displayedItems = getFilteredAndSortedItems();

  // If activeSubTab is Cook Now
  if (activeSubTab === "cook-now") {
    return (
      <div className="flex flex-col w-full pb-28 font-['Plus_Jakarta_Sans',sans-serif] text-[#161c22]">
        <div className="w-full neo-raised rounded-3xl p-6 flex flex-col items-center text-center my-auto">
          <div className="w-20 h-20 rounded-full neo-sunken flex items-center justify-center mb-4 text-[#006948]">
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
            v3.0 Roadmap
          </span>

          <p className="text-xs text-[#576574] leading-relaxed max-w-xs mb-6">
            ZeroWaste Chef is training high-affinity Malaysian culinary models to generate zero-waste recipes directly from your live pantry inventory.
          </p>

          <button
            onClick={onOpenScanner}
            className="w-full max-w-xs py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            <span>Scan Ingredients to Pantry</span>
          </button>
        </div>
      </div>
    );
  }

  // If activeSubTab is Grocery
  if (activeSubTab === "grocery") {
    return (
      <div className="flex flex-col w-full pb-28 font-['Plus_Jakarta_Sans',sans-serif] text-[#161c22]">
        <div className="w-full neo-raised rounded-3xl p-6 flex flex-col items-center text-center my-auto">
          <div className="w-20 h-20 rounded-full neo-sunken flex items-center justify-center mb-4 text-[#006948]">
            <span className="material-symbols-outlined text-4xl">shopping_cart</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/60 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Coming Soon
          </div>

          <h2 className="text-lg font-extrabold text-[#161c22] tracking-tight mb-1">
            Smart Grocery Restock
          </h2>
          <span className="text-xs text-[#006948] font-bold uppercase tracking-wider mb-3">
            v3.0 Roadmap
          </span>

          <p className="text-xs text-[#576574] leading-relaxed max-w-xs mb-6">
            Automated threshold restock planner will forecast when your Malaysian aromatics and staples run low and create smart shopping lists.
          </p>

          <button
            onClick={onOpenScanner}
            className="w-full max-w-xs py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">kitchen</span>
            <span>Check Digital Pantry</span>
          </button>
        </div>
      </div>
    );
  }

  // Default: View 4 Digital Pantry Screen
  return (
    <div className="flex flex-col w-full pb-28 font-['Plus_Jakarta_Sans',sans-serif] text-foreground relative">
      
      {/* 1. Digital Pantry Card (View 4: Full-Width 14 Stored Items + Dual Action Buttons) */}
      <section className="w-full neo-raised rounded-2xl p-3.5 flex flex-col gap-2.5 shrink-0 mb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full neo-sunken flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">kitchen</span>
            </div>
            <span className="text-xs font-bold text-foreground">Digital Pantry</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full neo-sunken text-primary text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Updated {lastUpdatedText}
          </span>
        </div>

        {/* Full-Width Stored Items Sunken Well: STORED ITEMS on left, count on right */}
        <div className="w-full neo-sunken rounded-xl py-2.5 px-4 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-muted">STORED ITEMS</span>
          <span className="text-base font-extrabold text-foreground tracking-tight">{items.length}</span>
        </div>

        {/* Action Buttons Row: Dark Green with White Icon & Text + Tactile Dual Shadows */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Left: Generate Meals */}
          <button
            onClick={() => showToast(`Generating AI zero-waste recipes from ${items.length} pantry items...`)}
            className="rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-center cursor-pointer group active:scale-95 transition-all bg-[#004730] text-white"
            style={{
              boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.4), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
            }}
            type="button"
            title="Generate Meals"
          >
            <span className="material-symbols-outlined text-base font-bold text-white group-hover:rotate-12 transition-transform">
              auto_awesome
            </span>
            <span className="text-xs font-black tracking-tight text-white">Generate Meals</span>
          </button>

          {/* Right: Add Item (Switched to Camera Icon, opens Scanner HUD) */}
          <button
            onClick={onOpenScanner}
            className="rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-center cursor-pointer group active:scale-95 transition-all bg-[#004730] text-white"
            style={{
              boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.4), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
            }}
            type="button"
            title="Scan & Add Item"
          >
            <span className="material-symbols-outlined text-base font-bold text-white group-hover:scale-110 transition-transform">
              photo_camera
            </span>
            <span className="text-xs font-black tracking-tight text-white">Add Item</span>
          </button>
        </div>
      </section>

      {/* 2. Filter & Sort Utility Controls Bar */}
      <div className="flex items-center justify-between gap-2 shrink-0 relative z-20 mb-3.5">
        
        {/* Left: Category Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsSortOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neo-raised-sm text-xs font-bold text-foreground active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm text-[#004730]">
              {currentCategoryObj.icon}
            </span>
            <span>{currentCategoryObj.label}</span>
            <span
              className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                isFilterOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {/* Category Dropdown Menu */}
          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 py-1.5 bg-[#E0E5EC] neo-raised rounded-2xl text-left shadow-2xl z-40 flex flex-col gap-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setIsFilterOpen(false);
                    showToast(`Filtered: ${cat.label}`);
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "font-bold text-[#004730] bg-white/40"
                      : "font-medium text-foreground hover:bg-white/50"
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  {selectedCategory === cat.id && (
                    <span className="material-symbols-outlined text-sm text-[#004730]">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Sort & Grid View Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsFilterOpen(false);
              }}
              className="w-8 h-8 rounded-xl neo-raised-sm flex items-center justify-center text-foreground active:scale-95 transition-all cursor-pointer"
              title="Sort Pantry"
              type="button"
            >
              <span className="material-symbols-outlined text-base">swap_vert</span>
            </button>

            {isSortOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-48 py-1.5 bg-[#E0E5EC] neo-raised rounded-2xl text-left shadow-2xl z-40 flex flex-col gap-0.5">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedSort(opt.id);
                      setIsSortOpen(false);
                      showToast(`Sorted by: ${opt.label}`);
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                      selectedSort === opt.id
                        ? "font-bold text-[#004730] bg-white/40"
                        : "font-medium text-foreground hover:bg-white/50"
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>
                    {selectedSort === opt.id && (
                      <span className="material-symbols-outlined text-sm text-[#004730]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List / Grid View Toggle: Defaults to Grid View */}
          <div className="flex items-center p-0.5 rounded-xl neo-sunken">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                viewMode === "grid" ? "neo-raised-sm text-[#004730]" : "text-muted hover:text-foreground"
              }`}
              title="Grid View"
              type="button"
            >
              <span className="material-symbols-outlined text-base font-bold">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                viewMode === "list" ? "neo-raised-sm text-[#004730]" : "text-muted hover:text-foreground"
              }`}
              title="List View"
              type="button"
            >
              <span className="material-symbols-outlined text-base font-bold">view_list</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3. Pantry Item Cards (View 4: Defaults to Grid View) */}
      <div className={viewMode === "grid" ? "pantry-grid-mode gap-2.5 pb-6" : "flex flex-col gap-3 pb-6"}>
        {displayedItems.length === 0 ? (
          <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center gap-2 neo-sunken rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-muted">kitchen</span>
            <span className="text-xs font-bold text-foreground">No ingredients in this category</span>
            <button
              onClick={onOpenScanner}
              className="mt-2 px-4 py-2 rounded-xl bg-[#004730] text-white text-xs font-bold active:scale-95 transition-all"
              type="button"
            >
              Scan Ingredients Now
            </button>
          </div>
        ) : (
          displayedItems.map((item) => (
            <article
              key={item.id}
              className="neo-pantry-card w-full rounded-2xl p-3 flex flex-col gap-2"
            >
              <div className="card-media-row flex items-center gap-3">
                <div className="card-photo-box w-14 h-14 rounded-xl neo-sunken p-0.5 shrink-0 overflow-hidden relative">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {item.emoji}
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow-sm">
                    {item.emoji}
                  </div>
                </div>

                <div className="card-info-box flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-foreground truncate">{item.name}</h4>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="w-7 h-7 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-rose-600 active:scale-90 cursor-pointer"
                      title="Delete"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">delete_outline</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-muted font-medium truncate">
                    {item.nameMalay || item.category || "Farm Fresh"}
                  </span>
                </div>
              </div>

              {/* Stepper Row with Flat Quantifier and Uniform flex-1 Carved Well */}
              <div className="card-stepper-row flex items-center justify-between pt-1 border-t border-black/5">
                {/* Flat & Clean Quantifier Trigger (No Drop Shadow) */}
                <button
                  type="button"
                  onClick={() => setActiveQuantifierItemId(item.id)}
                  className="card-unit-trigger inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-extrabold text-[#004730] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
                  title="Click to choose quantifier"
                >
                  <span className="portion-unit text-xs font-extrabold text-[#004730]">{item.unit}</span>
                  <span className="material-symbols-outlined text-xs text-[#004730]/70 leading-none">expand_more</span>
                </button>

                {/* Stepper Controls with Uniform Full-Width Carved Well */}
                <div className="stepper-controls flex items-center gap-2 w-full">
                  {/* Minus Button: Red Font/Icon */}
                  <button
                    onClick={() => handleDecreaseQty(item)}
                    className="w-7 h-7 shrink-0 rounded-full neo-raised-sm flex items-center justify-center text-rose-600 active:scale-90 cursor-pointer"
                    type="button"
                    title="Decrease"
                  >
                    <span className="material-symbols-outlined text-xs font-black text-rose-600">remove</span>
                  </button>

                  {/* Carved-in Number Well (flex-1 identical width across all cards) */}
                  <div className="neo-sunken rounded-full py-0.5 px-2 flex-1 text-center flex items-center justify-center">
                    <span className="portion-val text-xs font-extrabold text-foreground">{item.quantity}</span>
                  </div>

                  {/* Plus Button: Dark Green */}
                  <button
                    onClick={() => handleIncreaseQty(item)}
                    className="w-7 h-7 shrink-0 rounded-full bg-[#004730] text-white flex items-center justify-center active:scale-90 shadow-sm cursor-pointer"
                    type="button"
                    title="Increase"
                  >
                    <span className="material-symbols-outlined text-xs font-bold text-white">add</span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Floating Quantifier Dropdown Sheet */}
      {activeQuantifierItemId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm"
          onClick={() => setActiveQuantifierItemId(null)}
        >
          <div
            className="w-full max-w-[280px] py-2 bg-[#E0E5EC] neo-raised rounded-3xl text-left shadow-2xl flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-black/5 flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#004730]">
                Select Quantifier
              </span>
              <button
                onClick={() => setActiveQuantifierItemId(null)}
                className="w-6 h-6 rounded-full neo-raised-sm flex items-center justify-center text-muted"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
            {QUANTIFIER_OPTIONS.map((q) => (
              <button
                key={q.unit}
                onClick={() => handleSelectUnit(q.unit)}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-[#004730] hover:text-white rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                type="button"
              >
                <span>{q.unit}</span>
                <span className="text-[10px] opacity-60 font-normal">{q.en}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Neumorphic Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-[320px] rounded-3xl neo-raised bg-[#E0E5EC] p-5 flex flex-col items-center text-center gap-3.5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl neo-sunken flex items-center justify-center text-rose-600">
              <span className="material-symbols-outlined text-2xl font-bold">delete_forever</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-extrabold text-foreground">Remove Ingredient?</h3>
              <p className="text-xs text-muted font-medium">
                Are you sure you want to remove{" "}
                <span className="font-extrabold text-[#004730]">{itemToDelete.name}</span> from your Digital Pantry?
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full pt-1">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl neo-raised-sm text-xs font-bold text-muted hover:text-foreground active:scale-95 transition-all"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95 transition-all shadow-md"
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-2xl flex items-center gap-2 z-50 animate-pop-up">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
