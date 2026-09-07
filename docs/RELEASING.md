# Release procedure

Release readiness and publication are separate steps. Run the checks before creating or publishing a version tag.

1. Confirm the version matches in `manifest.json`, `package.json` and `package-lock.json`.
2. Confirm project licensing and third-party notices. The build requires the project LICENSE file.
3. Run `npm ci`, `npx playwright install chromium`, then `npm run verify`. This runs browser checks against a temporary extraction of the built archive.
4. Build twice and confirm the ZIP SHA-256 is stable for unchanged source files.
5. Extract the archive into an isolated folder and smoke-test that extracted extension, including first install, new tab, popup and settings persistence. Do not use a personal browser profile for disposable tests.
6. Check current public-source loading separately from controlled browser fixtures. Record any source failures without treating an empty response as a successful fetch.
7. Review the exact intended Git diff and staged paths. Exclude `output/`, `dist/`, `node_modules/`, private data and local experiments.
8. After publication is authorized, publish the reviewed commit and verify GitHub Actions on that commit. Create a matching version tag and attach the ZIP, its `.sha256` file and release notes to a GitHub Release.
9. Download the published ZIP and compare its hash with the locally verified artifact.

## Artifact contract

`npm run build` uses an explicit runtime/legal allowlist. No development dependencies, test code, local audit output or reference screenshots are bundled. `npm run verify:package` checks file membership, source bytes and the archive hash.

Consumers install the archive as an unpacked extension, following [INSTALL.md](../INSTALL.md). GitHub publication does not publish to the Chrome Web Store and does not provide automatic extension updates.

## Updating artwork

Preserve the owner-approved illustration. `node scripts/render-icons.cjs` produces standard PNG sizes using Chromium's image renderer without cropping or redrawing the source. Review the resulting images and provenance file before committing an asset update.
