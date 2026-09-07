const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { runtimeFiles, collectReleaseFiles } = require('./release-files.cjs');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
if (manifest.manifest_version !== 3 || manifest.version !== pkg.version) throw new Error('Manifest/package version mismatch.');
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('Release version must be numeric major.minor.patch.');
for (const file of runtimeFiles.filter(name => name.endsWith('.js'))) execFileSync(process.execPath, ['--check', path.join(root, file)]);
const files = collectReleaseFiles(root, { includeLegal: false });
for (const [name, bytes] of Object.entries(files)) {
  if (!/\.(html|css)$/.test(name)) continue;
  const text = bytes.toString('utf8');
  if (name.endsWith('.html') && /<script\b[^>]*src=["']https?:/i.test(text)) throw new Error(`Remote runtime script in ${name}`);
  const references = name.endsWith('.html')
    ? [...text.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)].map(match => match[1])
    : [...text.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1]);
  for (const reference of references) {
    if (/^(https?:|data:|#)/.test(reference)) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(name), reference));
    if (!files[target]) throw new Error(`Missing runtime resource: ${name} -> ${reference}`);
  }
  if (name.endsWith('.html')) {
    const ids = [...text.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate HTML IDs in ${name}`);
  }
}
console.log(`Checked ${runtimeFiles.length} runtime files, resource references and version ${pkg.version}.`);
