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

// Check if png-to-ico is available
let pngToIco;
try {
  const module = require('png-to-ico');
  // png-to-ico exports a default function
  pngToIco = module.default || module;
} catch (e) {
  console.warn('⚠️  Warning: png-to-ico module not found');
  console.warn('📦 Install it with: npm install png-to-ico');
  console.warn('Skipping favicon.ico generation...\n');
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
        // For maskable icons, use more aggressive padding (icon is only 50% of canvas)
        // This ensures content stays well within the safe zone
        const iconSize = Math.round(size * 0.5); // Icon takes 50% of canvas (was 60%)
        const padding = Math.round((size - iconSize) / 2);

        // Create the icon at reduced size
        const iconBuffer = await sharp(svgBuffer)
          .resize(iconSize, iconSize)
          .png()
          .toBuffer();

        // Create gradient background matching the SVG
        // Using solid color that matches the gradient midpoint
        await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 99, g: 102, b: 241, alpha: 1 } // #6366F1 (indigo-500)
          }
        })
        .composite([{
          input: iconBuffer,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(outputPath);

        console.log(`✅ Generated ${name} (${size}x${size} maskable with 50% content, 50% safe zone)`);
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

  // Generate favicon.ico from 48x48 PNG (if png-to-ico is available)
  if (pngToIco) {
    try {
      console.log('\n🔨 Generating favicon.ico...');

      // First create a temporary 48x48 PNG for the .ico file
      const tempPngPath = path.join(publicDir, 'temp-favicon-48.png');
      await sharp(svgBuffer)
        .resize(48, 48)
        .png()
        .toFile(tempPngPath);

      // Convert PNG to ICO
      const icoBuffer = await pngToIco(tempPngPath);
      const icoPath = path.join(publicDir, 'favicon.ico');
      fs.writeFileSync(icoPath, icoBuffer);

      // Clean up temp file
      fs.unlinkSync(tempPngPath);

      console.log('✅ Generated favicon.ico (48x48)');
    } catch (error) {
      console.error('❌ Failed to generate favicon.ico:', error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log('📱 To see changes:');
  console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
  console.log('   2. For PWA: Remove from home screen and re-add');
  console.log('   3. Hard refresh browser (Ctrl+F5)');
}

generateIcons().catch(error => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});
