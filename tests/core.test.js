const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeHttpUrl,
  resolveGoogleSearchTarget,
  getSearchInputError,
  resolveAvatarUrl,
  saveSettings,
  selectNewestStorage,
  summarizeSettledResults,
  validateShortcut,
  validateFetchTarget
} = require('../core.js');

test('shortcut validation identifies each missing field and normalizes a web address', () => {
  assert.deepEqual(validateShortcut(' ', '').errors, {
    name: 'Enter a name.', url: 'Enter a URL.'
  });
  assert.equal(validateShortcut('Paper library', '').ok, false);
  const valid = validateShortcut('  Paper library  ', ' example.com/papers ');
  assert.equal(valid.ok, true);
  assert.equal(valid.name, 'Paper library');
  assert.equal(valid.url, 'https://example.com/papers');
  for (const url of ['javascript:alert(1)', 'https://user:secret@example.com', 'https://%']) {
    assert.equal(validateShortcut('Unsafe', url).errors.url, 'Enter a valid HTTP(S) URL.');
  }
});

test('resolveGoogleSearchTarget sends ordinary text only to Google Search', () => {
  assert.equal(
    resolveGoogleSearchTarget('structured pruning edge AI'),
    'https://www.google.com/search?q=structured%20pruning%20edge%20AI'
  );
  assert.equal(
    resolveGoogleSearchTarget('3.14'),
    'https://www.google.com/search?q=3.14'
  );
  assert.equal(resolveGoogleSearchTarget('   '), '');
});

test('resolveGoogleSearchTarget preserves omnibox-like web and local URLs', () => {
  assert.equal(resolveGoogleSearchTarget('example.com/docs'), 'https://example.com/docs');
  assert.equal(resolveGoogleSearchTarget('example.com:8443/docs'), 'https://example.com:8443/docs');
  assert.equal(resolveGoogleSearchTarget('https://example.com/a?q=1'), 'https://example.com/a?q=1');
  assert.equal(resolveGoogleSearchTarget('localhost:3000'), 'http://localhost:3000/');
  assert.equal(resolveGoogleSearchTarget('127.0.0.1:8080/status'), 'http://127.0.0.1:8080/status');
});

test('unsafe schemes stay searchable but credential-bearing URLs never leave the page', () => {
  assert.equal(
    resolveGoogleSearchTarget('javascript:alert(1)'),
    'https://www.google.com/search?q=javascript%3Aalert(1)'
  );
  assert.equal(
    resolveGoogleSearchTarget('https://user:secret@example.com'),
    ''
  );
  assert.match(getSearchInputError('https://user:secret@example.com'), /not been sent to Google/);
  assert.equal(resolveGoogleSearchTarget('ftp://user:secret@example.com'), '');
  assert.equal(resolveGoogleSearchTarget('user:secret@example.com'), '');
});

test('resolveAvatarUrl prefers a custom image and falls back to the Google profile image', () => {
  const googleAvatar = 'https://lh3.googleusercontent.com/a/profile=s200-c';

  assert.equal(
    resolveAvatarUrl('https://example.com/custom.png', googleAvatar),
    'https://example.com/custom.png'
  );
  assert.equal(resolveAvatarUrl('', googleAvatar), googleAvatar);
  assert.equal(resolveAvatarUrl('javascript:alert(1)', googleAvatar), googleAvatar);
  assert.equal(resolveAvatarUrl('', 'http://example.com/avatar.png'), '');
});

test('normalizeHttpUrl accepts web URLs and resolves relative links', () => {
  assert.equal(normalizeHttpUrl('example.com'), 'https://example.com/');
  assert.equal(
    normalizeHttpUrl('/paper/123', 'https://scour.ing/@dtjgp'),
    'https://scour.ing/paper/123'
  );
  assert.equal(normalizeHttpUrl('http://example.com/a'), 'http://example.com/a');
  assert.equal(normalizeHttpUrl('example.com:8443/path'), 'https://example.com:8443/path');
  assert.equal(normalizeHttpUrl('localhost:3000'), 'http://localhost:3000/');
});

test('normalizeHttpUrl rejects unsafe schemes and credential-bearing URLs', () => {
  assert.equal(normalizeHttpUrl(), '');
  assert.equal(normalizeHttpUrl('https://%'), '');
  assert.equal(normalizeHttpUrl('javascript:alert(1)'), '');
  assert.equal(normalizeHttpUrl('data:text/html,test'), '');
  assert.equal(normalizeHttpUrl('chrome-extension://abc/page.html'), '');
  assert.equal(normalizeHttpUrl('https://user:secret@example.com'), '');
});

test('validateFetchTarget binds message types to intended hosts', () => {
  assert.equal(
    validateFetchTarget('fetchArxiv', 'https://export.arxiv.org/rss/cs.AI').ok,
    true
  );
  assert.equal(
    validateFetchTarget('fetchArxiv', 'https://example.com/rss/cs.AI').ok,
    false
  );
  assert.equal(validateFetchTarget('fetchScour', 'https://scour.ing/@dtjgp').ok, true);
  assert.equal(validateFetchTarget('fetchScour', 'https://example.com/feed').ok, false);
  assert.equal(
    validateFetchTarget(
      'fetchAcademicTrend',
      'https://api.ossinsight.io/v1/trends/repos/?period=past_week&language=All'
    ).ok,
    true
  );
  assert.equal(
    validateFetchTarget(
      'fetchGithubSearch',
      'https://api.github.com/search/repositories?q=edge%20ai%20archived:false%20fork:false&sort=stars&order=desc&per_page=8'
    ).ok,
    true
  );
  assert.equal(validateFetchTarget('fetchPreview', 'https://example.com/article').ok, true);
  assert.equal(validateFetchTarget('fetchPreview', 'http://example.com/article').ok, false);
  assert.equal(validateFetchTarget('unknown', 'https://example.com').ok, false);
  assert.equal(validateFetchTarget('fetchPreview', null).ok, false);
  assert.equal(validateFetchTarget('fetchPreview', 'not a URL').error, 'Invalid URL');
  assert.equal(
    validateFetchTarget('fetchPreview', 'https://user:secret@example.com').ok,
    false
  );
  assert.equal(validateFetchTarget('fetchScour', 'https://www.scour.ing/feed').ok, true);
  assert.equal(
    validateFetchTarget(
      'fetchAcademicTrend',
      'https://api.ossinsight.io/v1/repos/pingcap/tidb'
    ).ok,
    false
  );
  assert.equal(
    validateFetchTarget('fetchGithubSearch', 'https://api.github.com/users/octocat').ok,
    false
  );
  assert.equal(
    validateFetchTarget('fetchArxiv', 'https://export.arxiv.org/api/query').ok,
    false
  );
});

test('Academic Trend source policies reject altered periods, queries, and extra parameters', () => {
  const validateAcademic = value => validateFetchTarget('fetchAcademicTrend', value).ok;
  assert.equal(validateAcademic(
    'https://api.ossinsight.io/v1/trends/repos/?period=past_month&language=All'
  ), true);
  assert.equal(validateAcademic(
    'https://api.ossinsight.io/v1/trends/repos/?period=all_time&language=All'
  ), false);
  assert.equal(validateAcademic(
    'https://api.ossinsight.io/v1/trends/repos/?period=past_week&language=Python'
  ), false);
  assert.equal(validateAcademic(
    'https://api.ossinsight.io/v1/trends/repos/?period=past_week&language=All&repo=private'
  ), false);

  const validateGithub = query => validateFetchTarget(
    'fetchGithubSearch',
    `https://api.github.com/search/repositories?${query}`
  ).ok;
  assert.equal(validateGithub('q=&per_page=8'), false);
  assert.equal(validateGithub('q=edge+archived:false+fork:false&per_page=0'), false);
  assert.equal(validateGithub('q=edge+archived:false+fork:false&per_page=11'), false);
  assert.equal(validateGithub('q=edge+archived:false+fork:false&per_page=1.5'), false);
  assert.equal(validateGithub('q=edge+fork:false&per_page=8'), false);
  assert.equal(validateGithub('q=edge+archived:false+fork:false&per_page=8&page=2'), false);
  assert.equal(validateGithub(`q=${'x'.repeat(513)}+archived:false+fork:false&per_page=8`), false);
});

test('summarizeSettledResults distinguishes complete, partial, empty, and failed coverage', () => {
  const complete = summarizeSettledResults([
    { status: 'fulfilled', value: [{ link: 'a' }] },
    { status: 'fulfilled', value: [{ link: 'b' }] }
  ]);
  assert.deepEqual(
    { kind: complete.kind, fulfilled: complete.fulfilled, rejected: complete.rejected },
    { kind: 'complete', fulfilled: 2, rejected: 0 }
  );
  assert.equal(complete.items.length, 2);

  const partial = summarizeSettledResults([
    { status: 'fulfilled', value: [{ link: 'a' }] },
    { status: 'rejected', reason: new Error('network') }
  ]);
  assert.equal(partial.kind, 'partial');
  assert.equal(partial.items.length, 1);

  const empty = summarizeSettledResults([
    { status: 'fulfilled', value: [] },
    { status: 'fulfilled', value: [] }
  ]);
  assert.equal(empty.kind, 'empty');

  const failed = summarizeSettledResults([
    { status: 'rejected', reason: new Error('network') },
    { status: 'rejected', reason: new Error('timeout') }
  ]);
  assert.equal(failed.kind, 'failed');
  assert.equal(summarizeSettledResults(null).kind, 'failed');
  assert.deepEqual(
    summarizeSettledResults([{ status: 'fulfilled', value: null }]).items,
    []
  );
});

test('selectNewestStorage prefers the newest timestamp and local on ties', () => {
  const newerSync = selectNewestStorage(
    { settingsUpdatedAt: 10, sites: ['local'] },
    { settingsUpdatedAt: 20, sites: ['sync'] }
  );
  assert.equal(newerSync.primaryName, 'sync');
  assert.deepEqual(newerSync.primary.sites, ['sync']);

  const tie = selectNewestStorage(
    { settingsUpdatedAt: 20, sites: ['local'] },
    { settingsUpdatedAt: 20, sites: ['sync'] }
  );
  assert.equal(tie.primaryName, 'local');

  const empty = selectNewestStorage(null, { settingsUpdatedAt: 'invalid', sites: ['sync'] });
  assert.equal(empty.primaryName, 'local');
  assert.deepEqual(empty.primary.sites, ['sync']);
});

test('saveSettings waits for local and sync writes and reports partial failure', async () => {
  const calls = [];
  const storage = {
    local: {
      set: async payload => calls.push(['local', payload])
    },
    sync: {
      set: async payload => {
        calls.push(['sync', payload]);
        throw new Error('sync quota exceeded');
      }
    }
  };

  const result = await saveSettings(storage, { sites: [{ name: 'Test', url: 'https://example.org/' }] }, 1234);

  assert.equal(result.localOk, true);
  assert.equal(result.syncOk, false);
  assert.equal(result.ok, false);
  assert.equal(result.timestamp, 1234);
  assert.equal(calls.length, 2);
  assert.equal(calls[0][1].settingsUpdatedAt, 1234);
  assert.equal(calls[1][1].settingsUpdatedAt, 1234);
});

test('saveSettings supports local-only storage and reports missing local storage', async () => {
  const localOnly = await saveSettings(
    { local: { set: async () => {} } },
    { themeMode: 'dark' },
    10
  );
  assert.equal(localOnly.ok, true);
  assert.equal(localOnly.syncOk, null);

  const missingLocal = await saveSettings({}, { themeMode: 'dark' }, 11);
  assert.equal(missingLocal.ok, false);
  assert.equal(missingLocal.localOk, false);
  assert.match(missingLocal.localError, /unavailable/);

  const complete = await saveSettings({
    local: { set: async () => {} },
    sync: { set: async () => {} }
  }, { themeMode: 'light' }, 12);
  assert.equal(complete.ok, true);
  assert.equal(complete.localError, '');
  assert.equal(complete.syncError, '');
});
