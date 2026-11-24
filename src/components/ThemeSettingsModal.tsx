"use client";

import React from "react";
import { THEME_OPTIONS, ThemeId } from "@/utils/themeStorage";

interface ThemeSettingsModalProps {
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  onClose: () => void;
}

export default function ThemeSettingsModal({
  currentTheme,
  onSelectTheme,
  onClose,
}: ThemeSettingsModalProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-modal-backdrop-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[344px] rounded-[32px] neo-raised bg-[var(--zw-bg)] p-4.5 flex flex-col gap-3.5 shadow-2xl relative max-h-[86%] overflow-y-auto no-scrollbar animate-pop-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Theme Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl neo-sunken flex items-center justify-center text-[#004730] shrink-0">
              <span className="material-symbols-outlined text-lg">palette</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-extrabold text-foreground tracking-tight leading-tight">
                Theme &amp; Style
              </h2>
              <span className="text-[10px] font-semibold text-muted truncate">
                Switch visual mood anytime
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-all cursor-pointer shrink-0"
            type="button"
            aria-label="Close Settings"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Theme Option Cards */}
        <div className="flex flex-col gap-2.5">
          {THEME_OPTIONS.map((t) => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTheme(t.id)}
                className={`w-full rounded-2xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "neo-sunken ring-2 ring-[#006948]"
                    : "neo-raised-sm hover:translate-y-[-1px] active:scale-[0.99]"
                }`}
                type="button"
                aria-pressed={isSelected}
                data-theme-option={t.id}
              >
                {/* Trio Color Swatch Preview */}
                <div className="flex items-center -space-x-1.5 shrink-0 p-1 rounded-xl bg-white/40">
                  {t.swatches.map((hex, i) => (
                    <span
                      key={i}
                      className="w-5 h-5 rounded-full border border-white/90 shadow-xs"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>

                {/* Theme Name & Subtitle */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-foreground leading-snug">
                      {t.name}
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-[1px] rounded-full bg-[#004730] text-white text-[8px] font-black uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted font-medium leading-snug mt-0.5">
                    {t.subtitle}
                  </span>
                </div>

                {/* Selection Radio */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-[#006948] text-white" : "neo-raised-sm text-transparent"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] font-black">check</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Confirm */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[#004730] text-white text-xs font-extrabold active:scale-95 transition-all cursor-pointer shadow-sm"
          type="button"
        >
          Done
        </button>
      </div>
    </div>
  );
}
