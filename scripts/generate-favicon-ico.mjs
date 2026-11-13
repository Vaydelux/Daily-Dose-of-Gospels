/**
 * Generate a multi-size hyper-realistic favicon.ico from a high-res master image.
 * Sizes: 16, 32, 48, 64, 128, 256 — embedded as PNG entries inside the ICO container.
 *
 * Run: node scripts/generate-favicon-ico.mjs <path-to-master-image>
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const masterPath =
  process.argv[2] ||
  path.resolve(process.cwd(), "public/icons/icon-512.png");

const SIZES = [16, 32, 48, 64, 128, 256];

const pngs = [];
for (const s of SIZES) {
  // Apply a subtle circular mask so the medallion sits cleanly on browser tabs
  const circleMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
      <circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.48}" fill="#fff"/>
    </svg>`
  );

  const resized = await sharp(masterPath)
    .resize(s, s, {
      kernel: sharp.kernel.lanczos3,
      fit: "cover",
    })
    .sharpen(s <= 48 ? { sigma: 0.6 } : { sigma: 0.4 })
    .ensureAlpha()
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  pngs.push({ size: s, buf: resized });
  console.log(`rendered ${s}x${s} (${resized.length} bytes)`);
}

// Pack PNGs into an ICO container.
const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(count, 4);

const entries = [];
let offset = 6 + 16 * count;
for (const { size, buf } of pngs) {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0); // width (0 encodes 256)
  e.writeUInt8(size === 256 ? 0 : size, 1); // height (0 encodes 256)
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  entries.push(e);
  offset += buf.length;
}

const ico = Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
await writeFile("public/favicon.ico", ico);
console.log(`wrote public/favicon.ico (${ico.length} bytes, ${count} sizes)`);
