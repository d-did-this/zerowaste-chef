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
  dominantColor?: { h: number; s: number; v: number; label: string };
  geometry?: { elongation: number; shapeType: string };
}

/**
 * ImageNet 1,000 class indices strictly mapped to the 10 Predefined Produce items (+ produce staples).
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
  // Extended produce
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
    indices: [953], // pineapple
    imageNetLabel: "pineapple (#953)",
    defaultUnit: "biji",
  },
];

/**
 * Geometric shape analysis: Determines aspect ratio & elongation to distinguish
 * elongated produce (Banana, Cucumber) from circular produce (Apple, Orange, Cabbage).
 */
export function analyzeProduceGeometry(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { elongation: number; shapeType: string } {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Estimate background from the 4 corners
  const cornerIndices = [
    0,
    (width - 1) * 4,
    ((height - 1) * width) * 4,
    ((height - 1) * width + (width - 1)) * 4,
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  for (const c of cornerIndices) {
    bgR += data[c];
    bgG += data[c + 1];
    bgB += data[c + 2];
  }
  bgR /= 4; bgG /= 4; bgB /= 4;

  let minX = width, maxX = 0, minY = height, maxY = 0;
  let fgPixels = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      if (dist > 45) {
        fgPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const elongation = Math.max(boxW, boxH) / Math.min(boxW, boxH);
  const shapeType = elongation >= 1.35 ? "Elongated (Cylindrical/Curved)" : "Compact (Spherical/Ovoid)";

  return { elongation: Number(elongation.toFixed(2)), shapeType };
}

/**
 * Extracts dominant HSV color from center pixels to compute Bayesian color priors.
 */
export function extractCenterHsv(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { h: number; s: number; v: number; label: string } {
  const startX = Math.floor(width * 0.25);
  const startY = Math.floor(height * 0.25);
  const sampleW = Math.floor(width * 0.5);
  const sampleH = Math.floor(height * 0.5);

  const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
  const data = imgData.data;

  let totalR = 0, totalG = 0, totalB = 0, count = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    if (brightness > 20 && brightness < 245) {
      totalR += r;
      totalG += g;
      totalB += b;
      count++;
    }
  }

  if (count === 0) return { h: 0, s: 0, v: 0.5, label: "Neutral/Gray" };

  const avgR = totalR / count / 255;
  const avgG = totalG / count / 255;
  const avgB = totalB / count / 255;

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

  const hueDeg = Math.round(h * 360);
  let label = "Neutral/Tan";
  if (s >= 0.20) {
    if (hueDeg >= 42 && hueDeg <= 72) label = "Yellow";
    else if (hueDeg >= 75 && hueDeg <= 165) label = "Green";
    else if (hueDeg > 22 && hueDeg < 42) label = "Orange";
    else if (hueDeg <= 22 || hueDeg >= 340) label = "Red";
  }

  return { h: hueDeg, s: Number(s.toFixed(2)), v: Number(v.toFixed(2)), label };
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

  ctx.filter = "contrast(1.10) brightness(1.02) saturate(1.15)";
  ctx.drawImage(source, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);

  return canvas;
}

/**
 * Runs Predefined Produce CNN Classification with step-by-step telemetry logging
 */
export async function runPredefinedCnnClassification(
  model: MobileNetModel,
  source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
  onLog?: (msg: string) => void
): Promise<ProduceClassificationResult> {
  const log = (msg: string) => {
    if (onLog) onLog(msg);
  };

  log("[Pipeline] Starting multi-scale produce analysis...");

  // 1. Multi-scale crops
  const crop1 = createCroppedCanvas(source, 1.0, 224);
  const crop2 = createCroppedCanvas(source, 0.75, 224);
  log("[Preprocessing] Generated 1.0x standard and 0.75x zoomed crops (224x224)");

  // 2. Optical Color & Geometric Shape inspection
  const ctx1 = crop1.getContext("2d");
  const color = ctx1 ? extractCenterHsv(ctx1, 224, 224) : { h: 0, s: 0, v: 0.5, label: "Neutral" };
  log(`[Color Sensor] HSV: H=${color.h}° S=${Math.round(color.s * 100)}% V=${Math.round(color.v * 100)}% -> Palette: ${color.label}`);

  const geometry = ctx1 ? analyzeProduceGeometry(ctx1, 224, 224) : { elongation: 1.0, shapeType: "Compact" };
  log(`[Geometry Sensor] Elongation: ${geometry.elongation}x -> ${geometry.shapeType}`);

  // 3. CNN inference on both crops
  log("[CNN Core] Executing MobileNet feedforward on convolutional layers...");
  const logitsTensor1 = model.infer(crop1);
  const logitsTensor2 = model.infer(crop2);

  const [data1, data2] = await Promise.all([
    logitsTensor1.data(),
    logitsTensor2.data(),
  ]);

  logitsTensor1.dispose();
  logitsTensor2.dispose();

  // Average logits across ensemble
  const averagedLogits = new Float32Array(1000);
  for (let i = 0; i < 1000; i++) {
    averagedLogits[i] = (data1[i] + data2[i]) / 2;
  }
  log("[CNN Core] Extracted 1,000-dimensional raw activations across ensemble");

  // 4. Logit projection onto the Predefined Produce Classes
  log("[Logit Head] Projecting activations onto the 10 Predefined Produce classes (ImageNet produces #936-#992)");

  const scoredItems = PREDEFINED_PRODUCE_CATALOG.map((item) => {
    let logit = Math.max(...item.indices.map((idx) => averagedLogits[idx] ?? -10));

    // A. Shape-aware geometric adjustments
    if (geometry.elongation >= 1.35) {
      if (item.id === "banana" || item.id === "cucumber") {
        logit += 2.2; // Boost elongated items
      } else if (item.id === "orange" || item.id === "apple" || item.id === "cabbage") {
        logit -= 2.0; // Penalize circular items when object is clearly elongated
      }
    } else {
      if (item.id === "banana") {
        logit -= 1.5; // Penalize banana when object is circular/spherical
      }
    }

    // B. Color-aware Bayesian prior adjustments
    if (color.s >= 0.20) {
      // Yellow
      if (color.h >= 42 && color.h <= 72) {
        if (item.id === "banana" || item.id === "lemon" || item.id === "corn") {
          logit += 2.0;
        } else if (item.id === "broccoli" || item.id === "cabbage") {
          logit -= 2.0;
        }
      }
      // Green
      else if (color.h >= 75 && color.h <= 165) {
        if (item.id === "broccoli" || item.id === "cucumber" || item.id === "cabbage" || item.id === "apple") {
          logit += 2.0;
        } else if (item.id === "orange" || item.id === "banana") {
          logit -= 2.0;
        }
      }
      // Red
      else if (color.h <= 22 || color.h >= 340) {
        if (item.id === "apple" || item.id === "strawberry" || item.id === "bell_pepper") {
          logit += 2.0;
        } else if (item.id === "broccoli" || item.id === "banana") {
          logit -= 2.0;
        }
      }
      // Orange
      else if (color.h > 22 && color.h <= 42) {
        if (item.id === "orange" || item.id === "bell_pepper") {
          logit += 2.0;
        }
      }
    } else {
      if (item.id === "mushroom") logit += 1.5;
    }

    return { ...item, logit };
  });

  // 5. Compute Softmax over Target Produce Classes
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

  log(`[Softmax Output] Top produce probabilities: ${ranked.slice(0, 3).map(r => `${r.name}: ${r.confidence}%`).join(" | ")}`);
  log(`[Decision] Target identified: ${topMatch.name} (${topMatch.nameMalay}) at ${topMatch.confidence}% confidence`);

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
    geometry,
  };
}
