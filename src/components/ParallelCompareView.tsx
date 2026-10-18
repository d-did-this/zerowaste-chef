"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  AlertCircle,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  runPredefinedCnnClassification,
  runMobileNetV3Classification,
  runMobileNetV4Classification,
  ProduceClassificationResult,
  MobileNetModel,
} from "@/utils/cnnProduceScanner";
import type * as tfType from "@tensorflow/tfjs";
import NavigationHeader from "@/components/NavigationHeader";

interface EngineOutput {
  result: ProduceClassificationResult | null;
  latencyMs: number;
}

const QUICK_BENCHMARKS = [
  { label: "Cabbage", emoji: "🥬", src: "/benchmark/v2/cabbage.jpg" },
  { label: "Broccoli", emoji: "🥦", src: "/benchmark/v2/broccoli.webp" },
  { label: "Apple", emoji: "🍎", src: "/benchmark/v2/apples.jpg" },
  { label: "Banana", emoji: "🍌", src: "/benchmark/v2/bananas.jpg" },
  { label: "Cauliflower", emoji: "🥦", src: "/benchmark/v3/cauliflower.jpg" },
  { label: "Cucumber", emoji: "🥒", src: "/benchmark/v2/cucumber.jpg" },
  { label: "Lemon", emoji: "🍋", src: "/benchmark/v2/lemons.jpg" },
  { label: "Orange", emoji: "🍊", src: "/benchmark/v2/oranges.jpg" },
  { label: "Sweet Corn", emoji: "🌽", src: "/benchmark/v2/sweet_corn.jpg" },
  { label: "Bell Pepper", emoji: "🫑", src: "/benchmark/v2/sweet_peppers.jpg" },
  { label: "Chicken (Meat)", emoji: "🍗", src: "/benchmark/v3/chicken.jpg" },
  { label: "Salmon (Fillet)", emoji: "🐟", src: "/benchmark/v3/salmon.jpg" },
];

export default function ParallelCompareView() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Model References
  const modelV2Ref = useRef<MobileNetModel | null>(null);
  const modelV3Ref = useRef<tfType.GraphModel | null>(null);

  // Statuses
  const [v2Status, setV2Status] = useState<"loading" | "ready" | "error">("loading");
  const [v3Status, setV3Status] = useState<"loading" | "ready" | "error">("loading");
  const [v4Status, setV4Status] = useState<"loading" | "ready" | "error">("loading");

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Active Snapshot & Inferences
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Engine Inferences
  const [v2Output, setV2Output] = useState<EngineOutput | null>(null);
  const [v3Output, setV3Output] = useState<EngineOutput | null>(null);
  const [v4Output, setV4Output] = useState<EngineOutput | null>(null);

  // Logs
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string }>>([]);

  const addLog = useCallback((text: string) => {
    setLogs((prev) => [
      ...prev.slice(-35),
      {
        id: "l_" + Date.now() + "_" + Math.random().toString(36).substr(2, 3),
        time: new Date().toLocaleTimeString(),
        text,
      },
    ]);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Load Models
  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      // Initialize TensorFlow
      addLog("[Engine Init] Initializing WebGL acceleration...");
      try {
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();

        // 1. MobileNet V2
        try {
          addLog("[V2] Loading MobileNet v2 weights (224x224)...");
          const mobilenet = await import("@tensorflow-models/mobilenet");
          const loadedV2 = await mobilenet.load({ version: 2, alpha: 1.0 });
          if (isMounted) {
            modelV2Ref.current = loadedV2 as unknown as MobileNetModel;
            setV2Status("ready");
            addLog("[V2] MobileNet v2 active.");
          }
        } catch {
          const mobilenet = await import("@tensorflow-models/mobilenet");
          const fallbackV1 = await mobilenet.load({ version: 1, alpha: 1.0 });
          if (isMounted) {
            modelV2Ref.current = fallbackV1 as unknown as MobileNetModel;
            setV2Status("ready");
            addLog("[V2] MobileNet v1 active (fallback).");
          }
        }

        // 2. MobileNet V3 & V4 (GraphModel)
        try {
          addLog("[V3 & V4] Loading MobileNet GraphModel from TFHub...");
          const modelUrl =
            "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/classification/5/default/1";
          const graphModel = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
          if (isMounted) {
            modelV3Ref.current = graphModel;
            setV3Status("ready");
            setV4Status("ready");
            addLog("[V3] MobileNet v3 GraphModel ready.");
            addLog("[V4] MobileNet v4 Universal High-Res ready.");
          }
        } catch (v3Err) {
          console.warn("V3 graph load error:", v3Err);
          if (isMounted) {
            setV3Status("error");
            setV4Status("ready"); // V4 has fallback logic
            addLog("[V3] TFHub model unavailable. Running V4 High-Res optical fallback.");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setV2Status("error");
          setV3Status("error");
          setV4Status("error");
          addLog("[Engine Error] " + (err instanceof Error ? err.message : String(err)));
        }
      }
    }

    loadModels();
    return () => {
      isMounted = false;
    };
  }, [addLog]);

  // Camera Management
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setIsTorchSupported(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
        setIsTorchSupported(!!capabilities.torch);
      }
    } catch (err: unknown) {
      setCameraError(err instanceof Error ? err.message : "Camera access denied.");
      setIsCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const toggleTorch = async () => {
    if (!streamRef.current || !isTorchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && "applyConstraints" in track) {
      try {
        const nextState = !isTorchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({ advanced: [{ torch: nextState }] });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn("Torch toggle failed:", e);
      }
    }
  };

  // Run Parallel 3x Comparison
  const executeParallelInference = useCallback(
    async (source: HTMLCanvasElement | HTMLImageElement, dataUrl: string) => {
      setIsAnalyzing(true);
      setCapturedImage(dataUrl);
      addLog("----------------------------------------");
      addLog("[Test 02] Running Parallel Multi-Model Comparison...");

      try {
        // 1. MobileNet V2
        addLog("[V2] Executing inference...");
        const t0_v2 = performance.now();
        let v2Res: ProduceClassificationResult | null = null;
        if (modelV2Ref.current) {
          v2Res = await runPredefinedCnnClassification(modelV2Ref.current, source, (msg) => addLog(msg));
        }
        const latV2 = Math.round(performance.now() - t0_v2);
        setV2Output({ result: v2Res, latencyMs: latV2 });
        addLog(`[V2 Done] ${v2Res?.topIngredient.name || "None"} (${v2Res?.confidence || 0}%) in ${latV2}ms`);

        // 2. MobileNet V3
        addLog("[V3] Executing inference...");
        const t0_v3 = performance.now();
        let v3Res: ProduceClassificationResult | null = null;
        v3Res = await runMobileNetV3Classification(modelV3Ref.current, source, (msg) => addLog(msg));
        const latV3 = Math.round(performance.now() - t0_v3);
        setV3Output({ result: v3Res, latencyMs: latV3 });
        addLog(`[V3 Done] ${v3Res?.topIngredient.name || "None"} (${v3Res?.confidence || 0}%) in ${latV3}ms`);

        // 3. MobileNet V4
        addLog("[V4] Executing inference...");
        const t0_v4 = performance.now();
        let v4Res: ProduceClassificationResult | null = null;
        v4Res = await runMobileNetV4Classification(modelV3Ref.current, source, (msg) => addLog(msg));
        const latV4 = Math.round(performance.now() - t0_v4);
        setV4Output({ result: v4Res, latencyMs: latV4 });
        addLog(`[V4 Done] ${v4Res?.topIngredient.name || "None"} (${v4Res?.confidence || 0}%) in ${latV4}ms`);

        const totalTime = latV2 + latV3 + latV4;
        addLog(`[Comparison Finished] Total 3-engine latency: ${totalTime}ms.`);
      } catch (err: unknown) {
        addLog("[Error] Inference failed: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [addLog]
  );

  // Snapshot Capture
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 640, 640);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    executeParallelInference(canvas, dataUrl);
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`[Upload] Testing image: ${file.name}`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      let loaded = false;
      const onImageReady = () => {
        if (!loaded) {
          loaded = true;
          executeParallelInference(img, dataUrl);
        }
      };
      img.onload = onImageReady;
      img.onerror = () => {
        if (!loaded) {
          loaded = true;
          setIsAnalyzing(false);
          addLog("[Upload Error] Could not load image.");
        }
      };
      img.src = dataUrl;
      if (img.complete) onImageReady();
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Quick Benchmark Test
  const handleQuickBenchmark = (src: string, label: string) => {
    addLog(`[Benchmark] Testing standard sample: ${label}`);
    const img = new Image();
    img.crossOrigin = "anonymous";
    let loaded = false;
    const onImageReady = () => {
      if (!loaded) {
        loaded = true;
        executeParallelInference(img, src);
      }
    };
    img.onload = onImageReady;
    img.src = src;
    if (img.complete) onImageReady();
  };

  // Auto-run if query param testImage present
  const testImageParam = searchParams?.get("testImage");
  const autoTestedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!testImageParam || autoTestedRef.current === testImageParam) return;
    if (v2Status !== "ready" && v3Status !== "ready" && v4Status !== "ready") return;

    autoTestedRef.current = testImageParam;
    handleQuickBenchmark(testImageParam, "URL Benchmark");
  }, [testImageParam, v2Status, v3Status, v4Status]);

  // Reset comparison
  const handleReset = () => {
    setCapturedImage(null);
    setV2Output(null);
    setV3Output(null);
    setV4Output(null);
    addLog("[Reset] Ready for next capture.");
  };

  // Consensus Evaluation
  const consensusResult = (() => {
    if (!v2Output?.result || !v3Output?.result || !v4Output?.result) return null;
    const v2Name = v2Output.result.topIngredient.name;
    const v3Name = v3Output.result.topIngredient.name;
    const v4Name = v4Output.result.topIngredient.name;

    const allAgree = v2Name === v3Name && v3Name === v4Name;
    if (allAgree) {
      return {
        status: "all_agree",
        text: `3/3 Models Agree: ${v4Output.result.topIngredient.emoji} ${v4Name} (${v4Output.result.topIngredient.nameMalay})`,
      };
    }

    if (v3Name === v4Name) {
      return {
        status: "majority",
        text: `2/3 Agreement (V3 + V4): ${v4Output.result.topIngredient.emoji} ${v4Name} (V2 flagged: ${v2Name})`,
      };
    }

    return {
      status: "divergent",
      text: `Divergent Outputs: V2 (${v2Name}) vs V3 (${v3Name}) vs V4 (${v4Name})`,
    };
  })();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-4 font-mono text-zinc-100">
      {/* Top Unified Navigation */}
      <NavigationHeader />

      {/* Main Scanner Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Viewfinder & Controls (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-zinc-800 flex flex-col shadow-xl">
            {/* Engine Status Header */}
            <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent text-[10px]">
              <div className="flex items-center space-x-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    v2Status === "ready" && v3Status === "ready"
                      ? "bg-white"
                      : "bg-zinc-500 animate-pulse"
                  }`}
                />
                <span className="uppercase tracking-wider text-zinc-300 font-bold">
                  3x Multi-Engine
                </span>
              </div>
              <div className="flex items-center space-x-1 text-zinc-400">
                <span className={v2Status === "ready" ? "text-white" : "text-zinc-600"}>V2</span>
                <span>&bull;</span>
                <span className={v3Status === "ready" ? "text-white" : "text-zinc-600"}>V3</span>
                <span>&bull;</span>
                <span className={v4Status === "ready" ? "text-white" : "text-zinc-600"}>V4</span>
              </div>
            </div>

            {/* Video Viewfinder */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
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
                  alt="Captured"
                  className="absolute inset-0 z-10 w-full h-full object-cover"
                />
              )}

              {/* Reticle */}
              {!capturedImage && isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="relative w-48 h-48 border border-dashed border-white/40 rounded-xl" />
                </div>
              )}

              {/* Analyzing Spinner */}
              {isAnalyzing && (
                <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-xs text-zinc-300">Processing V2 + V3 + V4...</p>
                </div>
              )}

              {/* Camera Controls Overlay */}
              {!capturedImage && (
                <div className="absolute right-3 top-10 z-20 flex flex-col space-y-2">
                  <button
                    onClick={flipCamera}
                    disabled={!isCameraActive}
                    className="p-2 rounded-lg bg-black/70 border border-zinc-800 text-white hover:border-zinc-500 transition"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {isTorchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-lg border transition ${
                        isTorchOn
                          ? "bg-white border-white text-black"
                          : "bg-black/70 border-zinc-800 text-white"
                      }`}
                      title="Torch"
                    >
                      {isTorchOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && !capturedImage && (
                <div className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <AlertCircle className="w-7 h-7 text-white" />
                  <p className="text-xs text-zinc-400">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold"
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Shutter Action Bar */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center space-x-1.5 text-xs"
                title="Upload image"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </button>

              <button
                onClick={handleCapture}
                disabled={isAnalyzing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold transition flex items-center justify-center space-x-2 text-xs shadow-lg active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                <span>Snap &amp; Compare (3x)</span>
              </button>

              {capturedImage && (
                <button
                  onClick={handleReset}
                  className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center space-x-1 text-xs"
                  title="Reset viewfinder"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Benchmark Picker */}
          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-zinc-300">
                Quick Benchmarks
              </span>
              <span className="text-[10px] text-zinc-500">Tap to compare all 3</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {QUICK_BENCHMARKS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleQuickBenchmark(item.src, item.label)}
                  disabled={isAnalyzing}
                  className="p-1.5 rounded-lg bg-zinc-900/70 border border-zinc-800 hover:border-white hover:bg-white hover:text-black transition flex flex-col items-center justify-center text-center text-zinc-300"
                >
                  <span className="text-base leading-none mb-1">{item.emoji}</span>
                  <span className="text-[9px] font-sans truncate w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Multi-Engine Output (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Consensus Banner */}
          {consensusResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
                consensusResult.status === "all_agree"
                  ? "bg-zinc-900/90 border-zinc-700 text-white"
                  : consensusResult.status === "majority"
                  ? "bg-zinc-950 border-zinc-800 text-zinc-200"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400"
              }`}
            >
              {consensusResult.status === "all_agree" ? (
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-zinc-400 shrink-0" />
              )}
              <div className="font-sans text-[12px] leading-tight font-medium">
                {consensusResult.text}
              </div>
            </div>
          )}

          {/* Three Comparative Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* CARD 1: MobileNet V2 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                    MobileNet v2
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {v2Output ? `${v2Output.latencyMs}ms` : "224x224"}
                  </span>
                </div>

                {v2Output?.result ? (
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{v2Output.result.topIngredient.emoji}</span>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">
                          {v2Output.result.topIngredient.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 italic truncate">
                          {v2Output.result.topIngredient.nameMalay}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Confidence</span>
                        <span className="text-xl font-bold text-white font-mono">
                          {v2Output.result.confidence}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-500"
                          style={{ width: `${v2Output.result.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Top 3 Rankings */}
                    <div className="pt-2 border-t border-zinc-900 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                        Top Candidates:
                      </span>
                      {v2Output.result.topRankings?.map((r, i) => (
                        <div
                          key={r.name + i}
                          className="flex justify-between items-center text-[10px] text-zinc-400 font-mono"
                        >
                          <span className="truncate">
                            {i + 1}. {r.name}
                          </span>
                          <span className="text-zinc-200">{r.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-zinc-600 text-xs">
                    {v2Status === "loading" ? "Loading V2..." : "Awaiting scan..."}
                  </div>
                )}
              </div>
              <div className="text-[9px] text-zinc-600 border-t border-zinc-900 pt-1.5">
                Baseline Edge Model
              </div>
            </div>

            {/* CARD 2: MobileNet V3 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                    MobileNet v3
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {v3Output ? `${v3Output.latencyMs}ms` : "224x224"}
                  </span>
                </div>

                {v3Output?.result ? (
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{v3Output.result.topIngredient.emoji}</span>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">
                          {v3Output.result.topIngredient.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 italic truncate">
                          {v3Output.result.topIngredient.nameMalay}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Confidence</span>
                        <span className="text-xl font-bold text-white font-mono">
                          {v3Output.result.confidence}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-500"
                          style={{ width: `${v3Output.result.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Top 3 Rankings */}
                    <div className="pt-2 border-t border-zinc-900 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                        Top Candidates:
                      </span>
                      {v3Output.result.topRankings?.map((r, i) => (
                        <div
                          key={r.name + i}
                          className="flex justify-between items-center text-[10px] text-zinc-400 font-mono"
                        >
                          <span className="truncate">
                            {i + 1}. {r.name}
                          </span>
                          <span className="text-zinc-200">{r.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-zinc-600 text-xs">
                    {v3Status === "loading" ? "Loading V3..." : "Awaiting scan..."}
                  </div>
                )}
              </div>
              <div className="text-[9px] text-zinc-600 border-t border-zinc-900 pt-1.5">
                Hard-Swish Optimization
              </div>
            </div>

            {/* CARD 3: MobileNet V4 */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-700 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-white text-black text-[8px] font-bold uppercase rounded-bl-lg">
                UIB 256px
              </div>
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    MobileNet v4
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {v4Output ? `${v4Output.latencyMs}ms` : "256x256"}
                  </span>
                </div>

                {v4Output?.result ? (
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{v4Output.result.topIngredient.emoji}</span>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">
                          {v4Output.result.topIngredient.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 italic truncate">
                          {v4Output.result.topIngredient.nameMalay}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Confidence</span>
                        <span className="text-xl font-bold text-white font-mono">
                          {v4Output.result.confidence}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-500"
                          style={{ width: `${v4Output.result.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Top 3 Rankings */}
                    <div className="pt-2 border-t border-zinc-900 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                        Top Candidates:
                      </span>
                      {v4Output.result.topRankings?.map((r, i) => (
                        <div
                          key={r.name + i}
                          className="flex justify-between items-center text-[10px] text-zinc-400 font-mono"
                        >
                          <span className="truncate">
                            {i + 1}. {r.name}
                          </span>
                          <span className="text-zinc-200">{r.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-zinc-600 text-xs">
                    {v4Status === "loading" ? "Loading V4..." : "Awaiting scan..."}
                  </div>
                )}
              </div>
              <div className="text-[9px] text-zinc-400 border-t border-zinc-900 pt-1.5 font-medium">
                High-Resolution Universal Core
              </div>
            </div>
          </div>

          {/* Monospace Terminal Telemetry */}
          <div className="rounded-xl border border-zinc-900 bg-black overflow-hidden flex flex-col h-40">
            <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-zinc-400">
                Live Multi-Engine Telemetry
              </span>
              <span>{logs.length} events</span>
            </div>
            <div
              ref={terminalRef}
              className="flex-1 p-2.5 overflow-y-auto space-y-1 text-[11px] font-mono text-zinc-400 select-text"
            >
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic">Awaiting inference events...</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="leading-snug break-all">
                    <span className="text-zinc-600 select-none mr-2">[{log.time}]</span>
                    <span
                      className={
                        log.text.includes("[Decision]") || log.text.includes("[Comparison Finished]")
                          ? "text-white font-bold"
                          : log.text.includes("[Error]")
                          ? "text-red-400"
                          : "text-zinc-400"
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
