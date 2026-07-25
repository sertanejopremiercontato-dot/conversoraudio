const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

// 1. Icon SVG (512x512 viewbox) - M Symbol with Blue & Green arrows
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F141C"/>
      <stop offset="100%" stop-color="#070A0F"/>
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A3FF"/>
      <stop offset="100%" stop-color="#0066FE"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#84CC16"/>
      <stop offset="100%" stop-color="#65A30D"/>
    </linearGradient>
  </defs>

  <!-- Background Squircle -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="#1E293B" stroke-width="6"/>

  <!-- Iconic 'M' Dual Arrow Symbol -->
  <g transform="translate(48, 48)">
    <!-- Blue 'M' Left Wing & Up/Arch -->
    <path d="M 60 380 L 60 180 C 60 110 130 90 180 150 L 220 200 L 250 160 C 230 130 190 100 140 120 C 100 135 90 170 90 210 L 90 380 Z" fill="url(#blueGrad)" />
    <path d="M 50 380 L 100 380 L 75 420 Z" fill="url(#blueGrad)"/>

    <!-- Integrated Dual Arrow M Paths -->
    <!-- Blue Arm -->
    <path d="M 70 370 L 70 200 C 70 130 130 100 185 160 L 210 190 C 180 150 140 130 105 165 C 95 175 95 200 95 230 L 95 370 Z" fill="#00C8FF"/>

    <!-- Main Stylized M-Logo Shape -->
    <!-- Left Blue Arm -->
    <path d="M 80 360 L 80 200 C 80 130 140 110 185 160 L 210 190 C 175 145 135 130 110 160 C 100 172 100 195 100 220 L 100 360 Z" fill="url(#blueGrad)"/>
    
    <!-- Bold High-Fidelity Render of the M-Arrows Symbol -->
    <!-- Blue Left Leg of M -->
    <path d="M 85 360 C 65 360 60 340 60 320 L 60 190 C 60 110 135 85 190 145 L 210 168 C 160 115 110 130 110 195 L 110 320 C 110 345 105 360 85 360 Z" fill="url(#blueGrad)"/>

    <!-- Green Right Leg of M with Downward Arrow -->
    <path d="M 210 168 L 230 145 C 285 85 360 110 360 190 L 360 300 C 360 325 355 340 335 340 C 315 340 310 325 310 300 L 310 195 C 310 130 260 115 210 168 Z" fill="url(#greenGrad)"/>

    <!-- Sharp Arrows -->
    <!-- Down Arrow Head on Right (Green) -->
    <path d="M 335 385 L 285 320 L 385 320 Z" fill="url(#greenGrad)"/>
    <!-- Up Arrow Head on Left (Blue) -->
    <path d="M 85 115 L 35 180 L 135 180 Z" fill="url(#blueGrad)"/>
  </g>
</svg>`;

// 2. Horizontal Header Logo SVG (800x200) - MultiConverte Logo Dark
const logoDarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">
  <defs>
    <linearGradient id="bgGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090D12"/>
      <stop offset="100%" stop-color="#040608"/>
    </linearGradient>
    <linearGradient id="blueGradText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0099FF"/>
      <stop offset="100%" stop-color="#0055FF"/>
    </linearGradient>
    <linearGradient id="greenGradText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#84CC16"/>
      <stop offset="100%" stop-color="#65A30D"/>
    </linearGradient>
  </defs>

  <!-- Dark Background Canvas -->
  <rect width="800" height="200" fill="url(#bgGradDark)"/>

  <!-- Left Symbol (M Arrows) -->
  <g transform="translate(30, 20)">
    <!-- Blue Up Arrow Wing -->
    <path d="M 35 130 C 22 130 18 118 18 105 L 18 68 C 18 32 55 20 85 52 L 95 62 C 68 32 40 40 40 70 L 40 105 C 40 120 35 130 35 130 Z" fill="url(#blueGradText)"/>
    <path d="M 35 15 L 10 50 L 60 50 Z" fill="url(#blueGradText)"/>

    <!-- Green Down Arrow Wing -->
    <path d="M 95 62 L 105 52 C 135 20 172 32 172 68 L 172 105 C 172 118 168 130 155 130 C 155 130 150 120 150 105 L 150 70 C 150 40 122 32 95 62 Z" fill="url(#greenGradText)"/>
    <path d="M 155 165 L 130 130 L 180 130 Z" fill="url(#greenGradText)"/>
  </g>

  <!-- Wordmark "multiconverte" -->
  <g transform="translate(210, 115)">
    <text font-family="'Plus Jakarta Sans', 'Inter', Arial, Helvetica, sans-serif" font-weight="900" font-size="78" letter-spacing="-2.5">
      <tspan fill="#FFFFFF">multi</tspan><tspan fill="#84CC16">converte</tspan>
    </text>
  </g>

  <!-- Subtitle / Slogan "CONVERTE. SIMPLIFICA. RESOLVE." -->
  <g transform="translate(212, 154)">
    <text font-family="'Plus Jakarta Sans', 'Inter', Arial, Helvetica, sans-serif" font-weight="800" font-size="19" fill="#E2E8F0" letter-spacing="4.5">
      CONVERTE. SIMPLIFICA. RESOLVE.
    </text>
  </g>
</svg>`;

// 3. Open Graph Banner (1200x630)
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#090D16"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="blueGradOg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A3FF"/>
      <stop offset="100%" stop-color="#0066FE"/>
    </linearGradient>
    <linearGradient id="greenGradOg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#84CC16"/>
      <stop offset="100%" stop-color="#65A30D"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogBg)"/>

  <!-- Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="#1E293B" stroke-width="3"/>

  <!-- Top Badge -->
  <g transform="translate(600, 110)">
    <rect x="-210" y="-22" width="420" height="44" rx="22" fill="#84CC16" fill-opacity="0.12" stroke="#84CC16" stroke-opacity="0.3" stroke-width="2"/>
    <text x="0" y="6" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#84CC16" text-anchor="middle" letter-spacing="2">
      FERRAMENTAS ONLINE DE ÁUDIO, VÍDEO &amp; PDF
    </text>
  </g>

  <!-- Central Logo -->
  <g transform="translate(240, 260)">
    <!-- Symbol -->
    <g transform="translate(0, 0)">
      <path d="M 35 130 C 22 130 18 118 18 105 L 18 68 C 18 32 55 20 85 52 L 95 62 C 68 32 40 40 40 70 L 40 105 C 40 120 35 130 35 130 Z" fill="url(#blueGradOg)"/>
      <path d="M 35 15 L 10 50 L 60 50 Z" fill="url(#blueGradOg)"/>
      <path d="M 95 62 L 105 52 C 135 20 172 32 172 68 L 172 105 C 172 118 168 130 155 130 C 155 130 150 120 150 105 L 150 70 C 150 40 122 32 95 62 Z" fill="url(#greenGradOg)"/>
      <path d="M 155 165 L 130 130 L 180 130 Z" fill="url(#greenGradOg)"/>
    </g>

    <!-- Wordmark -->
    <g transform="translate(200, 115)">
      <text font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="82" letter-spacing="-2.5">
        <tspan fill="#FFFFFF">multi</tspan><tspan fill="#84CC16">converte</tspan>
      </text>
    </g>

    <!-- Subtitle -->
    <g transform="translate(202, 154)">
      <text font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="20" fill="#E2E8F0" letter-spacing="4.5">
        CONVERTE. SIMPLIFICA. RESOLVE.
      </text>
    </g>
  </g>

  <!-- Subtitle Text -->
  <text x="600" y="470" font-family="Arial, sans-serif" font-weight="700" font-size="28" fill="#E2E8F0" text-anchor="middle" letter-spacing="-0.5">
    Converter Áudio, Vídeo, Imagens e Editar PDF
  </text>
  <text x="600" y="515" font-family="Arial, sans-serif" font-weight="500" font-size="20" fill="#94A3B8" text-anchor="middle">
    Gratuito • 100% Privado no Navegador • Alta Velocidade
  </text>

  <!-- Domain -->
  <text x="600" y="570" font-family="Arial, sans-serif" font-weight="700" font-size="18" fill="#84CC16" text-anchor="middle" letter-spacing="1">
    https://multiconverte.com.br
  </text>
</svg>`;

async function renderSvgToPng(svgString, width, height) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const image = resvg.render();
  const pngBuffer = image.asPng();
  
  return await sharp(pngBuffer)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
}

async function build() {
  const publicDir = path.join(__dirname, 'public');

  console.log('Rendering MultiConverte branding images...');

  // 1. Icon 512x512
  const icon512 = await renderSvgToPng(iconSvg, 512, 512);
  fs.writeFileSync(path.join(publicDir, 'multiconverte-icon.png'), icon512);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), icon512);

  // 2. Icon 192x192
  const icon192 = await renderSvgToPng(iconSvg, 192, 192);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), icon192);

  // 3. Apple touch icon 180x180
  const appleTouch = await renderSvgToPng(iconSvg, 180, 180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

  // 4. Favicon 32x32 and 16x16
  const fav32 = await renderSvgToPng(iconSvg, 32, 32);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), fav32);

  const fav16 = await renderSvgToPng(iconSvg, 16, 16);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), fav16);

  // Favicon.ico
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), fav32);

  // 5. Logo Dark 800x200 & logo-multiconverte.png
  const logoDark = await renderSvgToPng(logoDarkSvg, 800, 200);
  fs.writeFileSync(path.join(publicDir, 'multiconverte-logo-dark.png'), logoDark);
  fs.writeFileSync(path.join(publicDir, 'logo-multiconverte.png'), logoDark);

  // 6. OG Image 1200x630
  const ogImage = await renderSvgToPng(ogSvg, 1200, 630);
  fs.writeFileSync(path.join(publicDir, 'multiconverte-og-image.png'), ogImage);

  console.log('All MultiConverte branding assets rendered successfully!');
}

build().catch(err => {
  console.error('Error generating branding:', err);
  process.exit(1);
});
