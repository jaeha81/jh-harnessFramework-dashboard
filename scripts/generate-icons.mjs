// Generates public/icons/icon-192.png and public/icons/icon-512.png
// and public/apple-icon.png using pure Node.js (no external dependencies)

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── CRC32 ───────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG builder ──────────────────────────────────────────────────────────────
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function buildPNG(width, height, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  // Build filtered scanlines (filter byte 0 = None per row)
  const rows = [];
  for (let y = 0; y < height; y++) {
    rows.push(Buffer.from([0])); // filter type None
    rows.push(Buffer.from(rgb.subarray(y * width * 3, (y + 1) * width * 3)));
  }
  const compressed = deflateSync(Buffer.concat(rows), { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdrData),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Icon pixel generator ──────────────────────────────────────────────────────
// Design: #080808 outer bg + #111111 inner rounded-square
function makeIconPixels(size) {
  const rgb = Buffer.allocUnsafe(size * size * 3);
  const pad = Math.round(size * 0.094); // 48/512
  const r = Math.round(size * 0.094);   // corner radius

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;
      const inBox =
        x >= pad && x < size - pad && y >= pad && y < size - pad;

      // Simple rounded-corner check
      let inRounded = inBox;
      if (inBox) {
        const cx = x - pad;
        const cy = y - pad;
        const inner = size - pad * 2;
        const nearLeft = cx < r;
        const nearRight = cx >= inner - r;
        const nearTop = cy < r;
        const nearBottom = cy >= inner - r;
        if (nearLeft && nearTop) {
          inRounded = (cx - r) ** 2 + (cy - r) ** 2 <= r * r;
        } else if (nearRight && nearTop) {
          inRounded = (cx - (inner - r)) ** 2 + (cy - r) ** 2 <= r * r;
        } else if (nearLeft && nearBottom) {
          inRounded = (cx - r) ** 2 + (cy - (inner - r)) ** 2 <= r * r;
        } else if (nearRight && nearBottom) {
          inRounded =
            (cx - (inner - r)) ** 2 + (cy - (inner - r)) ** 2 <= r * r;
        }
      }

      if (inRounded) {
        rgb[idx] = 0x11;
        rgb[idx + 1] = 0x11;
        rgb[idx + 2] = 0x11;
      } else {
        rgb[idx] = 0x08;
        rgb[idx + 1] = 0x08;
        rgb[idx + 2] = 0x08;
      }
    }
  }
  return rgb;
}

// ── Generate & write ──────────────────────────────────────────────────────────
const iconsDir = join(ROOT, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  const rgb = makeIconPixels(size);
  const png = buildPNG(size, size, rgb);
  const path = join(iconsDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`✓ ${path} (${png.length} bytes)`);
}

// apple-icon: 180x180 in public/
const appleRgb = makeIconPixels(180);
const applePng = buildPNG(180, 180, appleRgb);
const applePath = join(ROOT, "public", "apple-icon.png");
writeFileSync(applePath, applePng);
console.log(`✓ ${applePath} (${applePng.length} bytes)`);
