const launchpad = document.getElementById('launchpad');
const addForm = document.getElementById('addForm');
const editModeBtn = document.getElementById('editModeBtn'); // may be null (removed from topbar)
const siteNameInput = document.getElementById('siteName');
const siteUrlInput = document.getElementById('siteUrl');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const addTitle = document.querySelector('.add-title');
const appsBtn = document.getElementById('appsBtn');
const appsMenu = document.getElementById('appsMenu');
const appsTrack = document.getElementById('appsTrack');
const avatarBtn = document.getElementById('avatarBtn');
const accountMenu = document.getElementById('accountMenu');
const searchInput = document.getElementById('searchInput');
const searchEnginePicker = document.getElementById('searchEnginePicker');
const searchEngineTrigger = document.getElementById('searchEngineTrigger');
const searchEngineLabel = document.getElementById('searchEngineLabel');
const searchEngineDropdown = document.getElementById('searchEngineDropdown');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const settingsStatus = document.getElementById('settingsStatus');
const avatarUrlInput = document.getElementById('avatarUrlInput');
const appsList = document.getElementById('appsList');
const accountList = document.getElementById('accountList');
const appNameInput = document.getElementById('appNameInput');
const appUrlInput = document.getElementById('appUrlInput');
const addAppBtn = document.getElementById('addAppBtn');
const accountNameInput = document.getElementById('accountNameInput');
const accountUrlInput = document.getElementById('accountUrlInput');
const addAccountBtn = document.getElementById('addAccountBtn');
const arxivList = document.getElementById('arxivList');
const arxivStatus = document.getElementById('arxivStatus');
const arxivSubtitle = document.getElementById('arxivSubtitle');
const arxivFilterInput = document.getElementById('arxivFilterInput');
const arxivFilterClear = document.getElementById('arxivFilterClear');
const arxivFilterMode = document.getElementById('arxivFilterMode');
const arxivFilterHelpBtn = document.getElementById('arxivFilterHelpBtn');
const arxivFilterHelp = document.getElementById('arxivFilterHelp');
const scourStatus = document.getElementById('scourStatus');
const scourList = document.getElementById('scourList');
const favoriteStatus = document.getElementById('favoriteStatus');
const favoriteList = document.getElementById('favoriteList');
const arxivToggle = document.getElementById('arxivToggle');
const favoriteToggle = document.getElementById('favoriteToggle');
const editBanner = document.getElementById('editBanner');
const editBannerDone = document.getElementById('editBannerDone');

// Favorite Links feed URL - use master branch
const FAVORITE_FEED_URL = 'https://raw.githubusercontent.com/guanguans/favorite-link/master/README.md';
const arxivCategoryInput = document.getElementById('arxivCategoryInput');
const arxivRefreshBtn = document.getElementById('arxivRefreshBtn');
const arxivCategorySelect = document.getElementById('arxivCategorySelect');
const arxivRefreshInput = document.getElementById('arxivRefreshInput');
const arxivApplyRefreshBtn = document.getElementById('arxivApplyRefreshBtn');
const arxivChips = document.querySelectorAll('.chip');
const arxivGroupList = document.getElementById('arxivGroupList');
const arxivCustomGroupList = document.getElementById('arxivCustomGroupList');
const arxivGroupNameInput = document.getElementById('arxivGroupNameInput');
const arxivGroupCategoriesInput = document.getElementById('arxivGroupCategoriesInput');
const addArxivGroupBtn = document.getElementById('addArxivGroupBtn');
const cancelArxivGroupBtn = document.getElementById('cancelArxivGroupBtn');

let isEditMode = false;
let sites = [];
let appLinks = [];
let editingIndex = null;
let contextIndex = null;
let accountLinks = [];
let avatarUrl = '';
let arxivCategories = ['cs.AI'];
let arxivRefreshMinutes = 0;
let arxivRefreshTimer = null;
let arxivCustomGroups = [];
let editingGroupIndex = null;
let arxivItems = [];
let arxivFilter = '';
let arxivFilterModeValue = 'any';
let searchEngine = 'google';
let themeMode = 'auto';
const scourPreviewCache = new Map();
let scourItems = [];
let scourRendered = 0;
let scourLoadingMore = false;
const SCOUR_BATCH_SIZE = 10;
let groupDragIndex = null;

const LOG_STORAGE_KEY = 'logs';
const MAX_LOGS = 200;

const SEARCH_ENGINES = [
  {
    id: 'google',
    label: 'Google',
    placeholder: 'Search Google or type a URL',
    url: 'https://www.google.com/search?q={query}'
  },
  {
    id: 'gemini',
    label: 'Gemini',
    placeholder: 'Ask Gemini or type a URL',
    url: 'https://gemini.google.com/app?q={query}'
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    placeholder: 'Ask Perplexity or type a URL',
    url: 'https://www.perplexity.ai/search?q={query}'
  },
  {
    id: 'claude',
    label: 'Claude',
    placeholder: 'Ask Claude or type a URL',
    url: 'https://claude.ai/new?q={query}'
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    placeholder: 'Ask ChatGPT or type a URL',
    url: 'https://chatgpt.com/?q={query}'
  }
];

const STORAGE_KEYS = [
  'sites',
  'appLinks',
  'accountLinks',
  'avatarUrl',
  'arxivCategory',
  'arxivCategories',
  'arxivRefreshMinutes',
  'arxivCustomGroups',
  'arxivFilter',
  'arxivFilterMode',
  'searchEngine',
  'themeMode'
];

const defaultArxivGroups = [
  { name: 'Machine Learning', categories: ['cs.LG', 'stat.ML'] },
  { name: 'Vision', categories: ['cs.CV'] },
  { name: 'Language', categories: ['cs.CL'] },
  { name: 'Robotics', categories: ['cs.RO'] },
  { name: 'Comm & Networks', categories: ['cs.NI', 'cs.IT', 'eess.SP'] },
  { name: 'Systems & Control', categories: ['eess.SY'] }
];

// escapeHtml, safeColor, defaultSites are provided by shared.js

const FORCE_RESET = false;
const ARXIV_FEED_BASE = 'https://export.arxiv.org/rss/';
const SCOUR_URL = 'https://scour.ing/@dtjgp';

const CACHE_KEYS = {
  arxiv: 'cache_arxiv',
  scour: 'cache_scour',
  favorite: 'cache_favorite'
};

function renderSkeleton(container, count = 4) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = 'skeleton-item';
    item.innerHTML = `
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
    `;
    container.appendChild(item);
  }
}

function readLocalJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeLocalJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('localStorage write failed:', key, error.message);
  }
}

async function logEvent(level, message, meta = {}) {
  try {
    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      meta
    };
    const stored = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const logs = Array.isArray(stored[LOG_STORAGE_KEY]) ? stored[LOG_STORAGE_KEY] : [];
    logs.push(entry);
    const trimmed = logs.slice(-MAX_LOGS);
    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: trimmed });
  } catch (error) {
    // Ignore logging failures to avoid breaking UX.
  }
}

async function readStoredSettings() {
  const local = await chrome.storage.local.get(STORAGE_KEYS);
  let sync = {};
  if (chrome.storage?.sync) {
    try {
      sync = await chrome.storage.sync.get(STORAGE_KEYS);
    } catch (error) {
      sync = {};
    }
  }
  const cache = {
    arxivCategories: readLocalJson('arxivCategories'),
    arxivRefreshMinutes: readLocalJson('arxivRefreshMinutes'),
    arxivCustomGroups: readLocalJson('arxivCustomGroups'),
    arxivFilter: readLocalJson('arxivFilter'),
    arxivFilterMode: readLocalJson('arxivFilterMode'),
    searchEngine: readLocalJson('searchEngine'),
    themeMode: readLocalJson('themeMode')
  };
  return { local, sync, cache };
}

function pickStoredArray(...candidates) {
  for (const value of candidates) {
    if (Array.isArray(value) && value.length) {
      return value;
    }
  }
  return null;
}

// defaultSites is provided by shared.js

const defaultAppLinks = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png' },
  { name: 'Drive', url: 'https://drive.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png' },
  { name: 'Docs', url: 'https://docs.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/docs_2020q4_32dp.png' },
  { name: 'Calendar', url: 'https://calendar.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_32dp.png' },
  { name: 'Maps', url: 'https://maps.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/maps_32dp.png' },
  { name: 'Photos', url: 'https://photos.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/photos_96dp.png' },
  { name: 'News', url: 'https://news.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/news_96dp.png' },
  { name: 'Meet', url: 'https://meet.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/meet_2020q4_32dp.png' },
  { name: 'YouTube', url: 'https://youtube.com', icon: 'https://www.gstatic.com/images/branding/product/1x/youtube_32dp.png' },
  { name: 'Finance', url: 'https://www.google.com/finance', icon: 'https://ssl.gstatic.com/finance/favicon/finance_496x496.png' },
  { name: 'NotebookLM', url: 'https://notebooklm.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/notebooklm_32dp.png' },
  { name: 'Play', url: 'https://play.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/play_prism_32dp.png' },
  { name: 'Keep', url: 'https://keep.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/keep_2020q4_32dp.png' },
  { name: 'Google One', url: 'https://one.google.com', icon: 'https://www.gstatic.com/images/branding/product/1x/one_32dp.png' }
];

// URL-to-icon lookup for apps whose favicon API returns generic icons
const APP_ICON_MAP = new Map(defaultAppLinks.filter(a => a.icon).map(a => [a.url, a.icon]));

const defaultAccountLinks = [
  { name: 'Manage your Google Account', url: 'https://myaccount.google.com' },
  { name: 'Add another account', url: 'https://accounts.google.com/AddSession' },
  { name: 'Sign out', url: 'https://accounts.google.com/Logout' },
  { name: 'Privacy', url: 'https://policies.google.com/privacy' },
  { name: 'Terms', url: 'https://policies.google.com/terms' },
  { name: 'Search settings', url: 'https://www.google.com/preferences' }
];

async function init() {
  if (FORCE_RESET) {
    sites = [...defaultSites];
    appLinks = [...defaultAppLinks];
    accountLinks = [...defaultAccountLinks];
    avatarUrl = '';
    arxivCategories = ['cs.AI'];
    await saveAll();
  } else {
    const stored = await readStoredSettings();
    sites = stored.local.sites || stored.sync.sites || defaultSites;
    appLinks = stored.local.appLinks || stored.sync.appLinks || defaultAppLinks;
    accountLinks = stored.local.accountLinks || stored.sync.accountLinks || defaultAccountLinks;
    avatarUrl = stored.local.avatarUrl || stored.sync.avatarUrl || '';

    let storedCategories = null;
    let categorySource = 'default';
    if (Array.isArray(stored.local.arxivCategories) && stored.local.arxivCategories.length) {
      storedCategories = stored.local.arxivCategories;
      categorySource = 'local';
    } else if (Array.isArray(stored.sync.arxivCategories) && stored.sync.arxivCategories.length) {
      storedCategories = stored.sync.arxivCategories;
      categorySource = 'sync';
    } else if (Array.isArray(stored.cache.arxivCategories) && stored.cache.arxivCategories.length) {
      storedCategories = stored.cache.arxivCategories;
      categorySource = 'cache';
    }

    if (storedCategories) {
      arxivCategories = storedCategories;
    } else {
      const fallback = stored.local.arxivCategory || stored.sync.arxivCategory || 'cs.AI';
      categorySource = fallback === 'cs.AI' ? 'default' : 'legacy';
      arxivCategories = [fallback];
    }

    const refreshCandidate = Number.isFinite(stored.local.arxivRefreshMinutes)
      ? stored.local.arxivRefreshMinutes
      : Number.isFinite(stored.sync.arxivRefreshMinutes)
        ? stored.sync.arxivRefreshMinutes
        : stored.cache.arxivRefreshMinutes;
    arxivRefreshMinutes = Number.isFinite(refreshCandidate) ? refreshCandidate : 0;

    const customGroups = pickStoredArray(
      stored.local.arxivCustomGroups,
      stored.sync.arxivCustomGroups,
      stored.cache.arxivCustomGroups
    );
    arxivCustomGroups = customGroups || [];

    const filterCandidate = stored.local.arxivFilter ?? stored.sync.arxivFilter ?? stored.cache.arxivFilter;
    arxivFilter = typeof filterCandidate === 'string' ? filterCandidate : '';

    const filterModeCandidate =
      stored.local.arxivFilterMode ?? stored.sync.arxivFilterMode ?? stored.cache.arxivFilterMode;
    arxivFilterModeValue = filterModeCandidate === 'all' ? 'all' : 'any';

    const engineCandidate =
      stored.local.searchEngine ?? stored.sync.searchEngine ?? stored.cache.searchEngine;
    if (SEARCH_ENGINES.some(engine => engine.id === engineCandidate)) {
      searchEngine = engineCandidate;
    }

    const themeCandidate =
      stored.local.themeMode ?? stored.sync.themeMode ?? stored.cache.themeMode;
    if (['light', 'dark', 'auto'].includes(themeCandidate)) {
      themeMode = themeCandidate;
    }

    if (categorySource !== 'local') {
      void logEvent('info', 'arxiv categories restored', {
        source: categorySource,
        categories: arxivCategories
      });
    }
  }
  applyTheme();
  applyAvatar();
  render();
  renderMenus();
  applyArxivControls();
  applySearchEngine();
  loadArxivFeed();
  loadScourFeed();
  loadFavoriteFeed();
}

function render() {
  launchpad.innerHTML = '';

  if (sites.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="17.5" y1="14" x2="17.5" y2="21"/><line x1="14" y1="17.5" x2="21" y2="17.5"/></svg>
      <span>No shortcuts yet. Click + to add one.</span>
    `;
    launchpad.appendChild(empty);
    launchpad.appendChild(addBtn);
    return;
  }

  sites.forEach((site, index) => {
    const item = document.createElement('a');
    item.className = 'shortcut';
    item.href = site.url;
    item.target = '_blank';
    item.rel = 'noopener';
    item.dataset.type = 'shortcut';
    item.dataset.index = String(index);
    item.draggable = isEditMode;
    item.style.animationDelay = `${index * 30}ms`;
    item.innerHTML = `
      <div class="shortcut-icon">
        ${getFavicon(site.url, site.name)}
      </div>
      <div class="shortcut-name">${escapeHtml(site.name)}</div>
      <button class="delete-btn" data-index="${index}" aria-label="Remove shortcut">&times;</button>
    `;
    launchpad.appendChild(item);
  });

  launchpad.appendChild(addBtn);

  launchpad.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      sites.splice(index, 1);
      saveSites();
      render();
    });
  });
}

function getFavicon(url, fallback) {
  try {
    const domain = new URL(url).hostname;
    return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt="">`;
  } catch {
    return `<span>${(fallback || '?').slice(0, 1).toUpperCase()}</span>`;
  }
}

function saveSites() {
  return chrome.storage.local.set({ sites });
}

function saveAll() {
  const payload = {
    sites,
    appLinks,
    accountLinks,
    avatarUrl,
    arxivCategories,
    arxivRefreshMinutes,
    arxivCustomGroups,
    arxivFilter,
    arxivFilterMode: arxivFilterModeValue,
    searchEngine,
    themeMode
  };
  chrome.storage.local.set(payload);
  if (chrome.storage?.sync) {
    chrome.storage.sync.set(payload);
  }
  writeLocalJson('arxivCategories', arxivCategories);
  writeLocalJson('arxivRefreshMinutes', arxivRefreshMinutes);
  writeLocalJson('arxivCustomGroups', arxivCustomGroups);
  writeLocalJson('arxivFilter', arxivFilter);
  writeLocalJson('arxivFilterMode', arxivFilterModeValue);
  writeLocalJson('searchEngine', searchEngine);
  writeLocalJson('themeMode', themeMode);
  return payload;
}

let settingsFlashTimer = null;
function flashSettingsSaved() {
  if (!settingsStatus) return;
  settingsStatus.textContent = 'Saved';
  settingsStatus.style.opacity = '1';
  clearTimeout(settingsFlashTimer);
  settingsFlashTimer = setTimeout(() => {
    settingsStatus.style.opacity = '0';
  }, 1500);
}

function setStatusWithRetry(el, message, retryFn) {
  el.innerHTML = '';
  const span = document.createElement('span');
  span.className = 'status-error';
  span.textContent = message;
  el.appendChild(span);
  if (retryFn) {
    const btn = document.createElement('button');
    btn.className = 'status-retry';
    btn.textContent = 'Retry';
    btn.addEventListener('click', retryFn);
    el.appendChild(btn);
  }
}

function renderMenus() {
  renderAppsMenu();
  renderAccountMenu();
}

function isValidAvatarUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'data:';
  } catch {
    return false;
  }
}

function applyAvatar() {
  if (avatarUrl && isValidAvatarUrl(avatarUrl)) {
    avatarBtn.style.backgroundImage = `url("${avatarUrl.replace(/["\\]/g, '')}")`;
    avatarBtn.classList.add('has-image');
    avatarBtn.textContent = '';
    return;
  }
  avatarBtn.style.backgroundImage = '';
  avatarBtn.classList.remove('has-image');
  avatarBtn.textContent = 'U';
}

function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

function renderSettingsList(container, items, type) {
  container.innerHTML = '';
  items.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'settings-row';
    row.innerHTML = `
      <div class="settings-row-main">
        <div class="settings-row-name">${escapeHtml(entry.name)}</div>
        <div class="settings-row-url">${escapeHtml(entry.url)}</div>
      </div>
      <button class="btn secondary" data-type="${escapeHtml(type)}" data-index="${index}">Remove</button>
    `;
    container.appendChild(row);
  });
}

function applyTheme() {
  document.body.classList.remove('theme-light', 'theme-dark');
  if (themeMode === 'light') {
    document.body.classList.add('theme-light');
  } else if (themeMode === 'dark') {
    document.body.classList.add('theme-dark');
  }
}

function updateThemeSwitcher() {
  const switcher = document.getElementById('themeSwitcher');
  if (!switcher) return;
  switcher.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeMode);
  });
}

function renderSettingsPanel() {
  avatarUrlInput.value = avatarUrl;
  updateThemeSwitcher();
  renderSettingsList(appsList, appLinks, 'app');
  renderSettingsList(accountList, accountLinks, 'account');
  arxivCategoryInput.value = arxivCategories.join(', ');
  if (arxivCategorySelect) {
    Array.from(arxivCategorySelect.options).forEach(option => {
      option.selected = arxivCategories.includes(option.value);
    });
  }
  if (arxivRefreshInput) {
    arxivRefreshInput.value = arxivRefreshMinutes ? String(arxivRefreshMinutes) : '';
  }
  updateArxivChips();
  renderArxivGroups();
}

function applyArxivControls() {
  if (arxivCategorySelect) {
    Array.from(arxivCategorySelect.options).forEach(option => {
      option.selected = arxivCategories.includes(option.value);
    });
  }
  updateArxivChips();
  updateArxivGroups();
  if (arxivSubtitle) {
    arxivSubtitle.textContent = arxivCategories.join(', ') || 'cs.AI';
  }
  if (arxivFilterInput) {
    arxivFilterInput.value = arxivFilter;
  }
  if (arxivFilterMode) {
    arxivFilterMode.value = arxivFilterModeValue;
  }
  setupArxivRefreshTimer();
}

function getSearchEngine(id) {
  return SEARCH_ENGINES.find(engine => engine.id === id) || SEARCH_ENGINES[0];
}

function applySearchEngine() {
  const engine = getSearchEngine(searchEngine);
  if (searchEngineLabel) {
    searchEngineLabel.textContent = engine.label;
  }
  if (searchInput) {
    searchInput.placeholder = engine.placeholder;
  }
  renderSearchEngineDropdown();
}

function renderSearchEngineDropdown() {
  if (!searchEngineDropdown) return;
  searchEngineDropdown.innerHTML = '';
  SEARCH_ENGINES.forEach(engine => {
    const btn = document.createElement('button');
    btn.className = 'search-engine-option' + (engine.id === searchEngine ? ' active' : '');
    btn.dataset.engineId = engine.id;
    btn.type = 'button';
    btn.role = 'option';
    btn.setAttribute('aria-selected', engine.id === searchEngine ? 'true' : 'false');
    btn.innerHTML = `
      <img class="search-engine-option-icon" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(engine.url.split('/')[2])}&sz=32" alt="">
      <span>${escapeHtml(engine.label)}</span>
      <svg class="search-engine-option-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
    `;
    searchEngineDropdown.appendChild(btn);
  });
}

function updateArxivChips() {
  arxivChips.forEach(chip => {
    chip.classList.toggle('active', arxivCategories.includes(chip.dataset.category));
  });
}

function updateArxivGroups() {
  const groups = arxivGroupList?.querySelectorAll('.group-btn') || [];
  groups.forEach(group => {
    const groupCategories = (group.dataset.categories || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    const isActive = groupCategories.length &&
      groupCategories.every(category => arxivCategories.includes(category));
    group.classList.toggle('active', isActive);
  });
}

function renderArxivGroups() {
  if (!arxivGroupList) return;
  arxivGroupList.innerHTML = '';
  const groups = [...defaultArxivGroups, ...arxivCustomGroups];
  groups.forEach(group => {
    const button = document.createElement('button');
    button.className = 'group-btn';
    button.dataset.categories = group.categories.join(',');
    button.textContent = group.name;
    arxivGroupList.appendChild(button);
  });
  updateArxivGroups();
  renderCustomGroupList();
}

function renderCustomGroupList() {
  if (!arxivCustomGroupList) return;
  arxivCustomGroupList.innerHTML = '';
  arxivCustomGroups.forEach((group, index) => {
    const row = document.createElement('div');
    row.className = 'settings-row';
    row.dataset.index = String(index);
    row.draggable = true;
    row.innerHTML = `
      <div class="settings-row-main">
        <div class="settings-row-name">${escapeHtml(group.name)}</div>
        <div class="settings-row-url">${escapeHtml(group.categories.join(', '))}</div>
      </div>
      <button class="btn secondary" data-action="edit" data-index="${index}">Edit</button>
      <button class="btn secondary" data-action="remove" data-index="${index}">Remove</button>
    `;
    arxivCustomGroupList.appendChild(row);
  });
}

function setupArxivRefreshTimer() {
  if (arxivRefreshTimer) {
    clearInterval(arxivRefreshTimer);
    arxivRefreshTimer = null;
  }
  if (arxivRefreshMinutes && arxivRefreshMinutes > 0) {
    arxivRefreshTimer = setInterval(loadArxivFeed, arxivRefreshMinutes * 60 * 1000);
  }
}

async function loadArxivFeed() {
  if (!arxivList || !arxivStatus) return;
  // stale-while-revalidate: show cached data first
  const cached = readLocalJson(CACHE_KEYS.arxiv);
  if (Array.isArray(cached) && cached.length) {
    arxivItems = cached;
    arxivStatus.textContent = 'Showing cached results...';
    renderArxivItems();
  } else {
    renderSkeleton(arxivList, 5);
    arxivStatus.textContent = 'Loading latest papers...';
  }
  try {
    const categories = arxivCategories.length ? arxivCategories : ['cs.AI'];
    const fetchCategory = async (category) => {
      const url = `${ARXIV_FEED_BASE}${encodeURIComponent(category)}`;
      let text = '';
      if (chrome.runtime?.sendMessage) {
        const result = await chrome.runtime.sendMessage({ type: 'fetchArxiv', url });
        if (!result || !result.ok) {
          throw new Error(result?.error || 'Fetch failed');
        }
        text = result.text;
      } else {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        text = await response.text();
      }
      const doc = new DOMParser().parseFromString(text, 'text/xml');
      return Array.from(doc.querySelectorAll('item')).map(item => ({
        title: item.querySelector('title')?.textContent?.trim() || 'Untitled',
        link: item.querySelector('link')?.textContent?.trim() || '#',
        pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
        description: item.querySelector('description')?.textContent?.trim() || '',
        category
      }));
    };
    const results = await Promise.allSettled(categories.map(fetchCategory));
    const seen = new Set();
    const merged = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const item of result.value) {
        if (!item.link || seen.has(item.link)) continue;
        seen.add(item.link);
        merged.push(item);
      }
    }
    if (merged.length === 0) {
      arxivStatus.textContent = 'No papers found.';
      return;
    }
    merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    arxivItems = merged.slice(0, 60);
    writeLocalJson(CACHE_KEYS.arxiv, arxivItems);
    arxivStatus.textContent = 'Updated just now';
    renderArxivItems();
  } catch (error) {
    if (!arxivItems.length) {
      setStatusWithRetry(arxivStatus, 'Failed to load arXiv feed.', loadArxivFeed);
    } else {
      arxivStatus.textContent = 'Using cached data (refresh failed)';
    }
  }
}

function tokenizeFilterQuery(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: ch === '(' ? 'LPAREN' : 'RPAREN' });
      i += 1;
      continue;
    }
    if (ch === '"') {
      i += 1;
      const start = i;
      while (i < input.length && input[i] != '"') {
        i += 1;
      }
      const phrase = input.slice(start, i).trim();
      if (phrase) {
        tokens.push({ type: 'TERM', value: phrase });
      }
      if (i < input.length && input[i] == '"') {
        i += 1;
      }
      continue;
    }
    if (ch === ',' || ch === '&') {
      tokens.push({ type: 'AND' });
      i += 1;
      continue;
    }
    if (ch === ';' || ch === '|') {
      tokens.push({ type: 'OR' });
      i += 1;
      continue;
    }
    const start = i;
    while (
      i < input.length &&
      !/\s/.test(input[i]) &&
      !['(', ')', '"', ',', '&', ';', '|'].includes(input[i])
    ) {
      i += 1;
    }
    const word = input.slice(start, i).trim();
    if (!word) {
      continue;
    }
    if (word.toLowerCase() === 'and') {
      tokens.push({ type: 'AND' });
    } else if (word.toLowerCase() === 'or') {
      tokens.push({ type: 'OR' });
    } else {
      tokens.push({ type: 'TERM', value: word });
    }
  }
  return tokens;
}

function normalizeFilterTokens(tokens, defaultOperator) {
  if (tokens.length === 0) return tokens;
  const normalized = [];
  const needsImplicit = (left, right) => {
    if (!left || !right) return false;
    const leftIsTerm = left.type === 'TERM' || left.type === 'RPAREN';
    const rightIsTerm = right.type === 'TERM' || right.type === 'LPAREN';
    return leftIsTerm && rightIsTerm;
  };
  tokens.forEach(token => {
    const last = normalized[normalized.length - 1];
    if (needsImplicit(last, token)) {
      normalized.push({ type: defaultOperator });
    }
    normalized.push(token);
  });
  return normalized;
}

function parseFilterExpression(tokens) {
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parsePrimary = () => {
    const token = peek();
    if (!token) return null;
    if (token.type === 'TERM') {
      consume();
      return { type: 'TERM', value: token.value };
    }
    if (token.type === 'LPAREN') {
      consume();
      const expr = parseOr();
      if (peek() && peek().type === 'RPAREN') {
        consume();
      }
      return expr;
    }
    return null;
  };

  const parseAnd = () => {
    let left = parsePrimary();
    while (peek() && peek().type === 'AND') {
      consume();
      const right = parsePrimary();
      left = left && right ? { type: 'AND', left, right } : left;
    }
    return left;
  };

  const parseOr = () => {
    let left = parseAnd();
    while (peek() && peek().type === 'OR') {
      consume();
      const right = parseAnd();
      left = left && right ? { type: 'OR', left, right } : left;
    }
    return left;
  };

  const ast = parseOr();
  if (pos < tokens.length) {
    return null;
  }
  return ast;
}

function matchesFilterAst(ast, haystack) {
  if (!ast) return true;
  if (ast.type === 'TERM') {
    return haystack.includes(ast.value.toLowerCase());
  }
  if (ast.type === 'AND') {
    return matchesFilterAst(ast.left, haystack) && matchesFilterAst(ast.right, haystack);
  }
  if (ast.type === 'OR') {
    return matchesFilterAst(ast.left, haystack) || matchesFilterAst(ast.right, haystack);
  }
  return true;
}

function legacyFilterMatch(trimmed, haystack) {
  const orGroups = trimmed
    .split(/[;|]/)
    .map(group => group.trim())
    .filter(Boolean)
    .map(group => group.split(/[,&]/).map(term => term.trim().toLowerCase()).filter(Boolean))
    .filter(group => group.length > 0);
  const useAdvanced = orGroups.length > 1;
  const terms = trimmed
    ? trimmed.split(/[,&]/).map(value => value.trim().toLowerCase()).filter(Boolean)
    : [];
  if (useAdvanced) {
    return orGroups.some(group => group.every(term => haystack.includes(term)));
  }
  if (arxivFilterModeValue === 'all') {
    return terms.every(term => haystack.includes(term));
  }
  return terms.some(term => haystack.includes(term));
}

function renderArxivItems() {
  if (!arxivList || !arxivStatus) return;
  const trimmed = arxivFilter.trim();
  const filtered = trimmed.length
    ? arxivItems.filter(item => {
      const haystack = `${item.title} ${item.description}`.toLowerCase();
      const defaultOperator = arxivFilterModeValue === 'all' ? 'AND' : 'OR';
      const tokens = normalizeFilterTokens(tokenizeFilterQuery(trimmed), defaultOperator);
      const ast = parseFilterExpression(tokens);
      if (!ast) {
        return legacyFilterMatch(trimmed, haystack);
      }
      return matchesFilterAst(ast, haystack);
    })
    : arxivItems;
  arxivList.innerHTML = '';
  if (filtered.length === 0) {
    arxivStatus.textContent = 'No papers match the filter.';
    return;
  }
  filtered.forEach(item => {
    const entry = document.createElement('a');
    entry.className = 'panel-item';
    entry.href = item.link;
    entry.target = '_blank';
    entry.rel = 'noopener';
    entry.role = 'listitem';
    entry.innerHTML = `
      <div class="panel-item-title">${escapeHtml(item.title)}</div>
      <div class="panel-item-meta">${escapeHtml(item.category)} · ${escapeHtml(item.pubDate)}</div>
    `;
    arxivList.appendChild(entry);
  });
}

async function loadScourFeed() {
  if (!scourList || !scourStatus) return;
  // stale-while-revalidate: show cached data first
  const cached = readLocalJson(CACHE_KEYS.scour);
  if (Array.isArray(cached) && cached.length) {
    scourItems = cached;
    scourRendered = 0;
    scourStatus.textContent = `Showing cached · ${cached.length} items`;
    renderScourBatch();
  } else {
    renderSkeleton(scourList, 3);
    scourStatus.textContent = 'Loading...';
  }
  try {
    const { items, source } = await fetchScourItems();
    if (items.length === 0 && !scourItems.length) {
      scourStatus.textContent = 'No items found.';
      return;
    }
    if (items.length > 0) {
      writeLocalJson(CACHE_KEYS.scour, items);
      scourItems = items;
      scourRendered = 0;
      scourList.innerHTML = '';
      scourStatus.textContent = `Updated just now · ${items.length} items`;
      renderScourBatch();
    }
  } catch (error) {
    if (!scourItems.length) {
      setStatusWithRetry(scourStatus, 'Failed to load Scour feed.', loadScourFeed);
    } else {
      scourStatus.textContent = `Using cached data · ${scourItems.length} items`;
    }
  }
}

async function loadFavoriteFeed() {
  if (!favoriteList || !favoriteStatus) return;
  const cached = readLocalJson(CACHE_KEYS.favorite);
  if (Array.isArray(cached) && cached.length) {
    favoriteStatus.textContent = `Cached · ${cached.length} projects`;
    renderFavoriteItems(cached);
  } else {
    favoriteStatus.textContent = 'Loading...';
    renderSkeleton(favoriteList, 4);
  }
  try {
    let text = '';
    if (chrome.runtime?.sendMessage) {
      const result = await chrome.runtime.sendMessage({ type: 'fetchFavorite', url: FAVORITE_FEED_URL });
      if (!result || !result.ok) {
        throw new Error(result?.error || 'Fetch failed');
      }
      text = result.text;
    } else {
      const response = await fetch(FAVORITE_FEED_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      text = await response.text();
    }
    const items = [];
    const linkRegex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(text)) !== null && items.length < 30) {
      const titleAndDesc = match[1];
      const url = match[2];
      const colonIdx = titleAndDesc.indexOf(': ');
      if (colonIdx > -1) {
        const title = titleAndDesc.slice(0, colonIdx).trim();
        const desc = titleAndDesc.slice(colonIdx + 2).trim();
        items.push({ title, link: url, desc });
      } else {
        items.push({ title: titleAndDesc, link: url, desc: '' });
      }
    }
    if (items.length === 0) {
      if (!cached?.length) {
        favoriteStatus.textContent = 'No projects found.';
      }
      return;
    }
    writeLocalJson(CACHE_KEYS.favorite, items);
    favoriteStatus.textContent = `Updated just now · ${items.length} projects`;
    renderFavoriteItems(items);
  } catch (error) {
    console.error('[Favorite] Error:', error);
    if (!cached?.length) {
      setStatusWithRetry(favoriteStatus, 'Failed to load feed.', loadFavoriteFeed);
    }
  }
}

function renderFavoriteItems(items) {
  favoriteList.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('a');
    el.className = 'favorite-item';
    el.href = item.link;
    el.target = '_blank';
    el.rel = 'noopener';
    const titleEl = document.createElement('div');
    titleEl.className = 'favorite-item-title';
    titleEl.textContent = item.title;
    const descEl = document.createElement('div');
    descEl.className = 'favorite-item-desc';
    descEl.textContent = item.desc;
    const metaEl = document.createElement('div');
    metaEl.className = 'favorite-item-meta';
    if (item.updated) {
      const date = new Date(item.updated);
      metaEl.textContent = date.toLocaleDateString();
    }
    el.appendChild(titleEl);
    el.appendChild(descEl);
    if (item.updated) el.appendChild(metaEl);
    favoriteList.appendChild(el);
  });
}

async function fetchScourUrl(url) {
  if (chrome.runtime?.sendMessage) {
    const result = await chrome.runtime.sendMessage({ type: 'fetchScour', url });
    if (!result || !result.ok) {
      throw new Error(result?.error || 'Fetch failed');
    }
    return result.text;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

function normalizeScourUrl(href) {
  try {
    const resolved = new URL(href, SCOUR_URL);
    if (resolved.protocol === 'chrome-extension:') return '';
    return resolved.toString();
  } catch {
    return '';
  }
}

function parseScourRss(text) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const entries = Array.from(doc.querySelectorAll('item, entry'));
  return entries.map(entry => {
    const title = entry.querySelector('title')?.textContent?.trim() || '';
    const link =
      entry.querySelector('link')?.textContent?.trim() ||
      entry.querySelector('link')?.getAttribute('href') ||
      '';
    const time =
      entry.querySelector('pubDate')?.textContent?.trim() ||
      entry.querySelector('updated')?.textContent?.trim() ||
      '';
    return {
      title,
      link: normalizeScourUrl(link),
      time,
      tags: []
    };
  }).filter(item => item.title && item.link);
}

function parseScourHtml(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const items = [];
  const seen = new Set();
  const addItem = (link, title, time, tags) => {
    if (!link || !title || seen.has(link)) return;
    if (title.length < 6) return;
    seen.add(link);
    items.push({ title, link, time, tags });
  };

  // Primary: scour.ing SSR markup uses [data-item="post"] containers
  const postNodes = Array.from(doc.querySelectorAll('[data-item="post"]'));
  if (postNodes.length > 0) {
    postNodes.forEach(node => {
      const title = (node.dataset.postTitle || '').trim();
      if (!title || title.length < 6) return;
      // Article link is the <a data-track-click> inside .post-title-block (not chip/tag links)
      const articleAnchor = node.querySelector('.post-title-block a[data-track-click]');
      const link = articleAnchor?.getAttribute('href') || '';
      if (!link) return;
      // Time is shown in a <span> whose title attribute holds an ISO date string
      const timeSpan = node.querySelector('span[title*=":"]');
      const time = timeSpan?.textContent?.trim() || '';
      // Interest tags come from chip elements
      const tags = Array.from(node.querySelectorAll('a.chip, .chip'))
        .map(el => el.textContent.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .slice(0, 4);
      addItem(link, title, time, tags);
    });
    if (items.length > 0) return items;
  }

  // Fallback: generic article/card selectors for future layout changes
  const extractTime = (node) => {
    const timeEl = node.querySelector('time');
    if (timeEl && timeEl.textContent) return timeEl.textContent.trim();
    const timeLike = node.querySelector('[class*="time"], [class*="date"], [class*="ago"]');
    if (timeLike && timeLike.textContent) return timeLike.textContent.trim();
    return '';
  };
  const extractTags = (node) => {
    const tagNodes = node.querySelectorAll('a[href*="/tag"], a[href*="/tags"], .tag, .chip');
    return Array.from(tagNodes).map(el => el.textContent.trim()).filter(Boolean).slice(0, 4);
  };
  const candidates = Array.from(doc.querySelectorAll('article, .feed-item, .item, .post'))
    .filter(node => node.querySelector('a[href]'));
  candidates.forEach(node => {
    const anchors = Array.from(node.querySelectorAll('a[href]'));
    const titleEl = node.querySelector('h1, h2, h3, .title, .headline');
    const titleText = (titleEl?.textContent || '').trim().replace(/\s+/g, ' ');
    const titleAnchor = anchors.find(a => {
      const text = (a.textContent || '').trim();
      return text.length >= 6 && !/tag|tags/i.test(a.getAttribute('href') || '');
    });
    const title = titleText || (titleAnchor?.textContent || '').trim().replace(/\s+/g, ' ');
    const preferred = anchors.find(a => {
      const href = a.getAttribute('href') || '';
      return href && !/tag|tags/i.test(href) && /^https?:\/\//i.test(href) && !href.includes('scour.ing');
    });
    const fallback = titleAnchor || anchors.find(a => !/tag|tags/i.test(a.getAttribute('href') || ''));
    const link = normalizeScourUrl(preferred?.getAttribute('href') || fallback?.getAttribute('href') || '');
    addItem(link, title, extractTime(node), extractTags(node));
  });
  return items;
}

async function fetchScourItems() {
  const urls = [
    SCOUR_URL,
    `${SCOUR_URL}.rss`,
    `${SCOUR_URL}/rss`,
    `${SCOUR_URL}.xml`,
    `${SCOUR_URL}/feed`
  ];
  for (const url of urls) {
    try {
      const text = await fetchScourUrl(url);
      const trimmed = text.trim();
      const looksXml = trimmed.startsWith('<?xml') || trimmed.includes('<rss') || trimmed.includes('<feed');
      if (looksXml) {
        const items = parseScourRss(text);
        if (items.length >= 3) return { items, source: url };
        if (items.length > 0) return { items, source: url };
        continue;
      }
      const htmlItems = parseScourHtml(text);
      if (htmlItems.length >= 3) return { items: htmlItems, source: url };
      const discovered = parseScourFeedLink(text);
      if (discovered) {
        const feedText = await fetchScourUrl(discovered);
        const feedItems = parseScourRss(feedText);
        if (feedItems.length > 0) return { items: feedItems, source: discovered };
      }
      if (htmlItems.length > 0) return { items: htmlItems, source: url };
    } catch {
      continue;
    }
  }
  return { items: [], source: '' };
}

function parseScourFeedLink(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const link = doc.querySelector('link[rel="alternate"][type*="rss"], link[rel="alternate"][type*="atom"]');
  const href = link?.getAttribute('href');
  return href ? normalizeScourUrl(href) : '';
}

function renderScourBatch() {
  if (!scourList) return;
  if (scourLoadingMore) return;
  scourLoadingMore = true;
  const nextItems = scourItems.slice(scourRendered, scourRendered + SCOUR_BATCH_SIZE);
  nextItems.forEach(item => {
      const domain = (() => {
        try {
          return new URL(item.link).hostname.replace('www.', '');
        } catch {
          return '';
        }
      })();
      const entry = document.createElement('div');
      entry.className = 'scour-item';
      entry.role = 'listitem';
      entry.dataset.link = item.link;
      const meta = [domain, item.time].filter(Boolean).join(' · ');
      const tagHtml = (item.tags || []).map(tag => `<span class="scour-tag">${escapeHtml(tag)}</span>`).join('');
      entry.innerHTML = `
        <div class="scour-item-title"><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></div>
        <div class="scour-item-meta">${escapeHtml(meta)}</div>
        ${tagHtml ? `<div class="scour-tags">${tagHtml}</div>` : ''}
        <div class="scour-actions">
          <button class="scour-toggle" type="button">Preview</button>
        </div>
        <div class="scour-preview hidden"></div>
      `;
      scourList.appendChild(entry);
    });
  scourRendered += nextItems.length;
  scourLoadingMore = false;
}

if (scourList) {
  let scourScrollTimer = null;
  scourList.addEventListener('scroll', () => {
    if (scourScrollTimer) return;
    scourScrollTimer = setTimeout(() => {
      scourScrollTimer = null;
      const threshold = 60;
      if (scourList.scrollTop + scourList.clientHeight >= scourList.scrollHeight - threshold) {
        if (scourRendered < scourItems.length) {
          renderScourBatch();
        }
      }
    }, 100);
  });
}

async function fetchPreviewData(url) {
  const empty = { text: '', image: '' };
  if (!url || !/^https?:\/\//i.test(url)) return empty;
  if (scourPreviewCache.has(url)) return scourPreviewCache.get(url);
  let html = '';
  try {
    if (chrome.runtime?.sendMessage) {
      const result = await chrome.runtime.sendMessage({ type: 'fetchPreview', url });
      if (!result || !result.ok) {
        throw new Error(result?.error || 'Fetch failed');
      }
      html = result.text;
    } else {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      html = await response.text();
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const meta =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      '';
    const para = Array.from(doc.querySelectorAll('p'))
      .map(p => p.textContent.trim().replace(/\s+/g, ' '))
      .find(value => value.length >= 120) || '';
    const text = (meta || para).slice(0, 400);
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const data = { text, image: ogImage };
    scourPreviewCache.set(url, data);
    return data;
  } catch {
    scourPreviewCache.set(url, empty);
    return empty;
  }
}

if (scourList) {
  scourList.addEventListener('click', async (e) => {
    const toggle = e.target.closest('.scour-toggle');
    if (!toggle) return;
    const item = e.target.closest('.scour-item');
    if (!item) return;
    const preview = item.querySelector('.scour-preview');
    if (!preview) return;
    const link = item.dataset.link || '';
    if (!preview.classList.contains('hidden')) {
      preview.classList.add('hidden');
      toggle.textContent = 'Preview';
      return;
    }
    // Show skeleton while loading
    preview.innerHTML = '<div class="skeleton-line medium"></div><div class="skeleton-line short"></div>';
    preview.classList.remove('hidden');
    toggle.textContent = 'Loading...';
    const data = await fetchPreviewData(link);
    preview.innerHTML = '';
    if (data.image) {
      const img = document.createElement('img');
      img.className = 'scour-preview-img';
      img.src = data.image;
      img.alt = '';
      img.loading = 'lazy';
      preview.appendChild(img);
    }
    if (data.text) {
      const p = document.createElement('p');
      p.className = 'scour-preview-text';
      p.textContent = data.text;
      preview.appendChild(p);
    }
    if (!data.text && !data.image) {
      preview.textContent = 'No preview available.';
    }
    toggle.textContent = 'Hide';
  });
}

function renderAppsMenu() {
  if (!appsMenu || !appsTrack) return;
  appsTrack.innerHTML = '';
  appLinks.forEach((app, index) => {
    const item = document.createElement('a');
    item.className = 'app-item';
    item.href = app.url;
    item.target = '_blank';
    item.rel = 'noopener';
    item.dataset.type = 'app';
    item.dataset.index = String(index);
    item.draggable = true;
    const iconSrc = app.icon || APP_ICON_MAP.get(app.url);
    const iconHtml = iconSrc
      ? `<img src="${escapeHtml(iconSrc)}" alt="">`
      : getFavicon(app.url, app.name);
    item.innerHTML = `
      <div class="app-icon">${iconHtml}</div>
      <div class="app-label">${escapeHtml(app.name)}</div>
    `;
    appsTrack.appendChild(item);
  });
  appsTrack.scrollLeft = 0;
}

function renderAccountMenu() {
  accountMenu.innerHTML = '';
  accountLinks.forEach((entry, index) => {
    const item = document.createElement('a');
    item.className = 'account-item';
    item.href = entry.url;
    item.target = '_blank';
    item.rel = 'noopener';
    item.dataset.type = 'account';
    item.dataset.index = String(index);
    item.draggable = isEditMode;
    item.textContent = entry.name;
    accountMenu.appendChild(item);
  });
}

function reorder(list, fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
}

function clearDragOver(container) {
  container.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

let dragState = null;

function handleDragStart(e) {
  const item = e.target.closest('[data-index]');
  if (!item) return;
  const type = item.dataset.type;
  if (!type) return;
  if (!isEditMode && type !== 'app') return;
  item.classList.add('dragging');
  dragState = {
    type,
    index: parseInt(item.dataset.index, 10)
  };
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e, container) {
  if (!dragState) return;
  const item = e.target.closest('[data-index]');
  if (!item) return;
  if (item.dataset.type !== dragState.type) return;
  e.preventDefault();
  clearDragOver(container);
  item.classList.add('drag-over');
}

function handleDrop(e, container) {
  if (!dragState) return;
  const item = e.target.closest('[data-index]');
  if (!item) return;
  if (item.dataset.type !== dragState.type) return;
  e.preventDefault();
  const dragging = container.querySelector('.dragging');
  if (dragging) {
    dragging.classList.remove('dragging');
  }
  const targetIndex = parseInt(item.dataset.index, 10);
  if (dragState.type === 'app') {
    reorder(appLinks, dragState.index, targetIndex);
  } else if (dragState.type === 'account') {
    reorder(accountLinks, dragState.index, targetIndex);
  } else if (dragState.type === 'shortcut') {
    reorder(sites, dragState.index, targetIndex);
  }
  dragState = null;
  clearDragOver(container);
  saveAll();
  renderMenus();
  render();
}

function handleDragEnd(container) {
  if (dragState) {
    const item = container.querySelector(`[data-type="${dragState.type}"][data-index="${dragState.index}"]`);
    if (item) {
      item.classList.remove('dragging');
    }
  }
  dragState = null;
  clearDragOver(container);
}

function setEditMode(enabled) {
  isEditMode = enabled;
  document.body.classList.toggle('edit-mode', isEditMode);
  document.body.classList.toggle('drag-enabled', isEditMode);
  if (editBanner) editBanner.classList.toggle('hidden', !isEditMode);
  render();
  renderMenus();
}

if (editModeBtn) {
  editModeBtn.addEventListener('click', () => setEditMode(!isEditMode));
}

if (editBannerDone) {
  editBannerDone.addEventListener('click', () => setEditMode(false));
}

function openAddForm(mode) {
  const isEdit = mode === 'edit';
  if (addTitle) {
    addTitle.textContent = isEdit ? 'Edit shortcut' : 'Add shortcut';
  }
  saveBtn.textContent = isEdit ? 'Save' : 'Add';
  addForm.classList.remove('hidden');
  siteNameInput.focus();
}

function resetAddForm() {
  addForm.classList.add('hidden');
  siteNameInput.value = '';
  siteUrlInput.value = '';
  editingIndex = null;
  if (addTitle) {
    addTitle.textContent = 'Add shortcut';
  }
  saveBtn.textContent = 'Add';
}

cancelBtn.addEventListener('click', () => {
  resetAddForm();
});

saveBtn.addEventListener('click', () => {
  const name = siteNameInput.value.trim();
  const url = siteUrlInput.value.trim();

  if (!name || !url) return;

  let finalUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    finalUrl = 'https://' + url;
  }

  if (editingIndex !== null && sites[editingIndex]) {
    sites[editingIndex] = { ...sites[editingIndex], name, url: finalUrl };
  } else {
    sites.push({ name, url: finalUrl });
  }

  saveSites();
  render();
  resetAddForm();
});

launchpad.addEventListener('click', (e) => {
  if (e.target.closest('.add-btn')) {
    openAddForm('add');
  }
});

const addBtn = document.createElement('div');
addBtn.className = 'shortcut add-btn';
addBtn.innerHTML = `
  <div class="shortcut-icon">+</div>
  <div class="shortcut-name">Add shortcut</div>
`;

const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu hidden';
contextMenu.innerHTML = `
  <button type="button" class="context-item" data-action="open">Open in new tab</button>
  <button type="button" class="context-item" data-action="copy">Copy URL</button>
  <div class="context-divider"></div>
  <button type="button" class="context-item" data-action="edit">Edit name/URL</button>
  <button type="button" class="context-item" data-action="edit-mode">Edit shortcuts</button>
  <button type="button" class="context-item danger" data-action="delete">Delete</button>
`;
document.body.appendChild(contextMenu);

function closeContextMenu() {
  contextMenu.classList.add('hidden');
  contextIndex = null;
}

function openContextMenu(x, y) {
  contextMenu.classList.remove('hidden');
  const { innerWidth, innerHeight } = window;
  const rect = contextMenu.getBoundingClientRect();
  let left = x;
  let top = y;
  if (left + rect.width > innerWidth) {
    left = Math.max(8, innerWidth - rect.width - 8);
  }
  if (top + rect.height > innerHeight) {
    top = Math.max(8, innerHeight - rect.height - 8);
  }
  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
}

launchpad.addEventListener('contextmenu', (e) => {
  const shortcut = e.target.closest('.shortcut');
  if (!shortcut || shortcut.classList.contains('add-btn')) {
    return;
  }
  e.preventDefault();
  const index = Number(shortcut.dataset.index);
  if (!Number.isFinite(index)) {
    return;
  }
  contextIndex = index;
  openContextMenu(e.clientX, e.clientY);
});

contextMenu.addEventListener('click', (e) => {
  const action = e.target.closest('.context-item')?.dataset.action;
  if (!action || contextIndex === null) {
    return;
  }
  const site = sites[contextIndex];
  if (action === 'open' && site) {
    window.open(site.url, '_blank', 'noopener');
    closeContextMenu();
    return;
  }
  if (action === 'copy' && site) {
    navigator.clipboard.writeText(site.url).catch(() => {
      console.warn('Failed to copy URL to clipboard');
    });
    closeContextMenu();
    return;
  }
  if (action === 'delete') {
    sites.splice(contextIndex, 1);
    saveSites();
    render();
    closeContextMenu();
    return;
  }
  if (action === 'edit-mode') {
    closeContextMenu();
    setEditMode(!isEditMode);
    return;
  }
  if (action === 'edit') {
    if (site) {
      editingIndex = contextIndex;
      siteNameInput.value = site.name || '';
      siteUrlInput.value = site.url || '';
      openAddForm('edit');
    }
    closeContextMenu();
  }
});

window.addEventListener('resize', closeContextMenu);
document.addEventListener('click', (e) => {
  if (!contextMenu.classList.contains('hidden') && !contextMenu.contains(e.target)) {
    closeContextMenu();
  }
});

appsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  appsMenu.classList.toggle('hidden');
  accountMenu.classList.add('hidden');
});

avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  accountMenu.classList.toggle('hidden');
  appsMenu.classList.add('hidden');
});

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  appsMenu.classList.add('hidden');
  accountMenu.classList.add('hidden');
  renderSettingsPanel();
  settingsPanel.classList.remove('hidden');
});

settingsCloseBtn.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});

// Settings tab navigation
settingsPanel.addEventListener('click', (e) => {
  const tab = e.target.closest('.settings-tab');
  if (!tab) return;
  const tabId = tab.dataset.tab;
  if (!tabId) return;
  settingsPanel.querySelectorAll('.settings-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
    t.setAttribute('aria-selected', t.dataset.tab === tabId ? 'true' : 'false');
  });
  settingsPanel.querySelectorAll('.settings-tab-content').forEach(c => {
    c.classList.toggle('active', c.dataset.tabContent === tabId);
  });
});

settingsPanel.addEventListener('click', (e) => {
  if (e.target === settingsPanel) {
    settingsPanel.classList.add('hidden');
  }
});

// Auto-save: avatar URL
if (avatarUrlInput) {
  let avatarSaveTimer = null;
  avatarUrlInput.addEventListener('input', () => {
    clearTimeout(avatarSaveTimer);
    avatarSaveTimer = setTimeout(() => {
      avatarUrl = avatarUrlInput.value.trim();
      applyAvatar();
      saveAll();
      flashSettingsSaved();
    }, 500);
  });
}

// Theme switcher
const themeSwitcher = document.getElementById('themeSwitcher');
if (themeSwitcher) {
  themeSwitcher.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-option');
    if (!btn) return;
    const newTheme = btn.dataset.theme;
    if (!['auto', 'light', 'dark'].includes(newTheme)) return;
    themeMode = newTheme;
    applyTheme();
    updateThemeSwitcher();
    saveAll();
    flashSettingsSaved();
  });
}

arxivRefreshBtn.addEventListener('click', () => {
  arxivCategories = arxivCategoryInput.value
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (arxivCategories.length === 0) {
    arxivCategories = ['cs.AI'];
  }
  saveAll();
  applyArxivControls();
  loadArxivFeed();
});

if (arxivCategorySelect) {
  arxivCategorySelect.addEventListener('change', () => {
    const selected = Array.from(arxivCategorySelect.selectedOptions).map(option => option.value);
    arxivCategories = selected.length ? selected : ['cs.AI'];
    arxivCategoryInput.value = arxivCategories.join(', ');
    saveAll();
    applyArxivControls();
    loadArxivFeed();
  });
}

if (arxivApplyRefreshBtn) {
  arxivApplyRefreshBtn.addEventListener('click', () => {
    const value = parseInt(arxivRefreshInput.value, 10);
    arxivRefreshMinutes = Number.isFinite(value) ? Math.max(0, value) : 0;
    saveAll();
    applyArxivControls();
  });
}

arxivChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const category = chip.dataset.category;
    if (!category) return;
    if (arxivCategories.includes(category)) {
      arxivCategories = arxivCategories.filter(value => value !== category);
    } else {
      arxivCategories = [...arxivCategories, category];
    }
    if (arxivCategories.length === 0) {
      arxivCategories = ['cs.AI'];
    }
    arxivCategoryInput.value = arxivCategories.join(', ');
    if (arxivCategorySelect) {
      Array.from(arxivCategorySelect.options).forEach(option => {
        option.selected = arxivCategories.includes(option.value);
      });
    }
    saveAll();
    applyArxivControls();
    loadArxivFeed();
  });
});

if (arxivFilterInput) {
  let filterSaveTimer = null;
  arxivFilterInput.addEventListener('input', () => {
    arxivFilter = arxivFilterInput.value;
    renderArxivItems();
    clearTimeout(filterSaveTimer);
    filterSaveTimer = setTimeout(() => saveAll(), 300);
  });
}

if (arxivFilterMode) {
  arxivFilterMode.addEventListener('change', () => {
    arxivFilterModeValue = arxivFilterMode.value === 'all' ? 'all' : 'any';
    saveAll();
    renderArxivItems();
  });
}

if (arxivFilterClear) {
  arxivFilterClear.addEventListener('click', () => {
    arxivFilter = '';
    if (arxivFilterInput) {
      arxivFilterInput.value = '';
    }
    arxivFilterModeValue = 'any';
    if (arxivFilterMode) {
      arxivFilterMode.value = 'any';
    }
    saveAll();
    renderArxivItems();
  });
}

if (arxivFilterHelpBtn && arxivFilterHelp) {
  arxivFilterHelpBtn.addEventListener('click', () => {
    arxivFilterHelp.classList.toggle('hidden');
  });
}

if (arxivGroupList) {
  arxivGroupList.addEventListener('click', (e) => {
    const button = e.target.closest('.group-btn');
    if (!button) return;
    const groupCategories = (button.dataset.categories || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    if (groupCategories.length === 0) return;
    const allIncluded = groupCategories.every(category => arxivCategories.includes(category));
    if (allIncluded) {
      arxivCategories = arxivCategories.filter(category => !groupCategories.includes(category));
    } else {
      const merged = new Set([...arxivCategories, ...groupCategories]);
      arxivCategories = Array.from(merged);
    }
    if (arxivCategories.length === 0) {
      arxivCategories = ['cs.AI'];
    }
    arxivCategoryInput.value = arxivCategories.join(', ');
    if (arxivCategorySelect) {
      Array.from(arxivCategorySelect.options).forEach(option => {
        option.selected = arxivCategories.includes(option.value);
      });
    }
    saveAll();
    applyArxivControls();
    loadArxivFeed();
  });
}

if (addArxivGroupBtn) {
  addArxivGroupBtn.addEventListener('click', () => {
    const name = arxivGroupNameInput.value.trim();
    const categories = arxivGroupCategoriesInput.value
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    if (!name || categories.length === 0) return;
    if (editingGroupIndex !== null) {
      arxivCustomGroups[editingGroupIndex] = { name, categories };
    } else {
      arxivCustomGroups.push({ name, categories });
    }
    arxivGroupNameInput.value = '';
    arxivGroupCategoriesInput.value = '';
    editingGroupIndex = null;
    addArxivGroupBtn.textContent = 'Add';
    if (cancelArxivGroupBtn) {
      cancelArxivGroupBtn.classList.add('hidden');
    }
    saveAll();
    renderArxivGroups();
  });
}

if (arxivCustomGroupList) {
  arxivCustomGroupList.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-index]');
    if (!button) return;
    const action = button.dataset.action || 'remove';
    const index = parseInt(button.dataset.index, 10);
    if (!Number.isFinite(index)) return;
    if (action === 'edit') {
      const group = arxivCustomGroups[index];
      if (!group) return;
      arxivGroupNameInput.value = group.name;
      arxivGroupCategoriesInput.value = group.categories.join(', ');
      editingGroupIndex = index;
      addArxivGroupBtn.textContent = 'Update';
      if (cancelArxivGroupBtn) {
        cancelArxivGroupBtn.classList.remove('hidden');
      }
      return;
    }
    arxivCustomGroups.splice(index, 1);
    saveAll();
    renderArxivGroups();
  });
}

if (arxivCustomGroupList) {
  arxivCustomGroupList.addEventListener('dragstart', (e) => {
    const row = e.target.closest('[data-index]');
    if (!row) return;
    groupDragIndex = parseInt(row.dataset.index, 10);
    if (!Number.isFinite(groupDragIndex)) {
      groupDragIndex = null;
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
  });

  arxivCustomGroupList.addEventListener('dragover', (e) => {
    if (groupDragIndex === null) return;
    const row = e.target.closest('[data-index]');
    if (!row) return;
    e.preventDefault();
    arxivCustomGroupList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    row.classList.add('drag-over');
  });

  arxivCustomGroupList.addEventListener('dragleave', () => {
    arxivCustomGroupList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  });

  arxivCustomGroupList.addEventListener('drop', (e) => {
    if (groupDragIndex === null) return;
    const row = e.target.closest('[data-index]');
    if (!row) return;
    e.preventDefault();
    const targetIndex = parseInt(row.dataset.index, 10);
    if (!Number.isFinite(targetIndex)) return;
    reorder(arxivCustomGroups, groupDragIndex, targetIndex);
    groupDragIndex = null;
    arxivCustomGroupList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    saveAll();
    renderArxivGroups();
  });

  arxivCustomGroupList.addEventListener('dragend', () => {
    groupDragIndex = null;
    arxivCustomGroupList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  });
}

if (cancelArxivGroupBtn) {
  cancelArxivGroupBtn.addEventListener('click', () => {
    arxivGroupNameInput.value = '';
    arxivGroupCategoriesInput.value = '';
    editingGroupIndex = null;
    addArxivGroupBtn.textContent = 'Add';
    cancelArxivGroupBtn.classList.add('hidden');
  });
}

addAppBtn.addEventListener('click', () => {
  const name = appNameInput.value.trim();
  const url = appUrlInput.value.trim();
  if (!name || !url) return;
  appLinks.push({ name, url: normalizeUrl(url) });
  appNameInput.value = '';
  appUrlInput.value = '';
  saveAll();
  renderMenus();
  renderSettingsPanel();
  flashSettingsSaved();
});

addAccountBtn.addEventListener('click', () => {
  const name = accountNameInput.value.trim();
  const url = accountUrlInput.value.trim();
  if (!name || !url) return;
  accountLinks.push({ name, url: normalizeUrl(url) });
  accountNameInput.value = '';
  accountUrlInput.value = '';
  saveAll();
  renderMenus();
  renderSettingsPanel();
  flashSettingsSaved();
});

function handleSettingsRemove(e) {
  const btn = e.target.closest('button[data-index]');
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  if (btn.dataset.type === 'app') {
    appLinks.splice(index, 1);
  } else if (btn.dataset.type === 'account') {
    accountLinks.splice(index, 1);
  }
  saveAll();
  renderMenus();
  renderSettingsPanel();
  flashSettingsSaved();
}

appsList.addEventListener('click', handleSettingsRemove);
accountList.addEventListener('click', handleSettingsRemove);

document.addEventListener('click', (e) => {
  const inApps = appsMenu.contains(e.target) || appsBtn.contains(e.target);
  const inAccount = accountMenu.contains(e.target) || avatarBtn.contains(e.target);
  if (!inApps) appsMenu.classList.add('hidden');
  if (!inAccount) accountMenu.classList.add('hidden');
  // Close search engine dropdown when clicking outside
  if (searchEnginePicker && !searchEnginePicker.contains(e.target)) {
    searchEngineDropdown.classList.add('hidden');
    searchEnginePicker.classList.remove('open');
  }
});

appsMenu.addEventListener('dragstart', handleDragStart);
appsMenu.addEventListener('dragover', (e) => handleDragOver(e, appsMenu));
appsMenu.addEventListener('dragleave', () => clearDragOver(appsMenu));
appsMenu.addEventListener('drop', (e) => handleDrop(e, appsMenu));
appsMenu.addEventListener('dragend', () => handleDragEnd(appsMenu));

launchpad.addEventListener('dragstart', handleDragStart);
launchpad.addEventListener('dragover', (e) => handleDragOver(e, launchpad));
launchpad.addEventListener('dragleave', () => clearDragOver(launchpad));
launchpad.addEventListener('drop', (e) => handleDrop(e, launchpad));
launchpad.addEventListener('dragend', () => handleDragEnd(launchpad));

accountMenu.addEventListener('dragstart', handleDragStart);
accountMenu.addEventListener('dragover', (e) => handleDragOver(e, accountMenu));
accountMenu.addEventListener('dragleave', () => clearDragOver(accountMenu));
accountMenu.addEventListener('drop', (e) => handleDrop(e, accountMenu));
accountMenu.addEventListener('dragend', () => handleDragEnd(accountMenu));

searchInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const value = searchInput.value.trim();
  if (!value) return;

  const hasSpace = /\s/.test(value);
  const hasProtocol = /^https?:\/\//i.test(value);
  const looksLikeUrl = /\./.test(value) && !hasSpace;

  if (looksLikeUrl) {
    const target = hasProtocol ? value : `https://${value}`;
    window.location.href = target;
  } else {
    const query = encodeURIComponent(value);
    const engine = getSearchEngine(searchEngine);
    window.location.href = engine.url.replace('{query}', query);
  }
});

// Custom search engine dropdown
if (searchEngineTrigger && searchEngineDropdown) {
  searchEngineTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !searchEngineDropdown.classList.contains('hidden');
    searchEngineDropdown.classList.toggle('hidden');
    searchEnginePicker.classList.toggle('open', !isOpen);
  });

  searchEngineDropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.search-engine-option');
    if (!option) return;
    const next = option.dataset.engineId;
    if (SEARCH_ENGINES.some(engine => engine.id === next)) {
      searchEngine = next;
      saveAll();
      applySearchEngine();
    }
    searchEngineDropdown.classList.add('hidden');
    searchEnginePicker.classList.remove('open');
    searchInput.focus();
  });
}

// Panel toggle behavior
if (arxivToggle) {
  const arxivPanel = document.querySelector('.arxiv-panel');
  arxivToggle.addEventListener('click', () => {
    arxivPanel.classList.toggle('collapsed');
    arxivToggle.classList.toggle('active', !arxivPanel.classList.contains('collapsed'));
  });
}

if (favoriteToggle) {
  const favoritePanel = document.querySelector('.favorite-panel');
  favoriteToggle.addEventListener('click', () => {
    favoritePanel.classList.toggle('collapsed');
    favoriteToggle.classList.toggle('active', !favoritePanel.classList.contains('collapsed'));
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl+K → focus search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }
  // Esc → close modals / exit edit mode
  if (e.key === 'Escape') {
    if (!settingsPanel.classList.contains('hidden')) {
      settingsPanel.classList.add('hidden');
      return;
    }
    if (!addForm.classList.contains('hidden')) {
      resetAddForm();
      return;
    }
    if (!contextMenu.classList.contains('hidden')) {
      closeContextMenu();
      return;
    }
    if (!appsMenu.classList.contains('hidden')) {
      appsMenu.classList.add('hidden');
      return;
    }
    if (!accountMenu.classList.contains('hidden')) {
      accountMenu.classList.add('hidden');
      return;
    }
    if (isEditMode) {
      setEditMode(false);
      return;
    }
    // Esc when nothing is open → focus search
    searchInput.focus();
    searchInput.select();
  }
});

init();
