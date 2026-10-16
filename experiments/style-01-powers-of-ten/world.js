// 一个连续的 3D 世界（真实毫米尺度）：一整墙 7 英寸料盘 → 中心那卷引出的 8 mm 载带 → 口袋里的 0805 MLCC → 60 层内电极。
// 动效风格：matcap 材质 + 墨线描边。镜头只有一条连续路径（关键帧插值，距离按对数插值，跨越 5 个数量级）。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const expoInOut = x => { x = clamp(x); return x === 0 ? 0 : x === 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2; };
const backOut = x => { x = clamp(x); const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function matcap(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const m = c.getContext('2d');
  m.fillStyle = stops[stops.length - 1][1]; m.fillRect(0, 0, 256, 256);
  const g = m.createRadialGradient(92, 80, 4, 128, 128, 132);
  stops.forEach(([s, col]) => g.addColorStop(s, col));
  m.fillStyle = g; m.beginPath(); m.arc(128, 128, 128, 0, Math.PI * 2); m.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const MC = {
  blue: matcap([[0, '#c9ceff'], [.3, '#5560ff'], [.65, '#2f3cff'], [1, '#141a80']]),
  ink: matcap([[0, '#6a6d6a'], [.35, '#2a2c2a'], [1, '#0b0c0b']]),
  lime: matcap([[0, '#fbffd8'], [.35, '#e4f86a'], [.75, '#c4dc20'], [1, '#6f7f08']]),
  cream: matcap([[0, '#ffffff'], [.5, '#f1eee6'], [1, '#b9b5aa']]),
  ceramic: matcap([[0, '#fff3dc'], [.25, '#e3c9a2'], [.55, '#b08f69'], [.8, '#6f5840'], [1, '#3e3124']]),
  tin: matcap([[0, '#ffffff'], [.2, '#eef0f2'], [.4, '#b8bcc1'], [.58, '#5d6166'], [.72, '#2a2c2f'], [.86, '#a4a8ad'], [.95, '#e8eaec'], [1, '#606368']]),
  nickel: matcap([[0, '#f2f4f6'], [.3, '#a9adb3'], [.6, '#5f636a'], [.85, '#34373b'], [1, '#22252a']]),
  copper: matcap([[0, '#ffe2c8'], [.25, '#f0a77a'], [.55, '#c06a3c'], [.8, '#6e3418'], [1, '#3a1a0b']]),
  xray: matcap([[0, '#ffffff'], [.25, '#9fe0ff'], [.6, '#2f6dff'], [1, '#14206a']]),
  tape: matcap([[0, '#5a5c5e'], [.3, '#232425'], [1, '#080808']]),
};
const INK = new THREE.MeshBasicMaterial({ color: 0x0e0f0e, side: THREE.BackSide });

// ---------- 尺寸（mm）----------
const REEL_R = 89, HUB_R = 30, W_IN = 8.4, FL_T = 1.4, WOUND_R = 72, PITCH_X = 205, PITCH_Y = 205;
const COLS = 9, ROWS = 19;
const TAPE_Y = -WOUND_R - .3, TAPE_Z0 = 6, TAPE_LEN = 720, PITCH = 4;
const POCKET_X = -4 + 1.75 + 3.5, HOLE_X = -4 + 1.75;
const CHIP = { L: 2.0, W: 1.25, T: 1.25 };
export const HERO_K = 70;
export const HERO_Z = TAPE_Z0 + 2 + HERO_K * PITCH;
const NL = 60;   // 介质层数（示意；真实 10 µF 0805 有数百层）

export function createWorld(R) {
  const { RA, glA, W, H } = R;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, W / H, .01, 20000);
  const dummy = new THREE.Object3D(), M4 = new THREE.Matrix4(), S4 = new THREE.Matrix4();

  // 一组实例化网格 + 同样矩阵、略放大的墨线外壳
  function inst(geo, mat, n, outline = 1.03) {
    const m = new THREE.InstancedMesh(geo, mat, n); scene.add(m);
    let h = null; if (outline) { h = new THREE.InstancedMesh(geo, INK, n); scene.add(h); }
    return { m, h, set(i, matrix, s = outline) { m.setMatrixAt(i, matrix); if (h) { S4.makeScale(s, s, s); M4.multiplyMatrices(matrix, S4); h.setMatrixAt(i, M4); } },
      done() { m.instanceMatrix.needsUpdate = true; if (h) h.instanceMatrix.needsUpdate = true; } };
  }

  // ---------- 料盘墙 ----------
  const NR = COLS * ROWS, HERO_R = Math.floor(NR / 2);
  const flangeAlpha = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), s = 256 / REEL_R;
    g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#fff'; g.beginPath(); g.arc(256, 256, 255, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#000';
    for (const d of [30, 150, 270]) { const a0 = (d - 26) * Math.PI / 180, a1 = (d + 26) * Math.PI / 180; g.beginPath(); g.arc(256, 256, 80 * s, -a1, -a0); g.arc(256, 256, 38 * s, -a0, -a1, true); g.closePath(); g.fill(); }
    const t = new THREE.CanvasTexture(c); return t;
  })();
  // 侧板：真正挖出三个窗口和中心孔的几何体（透过窗口看到黑色卷带）
  const flShape = new THREE.Shape(); flShape.absarc(0, 0, REEL_R, 0, Math.PI * 2, false);
  for (const d of [30, 150, 270]) {
    const a0 = (d - 26) * Math.PI / 180, a1 = (d + 26) * Math.PI / 180, h = new THREE.Path();
    h.absarc(0, 0, 80, a0, a1, false); h.absarc(0, 0, 38, a1, a0, true); h.closePath(); flShape.holes.push(h);
  }
  { const h = new THREE.Path(); h.absarc(0, 0, HUB_R + .5, 0, Math.PI * 2, true); flShape.holes.push(h); }
  const flangeGeo = new THREE.ExtrudeGeometry(flShape, { depth: FL_T, bevelEnabled: false, curveSegments: 40 }).translate(0, 0, -FL_T / 2);
  const flangeMat = new THREE.MeshMatcapMaterial({ matcap: MC.blue });
  const flF = inst(flangeGeo, flangeMat, NR), flB = inst(flangeGeo, flangeMat, NR, 0);
  const pack = inst(new THREE.CylinderGeometry(WOUND_R, WOUND_R, W_IN - .3, 64).rotateX(Math.PI / 2), new THREE.MeshMatcapMaterial({ matcap: MC.ink }), NR, 0);
  const hub = inst(new THREE.CylinderGeometry(HUB_R, HUB_R, W_IN + 2 * FL_T + 1.6, 48).rotateX(Math.PI / 2), new THREE.MeshMatcapMaterial({ matcap: MC.lime }), NR, 1.02);
  const labelTex = (() => {
    const c = document.createElement('canvas'); c.width = 540; c.height = 340; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 540, 340); g.fillStyle = '#111'; g.font = 'bold 34px "JetBrains Mono"'; g.fillText('MLCC 0805', 24, 52);
    let x = 24; for (let j = 0; x < 360; j++) { const w = 3 + Math.floor(hash(j) * 4) * 3; if (hash(j + 9) > .45) g.fillRect(x, 80, w, 110); x += w + 3; }
    g.font = 'bold 26px "JetBrains Mono"'; g.fillText('QTY 4000', 24, 240); g.fillText('D/C 2541', 24, 290);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (hash(i * 13 + j * 7) > .5) g.fillRect(400 + i * 14, 80 + j * 14, 14, 14);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const labels = new THREE.InstancedMesh(new THREE.PlaneGeometry(54, 34), new THREE.MeshBasicMaterial({ map: labelTex }), NR); scene.add(labels);
  const reelPos = [], reelDist = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = (c - (COLS - 1) / 2) * PITCH_X, y = (r - (ROWS - 1) / 2) * PITCH_Y;
    reelPos.push([x, y]); reelDist.push(Math.hypot(x, y));
  }
  const col = new THREE.Color();

  // ---------- 载带（沿 +z 伸向镜头）----------
  const tileW = 256, tileH = 512, alpha = (() => {
    const c = document.createElement('canvas'); c.width = tileW; c.height = tileH; const g = c.getContext('2d'), u = tileW / 8, v = tileH / 4;
    g.fillStyle = '#fff'; g.fillRect(0, 0, tileW, tileH); g.fillStyle = '#000';
    for (const vy of [0, tileH]) { g.beginPath(); g.arc((HOLE_X + 4) * u, vy, .75 * u, 0, Math.PI * 2); g.fill(); }
    g.fillRect((POCKET_X + 4 - 1.175) * u, tileH / 2 - .775 * v, 2.35 * u, 1.55 * v);
    const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; t.flipY = false; return t;
  })();
  const tapeGeo = new THREE.PlaneGeometry(8, TAPE_LEN).rotateX(-Math.PI / 2);
  { const uv = tapeGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * TAPE_LEN / PITCH); }
  const tapeMat = new THREE.MeshMatcapMaterial({ matcap: MC.tape, alphaMap: alpha, alphaTest: .5, side: THREE.DoubleSide });
  const tape = new THREE.Mesh(tapeGeo, tapeMat); tape.position.set(0, TAPE_Y, TAPE_Z0 + TAPE_LEN / 2); scene.add(tape);
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(5.4, TAPE_LEN).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .07 }));
  cover.position.set(POCKET_X, TAPE_Y + .06, TAPE_Z0 + TAPE_LEN / 2); scene.add(cover);
  const NT = Math.floor(TAPE_LEN / PITCH);
  const pockets = new THREE.InstancedMesh(new THREE.BoxGeometry(2.35, 1.45, 1.55), new THREE.MeshMatcapMaterial({ matcap: MC.ink, side: THREE.BackSide }), NT); scene.add(pockets);
  const chipBody = inst(new RoundedBoxGeometry(CHIP.L - .8, CHIP.T * .96, CHIP.W * .96, 2, .05), new THREE.MeshMatcapMaterial({ matcap: MC.ceramic }), NT, 0);
  const chipCapGeo = new RoundedBoxGeometry(.42, CHIP.T, CHIP.W, 2, .08);
  const capA = inst(chipCapGeo, new THREE.MeshMatcapMaterial({ matcap: MC.tin }), NT, 0), capB = inst(chipCapGeo, new THREE.MeshMatcapMaterial({ matcap: MC.tin }), NT, 0);
  for (let k = 0; k < NT; k++) {
    const z = TAPE_Z0 + 2 + k * PITCH;
    dummy.position.set(POCKET_X, TAPE_Y - .72, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); pockets.setMatrixAt(k, dummy.matrix);
  }

  // ---------- 主角 MLCC：60 层 ----------
  const hero = new THREE.Group(); scene.add(hero);
  const grain = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(90,70,40,${.05 + hash(i) * .12})`; g.beginPath(); g.arc(hash(i * 3) * 256, hash(i * 7) * 256, 1 + hash(i * 11) * 4, 0, Math.PI * 2); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
  })();
  const coreL = CHIP.L - .16, layerT = (CHIP.T - .08) / NL;
  const slabMat = new THREE.MeshMatcapMaterial({ matcap: MC.ceramic, map: grain, transparent: true });
  const plateMat = new THREE.MeshMatcapMaterial({ matcap: MC.nickel, transparent: true });
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(coreL, layerT * .82, CHIP.W - .08), slabMat, NL); hero.add(slabs);
  const plates = new THREE.InstancedMesh(new THREE.BoxGeometry(coreL - .3, layerT * .16, CHIP.W - .22), plateMat, NL - 1); hero.add(plates);
  const caps = [['tin', .5, .025, 1.6], ['nickel', .485, .0125, 1.1], ['copper', .47, 0, .6]].map(([m, len, grow, out]) => {
    const mat = new THREE.MeshMatcapMaterial({ matcap: MC[m], transparent: true });
    const geo = new RoundedBoxGeometry(len, CHIP.T - .04 + grow * 2, CHIP.W - .04 + grow * 2, 2, .07);
    const parts = [-1, 1].map(side => { const g = new THREE.Group(), me = new THREE.Mesh(geo, mat), hl = new THREE.Mesh(geo, INK); hl.scale.setScalar(1.035); g.add(me, hl); g.userData = { side, hl }; hero.add(g); return g; });
    return { mat, len, grow, out, parts };
  });

  const v = new THREE.Vector3();
  return {
    scene, cam,
    // 世界状态：wall（墙弹出 0..1）、spin、heroLift、xray、explode、fan、verify、bg
    update(t, s) {
      // 料盘墙：从中心向外波浪式弹出；每拍转 30°（卡拍）
      const beat = t / .5, step = Math.floor(beat) + easeOut((beat % 1) * 3);
      for (let i = 0; i < NR; i++) {
        const [x, y] = reelPos[i], isHero = i === HERO_R;
        const k = isHero ? s.heroPop : backOut(clamp(s.wall * 1.8 - reelDist[i] / 1400));
        const rot = (isHero ? 0 : hash(i) * 6) + step * .52 * (i % 2 ? 1 : -1) * (isHero ? s.heroSpin : 1);
        dummy.position.set(x, y, 0); dummy.rotation.set(0, 0, rot); dummy.scale.setScalar(Math.max(1e-4, k)); dummy.updateMatrix();
        const base = dummy.matrix.clone();
        dummy.position.set(0, 0, W_IN / 2 + FL_T / 2); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); flF.set(i, M4.multiplyMatrices(base, dummy.matrix).clone());
        dummy.position.set(0, 0, -(W_IN / 2 + FL_T / 2)); dummy.updateMatrix(); flB.set(i, M4.multiplyMatrices(base, dummy.matrix).clone());
        pack.set(i, base); hub.set(i, base);
        dummy.position.set(0, 55, W_IN / 2 + FL_T + .1); dummy.updateMatrix(); labels.setMatrixAt(i, M4.multiplyMatrices(base, dummy.matrix));
        const vk = clamp(s.verify * 2.2 - reelDist[i] / 1200);
        labels.setColorAt(i, col.set('#ffffff').lerp(new THREE.Color('#DDF53D'), vk));
      }
      for (const g of [flF, flB, pack, hub]) g.done();
      labels.instanceMatrix.needsUpdate = true; if (labels.instanceColor) labels.instanceColor.needsUpdate = true;

      // 载带上的 MLCC（主角那一格在升起后隐藏）
      const tapeK = s.tape;
      tape.visible = cover.visible = pockets.visible = tapeK > 0;
      for (let k = 0; k < NT; k++) {
        const z = TAPE_Z0 + 2 + k * PITCH, pop = clamp(tapeK * 3 - k / NT * 2), gone = k === HERO_K && s.heroLift > 0.001;
        const sc = gone ? 1e-4 : Math.max(1e-4, backOut(pop));
        const y = TAPE_Y - 1.45 + CHIP.T / 2 + .12;
        for (const [g, dx] of [[chipBody, 0], [capA, -(CHIP.L / 2 - .21)], [capB, CHIP.L / 2 - .21]]) {
          dummy.position.set(POCKET_X + dx * sc, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); g.set(k, dummy.matrix);
        }
      }
      chipBody.done(); capA.done(); capB.done();

      // 主角 MLCC
      hero.visible = s.heroLift > 0.001;
      if (hero.visible) {
        const base = new THREE.Vector3(POCKET_X, TAPE_Y - 1.45 + CHIP.T / 2 + .12, HERO_Z);
        hero.position.copy(base).add(new THREE.Vector3(0, 6 * easeOut(s.heroLift), 0));
        hero.rotation.set(0, s.heroYaw, 0);
        const x = s.xray, e = s.explode;
        slabMat.opacity = 1 - .7 * x; slabMat.depthWrite = x < .5;
        plateMat.matcap = x > .3 ? MC.xray : MC.nickel;
        for (let i = 0; i < NL; i++) {
          const y0 = -CHIP.T / 2 + .04 + layerT * (i + .5), wave = easeInOut(clamp(e * 1.6 - i / NL * .6));
          const yy = y0 * (1 + 7 * wave), fan = (i - NL / 2) / NL * .9 * s.fan * wave;
          dummy.position.set(0, yy, 0); dummy.rotation.set(fan, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); slabs.setMatrixAt(i, dummy.matrix);
          if (i < NL - 1) { const y1 = (-CHIP.T / 2 + .04 + layerT * (i + 1)) * (1 + 7 * wave); dummy.position.set(i % 2 ? .15 : -.15, y1, 0); dummy.updateMatrix(); plates.setMatrixAt(i, dummy.matrix); }
        }
        slabs.instanceMatrix.needsUpdate = plates.instanceMatrix.needsUpdate = true;
        caps.forEach(c => {
          const inset = .025 - c.grow; c.mat.opacity = 1 - .75 * x; c.mat.depthWrite = x < .5;
          c.parts.forEach(p => { p.position.set(p.userData.side * (CHIP.L / 2 - inset - c.len / 2 + c.out * e * 2.2), 0, 0); p.userData.hl.visible = x < .3; });
        });
      }
      scene.background = s.bg;
    },
    // 层间缝隙的世界坐标（镜头钻进去的目标）
    gapPoint(s, i = NL / 2) {
      const base = new THREE.Vector3(POCKET_X, TAPE_Y - 1.45 + CHIP.T / 2 + .12 + 6 * easeOut(s.heroLift), HERO_Z);
      const wave = easeInOut(clamp(s.explode * 1.6 - i / NL * .6)), y = (-CHIP.T / 2 + .04 + layerT * (i + .75)) * (1 + 7 * wave);
      return base.add(new THREE.Vector3(0, y, 0));
    },
    heroBase() { return new THREE.Vector3(POCKET_X, TAPE_Y - 1.45 + CHIP.T / 2 + .12, HERO_Z); },
    render(c) {
      const dir = new THREE.Vector3(Math.cos(c.pitch) * Math.sin(c.yaw), Math.sin(c.pitch), Math.cos(c.pitch) * Math.cos(c.yaw));
      cam.position.copy(c.tgt).addScaledVector(dir, c.dist); cam.up.set(0, 1, 0); cam.lookAt(c.tgt);
      if (c.roll) cam.rotateZ(c.roll);
      cam.near = Math.max(.002, c.dist * .01); cam.far = Math.max(50, c.dist * 50); cam.updateProjectionMatrix();
      RA.setClearColor(0x000000, 0); RA.clear(); RA.render(scene, cam); return glA;
    },
    fieldMM(c) { return 2 * c.dist * Math.tan(15 * Math.PI / 180); },
    TAPE_Y, TAPE_Z0, HERO_Z, POCKET_X,
  };
}
