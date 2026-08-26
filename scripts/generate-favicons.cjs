const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const sourceJpg = path.join(__dirname, '..', 'src', 'assets', 'images', 'favicon_1783810423984.jpg');
const publicDir = path.join(__dirname, '..', 'public');

if (fs.existsSync(sourceJpg)) {
  console.log('Generating favicon assets from official source:', sourceJpg);
  
  // android-chrome-512x512.png
  execSync(`convert "${sourceJpg}" -resize 512x512 "${path.join(publicDir, 'android-chrome-512x512.png')}"`);
  console.log('Generated android-chrome-512x512.png');

  // android-chrome-192x192.png
  execSync(`convert "${sourceJpg}" -resize 192x192 "${path.join(publicDir, 'android-chrome-192x192.png')}"`);
  console.log('Generated android-chrome-192x192.png');

  // apple-touch-icon.png (180x180)
  execSync(`convert "${sourceJpg}" -resize 180x180 "${path.join(publicDir, 'apple-touch-icon.png')}"`);
  console.log('Generated apple-touch-icon.png');

  // favicon-48x48.png
  execSync(`convert "${sourceJpg}" -resize 48x48 "${path.join(publicDir, 'favicon-48x48.png')}"`);
  console.log('Generated favicon-48x48.png');

  // favicon-32x32.png
  execSync(`convert "${sourceJpg}" -resize 32x32 "${path.join(publicDir, 'favicon-32x32.png')}"`);
  console.log('Generated favicon-32x32.png');

  // favicon-16x16.png
  execSync(`convert "${sourceJpg}" -resize 16x16 "${path.join(publicDir, 'favicon-16x16.png')}"`);
  console.log('Generated favicon-16x16.png');

  // favicon.ico
  execSync(`convert "${sourceJpg}" -define icon:auto-resize=64,48,32,16 "${path.join(publicDir, 'favicon.ico')}"`);
  console.log('Generated favicon.ico');

  console.log('All favicon assets generated successfully from official image!');
} else {
  console.error('Source image not found:', sourceJpg);
}

