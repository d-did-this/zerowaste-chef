const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const path = require('path');

const PREDEFINED_PRODUCE = [
  { id: 'apple', name: 'Apple', indices: [948, 957] },
  { id: 'banana', name: 'Banana', indices: [954] },
  { id: 'broccoli', name: 'Broccoli', indices: [937] },
  { id: 'cabbage', name: 'Cabbage', indices: [936] },
  { id: 'bell_pepper', name: 'Bell Pepper', indices: [945] },
  { id: 'cucumber', name: 'Cucumber', indices: [943, 939] },
  { id: 'orange', name: 'Orange', indices: [950] },
  { id: 'lemon', name: 'Lemon', indices: [951] },
  { id: 'mushroom', name: 'Mushroom', indices: [947, 992] },
  { id: 'corn', name: 'Sweet Corn', indices: [987, 998] },
];

const testImages = [
  { name: 'Cucumbers', file: 'media_1792223683942_322e8243.jpg' },
  { name: 'Bananas', file: 'media_1792223683993_d5af8efd.jpg' },
  { name: 'Green Apples', file: 'media_1792223684020_881bdd86.jpg' },
  { name: 'Cabbage', file: 'media_1792223684113_be6a3305.jpg' },
  { name: 'Lemons', file: 'media_1792223684117_e0a6080e.jpg' },
  { name: 'Red Mushroom', file: 'media_1792223749573_2e5d8cdc.jpg' },
  { name: 'Sweet Corn', file: 'media_1792223749586_ff750d9a.jpg' },
  { name: 'Bell Peppers', file: 'media_1792223749641_3a03d622.jpg' },
  { name: 'Oranges', file: 'media_1792223749634_8c16456e.jpg' },
  { name: 'Broccoli', file: 'media_1792223749716_42f04f70.jpg' },
];

const userDir = 'C:/Users/D-Legion/.gemini/antigravity/brain/a8567372-b5dc-43ba-af75-0c6e4182b26e/.user_uploaded';

async function run() {
  await tf.ready();
  console.log('Loading MobileNet V3 Large...');
  const model = await tf.loadGraphModel('https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_large_100_224/classification/5/default/1', { fromTFHub: true });
  console.log('MobileNet V3 Large loaded.');

  for (const item of testImages) {
    const fullPath = path.join(userDir, item.file);
    const meta = await sharp(fullPath).metadata();
    
    const cropLeft = Math.round(meta.width * 0.05);
    const cropTop = Math.round(meta.height * 0.19);
    const cropWidth = Math.round(meta.width * 0.90);
    const cropHeight = Math.round(meta.height * 0.25);

    const { data } = await sharp(fullPath)
      .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
      .resize(224, 224, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Normalize to [-1, 1] or [0, 1] as float32
    // For mobilenet v3, input is typically normalized to [0, 1]
    const imgTensor = tf.tidy(() => {
      const t = tf.tensor3d(new Uint8Array(data), [224, 224, 3], 'float32');
      return t.div(255.0).expandDims(0);
    });

    const pred1001 = model.predict(imgTensor);
    const data1001 = await pred1001.data();
    imgTensor.dispose();
    pred1001.dispose();

    // Map 10 produce classes
    // Note: ImageNet class idx 0..999 is at position idx + 1
    const produceLogits = PREDEFINED_PRODUCE.map(p => {
      const maxL = Math.max(...p.indices.map(idx => data1001[idx + 1]));
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
    console.log(`V3 RESULT: ${item.name}`);
    rankedProduce.slice(0, 3).forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.name}: ${(r.prob * 100).toFixed(1)}% (logit: ${r.logit.toFixed(3)})`);
    });
  }
}

run().catch(console.error);
