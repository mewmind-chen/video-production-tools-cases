// 竖屏动效排版引擎（1080×1920）。每一帧都是时间 t 的纯函数。
// 图层：WebGL 背景层（粒子地形、产品 3D）→ 2D 画布（排版、图形、HUD、字幕、AI 主播）→ WebGL 后期（RGB 错位、
// 故障切片、颗粒、暗角、闪白）→ #out。
// Adapted from the kinetic-reel skill template (MIT License, Copyright (c) 2026 tuzhechen2005),
// https://github.com/tuzhechen2005/opus-video-skills
import * as THREE from 'three';
import { initHost } from './host.js';

export const W = 1080, H = 1920, FPS = 30, BPM = 120, BEAT = 60 / BPM;
export const K = { ink: '#0E0F0E', ink2: '#171917', cream: '#F1EEE6', lime: '#DDF53D', blue: '#2F3CFF', red: '#E8412F', grey: '#8B908A', mid: '#5E625D', amber: '#FFB020' };
export const F = { cond: '"Anton"', wide: '"Archivo Black"', serif: '"Instrument Serif"', mono: '"JetBrains Mono"', sans: '"Inter"' };
// 竖屏版式：左右边距、内容区、底部字幕区（平台按钮遮挡区之上）
export const LAY = { ml: 80, mr: 1000, top: 170, subY: 1450, hudBottom: 1665, progY: 1700 };

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = x => Math.pow(clamp(x), 3);
export const easeInOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const expoOut = x => { x = clamp(x); return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); };
export const ioExpo = x => { x = clamp(x); return x === 0 ? 0 : x === 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2; };
export const backOut = x => { x = clamp(x); const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
export const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const beatPulse = (t, k = 7) => Math.exp(-((t / BEAT) % 1) * k);
export const TAU = Math.PI * 2;
export const font = (fam, size, weight = '') => `${weight} ${size}px ${fam}`.trim();

export function createReel({ EP, TL }) {
  const out = document.getElementById('out');
  const c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
  const mainCtx = c2.getContext('2d');
  let ctx = mainCtx;
  const mkBuf = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const bufA = mkBuf(), bufB = mkBuf(), bufT = mkBuf();
  let TRANS = false;
  const RECT = {};
  const glA = document.createElement('canvas'); glA.width = W; glA.height = H;
  const RA = new THREE.WebGLRenderer({ canvas: glA, antialias: true, alpha: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: !!EP.logDepth });
  RA.setPixelRatio(1); RA.setSize(W, H, false);
  const RP = new THREE.WebGLRenderer({ canvas: out, antialias: false, preserveDrawingBuffer: true });
  RP.setPixelRatio(1); RP.setSize(W, H, false); RP.outputColorSpace = THREE.LinearSRGBColorSpace;
  let FX;

  // ---------- GL 层：粒子地形 ----------
  const terrain = (() => {
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(52, W / H, .1, 100);
    const nx = 170, nz = 190, pos = new Float32Array(nx * nz * 3);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const k = (i * nz + j) * 3; pos[k] = (i / (nx - 1) - .5) * 16; pos[k + 1] = 0; pos[k + 2] = -j / (nz - 1) * 34 + 3; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 }, amp: { value: 1 }, fade: { value: 1 }, tint: { value: new THREE.Color(K.cream) } },
      vertexShader: `uniform float time, amp; varying float vA;
        float wave(vec2 p, float t){ return sin(p.x*.5+t*.9)*.45 + sin(p.y*.38-t*.7)*.6 + sin((p.x+p.y)*.27+t*.5)*.7 + sin(length(p-vec2(3.,-9.))*.8-t*1.4)*.4; }
        void main(){ vec3 p = position; p.y = wave(p.xz, time)*amp; vec4 mv = modelViewMatrix*vec4(p,1.);
          gl_PointSize = 6.0 * (6.0 / -mv.z); float d = -mv.z; vA = clamp(1.0 - d/32.0, 0., 1.) * (.25 + .75*smoothstep(-1.2, 1.6, p.y)) * smoothstep(0.5, 3.5, d);
          gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform float fade; uniform vec3 tint; varying float vA;
        void main(){ vec2 c = gl_PointCoord-.5; float r = dot(c,c); if (r>.25) discard; gl_FragColor = vec4(tint, vA*fade*(1.0-r*2.5)); }`,
    });
    scene.add(new THREE.Points(g, mat));
    return (t, o = {}) => {
      mat.uniforms.time.value = t; mat.uniforms.amp.value = o.amp ?? 1; mat.uniforms.fade.value = o.fade ?? 1;
      mat.uniforms.tint.value.set(o.tint || K.cream);
      cam.position.set(Math.sin(t * .15) * 1.2, o.camY ?? 3.4, 5 - (o.push ?? 0)); cam.lookAt(0, o.lookY ?? -1.2, -8);
      RA.setClearColor(0x000000, 0); RA.clear(); RA.render(scene, cam);
      return glA;
    };
  })();

  // ---------- 后期 ----------
  const post = (() => {
    const tex = new THREE.CanvasTexture(c2); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = tex.magFilter = THREE.LinearFilter;
    const mat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: tex }, split: { value: 0 }, slice: { value: 0 }, seed: { value: 0 }, grain: { value: .05 }, time: { value: 0 }, vign: { value: .5 }, flash: { value: 0 }, flashCol: { value: new THREE.Color(1, 1, 1) }, res: { value: new THREE.Vector2(W, H) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: `uniform sampler2D tex; uniform float split, slice, seed, grain, time, vign, flash; uniform vec3 flashCol; uniform vec2 res; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        void main(){
          vec2 uv = vUv;
          float band = floor(uv.y*44.0 + h(vec2(seed,1.))*3.0), hb = h(vec2(band, seed));
          if (hb < slice) uv.x += (h(vec2(band, seed+2.)) - .5) * .2 * slice;
          vec2 d = vec2(split, split*.15);
          vec3 c = vec3(texture2D(tex, uv + d).r, texture2D(tex, uv).g, texture2D(tex, uv - d).b);
          c += (h(vUv*res + time*61.7) - .5) * grain;
          vec2 q = vUv - .5; q.y *= .6; c *= 1.0 - vign*dot(q,q)*1.4;
          c = mix(c, flashCol, flash);
          gl_FragColor = vec4(c, 1.);
        }`,
    });
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return (t, fx) => {
      tex.needsUpdate = true;
      const u = mat.uniforms; u.split.value = fx.split; u.slice.value = fx.slice; u.seed.value = fx.seed; u.time.value = Math.floor(t * FPS);
      u.grain.value = fx.grain; u.vign.value = fx.vign; u.flash.value = fx.flash; u.flashCol.value.set(fx.flashCol);
      RP.render(scene, cam);
    };
  })();

  // ---------- 2D 工具 ----------
  function txt(s, x, y, o = {}) {
    ctx.save();
    ctx.font = o.font; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic'; ctx.letterSpacing = (o.ls || 0) + 'px';
    ctx.globalAlpha = o.a ?? 1;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowR || 28; }
    if (o.stroke) { ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); }
    if (o.fill !== null) { ctx.fillStyle = o.fill || K.cream; ctx.fillText(s, x, y); }
    ctx.restore();
  }
  function letters(s, x, y, o, fn) {
    ctx.save(); ctx.font = o.font; ctx.letterSpacing = (o.ls || 0) + 'px';
    const total = ctx.measureText(s).width, x0 = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]; if (ch === ' ') continue;
      const px = ctx.measureText(s.slice(0, i)).width, cw = ctx.measureText(ch).width, a = fn(i, s.length);
      if ((a.a ?? 1) <= 0.001) continue;
      ctx.save(); ctx.globalAlpha = a.a ?? 1; ctx.translate(x0 + px + cw / 2 + (a.dx || 0), y + (a.dy || 0)); ctx.rotate(a.r || 0); ctx.scale(a.s ?? 1, a.s ?? 1);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (o.stroke) { ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke; ctx.strokeText(ch, 0, 0); }
      if (o.fill !== null) { ctx.fillStyle = a.fill || o.fill || K.cream; ctx.fillText(ch, 0, 0); }
      ctx.restore();
    }
    ctx.restore();
    return total;
  }
  const measure = (s, f, ls = 0) => { ctx.save(); ctx.font = f; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; };
  const bg = col => { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); };
  function line(pts, col, lw = 2, a = 1, dash) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore(); }
  function circle(x, y, r, o = {}) { if (!(r > .01)) return; ctx.save(); ctx.globalAlpha = o.a ?? 1; ctx.beginPath(); ctx.arc(x, y, r, o.a0 ?? 0, o.a1 ?? TAU); if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); } if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 2; ctx.stroke(); } ctx.restore(); }
  function rrect(x, y, w, h, r, o = {}) { if (!(w > .5) || !(h > .5)) return; ctx.save(); ctx.globalAlpha = o.a ?? 1; ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); } if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 2; ctx.stroke(); } ctx.restore(); }
  function starburst(x, y, r, n, col, rot = 0, inner = .62) { if (!(r > .01)) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, q = i % 2 ? r * inner : r; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  function asterisk(x, y, r, col, lw = 5, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = col; ctx.lineWidth = lw; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(-Math.cos(a) * r, -Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); } ctx.restore(); }
  function arrowNE(x, y, s, col, lw = 6) { line([[x, y + s], [x + s, y]], col, lw); line([[x + s * .35, y], [x + s, y], [x + s, y + s * .65]], col, lw); }
  function arrow(x0, y0, x1, y1, col, lw = 2, a = 1, head = 13) {
    if (a <= 0) return;
    line([[x0, y0], [x1, y1]], col, lw, a); const g = Math.atan2(y1 - y0, x1 - x0);
    line([[x1 - Math.cos(g - .45) * head, y1 - Math.sin(g - .45) * head], [x1, y1], [x1 - Math.cos(g + .45) * head, y1 - Math.sin(g + .45) * head]], col, lw, a);
  }
  function chip(s, x, y, o = {}) {
    const f = o.font || font(F.mono, 26, 700), ls = o.ls ?? 3, w = measure(s, f, ls) + 36, h = o.h || 54, k = o.k ?? 1;
    if (k <= 0) return w;
    rrect(x, y - h / 2, w * easeOut(k), h, o.r ?? 0, { fill: o.bg || K.ink, stroke: o.line, lw: o.lw, a: o.a });
    if (k > .6) txt(s, x + 18, y + 9, { font: f, fill: o.fg || K.cream, ls, a: (o.a ?? 1) * seg(k, .6, 1) });
    return w;
  }
  function odometer(v0, v1, k, x, y, f, col) {
    const s0 = String(v0).padStart(String(v1).length, '0'), s1 = String(v1); ctx.save(); ctx.font = f;
    let xx = x; const size = parseFloat(f.match(/(\d+)px/)[1]), hgt = size * 1.08;
    for (let i = 0; i < s1.length; i++) {
      const d0 = +s0[i], d1 = +s1[i], w = ctx.measureText(s1[i]).width, kk = expoOut(clamp(k * 1.2 - i * .15));
      ctx.save(); ctx.beginPath(); ctx.rect(xx - 10, y - size * .95, w + 20, size * .97); ctx.clip();   // 只露出当前这一位
      const steps = (d1 - d0 + 10) % 10 || 10, off = kk * steps;
      for (let j = -1; j <= steps + 1; j++) { const dy = (j - off) * hgt; if (Math.abs(dy) > hgt * 1.2) continue; ctx.fillStyle = col; ctx.fillText(String((d0 + j + 10) % 10), xx, y + dy); }
      ctx.restore(); xx += w;
    }
    ctx.restore(); return xx;
  }
  function tape(t, y, rot, col, fg, words, speed, dir, k) {
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.translate(lerp(dir * W * 1.6, 0, expoOut(k)), 0);
    ctx.fillStyle = col; ctx.fillRect(-W * 2, -78, W * 4, 156);
    const f = font(F.cond, 112), unit = words.map(w => measure(w, f) + 150).reduce((a, b) => a + b, 0), off = ((t * speed) % unit + unit) % unit;
    let x = -W * 1.9 - off * dir;
    while (x < W * 2) for (const [i, w] of words.entries()) { txt(w, x, 42, { font: f, fill: fg }); const ww = measure(w, f); if (i % 2 === 0) asterisk(x + ww + 75, 0, 30, fg, 7, t); else arrowNE(x + ww + 48, -28, 54, fg, 8); x += ww + 150; }
    ctx.restore();
  }
  const dropWord = (s, x, y, f, t0, t, o = {}) => letters(s, x, y, { font: f, fill: o.fill || K.cream, align: o.align, stroke: o.stroke, lw: o.lw }, (i) => {
    const k = seg(t, t0 + i * (o.stag ?? .03), t0 + i * (o.stag ?? .03) + (o.dur ?? .32)); return { dy: (1 - expoOut(k)) * (o.fall ?? 220), a: k > 0 ? (o.alpha ?? 1) : 0, fill: o.fillAt ? o.fillAt(i) : undefined };
  });
  // 叠字：主词实心，上下各叠几层描边回声
  function stackWord(s, x, y, f, t0, t, o = {}) {
    const n = o.echo ?? 2, gap = o.gap ?? 210;
    for (let e = n; e >= 1; e--) for (const sgn of [-1, 1]) {
      const k = seg(t, t0 + .08 * e, t0 + .08 * e + .35);
      if (k > 0) txt(s, x, y + sgn * gap * e * easeOut(k), { font: f, fill: null, stroke: o.echoCol || 'rgba(241,238,230,.35)', lw: 2, align: o.align, a: k * (1 - e * .25) });
    }
    dropWord(s, x, y, f, t0, t, { fill: o.fill, align: o.align, fall: o.fall ?? 160, stag: o.stag ?? .035 });
  }
  const glitchIn = (lt, seed, d = .14, amt = .5) => { if (!TRANS && lt < d) { FX.slice = Math.max(FX.slice, amt * (1 - lt / d)); FX.split = Math.max(FX.split, .006 * (1 - lt / d)); FX.seed = seed; } };
  function redacted(x, y, w, h, seed, col, a = 1) { let xx = x; const end = x + w; for (let j = 0; xx < end - 10; j++) { const ww = Math.min(end - xx, 30 + 90 * hash(seed * 13 + j)); rrect(xx, y, ww, h, h / 2, { fill: col, a }); xx += ww + 10; } }
  const bez = (p0, c0, c1, p1, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * c0[0] + 3 * v * u * u * c1[0] + u * u * u * p1[0], v * v * v * p0[1] + 3 * v * v * u * c0[1] + 3 * v * u * u * c1[1] + u * u * u * p1[1]]; };
  function thread(p0, p1, k, col, lw = 4, bend = 200) {
    if (k <= 0) return; const c0 = [p0[0] + bend, p0[1]], c1 = [p1[0] - bend, p1[1]], pts = [];
    for (let i = 0; i <= 50 * k; i++) pts.push(bez(p0, c0, c1, p1, i / 50));
    if (pts.length > 1) line(pts, col, lw);
  }
  function barcode(x, y, w, h, seed, col = K.ink) { let xx = x; for (let j = 0; xx < x + w - 4; j++) { const bw = 2 + Math.floor(hash(seed * 31 + j) * 4) * 2; if (hash(seed * 7 + j) > .45) { ctx.fillStyle = col; ctx.fillRect(xx, y, bw, h); } xx += bw + 2; } }
  const glShot = (canvas, a = 1) => { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(canvas, 0, 0, W, H); ctx.restore(); };
  // 频道标识：一个信号点 + 扩散环
  function mark(x, y, r, t, k = 1, col = K.lime) {
    if (k <= 0) return;
    const kk = backOut(k);
    for (let i = 0; i < 3; i++) { const p = ((t / BEAT + i / 3) % 1); circle(x, y, r * (1.2 + 2.2 * p) * kk, { stroke: col, lw: 3, a: (1 - p) * .7 * k }); }
    circle(x, y, r * kk, { fill: col });
  }

  // ---------- HUD：四角细字 + 分段进度条 ----------
  const CH = EP.chapters || [];
  const DUR = TL.duration;
  const tc = t => { const f = Math.floor(t * FPS), s = Math.floor(f / FPS), fr = f % FPS, p = n => String(n).padStart(2, '0'); return `TC 00:${p(Math.floor(s / 60))}:${p(s % 60)}:${p(fr)}`; };
  function hud(t, o = {}) {
    const dark = o.dark !== false, col = dark ? 'rgba(241,238,230,.85)' : 'rgba(14,15,14,.85)', dim = dark ? 'rgba(241,238,230,.4)' : 'rgba(14,15,14,.4)';
    const k = o.k ?? 1, m = 40, L = 30 * k;
    if (o.brackets !== false) for (const [cx, cy, sx, sy] of [[m, m + 40, 1, 1], [W - m, m + 40, -1, 1], [m, LAY.progY + 34, 1, -1], [W - m, LAY.progY + 34, -1, -1]]) line([[cx, cy + sy * L], [cx, cy], [cx + sx * L, cy]], col, 2, k);
    const f = font(F.mono, 21, 500), a = clamp(k * 1.4 - .3);
    if (o.tl) txt(o.tl, m + 22, m + 76, { font: f, fill: col, ls: 3, a });
    txt(o.tr ?? tc(t), W - m - 22, m + 76, { font: f, fill: col, ls: 3, align: 'right', a });
    if (o.bl) txt(o.bl, m + 22, LAY.hudBottom, { font: f, fill: col, ls: 3, a });
    if (o.br) txt(o.br, W - m - 22, LAY.hudBottom, { font: f, fill: col, ls: 3, align: 'right', a });
    const y = LAY.progY, x0 = m + 22, x1 = W - m - 22, X = s => lerp(x0, x1, s / DUR);
    for (const [, a0, a1] of CH) {
      const xa = X(a0) + 3, xb = X(a1) - 3, on = t >= a0 && t < a1;
      line([[xa, y], [xb, y]], dim, 2, a * .7);
      if (t > a0) line([[xa, y], [Math.min(xb, X(t)), y]], col, on ? 5 : 3, a);
    }
  }

  // ---------- 字幕 + AI 主播（每帧最后画在主画布上）----------
  const hostCanvas = document.createElement('canvas'); hostCanvas.width = hostCanvas.height = 340;
  const host = initHost(hostCanvas, TL);
  function subtitle(t) {
    const sub = TL.subs.find(l => t >= l.start && t <= l.end + .12);
    host(t);
    const g = mainCtx;
    g.drawImage(hostCanvas, 60, LAY.subY - 18, 150, 150);
    g.save(); g.font = font(F.mono, 18, 700); g.letterSpacing = '4px'; g.fillStyle = K.lime; g.textAlign = 'center'; g.fillText('AI VOICE', 135, LAY.subY + 150); g.restore();
    if (!sub) return;
    g.save(); g.font = font(F.sans, 46, 700); g.letterSpacing = '0px';
    const w = Math.min(g.measureText(sub.text).width, 760) + 56, x = 232, y = LAY.subY + 4;
    g.fillStyle = 'rgba(14,15,14,.9)'; g.beginPath(); g.roundRect(x, y, w, 98, [8, 30, 30, 30]); g.fill();
    g.strokeStyle = 'rgba(221,245,61,.55)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = K.cream; g.fillText(sub.text, x + 28, y + 64, 760);
    g.restore();
  }

  // ---------- 转场（A = 上一场最后一帧，B = 本场实时）----------
  const trIris = (cx, cy, ring = K.lime) => (k, A, B, g) => {
    const e = easeIn(k) * .6 + ease(k) * .4, Rr = e * Math.hypot(W, H);
    g.drawImage(A, 0, 0); g.save(); g.beginPath(); g.arc(cx, cy, Rr, 0, TAU); g.clip(); g.drawImage(B, 0, 0); g.restore();
    g.save(); g.strokeStyle = ring; g.lineWidth = 3 + 14 * (1 - e); g.beginPath(); g.arc(cx, cy, Rr, 0, TAU); g.stroke(); g.restore();
  };
  const trZoom = rect => (k, A, B, g) => {
    const [rx, ry, rw, rh] = typeof rect === 'function' ? rect() : rect, e = ioExpo(k), s1 = Math.max(W / rw, H / rh), s = Math.pow(s1, e);
    const cx = rx + rw / 2, cy = ry + rh / 2, px = lerp(cx, W / 2, e), py = lerp(cy, H / 2, e);
    g.save(); g.translate(px, py); g.scale(s, s); g.translate(-cx, -cy); g.drawImage(A, 0, 0); g.restore();
    g.save(); g.beginPath(); g.rect(px - rw / 2 * s, py - rh / 2 * s, rw * s, rh * s); g.clip(); g.globalAlpha = clamp(e * 2.2 - .2); g.drawImage(B, 0, 0); g.restore();
    FX.split = Math.max(FX.split, .008 * Math.sin(Math.PI * e));
  };
  const trPush = (dx, dy) => (k, A, B, g) => { const e = ioExpo(k); g.drawImage(A, -dx * W * e, -dy * H * e); g.drawImage(B, dx * W * (1 - e), dy * H * (1 - e)); FX.split = Math.max(FX.split, .012 * Math.sin(Math.PI * e)); };
  const trWipe = (col = K.lime) => (k, A, B, g) => { const y = easeInOut(k) * (H + 40); g.drawImage(A, 0, 0); g.save(); g.beginPath(); g.rect(0, 0, W, y); g.clip(); g.drawImage(B, 0, 0); g.restore(); g.fillStyle = col; g.fillRect(0, y - 6, W, 12); };
  const trSlats = (n = 8) => (k, A, B, g) => { g.drawImage(A, 0, 0); const sw = W / n; for (let i = 0; i < n; i++) { const kk = easeInOut(seg(k, i * .04, i * .04 + .6)); if (kk <= 0) continue; g.save(); g.beginPath(); g.rect(i * sw, 0, sw + 1, H * kk); g.clip(); g.drawImage(B, 0, 0); g.restore(); } };
  const trGrid = (cols = 9, rows = 16, col = K.lime) => (k, A, B, g) => {
    g.drawImage(A, 0, 0); const cw = W / cols, ch = H / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const d = (c + r) / (cols + rows - 2), kk = seg(k, d * .6, d * .6 + .4); if (kk <= 0) continue;
      const x = c * cw, y = r * ch;
      if (kk < .5) { const s = kk * 2; g.fillStyle = col; g.fillRect(x + cw * (1 - s) / 2, y + ch * (1 - s) / 2, cw * s, ch * s); }
      else { g.save(); g.beginPath(); g.rect(x, y, cw + 1, ch + 1); g.clip(); g.drawImage(B, 0, 0); g.restore(); if (kk < 1) { g.globalAlpha = 2 - kk * 2; g.fillStyle = col; g.fillRect(x, y, cw + 1, ch + 1); g.globalAlpha = 1; } }
    }
  };

  // ---------- 帧调度 ----------
  let SCENES = [], TR = {};
  function renderInto(i, t, buf) {
    ctx = buf.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.clearRect(0, 0, W, H);
    SCENES[i][1](t); ctx = mainCtx;
  }
  function frame(t) {
    FX = { split: 0, slice: 0, seed: 0, grain: .05, vign: .3, flash: 0, flashCol: '#ffffff' };
    let i = 0; while (i + 1 < SCENES.length && t >= SCENES[i + 1][0]) i++;
    const [s0, fn, key] = SCENES[i], tr = TR[key];
    ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (tr && i > 0 && t < s0 + tr[0]) {
      TRANS = true;
      const keep = FX; FX = { ...keep }; renderInto(i - 1, s0 - 1 / FPS, bufA); FX = keep;
      renderInto(i, t, bufB);
      TRANS = false;
      tr[1](seg(t, s0, s0 + tr[0]), bufA, bufB, mainCtx);
    } else {
      fn(t);
      if (!tr && s0 > 0 && t < s0 + 1 / FPS) FX.flash = Math.max(FX.flash, .08);
    }
    if (EP.subtitles !== false) subtitle(t);   // 无旁白的片子在 episode.json 里写 "subtitles": false
    post(t, FX);
  }

  const api = {
    W, H, K, F, LAY, RECT, THREE, RA, glA,
    get ctx() { return ctx; }, get FX() { return FX; }, get TRANS() { return TRANS; },
    txt, letters, measure, bg, line, circle, rrect, starburst, asterisk, arrowNE, arrow, chip, odometer, tape, dropWord, stackWord, glitchIn,
    redacted, thread, barcode, glShot, mark, hud, terrain, tc,
    trIris, trZoom, trPush, trWipe, trSlats, trGrid,
    run(scenes, tr) {
      SCENES = scenes; TR = tr;
      window.renderAt = t => frame(t);
    },
  };
  return api;
}
