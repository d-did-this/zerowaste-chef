"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CANONICAL_APPLIANCE_LABELS,
  GeneratedRecipeSnapshot,
  getAllRecipesWithPantryMatch,
  getFilteredRecipes,
  MatchedRecipeResult,
} from "@/utils/recipesDb";
import { PantryItem } from "@/utils/pantryStorage";
import HalalIcon from "@/components/HalalIcon";
import { getCuisinePillColors, getReadinessBadgeColors } from "@/utils/foodSemantics";
import { getThemePalette, ThemeId } from "@/utils/themeStorage";

interface RecipeMatchesViewProps {
  cuisinesState: Record<string, boolean>;
  appliancesState: Record<string, boolean>;
  pantryItems: PantryItem[];
  storedSnapshot?: GeneratedRecipeSnapshot | null;
  onGoToCuisines: () => void;
  onAddPantryItems?: () => void;
  onRegenerate?: () => void;
  onSelectRecipe: (recipe: MatchedRecipeResult) => void;
  themeId?: ThemeId;
}

const PAGE_SIZE = 24;

const CUISINE_DISPLAY_NAMES: Record<string, string> = {
  malay: "Malay",
  chinese: "Chinese",
  indian: "Indian",
  "sabah-sarawak": "Sabah & Sarawak",
  others: "Other",
};

type SortOption = "pantry" | "time" | "ingredients" | "appliances";

interface DynamicFilterOption {
  key: string;
  label: string;
  count: number;
  group: "general" | "cuisine" | "category";
  predicate: (r: MatchedRecipeResult) => boolean;
}

function parseMinutes(prepTime: string): number {
  const num = parseInt(prepTime, 10);
  return isNaN(num) ? 999 : num;
}

function RecipeMatchesView({
  cuisinesState,
  appliancesState,
  pantryItems,
  storedSnapshot,
  onGoToCuisines,
  onAddPantryItems,
  onRegenerate,
  onSelectRecipe,
  themeId = "pandan-hero",
}: RecipeMatchesViewProps) {
  const palette = getThemePalette(themeId);
  const isPandanHero = palette.isHeroDark;
  const [engineMode, setEngineMode] = useState<"ingredients-to-meals" | "meals-to-ingredients">(
    "ingredients-to-meals"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("pantry");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isFilterOpen]);

  const modeRecipes = useMemo(() => {
    if (storedSnapshot) {
      return engineMode === "ingredients-to-meals"
        ? storedSnapshot.kitchenMatched
        : storedSnapshot.allExploreScored;
    }
    if (engineMode === "ingredients-to-meals") {
      return getFilteredRecipes(cuisinesState, appliancesState, pantryItems);
    }
    return getAllRecipesWithPantryMatch(pantryItems, appliancesState);
  }, [storedSnapshot, engineMode, cuisinesState, appliancesState, pantryItems]);

  // Build context-aware dropdown filter options adapting to chosen cuisines
  const filterOptions = useMemo<DynamicFilterOption[]>(() => {
    const options: DynamicFilterOption[] = [
      {
        key: "all",
        label: "All Recipes",
        count: modeRecipes.length,
        group: "general",
        predicate: () => true,
      },
    ];

    const cuisineCounts = new Map<string, { label: string; count: number }>();
    for (const r of modeRecipes) {
      const existing = cuisineCounts.get(r.cuisine);
      if (existing) {
        existing.count += 1;
      } else {
        cuisineCounts.set(r.cuisine, { label: r.cuisineLabel, count: 1 });
      }
    }

    if (cuisineCounts.size > 1) {
      for (const [cuisineKey, info] of cuisineCounts.entries()) {
        options.push({
          key: `cuisine:${cuisineKey}`,
          label: info.label,
          count: info.count,
          group: "cuisine",
          predicate: (r) => r.cuisine === cuisineKey,
        });
      }
    }

    const categoryCounts = new Map<string, number>();
    for (const r of modeRecipes) {
      categoryCounts.set(r.category, (categoryCounts.get(r.category) || 0) + 1);
    }

    const sortedCats = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sortedCats) {
      if (count < modeRecipes.length) {
        options.push({
          key: `cat:${cat}`,
          label: cat,
          count,
          group: "category",
          predicate: (r) => r.category === cat,
        });
      }
    }

    return options;
  }, [modeRecipes]);

  const effectiveFilter = useMemo(
    () => (filterOptions.some((opt) => opt.key === activeFilter) ? activeFilter : "all"),
    [filterOptions, activeFilter]
  );

  const activeFilterOption = useMemo(
    () => filterOptions.find((opt) => opt.key === effectiveFilter) || filterOptions[0],
    [filterOptions, effectiveFilter]
  );

  const toggleSort = (option: Exclude<SortOption, "pantry">) => {
    setSortBy((prev) => (prev === option ? "pantry" : option));
    setVisibleCount(PAGE_SIZE);
  };

  const switchMode = (next: "ingredients-to-meals" | "meals-to-ingredients") => {
    setEngineMode(next);
    setVisibleCount(PAGE_SIZE);
  };

  const displayedRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = modeRecipes.filter((r) => {
      if (activeFilterOption && !activeFilterOption.predicate(r)) return false;
      if (q) {
        const nameMatch = r.name.toLowerCase().includes(q);
        const catMatch = r.category.toLowerCase().includes(q);
        const cuisineMatch = r.cuisineLabel.toLowerCase().includes(q);
        const ingMatch = r.ingredients.some((i) => i.toLowerCase().includes(q));
        if (!nameMatch && !catMatch && !cuisineMatch && !ingMatch) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "ingredients") {
        const diff = a.ingredients.length - b.ingredients.length;
        if (diff !== 0) return diff;
      } else if (sortBy === "time") {
        const diff = parseMinutes(a.prepTime) - parseMinutes(b.prepTime);
        if (diff !== 0) return diff;
      } else if (sortBy === "appliances") {
        const diff = a.appliances.length - b.appliances.length;
        if (diff !== 0) return diff;
      }

      // Default sort ("pantry") and tie-breaker: highest pantry match first
      if (b.analysis.matchPercentage !== a.analysis.matchPercentage) {
        return b.analysis.matchPercentage - a.analysis.matchPercentage;
      }
      if (b.analysis.matchedCoreCount !== a.analysis.matchedCoreCount) {
        return b.analysis.matchedCoreCount - a.analysis.matchedCoreCount;
      }
      return a.id - b.id;
    });
  }, [modeRecipes, activeFilterOption, searchQuery, sortBy]);

  const selectedCuisineSummary = useMemo(() => {
    const chosen = Object.keys(CUISINE_DISPLAY_NAMES)
      .filter((k) => Boolean(cuisinesState[k]))
      .map((k) => CUISINE_DISPLAY_NAMES[k]);
    if (chosen.length === 0 || chosen.length >= 4) return "selected";
    return chosen.join("/");
  }, [cuisinesState]);

  const sortSubtitle =
    sortBy === "time"
      ? "Sorted by least cooking time"
      : sortBy === "ingredients"
      ? "Sorted by least ingredients"
      : sortBy === "appliances"
      ? "Sorted by least appliances"
      : engineMode === "ingredients-to-meals"
      ? `≥75% pantry match • ${pantryItems.length} pantry item${pantryItems.length === 1 ? "" : "s"}`
      : "Craving search across all cuisines";

  const renderSearchBar = (placement: "top-craving" | "list-filter") => (
    <div
      className={`w-full neo-sunken rounded-2xl px-3 flex items-center gap-2 shrink-0 ${
        placement === "top-craving"
          ? "py-2 ring-1 ring-[#006948]/20"
          : "py-1.5"
      }`}
    >
      <span
        className="material-symbols-outlined text-base"
        style={placement === "top-craving" ? { color: palette.primaryBg } : { color: "#64748B" }}
      >
        search
      </span>
      <input
        type="text"
        placeholder={
          placement === "top-craving"
            ? "Search any dish or craving across all cuisines..."
            : "Search dish or filter matched recipes..."
        }
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setVisibleCount(PAGE_SIZE);
        }}
        className="bg-transparent border-0 outline-none w-full text-[11px] font-semibold text-[#1E293B] placeholder:text-[#94A3B8]"
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
  );

  const cuisineOptions = filterOptions.filter((o) => o.group === "cuisine");
  const categoryOptions = filterOptions.filter((o) => o.group === "category");
  const generalOptions = filterOptions.filter((o) => o.group === "general");

  return (
    <div className="meal-flow-scope flex-1 flex flex-col justify-between overflow-hidden relative">
      {/* Uniform Header Bar with Skillet Icon & Bulging Neumorphic Regenerate Pill */}
      <header className="h-16 px-3.5 flex items-center justify-between neo-bar-top backdrop-blur-md rounded-t-[32px] z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-[#004730] shrink-0">
            <span className="material-symbols-outlined text-xl">skillet</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground tracking-tight truncate">
              Matched Recipes
            </span>
            <span className="text-[9.5px] font-semibold text-[#006948] truncate">
              Curated for your kitchen
            </span>
          </div>
        </div>

        <button
          onClick={onRegenerate || onGoToCuisines}
          className="px-3.5 py-2 rounded-2xl text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer hover:translate-y-[-1px] active:scale-95 transition-all ring-1 ring-white/35 animate-nav-dock-bounce border-0"
          style={{
            background: palette.regenGradient,
            boxShadow: palette.regenShadow,
          }}
          aria-label="Regenerate Recipes"
          type="button"
        >
          <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[11px] font-bold">autorenew</span>
          </span>
          <span>Regenerate</span>
        </button>
      </header>

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-1.5 px-3 flex flex-col gap-2.5"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (
            visibleCount < displayedRecipes.length &&
            el.scrollTop + el.clientHeight >= el.scrollHeight - 240
          ) {
            setVisibleCount((prev) => Math.min(displayedRecipes.length, prev + PAGE_SIZE));
          }
        }}
      >
        {/* Bidirectional Engine Switcher with Sliding Dark-Green Pill */}
        <div className="p-1 rounded-2xl neo-sunken relative grid grid-cols-2 gap-1 shrink-0">
          <div
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-6px)] rounded-xl bg-[#004730] shadow-sm pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.25,0.64,1)]"
            style={{
              transform:
                engineMode === "meals-to-ingredients"
                  ? "translateX(calc(100% + 4px))"
                  : "translateX(0)",
            }}
          />
          <button
            onClick={() => switchMode("ingredients-to-meals")}
            className={`relative z-10 py-1.5 px-2 rounded-xl text-[10.5px] font-extrabold flex items-center justify-center gap-1 transition-colors duration-200 cursor-pointer ${
              engineMode === "ingredients-to-meals"
                ? "text-white"
                : "text-[#475569] hover:text-[#004730]"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-xs">kitchen</span>
            <span>My Kitchen Match</span>
          </button>
          <button
            onClick={() => switchMode("meals-to-ingredients")}
            className={`relative z-10 py-1.5 px-2 rounded-xl text-[10.5px] font-extrabold flex items-center justify-center gap-1 transition-colors duration-200 cursor-pointer ${
              engineMode === "meals-to-ingredients"
                ? "text-white"
                : "text-[#475569] hover:text-[#004730]"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-xs">explore</span>
            <span>Explore All</span>
          </button>
        </div>

        {/* Module 3 (Explore All): Prominent Craving Search Bar ABOVE Summary Card */}
        {engineMode === "meals-to-ingredients" && renderSearchBar("top-craving")}

        {/* Unified Summary Header Across All Themes (with Square Top Match Badge) */}
        <section
          key={`hdr-hero-${engineMode}-${themeId}`}
          className={`rounded-2xl p-3 flex items-center justify-between gap-2.5 shrink-0 ${
            isPandanHero ? "neo-pandan-hero" : "neo-raised"
          } ${
            engineMode === "meals-to-ingredients" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`}
        >
          <div className="min-w-0 flex-1">
            <h1
              className={`text-[15.5px] font-extrabold tracking-tight leading-[1.2] ${
                isPandanHero ? "text-white" : "text-[#0F172A]"
              }`}
            >
              {displayedRecipes.length} Recipes Matched!
            </h1>
            <p
              className={`text-[10.5px] mt-[3px] leading-[1.35] truncate ${
                isPandanHero ? "text-emerald-100/85" : "text-[#64748B]"
              }`}
            >
              {sortSubtitle}
            </p>
          </div>
          <div
            className={`w-[54px] h-[54px] rounded-[14px] flex flex-col items-center justify-center text-center shrink-0 ${
              isPandanHero ? "neo-pandan-sunken" : "neo-sunken"
            }`}
          >
            <span
              className={`text-[15px] font-extrabold leading-none block ${
                isPandanHero ? "text-amber-300" : ""
              }`}
              style={isPandanHero ? undefined : { color: palette.primaryBg }}
            >
              {pantryItems.length > 0 && displayedRecipes.length > 0
                ? `${Math.max(...displayedRecipes.map((d) => d.analysis.matchPercentage))}%`
                : displayedRecipes.length}
            </span>
            <span
              className={`text-[7.5px] font-extrabold uppercase tracking-[0.04em] leading-none block mt-1 ${
                isPandanHero ? "text-emerald-100/85" : "text-[#006948]"
              }`}
            >
              {pantryItems.length > 0 && displayedRecipes.length > 0 ? "Top Match" : "Ready"}
            </span>
          </div>
        </section>

        {/* Module 2 (My Kitchen Match): Secondary List Filter below Summary Card when matches exist */}
        {engineMode === "ingredients-to-meals" &&
          modeRecipes.length > 0 &&
          renderSearchBar("list-filter")}

        {/* Unified Single Control Row: 3-Way Sort Toggle with Sliding Pill + Filter Dropdown Button */}
        <div className="flex items-center gap-2 shrink-0 relative z-30" ref={filterMenuRef}>
          {/* 3-Way Sort Toggle Pill */}
          <div
            className="flex-1 h-9 p-1 rounded-2xl neo-sunken relative grid grid-cols-3 gap-1"
            role="group"
            aria-label="Sort recipes"
          >
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(33.333%-5px)] rounded-xl bg-[#004730] shadow-xs pointer-events-none transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)]"
              style={{
                opacity: sortBy === "pantry" ? 0 : 1,
                transform:
                  sortBy === "ingredients"
                    ? "translateX(calc(100% + 4px))"
                    : sortBy === "appliances"
                    ? "translateX(calc(200% + 8px))"
                    : "translateX(0)",
              }}
            />
            {(
              [
                { key: "time", label: "Time", icon: "schedule", title: "Least Time" },
                { key: "ingredients", label: "Ingr.", icon: "grocery", title: "Least Ingredients" },
                { key: "appliances", label: "Tools", icon: "microwave", title: "Least Appliances" },
              ] as Array<{ key: Exclude<SortOption, "pantry">; label: string; icon: string; title: string }>
            ).map((s) => {
              const isActive = sortBy === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  title={`${s.title} (tap again for Pantry Match)`}
                  className={`relative z-10 h-full rounded-xl text-[10px] font-extrabold inline-flex items-center justify-center gap-1 transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "text-white"
                      : "text-[#475569] hover:text-[#004730]"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[12px]">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Dropdown Trigger Button */}
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`h-9 px-3 rounded-2xl flex items-center gap-1 text-[10.5px] font-extrabold shrink-0 transition-all cursor-pointer ${
              effectiveFilter !== "all"
                ? "bg-[#004730] text-white shadow-sm"
                : "neo-button text-[#004730]"
            }`}
            aria-expanded={isFilterOpen}
            aria-label="Filter recipes"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">filter_list</span>
            <span className="max-w-[74px] truncate">
              {effectiveFilter === "all" ? "Filter" : activeFilterOption?.label}
            </span>
            <span
              className={`material-symbols-outlined text-[13px] transition-transform duration-150 ${
                isFilterOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {/* Filter Dropdown Popover */}
          {isFilterOpen && (
            <div className="absolute right-0 top-11 w-60 max-h-[320px] overflow-y-auto no-scrollbar p-2.5 rounded-2xl bg-[var(--zw-bg)] neo-raised shadow-2xl flex flex-col gap-2.5 z-50">
              <div className="px-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F172A]">
                  Filter Recipes
                </span>
                {effectiveFilter !== "all" && (
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setIsFilterOpen(false);
                    }}
                    className="text-[9.5px] font-extrabold text-[#004730] underline cursor-pointer"
                    type="button"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Section 1: All Recipes */}
              <div className="rounded-xl p-1 neo-sunken flex flex-col gap-0.5">
                {generalOptions.map((opt) => {
                  const selected = effectiveFilter === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setActiveFilter(opt.key);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        selected
                          ? "bg-[#004730] text-white shadow-xs"
                          : "text-[#1E293B] hover:bg-white/50"
                      }`}
                      type="button"
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-extrabold ${
                          selected ? "bg-white/20 text-white" : "bg-black/5 text-[#64748B]"
                        }`}
                      >
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Section 2: Cuisines (Distinctly Separated Block) */}
              {cuisineOptions.length > 0 && (
                <div className="flex flex-col gap-1 pt-1 border-t border-black/10">
                  <div className="px-2 py-0.5 rounded-md bg-[rgba(0,71,48,0.08)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px] text-[#004730]">
                      restaurant_menu
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#004730]">
                      Cuisines
                    </span>
                  </div>
                  <div className="rounded-xl p-1 neo-sunken flex flex-col gap-0.5">
                    {cuisineOptions.map((opt) => {
                      const selected = effectiveFilter === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setActiveFilter(opt.key);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            selected
                              ? "bg-[#004730] text-white shadow-xs"
                              : "text-[#1E293B] hover:bg-white/50"
                          }`}
                          type="button"
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-extrabold ${
                              selected ? "bg-white/20 text-white" : "bg-black/5 text-[#64748B]"
                            }`}
                          >
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 3: Categories (Distinctly Separated Block) */}
              {categoryOptions.length > 0 && (
                <div className="flex flex-col gap-1 pt-1 border-t border-black/10">
                  <div className="px-2 py-0.5 rounded-md bg-[rgba(234,88,12,0.1)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px] text-[#C2410C]">
                      category
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#C2410C]">
                      Dish Categories
                    </span>
                  </div>
                  <div className="rounded-xl p-1 neo-sunken flex flex-col gap-0.5">
                    {categoryOptions.map((opt) => {
                      const selected = effectiveFilter === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setActiveFilter(opt.key);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            selected
                              ? "bg-[#004730] text-white shadow-xs"
                              : "text-[#1E293B] hover:bg-white/50"
                          }`}
                          type="button"
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-extrabold ${
                              selected ? "bg-white/20 text-white" : "bg-black/5 text-[#64748B]"
                            }`}
                          >
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Matched Recipe Cards */}
        <div className="flex flex-col gap-2.5 pb-2">
          {displayedRecipes.length === 0 ? (
            <div className="rounded-2xl p-5 neo-sunken text-center flex flex-col items-center gap-2.5">
              <span className="material-symbols-outlined text-3xl text-[#64748B]">
                soup_kitchen
              </span>
              <p className="text-xs font-extrabold text-[#334155] leading-snug max-w-[260px]">
                {engineMode === "ingredients-to-meals"
                  ? pantryItems.length === 0
                    ? "Your Pantry is empty — add ingredients to unlock ready-to-cook matches."
                    : modeRecipes.length === 0
                    ? `No ${selectedCuisineSummary} dishes matched your current Pantry items yet`
                    : "No matched dishes fit your current search or filter."
                  : "No dishes matched that search or filter."}
              </p>
              <p className="text-[10.5px] text-[#64748B] leading-snug max-w-[250px]">
                {engineMode === "ingredients-to-meals"
                  ? "My Kitchen Match requires ≥75% of a dish's core ingredients in your Pantry."
                  : "Try a broader keyword or clear active filters."}
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                {engineMode === "ingredients-to-meals" && onAddPantryItems && (
                  <button
                    onClick={onAddPantryItems}
                    className="px-3.5 py-2 rounded-xl neo-button text-[11px] font-extrabold text-[#004730] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">add_a_photo</span>
                    <span>Add Pantry Items</span>
                  </button>
                )}
                {engineMode === "ingredients-to-meals" && (
                  <button
                    onClick={() => switchMode("meals-to-ingredients")}
                    className="px-3.5 py-2 rounded-xl text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    style={{ backgroundColor: palette.primaryBg }}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">explore</span>
                    <span>Search in Explore All →</span>
                  </button>
                )}
                {(activeFilter !== "all" || searchQuery.trim() !== "") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="px-3 py-2 rounded-xl neo-button text-[11px] font-extrabold text-[#004730] active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {displayedRecipes.slice(0, visibleCount).map((r, idx) => {
                const hasPantry = pantryItems.length > 0;
                const pct = r.analysis.matchPercentage;
                const [timeNum, timeUnit] = r.prepTime.split(" ");
                const cuisineColors = getCuisinePillColors(r.cuisine);
                const readinessColors = getReadinessBadgeColors(pct);
                const shouldAnimate = idx < 8;
                return (
                  <div
                    key={`${engineMode}-${sortBy}-${r.uid}`}
                    onClick={() => onSelectRecipe(r)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelectRecipe(r);
                    }}
                    style={
                      shouldAnimate
                        ? { animationDelay: `${80 + Math.min(idx, 6) * 110}ms` }
                        : undefined
                    }
                    className={`rounded-2xl p-3.5 bg-[var(--zw-bg)] neo-raised flex flex-col gap-2.5 cursor-pointer hover:shadow-lg transition-shadow text-left ${
                      shouldAnimate ? "animate-recipe-unfold" : ""
                    }`}
                  >
                  {/* Card Top Row: Cuisine + Readiness Pill + Halal Logo + Title | Stat Squares */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold"
                          style={{ backgroundColor: cuisineColors.bg, color: cuisineColors.text }}
                        >
                          {r.cuisineLabel}
                        </span>
                        {hasPantry && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-extrabold"
                            style={{ backgroundColor: readinessColors.bg, color: readinessColors.text }}
                          >
                            {pct}% Ready
                          </span>
                        )}
                        {r.diet.includes("Halal") && <HalalIcon size={20} />}
                      </div>

                      <h3 className="text-[13.5px] font-extrabold text-foreground leading-snug">
                        {r.name}
                      </h3>
                    </div>

                    {/* Stat Squares: Orange Ingredients Needed + Green Est. Prep Time */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="w-[46px] h-[46px] rounded-[13px] bg-[#EA580C] text-white flex flex-col items-center justify-center shadow-sm"
                        title={`${r.ingredients.length} ingredients needed`}
                      >
                        <span className="text-[15px] font-extrabold leading-none">
                          {r.ingredients.length}
                        </span>
                        <span className="text-[7px] font-extrabold uppercase tracking-[0.04em] mt-[2px] leading-none">
                          Ingr.
                        </span>
                        <span className="text-[6px] font-bold uppercase tracking-[0.02em] text-white/85 mt-[1.5px] leading-none">
                          Needed
                        </span>
                      </div>

                      <div
                        className="w-[46px] h-[46px] rounded-[13px] bg-[#004730] text-white flex flex-col items-center justify-center shadow-sm"
                        title={`Estimated cooking time: ${r.prepTime}`}
                      >
                        <span className="text-[15px] font-extrabold leading-none">
                          {timeNum}
                        </span>
                        <span className="text-[7px] font-extrabold uppercase tracking-[0.04em] mt-[2px] leading-none">
                          {timeUnit || "mins"}
                        </span>
                        <span className="text-[6px] font-bold uppercase tracking-[0.02em] text-white/80 mt-[1.5px] leading-none">
                          Est. Time
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pantry Match Progress Bar (Only shown when Pantry has items or Extra Appliance warning applies) */}
                  {(hasPantry || !r.appliancesReady) && (
                    <div className="flex flex-col gap-1 px-0.5">
                      <div className="flex items-center justify-between text-[9.5px] font-bold">
                        {hasPantry ? (
                          <span className={pct >= 50 ? "text-[#006948]" : "text-[#475569]"}>
                            {r.analysis.matchedCoreCount}/{r.analysis.totalCoreCount} pantry ready
                          </span>
                        ) : (
                          <span />
                        )}
                        {!r.appliancesReady && (
                          <span className="text-amber-700 font-extrabold">Extra Appliance Needed</span>
                        )}
                      </div>
                      {hasPantry && (
                        <div className="w-full h-1.5 rounded-full bg-slate-300/70 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#006948] transition-all duration-300"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Carved-In Appliances Well + Cook CTA */}
                  <div className="rounded-xl neo-sunken px-2.5 py-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      <span className="material-symbols-outlined text-[13px] text-[#004730] shrink-0 mr-0.5">
                        microwave
                      </span>
                      {r.appliances.map((app, i) => (
                        <span
                          key={app}
                          className="text-[9.5px] font-bold text-[#334155]"
                        >
                          {CANONICAL_APPLIANCE_LABELS[app] || app}
                          {i < r.appliances.length - 1 ? " •" : ""}
                        </span>
                      ))}
                    </div>

                    <span className="text-[10px] font-extrabold text-[#004730] shrink-0 flex items-center gap-0.5 pl-1">
                      <span>Cook</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </span>
                  </div>
                </div>
                );
              })}
              {visibleCount < displayedRecipes.length && (
                <button
                  onClick={() =>
                    setVisibleCount((prev) => Math.min(displayedRecipes.length, prev + PAGE_SIZE))
                  }
                  className="w-full py-2.5 px-4 rounded-2xl neo-button text-[11px] font-extrabold text-[#004730] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                  <span>
                    Show More Recipes ({displayedRecipes.length - visibleCount} remaining)
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default React.memo(RecipeMatchesView);
