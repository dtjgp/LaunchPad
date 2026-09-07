importScripts('core.js');

const FETCH_TIMEOUT_MS = 15000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

async function readResponseText(response) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new Error('Response is too large');
  }
  if (!response.body?.getReader) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error('Response is too large');
    return text;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('Response is too large');
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally { reader.releaseLock(); }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender is from this extension
  if (sender.id !== chrome.runtime.id) return;

  if (!message) return;

  const validation = LaunchPadCore.validateFetchTarget(message.type, message.url);
  if (!validation.ok) {
    sendResponse({ ok: false, error: validation.error });
    return true;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const headers = message.type === 'fetchGithubSearch'
    ? {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10'
      }
    : { Accept: 'application/json' };

  (async () => {
    try {
      const preview = message.type === 'fetchPreview';
      if (preview && !await chrome.permissions.contains({ origins: [`${new URL(validation.url).origin}/*`] })) {
        throw new Error('Preview permission is required for this site');
      }
      const response = await fetch(validation.url, {
        signal: controller.signal,
        headers,
        referrerPolicy: 'no-referrer',
        credentials: preview ? 'omit' : 'same-origin',
        // Untrusted preview targets cannot redirect into another permission scope.
        // Feed publishers use their normal redirects; validate the final source too.
        redirect: preview ? 'error' : 'follow'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (response.url && !LaunchPadCore.validateFetchTarget(message.type, response.url).ok) {
        throw new Error('The source redirected outside its allowed URL');
      }
      sendResponse({ ok: true, text: await readResponseText(response) });
    } catch (error) {
      sendResponse({ ok: false, error: error.name === 'AbortError' ? 'The source request timed out' : error.message });
    } finally { clearTimeout(timer); }
  })();
  return true;
});
