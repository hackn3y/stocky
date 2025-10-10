/**
 * Generate PNG icons from SVG source
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp module not found');
  console.error('📦 Please install it with: npm install sharp');
  process.exit(1);
}

const publicDir = path.join(__dirname, 'public');
const svgPath = path.join(publicDir, 'icon.svg');

// Icon sizes to generate
const iconSizes = [
  { size: 192, name: 'icon-192.png', maskable: false },
  { size: 512, name: 'icon-512.png', maskable: false },
  { size: 192, name: 'web-app-manifest-192x192.png', maskable: true },
  { size: 512, name: 'web-app-manifest-512x512.png', maskable: true },
  { size: 96, name: 'favicon-96x96.png', maskable: false },
  { size: 180, name: 'apple-touch-icon.png', maskable: false }
];

async function generateIcons() {
  console.log('🎨 Generating PNG icons from SVG...\n');

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error(`❌ Error: SVG file not found at ${svgPath}`);
    process.exit(1);
  }

  // Read SVG
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate each size
  for (const { size, name, maskable } of iconSizes) {
    try {
      const outputPath = path.join(publicDir, name);

      if (maskable) {
        // For maskable icons, add 20% padding (safe zone) and create larger canvas
        const iconSize = Math.round(size * 0.6); // Icon takes 60% of canvas
        const padding = Math.round((size - iconSize) / 2);

        // Create the icon at reduced size
        const iconBuffer = await sharp(svgBuffer)
          .resize(iconSize, iconSize)
          .png()
          .toBuffer();

        // Place it on a larger canvas with padding (using theme color background)
        await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 79, g: 70, b: 229, alpha: 1 } // #4F46E5
          }
        })
        .composite([{
          input: iconBuffer,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(outputPath);

        console.log(`✅ Generated ${name} (${size}x${size} maskable with safe zone)`);
      } else {
        // Regular icons - no padding needed
        await sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputPath);

        console.log(`✅ Generated ${name} (${size}x${size})`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log('📱 To see changes on mobile:');
  console.log('   1. Clear browser cache');
  console.log('   2. Remove PWA from home screen');
  console.log('   3. Re-add to home screen');
}

generateIcons().catch(error => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});
