// Node.js script to draw and generate a beautiful, crisp 512x512 and 192x192 app icon
const fs = require('fs');
const zlib = require('zlib');

function createRichAppIcon(size) {
  const width = size;
  const height = size;
  const scale = size / 512;

  // RGBA buffer
  const buf = Buffer.alloc(width * height * 4, 0);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
    // alpha blend
    const srcA = a / 255;
    const destA = buf[idx + 3] / 255;
    const outA = srcA + destA * (1 - srcA);
    if (outA > 0) {
      buf[idx] = Math.round((r * srcA + buf[idx] * destA * (1 - srcA)) / outA);
      buf[idx + 1] = Math.round((g * srcA + buf[idx + 1] * destA * (1 - srcA)) / outA);
      buf[idx + 2] = Math.round((b * srcA + buf[idx + 2] * destA * (1 - srcA)) / outA);
      buf[idx + 3] = Math.round(outA * 255);
    }
  }

  function fillRect(x0, y0, w, h, r, g, b, a = 255) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 <= r2) {
          const aa = Math.min(1, Math.max(0, radius - Math.sqrt(d2) + 0.5));
          setPixel(x, y, r, g, b, Math.round(a * aa));
        }
      }
    }
  }

  function fillTriangle(x1, y1, x2, y2, x3, y3, r, g, b, a = 255) {
    const minX = Math.floor(Math.min(x1, x2, x3));
    const maxX = Math.ceil(Math.max(x1, x2, x3));
    const minY = Math.floor(Math.min(y1, y2, y3));
    const maxY = Math.ceil(Math.max(y1, y2, y3));

    function sign(p1x, p1y, p2x, p2y, p3x, p3y) {
      return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
    }

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d1 = sign(x, y, x1, y1, x2, y2);
        const d2 = sign(x, y, x2, y2, x3, y3);
        const d3 = sign(x, y, x3, y3, x1, y1);
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        if (!(hasNeg && hasPos)) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  // 1. Draw rounded squircle background (Rich deep blue gradient)
  const cornerRadius = 110 * scale;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let inBounds = true;
      if (x < cornerRadius && y < cornerRadius) {
        inBounds = Math.hypot(x - cornerRadius, y - cornerRadius) <= cornerRadius;
      } else if (x > width - cornerRadius && y < cornerRadius) {
        inBounds = Math.hypot(x - (width - cornerRadius), y - cornerRadius) <= cornerRadius;
      } else if (x < cornerRadius && y > height - cornerRadius) {
        inBounds = Math.hypot(x - cornerRadius, y - (height - cornerRadius)) <= cornerRadius;
      } else if (x > width - cornerRadius && y > height - cornerRadius) {
        inBounds = Math.hypot(x - (width - cornerRadius), y - (height - cornerRadius)) <= cornerRadius;
      }

      if (inBounds) {
        const factor = (x + y) / (width + height);
        const r = Math.round(30 * (1 - factor) + 15 * factor);
        const g = Math.round(64 * (1 - factor) + 23 * factor);
        const b = Math.round(175 * (1 - factor) + 50 * factor);
        setPixel(x, y, r, g, b, 255);
      }
    }
  }

  // 2. Glow center
  fillCircle(256 * scale, 240 * scale, 150 * scale, 56, 189, 248, 70);

  // 3. House Roof (Cyan / Blue modern gradient roof)
  fillTriangle(256 * scale, 85 * scale, 80 * scale, 225 * scale, 432 * scale, 225 * scale, 56, 189, 248, 255);
  fillTriangle(256 * scale, 100 * scale, 105 * scale, 220 * scale, 407 * scale, 220 * scale, 2, 132, 199, 255);

  // 4. House Body (White / Slate with rounded bottom)
  fillRect(125 * scale, 225 * scale, 262 * scale, 180 * scale, 255, 255, 255, 255);
  fillRect(135 * scale, 235 * scale, 242 * scale, 160 * scale, 241, 245, 249, 255);

  // 5. Electric Meter Screen (Dark glass box)
  fillRect(165 * scale, 250 * scale, 182 * scale, 65 * scale, 15, 23, 42, 255);
  fillRect(170 * scale, 255 * scale, 172 * scale, 55 * scale, 2, 44, 75, 255);
  // Meter screen digital segments simulation (Cyan glowing readout)
  fillRect(180 * scale, 270 * scale, 110 * scale, 25 * scale, 56, 189, 248, 240);
  fillRect(305 * scale, 273 * scale, 25 * scale, 18 * scale, 148, 163, 184, 255);

  // 6. Windows & Door
  fillRect(160 * scale, 335 * scale, 45 * scale, 50 * scale, 203, 213, 225, 255);
  fillRect(164 * scale, 339 * scale, 37 * scale, 42 * scale, 147, 197, 253, 255);

  fillRect(231 * scale, 325 * scale, 50 * scale, 80 * scale, 30, 41, 59, 255);
  fillCircle(270 * scale, 365 * scale, 3 * scale, 250, 204, 21, 255);

  fillRect(307 * scale, 335 * scale, 45 * scale, 50 * scale, 203, 213, 225, 255);
  fillRect(311 * scale, 339 * scale, 37 * scale, 42 * scale, 147, 197, 253, 255);

  // 7. Golden Lightning Bolt (⚡) in top center
  fillTriangle(270 * scale, 120 * scale, 210 * scale, 230 * scale, 255 * scale, 230 * scale, 250, 204, 21, 255);
  fillTriangle(255 * scale, 230 * scale, 235 * scale, 305 * scale, 300 * scale, 205 * scale, 234, 88, 12, 255);
  fillTriangle(270 * scale, 205 * scale, 250 * scale, 205 * scale, 260 * scale, 120 * scale, 254, 240, 138, 255);

  // 8. Green Taka Symbol (৳) Badge on top right
  fillCircle(405 * scale, 115 * scale, 42 * scale, 16, 185, 129, 255);
  fillCircle(405 * scale, 115 * scale, 38 * scale, 5, 150, 105, 255);

  // Draw ৳ symbol in white inside green badge
  fillRect(390 * scale, 95 * scale, 30 * scale, 8 * scale, 255, 255, 255, 255);
  fillRect(402 * scale, 95 * scale, 8 * scale, 38 * scale, 255, 255, 255, 255);
  fillCircle(406 * scale, 110 * scale, 10 * scale, 255, 255, 255, 255);
  fillCircle(406 * scale, 110 * scale, 5 * scale, 5, 150, 105, 255);

  // Encode to RGBA PNG
  return encodePng(width, height, buf);
}

function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData.writeUInt8(0, rowOffset); // Filter type 0
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const destIdx = rowOffset + 1 + x * 4;
      rawData.writeUInt8(rgbaBuffer[srcIdx], destIdx);
      rawData.writeUInt8(rgbaBuffer[srcIdx + 1], destIdx + 1);
      rawData.writeUInt8(rgbaBuffer[srcIdx + 2], destIdx + 2);
      rawData.writeUInt8(rgbaBuffer[srcIdx + 3], destIdx + 3);
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = (() => {
  let c;
  const t = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    t[n] = c;
  }
  return t;
})();

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

// Generate both icons
const png512 = createRichAppIcon(512);
fs.writeFileSync('icon-512.png', png512);

const png192 = createRichAppIcon(192);
fs.writeFileSync('icon-192.png', png192);

// Also copy icon-512.png as icon.png (some builders look for icon.png)
fs.writeFileSync('icon.png', png512);

console.log('Rich icons created successfully: 512x512, 192x192, and icon.png!');
