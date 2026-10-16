// 渲染：用无头浏览器逐帧绘制本期画面，交给 ffmpeg 合成 MP4（配音 + 配乐，配乐在人声下自动避让）。
// 用法：
//   node render.mjs <episode_dir>                     全片 → <episode_dir>/<id>.mp4
//   node render.mjs <episode_dir> --range 0:15        只渲染 0–15 秒（样片），输出 build/range-0-15.mp4
//   node render.mjs <episode_dir> --sheet 1,4.5,9     指定时间点的截图拼成联系表 build/sheet.jpg
//   node render.mjs <episode_dir> --preview           每个场景 75% 处一张截图 → build/preview/
// episode.json 里 "engine": "reel" 用竖屏动效引擎（pipeline/reel/），否则用旧模板（pipeline/template/）。
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, basename, normalize, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const FPS = 30, W = 1080, H = 1920;

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const epDir = resolve(args[0] || '');
const build = join(epDir, 'build');
const episode = JSON.parse(readFileSync(join(epDir, 'episode.json'), 'utf8'));
const timeline = JSON.parse(readFileSync(join(build, 'timeline.json'), 'utf8'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer((req, res) => {
  const p = normalize(join(ROOT, decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const pageUrl = episode.engine === 'reel'
  ? `${base}/pipeline/reel/index.html?ep=${encodeURIComponent(relative(ROOT, epDir))}`
  : `${base}/pipeline/template/index.html`;

// 无 GPU 环境用 SwiftShader 软件渲染 WebGL
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('page error:', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.addInitScript(([ep, tl]) => { window.__EPISODE__ = ep; window.__TIMELINE__ = tl; }, [episode, timeline]);
await page.goto(pageUrl);
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 120000 });
const shot = async (t, o = {}) => { await page.evaluate(t => window.renderAt(t), t); return page.screenshot({ type: 'jpeg', quality: 92, ...o }); };
const done = async () => { await browser.close(); server.close(); };

if (args.includes('--preview')) {
  const dir = join(build, 'preview'); mkdirSync(dir, { recursive: true });
  for (const s of timeline.scenes) {
    const t = s.start + (s.end - s.start) * 0.75;
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: join(dir, `scene-${String(s.index).padStart(2, '0')}-${s.type}.png`) });
  }
  console.log(`preview: ${timeline.scenes.length} stills -> ${dir}`);
  await done(); process.exit(0);
}

if (opt('--sheet')) {
  const times = opt('--sheet').split(',').map(Number), dir = join(build, 'sheet'); mkdirSync(dir, { recursive: true });
  const files = [];
  for (const t of times) { const f = join(dir, `t${t.toFixed(2)}.jpg`); writeFileSync(f, await shot(t)); files.push(f); }
  const cols = Math.min(times.length, Number(opt('--cols') || 5));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex',
    files.map((_, i) => `[${i}]scale=432:768[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') +
    `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 432}_${Math.floor(i / cols) * 768}`).join('|')}:fill=black`,
    join(build, 'sheet.jpg')]);
  console.log(`sheet: ${times.length} frames -> ${join(build, 'sheet.jpg')}`);
  await done(); process.exit(0);
}

const range = opt('--range');
const [t0, t1] = range ? range.split(':').map(Number) : [0, timeline.duration];
const out = opt('--out') || (range ? join(build, `range-${t0}-${t1}.mp4`) : join(epDir, `${basename(epDir)}.mp4`));

// 音频：配音 +（可选）本期配乐 build/music.wav；配乐被配音压低（侧链压缩），总响度 −14 LUFS
const narr = join(build, 'narration.wav'), music = join(build, 'music.wav');
const trim = ['-ss', String(t0), '-t', String(t1 - t0)];
const audioArgs = [...trim, '-i', narr];
let filter = '[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]';
if (existsSync(music)) {
  audioArgs.push(...trim, '-i', music);
  filter = '[1:a]asplit=2[v1][v2];[2:a]volume=0.55[m];[m][v1]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350:makeup=1[md];' +
           '[v2]acompressor=threshold=0.1:ratio=3:attack=5:release=80,volume=1.6[vc];[vc][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9[a]';
}
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  ...audioArgs,
  '-filter_complex', filter, '-map', '0:v', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.ceil((t1 - t0) * FPS), started = Date.now();
for (let i = 0; i < total; i++) {
  const buf = await shot(t0 + i / FPS);
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % (FPS * 5) === 0) process.stdout.write(`\rframe ${i}/${total}  ${((Date.now() - started) / Math.max(1, i)).toFixed(0)} ms/frame   `);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error(`ffmpeg exit ${c}`)))));
await done();
console.log(`\rrendered ${total} frames in ${((Date.now() - started) / 1000).toFixed(0)}s -> ${out}`);
