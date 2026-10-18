# Changelog

All notable changes to the **ZeroWaste Chef** (UTeM Workshop 2, BAXU 3923, Group 23) codebase are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-10-19 (Official v2.1)

### Added
- **Skeuomorphic + Neomorphic Fusion:** Implemented physical tactical depth with darker, more obvious contrast shadows (`rgba(115, 138, 168, 0.55)`), beveled edges, physical dial wells (`.skeuo-bevel-well`), and concentric metallic shutter rings (`.skeuo-shutter-ring`).
- **Coming Soon Sections:** Labeled "Cook Now" and "Grocery" with amber `SOON` navigation badges and redesigned both pages with clean, uncluttered, skeuomorphic "Coming Soon" roadmap cards.
- **1-Tap In-App Fullscreen Toggle:** Added an instant Fullscreen trigger in the header using HTML5 Fullscreen API alongside universal PWA standalone/fullscreen manifest overrides for mobile & desktop.

### Changed
- **Redesigned Ready to Scan Control Deck:** Replaced basic buttons with a physical camera console featuring a central metallic shutter button, recessed gallery upload button, single tactile manual entry button, and clean status indicators.
- **Darker Shadows Across the App:** Increased shadow darkness, contrast, and depth across all cards, buttons, steppers, and containers for maximum tactile punch.

### Removed
- **Redundant Manual Buttons:** Removed the manual button from the pantry (leaving only the floating camera FAB) and removed the duplicate manual button from the scanner viewfinder bar, keeping a single, dedicated manual button in the camera shutter deck.

---

## [2.4.0] - 2026-10-19

### Added
- **Fullscreen Installed Web App (PWA):** Configured Web App Manifest (`public/manifest.json`) and mobile web app meta tags with `display: "fullscreen"`, launching the app in full screen mode when installed on home screens.
- **Floating Camera Scan Button:** Replaced the docked pantry button with a dedicated circular, bulging floating action button (`w-14 h-14 rounded-full neo-bulge-primary`) at the bottom-right corner.
- **Scanner HUD Manual Entry:** Added manual entry buttons directly on the Scanner HUD (top control bar and ready-to-scan shutter controls) opening a Neumorphic bottom sheet modal with Malaysian quantifiers.

### Changed
- **Darker Ingredient Shadows & Dark Green Borders:** Upgraded all pantry ingredient cards with deep ambient shadows and a thin subtle dark-green border (`border-[#004d34]/25`) for enhanced tactile depth.
- **Darker Shadows on Scanner Cards:** Enhanced both the ingredient detail block (portions, notes, confirm button) and the viewfinder container with deeper dark-contrast shadows and dark-green border accents.
- **Redesigned Floating Bottom Navigation Dock:** Transformed the bottom navigation into a modern elevated floating pill dock (`rounded-3xl`) with deep soft shadows and carved-in crater tabs (`.neo-crater-darkgreen`).
- **Redesigned Rescan & Scan Next Buttons:** Rescan features a warm terracotta/amber gradient (`#f59e0b` to `#c2410c`) with replay icon, and Scan Next features an electric sapphire/indigo gradient (`#38bdf8` to `#1e40af`) with scanner icon.

### Removed
- **Header Back Button:** Removed the legacy back button from the header, replacing it with a clean tactile brand leaf emblem (`eco`).

---

## [2.3.1] - 2026-10-19

### Removed
- **Dark Mode System & Neon Glowing Shadows:** Reverted dark mode theme and all fluorescent glowing drop shadows per user request, locking the entire application to clean, pure light-mode Google Stitch Soft-UI neumorphism.

### Changed
- **Natural Light Crater Active Tab:** Calibrated `.neo-crater-darkgreen` to use `#004d34` with clean white typography and crisp recessed directional shadows, removing fluorescent neon mint accents.
- **Root Background Standardization:** Standardized `body` and `:root` background strictly to `#f0f4f9` across `layout.tsx` and `globals.css`.

---

## [2.3.0] - 2026-10-19

### Added
- **Real Photo Pantry Cards:** When ingredients are scanned or snapped, the captured camera photo is saved directly into the pantry inventory and displayed as the card thumbnail instead of static emojis.
- **Deep Crater Neumorphic Active Tab:** Re-engineered the bottom navigation active tab with `.neo-crater-darkgreen` featuring directional dark inner shadows (`inset 6px 6px 12px`), radial dark pit gradient, physical depression (`translateY(3px)`), and mint rim reflection, looking like a real crater.
- **Smooth Tab Switch Transitions:** Added `.animate-tab-content` with `@keyframes tabSwitchFadeSlide` for seamless fluid animation when navigating between Scanner, Pantry, Cook Now, and Grocery tabs.
- **Full-App Dark Mode System:** Implemented full Dark Neumorphic ("Darkmorphic") styling across all pages with a header toggle button (☀️ / 🌙) and persistent theme synchronization with local storage.
- **Wrapped Dark Green Category Filter Section:** Enclosed pantry filter chips in a dedicated `#004d34` dark green container with icons for each category (`inventory_2`, `nutrition`, `set_meal`, `soup_kitchen`, `egg_alt`, `rice_bowl`).
- **Dynamic Relative "Updated ... ago" Live Time:** Replaced static status with dynamic live time calculation ("Updated just now", "Updated 2m ago", etc.) tracked across all inventory operations.

### Changed
- **Digital Pantry Rebranding:** Rebranded "Pantry Vitality" to "Digital Pantry" with rich emerald/dark green styling and recessed stat wells.
- **Clean Cook Now Navigation:** Removed the "READY" notification badge from the Cook Now button in the bottom dock for a cleaner aesthetic.

---

## [2.2.0] - 2026-10-19

### Added
- **Malaysian Quantifier System (Penjodoh Bilangan):** Full integration of authentic Malaysian penjodoh bilangan across the app (`biji`, `buah`, `batang`, `ikat`, `botol`, `ketul`, `labu`, `ulas`, `tin`, `bungkus`). Lemon defaults to `biji`, Watermelon/Papaya to `buah`, Garlic to `labu`.
- **First-Class Citrus & Fruits Catalog:** Added dedicated database entries for `Lemon` (`biji`), `Orange` (`biji`), `Apple` (`biji`), `Watermelon` (`buah`), and `Papaya` (`buah`) under `Citrus & Fruits`.
- **Light Galaxy Gradient Blue Gemini Button:** Option C 1-tap AI escalation button styled with an eye-catching galaxy blue gradient (`#93c5fd` via `#bfdbfe` to `#c7d2fe`) with soft ambient blue glow.
- **Bulging 3D Convex Neumorphic Buttons:** Added `.neo-bulge-primary` with pronounced multi-layer convex shadows (`6px 6px 15px rgba(0,40,25,0.45), -5px -5px 12px #ffffff`) for "Confirm & Add to Pantry" and "Snap & Identify".
- **Unique Vibrant Action Button Palettes:** Rescan button styled in Warm Amber/Coral (`from-amber-500 to-orange-500`), and Scan Next in Vivid Sky Blue/Indigo (`from-sky-500 to-indigo-600`).
- **Carved-In Dark Green Bottom Navigation:** Active navigation tabs in bottom dock now feature deep recessed inner shadows with dark green background (`#004d34`, `.neo-recessed-darkgreen`).

### Changed
- **English-First UI & Ingredient Naming:** Standardized all UI copy, ingredient titles, instructions, and category labels to English, while preserving authentic Malaysian classifiers for quantity.
- **Dark Green Result Header:** Redesigned the top row of the scanner result card with a rich `#004d34` dark green background and mint green verified badge.
- **Yellow Flashlight Button:** Updated camera torch button to a bright amber-yellow theme (`text-amber-500` / `bg-amber-400`).

### Fixed
- **Lemon Misclassification ("Aromatics & Spices" Bug):** Fixed root cause where scanning Lemon matched the `lemon grass` subword in `serai` (Lemongrass) under Aromatics & Spices. Added prioritized exact-keyword scoring ($1000+$ boost) and passed CNN predicted categories directly to candidate search.
- **Viewfinder Reticle Cleanliness:** Removed lingering "Fresh Produce" pill from inside the camera reticle, ensuring 100% crystal-clear viewfinder visibility.

---

## [2.1.0] - 2026-10-19

### Added
- **Google Stitch Tactile Bottom Navigation Dock:** Integrated the official 4-tab mobile navigation bar (`Scanner`, `Pantry`, `Cook Now`, `Grocery`) featuring neumorphic recessed pills (`.neo-recessed-pill`), emerald active states (`#006948`), and the `Ready` badge on Cook Now.
- **Smart Pantry AI View:** Added full-featured Pantry management with live Vitality stats (Stored Items, Ready Meals), category filter chips (`All`, `Produce`, `Proteins`, `Seasoning`, `Dairy`, `Staples`), interactive portion steppers (`[-]` and `[+]`), individual delete actions, and floating quick-action dock (`+ Manual` and `Scan`).
- **Manual Ingredient Entry Modal Sheet:** Tactile bottom sheet modal to quickly log uncatalogued ingredients with quantity stepper, Malaysian unit selector (`pcs`, `g`, `ml`, `botol`, `batang`, `ikat`, `bulb`), and category pills.
- **Hardware & Digital Camera Zoom:** Added multi-level zoom controls (`1x`, `1.5x`, `2x`, `3x`) with real-time video scaling and proportional coordinate cropping in canvas snapshot processing, ensuring accurate detection at any zoom level.
- **Cook Now & Smart Restock:** Added Malaysian ZeroWaste recipe engine matched to pantry inventory (e.g. *Ayam Masak Kicap*, *Sayur Bayam Tumis Bawang Putih*) and grocery restock checklist.

### Changed
- **Expanded Camera Grid Viewport:** Enlarged camera container to an expansive `aspect-[3/4] / sm:aspect-square` layout with `min-h-[380px]` for immersive smartphone scanning.
- **Unobstructed Viewfinder Guidance:** Relocated "Keep ingredients centered for optimal detection" below the camera viewport, keeping 100% of the live camera feed clear.
- **Standardized Branding:** Replaced all instances of "ZeroWaste Kitchen" with "ZeroWaste Chef" and removed "Hybrid" labels from client headers and badges for a cleaner, unified presentation.

### Fixed
- **Transparent Scanning Reticle:** Fixed camera obstruction caused by `.neo-raised-sm` background fill by enforcing `!bg-transparent` with crisp emerald corner brackets and subtle center crosshair.
- **Viewfinder Clutter:** Removed "HD 60FPS" badge from camera viewfinder.

---

## [2.0.0] - 2026-10-19

### Added
- **Official Flagship Neumorphic Scanner HUD (`/official_v2.0`):** Deployed a complete redesign based on Google Stitch Soft-UI design language (`#eef2f6` surface, dual soft shadows, and `#006948` Malaysian kitchen emerald green).
- **Targeting Reticle & Animated Scanline:** Added an in-viewfinder HUD featuring corner reticle brackets in emerald green, center crosshair target, and smooth laser scanline animation (`animate-scan-move`).
- **Interactive Portion Counter:** Integrated interactive `[-]` and `[+]` portion quantity steppers dynamically synchronized with Malaysian culinary unit standards (`botol` for sauces, `batang` for aromatics, `ikat` for greens, `kg`, `pcs`).
- **Add to Pantry / Fridge Persistence:** Connected `Confirm & Add to Pantry` directly to local storage (`savePantryItem`) with animated `[ Added to Fridge! ]` feedback.
- **Pantry & Shelf-Life Notes:** Added an expandable item note input for recording custom storage reminders, expiration dates, or purchase sources.
- **Hardware Torch & Camera Controls:** Mounted neumorphic floating action buttons for native flashlight torch toggling and front/back camera switching.
- **Integrated Option C Gemini Pill:** Embedded 1-tap `Not what you expected? [ Gemini Vision ]` escalation pill directly on the result card.
- **Primary Flagship Redirect:** Set root `/` and `/official` to automatically launch `/official_v2.0`.

---

## [1.1.0] - 2026-10-19

### Added
- **3-Layer Defense-in-Depth Malaysian Brand Disambiguation:**
  - **Layer 1 (Prompt Hygiene & Semantic Isolation):** Updated Gemini Vision API prompt to strictly decouple generic culinary food item identity (`name`, `nameMalay`) from commercial trademarks and brand names (`brand`).
  - **Layer 2 (Longest-String & Specificity Scoring):** Re-engineered `findMatchingMalaysianIngredient` in `malaysianIngredients.ts` to rank candidate matches by term length and word specificity. Multi-word exact terms (e.g., `kicap manis`, length 11) now consistently beat greedy single-subword hits (e.g., `udang`, length 5).
  - **Layer 3 (Hierarchical Two-Pass Category Filter):** Constrained database search to the detected culinary domain (e.g., searching strictly inside `Pantry & Seasonings` for bottled condiments before falling back to `Proteins & Seafood`). Resolves false positive classification where *Habhal's Cap Kipas Udang* was labeled as raw prawn.
- **Option C (1-Tap Manual Escalation):** Added a prominent `[ ✨ Not what you expected? Ask Gemini Vision ]` button to the result card whenever inference is processed by local on-device CNNs. Users can instantly override local classifications with cloud multimodal vision.
- **Brand Metadata Surfacing:** Displayed detected brand names alongside the generic ingredient name in the result card subtitle (e.g., *Sweet Soy Sauce (Habhal's Cap Kipas Udang)*).

### Changed
- **Hybrid Decision Gate Calibration:** Raised the local MobileNet v4 acceptance threshold from $\ge 60\%$ to $\ge 80\%$, and added a mandatory $\ge 20\%$ margin gap requirement between the #1 and #2 candidate scores. Out-of-catalog items (e.g., Salmon, Chicken, Potato, Kicap Manis) with split logits now reliably fail the gate and auto-escalate to Gemini Vision.
- **Optical Shape Boost Calibration:** Restricted the color-based logit boost for Orange to images with `shapeLabel === "Compact"` (round), eliminating false orange fruit classification on flat/elongated salmon fillets.
- **Version Badges:** Updated official release banner and navigation header badges to `OFFICIAL v1.1`.

---

## [1.0.0] - 2026-10-19

### Added
- **Official Production Release Route (`/official_v1.0`):** Flagship production interface running **Hybrid Only** mode (MobileNet v4 on-device edge feature extraction + automated cloud escalation to Google Gemini Vision).
- **Dedicated Test 02 Suite (`/test_02/*`):** Clean 3-tab testing environment with dedicated routes:
  - `/test_02/v4`: MobileNet v4 Universal scanner ($256 \times 256$ native resolution).
  - `/test_02/gemini`: Gemini Vision cloud scanner.
  - `/test_02/gallery`: Standard 16-item produce and OOD benchmark gallery with 1-click test triggers for V4 and Gemini.
- **Item #16 Potato (Out-of-Distribution Benchmark):** Added high-resolution produce benchmark asset for uncatalogued food testing.

### Removed
- **Table Route (`/table`):** Completely removed deprecated testing table page, routes, and navigation buttons.

### Fixed
- **Mobile Canvas Crop Sizing:** Fixed bug where `new Image()` elements reported 0 width before layout paint on mobile browsers by standardizing on `img.naturalWidth` / `img.naturalHeight`.

---

## [0.2.0] - 2026-10-17

### Added
- **MobileNet v4 Experimental Architecture:** Universal Inverted Bottleneck (UIB) implementation with high-resolution $256 \times 256$ crop and foreground chromatic HSV segmentation.
- **Gemini Vision Cloud Multimodal Endpoint:** Created `/api/classify` utilizing Google Generative AI (`gemini-flash-latest`) with custom Malaysian culinary prompts.
- **Single-Engine Testbed (`/test_01/*`):** Created individual testing sandboxes for MobileNet v2, v3, v4, Gemini, and the benchmark gallery.
