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
  matchIngredient,
  RawPrediction,
} from "@/utils/ingredientClassifier";
import {
  findMatchingMalaysianIngredient,
  LocalIngredient,
} from "@/utils/malaysianIngredients";
import {
  getAppSettings,
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
  const [settings, setSettings] = useState<AppSettings>({ apiKey: "", preferredEngine: "auto" });
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

  // 3. Process & Classify Image (Cloud Malaysian Vision AI or Edge TFJS)
  const processImageForClassification = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setCapturedImage(dataUrl);

    try {
      // Preference: If not strictly "edge", try Malaysian Vision API first
      if (settings.preferredEngine !== "edge") {
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
              setDetectedItem({
                ...json.data,
                engineUsed: json.engine || "Malaysian Vision AI",
              });
              setIsModalOpen(true);
              setIsAnalyzing(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Malaysian Vision API call failed, falling back to local:", apiErr);
        }
      }

      // Edge MobileNet Fallback
      if (modelRef.current) {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => (img.onload = resolve));

        const preds = await modelRef.current.classify(img, 5);
        const matched = matchIngredient(preds);

        if (matched) {
          // Look up in Malaysian DB for local name
          const local = findMatchingMalaysianIngredient(matched.ingredient.name);
          setDetectedItem({
            id: matched.ingredient.id,
            name: matched.ingredient.name,
            nameMalay: local ? local.nameMalay : matched.ingredient.name,
            emoji: matched.ingredient.emoji,
            category: matched.ingredient.category,
            confidence: matched.confidence,
            suggestedQuantity: 1,
            suggestedUnit: local ? local.defaultUnit : "pcs",
            culinaryNote: "Identified via Client-Side Edge MobileNet CNN.",
            engineUsed: "TensorFlow.js Edge MobileNet",
          });
        } else {
          // Generic fallback
          const top = preds[0];
          setDetectedItem({
            name: top ? top.className.split(",")[0] : "Kitchen Ingredient",
            nameMalay: "Bahan Dapur",
            emoji: "🥗",
            category: "Vegetables & Greens",
            confidence: top ? Math.round(top.probability * 100) : 70,
            suggestedQuantity: 1,
            suggestedUnit: "biji",
            culinaryNote: "Verified manually.",
            engineUsed: "Manual Verification",
          });
        }

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
    // Target 640x640 center crop
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
    // Reset file input
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
    <div className="w-full max-w-md mx-auto flex flex-col space-y-4">
      {/* Viewport Card */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              {settings.preferredEngine === "edge" ? "Edge Mode" : "Malaysian Vision AI"}
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
              <div className="relative w-60 h-60 rounded-3xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Laser scan animation */}
                <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_12px_#34d399]" />
              </div>
              <p className="mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-slate-300 border border-slate-800">
                Place raw ingredient inside box
              </p>
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <div className="text-center">
                <h4 className="text-sm font-bold text-white">Analyzing Kitchen Ingredient</h4>
                <p className="text-xs text-slate-400">Comparing against 75+ Malaysian culinary staples...</p>
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
            className="flex-[1.4] py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-40"
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
