export type ThemeId = "pandan-hero" | "warm-clay" | "fresh-accents" | "classic-clay";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  subtitle: string;
  swatches: [string, string, string];
}

export const THEME_STORAGE_KEY = "zerowaste_chef_theme_v1";

export const THEME_OPTIONS: ThemeMeta[] = [
  {
    id: "pandan-hero",
    name: "Pandan Hero",
    subtitle: "Warm alabaster clay with deep emerald hero banners & turmeric amber CTAs.",
    swatches: ["#ECEAE2", "#004730", "#F59E0B"],
  },
  {
    id: "warm-clay",
    name: "Warm Kitchen Clay",
    subtitle: "Soft warm stone neumorphism with subtle food category pills.",
    swatches: ["#ECEAE2", "#006948", "#D97706"],
  },
  {
    id: "fresh-accents",
    name: "Vibrant Accents",
    subtitle: "Classic cool clay base enlivened with semantic category & readiness tags.",
    swatches: ["#E0E5EC", "#004730", "#EA580C"],
  },
  {
    id: "classic-clay",
    name: "Classic Clay",
    subtitle: "Original monochrome cool neumorphic palette and dark forest green.",
    swatches: ["#E0E5EC", "#004730", "#3D4852"],
  },
];

export function getSavedTheme(): ThemeId {
  if (typeof window === "undefined") return "pandan-hero";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (
      raw === "pandan-hero" ||
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
