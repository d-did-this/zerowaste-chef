export interface IngredientInfo {
  id: string;
  name: string;
  nameMalay?: string;
  emoji: string;
  category: "Fruit" | "Vegetable" | "Protein" | "Dairy" | "Grain" | "Pantry";
  keywords: string[];
  defaultUnit?: string;
  imageNetClass?: string;
}

export interface IngredientDetection {
  ingredient: IngredientInfo;
  confidence: number; // 0 to 100
  rawLabel: string;
  rawProbability: number;
}

export interface RawPrediction {
  className: string;
  probability: number;
}

/**
 * UTeM Workshop 2 Objective (b):
 * Predefined Dataset of at least 10 common kitchen ingredients
 * natively recognized by TensorFlow.js MobileNet (ImageNet 1,000 classes).
 */
export const PREDEFINED_CNN_INGREDIENTS: IngredientInfo[] = [
  {
    id: "apple",
    name: "Apple",
    nameMalay: "Epal",
    emoji: "🍎",
    category: "Fruit",
    keywords: ["apple", "granny smith"],
    defaultUnit: "biji",
    imageNetClass: "Granny Smith",
  },
  {
    id: "banana",
    name: "Banana",
    nameMalay: "Pisang",
    emoji: "🍌",
    category: "Fruit",
    keywords: ["banana"],
    defaultUnit: "sikat",
    imageNetClass: "banana",
  },
  {
    id: "broccoli",
    name: "Broccoli",
    nameMalay: "Brokoli",
    emoji: "🥦",
    category: "Vegetable",
    keywords: ["broccoli"],
    defaultUnit: "biji",
    imageNetClass: "broccoli",
  },
  {
    id: "cabbage",
    name: "Cabbage",
    nameMalay: "Kubis",
    emoji: "🥬",
    category: "Vegetable",
    keywords: ["cabbage", "head cabbage"],
    defaultUnit: "biji",
    imageNetClass: "head cabbage",
  },
  {
    id: "bell_pepper",
    name: "Bell Pepper",
    nameMalay: "Lada Benggala",
    emoji: "🫑",
    category: "Vegetable",
    keywords: ["bell pepper", "capsicum"],
    defaultUnit: "biji",
    imageNetClass: "bell pepper",
  },
  {
    id: "cucumber",
    name: "Cucumber",
    nameMalay: "Timun",
    emoji: "🥒",
    category: "Vegetable",
    keywords: ["cucumber", "cuke"],
    defaultUnit: "batang",
    imageNetClass: "cucumber, cuke",
  },
  {
    id: "orange",
    name: "Orange",
    nameMalay: "Oren",
    emoji: "🍊",
    category: "Fruit",
    keywords: ["orange"],
    defaultUnit: "biji",
    imageNetClass: "orange",
  },
  {
    id: "lemon",
    name: "Lemon",
    nameMalay: "Lemon",
    emoji: "🍋",
    category: "Fruit",
    keywords: ["lemon", "citron"],
    defaultUnit: "biji",
    imageNetClass: "lemon",
  },
  {
    id: "mushroom",
    name: "Mushroom",
    nameMalay: "Cendawan",
    emoji: "🍄",
    category: "Vegetable",
    keywords: ["mushroom", "agaric", "bolete"],
    defaultUnit: "bungkus",
    imageNetClass: "agaric, mushroom",
  },
  {
    id: "corn",
    name: "Sweet Corn",
    nameMalay: "Jagung",
    emoji: "🌽",
    category: "Grain",
    keywords: ["corn", "ear", "sweetcorn", "maize"],
    defaultUnit: "tongkol",
    imageNetClass: "corn, ear",
  },
];

// Target Scope: At least 10 common kitchen ingredients + extended everyday kitchen staples
export const TARGET_INGREDIENTS: IngredientInfo[] = [
  ...PREDEFINED_CNN_INGREDIENTS,
  {
    id: "carrot",
    name: "Carrot",
    nameMalay: "Lobak Merah",
    emoji: "🥕",
    category: "Vegetable",
    keywords: ["carrot", "turnip", "parsnip", "root"],
    defaultUnit: "batang",
  },
  {
    id: "egg",
    name: "Egg",
    nameMalay: "Telur",
    emoji: "🥚",
    category: "Protein",
    keywords: ["egg", "boiled egg", "eggcup", "yolk", "albumin"],
    defaultUnit: "biji",
  },
  {
    id: "onion",
    name: "Onion",
    nameMalay: "Bawang",
    emoji: "🧅",
    category: "Vegetable",
    keywords: ["onion", "shallot", "scallion", "allium", "bulb"],
    defaultUnit: "biji",
  },
  {
    id: "potato",
    name: "Potato",
    nameMalay: "Kentang",
    emoji: "🥔",
    category: "Vegetable",
    keywords: ["potato", "spud", "tuber", "mashed potato"],
    defaultUnit: "biji",
  },
  {
    id: "tomato",
    name: "Tomato",
    nameMalay: "Tomato",
    emoji: "🍅",
    category: "Vegetable",
    keywords: ["tomato", "cherry tomato", "plum tomato"],
    defaultUnit: "biji",
  },
  {
    id: "garlic",
    name: "Garlic",
    nameMalay: "Bawang Putih",
    emoji: "🧄",
    category: "Pantry",
    keywords: ["garlic", "clove", "garlic clove", "allium sativum"],
    defaultUnit: "labu",
  },
  {
    id: "strawberry",
    name: "Strawberry",
    nameMalay: "Strawberi",
    emoji: "🍓",
    category: "Fruit",
    keywords: ["strawberry", "berry"],
    defaultUnit: "kotak",
  },
  {
    id: "avocado",
    name: "Avocado",
    nameMalay: "Avokado",
    emoji: "🥑",
    category: "Fruit",
    keywords: ["avocado", "alligator pear", "guacamole"],
    defaultUnit: "biji",
  },
];

/**
 * Matches MobileNet predictions strictly against the 10 Predefined CNN Ingredients
 * for Objective (b) evaluation.
 */
export function matchPredefinedCnnIngredient(
  predictions: RawPrediction[],
  minProbability: number = 0.20
): IngredientDetection | null {
  if (!predictions || predictions.length === 0) return null;

  for (const pred of predictions) {
    if (pred.probability < minProbability) continue;
    const rawClassLower = pred.className.toLowerCase();
    const classWords = rawClassLower.split(/,\s*|\s+/);

    for (const ingredient of PREDEFINED_CNN_INGREDIENTS) {
      for (const kw of ingredient.keywords) {
        const kwLower = kw.toLowerCase();
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

  return null;
}

/**
 * General matcher: Matches MobileNet raw classifications to any defined kitchen ingredient
 */
export function matchIngredient(
  predictions: RawPrediction[],
  minProbability: number = 0.20
): IngredientDetection | null {
  if (!predictions || predictions.length === 0) return null;

  for (const pred of predictions) {
    if (pred.probability < minProbability) continue;
    const rawClassLower = pred.className.toLowerCase();
    const classWords = rawClassLower.split(/,\s*|\s+/);

    for (const ingredient of TARGET_INGREDIENTS) {
      for (const kw of ingredient.keywords) {
        const kwLower = kw.toLowerCase();
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
  if (topPred && topPred.probability >= 0.25) {
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
          nameMalay: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          emoji: "🥗",
          category: "Pantry",
          keywords: [cleanName],
          defaultUnit: "pcs",
        },
        confidence: Math.round(topPred.probability * 100),
        rawLabel: topPred.className,
        rawProbability: topPred.probability,
      };
    }
  }

  return null;
}
