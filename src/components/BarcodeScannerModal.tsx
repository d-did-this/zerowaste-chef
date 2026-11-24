"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export interface BarcodeProductResult {
  barcode: string;
  engine: string;
  name: string;
  nameMalay: string;
  brand: string | null;
  category: string;
  emoji: string;
  confidence: number;
  suggestedQuantity: number;
  suggestedUnit: string;
  imageUrl?: string;
  culinaryNote?: string;
}

interface BarcodeScannerModalProps {
  onClose: () => void;
  onProductFound: (product: BarcodeProductResult) => void;
}

const SAMPLE_BARCODES = [
  { label: "Sardines", code: "9556041601113" },
  { label: "Hazelnut Spread", code: "3017620422003" },
  { label: "Oat Milk", code: "7394376616228" },
];

export default function BarcodeScannerModal({
  onClose,
  onProductFound,
}: BarcodeScannerModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"starting" | "scanning" | "unavailable">("starting");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const resolvedOnceRef = useRef(false);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 300);
  }, [isClosing, onClose]);

  const stopCamera = useCallback(() => {
    try {
      zxingControlsRef.current?.stop();
    } catch {
      // ignore stop errors
    }
    zxingControlsRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const lookupBarcode = useCallback(
    async (rawCode: string) => {
      const cleaned = rawCode.replace(/\s+/g, "").trim();
      if (!/^\d{6,14}$/.test(cleaned)) {
        setErrorMsg("Enter a valid 6 to 14 digit barcode number.");
        return;
      }

      setErrorMsg(null);
      setIsLookingUp(true);
      try {
        const res = await fetch(`/api/barcode?code=${encodeURIComponent(cleaned)}`);
        const json = await res.json().catch(() => null);

        if (res.ok && json?.found && json.data) {
          stopCamera();
          onProductFound({
            barcode: cleaned,
            engine: json.engine || "Open Food Facts Barcode DB",
            ...json.data,
          });
          return;
        }
        resolvedOnceRef.current = false;
        setErrorMsg(json?.error || `No item found for barcode #${cleaned}. Try scanning photo.`);
      } catch {
        resolvedOnceRef.current = false;
        setErrorMsg("Network error looking up barcode. Check connection.");
      } finally {
        setIsLookingUp(false);
      }
    },
    [onProductFound, stopCamera]
  );

  // Start live camera & barcode detection
  useEffect(() => {
    let active = true;
    let rafId: number | null = null;
    let detector: { detect: (el: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } | null = null;

    async function initCameraScanner() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (active) setCameraStatus("unavailable");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraStatus("scanning");

        // Prefer native BarcodeDetector when browser supports it
        const NativeDetector = (
          window as unknown as {
            BarcodeDetector?: new (opts: { formats: string[] }) => {
              detect: (el: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
            };
          }
        ).BarcodeDetector;

        if (NativeDetector) {
          detector = new NativeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
          });

          const tick = async () => {
            if (!active || resolvedOnceRef.current) return;
            if (videoRef.current && videoRef.current.readyState >= 2 && detector) {
              try {
                const hits = await detector.detect(videoRef.current);
                const code = hits.find((h) => h.rawValue)?.rawValue;
                if (code && /^\d{6,14}$/.test(code.trim())) {
                  resolvedOnceRef.current = true;
                  setManualCode(code.trim());
                  await lookupBarcode(code.trim());
                  return;
                }
              } catch {
                // ignore frame decode error
              }
            }
            rafId = requestAnimationFrame(tick);
          };
          rafId = requestAnimationFrame(tick);
        } else if (videoRef.current) {
          // Cross-browser ZXing live decode fallback
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
            if (!active || resolvedOnceRef.current || !result) return;
            const code = result.getText().trim();
            if (/^\d{6,14}$/.test(code)) {
              resolvedOnceRef.current = true;
              setManualCode(code);
              void lookupBarcode(code);
            }
          });
          zxingControlsRef.current = controls;
        }
      } catch {
        if (active) setCameraStatus("unavailable");
      }
    }

    void initCameraScanner();

    return () => {
      active = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      stopCamera();
    };
  }, [lookupBarcode, stopCamera]);

  const handleDecodeFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setIsLookingUp(true);

    try {
      const objectUrl = URL.createObjectURL(file);
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(objectUrl);
      URL.revokeObjectURL(objectUrl);
      const code = result.getText().trim();
      setManualCode(code);
      await lookupBarcode(code);
    } catch {
      setIsLookingUp(false);
      setErrorMsg("Could not read a barcode from that photo. Try typing the number below.");
    }
    e.target.value = "";
  };

  return (
    <div
      className={`absolute inset-0 z-[35] bg-black/45 backdrop-blur-xs flex flex-col justify-end pb-[74px] overflow-hidden ${
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-h-[92%] bg-[var(--zw-bg)] rounded-t-[34px] neo-raised p-4 flex flex-col gap-3 overflow-y-auto no-scrollbar shadow-2xl ${
          isClosing ? "animate-modal-sheet-slide-out" : "animate-modal-sheet-bounce-in"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Barcode Scanner"
      >
        <div className="w-10 h-1 neo-sunken rounded-full mx-auto shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl neo-sunken flex items-center justify-center text-[#004730] shrink-0">
              <span className="material-symbols-outlined text-lg">barcode_scanner</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-foreground leading-tight">
                Barcode Product Lookup
              </h2>
              <p className="text-[10px] font-semibold text-[#006948]">
                Point at EAN/UPC barcode or type digits
              </p>
            </div>
          </div>

          <button
            onClick={requestClose}
            className="w-8 h-8 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-all cursor-pointer shrink-0"
            type="button"
            aria-label="Close Barcode Scanner"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Camera / Viewfinder Area */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${cameraStatus === "scanning" ? "opacity-100" : "opacity-0"}`}
          />

          {/* Scan Reticle Box */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6">
            <div className="w-full max-w-[240px] h-24 rounded-2xl border-2 border-emerald-400/80 relative flex items-center justify-center bg-black/15">
              <div className="w-full h-[2px] bg-emerald-400/90 shadow-[0_0_8px_#34d399] animate-pulse" />
            </div>
            <span className="mt-2 px-2.5 py-0.5 rounded-full bg-black/60 text-[10px] font-bold text-white">
              {cameraStatus === "scanning"
                ? "Scanning live camera for barcode..."
                : cameraStatus === "starting"
                ? "Initializing barcode reader..."
                : "Camera offline — enter digits or upload photo below"}
            </span>
          </div>
        </div>

        {/* Manual Barcode Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void lookupBarcode(manualCode);
          }}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="flex-1 neo-sunken rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#004730]">123</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter barcode digits (e.g. 3017620422003)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-xs font-bold text-foreground placeholder:text-muted/60"
            />
          </div>
          <button
            type="submit"
            disabled={isLookingUp || !manualCode.trim()}
            className="h-10 px-4 rounded-2xl bg-[#004730] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <span className={`material-symbols-outlined text-sm ${isLookingUp ? "animate-spin" : ""}`}>
              {isLookingUp ? "sync" : "search"}
            </span>
            <span>{isLookingUp ? "..." : "Find"}</span>
          </button>
        </form>

        {/* Upload Barcode Image + Quick Sample Chips */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleDecodeFromImage}
            className="hidden"
          />
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl neo-raised-sm text-[10.5px] font-extrabold text-[#004730] inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
            <span>Upload Barcode Image</span>
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            {SAMPLE_BARCODES.map((s) => (
              <button
                key={s.code}
                onClick={() => {
                  setManualCode(s.code);
                  void lookupBarcode(s.code);
                }}
                className="px-2 py-1 rounded-lg neo-sunken text-[9.5px] font-bold text-[#475569] hover:text-[#004730] cursor-pointer"
                title={`Try ${s.code}`}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 px-3 py-2 text-[11px] font-bold text-rose-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
