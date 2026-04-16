// Background service worker
// 可以在这里添加快捷键、通知等功能

// 注意：chrome.action.openPopup() 在某些情况下可能受限
// 如果需要快捷键功能，需要在 manifest.json 中声明 commands 权限

const ALLOWED_TYPES = new Set(['fetchArxiv', 'fetchScour', 'fetchPreview', 'fetchFavorite']);
const FETCH_TIMEOUT_MS = 15000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender is from this extension
  if (sender.id !== chrome.runtime.id) return;

  if (!message || !ALLOWED_TYPES.has(message.type)) return;

  // Validate URL scheme (HTTPS only, except for localhost dev)
  try {
    const url = new URL(message.url);
    if (url.protocol !== 'https:') {
      sendResponse({ ok: false, error: 'Only HTTPS URLs are allowed' });
      return true;
    }
  } catch {
    sendResponse({ ok: false, error: 'Invalid URL' });
    return true;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  fetch(message.url, { signal: controller.signal })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    })
    .then(text => sendResponse({ ok: true, text }))
    .catch(error => sendResponse({ ok: false, error: error.message }))
    .finally(() => clearTimeout(timer));
  return true;
});
