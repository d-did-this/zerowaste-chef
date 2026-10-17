"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  Settings,
  AlertCircle,
  PlusCircle,
  Cpu,
  X,
  Terminal,
  Trash2,
} from "lucide-react";
import {
  runPredefinedCnnClassification,
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
  suggestedQuantity?: number;
  suggestedUnit?: string;
  culinaryNote?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
}

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<MobileNetModel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

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

  // Live Terminal Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // App Settings & Digital Pantry
  const [settings, setSettings] = useState<AppSettings>({ apiKey: "", preferredEngine: "cnn" });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  // Optional manual logger modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalItem, setModalItem] = useState<ActiveResult | null>(null);

  // Append to terminal logs
  const addLog = useCallback((text: string) => {
    const entry: LogEntry = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString(),
      text,
    };
    setLogs((prev) => [...prev.slice(-40), entry]);
  }, []);

  // Initialize logs on client mount to avoid static prerender date warning
  useEffect(() => {
    setLogs([
      {
        id: "init_1",
        timestamp: new Date().toLocaleTimeString(),
        text: "[System] ZeroWaste Vision Engine initialized.",
      },
    ]);
  }, []);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
    addLog(`[Mode] Switched active pipeline to: ${mode.toUpperCase()}`);
  };

  // 1. Initialize TensorFlow.js MobileNet
  const initCnnModel = useCallback(async () => {
    try {
      setCnnStatus("loading");
      addLog("[CNN] Downloading TensorFlow.js MobileNet weights...");
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      addLog("[CNN] TensorFlow.js runtime backend verified: " + tf.getBackend());
      const mobilenet = await import("@tensorflow-models/mobilenet");

      try {
        const loaded = await mobilenet.load({ version: 2, alpha: 1.0 });
        modelRef.current = loaded as unknown as MobileNetModel;
        setCnnStatus("ready");
        addLog("[CNN] MobileNet v2 (1.00) loaded successfully into browser memory.");
      } catch (v2Err) {
        console.warn("MobileNet v2 load failed, attempting v1:", v2Err);
        const fallbackLoaded = await mobilenet.load({ version: 1, alpha: 1.0 });
        modelRef.current = fallbackLoaded as unknown as MobileNetModel;
        setCnnStatus("ready");
        addLog("[CNN] MobileNet v1 loaded successfully as fallback.");
      }
    } catch (err: unknown) {
      console.warn("Edge MobileNet init error:", err);
      setCnnStatus("error");
      addLog("[CNN Error] Failed to load MobileNet: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [addLog]);

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
          addLog(`[Camera] Video stream active (${facingMode} lens).`);
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
      addLog("[Camera Error] " + (err instanceof Error ? err.message : "Access denied"));
    }
  }, [facingMode, addLog]);

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
        addLog(`[Hardware] Flashlight ${nextState ? "ON" : "OFF"}`);
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
    addLog("[Scanner] Viewfinder reset. Ready for next capture.");
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
    addLog(`[Scan] Processing image frame via [${activeEngine.toUpperCase()}] engine...`);

    try {
      // -------------------------------------------------------------
      // 1. CNN ONLY MODE (UTeM Objective b: Predefined Produce Dataset)
      // -------------------------------------------------------------
      if (activeEngine === "cnn") {
        if (!modelRef.current) {
          if (cnnStatus === "loading") {
            setActiveResult({
              name: "CNN Initializing",
              nameMalay: "Model Sedang Dimuat",
              emoji: "⏳",
              confidence: 0,
              rawLabel: "mobilenet_loading",
              engineUsed: "Client-Side CNN",
              culinaryNote: "TensorFlow.js MobileNet weights are loading into browser memory. Please retry in 2 seconds.",
            });
            addLog("[CNN] Waiting for model weights to finish downloading.");
            return;
          } else {
            setActiveResult({
              name: "CNN Load Error",
              nameMalay: "Ralat CNN",
              emoji: "⚠️",
              confidence: 0,
              rawLabel: "mobilenet_error",
              engineUsed: "Client-Side CNN",
              culinaryNote: "Failed to load MobileNet weights. Tap settings to retry.",
            });
            addLog("[CNN Error] Model unavailable.");
            return;
          }
        }

        // Run multi-scale ensemble + color & aspect-ratio prior with live telemetry
        const cnnResult = await runPredefinedCnnClassification(
          modelRef.current,
          source,
          (msg) => addLog(msg)
        );

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
          engineUsed: "Client-Side CNN (MobileNet v2)",
          suggestedQuantity: 1,
          suggestedUnit: cnnResult.topIngredient.defaultUnit || (local ? local.defaultUnit : "pcs"),
          culinaryNote: `Classified via MobileNet CNN ImageNet activation: ${cnnResult.rawLabel}. Meets Objective (b).`,
        });
        return;
      }

      // -------------------------------------------------------------
      // 2. GEMINI ONLY MODE (75+ Malaysian Database)
      // -------------------------------------------------------------
      if (activeEngine === "gemini") {
        addLog("[Gemini] Sending payload to /api/classify cloud endpoint...");
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
              addLog(`[Gemini] Result: ${json.data.name} (${json.data.nameMalay || ""}) - ${json.data.confidence}%`);
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
          addLog("[Gemini Error] API call failed.");
        }

        setActiveResult({
          name: "Gemini Unavailable",
          nameMalay: "Gemini Tidak Tersedia",
          emoji: "⚠️",
          confidence: 0,
          rawLabel: "gemini_error",
          engineUsed: "Gemini Vision",
          culinaryNote: "Could not reach Gemini Vision API. Check connection or enter API key in Settings.",
        });
        return;
      }

      // -------------------------------------------------------------
      // 3. HYBRID MODE (Fast Local CNN first, escalate to Gemini)
      // -------------------------------------------------------------
      if (activeEngine === "hybrid") {
        addLog("[Hybrid] Running local CNN pass first...");
        if (modelRef.current) {
          const cnnResult = await runPredefinedCnnClassification(
            modelRef.current,
            source,
            (msg) => addLog(msg)
          );
          if (cnnResult.confidence >= 50) {
            addLog(`[Hybrid] High local CNN confidence (${cnnResult.confidence}%). Accepting match without cloud API.`);
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
              culinaryNote: `Matched locally with CNN MobileNet (${cnnResult.confidence}%). Instant edge execution with 0 API latency.`,
            });
            return;
          } else {
            addLog(`[Hybrid] Moderate CNN confidence (${cnnResult.confidence}%). Auto-escalating to Gemini Vision...`);
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
              addLog(`[Hybrid] Gemini escalation resolved: ${json.data.name}`);
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
          addLog("[Hybrid Error] Gemini escalation failed.");
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
      addLog("[Error] Classification exception: " + (e instanceof Error ? e.message : String(e)));
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

    addLog("[Camera] Snapping still frame (center crop 640x640)...");
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
    processFrame(canvas, dataUrl);
  };

  // 5. Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`[Upload] Image selected: ${file.name}`);
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
          addLog("[Upload Error] Failed to decode image.");
        }
      };
      img.src = dataUrl;
      if (img.complete) finishLoad();
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
    addLog(`[Pantry] Added ${newItem.name} (${newItem.quantity} ${newItem.unit})`);
    handleRescan();
  };

  const handleDeleteItem = (id: string) => {
    deletePantryItem(id);
    setPantryItems((prev) => prev.filter((p) => p.id !== id));
    addLog(`[Pantry] Deleted item: ${id}`);
  };

  const handleClearAll = () => {
    clearPantry();
    setPantryItems([]);
    addLog("[Pantry] All pantry records cleared.");
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-3 font-sans text-zinc-100">
      {/* ======================================================== */}
      {/* 1. THREE CLEAN MONOCHROME TABS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-sm">
        <button
          onClick={() => handleModeChange("cnn")}
          className={`py-2 px-1 text-[11px] font-mono font-semibold rounded-xl transition-all ${
            settings.preferredEngine === "cnn"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          CNN (10 STAPLES)
        </button>

        <button
          onClick={() => handleModeChange("hybrid")}
          className={`py-2 px-1 text-[11px] font-mono font-semibold rounded-xl transition-all ${
            settings.preferredEngine === "hybrid"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          HYBRID (AUTO)
        </button>

        <button
          onClick={() => handleModeChange("gemini")}
          className={`py-2 px-1 text-[11px] font-mono font-semibold rounded-xl transition-all ${
            settings.preferredEngine === "gemini"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          GEMINI (75+)
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP HALF: THE SCANNER */}
      {/* ======================================================== */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-black rounded-3xl overflow-hidden border border-zinc-800 flex flex-col shadow-2xl">
        {/* Top Status Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 px-3.5 py-2.5 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center space-x-2">
            <span
              className={`h-2 w-2 rounded-full ${
                cnnStatus === "ready"
                  ? "bg-white shadow-[0_0_8px_#ffffff]"
                  : cnnStatus === "loading"
                  ? "bg-zinc-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300">
              {settings.preferredEngine === "cnn"
                ? "CNN Produce Head (Client-Side)"
                : settings.preferredEngine === "gemini"
                ? "Gemini Cloud Vision"
                : "Hybrid Dual Engine"}
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
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

          {/* Minimalist Reticle */}
          {!capturedImage && isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 rounded-2xl border border-dashed border-white/30 flex items-center justify-center">
                {/* Hairline Corner Guides */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
              </div>
              <p className="mt-2.5 px-2.5 py-0.5 rounded-full bg-black/70 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                Center ingredient inside frame
              </p>
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-2.5">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-xs font-mono text-zinc-300">Processing activations...</p>
            </div>
          )}

          {/* Quick Camera Controls Floating (Right) */}
          {!capturedImage && (
            <div className="absolute right-3 top-12 z-20 flex flex-col space-y-2">
              <button
                onClick={flipCamera}
                disabled={!isCameraActive}
                className="p-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 text-white transition-all disabled:opacity-40"
                title="Flip Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {isTorchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl border transition-all ${
                    isTorchOn
                      ? "bg-white border-white text-black"
                      : "bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800 text-white"
                  }`}
                  title="Flashlight"
                >
                  {isTorchOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && !capturedImage && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-white" />
              <h4 className="text-sm font-semibold text-white">Camera Access Required</h4>
              <p className="text-xs text-zinc-400 max-w-xs">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl"
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Bottom Shutter Controls */}
        <div className="relative z-20 p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
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
            className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-mono font-medium flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-300" />
            <span>Upload</span>
          </button>

          {/* Primary Action Button: Snap & Scan or Rescan */}
          {capturedImage ? (
            <button
              onClick={handleRescan}
              className="flex-[1.4] py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold tracking-wide flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan</span>
            </button>
          ) : (
            <button
              onClick={handleSnapAndScan}
              disabled={!isCameraActive || isAnalyzing}
              className="flex-[1.4] py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold tracking-wide flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-40"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snap & Scan</span>
            </button>
          )}

          {/* Manual Entry Fallback Button */}
          <button
            onClick={handleAddManual}
            disabled={isAnalyzing}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all"
            title="Manual Text Fallback"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MIDDLE: THE OUTPUT (Clean, Simple, Clear) */}
      {/* ======================================================== */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-sm flex flex-col space-y-3">
        {activeResult ? (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Header: Name, Match %, and Engine Tag */}
            <div className="flex items-start justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                  {activeResult.emoji}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {activeResult.nameMalay || activeResult.name}
                    </h3>
                    {activeResult.confidence > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-white text-black font-mono text-[10px] font-bold">
                        {activeResult.confidence}% MATCH
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {activeResult.name} •{" "}
                    <span className="font-mono text-[11px] text-zinc-300">{activeResult.engineUsed}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleRescan}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Produce Rankings Table */}
            {activeResult.topRankings && activeResult.topRankings.length > 0 && (
              <div className="space-y-1.5 font-mono text-xs">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 flex justify-between">
                  <span>Candidate Breakdown</span>
                  <span>Softmax Score</span>
                </div>
                <div className="space-y-1 pt-0.5">
                  {activeResult.topRankings.slice(0, 3).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs"
                    >
                      <span className="flex items-center space-x-2 text-zinc-200">
                        <span>{p.emoji}</span>
                        <span className="font-medium">{p.name} ({p.nameMalay})</span>
                      </span>
                      <span className="font-bold text-white">{p.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleRescan}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Scan Next Ingredient</span>
              </button>

              <button
                onClick={() => {
                  setModalItem(activeResult);
                  setIsModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono font-medium border border-zinc-800 transition-all flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Log</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>READY TO SCAN</span>
            <span className="text-zinc-600">Aim produce & tap Snap & Scan</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM: THE PROCESS TERMINAL (No Black Boxes) */}
      {/* ======================================================== */}
      <div className="p-3 rounded-2xl bg-black border border-zinc-800 flex flex-col space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
              Live Process Telemetry
            </span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center space-x-1"
            title="Clear Terminal"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Telemetry Log Body */}
        <div className="h-36 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 pr-1 text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2">
              <span className="text-zinc-600 select-none flex-shrink-0">{log.timestamp}</span>
              <span className="break-all">{log.text}</span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>

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
