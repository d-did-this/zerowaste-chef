# Changelog

All notable changes to the **ZeroWaste Chef** (UTeM Workshop 2, BAXU 3923, Group 23) codebase are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
