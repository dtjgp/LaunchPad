const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { unzipSync } = require('fflate');
const root = path.resolve(__dirname, '..');
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'dist/release-files.json')));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'launchpad-installed-package-'));
try {
  execFileSync(process.execPath, [path.join(__dirname, 'verify-package.cjs')], { cwd: root, stdio: 'inherit' });
  const files = unzipSync(fs.readFileSync(path.join(root, 'dist', evidence.filename)));
  for (const [name, bytes] of Object.entries(files)) {
    const target = path.resolve(temporary, name);
    if (!target.startsWith(`${temporary}${path.sep}`)) throw new Error('Invalid archive entry.');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  const cli = path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
  execFileSync(process.execPath, [cli, 'test'], {
    cwd: root, stdio: 'inherit',
    env: { ...process.env, LAUNCHPAD_EXTENSION_PATH: temporary, LAUNCHPAD_TEST_ARTIFACTS: path.join(root, 'output/package-smoke') }
  });
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
