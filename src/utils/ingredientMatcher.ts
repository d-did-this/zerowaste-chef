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

// Pre-compile synonym regexes ONCE at module load (instead of inside hot matching loops)
const COMPILED_SYNONYM_CLUSTERS: RegExp[][] = SYNONYM_CLUSTERS.map((cluster) =>
  cluster.map((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i");
  })
);

// Pre-index MALAYSIAN_INGREDIENTS_DB by lowercase name, Malay name, and exact keywords ONCE
const MALAYSIAN_DB_INDEX = (() => {
  const map = new Map<string, string[]>();
  for (const entry of MALAYSIAN_INGREDIENTS_DB) {
    const kws = entry.keywords
      .map((k) => k.toLowerCase().trim())
      .filter((k) => k.length >= 3);
    if (kws.length === 0) continue;
    map.set(entry.name.toLowerCase().trim(), kws);
    if (entry.nameMalay) {
      map.set(entry.nameMalay.toLowerCase().trim(), kws);
    }
    for (const k of kws) {
      if (!map.has(k)) map.set(k, kws);
    }
  }
  return map;
})();

const STRIP_FORMATTING_CACHE = new Map<string, { sectionTag?: string; cleaned: string }>();
const STAPLE_CACHE = new Map<string, boolean>();
const TEXT_CLUSTERS_CACHE = new Map<string, number[]>();

function stripFormatting(raw: string): { sectionTag?: string; cleaned: string } {
  const cached = STRIP_FORMATTING_CACHE.get(raw);
  if (cached) return cached;

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

  const res = { sectionTag, cleaned: stripped || noParens || text };
  if (STRIP_FORMATTING_CACHE.size < 4000) {
    STRIP_FORMATTING_CACHE.set(raw, res);
  }
  return res;
}

function getClusterIndices(text: string): number[] {
  const lower = text.toLowerCase();
  const cached = TEXT_CLUSTERS_CACHE.get(lower);
  if (cached) return cached;

  const indices: number[] = [];
  for (let idx = 0; idx < COMPILED_SYNONYM_CLUSTERS.length; idx++) {
    const regexes = COMPILED_SYNONYM_CLUSTERS[idx];
    for (let j = 0; j < regexes.length; j++) {
      if (regexes[j].test(lower)) {
        indices.push(idx);
        break;
      }
    }
  }

  if (TEXT_CLUSTERS_CACHE.size < 4000) {
    TEXT_CLUSTERS_CACHE.set(lower, indices);
  }
  return indices;
}

interface PreparedPantryEntry {
  item: PantryItem;
  pName: string;
  pMalay: string;
  dbKeywords: string[] | undefined;
  clusterSet: Set<number>;
}

function preparePantryEntries(pantryItems: PantryItem[]): PreparedPantryEntry[] {
  return pantryItems.map((item) => {
    const pName = item.name.toLowerCase().trim();
    const pMalay = (item.nameMalay || "").toLowerCase().trim();
    const dbKeywords =
      MALAYSIAN_DB_INDEX.get(pName) ||
      (pMalay ? MALAYSIAN_DB_INDEX.get(pMalay) : undefined);
    const combined = pMalay ? `${pName} ${pMalay}` : pName;
    const clusterSet = new Set<number>(getClusterIndices(combined));
    return { item, pName, pMalay, dbKeywords, clusterSet };
  });
}

function doesPreparedPantryMatch(entry: PreparedPantryEntry, ingLower: string, ingClusters: number[]): boolean {
  if (entry.pName.length >= 3 && ingLower.includes(entry.pName)) return true;
  if (entry.pMalay.length >= 3 && ingLower.includes(entry.pMalay)) return true;

  if (entry.dbKeywords) {
    for (let i = 0; i < entry.dbKeywords.length; i++) {
      if (ingLower.includes(entry.dbKeywords[i])) return true;
    }
  }

  if (entry.clusterSet.size > 0 && ingClusters.length > 0) {
    for (let i = 0; i < ingClusters.length; i++) {
      if (entry.clusterSet.has(ingClusters[i])) return true;
    }
  }

  return false;
}

function isStapleIngredient(raw: string, cleanName: string): boolean {
  const cached = STAPLE_CACHE.get(raw);
  if (cached !== undefined) return cached;

  const target = raw.replace(/^\*\*[^*]+\*\*\s*/, "").trim();
  const lc = cleanName.toLowerCase();
  const isStaple =
    lc === "water" ||
    lc === "salt" ||
    lc === "sugar" ||
    lc === "cooking oil" ||
    lc === "oil" ||
    STAPLE_PATTERNS.some((p) => p.test(target) || p.test(cleanName));

  if (STAPLE_CACHE.size < 4000) {
    STAPLE_CACHE.set(raw, isStaple);
  }
  return isStaple;
}

export function getSubstitutionHint(ingredientText: string): string | undefined {
  const found = SUBSTITUTION_MAP.find((item) => item.pattern.test(ingredientText));
  return found?.hint;
}

export function analyzeRecipeIngredients(
  ingredients: string[],
  pantryItems: PantryItem[],
  preparedEntries?: PreparedPantryEntry[]
): RecipeMatchAnalysis {
  const entries = preparedEntries ?? preparePantryEntries(pantryItems);
  const hasPantry = entries.length > 0;

  const analyzed: IngredientAnalysis[] = ingredients.map((raw) => {
    const { sectionTag, cleaned } = stripFormatting(raw);

    if (hasPantry) {
      const ingLower = cleaned.toLowerCase();
      const ingClusters = getClusterIndices(ingLower);
      for (let i = 0; i < entries.length; i++) {
        if (doesPreparedPantryMatch(entries[i], ingLower, ingClusters)) {
          return {
            raw,
            sectionTag,
            cleanName: cleaned,
            status: "have",
            matchedPantryItem: entries[i].item,
          };
        }
      }
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

export { preparePantryEntries };
