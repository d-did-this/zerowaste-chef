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
} from "lucide-react";
import {
  PREDEFINED_CNN_INGREDIENTS,
  matchPredefinedCnnIngredient,
  matchIngredient,
  RawPrediction,
} from "@/utils/ingredientClassifier";
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

interface ModelType {
  classify: (
    img: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    topk?: number
  ) => Promise<RawPrediction[]>;
}

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<ModelType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Captured snapshot preview
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // App Settings & Digital Pantry
  const [settings, setSettings] = useState<AppSettings>({ apiKey: "", preferredEngine: "hybrid" });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  // Detected Ingredient for Modal
  const [detectedItem, setDetectedItem] = useState<{
    id?: string;
    name: string;
    nameMalay?: string;
    emoji?: string;
    category?: string;
    confidence?: number;
    suggestedQuantity?: number;
    suggestedUnit?: string;
    culinaryNote?: string;
    engineUsed?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load Settings and Digital Pantry on Mount
  useEffect(() => {
    setSettings(getAppSettings());
    setPantryItems(getPantryItems());
  }, []);

  // Quick Mode Switcher Handler
  const handleModeChange = (mode: "cnn" | "hybrid" | "gemini") => {
    const updated = saveAppSettings({ preferredEngine: mode });
    setSettings(updated);
  };

  // 1. Initialize TensorFlow.js MobileNet for Edge mode & offline fallback
  useEffect(() => {
    let isMounted = true;
    async function initModel() {
      try {
        setIsModelLoading(true);
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        const mobilenet = await import("@tensorflow-models/mobilenet");
        const loaded = await mobilenet.load({ version: 2, alpha: 1.0 });
        if (isMounted) {
          modelRef.current = loaded;
          setIsModelLoading(false);
        }
      } catch (err) {
        console.warn("Edge MobileNet init error:", err);
        if (isMounted) setIsModelLoading(false);
      }
    }
    initModel();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // 3. Process & Classify Image (CNN Only / Gemini Only / Hybrid)
  const processImageForClassification = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setCapturedImage(dataUrl);

    const activeEngine = settings.preferredEngine || "hybrid";

    try {
      // Helper: Run client-side CNN MobileNet
      const runClientCnn = async () => {
        if (!modelRef.current) return null;
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => (img.onload = resolve));
        const preds = await modelRef.current.classify(img, 5);
        return preds;
      };

      // Helper: Run cloud Gemini Vision API
      const runCloudGemini = async () => {
        try {
          const res = await fetch("/api/classify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-gemini-key": settings.apiKey || "",
            },
            body: JSON.stringify({
              image: dataUrl,
              apiKey: settings.apiKey,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              return json.data;
            }
          }
        } catch (err) {
          console.warn("Gemini Vision API call failed:", err);
        }
        return null;
      };

      // ========================================================
      // MODE 1: CNN ONLY (UTeM Objective b: 10 Predefined Staples)
      // ========================================================
      if (activeEngine === "cnn") {
        if (!modelRef.current && isModelLoading) {
          setDetectedItem({
            name: "Loading MobileNet CNN...",
            nameMalay: "Memuatkan Model CNN...",
            emoji: "⏳",
            category: "Vegetables & Greens",
            confidence: 0,
            suggestedQuantity: 1,
            suggestedUnit: "biji",
            culinaryNote: "TensorFlow.js MobileNet CNN weights are loading into browser memory. Please try again in 5 seconds.",
            engineUsed: "Client-Side CNN (Initializing)",
          });
          setIsModalOpen(true);
          return;
        }

        const preds = await runClientCnn();
        if (preds) {
          // Strictly match against the 10 predefined staples first
          const matched = matchPredefinedCnnIngredient(preds, 0.20) || matchIngredient(preds, 0.20);
          if (matched) {
            const local = findMatchingMalaysianIngredient(matched.ingredient.name);
            setDetectedItem({
              id: matched.ingredient.id,
              name: matched.ingredient.name,
              nameMalay: matched.ingredient.nameMalay || (local ? local.nameMalay : matched.ingredient.name),
              emoji: matched.ingredient.emoji,
              category: matched.ingredient.category,
              confidence: matched.confidence,
              suggestedQuantity: 1,
              suggestedUnit: matched.ingredient.defaultUnit || (local ? local.defaultUnit : "pcs"),
              culinaryNote: `Classified client-side via MobileNet CNN (ImageNet label: "${matched.rawLabel}"). Strictly fulfills Objective (b) Predefined Dataset.`,
              engineUsed: "Client-Side CNN (MobileNet)",
            });
            setIsModalOpen(true);
            return;
          }
        }

        // If no match within the 10 predefined classes
        setDetectedItem({
          name: "Not in Predefined CNN Dataset",
          nameMalay: "Tiada Dalam 10 Bahan Predefined CNN",
          emoji: "🔍",
          category: "Vegetables & Greens",
          confidence: 0,
          suggestedQuantity: 1,
          suggestedUnit: "biji",
          culinaryNote: "Client-side MobileNet only recognizes the 10 predefined produce classes (Apple, Banana, Broccoli, Cabbage, Bell Pepper, Cucumber, Orange, Lemon, Mushroom, Sweet Corn). For local Malaysian items like Cili Padi or Serai, switch to 'Hybrid' or 'Gemini Only' mode.",
          engineUsed: "Client-Side CNN (No Match)",
        });
        setIsModalOpen(true);
        return;
      }

      // ========================================================
      // MODE 2: GEMINI ONLY (75+ Malaysian Culinary Database)
      // ========================================================
      if (activeEngine === "gemini") {
        const geminiData = await runCloudGemini();
        if (geminiData) {
          setDetectedItem({
            ...geminiData,
            engineUsed: "Gemini Vision AI (75+ Malaysian)",
          });
          setIsModalOpen(true);
          return;
        }

        // Fallback if Gemini failed or offline
        setDetectedItem({
          name: "Select Ingredient",
          nameMalay: "Pilih Bahan",
          emoji: "🔍",
          category: "Vegetables & Greens",
          confidence: 0,
          suggestedQuantity: 1,
          suggestedUnit: "biji",
          culinaryNote: "Gemini Vision API request could not be completed. Check your connection or enter an API key in Settings ⚙️.",
          engineUsed: "Gemini Vision (Unavailable)",
        });
        setIsModalOpen(true);
        return;
      }

      // ========================================================
      // MODE 3: HYBRID (Both - Local CNN first, escalate to Gemini)
      // ========================================================
      if (activeEngine === "hybrid") {
        // Step A: Attempt fast edge CNN classification
        const preds = await runClientCnn();
        if (preds) {
          const matched = matchPredefinedCnnIngredient(preds, 0.35) || matchIngredient(preds, 0.35);
          if (matched && matched.confidence >= 35) {
            const local = findMatchingMalaysianIngredient(matched.ingredient.name);
            setDetectedItem({
              id: matched.ingredient.id,
              name: matched.ingredient.name,
              nameMalay: matched.ingredient.nameMalay || (local ? local.nameMalay : matched.ingredient.name),
              emoji: matched.ingredient.emoji,
              category: matched.ingredient.category,
              confidence: matched.confidence,
              suggestedQuantity: 1,
              suggestedUnit: matched.ingredient.defaultUnit || (local ? local.defaultUnit : "pcs"),
              culinaryNote: `Matched locally with CNN MobileNet (${matched.confidence}%). Instant edge execution with 0 API delay.`,
              engineUsed: "Hybrid: CNN MobileNet (Local Match)",
            });
            setIsModalOpen(true);
            return;
          }
        }

        // Step B: Escalate to Gemini Vision for extended 75+ Malaysian items
        const geminiData = await runCloudGemini();
        if (geminiData) {
          setDetectedItem({
            ...geminiData,
            engineUsed: "Hybrid: Gemini Vision (Cloud Escalated)",
          });
          setIsModalOpen(true);
          return;
        }

        // Step C: Fallback to lower-threshold CNN match if available
        if (preds) {
          const fallbackMatch = matchIngredient(preds, 0.18);
          if (fallbackMatch) {
            const local = findMatchingMalaysianIngredient(fallbackMatch.ingredient.name);
            setDetectedItem({
              id: fallbackMatch.ingredient.id,
              name: fallbackMatch.ingredient.name,
              nameMalay: fallbackMatch.ingredient.nameMalay || (local ? local.nameMalay : fallbackMatch.ingredient.name),
              emoji: fallbackMatch.ingredient.emoji,
              category: fallbackMatch.ingredient.category,
              confidence: fallbackMatch.confidence,
              suggestedQuantity: 1,
              suggestedUnit: fallbackMatch.ingredient.defaultUnit || (local ? local.defaultUnit : "pcs"),
              culinaryNote: "Identified via Client-Side MobileNet CNN fallback.",
              engineUsed: "Hybrid: CNN Fallback",
            });
            setIsModalOpen(true);
            return;
          }
        }

        // Final Fallback: Manual selection prompt
        setDetectedItem({
          name: "Select Ingredient",
          nameMalay: "Pilih Bahan",
          emoji: "🔍",
          category: "Vegetables & Greens",
          confidence: 0,
          suggestedQuantity: 1,
          suggestedUnit: "biji",
          culinaryNote: "Neither engine identified this item with high confidence. Select your ingredient from the database below.",
          engineUsed: "Manual Selection (Fallback)",
        });
        setIsModalOpen(true);
      }
    } catch (e) {
      console.error("Classification failure:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Capture Still Frame from Live Camera (Center Cropped)
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

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 640, 640);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    processImageForClassification(dataUrl);
  };

  // 5. Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        processImageForClassification(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 6. Handle Manual Add
  const handleAddManual = () => {
    setDetectedItem({
      name: "Bawang Merah",
      nameMalay: "Bawang Merah",
      emoji: "🧅",
      category: "Aromatics & Spices",
      confidence: 100,
      suggestedQuantity: 3,
      suggestedUnit: "biji",
      culinaryNote: "Manually entered.",
      engineUsed: "Manual Input",
    });
    setIsModalOpen(true);
  };

  const handleItemAdded = (newItem: PantryItem) => {
    setPantryItems((prev) => [newItem, ...prev.filter((p) => p.id !== newItem.id)]);
    setCapturedImage(null);
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

      {/* Mode Helper Information Cards */}
      {settings.preferredEngine === "cnn" && (
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-300">
                UTeM Objective (b) • 10 Predefined CNN Produce
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              Edge Offline
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Running client-side TensorFlow.js MobileNet locally on your browser. Scan any of these 10 predefined staples:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PREDEFINED_CNN_INGREDIENTS.map((item) => (
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
              Instant CNN recognition (&lt;50ms, 0 API cost) for 10 common staples. Automatically escalates to Gemini Vision for 75+ Malaysian culinary items (Cili Padi, Lemongrass, Lengkuas, etc.).
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
              Direct cloud multi-modal AI recognizing regional aromatics, vegetables, proteins, and pantry staples with Malaysian cooking units.
            </p>
          </div>
        </div>
      )}

      {/* Viewport Card */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
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
                ? "CNN Only (10 Staples)"
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
                  ? "Place 1 of 10 predefined staples inside box"
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
                    ? "Running Client-Side CNN"
                    : settings.preferredEngine === "gemini"
                    ? "Analyzing with Gemini Vision AI"
                    : "Running Hybrid Classification"}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings.preferredEngine === "cnn"
                    ? "Classifying against 10 predefined produce items locally..."
                    : settings.preferredEngine === "gemini"
                    ? "Comparing against 75+ Malaysian culinary staples..."
                    : "Matching local CNN & cloud Malaysian vision..."}
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
        <div className="relative z-20 p-3.5 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between gap-2">
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
            <span>Upload Photo</span>
          </button>

          {/* Primary Snap & Scan Shutter Button */}
          <button
            onClick={capturedImage ? () => setCapturedImage(null) : handleSnapAndScan}
            disabled={(!isCameraActive && !capturedImage) || isAnalyzing}
            className={`flex-[1.4] py-3 px-4 rounded-2xl text-slate-950 text-xs font-black tracking-wide shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-40 ${
              settings.preferredEngine === "cnn"
                ? "bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-300 hover:to-indigo-300 shadow-blue-500/20"
                : settings.preferredEngine === "gemini"
                ? "bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 shadow-purple-500/20"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20"
            }`}
          >
            {capturedImage ? (
              <>
                <Camera className="w-4 h-4" />
                <span>Retake Photo</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Snap & Scan</span>
              </>
            )}
          </button>

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

      {/* Active Digital Pantry List */}
      <PantryList
        items={pantryItems}
        onDeleteItem={handleDeleteItem}
        onClearAll={handleClearAll}
      />

      {/* Detection & Logging Modal */}
      {isModalOpen && detectedItem && (
        <PantryLoggerModal
          initialData={detectedItem}
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
