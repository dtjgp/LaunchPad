const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.js',
  workers: 1,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 5000 },
  outputDir: 'test-results',
  reporter: [['list']],
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' }
});
