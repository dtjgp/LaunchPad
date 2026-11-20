# LaunchPad

A Google-style research start page for Chrome. Search or open a URL, keep your shortcuts close, and scan arXiv, Scour and academic GitHub projects from one place.

![LaunchPad new tab with public research feeds connected](docs/images/newtab-light.png)

## Install

Download a ZIP from [GitHub Releases](https://github.com/dtjgp/LaunchPad/releases), extract it into a permanent folder, and load that folder with **Load unpacked** in `chrome://extensions` (Developer mode enabled). Open a new tab or pin LaunchPad to use its popup.

See [INSTALL.md](INSTALL.md) for full installation, update and removal instructions. Chrome 114 or newer is required; current stable Chrome is recommended. Running the extension needs no Node.js, API key or LaunchPad account.

## What it does

- **Search and launch**: a search box styled like Chrome's new tab page, with Google-only queries, direct HTTP(S)/local URLs, browser voice input when available, Google Lens and an AI Mode button. Optional Google suggestions (off by default) appear in a Chrome-style dropdown.
- **Shortcuts**: add, edit, remove and drag to reorder in the popup and new tab. Hover or focus a tile to find its More menu; right-click also works.
- **arXiv Radar**: four research tracks combine RSS categories and text filters. Advanced filters support phrases, AND/OR and grouped expressions, with clear syntax errors and saved views. A **Latest | HF Hot** switch shows Hugging Face Daily Papers ranked by upvotes (optional `huggingface.co` access); papers that match show their upvotes and a Code link when a GitHub repository is listed. Every arXiv card links its PDF, copies a BibTeX entry, and can be saved to a **Saved** read-later list kept in local extension storage on this device.
- **Scour Inbox**: connect a public profile in Settings. A new installation has no personal feed configured. Source changes do not reuse another profile's cached items.
- **Academic GitHub**: research-profile ranking with three windows — **Active** (OSS Insight's seven-day pool plus GitHub Search repos pushed in 180 days), **New 90d** and **New 30d** (GitHub Search repos created in that window) — and a research-area filter. Each window has its own one-hour cache. When OSS Insight reports its trend data as unavailable upstream, the status says so and GitHub Search fills the list instead of reporting a failure. The displayed source/window/coverage describe which data was actually available.
- **Themes and layout**: light, dark and system modes, adjustable research-panel visibility, responsive layouts and keyboard-accessible controls.

The research tracks cover Edge AI/model compression, communication systems, energy systems and VLA/research agents. Keyword matches and ranking scores help discovery; they do not assess paper quality. GitHub stars are total counts, not seven-day star growth.

## Daily use

| Action | How |
|---|---|
| Focus search | `Ctrl+K` / `⌘K` |
| Search or open the typed address | `Enter` |
| Choose a suggestion (when enabled) | `↑` / `↓`, then `Enter` |
| Close a dialog/menu or return to search | `Escape` |
| Edit a shortcut | More → Edit, or right-click |
| Reorder shortcuts | More → Edit shortcuts, then drag; use the pencil button in the popup |
| Show/hide research panels | arXiv / Trend controls at the top |
| Configure sources and appearance | Settings |

The account button opens configurable links to Google account pages. In Settings, **Use Google account picture** (off by default) shows the picture of the Google account signed in to Chrome; it requests the optional `identity` permission and `www.googleapis.com` access, reads only the `userinfo.profile` picture, keeps the image URL on this device and refreshes it every 6 hours or with **Refresh picture**. **Disconnect** removes the token, the saved picture and both permissions. An optional HTTPS custom avatar is used when the Google picture is off or unavailable.

#### Enable the Google account picture in your build

The repository ships a placeholder OAuth client, so Settings shows "Not configured" until you add your own:

1. Give the extension a stable ID: in `chrome://extensions` use **Pack extension** once, then copy the public key into a top-level `"key"` field in `manifest.json` (or reuse the Chrome Web Store item key). Keep the private `.pem` out of the repository.
2. In Google Cloud Console, configure the OAuth consent screen and create an OAuth client ID of type **Chrome Extension** with that extension ID.
3. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` in `manifest.json` → `oauth2.client_id`, then reload the extension.

### Filter examples

```text
pruning OR quantization
("edge ai" OR "on-device") AND inference
energy AND (pricing OR "demand response")
```

Terms use case-insensitive text matching against title and abstract. AND takes precedence over OR. Quotes group phrases; parentheses group expressions. Comma or `&` means AND; semicolon or `|` means OR. The OR/AND selector controls the operator between adjacent terms. Invalid expressions are not applied or saved; the last valid view stays visible.

## Reliability and privacy

Settings are written locally before Chrome sync. Unrelated changes from another window are preserved; conflicting edits are reported. Feed status distinguishes cached results, partial updates, empty matches and failures. If a source is unavailable, retry or open its page directly.

Article previews request permission for the selected HTTPS origin. A redirecting page, login-only page or JavaScript-only article may need to be opened directly. Microphone availability and speech processing depend on your browser and its provider; Lens opens Google's website.

Read [PRIVACY.md](PRIVACY.md) for storage, external requests, voice input and permission controls, and [SECURITY.md](SECURITY.md) for reporting security issues.

## Develop and verify

Use Node.js 20+ (CI uses 22):

```sh
npm ci
npx playwright install chromium
npm run check
npm test
npm run test:ui
npm run build
npm run verify:package
```

Browser regressions use disposable Chromium extension profiles with real extension storage and controlled feed fixtures. Accessibility checks use axe-core. Real source checks are separate; automated tests do not prove microphone transcription, native permission-consent UI or external data quality.

The release ZIP uses an explicit runtime/legal file allowlist. It includes no npm dependencies, test fixtures or local audit traces. Build output and local test evidence are ignored by Git.

See [CONTRIBUTING.md](CONTRIBUTING.md), [release instructions](docs/RELEASING.md), [CHANGELOG.md](CHANGELOG.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Project structure

| Files | Responsibility |
|---|---|
| `manifest.json`, `background.js` | Extension entry points, permissions and bounded source requests |
| `core.js`, `shared.js`, `design-tokens.css` | URL/settings validation, persistence, shared presentation and themes |
| `filter-query.js`, `arxiv-research.js`, `academic-trend.js` | Filter syntax, research presets and discovery ranking |
| `newtab/search.js` | New tab search box: Google routing, AI Mode, voice input and opt-in suggestions |
| `newtab/`, `popup.html`, `popup.js`, `styles.css` | Browser interfaces |
| `tests/`, `scripts/`, `.github/workflows/` | Verification and release packaging |

## Troubleshooting

- **The new tab has not changed after an update**: reload the extension and open a fresh tab. Update files in the same permanent folder to preserve an unpacked extension's identity.
- **No Scour items**: configure a public profile URL and check its source page. Login-only content is not a supported feed.
- **GitHub/arXiv shows cached or partial data**: a source may be unavailable or rate-limited. The label describes the available evidence; retry later.
- **A save fails**: input remains available. Fix the displayed validation/storage problem and retry. If another window changed the same setting, reload the page before saving again.
- **A preview fails**: check the requested site permission or open the article directly. Redirects are rejected for preview requests.

For a bug report, include browser/OS, release version, reproduction steps and a screenshot with personal information removed. Do not attach full storage dumps or private URLs.

LaunchPad is available under the [MIT License](LICENSE). Third-party assets retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
