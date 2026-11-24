import { savePantryItem } from "@/utils/pantryStorage";

export interface GroceryItem {
  id: string;
  name: string;
  rawLine: string;
  recipeName: string;
  quantity: number;
  unit: string;
  recipeAmountLabel?: string;
  checked: boolean;
  addedAt: string;
}

const GROCERY_STORAGE_KEY = "zerowaste_chef_grocery_v1";

export const GROCERY_UNITS = [
  "pcs",
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "cloves",
  "stalks",
  "sprigs",
  "inch",
  "bunch",
  "pack",
  "bottle",
] as const;

function toTitleCase(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word.toLowerCase() === "and") return "&";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function parseFractionOrNumber(token: string): number | null {
  const cleaned = token.trim();
  const mixed = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    return den > 0 ? whole + num / den : whole;
  }
  const frac = cleaned.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    return den > 0 ? num / den : 1;
  }
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function normalizeUnit(rawUnit: string | undefined): string {
  if (!rawUnit) return "pcs";
  const u = rawUnit.toLowerCase().trim();
  const map: Record<string, string> = {
    g: "g",
    gram: "g",
    grams: "g",
    kg: "kg",
    ml: "ml",
    l: "l",
    litre: "l",
    litres: "l",
    cup: "cup",
    cups: "cup",
    tbsp: "tbsp",
    tsp: "tsp",
    clove: "cloves",
    cloves: "cloves",
    stalk: "stalks",
    stalks: "stalks",
    sprig: "sprigs",
    sprigs: "sprigs",
    inch: "inch",
    inches: "inch",
    cm: "cm",
    slice: "slices",
    slices: "slices",
    piece: "pcs",
    pieces: "pcs",
    packet: "pack",
    packets: "pack",
    pack: "pack",
    tin: "tin",
    tins: "tin",
    bowl: "bowl",
    bowls: "bowl",
    carton: "pack",
    bottle: "bottle",
    bottles: "bottle",
    bunch: "bunch",
    bunches: "bunch",
    handful: "bunch",
    pinch: "pack",
    ladle: "tbsp",
  };
  return map[u] || u;
}

export function parseRecipeIngredientAmount(
  raw: string,
  cleanName: string
): { quantity: number; unit: string; recipeAmountLabel: string } {
  const text = raw.replace(/^\*\*[^*]+\*\*\s*/, "").trim();

  // Case 1: Mixed kg/g range like "800g-1kg squid"
  const kgRange = text.match(/^(\d+(?:\.\d+)?)\s*g\s*-\s*(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgRange) {
    return {
      quantity: Number(kgRange[2]),
      unit: "kg",
      recipeAmountLabel: `${kgRange[1]}g-${kgRange[2]}kg`,
    };
  }

  // Case 2: Standard leading numeric / fraction / range + optional unit
  const leadMatch = text.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(?:\s*-\s*(\d+\/\d+|\d+(?:\.\d+)?))?\s*(g|grams?|kg|ml|litres?|l|tbsp|tsp|cups?|cloves?|stalks?|sprigs?|inch(?:es)?|cm|slices?|pieces?|packets?|pack|tins?|bowls?|carton|bunch(?:es)?|bottles?|ladle|pinch|handful)?\b/i
  );

  if (leadMatch) {
    const firstVal = parseFractionOrNumber(leadMatch[1]) ?? 1;
    const secondVal = leadMatch[2] ? parseFractionOrNumber(leadMatch[2]) : null;
    const pickedQty = secondVal ?? firstVal;
    const unit = normalizeUnit(leadMatch[3]);
    const rawQtyDisplay = leadMatch[2] ? `${leadMatch[1]}-${leadMatch[2]}` : leadMatch[1];
    const label = `${rawQtyDisplay} ${unit}`.trim();
    return {
      quantity: Math.round(pickedQty * 100) / 100,
      unit,
      recipeAmountLabel: label,
    };
  }

  // Case 3: Parenthetical count like "(about 6)" or "(6-8 pcs)"
  const parenMatch = text.match(/\((?:about\s+)?(\d+(?:\.\d+)?)\)/i);
  if (parenMatch) {
    const count = Number(parenMatch[1]) || 1;
    return {
      quantity: count,
      unit: "pcs",
      recipeAmountLabel: `~${count} pcs`,
    };
  }

  // Case 4: Qualitative descriptions ("A little...", "To taste...")
  const lower = text.toLowerCase();
  if (/chinese celery|spring onion|coriander|pandan|curry leaves/i.test(cleanName)) {
    return { quantity: 1, unit: "bunch", recipeAmountLabel: "1 bunch (as needed)" };
  }
  if (/pepper|spice|powder|sauce|kicap|tamarind|paste/i.test(cleanName)) {
    return {
      quantity: 1,
      unit: /sauce|kicap/i.test(cleanName) ? "bottle" : "pack",
      recipeAmountLabel: lower.includes("to taste") ? "To taste" : "1 pack",
    };
  }

  return {
    quantity: 1,
    unit: "pcs",
    recipeAmountLabel: lower.includes("a little") ? "A little" : "1 pcs",
  };
}

export function getGroceryStepSize(unit: string, currentQty: number): number {
  const u = unit.toLowerCase();
  if (u === "g" || u === "ml") return 50;
  if (u === "kg" || u === "l" || u === "cup") return 0.25;
  if (u === "inch" || u === "tbsp" || u === "tsp") {
    return currentQty < 1 || currentQty % 1 !== 0 ? 0.25 : 1;
  }
  return 1;
}

export function formatGroceryQty(qty: number): string {
  const rounded = Math.round(qty * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function hydrateGroceryItem(rawItem: Partial<GroceryItem>): GroceryItem {
  const fallbackName = rawItem.name ? toTitleCase(rawItem.name) : "Grocery Item";
  let quantity = typeof rawItem.quantity === "number" && rawItem.quantity > 0 ? rawItem.quantity : 0;
  let unit = rawItem.unit || "";
  let recipeAmountLabel = rawItem.recipeAmountLabel;

  if ((!quantity || !unit) && rawItem.rawLine) {
    const parsed = parseRecipeIngredientAmount(rawItem.rawLine, fallbackName);
    quantity = quantity || parsed.quantity;
    unit = unit || parsed.unit;
    recipeAmountLabel = recipeAmountLabel || parsed.recipeAmountLabel;
  }

  return {
    id: rawItem.id || `groc_${Date.now()}`,
    name: fallbackName,
    rawLine: rawItem.rawLine || fallbackName,
    recipeName: rawItem.recipeName || "Custom Item",
    quantity: quantity || 1,
    unit: unit || "pcs",
    recipeAmountLabel,
    checked: Boolean(rawItem.checked),
    addedAt: rawItem.addedAt || new Date().toISOString(),
  };
}

export function getGroceryList(): GroceryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GROCERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => hydrateGroceryItem(item));
  } catch (e) {
    console.error("Error reading grocery list:", e);
    return [];
  }
}

function persistGroceryList(updated: GroceryItem[]): GroceryItem[] {
  if (typeof window !== "undefined") {
    localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function addMissingToGrocery(
  recipeName: string,
  items: Array<{ cleanName: string; raw: string }>
): { addedCount: number; totalCount: number } {
  const current = getGroceryList();
  let addedCount = 0;

  const updated = [...current];
  for (const item of items) {
    const cleanTitle = toTitleCase(item.cleanName);
    const parsed = parseRecipeIngredientAmount(item.raw, item.cleanName);

    const existingIdx = updated.findIndex(
      (g) => g.name.toLowerCase() === cleanTitle.toLowerCase() && !g.checked
    );

    if (existingIdx >= 0) {
      // Merge same unit quantities if another recipe also needs this ingredient
      if (updated[existingIdx].unit === parsed.unit) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: Math.round((updated[existingIdx].quantity + parsed.quantity) * 100) / 100,
        };
      }
      continue;
    }

    updated.unshift({
      id: `groc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanTitle,
      rawLine: item.raw,
      recipeName,
      quantity: parsed.quantity,
      unit: parsed.unit,
      recipeAmountLabel: parsed.recipeAmountLabel,
      checked: false,
      addedAt: new Date().toISOString(),
    });
    addedCount++;
  }

  persistGroceryList(updated);
  return { addedCount, totalCount: updated.length };
}

export function addCustomGroceryItem(input: {
  name: string;
  quantity: number;
  unit: string;
  recipeName?: string;
}): GroceryItem[] {
  const current = getGroceryList();
  const titleName = toTitleCase(input.name);
  const newItem: GroceryItem = {
    id: `groc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: titleName,
    rawLine: `${formatGroceryQty(input.quantity)} ${input.unit} ${titleName}`.trim(),
    recipeName: input.recipeName?.trim() || "Personal List",
    quantity: Math.max(0.25, Math.round(input.quantity * 100) / 100),
    unit: input.unit || "pcs",
    checked: false,
    addedAt: new Date().toISOString(),
  };

  return persistGroceryList([newItem, ...current]);
}

export function updateGroceryItem(
  id: string,
  updates: Partial<Pick<GroceryItem, "name" | "quantity" | "unit" | "recipeName">>
): GroceryItem[] {
  const current = getGroceryList();
  const updated = current.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      name: updates.name !== undefined ? toTitleCase(updates.name) || item.name : item.name,
      quantity:
        updates.quantity !== undefined
          ? Math.max(0.25, Math.round(updates.quantity * 100) / 100)
          : item.quantity,
      unit: updates.unit !== undefined ? updates.unit : item.unit,
      recipeName: updates.recipeName !== undefined ? updates.recipeName : item.recipeName,
    };
  });
  return persistGroceryList(updated);
}

export function toggleGroceryItem(id: string): GroceryItem[] {
  const current = getGroceryList();
  const updated = current.map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  return persistGroceryList(updated);
}

export function removeGroceryItem(id: string): GroceryItem[] {
  const current = getGroceryList();
  return persistGroceryList(current.filter((item) => item.id !== id));
}

export function clearCheckedGroceryItems(): GroceryItem[] {
  const current = getGroceryList();
  return persistGroceryList(current.filter((item) => !item.checked));
}

export function clearAllGroceryItems(): GroceryItem[] {
  return persistGroceryList([]);
}

export function restockGroceryItemToPantry(item: GroceryItem): GroceryItem[] {
  savePantryItem({
    name: item.name,
    nameMalay: item.name,
    emoji: "🛒",
    category: "produce",
    quantity: item.quantity || 1,
    unit: item.unit || "pcs",
    engineUsed: "Smart Restock",
    culinaryNote: `Restocked from Grocery List (${formatGroceryQty(item.quantity)} ${item.unit} for ${item.recipeName}).`,
  });
  return removeGroceryItem(item.id);
}
