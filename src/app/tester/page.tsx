"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Camera,
  Play,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";

interface BenchmarkItem {
  id: string;
  num: string;
  title: string;
  scientific: string;
  category: "Vegetables" | "Fruits" | "Fungi" | "Proteins";
  scope: "MobileNetV2" | "MobileNetV3";
  model: string;
  img_src: string;
}

const BENCHMARK_ITEMS: BenchmarkItem[] = [
  // MobileNetV2 Benchmarks
  {
    id: "cabbage_v2",
    num: "01",
    title: "Green Cabbage",
    scientific: "Brassica oleracea var. capitata",
    category: "Vegetables",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/cabbage.jpg",
  },
  {
    id: "apples_v2",
    num: "02",
    title: "Green Apple",
    scientific: "Malus domestica (Granny Smith)",
    category: "Fruits",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/apples.jpg",
  },
  {
    id: "bananas_v2",
    num: "03",
    title: "Cavendish Banana",
    scientific: "Musa acuminata",
    category: "Fruits",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/bananas.jpg",
  },
  {
    id: "cucumber_v2",
    num: "04",
    title: "Mini Cucumber",
    scientific: "Cucumis sativus",
    category: "Vegetables",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/cucumber.jpg",
  },
  {
    id: "lemons_v2",
    num: "05",
    title: "Fresh Lemon",
    scientific: "Citrus limon",
    category: "Fruits",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/lemons.jpg",
  },
  {
    id: "broccoli_v2",
    num: "06",
    title: "Fresh Broccoli",
    scientific: "Brassica oleracea",
    category: "Vegetables",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/broccoli.webp",
  },
  {
    id: "oranges_v2",
    num: "07",
    title: "Navel Orange",
    scientific: "Citrus sinensis",
    category: "Fruits",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/oranges.jpg",
  },
  {
    id: "corn_v2",
    num: "08",
    title: "Sweet Corn",
    scientific: "Zea mays",
    category: "Vegetables",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/sweet_corn.jpg",
  },
  {
    id: "peppers_v2",
    num: "09",
    title: "Sweet Pepper",
    scientific: "Capsicum annuum",
    category: "Vegetables",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/sweet_peppers.jpg",
  },
  {
    id: "mushroom_v2",
    num: "10",
    title: "Fly Agaric Mushroom",
    scientific: "Amanita muscaria",
    category: "Fungi",
    scope: "MobileNetV2",
    model: "MobileNetV2",
    img_src: "/benchmark/v2/mushroom.jpg",
  },

  // MobileNetV3 Benchmarks
  {
    id: "cabbage_v3",
    num: "01",
    title: "Green Cabbage",
    scientific: "Brassica oleracea var. capitata",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/cabbage.jpg",
  },
  {
    id: "apples_v3",
    num: "02",
    title: "Green Apple",
    scientific: "Malus domestica (Granny Smith)",
    category: "Fruits",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/apples.jpg",
  },
  {
    id: "bananas_v3",
    num: "03",
    title: "Cavendish Banana",
    scientific: "Musa acuminata",
    category: "Fruits",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/bananas.jpg",
  },
  {
    id: "cucumber_v3",
    num: "04",
    title: "Mini Cucumber",
    scientific: "Cucumis sativus",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/cucumber.jpg",
  },
  {
    id: "lemons_v3",
    num: "05",
    title: "Fresh Lemon",
    scientific: "Citrus limon",
    category: "Fruits",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/lemons.jpg",
  },
  {
    id: "broccoli_v3",
    num: "06",
    title: "Fresh Broccoli",
    scientific: "Brassica oleracea",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/broccoli.webp",
  },
  {
    id: "oranges_v3",
    num: "07",
    title: "Navel Orange",
    scientific: "Citrus sinensis",
    category: "Fruits",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/oranges.jpg",
  },
  {
    id: "corn_v3",
    num: "08",
    title: "Sweet Corn",
    scientific: "Zea mays",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/sweet_corn.jpg",
  },
  {
    id: "peppers_v3",
    num: "09",
    title: "Sweet Pepper",
    scientific: "Capsicum annuum",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/sweet_peppers.jpg",
  },
  {
    id: "mushroom_v3",
    num: "10",
    title: "Fly Agaric Mushroom",
    scientific: "Amanita muscaria",
    category: "Fungi",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/mushroom.jpg",
  },
  {
    id: "cauliflower_v3",
    num: "11",
    title: "White Cauliflower",
    scientific: "Brassica oleracea var. botrytis",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/cauliflower.jpg",
  },
  {
    id: "artichoke_v3",
    num: "12",
    title: "Globe Artichoke",
    scientific: "Cynara cardunculus var. scolymus",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/artichoke.jpg",
  },
  {
    id: "squash_v3",
    num: "13",
    title: "Spaghetti Squash",
    scientific: "Cucurbita pepo",
    category: "Vegetables",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/spaghetti_squash.jpg",
  },
  {
    id: "salmon_v3",
    num: "14",
    title: "Fresh Salmon Fillet",
    scientific: "Salmo salar",
    category: "Proteins",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/salmon.jpg",
  },
  {
    id: "chicken_v3",
    num: "15",
    title: "Whole Raw Chicken",
    scientific: "Gallus gallus domesticus",
    category: "Proteins",
    scope: "MobileNetV3",
    model: "MobileNetV3",
    img_src: "/benchmark/v3/chicken.jpg",
  },
];

export default function TesterPage() {
  const router = useRouter();

  // Filters & Layout State
  const [activeScope, setActiveScope] = useState<"All" | "MobileNetV2" | "MobileNetV3">("All");
  const [activeCategory, setActiveCategory] = useState<string>("All Categories");
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filtered items
  const filteredItems = useMemo(() => {
    return BENCHMARK_ITEMS.filter((item) => {
      const matchScope = activeScope === "All" || item.scope === activeScope;
      const matchCategory =
        activeCategory === "All Categories" || item.category === activeCategory;
      return matchScope && matchCategory;
    });
  }, [activeScope, activeCategory]);

  // Available categories for current scope
  const availableCategories = useMemo(() => {
    const scoped =
      activeScope === "All"
        ? BENCHMARK_ITEMS
        : BENCHMARK_ITEMS.filter((item) => item.scope === activeScope);
    const cats = Array.from(new Set(scoped.map((item) => item.category)));
    return ["All Categories", ...cats];
  }, [activeScope]);

  // Navigate to v2 with benchmark image
  const testInV2 = (imgSrc: string) => {
    router.push(`/v2?testImage=${encodeURIComponent(imgSrc)}`);
  };

  // Navigate to v3 with benchmark image
  const testInV3 = (imgSrc: string) => {
    router.push(`/v3?testImage=${encodeURIComponent(imgSrc)}`);
  };

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const nextLightbox = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! + 1) % filteredItems.length);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [lightboxIndex, filteredItems.length]);

  const prevLightbox = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! - 1 + filteredItems.length) % filteredItems.length);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [lightboxIndex, filteredItems.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox, nextLightbox, prevLightbox]);

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800 font-mono">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4 border-b border-zinc-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-semibold text-zinc-200">ZeroWaste Chef</span>
              <span className="text-zinc-700">&bull;</span>
              <span className="text-zinc-400">Ingredient Verification Testbed</span>
            </div>
            <p className="text-xs text-zinc-500 font-sans">
              20 standard ground-truth produce images for MobileNet v2 &amp; v3 benchmarking.
            </p>
          </div>

          {/* 5 Clean Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-center w-full md:w-auto">
            <Link
              href="/v2"
              className="py-1.5 px-3 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              CNN v2
            </Link>
            <Link
              href="/v3"
              className="py-1.5 px-3 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              CNN v3
            </Link>
            <Link
              href="/hybrid"
              className="py-1.5 px-3 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              HYBRID
            </Link>
            <Link
              href="/gemini"
              className="py-1.5 px-3 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              GEMINI
            </Link>
            <Link
              href="/tester"
              className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-white text-black transition-all"
            >
              TESTER
            </Link>
          </div>
        </div>

        {/* Breadcrumb Path & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-900 text-xs">
          {/* Scope Selector */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-600 px-2 select-none text-[11px]">scope:</span>
            <button
              onClick={() => {
                setActiveScope("All");
                setActiveCategory("All Categories");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeScope === "All" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({BENCHMARK_ITEMS.length})
            </button>
            <span className="text-zinc-700 select-none">/</span>
            <button
              onClick={() => {
                setActiveScope("MobileNetV2");
                setActiveCategory("All Categories");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeScope === "MobileNetV2"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              MobileNetV2 (10)
            </button>
            <span className="text-zinc-700 select-none">/</span>
            <button
              onClick={() => {
                setActiveScope("MobileNetV3");
                setActiveCategory("All Categories");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeScope === "MobileNetV3"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              MobileNetV3 (15)
            </button>
          </div>

          {/* Right Controls: Count & Grid Columns Switcher */}
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-[11px]">
              Showing <strong className="text-white">{filteredItems.length}</strong> items
            </span>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                onClick={() => setGridCols(2)}
                className={`p-1.5 rounded-lg transition ${
                  gridCols === 2 ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
                title="2 Columns"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCols(3)}
                className={`p-1.5 rounded-lg transition ${
                  gridCols === 3 ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
                title="3 Columns"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-1.5 rounded-lg transition ${
                  gridCols === 4 ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
                title="4 Columns"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 text-xs">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition text-[11px] font-medium border ${
                activeCategory === cat
                  ? "bg-white border-white text-black font-semibold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Image Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div
          className={`grid gap-6 ${
            gridCols === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : gridCols === 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="group flex flex-col bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300"
            >
              {/* Image Preview Container */}
              <div
                className="relative aspect-square bg-zinc-900 overflow-hidden cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img_src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Top Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-800">
                    #{item.num}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-800">
                    {item.model}
                  </span>
                </div>

                {/* Expand Hover Hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-xl bg-black/80 border border-zinc-700 text-white flex items-center space-x-1.5 text-xs font-mono">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </div>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>{item.category}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-sans">{item.title}</h3>
                  <p className="text-[11px] text-zinc-500 italic font-sans">{item.scientific}</p>
                </div>

                {/* Test Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
                  <button
                    onClick={() => testInV2(item.img_src)}
                    className="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-white hover:bg-white hover:text-black text-[11px] font-semibold transition-all flex items-center justify-center space-x-1 text-zinc-300"
                    title={`Run inference with CNN v2 on ${item.title}`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test v2</span>
                  </button>

                  <button
                    onClick={() => testInV3(item.img_src)}
                    className="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-white hover:bg-white hover:text-black text-[11px] font-semibold transition-all flex items-center justify-center space-x-1 text-zinc-300"
                    title={`Run inference with CNN v3 on ${item.title}`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test v3</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && currentItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none"
          onClick={closeLightbox}
        >
          {/* Top Control Bar */}
          <div
            className="p-4 sm:p-6 flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-zinc-500 font-bold">#{currentItem.num}</span>
              <span className="text-zinc-700">&bull;</span>
              <span className="font-sans font-semibold text-white text-sm">{currentItem.title}</span>
              <span className="text-zinc-500 italic font-sans hidden sm:inline">
                ({currentItem.scientific})
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]">
                {currentItem.model}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Lightbox Stage */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing px-6"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Previous Button */}
            <button
              onClick={prevLightbox}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition z-20"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Lightbox Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentItem.img_src}
              alt={currentItem.title}
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${
                  panOffset.y / zoomLevel
                }px)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="max-h-[70vh] max-w-[85vw] object-contain rounded-xl shadow-2xl pointer-events-none"
            />

            {/* Next Button */}
            <button
              onClick={nextLightbox}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition z-20"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Action Footer */}
          <div
            className="p-4 sm:p-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 bg-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-zinc-500 font-mono">
              Item {lightboxIndex + 1} of {filteredItems.length} &bull; Zoom: {Math.round(zoomLevel * 100)}%
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => testInV2(currentItem.img_src)}
                className="py-2 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-white hover:text-black hover:border-white text-xs font-semibold transition flex items-center space-x-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Test in CNN v2</span>
              </button>

              <button
                onClick={() => testInV3(currentItem.img_src)}
                className="py-2 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Test in CNN v3</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
