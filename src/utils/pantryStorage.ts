export interface PantryItem {
  id: string;
  name: string;
  nameMalay: string;
  emoji: string;
  category: string;
  quantity: number;
  unit: string;
  dateAdded: string;
  confidence?: number;
  engineUsed?: string;
  culinaryNote?: string;
}

const STORAGE_KEY = "zerowaste_chef_pantry_items_v1";
const SETTINGS_KEY = "zerowaste_chef_settings_v1";

export interface AppSettings {
  apiKey: string;
  preferredEngine: "auto" | "cloud" | "edge";
}

export function getPantryItems(): PantryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading pantry items:", e);
    return [];
  }
}

export function savePantryItem(
  item: Omit<PantryItem, "id" | "dateAdded">
): PantryItem {
  const current = getPantryItems();

  // If item already exists with same name, increment quantity
  const existingIdx = current.findIndex(
    (p) => p.name.toLowerCase() === item.name.toLowerCase() && p.unit === item.unit
  );

  let updatedList: PantryItem[];
  let savedRecord: PantryItem;

  if (existingIdx >= 0) {
    current[existingIdx].quantity = Number(current[existingIdx].quantity) + Number(item.quantity);
    savedRecord = current[existingIdx];
    updatedList = [...current];
  } else {
    savedRecord = {
      ...item,
      id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      dateAdded: new Date().toISOString(),
    };
    updatedList = [savedRecord, ...current];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  }
  return savedRecord;
}

export function deletePantryItem(id: string): void {
  if (typeof window === "undefined") return;
  const current = getPantryItems();
  const filtered = current.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearPantry(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { apiKey: "", preferredEngine: "auto" };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { apiKey: "", preferredEngine: "auto" };
  } catch {
    return { apiKey: "", preferredEngine: "auto" };
  }
}

export function saveAppSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }
  return updated;
}
