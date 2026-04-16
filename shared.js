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
