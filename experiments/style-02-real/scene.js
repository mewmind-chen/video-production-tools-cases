// 写实料盘场景：照着用户提供的实拍照片复刻。
// 7 英寸（178 mm）乳白半透明聚苯乙烯料盘，四个窗口、三叶形轴孔、轴心防滑纹、PS 回收标记；
// 白色纸带卷绕；两张 EIAJ C-3 格式标签（品牌与编号为虚构）；外层缠绕膜。
// 光照：Poly Haven CC0 环境贴图（经 @pmndrs/assets）+ 一盏投影的主光。
import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makePost } from '/pipeline/reel/post.js';

const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const REEL_R = 89, FL_T = 1.3, W_IN = 9.4, WOUND_R = 76, HUB_R = 31;

function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// 高度图 → 法线图（Sobel）
function normalFromHeight(hc, strength = 2) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas'); out.width = w; out.height = h; const g = out.getContext('2d'), img = g.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    img.data[i] = (-dx / l * .5 + .5) * 255; img.data[i + 1] = (dy / l * .5 + .5) * 255; img.data[i + 2] = (1 / l * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return out;
}
function code128(g, x, y, w, h, seed) { let cx = x; g.fillStyle = '#111'; for (let j = 0; cx < x + w - 4; j++) { const bw = 2 + Math.floor(hash(seed * 31 + j) * 4) * 2; if (hash(seed * 7 + j) > .45) g.fillRect(cx, y, bw, h); cx += bw + 2; } }

export async function createScene(R, opts = {}) {
  const { W, H } = R;
  const canvasEl = document.createElement('canvas'); canvasEl.width = W; canvasEl.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opts.exposure ?? 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const hdr = (await import(`/pipeline/node_modules/@pmndrs/assets/hdri/${opts.hdri || 'apartment'}.exr.js`)).default;
  const env = await new EXRLoader().loadAsync(hdr); env.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(env).texture; scene.environmentIntensity = opts.envI ?? .45;
  scene.background = new THREE.Color('#3b3d3e');
  const cam = new THREE.PerspectiveCamera(opts.fov || 58, W / H, .5, 6000);

  const sun = new THREE.DirectionalLight('#fff6ea', 1.1); sun.position.set(-420, 480, 160); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -260, right: 260, top: 260, bottom: -260, near: 50, far: 1500 }); sun.shadow.radius = 8; sun.shadow.bias = -.0005;
  scene.add(sun);

  // ---------- 下面一垛同样包着膜的料盘（背景）----------
  const under = new THREE.Mesh(new THREE.CylinderGeometry(REEL_R + 2, REEL_R + 2, 60, 96), new THREE.MeshPhysicalMaterial({ color: '#56595b', roughness: .55 }));
  under.position.set(10, -31, -6); under.receiveShadow = true; scene.add(under);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: '#2f3132', roughness: .85 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -61; ground.receiveShadow = true; scene.add(ground);

  // ---------- 料盘（平放，轴向 = +y）----------
  const reel = new THREE.Group(); scene.add(reel);
  const plastic = new THREE.MeshPhysicalMaterial({ color: '#e4e6e3', roughness: .42, clearcoat: .35, clearcoatRoughness: .3, sheen: .25, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide });
  // 侧板：外圆 + 四个窗口（0°/90°/180°/270°，各约 56°）+ 三叶形轴孔
  const fl = new THREE.Shape(); fl.absarc(0, 0, REEL_R, 0, Math.PI * 2, false);
  const win = (cDeg, span, r0, r1) => {
    const a0 = (cDeg - span / 2) * Math.PI / 180, a1 = (cDeg + span / 2) * Math.PI / 180, p = new THREE.Path(), N = 24;
    for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N; i ? p.lineTo(Math.cos(a) * r1, Math.sin(a) * r1) : p.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); }
    for (let i = 0; i <= N; i++) { const a = a1 - (a1 - a0) * i / N; p.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
    p.closePath(); return p;
  };
  const WIN = [0, 90, 180, 270].map(d => win(d, 46, 42, 78));
  WIN.forEach(w => fl.holes.push(w));
  const trefoil = new THREE.Path(); { const N = 96; for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, r = 6.8 + 2.6 * Math.max(0, Math.cos(3 * a)) ** 3; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? trefoil.lineTo(x, y) : trefoil.moveTo(x, y); } }
  { const h = new THREE.Path(); h.absarc(0, 0, 36.5, 0, Math.PI * 2, true); fl.holes.push(h); }
  const flGeo = new THREE.ExtrudeGeometry(fl, { depth: FL_T, bevelEnabled: true, bevelThickness: .25, bevelSize: .35, bevelSegments: 2, curveSegments: 48 });
  flGeo.rotateX(-Math.PI / 2);
  const flTop = new THREE.Mesh(flGeo, plastic); flTop.position.y = W_IN / 2; flTop.castShadow = flTop.receiveShadow = true; reel.add(flTop);
  const flBot = new THREE.Mesh(flGeo, plastic); flBot.position.y = -W_IN / 2 - FL_T; flBot.receiveShadow = true; reel.add(flBot);
  // 外缘加厚唇边、窗口外框筋、轴心凸台与防滑纹
  const lip = new THREE.Mesh(new THREE.TorusGeometry(REEL_R - 1.2, 1.3, 12, 160), plastic); lip.rotation.x = Math.PI / 2; lip.position.y = W_IN / 2 + FL_T; reel.add(lip);
  const ring = (r, tube, y) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 140), plastic); m.rotation.x = Math.PI / 2; m.position.y = y; reel.add(m); };
  ring(81.5, .6, W_IN / 2 + FL_T + .2); ring(37.5, .9, W_IN / 2 + FL_T + .3); ring(23, .7, W_IN / 2 + FL_T + .9);
  // 轴心：凹下去的灰色圆槽（槽壁一圈防滑纹），上面压着白色十字板，中心三叶形轴孔
  const well = new THREE.Mesh(new THREE.CircleGeometry(36.5, 96), new THREE.MeshPhysicalMaterial({ color: '#b9bbba', roughness: .6 }));
  well.rotation.x = -Math.PI / 2; well.position.y = W_IN / 2 + FL_T - .9; reel.add(well);
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 1.0, 2.2), new THREE.MeshPhysicalMaterial({ color: '#a7a9a8', roughness: .6 }), 120), d0 = new THREE.Object3D();
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; d0.position.set(Math.cos(a) * 33.5, W_IN / 2 + FL_T - .6, Math.sin(a) * 33.5); d0.rotation.set(0, -a, 0); d0.updateMatrix(); ribs.setMatrixAt(i, d0.matrix); }
  reel.add(ribs);
  const cross = new THREE.Shape(); { const aw = 5.2, al = 36, cr = 15; cross.moveTo(aw, cr);
    const pts = [[aw, al], [-aw, al], [-aw, cr], [-cr, aw], [-al, aw], [-al, -aw], [-cr, -aw], [-aw, -cr], [-aw, -al], [aw, -al], [aw, -cr], [cr, -aw], [al, -aw], [al, aw], [cr, aw], [aw, cr]];
    pts.forEach(([x, y]) => cross.lineTo(x, y)); }
  cross.holes.push(trefoil);
  const crossGeo = new THREE.ExtrudeGeometry(cross, { depth: 1.6, bevelEnabled: true, bevelThickness: .3, bevelSize: .4, bevelSegments: 2 }).rotateX(-Math.PI / 2);
  const crossM = new THREE.Mesh(crossGeo, plastic); crossM.position.y = W_IN / 2 + FL_T - .9; crossM.castShadow = true; crossM.rotation.y = Math.PI / 4 * 0; reel.add(crossM);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(15.5, 1.1, 10, 96), plastic); innerRing.rotation.x = Math.PI / 2; innerRing.position.y = W_IN / 2 + FL_T + .4; reel.add(innerRing);
  // PS 回收标记（压印，用法线贴图）
  const psH = canvas(256, 256, (g, w) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, w); g.strokeStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 30); g.lineTo(220, 190); g.lineTo(36, 190); g.closePath(); g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 74px Inter'; g.textAlign = 'center'; g.fillText('6', 128, 165); g.font = 'bold 60px Inter'; g.fillText('PS', 128, 248); });
  const psN = tex(normalFromHeight(psH, 3), false);
  for (const [a, rr] of [[38, 66], [-62, 64]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshPhysicalMaterial({ color: '#f1f2f0', roughness: .42, clearcoat: .35, normalMap: psN, transparent: true, opacity: .9 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = (a - 90) * Math.PI / 180; const ar = a * Math.PI / 180; m.position.set(Math.cos(ar) * rr, W_IN / 2 + FL_T + .26, -Math.sin(ar) * rr); reel.add(m);
  }

  // ---------- 白色纸带卷绕层 ----------
  const paperFace = canvas(2048, 2048, (g, w) => {
    const c = w / 2, s = c / WOUND_R;
    for (let r = WOUND_R; r > HUB_R; r -= .3) { const edge = Math.floor(r / .3) % 2 === 0, v = edge ? 176 + Math.floor(hash(Math.floor(r * 10)) * 20) : 214 + Math.floor(hash(Math.floor(r * 13)) * 14); g.fillStyle = `rgb(${v},${v - 4},${v - 14})`; g.beginPath(); g.arc(c, c, r * s, 0, Math.PI * 2); g.fill(); }
  });
  const pack = new THREE.Mesh(new THREE.CylinderGeometry(WOUND_R, WOUND_R, W_IN - .4, 160), [
    new THREE.MeshStandardMaterial({ color: '#e9e6dc', roughness: .8 }), new THREE.MeshStandardMaterial({ map: tex(paperFace), roughness: .85 }), new THREE.MeshStandardMaterial({ map: tex(paperFace), roughness: .85 })]);
  pack.castShadow = true; reel.add(pack);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(HUB_R, HUB_R, W_IN, 64), new THREE.MeshPhysicalMaterial({ color: '#e7e8e6', roughness: .5 })); reel.add(hub);

  // ---------- 标签（EIAJ C-3 格式；品牌、料号、序列号为虚构）----------
  const PX = 22;
  function labelCanvas(wmm, hmm, draw) { return canvas(wmm * PX, hmm * PX, (g, w, h) => { g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h); draw(g, w, h); }); }
  const L1 = labelCanvas(104, 54, (g, w, h) => {
    g.fillStyle = '#151515'; const F = (sz, wt = 500) => `${wt} ${sz}px "DejaVu Sans Mono"`;
    const row = (k, v, y) => { g.font = F(66); g.fillText(k, 70, y); g.font = F(78); g.fillText(v, 400, y); };
    row('⟨P/N⟩', 'S1H1C105A207', 130); row('⟨QTY⟩', '4,000', 222); row('⟨S/N⟩', '2617408K3521', 314);
    g.font = F(54); g.fillText('RoHS', w - 260, 330);
    g.font = F(68); g.fillText('⟨3N⟩1S1H1C105A207 4000', 60, 404); code128(g, 70, 418, 1600, 88, 21);
    g.fillText('⟨3N⟩2 2617408K3521 104041', 60, 600); code128(g, 70, 614, 1600, 88, 22);
    g.font = F(84); g.fillText('CE SCK107 BJ105KAFT', 60, 800); g.font = F(54); g.fillText('(M)', 80, 870);
    g.font = F(40); g.fillText('EIAJ C-3', 60, 960); g.fillText('SIGNAL CERAMICS', 520, 960); g.fillText('MADE IN', 1100, 970); g.fillText('XX', 1380, 975);
    g.fillText('GTS13S2', w - 360, 960); g.fillText('806713302', w - 370, 1020);
  });
  const L2 = labelCanvas(90, 40, (g, w) => {
    g.fillStyle = '#151515'; const F = (sz, wt = 500) => `${wt} ${sz}px "DejaVu Sans Mono"`;
    code128(g, 120, 30, 1500, 110, 31);
    g.font = F(80); g.fillText('⟨D⟩ CE SCK107 BJ105KAFT', 60, 250); g.fillText('⟨L⟩ 6KQM418230TR', 60, 352); g.fillText('R1-017-W', w - 520, 352);
    g.fillText('⟨Q⟩ 4,000', 60, 454); g.font = F(92); g.fillText('L726104483', w - 680, 460);
    code128(g, 120, 482, 1500, 92, 32);
    g.font = '800 62px Inter'; g.fillText('SIGNAL CERAMICS', 70, 690); g.font = F(54); g.fillText('017', 760, 690); g.fillText('R-Q-1905-D', w - 500, 690);
  });
  const labelMat = c => new THREE.MeshPhysicalMaterial({ map: tex(c), roughness: .38, clearcoat: .55, clearcoatRoughness: .25 });
  const lab1 = new THREE.Mesh(new THREE.PlaneGeometry(104, 54), labelMat(L1)); lab1.rotation.x = -Math.PI / 2; lab1.position.set(-2, W_IN / 2 + FL_T + .45, -50); lab1.rotation.z = .01; reel.add(lab1);
  const lab2 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), labelMat(L2)); lab2.rotation.x = -Math.PI / 2; lab2.position.set(4, W_IN / 2 + FL_T + .45, 58); lab2.rotation.z = -.005; reel.add(lab2);
  for (const l of [lab1, lab2]) l.receiveShadow = true;

  // ---------- 缠绕膜：带长条褶皱的透明亮面层 ----------
  const filmH = canvas(1024, 1024, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = hash(i) * h, a = (hash(i * 3) - .5) * .5, len = 300 + hash(i * 5) * 900, x = hash(i * 7) * w;
      g.save(); g.translate(x, y); g.rotate(a); const gr = g.createLinearGradient(0, -14, 0, 14);
      const v = hash(i * 9) > .5 ? 255 : 0; gr.addColorStop(0, 'rgba(128,128,128,0)'); gr.addColorStop(.5, `rgba(${v},${v},${v},${.25 + hash(i * 11) * .35})`); gr.addColorStop(1, 'rgba(128,128,128,0)');
      g.fillStyle = gr; g.fillRect(-len / 2, -14, len, 28); g.restore();
    }
  });
  const filmN = tex(normalFromHeight(filmH, 6), false); filmN.wrapS = filmN.wrapT = THREE.RepeatWrapping;
  const film = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 1, 1), new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, specularIntensity: 1,
    normalMap: filmN, normalScale: new THREE.Vector2(1.4, 1.4), transparent: true, opacity: .35, depthWrite: false, envMapIntensity: 3.2 }));
  film.rotation.x = -Math.PI / 2; film.position.y = -20; scene.add(film);   // 默认包在下面那垛上
  const filmTop = film.clone(); filmTop.material = film.material.clone(); filmTop.material.opacity = opts.filmOnReel ?? .12; filmTop.position.y = W_IN / 2 + FL_T + 2.5; scene.add(filmTop);

  const post = makePost(renderer, scene, cam, W, H, { ssaa: 1, ao: false });
  post.bloom.strength = .12; post.bloom.threshold = 1.6;
  post.vig.uniforms.amt.value = .38; post.vig.uniforms.contrast.value = .06; post.vig.uniforms.warm.value = .12;

  // 标签贴图像素坐标 → 世界坐标（HUD 目标框用）
  const LBL = [{ m: lab1, w: 104, h: 54 }, { m: lab2, w: 90, h: 40 }];
  const labelPoint = (i, px, py) => { const L = LBL[i]; return L.m.localToWorld(new THREE.Vector3(px / PX - L.w / 2, L.h / 2 - py / PX, .3)); };
  return {
    labelPoint, scene, cam, reel, labels: [lab1, lab2], film, filmTop, sun, post, renderer, canvas: canvasEl,
    // c: { pos:[x,y,z], tgt:[x,y,z], up?:[..], focus?, k? }
    render(c) {
      cam.position.set(...c.pos); cam.up.set(...(c.up || [0, 0, -1])); cam.lookAt(new THREE.Vector3(...c.tgt));
      if (c.fov) { cam.fov = c.fov; }
      cam.near = Math.max(.2, c.near || 1); cam.far = 6000; cam.updateProjectionMatrix();
      const d = cam.position.distanceTo(new THREE.Vector3(...c.tgt));
      post.dof.focus = c.focus || d; post.dof.aper = (c.k ?? 4) * (c.focus || d); post.dof.maxCoc = 12;
      post.composer.render();
      return canvasEl;
    },
  };
}
