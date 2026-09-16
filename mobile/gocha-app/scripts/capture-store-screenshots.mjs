#!/usr/bin/env node
/**
 * Capture store screenshots from the production web shell (same UI as native).
 * Requires: npm run build:web && npx playwright install chromium
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'web', 'dist');
const playOut = path.join(root, 'store', 'google-play', 'screenshots', 'phone');
const iosOut = path.join(root, 'store', 'apple-app-store', 'screenshots', 'iphone-6.7');

const routes = [
  { name: '01-chats', path: '/ChatsTab/ChatsList' },
  { name: '02-catch-up', path: '/CatchUpTab' },
  { name: '03-discover', path: '/DiscoverTab' },
  { name: '04-settings', path: '/SettingsTab' },
];

async function startStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      try {
        const body = await readFile(filePath);
        const ext = path.extname(filePath);
        const type =
          ext === '.html'
            ? 'text/html'
            : ext === '.js'
              ? 'text/javascript'
              : ext === '.css'
                ? 'text/css'
                : ext === '.jpeg' || ext === '.jpg'
                  ? 'image/jpeg'
                  : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type });
        res.end(body);
      } catch {
        const body = await readFile(path.join(distDir, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(body);
      }
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error('Install Playwright first: npx playwright install chromium');
    process.exit(1);
  }

  await mkdir(playOut, { recursive: true });
  await mkdir(iosOut, { recursive: true });

  const { server, baseUrl } = await startStaticServer();
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  for (const route of routes) {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    const playPath = path.join(playOut, `${route.name}.png`);
    const iosPath = path.join(iosOut, `${route.name}.png`);
    await page.screenshot({ path: playPath, fullPage: false });
    await page.screenshot({ path: iosPath, fullPage: false });
    console.log(`Captured ${route.name}`);
  }

  await browser.close();
  server.close();
  await writeFile(
    path.join(root, 'store', 'screenshots-manifest.json'),
    JSON.stringify({ capturedAt: new Date().toISOString(), routes }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
