// Playwright 逐帧截图 → ffmpeg 合成。用法：
//   node scripts/render.mjs                 渲染整条 out/ep01.mp4
//   node scripts/render.mjs --stills 0,5.2  只导出指定时间点的 PNG 到 out/stills/（调试用）
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const cfg = JSON.parse(read('config/ep01.json'));
const timeline = JSON.parse(read('build/timeline.json'));
const footPath = path.join(ROOT, 'build/footage.json');
const footage = fs.existsSync(footPath) ? JSON.parse(fs.readFileSync(footPath, 'utf8')) : {};

const stillsArg = process.argv.indexOf('--stills');
const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(',').map(Number) : null;

const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: cfg.width, height: cfg.height }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('page error:', e.message); process.exitCode = 1; });
await page.addInitScript(`window.CONFIG=${JSON.stringify(cfg)};window.TIMELINE=${JSON.stringify(timeline)};` +
  `window.CUES=${read('build/cues.json')};window.FOOTAGE=${JSON.stringify(footage)};`);
await page.goto('file://' + path.join(ROOT, 'src/index.html'));
const fonts = await page.evaluate(() => window.ready());
console.log(`fonts loaded: ${fonts} faces`);
const stage = await page.$('#stage');

if (stills) {
  fs.mkdirSync(path.join(ROOT, 'out/stills'), { recursive: true });
  for (const t of stills) {
    await page.evaluate((x) => window.seek(x), t);
    await stage.screenshot({ path: path.join(ROOT, `out/stills/t${t.toFixed(2)}.png`) });
  }
  console.log('stills:', stills.join(', '));
} else {
  const frames = Math.round(timeline.duration * cfg.fps);
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(cfg.fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(ROOT, 'build/mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-r', String(cfg.fps), '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
    path.join(ROOT, `out/${cfg.episode}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((x) => window.seek(x), f / cfg.fps);
    const buf = await stage.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
    if (f % 90 === 0) console.log(`frame ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  const [code] = await once(ff, 'close');
  if (code !== 0) throw new Error('ffmpeg failed: ' + code);
  console.log(`done: out/${cfg.episode}.mp4 (${frames} frames)`);
}
await browser.close();
