import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#6d28d9" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>
  
  <!-- Rounded Background -->
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  
  <!-- Cake Emoji Icon Centered with High Fidelity Vector -->
  <g transform="translate(106, 96) scale(0.6)" filter="url(#shadow)">
    <!-- Base Plate -->
    <ellipse cx="250" cy="420" rx="200" ry="25" fill="#ffffff" opacity="0.3" />
    
    <!-- Bottom Cake Tier -->
    <rect x="70" y="270" width="360" height="130" rx="30" fill="#f8fafc" />
    <path d="M 70 340 Q 115 365 160 340 Q 205 365 250 340 Q 295 365 340 340 Q 385 365 430 340 L 430 400 Q 250 440 70 400 Z" fill="#ec4899" />
    <rect x="70" y="270" width="360" height="50" rx="25" fill="#f43f5e" />

    <!-- Top Cake Tier -->
    <rect x="120" y="160" width="260" height="120" rx="25" fill="#f8fafc" />
    <path d="M 120 220 Q 152 240 185 220 Q 217 240 250 220 Q 282 240 315 220 Q 347 240 380 220 L 380 280 Q 250 310 120 280 Z" fill="#a855f7" />
    <rect x="120" y="160" width="260" height="40" rx="20" fill="#8b5cf6" />

    <!-- Candles -->
    <!-- Candle 1 -->
    <rect x="165" y="90" width="16" height="70" rx="6" fill="#38bdf8" />
    <polygon points="173,40 185,75 161,75" fill="#fbbf24" />
    <circle cx="173" cy="62" r="9" fill="#f59e0b" />
    <circle cx="173" cy="62" r="5" fill="#fef08a" />

    <!-- Candle 2 (Center) -->
    <rect x="242" y="70" width="16" height="90" rx="6" fill="#4ade80" />
    <polygon points="250,20 262,55 238,55" fill="#fbbf24" />
    <circle cx="250" cy="42" r="9" fill="#f59e0b" />
    <circle cx="250" cy="42" r="5" fill="#fef08a" />

    <!-- Candle 3 -->
    <rect x="319" y="90" width="16" height="70" rx="6" fill="#fb7185" />
    <polygon points="327,40 339,75 315,75" fill="#fbbf24" />
    <circle cx="327" cy="62" r="9" fill="#f59e0b" />
    <circle cx="327" cy="62" r="5" fill="#fef08a" />

    <!-- Frosting Dots -->
    <circle cx="150" cy="180" r="6" fill="#fef08a" />
    <circle cx="200" cy="180" r="6" fill="#67e8f9" />
    <circle cx="300" cy="180" r="6" fill="#fef08a" />
    <circle cx="350" cy="180" r="6" fill="#67e8f9" />
  </g>
</svg>`;

const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('✅ Generated public/icons/icon.svg');

// On Mac, convert SVG to PNGs using sips / qlmanage or sharp if available
try {
  // Try using sips / rsvg-convert or python to rasterize
  const pythonScript = `
import urllib.request
from PIL import Image, ImageDraw, ImageFont
import os

# Create 512x512 image with rounded violet gradient
img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Gradient background
for y in range(512):
    r = int(139 - (139 - 109) * (y / 512))
    g = int(92 - (92 - 40) * (y / 512))
    b = int(246 - (246 - 217) * (y / 512))
    draw.line([(0, y), (512, y)], fill=(r, g, b, 255))

# Mask rounded corners
mask = Image.new("L", (512, 512), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle([(0, 0), (512, 512)], radius=120, fill=255)
img.putalpha(mask)

# Draw Cake emoji or text
try:
    font = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", 240)
    draw.text((256, 260), "🎂", font=font, anchor="mm", embedded_color=True)
except Exception as e:
    # Fallback to bold text
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 180)
    except:
        font = ImageFont.load_default()
    draw.text((256, 256), "AB", font=font, fill=(255, 255, 255), anchor="mm")

icons_dir = "${iconsDir}"
img.save(os.path.join(icons_dir, "icon-512x512.png"), "PNG")
img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "icon-192x192.png"), "PNG")
img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "apple-touch-icon.png"), "PNG")
print("✅ PNG icons generated via Python Pillow")
`;
  execSync(`python3 -c '${pythonScript}'`);
} catch (e: any) {
  console.warn('Python icon generation fallback:', e.message);
}
