const test = require('node:test');
const assert = require('node:assert/strict');
const { createSettingsWriter, saveSettings, selectNewestStorage, validateSettingsPatch, settingsEqual, sanitizeStoredSettings } = require('../core');

test('Chrome object key ordering does not create false conflicts or change notifications', () => {
  assert.equal(settingsEqual([{ name: 'A', url: 'https://example.org', color: '#ffffff' }],
    [{ color: '#ffffff', name: 'A', url: 'https://example.org' }]), true);
  assert.equal(settingsEqual(['A', 'B'], ['B', 'A']), false);
});

function memoryStorage(initial = {}) {
  let local = structuredClone(initial);
  let sync = {};
  return {
    local: { get: async () => structuredClone(local), set: async value => { local = { ...local, ...structuredClone(value) }; } },
    sync: { get: async () => structuredClone(sync), set: async value => { sync = { ...sync, ...structuredClone(value) }; } }
  };
}

test('changing a theme from an older page does not overwrite newly saved shortcuts', async () => {
  const initial = { sites: [{ name: 'Initial', url: 'https://example.org/' }], themeMode: 'auto' };
  const storage = memoryStorage(initial);
  const tab = createSettingsWriter(storage, initial);
  const popup = createSettingsWriter(storage, initial);
  const sites = [...initial.sites, { name: 'New', url: 'https://example.org/new' }];
  assert.equal((await popup.save({ sites })).ok, true);
  assert.equal((await tab.save({ ...initial, themeMode: 'dark' })).ok, true);
  assert.deepEqual((await storage.local.get()).sites, sites);
});

test('conflicting edits are rejected and local failures never publish to sync', async () => {
  const initial = { themeMode: 'auto' };
  const storage = memoryStorage(initial);
  const first = createSettingsWriter(storage, initial);
  const stale = createSettingsWriter(storage, initial);
  await first.save({ themeMode: 'dark' });
  const conflict = await stale.save({ themeMode: 'light' });
  assert.equal(conflict.code, 'conflict');
  assert.equal((await storage.local.get()).themeMode, 'dark');
  let synced = false;
  const failed = await saveSettings({
    local: { set() { throw new Error('disk full'); } },
    sync: { set: async () => { synced = true; } }
  }, { themeMode: 'light' });
  assert.equal(failed.localOk, false);
  assert.equal(synced, false);
});

test('queued edits from the same page preserve its latest intention', async () => {
  const storage = memoryStorage({ themeMode: 'auto' });
  const writer = createSettingsWriter(storage, { themeMode: 'auto' });
  const results = await Promise.all([writer.save({ themeMode: 'dark' }), writer.save({ themeMode: 'light' })]);
  assert.ok(results.every(result => result.localOk));
  assert.equal((await storage.local.get()).themeMode, 'light');
});

test('storage merges use field timestamps rather than unrelated global writes', () => {
  const merged = selectNewestStorage(
    { themeMode: 'dark', sites: ['old'], settingsUpdatedAt: 20, settingsFieldUpdatedAt: { sites: 5, themeMode: 20 } },
    { themeMode: 'auto', sites: ['new'], settingsUpdatedAt: 15, settingsFieldUpdatedAt: { sites: 15, themeMode: 4 } }
  );
  assert.equal(merged.primary.themeMode, 'dark');
  assert.deepEqual(merged.primary.sites, ['new']);
});

test('persistence rejects malformed settings before writing', () => {
  for (const patch of [{ unexpected: true }, { sites: [null] }, { avatarUrl: 'javascript:alert(1)' },
    { arxivRefreshMinutes: -1 }, { arxivCategories: ['cs.AI&injected'] }, { scourUrl: 'https://example.org/@private' }]) {
    assert.ok(validateSettingsPatch(patch));
  }
});

test('invalid restored fields are isolated without discarding valid settings', () => {
  const result = sanitizeStoredSettings({ sites: [null], themeMode: 'dark', arxivRefreshMinutes: 1e200,
    arxivCustomGroups: [{ categories: 'not-an-array' }], settingsUpdatedAt: 42 });
  assert.equal(result.value.themeMode, 'dark');
  assert.equal(result.value.settingsUpdatedAt, 42);
  assert.deepEqual(result.invalid, ['sites', 'arxivRefreshMinutes', 'arxivCustomGroups']);
});

test('restoring a mixed legacy list preserves valid links and long names', () => {
  const link = { name: 'Long legacy name '.repeat(12), url: 'https://example.org/' };
  const result = sanitizeStoredSettings({ sites: [null, link] });
  assert.deepEqual(result.value.sites, [link]);
  assert.deepEqual(result.invalid, ['sites']);
});
