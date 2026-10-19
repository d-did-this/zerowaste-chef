"use client";

import React, { useState, useEffect } from "react";

interface PantryItemData {
  id: string;
  name: string;
  nameMalay: string;
  category: "produce" | "proteins" | "seasoning" | "dairy" | "staples";
  qty: number;
  unit: string;
  recent: number;
  photoUrl: string;
  emoji: string;
  subtitle: string;
}

const INITIAL_PANTRY_CARDS: PantryItemData[] = [
  {
    id: "corn",
    name: "Sweet Corn",
    nameMalay: "Jagung Manis",
    category: "produce",
    qty: 2,
    unit: "batang",
    recent: 5,
    photoUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=300&q=80",
    emoji: "🌽",
    subtitle: "Added 2h ago • Cameron Highlands",
  },
  {
    id: "spinach",
    name: "Baby Spinach",
    nameMalay: "Bayam Hijau",
    category: "produce",
    qty: 1,
    unit: "ikat",
    recent: 4,
    photoUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80",
    emoji: "🥬",
    subtitle: "Added today • Farm Fresh",
  },
  {
    id: "eggs",
    name: "Kampung Eggs",
    nameMalay: "Telur Ayam Gred A",
    category: "dairy",
    qty: 10,
    unit: "biji",
    recent: 3,
    photoUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=300&q=80",
    emoji: "🥚",
    subtitle: "Best by 28 Oct • Organic",
  },
  {
    id: "tomatoes",
    name: "Roma Tomatoes",
    nameMalay: "Tomato Roma",
    category: "produce",
    qty: 4,
    unit: "biji",
    recent: 2,
    photoUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80",
    emoji: "🍅",
    subtitle: "Added 1d ago • Ripe & Firm",
  },
  {
    id: "chicken",
    name: "Chicken Breast",
    nameMalay: "Dada Ayam Segar",
    category: "proteins",
    qty: 500,
    unit: "g",
    recent: 6,
    photoUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=300&q=80",
    emoji: "🍗",
    subtitle: "Frozen • Defrost in 2 days",
  },
  {
    id: "kicap",
    name: "Kicap Manis",
    nameMalay: "Kicap Manis Cap Kipas Udang",
    category: "seasoning",
    qty: 1,
    unit: "botol",
    recent: 1,
    photoUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80",
    emoji: "🍶",
    subtitle: "Pantry Shelf • 80% Full",
  },
  {
    id: "garlic",
    name: "Garlic Cloves",
    nameMalay: "Bawang Putih",
    category: "staples",
    qty: 1,
    unit: "labu",
    recent: 7,
    photoUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=300&q=80",
    emoji: "🧄",
    subtitle: "Dry Storage • Fresh Bulbs",
  },
];

const QUANTIFIER_LIST = [
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

export default function OfficialV3Client() {
  const [activeTab, setActiveTab] = useState<"scanner" | "pantry" | "cook-now" | "grocery">("pantry");

  // Pantry state
  const [cards, setCards] = useState<PantryItemData[]>(INITIAL_PANTRY_CARDS);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [selectedCatLabel, setSelectedCatLabel] = useState<string>("All (14)");
  const [selectedCatIcon, setSelectedCatIcon] = useState<string>("apps");
  const [selectedSort, setSelectedSort] = useState<string>("expiry");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dropdowns & Modals
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);
  const [activeUnitCardId, setActiveUnitCardId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<PantryItemData | null>(null);

  // Scanner & View 2 States
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<string>("2x");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showPopOutCard, setShowPopOutCard] = useState<boolean>(false);

  // Pop-Out Card (View 2) States
  const [popPortion, setPopPortion] = useState<number>(2);
  const [popUnit, setPopUnit] = useState<string>("batang");
  const [isPopUnitOpen, setIsPopUnitOpen] = useState<boolean>(false);
  const [popNoteOpen, setPopNoteOpen] = useState<boolean>(false);
  const [popNote, setPopNote] = useState<string>("");

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setIsFilterMenuOpen(false);
      setIsSortMenuOpen(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Filter & Sort
  const getFilteredCards = () => {
    let result = cards.filter((c) => {
      if (selectedCat === "all") return true;
      return c.category === selectedCat;
    });

    result = [...result].sort((a, b) => {
      if (selectedSort === "name") {
        return a.name.localeCompare(b.name);
      } else if (selectedSort === "qty") {
        return b.qty - a.qty;
      } else if (selectedSort === "recent") {
        return b.recent - a.recent;
      }
      return 0;
    });

    return result;
  };

  const displayedCards = getFilteredCards();

  // Stepper handlers
  const adjustCardQty = (id: string, delta: number) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = Math.max(1, c.qty + delta);
          return { ...c, qty: next };
        }
        return c;
      })
    );
  };

  const handleConfirmDelete = () => {
    if (cardToDelete) {
      setCards((prev) => prev.filter((c) => c.id !== cardToDelete.id));
      showToast(`Removed ${cardToDelete.name} from Digital Pantry`);
      setCardToDelete(null);
    }
  };

  const handleSelectUnit = (unit: string) => {
    if (activeUnitCardId) {
      setCards((prev) =>
        prev.map((c) => (c.id === activeUnitCardId ? { ...c, unit } : c))
      );
      setActiveUnitCardId(null);
      showToast(`Quantifier updated to '${unit}'`);
    }
  };

  // Scanner Action
  const triggerShutter = () => {
    if (isScanning) return;
    setIsScanning(true);
    showToast("AI Scanning: Detecting produce & freshness...");
    setTimeout(() => {
      setIsScanning(false);
      setShowPopOutCard(true);
      showToast("Detected: Fresh Sweet Corn (98% match)!");
    }, 1200);
  };

  const handleConfirmAddPopOut = () => {
    setShowPopOutCard(false);
    showToast(`Sweet Corn (${popPortion} ${popUnit}) added to Pantry!`);
    setActiveTab("pantry");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 bg-[#E0E5EC] font-['Plus_Jakarta_Sans',sans-serif] text-[#3D4852] select-none">
      
      {/* Mobile Container: Exactly matches view4-isolated.html & view1-isolated.html */}
      <div className="w-full sm:w-[390px] h-screen sm:h-[844px] sm:rounded-[44px] p-3 neo-raised flex flex-col relative overflow-hidden bg-[#E0E5EC] text-foreground justify-between mx-auto shadow-2xl">
        
        {/* ========================================================= */}
        {/* VIEW 4: DIGITAL PANTRY TAB                                */}
        {/* ========================================================= */}
        {activeTab === "pantry" && (
          <>
            {/* Top Bar - Exactly 1:1 with view4-isolated.html */}
            <header className="h-16 px-3 flex items-center justify-between neo-bar-top backdrop-blur-md rounded-t-[32px] z-20 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-[#004730] shrink-0">
                  <span className="material-symbols-outlined text-xl">kitchen</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-foreground tracking-tight">ZeroWaste Chef</span>
                    <span className="text-[10px] text-muted font-normal">&bull; Pantry (View 4)</span>
                  </div>
                  <span className="text-[9px] text-[#004730] uppercase font-extrabold tracking-wider">Smart Stock AI</span>
                </div>
              </div>

              <button
                className="w-10 h-10 rounded-full neo-raised-sm flex items-center justify-center text-foreground hover:text-[#004730] active:scale-95 transition-all cursor-pointer"
                title="Search"
                type="button"
                onClick={() => showToast("Search index loaded (14 items)")}
              >
                <span className="material-symbols-outlined text-base">search</span>
              </button>
            </header>

            {/* Main Scrollable Content */}
            <div className="flex-1 p-3 flex flex-col gap-3.5 overflow-y-auto no-scrollbar relative">
              
              {/* 1. Digital Pantry Card (Soft Neumorphic Surface with Bulging CTA Buttons) */}
              <section className="w-full neo-raised rounded-2xl p-3.5 flex flex-col gap-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full neo-sunken flex items-center justify-center text-[#004730]">
                      <span className="material-symbols-outlined text-base">kitchen</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">Digital Pantry</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full neo-sunken text-[#004730] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#004730] animate-pulse"></span>
                    Updated 2m ago
                  </span>
                </div>

                {/* Full-Width Stored Items Sunken Well: STORED ITEMS on left, 14 on right */}
                <div className="w-full neo-sunken rounded-xl py-2.5 px-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-muted">STORED ITEMS</span>
                  <span className="text-base font-extrabold text-foreground tracking-tight" id="pantryTotalItemsCount">
                    {cards.length}
                  </span>
                </div>

                {/* Action Buttons Row: Dark Green with White Icon & Text + Tactile Shadow */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Left: Generate Meals */}
                  <button
                    onClick={() => showToast(`Generating AI zero-waste recipes from ${cards.length} items...`)}
                    className="rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-center cursor-pointer group active:scale-95 transition-all bg-[#004730] text-white"
                    style={{
                      boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.4), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
                    }}
                    title="Generate Meals"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base font-bold text-white group-hover:rotate-12 transition-transform">
                      auto_awesome
                    </span>
                    <span className="text-xs font-black tracking-tight text-white">Generate Meals</span>
                  </button>

                  {/* Right: Add Item (Switches to Scan HUD) */}
                  <button
                    onClick={() => {
                      setActiveTab("scanner");
                      setShowPopOutCard(false);
                    }}
                    className="rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-center cursor-pointer group active:scale-95 transition-all bg-[#004730] text-white"
                    style={{
                      boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.4), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
                    }}
                    title="Add Item (Quick Log)"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base font-bold text-white group-hover:scale-110 transition-transform">
                      photo_camera
                    </span>
                    <span className="text-xs font-black tracking-tight text-white">Add Item</span>
                  </button>
                </div>
              </section>

              {/* 2. Unified Controls Bar: Filter on Left, Sort & Grid/List on Right */}
              <div className="flex items-center justify-between gap-2 pt-1 pb-1 shrink-0 relative z-30">
                
                {/* Category Filter Dropdown Trigger */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setIsFilterMenuOpen(!isFilterMenuOpen);
                      setIsSortMenuOpen(false);
                    }}
                    className="h-8 px-3 rounded-xl neo-raised-sm flex items-center gap-1.5 text-foreground hover:text-[#004730] active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm text-[#004730]">{selectedCatIcon}</span>
                    <span className="text-xs font-bold text-foreground">{selectedCatLabel}</span>
                    <span
                      className={`material-symbols-outlined text-sm text-muted transition-transform duration-200 ${
                        isFilterMenuOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Filter Menu */}
                  {isFilterMenuOpen && (
                    <div className="absolute left-0 top-10 w-48 py-1.5 rounded-2xl neo-raised bg-[#E0E5EC] shadow-2xl flex flex-col gap-0.5 z-50">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                        Category Filter
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedCat("all");
                          setSelectedCatLabel(`All (${cards.length})`);
                          setSelectedCatIcon("apps");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "all"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-[#004730]">apps</span>
                          <span>All Items</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full neo-sunken font-bold text-muted">
                          {cards.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("produce");
                          setSelectedCatLabel("Produce");
                          setSelectedCatIcon("eco");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "produce"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-700">eco</span>
                          <span>Produce</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("proteins");
                          setSelectedCatLabel("Proteins");
                          setSelectedCatIcon("set_meal");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "proteins"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-amber-700">set_meal</span>
                          <span>Proteins</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("seasoning");
                          setSelectedCatLabel("Seasoning");
                          setSelectedCatIcon("soup_kitchen");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "seasoning"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-rose-700">soup_kitchen</span>
                          <span>Seasoning</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("dairy");
                          setSelectedCatLabel("Dairy & Eggs");
                          setSelectedCatIcon("egg_alt");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "dairy"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-yellow-700">egg_alt</span>
                          <span>Dairy & Eggs</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("staples");
                          setSelectedCatLabel("Staples");
                          setSelectedCatIcon("rice_bowl");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "staples"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-orange-700">rice_bowl</span>
                          <span>Staples</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Sort & Grid View Toggle */}
                <div className="flex items-center gap-2">
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setIsSortMenuOpen(!isSortMenuOpen);
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-8 h-8 rounded-xl neo-raised-sm flex items-center justify-center text-foreground active:scale-95 transition-all cursor-pointer"
                      title="Sort Pantry"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">swap_vert</span>
                    </button>

                    {isSortMenuOpen && (
                      <div className="absolute right-0 top-10 w-44 py-1.5 rounded-2xl neo-raised bg-[#E0E5EC] shadow-2xl flex flex-col gap-0.5 z-50">
                        <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted">Sort By</div>
                        <button
                          onClick={() => {
                            setSelectedSort("expiry");
                            setIsSortMenuOpen(false);
                            showToast("Sorted by: Expiring Soon");
                          }}
                          className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#004730] bg-white/40 rounded-xl mx-1 cursor-pointer"
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">hourglass_top</span>
                            <span>Expiring Soon</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSort("name");
                            setIsSortMenuOpen(false);
                            showToast("Sorted by: Item Name (A-Z)");
                          }}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-white/50 rounded-xl mx-1 cursor-pointer"
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">sort_by_alpha</span>
                            <span>Item Name (A-Z)</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSort("recent");
                            setIsSortMenuOpen(false);
                            showToast("Sorted by: Recently Added");
                          }}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-white/50 rounded-xl mx-1 cursor-pointer"
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span>Recently Added</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSort("qty");
                            setIsSortMenuOpen(false);
                            showToast("Sorted by: Quantity");
                          }}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-white/50 rounded-xl mx-1 cursor-pointer"
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                            <span>Quantity</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List / Grid View Toggle: Default to Grid View */}
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

              {/* 3. Pantry Item Cards (Grid Mode by default) */}
              <div className={viewMode === "grid" ? "pantry-grid-mode gap-2.5 pb-20" : "flex flex-col gap-3 pb-20"}>
                {displayedCards.map((card) => (
                  <article
                    key={card.id}
                    className="neo-pantry-card w-full rounded-2xl p-3 flex flex-col gap-2"
                  >
                    <div className="card-media-row flex items-center gap-3">
                      <div className="card-photo-box w-14 h-14 rounded-xl neo-sunken p-0.5 shrink-0 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.photoUrl}
                          alt={card.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute top-1 left-1 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center text-[9px]">
                          {card.emoji}
                        </div>
                      </div>

                      <div className="card-info-box flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-foreground truncate">{card.name}</h4>
                          <button
                            onClick={() => setCardToDelete(card)}
                            className="w-7 h-7 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-rose-600 active:scale-90 cursor-pointer"
                            title="Delete"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">delete_outline</span>
                          </button>
                        </div>
                        <span className="text-[10px] text-muted font-medium truncate">{card.subtitle}</span>
                      </div>
                    </div>

                    {/* Stepper Row: Flat Quantifier on Left, Uniform flex-1 Sunken Number on Right */}
                    <div className="card-stepper-row flex items-center justify-between pt-1 border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => setActiveUnitCardId(card.id)}
                        className="card-unit-trigger inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-extrabold text-[#004730] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
                        title="Click to choose quantifier"
                      >
                        <span className="portion-unit text-xs font-extrabold text-[#004730]">{card.unit}</span>
                        <span className="material-symbols-outlined text-xs text-[#004730]/70 leading-none">expand_more</span>
                      </button>

                      <div className="stepper-controls flex items-center gap-2 w-full">
                        <button
                          onClick={() => adjustCardQty(card.id, -1)}
                          className="w-7 h-7 shrink-0 rounded-full neo-raised-sm flex items-center justify-center text-rose-600 active:scale-90 cursor-pointer"
                          type="button"
                          title="Decrease"
                        >
                          <span className="material-symbols-outlined text-xs font-black text-rose-600">remove</span>
                        </button>
                        <div className="neo-sunken rounded-full py-0.5 px-2 flex-1 text-center flex items-center justify-center">
                          <span className="portion-val text-xs font-extrabold text-foreground">{card.qty}</span>
                        </div>
                        <button
                          onClick={() => adjustCardQty(card.id, 1)}
                          className="w-7 h-7 shrink-0 rounded-full bg-[#004730] text-white flex items-center justify-center active:scale-90 shadow-sm cursor-pointer"
                          type="button"
                          title="Increase"
                        >
                          <span className="material-symbols-outlined text-xs font-bold text-white">add</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: LIVE SCANNER HUD TAB (Exact 1:1 view1-isolated)    */}
        {/* ========================================================= */}
        {activeTab === "scanner" && (
          <>
            {/* Header with Stack Back Button & Context Title */}
            <header className="w-full z-20 neo-bar-top backdrop-blur-md rounded-t-[32px] shrink-0">
              <div className="h-16 px-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    aria-label="Go Back"
                    className="min-h-[44px] min-w-[44px] rounded-2xl neo-raised flex items-center justify-center text-foreground active:scale-95 transition-all cursor-pointer"
                    onClick={() => setActiveTab("pantry")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                  </button>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground tracking-tight truncate">Scanner Hud</span>
                    <span className="text-[9px] text-[#004730] uppercase font-bold tracking-wider">ZeroWaste Kitchen</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Go to Pantry"
                    className="min-h-[44px] min-w-[44px] rounded-2xl neo-raised flex items-center justify-center text-muted hover:text-foreground active:scale-95 transition-transform cursor-pointer"
                    onClick={() => setActiveTab("pantry")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">home</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content Slot */}
            <div className="flex-1 flex flex-col relative w-full px-3 overflow-y-auto no-scrollbar py-2">
              <div className="flex flex-col w-full pb-20 space-y-3.5">
                
                {/* Top Utility Controls Bar */}
                <div className="flex items-center justify-between gap-2 w-full pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Toggle Torch"
                      onClick={() => {
                        setTorchOn(!torchOn);
                        showToast(torchOn ? "Torch deactivated" : "Torch activated");
                      }}
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        torchOn ? "neo-sunken text-[#004730]" : "neo-raised-sm text-foreground"
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {torchOn ? "flash_on" : "flash_off"}
                      </span>
                    </button>
                    <button
                      aria-label="Switch Camera"
                      onClick={() => showToast("Flipping sensor to macro mode")}
                      className="h-10 w-10 rounded-full neo-raised-sm flex items-center justify-center text-foreground active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
                    </button>
                  </div>

                  {/* Zoom Pills */}
                  <div className="flex items-center gap-1 p-1 rounded-full neo-sunken">
                    {["1x", "1.5x", "2x", "3x"].map((z) => (
                      <button
                        key={z}
                        onClick={() => {
                          setZoomLevel(z);
                          showToast(`Camera switched to ${z}`);
                        }}
                        className={`w-7 h-7 rounded-full text-[10px] flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                          zoomLevel === z
                            ? "bg-[#004730] text-white font-bold shadow-sm"
                            : "text-muted font-medium hover:text-foreground"
                        }`}
                        type="button"
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Viewfinder Frame Section */}
                <div className="w-full neo-raised rounded-2xl p-2.5 relative flex flex-col">
                  <div className="relative w-full rounded-xl overflow-hidden bg-slate-200 shadow-inner aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80"
                      alt="Sweet Corn Live View"
                      className="w-full h-full object-cover select-none"
                    />
                    <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border border-[#006948]/40 animate-reticle">
                        <span className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#006948] rounded-tl-lg"></span>
                        <span className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#006948] rounded-tr-lg"></span>
                        <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#006948] rounded-bl-lg"></span>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#006948] rounded-br-lg"></span>
                        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#006948] to-transparent opacity-80 animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#006948] ring-4 ring-[#006948]/20"></div>
                        </div>
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                          Center 1 ingredient here
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 pb-1 text-center">
                    <span className="material-symbols-outlined text-[#006948] text-base">center_focus_strong</span>
                    <span className="text-[11px] text-muted font-medium">Keep ingredients centered for optimal detection</span>
                  </div>
                </div>

                {/* Bottom Shutter & Mode Action Deck */}
                <div className="w-full neo-raised rounded-2xl p-4 flex flex-col space-y-4">
                  <div className="w-full neo-sunken rounded-2xl p-3 flex items-center justify-around">
                    <button
                      onClick={() => showToast("Upload Photo from Camera Roll")}
                      className="flex flex-col items-center justify-center gap-1 p-2.5 min-w-[72px] rounded-xl neo-raised-sm active:scale-95 transition-all text-foreground cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-2xl text-muted">photo_library</span>
                      <span className="text-[10px] font-semibold text-muted">Upload</span>
                    </button>

                    <div className="flex flex-col items-center">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none">
                          <svg
                            className={`w-full h-full ${isScanning ? "animate-[spin_0.75s_linear_infinite]" : "animate-[spin_2.5s_linear_infinite]"}`}
                            viewBox="0 0 80 80"
                          >
                            <circle cx="40" cy="40" r="34" fill="none" stroke="#004730" strokeWidth="3.5" opacity="0.2" />
                            <circle
                              cx="40"
                              cy="40"
                              r="34"
                              fill="none"
                              stroke="url(#shutterGradV3)"
                              strokeWidth="4.5"
                              strokeLinecap="round"
                              strokeDasharray="140 75"
                            />
                            <defs>
                              <linearGradient id="shutterGradV3" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#004730" />
                                <stop offset="50%" stopColor="#00855D" />
                                <stop offset="100%" stopColor="#38B2AC" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {/* Central Shutter Button */}
                        <button
                          onClick={triggerShutter}
                          disabled={isScanning}
                          className="relative z-10 h-14 w-14 rounded-full bg-[#E0E5EC] flex items-center justify-center neo-raised-sm active:scale-90 transition-all cursor-pointer"
                          type="button"
                          title="Snap & Identify"
                        >
                          <span className="material-symbols-outlined text-[#006948] text-3xl font-bold">
                            photo_camera
                          </span>
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5">
                        {isScanning ? "Scanning..." : "AI Scan"}
                      </span>
                    </div>

                    <button
                      onClick={() => showToast("Manual ingredient logging modal")}
                      className="flex flex-col items-center justify-center gap-1 p-2.5 min-w-[72px] rounded-xl neo-raised-sm active:scale-95 transition-all text-foreground cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-2xl text-muted">keyboard</span>
                      <span className="text-[10px] font-semibold text-muted">Manual</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 py-2.5 px-3 rounded-full neo-sunken text-[11px] font-semibold text-muted opacity-75 flex items-center justify-center gap-1.5 cursor-not-allowed"
                      disabled
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base opacity-60">barcode_scanner</span>
                      <span>Coming Soon</span>
                    </button>
                    <button
                      onClick={() => showToast("Opening Receipt OCR scanner")}
                      className="flex-1 py-2.5 px-3 rounded-full neo-raised-sm text-[11px] font-semibold text-foreground hover:text-[#004730] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                      <span>Scan Receipt</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW 2: POP-OUT DETECTION CARD (Slides over View 1)      */}
            {/* ========================================================= */}
            {showPopOutCard && (
              <div className="absolute inset-x-0 bottom-0 top-16 z-30 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-pop-up">
                <div className="w-full bg-[#E0E5EC] rounded-t-[36px] p-5 neo-raised flex flex-col gap-3.5 shadow-2xl pb-24">
                  
                  {/* Verified Header */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full neo-sunken text-[#006948] text-xs font-black">
                      <span className="material-symbols-outlined text-sm font-bold">verified</span>
                      98% Match &bull; Cameron Highlands
                    </span>
                    <button
                      onClick={() => setShowPopOutCard(false)}
                      className="w-7 h-7 rounded-full neo-raised-sm flex items-center justify-center text-muted cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {/* Photo & Identity Row */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl neo-sunken p-1 shrink-0 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=300&q=80"
                        alt="Sweet Corn"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute top-1 left-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">🌽</div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-base font-extrabold text-foreground tracking-tight">Fresh Sweet Corn</h2>
                      <span className="text-xs text-muted font-medium">Jagung Manis &bull; Produce</span>
                      <span className="text-[10px] text-emerald-800 font-bold mt-0.5">High Quality &bull; Crispy &amp; Sweet</span>
                    </div>
                  </div>

                  {/* Portion Count Stepper with RED Minus Button and Flat Quantifier */}
                  <div className="p-3 rounded-2xl neo-sunken flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground">Portion Count</span>
                      <span className="text-[10px] text-muted">Adjust detected quantity</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPopPortion((p) => Math.max(1, p - 1))}
                        className="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-rose-600 font-black active:scale-90 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base font-black text-rose-600">remove</span>
                      </button>

                      <div className="neo-sunken rounded-full py-1 px-3 min-w-[36px] text-center flex items-center justify-center">
                        <span className="text-xs font-extrabold text-foreground">{popPortion}</span>
                      </div>

                      <button
                        onClick={() => setPopPortion((p) => p + 1)}
                        className="w-8 h-8 rounded-full bg-[#004730] text-white flex items-center justify-center active:scale-90 shadow-sm cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base font-bold text-white">add</span>
                      </button>

                      {/* Flat Quantifier Trigger */}
                      <button
                        onClick={() => setIsPopUnitOpen(!isPopUnitOpen)}
                        className="card-unit-trigger inline-flex items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-extrabold text-[#004730] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
                        type="button"
                      >
                        <span>{popUnit}</span>
                        <span className="material-symbols-outlined text-sm leading-none">expand_more</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Item Note Section */}
                  {popNoteOpen ? (
                    <div className="p-3 rounded-2xl neo-sunken flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-foreground">Pantry / Expiration Note:</label>
                      <input
                        type="text"
                        value={popNote}
                        onChange={(e) => setPopNote(e.target.value)}
                        placeholder="e.g. Bought from Lotus, best by Friday"
                        className="w-full text-xs p-2 rounded-xl bg-white/70 border-0 text-foreground focus:outline-[#004730]"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setPopNoteOpen(true)}
                      className="w-full py-2.5 px-3.5 rounded-2xl neo-raised flex items-center justify-between text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#004730] text-base">edit_note</span>
                        <span className="text-xs font-semibold text-foreground">Add Item Note</span>
                      </div>
                      <span className="text-[10px] text-[#004730] font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">add</span> Note
                      </span>
                    </button>
                  )}

                  {/* Bulging Confirm & Add Button */}
                  <button
                    onClick={handleConfirmAddPopOut}
                    className="w-full py-3.5 px-5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all bg-[#004730] text-white shadow-lg cursor-pointer"
                    style={{
                      boxShadow: "4px 4px 12px rgba(0, 71, 48, 0.45), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
                    }}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">inventory_2</span>
                    <span>Confirm &amp; Add to Pantry</span>
                  </button>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    <button
                      onClick={() => {
                        setShowPopOutCard(false);
                        triggerShutter();
                      }}
                      className="py-2.5 px-3 rounded-full neo-raised-sm text-xs font-bold text-foreground hover:text-[#004730] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">replay</span>
                      <span>Rescan</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPopOutCard(false);
                        showToast("Scan next item...");
                      }}
                      className="py-2.5 px-3 rounded-full neo-raised-sm text-xs font-bold text-[#004730] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                      <span>Scan Next</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: COOK NOW (COMING SOON)                            */}
        {/* ========================================================= */}
        {activeTab === "cook-now" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full neo-sunken flex items-center justify-center mb-4 text-[#004730]">
              <span className="material-symbols-outlined text-4xl">skillet</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/60 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Coming Soon
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">
              Smart Recipe Engine
            </h2>
            <span className="text-xs text-[#004730] font-bold uppercase tracking-wider mb-3">
              v3.0 Roadmap
            </span>
            <p className="text-xs text-muted leading-relaxed max-w-xs mb-6">
              ZeroWaste Chef is training high-affinity Malaysian culinary models to generate zero-waste recipes directly from your live pantry inventory.
            </p>
            <button
              onClick={() => setActiveTab("scanner")}
              className="w-full max-w-xs py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              <span>Scan Ingredients to Pantry</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: GROCERY RESTOCK (COMING SOON)                     */}
        {/* ========================================================= */}
        {activeTab === "grocery" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full neo-sunken flex items-center justify-center mb-4 text-[#004730]">
              <span className="material-symbols-outlined text-4xl">shopping_cart</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/60 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Coming Soon
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">
              Smart Grocery Restock
            </h2>
            <span className="text-xs text-[#004730] font-bold uppercase tracking-wider mb-3">
              v3.0 Roadmap
            </span>
            <p className="text-xs text-muted leading-relaxed max-w-xs mb-6">
              Automated threshold restock planner will forecast when your Malaysian aromatics and staples run low and create smart shopping lists.
            </p>
            <button
              onClick={() => setActiveTab("pantry")}
              className="w-full max-w-xs py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">kitchen</span>
              <span>Check Digital Pantry</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* BOTTOM NAV: FROM THE VERCEL SYSTEM (As User Requested)     */}
        {/* "everything except for the bttom nav, should be exactly   */}
        {/* the same"                                                 */}
        {/* ========================================================= */}
        <nav className="mt-2 mb-1 mx-1 h-16 px-1.5 rounded-3xl bg-[#E0E5EC] neo-raised grid grid-cols-4 items-center gap-1 shrink-0 z-40 border-0">
          {/* 1. Scanner Tab */}
          <button
            onClick={() => {
              setActiveTab("scanner");
              setShowPopOutCard(false);
            }}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">photo_camera</span>
            <span className="text-[10px] font-bold mt-0.5 leading-none">Scanner</span>
          </button>

          {/* 2. Pantry Tab */}
          <button
            onClick={() => setActiveTab("pantry")}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === "pantry"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">kitchen</span>
            <span className="text-[10px] font-bold mt-0.5 leading-none">Pantry</span>
          </button>

          {/* 3. Cook Now Tab */}
          <button
            onClick={() => setActiveTab("cook-now")}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
              activeTab === "cook-now"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">skillet</span>
            <span className="text-[10px] font-semibold mt-0.5 leading-none">Cook</span>
            <span className="text-[7px] font-extrabold uppercase px-1 rounded-full bg-amber-100 text-amber-800 absolute top-1 right-1.5 border border-amber-300/50">
              Soon
            </span>
          </button>

          {/* 4. Grocery Restock Tab */}
          <button
            onClick={() => setActiveTab("grocery")}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
              activeTab === "grocery"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">shopping_cart</span>
            <span className="text-[10px] font-semibold mt-0.5 leading-none">Grocery</span>
            <span className="text-[7px] font-extrabold uppercase px-1 rounded-full bg-amber-100 text-amber-800 absolute top-1 right-1.5 border border-amber-300/50">
              Soon
            </span>
          </button>
        </nav>

        {/* ========================================================= */}
        {/* POPUPS & MODALS: EXACTLY FROM THE HTML                    */}
        {/* ========================================================= */}
        
        {/* Floating Quantifier Dropdown Sheet for Pantry Cards */}
        {activeUnitCardId && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveUnitCardId(null)}
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
                  onClick={() => setActiveUnitCardId(null)}
                  className="w-6 h-6 rounded-full neo-raised-sm flex items-center justify-center text-muted cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
              {QUANTIFIER_LIST.map((q) => (
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

        {/* Floating Quantifier Dropdown Sheet for Pop-Out Card */}
        {isPopUnitOpen && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsPopUnitOpen(false)}
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
                  onClick={() => setIsPopUnitOpen(false)}
                  className="w-6 h-6 rounded-full neo-raised-sm flex items-center justify-center text-muted cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
              {QUANTIFIER_LIST.map((q) => (
                <button
                  key={q.unit}
                  onClick={() => {
                    setPopUnit(q.unit);
                    setIsPopUnitOpen(false);
                    showToast(`Quantifier changed to '${q.unit}'`);
                  }}
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
        {cardToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-xs transition-opacity">
            <div className="w-full max-w-[300px] rounded-3xl neo-raised bg-[#E0E5EC] p-5 flex flex-col items-center text-center gap-3.5 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl neo-sunken flex items-center justify-center text-rose-600">
                <span className="material-symbols-outlined text-2xl font-bold">delete_forever</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-extrabold text-foreground">Remove Ingredient?</h3>
                <p className="text-xs text-muted font-medium">
                  Are you sure you want to remove{" "}
                  <span className="font-extrabold text-[#004730]">{cardToDelete.name}</span> from your Digital Pantry?
                </p>
              </div>
              <div className="flex items-center gap-2.5 w-full pt-1">
                <button
                  onClick={() => setCardToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl neo-raised-sm text-xs font-bold text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95 transition-all shadow-md cursor-pointer"
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification Pill */}
        {toastMsg && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-2xl flex items-center gap-2 z-50 animate-pop-up">
            <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
}
