// 0805 MLCC 的 3D 层（动效风格：matcap 材质 + 墨线描边）。尺寸按真实比例 L 2.0 × W 1.25 × T 1.25。
// 可拆解：两端 镀锡 / 镍阻挡层 / 铜端电极，中间 陶瓷介质 + 镍内电极叠层（层数为示意）。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function matcap(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const m = c.getContext('2d');
  m.fillStyle = stops[stops.length - 1][1]; m.fillRect(0, 0, 256, 256);
  const g = m.createRadialGradient(92, 80, 4, 128, 128, 132);
  stops.forEach(([s, col]) => g.addColorStop(s, col));
  m.fillStyle = g; m.beginPath(); m.arc(128, 128, 128, 0, Math.PI * 2); m.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const MC = {
  ceramic: matcap([[0, '#fff3dc'], [.25, '#e3c9a2'], [.55, '#b08f69'], [.8, '#6f5840'], [1, '#3e3124']]),
  tin: matcap([[0, '#ffffff'], [.2, '#eef0f2'], [.4, '#b8bcc1'], [.58, '#5d6166'], [.72, '#2a2c2f'], [.86, '#a4a8ad'], [.95, '#e8eaec'], [1, '#606368']]),
  nickel: matcap([[0, '#f2f4f6'], [.3, '#a9adb3'], [.6, '#5f636a'], [.85, '#34373b'], [1, '#22252a']]),
  copper: matcap([[0, '#ffe2c8'], [.25, '#f0a77a'], [.55, '#c06a3c'], [.8, '#6e3418'], [1, '#3a1a0b']]),
  xray: matcap([[0, '#e8f7ff'], [.3, '#7fd3ff'], [.65, '#2f6dff'], [1, '#14206a']]),
};

export function createMLCC(R) {
  const { RA, glA, W, H } = R;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, W / H, .1, 100); cam.position.set(0, 0, 14);
  const root = new THREE.Group(); scene.add(root);
  const INK = new THREE.MeshBasicMaterial({ color: 0x0e0f0e, side: THREE.BackSide });
  const add = (geo, mat, parent = root, outline = 1.035) => {
    const g = new THREE.Group(); const m = new THREE.Mesh(geo, mat); g.add(m);
    if (outline) { const h = new THREE.Mesh(geo, INK); h.scale.setScalar(outline); g.add(h); g.userData.hull = h; }
    parent.add(g); g.userData.mesh = m; return g;
  };
  const L = 2.0, Wd = 1.25, T = 1.25, NL = 9;
  const coreL = L - .16, layerT = (T - .08) / NL;
  const ceramic = new THREE.MeshMatcapMaterial({ matcap: MC.ceramic, transparent: true });
  const elec = new THREE.MeshMatcapMaterial({ matcap: MC.nickel, transparent: true });
  const slabs = [], plates = [];
  for (let i = 0; i < NL; i++) {
    slabs.push(add(new RoundedBoxGeometry(coreL, layerT * .96, Wd - .08, 1, .012), ceramic, root, 1.02));
    if (i < NL - 1) plates.push(add(new THREE.BoxGeometry(coreL - .3, .02, Wd - .24), elec, root, 0));
  }
  const caps = [
    { mc: MC.tin, len: .5, grow: .025, out: 1.5, name: 'Sn' },
    { mc: MC.nickel, len: .485, grow: .0125, out: 1.0, name: 'Ni' },
    { mc: MC.copper, len: .47, grow: 0, out: .52, name: 'Cu' },
  ].map(c => ({ ...c, mat: new THREE.MeshMatcapMaterial({ matcap: c.mc, transparent: true }),
    parts: [-1, 1].map(side => { const g = add(new RoundedBoxGeometry(c.len, T - .04 + c.grow * 2, Wd - .04 + c.grow * 2, 2, .07), null, root, 1.03); g.userData.side = side; return g; }) }));
  caps.forEach(c => c.parts.forEach(p => { p.userData.mesh.material = c.mat; }));

  const v = new THREE.Vector3();
  const api = {
    // o: { x, y, s, rx, ry, rz, explode, xray, alpha }
    pose(o) {
      root.position.set(o.x ?? 0, o.y ?? 0, 0); root.scale.setScalar(o.s ?? 1);
      root.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
      const e = o.explode ?? 0, x = o.xray ?? 0, a = o.alpha ?? 1;
      ceramic.opacity = a * (1 - .8 * x); ceramic.depthWrite = x < .5;
      elec.matcap = x > .3 ? MC.xray : MC.nickel; elec.opacity = a;
      slabs.forEach((s, i) => { s.userData.hull.visible = x < .3; });
      const yAt = (i, off) => -T / 2 + .04 + layerT * (i + off);
      const spread = i => 1 + 1.25 * Math.min(1, Math.max(0, e * 1.6 - i * .07));
      slabs.forEach((s, i) => s.position.set(0, yAt(i, .5) * spread(i), 0));
      plates.forEach((p, i) => p.position.set(i % 2 ? .15 : -.15, yAt(i, 1) * spread(i), 0));
      caps.forEach(c => {
        const inset = .025 - c.grow;
        c.mat.opacity = a * (1 - .75 * x); c.mat.depthWrite = x < .5;
        c.parts.forEach(p => { p.position.set(p.userData.side * (L / 2 - inset - c.len / 2 + c.out * e), 0, 0); p.userData.hull.visible = x < .3; });
      });
      root.updateMatrixWorld(true);
    },
    render() { RA.setClearColor(0x000000, 0); RA.clear(); RA.render(scene, cam); return glA; },
    // 零件在屏幕上的位置（用于引线标注）
    screen(part) {
      const obj = part === 'core' ? slabs[NL - 1] : caps.find(c => c.name === part).parts.map(p => p).sort((a, b) => toS(a)[0] - toS(b)[0])[0];
      return toS(obj);
    },
  };
  function toS(obj) { obj.getWorldPosition(v); v.project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }
  return api;
}
