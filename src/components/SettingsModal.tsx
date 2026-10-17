"use client";

import React, { useState } from "react";
import { Key, X, ExternalLink, Check, Cpu, Zap, Sparkles } from "lucide-react";
import { AppSettings, saveAppSettings } from "@/utils/pantryStorage";

interface SettingsModalProps {
  currentSettings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
}

export default function SettingsModal({
  currentSettings,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState<string>(currentSettings.apiKey || "");
  const [engine, setEngine] = useState<AppSettings["preferredEngine"]>(
    currentSettings.preferredEngine || "cnn"
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    const updated = saveAppSettings({
      apiKey: apiKey.trim(),
      preferredEngine: engine,
    });
    setIsSaved(true);
    onSave(updated);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-md bg-black border border-zinc-800 rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vision Engine Config</h3>
            <p className="text-[11px] text-zinc-500">Pipeline & Model Parameters</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Selection (3 Modes) */}
        <div className="flex flex-col space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-zinc-400">
            Active Vision Mode
          </label>
          <div className="grid grid-cols-1 gap-2">
            {/* 1. CNN Only */}
            <button
              type="button"
              onClick={() => setEngine("cnn")}
              className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                engine === "cnn"
                  ? "bg-zinc-900 border-white text-white"
                  : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800"
              }`}
            >
              <Cpu className="w-4 h-4 mt-0.5 text-zinc-300" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">CNN Only (10 Staples)</div>
                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded text-zinc-300">
                    Client-Side
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 leading-tight mt-1">
                  100% in-browser MobileNet inference. Constrained to the 10 produce classes.
                </div>
              </div>
            </button>

            {/* 2. Hybrid (Recommended) */}
            <button
              type="button"
              onClick={() => setEngine("hybrid")}
              className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                engine === "hybrid"
                  ? "bg-zinc-900 border-white text-white"
                  : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800"
              }`}
            >
              <Zap className="w-4 h-4 mt-0.5 text-zinc-300" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">Hybrid Mode (Auto)</div>
                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded text-zinc-300">
                    Dual Engine
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 leading-tight mt-1">
                  Local CNN pass first (&lt;50ms). Escalates to Gemini for 75+ Malaysian produce.
                </div>
              </div>
            </button>

            {/* 3. Gemini Only */}
            <button
              type="button"
              onClick={() => setEngine("gemini")}
              className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                engine === "gemini"
                  ? "bg-zinc-900 border-white text-white"
                  : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800"
              }`}
            >
              <Sparkles className="w-4 h-4 mt-0.5 text-zinc-300" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">Gemini Only (75+)</div>
                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded text-zinc-300">
                    Cloud Vision
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 leading-tight mt-1">
                  Direct multi-modal recognition of Cili Padi, Serai, Lengkuas, Bendi & pasar staples.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Gemini API Key input */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
              <Key className="w-3 h-3 text-zinc-400" />
              <span>Google AI Studio Key</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-zinc-400 hover:text-white underline flex items-center space-x-0.5"
            >
              <span>Get Key</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white font-mono"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5"
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Configuration Saved</span>
            </>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </div>
    </div>
  );
}
