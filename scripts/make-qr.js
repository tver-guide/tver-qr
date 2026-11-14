// npm run qr — создаёт PNG с QR-кодом для каждой страницы в папке qr/
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { PAGES } = require('../config/pages');

const base = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
const outDir = path.join(__dirname, '..', 'qr');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  for (const p of PAGES) {
    const url = `${base}/p/${p.slug}`;
    await QRCode.toFile(path.join(outDir, `${p.slug}.png`), url, { width: 800, margin: 2 });
    console.log(`${p.slug}.png  →  ${url}`);
  }
  console.log(`\nГотово: ${outDir}`);
})();
