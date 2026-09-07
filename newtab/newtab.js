const launchpad = document.getElementById('launchpad');
const layout = document.querySelector('.layout');
const addForm = document.getElementById('addForm');
const editModeBtn = document.getElementById('editModeBtn'); // may be null (removed from topbar)
const siteNameInput = document.getElementById('siteName');
const siteUrlInput = document.getElementById('siteUrl');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const shortcutForm = document.getElementById('shortcutForm');
const shortcutStatus = document.getElementById('shortcutStatus');
const shortcutFormStatus = document.getElementById('shortcutFormStatus');
const addTitle = document.querySelector('.add-title');
const appsBtn = document.getElementById('appsBtn');
const appsMenu = document.getElementById('appsMenu');
const appsTrack = document.getElementById('appsTrack');
const avatarBtn = document.getElementById('avatarBtn');
const accountMenu = document.getElementById('accountMenu');
const googleSearchForm = document.getElementById('googleSearchForm');
const searchInput = document.getElementById('searchInput');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const searchStatus = document.getElementById('searchStatus');
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
const arxivQuickFilters = document.getElementById('arxivQuickFilters');
const arxivSaveFilterBtn = document.getElementById('arxivSaveFilterBtn');
const arxivResearchTracks = document.getElementById('arxivResearchTracks');
const scourStatus = document.getElementById('scourStatus');
const scourList = document.getElementById('scourList');
const favoriteStatus = document.getElementById('favoriteStatus');
const favoriteList = document.getElementById('favoriteList');
const arxivToggle = document.getElementById('arxivToggle');
const favoriteToggle = document.getElementById('favoriteToggle');
const arxivPanel = document.getElementById('arxivPanel');
const favoritePanel = document.getElementById('favoritePanel');
const editBanner = document.getElementById('editBanner');
const editBannerDone = document.getElementById('editBannerDone');

const ACADEMIC_TREND_URL = 'https://api.ossinsight.io/v1/trends/repos/?period=past_week&language=All';
const DEFAULT_ARXIV_RESEARCH_PRESET = ArxivResearch.buildArxivResearchPreset('all');
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
let settingsWriter = null;
let pendingExternalSites = null;
let appLinks = [];
let editingIndex = null;
let contextIndex = null;
let accountLinks = [];
let avatarUrl = '';
let scourUrl = '';
let scourRequestVersion = 0;
let arxivCategories = [...DEFAULT_ARXIV_RESEARCH_PRESET.categories];
let arxivRefreshMinutes = 0;
let arxivRefreshTimer = null;
let arxivCustomGroups = [];
let editingGroupIndex = null;
let arxivItems = [];
let arxivFilter = DEFAULT_ARXIV_RESEARCH_PRESET.query;
let arxivFilterModeValue = 'any';
let lastValidFilter = { query: '', mode: 'any', ast: null };
let arxivSavedFilters = [];
let themeMode = 'auto';
let settingsReturnFocus = null;
let shortcutReturnFocus = null;
let contextReturnFocus = null;
let panelVisibility = { arxiv: true, favorites: true };
let voiceRecognition = null;
const scourPreviewCache = new Map();
let scourItems = [];
let scourRendered = 0;
let scourLoadingMore = false;
const SCOUR_BATCH_SIZE = 10;
const MAX_ARXIV_ITEMS = 120;
let groupDragIndex = null;
let arxivRequestVersion = 0;
let previewRequestVersion = 0;
let avatarRequestVersion = 0;

const LOG_STORAGE_KEY = 'logs';
const MAX_LOGS = 200;
const GOOGLE_SEARCH_PLACEHOLDER = 'Search Google or type a URL';

const STORAGE_KEYS = LaunchPadCore.STORAGE_KEYS;

const defaultArxivGroups = [
  { name: 'Machine Learning', categories: ['cs.LG', 'stat.ML'] },
  { name: 'Vision', categories: ['cs.CV'] },
  { name: 'Language', categories: ['cs.CL'] },
  { name: 'Robotics', categories: ['cs.RO'] },
  { name: 'Comm & Networks', categories: ['cs.NI', 'cs.IT', 'eess.SP'] },
  { name: 'Systems & Control', categories: ['eess.SY'] }
];

const defaultArxivFilters = [
  { label: 'Edge AI', query: '"edge ai" OR "edge intelligence" OR "on-device"', mode: 'any' },
  { label: 'Compression', query: 'pruning OR "model compression" OR quantization', mode: 'any' },
  { label: '6G Comm', query: '"6G" OR wireless OR "semantic communication"', mode: 'any' },
  { label: 'Energy DR', query: '"demand response" OR "dynamic pricing" OR "energy market"', mode: 'any' },
  { label: 'VLA & Agents', query: '"vision language action" OR VLA OR "research agent"', mode: 'any' }
];

// escapeHtml, safeColor, defaultSites are provided by shared.js

const ARXIV_FEED_BASE = 'https://export.arxiv.org/rss/';
// Existing cached installations keep their previously displayed public feed.
const LEGACY_SCOUR_URL = 'https://scour.ing/@dtjgp';

const CACHE_KEYS = {
  arxiv: 'cache_arxiv',
  scour: 'cache_scour',
  academicTrend: 'cache_academic_trend_v1'
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
    arxivSavedFilters: readLocalJson('arxivSavedFilters'),
    themeMode: readLocalJson('themeMode')
  };
  return { local, sync, cache };
}

function pickStoredArray(...candidates) {
  for (const value of candidates) {
    if (Array.isArray(value)) {
      return value;
    }
  }
  return null;
}

function normalizeSavedFilters(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      label: String(item?.label || '').trim().slice(0, 32),
      query: String(item?.query || '').trim().slice(0, 4096),
      mode: item?.mode === 'all' ? 'all' : 'any'
    }))
    .filter(item => item.label && item.query)
    .slice(0, 12);
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
  let restoredSettings = {};
  {
    let stored;
    try {
      stored = await readStoredSettings();
    } catch (error) {
      stored = { local: {}, sync: {}, cache: {} };
      void logEvent('error', 'settings restore failed', { message: error.message });
    }
    const selected = LaunchPadCore.selectNewestStorage(stored.local, stored.sync);
    restoredSettings = selected.primary;
    const checked = LaunchPadCore.sanitizeStoredSettings(selected.primary);
    const primaryName = selected.primaryName;
    const primary = checked.value;
    const secondary = LaunchPadCore.sanitizeStoredSettings(selected.secondary).value;
    stored.cache = LaunchPadCore.sanitizeStoredSettings(stored.cache).value;
    if (checked.invalid.length) {
      shortcutStatus.textContent = `Some saved settings could not be loaded (${checked.invalid.join(', ')}). Defaults are shown for those fields.`;
      shortcutStatus.classList.add('error');
    }
    const storedValue = key => primary[key] ?? secondary[key];
    sites = Array.isArray(storedValue('sites')) ? storedValue('sites') : defaultSites;
    appLinks = Array.isArray(storedValue('appLinks')) ? storedValue('appLinks') : defaultAppLinks;
    accountLinks = Array.isArray(storedValue('accountLinks'))
      ? storedValue('accountLinks')
      : defaultAccountLinks;
    avatarUrl = typeof storedValue('avatarUrl') === 'string' ? storedValue('avatarUrl') : '';
    scourUrl = typeof storedValue('scourUrl') === 'string' ? LaunchPadCore.normalizeScourProfile(storedValue('scourUrl'))
      : Array.isArray(readLocalJson(CACHE_KEYS.scour)) ? LEGACY_SCOUR_URL : '';

    let storedCategories = null;
    let categorySource = 'default';
    if (Array.isArray(primary.arxivCategories) && primary.arxivCategories.length) {
      storedCategories = primary.arxivCategories;
      categorySource = primaryName;
    } else if (Array.isArray(secondary.arxivCategories) && secondary.arxivCategories.length) {
      storedCategories = secondary.arxivCategories;
      categorySource = primaryName === 'local' ? 'sync' : 'local';
    } else if (Array.isArray(stored.cache.arxivCategories) && stored.cache.arxivCategories.length) {
      storedCategories = stored.cache.arxivCategories;
      categorySource = 'cache';
    }

    if (storedCategories) {
      arxivCategories = storedCategories;
    } else {
      const fallback = storedValue('arxivCategory');
      categorySource = typeof fallback === 'string' && fallback ? 'legacy' : 'default';
      arxivCategories = categorySource === 'legacy'
        ? [fallback]
        : [...DEFAULT_ARXIV_RESEARCH_PRESET.categories];
    }

    const refreshCandidate = Number.isFinite(primary.arxivRefreshMinutes)
      ? primary.arxivRefreshMinutes
      : Number.isFinite(secondary.arxivRefreshMinutes)
        ? secondary.arxivRefreshMinutes
        : stored.cache.arxivRefreshMinutes;
    arxivRefreshMinutes = Number.isFinite(refreshCandidate) ? refreshCandidate : 0;

    const customGroups = pickStoredArray(
      primary.arxivCustomGroups,
      secondary.arxivCustomGroups,
      stored.cache.arxivCustomGroups
    );
    arxivCustomGroups = customGroups || [];

    arxivSavedFilters = normalizeSavedFilters(
      pickStoredArray(
        primary.arxivSavedFilters,
        secondary.arxivSavedFilters,
        stored.cache.arxivSavedFilters
      )
    );

    const filterCandidate = primary.arxivFilter ?? secondary.arxivFilter ?? stored.cache.arxivFilter;
    arxivFilter = typeof filterCandidate === 'string'
      ? filterCandidate
      : categorySource === 'default'
        ? DEFAULT_ARXIV_RESEARCH_PRESET.query
        : '';

    const filterModeCandidate =
      primary.arxivFilterMode ?? secondary.arxivFilterMode ?? stored.cache.arxivFilterMode;
    arxivFilterModeValue = filterModeCandidate === 'all'
      ? 'all'
      : categorySource === 'default'
        ? DEFAULT_ARXIV_RESEARCH_PRESET.mode
        : 'any';

    const themeCandidate =
      primary.themeMode ?? secondary.themeMode ?? stored.cache.themeMode;
    if (['light', 'dark', 'auto'].includes(themeCandidate)) {
      themeMode = themeCandidate;
    }

    const savedPanels = storedValue('panelVisibility');
    for (const key of ['arxiv', 'favorites']) {
      if (typeof savedPanels?.[key] === 'boolean') panelVisibility[key] = savedPanels[key];
    }

    if (categorySource !== 'local') {
      void logEvent('info', 'arxiv categories restored', {
        source: categorySource,
        categories: arxivCategories
      });
    }
  }
  settingsWriter = LaunchPadCore.createSettingsWriter(chrome.storage, { ...buildSettingsSnapshot(), ...restoredSettings });
  applyTheme();
  applyAvatar();
  render();
  renderMenus();
  applyArxivControls();
  setPanelOpen('arxiv', panelVisibility.arxiv);
  setPanelOpen('favorites', panelVisibility.favorites);
  loadArxivFeed();
  loadScourFeed();
  loadAcademicTrend();
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
    const siteUrl = LaunchPadCore.normalizeHttpUrl(site.url);
    if (!siteUrl) return;
    const item = document.createElement('div');
    item.className = 'shortcut';
    item.dataset.type = 'shortcut';
    item.dataset.index = String(index);
    item.draggable = isEditMode;
    item.style.animationDelay = `${index * 30}ms`;
    item.innerHTML = `
      <a class="shortcut-link" href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener" title="${escapeHtml(site.name)}" draggable="false">
        <div class="shortcut-icon"></div>
        <div class="shortcut-name">${escapeHtml(site.name)}</div>
      </a>
      <button class="shortcut-more" type="button" aria-label="More options for ${escapeHtml(site.name)}" aria-haspopup="menu" aria-expanded="false"><span class="material-icon icon-more_vert" aria-hidden="true"></span></button>
      <button class="delete-btn" type="button" aria-label="Remove ${escapeHtml(site.name)}">&times;</button>
    `;
    item.querySelector('.shortcut-icon').appendChild(createSiteIcon(siteUrl, site.name));
    launchpad.appendChild(item);
  });

  launchpad.appendChild(addBtn);

  launchpad.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      const index = Number(btn.closest('.shortcut').dataset.index);
      const previousSites = [...sites];
      sites.splice(index, 1);
      const result = await saveSites();
      if (!result.localOk) sites = previousSites;
      render();
      addBtn.focus();
    });
  });
}

function getFavicon(url, fallback) {
  try {
    return `<img src="${escapeHtml(getSiteIconUrl(url))}" alt="">`;
  } catch {
    return `<span>${(fallback || '?').slice(0, 1).toUpperCase()}</span>`;
  }
}

async function saveSites() {
  const result = await settingsWriter.save({ sites });
  if (!result.ok) {
    void logEvent('error', 'shortcut save failed', {
      localError: result.localError,
      syncError: result.syncError
    });
  }
  shortcutStatus.textContent = !result.localOk ? `Could not save shortcuts. ${result.localError || 'Try again.'}`
    : result.syncOk === false ? 'Saved on this device. Chrome sync is unavailable.' : 'Shortcuts saved';
  shortcutStatus.classList.toggle('error', !result.localOk);
  return result;
}

function buildSettingsSnapshot() {
  return {
    sites,
    appLinks,
    accountLinks,
    avatarUrl,
    scourUrl,
    arxivCategories,
    arxivRefreshMinutes,
    arxivCustomGroups,
    arxivFilter: FilterQuery.parseFilterQuery(arxivFilter, arxivFilterModeValue).ok ? arxivFilter : lastValidFilter.query,
    arxivFilterMode: FilterQuery.parseFilterQuery(arxivFilter, arxivFilterModeValue).ok ? arxivFilterModeValue : lastValidFilter.mode,
    arxivSavedFilters,
    themeMode,
    panelVisibility
  };
}

async function saveSettingsFields(keys, announce = false) {
  const snapshot = buildSettingsSnapshot();
  const payload = Object.fromEntries(keys.map(key => [key, snapshot[key]]));
  const result = await settingsWriter.save(payload);
  if (result.localOk) {
    const cacheKeys = ['arxivCategories', 'arxivRefreshMinutes', 'arxivCustomGroups', 'arxivFilter', 'arxivFilterMode', 'arxivSavedFilters', 'themeMode'];
    for (const key of keys) if (cacheKeys.includes(key)) writeLocalJson(key, payload[key]);
  }
  if (announce || !result.ok) flashSettingsSaved(result);
  if (!result.ok) {
    shortcutStatus.textContent = result.localOk ? 'Settings saved locally. Chrome sync is unavailable.' : `Settings not saved. ${result.localError}`;
    shortcutStatus.classList.toggle('error', !result.localOk);
    void logEvent('error', 'settings save failed', { localError: result.localError, syncError: result.syncError });
  }
  return result;
}

let settingsFlashTimer = null;
function flashSettingsSaved(result) {
  if (!settingsStatus) return;
  if (!result?.localOk) {
    settingsStatus.textContent = result.localError || 'Save failed. Please retry.';
  } else if (result.syncOk === false) {
    settingsStatus.textContent = 'Saved locally; Chrome sync failed.';
  } else {
    settingsStatus.textContent = 'Saved';
  }
  settingsStatus.classList.toggle('error', !result?.localOk);
  settingsStatus.style.opacity = '1';
  clearTimeout(settingsFlashTimer);
  if (result?.ok) settingsFlashTimer = setTimeout(() => { settingsStatus.style.opacity = '0'; }, 2000);
}


function getFocusableElements(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.classList.contains('hidden') && !el.closest('.hidden') && el.getClientRects().length > 0);
}

function openSettingsPanel() {
  if (!settingsPanel) return;
  settingsReturnFocus = document.activeElement;
  setDisclosureOpen(appsBtn, appsMenu, false);
  setDisclosureOpen(avatarBtn, accountMenu, false);
  renderSettingsPanel();
  settingsPanel.classList.remove('hidden');
  setMainInert(true);
  (settingsCloseBtn || getFocusableElements(settingsPanel)[0])?.focus();
}

function closeSettingsPanel() {
  if (!settingsPanel) return;
  settingsPanel.classList.add('hidden');
  setMainInert(false);
  if (settingsReturnFocus && typeof settingsReturnFocus.focus === 'function') {
    settingsReturnFocus.focus();
  }
  settingsReturnFocus = null;
}

function setDisclosureOpen(button, menu, open) {
  if (!button || !menu) return;
  menu.classList.toggle('hidden', !open);
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
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

function renderFeedEmpty(list, message, action = null) {
  list.replaceChildren();
  const empty = document.createElement('div');
  empty.className = 'feed-empty';
  const text = document.createElement('p');
  text.textContent = message;
  empty.appendChild(text);
  if (action) {
    const control = document.createElement(action.href ? 'a' : 'button');
    control.textContent = action.label;
    if (action.href) {
      control.href = action.href;
      control.target = '_blank';
      control.rel = 'noopener';
    } else {
      control.type = 'button';
      control.className = 'btn secondary';
      control.addEventListener('click', action.run);
    }
    empty.appendChild(control);
  }
  list.appendChild(empty);
}

function renderMenus() {
  renderAppsMenu();
  renderAccountMenu();
}

function renderAvatarFallback() {
  avatarBtn.style.backgroundImage = '';
  avatarBtn.classList.remove('has-image');
  const icon = document.createElement('span');
  icon.className = 'material-icon icon-account_circle';
  icon.setAttribute('aria-hidden', 'true');
  avatarBtn.replaceChildren(icon);
  avatarBtn.title = 'Google account links';
  avatarBtn.setAttribute('aria-label', 'Google account links');
}

function applyAvatar() {
  const resolvedAvatarUrl = LaunchPadCore.resolveAvatarUrl(avatarUrl);
  const requestVersion = ++avatarRequestVersion;
  if (!resolvedAvatarUrl) {
    renderAvatarFallback();
    return;
  }

  const avatarImage = new Image();
  avatarImage.onload = () => {
    if (requestVersion !== avatarRequestVersion) return;
    avatarBtn.style.backgroundImage = `url("${resolvedAvatarUrl.replace(/["\\]/g, '')}")`;
    avatarBtn.classList.add('has-image');
    avatarBtn.textContent = '';
    avatarBtn.title = 'Google account links';
    avatarBtn.setAttribute('aria-label', 'Google account links');
  };
  avatarImage.onerror = () => {
    if (requestVersion !== avatarRequestVersion) return;
    renderAvatarFallback();
  };
  avatarImage.src = resolvedAvatarUrl;
}

function normalizeUrl(url) {
  return LaunchPadCore.normalizeHttpUrl(url);
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
  applyLaunchPadTheme(themeMode);
}

function updateThemeSwitcher() {
  const switcher = document.getElementById('themeSwitcher');
  if (!switcher) return;
  switcher.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeMode);
  });
}

function renderSettingsPanel() {
  if (avatarUrlInput.getAttribute('aria-invalid') !== 'true') avatarUrlInput.value = avatarUrl;
  document.getElementById('scourUrlInput').value = scourUrl;
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
  updateArxivResearchContext();
  if (arxivFilterInput) {
    arxivFilterInput.value = arxivFilter;
  }
  if (arxivFilterMode) {
    arxivFilterMode.value = arxivFilterModeValue;
  }
  renderArxivQuickFilters();
  setupArxivRefreshTimer();
}

function navigateFromGoogleSearch() {
  const target = LaunchPadCore.resolveGoogleSearchTarget(searchInput.value);
  if (target) {
    window.location.href = target;
  } else {
    const error = LaunchPadCore.getSearchInputError(searchInput.value);
    if (error) searchStatus.textContent = error;
  }
}

function setVoiceSearchState(isListening, message = '') {
  voiceSearchBtn?.classList.toggle('is-listening', isListening);
  voiceSearchBtn?.setAttribute('aria-pressed', isListening ? 'true' : 'false');
  searchInput.placeholder = isListening ? 'Listening…' : GOOGLE_SEARCH_PLACEHOLDER;
  if (searchStatus) {
    searchStatus.textContent = message;
  }
}

function startVoiceSearch() {
  if (voiceRecognition) {
    voiceRecognition.stop();
    return;
  }

  const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceSearchState(false, 'Voice search is not available in this browser.');
    searchInput.focus();
    return;
  }

  const recognition = new SpeechRecognition();
  let voiceMessage = '';
  voiceRecognition = recognition;
  recognition.lang = navigator.language || 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    if (voiceRecognition === recognition) setVoiceSearchState(true, 'Listening for your search.');
  };
  recognition.onresult = event => {
    if (voiceRecognition !== recognition) return;
    const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
    if (!transcript) return;
    searchInput.value = transcript;
    voiceMessage = `Searching Google for ${transcript}.`;
    setVoiceSearchState(false, voiceMessage);
    navigateFromGoogleSearch();
  };
  recognition.onerror = event => {
    if (voiceRecognition !== recognition) return;
    const messages = {
      'not-allowed': 'Allow microphone access in Chrome to use voice search.',
      'service-not-allowed': 'Voice search is unavailable in this browser configuration. Type your query instead.',
      'audio-capture': 'No microphone is available. Type your query instead.',
      'network': 'The speech service could not be reached. Type your query or try again.',
      'no-speech': 'No speech was detected. Try again or type your query.'
    };
    voiceMessage = messages[event.error] || 'Voice search could not finish. Try again or type your query.';
    voiceRecognition = null;
    setVoiceSearchState(false, voiceMessage);
  };
  recognition.onend = () => {
    if (voiceRecognition !== recognition) return;
    voiceRecognition = null;
    setVoiceSearchState(false, voiceMessage || 'No speech was detected. Try again or type your query.');
  };

  try {
    recognition.start();
  } catch {
    voiceRecognition = null;
    setVoiceSearchState(false, 'Voice search could not start. Try again or type your query.');
  }
}

function getAllArxivFilters() {
  return [
    ...defaultArxivFilters.map(filter => ({ ...filter, custom: false })),
    ...arxivSavedFilters.map(filter => ({ ...filter, custom: true }))
  ];
}

function getActiveArxivResearchTrack() {
  return ArxivResearch.findMatchingArxivResearchTrack(
    arxivCategories,
    arxivFilter,
    arxivFilterModeValue
  );
}

function updateArxivResearchContext() {
  const activeId = getActiveArxivResearchTrack();
  const activePreset = activeId
    ? ArxivResearch.buildArxivResearchPreset(activeId)
    : null;
  if (arxivSubtitle) {
    arxivSubtitle.textContent = activePreset
      ? `${activePreset.label} · ${arxivCategories.length} feeds`
      : `Custom mix · ${arxivCategories.length || 1} feeds`;
  }
  renderArxivResearchTracks();
}

function renderArxivResearchTracks() {
  if (!arxivResearchTracks) return;
  const activeTrack = getActiveArxivResearchTrack();
  const presets = [
    ArxivResearch.buildArxivResearchPreset('all'),
    ...ArxivResearch.ARXIV_RESEARCH_TRACKS.map(track =>
      ArxivResearch.buildArxivResearchPreset(track.id)
    )
  ];
  arxivResearchTracks.innerHTML = '';
  presets.forEach(preset => {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.className = `research-track${preset.id === 'all' ? ' research-track-all' : ''}`;
    button.dataset.trackId = preset.id;
    button.title = preset.description;
    const isActive = activeTrack === preset.id;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');

    const indicator = document.createElement('span');
    indicator.className = 'research-track-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'research-track-label';
    label.textContent = preset.compactLabel;
    button.appendChild(indicator);
    button.appendChild(label);
    arxivResearchTracks.appendChild(button);
  });
}

function applyArxivResearchPreset(trackId) {
  const preset = ArxivResearch.buildArxivResearchPreset(trackId);
  if (!preset) return;
  arxivCategories = [...preset.categories];
  arxivFilter = preset.query;
  arxivFilterModeValue = preset.mode;
  applyArxivControls();
  void saveSettingsFields(['arxivCategories', 'arxivFilter', 'arxivFilterMode']);
  loadArxivFeed();
}

function applyArxivFilterPreset(filter) {
  arxivFilter = filter.query;
  arxivFilterModeValue = filter.mode === 'all' ? 'all' : 'any';
  applyArxivControls();
  renderArxivItems();
  void saveSettingsFields(['arxivFilter', 'arxivFilterMode']);
}

function renderArxivQuickFilters() {
  if (!arxivQuickFilters) return;
  arxivQuickFilters.innerHTML = '';
  getAllArxivFilters().forEach((filter, index) => {
    const pill = document.createElement('span');
    pill.className = 'filter-chip-wrap';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.dataset.filterIndex = String(index);
    button.textContent = filter.label;
    const isActive = arxivFilter.trim() === filter.query && arxivFilterModeValue === filter.mode;
    button.classList.toggle('active', isActive);
    pill.appendChild(button);

    if (filter.custom) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'filter-chip-remove';
      remove.dataset.filterIndex = String(index);
      remove.setAttribute('aria-label', `Remove saved filter ${filter.label}`);
      remove.textContent = '×';
      pill.appendChild(remove);
    }

    arxivQuickFilters.appendChild(pill);
  });
}

function saveCurrentArxivFilter() {
  if (!FilterQuery.parseFilterQuery(arxivFilter, arxivFilterModeValue).ok) {
    renderArxivItems();
    arxivFilterInput.focus();
    return;
  }
  const query = arxivFilter.trim();
  if (!query) return;
  const duplicate = arxivSavedFilters.some(filter =>
    filter.query === query && filter.mode === arxivFilterModeValue
  );
  if (duplicate) return;
  if (arxivSavedFilters.length >= 12) {
    document.getElementById('arxivFilterError').textContent = 'You can save up to 12 filters. Remove one before saving another.';
    return;
  }
  const label = query
    .replace(/[()"']/g, '')
    .replace(/\s+(AND|OR)\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24) || 'Saved filter';
  arxivSavedFilters = normalizeSavedFilters([
    { label, query, mode: arxivFilterModeValue },
    ...arxivSavedFilters
  ]);
  void saveSettingsFields(['arxivSavedFilters'], true);
  renderArxivQuickFilters();
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

function readMatchingArxivCache(categories) {
  const cache = readLocalJson(CACHE_KEYS.arxiv);
  if (cache?.version !== 2 || !Array.isArray(cache.items) || !Array.isArray(cache.categories)) {
    return [];
  }
  const requested = Array.from(new Set(categories)).sort();
  const cachedCategories = Array.from(new Set(cache.categories)).sort();
  const sameCategories = requested.length === cachedCategories.length &&
    requested.every((category, index) => category === cachedCategories[index]);
  return sameCategories ? sanitizeCachedFeed(cache.items) : [];
}

function sanitizeCachedFeed(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(item => item && typeof item.title === 'string' && LaunchPadCore.normalizeHttpUrl(item.link))
    .map(item => {
      const safe = { ...item, link: LaunchPadCore.normalizeHttpUrl(item.link) };
      for (const key of ['description', 'desc', 'pubDate', 'category', 'time', 'reason', 'language', 'license', 'sourceLabel']) {
        safe[key] = typeof item[key] === 'string' ? item[key] : '';
      }
      for (const key of ['tags', 'sources']) safe[key] = Array.isArray(item[key]) ? item[key].filter(value => typeof value === 'string') : [];
      for (const key of ['stars', 'score']) safe[key] = typeof item[key] === 'number' && Number.isFinite(item[key]) ? item[key] : 0;
      return safe;
    });
}

async function loadArxivFeed() {
  if (!arxivList || !arxivStatus) return;
  const requestVersion = ++arxivRequestVersion;
  const categories = Array.from(new Set(arxivCategories))
    .filter(category => /^[a-z-]+(?:\.[a-z-]+)?$/i.test(category))
    .slice(0, 12);
  if (categories.length === 0) categories.push('cs.AI');
  // stale-while-revalidate: show cached data first
  const cached = readMatchingArxivCache(categories);
  if (cached.length) {
    arxivItems = cached;
    const rendered = renderArxivItems();
    arxivStatus.textContent = `Cached · ${rendered.filteredCount} matches from ${rendered.totalCount} papers`;
  } else {
    renderSkeleton(arxivList, 5);
    arxivStatus.textContent = 'Loading latest papers...';
  }
  try {
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
      if (doc.querySelector('parsererror') || !['rss', 'rdf'].includes(doc.documentElement?.localName.toLowerCase()) || !doc.querySelector('channel')) {
        throw new Error('The source did not return a valid RSS feed');
      }
      return Array.from(doc.querySelectorAll('item'))
        .map(item => ({
          title: item.querySelector('title')?.textContent?.trim() || 'Untitled',
          link: LaunchPadCore.normalizeHttpUrl(item.querySelector('link')?.textContent?.trim() || ''),
          pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
          description: item.querySelector('description')?.textContent?.trim() || '',
          category
        }))
        .filter(item => item.link);
    };
    const results = await Promise.allSettled(categories.map(fetchCategory));
    if (requestVersion !== arxivRequestVersion) return;
    const coverage = LaunchPadCore.summarizeSettledResults(results);
    if (coverage.kind === 'failed') {
      throw new Error('All arXiv categories failed');
    }
    const seen = new Set();
    const merged = [];
    for (const item of coverage.items) {
        if (!item.link || seen.has(item.link)) continue;
        seen.add(item.link);
        merged.push(item);
    }
    if (merged.length === 0) {
      if (coverage.kind === 'partial' && cached.length) {
        arxivStatus.textContent = `Using cached data · ${coverage.rejected}/${coverage.total} categories failed`;
      } else {
        arxivItems = [];
        renderFeedEmpty(arxivList, 'No papers were returned for these categories.', {
          label: 'Open arXiv', href: 'https://arxiv.org/'
        });
        arxivStatus.textContent = coverage.kind === 'partial'
          ? `No papers from available categories · ${coverage.rejected}/${coverage.total} failed`
          : 'No papers found.';
      }
      return;
    }
    merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    arxivItems = merged.slice(0, MAX_ARXIV_ITEMS);
    if (coverage.kind === 'complete') {
      writeLocalJson(CACHE_KEYS.arxiv, {
        version: 2,
        categories: [...categories],
        fetchedAt: Date.now(),
        items: arxivItems
      });
    }
    const rendered = renderArxivItems();
    arxivStatus.textContent = coverage.kind === 'partial'
      ? `Partial update · ${coverage.fulfilled}/${coverage.total} feeds · ${rendered.filteredCount} matches from ${rendered.totalCount} papers`
      : `Updated just now · ${rendered.filteredCount} matches from ${rendered.totalCount} papers`;
  } catch (error) {
    if (requestVersion !== arxivRequestVersion) return;
    if (!arxivItems.length) {
      renderFeedEmpty(arxivList, 'Try again, or check the source directly.', {
        label: 'Open arXiv', href: 'https://arxiv.org/'
      });
      setStatusWithRetry(arxivStatus, 'Failed to load arXiv feed.', loadArxivFeed);
    } else {
      arxivStatus.textContent = cached.length
        ? 'Using cached data (refresh failed)'
        : 'Keeping previous data (refresh failed)';
    }
  }
}

function getArxivSummary(value) {
  const documentFragment = new DOMParser().parseFromString(String(value || ''), 'text/html');
  return String(documentFragment.body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^arXiv:\S+\s+Announce Type:.{0,100}?\s+Abstract:\s*/i, '');
}

function formatArxivDate(value) {
  const timestamp = Date.parse(value || '');
  if (!Number.isFinite(timestamp)) return value || 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(timestamp);
}

function renderArxivItems() {
  if (!arxivList || !arxivStatus) return { filteredCount: 0, totalCount: 0 };
  const parsed = FilterQuery.parseFilterQuery(arxivFilter, arxivFilterModeValue);
  const error = document.getElementById('arxivFilterError');
  error.textContent = parsed.ok ? '' : `Filter not applied. ${parsed.error} Showing the last valid results.`;
  arxivFilterInput?.setAttribute('aria-invalid', parsed.ok ? 'false' : 'true');
  if (parsed.ok) lastValidFilter = { query: arxivFilter.trim(), mode: arxivFilterModeValue, ast: parsed.ast };
  const trimmed = lastValidFilter.query;
  const filtered = arxivItems.filter(item => FilterQuery.matchesFilterAst(lastValidFilter.ast, `${item.title} ${getArxivSummary(item.description)}`));
  arxivList.innerHTML = '';
  if (filtered.length === 0) {
    arxivStatus.textContent = 'No papers match the filter.';
    renderFeedEmpty(arxivList, trimmed ? 'Try a broader query or clear the current filter.' : 'No papers available yet.',
      trimmed ? { label: 'Clear filter', run: () => arxivFilterClear.click() } : null);
    return { filteredCount: 0, totalCount: arxivItems.length };
  }
  arxivStatus.textContent = trimmed
    ? `Showing ${filtered.length} of ${arxivItems.length} papers`
    : `Showing ${filtered.length} papers`;
  filtered.forEach((item, index) => {
    const entry = document.createElement('a');
    entry.className = 'panel-item research-card';
    entry.href = item.link;
    entry.target = '_blank';
    entry.rel = 'noopener';
    entry.role = 'listitem';
    entry.style.setProperty('--item-index', String(Math.min(index, 12)));
    const summary = getArxivSummary(item.description);
    const matchedTracks = ArxivResearch.matchArxivResearchTracks(item);
    const reason = matchedTracks.length
      ? matchedTracks.map(track => track.label).join(' · ')
      : 'Custom research filter';
    entry.innerHTML = `
      <div class="panel-item-title research-card-title">${escapeHtml(item.title)}</div>
      ${summary ? `<div class="panel-item-desc research-card-desc">${escapeHtml(summary)}</div>` : ''}
      <div class="panel-item-meta research-card-meta">arXiv RSS · ${escapeHtml(item.category)} · ${escapeHtml(formatArxivDate(item.pubDate))}</div>
      <div class="panel-item-reason research-card-reason">${escapeHtml(reason)}</div>
    `;
    arxivList.appendChild(entry);
  });
  return { filteredCount: filtered.length, totalCount: arxivItems.length };
}

function updateScourSource() {
  const sourceLink = document.getElementById('scourSourceLink');
  sourceLink.hidden = !scourUrl;
  sourceLink.href = scourUrl || 'https://scour.ing/';
  document.getElementById('scourSubtitle').textContent = scourUrl
    ? `Curated links · ${new URL(scourUrl).pathname.slice(1)}` : 'Your reading feed';
}

async function loadScourFeed() {
  if (!scourList || !scourStatus) return;
  const request = ++scourRequestVersion;
  const sourceUrl = scourUrl;
  updateScourSource();
  scourList.replaceChildren();
  scourItems = [];
  scourRendered = 0;
  if (!sourceUrl) {
    scourStatus.textContent = 'No Scour profile connected';
    renderFeedEmpty(scourList, 'Connect a public Scour profile to keep your reading feed here.', {
      label: 'Connect Scour', run: () => {
        openSettingsPanel();
        activateSettingsTab(settingsPanel.querySelector('[data-tab="general"]'));
        document.getElementById('scourUrlInput').focus();
      }
    });
    return;
  }
  const record = readLocalJson(CACHE_KEYS.scour);
  const cached = sanitizeCachedFeed(record?.source === sourceUrl && Array.isArray(record.items) ? record.items
    : sourceUrl === LEGACY_SCOUR_URL && Array.isArray(record) ? record : []);
  if (cached.length) {
    scourItems = cached;
    scourStatus.textContent = `Showing cached · ${cached.length} items`;
    renderScourBatch();
  } else {
    renderSkeleton(scourList, 3);
    scourStatus.textContent = 'Loading...';
  }
  try {
    const { items } = await fetchScourItems(sourceUrl);
    if (request !== scourRequestVersion) return;
    if (!items.length) {
      if (cached.length) scourStatus.textContent = `Showing cached · ${cached.length} items · no new items returned`;
      else {
        scourStatus.textContent = 'No readable items found.';
        renderFeedEmpty(scourList, 'Check the source for new links, or try refreshing.', { label: 'Open Scour', href: sourceUrl });
      }
      return;
    }
    writeLocalJson(CACHE_KEYS.scour, { version: 2, source: sourceUrl, fetchedAt: Date.now(), items });
    scourItems = items;
    scourRendered = 0;
    scourList.replaceChildren();
    scourStatus.textContent = `Updated just now · ${items.length} items`;
    renderScourBatch();
  } catch (error) {
    if (request !== scourRequestVersion) return;
    if (!cached.length) {
      renderFeedEmpty(scourList, 'Try again, or check the source directly.', { label: 'Open Scour', href: sourceUrl });
      setStatusWithRetry(scourStatus, 'Failed to load Scour feed.', loadScourFeed);
    } else scourStatus.textContent = `Using cached data · ${cached.length} items · refresh failed`;
  }
}

async function fetchAcademicJson(type, url) {
  if (globalThis.chrome?.runtime?.sendMessage) {
    const result = await chrome.runtime.sendMessage({ type, url });
    if (!result || !result.ok) {
      throw new Error(result?.error || 'Fetch failed');
    }
    try {
      return JSON.parse(result.text);
    } catch {
      throw new Error('Source returned invalid JSON');
    }
  }
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function academicTrendSourceLabel(items) {
  const sources = new Set(items.flatMap(item => item.sources || []));
  if (sources.has('ossinsight') && sources.has('github-search')) {
    return 'OSS Insight + GitHub Search';
  }
  if (sources.has('ossinsight')) return 'OSS Insight';
  if (sources.has('github-search')) return 'GitHub Search';
  return 'Academic ranking';
}

function formatAcademicTrendStatus(cache, prefix = '') {
  const source = academicTrendSourceLabel(cache.items || []);
  const sources = new Set((cache.items || []).flatMap(item => item.sources || []));
  const window = sources.has('ossinsight') && sources.has('github-search')
    ? '7d trend + 180d fallback'
    : sources.has('ossinsight')
      ? '7d trend'
      : cache.coverage?.primary === 'complete'
        ? '180d fallback · OSS Insight scanned'
        : '180d active-repo fallback';
  const state = cache.coverage?.state === 'partial' ? 'partial coverage' : 'complete coverage';
  const message = `${source} · ${window} · ${state} · ${cache.items.length} projects`;
  return prefix ? `${prefix} · ${message}` : message;
}

async function loadAcademicTrend() {
  if (!favoriteList || !favoriteStatus) return;
  const storedCache = readLocalJson(CACHE_KEYS.academicTrend);
  const cached = storedCache ? { ...storedCache, items: sanitizeCachedFeed(storedCache.items) } : null;
  const cachedItems = Array.isArray(cached?.items) ? cached.items : [];
  if (AcademicTrend.isFreshTrendCache(cached)) {
    favoriteStatus.textContent = formatAcademicTrendStatus(cached, 'Cached < 1h');
    renderAcademicTrendItems(cached.items);
    return;
  }
  if (cachedItems.length) {
    favoriteStatus.textContent = formatAcademicTrendStatus(cached, 'Refreshing cached results');
    renderAcademicTrendItems(cachedItems);
  } else {
    favoriteStatus.textContent = 'Loading research-profile trends...';
    renderSkeleton(favoriteList, 4);
  }

  try {
    let primaryItems = [];
    let primaryOk = false;
    try {
      const payload = await fetchAcademicJson('fetchAcademicTrend', ACADEMIC_TREND_URL);
      if (!Array.isArray(payload?.data?.rows)) throw new Error('Invalid OSS Insight response');
      primaryItems = AcademicTrend.normalizeOssInsight(payload);
      primaryOk = true;
    } catch (error) {
      void logEvent('warn', 'academic trend primary source failed', { message: error.message });
    }

    const primaryRanked = AcademicTrend.mergeAndRankRepositories(primaryItems, { limit: 10 });
    const needsFallback = primaryRanked.length < 10;
    let fallbackItems = [];
    let fallbackFulfilled = 0;
    let fallbackIncomplete = false;
    const fallbackRequests = needsFallback ? AcademicTrend.buildGithubSearchRequests() : [];

    if (needsFallback) {
      const results = await Promise.allSettled(fallbackRequests.map(async request => {
        const payload = await fetchAcademicJson('fetchGithubSearch', request.url);
        if (!Array.isArray(payload?.items)) throw new Error('Invalid GitHub Search response');
        return AcademicTrend.normalizeGithubSearch(payload, request.area);
      }));
      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        fallbackFulfilled += 1;
        fallbackIncomplete ||= result.value.incomplete;
        fallbackItems = [...fallbackItems, ...result.value.items];
      }
    }

    const items = AcademicTrend.mergeAndRankRepositories(
      [...primaryItems, ...fallbackItems],
      { limit: 10 }
    );
    if (items.length === 0) {
      if (primaryOk || fallbackFulfilled > 0) {
        if (cachedItems.length) {
          favoriteStatus.textContent = formatAcademicTrendStatus(cached, 'Cached · no new matches returned');
        } else {
          favoriteStatus.textContent = 'No matching projects returned by the available sources.';
          renderFeedEmpty(favoriteList, 'Try refreshing later, or browse the source directly.');
        }
        return;
      }
      throw new Error('No projects matched the academic profile');
    }

    const fallbackComplete = !needsFallback ||
      (fallbackFulfilled === fallbackRequests.length && !fallbackIncomplete);
    const coverage = {
      state: primaryOk && fallbackComplete ? 'complete' : 'partial',
      primary: primaryOk ? 'complete' : 'failed',
      githubSearch: needsFallback
        ? `${fallbackFulfilled}/${fallbackRequests.length}`
        : 'not-needed',
      incompleteResults: fallbackIncomplete,
      primaryAcademicMatches: primaryRanked.length,
      fallbackCandidates: fallbackItems.length,
      window: 'past_week'
    };
    const trendCache = AcademicTrend.createTrendCache(items, coverage);
    writeLocalJson(CACHE_KEYS.academicTrend, trendCache);
    favoriteStatus.textContent = formatAcademicTrendStatus(trendCache, 'Updated now');
    renderAcademicTrendItems(items);
  } catch (error) {
    void logEvent('error', 'academic trend refresh failed', { message: error.message });
    if (!cachedItems.length) {
      renderFeedEmpty(favoriteList, 'The trend sources are unavailable. Try refreshing again.');
      setStatusWithRetry(favoriteStatus, 'Failed to load Academic GitHub Trend.', loadAcademicTrend);
    } else {
      favoriteStatus.textContent = formatAcademicTrendStatus(cached, 'Cached fallback · refresh failed');
    }
  }
}

function renderAcademicTrendItems(items) {
  favoriteList.innerHTML = '';
  items.forEach((item, index) => {
    const safeUrl = LaunchPadCore.normalizeHttpUrl(item.link);
    if (!safeUrl) return;
    const el = document.createElement('a');
    el.className = 'favorite-item research-card';
    el.href = safeUrl;
    el.target = '_blank';
    el.rel = 'noopener';
    el.role = 'listitem';
    el.style.setProperty('--item-index', String(Math.min(index, 12)));
    const titleEl = document.createElement('div');
    titleEl.className = 'favorite-item-title research-card-title';
    titleEl.textContent = item.title;
    const descEl = document.createElement('div');
    descEl.className = 'favorite-item-desc research-card-desc';
    descEl.textContent = item.desc;
    const metaEl = document.createElement('div');
    metaEl.className = 'favorite-item-meta research-card-meta';
    const metaParts = [
      `★ ${Number(item.stars || 0).toLocaleString()}`,
      `Score ${Number(item.score || 0).toFixed(1)}`,
      item.sourceLabel,
      item.language,
      item.license
    ].filter(Boolean);
    metaEl.textContent = metaParts.join(' · ');
    const reasonEl = document.createElement('div');
    reasonEl.className = 'favorite-item-reason research-card-reason';
    reasonEl.textContent = item.reason || 'Research-profile match';
    el.appendChild(titleEl);
    el.appendChild(descEl);
    el.appendChild(metaEl);
    el.appendChild(reasonEl);
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
  return LaunchPadCore.normalizeHttpUrl(href, scourUrl);
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
    const safeLink = normalizeScourUrl(link);
    if (!safeLink || !title || seen.has(safeLink)) return;
    if (title.length < 6) return;
    seen.add(safeLink);
    items.push({ title, link: safeLink, time, tags });
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

async function fetchScourItems(sourceUrl) {
  const urls = [
    sourceUrl,
    `${sourceUrl}.rss`,
    `${sourceUrl}/rss`,
    `${sourceUrl}.xml`,
    `${sourceUrl}/feed`
  ];
  let successfulSources = 0;
  for (const url of urls) {
    try {
      const text = await fetchScourUrl(url);
      successfulSources += 1;
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
  if (successfulSources === 0) throw new Error('All Scour sources failed');
  return { items: [], source: '' };
}

function parseScourFeedLink(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const link = doc.querySelector('link[rel="alternate"][type*="rss"], link[rel="alternate"][type*="atom"]');
  const href = link?.getAttribute('href');
  return href ? normalizeScourUrl(href) : '';
}

function getOriginPattern(url) {
  try {
    return `${new URL(url).origin}/*`;
  } catch {
    return '';
  }
}

function ensurePreviewPermission(url) {
  if (!chrome.permissions?.request) return Promise.resolve(true);
  const origin = getOriginPattern(url);
  if (!origin) return Promise.resolve(false);
  // Call request immediately from the click call stack so Chrome retains the user gesture.
  return chrome.permissions.request({ origins: [origin] }).catch(() => false);
}

function renderScourBatch() {
  if (!scourList) return;
  if (scourLoadingMore) return;
  scourLoadingMore = true;
  const nextItems = scourItems.slice(scourRendered, scourRendered + SCOUR_BATCH_SIZE);
  nextItems.forEach((item, index) => {
    const itemLink = normalizeScourUrl(item.link);
    if (!itemLink) return;
    const domain = new URL(itemLink).hostname.replace('www.', '');
    const entry = document.createElement('div');
    entry.className = 'scour-item research-card';
    entry.role = 'listitem';
    entry.dataset.link = itemLink;
    entry.style.setProperty('--item-index', String(scourRendered + index));
    const meta = [domain, item.time].filter(Boolean).join(' · ');
    const tagHtml = (item.tags || []).map(tag => `<span class="scour-tag">${escapeHtml(tag)}</span>`).join('');
    entry.innerHTML = `
      <div class="scour-item-title research-card-title"><a href="${escapeHtml(itemLink)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></div>
      <div class="scour-item-meta research-card-meta">${escapeHtml(meta)}</div>
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
  const empty = { text: '', image: '', error: '' };
  const validation = LaunchPadCore.validateFetchTarget('fetchPreview', url);
  if (!validation.ok) return { ...empty, error: validation.error };
  url = validation.url;
  if (scourPreviewCache.has(url)) return scourPreviewCache.get(url);
  let html = '';
  try {
    if (chrome.runtime?.sendMessage) {
      const permitted = await ensurePreviewPermission(url);
      if (!permitted) {
        return {
          text: '',
          image: '',
          error: 'Preview permission was not granted for this site.'
        };
      }
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
    const data = { text, image: LaunchPadCore.normalizeHttpUrl(ogImage, url), error: '' };
    scourPreviewCache.set(url, data);
    return data;
  } catch {
    return { ...empty, error: 'Could not load this preview. Retry, or open the article. Redirecting pages may need to be opened directly.' };
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
    if (!preview.classList.contains('hidden') && item.dataset.previewState !== 'error') {
      delete item.dataset.previewRequest;
      preview.classList.add('hidden');
      toggle.textContent = 'Preview';
      return;
    }
    const previewRequest = String(++previewRequestVersion);
    item.dataset.previewRequest = previewRequest;
    item.dataset.previewState = 'loading';
    preview.setAttribute('aria-busy', 'true');
    // Show skeleton while loading
    preview.innerHTML = '<div class="skeleton-line medium"></div><div class="skeleton-line short"></div>';
    preview.classList.remove('hidden');
    toggle.textContent = 'Loading...';
    const data = await fetchPreviewData(link);
    if (item.dataset.previewRequest !== previewRequest) return;
    preview.replaceChildren();
    preview.setAttribute('aria-busy', 'false');
    if (data.error) {
      item.dataset.previewState = 'error';
      preview.textContent = data.error;
      toggle.textContent = 'Retry preview';
      return;
    }
    item.dataset.previewState = 'ready';
    if (data.image) {
      const img = document.createElement('img');
      img.className = 'scour-preview-img';
      img.src = data.image;
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => img.remove(), { once: true });
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
    const appUrl = LaunchPadCore.normalizeHttpUrl(app.url);
    if (!appUrl) return;
    const item = document.createElement('a');
    item.className = 'app-item';
    item.href = appUrl;
    item.target = '_blank';
    item.rel = 'noopener';
    item.role = 'menuitem';
    item.dataset.type = 'app';
    item.dataset.index = String(index);
    item.draggable = true;
    const iconSrc = LaunchPadCore.normalizeHttpUrl(app.icon || APP_ICON_MAP.get(app.url) || '');
    const iconHtml = iconSrc
      ? `<img src="${escapeHtml(iconSrc)}" alt="">`
      : getFavicon(appUrl, app.name);
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
    const entryUrl = LaunchPadCore.normalizeHttpUrl(entry.url);
    if (!entryUrl) return;
    const item = document.createElement('a');
    item.className = 'account-item';
    item.href = entryUrl;
    item.target = '_blank';
    item.rel = 'noopener';
    item.role = 'menuitem';
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

async function handleDrop(e, container) {
  const previous = { sites: [...sites], app: [...appLinks], account: [...accountLinks] };
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
  const type = dragState.type;
  dragState = null;
  clearDragOver(container);
  container.inert = true;
  const result = await saveSettingsFields([{ shortcut: 'sites', app: 'appLinks', account: 'accountLinks' }[type]]);
  container.inert = false;
  if (!result.localOk) {
    if (type === 'shortcut') sites = previous.sites;
    if (type === 'app') appLinks = previous.app;
    if (type === 'account') accountLinks = previous.account;
  }
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
  if (!enabled) applyPendingExternalSites();
}

if (editModeBtn) {
  editModeBtn.addEventListener('click', () => setEditMode(!isEditMode));
}

if (editBannerDone) {
  editBannerDone.addEventListener('click', () => setEditMode(false));
}

function openAddForm(mode, returnFocus = document.activeElement) {
  const isEdit = mode === 'edit';
  shortcutReturnFocus = returnFocus;
  clearShortcutValidation();
  if (addTitle) addTitle.textContent = isEdit ? 'Edit shortcut' : 'Add shortcut';
  saveBtn.textContent = isEdit ? 'Save' : 'Add';
  addForm.classList.remove('hidden');
  setMainInert(true);
  siteNameInput.focus();
}

function setMainInert(inert) {
  for (const element of [document.querySelector('.topbar'), layout, editBanner]) {
    if (element) element.inert = inert;
  }
}

function resetAddForm() {
  const editedIndex = editingIndex;
  addForm.classList.add('hidden');
  setMainInert(false);
  siteNameInput.value = '';
  siteUrlInput.value = '';
  editingIndex = null;
  clearShortcutValidation();
  if (addTitle) addTitle.textContent = 'Add shortcut';
  saveBtn.textContent = 'Add';
  saveBtn.disabled = false;
  cancelBtn.disabled = false;
  const fallback = editedIndex === null ? addBtn
    : launchpad.querySelector(`[data-index="${editedIndex}"] .shortcut-more`) || addBtn;
  (shortcutReturnFocus?.isConnected ? shortcutReturnFocus : fallback).focus();
  shortcutReturnFocus = null;
  applyPendingExternalSites();
}

cancelBtn.addEventListener('click', resetAddForm);
addForm.addEventListener('click', (event) => {
  if (event.target === addForm && !saveBtn.disabled) resetAddForm();
});
addForm.addEventListener('keydown', (event) => trapDialogFocus(event, addForm));
for (const input of [siteNameInput, siteUrlInput]) {
  input.addEventListener('input', () => {
    input.setAttribute('aria-invalid', 'false');
    document.getElementById(`${input.id}Error`).textContent = '';
    shortcutFormStatus.textContent = '';
  });
}

shortcutForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (saveBtn.disabled) return;
  const candidate = LaunchPadCore.validateShortcut(siteNameInput.value, siteUrlInput.value);
  showShortcutValidation(candidate);
  if (!candidate.ok) {
    (candidate.errors.name ? siteNameInput : siteUrlInput).focus();
    return;
  }
  const previousSites = [...sites];
  if (editingIndex !== null && sites[editingIndex]) {
    sites[editingIndex] = { ...sites[editingIndex], name: candidate.name, url: candidate.url };
  } else {
    sites.push({ name: candidate.name, url: candidate.url });
  }
  saveBtn.disabled = true;
  cancelBtn.disabled = true;
  const result = await saveSites();
  saveBtn.disabled = false;
  cancelBtn.disabled = false;
  if (!result.localOk) {
    sites = previousSites;
    shortcutFormStatus.textContent = `Could not save this shortcut. ${result.localError} Your changes are still here.`;
    return;
  }
  render();
  resetAddForm();
});

launchpad.addEventListener('click', (event) => {
  const more = event.target.closest('.shortcut-more');
  if (more) {
    event.stopPropagation();
    contextIndex = Number(more.closest('.shortcut').dataset.index);
    contextReturnFocus = more;
    const rect = more.getBoundingClientRect();
    openContextMenu(rect.left, rect.bottom + 4);
    return;
  }
  if (event.target.closest('.add-btn')) openAddForm('add');
});

const addBtn = document.createElement('button');
addBtn.className = 'shortcut add-btn';
addBtn.type = 'button';
addBtn.setAttribute('aria-label', 'Add shortcut');
addBtn.innerHTML = `
  <div class="shortcut-icon"><span class="material-icon icon-add" aria-hidden="true"></span></div>
  <div class="shortcut-name">Add shortcut</div>
`;

const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu hidden';
contextMenu.innerHTML = `
  <button type="button" class="context-item" role="menuitem" data-action="open">Open in new tab</button>
  <button type="button" class="context-item" role="menuitem" data-action="copy">Copy URL</button>
  <div class="context-divider"></div>
  <button type="button" class="context-item" role="menuitem" data-action="edit">Edit name/URL</button>
  <button type="button" class="context-item" role="menuitem" data-action="edit-mode">Edit shortcuts</button>
  <button type="button" class="context-item danger" role="menuitem" data-action="delete">Delete</button>
`;
contextMenu.setAttribute('role', 'menu');
document.body.appendChild(contextMenu);

function closeContextMenu(restoreFocus = false) {
  contextMenu.classList.add('hidden');
  contextIndex = null;
  contextReturnFocus?.setAttribute('aria-expanded', 'false');
  if (restoreFocus && contextReturnFocus?.isConnected) contextReturnFocus.focus();
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
  contextReturnFocus?.setAttribute('aria-expanded', 'true');
  contextMenu.querySelector('.context-item')?.focus();
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
  contextReturnFocus = shortcut.querySelector('.shortcut-more');
  openContextMenu(e.clientX, e.clientY);
});

contextMenu.addEventListener('click', async (e) => {
  const action = e.target.closest('.context-item')?.dataset.action;
  if (!action || contextIndex === null) {
    return;
  }
  const site = sites[contextIndex];
  if (action === 'open' && site) {
    const target = LaunchPadCore.normalizeHttpUrl(site.url);
    if (target) window.open(target, '_blank', 'noopener');
    closeContextMenu(true);
    return;
  }
  if (action === 'copy' && site) {
    const target = LaunchPadCore.normalizeHttpUrl(site.url);
    try {
      await navigator.clipboard.writeText(target);
      shortcutStatus.textContent = 'Link copied';
      shortcutStatus.classList.remove('error');
    } catch {
      shortcutStatus.textContent = 'Could not copy this link. Try again.';
      shortcutStatus.classList.add('error');
    }
    closeContextMenu(true);
    return;
  }
  if (action === 'delete') {
    const previousSites = [...sites];
    sites.splice(contextIndex, 1);
    closeContextMenu();
    const result = await saveSites();
    if (!result.localOk) sites = previousSites;
    render();
    addBtn.focus();
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
      closeContextMenu();
      openAddForm('edit', contextReturnFocus);
    }
    closeContextMenu();
  }
});

window.addEventListener('resize', () => closeContextMenu());
document.addEventListener('click', (e) => {
  if (!contextMenu.classList.contains('hidden') && !contextMenu.contains(e.target)) {
    closeContextMenu();
  }
});

appsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const shouldOpen = appsMenu.classList.contains('hidden');
  setDisclosureOpen(appsBtn, appsMenu, shouldOpen);
  setDisclosureOpen(avatarBtn, accountMenu, false);
});

avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const shouldOpen = accountMenu.classList.contains('hidden');
  setDisclosureOpen(avatarBtn, accountMenu, shouldOpen);
  setDisclosureOpen(appsBtn, appsMenu, false);
});

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openSettingsPanel();
});

settingsCloseBtn.addEventListener('click', () => {
  closeSettingsPanel();
});

function activateSettingsTab(tab) {
  const tabId = tab.dataset.tab;
  if (!tabId) return;
  settingsPanel.querySelectorAll('.settings-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
    t.setAttribute('aria-selected', t.dataset.tab === tabId ? 'true' : 'false');
  });
  settingsPanel.querySelectorAll('.settings-tab-content').forEach(c => {
    c.classList.toggle('active', c.dataset.tabContent === tabId);
  });
}

// Settings tab navigation
settingsPanel.addEventListener('click', (e) => {
  const tab = e.target.closest('.settings-tab');
  if (!tab) return;
  activateSettingsTab(tab);
});

settingsPanel.addEventListener('keydown', (e) => {
  const tab = e.target.closest('.settings-tab');
  if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const tabs = Array.from(settingsPanel.querySelectorAll('.settings-tab'));
  const current = tabs.indexOf(tab);
  let nextIndex = current;
  if (e.key === 'ArrowLeft') nextIndex = (current - 1 + tabs.length) % tabs.length;
  if (e.key === 'ArrowRight') nextIndex = (current + 1) % tabs.length;
  if (e.key === 'Home') nextIndex = 0;
  if (e.key === 'End') nextIndex = tabs.length - 1;
  const nextTab = tabs[nextIndex];
  activateSettingsTab(nextTab);
  nextTab.focus();
});

settingsPanel.addEventListener('click', (e) => {
  if (e.target === settingsPanel) {
    closeSettingsPanel();
  }
});

function trapDialogFocus(event, dialog) {
  if (event.key !== 'Tab' || dialog.classList.contains('hidden')) return;
  const focusable = getFocusableElements(dialog);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
}
settingsPanel.addEventListener('keydown', event => trapDialogFocus(event, settingsPanel));
contextMenu.addEventListener('keydown', event => {
  const items = Array.from(contextMenu.querySelectorAll('.context-item'));
  const index = items.indexOf(document.activeElement);
  let next;
  if (event.key === 'ArrowDown') next = (index + 1) % items.length;
  if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = items.length - 1;
  if (next !== undefined) { event.preventDefault(); items[next].focus(); }
  if (event.key === 'Tab') closeContextMenu(true);
});

// Auto-save valid avatar input, and flush the debounce when focus leaves the field.
if (avatarUrlInput) {
  let avatarSaveTimer = null;
  const commitAvatar = () => {
    clearTimeout(avatarSaveTimer);
    const value = avatarUrlInput.value.trim();
    const error = LaunchPadCore.validateSettingsPatch({ avatarUrl: value });
    avatarUrlInput.setCustomValidity(error);
    avatarUrlInput.setAttribute('aria-invalid', error ? 'true' : 'false');
    if (error) { flashSettingsSaved({ localOk: false, localError: error }); return; }
    avatarUrl = value;
    applyAvatar();
    void saveSettingsFields(['avatarUrl'], true);
  };
  avatarUrlInput.addEventListener('input', () => {
    clearTimeout(avatarSaveTimer);
    avatarSaveTimer = setTimeout(commitAvatar, 500);
  });
  avatarUrlInput.addEventListener('change', commitAvatar);
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
    void saveSettingsFields(['themeMode'], true);
  });
}

function validateSettingsField(input, error) {
  input.setCustomValidity(error);
  input.setAttribute('aria-invalid', error ? 'true' : 'false');
  if (error) { input.reportValidity(); flashSettingsSaved({ localOk: false, localError: error }); }
  return !error;
}
for (const input of [arxivCategoryInput, arxivRefreshInput, arxivGroupNameInput, arxivGroupCategoriesInput]) {
  input.addEventListener('input', () => { input.setCustomValidity(''); input.setAttribute('aria-invalid', 'false'); });
}

arxivRefreshBtn.addEventListener('click', () => {
  const categories = [...new Set(arxivCategoryInput.value.split(',').map(value => value.trim()).filter(Boolean))];
  if (!validateSettingsField(arxivCategoryInput, LaunchPadCore.validateSettingsPatch({ arxivCategories: categories }))) return;
  arxivCategories = categories;
  void saveSettingsFields(['arxivCategories']);
  applyArxivControls();
  loadArxivFeed();
});

if (arxivCategorySelect) {
  arxivCategorySelect.addEventListener('change', () => {
    const selected = Array.from(arxivCategorySelect.selectedOptions).map(option => option.value);
    if (!validateSettingsField(arxivCategorySelect, LaunchPadCore.validateSettingsPatch({ arxivCategories: selected }))) {
      applyArxivControls();
      return;
    }
    arxivCategories = selected;
    arxivCategoryInput.value = arxivCategories.join(', ');
    void saveSettingsFields(['arxivCategories']);
    applyArxivControls();
    loadArxivFeed();
  });
}

if (arxivApplyRefreshBtn) {
  arxivApplyRefreshBtn.addEventListener('click', () => {
    const value = Number(arxivRefreshInput.value || 0);
    if (!validateSettingsField(arxivRefreshInput, LaunchPadCore.validateSettingsPatch({ arxivRefreshMinutes: value }))) return;
    arxivRefreshMinutes = value;
    void saveSettingsFields(['arxivRefreshMinutes']);
    applyArxivControls();
  });
}

arxivChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const category = chip.dataset.category;
    if (!category) return;
    const categories = arxivCategories.includes(category)
      ? arxivCategories.filter(value => value !== category) : [...arxivCategories, category];
    if (!validateSettingsField(arxivCategoryInput, LaunchPadCore.validateSettingsPatch({ arxivCategories: categories }))) return;
    arxivCategories = categories;
    arxivCategoryInput.value = arxivCategories.join(', ');
    if (arxivCategorySelect) {
      Array.from(arxivCategorySelect.options).forEach(option => {
        option.selected = arxivCategories.includes(option.value);
      });
    }
    void saveSettingsFields(['arxivCategories']);
    applyArxivControls();
    loadArxivFeed();
  });
});

if (arxivFilterInput) {
  let filterSaveTimer = null;
  arxivFilterInput.addEventListener('input', () => {
    arxivFilter = arxivFilterInput.value;
    updateArxivResearchContext();
    renderArxivItems();
    clearTimeout(filterSaveTimer);
    filterSaveTimer = setTimeout(() => void saveSettingsFields(['arxivFilter', 'arxivFilterMode']), 300);
  });
}

if (arxivFilterMode) {
  arxivFilterMode.addEventListener('change', () => {
    arxivFilterModeValue = arxivFilterMode.value === 'all' ? 'all' : 'any';
    updateArxivResearchContext();
    void saveSettingsFields(['arxivFilter', 'arxivFilterMode']);
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
    updateArxivResearchContext();
    void saveSettingsFields(['arxivFilter', 'arxivFilterMode']);
    renderArxivItems();
  });
}

if (arxivFilterHelpBtn && arxivFilterHelp) {
  arxivFilterHelpBtn.addEventListener('click', () => {
    arxivFilterHelp.classList.toggle('hidden');
  });
}

if (arxivResearchTracks) {
  arxivResearchTracks.addEventListener('click', (event) => {
    const button = event.target.closest('.research-track');
    if (!button) return;
    applyArxivResearchPreset(button.dataset.trackId);
  });

  arxivResearchTracks.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const buttons = Array.from(arxivResearchTracks.querySelectorAll('.research-track'));
    const currentIndex = buttons.indexOf(event.target.closest('.research-track'));
    if (currentIndex < 0 || buttons.length === 0) return;
    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = buttons.length - 1;
    }
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  });
}

if (arxivQuickFilters) {
  arxivQuickFilters.addEventListener('click', (e) => {
    const remove = e.target.closest('.filter-chip-remove');
    if (remove) {
      const index = parseInt(remove.dataset.filterIndex, 10);
      const defaultCount = defaultArxivFilters.length;
      const customIndex = index - defaultCount;
      if (Number.isFinite(customIndex) && customIndex >= 0) {
        arxivSavedFilters.splice(customIndex, 1);
        void saveSettingsFields(['arxivSavedFilters']);
        renderArxivQuickFilters();
      }
      return;
    }

    const button = e.target.closest('.filter-chip');
    if (!button) return;
    const index = parseInt(button.dataset.filterIndex, 10);
    const filter = getAllArxivFilters()[index];
    if (!filter) return;
    applyArxivFilterPreset(filter);
  });
}

if (arxivSaveFilterBtn) {
  arxivSaveFilterBtn.addEventListener('click', saveCurrentArxivFilter);
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
    const categories = allIncluded
      ? arxivCategories.filter(category => !groupCategories.includes(category))
      : [...new Set([...arxivCategories, ...groupCategories])];
    if (!validateSettingsField(arxivCategoryInput, LaunchPadCore.validateSettingsPatch({ arxivCategories: categories }))) return;
    arxivCategories = categories;
    arxivCategoryInput.value = arxivCategories.join(', ');
    if (arxivCategorySelect) {
      Array.from(arxivCategorySelect.options).forEach(option => {
        option.selected = arxivCategories.includes(option.value);
      });
    }
    void saveSettingsFields(['arxivCategories']);
    applyArxivControls();
    loadArxivFeed();
  });
}

if (addArxivGroupBtn) {
  addArxivGroupBtn.addEventListener('click', async () => {
    if (addArxivGroupBtn.disabled) return;
    const name = arxivGroupNameInput.value.trim();
    const categories = [...new Set(arxivGroupCategoriesInput.value.split(',').map(value => value.trim()).filter(Boolean))];
    if (!validateSettingsField(arxivGroupNameInput, !name ? 'Enter a group name.' : name.length > 80 ? 'Use a group name up to 80 characters.' : '')) return;
    if (!validateSettingsField(arxivGroupCategoriesInput, LaunchPadCore.validateSettingsPatch({ arxivCategories: categories }))) return;
    const previous = [...arxivCustomGroups];
    if (editingGroupIndex !== null) arxivCustomGroups[editingGroupIndex] = { name, categories };
    else arxivCustomGroups.push({ name, categories });
    addArxivGroupBtn.disabled = true;
    const result = await saveSettingsFields(['arxivCustomGroups'], true);
    addArxivGroupBtn.disabled = false;
    if (!result.localOk) { arxivCustomGroups = previous; return; }
    arxivGroupNameInput.value = '';
    arxivGroupCategoriesInput.value = '';
    editingGroupIndex = null;
    addArxivGroupBtn.textContent = 'Add';
    cancelArxivGroupBtn?.classList.add('hidden');
    renderArxivGroups();
  });
}

if (arxivCustomGroupList) {
  arxivCustomGroupList.addEventListener('click', async (e) => {
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
    const previous = [...arxivCustomGroups];
    arxivCustomGroups.splice(index, 1);
    arxivCustomGroupList.inert = true;
    const result = await saveSettingsFields(['arxivCustomGroups'], true);
    arxivCustomGroupList.inert = false;
    if (!result.localOk) { arxivCustomGroups = previous; return; }
    if (editingGroupIndex === index) cancelArxivGroupBtn.click();
    else if (editingGroupIndex > index) editingGroupIndex -= 1;
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

  arxivCustomGroupList.addEventListener('drop', async (e) => {
    if (groupDragIndex === null) return;
    const row = e.target.closest('[data-index]');
    if (!row) return;
    e.preventDefault();
    const targetIndex = parseInt(row.dataset.index, 10);
    if (!Number.isFinite(targetIndex)) return;
    const previous = [...arxivCustomGroups];
    const editing = editingGroupIndex === null ? null : arxivCustomGroups[editingGroupIndex];
    reorder(arxivCustomGroups, groupDragIndex, targetIndex);
    groupDragIndex = null;
    arxivCustomGroupList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    arxivCustomGroupList.inert = true;
    const result = await saveSettingsFields(['arxivCustomGroups']);
    arxivCustomGroupList.inert = false;
    if (!result.localOk) arxivCustomGroups = previous;
    if (editing) editingGroupIndex = arxivCustomGroups.indexOf(editing);
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

function validateSettingsLink(nameInput, urlInput) {
  const result = LaunchPadCore.validateShortcut(nameInput.value, urlInput.value);
  nameInput.setCustomValidity(result.errors.name);
  urlInput.setCustomValidity(result.errors.url);
  nameInput.setAttribute('aria-invalid', result.errors.name ? 'true' : 'false');
  urlInput.setAttribute('aria-invalid', result.errors.url ? 'true' : 'false');
  if (!result.ok) (result.errors.name ? nameInput : urlInput).reportValidity();
  return result;
}

for (const input of [appNameInput, appUrlInput, accountNameInput, accountUrlInput]) {
  input.addEventListener('input', () => { input.setCustomValidity(''); input.setAttribute('aria-invalid', 'false'); });
}

async function addSettingsLink(kind) {
  const app = kind === 'app';
  const button = app ? addAppBtn : addAccountBtn;
  if (button.disabled) return;
  const nameInput = app ? appNameInput : accountNameInput;
  const urlInput = app ? appUrlInput : accountUrlInput;
  const candidate = validateSettingsLink(nameInput, urlInput);
  if (!candidate.ok) return;
  const previous = [...(app ? appLinks : accountLinks)];
  const entry = { name: candidate.name, url: candidate.url };
  if (app) appLinks.push(entry); else accountLinks.push(entry);
  button.disabled = true;
  const result = await saveSettingsFields([app ? 'appLinks' : 'accountLinks'], true);
  button.disabled = false;
  if (!result.localOk) {
    if (app) appLinks = previous; else accountLinks = previous;
    return;
  }
  nameInput.value = '';
  urlInput.value = '';
  renderMenus();
  renderSettingsPanel();
}
addAppBtn.addEventListener('click', () => addSettingsLink('app'));
addAccountBtn.addEventListener('click', () => addSettingsLink('account'));

async function handleSettingsRemove(e) {
  const btn = e.target.closest('button[data-index]');
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  const previous = { appLinks: [...appLinks], accountLinks: [...accountLinks] };
  btn.disabled = true;
  if (btn.dataset.type === 'app') {
    appLinks.splice(index, 1);
  } else if (btn.dataset.type === 'account') {
    accountLinks.splice(index, 1);
  }
  const result = await saveSettingsFields([btn.dataset.type === 'app' ? 'appLinks' : 'accountLinks'], true);
  if (!result.localOk) {
    if (btn.dataset.type === 'app') appLinks = previous.appLinks;
    else accountLinks = previous.accountLinks;
  }
  renderMenus();
  renderSettingsPanel();
}

appsList.addEventListener('click', handleSettingsRemove);
accountList.addEventListener('click', handleSettingsRemove);

document.addEventListener('click', (e) => {
  const inApps = appsMenu.contains(e.target) || appsBtn.contains(e.target);
  const inAccount = accountMenu.contains(e.target) || avatarBtn.contains(e.target);
  if (!inApps) setDisclosureOpen(appsBtn, appsMenu, false);
  if (!inAccount) setDisclosureOpen(avatarBtn, accountMenu, false);
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

googleSearchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  navigateFromGoogleSearch();
});

voiceSearchBtn?.addEventListener('click', startVoiceSearch);

function setPanelOpen(panelName, open) {
  if (!layout) return;
  const className = panelName === 'arxiv' ? 'show-arxiv' : 'show-favorites';
  const toggle = panelName === 'arxiv' ? arxivToggle : favoriteToggle;
  const panel = panelName === 'arxiv' ? arxivPanel : favoritePanel;
  layout.classList.toggle(className, open);
  panelVisibility[panelName] = open;
  if (toggle) {
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (panel) {
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
}

function togglePanel(panelName) {
  if (!layout) return;
  const className = panelName === 'arxiv' ? 'show-arxiv' : 'show-favorites';
  const open = !layout.classList.contains(className);
  setPanelOpen(panelName, open);
  void settingsWriter.save({ panelVisibility }).then(result => {
    if (!result.localOk) {
      shortcutStatus.textContent = 'Panel preference could not be saved. Try again.';
      shortcutStatus.classList.add('error');
    }
  });
  if (open && matchMedia('(max-width: 1360px)').matches) {
    const panel = panelName === 'arxiv' ? arxivPanel : favoritePanel;
    panel.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

if (arxivToggle) {
  arxivToggle.addEventListener('click', () => togglePanel('arxiv'));
}

if (favoriteToggle) {
  favoriteToggle.addEventListener('click', () => togglePanel('favorites'));
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl+K → focus search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (!addForm.classList.contains('hidden') || !settingsPanel.classList.contains('hidden')) return;
    searchInput.focus();
    searchInput.select();
    return;
  }
  // Esc → close modals / exit edit mode
  if (e.key === 'Escape') {
    if (voiceRecognition) {
      voiceRecognition.abort();
      voiceRecognition = null;
      setVoiceSearchState(false, 'Voice search cancelled.');
      searchInput.focus();
      return;
    }
    if (!settingsPanel.classList.contains('hidden')) {
      closeSettingsPanel();
      return;
    }
    if (!addForm.classList.contains('hidden')) {
      if (!saveBtn.disabled) resetAddForm();
      return;
    }
    if (!contextMenu.classList.contains('hidden')) {
      closeContextMenu(true);
      return;
    }
    if (!appsMenu.classList.contains('hidden')) {
      setDisclosureOpen(appsBtn, appsMenu, false);
      return;
    }
    if (!accountMenu.classList.contains('hidden')) {
      setDisclosureOpen(avatarBtn, accountMenu, false);
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

function applyPendingExternalSites() {
  if (!pendingExternalSites || isEditMode || !addForm.classList.contains('hidden')) return;
  sites = pendingExternalSites;
  pendingExternalSites = null;
  settingsWriter.accept({ sites });
  render();
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !settingsWriter) return;
  if (changes.sites && Array.isArray(changes.sites.newValue) && !LaunchPadCore.settingsEqual(changes.sites.newValue, sites)) {
    pendingExternalSites = changes.sites.newValue;
    applyPendingExternalSites();
  }
  if (changes.themeMode && ['auto', 'light', 'dark'].includes(changes.themeMode.newValue)) {
    themeMode = changes.themeMode.newValue;
    settingsWriter.accept({ themeMode });
    applyTheme();
    updateThemeSwitcher();
  }
});

document.getElementById('saveScourBtn').addEventListener('click', async () => {
  const input = document.getElementById('scourUrlInput');
  const value = input.value.trim();
  const normalized = LaunchPadCore.normalizeScourProfile(value);
  const error = document.getElementById('scourUrlError');
  if (value && !normalized) {
    input.setAttribute('aria-invalid', 'true');
    error.textContent = 'Enter an HTTPS Scour profile URL, such as https://scour.ing/@name.';
    input.focus();
    return;
  }
  input.setAttribute('aria-invalid', 'false');
  error.textContent = '';
  const result = await settingsWriter.save({ scourUrl: normalized });
  flashSettingsSaved(result);
  if (!result.localOk) return;
  scourUrl = normalized;
  input.value = scourUrl;
  scourPreviewCache.clear();
  loadScourFeed();
});

init();
