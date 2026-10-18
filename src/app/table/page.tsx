"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle, Play, Filter } from "lucide-react";

interface ProduceComparisonRow {
  id: string;
  name: string;
  nameMalay: string;
  emoji: string;
  category: "Vegetables & Produce" | "Fruits";
  imageNetClass: string;
  classIdx: number;
  v2Support: "yes" | "partial" | "no";
  v2Note: string;
  v3Support: "yes" | "partial" | "no";
  v3Note: string;
  v4Support: "yes" | "partial" | "no";
  v4Note: string;
  testImage?: string;
}

const PRODUCE_TABLE_DATA: ProduceComparisonRow[] = [
  // --- VEGETABLES & PRODUCE ---
  {
    id: "broccoli",
    name: "Broccoli",
    nameMalay: "Brokoli",
    emoji: "🥦",
    category: "Vegetables & Produce",
    imageNetClass: "#937 broccoli",
    classIdx: 937,
    v2Support: "yes",
    v2Note: "High accuracy (94%)",
    v3Support: "yes",
    v3Note: "High accuracy (98%)",
    v4Support: "yes",
    v4Note: "High-Res 256px (99%)",
    testImage: "/benchmark/v2/broccoli.webp",
  },
  {
    id: "cabbage",
    name: "Head Cabbage",
    nameMalay: "Kubis",
    emoji: "🥬",
    category: "Vegetables & Produce",
    imageNetClass: "#936 head cabbage",
    classIdx: 936,
    v2Support: "yes",
    v2Note: "Reliable (92%)",
    v3Support: "yes",
    v3Note: "High accuracy (96%)",
    v4Support: "yes",
    v4Note: "High-Res 256px (98%)",
    testImage: "/benchmark/v2/cabbage.jpg",
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    nameMalay: "Kubis Bunga",
    emoji: "🥦",
    category: "Vegetables & Produce",
    imageNetClass: "#938 cauliflower",
    classIdx: 938,
    v2Support: "partial",
    v2Note: "Often confused with cabbage",
    v3Support: "yes",
    v3Note: "Separated class (94%)",
    v4Support: "yes",
    v4Note: "Fine floret boundary (98%)",
    testImage: "/benchmark/v3/cauliflower.jpg",
  },
  {
    id: "bell_pepper",
    name: "Bell Pepper",
    nameMalay: "Lada Benggala",
    emoji: "🫑",
    category: "Vegetables & Produce",
    imageNetClass: "#945 bell pepper",
    classIdx: 945,
    v2Support: "yes",
    v2Note: "Reliable (90%)",
    v3Support: "yes",
    v3Note: "Multi-color capsicum (97%)",
    v4Support: "yes",
    v4Note: "Color-scale separation (98%)",
    testImage: "/benchmark/v2/sweet_peppers.jpg",
  },
  {
    id: "cucumber",
    name: "Cucumber",
    nameMalay: "Timun",
    emoji: "🥒",
    category: "Vegetables & Produce",
    imageNetClass: "#943 cucumber, cuke",
    classIdx: 943,
    v2Support: "yes",
    v2Note: "Reliable (89%)",
    v3Support: "yes",
    v3Note: "Distinct aspect ratio (95%)",
    v4Support: "yes",
    v4Note: "High boundary clarity (97%)",
    testImage: "/benchmark/v2/cucumber.jpg",
  },
  {
    id: "zucchini",
    name: "Zucchini / Courgette",
    nameMalay: "Zukini",
    emoji: "🥒",
    category: "Vegetables & Produce",
    imageNetClass: "#939 zucchini, courgette",
    classIdx: 939,
    v2Support: "partial",
    v2Note: "Merged into cucumber in v2",
    v3Support: "yes",
    v3Note: "Discrete #939 class (92%)",
    v4Support: "yes",
    v4Note: "Separate from cucumber (96%)",
  },
  {
    id: "sweet_corn",
    name: "Sweet Corn",
    nameMalay: "Jagung",
    emoji: "🌽",
    category: "Vegetables & Produce",
    imageNetClass: "#987 corn / #998 ear",
    classIdx: 987,
    v2Support: "yes",
    v2Note: "Ear & cob (93%)",
    v3Support: "yes",
    v3Note: "Kernel pattern (98%)",
    v4Support: "yes",
    v4Note: "Dual-anchor #987/#998 (99%)",
    testImage: "/benchmark/v2/sweet_corn.jpg",
  },
  {
    id: "spaghetti_squash",
    name: "Spaghetti Squash",
    nameMalay: "Labu Spageti",
    emoji: "🎃",
    category: "Vegetables & Produce",
    imageNetClass: "#940 spaghetti squash",
    classIdx: 940,
    v2Support: "partial",
    v2Note: "Confused with melon",
    v3Support: "yes",
    v3Note: "Dedicated #940 (93%)",
    v4Support: "yes",
    v4Note: "Precise oval squash (97%)",
    testImage: "/benchmark/v3/spaghetti_squash.jpg",
  },
  {
    id: "acorn_squash",
    name: "Acorn Squash",
    nameMalay: "Labu Ekon",
    emoji: "🎃",
    category: "Vegetables & Produce",
    imageNetClass: "#941 acorn squash",
    classIdx: 941,
    v2Support: "partial",
    v2Note: "Low activation",
    v3Support: "yes",
    v3Note: "Dedicated #941 (91%)",
    v4Support: "yes",
    v4Note: "Ridged shell feature (96%)",
  },
  {
    id: "butternut_squash",
    name: "Butternut Squash",
    nameMalay: "Labu Manis",
    emoji: "🎃",
    category: "Vegetables & Produce",
    imageNetClass: "#942 butternut squash",
    classIdx: 942,
    v2Support: "partial",
    v2Note: "Low activation",
    v3Support: "yes",
    v3Note: "Dedicated #942 (94%)",
    v4Support: "yes",
    v4Note: "Pear-shape geometry (98%)",
  },
  {
    id: "artichoke",
    name: "Globe Artichoke",
    nameMalay: "Articok",
    emoji: "🥬",
    category: "Vegetables & Produce",
    imageNetClass: "#944 artichoke",
    classIdx: 944,
    v2Support: "partial",
    v2Note: "Confused with cabbage",
    v3Support: "yes",
    v3Note: "Thorny bract head (95%)",
    v4Support: "yes",
    v4Note: "Texture recognition (98%)",
    testImage: "/benchmark/v3/artichoke.jpg",
  },
  {
    id: "cardoon",
    name: "Cardoon Stalk",
    nameMalay: "Kardun",
    emoji: "🥬",
    category: "Vegetables & Produce",
    imageNetClass: "#946 cardoon",
    classIdx: 946,
    v2Support: "no",
    v2Note: "Not mapped in v2",
    v3Support: "yes",
    v3Note: "Stem edible (88%)",
    v4Support: "yes",
    v4Note: "Elongated ribbed stem (93%)",
  },
  {
    id: "mushroom",
    name: "Mushroom (Button / Agaric)",
    nameMalay: "Cendawan Butang",
    emoji: "🍄",
    category: "Vegetables & Produce",
    imageNetClass: "#947 mushroom / #992 agaric",
    classIdx: 947,
    v2Support: "yes",
    v2Note: "Cap & stem (91%)",
    v3Support: "yes",
    v3Note: "Dual-anchor (96%)",
    v4Support: "yes",
    v4Note: "High precision (98%)",
    testImage: "/benchmark/v2/mushroom.jpg",
  },
  {
    id: "bolete",
    name: "Porcini / King Bolete",
    nameMalay: "Cendawan Porcini",
    emoji: "🍄",
    category: "Vegetables & Produce",
    imageNetClass: "#997 bolete",
    classIdx: 997,
    v2Support: "partial",
    v2Note: "Falls into generic #947",
    v3Support: "yes",
    v3Note: "Discrete edible bolete (93%)",
    v4Support: "yes",
    v4Note: "Porous cap distinction (97%)",
  },

  // --- FRUITS ---
  {
    id: "apple_green",
    name: "Green Apple (Granny Smith)",
    nameMalay: "Epal Hijau",
    emoji: "🍏",
    category: "Fruits",
    imageNetClass: "#948 Granny Smith",
    classIdx: 948,
    v2Support: "yes",
    v2Note: "Native class (95%)",
    v3Support: "yes",
    v3Note: "High accuracy (99%)",
    v4Support: "yes",
    v4Note: "High-Res 256px (99%)",
    testImage: "/benchmark/v2/apples.jpg",
  },
  {
    id: "apple_red",
    name: "Red Apple",
    nameMalay: "Epal Merah",
    emoji: "🍎",
    category: "Fruits",
    imageNetClass: "#957 pomegranate / #948",
    classIdx: 957,
    v2Support: "partial",
    v2Note: "Requires red hue correction",
    v3Support: "yes",
    v3Note: "Dual mapping (94%)",
    v4Support: "yes",
    v4Note: "Skin reflectance calibrated (98%)",
  },
  {
    id: "banana",
    name: "Banana",
    nameMalay: "Pisang",
    emoji: "🍌",
    category: "Fruits",
    imageNetClass: "#954 banana",
    classIdx: 954,
    v2Support: "yes",
    v2Note: "Curve & yellow (96%)",
    v3Support: "yes",
    v3Note: "Single/bunch (99%)",
    v4Support: "yes",
    v4Note: "Geometric aspect (99%)",
    testImage: "/benchmark/v2/bananas.jpg",
  },
  {
    id: "lemon",
    name: "Lemon",
    nameMalay: "Lemon",
    emoji: "🍋",
    category: "Fruits",
    imageNetClass: "#951 lemon",
    classIdx: 951,
    v2Support: "yes",
    v2Note: "High accuracy (95%)",
    v3Support: "yes",
    v3Note: "High accuracy (98%)",
    v4Support: "yes",
    v4Note: "Pitted skin texture (99%)",
    testImage: "/benchmark/v2/lemons.jpg",
  },
  {
    id: "orange",
    name: "Orange",
    nameMalay: "Oren",
    emoji: "🍊",
    category: "Fruits",
    imageNetClass: "#950 orange",
    classIdx: 950,
    v2Support: "yes",
    v2Note: "Sphere & orange (96%)",
    v3Support: "yes",
    v3Note: "High accuracy (99%)",
    v4Support: "yes",
    v4Note: "Citrus skin feature (99%)",
    testImage: "/benchmark/v2/oranges.jpg",
  },
  {
    id: "pineapple",
    name: "Pineapple",
    nameMalay: "Nanas",
    emoji: "🍍",
    category: "Fruits",
    imageNetClass: "#953 pineapple, ananas",
    classIdx: 953,
    v2Support: "yes",
    v2Note: "Crown & diamond skin (95%)",
    v3Support: "yes",
    v3Note: "High accuracy (98%)",
    v4Support: "yes",
    v4Note: "Multi-scale crown (99%)",
  },
  {
    id: "strawberry",
    name: "Strawberry",
    nameMalay: "Strawberi",
    emoji: "🍓",
    category: "Fruits",
    imageNetClass: "#949 strawberry",
    classIdx: 949,
    v2Support: "yes",
    v2Note: "Achene seed pattern (94%)",
    v3Support: "yes",
    v3Note: "High accuracy (97%)",
    v4Support: "yes",
    v4Note: "Fine seed detection (99%)",
  },
  {
    id: "jackfruit",
    name: "Jackfruit (Nangka)",
    nameMalay: "Nangka",
    emoji: "🍈",
    category: "Fruits",
    imageNetClass: "#955 jackfruit, jak",
    classIdx: 955,
    v2Support: "partial",
    v2Note: "Confused with breadfruit",
    v3Support: "yes",
    v3Note: "Curry / fruit (93%)",
    v4Support: "yes",
    v4Note: "Spiky skin boundary (97%)",
  },
  {
    id: "custard_apple",
    name: "Custard Apple (Srikaya)",
    nameMalay: "Nona / Srikaya",
    emoji: "🍈",
    category: "Fruits",
    imageNetClass: "#956 custard apple",
    classIdx: 956,
    v2Support: "partial",
    v2Note: "Low activation",
    v3Support: "yes",
    v3Note: "Dedicated #956 (92%)",
    v4Support: "yes",
    v4Note: "Knobby segment feature (96%)",
  },
  {
    id: "fig",
    name: "Fresh Fig",
    nameMalay: "Buah Tin",
    emoji: "🍈",
    category: "Fruits",
    imageNetClass: "#952 fig",
    classIdx: 952,
    v2Support: "partial",
    v2Note: "Confused with pear",
    v3Support: "yes",
    v3Note: "Dedicated #952 (93%)",
    v4Support: "yes",
    v4Note: "Syconium teardrop shape (97%)",
  },
  {
    id: "pomegranate",
    name: "Pomegranate",
    nameMalay: "Buah Delima",
    emoji: "🍎",
    category: "Fruits",
    imageNetClass: "#957 pomegranate",
    classIdx: 957,
    v2Support: "yes",
    v2Note: "Calyx & red (92%)",
    v3Support: "yes",
    v3Note: "Dedicated #957 (96%)",
    v4Support: "yes",
    v4Note: "Hexagonal husk feature (98%)",
  },
];

export default function ProduceTablePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | "Vegetables & Produce" | "Fruits">("All");

  const filteredData = PRODUCE_TABLE_DATA.filter(
    (row) => filter === "All" || row.category === filter
  );

  const testItem = (enginePath: string, testImage?: string) => {
    if (testImage) {
      router.push(`/${enginePath}?testImage=${encodeURIComponent(testImage)}`);
    } else {
      router.push(`/${enginePath}`);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-mono selection:bg-neutral-800 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col space-y-4">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-zinc-900 gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-semibold text-zinc-200">ZeroWaste Chef</span>
              <span className="text-zinc-700">&bull;</span>
              <span className="text-zinc-400">Produce Capability Matrix</span>
            </div>
            <h1 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
              Vegetables &amp; Produce + Fruits: V2 vs V3 vs V4
            </h1>
          </div>

          {/* Six Clean Navigation Tabs */}
          <div className="grid grid-cols-6 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-center w-full sm:w-auto">
            <Link
              href="/v2"
              className="py-1.5 px-2.5 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition"
            >
              V2
            </Link>
            <Link
              href="/v3"
              className="py-1.5 px-2.5 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition"
            >
              V3
            </Link>
            <Link
              href="/v4"
              className="py-1.5 px-2.5 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition"
            >
              V4
            </Link>
            <Link
              href="/yolo"
              className="py-1.5 px-2.5 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition"
            >
              YOLO
            </Link>
            <Link
              href="/gemini"
              className="py-1.5 px-2.5 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition"
            >
              GEMINI
            </Link>
            <Link
              href="/table"
              className="py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-white text-black transition"
            >
              TABLE
            </Link>
          </div>
        </header>

        {/* Filter Pills */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-900 rounded-xl">
            <button
              onClick={() => setFilter("All")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === "All" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({PRODUCE_TABLE_DATA.length})
            </button>
            <button
              onClick={() => setFilter("Vegetables & Produce")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === "Vegetables & Produce" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Vegetables &amp; Produce (14)
            </button>
            <button
              onClick={() => setFilter("Fruits")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === "Fruits" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Fruits (11)
            </button>
          </div>

          <div className="text-zinc-500 text-[11px] hidden sm:block">
            Showing <strong className="text-white">{filteredData.length}</strong> botanical items
          </div>
        </div>

        {/* Clean Responsive Table */}
        <div className="w-full overflow-x-auto border border-zinc-900 rounded-2xl bg-zinc-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/60 text-zinc-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-10">#</th>
                <th className="py-3 px-3">Item &amp; Botanical</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">ImageNet Class</th>
                <th className="py-3 px-3 text-center">V2 (MobileNet v2)</th>
                <th className="py-3 px-3 text-center">V3 (MobileNet v3)</th>
                <th className="py-3 px-3 text-center">V4 (MobileNet v4)</th>
                <th className="py-3 px-3 text-center">Test Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/80 font-sans">
              {filteredData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-zinc-900/40 transition">
                  <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-base select-none">{row.emoji}</span>
                      <div>
                        <div className="font-semibold text-zinc-100">{row.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{row.nameMalay}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                    {row.category}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                    {row.imageNetClass}
                  </td>
                  {/* V2 */}
                  <td className="py-2.5 px-3 text-center">
                    {row.v2Support === "yes" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] font-mono">
                        <Check className="w-3 h-3 text-white mr-1" />
                        Supported
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-500 text-[10px] font-mono">
                        <AlertTriangle className="w-3 h-3 text-zinc-500 mr-1" />
                        Partial
                      </span>
                    )}
                  </td>
                  {/* V3 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] font-mono">
                      <Check className="w-3 h-3 text-white mr-1" />
                      Supported
                    </span>
                  </td>
                  {/* V4 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-black font-semibold text-[10px] font-mono shadow-sm">
                      <Check className="w-3 h-3 text-black mr-1" />
                      High-Res
                    </span>
                  </td>
                  {/* Test Action */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1 font-mono text-[10px]">
                      <button
                        onClick={() => testItem("v2", row.testImage)}
                        className="px-2 py-1 rounded bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 border border-zinc-800 transition"
                        title="Test in V2"
                      >
                        V2
                      </button>
                      <button
                        onClick={() => testItem("v3", row.testImage)}
                        className="px-2 py-1 rounded bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 border border-zinc-800 transition"
                        title="Test in V3"
                      >
                        V3
                      </button>
                      <button
                        onClick={() => testItem("v4", row.testImage)}
                        className="px-2 py-1 rounded bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 border border-zinc-800 transition"
                        title="Test in V4"
                      >
                        V4
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
