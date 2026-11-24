"use client";

import React, { useState } from "react";

export default function KitchenSetupPage() {
  const [viewMode, setViewMode] = useState<"A" | "B" | "DUAL">("DUAL");
  const [appliances, setAppliances] = useState<{ [key: string]: boolean }>({
    stove: true,
    wok: true,
    pot: true,
    blender: true,
    rice_cooker: true,
    oven: true,
    air_fryer: true,
    microwave: true,
  });

  const toggleAppliance = (key: string) => {
    setAppliances((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedCount = Object.values(appliances).filter(Boolean).length;

  const applyPreset = (preset: "ALL" | "DORM" | "AIRFRYER" | "CLEAR") => {
    if (preset === "ALL") {
      setAppliances({
        stove: true,
        wok: true,
        pot: true,
        blender: true,
        rice_cooker: true,
        oven: true,
        air_fryer: true,
        microwave: true,
      });
    } else if (preset === "CLEAR") {
      setAppliances({
        stove: false,
        wok: false,
        pot: false,
        blender: false,
        rice_cooker: false,
        oven: false,
        air_fryer: false,
        microwave: false,
      });
    } else if (preset === "DORM") {
      setAppliances({
        stove: true,
        wok: true,
        pot: false,
        blender: false,
        rice_cooker: true,
        oven: false,
        air_fryer: false,
        microwave: false,
      });
    } else if (preset === "AIRFRYER") {
      setAppliances({
        stove: true,
        wok: true,
        pot: false,
        blender: true,
        rice_cooker: false,
        oven: false,
        air_fryer: true,
        microwave: false,
      });
    }
  };

  const applianceItems = [
    { id: "stove", name: "Stove", img: "/images/appliances/stove.png" },
    { id: "wok", name: "Wok / Pan", img: "/images/appliances/wok.png" },
    { id: "pot", name: "Cooking Pot", img: "/images/appliances/pot.png" },
    { id: "blender", name: "Blender / Chopper", img: "/images/appliances/blender.png" },
    { id: "rice_cooker", name: "Rice Cooker", img: "/images/appliances/rice_cooker.png" },
    { id: "oven", name: "Oven", img: "/images/appliances/oven.png" },
    { id: "air_fryer", name: "Air Fryer", img: "/images/appliances/air_fryer.png" },
    { id: "microwave", name: "Microwave", img: "/images/appliances/microwave.png" },
  ];

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-[#2D3748] p-4 md:p-8 flex flex-col items-center">
      {/* Top View Mode Switcher */}
      <div className="w-full max-w-xl bg-[#E0E5EC] rounded-2xl p-1.5 flex gap-1.5 mb-6 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.65),inset_-4px_-4px_8px_rgba(255,255,255,0.85)]">
        <button
          onClick={() => setViewMode("A")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === "A"
              ? "bg-[#E0E5EC] text-[#004730] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.85)]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span className="material-symbols-outlined text-base">grid_view</span>
          <span>Option A: Real Photo Cards</span>
        </button>
        <button
          onClick={() => setViewMode("B")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === "B"
              ? "bg-[#E0E5EC] text-[#004730] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.85)]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span className="material-symbols-outlined text-base">countertops</span>
          <span>Option B: Real 3D Counter</span>
        </button>
        <button
          onClick={() => setViewMode("DUAL")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === "DUAL"
              ? "bg-[#E0E5EC] text-[#004730] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.85)]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span className="material-symbols-outlined text-base">splitscreen</span>
          <span>Side-by-Side</span>
        </button>
      </div>

      {/* Preset Action Bar */}
      <div className="flex flex-wrap gap-2 justify-center items-center mb-8">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
          Presets:
        </span>
        <button
          onClick={() => applyPreset("ALL")}
          className="text-xs font-bold py-1.5 px-3 rounded-lg bg-[#E0E5EC] text-gray-700 shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] cursor-pointer"
        >
          All 8 (8/8)
        </button>
        <button
          onClick={() => applyPreset("DORM")}
          className="text-xs font-bold py-1.5 px-3 rounded-lg bg-[#E0E5EC] text-gray-700 shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] cursor-pointer"
        >
          Student Dorm (Stove + Rice Cooker)
        </button>
        <button
          onClick={() => applyPreset("AIRFRYER")}
          className="text-xs font-bold py-1.5 px-3 rounded-lg bg-[#E0E5EC] text-gray-700 shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] cursor-pointer"
        >
          Modern Apartment (Stove + Air Fryer + Blender)
        </button>
        <button
          onClick={() => applyPreset("CLEAR")}
          className="text-xs font-bold py-1.5 px-3 rounded-lg bg-[#E0E5EC] text-gray-700 shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] cursor-pointer"
        >
          Clear (0/8)
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full flex flex-wrap gap-8 justify-center items-start">
        {/* ================= OPTION A: REAL PHOTO CARDS ================= */}
        {(viewMode === "A" || viewMode === "DUAL") && (
          <div className="w-full max-w-[420px] bg-[#E0E5EC] rounded-[36px] p-6 shadow-[14px_14px_32px_rgba(163,177,198,0.7),-14px_-14px_32px_rgba(255,255,255,0.9)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center justify-center text-gray-700">
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#004730]">
                Option A: Real Photo Cutouts
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center justify-center text-gray-700">
                <span className="material-symbols-outlined text-base">more_horiz</span>
              </div>
            </div>

            <div className="h-1.5 w-full bg-slate-300/60 rounded-full mb-5 overflow-hidden shadow-[inset_1px_1px_2px_rgba(163,177,198,0.7)]">
              <div className="w-1/2 h-full bg-[#004730] rounded-full"></div>
            </div>

            <div className="mb-5">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-1">
                What's in your Kitchen?
              </h1>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tap each appliance you've got — we'll only suggest recipes you can make.
              </p>
            </div>

            {/* 8-Card Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {applianceItems.map((item) => {
                const isSelected = appliances[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleAppliance(item.id)}
                    className={`p-3.5 rounded-2xl flex flex-col items-center text-center cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-[#E0E5EC] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.7),inset_-4px_-4px_8px_rgba(255,255,255,0.85)] border-2 border-[#004730]/35"
                        : "bg-[#E0E5EC] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.85)]"
                    }`}
                  >
                    <div className="h-[70px] w-full flex items-center justify-center mb-2">
                      <img
                        src={item.img}
                        alt={item.name}
                        className={`max-h-full max-w-full object-contain transition-all duration-200 ${
                          isSelected
                            ? "scale-105 drop-shadow-[0_4px_8px_rgba(0,71,48,0.25)]"
                            : "scale-95 grayscale opacity-55"
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-800 mb-1.5 leading-tight">
                      {item.name}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-[#004730] text-white shadow-sm"
                          : "bg-slate-300/60 text-gray-500"
                      }`}
                    >
                      {isSelected ? "ACTIVE" : "OFF"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selection Counter */}
            <div className="bg-[#E0E5EC] shadow-[inset_4px_4px_7px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] rounded-xl py-2 px-4 flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-xs font-extrabold text-[#004730]">
                {selectedCount} of 8 selected
              </span>
            </div>

            {/* Primary Action Button */}
            <button className="w-full py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs tracking-wide shadow-[6px_6px_14px_rgba(0,71,48,0.4),4px_4px_10px_rgba(163,177,198,0.6),-4px_-4px_10px_rgba(255,255,255,0.9)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2">
              <span>Save Kitchen Profile</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}

        {/* ================= OPTION B: REAL 3D COUNTER SCENE ================= */}
        {(viewMode === "B" || viewMode === "DUAL") && (
          <div className="w-full max-w-[420px] bg-[#E0E5EC] rounded-[36px] p-6 shadow-[14px_14px_32px_rgba(163,177,198,0.7),-14px_-14px_32px_rgba(255,255,255,0.9)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center justify-center text-gray-700">
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#004730]">
                Option B: Real 3D Counter Scene
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center justify-center text-gray-700">
                <span className="material-symbols-outlined text-base">more_horiz</span>
              </div>
            </div>

            <div className="h-1.5 w-full bg-slate-300/60 rounded-full mb-5 overflow-hidden shadow-[inset_1px_1px_2px_rgba(163,177,198,0.7)]">
              <div className="w-1/2 h-full bg-[#004730] rounded-full"></div>
            </div>

            <div className="mb-4">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-1">
                What's in your Kitchen?
              </h1>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tap each appliance you've got — we'll only suggest recipes you can make.
              </p>
            </div>

            {/* Visual Kitchen Stage with Real Image Backdrop */}
            <div className="relative w-full h-[380px] bg-[#D9E1E8] rounded-3xl overflow-hidden mb-4 shadow-[inset_6px_6px_12px_rgba(163,177,198,0.65),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]">
              <img
                src="/images/appliances/kitchen_counter_real.jpg"
                alt="Real Kitchen Counter"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Hotspot: Microwave */}
              <div
                onClick={() => toggleAppliance("microwave")}
                style={{ top: "20%", left: "24%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.microwave
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.microwave
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Microwave
                </span>
              </div>

              {/* Hotspot: Blender */}
              <div
                onClick={() => toggleAppliance("blender")}
                style={{ top: "24%", left: "63%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.blender
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.blender
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Blender
                </span>
              </div>

              {/* Hotspot: Air Fryer */}
              <div
                onClick={() => toggleAppliance("air_fryer")}
                style={{ top: "52%", left: "19%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.air_fryer
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.air_fryer
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Air fryer
                </span>
              </div>

              {/* Hotspot: Stove */}
              <div
                onClick={() => toggleAppliance("stove")}
                style={{ top: "48%", left: "51%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.stove
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.stove
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Stove
                </span>
              </div>

              {/* Hotspot: Wok / Pan */}
              <div
                onClick={() => toggleAppliance("wok")}
                style={{ top: "38%", left: "40%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.wok
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.wok
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Wok / Pan
                </span>
              </div>

              {/* Hotspot: Pot */}
              <div
                onClick={() => toggleAppliance("pot")}
                style={{ top: "48%", left: "80%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.pot
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.pot
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Cooking Pot
                </span>
              </div>

              {/* Hotspot: Rice Cooker */}
              <div
                onClick={() => toggleAppliance("rice_cooker")}
                style={{ top: "28%", left: "82%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.rice_cooker
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.rice_cooker
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Rice Cooker
                </span>
              </div>

              {/* Hotspot: Oven */}
              <div
                onClick={() => toggleAppliance("oven")}
                style={{ top: "75%", left: "51%" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center select-none z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full mb-1 transition-all ${
                    appliances.oven
                      ? "border-[2.5px] border-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.85)] bg-white/20"
                      : "border-2 border-dashed border-gray-400/60 opacity-40 grayscale"
                  }`}
                ></div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all ${
                    appliances.oven
                      ? "bg-[#00E676] text-[#003318] shadow-[0_0_12px_rgba(0,230,118,0.8)] border border-white"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  Oven
                </span>
              </div>
            </div>

            {/* Selection Counter */}
            <div className="bg-[#E0E5EC] shadow-[inset_4px_4px_7px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] rounded-xl py-2 px-4 flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-xs font-extrabold text-[#004730]">
                {selectedCount} of 8 selected
              </span>
            </div>

            {/* Primary Action Button */}
            <button className="w-full py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs tracking-wide shadow-[6px_6px_14px_rgba(0,71,48,0.4),4px_4px_10px_rgba(163,177,198,0.6),-4px_-4px_10px_rgba(255,255,255,0.9)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2">
              <span>Save Kitchen Profile</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
