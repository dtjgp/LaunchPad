const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');

// Compile standard toolbar sizes from the owner-selected artwork using Chromium's
// image renderer. Preserve the full illustration and its aspect ratio, with
// transparent side padding; never crop, redraw, or replace the source artwork.
(async () => {
  const root = path.resolve(__dirname, '..');
  const source = 'icons/Gemini_Generated_Image_fgcx8wfgcx8wfgcx.png';
  const bytes = fs.readFileSync(path.join(root, source));
  const output = path.join(root, 'icons/app');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 128, height: 128 }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;background:transparent}#frame{width:128px;height:128px}img{display:block;width:100%;height:100%;object-fit:contain}</style><div id="frame"><img src="data:image/png;base64,${bytes.toString('base64')}"></div>`);
    await page.locator('img').evaluate(image => image.decode());
    const generated = {};
    for (const size of [16, 32, 48, 128]) {
      await page.locator('#frame').evaluate((element, size) => { element.style.width = `${size}px`; element.style.height = `${size}px`; }, size);
      const png = await page.locator('#frame').screenshot({ path: path.join(output, `icon${size}.png`), omitBackground: true, scale: 'css' });
      generated[`icon${size}.png`] = crypto.createHash('sha256').update(png).digest('hex');
    }
    fs.writeFileSync(path.join(output, 'provenance.json'), JSON.stringify({ source,
      sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      method: 'Chromium image rendering, object-fit: contain, no crop, transparent padding', generated
    }, null, 2) + '\n');
    console.log('Rendered 16, 32, 48 and 128px icons from the original artwork.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
