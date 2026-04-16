# LaunchPad Chrome Extension

A customizable new-tab and popup launchpad with search, curated feeds, and quick shortcuts.

## Features

- 🚀 Popup shortcuts with edit mode, add/remove, and drag-reorder
- 🧭 Google-style new tab with search + provider selector
- 🖱️ Right-click shortcuts to edit name/URL or delete
- 🧩 Google Apps-style menu with editable items and drag ordering
- 👤 Account menu + custom avatar URL
- 📰 arXiv panel: multi-category RSS, keyword filtering, custom groups, optional auto-refresh
- 🧵 Scour feed panel with interest tags, previews, and lazy-load pagination
- 💾 Persistent settings (Chrome storage local + sync, with localStorage stale-while-revalidate cache)
- 🎨 Favicon tiles with fallback initials and color accents

## Installation

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `LaunchPad` folder

## Usage

### Popup

- Click the LaunchPad icon to open the popup launchpad
- Click the pencil icon to enter edit mode
- Click the X to remove a shortcut
- Drag to reorder in edit mode
- Right-click a shortcut to edit name/URL or delete
- Click "Add" to add a new shortcut

### New Tab

- New tabs open the custom LaunchPad page
- Use the search bar and provider selector (Google/Gemini/Perplexity/Claude/ChatGPT)
- The arXiv panel shows the latest RSS items for selected categories
- The Scour panel pulls the latest items from `https://scour.ing/@dtjgp`

### Settings

Open Settings (gear icon) to configure:

- Custom avatar URL
- Apps menu items
- Account menu items
- arXiv categories, custom groups, and auto-refresh interval

### arXiv Filter Syntax

- Use AND/OR, quotes for phrases, and parentheses for groups
- Example: ("structured pruning" OR pruning) AND ("edge ai" OR "on-device")

## Data and Requests

- Settings are stored in Chrome storage (local + sync) with a localStorage cache for resilience
- External requests:
  - `https://export.arxiv.org/rss/*` for arXiv feeds
  - `https://scour.ing/@dtjgp` (HTML) for Scour feed — parsed via `[data-item="post"]` SSR markup
  - `https://scour.ing/*` for article previews
  - `https://www.google.com/s2/favicons` for favicons
  - Search providers as selected

## Project Layout

- `manifest.json` - Extension manifest (MV3)
- `popup.html`, `popup.js`, `styles.css` - Popup UI
- `newtab/index.html`, `newtab/newtab.js`, `newtab/newtab.css` - New tab UI
- `background.js` - Service worker used to fetch RSS/feed content
- `icons/` - Extension icons
- `reference/` - Screenshot references

## Dev Notes

- `FORCE_RESET` flags in `popup.js` and `newtab/newtab.js` can reset storage to defaults
- The background service worker proxies feed requests via `chrome.runtime.onMessage`
