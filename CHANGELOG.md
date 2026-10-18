# Changelog

All notable changes to the **ZeroWaste Chef** (UTeM Workshop 2, BAXU 3923, Group 23) codebase are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
