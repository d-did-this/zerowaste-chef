import { PantryItem } from "@/utils/pantryStorage";
import { MALAYSIAN_INGREDIENTS_DB } from "@/utils/malaysianIngredients";

export type IngredientMatchStatus = "have" | "missing" | "staple";

export interface IngredientAnalysis {
  raw: string;
  sectionTag?: string;
  cleanName: string;
  status: IngredientMatchStatus;
  matchedPantryItem?: PantryItem;
  substitutionHint?: string;
}

export interface RecipeMatchAnalysis {
  matchedCoreCount: number;
  totalCoreCount: number;
  missingCoreCount: number;
  matchPercentage: number;
  ingredients: IngredientAnalysis[];
  missingItems: IngredientAnalysis[];
  haveItems: IngredientAnalysis[];
}

// Bilingual & Malaysian culinary synonym clusters
const SYNONYM_CLUSTERS: string[][] = [
  ["egg", "eggs", "telur"],
  ["chicken", "ayam", "chicken breast", "chicken meat", "chicken thigh", "chicken bones"],
  ["shallot", "shallots", "bawang merah", "small onion"],
  ["onion", "red onion", "holland onion", "yellow onion", "large onion", "bawang besar", "bawang holland"],
  ["garlic", "bawang putih", "garlic clove", "cloves garlic"],
  ["ginger", "halia", "ginger root", "ginger-garlic paste"],
  ["turmeric", "kunyit", "fresh turmeric", "kunyit hidup", "turmeric powder", "serbuk kunyit"],
  ["galangal", "lengkuas"],
  ["lemongrass", "serai"],
  ["chilli", "chili", "chillies", "chilies", "cili", "cili padi", "cili merah", "cili kering", "dried chillies", "blended chilli", "bird's eye chilli", "red chilli", "green chilli"],
  ["tomato", "tomatoes", "tomato paste", "tomato puree"],
  ["potato", "potatoes", "kentang"],
  ["carrot", "carrots", "lobak", "lobak merah"],
  ["cucumber", "timun"],
  ["cabbage", "kubis"],
  ["okra", "bendi", "lady finger"],
  ["long beans", "kacang panjang"],
  ["mustard greens", "sawi", "choy sum"],
  ["bean sprouts", "taugeh"],
  ["chinese chives", "kucai", "chives"],
  ["squid", "sotong", "calamari"],
  ["prawn", "prawns", "shrimp", "udang"],
  ["fish", "ikan", "stingray", "ikan pari", "sea bass", "snapper", "siakap"],
  ["anchovies", "ikan bilis", "dried anchovies"],
  ["fish ball", "fish balls", "bebola ikan"],
  ["fish cake", "fish cakes", "kek ikan"],
  ["coconut milk", "santan", "boxed coconut milk"],
  ["grated coconut", "kelapa parut", "kerisik"],
  ["sweet soy sauce", "kicap", "kicap manis", "soy sauce", "light soy sauce", "dark soy sauce", "caramel soy sauce"],
  ["oyster sauce", "sos tiram"],
  ["chilli sauce", "sos cili"],
  ["fish sauce", "sos ikan"],
  ["tamarind", "asam jawa", "asam keping", "tamarind water", "tamarind concentrate", "tamarind peel", "tamarind sauce"],
  ["rice", "beras", "basmati rice", "jasmine rice", "fragrant rice", "cooked rice"],
  ["vermicelli", "bihun", "rice vermicelli"],
  ["kuey teow", "flat rice noodles", "kway teow"],
  ["yellow noodles", "mee", "mee kuning", "noodles"],
  ["curry leaves", "daun kari"],
  ["pandan", "pandan leaf", "pandan leaves", "daun pandan"],
  ["kaffir lime", "daun limau purut"],
  ["coriander", "ketumbar", "coriander leaves", "coriander seeds", "ground coriander", "daun ketumbar"],
  ["chinese celery", "daun sup", "celery"],
  ["spring onion", "daun bawang", "scallion"],
  ["vietnamese coriander", "daun kesum"],
  ["lime", "calamansi", "limau", "limau kasturi", "limau nipis"],
  ["lemon", "lemon juice"],
  ["cinnamon", "kayu manis", "cinnamon stick"],
  ["star anise", "bunga lawang"],
  ["cardamom", "buah pelaga"],
  ["clove", "cloves", "bunga cengkih"],
  ["cumin", "jintan putih", "cumin seeds", "cumin powder"],
  ["fennel", "jintan manis", "fennel seeds", "fennel powder"],
  ["curry powder", "serbuk kari", "meat curry powder", "chicken curry powder"],
  ["garam masala", "masala spice"],
  ["black pepper", "lada hitam"],
  ["white pepper", "lada putih"],
  ["belacan", "shrimp paste"],
  ["petai", "stink bean"],
  ["capsicum", "bell pepper"],
  ["green peas", "peas", "kacang pis"],
  ["palm sugar", "gula melaka"],
  ["milk", "susu", "condensed milk", "heavy cream", "yogurt"],
  ["ghee", "minyak sapi", "butter", "margarine"],
  ["honey", "madu"],
  ["flour", "wheat flour", "cornflour", "tepung"],
  ["dhal", "lentils", "split lentils", "urad dal", "dal"],
  ["minced meat", "beef", "lamb", "mutton", "kambing", "daging"],
  ["sesame oil", "minyak bijan"],
  ["peanut", "peanuts", "almond", "almonds", "cashew", "cashews"],
];

const STAPLE_PATTERNS = [
  /^(a little |extra |hot |warm |room temperature )?water\b/i,
  /\bwater\s*(,|as needed|for blending|to mix)/i,
  /^salt\b/i,
  /\bpinch of salt\b/i,
  /\bsalt\s*(,|to taste|as needed)/i,
  /\b(cooking )?oil\b/i,
  /^(a little )?sugar\b/i,
  /\bsugar\s*(,|to taste)/i,
  /\bseasoning( powder)?\b/i,
];

const SUBSTITUTION_MAP: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /shallot|bawang merah/i, hint: "Swap with 1/2 red or yellow onion" },
  { pattern: /tamarind|asam/i, hint: "Swap with 1 tbsp lime juice or vinegar" },
  { pattern: /ghee/i, hint: "Swap with 1:1 butter + cooking oil" },
  { pattern: /heavy cream|cooking cream/i, hint: "Swap with coconut milk or evaporated milk" },
  { pattern: /yogurt/i, hint: "Swap with milk + 1 tsp lime juice" },
  { pattern: /kaffir lime/i, hint: "Swap with 1/2 tsp grated lime zest" },
  { pattern: /pandan/i, hint: "Optional aroma, or use 1/2 tsp vanilla" },
  { pattern: /chinese celery|daun sup/i, hint: "Swap with spring onion or coriander" },
  { pattern: /palm sugar|gula melaka/i, hint: "Swap with brown or white sugar" },
  { pattern: /fresh turmeric|kunyit hidup/i, hint: "Swap with 1/2 tsp turmeric powder" },
  { pattern: /belacan|shrimp paste/i, hint: "Optional umami, or 1/2 tsp fish sauce" },
  { pattern: /oyster sauce/i, hint: "Swap with soy sauce + pinch of sugar" },
  { pattern: /sweet soy sauce|kicap/i, hint: "Swap with light soy sauce + 1 tsp brown sugar" },
  { pattern: /coconut milk|santan/i, hint: "Swap with evaporated milk or yogurt" },
  { pattern: /butter|margarine/i, hint: "Swap with neutral cooking oil" },
];

function stripFormatting(raw: string): { sectionTag?: string; cleaned: string } {
  let text = raw.trim();
  let sectionTag: string | undefined;

  const sectionMatch = text.match(/^\*\*(.+?):\*\*\s*(.+)$/);
  if (sectionMatch) {
    sectionTag = sectionMatch[1].trim();
    text = sectionMatch[2].trim();
  }

  // Remove parenthetical notes for cleaner matching while keeping original raw text for display
  const noParens = text.replace(/\([^)]*\)/g, " ").trim();
  // Strip leading quantities & common units
  const stripped = noParens
    .replace(
      /^(\d+([./-]\d+)?(\s*-\s*\d+([./-]\d+)?)?\s*(g|kg|ml|l|tbsp|tsp|cup|cups|clove|cloves|stalk|stalks|sprig|sprigs|inch|inches|cm|slice|slices|piece|pieces|packet|packets|small|medium|large|tin|tins|bowl|bowls|handful|pinch|ladle|litres?|carton)?\b\s*(of\s+)?)/i,
      ""
    )
    .replace(/^(a little|a pinch of|a handful of|the|1\/2 small|1\/2|1\/4|3\/4)\s+/i, "")
    .split(",")[0]
    .replace(/\b(used to|enough to|for frying|for cleaning|for blending|for sautéing|for sauteing|for garnish|for soup|for the gravy|to mix|to coat|to taste).*$/i, "")
    .trim();

  return { sectionTag, cleaned: stripped || noParens || text };
}

function getClusterIndices(text: string): number[] {
  const lower = text.toLowerCase();
  const indices: number[] = [];

  SYNONYM_CLUSTERS.forEach((cluster, idx) => {
    if (
      cluster.some((term) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        return regex.test(lower);
      })
    ) {
      indices.push(idx);
    }
  });

  // Also check MALAYSIAN_INGREDIENTS_DB keywords
  return indices;
}

function doesPantryItemMatchIngredient(pantryItem: PantryItem, ingredientText: string): boolean {
  const ingLower = ingredientText.toLowerCase();
  const pName = pantryItem.name.toLowerCase().trim();
  const pMalay = (pantryItem.nameMalay || "").toLowerCase().trim();

  // Direct substring match (word-boundary safe for short names)
  if (pName.length >= 3 && ingLower.includes(pName)) return true;
  if (pMalay.length >= 3 && ingLower.includes(pMalay)) return true;

  // Check MALAYSIAN_INGREDIENTS_DB entry for this pantry item
  const dbEntry = MALAYSIAN_INGREDIENTS_DB.find(
    (entry) =>
      entry.name.toLowerCase() === pName ||
      entry.nameMalay.toLowerCase() === pMalay ||
      entry.keywords.some((k) => k.toLowerCase() === pName)
  );

  if (dbEntry) {
    if (
      dbEntry.keywords.some((kw) => {
        if (kw.length < 3) return false;
        return ingLower.includes(kw.toLowerCase());
      })
    ) {
      return true;
    }
  }

  // Check shared synonym clusters
  const ingClusters = getClusterIndices(ingLower);
  if (ingClusters.length > 0) {
    const pantryCombined = `${pName} ${pMalay}`;
    const pantryClusters = getClusterIndices(pantryCombined);
    if (pantryClusters.some((c) => ingClusters.includes(c))) {
      return true;
    }
  }

  return false;
}

function isStapleIngredient(raw: string, cleanName: string): boolean {
  const target = raw.replace(/^\*\*[^*]+\*\*\s*/, "").trim();
  if (STAPLE_PATTERNS.some((p) => p.test(target) || p.test(cleanName))) {
    return true;
  }
  const lc = cleanName.toLowerCase();
  return lc === "water" || lc === "salt" || lc === "sugar" || lc === "cooking oil" || lc === "oil";
}

export function getSubstitutionHint(ingredientText: string): string | undefined {
  const found = SUBSTITUTION_MAP.find((item) => item.pattern.test(ingredientText));
  return found?.hint;
}

export function analyzeRecipeIngredients(
  ingredients: string[],
  pantryItems: PantryItem[]
): RecipeMatchAnalysis {
  const analyzed: IngredientAnalysis[] = ingredients.map((raw) => {
    const { sectionTag, cleaned } = stripFormatting(raw);
    const matchedPantryItem = pantryItems.find((p) => doesPantryItemMatchIngredient(p, cleaned));

    if (matchedPantryItem) {
      return {
        raw,
        sectionTag,
        cleanName: cleaned,
        status: "have",
        matchedPantryItem,
      };
    }

    if (isStapleIngredient(raw, cleaned)) {
      return {
        raw,
        sectionTag,
        cleanName: cleaned,
        status: "staple",
      };
    }

    return {
      raw,
      sectionTag,
      cleanName: cleaned,
      status: "missing",
      substitutionHint: getSubstitutionHint(raw),
    };
  });

  const haveItems = analyzed.filter((a) => a.status === "have");
  const missingItems = analyzed.filter((a) => a.status === "missing");
  const totalCoreCount = haveItems.length + missingItems.length;
  const matchedCoreCount = haveItems.length;
  const matchPercentage =
    totalCoreCount === 0
      ? 100
      : Math.round((matchedCoreCount / totalCoreCount) * 100);

  return {
    matchedCoreCount,
    totalCoreCount,
    missingCoreCount: missingItems.length,
    matchPercentage,
    ingredients: analyzed,
    missingItems,
    haveItems,
  };
}
