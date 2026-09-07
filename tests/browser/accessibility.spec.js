const AxeBuilder = require('@axe-core/playwright').default;
const { test, expect, openNewTab } = require('./extension-fixture');

async function checkAccessibility(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
}

for (const theme of ['light', 'dark']) {
  test(`${theme} new tab, dialog and settings satisfy automated WCAG checks`, async ({ page, extensionId }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openNewTab(page, extensionId);
    await expect(page.locator('#scourList .research-card')).toHaveCount(10);
    await checkAccessibility(page);
    await page.getByRole('button', { name: 'Add shortcut', exact: true }).click();
    await checkAccessibility(page);
    await page.keyboard.press('Escape');
    await page.locator('#settingsBtn').click();
    await checkAccessibility(page);
  });
  test(`${theme} popup satisfies automated WCAG checks`, async ({ page, extensionId }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 360, height: 600 });
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.locator('.launch-item')).toHaveCount(16);
    await checkAccessibility(page);
  });
}
