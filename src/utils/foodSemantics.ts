export interface CategoryVisual {
  label: string;
  dotColor: string;
  pillBg: string;
  pillText: string;
  barColor: string;
}

export function getPantryCategoryVisual(category?: string): CategoryVisual {
  const cat = (category || "").toLowerCase();

  if (cat.includes("produce") || cat.includes("veg") || cat.includes("fruit")) {
    return {
      label: "Produce",
      dotColor: "#16A34A",
      pillBg: "#DCFCE7",
      pillText: "#15803D",
      barColor: "#10B981",
    };
  }
  if (cat.includes("dairy") || cat.includes("egg")) {
    return {
      label: "Dairy & Eggs",
      dotColor: "#D97706",
      pillBg: "#FEF3C7",
      pillText: "#B45309",
      barColor: "#F59E0B",
    };
  }
  if (cat.includes("protein") || cat.includes("meat") || cat.includes("seafood") || cat.includes("chicken")) {
    return {
      label: "Proteins",
      dotColor: "#EA580C",
      pillBg: "#FFEDD5",
      pillText: "#C2410C",
      barColor: "#EA580C",
    };
  }
  if (cat.includes("seasoning") || cat.includes("sauce") || cat.includes("condiment") || cat.includes("spice")) {
    return {
      label: "Seasoning",
      dotColor: "#DC2626",
      pillBg: "#FEE2E2",
      pillText: "#B91C1C",
      barColor: "#EF4444",
    };
  }
  return {
    label: category || "Staples",
    dotColor: "#CA8A04",
    pillBg: "#FEF9C3",
    pillText: "#A16207",
    barColor: "#EAB308",
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

export function inferGroceryCategoryVisual(name: string): { label: string; bg: string; text: string } {
  const n = name.toLowerCase();
  if (/celery|coriander|parsley|mint|pandan|lemongrass|serai|daun|scallion|spring onion|herb|basil/.test(n)) {
    return { label: "Herb", bg: "#DCFCE7", text: "#15803D" };
  }
  if (/chilli|chili|onion|garlic|shallot|ginger|tomato|spinach|cabbage|carrot|potato|corn|veg|lime|lemon/.test(n)) {
    return { label: "Produce", bg: "#FEE2E2", text: "#B91C1C" };
  }
  if (/chicken|beef|fish|prawn|shrimp|squid|meat|mutton|tofu|tempeh/.test(n)) {
    return { label: "Protein", bg: "#FFEDD5", text: "#C2410C" };
  }
  if (/egg|milk|butter|cheese|yogurt|cream|santan|coconut milk/.test(n)) {
    return { label: "Dairy", bg: "#FEF3C7", text: "#B45309" };
  }
  return { label: "Pantry", bg: "#FEF9C3", text: "#A16207" };
}
