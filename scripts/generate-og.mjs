import sharp from "sharp";

// Create the lavender gradient background with text, then composite the logo
const width = 1200;
const height = 630;

// Background SVG (no heart icon — logo will be composited on top)
const bgSvg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ede9fe"/>
      <stop offset="50%" style="stop-color:#f5f3ff"/>
      <stop offset="100%" style="stop-color:#fce7f3"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="100" cy="100" r="180" fill="#c4b5fd" opacity="0.15"/>
  <circle cx="1100" cy="530" r="220" fill="#f9a8d4" opacity="0.15"/>
  <circle cx="1050" cy="80" r="120" fill="#a78bfa" opacity="0.1"/>
  <circle cx="150" cy="560" r="100" fill="#f472b6" opacity="0.1"/>
  <text x="600" y="430" font-family="Georgia, serif" font-size="96" font-weight="bold" fill="#5b21b6" text-anchor="middle" letter-spacing="-2">Tether</text>
  <text x="600" y="498" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="32" fill="#7c3aed" text-anchor="middle" opacity="0.8">A private space for you and your partner</text>
  <text x="600" y="548" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="26" fill="#9f7aea" text-anchor="middle" opacity="0.6">Mood check-ins · Shared chat · Relationship insights</text>
  <text x="600" y="608" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" fill="#a78bfa" text-anchor="middle" opacity="0.5">tether.agoyal.dev</text>
</svg>`;

const logoSize = 160;

const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();
const logo = await sharp("public/apple-touch-icon.png").resize(logoSize, logoSize).toBuffer();

await sharp(bg)
  .composite([{ input: logo, top: 160, left: (width - logoSize) / 2 }])
  .toFile("public/og-image.png");

console.log("og-image.png generated!");
