"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type MealTransitionVariant = "start" | "to-recipes";

interface TransitionStage {
  threshold: number;
  icon: string;
  text: string;
}

interface MealTransitionModalProps {
  variant?: MealTransitionVariant;
  pantryCount?: number;
  cuisineLabels?: string[];
  applianceCount?: number;
  matchCount?: number;
  onComplete: () => void;
}

export default function MealTransitionModal({
  variant = "start",
  pantryCount = 0,
  cuisineLabels = [],
  applianceCount = 1,
  matchCount = 0,
  onComplete,
}: MealTransitionModalProps) {
  const [progress, setProgress] = useState<number>(0);
  const completedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const config = useMemo(() => {
    if (variant === "to-recipes") {
      const stages: TransitionStage[] = [
        {
          threshold: 0,
          icon: "ramen_dining",
          text:
            cuisineLabels.length > 0
              ? `Locking ${cuisineLabels[0]} & flavor profile...`
              : "Locking cuisine profile...",
        },
        {
          threshold: 30,
          icon: "skillet",
          text: `Pairing ${applianceCount} selected appliance${applianceCount === 1 ? "" : "s"}...`,
        },
        {
          threshold: 62,
          icon: "soup_kitchen",
          text: "Matching your pantry readiness...",
        },
        {
          threshold: 86,
          icon: "menu_book",
          text: `Serving ${matchCount} curated match${matchCount === 1 ? "" : "es"}!`,
        },
      ];
      return {
        durationMs: 1100,
        badge: "Recipe Engine",
        title: "Curating Recipe Matches",
        footerLabel: "Filtering catalog",
        stages,
      };
    }

    // Default: "start" (Generate Meals / Cook Tab -> Step 1 Cuisines)
    const stages: TransitionStage[] = [
      {
        threshold: 0,
        icon: "kitchen",
        text: `Scanning ${pantryCount} pantry item${pantryCount === 1 ? "" : "s"}...`,
      },
      {
        threshold: 28,
        icon: "eco",
        text: "Checking fresh ingredients & staples...",
      },
      {
        threshold: 58,
        icon: "restaurant_menu",
        text: "Loading cuisine categories...",
      },
      {
        threshold: 85,
        icon: "verified",
        text: "Cuisine menu ready!",
      },
    ];
    return {
      durationMs: 1200,
      badge: "ZeroWaste Culinary Match",
      title: "Setting Your Table",
      footerLabel: "Optimizing ingredients",
      stages,
    };
  }, [variant, pantryCount, cuisineLabels, applianceCount, matchCount]);

  useEffect(() => {
    completedRef.current = false;
    setProgress(0);
    const startTime = performance.now();
    let rafId = 0;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / config.durationMs) * 100));
      setProgress(pct);

      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        finishTimer = setTimeout(() => {
          onCompleteRef.current();
        }, 120);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [config.durationMs, variant]);

  const activeStageIdx = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < config.stages.length; i++) {
      if (progress >= config.stages[i].threshold) {
        idx = i;
      }
    }
    return idx;
  }, [progress, config.stages]);

  const activeStage = config.stages[activeStageIdx] || config.stages[0];
  const circleCircumference = 2 * Math.PI * 42;
  const strokeDashoffset = circleCircumference * (1 - progress / 100);

  return (
    <div
      id="meal-transition-modal"
      data-transition-variant={variant}
      className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-[#E0E5EC]/95 backdrop-blur-sm animate-pop-up"
    >
      <div className="w-full max-w-[320px] rounded-[32px] neo-raised p-6 flex flex-col items-center justify-center text-center">
        {/* Unique Hero Icon Stage per Transition */}
        {variant === "start" && (
          <div className="relative w-24 h-24 rounded-full neo-sunken flex items-center justify-center mb-4">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="rgba(0, 71, 48, 0.1)"
                strokeWidth="4"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="#006948"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div key={`start-${activeStageIdx}`} className="animate-icon-pop text-[#004730]">
              <span className="material-symbols-outlined text-[38px] leading-none">
                {activeStage.icon}
              </span>
            </div>
          </div>
        )}

        {variant === "to-recipes" && (
          <div className="relative w-24 h-24 rounded-full neo-sunken flex items-center justify-center mb-4 p-2">
            <svg
              className="absolute inset-0 w-full h-full animate-spin-slow"
              viewBox="0 0 96 96"
            >
              <circle
                cx="48"
                cy="48"
                r="43"
                fill="none"
                stroke="rgba(0, 105, 72, 0.35)"
                strokeWidth="2.5"
                strokeDasharray="10 8"
                strokeLinecap="round"
              />
            </svg>
            <div className="w-full h-full rounded-full bg-[#004730] flex items-center justify-center text-white shadow-inner">
              <div key={`rec-${activeStageIdx}`} className="animate-icon-pop">
                <span className="material-symbols-outlined text-[34px] leading-none">
                  {activeStage.icon}
                </span>
              </div>
            </div>
          </div>
        )}

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full neo-sunken text-[9.5px] font-extrabold uppercase tracking-wider text-[#004730] mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse" />
          <span>{config.badge}</span>
        </span>

        <h3 className="text-[16px] font-extrabold text-[#1E293B] tracking-tight mb-1.5">
          {config.title}
        </h3>

        <p
          key={`txt-${variant}-${activeStageIdx}`}
          className="text-xs font-semibold text-[#64748B] min-h-[30px] flex items-center justify-center animate-tab-content"
        >
          {activeStage.text}
        </p>

        {/* Unique Middle Context Strip per Transition */}
        {variant === "start" && (
          <div className="flex items-center justify-center gap-2 mt-1 mb-2">
            <span className="px-2.5 py-1 rounded-xl neo-sunken text-[10px] font-extrabold text-[#004730]">
              {pantryCount} Pantry Ready
            </span>
            <span className="px-2.5 py-1 rounded-xl neo-sunken text-[10px] font-bold text-[#475569]">
              6 Cuisines
            </span>
          </div>
        )}

        {variant === "to-recipes" && (
          <div className="w-full mt-1 mb-2 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {(cuisineLabels.length > 0 ? cuisineLabels.slice(0, 3) : ["All Cuisines"]).map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-full bg-[#004730] text-white text-[9px] font-bold"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="rounded-xl neo-sunken py-1.5 px-2 flex flex-col items-center">
                <span className="text-[13px] font-extrabold text-[#1E293B] leading-none">
                  {applianceCount}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#64748B] mt-1">
                  Tools Active
                </span>
              </div>
              <div className="rounded-xl neo-sunken py-1.5 px-2 flex flex-col items-center">
                <span className="text-[13px] font-extrabold text-[#004730] leading-none">
                  {matchCount}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#006948] mt-1">
                  Recipes Ready
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Carved Neumorphic Progress Track */}
        <div className="w-full h-2.5 rounded-full neo-sunken overflow-hidden my-2.5 p-0.5">
          <div
            className="h-full bg-[#004730] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full px-1 text-[10px] font-semibold text-[#64748B]">
          <span>{config.footerLabel}</span>
          <span className="font-mono text-[#004730] font-bold">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
