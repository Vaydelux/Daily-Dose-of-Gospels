/**
 * Sacred art atelier — Daily Dose of Gospels.
 *
 * Two families of pieces, one design language (deep navy + gold foil):
 *
 *  1. SIX ALBUM COVERS (1:1 SVG, overwrites public/covers/*.svg so the DB
 *     needs no migration). Shared ornamental chrome + a bespoke motif per
 *     track, each motif drawn from the track's own scripture:
 *       morning-has-spoken        Psalm 5:3     dawn over still horizon
 *       still-waters              Psalm 23:2    disc above quiet ripples
 *       the-shepherds-path        John 10:14    dotted path, crook, guiding star
 *       light-through-the-window  Matthew 5:16  gothic window shining outward
 *       anchor-in-the-deep        Hebrews 6:19  anchor amid waves
 *       harvest-of-peace          Phil 4:7      wheat sheaf
 *
 *  2. THREE GALLERY PIECES (2:3 PNG via sharp, for src/images + next/image):
 *       stained-glass-cross.png   Galatians 6:14
 *       alpha-omega.png           Revelation 1:8
 *       living-waters.png         John 7:38
 *
 * All quotations are Scripture (KJV) only. Run: node scripts/generate-sacred-art.mjs
 */
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const COVERS_DIR = path.resolve("public/covers");
const IMAGES_DIR = path.resolve("src/images");
await mkdir(COVERS_DIR, { recursive: true });
await mkdir(IMAGES_DIR, { recursive: true });

/* ---------------- palette (site tokens) ---------------- */
const NAVY = { hi: "#3D4F84", mid: "#2A3A66", deep: "#1C2947", deepest: "#0F1930" };
const GOLD = { pale: "#F6DFA9", light: "#E9C87F", mid: "#D7A748", deep: "#B98B33", ink: "#A87E2E" };
const CREAM = "#F3E9D2";

/* ---------------- helpers ---------------- */
const rad = (deg) => ((deg - 90) * Math.PI) / 180;
const pt = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
const n = (v) => Math.round(v * 100) / 100;
const pol = (cx, cy, r, deg) => {
  const [x, y] = pt(cx, cy, r, deg);
  return `${n(x)},${n(y)}`;
};

function star4(cx, cy, r, fill = "url(#foil)", inner = 0.3, rot = 0, extra = "") {
  const pts = [];
  for (let i = 0; i < 8; i++) pts.push(pol(cx, cy, i % 2 === 0 ? r : r * inner, rot + i * 45));
  return `<polygon points="${pts.join(" ")}" fill="${fill}" ${extra}/>`;
}

function line(x1, y1, x2, y2, stroke, w, extra = "") {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
}

/* ---------------- shared defs ---------------- */
function defs() {
  return `<defs>
  <radialGradient id="bg" cx="50%" cy="33%" r="88%">
    <stop offset="0%" stop-color="#3A4C80"/>
    <stop offset="42%" stop-color="${NAVY.mid}"/>
    <stop offset="78%" stop-color="${NAVY.deep}"/>
    <stop offset="100%" stop-color="${NAVY.deepest}"/>
  </radialGradient>
  <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${GOLD.pale}"/>
    <stop offset="34%" stop-color="${GOLD.light}"/>
    <stop offset="62%" stop-color="${GOLD.mid}"/>
    <stop offset="100%" stop-color="${GOLD.ink}"/>
  </linearGradient>
  <linearGradient id="foilV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${GOLD.pale}"/>
    <stop offset="55%" stop-color="${GOLD.mid}"/>
    <stop offset="100%" stop-color="${GOLD.deep}"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#F1CE83" stop-opacity="0.42"/>
    <stop offset="52%" stop-color="#D7A748" stop-opacity="0.13"/>
    <stop offset="100%" stop-color="#D7A748" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vign" cx="50%" cy="45%" r="74%">
    <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#050A16" stop-opacity="0.58"/>
  </radialGradient>
</defs>`;
}

/* ---------------- ornamental chrome ----------------
 * Ring system centered at (600, 460); typography plate below.        */
const CX = 600;
const CY = 460;

function ringChrome() {
  let s = "";
  // backdrop
  s += `<rect width="1200" height="1200" fill="url(#bg)"/>`;

  // faint radiance behind the ring
  s += `<circle cx="${CX}" cy="${CY}" r="430" fill="url(#glow)" opacity="0.5"/>`;

  // very subtle rays (every 15deg), reaching from inner hairline outward
  for (let d = 0; d < 360; d += 15) {
    const [x1, y1] = pt(CX, CY, 306, d);
    const [x2, y2] = pt(CX, CY, 378, d);
    s += line(x1, y1, x2, y2, GOLD.mid, 1, `opacity="0.14"`);
  }

  // ring system
  s += `<circle cx="${CX}" cy="${CY}" r="398" fill="none" stroke="${GOLD.mid}" stroke-width="1.4" opacity="0.5"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="376" fill="none" stroke="url(#foil)" stroke-width="3"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="362" fill="none" stroke="${GOLD.mid}" stroke-width="1.2" opacity="0.45"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="300" fill="none" stroke="${GOLD.light}" stroke-width="1" opacity="0.20"/>`;

  // tick marks between 362 and 376
  for (let d = 0; d < 360; d += 6) {
    const major = d % 30 === 0;
    const [x1, y1] = pt(CX, CY, major ? 354 : 360, d);
    const [x2, y2] = pt(CX, CY, 374, d);
    s += line(x1, y1, x2, y2, GOLD.light, major ? 2.4 : 1.1, `opacity="${major ? 0.85 : 0.5}"`);
  }

  // compass stars at N/E/S/W on the outer hairline
  for (const d of [0, 90, 180, 270]) {
    const [x, y] = pt(CX, CY, 398, d);
    s += star4(x, y, 14, "url(#foil)", 0.34);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="2.4" fill="${NAVY.deepest}"/>`;
  }

  // corner filigree (double L) + corner stars
  const corner = (x, y, sx, sy) => {
    let c = "";
    c += `<path d="M ${x + 34 * sx} ${y} H ${x} V ${y + 34 * sy}" fill="none" stroke="${GOLD.mid}" stroke-width="2" opacity="0.55"/>`;
    c += `<path d="M ${x + 58 * sx} ${y + 7 * sy} H ${x + 7 * sx} V ${y + 58 * sy}" fill="none" stroke="${GOLD.mid}" stroke-width="1.1" opacity="0.35"/>`;
    c += star4(x + 17 * sx, y + 17 * sy, 6, GOLD.light, 0.32);
    return c;
  };
  s += corner(46, 46, 1, 1) + corner(1154, 46, -1, 1) + corner(46, 1154, 1, -1) + corner(1154, 1154, -1, -1);

  return s;
}

function typographyPlate(title, ref) {
  let s = "";
  // ornament: hairline — star — hairline
  s += line(430, 886, 560, 886, GOLD.mid, 1.2, 'opacity="0.75"');
  s += line(640, 886, 770, 886, GOLD.mid, 1.2, 'opacity="0.75"');
  s += star4(600, 886, 11, "url(#foil)", 0.3);
  // title
  s += `<text x="600" y="960" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="49" letter-spacing="7" fill="${CREAM}">${title.toUpperCase()}</text>`;
  // scripture reference
  s += `<text x="600" y="1006" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="21" letter-spacing="9" fill="${GOLD.light}">${ref.toUpperCase()}</text>`;
  // wordmark
  s += `<text x="600" y="1088" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="14" letter-spacing="11" fill="${CREAM}" opacity="0.48">DAILY DOSE OF GOSPELS</text>`;
  // vignette last
  s += `<rect width="1200" height="1200" fill="url(#vign)"/>`;
  return s;
}

/* ---------------- motifs ---------------- */

function motifMorning() {
  const HZ = 560;
  let s = "";
  s += `<circle cx="600" cy="${HZ - 60}" r="240" fill="url(#glow)"/>`;
  // sun — half disc rising
  s += `<path d="M 495 ${HZ} A 105 105 0 0 1 705 ${HZ} Z" fill="url(#foilV)"/>`;
  s += `<path d="M 515 ${HZ} A 85 85 0 0 1 685 ${HZ}" fill="none" stroke="${NAVY.deep}" stroke-width="2" opacity="0.28"/>`;
  // rays fan above
  for (let d = -78; d <= 78; d += 13) {
    const [x1, y1] = pt(600, HZ, 122, d);
    const [x2, y2] = pt(600, HZ, d % 26 === 0 ? 168 : 150, d);
    s += line(x1, y1, x2, y2, GOLD.light, d % 26 === 0 ? 2.6 : 1.4, `opacity="0.85"`);
  }
  // horizon + echo hairlines
  s += line(330, HZ, 870, HZ, "url(#foil)", 3);
  s += line(430, HZ + 16, 770, HZ + 16, GOLD.mid, 1.4, 'opacity="0.5"');
  s += line(500, HZ + 30, 700, HZ + 30, GOLD.mid, 1.1, 'opacity="0.3"');
  // reflection dashes widening downward
  const refl = [[90, 596], [130, 622], [176, 650], [216, 680]];
  for (const [len, y] of refl) {
    s += line(600 - len / 2, y, 600 + len / 2, y, GOLD.light, 2, 'opacity="0.4"');
  }
  // sparkles
  s += star4(418, 330, 11, GOLD.light, 0.3, 12) + star4(776, 292, 15, "url(#foil)", 0.3, 0) + star4(694, 386, 7, GOLD.light, 0.3, 20);
  return s;
}

function motifStillWaters() {
  let s = "";
  s += `<circle cx="600" cy="330" r="220" fill="url(#glow)"/>`;
  // full moon-sun disc
  s += `<circle cx="600" cy="330" r="80" fill="url(#foilV)"/>`;
  s += `<circle cx="600" cy="330" r="64" fill="none" stroke="${NAVY.deep}" stroke-width="2" opacity="0.25"/>`;
  s += `<circle cx="600" cy="330" r="94" fill="none" stroke="${GOLD.light}" stroke-width="1.3" opacity="0.55"/>`;
  // horizon
  s += line(310, 470, 890, 470, "url(#foil)", 3);
  // concentric ripples
  const rips = [70, 124, 178, 228, 272];
  rips.forEach((rx, k) => {
    const op = 0.6 - k * 0.1;
    s += `<ellipse cx="600" cy="560" rx="${rx}" ry="${rx * 0.36}" fill="none" stroke="${GOLD.light}" stroke-width="${k === 0 ? 2.4 : 1.8}" opacity="${op}"/>`;
  });
  // accent dashes on ripples
  s += line(430, 560, 490, 560, GOLD.light, 2, 'opacity="0.5"') + line(710, 560, 770, 560, GOLD.light, 2, 'opacity="0.5"');
  s += line(370, 620, 450, 620, GOLD.light, 1.6, 'opacity="0.32"') + line(750, 620, 830, 620, GOLD.light, 1.6, 'opacity="0.32"');
  s += line(530, 682, 670, 682, GOLD.light, 1.4, 'opacity="0.2"');
  // sparkles
  s += star4(452, 236, 10, GOLD.light, 0.3, 10) + star4(742, 250, 13, "url(#foil)", 0.3, 0);
  return s;
}

function motifShepherdsPath() {
  let s = "";
  s += `<circle cx="600" cy="330" r="200" fill="url(#glow)"/>`;
  // guiding star
  s += star4(600, 300, 34, "url(#foil)", 0.32);
  s += star4(600, 300, 58, "none", 0) ; // no-op spacing
  s += `<circle cx="600" cy="300" r="52" fill="none" stroke="${GOLD.light}" stroke-width="1.2" opacity="0.5"/>`;
  // rolling hills (line art)
  s += `<path d="M 300 700 Q 450 620 600 664 T 900 700" fill="none" stroke="${GOLD.mid}" stroke-width="2.2" opacity="0.55"/>`;
  s += `<path d="M 280 764 Q 470 668 640 724 T 920 758" fill="none" stroke="${GOLD.mid}" stroke-width="2" opacity="0.38"/>`;
  s += `<path d="M 300 826 Q 500 730 700 786 T 900 812" fill="none" stroke="${GOLD.mid}" stroke-width="1.8" opacity="0.24"/>`;
  // winding dotted path — stones from bottom toward the hill crest under the star
  const stones = [
    [566, 788, 7], [588, 756, 6.5], [560, 724, 6], [586, 694, 5.5],
    [564, 666, 5], [588, 640, 4.5], [572, 616, 4], [592, 594, 3.5], [598, 574, 3],
  ];
  for (const [x, y, r] of stones) {
    s += `<ellipse cx="${x}" cy="${y}" rx="${r * 1.7}" ry="${r * 0.62}" fill="url(#foil)" opacity="0.9"/>`;
  }
  // shepherd's crook on the right
  s += `<path d="M 756 772 L 756 560 Q 756 496 700 496 Q 656 496 656 540 Q 656 570 682 576" fill="none" stroke="url(#foil)" stroke-width="9" stroke-linecap="round"/>`;
  s += `<path d="M 745 772 L 745 566 Q 745 508 700 508" fill="none" stroke="${GOLD.pale}" stroke-width="1.6" opacity="0.6"/>`;
  // sparkles
  s += star4(430, 382, 9, GOLD.light, 0.3, 14) + star4(760, 356, 11, "url(#foil)", 0.3, 0);
  return s;
}

function motifWindow() {
  let s = "";
  s += `<circle cx="600" cy="430" r="250" fill="url(#glow)" opacity="0.9"/>`;
  // outward light rays (let your light shine)
  const rays = [-56, -28, 0, 28, 56];
  for (const d of rays) {
    const [ax, ay] = pt(600, 430, 150, d);
    const [bx, by] = pt(600, 430, 330, d - 4);
    const [cx2, cy2] = pt(600, 430, 330, d + 4);
    s += `<polygon points="${n(ax)},${n(ay)} ${n(bx)},${n(by)} ${n(cx2)},${n(cy2)}" fill="${GOLD.pale}" opacity="0.07"/>`;
  }
  // gothic arched window
  const win = `M 468 648 L 468 396 Q 468 268 600 218 Q 732 268 732 396 L 732 648 Z`;
  s += `<path d="${win}" fill="${GOLD.pale}" opacity="0.14"/>`;
  s += `<path d="${win}" fill="none" stroke="url(#foil)" stroke-width="4"/>`;
  // inner arch
  s += `<path d="M 490 648 L 490 404 Q 490 288 600 244 Q 710 288 710 404 L 710 648" fill="none" stroke="${GOLD.mid}" stroke-width="1.6" opacity="0.55"/>`;
  // mullions + transoms
  s += line(600, 224, 600, 648, GOLD.mid, 2.6, 'opacity="0.7"');
  s += line(468, 396, 732, 396, GOLD.mid, 2.2, 'opacity="0.65"');
  s += line(468, 508, 732, 508, GOLD.mid, 2.2, 'opacity="0.65"');
  // quatrefoil at crossing
  s += `<circle cx="600" cy="396" r="24" fill="none" stroke="${GOLD.light}" stroke-width="1.8" opacity="0.8"/>`;
  s += `<circle cx="600" cy="396" r="8" fill="url(#foil)"/>`;
  // glass diamonds glow
  s += star4(600, 300, 13, GOLD.pale, 0.34, 0, 'opacity="0.85"');
  s += star4(548, 456, 8, GOLD.pale, 0.34, 12, 'opacity="0.6"') + star4(652, 560, 9, GOLD.pale, 0.34, 0, 'opacity="0.5"');
  // sill
  s += line(360, 648, 840, 648, "url(#foil)", 3);
  s += line(430, 668, 770, 668, GOLD.mid, 1.3, 'opacity="0.4"');
  // sparkles
  s += star4(410, 300, 10, GOLD.light, 0.3, 8) + star4(790, 268, 12, "url(#foil)", 0.3, 0);
  return s;
}

function motifAnchor() {
  let s = "";
  s += `<circle cx="600" cy="450" r="240" fill="url(#glow)"/>`;
  // rope from above
  s += `<path d="M 600 178 Q 578 224 600 262 Q 620 296 600 330" fill="none" stroke="${GOLD.mid}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>`;
  s += `<path d="M 600 178 Q 578 224 600 262 Q 620 296 600 330" fill="none" stroke="${GOLD.pale}" stroke-width="1.4" stroke-dasharray="2 9" opacity="0.7"/>`;
  // ring
  s += `<circle cx="600" cy="356" r="24" fill="none" stroke="url(#foil)" stroke-width="9"/>`;
  // shank
  s += line(600, 380, 600, 592, "url(#foil)", 10);
  // stock with diamond ends
  s += line(516, 428, 684, 428, "url(#foil)", 8);
  s += star4(506, 428, 13, "url(#foil)", 0.4) + star4(694, 428, 13, "url(#foil)", 0.4);
  // crown arc + flukes
  s += `<path d="M 470 512 A 130 130 0 0 0 730 512" fill="none" stroke="url(#foil)" stroke-width="10" stroke-linecap="round"/>`;
  s += `<polygon points="470,512 428,500 458,462" fill="url(#foil)"/>`;
  s += `<polygon points="730,512 772,500 742,462" fill="url(#foil)"/>`;
  s += star4(600, 480, 12, GOLD.pale, 0.32, 0, 'opacity="0.9"');
  // waves beneath
  s += `<path d="M 380 640 Q 430 618 480 640 T 580 640 T 680 640 T 780 640" fill="none" stroke="${GOLD.light}" stroke-width="2.4" opacity="0.55"/>`;
  s += `<path d="M 420 686 Q 470 666 520 686 T 620 686 T 720 686" fill="none" stroke="${GOLD.light}" stroke-width="2" opacity="0.36"/>`;
  // sparkles
  s += star4(428, 300, 10, GOLD.light, 0.3, 10) + star4(774, 330, 12, "url(#foil)", 0.3, 0);
  return s;
}

function motifHarvest() {
  let s = "";
  s += `<circle cx="600" cy="430" r="230" fill="url(#glow)"/>`;
  // sheaf: stalks fanning from a tie point
  const heads = [-84, -56, -28, 0, 28, 56, 84];
  for (const d of heads) {
    const [tx, ty] = pt(600, 300, 0, 0); // anchor unused
    const ex = 600 + d * 1.65;
    const ey = 292 - Math.abs(d) * 0.32;
    s += `<path d="M 600 726 Q ${600 + d * 0.7} 520 ${n(ex)} ${n(ey)}" fill="none" stroke="url(#foil)" stroke-width="4.4" stroke-linecap="round" opacity="${d === 0 ? 1 : 0.88}"/>`;
    // grain head: alternating grains along the top segment
    const ang = Math.atan2(ey - 520, ex - (600 + d * 0.7));
    for (let g = 0; g < 6; g++) {
      const t = g / 5;
      const gx = ex - Math.cos(ang) * 84 * t;
      const gy = ey - Math.sin(ang) * 84 * t;
      const side = g % 2 === 0 ? 1 : -1;
      const a = ang + side * 1.15;
      s += `<ellipse cx="${n(gx + Math.cos(a) * 10)}" cy="${n(gy + Math.sin(a) * 10)}" rx="6" ry="13.5" transform="rotate(${n((a * 180) / Math.PI + 90)} ${n(gx + Math.cos(a) * 10)} ${n(gy + Math.sin(a) * 10)})" fill="url(#foilV)" opacity="0.92"/>`;
    }
    // awn needle
    s += line(ex, ey, ex - Math.cos(ang) * 34, ey - Math.sin(ang) * 34, GOLD.light, 1.6, 'opacity="0.8"');
  }
  // tie band
  s += line(560, 726, 640, 748, "url(#foil)", 5);
  s += line(640, 726, 560, 748, "url(#foil)", 5);
  // ground hairline
  s += `<path d="M 400 790 Q 600 762 800 790" fill="none" stroke="${GOLD.mid}" stroke-width="2" opacity="0.5"/>`;
  // sparkles
  s += star4(430, 320, 10, GOLD.light, 0.3, 10) + star4(768, 296, 13, "url(#foil)", 0.3, 0) + star4(662, 392, 7, GOLD.light, 0.3, 18);
  return s;
}

/* ---------------- build covers ---------------- */
const COVERS = [
  ["morning-has-spoken", "Morning Has Spoken", "Psalm 5 : 3", motifMorning],
  ["still-waters", "Still Waters", "Psalm 23 : 2", motifStillWaters],
  ["the-shepherds-path", "The Shepherd's Path", "John 10 : 14", motifShepherdsPath],
  ["light-through-the-window", "Light Through the Window", "Matthew 5 : 16", motifWindow],
  ["anchor-in-the-deep", "Anchor in the Deep", "Hebrews 6 : 19", motifAnchor],
  ["harvest-of-peace", "Harvest of Peace", "Philippians 4 : 7", motifHarvest],
];

for (const [slug, title, ref, motif] of COVERS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
${defs()}
${ringChrome()}
${motif()}
${typographyPlate(title, ref)}
</svg>`;
  await writeFile(path.join(COVERS_DIR, `${slug}.svg`), svg, "utf8");
  console.log("cover:", slug);
}

/* ================================================================
 * GALLERY PIECES (2:3, rendered to PNG for next/image + blur)
 * ============================================================== */

const serif = `font-family="'DejaVu Serif', Georgia, serif"`;

function refCaption(x, y, ref, fragment) {
  return `<text x="${x}" y="${y}" text-anchor="middle" ${serif} font-size="26" letter-spacing="8" fill="${GOLD.light}">${ref.toUpperCase()}</text>
  <text x="${x}" y="${y + 42}" text-anchor="middle" ${serif} font-size="21" letter-spacing="2" fill="${CREAM}" opacity="0.82">${fragment}</text>`;
}

function galleryFrame(W, H) {
  let s = "";
  s += `<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${GOLD.mid}" stroke-width="2.4" opacity="0.65"/>`;
  s += `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${GOLD.mid}" stroke-width="1" opacity="0.35"/>`;
  const corner = (x, y, sx, sy) =>
    star4(x + 14 * sx, y + 14 * sy, 9, GOLD.light, 0.32);
  s += corner(26, 26, 1, 1) + corner(W - 26, 26, -1, 1) + corner(26, H - 26, 1, -1) + corner(W - 26, H - 26, -1, -1);
  return s;
}

async function renderPng(svg, out, w, h) {
  await sharp(Buffer.from(svg)).resize(w, h).png({ compressionLevel: 9 }).toFile(out);
  console.log("png:", path.basename(out));
}

/* --- 1. stained glass cross — Galatians 6:14 --- */
async function stainedGlassCross() {
  const W = 1200, H = 900, cx = 600, cy = 430;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="80%">
    <stop offset="0%" stop-color="#32476F"/><stop offset="55%" stop-color="#22335A"/><stop offset="100%" stop-color="#121E3A"/>
  </radialGradient>
  <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${GOLD.pale}"/><stop offset="50%" stop-color="${GOLD.mid}"/><stop offset="100%" stop-color="${GOLD.ink}"/>
  </linearGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#F1CE83" stop-opacity="0.5"/><stop offset="60%" stop-color="#D7A748" stop-opacity="0.12"/><stop offset="100%" stop-color="#D7A748" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vign" cx="50%" cy="46%" r="74%">
    <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="72%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#050A16" stop-opacity="0.5"/>
  </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>`;

  // leadlight panes: 14 wedges x 3 radii
  const panes = ["#3D4F84", "#2A3A66", "#32476F", "#24365C"];
  for (let ring = 0; ring < 3; ring++) {
    const r0 = 130 + ring * 120, r1 = r0 + 120;
    for (let i = 0; i < 14; i++) {
      const a0 = (i * 360) / 14, a1 = ((i + 1) * 360) / 14;
      const [x0, y0] = pt(cx, cy, r0, a0);
      const [x1, y1] = pt(cx, cy, r1, a0);
      const [x2, y2] = pt(cx, cy, r1, a1);
      const large = a1 - a0 > 180 ? 1 : 0;
      s += `<path d="M ${n(x0)} ${n(y0)} L ${n(x1)} ${n(y1)} A ${r1} ${r1} 0 ${large} 1 ${n(x2)} ${n(y2)} ${r0 === 130 ? `A ${r0} ${r0} 0 0 0 ${pol(cx, cy, r0, a1)}` : ""} Z" fill="${panes[(i + ring) % 4]}" opacity="${0.5 - ring * 0.08}"/>`;
    }
  }
  // lead lines
  for (let i = 0; i < 14; i++) {
    const [x, y] = pt(cx, cy, 490, (i * 360) / 14);
    s += line(cx, cy, x, y, "#0D1630", 3, 'opacity="0.55"');
  }
  s += `<circle cx="${cx}" cy="${cy}" r="130" fill="none" stroke="#0D1630" stroke-width="3" opacity="0.55"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="250" fill="none" stroke="#0D1630" stroke-width="3" opacity="0.5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="370" fill="none" stroke="#0D1630" stroke-width="3" opacity="0.5"/>`;

  // light rays behind cross
  for (const d of [0, 45, 90, 135, 180, 225, 270, 315]) {
    const [bx, by] = pt(cx, cy, 120, d);
    const [ex, ey] = pt(cx, cy, 560, d - 5);
    const [fx, fy] = pt(cx, cy, 560, d + 5);
    s += `<polygon points="${n(bx)},${n(by)} ${n(ex)},${n(ey)} ${n(fx)},${n(fy)}" fill="${GOLD.pale}" opacity="0.06"/>`;
  }

  // gold cross with halo
  s += `<circle cx="${cx}" cy="${cy}" r="235" fill="url(#halo)"/>`;
  s += `<rect x="${cx - 31}" y="${cy - 205}" width="62" height="410" rx="22" fill="url(#foil)"/>`;
  s += `<rect x="${cx - 125}" y="${cy - 72}" width="250" height="62" rx="22" fill="url(#foil)"/>`;
  s += `<rect x="${cx - 19}" y="${cy - 193}" width="12" height="386" rx="6" fill="${GOLD.pale}" opacity="0.55"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${GOLD.light}" stroke-width="2" opacity="0.5"/>`;

  s += galleryFrame(W, H);
  s += refCaption(cx, H - 96, "Galatians 6 : 14", "But God forbid that I should glory, save in the cross");
  s += `<rect width="${W}" height="${H}" fill="url(#vign)"/></svg>`;
  await renderPng(s, path.join(IMAGES_DIR, "stained-glass-cross.png"), 2400, 1800);
}

/* --- 2. alpha omega — Revelation 1:8 --- */
async function alphaOmega() {
  const W = 1200, H = 900, cx = 600, cy = 420;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>
  <radialGradient id="bg" cx="50%" cy="40%" r="82%">
    <stop offset="0%" stop-color="#2E4070"/><stop offset="55%" stop-color="#1F2F56"/><stop offset="100%" stop-color="#0F1830"/>
  </radialGradient>
  <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${GOLD.pale}"/><stop offset="50%" stop-color="${GOLD.mid}"/><stop offset="100%" stop-color="${GOLD.ink}"/>
  </linearGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#F1CE83" stop-opacity="0.45"/><stop offset="100%" stop-color="#D7A748" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vign" cx="50%" cy="46%" r="74%">
    <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="72%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#050A16" stop-opacity="0.5"/>
  </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>`;

  // rays
  for (let d = 0; d < 360; d += 15) {
    const [bx, by] = pt(cx, cy, 300, d);
    const [ex, ey] = pt(cx, cy, 560, d);
    s += line(bx, by, ex, ey, GOLD.mid, 1, 'opacity="0.12"');
  }

  s += `<circle cx="${cx}" cy="${cy}" r="310" fill="url(#halo)"/>`;
  // medallion
  s += `<circle cx="${cx}" cy="${cy}" r="292" fill="#1B2A4D" opacity="0.78"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="292" fill="none" stroke="url(#foil)" stroke-width="9"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="272" fill="none" stroke="${GOLD.mid}" stroke-width="1.6" opacity="0.6"/>`;
  for (let d = 0; d < 360; d += 15) {
    const major = d % 45 === 0;
    const [x1, y1] = pt(cx, cy, major ? 254 : 262, d);
    const [x2, y2] = pt(cx, cy, 270, d);
    s += line(x1, y1, x2, y2, GOLD.light, major ? 2.6 : 1.2, `opacity="${major ? 0.9 : 0.55}"`);
  }

  // Α Ω
  s += `<text x="${cx - 102}" y="${cy + 74}" text-anchor="middle" ${serif} font-size="196" font-weight="bold" fill="url(#foil)">Α</text>`;
  s += `<text x="${cx + 108}" y="${cy + 74}" text-anchor="middle" ${serif} font-size="196" font-weight="bold" fill="url(#foil)">Ω</text>`;
  // small separator cross
  s += `<rect x="${cx - 3}" y="${cy - 128}" width="6" height="64" rx="3" fill="url(#foil)" opacity="0.9"/>`;
  s += `<rect x="${cx - 20}" y="${cy - 111}" width="40" height="6" rx="3" fill="url(#foil)" opacity="0.9"/>`;

  s += galleryFrame(W, H);
  s += refCaption(cx, H - 96, "Revelation 1 : 8", "Alpha and Omega, the beginning and the ending");
  s += `<rect width="${W}" height="${H}" fill="url(#vign)"/></svg>`;
  await renderPng(s, path.join(IMAGES_DIR, "alpha-omega.png"), 2400, 1800);
}

/* --- 3. living waters — John 7:38 --- */
async function livingWaters() {
  const W = 1200, H = 900, HZ = 400;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#16244A"/><stop offset="70%" stop-color="#2E4070"/><stop offset="100%" stop-color="#41548A"/>
  </linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#22345C"/><stop offset="100%" stop-color="#0D1730"/>
  </linearGradient>
  <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${GOLD.pale}"/><stop offset="50%" stop-color="${GOLD.mid}"/><stop offset="100%" stop-color="${GOLD.ink}"/>
  </linearGradient>
  <radialGradient id="sun" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${GOLD.pale}"/><stop offset="62%" stop-color="${GOLD.mid}"/><stop offset="100%" stop-color="${GOLD.deep}"/>
  </radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#F1CE83" stop-opacity="0.5"/><stop offset="100%" stop-color="#D7A748" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vign" cx="50%" cy="46%" r="74%">
    <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="72%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#050A16" stop-opacity="0.5"/>
  </radialGradient>
  </defs>
  <rect width="${W}" height="${HZ}" fill="url(#sky)"/>
  <rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#sea)"/>`;

  // sun + halo rings
  s += `<circle cx="600" cy="295" r="150" fill="url(#halo)"/>`;
  s += `<circle cx="600" cy="295" r="58" fill="url(#sun)"/>`;
  s += `<circle cx="600" cy="295" r="86" fill="none" stroke="${GOLD.light}" stroke-width="1.6" opacity="0.55"/>`;
  s += `<circle cx="600" cy="295" r="118" fill="none" stroke="${GOLD.light}" stroke-width="1.1" opacity="0.3"/>`;
  // light column onto water
  s += `<polygon points="542,${HZ} 658,${HZ} 760,${H} 440,${H}" fill="${GOLD.pale}" opacity="0.09"/>`;
  s += `<polygon points="566,${HZ} 634,${HZ} 690,${H} 510,${H}" fill="${GOLD.pale}" opacity="0.07"/>`;
  // horizon
  s += line(120, HZ, 1080, HZ, "url(#foil)", 2.6, 'opacity="0.9"');
  // ripples
  const rips = [[170, 470, 3.2], [280, 520, 2.6], [400, 575, 2.2], [530, 640, 1.9], [660, 715, 1.6], [790, 800, 1.4]];
  for (const [rx, ry, w] of rips) {
    s += `<ellipse cx="600" cy="${ry}" rx="${rx}" ry="${rx * 0.16}" fill="none" stroke="${GOLD.light}" stroke-width="${w}" opacity="0.4"/>`;
  }
  // sparkles on water + sky stars
  for (const [x, y, r] of [[430, 470, 9], [760, 505, 11], [580, 610, 8], [820, 660, 7]]) {
    s += star4(x, y, r, GOLD.light, 0.3, 12);
  }
  for (const [x, y, r] of [[210, 130, 8], [330, 90, 6], [890, 120, 9], [1010, 210, 6], [770, 70, 5]]) {
    s += star4(x, y, r, GOLD.pale, 0.32, 0, 'opacity="0.7"');
  }

  s += galleryFrame(W, H);
  s += refCaption(600, H - 96, "John 7 : 38", "Out of his belly shall flow rivers of living water");
  s += `<rect width="${W}" height="${H}" fill="url(#vign)"/></svg>`;
  await renderPng(s, path.join(IMAGES_DIR, "living-waters.png"), 2400, 1800);
}

await stainedGlassCross();
await alphaOmega();
await livingWaters();
console.log("done.");
