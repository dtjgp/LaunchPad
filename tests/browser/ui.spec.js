const { test, expect, openNewTab } = require('./extension-fixture');
const path = require('node:path');
const fs = require('node:fs');
const output = path.resolve(process.env.LAUNCHPAD_TEST_ARTIFACTS || path.join(__dirname, '../../output/browser'));
fs.mkdirSync(output, { recursive: true });

for (const [width, height] of [[1920, 1080], [1440, 900], [1280, 800], [768, 900], [375, 812]]) {
  test(`search and content remain usable at ${width}px`, async ({ page, extensionId }) => {
    await page.setViewportSize({ width, height });
    await openNewTab(page, extensionId);
    await expect(page.locator('#scourList .research-card')).toHaveCount(10);
    const geometry = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
      const input = rect('#searchInput');
      const hit = document.elementFromPoint(input.x + input.width / 2, input.y + input.height / 2);
      return { main: rect('.main'), input, shortcuts: rect('.shortcuts'), scour: rect('.scour-section'),
        hit: hit?.id, scrollWidth: document.documentElement.scrollWidth, width: innerWidth };
    });
    expect(geometry.main.height).toBeGreaterThan(300);
    expect(geometry.input.top).toBeGreaterThanOrEqual(geometry.main.top);
    expect(geometry.input.bottom).toBeLessThanOrEqual(geometry.main.bottom);
    expect(geometry.hit).toBe('searchInput');
    expect(geometry.scour.top).toBeGreaterThanOrEqual(geometry.shortcuts.bottom);
    expect(geometry.scrollWidth).toBe(geometry.width);
    await page.screenshot({ path: path.join(output, `newtab-${width}-light.png`) });
  });
}

test('panel collapse releases columns and survives a reload', async ({ page, extensionId }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openNewTab(page, extensionId);
  const before = (await page.locator('.main').boundingBox()).width;
  await page.locator('#arxivToggle').click();
  await page.locator('#favoriteToggle').click();
  await expect(page.locator('#arxivPanel')).toBeHidden();
  expect((await page.locator('.main').boundingBox()).width).toBeGreaterThan(before);
  await expect.poll(() => page.evaluate(async () => (await chrome.storage.local.get('panelVisibility')).panelVisibility))
    .toEqual({ arxiv: false, favorites: false });
  await page.reload();
  await expect(page.locator('#arxivToggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#favoritePanel')).toBeHidden();
});

test('add validates inputs, keeps focus inside the dialog, and persists an escaped name', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  await page.getByRole('button', { name: 'Add shortcut', exact: true }).click();
  await page.locator('#saveBtn').click();
  await expect(page.locator('#siteNameError')).toHaveText('Enter a name.');
  await expect(page.locator('#siteUrlError')).toHaveText('Enter a URL.');
  await expect(page.locator('#siteName')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#saveBtn')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#siteName')).toBeFocused();
  await page.locator('#siteName').fill('<b>Research links</b>');
  await page.locator('#siteUrl').fill('javascript:alert(1)');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#siteUrlError')).toHaveText('Enter a valid HTTP(S) URL.');
  await page.locator('#siteUrl').fill('example.org/research');
  await page.keyboard.press('Enter');
  await expect(page.locator('#addForm')).toBeHidden();
  await expect(page.locator('.shortcut-name').filter({ hasText: '<b>Research links</b>' })).toHaveCount(1);
  await expect(page.locator('.shortcut-name b')).toHaveCount(0);
  const stored = await page.evaluate(async () => (await chrome.storage.local.get('sites')).sites);
  expect(stored.at(-1)).toMatchObject({ name: '<b>Research links</b>', url: 'https://example.org/research' });
  await page.reload();
  await expect(page.locator('#launchpad > .shortcut')).toHaveCount(18);
});

test('More opens a keyboard menu and edit/cancel restores its trigger', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  const more = page.getByRole('button', { name: 'More options for Google', exact: true });
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Open in new tab', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Copy URL', exact: true })).toBeFocused();
  await page.getByRole('menuitem', { name: 'Edit name/URL', exact: true }).click();
  await expect(page.locator('#siteName')).toHaveValue('Google');
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
  await more.click();
  await page.getByRole('menuitem', { name: 'Edit name/URL', exact: true }).click();
  await page.locator('#siteName').fill('Google Research');
  await page.locator('#saveBtn').click();
  await expect(page.getByRole('button', { name: 'More options for Google Research', exact: true })).toBeFocused();
});

test('save failures retain the form and do not announce success', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  await page.evaluate(() => {
    chrome.storage.local.set = async () => { throw new Error('Fixture: storage full'); };
    chrome.storage.sync.set = async () => { throw new Error('Fixture: sync unavailable'); };
  });
  await page.getByRole('button', { name: 'Add shortcut', exact: true }).click();
  await page.locator('#siteName').fill('Unsaved shortcut');
  await page.locator('#siteUrl').fill('example.org');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#shortcutFormStatus')).toContainText('Could not save');
  await expect(page.locator('#siteName')).toHaveValue('Unsaved shortcut');
  await expect(page.locator('#launchpad > .shortcut')).toHaveCount(17);
});

for (const mode of ['failed', 'empty', 'partial']) {
  test(`feed ${mode} state replaces skeletons and retains source meaning`, async ({ page, worker, extensionId }) => {
    await worker.evaluate(mode => { globalThis.fixtureMode = mode; }, mode);
    await openNewTab(page, extensionId);
    await expect(page.locator('.skeleton-item')).toHaveCount(0);
    if (mode === 'failed') {
      await expect(page.locator('#arxivStatus')).toContainText('Failed');
      await expect(page.locator('#scourStatus')).toContainText('Failed');
      await expect(page.locator('#favoriteStatus')).toContainText('Failed');
      await worker.evaluate(() => { globalThis.fixtureMode = 'populated'; });
      await page.locator('#arxivStatus').getByRole('button', { name: 'Retry' }).click();
      await expect(page.locator('#arxivList .research-card').first()).toBeVisible();
    } else if (mode === 'empty') {
      await expect(page.locator('#arxivStatus')).toContainText('No papers');
      await expect(page.locator('#scourStatus')).toContainText('No readable items');
    } else {
      await expect(page.locator('#arxivStatus')).toContainText('Partial update');
      await expect(page.locator('#arxivList .research-card').first()).toBeVisible();
    }
    await page.screenshot({ path: path.join(output, `state-${mode}.png`) });
  });
}

test('cached papers stay visible when refresh fails and zero-match filters offer recovery', async ({ page, worker, extensionId }) => {
  await openNewTab(page, extensionId);
  await expect(page.locator('#arxivStatus')).toContainText('Updated');
  await worker.evaluate(() => { globalThis.fixtureMode = 'failed'; });
  await page.reload();
  await expect(page.locator('#arxivStatus')).toContainText('Using cached data (refresh failed)');
  await expect(page.locator('#scourStatus')).toContainText('refresh failed');
  await expect(page.locator('#arxivList .research-card').first()).toBeVisible();
  await page.locator('.panel-advanced summary').click();
  await page.locator('#arxivFilterInput').fill('no-matching-paper-xyz');
  await expect(page.locator('#arxivList .research-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filter', exact: true }).click();
  await expect(page.locator('#arxivList .research-card').first()).toBeVisible();
});

test('manual and system themes use accessible foreground pairs and propagate to popup', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  const measurements = [];
  for (const system of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: system });
    for (const mode of ['auto', 'light', 'dark']) {
      await page.locator('#settingsBtn').click();
      await page.getByRole('tab', { name: 'General', exact: true }).click();
      await page.locator(`.theme-option[data-theme="${mode}"]`).click();
      await page.locator('#settingsCloseBtn').click();
      await page.getByRole('button', { name: 'Add shortcut', exact: true }).click();
      const ratios = await page.evaluate(() => {
        const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = values => values.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
          .reduce((sum, v, index) => sum + v * [.2126, .7152, .0722][index], 0);
        const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        const button = getComputedStyle(document.querySelector('#saveBtn'));
        const input = document.querySelector('#siteUrl');
        return {
          button: ratio(luminance(rgb(button.color)), luminance(rgb(button.backgroundColor))),
          placeholder: ratio(luminance(rgb(getComputedStyle(input, '::placeholder').color)), luminance(rgb(getComputedStyle(input).backgroundColor)))
        };
      });
      expect(ratios.button).toBeGreaterThanOrEqual(4.5);
      expect(ratios.placeholder).toBeGreaterThanOrEqual(4.5);
      measurements.push({ system, mode, ...ratios });
      if (system === 'dark' && mode === 'dark') await page.screenshot({ path: path.join(output, 'dialog-dark.png') });
      await page.keyboard.press('Escape');
    }
  }
  fs.writeFileSync(path.join(output, 'contrast.json'), JSON.stringify(measurements, null, 2));
  await page.screenshot({ path: path.join(output, 'newtab-1440-dark.png') });
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.setViewportSize({ width: 360, height: 600 });
  await expect(page.locator('html')).toHaveClass(/theme-dark/);
  await page.screenshot({ path: path.join(output, 'popup-dark.png') });
});

test('popup uses the same validated add/edit flow and dedicated Google app icons', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.setViewportSize({ width: 360, height: 600 });
  await expect(page.locator('.launch-item')).toHaveCount(16);
  const mail = page.locator('.launch-item').filter({ has: page.locator('.name', { hasText: /^Mail$/ }) });
  // External images are deliberately blocked; a readable initial replaces failures.
  await expect(mail.locator('.icon')).toContainText('M');
  await page.getByRole('button', { name: 'Add shortcut', exact: true }).click();
  await page.locator('#saveBtn').click();
  await expect(page.locator('#siteNameError')).toHaveText('Enter a name.');
  await page.locator('#siteName').fill('Paper queue');
  await page.locator('#siteUrl').fill('example.org/queue');
  await page.keyboard.press('Enter');
  await expect(page.locator('.launch-item')).toHaveCount(17);
  await page.getByRole('button', { name: 'More options for Paper queue', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Edit shortcut', exact: true }).click();
  await page.locator('#siteName').fill('Reading queue');
  await page.locator('#saveBtn').click();
  await expect(page.getByRole('button', { name: 'More options for Reading queue', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'More options for Reading queue', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Remove', exact: true }).click();
  await expect(page.locator('.launch-item')).toHaveCount(16);
  await page.screenshot({ path: path.join(output, 'popup-light.png') });
});

for (const surface of ['newtab', 'popup']) {
  test(`${surface} shortcuts still reorder with native drag events`, async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/${surface === 'newtab' ? 'newtab/index.html' : 'popup.html'}`);
    if (surface === 'newtab') {
      await page.getByRole('button', { name: 'More options for Google', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Edit shortcuts', exact: true }).click();
    } else {
      await page.setViewportSize({ width: 360, height: 600 });
      await page.locator('#editModeBtn').click();
    }
    const selector = surface === 'newtab' ? '#launchpad > .shortcut:not(.add-btn)' : '.launch-item';
    await page.locator(selector).nth(0).dragTo(page.locator(selector).nth(1));
    await expect(page.locator(selector).first()).toContainText('GitHub');
    await expect.poll(() => page.evaluate(async () => (await chrome.storage.local.get('sites')).sites?.[0]?.name))
      .toBe('GitHub');
  });
}

test('Google query, direct URL, voice result and Lens keep their navigation targets', async ({ page, context, extensionId }) => {
  await context.route(/^https:\/\/(www\.google\.com|example\.org|lens\.google\.com)\//,
    route => route.fulfill({ contentType: 'text/html', body: '<title>Navigation test destination</title>' }));
  await openNewTab(page, extensionId);
  await page.locator('#searchInput').fill('edge AI research');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('https://www.google.com/search?q=edge%20AI%20research');
  await openNewTab(page, extensionId);
  await page.locator('#searchInput').fill('example.org/library');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('https://example.org/library');
  await page.addInitScript(() => {
    // Only the speech recognizer is simulated; no microphone is activated.
    window.SpeechRecognition = class {
      start() { queueMicrotask(() => this.onresult({ results: [[{ transcript: 'test voice query' }]] })); }
      stop() {}
      abort() {}
    };
  });
  await openNewTab(page, extensionId);
  await page.locator('#voiceSearchBtn').click();
  await expect(page).toHaveURL('https://www.google.com/search?q=test%20voice%20query');
  await openNewTab(page, extensionId);
  await page.locator('#googleLensLink').click();
  await expect(page).toHaveURL('https://lens.google.com/');
});

test('preview permission denial remains visible and requests only the selected origin', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  await page.evaluate(() => {
    // Browser consent UI itself is outside this controlled denial-path test.
    chrome.permissions.request = async request => { window.requestedPreviewOrigins = request.origins; return false; };
  });
  await page.locator('#scourList .scour-toggle').first().click();
  await expect(page.locator('#scourList .scour-preview').first()).toContainText('permission was not granted');
  expect(await page.evaluate(() => window.requestedPreviewOrigins)).toEqual(['https://example.org/*']);
});

test('settings labels remain visible and the close control stays accessible while scrolling', async ({ page, extensionId }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openNewTab(page, extensionId);
  await page.locator('#settingsBtn').click();
  await page.getByRole('tab', { name: 'Apps & Account', exact: true }).click();
  const active = page.locator('.settings-tab-content.active');
  await active.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator('#settingsCloseBtn')).toBeInViewport();
  await expect(page.locator('.settings-tabs')).toBeInViewport();
  await expect(page.locator('#accountNameInput')).toHaveAccessibleName('Account name');
  await expect(page.locator('#accountNameInput').locator('..').locator('span')).toHaveText('Name');
  await page.screenshot({ path: path.join(output, 'settings-mobile.png') });
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsBtn')).toBeFocused();
});

test('popup updates and a stale new-tab edit cannot discard each other', async ({ page, context, extensionId }) => {
  await openNewTab(page, extensionId);
  await page.getByRole('button', { name: 'More options for Google', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Edit name/URL', exact: true }).click();
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('button', { name: 'Add shortcut', exact: true }).click();
  await popup.locator('#siteName').fill('Added in another window');
  await popup.locator('#siteUrl').fill('example.org/other');
  await popup.locator('#saveBtn').click();
  await expect(popup.locator('.launch-item')).toHaveCount(17);
  await page.locator('#siteName').fill('Edited from stale page');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#shortcutFormStatus')).toContainText('another window');
  await page.keyboard.press('Escape');
  await expect(page.locator('#launchpad > .shortcut')).toHaveCount(18);
  await page.locator('#settingsBtn').click();
  await page.locator('.theme-option[data-theme="dark"]').click();
  await expect.poll(() => popup.evaluate(async () => (await chrome.storage.local.get('sites')).sites.length)).toBe(17);
  await popup.close();
});

test('invalid filters keep the last valid view and are not saved', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  await expect(page.locator('#arxivStatus')).toContainText('Updated');
  await page.locator('.panel-advanced summary').click();
  await page.locator('#arxivFilterInput').fill('pruning');
  const count = await page.locator('#arxivList .research-card').count();
  await page.locator('#arxivFilterInput').fill('pruning AND');
  await expect(page.locator('#arxivFilterError')).toContainText('Filter not applied');
  await expect(page.locator('#arxivList .research-card')).toHaveCount(count);
  await page.locator('#arxivSaveFilterBtn').click();
  await expect(page.locator('#arxivFilterInput')).toBeFocused();
  await expect.poll(() => page.evaluate(async () => (await chrome.storage.local.get('arxivFilter')).arxivFilter)).not.toBe('pruning AND');
});

test('new installations have no personal avatar or Scour feed, and connecting a profile is validated', async ({ page, worker, extensionId }) => {
  await worker.evaluate(() => chrome.storage.local.remove('scourUrl'));
  await openNewTab(page, extensionId);
  await expect(page.locator('#scourStatus')).toContainText('No Scour profile');
  await expect(page.locator('#avatarBtn .icon-account_circle')).toBeVisible();
  await expect(page.locator('#avatarBtn')).not.toHaveClass(/has-image/);
  await page.getByRole('button', { name: 'Connect Scour', exact: true }).click();
  await page.locator('#scourUrlInput').fill('https://example.org/profile');
  await page.locator('#saveScourBtn').click();
  await expect(page.locator('#scourUrlError')).toContainText('Scour profile');
  await page.locator('#scourUrlInput').fill('https://scour.ing/@reader');
  await page.locator('#saveScourBtn').click();
  await expect(page.locator('#scourSubtitle')).toContainText('@reader');
  await expect.poll(() => page.evaluate(async () => (await chrome.storage.local.get('scourUrl')).scourUrl)).toBe('https://scour.ing/@reader');
  await page.locator('#settingsCloseBtn').click();
  await expect(page.locator('#scourList .research-card')).toHaveCount(10);
});

test('Scour cache is bound to the selected profile', async ({ page, worker, extensionId }) => {
  await openNewTab(page, extensionId);
  await expect(page.locator('#scourList .research-card')).toHaveCount(10);
  await worker.evaluate(() => { globalThis.fixtureMode = 'failed'; });
  await page.locator('#settingsBtn').click();
  await page.locator('#scourUrlInput').fill('https://scour.ing/@another-profile');
  await page.locator('#saveScourBtn').click();
  await page.locator('#settingsCloseBtn').click();
  await expect(page.locator('#scourStatus')).toContainText('Failed');
  await expect(page.locator('#scourList .research-card')).toHaveCount(0);
});

for (const [width, height] of [[1366, 768], [1920, 600]]) {
  test(`short desktop ${width}x${height} keeps a usable reading area`, async ({ page, extensionId }) => {
    await page.setViewportSize({ width, height });
    await openNewTab(page, extensionId);
    await expect(page.locator('#scourList .research-card')).toHaveCount(10);
    await expect(page.locator('#searchInput')).toBeInViewport();
    await page.locator('.scour-section').scrollIntoViewIfNeeded();
    expect(await page.locator('#scourList').evaluate(element => element.clientHeight)).toBeGreaterThan(150);
    await expect(page.locator('#scourList .research-card').first()).toBeInViewport();
    await page.screenshot({ path: path.join(output, `short-desktop-${width}.png`) });
  });
}

test('unsupported voice input provides a visible message and keeps typing available', async ({ page, extensionId }) => {
  await page.addInitScript(() => { window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
  await openNewTab(page, extensionId);
  await page.locator('#voiceSearchBtn').click();
  await expect(page.locator('#searchStatus')).toContainText('not available');
  await expect(page.locator('#searchStatus')).toBeInViewport();
  expect((await page.locator('#searchStatus').boundingBox()).height).toBeGreaterThan(10);
  await expect(page.locator('#searchInput')).toBeFocused();
});

test('speech errors remain visible after the recognizer ends', async ({ page, extensionId }) => {
  await page.addInitScript(() => {
    window.SpeechRecognition = class {
      start() { queueMicrotask(() => { this.onerror({ error: 'network' }); this.onend(); }); }
      stop() {} abort() {}
    };
  });
  await openNewTab(page, extensionId);
  await page.locator('#voiceSearchBtn').click();
  await expect(page.locator('#searchStatus')).toContainText('speech service could not be reached');
  await expect(page.locator('#searchStatus')).toBeInViewport();
  await expect(page.locator('#voiceSearchBtn')).toHaveAttribute('aria-pressed', 'false');
});

test('credential-bearing addresses are not forwarded to Google', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  const original = page.url();
  await page.locator('#searchInput').fill('https://user:example-password@example.org');
  await page.keyboard.press('Enter');
  await expect(page.locator('#searchStatus')).toContainText('not been sent to Google');
  await expect(page).toHaveURL(original);
});

test('malformed saved data does not crash either interface', async ({ page, worker, extensionId }) => {
  await worker.evaluate(() => chrome.storage.local.set({ sites: [null], appLinks: [null], arxivCustomGroups: [null], arxivRefreshMinutes: 1e200 }));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openNewTab(page, extensionId);
  await expect(page.locator('#shortcutStatus')).toContainText('could not be loaded');
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.locator('.launch-item')).toHaveCount(16);
  await expect(page.locator('#popupStatus')).toContainText('invalid');
  expect(errors).toEqual([]);
});

test('settings link and group forms validate drafts and preserve edited group identity', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  await page.locator('#settingsBtn').click();
  await page.getByRole('tab', { name: 'Apps & Account', exact: true }).click();
  await page.locator('#addAppBtn').click();
  expect(await page.locator('#appNameInput').evaluate(element => element.validationMessage)).toBe('Enter a name.');
  await page.locator('#appNameInput').fill('Research docs');
  await page.locator('#appUrlInput').fill('example.org/docs');
  await page.locator('#addAppBtn').click();
  await expect(page.locator('#appsList .settings-row')).toHaveCount(15);
  await page.locator('#appsList .settings-row').last().getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('#appsList .settings-row')).toHaveCount(14);
  await page.getByRole('tab', { name: 'arXiv', exact: true }).click();
  await page.locator('#addArxivGroupBtn').click();
  expect(await page.locator('#arxivGroupNameInput').evaluate(element => element.validationMessage)).toBe('Enter a group name.');
  for (const name of ['First group', 'Second group']) {
    await page.locator('#arxivGroupNameInput').fill(name);
    await page.locator('#arxivGroupCategoriesInput').fill('cs.AI, cs.LG');
    await page.locator('#addArxivGroupBtn').click();
    await expect(page.locator('#arxivGroupNameInput')).toHaveValue('');
  }
  await page.locator('#arxivCustomGroupList [data-action="edit"]').nth(1).click();
  await page.locator('#arxivGroupNameInput').fill('Edited second group');
  await page.locator('#arxivCustomGroupList button[data-action="remove"]').first().click();
  await expect(page.locator('#arxivCustomGroupList .settings-row')).toHaveCount(1);
  await page.locator('#addArxivGroupBtn').click();
  await expect.poll(() => page.evaluate(async () => (await chrome.storage.local.get('arxivCustomGroups')).arxivCustomGroups?.[0]?.name)).toBe('Edited second group');
  await page.locator('#arxivRefreshInput').fill('1.5');
  await page.locator('#arxivApplyRefreshBtn').click();
  await expect(page.locator('#arxivRefreshInput')).toHaveAttribute('aria-invalid', 'true');
});

test('saving a thirteenth filter does not silently discard an existing view', async ({ page, worker, extensionId }) => {
  const saved = Array.from({ length: 12 }, (_, i) => ({ label: `Saved ${i}`, query: `term${i}`, mode: 'any' }));
  await worker.evaluate(saved => chrome.storage.local.set({ arxivSavedFilters: saved }), saved);
  await openNewTab(page, extensionId);
  await page.locator('.panel-advanced summary').click();
  await page.locator('#arxivFilterInput').fill('new query');
  await page.locator('#arxivSaveFilterBtn').click();
  await expect(page.locator('#arxivFilterError')).toContainText('up to 12');
  expect(await page.evaluate(async () => (await chrome.storage.local.get('arxivSavedFilters')).arxivSavedFilters)).toEqual(saved);
});

test('invalid source payloads are reported as failure rather than no matches', async ({ page, worker, extensionId }) => {
  await worker.evaluate(() => { globalThis.fixtureMode = 'invalid'; });
  await openNewTab(page, extensionId);
  await expect(page.locator('#arxivStatus')).toContainText('Failed');
  await expect(page.locator('#favoriteStatus')).toContainText('Failed');
  await expect(page.locator('#arxivList .skeleton-item')).toHaveCount(0);
});

test('large shortcut collections remain scrollable and the Add control stays reachable', async ({ page, worker, extensionId }) => {
  const sites = Array.from({ length: 100 }, (_, index) => ({ name: `Saved site ${index}`, url: `https://example.org/${index}` }));
  await worker.evaluate(sites => chrome.storage.local.set({ sites }), sites);
  await page.goto(`chrome-extension://${extensionId}/newtab/index.html`);
  await expect(page.locator('#launchpad > .shortcut')).toHaveCount(101);
  await page.locator('.shortcuts').hover();
  await page.mouse.wheel(0, 10000);
  await expect(page.getByRole('button', { name: 'Add shortcut', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Add shortcut', exact: true }).click();
  await expect(page.locator('#siteName')).toBeFocused();
});

test('corrupt feed cache entries are ignored and recovered from the sources', async ({ page, extensionId }) => {
  await openNewTab(page, extensionId);
  await expect(page.locator('#arxivStatus')).toContainText('Updated');
  await expect(page.locator('#favoriteList .research-card')).toHaveCount(10);
  await page.evaluate(() => {
    for (const key of ['cache_arxiv', 'cache_scour', 'cache_academic_trend_v1']) {
      const cache = JSON.parse(localStorage.getItem(key));
      cache.items = [null, { title: 'Unsafe cache entry', link: 'javascript:alert(1)' }];
      localStorage.setItem(key, JSON.stringify(cache));
    }
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await expect(page.locator('#arxivStatus')).toContainText('Updated');
  await expect(page.locator('#scourList .research-card')).toHaveCount(10);
  await expect(page.locator('#favoriteList .research-card')).toHaveCount(10);
  expect(errors).toEqual([]);
});

test('Copy URL normalizes a legacy link and restores keyboard focus', async ({ page, worker, extensionId }) => {
  await worker.evaluate(() => chrome.storage.local.set({ sites: [{ name: 'Legacy link', url: 'example.org:8443/path' }] }));
  await page.goto(`chrome-extension://${extensionId}/newtab/index.html`);
  await page.evaluate(() => { navigator.clipboard.writeText = async value => { window.copiedFixtureUrl = value; }; });
  const more = page.getByRole('button', { name: 'More options for Legacy link', exact: true });
  await more.click();
  await page.getByRole('menuitem', { name: 'Copy URL', exact: true }).click();
  await expect(page.locator('#shortcutStatus')).toHaveText('Link copied');
  expect(await page.evaluate(() => window.copiedFixtureUrl)).toBe('https://example.org:8443/path');
  await expect(more).toBeFocused();
});
