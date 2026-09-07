const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const top = ['README.md', 'INSTALL.md', 'PRIVACY.md', 'SECURITY.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md'];
const files = [...top, ...fs.readdirSync(path.join(root, 'docs')).filter(name => name.endsWith('.md')).map(name => `docs/${name}`)];
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (/\/Users\//.test(text)) throw new Error(`Local home path in public documentation: ${file}`);
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(root, path.dirname(file), target))) throw new Error(`Broken local document link in ${file}`);
  }
}
console.log(`Checked ${files.length} public documents and their local links.`);
