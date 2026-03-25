// Run: node scripts/generate-icons.mjs
// Requires: npm install -D sharp

import sharp from "sharp";
import { writeFileSync } from "fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="120" fill="#C7B8EA"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">💞</text>
</svg>`;

const svgBuffer = Buffer.from(svg);

await sharp(svgBuffer).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(svgBuffer).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(svgBuffer).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(svgBuffer).resize(72, 72).png().toFile("public/badge-72.png");

console.log("Icons generated in /public");
