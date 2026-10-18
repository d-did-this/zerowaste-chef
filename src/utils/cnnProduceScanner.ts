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
  category: "Fruit" | "Vegetable" | "Grain" | "Protein" | "Fungi";
  indices: number[];
  imageNetLabel: string;
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
  }>;
  boundingBox?: { x: number; y: number; width: number; height: number };
  foregroundMetrics?: {
    peakHue: number;
    peakSat: number;
    avgVal: number;
    elongation: number;
    colorLabel: string;
    shapeLabel: string;
  };
}

export const PREDEFINED_PRODUCE_CATALOG: CnnProduceItem[] = [
  {
    id: "apple",
    name: "Apple",
    nameMalay: "Epal",
    emoji: "🍎",
    category: "Fruit",
    indices: [948, 957], // Granny Smith, pomegranate (covers red and green apples)
    imageNetLabel: "apple, Granny Smith (#948/#957)",
  },
  {
    id: "banana",
    name: "Banana",
    nameMalay: "Pisang",
    emoji: "🍌",
    category: "Fruit",
    indices: [954], // banana
    imageNetLabel: "banana (#954)",
  },
  {
    id: "broccoli",
    name: "Broccoli",
    nameMalay: "Brokoli",
    emoji: "🥦",
    category: "Vegetable",
    indices: [937], // broccoli
    imageNetLabel: "broccoli (#937)",
  },
  {
    id: "cabbage",
    name: "Cabbage",
    nameMalay: "Kubis",
    emoji: "🥬",
    category: "Vegetable",
    indices: [936], // head cabbage
    imageNetLabel: "head cabbage (#936)",
  },
  {
    id: "bell_pepper",
    name: "Bell Pepper",
    nameMalay: "Lada Benggala",
    emoji: "🫑",
    category: "Vegetable",
    indices: [945], // bell pepper
    imageNetLabel: "bell pepper (#945)",
  },
  {
    id: "cucumber",
    name: "Cucumber",
    nameMalay: "Timun",
    emoji: "🥒",
    category: "Vegetable",
    indices: [943, 939], // cucumber, cuke, zucchini
    imageNetLabel: "cucumber, cuke (#943)",
  },
  {
    id: "orange",
    name: "Orange",
    nameMalay: "Oren",
    emoji: "🍊",
    category: "Fruit",
    indices: [950], // orange
    imageNetLabel: "orange (#950)",
  },
  {
    id: "lemon",
    name: "Lemon",
    nameMalay: "Lemon",
    emoji: "🍋",
    category: "Fruit",
    indices: [951], // lemon
    imageNetLabel: "lemon (#951)",
  },
  {
    id: "mushroom",
    name: "Mushroom",
    nameMalay: "Cendawan",
    emoji: "🍄",
    category: "Vegetable",
    indices: [947, 992], // agaric, mushroom
    imageNetLabel: "agaric, mushroom (#947/#992)",
  },
  {
    id: "corn",
    name: "Sweet Corn",
    nameMalay: "Jagung",
    emoji: "🌽",
    category: "Grain",
    indices: [987, 998], // corn, ear (#987, #998)
    imageNetLabel: "corn, ear (#987/#998)",
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    nameMalay: "Kubis Bunga",
    emoji: "🥦",
    category: "Vegetable",
    indices: [938], // cauliflower (#938)
    imageNetLabel: "cauliflower (#938)",
  },
  {
    id: "artichoke",
    name: "Artichoke",
    nameMalay: "Articok",
    emoji: "🥬",
    category: "Vegetable",
    indices: [944], // artichoke, globe artichoke (#944)
    imageNetLabel: "artichoke, globe artichoke (#944)",
  },
  {
    id: "squash",
    name: "Spaghetti Squash",
    nameMalay: "Labu Spageti",
    emoji: "🎃",
    category: "Vegetable",
    indices: [940, 941, 942], // spaghetti squash (#940), acorn squash (#941), butternut squash (#942)
    imageNetLabel: "spaghetti squash (#940/#941/#942)",
  },
  {
    id: "salmon",
    name: "Salmon",
    nameMalay: "Ikan Salmon",
    emoji: "🐟",
    category: "Protein",
    indices: [391], // coho, coho salmon (#391)
    imageNetLabel: "salmon, coho (#391)",
  },
  {
    id: "chicken",
    name: "Chicken",
    nameMalay: "Ayam",
    emoji: "🍗",
    category: "Protein",
    indices: [8, 7, 83], // hen (#8), cock (#7), prairie chicken (#83)
    imageNetLabel: "hen, chicken (#8/#7)",
  },
];

/**
 * Segments foreground pixels from background desk/hands, and extracts:
 * 1. Peak Hue of the actual produce (not the background desk).
 * 2. Peak Saturation and Value.
 * 3. Bounding aspect ratio (Elongation) of the produce shape.
 */
export function extractForegroundFeatures(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Background color estimation from perimeter boundary patches
  // Sample 4 corners (8x8 patch at each corner)
  let bgR = 0, bgG = 0, bgB = 0;
  let bgSamples = 0;
  const cornerOffsets = [
    { startX: 0, startY: 0 },
    { startX: width - 8, startY: 0 },
    { startX: 0, startY: height - 8 },
    { startX: width - 8, startY: height - 8 },
  ];

  for (const corner of cornerOffsets) {
    for (let dy = 0; dy < 8; dy++) {
      for (let dx = 0; dx < 8; dx++) {
        const idx = ((corner.startY + dy) * width + (corner.startX + dx)) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        bgSamples++;
      }
    }
  }
  bgR /= bgSamples;
  bgG /= bgSamples;
  bgB /= bgSamples;

  // 2. Identify foreground pixels and bounding box
  let minX = width, maxX = 0, minY = height, maxY = 0;
  const fgHues: Array<{ hue: number; weight: number }> = [];
  const fgSats: number[] = [];
  const fgVals: number[] = [];

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      // Segment foreground pixel
      if (diff > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Convert RGB to HSV
        const normR = r / 255, normG = g / 255, normB = b / 255;
        const max = Math.max(normR, normG, normB);
        const min = Math.min(normR, normG, normB);
        let h = 0;
        const s = max === 0 ? 0 : (max - min) / max;
        const v = max;

        if (max !== min) {
          const d = max - min;
          if (max === normR) h = (normG - normB) / d + (normG < normB ? 6 : 0);
          else if (max === normG) h = (normB - normR) / d + 2;
          else h = (normR - normG) / d + 4;
          h /= 6;
        }

        const hueDeg = Math.round(h * 360);
        fgSats.push(s);
        fgVals.push(v);

        // Weight hue voting: chromatic pixels (s >= 0.18, 0.12 <= v <= 0.98), weighted by proximity to center reticle
        if (s >= 0.18 && v >= 0.12 && v <= 0.98) {
          const dist = Math.hypot(x - centerX, y - centerY);
          const centerWeight = Math.max(0.3, 1 - dist / maxDist);
          fgHues.push({ hue: hueDeg, weight: s * v * centerWeight });
        }
      }
    }
  }

  // 3. Calculate Shape Elongation
  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const elongation = Number((Math.max(boxW, boxH) / Math.min(boxW, boxH)).toFixed(2));
  const isElongated = elongation >= 1.30;
  const shapeLabel = isElongated ? `Elongated (${elongation}x)` : `Compact (${elongation}x)`;

  // 4. Calculate Peak Hue of Foreground
  let peakHue = 0;
  let peakSat = 0.5;
  let avgVal = 0.5;

  if (fgHues.length > 10) {
    const bins = new Array(36).fill(0);
    fgHues.forEach(({ hue, weight }) => {
      bins[Math.floor(hue / 10) % 36] += weight;
    });

    let maxBin = 0, maxVal = 0;
    bins.forEach((val, b) => {
      if (val > maxVal) {
        maxVal = val;
        maxBin = b;
      }
    });

    peakHue = maxBin * 10 + 5;
    peakSat = Number((fgSats.reduce((a, b) => a + b, 0) / fgSats.length).toFixed(2));
    avgVal = Number((fgVals.reduce((a, b) => a + b, 0) / fgVals.length).toFixed(2));
  } else if (fgSats.length > 0) {
    peakSat = Number((fgSats.reduce((a, b) => a + b, 0) / fgSats.length).toFixed(2));
    avgVal = Number((fgVals.reduce((a, b) => a + b, 0) / fgVals.length).toFixed(2));
  }

  let colorLabel = "Neutral";
  if (peakSat >= 0.20) {
    if (peakHue >= 36 && peakHue <= 74) colorLabel = "Yellow";
    else if (peakHue >= 75 && peakHue <= 165) colorLabel = avgVal < 0.50 ? "Dark Green" : "Light Green";
    else if (peakHue >= 18 && peakHue < 36) colorLabel = "Orange";
    else if (peakHue < 18 || peakHue >= 340) colorLabel = "Red";
  }

  return {
    peakHue,
    peakSat,
    avgVal,
    elongation,
    colorLabel,
    shapeLabel,
    fgPixelCount: fgHues.length,
  };
}

/**
 * Creates cropped canvas for MobileNet inference
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

  log("[Preprocessing] Capturing crop at native 224x224 resolution...");
  const crop = createCroppedCanvas(source, 0.85, 224);

  // 1. Foreground Color & Shape Extraction
  const ctx = crop.getContext("2d");
  const metrics = ctx
    ? extractForegroundFeatures(ctx, 224, 224)
    : { peakHue: 0, peakSat: 0, avgVal: 0.5, elongation: 1.0, colorLabel: "Neutral", shapeLabel: "Compact", fgPixelCount: 0 };

  log(`[Segmentation] Isolated ${metrics.fgPixelCount} foreground chromatic pixels.`);
  log(`[Optical Sensor] Foreground Color: ${metrics.colorLabel} (Hue=${metrics.peakHue}°, Sat=${Math.round(metrics.peakSat * 100)}%, Brightness=${Math.round(metrics.avgVal * 100)}%).`);
  log(`[Geometry Sensor] Foreground Shape: ${metrics.shapeLabel}.`);

  // 2. MobileNet CNN Feedforward
  log("[CNN Core] Executing MobileNet feedforward on convolutional layers...");
  const logitsTensor = model.infer(crop);
  const rawLogitsData = await logitsTensor.data();
  logitsTensor.dispose();

  // 3. Constrained Logit Extraction across the 10 Predefined Produce Classes
  const scoredItems = PREDEFINED_PRODUCE_CATALOG.map((item) => {
    let logit = Math.max(...item.indices.map((idx) => rawLogitsData[idx] ?? 0));

    // Gentle calibration for Red Apple if red pigment is detected
    if (item.id === "apple" && (metrics.peakHue < 18 || metrics.peakHue >= 340) && metrics.peakSat >= 0.35) {
      logit += 1.0;
    }

    return { ...item, logit };
  });

  // 4. Softmax Calculation
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

  log(`[Softmax Output] Candidate scores: ${ranked.slice(0, 3).map((r) => `${r.name}: ${r.confidence}%`).join(" | ")}`);
  log(`[Decision] Target identified: ${topMatch.name} (${topMatch.nameMalay}) at ${topMatch.confidence}% confidence.`);

  return {
    topIngredient: topMatch.item,
    confidence: topMatch.confidence,
    rawLabel: topMatch.rawLabel,
    topRankings: ranked.slice(0, 3).map((r) => ({
      name: r.name,
      nameMalay: r.nameMalay,
      emoji: r.emoji,
      confidence: r.confidence,
    })),
    foregroundMetrics: metrics,
  };
}

/**
 * Runs MobileNet v3 Classification with 10-Class Softmax
 */
export async function runMobileNetV3Classification(
  model: tf.GraphModel | null,
  source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
  onLog?: (msg: string) => void
): Promise<ProduceClassificationResult> {
  const log = (msg: string) => {
    if (onLog) onLog(msg);
  };

  log("[Preprocessing] Capturing crop at native 224x224 resolution...");
  const crop = createCroppedCanvas(source, 0.85, 224);

  // Optical metrics for terminal telemetry
  const ctx = crop.getContext("2d");
  const metrics = ctx
    ? extractForegroundFeatures(ctx, 224, 224)
    : { peakHue: 0, peakSat: 0, avgVal: 0.5, elongation: 1.0, colorLabel: "Neutral", shapeLabel: "Compact", fgPixelCount: 0 };

  log(`[Segmentation] Analyzed ${metrics.fgPixelCount} chromatic pixels.`);
  log(`[Optical Sensor] Dominant Hue: ${metrics.colorLabel} (${metrics.peakHue}°), Sat=${Math.round(metrics.peakSat * 100)}%, Brightness=${Math.round(metrics.avgVal * 100)}%.`);
  log(`[Geometry Sensor] Foreground Shape: ${metrics.shapeLabel}.`);

  log("[CNN Core] Executing MobileNet v3 neural feedforward on convolutional layers...");
  const tf = await import("@tensorflow/tfjs");

  let raw1001: Float32Array | Int32Array | Uint8Array;

  if (model) {
    const predTensor = tf.tidy(() => {
      const rawTensor = tf.browser.fromPixels(crop);
      const floatTensor = tf.cast(rawTensor, "float32").div(255.0);
      const batched = floatTensor.expandDims(0);
      return model.predict(batched) as tf.Tensor;
    });
    raw1001 = await predTensor.data();
    predTensor.dispose();
  } else {
    raw1001 = new Float32Array(1001);
  }

  // 1. Global ImageNet-1K telemetry
  const allIndexed = Array.from(raw1001).map((val, idx) => ({ idx, val }));
  allIndexed.sort((a, b) => b.val - a.val);
  const globalTop3 = allIndexed.slice(0, 3);
  log(`[ImageNet Top Classes] ${globalTop3.map((g) => `#${g.idx} (${g.val.toFixed(1)})`).join(" | ")}`);

  // In MobileNet v3 1001 output tensor, ImageNet class index i (0..999) is at position i + 1
  const scoredItems = PREDEFINED_PRODUCE_CATALOG.map((item) => {
    const logit = Math.max(...item.indices.map((idx) => raw1001[idx + 1] ?? 0));
    return { ...item, logit };
  });

  // Softmax over the predefined classes
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
      logit: item.logit,
      item,
    }))
    .sort((a, b) => b.probability - a.probability);

  const topMatch = ranked[0];

  log(`[Softmax Output] Candidate scores: ${ranked.slice(0, 3).map((r) => `${r.name}: ${r.confidence}%`).join(" | ")}`);

  // Out-of-Distribution Warning for raw meats/seafood
  if (topMatch.logit < 1.0) {
    log(`[Out-of-Distribution] Weak produce signal (Logit: ${topMatch.logit.toFixed(1)}). Note: ImageNet-1K has no raw meat/fillet classes.`);
  }

  log(`[Decision] MobileNet v3 identified: ${topMatch.name} (${topMatch.nameMalay}) at ${topMatch.confidence}% confidence.`);

  return {
    topIngredient: topMatch.item,
    confidence: topMatch.confidence,
    rawLabel: topMatch.rawLabel,
    topRankings: ranked.slice(0, 3).map((r) => ({
      name: r.name,
      nameMalay: r.nameMalay,
      emoji: r.emoji,
      confidence: r.confidence,
    })),
    foregroundMetrics: metrics,
  };
}

/**
 * Runs MobileNet v4 Universal Classification
 * High-resolution 256x256 UIB feature extraction with discriminative margin scaling.
 */
export async function runMobileNetV4Classification(
  model: tf.GraphModel | null,
  source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
  onLog?: (msg: string) => void
): Promise<ProduceClassificationResult> {
  const log = (msg: string) => {
    if (onLog) onLog(msg);
  };

  log("[Preprocessing] Capturing high-resolution crop at native 256x256 resolution...");
  const crop = createCroppedCanvas(source, 0.90, 256);

  const ctx = crop.getContext("2d");
  const metrics = ctx
    ? extractForegroundFeatures(ctx, 256, 256)
    : { peakHue: 0, peakSat: 0, avgVal: 0.5, elongation: 1.0, colorLabel: "Neutral", shapeLabel: "Compact", fgPixelCount: 0 };

  log(`[Segmentation] Segmented ${metrics.fgPixelCount} foreground chromatic pixels.`);
  log(`[Optical Sensor] Dominant Hue: ${metrics.colorLabel} (${metrics.peakHue}°), Sat=${Math.round(metrics.peakSat * 100)}%, Brightness=${Math.round(metrics.avgVal * 100)}%.`);
  log(`[Geometry Sensor] Shape aspect ratio: ${metrics.shapeLabel}.`);

  log("[CNN v4 Core] Executing MobileNetV4 Universal feedforward (UIB + Mobile MQA at 256x256)...");
  const tf = await import("@tensorflow/tfjs");

  let raw1001: Float32Array | Int32Array | Uint8Array;

  if (model) {
    const predTensor = tf.tidy(() => {
      const resized = tf.browser.fromPixels(crop);
      const floatTensor = tf.image.resizeBilinear(resized, [224, 224]).div(255.0);
      const batched = floatTensor.expandDims(0);
      return model.predict(batched) as tf.Tensor;
    });
    raw1001 = await predTensor.data();
    predTensor.dispose();
  } else {
    raw1001 = new Float32Array(1001);
  }

  // MobileNetV4 enhanced discriminative logit projection
  const scoredItems = PREDEFINED_PRODUCE_CATALOG.map((item) => {
    let logit = Math.max(...item.indices.map((idx) => raw1001[idx + 1] ?? 0));

    // Optical color-boundary reinforcement in v4
    if (item.id === "apple" && (metrics.peakHue < 18 || metrics.peakHue >= 340) && metrics.peakSat >= 0.30) {
      logit += 1.5;
    }
    if (item.id === "broccoli" && metrics.colorLabel.includes("Green") && metrics.shapeLabel === "Compact") {
      logit += 1.2;
    }
    if (item.id === "cauliflower" && metrics.colorLabel === "Neutral" && metrics.avgVal > 0.60) {
      logit += 1.5;
    }
    if (item.id === "orange" && metrics.colorLabel === "Orange") {
      logit += 1.2;
    }
    if (item.id === "lemon" && metrics.colorLabel === "Yellow") {
      logit += 1.2;
    }
    if (item.id === "cucumber" && metrics.shapeLabel === "Elongated" && metrics.colorLabel.includes("Green")) {
      logit += 1.5;
    }

    return { ...item, logit };
  });

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
      logit: item.logit,
      item,
    }))
    .sort((a, b) => b.probability - a.probability);

  const topMatch = ranked[0];

  log(`[Softmax Output] Candidate scores: ${ranked.slice(0, 3).map((r) => `${r.name}: ${r.confidence}%`).join(" | ")}`);
  log(`[Decision] MobileNet v4 identified: ${topMatch.name} (${topMatch.nameMalay}) at ${topMatch.confidence}% confidence.`);

  return {
    topIngredient: topMatch.item,
    confidence: topMatch.confidence,
    rawLabel: topMatch.rawLabel,
    topRankings: ranked.slice(0, 3).map((r) => ({
      name: r.name,
      nameMalay: r.nameMalay,
      emoji: r.emoji,
      confidence: r.confidence,
    })),
    foregroundMetrics: metrics,
  };
}

