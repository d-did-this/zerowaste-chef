"use client";

import React, { useMemo, useState } from "react";

export interface ApplianceMeta {
  key: string;
  label: string;
  points: string;
  left: string;
  top: string;
}

export const CANONICAL_APPLIANCES: ApplianceMeta[] = [
  {
    key: "microwave",
    label: "Microwave",
    points: "304,308 228,279 49,306 44,311 44,399 38,431 85,464 124,480 289,440 306,427",
    left: "18.534%",
    top: "23.438%",
  },
  {
    key: "blender",
    label: "Blender",
    points: "373,205 365,214 350,215 339,225 332,227 346,258 357,330 355,348 348,358 341,401 347,415 423,413 433,400 433,392 414,329 417,316 435,303 441,294 446,248 441,241 425,235 425,222 420,215 401,213 394,205",
    left: "41.918%",
    top: "15.191%",
  },
  {
    key: "rice_cooker",
    label: "Rice Cooker",
    points: "522,256 516,261 515,269 506,278 495,282 491,288 490,317 498,327 498,379 478,391 479,397 510,412 578,415 619,408 619,400 628,391 632,381 633,329 640,321 639,286 626,279 604,260 587,253 554,251 534,257",
    left: "60.345%",
    top: "18.924%",
  },
  {
    key: "pot",
    label: "Pot",
    points: "677,374 677,381 693,387 703,400 703,446 708,456 720,464 763,467 830,464 842,449 843,435 852,432 844,428 844,399 853,387 866,384 870,380 867,372 853,372 841,354 830,345 811,337 790,333 787,330 787,321 778,316 760,319 755,333 735,337 714,346 693,371",
    left: "83.297%",
    top: "25.000%",
  },
  {
    key: "air_fryer",
    label: "Air Fryer",
    points: "104,527 93,536 81,558 69,600 67,648 79,704 75,721 86,730 113,734 185,732 204,728 222,703 232,656 231,603 218,556 207,536 192,526 169,522 132,522",
    left: "16.164%",
    top: "64.931%",
  },
  {
    key: "stove",
    label: "Stove",
    points: "296,706 298,711 647,709 621,583 595,581 591,572 561,582 554,570 544,582 517,572 512,581 484,582 480,572 468,572 462,583 447,582 443,572 412,582 405,570 395,582 370,572 361,583 329,582",
    left: "50.862%",
    top: "55.556%",
  },
  {
    key: "wok",
    label: "Frying Pan",
    points: "899,598 894,593 873,595 819,620 796,609 770,604 748,603 711,607 697,611 679,623 678,644 685,659 685,666 697,675 741,683 776,681 797,673 818,654 832,652 820,647 824,636 837,632 865,616 896,608",
    left: "84.914%",
    top: "62.326%",
  },
  {
    key: "oven",
    label: "Oven",
    points: "300,755 298,952 306,1014 640,1013 643,755",
    left: "50.862%",
    top: "76.823%",
  },
];

const APP_NAME_MAP: Record<string, string> = {
  stove: "Stove",
  wok: "Frying Pan",
  pot: "Pot",
  blender: "Blender",
  rice_cooker: "Rice Cooker",
  oven: "Oven",
  air_fryer: "Air Fryer",
  microwave: "Microwave",
};

interface KitchenSetupViewProps {
  cuisinesState: Record<string, boolean>;
  appliancesState: Record<string, boolean>;
  setAppliancesState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onBack: () => void;
  onViewRecipes: () => void;
  matchCount: number;
}

export default function KitchenSetupView({
  cuisinesState,
  appliancesState,
  setAppliancesState,
  onBack,
  onViewRecipes,
  matchCount,
}: KitchenSetupViewProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const toggleAppliance = (key: string) => {
    setAppliancesState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedCuisineNames = useMemo(() => {
    if (cuisinesState.any) {
      return ["All Cuisines (6)"];
    }
    const names: string[] = [];
    if (cuisinesState.malay) names.push("Malay");
    if (cuisinesState.chinese) names.push("Chinese");
    if (cuisinesState.indian) names.push("Indian");
    if (cuisinesState["sabah-sarawak"]) names.push("Borneo");
    if (cuisinesState.others) names.push("Others");
    return names;
  }, [cuisinesState]);

  const selectedAppKeys = useMemo(() => {
    return Object.keys(appliancesState).filter((k) => appliancesState[k]);
  }, [appliancesState]);

  return (
    <div className="meal-flow-scope" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", position: "relative" }}>
      {/* 1. Header (Inside boundary with clear Cuisines return context) */}
      <header className="header-bar">
        <div className="header-left-group">
          <button
            className="header-btn neo-button"
            onClick={onBack}
            title="Back to Cuisines"
            aria-label="Back to Cuisines"
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "19px" }}>arrow_back</span>
          </button>
          <div className="header-context">
            <span className="header-title">Kitchen Setup</span>
            <span className="header-sub">Back to Cuisines</span>
          </div>
        </div>
        <span className="header-step-pill">Step 2 of 3</span>
      </header>

      {/* 2. Scrollable Content Area */}
      <main className="main-scrollable">
        {/* Progress Stepper (MOVED ABOVE Cuisines & Appliances Bar) */}
        <nav className="stepper-stage-nav neo-sunken" aria-label="Creation Steps">
          <button className="stepper-node is-done" onClick={onBack} title="Edit Cuisines" type="button" id="step-node-1">
            <span className="node-num">
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>check</span>
            </span>
            <span className="node-label">Cuisines</span>
          </button>
          <div className="stepper-connector is-done" />
          <div className="stepper-node is-active" id="step-node-2">
            <span className="node-num">2</span>
            <span className="node-label">Appliances</span>
          </div>
          <div className="stepper-connector" />
          <div className="stepper-node" id="step-node-3">
            <span className="node-num">3</span>
            <span className="node-label">Recipes</span>
          </div>
        </nav>

        {/* Preference Summary Box */}
        <section className="preference-summary-card">
          <div className="preference-lines-col">
            {/* Cuisines Block */}
            <div className="pref-block">
              <span className="pref-label">
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>restaurant_menu</span>
                Cuisines:
              </span>
              <div className="pref-chips-container" id="step2-cuisines-chips">
                {selectedCuisineNames.length === 0 ? (
                  <span className="pref-chip-empty">None Selected</span>
                ) : (
                  selectedCuisineNames.map((name) => (
                    <span key={name} className="pref-chip">{name}</span>
                  ))
                )}
              </div>
            </div>

            <div className="pref-divider" />

            {/* Appliances Block */}
            <div className="pref-block">
              <span className="pref-label">
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>microwave</span>
                Appliances:
              </span>
              <div className="pref-chips-container" id="step2-appliances-chips">
                {selectedAppKeys.length >= 6 ? (
                  <span className="pref-chip pref-chip-secondary">{selectedAppKeys.length} Appliances</span>
                ) : selectedAppKeys.length === 0 ? (
                  <span className="pref-chip-empty">None Selected</span>
                ) : (
                  selectedAppKeys.map((k) => (
                    <span key={k} className="pref-chip pref-chip-secondary">{APP_NAME_MAP[k] || k}</span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Embedded Real-time Estimated Match Square */}
          <div className="recipe-match-square">
            <span className="match-num" id="step2-recipe-count">{matchCount}</span>
            <span className="match-lbl">Recipes</span>
            <span className="match-sub">Est. Match</span>
          </div>
        </section>

        {/* Prompt Heading */}
        <section className="prompt-section">
          <h1 className="prompt-title">What would you like using to cook today?</h1>
          <p className="prompt-sub">Tap appliances you want to use today.</p>
        </section>

        {/* Interactive Illustrated Kitchen Stage */}
        <section id="view-panel-b">
          <div id="kitchen-stage" className="kitchen-stage">
            <img
              id="kitchen-bg-img"
              className="kitchen-photo"
              src="/images/appliances/kitchen-appliances.jpg"
              alt="Kitchen Appliances"
            />

            {/* SVG Hotspots Overlay */}
            <svg
              id="kitchen-svg"
              className="hotspot-overlay"
              viewBox="0 0 928 1152"
              preserveAspectRatio="xMidYMid slice"
            >
              {CANONICAL_APPLIANCES.map((a) => {
                const isSelected = Boolean(appliancesState[a.key]);
                return (
                  <polygon
                    key={a.key}
                    id={`poly-${a.key}`}
                    className={`appliance-hotspot ${isSelected ? "is-selected" : ""}`}
                    points={a.points}
                    data-key={a.key}
                    tabIndex={0}
                    role="button"
                    aria-label={a.label}
                    onClick={() => toggleAppliance(a.key)}
                    onMouseEnter={() => setHoveredKey(a.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                );
              })}
            </svg>

            {/* Floating Green Pill Badges */}
            <div id="label-layer" className="label-layer">
              {CANONICAL_APPLIANCES.map((a) => {
                const isSelected = Boolean(appliancesState[a.key]);
                const isHovered = hoveredKey === a.key;
                return (
                  <div
                    key={a.key}
                    id={`pill-${a.key}`}
                    className={`appliance-pill ${isSelected ? "is-selected" : ""} ${isHovered ? "is-hovered" : ""}`}
                    style={{ left: a.left, top: a.top }}
                    data-key={a.key}
                    onClick={() => toggleAppliance(a.key)}
                    onMouseEnter={() => setHoveredKey(a.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  >
                    {a.label}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 3. Bottom CTA Button */}
      <footer className="bottom-cta-wrap">
        <button className="cta-button" onClick={onViewRecipes} id="step2-cta" type="button">
          <span>View Matched Recipes</span>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
        </button>
      </footer>
    </div>
  );
}
