#!/usr/bin/env node
// Generates solid-color PNG splash screens for iOS PWA
const { deflateRawSync } = require("zlib");
const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");

// Lavender #EDE8F9 = rgb(237, 232, 249)
const R = 0xed, G = 0xe8, B = 0xf9;

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcVal]);
}

function makePNG(w, h) {
  const sig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0); ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; ihdrData[9] = 2; // 8-bit RGB
  const row = Buffer.alloc(1 + w * 3);
  row[0] = 0; // filter: None
  for (let x = 0; x < w; x++) { row[1+x*3]=R; row[2+x*3]=G; row[3+x*3]=B; }
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(row);
  const raw = Buffer.concat(rows);
  const idat = deflateRawSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdrData), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const sizes = [
  [1320, 2868], // iPhone 16 Pro Max
  [1206, 2622], // iPhone 16 Pro
  [1290, 2796], // iPhone 14/15/16 Plus & Pro Max (430x932)
  [1179, 2556], // iPhone 14/15/16 Pro (393x852)
  [1284, 2778], // iPhone 13/14 Pro Max (428x926)
  [1170, 2532], // iPhone 12/13/14 (390x844)
  [1125, 2436], // iPhone X/XS/11 Pro/12-13 mini (375x812)
  [1242, 2688], // iPhone XS Max/11 Pro Max (414x896)
  [828,  1792], // iPhone XR/11 (414x896 @2x)
  [750,  1334], // iPhone SE / 8 (375x667)
];

const outDir = join(__dirname, "../public/splash");
mkdirSync(outDir, { recursive: true });

for (const [w, h] of sizes) {
  const buf = makePNG(w, h);
  const name = `splash-${w}x${h}.png`;
  writeFileSync(join(outDir, name), buf);
  console.log(`${name}  ${(buf.length/1024).toFixed(1)} KB`);
}
console.log("Done.");
