"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CANONICAL_APPLIANCE_LABELS,
  extractStepAppliancesAndTools,
  extractStepIngredients,
  extractStepTimers,
  formatDuration,
  MatchedRecipeResult,
  parseInstructionSteps,
} from "@/utils/recipesDb";
import { addMissingToGrocery } from "@/utils/groceryStorage";
import HalalIcon from "@/components/HalalIcon";
import { launchToNavTab } from "@/utils/flyToNavAnimation";

const STEP_APPLIANCE_ICONS: Record<string, string> = {
  stove: "local_fire_department",
  wok: "skillet",
  pot: "soup_kitchen",
  blender: "blender",
  rice_cooker: "rice_bowl",
  oven: "oven_gen",
  air_fryer: "air",
  microwave: "microwave",
};

function detectStepAction(stepText: string): { label: string; icon: string } {
  const s = stepText.toLowerCase();
  if (/\b(marinate|soak|refrigerate|overnight)\b/.test(s)) {
    return { label: "Prep & Soak", icon: "hourglass_top" };
  }
  if (/\b(blend|grind|pound|mash|combine|mix|knead)\b/.test(s)) {
    return { label: "Blend & Mix", icon: "blender" };
  }
  if (/\b(wash|rinse|drain|clean|peel|chop|slice|cut|dice|julienne|crush|bruise|score|measure)\b/.test(s)) {
    return { label: "Prep & Cut", icon: "content_cut" };
  }
  if (/\b(fry|sauté|saute|sear|dry-roast|roast|air fry|bake|toast)\b/.test(s)) {
    return { label: "Fry & Sear", icon: "local_fire_department" };
  }
  if (/\b(boil|simmer|steam|cook|stew|transfer|pour)\b/.test(s)) {
    return { label: "Cook & Simmer", icon: "soup_kitchen" };
  }
  if (/\b(season|taste|adjust)\b/.test(s)) {
    return { label: "Season & Taste", icon: "tune" };
  }
  if (/\b(serve|garnish|plate|fluff|sprinkle|arrange)\b/.test(s)) {
    return { label: "Plate & Serve", icon: "restaurant" };
  }
  return { label: "Cook Step", icon: "skillet" };
}

function highlightStepMeasurements(stepText: string): React.ReactNode[] {
  const pattern =
    /(\b\d+(?:[./-]\d+)?\s*(?:cups?|tbsp|tsp|g|kg|ml|l|litres?|inches?|inch|cm|°C|°F|seconds?|secs?|minutes?|mins?|hours?|hrs?|ladle|cloves?|stalks?|sprigs?)\b)/gi;
  const parts = stepText.split(pattern);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} className="font-extrabold text-[#004730]">
          {part}
        </span>
      );
    }
    return part;
  });
}

interface RecipeDetailModalProps {
  recipe: MatchedRecipeResult;
  appliancesState: Record<string, boolean>;
  onClose: () => void;
  onFinishCooking: (recipe: MatchedRecipeResult) => void;
  onGroceryUpdated: (addedCount: number, recipeName: string) => void;
}

function playTimerChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.16);
      gain.gain.setValueAtTime(0.15, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.46);
    });
  } catch {
    // AudioContext optional in headless / restricted environments
  }
}

export default function RecipeDetailModal({
  recipe,
  appliancesState,
  onClose,
  onFinishCooking,
  onGroceryUpdated,
}: RecipeDetailModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ingredients" | "steps">("ingredients");
  const [hasSwitchedSubTab, setHasSwitchedSubTab] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  const switchSubTab = (tab: "ingredients" | "steps") => {
    if (tab === activeSubTab) return;
    setHasSwitchedSubTab(true);
    setActiveSubTab(tab);
  };
  const [stepDirection, setStepDirection] = useState<"next" | "prev">("next");
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [addedToGrocery, setAddedToGrocery] = useState<boolean>(false);

  // Per-step timer state
  const [selectedTimerIdxByStep, setSelectedTimerIdxByStep] = useState<Record<number, number>>({});
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerStepOwner, setTimerStepOwner] = useState<number | null>(null);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const shopMissingBtnRef = useRef<HTMLButtonElement | null>(null);
  const missingRowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const steps = useMemo(() => parseInstructionSteps(recipe.instructions), [recipe.instructions]);
  const currentStepText = steps[currentStepIdx] || "";
  const stepAction = useMemo(() => detectStepAction(currentStepText), [currentStepText]);
  const stepIngredients = useMemo(
    () => extractStepIngredients(currentStepText, recipe.analysis.ingredients),
    [currentStepText, recipe.analysis.ingredients]
  );
  const stepTools = useMemo(
    () => extractStepAppliancesAndTools(currentStepText, recipe.appliances),
    [currentStepText, recipe.appliances]
  );
  const detectedTimers = useMemo(() => extractStepTimers(currentStepText), [currentStepText]);
  const selectedTimerIdx = selectedTimerIdxByStep[currentStepIdx] ?? 0;
  const activeStepTimerOption = detectedTimers[selectedTimerIdx] || detectedTimers[0] || null;

  // Live countdown tick
  useEffect(() => {
    if (!isTimerRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setIsTimerRunning(false);
          setTimerFinished(true);
          playTimerChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerRunning]);

  const isViewingTimerOwner = timerStepOwner === currentStepIdx;
  const displayedSeconds =
    isViewingTimerOwner && remainingSecs !== null
      ? remainingSecs
      : activeStepTimerOption?.seconds ?? 0;

  const handleStartOrToggleTimer = () => {
    if (!activeStepTimerOption) return;

    if (!isViewingTimerOwner || remainingSecs === null || remainingSecs === 0) {
      setTimerStepOwner(currentStepIdx);
      setRemainingSecs(activeStepTimerOption.seconds);
      setTimerFinished(false);
      setIsTimerRunning(true);
      return;
    }

    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    if (!activeStepTimerOption) return;
    setIsTimerRunning(false);
    setTimerFinished(false);
    setTimerStepOwner(currentStepIdx);
    setRemainingSecs(activeStepTimerOption.seconds);
  };

  const handleSelectTimerOption = (idx: number) => {
    setSelectedTimerIdxByStep((prev) => ({ ...prev, [currentStepIdx]: idx }));
    const chosen = detectedTimers[idx];
    if (chosen) {
      setIsTimerRunning(false);
      setTimerFinished(false);
      setTimerStepOwner(currentStepIdx);
      setRemainingSecs(chosen.seconds);
    }
  };

  const handleAddMissing = () => {
    if (recipe.analysis.missingItems.length === 0) return;

    const bodyRect = bodyRef.current?.getBoundingClientRect();
    const btnRect = shopMissingBtnRef.current?.getBoundingClientRect() ?? null;

    const flyItems = recipe.analysis.missingItems.map((m, idx) => {
      const rowRect = missingRowRefs.current[idx]?.getBoundingClientRect();
      const rowVisible =
        rowRect &&
        bodyRect &&
        rowRect.top >= bodyRect.top - 16 &&
        rowRect.bottom <= bodyRect.bottom + 16;

      return {
        label: `+ ${m.cleanName}`,
        sourceRect: rowVisible ? rowRect : btnRect,
        tone: "orange" as const,
      };
    });

    const result = addMissingToGrocery(
      recipe.name,
      recipe.analysis.missingItems.map((m) => ({ cleanName: m.cleanName, raw: m.raw }))
    );
    setAddedToGrocery(true);

    const badgeCount = Math.max(1, result.addedCount || recipe.analysis.missingItems.length);
    launchToNavTab({
      targetTab: "grocery",
      items: flyItems,
      badgeText: `+${badgeCount}`,
      badgeTone: "orange",
      staggerMs: 175,
      durationMs: 1350,
      onDockImpact: () => {
        onGroceryUpdated(result.addedCount, recipe.name);
      },
    });
  };

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const requestClose = (afterClose?: () => void) => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      if (afterClose) {
        afterClose();
      } else {
        onClose();
      }
    }, 310);
  };

  const goToStep = (idx: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    if (clamped === currentStepIdx) return;
    setStepDirection(clamped > currentStepIdx ? "next" : "prev");
    setCurrentStepIdx(clamped);
  };

  const handleNextStep = () => {
    setCompletedSteps((prev) => ({ ...prev, [currentStepIdx]: true }));
    if (currentStepIdx < steps.length - 1) {
      setStepDirection("next");
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      requestClose(() => onFinishCooking(recipe));
    }
  };

  const toggleCurrentStepDone = () => {
    setCompletedSteps((prev) => ({ ...prev, [currentStepIdx]: !prev[currentStepIdx] }));
  };

  const isLastStep = currentStepIdx === steps.length - 1;

  const haveIngredients = useMemo(
    () => recipe.analysis.ingredients.filter((i) => i.status === "have"),
    [recipe.analysis.ingredients]
  );
  const missingIngredients = useMemo(
    () => recipe.analysis.ingredients.filter((i) => i.status === "missing"),
    [recipe.analysis.ingredients]
  );
  const stapleIngredients = useMemo(
    () => recipe.analysis.ingredients.filter((i) => i.status === "staple"),
    [recipe.analysis.ingredients]
  );

  return (
    <div
      className={`absolute inset-0 z-[35] bg-black/40 backdrop-blur-xs flex flex-col justify-end pb-[74px] overflow-hidden ${
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
      }`}
      onClick={() => requestClose()}
    >
      <div
        className={`w-full h-[94%] bg-[var(--zw-bg)] rounded-t-[36px] neo-raised flex flex-col overflow-hidden shadow-2xl ${
          isClosing ? "animate-modal-sheet-slide-out" : "animate-modal-sheet-bounce-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Top Bar */}
        <header className="px-5 pt-3.5 pb-3 shrink-0">
          <div className="w-10 h-1 neo-sunken rounded-full mx-auto mb-3" />

          {/* Pills Row: Cuisine + Halal on Left, Prep Time Pill + Close on Right */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#004730] text-white">
                {recipe.cuisineLabel}
              </span>
              {recipe.diet.includes("Halal") && <HalalIcon size={21} />}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full neo-sunken text-[10px] font-extrabold text-[#334155]">
                <span className="material-symbols-outlined text-[13px] text-[#004730]">schedule</span>
                <span>{recipe.prepTime}</span>
              </span>
              <button
                onClick={() => requestClose()}
                className="w-7 h-7 rounded-full neo-raised-sm flex items-center justify-center text-[#64748B] hover:text-[#0F172A] active:scale-90 transition-all shrink-0 cursor-pointer"
                type="button"
                aria-label="Close Recipe"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          <h2 className="text-[17px] font-extrabold text-[#0F172A] leading-snug tracking-tight">
            {recipe.name}
          </h2>

          {/* Minimal Segmented Tabs with Sliding Dark-Green Pill Thumb */}
          <div className="mt-3 p-1 rounded-2xl neo-sunken relative grid grid-cols-2 gap-1">
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-6px)] rounded-xl bg-[#004730] shadow-sm pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.25,0.64,1)]"
              style={{
                transform: activeSubTab === "steps" ? "translateX(calc(100% + 4px))" : "translateX(0)",
              }}
            />
            <button
              onClick={() => switchSubTab("ingredients")}
              className={`relative z-10 py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-200 ${
                activeSubTab === "ingredients"
                  ? "text-white"
                  : "text-[#64748B] hover:text-[#004730]"
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">grocery</span>
              <span>Ingredients ({recipe.ingredients.length})</span>
            </button>
            <button
              onClick={() => switchSubTab("steps")}
              className={`relative z-10 py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-200 ${
                activeSubTab === "steps"
                  ? "text-white"
                  : "text-[#64748B] hover:text-[#004730]"
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">skillet</span>
              <span>Cook Steps ({steps.length})</span>
            </button>
          </div>
        </header>

        {/* Body */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 py-2 flex flex-col gap-3.5"
        >
          {activeSubTab === "ingredients" ? (
            <div
              key="tab-ingredients"
              className={`flex flex-col gap-3.5 ${hasSwitchedSubTab ? "animate-slide-in-left" : ""}`}
            >
              {/* Clean Pantry Readiness & Appliances Summary */}
              <div className="rounded-2xl p-3.5 neo-sunken flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#004730]">
                    {recipe.analysis.matchedCoreCount} of {recipe.analysis.totalCoreCount} Pantry Ready
                  </span>
                  <span className="text-[#64748B]">
                    {recipe.analysis.missingCoreCount === 0
                      ? "Ready to cook"
                      : `${recipe.analysis.missingCoreCount} missing`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-300/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#006948]"
                    style={{ width: `${Math.max(4, recipe.analysis.matchPercentage)}%` }}
                  />
                </div>

                {/* Only the 8 Canonical Appliances */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-[#64748B] mr-0.5">Appliances:</span>
                  {recipe.appliances.map((app) => {
                    const isOn = Boolean(appliancesState[app]);
                    return (
                      <span
                        key={app}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOn
                            ? "bg-[rgba(0,71,48,0.08)] text-[#004730]"
                            : "bg-amber-100/80 text-amber-800"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[11px]">
                          {isOn ? "check" : "warning"}
                        </span>
                        <span>{CANONICAL_APPLIANCE_LABELS[app] || app}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Organized Section 1: In Your Pantry */}
              {haveIngredients.length > 0 && (
                <section className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#004730]">
                      In Your Pantry ({haveIngredients.length})
                    </span>
                  </div>
                  <div className="rounded-2xl bg-[var(--zw-bg)] neo-raised divide-y divide-black/5 overflow-hidden">
                    {haveIngredients.map((item, idx) => (
                      <div key={`have-${idx}`} className="px-3.5 py-2.5 flex items-center justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-[#006948] shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <div className="flex flex-col min-w-0">
                            {item.sectionTag && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#004730]">
                                {item.sectionTag}
                              </span>
                            )}
                            <span className="text-[12px] font-semibold text-[#1E293B] leading-snug">
                              {item.raw.replace(/^\*\*[^*]+\*\*\s*/, "")}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-bold text-[#006948] shrink-0">
                          {item.matchedPantryItem?.quantity} {item.matchedPantryItem?.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Organized Section 2: Need to Buy */}
              {missingIngredients.length > 0 && (
                <section className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                      Need to Buy ({missingIngredients.length})
                    </span>
                  </div>
                  <div className="rounded-2xl bg-[var(--zw-bg)] neo-raised divide-y divide-black/5 overflow-hidden">
                    {missingIngredients.map((item, idx) => (
                      <div
                        key={`miss-${idx}`}
                        ref={(el) => {
                          missingRowRefs.current[idx] = el;
                        }}
                        className="px-3.5 py-2.5 flex flex-col gap-1"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">
                            radio_button_unchecked
                          </span>
                          <div className="flex flex-col min-w-0">
                            {item.sectionTag && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#004730]">
                                {item.sectionTag}
                              </span>
                            )}
                            <span className="text-[12px] font-semibold text-[#1E293B] leading-snug">
                              {item.raw.replace(/^\*\*[^*]+\*\*\s*/, "")}
                            </span>
                          </div>
                        </div>
                        {item.substitutionHint && (
                          <div className="ml-6.5 text-[10px] font-semibold text-[#004730]/80 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">swap_horiz</span>
                            <span>{item.substitutionHint}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Organized Section 3: Kitchen Staples */}
              {stapleIngredients.length > 0 && (
                <section className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                      Pantry Staples ({stapleIngredients.length})
                    </span>
                  </div>
                  <div className="rounded-2xl neo-sunken divide-y divide-black/5 overflow-hidden">
                    {stapleIngredients.map((item, idx) => (
                      <div key={`staple-${idx}`} className="px-3.5 py-2 flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">
                          water_drop
                        </span>
                        <span className="text-[11.5px] font-medium text-[#475569] leading-snug">
                          {item.raw.replace(/^\*\*[^*]+\*\*\s*/, "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Source Attribution at the End of the List */}
              <div className="pt-1 pb-2 flex justify-center">
                {recipe.sourceUrl ? (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neo-sunken text-[10.5px] font-bold text-[#004730] hover:opacity-85 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-xs">link</span>
                    <span>Source: {recipe.collection}</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neo-sunken text-[10.5px] font-bold text-[#64748B]">
                    <span className="material-symbols-outlined text-xs">menu_book</span>
                    <span>Source: {recipe.collection}</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* FOCUSED ONE-STEP-AT-A-TIME COOKING READER */
            <div key="tab-steps" className="flex-1 flex flex-col justify-between gap-3 py-1 animate-slide-in-right">
              {/* Top Step Selector & Clear Step Counter */}
              <div className="flex flex-col gap-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#004730] text-white text-sm font-black flex items-center justify-center shadow-sm">
                      {currentStepIdx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-[#004730] tracking-tight">
                        Step {currentStepIdx + 1} of {steps.length}
                      </span>
                      <span className="text-[10px] font-semibold text-[#64748B]">
                        {completedSteps[currentStepIdx] ? "Completed" : "In progress"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={toggleCurrentStepDone}
                    className={`px-3 py-1.5 rounded-xl text-[10.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                      completedSteps[currentStepIdx]
                        ? "bg-[#006948] text-white shadow-xs"
                        : "neo-button text-[#475569]"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {completedSteps[currentStepIdx] ? "check_circle" : "check"}
                    </span>
                    <span>{completedSteps[currentStepIdx] ? "Done" : "Mark Done"}</span>
                  </button>
                </div>

                {/* Quick Jump Step Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {steps.map((_, idx) => {
                    const isCurrent = idx === currentStepIdx;
                    const isDone = Boolean(completedSteps[idx]);
                    return (
                      <button
                        key={idx}
                        onClick={() => goToStep(idx)}
                        type="button"
                        aria-label={`Go to Step ${idx + 1}`}
                        className={`h-6 min-w-[24px] px-1.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ${
                          isCurrent
                            ? "bg-[#004730] text-white px-3 shadow-xs"
                            : isDone
                            ? "bg-emerald-200/80 text-[#004730]"
                            : "neo-sunken text-[#64748B]"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focused Single-Step Card with Directional Next/Prev Slide */}
              <div className="flex-1 flex flex-col justify-center gap-3 my-auto">
                <article
                  key={`step-card-${currentStepIdx}`}
                  className={`rounded-3xl p-5 bg-[var(--zw-bg)] neo-raised relative overflow-hidden flex flex-col gap-3.5 ${
                    stepDirection === "next" ? "animate-step-next" : "animate-step-prev"
                  }`}
                >
                  {/* Subtle Top Header: Contextual Action Badge + Translucent Watermark Numeral */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full neo-sunken">
                      <span className="material-symbols-outlined text-[14px] text-[#004730]">
                        {stepAction.icon}
                      </span>
                      <span className="text-[10.5px] font-extrabold text-[#004730] tracking-tight">
                        {stepAction.label}
                      </span>
                    </div>

                    {isTimerRunning && timerStepOwner !== null && timerStepOwner !== currentStepIdx ? (
                      <button
                        onClick={() => goToStep(timerStepOwner)}
                        className="text-[10px] font-extrabold text-[#006948] underline cursor-pointer"
                        type="button"
                      >
                        Timer running on Step {timerStepOwner + 1}
                      </button>
                    ) : (
                      <span className="text-[22px] font-black text-[#004730]/15 leading-none select-none tabular-nums">
                        {String(currentStepIdx + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  {/* Emerald Accent Rail + Justified Instruction Text */}
                  <div className="flex gap-3 items-stretch">
                    <div className="w-1 rounded-full bg-[#006948] shrink-0" />
                    <p className="text-[15px] leading-[1.85] font-medium text-[#1E293B] text-justify hyphens-auto flex-1">
                      {highlightStepMeasurements(currentStepText)}
                    </p>
                  </div>

                  {/* Per-Step Ingredients, Canonical Appliances & Optional Small Tools */}
                  {(stepIngredients.length > 0 ||
                    stepTools.appliances.length > 0 ||
                    stepTools.optionalTools.length > 0) && (
                    <div className="pt-2.5 border-t border-black/5 flex flex-col gap-2">
                      {stepIngredients.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] font-bold text-[#64748B] mr-0.5">
                            In this step:
                          </span>
                          {stepIngredients.map((ing) => (
                            <span
                              key={ing}
                              className="px-2 py-0.5 rounded-full neo-sunken text-[9.5px] font-bold text-[#334155]"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}

                      {(stepTools.appliances.length > 0 || stepTools.optionalTools.length > 0) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] font-bold text-[#64748B] mr-0.5">
                            Using:
                          </span>
                          {stepTools.appliances.map((appKey) => (
                            <span
                              key={appKey}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(0,71,48,0.08)] text-[9.5px] font-bold text-[#004730]"
                            >
                              <span className="material-symbols-outlined text-[11px]">
                                {STEP_APPLIANCE_ICONS[appKey] || "skillet"}
                              </span>
                              <span>{CANONICAL_APPLIANCE_LABELS[appKey] || appKey}</span>
                            </span>
                          ))}
                          {stepTools.optionalTools.map((tool) => (
                            <span
                              key={tool}
                              className="px-2 py-0.5 rounded-full neo-sunken text-[9.5px] font-semibold text-[#475569]"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>

                {/* Auto-Detected Step Timer Card (Shown directly under step when time is needed) */}
                {activeStepTimerOption && (
                  <div className="rounded-2xl p-3.5 neo-sunken flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-lg text-[#004730]">
                          timer
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10.5px] font-extrabold text-[#004730] truncate">
                            {timerFinished && isViewingTimerOwner
                              ? "Time's up!"
                              : `Step Timer (${activeStepTimerOption.rawMatch})`}
                          </span>
                          <span className="text-[18px] font-black text-[#0F172A] tabular-nums leading-tight">
                            {formatDuration(displayedSeconds)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={handleStartOrToggleTimer}
                          className="px-3.5 py-2 rounded-xl bg-[#004730] text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isViewingTimerOwner && isTimerRunning ? "pause" : "play_arrow"}
                          </span>
                          <span>
                            {isViewingTimerOwner && isTimerRunning
                              ? "Pause"
                              : isViewingTimerOwner &&
                                remainingSecs !== null &&
                                remainingSecs > 0 &&
                                remainingSecs < activeStepTimerOption.seconds
                              ? "Resume"
                              : "Start"}
                          </span>
                        </button>

                        {isViewingTimerOwner && remainingSecs !== null && (
                          <button
                            onClick={handleResetTimer}
                            className="w-8 h-8 rounded-xl neo-button flex items-center justify-center text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                            title="Reset timer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">replay</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Multiple durations detected in the same step */}
                    {detectedTimers.length > 1 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-black/5">
                        <span className="text-[9.5px] font-bold text-[#64748B]">Durations:</span>
                        {detectedTimers.map((t, idx) => (
                          <button
                            key={t.id}
                            onClick={() => handleSelectTimerOption(idx)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                              idx === selectedTimerIdx
                                ? "bg-[#004730] text-white"
                                : "neo-raised-sm text-[#475569]"
                            }`}
                            type="button"
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Minimal Footer */}
        <footer className="px-5 py-3.5 border-t border-black/5 bg-[var(--zw-bg)] shrink-0">
          {activeSubTab === "ingredients" ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                ref={shopMissingBtnRef}
                onClick={handleAddMissing}
                disabled={recipe.analysis.missingCoreCount === 0 || addedToGrocery}
                className={`h-11 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  recipe.analysis.missingCoreCount === 0 || addedToGrocery
                    ? "neo-sunken text-[#64748B] cursor-not-allowed"
                    : "neo-button text-[#004730]"
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-base">
                  {addedToGrocery ? "check" : "add_shopping_cart"}
                </span>
                <span>
                  {recipe.analysis.missingCoreCount === 0
                    ? "All In Pantry"
                    : addedToGrocery
                    ? "Added to List"
                    : `Shop Missing (${recipe.analysis.missingCoreCount})`}
                </span>
              </button>

              <button
                onClick={() => switchSubTab("steps")}
                className="h-11 rounded-2xl bg-[#006948] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer border-none"
                type="button"
              >
                <span className="material-symbols-outlined text-base">skillet</span>
                <span>Start Cooking</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => goToStep(currentStepIdx - 1)}
                disabled={currentStepIdx === 0}
                className={`h-11 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  currentStepIdx === 0
                    ? "neo-sunken text-[#94A3B8] cursor-not-allowed"
                    : "neo-button text-[#004730] cursor-pointer"
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Previous</span>
              </button>

              <button
                onClick={handleNextStep}
                className="h-11 rounded-2xl bg-[#004730] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer border-none"
                type="button"
              >
                <span>
                  {isLastStep
                    ? recipe.analysis.matchedCoreCount > 0
                      ? "Finish & Update Pantry"
                      : "Finish Cooking"
                    : "Next Step"}
                </span>
                <span className="material-symbols-outlined text-base">
                  {isLastStep ? "task_alt" : "arrow_forward"}
                </span>
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
