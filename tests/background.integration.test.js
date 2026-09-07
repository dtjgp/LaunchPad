const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const LaunchPadCore = require('../core.js');
const backgroundSource = fs.readFileSync(
  path.join(__dirname, '..', 'background.js'),
  'utf8'
);

function loadBackground(fetchImpl, previewAllowed = true) {
  let listener;
  const sandbox = {
    AbortController,
    LaunchPadCore,
    TextEncoder,
    TextDecoder,
    URL,
    clearTimeout,
    fetch: fetchImpl,
    importScripts() {},
    setTimeout,
    chrome: {
      permissions: { contains: async () => previewAllowed },
      runtime: {
        id: 'launchpad-test-extension',
        onMessage: {
          addListener(callback) {
            listener = callback;
          }
        }
      }
    }
  };

  vm.runInNewContext(backgroundSource, sandbox, { filename: 'background.js' });
  return listener;
}

function sendMessage(listener, message) {
  return new Promise(resolve => {
    const asyncResponse = listener(
      message,
      { id: 'launchpad-test-extension' },
      resolve
    );
    assert.equal(asyncResponse, true);
  });
}

test('background rejects a fetch type/host mismatch before network access', async () => {
  let fetched = false;
  const listener = loadBackground(async () => {
    fetched = true;
    throw new Error('must not fetch');
  });

  const response = await sendMessage(listener, {
    type: 'fetchArxiv',
    url: 'https://example.com/private'
  });

  assert.equal(fetched, false);
  assert.equal(response.ok, false);
  assert.match(response.error, /not allowed/);
});

test('background returns a validated response body', async () => {
  const listener = loadBackground(async url => ({
    ok: true,
    status: 200,
    headers: { get: () => '5' },
    text: async () => `from:${url}`
  }));

  const response = await sendMessage(listener, {
    type: 'fetchArxiv',
    url: 'https://export.arxiv.org/rss/cs.AI'
  });

  assert.equal(response.ok, true);
  assert.equal(response.text, 'from:https://export.arxiv.org/rss/cs.AI');
});

test('background accepts only the Academic Trend API route', async () => {
  const requested = [];
  const listener = loadBackground(async url => {
    requested.push(url);
    return {
      ok: true,
      status: 200,
      headers: { get: () => '2' },
      text: async () => '{}'
    };
  });

  const allowed = await sendMessage(listener, {
    type: 'fetchAcademicTrend',
    url: 'https://api.ossinsight.io/v1/trends/repos/?period=past_week&language=All'
  });
  const blocked = await sendMessage(listener, {
    type: 'fetchAcademicTrend',
    url: 'https://api.ossinsight.io/v1/repos/pingcap/tidb'
  });

  assert.equal(allowed.ok, true);
  assert.equal(blocked.ok, false);
  assert.equal(requested.length, 1);
});

test('background blocks oversized responses', async () => {
  const listener = loadBackground(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => String(2 * 1024 * 1024 + 1) },
    text: async () => 'unused'
  }));

  const response = await sendMessage(listener, {
    type: 'fetchPreview',
    url: 'https://example.com/article'
  });

  assert.equal(response.ok, false);
  assert.match(response.error, /too large/);
});

test('background requires preview permission before requesting any bytes', async () => {
  let fetched = false;
  const listener = loadBackground(async () => { fetched = true; }, false);
  const response = await sendMessage(listener, { type: 'fetchPreview', url: 'https://example.com/article' });
  assert.equal(response.ok, false);
  assert.match(response.error, /permission/);
  assert.equal(fetched, false);
});

test('preview fetch omits credentials and rejects automatic redirects', async () => {
  let options;
  const listener = loadBackground(async (_, value) => {
    options = value;
    return { ok: true, url: 'https://example.com/article', headers: { get: () => null }, text: async () => 'hello' };
  });
  const response = await sendMessage(listener, { type: 'fetchPreview', url: 'https://example.com/article' });
  assert.equal(response.ok, true);
  assert.equal(options.redirect, 'error');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.referrerPolicy, 'no-referrer');
});

test('streamed bodies are stopped at the byte limit even without Content-Length', async () => {
  let cancelled = false;
  let released = false;
  const listener = loadBackground(async () => ({
    ok: true, headers: { get: () => null },
    body: { getReader: () => ({
      read: async () => ({ done: false, value: new Uint8Array(2 * 1024 * 1024 + 1) }),
      cancel: async () => { cancelled = true; }, releaseLock: () => { released = true; }
    }) }
  }));
  const response = await sendMessage(listener, { type: 'fetchArxiv', url: 'https://export.arxiv.org/rss/cs.AI' });
  assert.equal(response.ok, false);
  assert.equal(cancelled, true);
  assert.equal(released, true);
});
