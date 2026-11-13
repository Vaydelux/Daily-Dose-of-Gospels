/**
 * Generate PWA icons from a premium master design.
 *
 * Design: deep-navy radial gradient "night sanctuary", a soft gold halo,
 * a thin scripture ring, and a gradient-gold Latin cross with rounded caps.
 *
 * Variants:
 *   - icon-192.png / icon-512.png   rounded-square (any purpose)
 *   - maskable-512.png              full-bleed square, content in safe zone
 *   - apple-touch-icon.png          180px full-bleed square (iOS rounds it)
 *
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("public/icons");
await mkdir(OUT_DIR, { recursive: true });

/** Build the master SVG at a given size. */
function masterSvg({ size, rx, scale = 1, glow = 1 }) {
  const s = size;
  const u = s / 512; // unit scale relative to 512 design
  const cx = s / 2;
  const cy = s / 2;

  // Cross geometry (centered, Latin proportions), scaled by `scale`
  const vTop = cy - 136 * u * scale;
  const vBot = cy + 152 * u * scale;
  const hLeft = cx - 80 * u * scale;
  const hRight = cx + 80 * u * scale;
  const hY = cy - 26 * u * scale;
  const sw = 34 * u * scale;

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="36%" r="80%">
      <stop offset="0%"  stop-color="#3D4F84"/>
      <stop offset="52%" stop-color="#2A3A66"/>
      <stop offset="100%" stop-color="#1C2947"/>
    </radialGradient>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="${s * 0.18}" x2="0" y2="${s * 0.84}">
      <stop offset="0%"  stop-color="#F1CE83"/>
      <stop offset="55%" stop-color="#D7A748"/>
      <stop offset="100%" stop-color="#B98B33"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="44%" r="50%">
      <stop offset="0%"   stop-color="#E8B64C" stop-opacity="${0.5 * glow}"/>
      <stop offset="55%"  stop-color="#E8B64C" stop-opacity="${0.16 * glow}"/>
      <stop offset="100%" stop-color="#E8B64C" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${s}" height="${s}" rx="${rx}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${252 * u * scale > 0 ? 250 * u : 250 * u}" fill="url(#halo)"/>
  <circle cx="${cx}" cy="${cy}" r="${196 * u * scale}"
          fill="none" stroke="#E8B64C" stroke-opacity="0.30" stroke-width="${3 * u}"/>
  <circle cx="${cx}" cy="${cy}" r="${214 * u * scale}"
          fill="none" stroke="#E8B64C" stroke-opacity="0.10" stroke-width="${1.5 * u}"/>

  <g stroke="url(#gold)" stroke-width="${sw}" stroke-linecap="round">
    <line x1="${cx}" y1="${vTop}" x2="${cx}" y2="${vBot}"/>
    <line x1="${hLeft}" y1="${hY}" x2="${hRight}" y2="${hY}"/>
  </g>
</svg>`);
}

const jobs = [
  { file: "icon-192.png", size: 192, rx: 0.22 * 192, scale: 1, glow: 1 },
  { file: "icon-512.png", size: 512, rx: 0.22 * 512, scale: 1, glow: 1 },
  // Maskable: full bleed, content pulled into the 80% safe zone
  { file: "maskable-512.png", size: 512, rx: 0, scale: 0.8, glow: 0.9 },
  // Apple touch: full bleed square, iOS applies its own mask
  { file: "apple-touch-icon.png", size: 180, rx: 0, scale: 0.92, glow: 1 },
];

for (const j of jobs) {
  const svg = masterSvg({ size: j.size, rx: j.rx, scale: j.scale, glow: j.glow });
  await sharp(svg).png({ compressionLevel: 9 }).toFile(path.join(OUT_DIR, j.file));
  const meta = await sharp(path.join(OUT_DIR, j.file)).metadata();
  console.log(`wrote ${j.file}  ${meta.width}x${meta.height}`);
}
console.log("done");
