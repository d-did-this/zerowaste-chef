export interface CategoryVisual {
  label: string;
  icon: string;
  dotColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  barColor: string;
}

export function getPantryCategoryVisual(category?: string): CategoryVisual {
  const cat = (category || "").toLowerCase();

  if (/herb|celer|coriander|pandan|lemongrass/.test(cat)) {
    return {
      label: "Herbs",
      icon: "spa",
      dotColor: "#0F766E",
      pillBg: "#CCFBF1",
      pillText: "#0F766E",
      pillBorder: "#99F6E4",
      barColor: "#14B8A6",
    };
  }
  if (cat.includes("produce") || cat.includes("veg") || cat.includes("fruit")) {
    return {
      label: "Produce",
      icon: "eco",
      dotColor: "#047857",
      pillBg: "#DCFCE7",
      pillText: "#047857",
      pillBorder: "#A7F3D0",
      barColor: "#10B981",
    };
  }
  if (cat.includes("dairy") || cat.includes("egg")) {
    return {
      label: "Dairy & Eggs",
      icon: "egg",
      dotColor: "#B45309",
      pillBg: "#FEF3C7",
      pillText: "#B45309",
      pillBorder: "#FDE68A",
      barColor: "#F59E0B",
    };
  }
  if (cat.includes("protein") || cat.includes("meat") || cat.includes("seafood") || cat.includes("chicken")) {
    return {
      label: "Proteins",
      icon: "set_meal",
      dotColor: "#BE123C",
      pillBg: "#FFE4E6",
      pillText: "#BE123C",
      pillBorder: "#FECDD3",
      barColor: "#E11D48",
    };
  }
  if (cat.includes("seasoning") || cat.includes("sauce") || cat.includes("condiment") || cat.includes("spice")) {
    return {
      label: "Seasoning",
      icon: "local_fire_department",
      dotColor: "#C2410C",
      pillBg: "#FFEDD5",
      pillText: "#C2410C",
      pillBorder: "#FED7AA",
      barColor: "#EA580C",
    };
  }
  return {
    label: category || "Staples",
    icon: "inventory_2",
    dotColor: "#3730A3",
    pillBg: "#E0E7FF",
    pillText: "#3730A3",
    pillBorder: "#C7D2FE",
    barColor: "#4F46E5",
  };
}

export function getCuisinePillColors(cuisine: string): { bg: string; text: string } {
  switch (cuisine) {
    case "malay":
      return { bg: "#006948", text: "#FFFFFF" };
    case "indian":
      return { bg: "#C2410C", text: "#FFFFFF" };
    case "chinese":
      return { bg: "#B91C1C", text: "#FFFFFF" };
    case "sabah-sarawak":
      return { bg: "#B45309", text: "#FFFFFF" };
    default:
      return { bg: "#334155", text: "#FFFFFF" };
  }
}

export function getReadinessBadgeColors(pct: number): { bg: string; text: string } {
  if (pct >= 70) {
    return { bg: "#DCFCE7", text: "#15803D" };
  }
  if (pct >= 40) {
    return { bg: "#FEF3C7", text: "#B45309" };
  }
  return { bg: "#FFEDD5", text: "#C2410C" };
}

export function inferGroceryCategoryVisual(name: string): {
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
} {
  const n = name.toLowerCase();
  if (/celery|coriander|parsley|mint|pandan|lemongrass|serai|daun|scallion|spring onion|herb|basil/.test(n)) {
    return { label: "Herb", icon: "spa", bg: "#CCFBF1", text: "#0F766E", border: "#99F6E4" };
  }
  if (/chilli|chili|onion|garlic|shallot|ginger|tomato|spinach|cabbage|carrot|potato|corn|veg|lime|lemon|apple|banana|cucumber/.test(n)) {
    return { label: "Produce", icon: "eco", bg: "#DCFCE7", text: "#047857", border: "#A7F3D0" };
  }
  if (/chicken|beef|fish|prawn|shrimp|squid|meat|mutton|tofu|tempeh/.test(n)) {
    return { label: "Protein", icon: "set_meal", bg: "#FFE4E6", text: "#BE123C", border: "#FECDD3" };
  }
  if (/egg|milk|butter|cheese|yogurt|cream|santan|coconut milk/.test(n)) {
    return { label: "Dairy & Eggs", icon: "egg", bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" };
  }
  if (/sauce|kicap|paste|spice|pepper|salt|sugar|oil|vinegar|seasoning|curry/.test(n)) {
    return {
      label: "Seasoning",
      icon: "local_fire_department",
      bg: "#FFEDD5",
      text: "#C2410C",
      border: "#FED7AA",
    };
  }
  return { label: "Pantry", icon: "inventory_2", bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" };
}
