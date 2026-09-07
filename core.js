(function exposeLaunchPadCore(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.LaunchPadCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createLaunchPadCore() {
  const FETCH_RULES = {
    fetchArxiv(url) {
      return url.hostname === 'export.arxiv.org' && url.pathname.startsWith('/rss/');
    },
    fetchScour(url) {
      return url.hostname === 'scour.ing' || url.hostname === 'www.scour.ing';
    },
    fetchAcademicTrend(url) {
      if (url.hostname !== 'api.ossinsight.io' || url.pathname !== '/v1/trends/repos/') {
        return false;
      }
      const allowedPeriods = new Set(['past_24_hours', 'past_week', 'past_month']);
      return allowedPeriods.has(url.searchParams.get('period')) &&
        url.searchParams.get('language') === 'All' &&
        Array.from(url.searchParams.keys()).every(key => ['period', 'language'].includes(key));
    },
    fetchGithubSearch(url) {
      if (url.hostname !== 'api.github.com' || url.pathname !== '/search/repositories') {
        return false;
      }
      const query = url.searchParams.get('q') || '';
      const perPage = Number(url.searchParams.get('per_page') || '0');
      return query.length > 0 && query.length <= 512 &&
        query.includes('archived:false') &&
        query.includes('fork:false') &&
        Number.isInteger(perPage) && perPage >= 1 && perPage <= 10 &&
        Array.from(url.searchParams.keys()).every(key =>
          ['q', 'sort', 'order', 'per_page'].includes(key)
        );
    },
    fetchPreview() {
      return true;
    }
  };

  function normalizeHttpUrl(value, baseUrl = '') {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return '';

    try {
      const hostWithPort = /^(?:localhost|[\p{L}\p{N}.-]+\.[\p{L}\p{N}-]+|\[[\da-f:]+\]):\d{1,5}(?:[/?#]|$)/iu.test(trimmed);
      const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) && !hostWithPort;
      const localHost = /^(?:localhost|(?:\d{1,3}\.){3}\d{1,3}|\[[\da-f:]+\])(?::|[/?#]|$)/i.test(trimmed);
      const candidate = hasScheme
        ? new URL(trimmed)
        : baseUrl
          ? new URL(trimmed, baseUrl)
          : new URL(`${localHost ? 'http' : 'https'}://${trimmed}`);
      if (!['http:', 'https:'].includes(candidate.protocol)) return '';
      if (candidate.username || candidate.password) return '';
      return candidate.href;
    } catch {
      return '';
    }
  }

  function resolveGoogleSearchTarget(value) {
    const query = typeof value === 'string' ? value.trim() : '';
    if (!query) return '';
    if (getSearchInputError(query)) return '';

    const googleSearchUrl = () =>
      `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    if (/^https?:\/\//i.test(query)) {
      return normalizeHttpUrl(query) || googleSearchUrl();
    }

    if (/\s/.test(query)) {
      return googleSearchUrl();
    }

    const localTarget = /^(?:localhost|(?:\d{1,3}\.){3}\d{1,3}|\[[0-9a-f:]+\])(?::\d{1,5})?(?:[/?#].*)?$/i;
    if (localTarget.test(query)) {
      return normalizeHttpUrl(`http://${query}`) || googleSearchUrl();
    }

    const domainTarget = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+(?:[\p{L}]{2,63}|xn--[a-z\d-]{2,59})(?::\d{1,5})?(?:[/?#].*)?$/iu;
    if (domainTarget.test(query)) {
      return normalizeHttpUrl(`https://${query}`) || googleSearchUrl();
    }

    return googleSearchUrl();
  }

  function getSearchInputError(value) {
    const input = typeof value === 'string' ? value.trim() : '';
    const explicitUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(input);
    const credentialAuthority = /^[^\s/:@]+:[^\s/@]+@[^\s/]+(?:\/.*)?$/.test(input);
    if (!explicitUrl && !credentialAuthority) return '';
    try {
      const url = new URL(explicitUrl ? input : `https://${input}`);
      if (url.username || url.password) return 'Remove the username or password from this URL before opening it. It has not been sent to Google.';
    } catch { /* Non-URL input remains an ordinary search query. */ }
    return '';
  }

  function resolveAvatarUrl(customValue, fallbackValue = '') {
    const normalizeAvatar = value => {
      const normalized = normalizeHttpUrl(value);
      return normalized && new URL(normalized).protocol === 'https:' ? normalized : '';
    };

    return normalizeAvatar(customValue) || normalizeAvatar(fallbackValue);
  }

  function validateShortcut(nameValue, urlValue) {
    const name = typeof nameValue === 'string' ? nameValue.trim() : '';
    const inputUrl = typeof urlValue === 'string' ? urlValue.trim() : '';
    const url = normalizeHttpUrl(inputUrl);
    const errors = {
      name: !name ? 'Enter a name.' : name.length > 120 ? 'Use a name up to 120 characters.' : '',
      url: !inputUrl ? 'Enter a URL.' : inputUrl.length > 2048 ? 'Use a URL up to 2048 characters.' : !url ? 'Enter a valid HTTP(S) URL.' : ''
    };
    return { ok: !errors.name && !errors.url, name, url, errors };
  }

  function validateFetchTarget(type, value) {
    const rule = FETCH_RULES[type];
    if (!rule || typeof value !== 'string') {
      return { ok: false, error: 'Unsupported request type' };
    }

    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) {
        return { ok: false, error: 'Only credential-free HTTPS URLs are allowed' };
      }
      if (url.port || (type === 'fetchPreview' && (
        url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
        url.hostname.endsWith('.local') || /^[\d.]+$/.test(url.hostname) || url.hostname.startsWith('[')
      ))) return { ok: false, error: 'Previews require a public HTTPS hostname on the standard port' };
      if (!rule(url)) {
        return { ok: false, error: 'URL is not allowed for this request type' };
      }
      return { ok: true, url: url.href };
    } catch {
      return { ok: false, error: 'Invalid URL' };
    }
  }

  function summarizeSettledResults(results) {
    const settled = Array.isArray(results) ? results : [];
    const fulfilledResults = settled.filter(result => result?.status === 'fulfilled');
    const rejected = settled.length - fulfilledResults.length;
    const items = fulfilledResults.flatMap(result => Array.isArray(result.value) ? result.value : []);

    let kind = 'complete';
    if (fulfilledResults.length === 0) {
      kind = 'failed';
    } else if (rejected > 0) {
      kind = 'partial';
    } else if (items.length === 0) {
      kind = 'empty';
    }

    return {
      kind,
      items,
      total: settled.length,
      fulfilled: fulfilledResults.length,
      rejected
    };
  }

  const SETTING_KEYS = [
    'sites', 'appLinks', 'accountLinks', 'avatarUrl', 'scourUrl', 'arxivCategory',
    'arxivCategories', 'arxivRefreshMinutes', 'arxivCustomGroups', 'arxivFilter',
    'arxivFilterMode', 'arxivSavedFilters', 'themeMode', 'panelVisibility'
  ];
  const STORAGE_KEYS = [...SETTING_KEYS, 'settingsUpdatedAt', 'settingsFieldUpdatedAt'];
  const clone = value => JSON.parse(JSON.stringify(value));

  function settingsEqual(left, right) {
    const ordered = value => Array.isArray(value) ? value.map(ordered)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).filter(key => value[key] !== undefined).sort().map(key => [key, ordered(value[key])]))
        : value;
    return JSON.stringify(ordered(left)) === JSON.stringify(ordered(right));
  }

  function selectNewestStorage(local = {}, sync = {}) {
    local ||= {};
    sync ||= {};
    const time = value => Number.isFinite(value) ? value : 0;
    const localTimestamp = time(local.settingsUpdatedAt);
    const syncTimestamp = time(sync.settingsUpdatedAt);
    const primaryName = syncTimestamp > localTimestamp ? 'sync' : 'local';
    const primary = {};
    const versions = {};
    for (const key of SETTING_KEYS) {
      const localTime = time(local.settingsFieldUpdatedAt?.[key] ?? localTimestamp);
      const syncTime = time(sync.settingsFieldUpdatedAt?.[key] ?? syncTimestamp);
      const source = local[key] === undefined ? sync : sync[key] === undefined ? local
        : syncTime > localTime ? sync : local;
      if (source[key] !== undefined) {
        primary[key] = source[key];
        versions[key] = source === local ? localTime : syncTime;
      }
    }
    primary.settingsUpdatedAt = Math.max(localTimestamp, syncTimestamp);
    primary.settingsFieldUpdatedAt = versions;
    return { primaryName, primary, secondary: primaryName === 'local' ? sync : local };
  }

  function validateSettingsPatch(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Invalid settings.';
    for (const [key, value] of Object.entries(payload)) {
      if (!SETTING_KEYS.includes(key)) return 'Unsupported setting.';
      if (['sites', 'appLinks', 'accountLinks'].includes(key)) {
        if (!Array.isArray(value) || value.length > 500 || value.some(item =>
          !item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120 ||
          typeof item.url !== 'string' || item.url.length > 2048 || !normalizeHttpUrl(item.url))) {
          return 'Use up to 500 links with a name (120 characters) and a valid URL (2048 characters).';
        }
      } else if (key === 'themeMode' && !['auto', 'light', 'dark'].includes(value)) return 'Choose a valid theme.';
      else if (key === 'arxivFilterMode' && !['any', 'all'].includes(value)) return 'Choose OR or AND.';
      else if (key === 'avatarUrl' && (typeof value !== 'string' || value.length > 2048 || (value && !resolveAvatarUrl(value)))) return 'Use an HTTPS avatar URL.';
      else if (key === 'scourUrl' && (typeof value !== 'string' || (value && !normalizeScourProfile(value)))) return 'Use a Scour profile URL.';
      else if (key === 'arxivRefreshMinutes' && (!Number.isInteger(value) || value < 0 || value > 1440)) return 'Use a whole refresh interval from 0 to 1440 minutes.';
      else if (key === 'arxivCategories' && (!Array.isArray(value) || !value.length || value.length > 12 || value.some(category => !/^[a-z-]+(?:\.[a-z-]+)?$/i.test(category)))) return 'Choose 1 to 12 valid arXiv categories.';
      else if (key === 'arxivCategory' && (typeof value !== 'string' || !/^[a-z-]+(?:\.[a-z-]+)?$/i.test(value))) return 'Use a valid arXiv category.';
      else if (key === 'arxivFilter' && (typeof value !== 'string' || value.length > 4096)) return 'Use a filter up to 4096 characters.';
      else if (key === 'arxivSavedFilters' && (!Array.isArray(value) || value.length > 12 || value.some(item => !item || typeof item.label !== 'string' || !item.label.trim() || item.label.length > 32 || typeof item.query !== 'string' || !item.query.trim() || item.query.length > 4096 || !['any', 'all'].includes(item.mode)))) return 'Use up to 12 valid saved filters.';
      else if (key === 'arxivCustomGroups' && (!Array.isArray(value) || value.length > 32 || value.some(item => !item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || validateSettingsPatch({ arxivCategories: item.categories })))) return 'Use up to 32 named groups with valid categories.';
      else if (key === 'panelVisibility' && (!value || Array.isArray(value) || typeof value.arxiv !== 'boolean' || typeof value.favorites !== 'boolean')) return 'Invalid panel visibility.';
    }
    return '';
  }

  function normalizeScourProfile(value) {
    const url = normalizeHttpUrl(value);
    if (!url) return '';
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.port || !['scour.ing', 'www.scour.ing'].includes(parsed.hostname) ||
      !/^\/@[a-z\d_.-]{1,80}\/?$/i.test(parsed.pathname) || parsed.search || parsed.hash) return '';
    parsed.hostname = 'scour.ing';
    parsed.pathname = parsed.pathname.replace(/\/$/, '');
    return parsed.href;
  }

  function sanitizeStoredSettings(record = {}) {
    const value = {};
    const invalid = [];
    for (const key of SETTING_KEYS) {
      if (record?.[key] === undefined) continue;
      if (['sites', 'appLinks', 'accountLinks'].includes(key) && Array.isArray(record[key])) {
        // Retain structurally valid legacy entries, even if they exceed newer input
        // limits. An upgrade must not replace a user's real links with defaults.
        const entries = record[key].filter(item => item && typeof item.name === 'string' && item.name.trim() &&
          typeof item.url === 'string' && normalizeHttpUrl(item.url));
        if (entries.length !== record[key].length) invalid.push(key);
        if (entries.length || record[key].length === 0) value[key] = entries;
        continue;
      }
      if (validateSettingsPatch({ [key]: record[key] })) invalid.push(key);
      else value[key] = record[key];
    }
    for (const key of ['settingsUpdatedAt', 'settingsFieldUpdatedAt']) {
      if (record?.[key] !== undefined) value[key] = record[key];
    }
    return { value, invalid };
  }

  async function saveSettings(storage, payload, timestamp = Date.now(), options = {}) {
    const invalid = validateSettingsPatch(payload);
    const failure = (message, code = 'storage') => ({ ok: false, localOk: false, syncOk: null,
      timestamp, value: {}, localError: message, syncError: '', code });
    if (invalid) return failure(invalid, 'validation');
    if (!storage?.local?.set) return failure('Local storage is unavailable');
    const patch = clone(payload);
    const write = async () => {
      let local = {};
      let sync = {};
      try {
        if (storage.local.get) local = await storage.local.get(STORAGE_KEYS);
        if (storage.sync?.get) sync = await storage.sync.get(STORAGE_KEYS).catch(() => ({}));
        const { primary } = selectNewestStorage(local, sync);
        const keys = Object.keys(patch);
        for (const key of keys) {
          if (options.expected && key in options.expected && primary[key] !== undefined &&
            !settingsEqual(primary[key], options.expected[key])) {
            return failure('This setting changed in another window. Reload this page before saving again.', 'conflict');
          }
        }
        const nextTimestamp = Math.max(timestamp, primary.settingsUpdatedAt + 1);
        const versions = { ...primary.settingsFieldUpdatedAt };
        keys.forEach(key => { versions[key] = nextTimestamp; });
        const value = { ...primary, ...patch, settingsUpdatedAt: nextTimestamp, settingsFieldUpdatedAt: versions };
        await storage.local.set(value);
        let syncOk = null;
        let syncError = '';
        if (storage.sync?.set) {
          try { await storage.sync.set(value); syncOk = true; }
          catch (error) { syncOk = false; syncError = String(error.message || error); }
        }
        return { ok: syncOk !== false, localOk: true, syncOk, timestamp: nextTimestamp, value, localError: '', syncError };
      } catch (error) { return failure(String(error.message || error)); }
    };
    // All extension pages share an origin; serialize read/modify/write across tabs and popup.
    return globalThis.navigator?.locks?.request
      ? navigator.locks.request('launchpad-settings', write) : write();
  }

  function createSettingsWriter(storage, initial = {}) {
    let baseline = clone(initial);
    let queue = Promise.resolve();
    return {
      accept(values) { baseline = { ...baseline, ...clone(values) }; },
      save(values) {
        const requested = clone(values);
        const operation = queue.catch(() => {}).then(async () => {
          const patch = Object.fromEntries(Object.entries(requested)
            .filter(([key, value]) => !settingsEqual(value, baseline[key])));
          if (!Object.keys(patch).length) return { ok: true, localOk: true, syncOk: null, value: {}, unchanged: true };
          const result = await saveSettings(storage, patch, Date.now(), { expected: baseline });
          if (result.localOk) baseline = { ...baseline, ...clone(patch) };
          return result;
        });
        queue = operation;
        return operation;
      }
    };
  }

  return {
    normalizeHttpUrl,
    resolveGoogleSearchTarget,
    getSearchInputError,
    resolveAvatarUrl,
    saveSettings,
    selectNewestStorage,
    summarizeSettledResults,
    validateShortcut,
    validateFetchTarget,
    validateSettingsPatch,
    normalizeScourProfile,
    createSettingsWriter,
    settingsEqual,
    sanitizeStoredSettings,
    STORAGE_KEYS
  };
});
