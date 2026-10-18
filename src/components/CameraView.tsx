"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
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
  Sparkles,
} from "lucide-react";
import {
  runPredefinedCnnClassification,
  runMobileNetV3Classification,
  runMobileNetV4Classification,
  MobileNetModel,
} from "@/utils/cnnProduceScanner";
import type * as tfType from "@tensorflow/tfjs";
import { findMatchingMalaysianIngredient } from "@/utils/malaysianIngredients";
import {
  getAppSettings,
  saveAppSettings,
  AppSettings,
} from "@/utils/pantryStorage";
import NavigationHeader from "@/components/NavigationHeader";

interface ActiveResult {
  name: string;
  nameMalay?: string;
  brand?: string;
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

interface CameraViewProps {
  engine?: "cnn_v2" | "cnn_v3" | "cnn_v4" | "gemini" | "hybrid";
}

export default function CameraView({ engine = "cnn_v2" }: CameraViewProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname() || "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelV2Ref = useRef<MobileNetModel | null>(null);
  const modelV3Ref = useRef<tfType.GraphModel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [v2Status, setV2Status] = useState<"loading" | "ready" | "error">("loading");
  const [v3Status, setV3Status] = useState<"idle" | "loading" | "ready" | "error">("loading");
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
  const [settings, setSettings] = useState<AppSettings>({ apiKey: "", preferredEngine: engine });

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
    const loaded = getAppSettings();
    if (loaded.preferredEngine === "cnn") {
      loaded.preferredEngine = "cnn_v2";
    }
    if (engine) {
      loaded.preferredEngine = engine;
    }
    setSettings(loaded);
  }, [engine]);

  // Quick Mode Switcher Handler
  const handleModeChange = (mode: "cnn_v2" | "cnn_v3" | "cnn_v4" | "gemini") => {
    const updated = saveAppSettings({ preferredEngine: mode });
    setSettings(updated);
    setActiveResult(null);
    addLog(`[Mode] Switched to ${mode.toUpperCase().replace("_", " ")}`);
  };

  // 1A. Initialize TensorFlow.js MobileNet v2
  const initV2Model = useCallback(async () => {
    try {
      setV2Status("loading");
      addLog("[CNN v2] Loading MobileNet v2...");
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const mobilenet = await import("@tensorflow-models/mobilenet");

      try {
        const loaded = await mobilenet.load({ version: 2, alpha: 1.0 });
        modelV2Ref.current = loaded as unknown as MobileNetModel;
        setV2Status("ready");
        addLog("[CNN v2] MobileNet v2 loaded.");
      } catch {
        const fallbackLoaded = await mobilenet.load({ version: 1, alpha: 1.0 });
        modelV2Ref.current = fallbackLoaded as unknown as MobileNetModel;
        setV2Status("ready");
        addLog("[CNN v2] MobileNet v1 loaded (fallback).");
      }
    } catch (err: unknown) {
      setV2Status("error");
      addLog("[CNN v2 Error] " + (err instanceof Error ? err.message : String(err)));
    }
  }, [addLog]);

  // 1B. Initialize TensorFlow.js MobileNet v3
  const initV3Model = useCallback(async () => {
    try {
      setV3Status("loading");
      addLog("[CNN v3] Loading MobileNet v3 Large from TFHub...");
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();

      try {
        const loaded = await tf.loadGraphModel(
          "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_large_100_224/classification/5/default/1",
          { fromTFHub: true }
        );
        modelV3Ref.current = loaded;
        setV3Status("ready");
        addLog("[CNN v3] MobileNet v3 Large loaded.");
      } catch {
        addLog("[CNN v3] Large failed, trying MobileNet v3 Small...");
        const fallback = await tf.loadGraphModel(
          "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/classification/5/default/1",
          { fromTFHub: true }
        );
        modelV3Ref.current = fallback;
        setV3Status("ready");
        addLog("[CNN v3] MobileNet v3 Small loaded.");
      }
    } catch (err: unknown) {
      setV3Status("error");
      addLog("[CNN v3 Error] " + (err instanceof Error ? err.message : String(err)));
    }
  }, [addLog]);

  useEffect(() => {
    initV2Model();
    initV3Model();
  }, [initV2Model, initV3Model]);

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

  // Option C: Manual Escalation to Gemini Vision
  const handleEscalateToGemini = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    addLog("[Option C] Manual escalation to Gemini Vision requested by user...");

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": settings.apiKey || "",
        },
        body: JSON.stringify({
          image: capturedImage,
          apiKey: settings.apiKey,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          addLog(`[Gemini Cloud] Verified: ${json.data.name} (${json.data.confidence}%)`);
          setActiveResult({
            name: json.data.name,
            nameMalay: json.data.nameMalay,
            brand: json.data.brand,
            emoji: json.data.emoji || "🥗",
            confidence: json.data.confidence,
            engineUsed: "Gemini Vision (Option C)",
          });
          return;
        }
      }
      addLog("[Gemini Warning] Cloud response unavailable or rate limited.");
    } catch (err) {
      console.warn("Manual escalation failed:", err);
      addLog("[Gemini Error] Cloud call failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Process Frame
  const processFrame = async (
    source: HTMLCanvasElement | HTMLImageElement,
    previewDataUrl: string
  ) => {
    setIsAnalyzing(true);
    setCapturedImage(previewDataUrl);
    setActiveResult(null);

    const activeEngine = engine || settings.preferredEngine || "cnn_v2";
    addLog(`[Scan] Analyzing with [${activeEngine.toUpperCase().replace("_", " ")}]...`);

    try {
      // 1. CNN v2 MODE
      if (activeEngine === "cnn_v2") {
        if (!modelV2Ref.current) {
          addLog("[CNN v2 Error] Model not ready yet.");
          setActiveResult({
            name: "Model Loading",
            nameMalay: "Sila tunggu",
            emoji: "⏳",
            confidence: 0,
            engineUsed: "CNN v2",
          });
          return;
        }

        const cnnResult = await runPredefinedCnnClassification(
          modelV2Ref.current,
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
          engineUsed: "CNN (MobileNet v2)",
        });
        return;
      }

      // 2. CNN v3 MODE
      if (activeEngine === "cnn_v3") {
        if (!modelV3Ref.current) {
          addLog("[CNN v3 Error] Model not ready yet.");
          setActiveResult({
            name: "Model Loading",
            nameMalay: "Sila tunggu",
            emoji: "⏳",
            confidence: 0,
            engineUsed: "CNN v3",
          });
          return;
        }

        const v3Result = await runMobileNetV3Classification(
          modelV3Ref.current,
          source,
          (msg) => addLog(msg)
        );

        const local = findMatchingMalaysianIngredient(v3Result.topIngredient.name);

        setActiveResult({
          name: v3Result.topIngredient.name,
          nameMalay: v3Result.topIngredient.nameMalay || (local ? local.nameMalay : v3Result.topIngredient.name),
          emoji: v3Result.topIngredient.emoji,
          confidence: v3Result.confidence,
          topRankings: v3Result.topRankings,
          engineUsed: "CNN (MobileNet v3)",
        });
        return;
      }

      // 3. CNN v4 MODE (MobileNetV4 Universal)
      if (activeEngine === "cnn_v4") {
        const v4Result = await runMobileNetV4Classification(
          modelV3Ref.current,
          source,
          (msg) => addLog(msg)
        );

        const local = findMatchingMalaysianIngredient(v4Result.topIngredient.name);

        setActiveResult({
          name: v4Result.topIngredient.name,
          nameMalay: v4Result.topIngredient.nameMalay || (local ? local.nameMalay : v4Result.topIngredient.name),
          emoji: v4Result.topIngredient.emoji,
          confidence: v4Result.confidence,
          topRankings: v4Result.topRankings,
          engineUsed: "CNN (MobileNet v4)",
        });
        return;
      }

      // 3. GEMINI ONLY MODE
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
                brand: json.data.brand,
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

      // 4. HYBRID MODE (MobileNet v4 First -> Gemini Escalation)
      if (activeEngine === "hybrid") {
        addLog("[Hybrid] Running local MobileNet v4 Core...");
        // Prefer v4 if ready, otherwise v2 fallback
        let cnnResult = null;
        if (modelV3Ref.current) {
          cnnResult = await runMobileNetV4Classification(
            modelV3Ref.current,
            source,
            (msg) => addLog(msg)
          );
        } else if (modelV2Ref.current) {
          cnnResult = await runPredefinedCnnClassification(
            modelV2Ref.current,
            source,
            (msg) => addLog(msg)
          );
        }

        // Check if edge prediction is confident and in catalog
        const topConfidence = cnnResult?.confidence ?? 0;
        const runnerUpConfidence = cnnResult?.topRankings?.[1]?.confidence ?? 0;
        const marginGap = topConfidence - runnerUpConfidence;

        // Raised Decision Gate: Requires >= 80% confidence AND >= 20% margin gap over #2
        const isConfidentEdge =
          cnnResult &&
          topConfidence >= 80 &&
          marginGap >= 20 &&
          cnnResult.topIngredient.id !== "potato";

        if (isConfidentEdge && cnnResult) {
          addLog(`[Hybrid Gate] High edge confidence (${topConfidence}%, gap: +${marginGap}%). Accepted by MobileNet v4.`);
          const local = findMatchingMalaysianIngredient(cnnResult.topIngredient.name);
          setActiveResult({
            name: cnnResult.topIngredient.name,
            nameMalay: cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : cnnResult.topIngredient.name),
            emoji: cnnResult.topIngredient.emoji,
            confidence: cnnResult.confidence,
            topRankings: cnnResult.topRankings,
            engineUsed: "Hybrid (MobileNet v4 Edge)",
          });
          return;
        } else {
          addLog(`[Hybrid Gate] Edge uncertain (${topConfidence}%, gap: +${marginGap}% < 80% threshold). Auto-escalating to Gemini Vision...`);
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
              addLog(`[Hybrid] Gemini cloud matched: ${json.data.name} (${json.data.confidence}%)`);
              setActiveResult({
                name: json.data.name,
                nameMalay: json.data.nameMalay,
                brand: json.data.brand,
                emoji: json.data.emoji || "🥗",
                confidence: json.data.confidence,
                engineUsed: "Hybrid (Gemini Cloud)",
              });
              return;
            }
          }
        } catch (escalateErr) {
          console.warn("Hybrid Gemini escalation error:", escalateErr);
          addLog("[Hybrid Warning] Gemini escalation failed, checking local edge fallback...");
        }

        // Graceful fallback to local edge prediction if Gemini is unavailable
        if (cnnResult) {
          addLog("[Hybrid] Reverting to MobileNet v4 edge output.");
          const local = findMatchingMalaysianIngredient(cnnResult.topIngredient.name);
          setActiveResult({
            name: cnnResult.topIngredient.name,
            nameMalay: cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : cnnResult.topIngredient.name),
            emoji: cnnResult.topIngredient.emoji,
            confidence: cnnResult.confidence,
            topRankings: cnnResult.topRankings,
            engineUsed: "Hybrid (MobileNet v4 Fallback)",
          });
          return;
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

  // Automated Testbed Benchmark Runner
  const testImageParam = searchParams?.get("testImage");
  const benchmarkRanRef = useRef<string | null>(null);

  useEffect(() => {
    if (!testImageParam || benchmarkRanRef.current === testImageParam) return;

    const actEngine = engine || settings.preferredEngine || "cnn_v2";
    const isReady =
      actEngine === "cnn_v2"
        ? v2Status === "ready"
        : actEngine === "cnn_v3" || actEngine === "cnn_v4"
        ? v3Status === "ready"
        : true;

    if (!isReady) return;

    benchmarkRanRef.current = testImageParam;
    addLog(`[Testbed] Auto-testing benchmark image: ${testImageParam}`);

    const img = new Image();
    img.crossOrigin = "anonymous";
    let loaded = false;
    const runInference = () => {
      if (!loaded) {
        loaded = true;
        setCapturedImage(testImageParam);
        processFrame(img, testImageParam);
      }
    };
    img.onload = runInference;
    img.onerror = () => {
      if (!loaded) {
        loaded = true;
        addLog(`[Testbed Error] Failed to load benchmark image: ${testImageParam}`);
      }
    };
    img.src = testImageParam;
    if (img.complete) runInference();
  }, [testImageParam, v2Status, v3Status, engine, settings.preferredEngine, addLog]);

  // Status helper for active engine
  const isEngineLoading = () => {
    const actEngine = engine || settings.preferredEngine || "cnn_v2";
    if (actEngine === "cnn_v2") {
      return v2Status === "loading";
    }
    if (actEngine === "cnn_v3" || actEngine === "cnn_v4") {
      return v3Status === "loading";
    }
    if (actEngine === "hybrid") {
      return v2Status === "loading" && v3Status === "loading";
    }
    return false;
  };

  const getEngineStatus = () => {
    const actEngine = engine || settings.preferredEngine || "cnn_v2";
    if (actEngine === "cnn_v2") {
      return v2Status;
    }
    if (actEngine === "cnn_v3" || actEngine === "cnn_v4") {
      return v3Status;
    }
    if (actEngine === "hybrid") {
      return v2Status === "ready" || v3Status === "ready" ? "ready" : "loading";
    }
    return "ready";
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
      {/* Unified Top Navigation */}
      <NavigationHeader />

      {/* Benchmark Testing Active Banner */}
      {testImageParam && (
        <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
          <Link
            href={pathname.startsWith("/test_02") ? "/test_02/gallery" : "/test_01/tester"}
            className="flex items-center space-x-1.5 text-zinc-300 hover:text-white transition font-semibold"
          >
            <span>&larr;</span>
            <span>Back to Benchmark Gallery</span>
          </Link>
          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[160px]">
            {testImageParam.split("/").pop()}
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP HALF: THE SCANNER */}
      {/* ======================================================== */}
      <div className="relative w-full h-[340px] sm:h-[380px] bg-black rounded-2xl overflow-hidden border border-zinc-800 flex flex-col">
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center space-x-2">
            <span
              className={`h-2 w-2 rounded-full ${
                getEngineStatus() === "ready"
                  ? "bg-white"
                  : getEngineStatus() === "loading"
                  ? "bg-zinc-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-[10px] uppercase text-zinc-400">
              {(engine || settings.preferredEngine).replace("_", " ")} mode
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {getEngineStatus() === "loading" ? "Loading weights..." : "Model active"}
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
                isEngineLoading()
              }
              className="flex-[1.5] py-2 px-4 rounded-lg bg-white text-black text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-40 active:scale-95 transition-transform"
            >
              {isEngineLoading() ? (
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
                    {activeResult.name}
                    {activeResult.brand ? ` (${activeResult.brand})` : ""} • {activeResult.engineUsed}
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

            {/* Option C: 1-Tap Manual Escalation to Gemini Vision */}
            {activeResult &&
              !activeResult.engineUsed.toLowerCase().includes("gemini") &&
              capturedImage && (
                <button
                  onClick={handleEscalateToGemini}
                  disabled={isAnalyzing}
                  className="w-full py-2 px-3 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-500/50 text-blue-200 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {isAnalyzing
                      ? "Consulting Gemini Vision..."
                      : "Not what you expected? Ask Gemini Vision"}
                  </span>
                </button>
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
