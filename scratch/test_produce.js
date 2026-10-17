const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const sharp = require('sharp');
const path = require('path');

const PREDEFINED_PRODUCE = [
  { id: 'apple', name: 'Apple', indices: [948, 957], label: 'Granny Smith / pomegranate (#948/#957)' },
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

const newImages = [
  { name: 'Red Mushroom', file: 'media_1792223749573_2e5d8cdc.jpg' },
  { name: 'Sweet Corn', file: 'media_1792223749586_ff750d9a.jpg' },
  { name: 'Bell Peppers', file: 'media_1792223749641_3a03d622.jpg' },
  { name: 'Oranges', file: 'media_1792223749634_8c16456e.jpg' },
  { name: 'Broccoli', file: 'media_1792223749716_42f04f70.jpg' },
];

const userDir = 'C:/Users/D-Legion/.gemini/antigravity/brain/a8567372-b5dc-43ba-af75-0c6e4182b26e/.user_uploaded';

async function run() {
  await tf.ready();
  const model = await mobilenet.load({ version: 2, alpha: 1.0 });

  for (const item of newImages) {
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

    const imgTensor = tf.tensor3d(new Uint8Array(data), [224, 224, 3], 'int32');
    const top5All = await model.classify(imgTensor, 5);

    const logitsTensor = model.infer(imgTensor);
    const rawLogits = await logitsTensor.data();
    imgTensor.dispose();
    logitsTensor.dispose();

    const produceLogits = PREDEFINED_PRODUCE.map(p => {
      const maxL = Math.max(...p.indices.map(idx => rawLogits[idx]));
      return { ...p, logit: maxL };
    });

    const maxLogit = Math.max(...produceLogits.map(p => p.logit));
    const exps = produceLogits.map(p => Math.exp(p.logit - maxLogit));
    const sumExps = exps.reduce((acc, val) => acc + val, 0);
    const rankedProduce = produceLogits.map((p, i) => ({
      name: p.name,
      prob: exps[i] / sumExps,
      logit: p.logit,
    })).sort((a, b) => b.prob - a.prob);

    console.log(`\n========================================`);
    console.log(`IMAGE: ${item.name}`);
    console.log(`Raw Top 5 ImageNet:`, top5All.map(t => `${t.className} (${(t.probability * 100).toFixed(1)}%)`).join(' | '));
    console.log(`Pure 10-Class Softmax (NO PRIORS):`);
    rankedProduce.slice(0, 4).forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.name}: ${(r.prob * 100).toFixed(1)}% (logit: ${r.logit.toFixed(2)})`);
    });
  }
}

run().catch(console.error);
