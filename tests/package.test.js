const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { unzipSync } = require('fflate');
const { collectReleaseFiles } = require('../scripts/release-files.cjs');
const { buildRelease } = require('../scripts/build.cjs');

test('release packaging is deterministic and cannot include local development data', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'launchpad-package-fixture-'));
  try {
    const source = path.resolve(__dirname, '..');
    for (const [name, bytes] of Object.entries(collectReleaseFiles(source, { includeLegal: false }))) {
      const target = path.join(fixture, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
    // Legal text is a test fixture only; no release license is inferred from it.
    for (const name of ['LICENSE', 'PRIVACY.md', 'THIRD_PARTY_NOTICES.md', 'INSTALL.md']) fs.writeFileSync(path.join(fixture, name), 'TEST FIXTURE ONLY');
    fs.writeFileSync(path.join(fixture, '.env'), 'PRIVATE_FIXTURE=never-bundle');
    fs.mkdirSync(path.join(fixture, 'output'));
    fs.writeFileSync(path.join(fixture, 'output/private.txt'), 'never-bundle');
    const first = buildRelease(fixture, path.join(fixture, 'dist'));
    const second = buildRelease(fixture, path.join(fixture, 'dist'));
    assert.equal(first.sha256, second.sha256);
    const files = unzipSync(fs.readFileSync(path.join(fixture, 'dist', first.filename)));
    assert.ok(files['manifest.json']);
    assert.ok(files['filter-query.js']);
    assert.ok(files['LICENSE']);
    assert.equal(files['.env'], undefined);
    assert.equal(files['output/private.txt'], undefined);
    assert.ok(first.bytes < 1024 * 1024, 'the optimized runtime archive should stay below 1 MB');
    const manifest = JSON.parse(fs.readFileSync(path.join(fixture, 'manifest.json')));
    manifest.icons['16'] = '.env';
    fs.writeFileSync(path.join(fixture, 'manifest.json'), JSON.stringify(manifest));
    assert.throws(() => buildRelease(fixture, path.join(fixture, 'dist')), /icon path/);
  } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
});
