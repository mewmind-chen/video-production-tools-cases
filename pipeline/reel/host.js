// AI 主播形象：一个随配音音量跳动、会眨眼的光球。原创形象，不使用任何第三方商标。
export function initHost(canvas, TL) {
  const g = canvas.getContext('2d');
  const S = canvas.width, C = S / 2;
  const env = TL.env || [];
  const level = t => {
    // 取前后几帧平滑，避免抖动
    const i = Math.floor(t * 30); let s = 0, n = 0;
    for (let k = -2; k <= 1; k++) { const v = env[i + k]; if (v != null) { s += v; n++; } }
    return n ? s / n : 0;
  };

  return function draw(t, scale = 1) {
    const e = level(t);
    g.clearRect(0, 0, S, S);
    g.save(); g.translate(C, C); g.scale(scale, scale); g.translate(-C, -C);

    // 外圈光晕
    const glow = g.createRadialGradient(C, C, S * 0.12, C, C, S * 0.5);
    glow.addColorStop(0, `rgba(221,245,61,${0.35 + e * 0.35})`); glow.addColorStop(1, 'rgba(221,245,61,0)');
    g.fillStyle = glow; g.fillRect(0, 0, S, S);

    // 声波刻度
    const bars = 36;
    for (let k = 0; k < bars; k++) {
      const a = (k / bars) * Math.PI * 2 + t * 0.4;
      const wob = 0.5 + 0.5 * Math.sin(t * 9 + k * 1.7) * Math.sin(t * 5.3 + k * 0.6);
      const len = S * (0.02 + e * 0.07 * (0.4 + wob));
      const r0 = S * 0.33;
      g.strokeStyle = `rgba(${200 + Math.floor(30 * wob)},245,80,${0.35 + e * 0.6})`;
      g.lineWidth = S * 0.012; g.lineCap = 'round';
      g.beginPath(); g.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0);
      g.lineTo(C + Math.cos(a) * (r0 + len), C + Math.sin(a) * (r0 + len)); g.stroke();
    }

    // 旋转轨道环
    g.lineWidth = S * 0.01;
    for (let k = 0; k < 2; k++) {
      g.strokeStyle = k ? 'rgba(56,217,255,.75)' : 'rgba(221,245,61,.8)';
      const a0 = t * (k ? -1.3 : 0.9) + k;
      g.beginPath(); g.arc(C, C, S * (0.29 - k * 0.025), a0, a0 + Math.PI * (0.6 + 0.2 * k)); g.stroke();
    }

    // 核心球体
    const r = S * (0.2 + e * 0.025);
    const core = g.createRadialGradient(C - r * 0.35, C - r * 0.4, r * 0.1, C, C, r);
    core.addColorStop(0, '#fbffe0'); core.addColorStop(0.45, '#e6fa5a'); core.addColorStop(1, '#9fbf12');
    g.fillStyle = core; g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.fill();

    // 眼睛：每约 3.7 秒眨一次；说话时轻微上下
    const ph = (t % 3.7) / 3.7;
    const eyH = ph > 0.95 ? r * 0.34 * (1 - Math.sin((ph - 0.95) / 0.05 * Math.PI) * 0.88) : r * 0.34;
    const bob = Math.sin(t * 2.1) * r * 0.03 - e * r * 0.04;
    g.fillStyle = '#0e0f0e';
    for (const dx of [-0.32, 0.32]) {
      const x = C + dx * r, y = C - r * 0.05 + bob, w = r * 0.15;
      g.beginPath(); g.roundRect(x - w / 2, y - eyH / 2, w, eyH, w / 2); g.fill();
    }
    g.restore();
  };
}
