"use client";

import React, { useState } from "react";

export interface BatchScanItem {
  id: string;
  imageUrl: string;
  status: "queued" | "analyzing" | "ready" | "error";
  decision: "pending" | "approved" | "skipped";
  name: string;
  nameMalay: string;
  category: string;
  emoji: string;
  confidence: number;
  engineUsed: string;
  quantity: number;
  unit: string;
  culinaryNote: string;
}

interface BatchReviewModalProps {
  items: BatchScanItem[];
  onUpdateItem: (id: string, patch: Partial<BatchScanItem>) => void;
  onRecheckGemini: (id: string) => Promise<void>;
  onFinishBatch: (approvedItems: BatchScanItem[]) => void;
  onClose: () => void;
  quantifierList: Array<{ unit: string; en: string }>;
}

export default function BatchReviewModal({
  items,
  onUpdateItem,
  onRecheckGemini,
  onFinishBatch,
  onClose,
  quantifierList,
}: BatchReviewModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [stepDir, setStepDir] = useState<"next" | "prev">("next");
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [isRecheckingId, setIsRecheckingId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const safeIdx = Math.min(currentIdx, Math.max(0, items.length - 1));
  const current = items[safeIdx];

  const approvedCount = items.filter((i) => i.decision === "approved").length;

  const requestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped === safeIdx) return;
    setStepDir(clamped > safeIdx ? "next" : "prev");
    setIsEditingCurrent(false);
    setCurrentIdx(clamped);
  };

  const handleDecision = (decision: "approved" | "skipped") => {
    if (!current) return;
    onUpdateItem(current.id, { decision });
    setIsEditingCurrent(false);

    if (safeIdx < items.length - 1) {
      setStepDir("next");
      setCurrentIdx(safeIdx + 1);
    } else {
      const finalApproved = items
        .map((it) => (it.id === current.id ? { ...it, decision } : it))
        .filter((it) => it.decision === "approved");
      onFinishBatch(finalApproved);
    }
  };

  const handleRecheck = async () => {
    if (!current || isRecheckingId) return;
    setIsRecheckingId(current.id);
    try {
      await onRecheckGemini(current.id);
    } finally {
      setIsRecheckingId(null);
    }
  };

  if (!current) return null;

  const isAnalyzing = current.status === "queued" || current.status === "analyzing" || isRecheckingId === current.id;

  return (
    <div
      className={`absolute inset-0 z-[35] bg-black/45 backdrop-blur-xs flex flex-col justify-end pb-[74px] overflow-hidden ${
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full h-[94%] bg-[var(--zw-bg)] rounded-t-[34px] neo-raised flex flex-col overflow-hidden shadow-2xl ${
          isClosing ? "animate-modal-sheet-slide-out" : "animate-modal-sheet-bounce-in"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Verify Batch Scans"
      >
        {/* Top Header */}
        <header className="px-4 pt-3 pb-2.5 shrink-0">
          <div className="w-10 h-1 neo-sunken rounded-full mx-auto mb-2.5" />

          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-foreground tracking-tight">
                Verify Batch ({safeIdx + 1} of {items.length})
              </h2>
              <p className="text-[10px] font-semibold text-[#006948]">
                Confirm, edit details, or re-check with Gemini
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {approvedCount > 0 && safeIdx < items.length - 1 && (
                <button
                  onClick={() =>
                    onFinishBatch(items.filter((i) => i.decision === "approved"))
                  }
                  className="px-2.5 py-1 rounded-full bg-[#004730] text-white text-[10px] font-extrabold cursor-pointer active:scale-95"
                  type="button"
                >
                  Save {approvedCount} Now
                </button>
              )}
              <button
                onClick={requestClose}
                className="w-8 h-8 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
                type="button"
                aria-label="Close Batch Review"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Step Dots Pill Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
            {items.map((it, idx) => {
              const isCurr = idx === safeIdx;
              const pillCls = isCurr
                ? "bg-[#004730] text-white px-3"
                : it.decision === "approved"
                ? "bg-emerald-200/80 text-[#004730]"
                : it.decision === "skipped"
                ? "bg-rose-200/70 text-rose-700"
                : "neo-sunken text-[#64748B]";
              return (
                <button
                  key={it.id}
                  onClick={() => goTo(idx)}
                  className={`h-6 min-w-[26px] px-2 rounded-full text-[10px] font-extrabold inline-flex items-center justify-center gap-1 shrink-0 transition-all cursor-pointer ${pillCls}`}
                  type="button"
                >
                  <span>{idx + 1}</span>
                  {it.decision === "approved" && (
                    <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Focused One-at-a-Time Verification Card */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 flex flex-col gap-3">
          <div
            key={`batch-card-${current.id}-${safeIdx}`}
            className={`rounded-3xl p-4 neo-raised flex flex-col gap-3 ${
              stepDir === "next" ? "animate-step-next" : "animate-step-prev"
            }`}
          >
            {/* Thumbnail + Engine Badges + Toggle Edit */}
            <div className="flex items-start gap-3">
              <div className="w-20 h-20 rounded-2xl neo-sunken p-1 overflow-hidden shrink-0 relative bg-[#dbe1e8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.imageUrl}
                  alt={current.name}
                  className="w-full h-full object-cover rounded-xl"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-sm">
                  {current.emoji}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded-full neo-sunken text-[9px] font-extrabold text-[#006948]">
                    {isAnalyzing
                      ? "Analyzing..."
                      : current.status === "error"
                      ? "Needs Review"
                      : `${current.engineUsed} • ${current.confidence}%`}
                  </span>
                  <button
                    onClick={() => setIsEditingCurrent((p) => !p)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                      isEditingCurrent ? "bg-[#004730] text-white" : "neo-raised-sm text-[#004730]"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                      {isEditingCurrent ? "check" : "edit"}
                    </span>
                    <span>{isEditingCurrent ? "Done" : "Edit"}</span>
                  </button>
                </div>

                <h3 className="text-base font-extrabold text-foreground leading-snug mt-1.5 truncate">
                  {current.name}
                </h3>
                <p className="text-[11px] font-semibold text-muted truncate">
                  {current.nameMalay || current.category} &bull; {current.quantity} {current.unit}
                </p>
              </div>
            </div>

            {/* Inline Quick Quantity Adjust or Full Edit Fields */}
            {isEditingCurrent ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-black/5">
                <input
                  type="text"
                  value={current.name}
                  onChange={(e) => onUpdateItem(current.id, { name: e.target.value })}
                  placeholder="Ingredient name"
                  className="w-full neo-sunken rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    value={current.quantity}
                    onChange={(e) =>
                      onUpdateItem(current.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="neo-sunken rounded-xl px-3 py-1.5 text-xs font-extrabold text-center text-[#004730] outline-none"
                  />
                  <select
                    value={current.unit}
                    onChange={(e) => onUpdateItem(current.id, { unit: e.target.value })}
                    className="neo-sunken rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-[#004730] outline-none cursor-pointer"
                  >
                    {quantifierList.map((q) => (
                      <option key={q.unit} value={q.unit}>
                        {q.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={current.nameMalay}
                  onChange={(e) => onUpdateItem(current.id, { nameMalay: e.target.value })}
                  placeholder="Local / Malay name"
                  className="w-full neo-sunken rounded-xl px-3 py-1.5 text-[11px] font-semibold text-foreground outline-none"
                />
              </div>
            ) : (
              <div className="neo-sunken rounded-2xl p-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-muted pl-1.5">Portion:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateItem(current.id, { quantity: Math.max(1, current.quantity - 1) })
                    }
                    className="w-7 h-7 rounded-lg neo-raised-sm text-rose-600 font-black flex items-center justify-center cursor-pointer active:scale-90"
                    type="button"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-[#004730] min-w-[68px] text-center">
                    {current.quantity} {current.unit}
                  </span>
                  <button
                    onClick={() => onUpdateItem(current.id, { quantity: current.quantity + 1 })}
                    className="w-7 h-7 rounded-lg neo-raised-sm text-[#004730] font-black flex items-center justify-center cursor-pointer active:scale-90"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Gemini Vision Recheck Action Box */}
            <button
              onClick={handleRecheck}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-3 rounded-2xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #06b6d4 100%)",
              }}
              type="button"
            >
              <span className={`material-symbols-outlined text-sm ${isAnalyzing ? "animate-spin" : ""}`}>
                {isAnalyzing ? "sync" : "auto_awesome"}
              </span>
              <span>{isAnalyzing ? "Analyzing with Gemini Vision..." : "Not Accurate? Re-check with Gemini Vision"}</span>
            </button>
          </div>
        </div>

        {/* Sticky Footer: Skip vs Looks Good / Finish */}
        <footer className="px-4 py-3 border-t border-black/5 flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleDecision("skipped")}
            disabled={isAnalyzing}
            className="h-11 px-4 rounded-2xl neo-button text-rose-600 text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
            <span>Skip</span>
          </button>

          <button
            onClick={() => handleDecision("approved")}
            disabled={isAnalyzing}
            className="flex-1 h-11 rounded-2xl bg-[#004730] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            type="button"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>
              {safeIdx === items.length - 1
                ? `Approve & Add (${approvedCount + 1}) to Pantry`
                : "Looks Good • Next →"}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}
