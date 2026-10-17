"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  AlertCircle,
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
} from "@/utils/pantryStorage";

interface ActiveResult {
  name: string;
  nameMalay?: string;
  emoji: string;
  confidence: number;
  engineUsed: string;
  topRankings?: Array<{
    name: string;
    nameMalay: string;
    emoji: string;
    confidence: number;
  }>;
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
  const terminalContainerRef = useRef<HTMLDivElement>(null);

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

  // App Settings
  const [settings, setSettings] = useState<AppSettings>({ apiKey: "", preferredEngine: "cnn" });

  // Append to terminal logs
  const addLog = useCallback((text: string) => {
    const entry: LogEntry = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString(),
      text,
    };
    setLogs((prev) => [...prev.slice(-40), entry]);
  }, []);

  // Initialize logs on mount
  useEffect(() => {
    setLogs([
      {
        id: "init_1",
        timestamp: new Date().toLocaleTimeString(),
        text: "[System] Ready.",
      },
    ]);
  }, []);

  // Auto-scroll terminal container internally (no whole-page jumps)
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Load Settings on Mount
  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

  // Quick Mode Switcher Handler
  const handleModeChange = (mode: "cnn" | "hybrid" | "gemini") => {
    const updated = saveAppSettings({ preferredEngine: mode });
    setSettings(updated);
    setActiveResult(null);
    addLog(`[Mode] Switched to ${mode.toUpperCase()}`);
  };

  // 1. Initialize TensorFlow.js MobileNet
  const initCnnModel = useCallback(async () => {
    try {
      setCnnStatus("loading");
      addLog("[CNN] Loading TensorFlow.js MobileNet...");
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const mobilenet = await import("@tensorflow-models/mobilenet");

      try {
        const loaded = await mobilenet.load({ version: 2, alpha: 1.0 });
        modelRef.current = loaded as unknown as MobileNetModel;
        setCnnStatus("ready");
        addLog("[CNN] MobileNet v2 loaded.");
      } catch {
        const fallbackLoaded = await mobilenet.load({ version: 1, alpha: 1.0 });
        modelRef.current = fallbackLoaded as unknown as MobileNetModel;
        setCnnStatus("ready");
        addLog("[CNN] MobileNet v1 loaded (fallback).");
      }
    } catch (err: unknown) {
      setCnnStatus("error");
      addLog("[CNN Error] " + (err instanceof Error ? err.message : String(err)));
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
        throw new Error("Camera not supported in browser");
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
          addLog(`[Camera] Started (${facingMode}).`);
        };
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities?.() as { torch?: boolean }) || {};
        setIsTorchSupported(Boolean(capabilities.torch));
      }
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Unable to access camera.");
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
        addLog(`[Torch] ${nextState ? "ON" : "OFF"}`);
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
    addLog("[Scanner] Reset to live feed.");
  };

  // 3. Process Frame
  const processFrame = async (
    source: HTMLCanvasElement | HTMLImageElement,
    previewDataUrl: string
  ) => {
    setIsAnalyzing(true);
    setCapturedImage(previewDataUrl);
    setActiveResult(null);

    const activeEngine = settings.preferredEngine || "cnn";
    addLog(`[Scan] Analyzing with [${activeEngine.toUpperCase()}]...`);

    try {
      // 1. CNN ONLY MODE
      if (activeEngine === "cnn") {
        if (!modelRef.current) {
          addLog("[CNN Error] Model not ready yet.");
          setActiveResult({
            name: "Model Loading",
            nameMalay: "Sila tunggu",
            emoji: "⏳",
            confidence: 0,
            engineUsed: "CNN",
          });
          return;
        }

        const cnnResult = await runPredefinedCnnClassification(
          modelRef.current,
          source,
          (msg) => addLog(msg)
        );

        const local = findMatchingMalaysianIngredient(cnnResult.topIngredient.name);

        setActiveResult({
          name: cnnResult.topIngredient.name,
          nameMalay: cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : cnnResult.topIngredient.name),
          emoji: cnnResult.topIngredient.emoji,
          confidence: cnnResult.confidence,
          topRankings: cnnResult.topRankings,
          engineUsed: "CNN (MobileNet)",
        });
        return;
      }

      // 2. GEMINI ONLY MODE
      if (activeEngine === "gemini") {
        addLog("[Gemini] Requesting cloud API...");
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
              addLog(`[Gemini] Matched: ${json.data.name} (${json.data.confidence}%)`);
              setActiveResult({
                name: json.data.name,
                nameMalay: json.data.nameMalay,
                emoji: json.data.emoji || "🥗",
                confidence: json.data.confidence,
                engineUsed: "Gemini Vision",
              });
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Gemini Vision call failed:", apiErr);
          addLog("[Gemini Error] Cloud request failed.");
        }

        setActiveResult({
          name: "Unavailable",
          nameMalay: "Tidak Tersedia",
          emoji: "⚠️",
          confidence: 0,
          engineUsed: "Gemini Vision",
        });
        return;
      }

      // 3. HYBRID MODE
      if (activeEngine === "hybrid") {
        addLog("[Hybrid] Running local CNN...");
        if (modelRef.current) {
          const cnnResult = await runPredefinedCnnClassification(
            modelRef.current,
            source,
            (msg) => addLog(msg)
          );
          if (cnnResult.confidence >= 50) {
            addLog(`[Hybrid] High CNN confidence (${cnnResult.confidence}%). Accepted.`);
            const local = findMatchingMalaysianIngredient(cnnResult.topIngredient.name);
            setActiveResult({
              name: cnnResult.topIngredient.name,
              nameMalay: cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : cnnResult.topIngredient.name),
              emoji: cnnResult.topIngredient.emoji,
              confidence: cnnResult.confidence,
              topRankings: cnnResult.topRankings,
              engineUsed: "Hybrid (CNN)",
            });
            return;
          } else {
            addLog(`[Hybrid] Low CNN confidence (${cnnResult.confidence}%). Escalating to Gemini...`);
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
              addLog(`[Hybrid] Gemini result: ${json.data.name}`);
              setActiveResult({
                name: json.data.name,
                nameMalay: json.data.nameMalay,
                emoji: json.data.emoji || "🥗",
                confidence: json.data.confidence,
                engineUsed: "Hybrid (Gemini)",
              });
              return;
            }
          }
        } catch (escalateErr) {
          console.warn("Hybrid Gemini escalation error:", escalateErr);
          addLog("[Hybrid Error] Escalation failed.");
        }

        setActiveResult({
          name: "Unidentified",
          nameMalay: "Tidak Dikenalpasti",
          emoji: "🔍",
          confidence: 0,
          engineUsed: "Hybrid",
        });
      }
    } catch (e) {
      console.error("Classification failure:", e);
      addLog("[Error] " + (e instanceof Error ? e.message : String(e)));
      setActiveResult({
        name: "Error",
        nameMalay: "Ralat",
        emoji: "❌",
        confidence: 0,
        engineUsed: "Error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Capture Frame from Live Camera
  const handleSnapAndScan = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    addLog("[Camera] Snapped frame (640x640).");
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

    addLog(`[Upload] File: ${file.name}`);
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
          addLog("[Upload Error] Could not decode image.");
        }
      };
      img.src = dataUrl;
      if (img.complete) finishLoad();
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-3 font-mono text-zinc-100">
      {/* ======================================================== */}
      {/* THREE CLEAN TABS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
        <button
          onClick={() => handleModeChange("cnn")}
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            settings.preferredEngine === "cnn"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          CNN (10)
        </button>

        <button
          onClick={() => handleModeChange("hybrid")}
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            settings.preferredEngine === "hybrid"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          HYBRID
        </button>

        <button
          onClick={() => handleModeChange("gemini")}
          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
            settings.preferredEngine === "gemini"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          GEMINI (75+)
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP HALF: THE SCANNER */}
      {/* ======================================================== */}
      <div className="relative w-full h-[340px] sm:h-[380px] bg-black rounded-2xl overflow-hidden border border-zinc-800 flex flex-col">
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center space-x-2">
            <span
              className={`h-2 w-2 rounded-full ${
                cnnStatus === "ready"
                  ? "bg-white"
                  : cnnStatus === "loading"
                  ? "bg-zinc-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-[10px] uppercase text-zinc-400">
              {settings.preferredEngine} mode
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {cnnStatus === "loading" ? "Loading weights..." : "Model active"}
          </div>
        </div>

        {/* Video / Captured Image Container */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          {/* Permanent Video Element: Kept active so stream never terminates or freezes */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isCameraActive ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Captured Snapshot Overlay */}
          {capturedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedImage}
              alt="Snapshot"
              className="absolute inset-0 z-10 w-full h-full object-cover"
            />
          )}

          {/* Minimal Reticle */}
          {!capturedImage && isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="relative w-52 h-52 border border-dashed border-white/40 rounded-xl" />
            </div>
          )}

          {/* Analyzing Spinner Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center space-y-2">
              <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-xs text-zinc-400">Processing...</p>
            </div>
          )}

          {/* Camera Quick Controls */}
          {!capturedImage && (
            <div className="absolute right-3 top-10 z-20 flex flex-col space-y-2">
              <button
                onClick={flipCamera}
                disabled={!isCameraActive}
                className="p-2 rounded-lg bg-black/70 border border-zinc-800 text-white disabled:opacity-40"
                title="Flip"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {isTorchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-lg border ${
                    isTorchOn
                      ? "bg-white border-white text-black"
                      : "bg-black/70 border-zinc-800 text-white"
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
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-white" />
              <p className="text-xs text-zinc-400">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Bottom Shutter Controls */}
        <div className="relative z-20 p-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
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
            className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center justify-center space-x-1.5 hover:text-white"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Upload</span>
          </button>

          {/* Primary Action Button: Snap or Rescan */}
          {capturedImage ? (
            <button
              onClick={handleRescan}
              className="flex-[1.5] py-2 px-4 rounded-lg bg-white text-black text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan</span>
            </button>
          ) : (
            <button
              onClick={handleSnapAndScan}
              disabled={
                !isCameraActive ||
                isAnalyzing ||
                (settings.preferredEngine !== "gemini" && cnnStatus === "loading")
              }
              className="flex-[1.5] py-2 px-4 rounded-lg bg-white text-black text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-40 active:scale-95 transition-transform"
            >
              {cnnStatus === "loading" && settings.preferredEngine !== "gemini" ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Loading Model...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snap & Scan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MIDDLE: THE OUTPUT */}
      {/* ======================================================== */}
      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col space-y-2.5">
        {activeResult ? (
          <div className="space-y-2.5">
            {/* Main Result */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                  {activeResult.emoji}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">
                      {activeResult.nameMalay || activeResult.name}
                    </h3>
                    {activeResult.confidence > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-white text-black text-[10px] font-bold">
                        {activeResult.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {activeResult.name} • {activeResult.engineUsed}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRescan}
                className="p-1 text-zinc-500 hover:text-white"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Breakdown */}
            {activeResult.topRankings && activeResult.topRankings.length > 0 && (
              <div className="space-y-1 text-xs">
                {activeResult.topRankings.slice(0, 3).map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-2.5 rounded bg-zinc-900/60 border border-zinc-800/60 text-xs"
                  >
                    <span className="flex items-center space-x-2 text-zinc-300">
                      <span>{p.emoji}</span>
                      <span>{p.name} ({p.nameMalay})</span>
                    </span>
                    <span className="font-bold text-white">{p.confidence}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Rescan Button */}
            <button
              onClick={handleRescan}
              className="w-full py-2 rounded-lg bg-white text-black font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Next</span>
            </button>
          </div>
        ) : (
          <div className="py-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Ready</span>
            <span className="text-zinc-600">Point at produce & tap Snap & Scan</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. BOTTOM: THE PROCESS TERMINAL */}
      {/* ======================================================== */}
      <div className="p-3 rounded-2xl bg-black border border-zinc-800 flex flex-col space-y-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-zinc-900">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-300">Process</span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center space-x-1"
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Telemetry Log Body */}
        <div
          ref={terminalContainerRef}
          className="h-36 overflow-y-auto text-[11px] leading-relaxed space-y-1 pr-1 text-zinc-300 scrollbar-thin"
        >
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2">
              <span className="text-zinc-600 select-none flex-shrink-0">{log.timestamp}</span>
              <span className="break-all">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
