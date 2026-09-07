# Contributing

Start with a focused issue or pull request describing the user-visible problem and a way to reproduce it. Keep changes within the extension's native JavaScript/HTML/CSS architecture and preserve existing user settings.

## Development

Use Node.js 20 or newer (CI uses Node.js 22):

```sh
npm ci
npx playwright install chromium
npm run check
npm test
npm run test:ui
```

Browser tests use disposable Chromium extension profiles. They do not use your personal Chrome profile. Test feed data is labeled and controlled; live-source checks must be reported separately.

## Before a pull request

- Add meaningful regression coverage for behavior changes.
- Check new-tab and popup behavior, keyboard access and both color schemes when affected.
- Preserve source, cache, partial-result and failure distinctions.
- Do not add broad required host permissions to avoid a permission prompt.
- Use the shared settings keys and writer. Avoid full stale-state overwrites across extension contexts.
- Keep private URLs, credentials, local traces, dependency folders and generated archives out of the change.
- Describe what was changed, how it was verified and any remaining limitations.

The release checks and packaging workflow are documented in [docs/RELEASING.md](docs/RELEASING.md).
