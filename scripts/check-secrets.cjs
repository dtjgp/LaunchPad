const fs = require('node:fs');
const path = require('node:path');
const { runtimeFiles } = require('./release-files.cjs');
const root = path.resolve(__dirname, '..');
const files = new Set(runtimeFiles);
function addTextFiles(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const name = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) addTextFiles(name);
    else if (/\.(?:js|cjs|json|md|ya?ml)$/.test(name)) files.add(name);
  }
}
for (const directory of ['scripts', 'tests', 'docs', '.github']) addTextFiles(directory);
for (const name of fs.readdirSync(root)) if (/\.(?:md|json)$/.test(name)) files.add(name);
const signatures = [
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{40,}/,
  /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
const findings = [...files].filter(file => {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return signatures.some(signature => signature.test(text));
});
// Print paths only. Never echo matching values to the terminal or CI logs.
if (findings.length) {
  console.error(`Potential credentials in: ${findings.join(', ')}`);
  process.exitCode = 1;
} else console.log(`No known credential signatures found in ${files.size} selected source/document files.`);
