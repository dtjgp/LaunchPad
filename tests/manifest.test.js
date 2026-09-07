const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

test('manifest uses standard-size renders of the owner-selected illustration', () => {
  const crypto = require('node:crypto');
  const provenance = JSON.parse(fs.readFileSync(path.join(root, 'icons/app/provenance.json'), 'utf8'));
  assert.equal(provenance.source, 'icons/Gemini_Generated_Image_fgcx8wfgcx8wfgcx.png');
  const original = fs.readFileSync(path.join(root, provenance.source));
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'), provenance.sourceSha256);
  for (const size of [16, 32, 48, 128]) {
    const filename = `icons/app/icon${size}.png`;
    assert.equal(manifest.icons[size], filename);
    assert.equal(manifest.action.default_icon[size], filename);
    const image = fs.readFileSync(path.join(root, filename));
    assert.equal(image.readUInt32BE(16), size);
    assert.equal(image.readUInt32BE(20), size);
    assert.equal(crypto.createHash('sha256').update(image).digest('hex'), provenance.generated[`icon${size}.png`]);
  }
});

test('runtime pages load the shared core module', () => {
  const popup = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  const newtab = fs.readFileSync(path.join(root, 'newtab/index.html'), 'utf8');
  const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');

  assert.match(popup, /<script src="core\.js"><\/script>/);
  assert.match(newtab, /<script src="\.\.\/core\.js"><\/script>/);
  assert.match(newtab, /<script src="\.\.\/arxiv-research\.js"><\/script>/);
  assert.match(newtab, /<script src="\.\.\/academic-trend\.js"><\/script>/);
  assert.match(background, /importScripts\(['"]core\.js['"]\)/);
});

test('manifest grants only the feed hosts used by the background worker', () => {
  assert.ok(manifest.host_permissions.includes('https://api.ossinsight.io/*'));
  assert.ok(manifest.host_permissions.includes('https://api.github.com/*'));
  assert.equal(
    manifest.host_permissions.includes(
      'https://raw.githubusercontent.com/guanguans/favorite-link/*'
    ),
    false
  );
  assert.equal(manifest.host_permissions.includes('https://raw.githubusercontent.com/*'), false);
  assert.equal(manifest.host_permissions.includes('https://www.google.com/*'), false);
});

test('new tab replaces the editorial panel with Academic GitHub Trend', () => {
  const newtab = fs.readFileSync(path.join(root, 'newtab/index.html'), 'utf8');

  assert.match(newtab, /Academic GitHub Trend/);
  assert.doesNotMatch(newtab, /guanguans\/favorite-link/);
});
