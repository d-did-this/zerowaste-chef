"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  runMobileNetV4Classification,
  runPredefinedCnnClassification,
  MobileNetModel,
} from "@/utils/cnnProduceScanner";
import type * as tfType from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { findMatchingMalaysianIngredient } from "@/utils/malaysianIngredients";
import {
  savePantryItem,
  getAppSettings,
  AppSettings,
} from "@/utils/pantryStorage";

interface ActiveResult {
  name: string;
  nameMalay?: string;
  brand?: string;
  emoji: string;
  confidence: number;
  engineUsed: string;
  category?: string;
  suggestedUnit?: string;
  culinaryNote?: string;
  topRankings?: Array<{
    name: string;
    nameMalay: string;
    emoji: string;
    confidence: number;
  }>;
}

interface NeumorphicScannerProps {
  engine?: "hybrid" | "cnn_v4" | "gemini";
}

export default function NeumorphicScannerView({
  engine = "hybrid",
}: NeumorphicScannerProps) {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelV4Ref = useRef<tfType.GraphModel | null>(null);
  const modelV2FallbackRef = useRef<MobileNetModel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Result & Interactive States
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ActiveResult | null>(null);
  const [portionCount, setPortionCount] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>("");
  const [isNoteOpen, setIsNoteOpen] = useState<boolean>(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Handle Zoom change (hardware + digital)
  const handleZoomChange = async (level: number) => {
    setZoomLevel(level);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          if (capabilities && capabilities.zoom) {
            const clamped = Math.max(
              capabilities.zoom.min || 1,
              Math.min(level, capabilities.zoom.max || 5)
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({
              advanced: [{ zoom: clamped }],
            });
          }
        } catch (e) {
          console.warn("Hardware zoom error:", e);
        }
      }
    }
  };

  // App Settings
  const [settings] = useState<AppSettings>(() => getAppSettings());

  // 1. Initialize MobileNet v4 Core
  const initModels = useCallback(async () => {
    try {
      setModelStatus("loading");
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();

      try {
        const loaded = await tf.loadGraphModel(
          "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_large_100_224/classification/5/default/1",
          { fromTFHub: true }
        );
        modelV4Ref.current = loaded;
        setModelStatus("ready");
      } catch {
        const fallback = await mobilenet.load({ version: 2, alpha: 1.0 });
        modelV2FallbackRef.current = fallback as unknown as MobileNetModel;
        setModelStatus("ready");
      }
    } catch {
      setModelStatus("error");
    }
  }, []);

  useEffect(() => {
    initModels();
  }, [initModels]);

  // 2. Start Live Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }

      // Check flashlight support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      setIsTorchSupported(Boolean(capabilities && capabilities.torch));
      setIsTorchOn(false);
    } catch (err) {
      console.warn("Camera init failed:", err);
      setIsCameraActive(false);
      setCameraError(err instanceof Error ? err.message : "Camera access denied");
    }
  }, [facingMode]);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera, capturedImage]);

  // Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && isTorchSupported) {
      try {
        const nextState = !isTorchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn("Torch failed:", e);
      }
    }
  };

  // Instant Reset / Rescan
  const handleRescan = () => {
    setCapturedImage(null);
    setActiveResult(null);
    setIsAnalyzing(false);
    setIsAddedSuccess(false);
    setPortionCount(1);
    setItemNote("");
    setIsNoteOpen(false);
  };

  // 3. Process Frame
  const processFrame = async (
    source: HTMLCanvasElement | HTMLImageElement,
    previewDataUrl: string
  ) => {
    setIsAnalyzing(true);
    setCapturedImage(previewDataUrl);
    setActiveResult(null);
    setIsAddedSuccess(false);

    try {
      // Direct Gemini mode
      if (engine === "gemini") {
        await runGeminiClassification(previewDataUrl);
        return;
      }

      // Direct CNN v4 mode
      if (engine === "cnn_v4") {
        await runV4Classification(source);
        return;
      }

      // Hybrid Mode (MobileNet v4 First -> Gemini Escalation)
      let cnnResult = null;
      if (modelV4Ref.current) {
        cnnResult = await runMobileNetV4Classification(modelV4Ref.current, source);
      } else if (modelV2FallbackRef.current) {
        cnnResult = await runPredefinedCnnClassification(modelV2FallbackRef.current, source);
      }

      const topConfidence = cnnResult?.confidence ?? 0;
      const runnerUpConfidence = cnnResult?.topRankings?.[1]?.confidence ?? 0;
      const marginGap = topConfidence - runnerUpConfidence;

      // Calibrated Hybrid Gate: >= 80% confidence AND >= 20% margin gap over #2
      const isConfidentEdge =
        cnnResult &&
        topConfidence >= 80 &&
        marginGap >= 20 &&
        cnnResult.topIngredient.id !== "potato";

      if (isConfidentEdge && cnnResult) {
        const local = findMatchingMalaysianIngredient(cnnResult.topIngredient.name, "Vegetables & Greens");
        setActiveResult({
          name: cnnResult.topIngredient.name,
          nameMalay: cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : cnnResult.topIngredient.name),
          emoji: cnnResult.topIngredient.emoji,
          confidence: cnnResult.confidence,
          suggestedUnit: local?.defaultUnit || "pcs",
          category: local?.category || "Produce",
          engineUsed: "MobileNet v4 Edge",
        });
        setPortionCount(1);
        return;
      }

      // Auto-escalate to Gemini Vision with 3-Layer Brand Disambiguation
      await runGeminiClassification(previewDataUrl, cnnResult);
    } catch (e) {
      console.error("Analysis failure:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run V4 classification helper
  const runV4Classification = async (source: HTMLCanvasElement | HTMLImageElement) => {
    if (modelV4Ref.current) {
      const v4Result = await runMobileNetV4Classification(modelV4Ref.current, source);
      const local = findMatchingMalaysianIngredient(v4Result.topIngredient.name, "Vegetables & Greens");
      setActiveResult({
        name: v4Result.topIngredient.name,
        nameMalay: v4Result.topIngredient.nameMalay || (local ? local.nameMalay : v4Result.topIngredient.name),
        emoji: v4Result.topIngredient.emoji,
        confidence: v4Result.confidence,
        suggestedUnit: local?.defaultUnit || "pcs",
        category: local?.category || "Produce",
        engineUsed: "MobileNet v4",
      });
      setPortionCount(1);
    }
  };

  // Run Gemini classification helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runGeminiClassification = async (dataUrl: string, fallbackCnn?: any) => {
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
          setActiveResult({
            name: json.data.name,
            nameMalay: json.data.nameMalay,
            brand: json.data.brand,
            emoji: json.data.emoji || "🥗",
            confidence: json.data.confidence,
            category: json.data.category || "Pantry & Seasonings",
            suggestedUnit: json.data.suggestedUnit || "pcs",
            culinaryNote: json.data.culinaryNote,
            engineUsed: "Gemini Vision AI",
          });
          setPortionCount(json.data.suggestedQuantity || 1);
          return;
        }
      }
    } catch (err) {
      console.warn("Gemini Vision call failed:", err);
    }

    // Graceful fallback to local CNN if available
    if (fallbackCnn) {
      const local = findMatchingMalaysianIngredient(fallbackCnn.topIngredient.name);
      setActiveResult({
        name: fallbackCnn.topIngredient.name,
        nameMalay: fallbackCnn.topIngredient.nameMalay || (local ? local.nameMalay : fallbackCnn.topIngredient.name),
        emoji: fallbackCnn.topIngredient.emoji,
        confidence: fallbackCnn.confidence,
        suggestedUnit: local?.defaultUnit || "pcs",
        engineUsed: "MobileNet v4 Fallback",
      });
    }
  };

  // Option C: Manual Escalation to Gemini
  const handleOptionCEscalate = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    await runGeminiClassification(capturedImage);
    setIsAnalyzing(false);
  };

  // Capture Frame from Live Camera (with Zoom crop support)
  const handleSnapAndScan = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const fullSize = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = 640;
    canvas.height = 640;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Zoom crop: divide crop size by zoomLevel so captured image matches viewport
    const cropSize = fullSize / zoomLevel;
    const startX = ((video.videoWidth || 640) - cropSize) / 2;
    const startY = ((video.videoHeight || 640) - cropSize) / 2;

    ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, 640, 640);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    processFrame(canvas, dataUrl);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => processFrame(img, dataUrl);
      img.src = dataUrl;
      if (img.complete) processFrame(img, dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Automated benchmark test image loading
  const testImageParam = searchParams?.get("testImage");
  const benchmarkRanRef = useRef<string | null>(null);

  useEffect(() => {
    if (!testImageParam || benchmarkRanRef.current === testImageParam) return;
    if (modelStatus !== "ready" && engine !== "gemini") return;

    benchmarkRanRef.current = testImageParam;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setCapturedImage(testImageParam);
      processFrame(img, testImageParam);
    };
    img.src = testImageParam;
  }, [testImageParam, modelStatus, engine]);

  // Portion Counter Steppers
  const handlePortionMinus = () => {
    if (portionCount > 1) {
      setPortionCount((c) => c - 1);
    }
  };

  const handlePortionPlus = () => {
    setPortionCount((c) => c + 1);
  };

  // Confirm & Save to Pantry
  const handleConfirmPantry = () => {
    if (!activeResult) return;

    savePantryItem({
      name: activeResult.name,
      nameMalay: activeResult.nameMalay || activeResult.name,
      emoji: activeResult.emoji,
      category: activeResult.category || "Pantry & Seasonings",
      quantity: portionCount,
      unit: activeResult.suggestedUnit || "pcs",
      confidence: activeResult.confidence,
      engineUsed: activeResult.engineUsed,
      culinaryNote: itemNote || activeResult.culinaryNote || "",
    });

    setIsAddedSuccess(true);
    setTimeout(() => {
      setIsAddedSuccess(false);
    }, 2000);
  };

  const unitLabel = activeResult?.suggestedUnit || "pcs";

  return (
    <div className="w-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-[#161c22]">
      {/* 1. Viewfinder Control Bar */}
      <div className="flex items-center justify-between mb-3 pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full neo-raised">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#68dba9] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006948]"></span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#161c22]">
            {isAnalyzing ? "Analyzing Frame..." : "Live AI Vision Scanner"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Torch Toggle */}
          <button
            aria-label="Toggle Flashlight"
            onClick={toggleTorch}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isTorchOn ? "neo-sunken text-[#006948]" : "neo-raised text-[#3d4a42] hover:text-[#161c22]"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">
              {isTorchOn ? "flashlight_on" : "flashlight_off"}
            </span>
          </button>

          {/* Flip Camera Toggle */}
          <button
            aria-label="Flip Camera"
            onClick={toggleCameraFacing}
            className="w-9 h-9 rounded-full neo-raised flex items-center justify-center text-[#3d4a42] hover:text-[#161c22] active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
          </button>
        </div>
      </div>

      {/* 2. Neumorphic Camera Viewfinder (Expanded Bigger Grid) */}
      <div className="relative w-full rounded-2xl p-2 neo-sunken overflow-hidden mb-2">
        <div className="relative w-full aspect-[3/4] sm:aspect-square min-h-[380px] max-h-[500px] rounded-xl overflow-hidden bg-[#e3e9f1] flex items-center justify-center">
          {/* Live Video Element with Smooth Digital/Hardware Zoom */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease-out",
            }}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isCameraActive && !capturedImage ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Captured Snapshot Overlay */}
          {capturedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedImage}
              alt="Captured target"
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          )}

          {/* Camera Error / Placeholder */}
          {cameraError && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#dde3eb]">
              <span className="material-symbols-outlined text-3xl text-zinc-400 mb-1">no_photography</span>
              <p className="text-xs text-[#3d4a42]">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-2 px-3 py-1 neo-raised rounded-full text-xs font-bold text-[#006948]"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Subtle Ambient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15 pointer-events-none"></div>

          {/* Animated Laser Scanline */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#85f8c4] to-transparent opacity-90 animate-scan-move pointer-events-none"></div>

          {/* HUD Reticle Target Box (100% Crystal-Clear Transparent) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl border border-emerald-400/40 !bg-transparent p-1 shadow-[0_0_15px_rgba(104,219,169,0.15)]">
              {/* Corner Brackets */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-tl-lg border-t-4 border-l-4 border-[#006948]"></div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-[#006948] rounded-tr-lg"></div>
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-[#006948] rounded-bl-lg"></div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-[#006948] rounded-br-xl"></div>

              {/* Tag Pill */}
              <div className="absolute top-2 left-2 bg-[#161c22]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[#85f8c4] text-xs">local_florist</span>
                <span className="text-[10px] text-[#f5fff7] font-semibold">
                  {activeResult?.category || "Fresh Produce"}
                </span>
              </div>

              {/* Center Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center opacity-60">
                <svg className="w-10 h-10 text-[#85f8c4]" fill="none" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" fill="currentColor" r="2.5"></circle>
                  <path d="M24 10V18M24 30V38M10 24H18M30 24H38" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Tactile In-Viewfinder Zoom Controls */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 p-1 rounded-full neo-raised bg-[#f0f4f9]/90 backdrop-blur-md shadow-md">
            {[1, 1.5, 2, 3].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => handleZoomChange(z)}
                className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition-all ${
                  zoomLevel === z
                    ? "bg-[#006948] text-white shadow-sm"
                    : "text-[#3d4a42] hover:text-[#161c22]"
                }`}
                title={`Zoom ${z}x`}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Better Positioned Centered Helper Message (Unobstructed View) */}
      <div className="flex items-center justify-center gap-1.5 py-1 px-3 text-[#3d4a42] text-center mb-3">
        <span className="material-symbols-outlined text-[#006948] text-sm">center_focus_strong</span>
        <span className="text-xs font-medium">
          {isAnalyzing ? "Processing neural features..." : "Keep ingredients centered for optimal detection"}
        </span>
      </div>

      {/* 3. Neumorphic Output & Action Card */}
      <div className="w-full rounded-2xl p-4 neo-raised flex flex-col gap-3">
        {activeResult ? (
          <>
            {/* Header: Identity & Verified Match */}
            <div className="flex items-start justify-between gap-2 border-b border-[#dde3eb] pb-2.5">
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="text-3xl p-1 rounded-xl neo-sunken shrink-0">{activeResult.emoji}</span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="material-symbols-outlined text-[#006948] text-sm">check_circle</span>
                    <span className="text-[10px] text-[#006948] uppercase font-bold tracking-wider">
                      Identified Perfectly
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#161c22] tracking-tight truncate">
                    {activeResult.nameMalay || activeResult.name}
                  </h2>
                  <p className="text-[11px] text-[#3d4a42] truncate">
                    {activeResult.name}
                    {activeResult.brand ? ` (${activeResult.brand})` : ""} &bull; {activeResult.engineUsed}
                  </p>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-full neo-sunken flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[#006948] text-xs">verified</span>
                <span className="text-[10px] text-[#161c22] font-bold">{activeResult.confidence}% Match</span>
              </div>
            </div>

            {/* Portion Counter Stepper */}
            <div className="flex items-center justify-between p-3 rounded-xl neo-sunken">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#161c22]">Portion Count</span>
                <span className="text-[10px] text-[#3d4a42]">Adjust detected quantity</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  aria-label="Decrease quantity"
                  onClick={handlePortionMinus}
                  className="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[#ba1a1a] active:scale-95 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base font-bold">remove</span>
                </button>
                <span className="text-xs font-bold text-[#161c22] w-14 text-center select-none">
                  {portionCount} {unitLabel}
                </span>
                <button
                  aria-label="Increase quantity"
                  onClick={handlePortionPlus}
                  className="w-8 h-8 rounded-full neo-raised flex items-center justify-center text-[#006948] active:scale-95 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base font-bold">add</span>
                </button>
              </div>
            </div>

            {/* Add Item Note Section */}
            {isNoteOpen ? (
              <div className="p-3 rounded-xl neo-sunken flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-[#3d4a42]">Pantry / Expiration Note:</label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="e.g. Bought from Lotus, best by Friday"
                  className="w-full text-xs p-2 rounded-lg bg-white border border-[#bccac0] text-[#161c22] focus:outline-[#006948]"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsNoteOpen(true)}
                className="w-full py-2.5 px-3.5 rounded-xl neo-raised flex items-center justify-between text-[#3d4a42] hover:text-[#161c22] active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006948] text-base">edit_note</span>
                  <span className="text-xs font-semibold text-[#161c22]">Add Item Note</span>
                </div>
                <span className="text-[10px] text-[#006948] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">add</span> Note
                </span>
              </button>
            )}

            {/* Option C: 1-Tap Gemini Vision Escalation Pill */}
            {!activeResult.engineUsed.toLowerCase().includes("gemini") && (
              <div className="w-full p-2.5 rounded-xl neo-sunken flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-[#006948] text-sm">auto_awesome</span>
                  <span className="text-[10px] text-[#3d4a42] font-medium truncate">Not what you expected?</span>
                </div>
                <button
                  type="button"
                  onClick={handleOptionCEscalate}
                  disabled={isAnalyzing}
                  className="px-3 py-1 rounded-full neo-raised text-[#006948] text-[10px] font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-xs">psychology</span>
                  <span>{isAnalyzing ? "Consulting..." : "Gemini Vision"}</span>
                </button>
              </div>
            )}

            {/* Primary Action: Confirm & Add to Pantry */}
            <button
              onClick={handleConfirmPantry}
              disabled={isAddedSuccess}
              className={`w-full py-3.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md ${
                isAddedSuccess
                  ? "bg-[#00855d] text-[#f5fff7]"
                  : "bg-[#006948] hover:bg-[#005137] text-white"
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {isAddedSuccess ? "task_alt" : "inventory_2"}
              </span>
              <span>{isAddedSuccess ? "Added to Fridge!" : "Confirm & Add to Pantry"}</span>
            </button>

            {/* Secondary Action Grid: Rescan & Scan Next */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRescan}
                className="w-full py-2.5 px-3 rounded-full neo-raised text-[#161c22] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-base text-[#3d4a42]">replay</span>
                <span>Rescan</span>
              </button>

              <button
                onClick={handleRescan}
                className="w-full py-2.5 px-3 rounded-full neo-raised text-[#161c22] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-base text-[#3d4a42]">qr_code_scanner</span>
                <span>Scan Next</span>
              </button>
            </div>
          </>
        ) : (
          /* Live Shutter Controls (When waiting for scan) */
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs text-[#3d4a42] px-1">
              <span className="font-semibold">Ready to Scan</span>
              <span className="text-[10px] text-zinc-500">Center produce inside the frame</span>
            </div>

            {/* Shutter Button & Upload */}
            <div className="flex items-center gap-2">
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
                className="py-3 px-3.5 rounded-2xl neo-raised text-[#3d4a42] hover:text-[#161c22] text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                type="button"
                title="Upload Photo"
              >
                <span className="material-symbols-outlined text-lg">upload</span>
              </button>

              <button
                onClick={handleSnapAndScan}
                disabled={!isCameraActive || isAnalyzing}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-[#006948] hover:bg-[#005137] text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md disabled:opacity-40"
                type="button"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Produce...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                    <span>Snap &amp; Identify</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
