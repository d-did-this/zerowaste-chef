"use client";

import React, { useMemo } from "react";

export interface CuisineOption {
  id: string;
  name: string;
  svgFile: string;
}

export const CUISINE_OPTIONS: CuisineOption[] = [
  { id: "any", name: "Any Cuisine", svgFile: "/images/cuisines/svg/any.svg" },
  { id: "malay", name: "Malay", svgFile: "/images/cuisines/svg/malay.svg" },
  { id: "chinese", name: "Chinese", svgFile: "/images/cuisines/svg/chinese.svg" },
  { id: "indian", name: "Indian", svgFile: "/images/cuisines/svg/indian.svg" },
  { id: "sabah-sarawak", name: "Borneo", svgFile: "/images/cuisines/svg/sabah-sarawak.svg" },
  { id: "others", name: "Others", svgFile: "/images/cuisines/svg/others.svg" },
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

interface CuisinePreferenceViewProps {
  cuisinesState: Record<string, boolean>;
  setCuisinesState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  appliancesState: Record<string, boolean>;
  onNext: () => void;
  onBack: () => void;
  matchCount: number;
}

export default function CuisinePreferenceView({
  cuisinesState,
  setCuisinesState,
  appliancesState,
  onNext,
  onBack,
  matchCount,
}: CuisinePreferenceViewProps) {
  const specificKeys = ["malay", "chinese", "indian", "sabah-sarawak", "others"];

  const toggleCuisine = (id: string) => {
    if (id === "any") {
      const willSelect = !cuisinesState["any"];
      setCuisinesState({
        any: willSelect,
        malay: willSelect,
        chinese: willSelect,
        indian: willSelect,
        "sabah-sarawak": willSelect,
        others: willSelect,
      });
    } else {
      const nextSpecific = !cuisinesState[id];
      const updated = {
        ...cuisinesState,
        [id]: nextSpecific,
      };
      const allOthersChecked = specificKeys.every((k) =>
        k === id ? nextSpecific : updated[k]
      );
      updated["any"] = allOthersChecked;
      setCuisinesState(updated);
    }
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
      {/* 1. Header (Inside boundary with clear Pantry return context) */}
      <header className="header-bar">
        <div className="header-left-group">
          <button
            className="header-btn neo-button"
            onClick={onBack}
            title="Back to Pantry"
            aria-label="Back to Pantry"
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "19px" }}>arrow_back</span>
          </button>
          <div className="header-context">
            <span className="header-title">Cuisine Menu</span>
            <span className="header-sub">Back to Pantry</span>
          </div>
        </div>
        <span className="header-step-pill">Step 1 of 3</span>
      </header>

      {/* 2. Scrollable Content Area */}
      <main className="main-scrollable">
        {/* Progress Stepper (MOVED ABOVE Cuisines & Appliances Bar) */}
        <nav className="stepper-stage-nav neo-sunken" aria-label="Creation Steps">
          <div className="stepper-node is-active" id="step-node-1">
            <span className="node-num">1</span>
            <span className="node-label">Cuisines</span>
          </div>
          <div className="stepper-connector" />
          <button className="stepper-node" onClick={onNext} type="button" id="step-node-2">
            <span className="node-num">2</span>
            <span className="node-label">Appliances</span>
          </button>
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
              <div className="pref-chips-container" id="cuisines-chips-row">
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
              <div className="pref-chips-container" id="appliances-chips-row">
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
            <span className="match-num" id="recipe-count-num">{matchCount}</span>
            <span className="match-lbl">Recipes</span>
            <span className="match-sub">Est. Match</span>
          </div>
        </section>

        {/* Prompt Heading */}
        <section className="prompt-section">
          <h1 className="prompt-title">What are you craving today?</h1>
          <p className="prompt-sub">Select your preferred cuisines.</p>
        </section>

        {/* 6 Cuisine Cards Grid */}
        <section className="cuisine-grid" id="cuisine-grid">
          {CUISINE_OPTIONS.map((c) => {
            const isSelected = Boolean(cuisinesState[c.id]);
            return (
              <div
                key={c.id}
                className={`cuisine-card neo-button ${isSelected ? "is-selected" : ""}`}
                id={`cuisine-card-${c.id}`}
                onClick={() => toggleCuisine(c.id)}
                role="checkbox"
                aria-checked={isSelected}
              >
                <div className="card-check-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#FFFFFF", fontWeight: 800 }}>
                    check
                  </span>
                </div>
                <div className="card-img-wrap">
                  <img src={c.svgFile} alt={c.name} className="cuisine-img" />
                </div>
                <div className="cuisine-name">{c.name}</div>
              </div>
            );
          })}
        </section>
      </main>

      {/* 3. Bottom CTA Button ("Choose Appliance Next" thats all) */}
      <footer className="bottom-cta-wrap">
        <button className="cta-button" onClick={onNext} id="cta-button" type="button">
          <span>Choose Appliance Next</span>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
        </button>
      </footer>
    </div>
  );
}
