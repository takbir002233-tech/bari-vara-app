// Simple script to generate valid PNG icons for PWA using pure Node.js (zlib)
const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // color type (RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  
  const ihdrChunk = makeChunk('IHDR', ihdr);
  
  // Raw image data: height lines, each line starts with filter byte 0
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData.writeUInt8(0, rowOffset); // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // create a nice blue/cyan gradient with rounded corner effect
      const dx = Math.abs(x - width / 2) / (width / 2);
      const dy = Math.abs(y - height / 2) / (height / 2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 1.25) {
        rawData.writeUInt8(15, pixelOffset);
        rawData.writeUInt8(23, pixelOffset + 1);
        rawData.writeUInt8(42, pixelOffset + 2);
      } else {
        const factor = (y / height);
        const red = Math.floor(r * (1 - factor * 0.3));
        const green = Math.floor(g * (1 - factor * 0.2));
        const blue = Math.floor(b * (1 - factor * 0.1));
        rawData.writeUInt8(red, pixelOffset);
        rawData.writeUInt8(green, pixelOffset + 1);
        rawData.writeUInt8(blue, pixelOffset + 2);
      }
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

fs.writeFileSync('icon-192.png', createPng(192, 192, 37, 99, 235));
fs.writeFileSync('icon-512.png', createPng(512, 512, 37, 99, 235));
console.log('Icons generated successfully!');
