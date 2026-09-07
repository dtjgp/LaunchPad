const fs = require('node:fs');
const path = require('node:path');

const runtimeFiles = [
  'manifest.json', 'background.js', 'core.js', 'filter-query.js', 'shared.js',
  'academic-trend.js', 'arxiv-research.js', 'design-tokens.css', 'styles.css',
  'popup.html', 'popup.js', 'newtab/index.html', 'newtab/newtab.css', 'newtab/newtab.js'
];

function collectReleaseFiles(root, { includeLegal = true } = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const names = new Set(runtimeFiles);
  for (const icon of [...Object.values(manifest.icons || {}), ...Object.values(manifest.action?.default_icon || {})]) {
    if (!/^icons\/[a-z\d_./-]+\.png$/i.test(icon) || icon.split('/').includes('..')) throw new Error('Invalid icon path.');
    names.add(icon);
  }
  for (const name of fs.readdirSync(path.join(root, 'icons/material'))) {
    if (name.endsWith('.svg') || name === 'LICENSE') names.add(`icons/material/${name}`);
  }
  if (includeLegal) for (const name of ['LICENSE', 'PRIVACY.md', 'THIRD_PARTY_NOTICES.md', 'INSTALL.md']) names.add(name);
  return Object.fromEntries([...names].sort().map(name => {
    const resolved = path.resolve(root, name);
    if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`) ||
      !fs.realpathSync(resolved).startsWith(`${fs.realpathSync(root)}${path.sep}`) ||
      fs.lstatSync(resolved).isSymbolicLink()) {
      throw new Error(`Unsafe release path: ${name}`);
    }
    return [name, fs.readFileSync(resolved)];
  }));
}

module.exports = { runtimeFiles, collectReleaseFiles };
