import catalogData from "@/data/recipesCatalog.json";
import { PantryItem } from "@/utils/pantryStorage";
import {
  analyzeRecipeIngredients,
  preparePantryEntries,
  RecipeMatchAnalysis,
} from "@/utils/ingredientMatcher";

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

export interface GeneratedRecipeSnapshot {
  kitchenMatched: MatchedRecipeResult[];
  allExploreScored: MatchedRecipeResult[];
}

export function buildGeneratedRecipeSnapshot(
  cuisinesState: Record<string, boolean>,
  appliancesState: Record<string, boolean>,
  pantryItems: PantryItem[] = [],
  minMatchPercentage = 75
): GeneratedRecipeSnapshot {
  const preparedEntries = preparePantryEntries(pantryItems);
  const specificKeys = ["malay", "chinese", "indian", "sabah-sarawak", "others"];
  const hasAnyCuisineSelected = specificKeys.some((k) => cuisinesState[k]);

  const allExploreScored: MatchedRecipeResult[] = [];
  const kitchenMatched: MatchedRecipeResult[] = [];

  for (const recipe of RECIPES_DB) {
    const analysis = analyzeRecipeIngredients(recipe.ingredients, pantryItems, preparedEntries);
    const appliancesReady = isApplianceCompatible(recipe, appliancesState);
    const enriched: MatchedRecipeResult = {
      ...recipe,
      analysis,
      appliancesReady,
    };
    allExploreScored.push(enriched);

    if (
      hasAnyCuisineSelected &&
      cuisinesState[recipe.cuisine] &&
      appliancesReady &&
      (minMatchPercentage <= 0 || pantryItems.length > 0) &&
      analysis.matchPercentage >= minMatchPercentage
    ) {
      kitchenMatched.push(enriched);
    }
  }

  allExploreScored.sort((a, b) => {
    if (b.analysis.matchPercentage !== a.analysis.matchPercentage) {
      return b.analysis.matchPercentage - a.analysis.matchPercentage;
    }
    return a.id - b.id;
  });

  kitchenMatched.sort((a, b) => {
    if (b.analysis.matchPercentage !== a.analysis.matchPercentage) {
      return b.analysis.matchPercentage - a.analysis.matchPercentage;
    }
    if (b.analysis.matchedCoreCount !== a.analysis.matchedCoreCount) {
      return b.analysis.matchedCoreCount - a.analysis.matchedCoreCount;
    }
    return a.id - b.id;
  });

  return { kitchenMatched, allExploreScored };
}

export function getFilteredRecipes(
  cuisinesState: Record<string, boolean>,
  appliancesState: Record<string, boolean>,
  pantryItems: PantryItem[] = [],
  minMatchPercentage = 75
): MatchedRecipeResult[] {
  const specificKeys = ["malay", "chinese", "indian", "sabah-sarawak", "others"];
  const hasAnyCuisineSelected = specificKeys.some((k) => cuisinesState[k]);
  if (!hasAnyCuisineSelected) return [];
  if (minMatchPercentage > 0 && pantryItems.length === 0) return [];

  const preparedEntries = preparePantryEntries(pantryItems);
  const filtered = RECIPES_DB.filter((recipe) => {
    if (!cuisinesState[recipe.cuisine]) return false;
    return isApplianceCompatible(recipe, appliancesState);
  });

  const enriched: MatchedRecipeResult[] = filtered
    .map((recipe) => ({
      ...recipe,
      analysis: analyzeRecipeIngredients(recipe.ingredients, pantryItems, preparedEntries),
      appliancesReady: true,
    }))
    .filter((recipe) => recipe.analysis.matchPercentage >= minMatchPercentage);

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
  const preparedEntries = preparePantryEntries(pantryItems);
  const enriched: MatchedRecipeResult[] = RECIPES_DB.map((recipe) => ({
    ...recipe,
    analysis: analyzeRecipeIngredients(recipe.ingredients, pantryItems, preparedEntries),
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

export interface StepToolBreakdown {
  appliances: string[];
  optionalTools: string[];
}

const STEP_INGREDIENT_STOPWORDS = new Set([
  "and", "for", "the", "with", "hot", "warm", "cold", "red", "big", "cup", "cups",
  "tsp", "tbsp", "mix", "add", "into", "from", "until", "cut", "dry", "raw", "use",
]);

/**
 * Detects which recipe ingredients are actively used in a single cooking step sentence.
 */
export function extractStepIngredients(
  stepText: string,
  ingredients: { cleanName: string }[]
): string[] {
  const lower = stepText.toLowerCase();
  const matched: { label: string; pos: number }[] = [];

  for (const ing of ingredients) {
    const clean = ing.cleanName.trim();
    if (clean.length < 3) continue;

    const cleanLow = clean.toLowerCase();
    let bestPos = lower.indexOf(cleanLow);

    if (bestPos === -1) {
      const tokens = cleanLow
        .split(/[\s,/-]+/)
        .filter((w) => w.length >= 3 && !STEP_INGREDIENT_STOPWORDS.has(w));
      for (const tok of tokens) {
        const stem = tok.replace(/(?:ies|es|s)$/, "");
        const escaped = (stem.length >= 3 ? stem : tok).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const m = new RegExp(`\\b${escaped}(?:ies|es|s)?\\b`, "i").exec(lower);
        if (m) {
          bestPos = m.index;
          break;
        }
      }
    }

    if (bestPos !== -1) {
      const display = clean.charAt(0).toUpperCase() + clean.slice(1);
      if (!matched.some((item) => item.label.toLowerCase() === display.toLowerCase())) {
        matched.push({ label: display, pos: bestPos });
      }
    }
  }

  return matched
    .sort((a, b) => a.pos - b.pos)
    .slice(0, 6)
    .map((m) => m.label);
}

const OPTIONAL_TOOL_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Whisk (optional)", pattern: /\b(?:whisk|whisking|beat lightly)\b/i },
  { label: "Spatula (optional)", pattern: /\b(?:spatula|turner|scraper)\b/i },
  { label: "Mixing bowl (optional)", pattern: /\b(?:mixing\s+bowl|large\s+bowl)\b/i },
  { label: "Small bowl (optional)", pattern: /\b(?:small\s+bowl)\b/i },
  { label: "Bowl (optional)", pattern: /\bbowl\b/i },
  { label: "Knife (optional)", pattern: /\b(?:knife|knives)\b|\b(?:chop|slice|mince|dice|julienne|slit|score)\b/i },
  { label: "Chopping board (optional)", pattern: /\b(?:chopping\s+board|cutting\s+board)\b/i },
  { label: "Spoon (optional)", pattern: /\b(?:wooden\s+spoon|slotted\s+spoon|metal\s+spoon|serving\s+spoon|with\s+a\s+spoon|using\s+a\s+spoon)\b/i },
  { label: "Ladle (optional)", pattern: /\bladle\b/i },
  { label: "Strainer (optional)", pattern: /\b(?:strainer|sieve|colander|sift|strain)\b|\bdrain\s+(?:the|excess|well|water|oil)\b/i },
  { label: "Mortar & pestle (optional)", pattern: /\b(?:mortar|pestle|pound)\b/i },
  { label: "Grater (optional)", pattern: /\b(?:grater|grate)\b/i },
  { label: "Tongs (optional)", pattern: /\btongs\b/i },
  { label: "Rolling pin (optional)", pattern: /\b(?:rolling\s+pin|roll\s+out)\b/i },
  { label: "Baking pan (optional)", pattern: /\b(?:baking\s+(?:pan|tray|tin|dish)|cake\s+(?:pan|tin)|loaf\s+pan|muffin\s+tin)\b/i },
  { label: "Plate (optional)", pattern: /\b(?:plate|platter)\b/i },
];

/**
 * Extracts canonical appliances and optional small utensils referenced in a single step.
 * Small tools are returned only at step scope and tagged with "(optional)".
 */
export function extractStepAppliancesAndTools(
  stepText: string,
  recipeAppliances: string[]
): StepToolBreakdown {
  const s = stepText.toLowerCase();
  const hasApp = (k: string) => recipeAppliances.includes(k);
  const apps: string[] = [];
  const pushApp = (k: string) => {
    if (!apps.includes(k)) apps.push(k);
  };

  if (/\b(?:air[- ]?fry(?:er|ing)?)\b/i.test(s)) pushApp("air_fryer");
  if (/\bmicrowave\b/i.test(s)) pushApp("microwave");
  if (/\brice\s+cooker\b/i.test(s)) pushApp("rice_cooker");
  if (/\boven\b/i.test(s) || (hasApp("oven") && /\b(?:preheat|bake|baking|roast|broil)\b/i.test(s))) {
    pushApp("oven");
  }
  if (/\bblender\b/i.test(s) || (hasApp("blender") && /\b(?:blend|pur[eé]e|grind finely|process until smooth)\b/i.test(s))) {
    pushApp("blender");
  }

  const panMatch = /\b(?:wok|frying\s+pan|skillet|pan[- ]?fry|stir[- ]?fry|saut[eé]|sear|brown|toast|shallow[- ]?fry|deep[- ]?fry)\b|(?<!baking\s)(?<!cake\s)(?<!loaf\s)\bpan\b/i.test(s);
  const potMatch = /\b(?:pot|saucepan|boil|simmer|steam|steamer|poach|stew|braise|broth|stock)\b/i.test(s);
  const stoveAction = /\b(?:stove|heat|medium heat|high heat|low heat|turn off heat|flame|cook over)\b/i.test(s);

  if (panMatch && (hasApp("wok") || /\b(?:wok|frying\s+pan|skillet)\b/i.test(s))) {
    pushApp("wok");
  }
  if (potMatch && (hasApp("pot") || /\b(?:pot|saucepan|boil|simmer|steam)\b/i.test(s))) {
    pushApp("pot");
  }
  if ((apps.includes("wok") || apps.includes("pot")) && (hasApp("stove") || !apps.some((a) => ["oven", "air_fryer", "microwave", "rice_cooker"].includes(a)))) {
    if (!apps.includes("stove")) apps.unshift("stove");
  } else if (stoveAction && hasApp("stove")) {
    if (!apps.includes("stove")) apps.unshift("stove");
    if (apps.length === 1) {
      if (hasApp("wok")) pushApp("wok");
      else if (hasApp("pot")) pushApp("pot");
    }
  }

  const optionalTools: string[] = [];
  let hasSpecificBowl = false;
  for (const rule of OPTIONAL_TOOL_RULES) {
    if (!rule.pattern.test(s)) continue;
    if (rule.label === "Mixing bowl (optional)" || rule.label === "Small bowl (optional)") {
      hasSpecificBowl = true;
    }
    if (rule.label === "Bowl (optional)" && hasSpecificBowl) continue;
    optionalTools.push(rule.label);
  }

  return { appliances: apps, optionalTools };
}
