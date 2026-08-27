const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, 'dist');
const nestedHtml = path.join(dist, 'web', 'index.html');
const rootHtml = path.join(dist, 'index.html');

if (!fs.existsSync(nestedHtml)) {
  console.error('Expected build output at', nestedHtml);
  process.exit(1);
}

fs.renameSync(nestedHtml, rootHtml);
fs.rmSync(path.join(dist, 'web'), { recursive: true, force: true });
console.log('Flattened web preview to', dist);
