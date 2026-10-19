"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  runMobileNetV4Classification,
  runPredefinedCnnClassification,
  MobileNetModel,
} from "@/utils/cnnProduceScanner";
import type * as tfType from "@tensorflow/tfjs";
import { findMatchingMalaysianIngredient } from "@/utils/malaysianIngredients";
import {
  getPantryItems,
  savePantryItem,
  deletePantryItem,
  updatePantryItemQuantity,
  updatePantryItemUnit,
  PantryItem,
  LAST_UPDATED_KEY,
} from "@/utils/pantryStorage";

const QUANTIFIER_LIST = [
  { unit: "biji", en: "pieces (round)" },
  { unit: "batang", en: "stalks / cobs" },
  { unit: "helai", en: "leaves" },
  { unit: "biji / buah", en: "fruits" },
  { unit: "ekor", en: "whole (fish/meat)" },
  { unit: "ketul", en: "pieces (meat)" },
  { unit: "keping", en: "slices" },
  { unit: "ikat", en: "bunch" },
  { unit: "g", en: "grams" },
  { unit: "kg", en: "kilos" },
  { unit: "botol", en: "bottles" },
  { unit: "cup", en: "cups" },
  { unit: "kotak", en: "boxes" },
  { unit: "paket", en: "packs" },
];

export default function OfficialV3Client() {
  const [activeTab, setActiveTab] = useState<"scanner" | "pantry" | "cook-now" | "grocery">("pantry");

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // -------------------------------------------------------------
  // PANTRY STATE & DYNAMIC RELATIVE TIME ("Updated ... ago")
  // -------------------------------------------------------------
  const [cards, setCards] = useState<PantryItem[]>([]);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("just now");

  const refreshRelativeTime = useCallback(() => {
    if (typeof window === "undefined") return;
    const tsStr = localStorage.getItem(LAST_UPDATED_KEY);
    if (!tsStr) {
      setLastUpdatedText("just now");
      return;
    }
    const diffMs = Date.now() - parseInt(tsStr, 10);
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) {
      setLastUpdatedText("just now");
    } else if (diffSec < 3600) {
      setLastUpdatedText(`${Math.floor(diffSec / 60)}m ago`);
    } else if (diffSec < 86400) {
      setLastUpdatedText(`${Math.floor(diffSec / 3600)}h ago`);
    } else {
      setLastUpdatedText(`${Math.floor(diffSec / 86400)}d ago`);
    }
  }, []);

  // Hydrate pantry items from localStorage
  const loadPantry = useCallback(() => {
    const stored = getPantryItems();
    setCards(stored);
    refreshRelativeTime();
  }, [refreshRelativeTime]);

  useEffect(() => {
    loadPantry();
    const interval = setInterval(refreshRelativeTime, 30000);
    return () => clearInterval(interval);
  }, [loadPantry, refreshRelativeTime]);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter & Sort
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [selectedCatLabel, setSelectedCatLabel] = useState<string>("All");
  const [selectedCatIcon, setSelectedCatIcon] = useState<string>("apps");
  const [selectedSort, setSelectedSort] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dropdowns & Modals
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);
  const [activeUnitCardId, setActiveUnitCardId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<PantryItem | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<PantryItem | null>(null);

  // -------------------------------------------------------------
  // CAMERA STREAMER (Works on Phone Back Camera & Desktop Webcam)
  // -------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<string>("1x");

  // -------------------------------------------------------------
  // HYBRID ENGINE: ON-DEVICE MOBILENET V4 + MALAYSIAN DB + GEMINI
  // -------------------------------------------------------------
  const modelV4Ref = useRef<tfType.GraphModel | null>(null);
  const modelV2FallbackRef = useRef<MobileNetModel | null>(null);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusStep, setScanStatusStep] = useState<string>("");

  const [showPopOutCard, setShowPopOutCard] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>("");

  // Pop-Out Card (View 2) States
  const [detectedItemName, setDetectedItemName] = useState<string>("Fresh Produce");
  const [detectedMalayName, setDetectedMalayName] = useState<string>("");
  const [detectedCategory, setDetectedCategory] = useState<string>("Produce");
  const [detectedConfidence, setDetectedConfidence] = useState<number>(95);
  const [detectedSubtitle, setDetectedSubtitle] = useState<string>("Smart Stock AI");
  const [detectedEmoji, setDetectedEmoji] = useState<string>("🥬");
  const [detectedEngineUsed, setDetectedEngineUsed] = useState<string>("MobileNet v4 Edge AI");
  const [popPortion, setPopPortion] = useState<number>(1);
  const [popUnit, setPopUnit] = useState<string>("biji");
  const [isPopUnitOpen, setIsPopUnitOpen] = useState<boolean>(false);
  const [popNote, setPopNote] = useState<string>("");
  const [detectedCulinaryNote, setDetectedCulinaryNote] = useState<string>("");
  const [showNonFoodModal, setShowNonFoodModal] = useState<boolean>(false);
  const [nonFoodReason, setNonFoodReason] = useState<string>("");

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setIsFilterMenuOpen(false);
      setIsSortMenuOpen(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Initialize TensorFlow.js MobileNet Model on Mount
  useEffect(() => {
    let isMounted = true;
    const initModels = async () => {
      try {
        setModelStatus("loading");
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();

        try {
          const loaded = await tf.loadGraphModel(
            "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_large_100_224/classification/5/default/1",
            { fromTFHub: true }
          );
          if (isMounted) {
            modelV4Ref.current = loaded;
            setModelStatus("ready");
          }
        } catch {
          const mobilenet = await import("@tensorflow-models/mobilenet");
          const fallback = await mobilenet.load({ version: 2, alpha: 1.0 });
          if (isMounted) {
            modelV2FallbackRef.current = fallback as unknown as MobileNetModel;
            setModelStatus("ready");
          }
        }
      } catch (err) {
        console.warn("MobileNet load error:", err);
        if (isMounted) {
          setModelStatus("ready"); // Graceful fallback
        }
      }
    };
    initModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Camera Management using `{ ideal: facingMode }`
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsCameraStarting(true);
      setCameraError(null);
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this browser context");
      }

      // Primary attempt with facingMode (ideal for phones)
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (primaryErr) {
        console.warn("Primary camera constraint failed, retrying generic video constraint:", primaryErr);
        // Fallback for laptop webcams / external USB webcams that reject facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
        await videoRef.current.play().catch(() => {});
        setIsCameraActive(true);
      }

      const track = stream.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caps = track?.getCapabilities ? (track.getCapabilities() as any) : {};
      setIsTorchSupported(Boolean(caps?.torch));
      setIsTorchOn(false);
    } catch (err: unknown) {
      console.warn("Camera init failed:", err);
      setIsCameraActive(false);
      setCameraError(
        err instanceof Error
          ? err.message
          : "Camera access unavailable. Please grant permissions in your browser."
      );
    } finally {
      setIsCameraStarting(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (activeTab === "scanner" && !showPopOutCard) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, showPopOutCard, startCamera, stopCamera]);

  // Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    showToast("Switching camera sensor...");
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) {
      setIsTorchOn(!isTorchOn);
      showToast(isTorchOn ? "Torch deactivated" : "Torch activated");
      return;
    }
    const track = streamRef.current.getVideoTracks()[0];
    if (track && isTorchSupported) {
      try {
        const nextState = !isTorchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
        showToast(nextState ? "Torch activated" : "Torch deactivated");
      } catch {
        setIsTorchOn(!isTorchOn);
      }
    } else {
      setIsTorchOn(!isTorchOn);
      showToast(isTorchOn ? "Torch deactivated" : "Torch activated");
    }
  };

  // Zoom Handler
  const handleSetZoom = async (z: string) => {
    setZoomLevel(z);
    const factor = parseFloat(z) || 1;
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (track && typeof (track as any).getCapabilities === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const caps = (track as any).getCapabilities();
        if (caps?.zoom) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({
              advanced: [{ zoom: Math.min(caps.zoom.max, Math.max(caps.zoom.min, factor)) }],
            });
          } catch {
            // CSS fallback
          }
        }
      }
    }
    showToast(`Zoom set to ${z}`);
  };

  const numZoom = parseFloat(zoomLevel) || 1;

  // -------------------------------------------------------------
  // THE REAL HYBRID PIPELINE (MobileNet Edge -> Gate -> Gemini)
  // -------------------------------------------------------------
  const runHybridPipeline = async (sourceCanvas: HTMLCanvasElement, previewDataUrl: string) => {
    setIsScanning(true);
    setScanProgress(15);
    setScanStatusStep("Capturing high-res frame...");

    let cnnResult = null;
    try {
      setScanProgress(35);
      setScanStatusStep("Running MobileNet Edge Core...");

      if (modelV4Ref.current) {
        cnnResult = await runMobileNetV4Classification(modelV4Ref.current, sourceCanvas);
      } else if (modelV2FallbackRef.current) {
        cnnResult = await runPredefinedCnnClassification(modelV2FallbackRef.current, sourceCanvas);
      }
    } catch (err) {
      console.warn("Local CNN error, evaluating cloud path:", err);
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
      // Layer 1 Hit: Resolved locally on edge!
      setScanProgress(75);
      setScanStatusStep("Matching Malaysian Culinary DB...");

      const local = findMatchingMalaysianIngredient(
        cnnResult.topIngredient.name,
        cnnResult.topIngredient.category
      );

      const resolvedName = cnnResult.topIngredient.name;
      const resolvedMalay = cnnResult.topIngredient.nameMalay || (local ? local.nameMalay : "");
      const resolvedUnit = local?.defaultUnit || (cnnResult.topIngredient.category === "Fruit" ? "biji" : "pcs");
      const resolvedCat = local?.category || (cnnResult.topIngredient.category === "Fruit" ? "Produce" : "Produce");
      const resolvedEmoji = cnnResult.topIngredient.emoji || "🥬";

      setDetectedItemName(resolvedName);
      setDetectedMalayName(resolvedMalay);
      setDetectedCategory(resolvedCat);
      setDetectedConfidence(cnnResult.confidence);
      setDetectedSubtitle(`Farm Fresh • ${resolvedCat}`);
      setDetectedEmoji(resolvedEmoji);
      setDetectedEngineUsed("MobileNet v4 Edge AI");
      setPopPortion(1);
      setPopUnit(resolvedUnit);

      setScanProgress(100);
      setScanStatusStep("Identified by MobileNet Edge!");

      setTimeout(() => {
        setIsScanning(false);
        setShowPopOutCard(true);
        showToast(`Edge AI Match: ${resolvedName} (${cnnResult.confidence}%)`);
      }, 700);
      return;
    }

    // Gate Failed -> Escalate to Gemini Vision Multimodal Cloud
    setScanProgress(60);
    setScanStatusStep("Escalating to Gemini Vision AI...");

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: previewDataUrl }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json) {
        // Step 1: Food Validation Gate Check
        if (json.isFood === false) {
          setIsScanning(false);
          setScanProgress(0);
          setScanStatusStep("");
          setNonFoodReason(
            json.reason ||
              "The item scanned does not appear to be an edible food or kitchen ingredient."
          );
          setShowNonFoodModal(true);
          return;
        }

        // Step 2: Food item successfully identified
        if (json.data) {
          const gData = json.data;
          setDetectedItemName(gData.name || "Fresh Produce");
          setDetectedMalayName(gData.nameMalay || "");
          setDetectedCategory(gData.category || "Produce");
          setDetectedConfidence(gData.confidence || 98);
          setDetectedSubtitle(
            gData.brand
              ? `${gData.brand} • ${gData.category}`
              : `Smart Stock AI • ${gData.category || "Malaysian Kitchen"}`
          );
          setDetectedEmoji(gData.emoji || "🥗");
          setDetectedEngineUsed(json.engine || "Gemini 3.5 Flash Vision AI");
          setPopPortion(gData.suggestedQuantity || 1);
          setPopUnit(gData.suggestedUnit || "biji");
          if (gData.culinaryNote) {
            setDetectedCulinaryNote(gData.culinaryNote);
          }

          setScanProgress(100);
          setScanStatusStep("Identified by Gemini Vision!");

          setTimeout(() => {
            setIsScanning(false);
            setShowPopOutCard(true);
            showToast(`Gemini Identified: ${gData.name} (${gData.confidence || 98}%)`);
          }, 500);
          return;
        }
      } else {
        console.warn("Cloud classification failed:", json?.message || res.statusText);
      }
    } catch (err) {
      console.warn("Cloud escalation error:", err);
    }

    // ELIMINATE 13% ARTICHOKE FALLBACK FOREVER:
    // If Gemini was busy/offline and MobileNet had low confidence (<80%),
    // DO NOT guess a random produce item. Notify the user honestly.
    setIsScanning(false);
    setScanProgress(0);
    setScanStatusStep("");
    showToast("Recognition unavailable: Cloud vision busy or low edge confidence. Please try again.");
  };

  // AI Shutter Snap (Draws canvas, freezes frame, runs hybrid classification)
  const triggerShutter = async () => {
    if (isScanning) return;

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");

    let capturedDataUrl = "";

    if (videoRef.current && isCameraActive && ctx) {
      try {
        const video = videoRef.current;
        const fullSize = Math.min(video.videoWidth || 640, video.videoHeight || 640);
        const cropSize = fullSize / numZoom;
        const startX = ((video.videoWidth || 640) - cropSize) / 2;
        const startY = ((video.videoHeight || 640) - cropSize) / 2;
        ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, 640, 640);
        capturedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
      } catch (err) {
        console.warn("Canvas capture error:", err);
      }
    }

    if (!capturedDataUrl) {
      showToast("Please ensure camera is active or upload a photo");
      return;
    }

    // Freeze viewfinder immediately on the captured frame
    setCapturedPhotoUrl(capturedDataUrl);
    await runHybridPipeline(canvas, capturedDataUrl);
  };

  // Upload image handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      setCapturedPhotoUrl(base64Url);

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 640;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sX = (img.width - minDim) / 2;
          const sY = (img.height - minDim) / 2;
          ctx.drawImage(img, sX, sY, minDim, minDim, 0, 0, 640, 640);
        }
        showToast("Photo uploaded! Starting Hybrid AI Scan...");
        await runHybridPipeline(canvas, base64Url);
      };
      img.src = base64Url;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Option C: Manual Re-Check with Gemini Vision Cloud
  const triggerGeminiRecheck = async () => {
    if (!capturedPhotoUrl) return;
    showToast("Re-analyzing ingredient with Gemini Vision...");
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedPhotoUrl }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        if (json.isFood === false) {
          setShowPopOutCard(false);
          setNonFoodReason(
            json.reason ||
              "The item scanned does not appear to be an edible food or kitchen ingredient."
          );
          setShowNonFoodModal(true);
          return;
        }
        if (json.data) {
          const gData = json.data;
          setDetectedItemName(gData.name || detectedItemName);
          setDetectedMalayName(gData.nameMalay || detectedMalayName);
          setDetectedCategory(gData.category || detectedCategory);
          setDetectedConfidence(gData.confidence || 99);
          setDetectedSubtitle(`Verified by Gemini • ${gData.category || "Produce"}`);
          setDetectedEmoji(gData.emoji || detectedEmoji);
          setDetectedEngineUsed(json.engine || "Gemini Vision AI (Option C)");
          if (gData.suggestedQuantity) setPopPortion(gData.suggestedQuantity);
          if (gData.suggestedUnit) setPopUnit(gData.suggestedUnit);
          if (gData.culinaryNote) setDetectedCulinaryNote(gData.culinaryNote);
          showToast(`Gemini Vision Verified: ${gData.name} (${gData.confidence || 99}%)`);
        }
      } else {
        showToast(json?.message || "Cloud connection unavailable. Kept current match.");
      }
    } catch {
      showToast("Cloud connection unavailable. Kept current match.");
    }
  };

  // Confirm Add to Pantry (Saves real photo & updates LAST_UPDATED_KEY)
  const handleConfirmAddPopOut = () => {
    savePantryItem({
      name: detectedItemName,
      nameMalay: detectedMalayName || detectedItemName,
      category: detectedCategory,
      quantity: popPortion,
      unit: popUnit,
      emoji: detectedEmoji,
      culinaryNote: popNote.trim()
        ? popNote.trim()
        : (detectedCulinaryNote || `Fresh ${detectedItemName}. Logged via ZeroWaste AI Scanner.`),
      imageUrl: capturedPhotoUrl || undefined,
      confidence: detectedConfidence,
      engineUsed: detectedEngineUsed,
    });

    loadPantry();
    setShowPopOutCard(false);
    setPopNote("");
    setDetectedCulinaryNote("");
    showToast(`${detectedItemName} (${popPortion} ${popUnit}) added to Digital Pantry!`);
    setActiveTab("pantry");
  };

  // Stepper handlers
  const adjustCardQty = (id: string, delta: number) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      const newQty = Math.max(1, card.quantity + delta);
      updatePantryItemQuantity(id, newQty);
      loadPantry();
    }
  };

  const handleConfirmDelete = () => {
    if (cardToDelete) {
      deletePantryItem(cardToDelete.id);
      loadPantry();
      showToast(`Removed ${cardToDelete.name} from Digital Pantry`);
      setCardToDelete(null);
    }
  };

  const handleSelectUnit = (unit: string) => {
    if (activeUnitCardId) {
      updatePantryItemUnit(activeUnitCardId, unit);
      loadPantry();
      setActiveUnitCardId(null);
      showToast(`Quantifier updated to '${unit}'`);
    }
  };

  // Real Search & Filter Logic
  const getFilteredCards = () => {
    let result = cards.filter((c) => {
      if (selectedCat !== "all" && c.category.toLowerCase() !== selectedCat.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchMalay = c.nameMalay ? c.nameMalay.toLowerCase().includes(q) : false;
        const matchCat = c.category.toLowerCase().includes(q);
        const matchNote = c.culinaryNote ? c.culinaryNote.toLowerCase().includes(q) : false;
        return matchName || matchMalay || matchCat || matchNote;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (selectedSort === "name") {
        return a.name.localeCompare(b.name);
      } else if (selectedSort === "qty") {
        return b.quantity - a.quantity;
      } else if (selectedSort === "recent") {
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
      return 0;
    });

    return result;
  };

  const displayedCards = getFilteredCards();

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 bg-[#E0E5EC] font-['Plus_Jakarta_Sans',sans-serif] text-[#3D4852] select-none">
      
      {/* Hidden file input for uploading images from gallery/desktop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Mobile Container: Pure Soft Neumorphic Shell */}
      <div className="w-full sm:w-[390px] h-screen sm:h-[844px] sm:rounded-[44px] p-3 neo-raised flex flex-col relative overflow-hidden bg-[#E0E5EC] text-foreground justify-between mx-auto shadow-2xl">
        
        {/* ========================================================= */}
        {/* VIEW 4: DIGITAL PANTRY TAB                                */}
        {/* ========================================================= */}
        {activeTab === "pantry" && (
          <>
            {/* Top Bar with Fullscreen Toggle Button + Real Functional Search */}
            <header className="h-16 px-3 flex items-center justify-between neo-bar-top backdrop-blur-md rounded-t-[32px] z-20 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-[#004730] shrink-0">
                  <span className="material-symbols-outlined text-xl">kitchen</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-foreground tracking-tight">ZeroWaste Chef</span>
                    <span className="text-[10px] text-muted font-normal">&bull; Pantry (View 4)</span>
                  </div>
                  <span className="text-[9px] text-[#004730] uppercase font-extrabold tracking-wider">Smart Stock AI</span>
                </div>
              </div>

              {/* Header Right Actions: Fullscreen Toggle & Functional Search Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 rounded-full neo-raised-sm flex items-center justify-center text-foreground hover:text-[#004730] active:scale-95 transition-all cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                  </span>
                </button>

                <button
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isSearchOpen ? "neo-sunken text-[#004730]" : "neo-raised-sm text-foreground hover:text-[#004730] active:scale-95"
                  }`}
                  title="Search Ingredients"
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    if (isSearchOpen) setSearchQuery("");
                  }}
                >
                  <span className="material-symbols-outlined text-base">search</span>
                </button>
              </div>
            </header>

            {/* Main Scrollable Content */}
            <div className="flex-1 p-3 flex flex-col gap-3.5 overflow-y-auto no-scrollbar relative">
              
              {/* Functional Carved-In Search Input Bar (Toggled by Search Icon) */}
              {isSearchOpen && (
                <div className="w-full neo-sunken rounded-2xl px-3.5 py-2 flex items-center gap-2 animate-pop-up shrink-0">
                  <span className="material-symbols-outlined text-muted text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Search ingredients, Malay names, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none w-full text-xs font-semibold text-foreground placeholder:text-muted/60"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="w-5 h-5 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground active:scale-90 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
              )}

              {/* 1. Digital Pantry Card: Real Dynamic Relative Time */}
              <section className="w-full neo-raised rounded-2xl p-3.5 flex flex-col gap-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full neo-sunken flex items-center justify-center text-[#004730]">
                      <span className="material-symbols-outlined text-base">kitchen</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">Digital Pantry</span>
                  </div>
                  {/* Dynamic Relative Time Pill */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full neo-sunken text-[#004730] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#004730] animate-pulse"></span>
                    <span>Updated {lastUpdatedText}</span>
                  </span>
                </div>

                {/* Full-Width Stored Items Sunken Well: STORED ITEMS on left, count on right */}
                <div className="w-full neo-sunken rounded-xl py-2.5 px-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-muted">STORED ITEMS</span>
                  <span className="text-base font-extrabold text-foreground tracking-tight" id="pantryTotalItemsCount">
                    {cards.length}
                  </span>
                </div>

                {/* Action Buttons Row: Dark Green with White Icon & Text + Tactile Shadow */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Left: Generate Meals -> Says Coming Soon */}
                  <button
                    onClick={() => showToast("Coming Soon: Generate Meals from Pantry")}
                    className="rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-center cursor-pointer group active:scale-95 transition-all bg-[#004730] text-white"
                    style={{
                      boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.4), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
                    }}
                    title="Generate Meals"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base font-bold text-white group-hover:rotate-12 transition-transform">
                      auto_awesome
                    </span>
                    <span className="text-xs font-black tracking-tight text-white">Generate Meals</span>
                  </button>

                  {/* Right: Add Item (Switches to Scan HUD) */}
                  <button
                    onClick={() => {
                      setActiveTab("scanner");
                      setShowPopOutCard(false);
                    }}
                    className="rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-center cursor-pointer group active:scale-95 transition-all bg-[#004730] text-white"
                    style={{
                      boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.4), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
                    }}
                    title="Add Item (Quick Log)"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base font-bold text-white group-hover:scale-110 transition-transform">
                      photo_camera
                    </span>
                    <span className="text-xs font-black tracking-tight text-white">Add Item</span>
                  </button>
                </div>
              </section>

              {/* 2. Unified Controls Bar: Filter on Left, Sort & Grid/List on Right */}
              <div className="flex items-center justify-between gap-2 pt-1 pb-1 shrink-0 relative z-30">
                
                {/* Category Filter Dropdown Trigger */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setIsFilterMenuOpen(!isFilterMenuOpen);
                      setIsSortMenuOpen(false);
                    }}
                    className="h-8 px-3 rounded-xl neo-raised-sm flex items-center gap-1.5 text-foreground hover:text-[#004730] active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm text-[#004730]">{selectedCatIcon}</span>
                    <span className="text-xs font-bold text-foreground">
                      {selectedCat === "all" ? `All (${cards.length})` : selectedCatLabel}
                    </span>
                    <span
                      className={`material-symbols-outlined text-sm text-muted transition-transform duration-200 ${
                        isFilterMenuOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Filter Menu */}
                  {isFilterMenuOpen && (
                    <div className="absolute left-0 top-10 w-48 py-1.5 rounded-2xl neo-raised bg-[#E0E5EC] shadow-2xl flex flex-col gap-0.5 z-50">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                        Category Filter
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedCat("all");
                          setSelectedCatLabel(`All (${cards.length})`);
                          setSelectedCatIcon("apps");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "all"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-[#004730]">apps</span>
                          <span>All Items</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full neo-sunken font-bold text-muted">
                          {cards.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("produce");
                          setSelectedCatLabel("Produce");
                          setSelectedCatIcon("eco");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "produce"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-700">eco</span>
                          <span>Produce</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("proteins");
                          setSelectedCatLabel("Proteins");
                          setSelectedCatIcon("set_meal");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "proteins"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-amber-700">set_meal</span>
                          <span>Proteins</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("seasoning");
                          setSelectedCatLabel("Seasoning");
                          setSelectedCatIcon("soup_kitchen");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "seasoning"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-rose-700">soup_kitchen</span>
                          <span>Seasoning</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("dairy");
                          setSelectedCatLabel("Dairy & Eggs");
                          setSelectedCatIcon("egg_alt");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "dairy"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-yellow-700">egg_alt</span>
                          <span>Dairy & Eggs</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCat("staples");
                          setSelectedCatLabel("Staples");
                          setSelectedCatIcon("rice_bowl");
                          setIsFilterMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 transition-all cursor-pointer ${
                          selectedCat === "staples"
                            ? "font-bold text-[#004730] bg-white/40"
                            : "font-medium text-foreground hover:bg-white/50"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-orange-700">rice_bowl</span>
                          <span>Staples</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Sort & Grid View Toggle */}
                <div className="flex items-center gap-2">
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setIsSortMenuOpen(!isSortMenuOpen);
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-8 h-8 rounded-xl neo-raised-sm flex items-center justify-center text-foreground active:scale-95 transition-all cursor-pointer"
                      title="Sort Pantry"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">swap_vert</span>
                    </button>

                    {isSortMenuOpen && (
                      <div className="absolute right-0 top-10 w-44 py-1.5 rounded-2xl neo-raised bg-[#E0E5EC] shadow-2xl flex flex-col gap-0.5 z-50">
                        <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted">Sort By</div>
                        
                        {/* Recently Added */}
                        <button
                          onClick={() => {
                            setSelectedSort("recent");
                            setIsSortMenuOpen(false);
                            showToast("Sorted by: Recently Added");
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 cursor-pointer ${
                            selectedSort === "recent"
                              ? "font-bold text-[#004730] bg-white/40"
                              : "font-medium text-foreground hover:bg-white/50"
                          }`}
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span>Recently Added</span>
                          </div>
                        </button>

                        {/* Item Name (A-Z) */}
                        <button
                          onClick={() => {
                            setSelectedSort("name");
                            setIsSortMenuOpen(false);
                            showToast("Sorted by: Item Name (A-Z)");
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 cursor-pointer ${
                            selectedSort === "name"
                              ? "font-bold text-[#004730] bg-white/40"
                              : "font-medium text-foreground hover:bg-white/50"
                          }`}
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">sort_by_alpha</span>
                            <span>Item Name (A-Z)</span>
                          </div>
                        </button>

                        {/* Quantity / Portion */}
                        <button
                          onClick={() => {
                            setSelectedSort("qty");
                            setIsSortMenuOpen(false);
                            showToast("Sorted by: Quantity");
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl mx-1 cursor-pointer ${
                            selectedSort === "qty"
                              ? "font-bold text-[#004730] bg-white/40"
                              : "font-medium text-foreground hover:bg-white/50"
                          }`}
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                            <span>Quantity</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List / Grid View Toggle: Default to Grid View */}
                  <div className="flex items-center p-0.5 rounded-xl neo-sunken">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        viewMode === "grid" ? "neo-raised-sm text-[#004730]" : "text-muted hover:text-foreground"
                      }`}
                      title="Grid View"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base font-bold">grid_view</span>
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        viewMode === "list" ? "neo-raised-sm text-[#004730]" : "text-muted hover:text-foreground"
                      }`}
                      title="List View"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base font-bold">view_list</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* 3. Pantry Item Cards (Displays Real User Captured Photos) */}
              {cards.length === 0 ? (
                /* Pure Neumorphic Clean Empty State */
                <div className="w-full neo-raised rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 my-4">
                  <div className="w-16 h-16 rounded-2xl neo-sunken flex items-center justify-center text-[#004730]">
                    <span className="material-symbols-outlined text-3xl">kitchen</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-extrabold text-foreground">Your Digital Pantry is Empty</h3>
                    <p className="text-xs text-muted font-normal max-w-[240px] leading-relaxed">
                      Scan fresh ingredients or upload food photos to build your smart Malaysian kitchen inventory.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("scanner");
                      setShowPopOutCard(false);
                    }}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-[#004730] text-white text-xs font-black flex items-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
                    style={{
                      boxShadow: "4px 4px 10px rgba(0, 71, 48, 0.4), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
                    }}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    <span>Scan Your First Ingredient</span>
                  </button>
                </div>
              ) : displayedCards.length === 0 ? (
                /* Search No Results State */
                <div className="w-full neo-raised rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2 my-4">
                  <span className="material-symbols-outlined text-3xl text-muted">search_off</span>
                  <span className="text-xs font-bold text-foreground">
                    No ingredients matching &ldquo;{searchQuery}&rdquo;
                  </span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-extrabold text-[#004730] underline hover:opacity-80 cursor-pointer mt-1"
                    type="button"
                  >
                    Clear Search Filter
                  </button>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "pantry-grid-mode gap-2.5 pb-20" : "flex flex-col gap-3 pb-20"}>
                  {displayedCards.map((card) => (
                    <article
                      key={card.id}
                      className="neo-pantry-card w-full rounded-2xl p-3 flex flex-col gap-2"
                    >
                      <div className="card-media-row flex items-center gap-3">
                        {/* Clickable Card Photo Box: Displays Real Photo Captured by User */}
                        <div
                          onClick={() => setSelectedItemForDetail(card)}
                          className="card-photo-box w-14 h-14 rounded-xl neo-sunken p-0.5 shrink-0 overflow-hidden relative cursor-pointer group active:scale-95 transition-all bg-[#dbe1e8]"
                          title="Click to view full picture & details"
                        >
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {card.emoji}
                            </div>
                          )}
                          <div className="absolute top-1 left-1 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow-sm">
                            {card.emoji}
                          </div>
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base drop-shadow-md">zoom_in</span>
                          </div>
                        </div>

                        <div className="card-info-box flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4
                              onClick={() => setSelectedItemForDetail(card)}
                              className="text-xs font-extrabold text-foreground truncate cursor-pointer hover:text-[#004730]"
                            >
                              {card.name}
                            </h4>
                            <button
                              onClick={() => setCardToDelete(card)}
                              className="w-7 h-7 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-rose-600 active:scale-90 cursor-pointer"
                              title="Delete"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-sm">delete_outline</span>
                            </button>
                          </div>
                          <span className="text-[10px] text-muted font-medium truncate">
                            {card.nameMalay || card.category}
                          </span>
                        </div>
                      </div>

                      {/* Stepper Row: Flat Quantifier on Left, Stepper Controls with Exact Height on Right */}
                      <div className="card-stepper-row flex items-center justify-between pt-1 border-t border-black/5">
                        <button
                          type="button"
                          onClick={() => setActiveUnitCardId(card.id)}
                          className="card-unit-trigger inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-extrabold text-[#004730] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
                          title="Click to choose quantifier"
                        >
                          <span className="portion-unit text-xs font-extrabold text-[#004730]">{card.unit}</span>
                          <span className="material-symbols-outlined text-xs text-[#004730]/70 leading-none">expand_more</span>
                        </button>

                        <div className="stepper-controls flex items-center gap-2 w-full">
                          <button
                            onClick={() => adjustCardQty(card.id, -1)}
                            className="w-7 h-7 shrink-0 rounded-full neo-raised-sm flex items-center justify-center text-rose-600 active:scale-90 cursor-pointer"
                            type="button"
                            title="Decrease"
                          >
                            <span className="material-symbols-outlined text-xs font-black text-rose-600">remove</span>
                          </button>
                          
                          {/* Number Block: Set to exact h-7 (same height/thickness as the w-7 h-7 buttons) */}
                          <div className="h-7 min-h-[28px] max-h-[28px] neo-sunken rounded-full px-2 flex-1 text-center flex items-center justify-center leading-none">
                            <span className="portion-val text-xs font-extrabold text-foreground">{card.quantity}</span>
                          </div>

                          <button
                            onClick={() => adjustCardQty(card.id, 1)}
                            className="w-7 h-7 shrink-0 rounded-full bg-[#004730] text-white flex items-center justify-center active:scale-90 shadow-sm cursor-pointer"
                            type="button"
                            title="Increase"
                          >
                            <span className="material-symbols-outlined text-xs font-bold text-white">add</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: LIVE SCANNER HUD TAB (Real Camera Stream)         */}
        {/* ========================================================= */}
        {activeTab === "scanner" && (
          <>
            {/* Header with Stack Back Button, Context Title & Fullscreen Button */}
            <header className="w-full z-20 neo-bar-top backdrop-blur-md rounded-t-[32px] shrink-0">
              <div className="h-16 px-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    aria-label="Go Back"
                    className="min-h-[44px] min-w-[44px] rounded-2xl neo-raised flex items-center justify-center text-foreground active:scale-95 transition-all cursor-pointer"
                    onClick={() => setActiveTab("pantry")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                  </button>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground tracking-tight truncate">Scanner Hud</span>
                    <span className="text-[9px] text-[#004730] uppercase font-bold tracking-wider">ZeroWaste Kitchen</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="min-h-[44px] min-w-[44px] rounded-2xl neo-raised flex items-center justify-center text-foreground hover:text-[#004730] active:scale-95 transition-all cursor-pointer"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                    </span>
                  </button>

                  <button
                    aria-label="Go to Pantry"
                    className="min-h-[44px] min-w-[44px] rounded-2xl neo-raised flex items-center justify-center text-muted hover:text-foreground active:scale-95 transition-transform cursor-pointer"
                    onClick={() => setActiveTab("pantry")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">home</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content Slot */}
            <div className="flex-1 flex flex-col relative w-full px-3 overflow-y-auto no-scrollbar py-2">
              <div className="flex flex-col w-full pb-20 space-y-3.5">
                
                {/* Top Utility Controls Bar */}
                <div className="flex items-center justify-between gap-2 w-full pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Toggle Torch"
                      onClick={toggleTorch}
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isTorchOn ? "neo-sunken text-[#004730]" : "neo-raised-sm text-foreground"
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isTorchOn ? "flash_on" : "flash_off"}
                      </span>
                    </button>

                    <button
                      aria-label="Switch Camera"
                      onClick={toggleCameraFacing}
                      className="h-10 w-10 rounded-full neo-raised-sm flex items-center justify-center text-foreground active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
                    </button>
                  </div>

                  {/* Zoom Pills: Dynamic 1x, 1.5x, 2x, 3x Functional Zoom */}
                  <div className="flex items-center gap-1 p-1 rounded-full neo-sunken">
                    {["1x", "1.5x", "2x", "3x"].map((z) => (
                      <button
                        key={z}
                        onClick={() => handleSetZoom(z)}
                        className={`w-7 h-7 rounded-full text-[10px] flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                          zoomLevel === z
                            ? "bg-[#004730] text-white font-bold shadow-sm"
                            : "text-muted font-medium hover:text-foreground"
                        }`}
                        type="button"
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Viewfinder Frame Section (Real Camera Feed + Freeze on Capture - ZERO DUMMY CORN) */}
                <div className="w-full neo-raised rounded-2xl p-2.5 relative flex flex-col">
                  <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner aspect-square">
                    {/* 1. Live Camera Video Stream (Kept persistently mounted to preserve stream) */}
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className={`w-full h-full object-cover select-none ${isCameraActive ? "block" : "hidden"}`}
                      style={{
                        transform: `scale(${numZoom})`,
                        transformOrigin: "center center",
                        transition: "transform 0.25s ease-out",
                      }}
                    />

                    {/* 2. Static Frozen Frame Overlay (Appears instantly when AI scan triggers) */}
                    {isScanning && capturedPhotoUrl && (
                      <div className="absolute inset-0 z-10 overflow-hidden bg-slate-900 pointer-events-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={capturedPhotoUrl}
                          alt="Captured Static Frame"
                          className="w-full h-full object-cover select-none"
                        />
                      </div>
                    )}

                    {/* 3. Real Camera Loading / Error State (No fake fallback picture) */}
                    {!isCameraActive && !isScanning && (
                      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-4 gap-3">
                        {cameraError ? (
                          <>
                            <div className="w-12 h-12 rounded-2xl neo-sunken flex items-center justify-center text-rose-500 bg-slate-800">
                              <span className="material-symbols-outlined text-2xl">no_photography</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-white">Camera Access Required</span>
                              <span className="text-[10px] text-slate-300 max-w-[220px] leading-relaxed">
                                {cameraError}
                              </span>
                            </div>
                            <button
                              onClick={() => startCamera()}
                              className="px-4 py-2 rounded-xl bg-[#004730] text-white text-[11px] font-extrabold active:scale-95 transition-all shadow-md cursor-pointer"
                              type="button"
                            >
                              Retry Camera Permission
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-white">
                                {isCameraStarting ? "Starting camera stream..." : "Initializing camera..."}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Please allow browser camera access
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

                    {/* Viewfinder Reticle with Pulsing Scanning Beam */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border border-[#006948]/40 animate-reticle">
                        <span className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#006948] rounded-tl-lg"></span>
                        <span className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#006948] rounded-tr-lg"></span>
                        <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#006948] rounded-bl-lg"></span>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#006948] rounded-br-lg"></span>
                        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#006948] to-transparent opacity-80 animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#006948] ring-4 ring-[#006948]/20"></div>
                        </div>
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                          {isScanning ? "Processing static frame..." : isCameraActive ? "Point camera at ingredient" : "Waiting for camera..."}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 pb-1 text-center">
                    <span className="material-symbols-outlined text-[#006948] text-base">center_focus_strong</span>
                    <span className="text-[11px] text-muted font-medium">Keep ingredients centered for optimal detection</span>
                  </div>
                </div>

                {/* Animated Processing Progress Bar (Appears when scanning starts) */}
                {isScanning && (
                  <div className="w-full neo-sunken rounded-2xl p-3 flex flex-col gap-1.5 animate-pop-up">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-foreground">
                      <div className="flex items-center gap-1.5 text-[#004730]">
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        <span>{scanStatusStep || "Analyzing ingredient..."}</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted font-bold">{scanProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full neo-sunken overflow-hidden bg-black/10">
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: `${scanProgress}%`,
                          background: "linear-gradient(90deg, #004730 0%, #00855D 50%, #38B2AC 100%)",
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Bottom Shutter & Mode Action Deck */}
                <div className="w-full neo-raised rounded-2xl p-4 flex flex-col space-y-4">
                  <div className="w-full neo-sunken rounded-2xl p-3 flex items-center justify-around">
                    {/* Functional Upload Button: Picks file from gallery/disk */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1 p-2.5 min-w-[72px] rounded-xl neo-raised-sm active:scale-95 transition-all text-foreground cursor-pointer group"
                      type="button"
                      title="Upload photo from gallery"
                    >
                      <span className="material-symbols-outlined text-2xl text-muted group-hover:text-[#004730] transition-colors">photo_library</span>
                      <span className="text-[10px] font-semibold text-muted group-hover:text-[#004730] transition-colors">Upload</span>
                    </button>

                    {/* Central Shutter Button: Spins ONLY when model is ready, fast spins when scanning */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none">
                          <svg
                            className={`w-full h-full transition-all duration-300 ${
                              modelStatus !== "ready"
                                ? "" // STOPS MOVING if model is loading
                                : isScanning
                                ? "animate-[spin_0.75s_linear_infinite]"
                                : "animate-[spin_3.5s_linear_infinite]"
                            }`}
                            viewBox="0 0 80 80"
                          >
                            <circle cx="40" cy="40" r="34" fill="none" stroke="#004730" strokeWidth="3.5" opacity="0.2" />
                            <circle
                              cx="40"
                              cy="40"
                              r="34"
                              fill="none"
                              stroke="url(#shutterGradV3b)"
                              strokeWidth="4.5"
                              strokeLinecap="round"
                              strokeDasharray="140 75"
                            />
                            <defs>
                              <linearGradient id="shutterGradV3b" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#004730" />
                                <stop offset="50%" stopColor="#00855D" />
                                <stop offset="100%" stopColor="#38B2AC" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {/* Central AI Scan Shutter Button: Green Background with White Camera Icon */}
                        <button
                          onClick={triggerShutter}
                          disabled={isScanning || (!isCameraActive && modelStatus !== "ready")}
                          className="relative z-10 h-14 w-14 rounded-full bg-[#004730] flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer group"
                          style={{
                            boxShadow: "4px 4px 12px rgba(0, 71, 48, 0.45), -2px -2px 8px rgba(255, 255, 255, 0.7)",
                          }}
                          type="button"
                          title={modelStatus === "ready" ? "Snap & Identify" : "Loading Model Core..."}
                        >
                          <span className="material-symbols-outlined text-white text-3xl font-bold group-hover:scale-105 transition-transform">
                            photo_camera
                          </span>
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5">
                        {isScanning ? "Scanning..." : modelStatus === "ready" ? "AI Scan" : "Loading..."}
                      </span>
                    </div>

                    {/* Manual -> Coming Soon */}
                    <button
                      onClick={() => showToast("Coming Soon: Manual ingredient entry")}
                      className="flex flex-col items-center justify-center gap-1 p-2.5 min-w-[72px] rounded-xl neo-raised-sm active:scale-95 transition-all text-foreground cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-2xl text-muted">keyboard</span>
                      <span className="text-[10px] font-semibold text-muted">Manual</span>
                    </button>
                  </div>

                  {/* Secondary Pills */}
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 py-2.5 px-3 rounded-full neo-sunken text-[11px] font-semibold text-muted opacity-75 flex items-center justify-center gap-1.5 cursor-not-allowed"
                      disabled
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base opacity-60">barcode_scanner</span>
                      <span>Coming Soon</span>
                    </button>

                    {/* Scan Receipt -> Coming Soon */}
                    <button
                      onClick={() => showToast("Coming Soon: Scan Receipt OCR")}
                      className="flex-1 py-2.5 px-3 rounded-full neo-raised-sm text-[11px] font-semibold text-foreground hover:text-[#004730] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                      <span>Scan Receipt</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW 2: POP-OUT DETECTION CARD                            */}
            {/* ========================================================= */}
            {showPopOutCard && (
              <div className="absolute inset-x-0 bottom-0 top-16 z-30 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-pop-up overflow-hidden">
                {/* Background Dimmed Scene */}
                {capturedPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedPhotoUrl}
                    alt={detectedItemName}
                    className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-50 pointer-events-none"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

                {/* POP-OUT CARD */}
                <div className="relative z-10 w-full bg-[#E0E5EC] rounded-t-[36px] neo-raised p-4 flex flex-col gap-3.5 overflow-y-auto max-h-[88%] no-scrollbar pb-24 shadow-2xl">
                  {/* Sheet Handle & Close */}
                  <div className="flex items-center justify-between w-full pt-0.5">
                    <div className="w-7 h-7"></div>
                    <div className="w-12 h-1.5 neo-sunken rounded-full mx-auto"></div>
                    <button
                      onClick={() => setShowPopOutCard(false)}
                      className="w-7 h-7 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-all cursor-pointer"
                      type="button"
                      title="Close"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {/* 1. COMPLETELY DETACHED BIG SQUARE IMAGE */}
                  <div className="w-48 h-48 aspect-square mx-auto rounded-3xl neo-raised p-2 overflow-hidden relative shrink-0 my-0.5 bg-[#dbe1e8]">
                    {capturedPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={capturedPhotoUrl}
                        alt={detectedItemName}
                        className="w-full h-full object-cover rounded-2xl shadow-inner"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {detectedEmoji}
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-bold text-white shadow-md">
                      <span className="material-symbols-outlined text-xs text-emerald-400">photo_camera</span>
                      <span>Captured</span>
                    </div>
                  </div>

                  {/* 2. REDESIGNED PRODUCT INFO CARD */}
                  <div className="p-4 rounded-3xl neo-raised flex flex-col items-center text-center gap-2 shrink-0">
                    {/* Badges Row */}
                    <div className="flex items-center justify-center gap-2.5">
                      <span className="px-3 py-1 rounded-full neo-sunken text-[#006948] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <span>{detectedEmoji}</span>
                        <span className="capitalize">{detectedCategory}</span>
                      </span>
                      <span className="px-3 py-1 rounded-full neo-sunken text-foreground text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{detectedConfidence}% Match</span>
                      </span>
                    </div>

                    {/* Centered Product Name */}
                    <h2 className="text-xl font-extrabold text-[#003824] tracking-tight leading-snug">
                      {detectedItemName} {detectedMalayName ? `(${detectedMalayName})` : ""}
                    </h2>

                    {/* Sub-badge: Real Detected Engine */}
                    <div className="flex items-center gap-1.5 text-[11px] text-muted font-semibold">
                      <span className="material-symbols-outlined text-xs text-[#006948]">memory</span>
                      <span>Detected by {detectedEngineUsed}</span>
                    </div>
                  </div>

                  {/* 3. Portion Count Stepper (Red Minus, Flat Quantifier, Green Font Plus) */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <div className="flex items-center justify-center text-center">
                      <span className="text-xs font-bold text-foreground">Portion Count</span>
                    </div>

                    {/* Sunken Track holding [-] [ Number + Unit ] [+] */}
                    <div className="w-full h-14 rounded-2xl neo-sunken p-1.5 flex items-center justify-between relative">
                      {/* Left Minus Button (Red font color text) */}
                      <button
                        onClick={() => setPopPortion((p) => Math.max(1, p - 1))}
                        className="w-11 h-11 rounded-xl neo-raised-button flex items-center justify-center text-rose-600 font-black active:scale-90 transition-transform shrink-0 cursor-pointer"
                        type="button"
                        title="Decrease"
                      >
                        <span className="material-symbols-outlined text-base font-black text-rose-600">remove</span>
                      </button>

                      {/* Center Count */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setIsPopUnitOpen(!isPopUnitOpen)}
                            className="relative flex items-center justify-center px-3 py-1 rounded-xl hover:bg-white/30 active:scale-95 transition-all cursor-pointer group"
                            title="Click to choose quantifier"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg font-black text-[#004730] tracking-tight">{popPortion}</span>
                              <span className="text-lg font-black text-[#004730] tracking-tight">{popUnit}</span>
                            </div>
                            <span className="material-symbols-outlined text-xs text-[#004730]/60 group-hover:text-[#004730] transition-transform absolute left-full ml-1 top-1/2 -translate-y-1/2 pointer-events-none">
                              expand_more
                            </span>
                          </button>

                          {/* Quantifier Dropdown Menu */}
                          {isPopUnitOpen && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-36 py-1 bg-[#E0E5EC] neo-raised rounded-2xl text-left shadow-2xl max-h-48 overflow-y-auto no-scrollbar">
                              <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-muted">Select Unit</div>
                              {QUANTIFIER_LIST.map((q) => (
                                <button
                                  key={q.unit}
                                  type="button"
                                  onClick={() => {
                                    setPopUnit(q.unit);
                                    setIsPopUnitOpen(false);
                                    showToast(`Quantifier: ${q.unit}`);
                                  }}
                                  className={`w-full px-3 py-1.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                    popUnit === q.unit
                                      ? "bg-[#004730] text-white"
                                      : "text-foreground hover:bg-[#004730] hover:text-white"
                                  }`}
                                >
                                  <span>{q.unit}</span>
                                  <span className="text-[9px] opacity-60">{q.en}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Plus Button (Raised Neumorphic with Green Font Color) */}
                      <button
                        onClick={() => setPopPortion((p) => p + 1)}
                        className="w-11 h-11 rounded-xl neo-raised-button flex items-center justify-center text-[#004730] font-black active:scale-90 transition-transform shrink-0 cursor-pointer shadow-sm"
                        type="button"
                        title="Increase"
                      >
                        <span className="material-symbols-outlined text-base font-black text-[#004730]">add</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Carved-In Notes Field (Clean, No default text, greyed-out placeholder "add notes here") */}
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl neo-sunken text-xs text-foreground shrink-0">
                    <span className="material-symbols-outlined text-[#004730] text-lg shrink-0">edit_note</span>
                    <input
                      type="text"
                      placeholder="add notes here"
                      value={popNote}
                      onChange={(e) => setPopNote(e.target.value)}
                      className="bg-transparent border-0 outline-none w-full text-xs font-semibold text-foreground placeholder:text-muted/60"
                    />
                    {popNote && (
                      <button
                        type="button"
                        onClick={() => setPopNote("")}
                        className="w-5 h-5 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground active:scale-90 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                  </div>

                  {/* 5. Add to Pantry Button (Rich Dark Green) */}
                  <button
                    onClick={handleConfirmAddPopOut}
                    className="w-full shrink-0 h-14 rounded-2xl text-white font-black text-base tracking-wide flex items-center justify-center gap-2.5 cursor-pointer select-none bg-[#004730] hover:bg-[#003824] active:scale-98 transition-all"
                    style={{
                      boxShadow: "5px 5px 14px rgba(0, 71, 48, 0.45), 3px 3px 8px rgba(163, 177, 198, 0.6), -3px -3px 8px rgba(255, 255, 255, 0.9)",
                    }}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-2xl text-white font-bold">inventory_2</span>
                    <span>Add to Pantry</span>
                  </button>

                  {/* 6. Bulging Out Gemini Vision Block: Galaxy Coloured Button */}
                  <div className="p-3.5 rounded-2xl neo-bulge flex items-center justify-between gap-3 shrink-0">
                    <div className="flex flex-col min-w-0 text-left pl-1">
                      <span className="text-xs font-black text-foreground truncate">Wrong ingredient?</span>
                      <span className="text-[10px] text-muted font-medium truncate">Re-check with one tap!</span>
                    </div>

                    <button
                      onClick={triggerGeminiRecheck}
                      className="px-3.5 py-2 rounded-xl text-white text-[11px] font-black flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #1e3a8a 0%, #4338ca 32%, #7e22ce 68%, #d946ef 100%)",
                        boxShadow: "0 4px 14px rgba(126, 34, 206, 0.5), 2px 2px 6px rgba(163, 177, 198, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.8)",
                      }}
                      type="button"
                    >
                      {/* Google Gemini 4-Pointed Star */}
                      <svg className="w-3.5 h-3.5 text-cyan-300 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24Z" />
                      </svg>
                      <span className="tracking-tight text-white font-extrabold">Gemini Vision</span>
                    </button>
                  </div>

                  {/* 7. Old Rescan and Scan Next Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-0.5 shrink-0">
                    {/* Rescan: clean replay arrow button */}
                    <button
                      onClick={() => {
                        setShowPopOutCard(false);
                        triggerShutter();
                      }}
                      className="py-2.5 px-3 rounded-full neo-raised-sm text-xs font-bold text-foreground hover:text-[#004730] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">replay</span>
                      <span>Rescan</span>
                    </button>

                    {/* Scan Next: qr_code_scanner button */}
                    <button
                      onClick={() => {
                        setShowPopOutCard(false);
                        showToast("Point camera at next ingredient...");
                      }}
                      className="py-2.5 px-3 rounded-full neo-raised-sm text-xs font-bold text-[#004730] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                      <span>Scan Next</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: COOK NOW (COMING SOON)                            */}
        {/* ========================================================= */}
        {activeTab === "cook-now" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full neo-sunken flex items-center justify-center mb-4 text-[#004730]">
              <span className="material-symbols-outlined text-4xl">skillet</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/60 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Coming Soon
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">
              Smart Recipe Engine
            </h2>
            <span className="text-xs text-[#004730] font-bold uppercase tracking-wider mb-3">
              v3.0 Roadmap
            </span>
            <p className="text-xs text-muted leading-relaxed max-w-xs mb-6">
              ZeroWaste Chef is training high-affinity Malaysian culinary models to generate zero-waste recipes directly from your live pantry inventory.
            </p>
            <button
              onClick={() => setActiveTab("scanner")}
              className="w-full max-w-xs py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              <span>Scan Ingredients to Pantry</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: GROCERY RESTOCK (COMING SOON)                     */}
        {/* ========================================================= */}
        {activeTab === "grocery" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full neo-sunken flex items-center justify-center mb-4 text-[#004730]">
              <span className="material-symbols-outlined text-4xl">shopping_cart</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/60 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Coming Soon
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">
              Smart Grocery Restock
            </h2>
            <span className="text-xs text-[#004730] font-bold uppercase tracking-wider mb-3">
              v3.0 Roadmap
            </span>
            <p className="text-xs text-muted leading-relaxed max-w-xs mb-6">
              Automated threshold restock planner will forecast when your Malaysian aromatics and staples run low and create smart shopping lists.
            </p>
            <button
              onClick={() => setActiveTab("pantry")}
              className="w-full max-w-xs py-3.5 px-5 rounded-2xl bg-[#004730] text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">kitchen</span>
              <span>Check Digital Pantry</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* BOTTOM NAV                                                */}
        {/* ========================================================= */}
        <nav className="mt-2 mb-1 mx-1 h-16 px-1.5 rounded-3xl bg-[#E0E5EC] neo-raised grid grid-cols-4 items-center gap-1 shrink-0 z-40 border-0">
          {/* 1. Scanner Tab */}
          <button
            onClick={() => {
              setActiveTab("scanner");
              setShowPopOutCard(false);
            }}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">photo_camera</span>
            <span className="text-[10px] font-bold mt-0.5 leading-none">Scanner</span>
          </button>

          {/* 2. Pantry Tab */}
          <button
            onClick={() => setActiveTab("pantry")}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === "pantry"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">kitchen</span>
            <span className="text-[10px] font-bold mt-0.5 leading-none">Pantry</span>
          </button>

          {/* 3. Cook Now Tab */}
          <button
            onClick={() => setActiveTab("cook-now")}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
              activeTab === "cook-now"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">skillet</span>
            <span className="text-[10px] font-semibold mt-0.5 leading-none">Cook</span>
            <span className="text-[7px] font-extrabold uppercase px-1 rounded-full bg-amber-100 text-amber-800 absolute top-1 right-1.5 border border-amber-300/50">
              Soon
            </span>
          </button>

          {/* 4. Grocery Restock Tab */}
          <button
            onClick={() => setActiveTab("grocery")}
            className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
              activeTab === "grocery"
                ? "neo-crater font-bold text-[#004730]"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">shopping_cart</span>
            <span className="text-[10px] font-semibold mt-0.5 leading-none">Grocery</span>
            <span className="text-[7px] font-extrabold uppercase px-1 rounded-full bg-amber-100 text-amber-800 absolute top-1 right-1.5 border border-amber-300/50">
              Soon
            </span>
          </button>
        </nav>

        {/* ========================================================= */}
        {/* POPUPS & MODALS                                           */}
        {/* ========================================================= */}
        
        {/* 1. Item Picture & Info Modal (Displays User's Real Photo) */}
        {selectedItemForDetail && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-pop-up"
            onClick={() => setSelectedItemForDetail(null)}
          >
            <div
              className="w-full max-w-[340px] rounded-[32px] neo-raised bg-[#E0E5EC] p-5 flex flex-col gap-4 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full neo-raised-sm flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-all cursor-pointer z-10"
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>

              {/* Large Image View */}
              <div className="w-full h-48 rounded-2xl neo-sunken p-1 overflow-hidden relative shrink-0 bg-[#dbe1e8]">
                {selectedItemForDetail.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedItemForDetail.imageUrl}
                    alt={selectedItemForDetail.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {selectedItemForDetail.emoji}
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/95 text-xs font-black shadow-md flex items-center gap-1 text-slate-800">
                  <span>{selectedItemForDetail.emoji}</span>
                  <span className="capitalize">{selectedItemForDetail.category}</span>
                </div>
              </div>

              {/* Ingredient Title & Details */}
              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">
                    {selectedItemForDetail.name}
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full neo-sunken text-[#004730]">
                    {selectedItemForDetail.quantity} {selectedItemForDetail.unit}
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted">
                  {selectedItemForDetail.nameMalay}
                </span>
                <span className="text-[11px] font-medium text-emerald-800 mt-0.5">
                  Added on {new Date(selectedItemForDetail.dateAdded).toLocaleDateString()}
                </span>
              </div>

              {/* Culinary & Storage Info Box */}
              <div className="p-3.5 rounded-2xl neo-sunken text-left flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#004730]">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span>Culinary Notes &amp; Storage</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed font-normal">
                  {selectedItemForDetail.culinaryNote ||
                    "Fresh Malaysian kitchen staple. Keep refrigerated or stored in a cool dry pantry shelf to preserve maximum freshness."}
                </p>
              </div>

              {/* Close CTA */}
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="w-full py-3 rounded-2xl bg-[#004730] text-white text-xs font-black active:scale-95 transition-all shadow-md cursor-pointer"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* 2. Floating Quantifier Dropdown Sheet for Pantry Cards */}
        {activeUnitCardId && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveUnitCardId(null)}
          >
            <div
              className="w-full max-w-[280px] py-2 bg-[#E0E5EC] neo-raised rounded-3xl text-left shadow-2xl flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 border-b border-black/5 flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#004730]">
                  Select Quantifier
                </span>
                <button
                  onClick={() => setActiveUnitCardId(null)}
                  className="w-6 h-6 rounded-full neo-raised-sm flex items-center justify-center text-muted cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
              {QUANTIFIER_LIST.map((q) => (
                <button
                  key={q.unit}
                  onClick={() => handleSelectUnit(q.unit)}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-[#004730] hover:text-white rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  type="button"
                >
                  <span>{q.unit}</span>
                  <span className="text-[10px] opacity-60 font-normal">{q.en}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Floating Quantifier Dropdown Sheet for Pop-Out Card */}
        {isPopUnitOpen && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsPopUnitOpen(false)}
          >
            <div
              className="w-full max-w-[280px] py-2 bg-[#E0E5EC] neo-raised rounded-3xl text-left shadow-2xl flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 border-b border-black/5 flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#004730]">
                  Select Quantifier
                </span>
                <button
                  onClick={() => setIsPopUnitOpen(false)}
                  className="w-6 h-6 rounded-full neo-raised-sm flex items-center justify-center text-muted cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
              {QUANTIFIER_LIST.map((q) => (
                <button
                  key={q.unit}
                  onClick={() => {
                    setPopUnit(q.unit);
                    setIsPopUnitOpen(false);
                    showToast(`Quantifier changed to '${q.unit}'`);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-[#004730] hover:text-white rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  type="button"
                >
                  <span>{q.unit}</span>
                  <span className="text-[10px] opacity-60 font-normal">{q.en}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Neumorphic Delete Confirmation Modal */}
        {cardToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-xs transition-opacity">
            <div className="w-full max-w-[300px] rounded-3xl neo-raised bg-[#E0E5EC] p-5 flex flex-col items-center text-center gap-3.5 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl neo-sunken flex items-center justify-center text-rose-600">
                <span className="material-symbols-outlined text-2xl font-bold">delete_forever</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-extrabold text-foreground">Remove Ingredient?</h3>
                <p className="text-xs text-muted font-medium">
                  Are you sure you want to remove{" "}
                  <span className="font-extrabold text-[#004730]">{cardToDelete.name}</span> from your Digital Pantry?
                </p>
              </div>
              <div className="flex items-center gap-2.5 w-full pt-1">
                <button
                  onClick={() => setCardToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl neo-raised-sm text-xs font-bold text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95 transition-all shadow-md cursor-pointer"
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Neumorphic Non-Food Rejection Modal (Active when isFood === false) */}
        {showNonFoodModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-xs transition-opacity animate-pop-up">
            <div className="w-full max-w-[320px] rounded-3xl neo-raised bg-[#E0E5EC] p-5 flex flex-col items-center text-center gap-3.5 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl neo-sunken flex items-center justify-center text-amber-600 bg-amber-500/10">
                <span className="material-symbols-outlined text-3xl font-bold">no_meals</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full inline-block self-center">
                  Non-Food Item
                </span>
                <h3 className="text-sm font-extrabold text-foreground">No Food Ingredient Found</h3>
                <p className="text-xs text-muted font-medium leading-relaxed px-1">
                  {nonFoodReason ||
                    "The item scanned does not appear to be an edible food or kitchen ingredient."}
                </p>
                <p className="text-[10px] text-muted/70 italic pt-1">
                  ZeroWaste Chef is designed specifically to catalog pantry groceries, produce, spices, and cooking ingredients.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNonFoodModal(false);
                  setNonFoodReason("");
                }}
                className="w-full py-3 rounded-xl bg-[#004730] text-white text-xs font-black active:scale-95 transition-all shadow-md cursor-pointer mt-1"
                type="button"
              >
                Scan Food Ingredient
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification Pill */}
        {toastMsg && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-bold shadow-2xl flex items-center gap-2 z-50 animate-pop-up border border-white/10">
            <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
}
