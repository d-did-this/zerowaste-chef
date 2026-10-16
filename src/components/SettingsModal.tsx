"use client";

import React, { useState } from "react";
import { Key, Sparkles, X, ExternalLink, Check, Cpu } from "lucide-react";
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
    currentSettings.preferredEngine || "auto"
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
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 overflow-hidden flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Vision AI Settings</h3>
              <p className="text-xs text-slate-400">Model & Engine Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Selection */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Vision Classification Engine
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEngine("cloud")}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
                engine === "cloud" || engine === "auto"
                  ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-md shadow-emerald-500/10"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                  75+ Items
                </span>
              </div>
              <div>
                <div className="text-xs font-bold">Malaysian AI</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Recognizes Serai, Lengkuas, Cili Padi, Bendi & more.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEngine("edge")}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
                engine === "edge"
                  ? "bg-blue-500/10 border-blue-500/50 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                  Offline
                </span>
              </div>
              <div>
                <div className="text-xs font-bold">Edge MobileNet</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  10 Universal Staples (Apple, Egg, Carrot, etc.).
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Gemini API Key input */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Gemini API Key (100% Free)</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-0.5"
            >
              <span>Get Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your key is saved locally in your phone&apos;s browser only. Google AI Studio provides 15 free vision scans per minute.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <span>Save Configuration</span>
          )}
        </button>
      </div>
    </div>
  );
}
