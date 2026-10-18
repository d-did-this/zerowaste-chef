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
  Sparkles,
} from "lucide-react";
import NavigationHeader from "@/components/NavigationHeader";

interface BenchmarkItem {
  id: string;
  num: string;
  title: string;
  scientific: string;
  category: "Vegetables" | "Fruits" | "Fungi" | "Proteins";
  img_src: string;
}

const BENCHMARK_ITEMS: BenchmarkItem[] = [
  {
    id: "cabbage",
    num: "01",
    title: "Green Cabbage",
    scientific: "Brassica oleracea var. capitata",
    category: "Vegetables",
    img_src: "/benchmark/v3/cabbage.jpg",
  },
  {
    id: "apples",
    num: "02",
    title: "Green Apple",
    scientific: "Malus domestica (Granny Smith)",
    category: "Fruits",
    img_src: "/benchmark/v3/apples.jpg",
  },
  {
    id: "bananas",
    num: "03",
    title: "Cavendish Banana",
    scientific: "Musa acuminata",
    category: "Fruits",
    img_src: "/benchmark/v3/bananas.jpg",
  },
  {
    id: "cucumber",
    num: "04",
    title: "Mini Cucumber",
    scientific: "Cucumis sativus",
    category: "Vegetables",
    img_src: "/benchmark/v3/cucumber.jpg",
  },
  {
    id: "lemons",
    num: "05",
    title: "Fresh Lemon",
    scientific: "Citrus limon",
    category: "Fruits",
    img_src: "/benchmark/v3/lemons.jpg",
  },
  {
    id: "broccoli",
    num: "06",
    title: "Fresh Broccoli",
    scientific: "Brassica oleracea",
    category: "Vegetables",
    img_src: "/benchmark/v3/broccoli.webp",
  },
  {
    id: "oranges",
    num: "07",
    title: "Navel Orange",
    scientific: "Citrus sinensis",
    category: "Fruits",
    img_src: "/benchmark/v3/oranges.jpg",
  },
  {
    id: "corn",
    num: "08",
    title: "Sweet Corn",
    scientific: "Zea mays",
    category: "Vegetables",
    img_src: "/benchmark/v3/sweet_corn.jpg",
  },
  {
    id: "peppers",
    num: "09",
    title: "Sweet Pepper",
    scientific: "Capsicum annuum",
    category: "Vegetables",
    img_src: "/benchmark/v3/sweet_peppers.jpg",
  },
  {
    id: "mushroom",
    num: "10",
    title: "Button Mushroom",
    scientific: "Agaricus bisporus",
    category: "Fungi",
    img_src: "/benchmark/v3/mushroom.jpg",
  },
  {
    id: "cauliflower",
    num: "11",
    title: "White Cauliflower",
    scientific: "Brassica oleracea var. botrytis",
    category: "Vegetables",
    img_src: "/benchmark/v3/cauliflower.jpg",
  },
  {
    id: "artichoke",
    num: "12",
    title: "Globe Artichoke",
    scientific: "Cynara cardunculus var. scolymus",
    category: "Vegetables",
    img_src: "/benchmark/v3/artichoke.jpg",
  },
  {
    id: "squash",
    num: "13",
    title: "Spaghetti Squash",
    scientific: "Cucurbita pepo",
    category: "Vegetables",
    img_src: "/benchmark/v3/spaghetti_squash.jpg",
  },
  {
    id: "salmon",
    num: "14",
    title: "Fresh Salmon Fillet",
    scientific: "Salmo salar",
    category: "Proteins",
    img_src: "/benchmark/v3/salmon.jpg",
  },
  {
    id: "chicken",
    num: "15",
    title: "Whole Raw Chicken",
    scientific: "Gallus gallus domesticus",
    category: "Proteins",
    img_src: "/benchmark/v3/chicken.jpg",
  },
  {
    id: "potato",
    num: "16",
    title: "Fresh Potato (OOD Test)",
    scientific: "Solanum tuberosum",
    category: "Vegetables",
    img_src: "/benchmark/v3/potato.jpg",
  },
];

export default function Test02GalleryPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);

  // Lightbox Modal State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter items
  const filteredItems = useMemo(() => {
    return BENCHMARK_ITEMS.filter((item) => {
      const matchCat = activeCategory === "All" || item.category === activeCategory;
      return matchCat;
    });
  }, [activeCategory]);

  const currentItem = selectedIndex !== null ? filteredItems[selectedIndex] : null;

  // Navigate to v4 with benchmark image
  const testInV4 = (imgSrc: string) => {
    router.push(`/test_02/v4?testImage=${encodeURIComponent(imgSrc)}`);
  };

  // Navigate to Gemini with benchmark image
  const testInGemini = (imgSrc: string) => {
    router.push(`/test_02/gemini?testImage=${encodeURIComponent(imgSrc)}`);
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") {
        setSelectedIndex(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      }
    },
    [selectedIndex, filteredItems.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Mouse pan handlers for modal
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <main className="min-h-screen bg-black text-white p-3 sm:p-5 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col space-y-4">
        {/* Navigation & Suite Header */}
        <header className="flex justify-between items-center pb-2 border-b border-zinc-900">
          <h1 className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-200">
            ZeroWaste Chef
          </h1>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500">
            <span>Test 02 &bull; Gallery</span>
            <Link
              href="/changelog"
              className="text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-800 transition"
              title="Changelog"
            >
              📜 Log
            </Link>
          </div>
        </header>

        {/* 3-Tab Test 02 Navigation Header */}
        <NavigationHeader />

        {/* Gallery Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
          <div>
            <h2 className="text-sm font-mono font-bold text-zinc-100 flex items-center gap-2">
              <span>Benchmark Testing Gallery</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal">
                16 Standard Test Items
              </span>
            </h2>
            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
              Click &quot;Test v4&quot; or &quot;Test Gemini&quot; on any card to run one-click automated inference.
            </p>
          </div>

          {/* Controls: Category Filter + Grid Size */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center bg-black rounded-lg border border-zinc-800 p-0.5">
              {["All", "Vegetables", "Fruits", "Fungi", "Proteins"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                    activeCategory === cat ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid Density */}
            <div className="hidden sm:flex items-center bg-black rounded-lg border border-zinc-800 p-0.5">
              <button
                onClick={() => setGridCols(2)}
                title="2 Columns"
                className={`p-1 rounded ${gridCols === 2 ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCols(3)}
                title="3 Columns"
                className={`p-1 rounded ${gridCols === 3 ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                title="4 Columns"
                className={`p-1 rounded ${gridCols === 4 ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div
          className={`grid gap-3 ${
            gridCols === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : gridCols === 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="group bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-xl overflow-hidden flex flex-col transition-all duration-150"
            >
              {/* Image Thumbnail with Overlay Zoom Button */}
              <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={() => setSelectedIndex(idx)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img_src}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                  <span className="font-mono text-[10px] font-bold bg-black/80 px-1.5 py-0.5 rounded text-white border border-white/10">
                    #{item.num}
                  </span>
                  <span className="font-mono text-[9px] bg-zinc-900/80 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-800">
                    {item.category}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-1 rounded-md text-zinc-300 hover:text-white">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card Meta & Action Buttons */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="font-mono text-xs font-bold text-zinc-100 truncate">{item.title}</h3>
                  <p className="font-mono text-[10px] text-zinc-500 italic truncate">{item.scientific}</p>
                </div>

                {/* Direct Inference Buttons: V4 and Gemini */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => testInV4(item.img_src)}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white rounded text-[10px] font-mono transition font-medium"
                    title={`Upload to V4: Run MobileNet v4 inference on ${item.title}`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current text-white" />
                    <span>Test v4</span>
                  </button>

                  <button
                    onClick={() => testInGemini(item.img_src)}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 text-blue-300 hover:text-blue-100 rounded text-[10px] font-mono transition font-medium"
                    title={`Upload to Gemini: Run Gemini Vision inference on ${item.title}`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                    <span>Test Gemini</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {currentItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-3 sm:p-6 backdrop-blur-sm">
          {/* Modal Top Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between text-zinc-400 font-mono text-xs border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">#{currentItem.num}</span>
              <span>&bull;</span>
              <span className="text-zinc-200">{currentItem.title}</span>
              <span className="text-zinc-500 hidden sm:inline">({currentItem.scientific})</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="p-1 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] px-1 text-zinc-300">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  className="p-1 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className="p-1 hover:text-white ml-1 border-l border-zinc-800"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => setSelectedIndex(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Main Image Stage */}
          <div
            className="relative flex-1 w-full max-w-4xl flex items-center justify-center overflow-hidden my-3 select-none cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentItem.img_src}
              alt={currentItem.title}
              draggable={false}
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="max-h-[65vh] max-w-full object-contain rounded-lg border border-zinc-900 shadow-2xl"
            />

            {/* Left / Right Nav Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-zinc-800 transition"
              title="Previous Item (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-zinc-800 transition"
              title="Next Item (Right Arrow)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Bottom Actions */}
          <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800 font-mono text-xs">
            <div className="text-zinc-500 text-[11px]">
              Item {selectedIndex !== null ? selectedIndex + 1 : 0} of {filteredItems.length} &bull; Image resolution: 640&times;480 / 1024&times;768 native
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => testInV4(currentItem.img_src)}
                className="flex items-center space-x-1.5 py-2 px-4 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test in CNN v4</span>
              </button>

              <button
                onClick={() => testInGemini(currentItem.img_src)}
                className="flex items-center space-x-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Test in Gemini Vision</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
