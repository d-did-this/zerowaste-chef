import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Layers,
  Cpu,
  CheckCircle2,
  Bug,
  PlusCircle,
  Trash2,
  GitCommit,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "Changelog & History | ZeroWaste Chef",
  description: "Complete development history and release notes for ZeroWaste Chef (UTeM Workshop 2, Group 23).",
};

interface ReleaseEntry {
  version: string;
  tag?: string;
  date: string;
  title: string;
  summary: string;
  highlights: Array<{
    type: "Added" | "Changed" | "Fixed" | "Removed";
    items: string[];
  }>;
}

const RELEASES: ReleaseEntry[] = [
  {
    version: "v2.1",
    tag: "LATEST (OFFICIAL v2.1)",
    date: "19 October 2026",
    title: "Skeuomorphic & Neomorphic Tactical Redesign (Clean & Neat Official Release)",
    summary:
      "A clean, neat, uncluttered release combining Neomorphism (Soft UI) and Skeuomorphic tactile design with darker, more prominent shadows. Redesigned the Ready to Scan control deck with a physical camera shutter ring, removed redundant manual buttons, labeled Cook Now and Grocery as Coming Soon with dedicated roadmap cards, and added an in-app Fullscreen trigger.",
    highlights: [
      {
        type: "Added",
        items: [
          "Skeuomorphic Camera Shutter Deck: Precision camera console with a metallic dual-ring shutter button, recessed gallery upload well, and tactile manual button.",
          "Coming Soon Roadmap Sections: Labeled Cook Now and Grocery with amber 'Soon' badges in bottom nav and replaced mock lists with clean, uncluttered Coming Soon cards.",
          "1-Tap In-App Fullscreen Toggle: Header button using HTML5 Fullscreen API with universal PWA standalone/fullscreen overrides.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Darker & More Obvious Shadows: Upgraded all Neumorphic box-shadows to deeper, richer contrast values for tactile physical depth.",
          "Clean & Neat Layout: Purged clutter across pantry and scanner views, harmonizing soft-UI and skeuomorphism.",
        ],
      },
      {
        type: "Removed",
        items: [
          "Redundant Manual Buttons: Removed the manual button from the pantry (retaining the floating circular camera FAB) and removed duplicate manual button from the scanner viewfinder bar.",
        ],
      },
    ],
  },
  {
    version: "v2.4.0",
    date: "19 October 2026",
    title: "Fullscreen PWA, Floating Camera FAB, Deeper Tactile Shadows & Nav Redesign",
    summary:
      "Installed web app now launches in full screen mode, the header back button is replaced with an elegant emblem, pantry cards and scanner blocks gain darker tactile shadows with subtle dark-green borders, the bottom nav is redesigned into a floating pill dock, the scan button is a floating camera FAB at the bottom right, and manual entry is integrated into the Scanner HUD.",
    highlights: [
      {
        type: "Added",
        items: [
          "Fullscreen PWA Mode: Web app manifest and mobile tags configured with display: fullscreen for immersive app launch.",
          "Floating Camera Scan Button: Circular bulging FAB positioned at the bottom right for instant camera scanning.",
          "Scanner HUD Manual Entry: Quick manual entry button and bottom sheet modal directly accessible within the camera scanner.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Darker Pantry Card Shadows & Green Borders: Richer drop shadows with a thin dark-green border on each ingredient card.",
          "Darker Scanner Block Shadows: Viewfinder container and detected ingredient info card enhanced with deeper contrast shadows.",
          "Floating Bottom Nav Dock: Redesigned bottom navigation as an elevated floating island dock with carved-in crater tabs.",
          "Redesigned Rescan & Scan Next: Rescan styled in warm amber-terracotta and Scan Next in vivid electric cobalt-indigo.",
        ],
      },
      {
        type: "Removed",
        items: [
          "Header Back Button: Removed the top-left navigation back button in favor of a clean brand emblem.",
        ],
      },
    ],
  },
  {
    version: "v2.3.1",
    date: "19 October 2026",
    title: "Pure Light-Mode Neumorphism (Reverted Dark Mode & Neon Glows)",
    summary:
      "Cleaned and standardized the UI to 100% pure light-mode Soft-UI neumorphism, removing dark mode and all fluorescent glowing shadows per user preference while preserving real captured camera photo pantry cards, deep carved-in crater bottom tabs, smooth tab transitions, wrapped dark green category filter with icons, and relative update time tracking.",
    highlights: [
      {
        type: "Removed",
        items: [
          "Dark Mode Theme: Removed dark mode toggle and all darkmorphic CSS overrides to lock the app permanently into clean light mode.",
          "Fluorescent Glowing Shadows: Removed glowing box-shadows and neon mint borders across buttons and controls.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Natural Crater Navigation: Refined .neo-crater-darkgreen with clean white typography and crisp recessed directional shadows on #f0f4f9 surface.",
          "Light Surface Standardization: Standardized body background to #f0f4f9 with crisp #1e293b slate typography.",
        ],
      },
    ],
  },
  {
    version: "v2.3.0",
    date: "19 October 2026",
    title: "Captured Photo Thumbnails, Deep Crater Navigation & Dark Mode",
    summary:
      "Major feature release delivering automatic saving of captured camera snapshots into pantry inventory cards, deep carved-in crater active tabs in bottom navigation, fluid tab-switching animations, full dark mode support across the app, wrapped dark green category filter section with icons, and dynamic relative last-updated tracking.",
    highlights: [
      {
        type: "Added",
        items: [
          "Captured Camera Photo in Pantry: When items are added to pantry, the live camera snapshot is stored as the visual picture on the pantry card, replacing static emojis with the real photo.",
          "Deep Crater Neumorphic Active Tab: Re-engineered active navigation state with .neo-crater-darkgreen featuring directional inner shadows (inset 6px 6px 12px), radial dark gradient pit, physical depression (translateY 3px), and mint rim reflection.",
          "Fluid Tab Switch Animations: Added .animate-tab-content with smooth fade-slide-in keyframes when navigating between Scanner, Pantry, Cook Now, and Grocery views.",
          "Full-App Dark Mode System: Complete darkmorphic theme support with sun/moon header toggle and automatic localStorage synchronization.",
          "Wrapped Dark Green Filter Section: Isolated filter chips into a distinct #004d34 container with icons for each category (inventory_2, nutrition, set_meal, soup_kitchen, egg_alt, rice_bowl).",
          "Dynamic Relative 'Updated ... ago' Badge: Automatically computes and updates relative time since last pantry modification.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Digital Pantry Rebranding: Rebranded 'Pantry Vitality' to 'Digital Pantry' with rich emerald/dark green styling and recessed stat wells.",
          "Clean Cook Now Tab: Removed the 'READY' badge from Cook Now in the bottom dock.",
        ],
      },
    ],
  },
  {
    version: "v2.2.0",
    date: "19 October 2026",
    title: "Tactile UI Polish, Malaysian Quantifiers & Lemon Classification Fix",
    summary:
      "Major UI/UX refinement delivering bulging 3D convex neumorphic buttons, dark green identification card header, carved-in dark green bottom navigation active tab, light galaxy gradient blue Gemini Vision button, yellow camera torch, authentic Malaysian penjodoh bilangan (biji, buah, batang, etc.) with English ingredient names, and permanent resolution of the Lemon misclassification bug.",
    highlights: [
      {
        type: "Added",
        items: [
          "Malaysian Quantifier System (Penjodoh Bilangan): Integrated biji, buah, batang, ikat, botol, ketul, labu, ulas, tin, and bungkus across the Pantry and Scanner interfaces (Lemon defaults to biji).",
          "Citrus & Fruits Catalog Additions: Added dedicated entries for Lemon, Orange, Apple, Watermelon, and Papaya with default unit classifiers and high-priority matching.",
          "Light Galaxy Gradient Blue Gemini Button: Option C 1-tap AI escalation button styled with a luminous gradient (#93c5fd to #c7d2fe) and tactile glow.",
          "Bulging 3D Convex Neumorphic Buttons: Added high-contrast dual convex drop shadows to 'Confirm & Add to Pantry' and 'Snap & Identify'.",
          "Vibrant Secondary Action Buttons: Distinct color palettes with Warm Amber/Coral for 'Rescan' and Vivid Sky Blue/Indigo for 'Scan Next'.",
          "Carved-In Dark Green Selected Tab: Bottom navigation dock active tab now renders in deep recessed dark green (#004d34).",
        ],
      },
      {
        type: "Changed",
        items: [
          "English-First UI: Standardized all ingredient names and app interface copy to English while retaining Malaysian culinary classifiers.",
          "Dark Green Card Header: High-contrast #004d34 header row for identified ingredients with mint green verified badge.",
          "Yellow Flashlight Toggle: Camera torch button restyled with bright amber-yellow accents and radiant active glow.",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Lemon Misclassification: Fixed root cause where scanning Lemon matched 'lemon grass' subword in serai (Lemongrass) under Aromatics & Spices by introducing exact-keyword scoring priority and passing CNN predicted categories.",
          "Clean Viewfinder Reticle: Removed all obstructing pills ('Fresh Produce') from inside the camera reticle.",
        ],
      },
    ],
  },
  {
    version: "v2.1.0",
    date: "19 October 2026",
    title: "Google Stitch Bottom Navigation, Zoom Controls & Smart Pantry Release",
    summary:
      "Comprehensive refinement of the v2.0 flagship featuring the official Google Stitch 4-tab tactile bottom navigation dock (Scanner, Pantry, Cook Now, Grocery), crystal-clear transparent reticle targeting, multi-level hardware and digital zoom (1x - 3x), expanded camera grid, and full-featured Smart Pantry management with live vitality metrics and Malaysian ZeroWaste recipe matching.",
    highlights: [
      {
        type: "Added",
        items: [
          "Google Stitch Tactile Bottom Navigation Dock: Fixed 4-tab navigation dock (Scanner, Pantry, Cook Now, Grocery) with neumorphic recessed active states and Cook Now 'Ready' badge.",
          "Smart Pantry AI Suite: Full pantry vitality dashboard, category filter chips (Produce, Proteins, Seasoning, Dairy, Staples), tactile portion steppers, and individual item deletion.",
          "Manual Ingredient Entry Drawer: Tactile bottom sheet modal for logging custom ingredients with quantity steppers and Malaysian culinary units.",
          "Multi-Level Camera Zoom: Added 1x, 1.5x, 2x, and 3x zoom controls with hardware track constraints and digital viewport scaling.",
          "Cook Now & Grocery Restock: Intelligent Malaysian ZeroWaste recipe suggestions and kitchen restock planner.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Expanded Camera Grid: Enlarged camera viewport to an expansive aspect-[3/4] / square format for easier framing.",
          "Unobstructed Viewfinder: Moved centered detection guidance below the camera viewport to preserve full visibility.",
          "Standardized Branding: Unified app name to 'ZeroWaste Chef' across all headers and badges, removing extraneous labels.",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Transparent Target Reticle: Eliminated opaque background blocking the camera feed by enforcing crystal-clear transparent reticle styling.",
          "Removed Clutter: Completely removed the 'HD 60FPS' badge from the camera viewfinder.",
        ],
      },
    ],
  },
  {
    version: "v2.0.0",
    date: "19 October 2026",
    title: "Official Flagship Neumorphic Scanner HUD Release",
    summary:
      "Major frontend and hardware integration milestone deploying the Stitch Neumorphic Soft-UI design system (#eef2f6 with dual soft shadows & #006948 Malaysian kitchen emerald green). Integrated live in-viewfinder reticle targeting, laser scanline animation, interactive portion quantity steppers, local pantry persistence, and hardware camera & torch controls.",
    highlights: [
      {
        type: "Added",
        items: [
          "Neumorphic Scanner HUD (/official_v2.0): Full Soft-UI redesign based on Google Stitch design tokens, featuring soft dual shadows, custom emerald corner reticle brackets, and center crosshair.",
          "Animated Laser Scanline: Real-time scanline pulse animation (animate-scan-move) inside the viewfinder simulating continuous sensor acquisition.",
          "Interactive Portion Steppers: Added [-] and [+] quantity adjusters synchronized with standard Malaysian units (botol for sauces, batang for aromatics, ikat for greens, kg, pcs).",
          "Persistent Fridge / Pantry Storage: Connected 'Confirm & Add to Pantry' to local storage (savePantryItem) with animated 'Added to Fridge!' confirmation feedback.",
          "Expandable Item Notes: Added quick shelf-life, purchase date, or pantry notes input field.",
          "Hardware Torch & Camera Controls: Mounted neumorphic floating toggle buttons for camera flip (front/back) and device flashlight torch.",
          "Embedded Option C Pill: Seamlessly integrated 'Not what you expected? [Gemini Vision]' escalation button inside the result card.",
          "Primary Flagship Redirect: Root (/) and /official routes now directly launch the v2.0 Neumorphic HUD.",
        ],
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "19 October 2026",
    title: "Defense-in-Depth Brand Disambiguation & Intelligent Escalation",
    summary:
      "Engineered 3-layer multimodal brand disambiguation to eliminate trademark interference (e.g. Cap Kipas Udang), introduced Option C 1-tap manual Gemini escalation, and calibrated the Hybrid Gate with an 80% confidence threshold and 20% margin gap.",
    highlights: [
      {
        type: "Added",
        items: [
          "3-Layer Defense-in-Depth Brand Disambiguation: Layer 1 separates generic food identity from brand trademarks in Gemini prompt schema; Layer 2 implements specificity & longest-match scoring in local DB; Layer 3 enforces hierarchical two-pass category search.",
          "Option C (1-Tap Manual Escalation): Added prominent 'Not what you expected? Ask Gemini Vision' button allowing users to override local CNN classifications on demand.",
          "Commercial Brand Metadata: Displayed detected manufacturer brand names in result subtitle (e.g., 'Sweet Soy Sauce (Habhal\\'s Cap Kipas Udang)').",
          "Dedicated In-App Changelog: Added /changelog route documenting complete project history from day 1.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Hybrid Gatekeeper Calibration: Raised edge acceptance threshold to >= 80% confidence and required >= 20% margin gap over the runner-up candidate.",
          "Automatic Uncatalogued Escalation: Out-of-catalog items (Salmon, Chicken, Potato, Kicap Manis) with split logits now automatically fail the gate and route to Gemini Vision.",
          "Official Banner: Updated official badges across navigation to OFFICIAL v1.1.",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Cap Kipas Udang False Positive: Resolved bug where sweet soy sauce bottle was classified as 'Udang' (Prawn) due to brand name substring match.",
          "Optical Orange Fruit Boost: Restricted color-based logit boost for Orange to images with 'Compact' (round) aspect ratios, stopping flat salmon fillets from scoring as round oranges.",
        ],
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "19 October 2026",
    title: "Official Production Release & Suite Restructuring",
    summary:
      "Launched the flagship /official_v1.0 production release running Hybrid Only mode. Streamlined testing environments into /test_01 (individual models) and /test_02 (strictly V4, Gemini, Gallery), completely purged deprecated table views, and resolved mobile browser coordinate bugs.",
    highlights: [
      {
        type: "Added",
        items: [
          "Official Production Release (/official_v1.0): Dedicated flagship interface running strictly Hybrid Intelligence (MobileNet v4 edge feature extraction + automated Gemini Vision cloud failover).",
          "New /test_02 Testing Suite: Clean 3-tab testing environment strictly featuring [ V4 ] | [ GEMINI ] | [ GALLERY ].",
          "Benchmark Dataset Item #16 (Potato): Added standard ground-truth asset for out-of-distribution (OOD) produce testing.",
        ],
      },
      {
        type: "Removed",
        items: [
          "Purged Table View (/table): Completely deleted deprecated table page and all UI buttons per user specifications.",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Mobile Canvas Crop Sizing: Fixed bug where new Image() elements reported 0 width before DOM layout on mobile browsers by standardizing on naturalWidth / naturalHeight.",
        ],
      },
    ],
  },
  {
    version: "v0.4.0",
    date: "18 October 2026",
    title: "MobileNet v4 Universal & Comparative Testbed",
    summary:
      "Introduced Google Research's MobileNet v4 Universal architecture with Universal Inverted Bottleneck (UIB) at 256x256 resolution, and deployed comparative multi-engine benchmarking tools.",
    highlights: [
      {
        type: "Added",
        items: [
          "MobileNet v4 Universal Engine: Implemented high-resolution 256x256 UIB feature extraction with foreground chromatic HSV clustering and geometric aspect ratio sensors.",
          "Expanded Benchmark Suite: Added 6 new challenge items (White Cauliflower, Globe Artichoke, Spaghetti Squash, Salmon Fillet, Whole Raw Chicken, Potato) to testbed.",
          "Parallel Evaluation Engine: Built comparative test suite to measure latency and confidence differences across architectures.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Testbed Reorganization: Separated single-model testers under /test_01 and parallel comparison under /test_02.",
        ],
      },
    ],
  },
  {
    version: "v0.3.0",
    date: "17 October 2026",
    title: "MobileNet v3 TFHub & Live Telemetry Terminal",
    summary:
      "Loaded MobileNet v3 Large/Small models directly from TensorFlow Hub in WebGL, added live inference telemetry, and transitioned to a high-contrast minimalist interface.",
    highlights: [
      {
        type: "Added",
        items: [
          "MobileNet v3 Integration: Loaded official mobilenet_v3_large_100_224 and small models from TensorFlow Hub via tf.loadGraphModel.",
          "Live Telemetry Terminal: Added scrolling process log terminal displaying segmentation counts, HSV hues, logit projections, and latency in real time.",
          "10-Produce Softmax Constrained Classifier: Projected raw 1001-class ImageNet logits onto 10 standard Malaysian produce staples.",
        ],
      },
      {
        type: "Changed",
        items: [
          "Minimalist UI Redesign: Stripped away noisy pantry buttons, adopting an ultra-clean high-contrast black & white visual layout.",
          "Permanent Video Stream Mount: Prevented camera stream dismounts/flicker during model re-scans.",
        ],
      },
    ],
  },
  {
    version: "v0.2.0",
    date: "16 October 2026",
    title: "Gemini Multimodal Cloud Vision Integration",
    summary:
      "Connected Google Gemini Vision API via serverless backend, establishing the initial 3-way operational mode (CNN Only, Hybrid, Gemini Only) and curated Malaysian ingredients database.",
    highlights: [
      {
        type: "Added",
        items: [
          "Cloud Multimodal Vision Endpoint: Built /api/classify route utilizing Google Generative Language API (gemini-flash).",
          "Malaysian Culinary Database: Curated database of 75+ Malaysian market ingredients (Serai, Kunyit, Lengkuas, Kangkung, Bunga Kantan, etc.) with Malay translations and cooking notes.",
          "3-Way Mode Switcher: Allowed toggling between CNN Only (10 staples), Hybrid Mode, and Gemini Only.",
        ],
      },
    ],
  },
  {
    version: "v0.1.0",
    date: "Early October 2026",
    title: "Project Inception & Baseline Vision Pipeline",
    summary:
      "Initial project setup for UTeM Workshop 2 (BAXU 3923, Group 23), establishing Next.js 16 app framework and client-side MobileNet v2 on-device edge pipeline.",
    highlights: [
      {
        type: "Added",
        items: [
          "Next.js 16 Framework Setup: Initialized App Router with React 19, TypeScript, and Tailwind CSS.",
          "TensorFlow.js Edge Pipeline: Integrated @tensorflow/tfjs and @tensorflow-models/mobilenet v2 for in-browser client-side execution.",
          "Camera & Torch Hardware Controls: Built live viewfinder with facing-mode toggle (environment/user) and flashlight torch toggle.",
          "Workshop 2 Project Proposal: ZeroWaste Chef project scope approved by UTeM academic supervisors.",
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-black text-white p-3 sm:p-6 flex flex-col items-center font-mono">
      <div className="w-full max-w-3xl flex flex-col space-y-6">
        {/* Navigation & Header */}
        <header className="flex flex-col space-y-3 pb-4 border-b border-zinc-900">
          <div className="flex items-center justify-between">
            <Link
              href="/official_v1.0"
              className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition bg-zinc-950 hover:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to App</span>
            </Link>

            <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
              <span>UTeM Workshop 2</span>
              <span>&bull;</span>
              <span>Group 23</span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Project Changelog
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                v2.0.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Complete development history, architecture evolutions, and bugfixes for ZeroWaste Chef.
            </p>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase">Current Engine</span>
              <span className="text-xs font-bold text-emerald-400">Hybrid Intelligence</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase">Edge Model</span>
              <span className="text-xs font-bold text-white">MobileNet v4 (256px)</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase">Cloud Multimodal</span>
              <span className="text-xs font-bold text-blue-400">Gemini Vision AI</span>
            </div>
          </div>
        </header>

        {/* Timeline List */}
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
          {RELEASES.map((rel) => (
            <div key={rel.version} className="relative group">
              {/* Timeline Bullet Node */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full border-2 ${
                  rel.tag === "LATEST"
                    ? "bg-emerald-500 border-black ring-4 ring-emerald-500/20"
                    : "bg-zinc-900 border-zinc-700"
                }`}
              />

              {/* Release Card */}
              <div className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 flex flex-col space-y-3 transition-colors shadow-xl">
                {/* Release Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-white">{rel.version}</span>
                    {rel.tag && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-black tracking-wider uppercase">
                        {rel.tag}
                      </span>
                    )}
                    <span className="text-zinc-600">&bull;</span>
                    <span className="text-xs text-zinc-400 font-semibold">{rel.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {rel.date}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-xs text-zinc-300 leading-relaxed">{rel.summary}</p>

                {/* Detailed Highlights */}
                <div className="space-y-3 pt-1">
                  {rel.highlights.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                        {sec.type === "Added" && <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        {sec.type === "Changed" && <GitCommit className="w-3.5 h-3.5 text-blue-400" />}
                        {sec.type === "Fixed" && <Bug className="w-3.5 h-3.5 text-amber-400" />}
                        {sec.type === "Removed" && <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                        <span
                          className={
                            sec.type === "Added"
                              ? "text-emerald-400"
                              : sec.type === "Changed"
                              ? "text-blue-400"
                              : sec.type === "Fixed"
                              ? "text-amber-400"
                              : "text-red-400"
                          }
                        >
                          {sec.type}
                        </span>
                      </div>

                      <ul className="space-y-1 pl-4 border-l border-zinc-900">
                        {sec.items.map((item, iIdx) => (
                          <li key={iIdx} className="text-[11px] text-zinc-400 leading-relaxed list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center pt-6 pb-8 border-t border-zinc-900 text-[10px] text-zinc-600 flex flex-col items-center space-y-1">
          <div>ZeroWaste Chef &bull; UTeM Workshop 2 (BAXU 3923) &bull; Group 23</div>
          <div>Continuous Delivery on Vercel &bull; Next.js 16 App Router &bull; React 19</div>
        </footer>
      </div>
    </main>
  );
}
