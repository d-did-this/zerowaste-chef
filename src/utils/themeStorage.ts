export type ThemeId =
  | "pandan-hero"
  | "minimalist-clay"
  | "warm-clay"
  | "fresh-accents"
  | "classic-clay";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  subtitle: string;
  swatches: [string, string, string];
}

export interface ThemePalette {
  id: ThemeId;
  isHeroDark: boolean;
  showCategoryLabels: boolean;
  primaryBg: string;
  primaryRingStroke: string;
  regenGradient: string;
  regenShadow: string;
  pantryAddBg: string;
}

export const THEME_STORAGE_KEY = "zerowaste_chef_theme_v1";

export const THEME_OPTIONS: ThemeMeta[] = [
  {
    id: "pandan-hero",
    name: "Pandan Hero",
    subtitle: "Warm alabaster clay with deep emerald hero cards & golden amber CTAs.",
    swatches: ["#ECEAE2", "#004730", "#F59E0B"],
  },
  {
    id: "minimalist-clay",
    name: "Minimalist Clay",
    subtitle: "Cool slate clay cards with forest emerald & terracotta orange CTAs.",
    swatches: ["#E0E5EC", "#006948", "#EA580C"],
  },
  {
    id: "warm-clay",
    name: "Warm Kitchen Clay",
    subtitle: "Warm stone clay palette with emerald progress & turmeric amber CTAs.",
    swatches: ["#ECEAE2", "#006948", "#D97706"],
  },
  {
    id: "fresh-accents",
    name: "Sage Mint Clay",
    subtitle: "Soft sage-mint clay palette with deep teal & crisp ocean blue CTAs.",
    swatches: ["#E6EFEA", "#0F766E", "#0284C7"],
  },
  {
    id: "classic-clay",
    name: "OG Clay",
    subtitle: "Same design and colors as Minimalist Clay without produce labels.",
    swatches: ["#E0E5EC", "#006948", "#EA580C"],
  },
];

const SHARED_ORANGE_REGEN = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)";
const SHARED_ORANGE_SHADOW =
  "6px 6px 14px rgba(234, 88, 12, 0.36), -4px -4px 10px rgba(255, 255, 255, 0.78), inset 1px 1px 1px rgba(255, 255, 255, 0.28)";

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  "pandan-hero": {
    id: "pandan-hero",
    isHeroDark: true,
    showCategoryLabels: true,
    primaryBg: "#004730",
    primaryRingStroke: "#FBBF24",
    regenGradient: "linear-gradient(135deg, #006948 0%, #004730 100%)",
    regenShadow:
      "6px 6px 14px rgba(0, 71, 48, 0.34), -4px -4px 10px rgba(255, 255, 255, 0.78), inset 1px 1px 1px rgba(255, 255, 255, 0.25)",
    pantryAddBg: "#006948",
  },
  "minimalist-clay": {
    id: "minimalist-clay",
    isHeroDark: false,
    showCategoryLabels: true,
    primaryBg: "#004730",
    primaryRingStroke: "#006948",
    regenGradient: SHARED_ORANGE_REGEN,
    regenShadow: SHARED_ORANGE_SHADOW,
    pantryAddBg: "#D97706",
  },
  "warm-clay": {
    id: "warm-clay",
    isHeroDark: false,
    showCategoryLabels: true,
    primaryBg: "#006948",
    primaryRingStroke: "#006948",
    regenGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    regenShadow:
      "6px 6px 14px rgba(217, 119, 6, 0.34), -4px -4px 10px rgba(255, 255, 255, 0.8), inset 1px 1px 1px rgba(255, 255, 255, 0.28)",
    pantryAddBg: "#D97706",
  },
  "fresh-accents": {
    id: "fresh-accents",
    isHeroDark: false,
    showCategoryLabels: true,
    primaryBg: "#0F766E",
    primaryRingStroke: "#0284C7",
    regenGradient: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
    regenShadow:
      "6px 6px 14px rgba(2, 132, 199, 0.32), -4px -4px 10px rgba(255, 255, 255, 0.8), inset 1px 1px 1px rgba(255, 255, 255, 0.28)",
    pantryAddBg: "#0284C7",
  },
  "classic-clay": {
    id: "classic-clay",
    isHeroDark: false,
    showCategoryLabels: false,
    primaryBg: "#004730",
    primaryRingStroke: "#006948",
    regenGradient: SHARED_ORANGE_REGEN,
    regenShadow: SHARED_ORANGE_SHADOW,
    pantryAddBg: "#D97706",
  },
};

export function getThemePalette(theme: ThemeId): ThemePalette {
  return THEME_PALETTES[theme] ?? THEME_PALETTES["minimalist-clay"];
}

export function getSavedTheme(): ThemeId {
  if (typeof window === "undefined") return "pandan-hero";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (
      raw === "pandan-hero" ||
      raw === "minimalist-clay" ||
      raw === "warm-clay" ||
      raw === "fresh-accents" ||
      raw === "classic-clay"
    ) {
      return raw;
    }
  } catch {
    // ignore storage access issues
  }
  return "pandan-hero";
}

export function saveTheme(theme: ThemeId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage access issues
  }
}
