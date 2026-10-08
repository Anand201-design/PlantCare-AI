import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const toCrc = Buffer.concat([typeBuf, data]);
  chunk.writeUInt32BE(crc32(toCrc), 8 + len);
  return chunk;
}

function encodeRGBAtoPNG(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Raw scanlines: 1 filter byte (0) + width * 4 bytes RGBA per scanline
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[dstOffset++] = 0; // Filter None
    rgbaBuffer.copy(scanlines, dstOffset, srcOffset, srcOffset + width * 4);
    dstOffset += width * 4;
    srcOffset += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function renderBotanicalIcon(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);

  // Center & radius
  const cx = size / 2;
  const cy = size / 2;
  const padding = isMaskable ? size * 0.18 : size * 0.08;
  const radius = cx - padding;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background
      if (isMaskable) {
        // Full bleed background with subtle gradient
        const factor = y / size;
        buf[idx] = Math.round(23 + factor * 5); // R
        buf[idx + 1] = Math.round(77 - factor * 20); // G
        buf[idx + 2] = Math.round(62 - factor * 25); // B
        buf[idx + 3] = 255;
      } else {
        // Squircle / rounded container
        const cornerR = size * 0.22;
        const qx = Math.max(Math.abs(dx) - (cx - cornerR), 0);
        const qy = Math.max(Math.abs(dy) - (cy - cornerR), 0);
        const cornerDist = Math.sqrt(qx * qx + qy * qy);

        if (cornerDist <= cornerR) {
          const factor = y / size;
          buf[idx] = Math.round(27 + factor * 6);
          buf[idx + 1] = Math.round(80 - factor * 25);
          buf[idx + 2] = Math.round(62 - factor * 28);
          buf[idx + 3] = 255;
        } else {
          // Transparent outside container
          buf[idx] = 0;
          buf[idx + 1] = 0;
          buf[idx + 2] = 0;
          buf[idx + 3] = 0;
          continue;
        }
      }

      // Leaf icon inside
      // Standard leaf equation: ellipse tilted or almond shape
      const normY = (y - cy) / (radius * 0.85); // -1 to 1
      const normX = (x - cx) / (radius * 0.7);

      if (normY >= -0.9 && normY <= 0.85) {
        // Almond profile: width varies with (1 - normY^2)
        const maxWidth = Math.max(0, 1 - Math.abs(normY * 1.05));
        const leafWidth = Math.sin((normY + 0.9) * (Math.PI / 1.75)) * 0.78;

        if (Math.abs(normX) <= Math.max(0.01, leafWidth)) {
          // Central rib line
          if (Math.abs(normX) < 0.04) {
            buf[idx] = 240;
            buf[idx + 1] = 250;
            buf[idx + 2] = 242;
            buf[idx + 3] = 255;
          } else {
            // Leaf blade emerald green gradient
            const bladeFactor = Math.abs(normX) / leafWidth;
            buf[idx] = Math.round(45 * bladeFactor + 78 * (1 - bladeFactor));
            buf[idx + 1] = Math.round(186 * (1 - bladeFactor * 0.25));
            buf[idx + 2] = Math.round(136 * (1 - bladeFactor * 0.3));
            buf[idx + 3] = 255;
          }
        }
      }
    }
  }

  return encodeRGBAtoPNG(size, size, buf);
}

const publicDir = path.resolve(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), renderBotanicalIcon(192, false));
fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), renderBotanicalIcon(512, false));
fs.writeFileSync(path.join(publicDir, "pwa-maskable-512x512.png"), renderBotanicalIcon(512, true));
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), renderBotanicalIcon(180, false));
fs.writeFileSync(path.join(publicDir, "favicon.ico"), renderBotanicalIcon(64, false));

console.log("All PWA icons generated successfully in /public!");
