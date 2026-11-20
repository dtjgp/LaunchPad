# Changelog

## 1.2.1 — 2026-11-20

- Scour: the panel reads the profile's official `rss.xml` / `atom.xml` feed, which has no browser check, before trying the profile page. Item links open the original article and Scour categories show as tags.

## 1.2.0 — 2026-11-20

- arXiv: fresher feed, richer paper cards, and PDF, BibTeX and read-later actions with a Saved list.
- Optional Hugging Face Daily Papers source; HF Hot shows all papers by default with an opt-in topic filter.
- Each panel has its own refresh button and last-updated time.
- Academic GitHub Trend: time windows, an area filter, and a GitHub Search fallback with a visible status when OSS Insight is paused upstream.
- Optional Google account picture (off by default) through `chrome.identity` with the `userinfo.profile` scope, re-checked silently at most once a minute; Disconnect removes the token, picture and permissions.
- The manifest pins the extension ID `bhppmjiledkmeodkecnbdipllhlabplh`. Upgrading an older unpacked install changes its ID once; see INSTALL.md to keep settings.
- Search box follows Chrome's new tab searchbox: 56px light pill, voice and Lens targets, and an AI Mode button that opens Google AI Mode with the typed query.
- Optional Google search suggestions, off by default: a Chrome-style dropdown with keyboard selection. Switching them on requests only `www.google.com`; requests omit cookies, and switching off removes the access.
- Shortcut tiles use Chrome's new tab tile geometry: 112px tiles, 48px icon circles, single-line titles and translucent hover.
- Popup shortcut tiles share the new tab tile style and color roles.
- Neutral colors follow Chrome's default new tab page: white or `#3C3C3C` page, filled module panels without borders.
- Shortcut icons come from Chrome's local favicon cache (new `favicon` permission) instead of Google's favicon service; sites without a cached icon show their first letter.
- arXiv: an update without new papers (weekends, holidays) keeps cached papers instead of clearing the panel.
- Scour: its browser-check page is reported as "Scour requires a browser check" instead of an empty feed. LaunchPad does not try to pass the check.
- The new tab search box moves to `newtab/search.js`; unused new-tab edit-button code is removed.

## 1.1.0 — 2026-09-07

- Google-only search with direct URL navigation, voice-input handling and Google Lens.
- Shared research panels for arXiv, configurable Scour profiles and academic GitHub discovery.
- Material-inspired themes, keyboard shortcut menus, accessible forms and adaptive layouts.
- Source-bound caches, explicit loading/empty/failure feedback and strict filter parsing.
- Local-first settings writes, field-level merge metadata and conflict detection across extension windows.
- Background request validation, preview-origin checks and bounded streamed responses.
- Browser/accessibility regressions, CI checks and reproducible release packaging.
- MIT project license, installation guide, privacy policy and third-party notices.

## Initial repository version

The original new-tab and popup prototype. No GitHub Release artifact was published for this revision at the time the 1.1.0 release preparation began.
