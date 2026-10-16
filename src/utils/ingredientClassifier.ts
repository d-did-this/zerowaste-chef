export interface IngredientInfo {
  id: string;
  name: string;
  emoji: string;
  category: "Fruit" | "Vegetable" | "Protein" | "Dairy" | "Grain" | "Pantry";
  keywords: string[];
}

export interface IngredientDetection {
  ingredient: IngredientInfo;
  confidence: number; // 0 to 100
  rawLabel: string;
  rawProbability: number;
}

// Target Scope: At least 10 common kitchen ingredients + extended everyday kitchen staples
export const TARGET_INGREDIENTS: IngredientInfo[] = [
  {
    id: "apple",
    name: "Apple",
    emoji: "🍎",
    category: "Fruit",
    keywords: ["apple", "granny smith", "delicious", "pome", "cider"],
  },
  {
    id: "banana",
    name: "Banana",
    emoji: "🍌",
    category: "Fruit",
    keywords: ["banana", "plantain"],
  },
  {
    id: "broccoli",
    name: "Broccoli",
    emoji: "🥦",
    category: "Vegetable",
    keywords: ["broccoli", "cauliflower", "brassica"],
  },
  {
    id: "carrot",
    name: "Carrot",
    emoji: "🥕",
    category: "Vegetable",
    keywords: ["carrot", "turnip", "parsnip", "root"],
  },
  {
    id: "egg",
    name: "Egg",
    emoji: "🥚",
    category: "Protein",
    keywords: ["egg", "boiled egg", "eggcup", "yolk", "albumin"],
  },
  {
    id: "lemon",
    name: "Lemon",
    emoji: "🍋",
    category: "Fruit",
    keywords: ["lemon", "lime", "citron", "citrus"],
  },
  {
    id: "onion",
    name: "Onion",
    emoji: "🧅",
    category: "Vegetable",
    keywords: ["onion", "shallot", "scallion", "allium", "bulb"],
  },
  {
    id: "potato",
    name: "Potato",
    emoji: "🥔",
    category: "Vegetable",
    keywords: ["potato", "spud", "tuber", "mashed potato"],
  },
  {
    id: "tomato",
    name: "Tomato",
    emoji: "🍅",
    category: "Vegetable",
    keywords: ["tomato", "cherry tomato", "plum tomato"],
  },
  {
    id: "garlic",
    name: "Garlic",
    emoji: "🧄",
    category: "Pantry",
    keywords: ["garlic", "clove", "garlic clove", "allium sativum"],
  },
  {
    id: "bell_pepper",
    name: "Bell Pepper",
    emoji: "🫑",
    category: "Vegetable",
    keywords: ["bell pepper", "capsicum", "sweet pepper", "paprika", "chili"],
  },
  {
    id: "mushroom",
    name: "Mushroom",
    emoji: "🍄",
    category: "Vegetable",
    keywords: ["mushroom", "agaric", "bolete", "chanterelle", "fungus"],
  },
  {
    id: "cucumber",
    name: "Cucumber",
    emoji: "🥒",
    category: "Vegetable",
    keywords: ["cucumber", "cuke", "pickle", "gherkin"],
  },
  {
    id: "orange",
    name: "Orange",
    emoji: "🍊",
    category: "Fruit",
    keywords: ["orange", "clementine", "tangerine", "mandarin"],
  },
  {
    id: "strawberry",
    name: "Strawberry",
    emoji: "🍓",
    category: "Fruit",
    keywords: ["strawberry", "berry"],
  },
  {
    id: "cabbage",
    name: "Cabbage",
    emoji: "🥬",
    category: "Vegetable",
    keywords: ["cabbage", "head cabbage", "lettuce", "kale", "bok choy"],
  },
  {
    id: "avocado",
    name: "Avocado",
    emoji: "🥑",
    category: "Fruit",
    keywords: ["avocado", "alligator pear", "guacamole"],
  },
  {
    id: "corn",
    name: "Corn",
    emoji: "🌽",
    category: "Grain",
    keywords: ["corn", "ear", "maize", "sweetcorn"],
  },
];

export interface RawPrediction {
  className: string;
  probability: number;
}

/**
 * Matches MobileNet raw classifications to defined kitchen ingredients
 */
export function matchIngredient(predictions: RawPrediction[]): IngredientDetection | null {
  if (!predictions || predictions.length === 0) return null;

  for (const pred of predictions) {
    if (pred.probability < 0.20) continue; // Ignore low confidence noise
    const rawClassLower = pred.className.toLowerCase();
    const classWords = rawClassLower.split(/,\s*|\s+/);

    for (const ingredient of TARGET_INGREDIENTS) {
      for (const kw of ingredient.keywords) {
        const kwLower = kw.toLowerCase();
        // Exact match or substring match in class name
        if (
          rawClassLower.includes(kwLower) ||
          classWords.some((w) => w === kwLower)
        ) {
          return {
            ingredient,
            confidence: Math.round(pred.probability * 100),
            rawLabel: pred.className,
            rawProbability: pred.probability,
          };
        }
      }
    }
  }

  // Fallback: If it's a food-related item from ImageNet not in the explicit list
  const topPred = predictions[0];
  if (topPred && topPred.probability >= 0.15) {
    const foodTerms = [
      "fruit", "vegetable", "berry", "melon", "squash", "bread",
      "cheese", "meat", "pastry", "pie", "soup", "plate", "dish", "citrus"
    ];
    const topLower = topPred.className.toLowerCase();
    const isFoodLike = foodTerms.some((term) => topLower.includes(term));

    if (isFoodLike) {
      const cleanName = topPred.className.split(",")[0].trim();
      return {
        ingredient: {
          id: cleanName.toLowerCase().replace(/\s+/g, "_"),
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          emoji: "🥗",
          category: "Pantry",
          keywords: [cleanName],
        },
        confidence: Math.round(topPred.probability * 100),
        rawLabel: topPred.className,
        rawProbability: topPred.probability,
      };
    }
  }

  return null;
}
