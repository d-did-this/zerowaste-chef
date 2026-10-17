"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  Sparkles,
  Settings,
  AlertCircle,
  PlusCircle,
  Cpu,
  X,
} from "lucide-react";
import {
  PREDEFINED_CNN_INGREDIENTS,
  RawPrediction,
} from "@/utils/ingredientClassifier";
import {
  runPredefinedCnnClassification,
  PREDEFINED_PRODUCE_CATALOG,
  MobileNetModel,
} from "@/utils/cnnProduceScanner";
import { findMatchingMalaysianIngredient } from "@/utils/malaysianIngredients";
import {
  getAppSettings,
  saveAppSettings,
  AppSettings,
  PantryItem,
  getPantryItems,
  deletePantryItem,
  clearPantry,
} from "@/utils/pantryStorage";
import PantryLoggerModal from "@/components/PantryLoggerModal";
import PantryList from "@/components/PantryList";
import SettingsModal from "@/components/SettingsModal";

interface ActiveResult {
  id?: string;
  name: string;
  nameMalay?: string;
  emoji: string;
  category?: string;
  confidence: number;
  rawLabel: string;
  engineUsed: string;
  topRankings?: Array<{
    name: string;
    nameMalay: string;
    emoji: string;
    confidence: number;
    rawLabel: string;
  }>;
  topPredictions?: RawPrediction[];
  suggestedQuantity?: number;
  suggestedUnit?: string;
  culinaryNote?: string;
}

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<MobileNetModel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cnnStatus, setCnnStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Captured snapshot preview & Active On-Screen Result
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ActiveResult | null>(null);

  // App Settings & Digital Pantry
  const [settings, setSettings] = useState<AppSettings>({ apiKey: "", preferredEngine: "cnn" });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  // Optional manual logger modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalItem, setModalItem] = useState<ActiveResult | null>(null);

  // Load Settings and Digital Pantry on Mount
  useEffect(() => {
    setSettings(getAppSettings());
    setPantryItems(getPantryItems());
  }, []);

  // Quick Mode Switcher Handler
  const handleModeChange = (mode: "cnn" | "hybrid" | "gemini") => {
    const updated = saveAppSettings({ preferredEngine: mode });
    setSettings(updated);
    setActiveResult(null);
  };

  // 1. Initialize TensorFlow.js MobileNet (with v1 fallback for maximum compatibility)
  const initCnnModel = useCallback(async () => {
    try {
      setCnnStatus("loading");
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const mobilenet = await import("@tensorflow-models/mobilenet");

      try {
        const loaded = await mobilenet.load({ version: 2, alpha: 1.0 });
        modelRef.current = loaded as unknown as MobileNetModel;
        setCnnStatus("ready");
      } catch (v2Err) {
        console.warn("MobileNet v2 load failed, attempting v1:", v2Err);
        const fallbackLoaded = await mobilenet.load({ version: 1, alpha: 1.0 });
        modelRef.current = fallbackLoaded as unknown as MobileNetModel;
        setCnnStatus("ready");
      }
    } catch (err: unknown) {
      console.warn("Edge MobileNet init error:", err);
      setCnnStatus("error");
    }
  }, []);

  useEffect(() => {
    initCnnModel();
  }, [initCnnModel]);

  // 2. Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn("Video play error:", e));
          setIsCameraActive(true);
        };
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities?.() as { torch?: boolean }) || {};
        setIsTorchSupported(Boolean(capabilities.torch));
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err instanceof Error ? err.message : "Unable to access camera. Please grant permissions."
      );
      setIsCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && isTorchSupported) {
      try {
        const nextState = !isTorchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (videoTrack as any).applyConstraints({ advanced: [{ torch: nextState }] });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn("Could not toggle torch:", e);
      }
    }
  };

  // Instant Reset / Rescan (No page refresh needed!)
  const handleRescan = () => {
    setCapturedImage(null);
    setActiveResult(null);
    setIsAnalyzing(false);
  };

  // 3. Process Frame with Dedicated Produce CNN Head / Cloud Gemini
  const processFrame = async (
    source: HTMLCanvasElement | HTMLImageElement,
    previewDataUrl: string
  ) => {
    setIsAnalyzing(true);
    setCapturedImage(previewDataUrl);
    setActiveResult(null);

    const activeEngine = settings.preferredEngine || "cnn";

    try {
      // -------------------------------------------------------------
      // 1. CNN ONLY MODE (UTeM Objective b: Predefined Produce Dataset)
      // -------------------------------------------------------------
      if (activeEngine === "cnn") {
        if (!modelRef.current) {
          if (cnnStatus === "loading") {
            setActiveResult({
              name: "CNN Downloading Weights",
              nameMalay: "Memuatkan Model CNN",
              emoji: "⏳",
              confidence: 0,
              rawLabel: "mobilenet_loading",
              engineUsed: "Client-Side CNN (Initializing)",
              culinaryNote: "TensorFlow.js MobileNet weights are downloading to your browser (takes 2-3s). Please wait a moment and tap Rescan.",
            });
            return;
          } else {
            setActiveResult({
              name: "CNN Load Error",
              nameMalay: "Ralat CNN",
              emoji: "⚠️",
              confidence: 0,
              rawLabel: "mobilenet_error",
              engineUsed: "Client-Side CNN",
              culinaryNote: "Failed to download CNN weights. Tap the status badge to retry loading.",
            });
            return;
          }
        }

        // Multi-crop ensemble + color prior + masked produce logit classification
        const cnnResult = await runPredefinedCnnClassification(modelRef.current, source);
        const local = findMatchingMalaysianIngredient(cnnResult.topIngredient.name);

        setActiveResult({
          id: cnnResult.topIngredient.id,
          name: cnnResult.topIngredient.name,
          nameMalay: cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : cnnResult.topIngredient.name),
          emoji: cnnResult.topIngredient.emoji,
          category: cnnResult.topIngredient.category,
          confidence: cnnResult.confidence,
          rawLabel: cnnResult.rawLabel,
          topRankings: cnnResult.topRankings,
          engineUsed: "Client-Side CNN (Predefined Produce Head)",
          suggestedQuantity: 1,
          suggestedUnit: cnnResult.topIngredient.defaultUnit || (local ? local.defaultUnit : "pcs"),
          culinaryNote: `Classified client-side via MobileNet CNN. ImageNet Produce match: "${cnnResult.rawLabel}". (Fulfills UTeM Objective b).`,
        });
        return;
      }

      // -------------------------------------------------------------
      // 2. GEMINI ONLY MODE (75+ Malaysian Culinary Database)
      // -------------------------------------------------------------
      if (activeEngine === "gemini") {
        try {
          const res = await fetch("/api/classify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-gemini-key": settings.apiKey || "",
            },
            body: JSON.stringify({
              image: previewDataUrl,
              apiKey: settings.apiKey,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setActiveResult({
                ...json.data,
                rawLabel: json.data.name,
                engineUsed: "Gemini Vision AI (75+ Malaysian)",
              });
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Gemini Vision call failed:", apiErr);
        }

        setActiveResult({
          name: "Gemini Vision Unavailable",
          nameMalay: "Gemini Vision Tidak Tersedia",
          emoji: "⚠️",
          confidence: 0,
          rawLabel: "gemini_error",
          engineUsed: "Gemini Vision",
          culinaryNote: "Could not reach Gemini Vision API. Check your internet connection or enter an API key in Settings.",
        });
        return;
      }

      // -------------------------------------------------------------
      // 3. HYBRID MODE (Fast Local CNN first, escalate to Gemini)
      // -------------------------------------------------------------
      if (activeEngine === "hybrid") {
        if (modelRef.current) {
          const cnnResult = await runPredefinedCnnClassification(modelRef.current, source);
          if (cnnResult.confidence >= 45) {
            const local = findMatchingMalaysianIngredient(cnnResult.topIngredient.name);
            setActiveResult({
              id: cnnResult.topIngredient.id,
              name: cnnResult.topIngredient.name,
              nameMalay: cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : cnnResult.topIngredient.name),
              emoji: cnnResult.topIngredient.emoji,
              category: cnnResult.topIngredient.category,
              confidence: cnnResult.confidence,
              rawLabel: cnnResult.rawLabel,
              topRankings: cnnResult.topRankings,
              engineUsed: "Hybrid: CNN MobileNet (Instant Local)",
              suggestedQuantity: 1,
              suggestedUnit: cnnResult.topIngredient.defaultUnit || (local ? local.defaultUnit : "pcs"),
              culinaryNote: `Matched locally with CNN MobileNet (${cnnResult.confidence}%). Instant edge execution with 0 API delay.`,
            });
            return;
          }
        }

        // Auto-escalate to Gemini
        try {
          const res = await fetch("/api/classify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-gemini-key": settings.apiKey || "",
            },
            body: JSON.stringify({
              image: previewDataUrl,
              apiKey: settings.apiKey,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setActiveResult({
                ...json.data,
                rawLabel: json.data.name,
                engineUsed: "Hybrid: Gemini Vision (Cloud Escalated)",
              });
              return;
            }
          }
        } catch (escalateErr) {
          console.warn("Hybrid Gemini escalation error:", escalateErr);
        }

        setActiveResult({
          name: "No Identification",
          nameMalay: "Tidak Dikenalpasti",
          emoji: "🔍",
          confidence: 0,
          rawLabel: "none",
          engineUsed: "Hybrid",
          culinaryNote: "Neither engine identified this item. Try adjusting lighting or scanning closer.",
        });
      }
    } catch (e) {
      console.error("Classification failure:", e);
      setActiveResult({
        name: "Scanning Error",
        nameMalay: "Ralat Pengimbasan",
        emoji: "❌",
        confidence: 0,
        rawLabel: "error",
        engineUsed: "Error",
        culinaryNote: "An error occurred while scanning. Tap Rescan to try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Capture Frame from Live Camera (Pre-processed Center Crop)
  const handleSnapAndScan = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 640;
    canvas.height = 640;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    // Apply color contrast & saturation enhancement
    ctx.filter = "contrast(1.12) brightness(1.02) saturate(1.18)";
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 640, 640);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    processFrame(canvas, dataUrl);
  };

  // 5. Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      let resolved = false;

      const finishLoad = () => {
        if (!resolved) {
          resolved = true;
          processFrame(img, dataUrl);
        }
      };

      img.onload = finishLoad;
      img.onerror = () => {
        if (!resolved) {
          resolved = true;
          setIsAnalyzing(false);
        }
      };
      img.src = dataUrl;
      if (img.complete) {
        finishLoad();
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 6. Handle Manual Add
  const handleAddManual = () => {
    setModalItem({
      name: "Bawang Merah",
      nameMalay: "Bawang Merah",
      emoji: "🧅",
      category: "Aromatics & Spices",
      confidence: 100,
      rawLabel: "manual",
      suggestedQuantity: 3,
      suggestedUnit: "biji",
      culinaryNote: "Manually entered.",
      engineUsed: "Manual Input",
    });
    setIsModalOpen(true);
  };

  const handleItemAdded = (newItem: PantryItem) => {
    setPantryItems((prev) => [newItem, ...prev.filter((p) => p.id !== newItem.id)]);
    handleRescan();
  };

  const handleDeleteItem = (id: string) => {
    deletePantryItem(id);
    setPantryItems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    clearPantry();
    setPantryItems([]);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-3">
      {/* 3-Way Mode Switcher: CNN Only / Hybrid / Gemini Only */}
      <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between gap-1">
        <button
          onClick={() => handleModeChange("cnn")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            settings.preferredEngine === "cnn"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Cpu className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">CNN Only (10)</span>
        </button>

        <button
          onClick={() => handleModeChange("hybrid")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            settings.preferredEngine === "hybrid"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Zap className="w-3.5 h-3.5 flex-shrink-0 fill-current" />
          <span className="truncate">Hybrid (Both)</span>
        </button>

        <button
          onClick={() => handleModeChange("gemini")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            settings.preferredEngine === "gemini"
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm shadow-purple-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 fill-current" />
          <span className="truncate">Gemini (75+)</span>
        </button>
      </div>

      {/* Mode Helper Cards */}
      {settings.preferredEngine === "cnn" && (
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-300">
                UTeM Objective (b) • 10 Predefined CNN Produce
              </span>
            </div>
            {/* CNN Status Badge */}
            <span
              onClick={cnnStatus === "error" ? initCnnModel : undefined}
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 cursor-pointer ${
                cnnStatus === "ready"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : cnnStatus === "loading"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              <span>●</span>
              <span>
                {cnnStatus === "ready"
                  ? "CNN Ready"
                  : cnnStatus === "loading"
                  ? "Loading Weights..."
                  : "CNN Error (Retry)"}
              </span>
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Target domain constrained strictly to the 10 produce classes via client-side MobileNet logit masking:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PREDEFINED_PRODUCE_CATALOG.slice(0, 10).map((item) => (
              <span
                key={item.id}
                className="px-2 py-0.5 rounded-lg bg-blue-950/80 border border-blue-800/60 text-[11px] text-blue-200 font-semibold"
              >
                {item.emoji} {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {settings.preferredEngine === "hybrid" && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-2.5 animate-in fade-in duration-200">
          <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 fill-current" />
          <div>
            <span className="text-xs font-bold text-emerald-300">
              Hybrid Vision Pipeline (Recommended)
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Instant CNN recognition (&lt;50ms) for common produce. Automatically escalates to Gemini Vision for 75+ Malaysian culinary items (Cili Padi, Lemongrass, Lengkuas, etc.).
            </p>
          </div>
        </div>
      )}

      {settings.preferredEngine === "gemini" && (
        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start space-x-2.5 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5 fill-current" />
          <div>
            <span className="text-xs font-bold text-purple-300">
              Gemini Vision AI (75+ Malaysian Database)
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Cloud multi-modal AI recognizing regional aromatics, vegetables, proteins, and pantry staples with Malaysian cooking units.
            </p>
          </div>
        </div>
      )}

      {/* Viewport Card */}
      <div className="relative w-full h-[440px] sm:h-[480px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  settings.preferredEngine === "cnn"
                    ? "bg-blue-400"
                    : settings.preferredEngine === "gemini"
                    ? "bg-purple-400"
                    : "bg-emerald-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  settings.preferredEngine === "cnn"
                    ? "bg-blue-500"
                    : settings.preferredEngine === "gemini"
                    ? "bg-purple-500"
                    : "bg-emerald-500"
                }`}
              ></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              {settings.preferredEngine === "cnn"
                ? "CNN Produce Head (10)"
                : settings.preferredEngine === "gemini"
                ? "Gemini (75+ Local)"
                : "Hybrid Vision Mode"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700/60 shadow-lg active:scale-95 transition-all"
              title="AI Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video / Captured Image Container */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedImage}
              alt="Captured Frame"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? "opacity-100" : "opacity-0"
              }`}
            />
          )}

          {/* Center Target Box */}
          {!capturedImage && isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div
                className={`relative w-60 h-60 rounded-3xl border-2 border-dashed flex items-center justify-center ${
                  settings.preferredEngine === "cnn"
                    ? "border-blue-500/40"
                    : settings.preferredEngine === "gemini"
                    ? "border-purple-500/40"
                    : "border-emerald-500/40"
                }`}
              >
                {/* 4 Corner Markers */}
                <div
                  className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl ${
                    settings.preferredEngine === "cnn"
                      ? "border-blue-400"
                      : settings.preferredEngine === "gemini"
                      ? "border-purple-400"
                      : "border-emerald-400"
                  }`}
                />
                <div
                  className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl ${
                    settings.preferredEngine === "cnn"
                      ? "border-blue-400"
                      : settings.preferredEngine === "gemini"
                      ? "border-purple-400"
                      : "border-emerald-400"
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl ${
                    settings.preferredEngine === "cnn"
                      ? "border-blue-400"
                      : settings.preferredEngine === "gemini"
                      ? "border-purple-400"
                      : "border-emerald-400"
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-xl ${
                    settings.preferredEngine === "cnn"
                      ? "border-blue-400"
                      : settings.preferredEngine === "gemini"
                      ? "border-purple-400"
                      : "border-emerald-400"
                  }`}
                />

                {/* Laser scan animation */}
                <div
                  className={`absolute inset-x-3 h-0.5 animate-pulse ${
                    settings.preferredEngine === "cnn"
                      ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#60a5fa]"
                      : settings.preferredEngine === "gemini"
                      ? "bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#c084fc]"
                      : "bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                  }`}
                />
              </div>
              <p className="mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-slate-300 border border-slate-800">
                {settings.preferredEngine === "cnn"
                  ? "Center produce inside box"
                  : "Place kitchen ingredient inside box"}
              </p>
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-12 h-12 border-4 rounded-full animate-spin ${
                  settings.preferredEngine === "cnn"
                    ? "border-blue-500/20 border-t-blue-500"
                    : settings.preferredEngine === "gemini"
                    ? "border-purple-500/20 border-t-purple-500"
                    : "border-emerald-500/20 border-t-emerald-500"
                }`}
              />
              <div className="text-center px-4">
                <h4 className="text-sm font-bold text-white">
                  {settings.preferredEngine === "cnn"
                    ? "Evaluating Produce with CNN"
                    : settings.preferredEngine === "gemini"
                    ? "Analyzing with Gemini Vision AI"
                    : "Running Hybrid Classification"}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings.preferredEngine === "cnn"
                    ? "Multi-scale crops + masked produce softmax..."
                    : settings.preferredEngine === "gemini"
                    ? "Comparing against 75+ Malaysian culinary staples..."
                    : "Testing local CNN & Malaysian vision..."}
                </p>
              </div>
            </div>
          )}

          {/* Quick Camera Controls Floating (Right) */}
          {!capturedImage && (
            <div className="absolute right-3 top-14 z-20 flex flex-col space-y-2.5">
              <button
                onClick={flipCamera}
                disabled={!isCameraActive}
                className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 text-white shadow-lg active:scale-95 transition-all disabled:opacity-40"
                title="Flip Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {isTorchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all ${
                    isTorchOn
                      ? "bg-amber-500 border-amber-400 text-slate-950"
                      : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-white"
                  }`}
                  title="Flashlight"
                >
                  {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && !capturedImage && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <h4 className="text-sm font-bold text-white">Camera Access Required</h4>
              <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl"
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Bottom Shutter & Upload Actions */}
        <div className="relative z-20 p-3 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between gap-2">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload</span>
          </button>

          {/* Primary Action Button: Snap & Scan or Rescan */}
          {capturedImage ? (
            <button
              onClick={handleRescan}
              className="flex-[1.4] py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white text-xs font-black tracking-wide shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Rescan (Live Feed)</span>
            </button>
          ) : (
            <button
              onClick={handleSnapAndScan}
              disabled={!isCameraActive || isAnalyzing}
              className={`flex-[1.4] py-3 px-4 rounded-2xl text-slate-950 text-xs font-black tracking-wide shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-40 ${
                settings.preferredEngine === "cnn"
                  ? "bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-300 hover:to-indigo-300 shadow-blue-500/20"
                  : settings.preferredEngine === "gemini"
                  ? "bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 shadow-purple-500/20"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20"
              }`}
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Snap & Scan</span>
            </button>
          )}

          {/* Manual Entry Fallback Button */}
          <button
            onClick={handleAddManual}
            disabled={isAnalyzing}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="Manual Text Fallback"
          >
            <PlusCircle className="w-5 h-5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INLINE RESULT CARD (Produce Domain Only, No Crates/Dogs) */}
      {/* ======================================================== */}
      {activeResult && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner">
                {activeResult.emoji}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black text-white">
                    {activeResult.nameMalay || activeResult.name}
                  </h3>
                  {activeResult.confidence > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                      {activeResult.confidence}% Match
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {activeResult.name}
                </p>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-bold text-slate-300 border border-slate-800">
                    {activeResult.engineUsed}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRescan}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close & Rescan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Produce Rankings Breakdown */}
          {activeResult.topRankings && activeResult.topRankings.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col space-y-1.5 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Top Produce Head Rankings</span>
                <span className="text-blue-400 font-mono text-[10px]">MobileNet Logits</span>
              </div>
              <div className="space-y-1.5 pt-0.5">
                {activeResult.topRankings.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                      <span>{p.emoji}</span>
                      <span>{p.name} ({p.nameMalay})</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {p.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Culinary / Objective Note */}
          {activeResult.culinaryNote && (
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              {activeResult.culinaryNote}
            </p>
          )}

          {/* Action Row: Big Rescan Button + Optional Pantry Save */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRescan}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-xs tracking-wide shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Scan Next Item (Rescan)</span>
            </button>

            <button
              onClick={() => {
                setModalItem(activeResult);
                setIsModalOpen(true);
              }}
              className="py-3 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 active:scale-95 transition-all flex items-center space-x-1"
              title="Save to Pantry (Optional)"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px]">Add to Pantry</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Digital Pantry List */}
      <PantryList
        items={pantryItems}
        onDeleteItem={handleDeleteItem}
        onClearAll={handleClearAll}
      />

      {/* Optional Detection & Logging Modal */}
      {isModalOpen && modalItem && (
        <PantryLoggerModal
          initialData={modalItem}
          onClose={() => setIsModalOpen(false)}
          onItemAdded={handleItemAdded}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          currentSettings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}
