import catalogData from "@/data/recipesCatalog.json";
import { PantryItem } from "@/utils/pantryStorage";
import { analyzeRecipeIngredients, RecipeMatchAnalysis } from "@/utils/ingredientMatcher";

export const CANONICAL_APPLIANCE_KEYS = [
  "stove",
  "wok",
  "pot",
  "blender",
  "rice_cooker",
  "oven",
  "air_fryer",
  "microwave",
] as const;

export const CANONICAL_APPLIANCE_LABELS: Record<string, string> = {
  stove: "Stove",
  wok: "Frying Pan",
  pot: "Pot",
  blender: "Blender",
  rice_cooker: "Rice Cooker",
  oven: "Oven",
  air_fryer: "Air Fryer",
  microwave: "Microwave",
};

export interface RecipeItem {
  id: number;
  uid: string;
  name: string;
  cuisine: string;
  cuisineLabel: string;
  collection: string;
  category: string;
  diet: string[];
  equipmentNeeded: string[];
  applianceGroups: string[][];
  appliances: string[];
  ingredients: string[];
  instructions: string;
  prepTime: string;
  sourceUrl: string;
}

export interface MatchedRecipeResult extends RecipeItem {
  analysis: RecipeMatchAnalysis;
  appliancesReady: boolean;
}

export interface StepTimerOption {
  id: string;
  label: string;
  rawMatch: string;
  seconds: number;
}

/**
 * Formula to sanitize raw equipment into ONLY the 8 canonical appliances.
 * Non-appliance utensils (bowls, knives, spoons, strainers, etc.) are excluded.
 */
export function cleanRecipeAppliances(rawEquipment: string[]): {
  applianceGroups: string[][];
  appliances: string[];
  equipmentNeeded: string[];
} {
  const applianceGroups: string[][] = [];
  const appliances: string[] = [];

  for (const raw of rawEquipment) {
    const el = raw.toLowerCase();
    const opts: string[] = [];
    if (el.includes("stove")) opts.push("stove");
    if (el.includes("rice cooker")) opts.push("rice_cooker");
    if (el.includes("blender") || el.includes("food processor")) opts.push("blender");
    if (el.includes("air fryer") || el.includes("air-fryer")) opts.push("air_fryer");
    if (el.includes("microwave")) opts.push("microwave");
    if (el.includes("oven")) opts.push("oven");
    if (
      el.includes("wok") ||
      el.includes("frying pan") ||
      el.includes("griddle") ||
      el.includes("dosa pan")
    ) {
      opts.push("wok");
    }
    if (el.includes("pot") || el.includes("saucepan")) opts.push("pot");

    if (opts.length > 0) {
      const uniqueOpts = Array.from(new Set(opts));
      const key = uniqueOpts.join("|");
      if (!applianceGroups.some((g) => g.join("|") === key)) {
        applianceGroups.push(uniqueOpts);
      }
      for (const o of uniqueOpts) {
        if (!appliances.includes(o)) appliances.push(o);
      }
    }
  }

  const equipmentNeeded = appliances
    .map((k) => CANONICAL_APPLIANCE_LABELS[k])
    .filter(Boolean);

  return { applianceGroups, appliances, equipmentNeeded };
}

export const RECIPES_DB: RecipeItem[] = catalogData as RecipeItem[];

export function isApplianceCompatible(
  recipe: RecipeItem,
  appliancesState: Record<string, boolean>
): boolean {
  const hasAnyApplianceSelected = Object.values(appliancesState).some(Boolean);
  if (!hasAnyApplianceSelected) return false;

  if (recipe.applianceGroups && recipe.applianceGroups.length > 0) {
    return recipe.applianceGroups.every((group) =>
      group.some((app) => Boolean(appliancesState[app]))
    );
  }
  return recipe.appliances.some((app) => Boolean(appliancesState[app]));
}

export function calculateMatchedRecipes(
  cuisinesState: Record<string, boolean>,
  appliancesState: Record<string, boolean>
): number {
  const specificKeys = ["malay", "chinese", "indian", "sabah-sarawak", "others"];
  const hasAnyCuisineSelected = specificKeys.some((k) => cuisinesState[k]);
  if (!hasAnyCuisineSelected) return 0;

  const hasAnyApplianceSelected = Object.values(appliancesState).some(Boolean);
  if (!hasAnyApplianceSelected) return 0;

  return RECIPES_DB.filter((recipe) => {
    if (!cuisinesState[recipe.cuisine]) return false;
    return isApplianceCompatible(recipe, appliancesState);
  }).length;
}

export function getFilteredRecipes(
  cuisinesState: Record<string, boolean>,
  appliancesState: Record<string, boolean>,
  pantryItems: PantryItem[] = []
): MatchedRecipeResult[] {
  const specificKeys = ["malay", "chinese", "indian", "sabah-sarawak", "others"];
  const hasAnyCuisineSelected = specificKeys.some((k) => cuisinesState[k]);
  if (!hasAnyCuisineSelected) return [];

  const filtered = RECIPES_DB.filter((recipe) => {
    if (!cuisinesState[recipe.cuisine]) return false;
    return isApplianceCompatible(recipe, appliancesState);
  });

  const enriched: MatchedRecipeResult[] = filtered.map((recipe) => ({
    ...recipe,
    analysis: analyzeRecipeIngredients(recipe.ingredients, pantryItems),
    appliancesReady: true,
  }));

  return enriched.sort((a, b) => {
    if (b.analysis.matchPercentage !== a.analysis.matchPercentage) {
      return b.analysis.matchPercentage - a.analysis.matchPercentage;
    }
    if (b.analysis.matchedCoreCount !== a.analysis.matchedCoreCount) {
      return b.analysis.matchedCoreCount - a.analysis.matchedCoreCount;
    }
    return a.id - b.id;
  });
}

export function getAllRecipesWithPantryMatch(
  pantryItems: PantryItem[],
  appliancesState: Record<string, boolean>
): MatchedRecipeResult[] {
  const enriched: MatchedRecipeResult[] = RECIPES_DB.map((recipe) => ({
    ...recipe,
    analysis: analyzeRecipeIngredients(recipe.ingredients, pantryItems),
    appliancesReady: isApplianceCompatible(recipe, appliancesState),
  }));

  return enriched.sort((a, b) => {
    if (b.analysis.matchPercentage !== a.analysis.matchPercentage) {
      return b.analysis.matchPercentage - a.analysis.matchPercentage;
    }
    return a.id - b.id;
  });
}

export function parseInstructionSteps(instructions: string): string[] {
  const parts = instructions
    .split(/(?=\b\d+\.\s)/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim());
  return parts.length > 0 ? parts : [instructions];
}

/**
 * Auto-detects time durations inside a cooking step sentence.
 * For ranges (e.g., "4-5 minutes"), sets the alert timer to the lower bound
 * so the cook checks before overcooking.
 */
export function extractStepTimers(stepText: string): StepTimerOption[] {
  const regex =
    /(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/gi;
  const timers: StepTimerOption[] = [];
  const seenSeconds = new Set<number>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(stepText)) !== null) {
    const firstVal = parseFloat(match[1]);
    const secondVal = match[2] ? parseFloat(match[2]) : null;
    const unitRaw = match[3].toLowerCase();

    let multiplier = 60;
    let shortUnit = "min";
    if (unitRaw.startsWith("sec")) {
      multiplier = 1;
      shortUnit = "sec";
    } else if (unitRaw.startsWith("h")) {
      multiplier = 3600;
      shortUnit = "hr";
    }

    const totalSeconds = Math.max(1, Math.round(firstVal * multiplier));
    if (seenSeconds.has(totalSeconds)) continue;
    seenSeconds.add(totalSeconds);

    const label = secondVal
      ? `${firstVal}-${secondVal} ${shortUnit}`
      : `${firstVal} ${shortUnit}`;

    timers.push({
      id: `timer_${totalSeconds}_${timers.length}`,
      label,
      rawMatch: match[0],
      seconds: totalSeconds,
    });
  }

  return timers;
}

export function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
