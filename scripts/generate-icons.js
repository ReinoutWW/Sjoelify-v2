const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../public/images/SjoelifyLogoSquare.png');
const outputDir = path.join(__dirname, '../public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icons
sizes.forEach(size => {
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  
  sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a with full opacity
    })
    .png()
    .toFile(outputPath)
    .then(() => {
      console.log(`Generated ${size}x${size} icon`);
    })
    .catch(err => {
      console.error(`Error generating ${size}x${size} icon:`, err);
    });
});

// Generate Apple touch icon
sharp(inputPath)
  .resize(180, 180, {
    fit: 'contain',
    background: { r: 15, g: 23, b: 42, alpha: 1 }
  })
  .png()
  .toFile(path.join(outputDir, 'apple-touch-icon.png'))
  .then(() => {
    console.log('Generated Apple touch icon');
  })
  .catch(err => {
    console.error('Error generating Apple touch icon:', err);
  });

// Copy the original as favicon-32x32 and favicon-16x16
Promise.all([
  sharp(inputPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, 'favicon-32x32.png')),
  sharp(inputPath)
    .resize(16, 16)
    .png()
    .toFile(path.join(outputDir, 'favicon-16x16.png'))
]).then(() => {
  console.log('Generated favicon sizes');
}).catch(err => {
  console.error('Error generating favicons:', err);
});

console.log('Icon generation started...'); 