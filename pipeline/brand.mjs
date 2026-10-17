// 生成账号头像和横幅到 content-system/brand/：node pipeline/brand.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'content-system/brand');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const p = normalize(join(ROOT, decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/pipeline/brand.html`);
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 60000 });
const assets = await page.evaluate(() => window.__ASSETS__);
mkdirSync(OUT, { recursive: true });
for (const [name, url] of Object.entries(assets)) { writeFileSync(join(OUT, name), Buffer.from(url.split(',')[1], 'base64')); console.log('→', join('content-system/brand', name)); }
await browser.close(); server.close();
