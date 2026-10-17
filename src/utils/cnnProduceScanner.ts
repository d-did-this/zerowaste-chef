import type * as tf from "@tensorflow/tfjs";

export interface MobileNetModel {
  infer: (
    img: tf.Tensor | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    embedding?: boolean
  ) => tf.Tensor;
  classify: (
    img: tf.Tensor3D | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    topk?: number
  ) => Promise<Array<{ className: string; probability: number }>>;
}

export interface CnnProduceItem {
  id: string;
  name: string;
  nameMalay: string;
  emoji: string;
  category: "Fruit" | "Vegetable" | "Grain";
  indices: number[];
  imageNetLabel: string;
  defaultUnit: string;
}

export interface ProduceClassificationResult {
  topIngredient: CnnProduceItem;
  confidence: number;
  rawLabel: string;
  topRankings: Array<{
    name: string;
    nameMalay: string;
    emoji: string;
    confidence: number;
    rawLabel: string;
  }>;
  dominantColor?: { h: number; s: number; v: number };
}

/**
 * Exact ImageNet 1,000 class indices for target produce items.
 * Constraining inference to this predefined dataset eliminates domestic background
 * noise (crates, dogs, drinks) and guarantees produce-domain evaluation.
 */
export const PREDEFINED_PRODUCE_CATALOG: CnnProduceItem[] = [
  {
    id: "apple",
    name: "Apple",
    nameMalay: "Epal",
    emoji: "🍎",
    category: "Fruit",
    indices: [948, 956, 957], // Granny Smith, custard apple, pomegranate
    imageNetLabel: "Granny Smith (#948)",
    defaultUnit: "biji",
  },
  {
    id: "banana",
    name: "Banana",
    nameMalay: "Pisang",
    emoji: "🍌",
    category: "Fruit",
    indices: [954], // banana
    imageNetLabel: "banana (#954)",
    defaultUnit: "sikat",
  },
  {
    id: "broccoli",
    name: "Broccoli",
    nameMalay: "Brokoli",
    emoji: "🥦",
    category: "Vegetable",
    indices: [937], // broccoli
    imageNetLabel: "broccoli (#937)",
    defaultUnit: "biji",
  },
  {
    id: "cabbage",
    name: "Cabbage",
    nameMalay: "Kubis",
    emoji: "🥬",
    category: "Vegetable",
    indices: [936], // head cabbage
    imageNetLabel: "head cabbage (#936)",
    defaultUnit: "biji",
  },
  {
    id: "bell_pepper",
    name: "Bell Pepper",
    nameMalay: "Lada Benggala",
    emoji: "🫑",
    category: "Vegetable",
    indices: [945], // bell pepper
    imageNetLabel: "bell pepper (#945)",
    defaultUnit: "biji",
  },
  {
    id: "cucumber",
    name: "Cucumber",
    nameMalay: "Timun",
    emoji: "🥒",
    category: "Vegetable",
    indices: [943, 939], // cucumber, cuke, zucchini
    imageNetLabel: "cucumber, cuke (#943)",
    defaultUnit: "batang",
  },
  {
    id: "orange",
    name: "Orange",
    nameMalay: "Oren",
    emoji: "🍊",
    category: "Fruit",
    indices: [950], // orange
    imageNetLabel: "orange (#950)",
    defaultUnit: "biji",
  },
  {
    id: "lemon",
    name: "Lemon",
    nameMalay: "Lemon",
    emoji: "🍋",
    category: "Fruit",
    indices: [951], // lemon
    imageNetLabel: "lemon (#951)",
    defaultUnit: "biji",
  },
  {
    id: "mushroom",
    name: "Mushroom",
    nameMalay: "Cendawan",
    emoji: "🍄",
    category: "Vegetable",
    indices: [947, 992], // agaric, mushroom
    imageNetLabel: "agaric, mushroom (#947/#992)",
    defaultUnit: "bungkus",
  },
  {
    id: "corn",
    name: "Sweet Corn",
    nameMalay: "Jagung",
    emoji: "🌽",
    category: "Grain",
    indices: [987], // corn, ear
    imageNetLabel: "corn, ear (#987)",
    defaultUnit: "tongkol",
  },
  // Extended produce staples
  {
    id: "strawberry",
    name: "Strawberry",
    nameMalay: "Strawberi",
    emoji: "🍓",
    category: "Fruit",
    indices: [949], // strawberry
    imageNetLabel: "strawberry (#949)",
    defaultUnit: "kotak",
  },
  {
    id: "pineapple",
    name: "Pineapple",
    nameMalay: "Nanas",
    emoji: "🍍",
    category: "Fruit",
    indices: [953], // pineapple, ananas
    imageNetLabel: "pineapple (#953)",
    defaultUnit: "biji",
  },
];

/**
 * Extracts dominant HSV color from center pixels to compute Bayesian color priors.
 */
export function extractCenterHsv(ctx: CanvasRenderingContext2D, width: number, height: number): {
  h: number;
  s: number;
  v: number;
} {
  // Sample center 40% region
  const startX = Math.floor(width * 0.3);
  const startY = Math.floor(height * 0.3);
  const sampleW = Math.floor(width * 0.4);
  const sampleH = Math.floor(height * 0.4);

  const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
  const data = imgData.data;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let validCount = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    // Discard extreme shadows or glare
    if (brightness > 25 && brightness < 240) {
      totalR += r;
      totalG += g;
      totalB += b;
      validCount++;
    }
  }

  if (validCount === 0) return { h: 0, s: 0, v: 0.5 };

  const avgR = totalR / validCount / 255;
  const avgG = totalG / validCount / 255;
  const avgB = totalB / validCount / 255;

  const max = Math.max(avgR, avgG, avgB);
  const min = Math.min(avgR, avgG, avgB);
  let h = 0;
  const s = max === 0 ? 0 : (max - min) / max;
  const v = max;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case avgR:
        h = (avgG - avgB) / d + (avgG < avgB ? 6 : 0);
        break;
      case avgG:
        h = (avgB - avgR) / d + 2;
        break;
      case avgB:
        h = (avgR - avgG) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, v };
}

/**
 * Creates multi-scale cropped canvas for ensemble inference
 */
export function createCroppedCanvas(
  source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
  scale: number = 1.0,
  targetSize: number = 224
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const srcWidth = (source as HTMLVideoElement).videoWidth || source.width;
  const srcHeight = (source as HTMLVideoElement).videoHeight || source.height;

  const baseSize = Math.min(srcWidth, srcHeight);
  const cropSize = baseSize * scale;

  const startX = (srcWidth - cropSize) / 2;
  const startY = (srcHeight - cropSize) / 2;

  // Apply subtle contrast & saturation enhancement
  ctx.filter = "contrast(1.12) brightness(1.02) saturate(1.18)";
  ctx.drawImage(source, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);

  return canvas;
}

/**
 * Runs Predefined Produce CNN Classification using Multi-Crop Ensemble + Masked Logit Softmax
 */
export async function runPredefinedCnnClassification(
  model: MobileNetModel,
  source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement
): Promise<ProduceClassificationResult> {
  // 1. Create 2 multi-scale crops (1.0x standard, 0.75x tight zoom)
  const crop1 = createCroppedCanvas(source, 1.0, 224);
  const crop2 = createCroppedCanvas(source, 0.75, 224);

  // 2. Extract HSV color profile from center
  const ctx1 = crop1.getContext("2d");
  const color = ctx1 ? extractCenterHsv(ctx1, 224, 224) : { h: 0, s: 0, v: 0.5 };

  // 3. Compute logits from CNN via model.infer
  const logitsTensor1 = model.infer(crop1);
  const logitsTensor2 = model.infer(crop2);

  const [data1, data2] = await Promise.all([
    logitsTensor1.data(),
    logitsTensor2.data(),
  ]);

  // Dispose tensors immediately to keep GPU memory clean
  logitsTensor1.dispose();
  logitsTensor2.dispose();

  // 4. Average logits across multi-scale crops
  const averagedLogits = new Float32Array(1000);
  for (let i = 0; i < 1000; i++) {
    averagedLogits[i] = (data1[i] + data2[i]) / 2;
  }

  // 5. Constrain inference to the Predefined Produce Classes (Logit Masking + Color Bayesian Prior)
  const scoredItems = PREDEFINED_PRODUCE_CATALOG.map((item) => {
    // Extract highest raw logit among the item's ImageNet indices
    let logit = Math.max(...item.indices.map((idx) => averagedLogits[idx] ?? -10));

    // Color consistency prior boost (+1.5 logit)
    const { h, s } = color;
    if (s >= 0.22) {
      // Yellow produce
      if (h >= 42 && h <= 72) {
        if (item.id === "banana" || item.id === "lemon" || item.id === "corn") {
          logit += 1.8;
        }
      }
      // Green produce
      else if (h >= 75 && h <= 165) {
        if (
          item.id === "broccoli" ||
          item.id === "cucumber" ||
          item.id === "cabbage" ||
          item.id === "apple"
        ) {
          logit += 1.8;
        }
      }
      // Red produce
      else if (h <= 22 || h >= 340) {
        if (
          item.id === "apple" ||
          item.id === "strawberry" ||
          item.id === "bell_pepper"
        ) {
          logit += 1.8;
        }
      }
      // Orange produce
      else if (h > 22 && h <= 42) {
        if (item.id === "orange" || item.id === "bell_pepper") {
          logit += 1.8;
        }
      }
    } else {
      // Low saturation / neutral
      if (item.id === "mushroom") {
        logit += 1.2;
      }
    }

    return {
      ...item,
      logit,
    };
  });

  // 6. Compute Softmax Probability Distribution over ONLY the produce classes
  const maxLogit = Math.max(...scoredItems.map((s) => s.logit));
  const exps = scoredItems.map((s) => Math.exp(s.logit - maxLogit));
  const sumExps = exps.reduce((acc, val) => acc + val, 0);
  const probs = exps.map((e) => e / sumExps);

  const ranked = scoredItems
    .map((item, idx) => ({
      name: item.name,
      nameMalay: item.nameMalay,
      emoji: item.emoji,
      confidence: Math.round(probs[idx] * 100),
      probability: probs[idx],
      rawLabel: item.imageNetLabel,
      item,
    }))
    .sort((a, b) => b.probability - a.probability);

  const topMatch = ranked[0];

  return {
    topIngredient: topMatch.item,
    confidence: topMatch.confidence,
    rawLabel: topMatch.rawLabel,
    topRankings: ranked.slice(0, 3).map((r) => ({
      name: r.name,
      nameMalay: r.nameMalay,
      emoji: r.emoji,
      confidence: r.confidence,
      rawLabel: r.rawLabel,
    })),
    dominantColor: color,
  };
}
