const { test: base, expect, chromium } = require('@playwright/test');
const path = require('node:path');

// Real unpacked extension + real Chrome storage, in a disposable profile.
// Only remote feed responses and remote images are controlled test inputs.
const test = base.extend({
  context: async ({}, use) => {
    const extension = path.resolve(process.env.LAUNCHPAD_EXTENSION_PATH || path.join(__dirname, '../..'));
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
    });
    await context.route(/^https?:\/\//, route => route.abort());
    await use(context);
    await context.close();
  },
  worker: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    await worker.evaluate(() => {
      globalThis.fixtureMode = 'populated';
      globalThis.fetch = async value => {
        const url = new URL(value);
        if (fixtureMode === 'failed') throw new Error('Fixture: network unavailable');
        if (fixtureMode === 'invalid') return new Response(url.hostname === 'export.arxiv.org'
          ? '<html>Source maintenance</html>' : '{"message":"Source maintenance"}');
        if (fixtureMode === 'partial' && url.hostname === 'export.arxiv.org' && url.pathname.endsWith('cs.CV')) {
          throw new Error('Fixture: one category unavailable');
        }
        if (fixtureMode === 'empty') {
          return new Response(url.hostname.includes('github') || url.hostname.includes('ossinsight')
            ? '{"items":[],"data":{"rows":[]}}' : '<rss><channel></channel></rss>');
        }
        if (url.hostname === 'export.arxiv.org') {
          const category = url.pathname.split('/').pop();
          const topics = ['Structured pruning for edge AI', 'On-device inference and model compression',
            'Semantic communication for wireless learning', 'Demand response and dynamic pricing'];
          return new Response(`<rss><channel>${topics.map((title, index) => `<item>
            <title>[Test fixture] ${title}</title>
            <link>https://example.org/papers/${category}/${index}</link>
            <pubDate>Mon, 07 Sep 2026 08:00:00 GMT</pubDate>
            <description>Test data for UI verification. This research description covers ${title.toLowerCase()} with reproducible experiments and clear evaluation boundaries.</description>
          </item>`).join('')}</channel></rss>`);
        }
        if (url.hostname === 'scour.ing') {
          return new Response(Array.from({ length: 12 }, (_, index) => `<article data-item="post" data-post-title="[Test fixture] Research reading list ${index + 1}">
            <div class="post-title-block"><a data-track-click href="https://example.org/articles/${index}">Read article</a></div>
            <span title="2026-09-07T08:00:00Z">Test date</span><span class="chip">Edge AI</span>
          </article>`).join(''));
        }
        if (url.hostname === 'api.ossinsight.io') {
          return new Response(JSON.stringify({ data: { rows: Array.from({ length: 10 }, (_, index) => ({
            repo_name: `fixture-lab/research-tool-${index + 1}`,
            description: '[Test fixture] Structured pruning and model compression for edge AI. Reproducible academic benchmark.',
            primary_language: 'Python', stars: 120 + index, total_score: 30 + index
          })) } }));
        }
        if (url.hostname === 'api.github.com') return new Response('{"items":[],"incomplete_results":false}');
        return new Response('<html><body>Test preview content.</body></html>');
      };
    });
    await worker.evaluate(() => chrome.storage.local.set({ scourUrl: 'https://scour.ing/@fixture' }));
    await use(worker);
  },
  extensionId: async ({ worker }, use) => use(worker.url().split('/')[2])
});

async function openNewTab(page, extensionId) {
  await page.goto(`chrome-extension://${extensionId}/newtab/index.html`);
  await expect(page.locator('#launchpad > .shortcut')).toHaveCount(17);
}

module.exports = { test, expect, openNewTab };
