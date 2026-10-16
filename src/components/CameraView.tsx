"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  matchIngredient,
  IngredientDetection,
  RawPrediction,
} from "@/utils/ingredientClassifier";

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
  const isLoopActiveRef = useRef<boolean>(true);
  const lastClassificationTimeRef = useRef<number>(0);

  // Component states
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Camera settings
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Classification results
  const [detection, setDetection] = useState<IngredientDetection | null>(null);
  const [rawPredictions, setRawPredictions] = useState<RawPrediction[]>([]);
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number>(0);
  const [showRawPredictions, setShowRawPredictions] = useState<boolean>(false);

  // 1. Initialize TensorFlow.js and MobileNet Model
  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      try {
        setIsModelLoading(true);
        setModelError(null);

        // Dynamic client-side imports to avoid Next.js SSR build issues
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();

        const mobilenet = await import("@tensorflow-models/mobilenet");
        // Load MobileNet v2 with alpha 1.0 for accurate kitchen classification
        const loadedModel = await mobilenet.load({
          version: 2,
          alpha: 1.0,
        });

        if (isMounted) {
          modelRef.current = loadedModel;
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error("Failed to load TensorFlow/MobileNet model:", err);
        if (isMounted) {
          setModelError(
            err instanceof Error ? err.message : "Failed to load MobileNet model"
          );
          setIsModelLoading(false);
        }
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

      // Stop any existing tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Check MediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API (getUserMedia) not supported in this browser");
      }

      // Mobile rear-facing camera preference with graceful fallback
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn("Video play error:", e));
          setIsCameraActive(true);
        };
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities?.() as { torch?: boolean }) || {};
        setIsTorchSupported(Boolean(capabilities.torch));
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err instanceof Error
          ? err.message
          : "Unable to access camera. Please grant camera permissions."
      );
      setIsCameraActive(false);
    }
  }, [facingMode]);

  // Start camera on mount & whenever facingMode changes
  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // 3. Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && isTorchSupported) {
      try {
        const nextState = !isTorchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn("Could not toggle torch:", e);
      }
    }
  };

  // 4. Toggle Camera (Front / Rear)
  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // 5. Real-Time Classification Loop
  useEffect(() => {
    let animationFrameId: number;
    isLoopActiveRef.current = true;

    async function runClassification() {
      const now = performance.now();

      // Run inference every 400ms when video is active, model is ready, and not paused
      if (
        !isPaused &&
        isCameraActive &&
        modelRef.current &&
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        now - lastClassificationTimeRef.current >= 400
      ) {
        lastClassificationTimeRef.current = now;

        try {
          const startTime = performance.now();
          const preds = await modelRef.current.classify(videoRef.current, 5);
          const duration = Math.round(performance.now() - startTime);

          setInferenceTimeMs(duration);
          setRawPredictions(preds);

          const matched = matchIngredient(preds);
          if (matched) {
            setDetection(matched);
          } else {
            // Keep previous detection briefly or clear if nothing food-related
            setDetection((prev) => (prev && prev.confidence > 50 ? prev : null));
          }
        } catch (err) {
          console.error("Inference step error:", err);
        }
      }

      if (isLoopActiveRef.current) {
        animationFrameId = requestAnimationFrame(runClassification);
      }
    }

    animationFrameId = requestAnimationFrame(runClassification);

    return () => {
      isLoopActiveRef.current = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraActive, isPaused]);

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col h-[calc(100vh-80px)] sm:h-[800px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Top Header Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            {isCameraActive && !isPaused ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            )}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {isPaused ? "Paused" : isModelLoading ? "Loading AI..." : "Vision AI Active"}
          </span>
        </div>

        {/* Quick Stats Pill */}
        {inferenceTimeMs > 0 && !isModelLoading && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-[11px] font-mono text-emerald-400">
            <Sparkles className="w-3 h-3" />
            <span>{inferenceTimeMs}ms</span>
          </div>
        )}
      </div>

      {/* Main Live Camera Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Target Reticle / Scan Zone in Center */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated Laser Scan Line */}
              {!isPaused && (
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_12px_#34d399]" />
              )}

              {/* Center Crosshair */}
              <div className="w-4 h-4 border-t border-b border-l border-r border-emerald-400/30 rounded-full" />
            </div>

            <p className="mt-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-slate-300 border border-slate-700/40">
              Center ingredient inside box
            </p>
          </div>
        )}

        {/* Floating Quick Action Controls (Right Side) */}
        <div className="absolute right-4 top-16 z-20 flex flex-col space-y-3">
          {/* Flip Camera Button */}
          <button
            onClick={flipCamera}
            disabled={!isCameraActive}
            className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-white shadow-lg active:scale-95 transition-all disabled:opacity-40"
            title="Switch front/rear camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Torch Toggle (if supported on mobile) */}
          {isTorchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-3 rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all ${
                isTorchOn
                  ? "bg-amber-500 border-amber-400 text-slate-950"
                  : "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-white"
              }`}
              title="Toggle Flashlight"
            >
              {isTorchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          {/* Pause / Resume Scan */}
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            disabled={!isCameraActive}
            className={`p-3 rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all ${
              isPaused
                ? "bg-emerald-500 border-emerald-400 text-slate-950"
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-white"
            }`}
            title={isPaused ? "Resume Scanning" : "Freeze / Pause Detection"}
          >
            {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
          </button>

          {/* Toggle Top Predictions Drawer */}
          {rawPredictions.length > 0 && (
            <button
              onClick={() => setShowRawPredictions((prev) => !prev)}
              className={`p-3 rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all ${
                showRawPredictions
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-white"
              }`}
              title="Toggle Detailed Probabilities"
            >
              <Layers className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading / Error States Overlay */}
        {(isModelLoading || !isCameraActive || cameraError || modelError) && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            {cameraError ? (
              <div className="flex flex-col items-center max-w-xs space-y-3">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <h3 className="text-lg font-bold text-white">Camera Access Blocked</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                >
                  Retry Camera
                </button>
              </div>
            ) : modelError ? (
              <div className="flex flex-col items-center max-w-xs space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-500" />
                <h3 className="text-lg font-bold text-white">Model Load Failed</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{modelError}</p>
              </div>
            ) : isModelLoading ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">Warming Up Neural Network</h3>
                  <p className="text-xs text-slate-400">Loading MobileNet CNN for client-side inference...</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <Camera className="w-10 h-10 text-slate-400 animate-pulse" />
                <p className="text-xs text-slate-400">Requesting device camera stream...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw Predictions Details Drawer (Collapsible) */}
      {showRawPredictions && rawPredictions.length > 0 && (
        <div className="absolute bottom-28 inset-x-3 z-30 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-slate-800">
            <span>Raw MobileNet Probabilities</span>
            <span className="text-[10px] text-slate-500 font-mono">Top 5 Classes</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {rawPredictions.map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[200px]">
                  {pred.className}
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Math.round(pred.probability * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Bottom Detection Card / Overlay */}
      <div className="relative z-20 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80">
        {detection ? (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl shadow-inner">
                  {detection.ingredient.emoji}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {detection.ingredient.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-medium text-[10px] uppercase tracking-wider">
                      {detection.ingredient.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Raw Model Label: {detection.rawLabel.split(",")[0]}</span>
                  </p>
                </div>
              </div>

              {/* Bold Confidence Percentage Badge */}
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black tracking-tight text-emerald-400 font-mono">
                  {detection.confidence}%
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Confidence
                </span>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(detection.confidence, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 py-1">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 animate-pulse">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Ready to Classify
              </p>
              <p className="text-xs text-slate-400">
                Hold a raw ingredient (apple, banana, carrot, etc.) in the center box.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
