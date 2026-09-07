const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { unzipSync } = require('fflate');
const { collectReleaseFiles } = require('./release-files.cjs');
const root = path.resolve(__dirname, '..');
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'dist/release-files.json')));
const archive = fs.readFileSync(path.join(root, 'dist', evidence.filename));
if (crypto.createHash('sha256').update(archive).digest('hex') !== evidence.sha256) throw new Error('Archive hash mismatch.');
const actual = unzipSync(archive);
const expected = collectReleaseFiles(root);
if (JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(Object.keys(expected).sort())) throw new Error('Archive file set mismatch.');
for (const [name, bytes] of Object.entries(expected)) {
  if (!Buffer.from(actual[name]).equals(bytes)) throw new Error(`Archive differs from source: ${name}`);
  if (/^(node_modules|output|tests|reference|\.git)\//.test(name)) throw new Error(`Development files leaked into archive: ${name}`);
}
console.log(`Verified ${evidence.filename}: exact runtime/legal allowlist, ${Object.keys(actual).length} matching files, SHA-256 ${evidence.sha256}.`);
