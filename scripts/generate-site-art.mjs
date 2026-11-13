/**
 * Generate the site's art collection — one consistent palette:
 * deep-navy night, warm gold light, painterly cinematic style.
 *
 *  1. cross-dawn.png        1440x720  — cross on a hill at golden dawn (faith hero / declaration band)
 *  2. light-over-water.png  1344x768  — light breaking through clouds over the sea (John 8:12)
 *  3. the-good-shepherd.png 1344x768  — shepherd carrying a lamb (John 10:11)
 *  4. open-scripture.png    1344x768  — open Bible in candlelight (Psalm 119:105)
 *
 * Run: node scripts/generate-site-art.mjs
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("src/images");
fs.mkdirSync(OUT_DIR, { recursive: true });

const STYLE =
  "painterly cinematic digital art, deep navy blue night tones with warm golden light, soft brush strokes, reverent and hopeful atmosphere, no text, no people faces in focus, high quality, detailed, masterpiece";

const JOBS = [
  {
    file: "cross-dawn.png",
    size: "1440x704",
    prompt: `A simple wooden cross standing on a quiet hill at dawn, first golden rays of sunrise breaking through deep navy blue clouds, rays of light shining down on the hill, distant calm landscape below, ${STYLE}`,
  },
  {
    file: "light-over-water.png",
    size: "1344x768",
    prompt: `Golden morning sunlight streaming through parting storm clouds over a calm deep-blue sea, one brilliant beam of light touching the water surface like a path, gentle waves glinting with gold, ${STYLE}`,
  },
  {
    file: "the-good-shepherd.png",
    size: "1344x768",
    prompt: `A gentle shepherd seen from behind carrying a small lamb on his shoulders, walking a hillside path in warm golden evening light, staff in hand, deep blue mountain shadows, flock resting in the distance, ${STYLE}`,
  },
  {
    file: "open-scripture.png",
    size: "1344x768",
    prompt: `An open ancient Bible resting on a wooden table, pages glowing softly in warm golden candlelight, a small brass oil lamp beside it, deep blue night visible through a window behind, quiet reverent stillness, ${STYLE}`,
  },
];

const zai = await ZAI.create();

for (const job of JOBS) {
  const outPath = path.join(OUT_DIR, job.file);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 100_000) {
    console.log(`skip ${job.file} (exists)`);
    continue;
  }
  let done = false;
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      const res = await zai.images.generations.create({ prompt: job.prompt, size: job.size });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("empty response");
      const buf = Buffer.from(b64, "base64");
      if (buf.length < 50_000) throw new Error(`suspiciously small (${buf.length}B)`);
      fs.writeFileSync(outPath, buf);
      console.log(`wrote ${job.file} (${(buf.length / 1024).toFixed(0)} KB)`);
      done = true;
    } catch (err) {
      console.error(`attempt ${attempt} failed for ${job.file}: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  if (!done) {
    console.error(`FAILED ${job.file}`);
    process.exitCode = 1;
  }
}
console.log("done");
