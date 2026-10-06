// Recaptures docs/images with the unpacked extension and live public feeds.
// Usage: node scripts/capture-readme-images.cjs [scour-profile-url]
// Uses a disposable Chromium profile; nothing is read from your own Chrome.
const path = require('node:path');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const images = path.join(root, 'docs/images');
const scourUrl = process.argv[2] || 'https://scour.ing/@dtjgp';

async function capture(context, extensionId, theme) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`chrome-extension://${extensionId}/newtab/index.html`);
  await page.evaluate(mode => chrome.storage.local.set({ themeMode: mode }), theme);
  await page.reload();
  // Wait until every panel has settled, then report what the image will show.
  await page.waitForFunction(() => !document.querySelector('.skeleton-item') &&
    ['arxivStatus', 'scourStatus', 'favoriteStatus'].every(id => !/Loading/i.test(document.getElementById(id).textContent)),
  null, { timeout: 60000 });
  const states = await page.evaluate(() => ['arxivStatus', 'scourStatus', 'favoriteStatus']
    .map(id => `${id}: ${document.getElementById(id).textContent.trim()}`));
  console.log(`[${theme}] ${states.join(' | ')}`);
  // In Chrome the omnibox holds focus on a new tab, so the placeholder stays visible.
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: path.join(images, `newtab-${theme}.png`) });
  await page.close();
}

(async () => {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`]
  });
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const extensionId = worker.url().split('/')[2];
    await worker.evaluate(url => chrome.storage.local.set({ scourUrl: url }), scourUrl);
    await capture(context, extensionId, 'light');
    await capture(context, extensionId, 'dark');

    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 600 });
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.evaluate(() => chrome.storage.local.set({ themeMode: 'light' }));
    await popup.reload();
    await popup.locator('.launch-item').first().waitFor();
    await popup.waitForLoadState('networkidle').catch(() => {});
    await popup.screenshot({ path: path.join(images, 'popup-light.png') });
    console.log(`Captured newtab-light.png, newtab-dark.png and popup-light.png in ${path.relative(root, images)}.`);
  } finally {
    await context.close();
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
