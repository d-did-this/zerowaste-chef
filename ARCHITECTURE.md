# ZeroWaste Chef Architecture Document

## System Overview
ZeroWaste Chef is a pure soft neumorphic smart AI pantry, kitchen scanner, and meal generation application built with Next.js (App Router), Tailwind CSS, TypeScript, and TensorFlow.js.

## Core Invariants
1. **Design System**: Monochromatic cool clay surface (`#E0E5EC`), primary deep emerald (`#004730`), accent green (`#006948`), zero harsh black borders, pure neumorphic raised and sunken shadow hierarchy.
2. **Device Geometry**: Fixed 390px x 844px mobile canvas with 44px outer border radius on desktop screens, 100vw/100vh on mobile screens.
3. **Pantry Inventory Contract**: Real-time hydration from `localStorage` (`zero_waste_pantry_v1`) with item name, Malay name, category, quantity, unit, timestamp, and photo URL.
4. **Meal Generation & Cooking Flow**:
   - Initiated via "Generate Meals" in Pantry or "Cook" tab in bottom navigation.
   - Smooth neumorphic transition loading screen simulating culinary profile alignment.
   - Step 1: Cuisine Preference selection (`CuisinePreferenceView`).
   - Step 2: Kitchen Setup & Appliance hotspot selection (`KitchenSetupView`).
   - Step 3: Curated recipe matching based on available ingredients, selected cuisines, and available appliances.

## Module Map
- `src/app/official_v3.0/page.tsx`: Flagship entry point.
- `src/components/OfficialV3Client.tsx`: Primary controller coordinating Pantry, Scanner HUD, Meal Generation, Smart Grocery Restock, and Modals.
- `src/components/MealTransitionModal.tsx`: Soft neumorphic loading screen with animated progress during culinary matching.
- `src/components/CuisinePreferenceView.tsx`: Step 1 cuisine preference selector with live recipe estimate.
- `src/components/KitchenSetupView.tsx`: Step 2 interactive kitchen appliance canvas with SVG hotspots.
- `src/components/RecipeMatchesView.tsx`: Step 3 Module 2 Bidirectional Recipe Engine (`Pantry to Meals` & `Craving Lookup` modes) with live pantry match scoring, collection/quick filters, and search.
- `src/components/RecipeDetailModal.tsx`: Interactive recipe sheet with bilingual pantry cross-reference, zero-waste substitution hints, missing-item grocery sync, and step-by-step interactive cooking mode with automatic pantry stock deduction.
- `src/components/GroceryRestockView.tsx`: View 6 Smart Grocery Restock queue synced with Module 2 missing ingredients and one-tap restock to Digital Pantry.
- `src/data/recipesCatalog.json`: 32 curated recipes (15 Che Nom Malay + 12 Saji Indian + 5 Chinese/Borneo/Others/Air-Fryer curated dishes).
- `src/utils/recipesDb.ts`: Rule-based appliance group constraint filter (`applianceGroups`) and bidirectional pantry-to-recipe matching engine.
- `src/utils/ingredientMatcher.ts`: Bilingual English/Malay synonym cluster matcher, staple detector, and local substitution recommender.
- `src/utils/groceryStorage.ts`: `localStorage` persistence (`zerowaste_chef_grocery_v1`) bridging missing recipe ingredients with Digital Pantry restock.
- `src/utils/pantryStorage.ts`: Local storage persistence (`zerowaste_chef_pantry_items_v1`) and state management.
- `src/utils/themeStorage.ts` & `src/components/ThemeSettingsModal.tsx`: Live theme selector (`pandan-hero`, `warm-clay`, `fresh-accents`, `classic-clay`) persisted in `localStorage` (`zerowaste_chef_theme_v1`) via `[data-zw-theme]` CSS tokens in `globals.css`.
- `src/utils/foodSemantics.ts`: Food-category, cuisine, and grocery aisle badge helpers.
- `src/utils/flyToNavAnimation.ts`: Bezier fly-to-nav animations (`launchToNavTab`) and `zw-nav-dock` pulse events linking Scanner, Recipe Detail, and Smart Grocery batch restocks to the bottom navigation tabs.

## Meal Generation Interactive Engine (v3.0 Official — Module 2)
- **Routes & Views**: Integrated directly into `OfficialV3Client.tsx` under `activeTab === "cook-now"`.
- **Three-Stage Progression**:
  1. `mealFlowStep === "cuisines"`: Cuisine Preference View (`CuisinePreferenceView.tsx`).
  2. `mealFlowStep === "appliances"`: Interactive Illustrated Kitchen Canvas (`KitchenSetupView.tsx`).
  3. `mealFlowStep === "recipes"`: Bidirectional Recipe Engine (`RecipeMatchesView.tsx`) + Interactive Cooking Modal (`RecipeDetailModal.tsx`).
- **Bottom Navigation Constraint**: During `activeTab === "cook-now"`, the bottom 4-tab bar is conditionally hidden (`{activeTab !== "cook-now" && ...}`) so that the view's primary green action button sits cleanly at the bottom, matching the exact prototype height without squishing content.
- **Canonical Appliances Contract**: 8 appliances (`microwave`, `blender`, `rice_cooker`, `pot`, `air_fryer`, `stove`, `wok`, `oven`) mapped to `kitchen-appliances.jpg` (aspect ratio 928 / 1152) with exact SVG polygon coordinates, floating pill positions, and strict `applianceGroups` compatibility filtering.
