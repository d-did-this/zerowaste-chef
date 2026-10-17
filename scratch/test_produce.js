const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const sharp = require('sharp');
const path = require('path');

const PREDEFINED_PRODUCE = [
  { id: 'apple', name: 'Apple', indices: [948], label: 'Granny Smith (#948)' },
  { id: 'banana', name: 'Banana', indices: [954], label: 'banana (#954)' },
  { id: 'broccoli', name: 'Broccoli', indices: [937], label: 'broccoli (#937)' },
  { id: 'cabbage', name: 'Cabbage', indices: [936], label: 'head cabbage (#936)' },
  { id: 'bell_pepper', name: 'Bell Pepper', indices: [945], label: 'bell pepper (#945)' },
  { id: 'cucumber', name: 'Cucumber', indices: [943, 939], label: 'cucumber (#943/#939)' },
  { id: 'orange', name: 'Orange', indices: [950], label: 'orange (#950)' },
  { id: 'lemon', name: 'Lemon', indices: [951], label: 'lemon (#951)' },
  { id: 'mushroom', name: 'Mushroom', indices: [947, 992], label: 'mushroom (#947/#992)' },
  { id: 'corn', name: 'Sweet Corn', indices: [987], label: 'corn (#987)' },
];

const images = [
  { name: 'Cucumbers', file: 'media_1792223683942_322e8243.jpg' },
  { name: 'Bananas', file: 'media_1792223683993_d5af8efd.jpg' },
  { name: 'Green Apples', file: 'media_1792223684020_881bdd86.jpg' },
  { name: 'Cabbage', file: 'media_1792223684113_be6a3305.jpg' },
  { name: 'Lemons', file: 'media_1792223684117_e0a6080e.jpg' },
];

const userDir = 'C:/Users/D-Legion/.gemini/antigravity/brain/a8567372-b5dc-43ba-af75-0c6e4182b26e/.user_uploaded';

async function run() {
  await tf.ready();
  console.log('Loading MobileNet v2...');
  const model = await mobilenet.load({ version: 2, alpha: 1.0 });
  console.log('MobileNet v2 loaded.');

  for (const item of images) {
    const fullPath = path.join(userDir, item.file);
    const meta = await sharp(fullPath).metadata();
    
    // In the screenshot, the camera box is around top 19% to 45% of height, and 5% to 95% of width.
    // Let's crop the camera box:
    const cropLeft = Math.round(meta.width * 0.05);
    const cropTop = Math.round(meta.height * 0.19);
    const cropWidth = Math.round(meta.width * 0.90);
    const cropHeight = Math.round(meta.height * 0.25);

    const { data, info } = await sharp(fullPath)
      .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
      .resize(224, 224, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert raw RGB buffer to 3D tensor [224, 224, 3]
    const imgTensor = tf.tensor3d(new Uint8Array(data), [224, 224, 3], 'int32');

    // Run MobileNet classify (all 1000 classes)
    const top3All = await model.classify(imgTensor, 3);

    // Run MobileNet infer (get 1000 logits)
    const logitsTensor = model.infer(imgTensor);
    const rawLogits = await logitsTensor.data();
    imgTensor.dispose();
    logitsTensor.dispose();

    // Now compute softmax over the 10 produce classes ONLY (without any artificial priors!)
    const produceLogits = PREDEFINED_PRODUCE.map(p => {
      const maxL = Math.max(...p.indices.map(idx => rawLogits[idx]));
      return { ...p, logit: maxL };
    });

    const maxLogit = Math.max(...produceLogits.map(p => p.logit));
    const exps = produceLogits.map(p => Math.exp(p.logit - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const rankedProduce = produceLogits.map((p, i) => ({
      name: p.name,
      prob: exps[i] / sumExps,
      logit: p.logit,
    })).sort((a, b) => b.prob - a.prob);

    console.log(`\n========================================`);
    console.log(`IMAGE: ${item.name}`);
    console.log(`Raw Top 3 ImageNet:`, top3All.map(t => `${t.className} (${(t.probability * 100).toFixed(1)}%)`).join(', '));
    console.log(`Pure 10-Class Softmax (NO PRIORS):`);
    rankedProduce.slice(0, 4).forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.name}: ${(r.prob * 100).toFixed(1)}% (logit: ${r.logit.toFixed(2)})`);
    });
  }
}

run().catch(console.error);
