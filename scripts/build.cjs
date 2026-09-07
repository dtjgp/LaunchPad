const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { zipSync } = require('fflate');
const { collectReleaseFiles } = require('./release-files.cjs');

function buildRelease(root, output) {
  const files = collectReleaseFiles(root);
  const manifest = JSON.parse(files['manifest.json']);
  const filename = `LaunchPad-${manifest.version}.zip`;
  // Fixed local calendar fields keep ZIP metadata stable across time zones and builds.
  const archive = zipSync(Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name,
    [bytes, { mtime: new Date(2000, 0, 1), level: name.endsWith('.png') ? 0 : 9 }]
  ])));
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, filename), archive);
  const sha256 = crypto.createHash('sha256').update(archive).digest('hex');
  fs.writeFileSync(path.join(output, `${filename}.sha256`), `${sha256}  ${filename}\n`);
  fs.writeFileSync(path.join(output, 'release-files.json'), JSON.stringify({ version: manifest.version, filename, sha256,
    files: Object.fromEntries(Object.entries(files).map(([name, data]) => [name, crypto.createHash('sha256').update(data).digest('hex')]))
  }, null, 2) + '\n');
  return { filename, sha256, bytes: archive.length, files: Object.keys(files).length };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  try { console.log(JSON.stringify(buildRelease(root, path.join(root, 'dist')), null, 2)); }
  catch (error) { console.error(`Release build failed: ${error.message}`); process.exitCode = 1; }
}
module.exports = { buildRelease };
