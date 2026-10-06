// Shared utilities used by both popup.js and newtab.js

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeColor(color) {
  return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#e8eaed';
}

// Shared presentation roles and brand assets; no account data is read here.
function applyLaunchPadTheme(mode) {
  document.documentElement.classList.toggle('theme-light', mode === 'light');
  document.documentElement.classList.toggle('theme-dark', mode === 'dark');
}

const GOOGLE_SITE_ICONS = {
  'mail.google.com': 'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png',
  'docs.google.com': 'https://www.gstatic.com/images/branding/product/1x/docs_2020q4_32dp.png',
  'drive.google.com': 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
  'calendar.google.com': 'https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_32dp.png'
};

// Site icons come from Chrome's local favicon cache ("favicon" permission), as on
// Chrome's own new tab page: no network request, so hostnames stay on this device.
// Pages Chrome has no icon for get Chrome's default icon.
function getSiteIconUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    if (GOOGLE_SITE_ICONS[hostname]) return GOOGLE_SITE_ICONS[hostname];
    if (!globalThis.chrome?.runtime?.getURL) return '';
    const icon = new URL(chrome.runtime.getURL('/_favicon/'));
    icon.searchParams.set('pageUrl', url);
    icon.searchParams.set('size', '32');
    return icon.href;
  } catch {
    return '';
  }
}

function readImagePixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvas.toDataURL();
}

// Chrome's cache returns one default icon for pages it has no favicon for.
// Load it once for a page that cannot exist, so those tiles can use a letter.
let defaultFaviconPixels = null;
function getDefaultFaviconPixels() {
  defaultFaviconPixels ||= new Promise(resolve => {
    const probe = new Image();
    probe.onload = () => resolve(readImagePixels(probe));
    probe.onerror = () => resolve('');
    probe.src = getSiteIconUrl('https://launchpad-no-favicon.invalid/');
  });
  return defaultFaviconPixels;
}

function createSiteIcon(url, name) {
  const image = document.createElement('img');
  image.alt = '';
  image.width = 24;
  image.height = 24;
  image.loading = 'lazy';
  image.src = getSiteIconUrl(url);
  const useInitial = () => {
    if (!image.parentNode) return;
    const initial = document.createElement('span');
    initial.className = 'icon-initial';
    initial.textContent = String(name || '?').slice(0, 1).toUpperCase();
    image.replaceWith(initial);
  };
  image.addEventListener('error', useInitial, { once: true });
  if (image.src.includes('/_favicon/')) {
    // Like Chrome's new tab, a site without a cached icon shows its first letter.
    image.addEventListener('load', async () => {
      const fallback = await getDefaultFaviconPixels();
      if (fallback && readImagePixels(image) === fallback) useInitial();
    }, { once: true });
  }
  return image;
}

function showShortcutValidation(result) {
  for (const [field, message] of Object.entries(result.errors)) {
    const input = document.getElementById(field === 'name' ? 'siteName' : 'siteUrl');
    const error = document.getElementById(field === 'name' ? 'siteNameError' : 'siteUrlError');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message;
  }
}

function clearShortcutValidation() {
  showShortcutValidation({ errors: { name: '', url: '' } });
  document.getElementById('shortcutFormStatus').textContent = '';
}

const defaultSites = [
  { name: 'Google', url: 'https://google.com', color: '#4285f4' },
  { name: 'GitHub', url: 'https://github.com', color: '#24292e' },
  { name: 'YouTube', url: 'https://youtube.com', color: '#ff0000' },
  { name: 'Mail', url: 'https://mail.google.com', color: '#ea4335' },
  { name: 'Docs', url: 'https://docs.google.com', color: '#0f9d58' },
  { name: 'Drive', url: 'https://drive.google.com', color: '#1da462' },
  { name: 'Slack', url: 'https://slack.com', color: '#4a154b' },
  { name: 'Notion', url: 'https://notion.so', color: '#000000' },
  { name: 'ArXiv', url: 'https://arxiv.org', color: '#b31b1b' },
  { name: 'Hugging Face', url: 'https://huggingface.co', color: '#ffae00' },
  { name: 'ChatGPT', url: 'https://chatgpt.com', color: '#10a37f' },
  { name: 'Claude', url: 'https://claude.com', color: '#d4a574' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', color: '#f48024' },
  { name: 'LinkedIn', url: 'https://linkedin.com', color: '#0077b5' },
  { name: 'Twitter', url: 'https://twitter.com', color: '#1da1f2' },
  { name: 'Medium', url: 'https://medium.com', color: '#00ab6c' }
];
