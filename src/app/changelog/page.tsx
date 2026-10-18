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
    version: "v2.0.0",
    tag: "LATEST",
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
