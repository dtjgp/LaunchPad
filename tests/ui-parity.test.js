const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'newtab/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'newtab/newtab.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'newtab/newtab.js'), 'utf8');

test('arXiv and GitHub use the same panel and card primitives', () => {
  assert.match(html, /id="arxivPanel"[^>]*class="[^"]*research-panel/);
  assert.match(html, /id="favoritePanel"[^>]*class="[^"]*research-panel/);
  assert.match(css, /\.research-panel\s*\{/);
  assert.match(css, /\.research-card\s*\{/);
  assert.match(js, /className = 'panel-item research-card'/);
  assert.match(js, /className = 'favorite-item research-card'/);
});

test('arXiv exposes research tracks before collapsible advanced filtering', () => {
  assert.match(html, /id="arxivResearchTracks"/);
  assert.match(html, /<details[^>]*class="[^"]*panel-advanced/);
  assert.match(html, /Advanced filters/);
  assert.match(js, /buildArxivResearchPreset/);
  assert.match(js, /matches from/);
});

test('side panels and cards have paired motion with reduced-motion protection', () => {
  assert.match(css, /@keyframes panel-enter-left/);
  assert.match(css, /@keyframes panel-enter-right/);
  assert.match(css, /@keyframes research-card-enter/);
  assert.match(css, /animation-delay:\s*calc\(var\(--item-index/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.research-card/);
});

test('the account control uses a generic fallback and only loads a user-selected avatar', () => {
  assert.match(html, /does not read your Google profile/);
  assert.doesNotMatch(js, /DEFAULT_GOOGLE_AVATAR_URL|ACg8ocJK/);
  assert.match(js, /resolveAvatarUrl\(avatarUrl\)/);
  assert.match(js, /avatarImage\.onerror/);
  assert.match(js, /icon-account_circle/);
});

test('Scour uses the same panel, status, list, and card primitives as both research sidebars', () => {
  assert.match(html, /id="arxivPanel"[^>]*class="[^"]*dashboard-panel/);
  assert.match(html, /id="favoritePanel"[^>]*class="[^"]*dashboard-panel/);
  assert.match(html, /class="[^"]*scour-section[^"]*dashboard-panel/);
  assert.match(html, /id="scourStatus"[^>]*class="[^"]*panel-status/);
  assert.match(html, /id="scourList"[^>]*class="[^"]*panel-list/);
  assert.match(js, /className = 'scour-item research-card'/);
  assert.match(js, /scour-item-title research-card-title/);
  assert.match(js, /scour-item-meta research-card-meta/);
  assert.match(css, /@keyframes panel-enter-bottom/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.scour-section/);
});

test('LaunchPad owns the masthead while search is a Google-only native-style launcher', () => {
  assert.match(html, /class="product-brand"/);
  assert.match(html, />LaunchPad</);
  assert.match(html, />Research workspace</);
  assert.doesNotMatch(html, /google-logo-img/);
  assert.doesNotMatch(html, /googlelogo_color/);
  assert.match(html, /<form[^>]*id="googleSearchForm"[^>]*role="search"/);
  assert.match(html, /id="searchInput"[^>]*placeholder="Search Google or type a URL"/);
  assert.match(html, /id="voiceSearchBtn"[^>]*aria-label="Search by voice"/);
  assert.match(html, /id="googleLensLink"[^>]*href="https:\/\/lens\.google\.com\/"/);
  assert.doesNotMatch(html, /searchEnginePicker|searchEngineTrigger|searchEngineDropdown/);
  assert.doesNotMatch(js, /SEARCH_ENGINES|searchEngine\b|gemini\.google|perplexity\.ai|claude\.ai|chatgpt\.com/);
  assert.match(js, /resolveGoogleSearchTarget\(searchInput\.value\)/);
  assert.match(css, /\.search-action\s*\{/);
  assert.match(css, /\.search\s*\{[^}]*flex-shrink:\s*0;/);
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*?\.search\s*\{[^}]*gap:\s*6px;[^}]*padding:/);
  assert.match(css, /@keyframes brand-enter/);
});
