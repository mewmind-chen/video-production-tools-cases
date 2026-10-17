// 确定性渲染：画面只由 render(t) 决定，t 由渲染脚本逐帧传入，不读真实时间。
(function () {
  const CFG = window.CONFIG, TL = window.TIMELINE, C = window.CUES;
  const $ = (id) => document.getElementById(id);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, d) => clamp((t - a) / d);
  const E = {
    io: gsap.parseEase('power3.inOut'), out: gsap.parseEase('power3.out'), in: gsap.parseEase('power2.in'),
    back: gsap.parseEase('back.out(2.2)'), el: gsap.parseEase('elastic.out(1,0.45)'), linear: (p) => p,
  };
  const S = Object.fromEntries(TL.shots.map((s) => [s.id, s]));
  const seg = (k, i) => S[k].segments[i];
  const show = (el, on) => { const v = on ? 'block' : 'none'; if (el.style.display !== v) el.style.display = v; };
  const css = (el, o) => Object.assign(el.style, o);
  const html = (el, h) => { if (el._h !== h) { el.innerHTML = h; el._h = h; } };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // 关键帧插值：[时间, 值对象, 过渡时长, 缓动]
  function track(keys, t) {
    let cur = { ...keys[0][1] };
    for (let i = 1; i < keys.length; i++) {
      const [at, v, d, e] = keys[i];
      if (t < at) break;
      const p = (E[e] || E.io)(prog(t, at, d));
      const o = {};
      for (const k in cur) o[k] = lerp(cur[k], v[k] ?? cur[k], p);
      cur = o;
    }
    return cur;
  }
  // 手绘描边：按进度画出路径
  function drawPath(el, p) {
    if (!el._len) { el._len = el.getTotalLength(); el.style.strokeDasharray = el._len; }
    el.style.strokeDashoffset = el._len * (1 - p);
  }
  const handEllipse = (cx, cy, rx, ry) =>
    `M ${cx - rx * 0.2} ${cy - ry * 1.02} C ${cx + rx * 0.7} ${cy - ry * 1.1}, ${cx + rx * 1.08} ${cy - ry * 0.4}, ${cx + rx} ${cy + ry * 0.15}` +
    ` S ${cx + rx * 0.3} ${cy + ry * 1.08}, ${cx - rx * 0.25} ${cy + ry * 0.98} S ${cx - rx * 1.1} ${cy + ry * 0.2}, ${cx - rx * 0.92} ${cy - ry * 0.35}` +
    ` S ${cx - rx * 0.2} ${cy - ry * 1.15}, ${cx + rx * 0.35} ${cy - ry * 0.92}`;

  // ---------------- 场景时间窗 ----------------
  const W = {
    pf: [0, C.expand + 0.55], lab: [C.expand + 0.3, C.aiIn + 0.35], ai: [C.aiIn, C.camIn + 0.3],
    cam: [C.camIn, C.reportIn], rep: [C.reportIn, C.ctaIn + 0.35], cta: [C.ctaIn, C.endCard + 0.45], end: [C.endCard, 1e9],
  };
  const inW = (k, t) => t >= W[k][0] && t < W[k][1];
  // 甩镜转场：出场向左甩，入场从右甩入，带运动模糊
  function whip(el, t, inAt, outAt, d = 0.35) {
    let x = 0, blur = 0;
    if (t < inAt + d) { const p = E.io(prog(t, inAt, d)); x = (1 - p) * 1080; blur = Math.sin(p * Math.PI) * 18; }
    if (t > outAt - 0.001 && outAt < 1e8) { const p = E.io(prog(t, outAt, d)); x = -p * 1080; blur = Math.sin(p * Math.PI) * 18; }
    el.style.transform = `translateX(${x}px)`;
    el.style.filter = blur > 0.3 ? `blur(${blur}px)` : 'none';
  }

  // ---------------- ① 主页 ----------------
  const PF_CAM = [
    [0, { s: 2.35, fx: 455, fy: 700 }],
    [C.markLikes, { s: 2.35, fx: 230, fy: 700 }, 0.38],
    [C.panVisitors, { s: 2.1, fx: 700, fy: 300 }, 0.42],
    [C.pullOut, { s: 1.0, fx: 540, fy: 960 }, 0.5],
    [C.pullOut + 0.6, { s: 1.18, fx: 560, fy: 1150 }, 0.6],
    [C.tapPublish - 0.1, { s: 1.24, fx: 600, fy: 1170 }, 0.4],
  ];
  const camTf = (c) => `translate(540px,960px) scale(${c.s}) translate(${-c.fx}px,${-c.fy}px)`;
  const toScreen = (c, x, y) => [540 + c.s * (x - c.fx), 960 + c.s * (y - c.fy)];
  const BANNER = { x: 41, y: 1125, w: 998, h: 130 };
  function renderPf(t) {
    const c = track(PF_CAM, t);
    $('page').style.transform = camTf(c);
    const fadeMk = 1 - prog(t, C.pullOut, 0.25);
    drawPath($('mkFans'), E.out(prog(t, C.markFans, 0.4))); $('mkFans').style.opacity = fadeMk;
    drawPath($('mkLikes'), E.out(prog(t, C.markLikes + 0.2, 0.35))); $('mkLikes').style.opacity = fadeMk;
    drawPath($('mkVisit'), E.out(prog(t, C.panVisitors + 0.3, 0.35))); $('mkVisit').style.opacity = fadeMk;
    drawPath($('mkBanner'), E.out(prog(t, C.markBanner, 0.45)));
    // 两个访客图标从「新访客」里冒出来，然后溜走
    let w = '';
    for (let i = 0; i < 2; i++) {
      const app = E.back(prog(t, C.panVisitors + 0.45 + i * 0.12, 0.3));
      const go = E.in(prog(t, C.visitorsLeave + i * 0.1, 0.55));
      const x = 650 + i * 70 + go * 420, y = 330 + (go > 0 ? -Math.abs(Math.sin(t * 22 + i)) * 10 : 0);
      const o = app * (1 - prog(t, C.visitorsLeave + 0.35 + i * 0.1, 0.25));
      w += `<g transform="translate(${x} ${y}) scale(${app})" opacity="${o}"><circle cx="0" cy="-34" r="16" fill="#6d8fd8"/>
            <path d="M-26 8 C-26 -12 -14 -18 0 -18 C14 -18 26 -12 26 8 Z" fill="#6d8fd8"/></g>`;
    }
    html($('walkers'), w);
    // 点「去发布」
    const rp = prog(t, C.tapPublish, 0.35), rip = $('tapRip');
    css(rip, { left: '866px', top: '1191px', opacity: t >= C.tapPublish ? 0.6 * (1 - rp) : 0, transform: `scale(${0.3 + rp * 1.4})` });
    $('bnBtn').style.transform = t > C.tapPublish - 0.03 && t < C.tapPublish + 0.12 ? 'scale(.93)' : 'none';
    const vis = t < C.visitorsLeave + 0.5 ? CFG.account.visitors : 0;  // 访客走光后数字变 0
    html($('visitN'), String(vis));
  }

  // 活动卡展开成全屏标题卡
  function renderFlip(t) {
    const on = t >= C.expand && t < C.expand + 0.55;
    show($('flip'), on);
    if (!on) return;
    const c = track(PF_CAM, C.expand);
    const [x0, y0] = toScreen(c, BANNER.x, BANNER.y), [x1, y1] = toScreen(c, BANNER.x + BANNER.w, BANNER.y + BANNER.h);
    const p = E.io(prog(t, C.expand, 0.45));
    const col = Math.round(lerp(255, 11, prog(t, C.expand + 0.05, 0.3)));
    css($('flip'), { left: lerp(x0, 0, p) + 'px', top: lerp(y0, 0, p) + 'px', width: lerp(x1 - x0, 1080, p) + 'px', height: lerp(y1 - y0, 1920, p) + 'px',
      borderRadius: lerp(14, 0, p) + 'px', background: `rgb(${col},${Math.round(lerp(255, 13, prog(t, C.expand + 0.05, 0.3)))},${Math.round(lerp(255, 18, prog(t, C.expand + 0.05, 0.3)))})`,
      opacity: 1 - prog(t, C.expand + 0.4, 0.15) });
  }

  // ---------------- ② 标题卡 ----------------
  function typed(s, t, a, cps) { const n = Math.floor(clamp((t - a) * cps, 0, s.length)); return s.slice(0, n); }
  function renderLab(t) {
    whip($('lab'), t, -1, C.aiIn);
    html($('labCode'), typed('RESEARCH PROJECT #001', t, C.titleIn - 0.15, 45));
    const k = E.out(prog(t, C.titleIn, 0.35)), h = E.back(prog(t, C.titleIn + 0.12, 0.4));
    css($('labK'), { opacity: k, transform: `translateY(${(1 - k) * 30}px)` });
    css($('labH'), { opacity: prog(t, C.titleIn + 0.12, 0.15), transform: `scale(${lerp(1.25, 1, h)})`, transformOrigin: '0 50%' });
    const n = prog(t, C.counter, 0.2);
    css($('labN'), { opacity: n, transform: `translateX(${(1 - E.out(n)) * -60}px)` });
    // 1000 老虎机式滚动后定格
    const roll = prog(t, C.counter, 0.75);
    let digits = '1000';
    if (roll < 1) digits = Array.from('1000', (d, i) => (roll > 0.35 + i * 0.16 ? d : String(Math.floor(hash(Math.floor(t * 30) + i * 7) * 10)))).join('');
    html($('labTarget'), digits);
    const rows = [
      ['研究员', '陈工（粉丝 0）'], ['开始时间', '今天 23:47'], ['预计完成', '不知道'], ['状态', '<span class="dot"></span>进行中'],
    ];
    html($('labRows'), rows.map(([a, b], i) => {
      const p = E.out(prog(t, C.counter + 0.35 + i * 0.12, 0.3));
      return `<div style="opacity:${p};transform:translateY(${(1 - p) * 24}px)">${a}：<b>${b}</b></div>`;
    }).join(''));
  }

  // ---------------- ③ AI ----------------
  const ITEMS = ['保持日更', '打造人设', '真人出镜', '蹭热点', '黄金 3 秒开头', '固定发布时间', '统一封面风格', '评论区多互动', '垂直定位',
    '拆解爆款结构', '做系列内容', '标题要有钩子', '加话题标签', '看后台数据', '适当投流', '和同类博主互动', '坚持 3 个月', '保持热爱'];
  let AIL;
  function layoutAI() {
    $('aiList').innerHTML = ITEMS.map((s, i) => `<li><em>${String(i + 1).padStart(2, '0')}</em><span>${s}</span></li>`).join('');
    show($('ai'), true);
    const sc = $('aiScroll'), lis = [...$('aiList').children];
    const top = (el) => { let y = 0; while (el && el !== sc) { y += el.offsetTop; el = el.offsetParent; } return y; };
    AIL = { lis, tops: lis.map(top), h: lis[0].offsetHeight, introBottom: top($('aiIntro')) + $('aiIntro').offsetHeight,
      w3: lis[2].querySelector('span').offsetLeft + lis[2].querySelector('span').offsetWidth, viewH: sc.parentElement.clientHeight };
    show($('ai'), false);
  }
  function renderAI(t) {
    whip($('ai'), t, C.aiIn, 1e9);
    // 输入问题 → 发送
    const q = '怎么从 0 粉涨到 1000 粉？';
    const typing = t < C.sendQ;
    html($('aiInputText'), typing ? typed(q, t, C.typeQStart, q.length / (C.typeQEnd - C.typeQStart)) : '');
    $('aiCaret').style.opacity = typing && Math.floor(t * 2.5) % 2 === 0 ? 1 : (typing && t > C.typeQStart ? 1 : 0);
    const kb = E.io(prog(t, C.sendQ, 0.3));
    $('kbd').style.transform = `translateY(${kb * 600}px)`;
    $('aiInput').style.transform = `translateY(${kb * 700}px)`;
    const sent = prog(t, C.sendQ, 0.25);
    css($('bubU'), { opacity: sent, transform: `translateY(${(1 - E.out(sent)) * 60}px) scale(${lerp(0.9, 1, E.back(sent))})`, transformOrigin: '100% 100%' });
    $('aiIntro').style.opacity = prog(t, C.streamStart - 0.15, 0.15);
    // 18 条刷屏
    const n = ITEMS.length, k = n * prog(t, C.streamStart, C.streamEnd - 0.25 - C.streamStart);
    AIL.lis.forEach((li, i) => { li.style.opacity = clamp(k - i); li.style.color = i === 2 && t >= C.highlight ? '#000' : ''; });
    const bottomAt = (kk) => (kk < 1 ? AIL.introBottom : AIL.tops[Math.min(n, Math.ceil(kk)) - 1] + AIL.h) + 60;
    const stream = (tt) => Math.max(0, bottomAt(n * prog(tt, C.streamStart, C.streamEnd - 0.25 - C.streamStart)) - (AIL.viewH - 380));
    let y = stream(t);
    const target = AIL.tops[2] - 260;
    if (t > C.streamEnd) y = lerp(stream(C.streamEnd), target, E.io(prog(t, C.streamEnd, C.highlight - 0.05 - C.streamEnd)));
    // 静音那一拍：推近「真人出镜」
    const z = E.io(prog(t, C.silenceStart - 0.1, 0.7));
    const s = lerp(1, 1.55, z);
    const fy = AIL.tops[2] + AIL.h / 2;
    $('aiScroll').style.transform = `translateY(${-y}px) translate(${-z * 20}px, ${z * 0}px) scale(${s})`;
    $('aiScroll').style.transformOrigin = `0px ${fy}px`;
    // 荧光笔划过
    const hp = E.out(prog(t, C.highlight, 0.3));
    css($('hl'), { top: (AIL.tops[2] + 8) + 'px', width: (AIL.w3 + 40) + 'px', transform: `scaleX(${hp})`, opacity: hp > 0 ? 1 : 0 });
    // 转入相机：整屏放大冲进去
    const go = E.in(prog(t, C.camIn - 0.1, 0.3));
    if (go > 0) { $('ai').style.transform = `scale(${1 + go * 2.5})`; $('ai').style.opacity = 1 - go; $('ai').style.filter = `blur(${go * 10}px)`; }
    else $('ai').style.opacity = 1;
  }

  // ---------------- ④ 相机 ----------------
  function renderCam(t) {
    const cam = $('cam');
    const open = E.out(prog(t, C.camIn, 0.3));
    // 手持微晃（前置相机）+ 摔机
    const fall = E.in(prog(t, C.fall, 0.28));
    const sx = 4 * Math.sin(t * 2.1) + 2 * Math.sin(t * 5.3), sy = 3 * Math.sin(t * 2.7 + 1);
    let jx = 0, jy = 0;
    if (t > C.crack - 0.05 && t < C.fall) { jx = (hash(Math.floor(t * 30)) - 0.5) * 40; jy = (hash(Math.floor(t * 30) + 3) - 0.5) * 30; }
    css(cam, { transform: `translate(${sx + jx}px, ${sy + jy + fall * 700}px) rotate(${fall * 38}deg) scale(${lerp(1.08, 1, open) * lerp(1, 0.85, fall)})`,
      opacity: open, filter: fall > 0.02 ? `blur(${fall * 14}px)` : 'none' });
    // 倒计时 3-2-1
    let cd = '', cs = 1, co = 0;
    for (const [k, v] of [['cd3', '3'], ['cd2', '2'], ['cd1', '1']]) {
      if (t >= C[k] && t < C[k] + 0.4) { const p = (t - C[k]) / 0.4; cd = v; cs = lerp(1.35, 0.9, E.out(p)); co = 1 - prog(p, 0.6, 0.4); }
    }
    html($('cd'), cd); css($('cd'), { opacity: co, transform: `translate(-50%,-50%) scale(${cs})` });
    const recOn = t >= C.rec;
    $('rec').style.opacity = recOn ? 1 : 0;
    html($('recT'), '00:0' + Math.min(9, Math.floor(Math.max(0, t - C.rec))));
    $('rec').querySelector('i').style.opacity = Math.floor(t * 2) % 2 === 0 ? 1 : 0.25;
    css($('shutter').firstChild, recOn ? { borderRadius: '18px', transform: 'scale(.55)' } : { borderRadius: '50%', transform: 'none' });
    // 破音 → 画面撕裂
    const g = t > C.crack - 0.05 && t < C.fall + 0.1;
    const sl = $('slices');
    if (g) {
      let h = '';
      for (let i = 0; i < 7; i++) {
        const r = hash(Math.floor(t * 30) * 13 + i), y0 = Math.floor(r * 1200), hh = 30 + Math.floor(hash(i * 5 + Math.floor(t * 30)) * 110);
        const dx = (hash(i * 9 + Math.floor(t * 30)) - 0.5) * 160;
        const tint = i % 3 === 0 ? 'hue-rotate(160deg) saturate(3)' : i % 3 === 1 ? 'hue-rotate(-60deg) saturate(2)' : 'none';
        h += `<div style="top:${y0}px;height:${hh}px;background-position:${dx}px ${-y0}px;filter:${tint}"></div>`;
      }
      sl.innerHTML = h;
    } else if (sl.innerHTML) sl.innerHTML = '';
  }

  // ---------------- ⑤ 报告 ----------------
  function renderRep(t) {
    const p = E.io(prog(t, C.reportIn, 0.4));
    css($('rep'), { transform: `translateY(${(1 - p) * 1920}px)` });
    if (t > C.ctaIn) whip($('rep'), t, -1, C.ctaIn);
    // 表演：冲到 18% → 泄气缩回 9%
    const a = prog(t, C.bar1, 0.35), b = prog(t, C.bar1 + 0.4, 0.5);
    const v1 = t < C.bar1 ? 0 : lerp(lerp(0, 18, E.out(a)), 9, E.io(b));
    $('bar1').style.width = v1 + '%';
    html($('v1'), Math.round(v1) + '%');
    // 折腾：一口气冲满，回弹到 97%
    const c = prog(t, C.bar2, 0.6);
    const v2 = t < C.bar2 ? 0 : lerp(0, 97, E.el(c));
    $('bar2').style.width = clamp(v2, 0, 104) + '%';
    html($('v2'), Math.round(clamp(v2, 0, 100)) + '%');
    $('repFoot').style.opacity = prog(t, C.footnote, 0.3);
  }

  // ---------------- ⑥ CTA ----------------
  const EX = ['Excel 公式老是报错', 'AI 写的文案一股 AI 味', '电脑越用越卡'];
  function renderCta(t) {
    whip($('cta'), t, C.ctaIn, 1e9);
    const out = E.io(prog(t, C.endCard, 0.4));
    if (out > 0) css($('cta'), { transform: `scale(${1 - out * 0.15})`, opacity: 1 - out, filter: 'none' });
    else $('cta').style.opacity = 1;
    for (const [id, at] of [['ct1', C.ctaIn + 0.2], ['ct2', C.ctaIn + 0.42]]) {
      const p = prog(t, at, 0.3);
      css($(id), { opacity: p > 0 ? 1 : 0, transform: `scale(${lerp(1.6, 1, E.out(p))})` });
    }
    const cp = E.back(prog(t, C.ctaIn + 0.7, 0.35));
    css($('ctaChip'), { transform: `scale(${cp})`, transformOrigin: '0 50%' });
    const mp = E.out(prog(t, C.ctaIn + 0.8, 0.35));
    css($('composer'), { opacity: mp, transform: `translateY(${(1 - mp) * 40}px)` });
    $('ctaFmt').style.opacity = prog(t, C.ctaIn + 1.0, 0.3);
    // 例子轮播：打字 → 停留 → 删除
    const per = (C.exEnd - C.exStart) / EX.length;
    const i = clamp(Math.floor((t - C.exStart) / per), 0, EX.length - 1), lt = t - C.exStart - i * per;
    const s = EX[i];
    let n = 0;
    if (t >= C.exStart) n = lt < per * 0.55 ? Math.floor(s.length * lt / (per * 0.55)) : lt < per * 0.85 ? s.length : Math.floor(s.length * (1 - (lt - per * 0.85) / (per * 0.15)));
    if (i === EX.length - 1 && lt >= per * 0.55) n = s.length;
    html($('exText'), s.slice(0, Math.max(0, n)));
  }

  // ---------------- ⑦ 结尾 ----------------
  function renderEnd(t) {
    const p = E.out(prog(t, C.endCard + 0.1, 0.45));
    css($('end'), { opacity: prog(t, C.endCard + 0.1, 0.25) });
    css($('ring'), { transform: `rotate(${t * 40}deg) scale(${lerp(0.6, 1, p)})` });
    css(document.querySelector('.end-av'), { transform: `scale(${lerp(0.5, 1, E.back(prog(t, C.endCard + 0.1, 0.45)))})` });
    css($('endName'), { opacity: prog(t, C.endCard + 0.3, 0.3) });
    for (const [id, at] of [['es1', C.slogan1], ['es2', C.slogan2]]) {
      const q = prog(t, at, 0.28);
      css($(id), { opacity: q > 0 ? 1 : 0, transform: `scale(${lerp(1.5, 1, E.out(q))})` });
    }
    const fp = prog(t, C.freeze - 0.3, 0.3);
    css(document.querySelector('.end-prog'), { opacity: fp, transform: `translateY(${(1 - E.out(fp)) * 30}px)` });
    const pulse = t > C.freeze ? 1 + 0.06 * Math.sin((t - C.freeze) * Math.PI * 2 * 1.4) : 1;
    css($('follow'), { opacity: prog(t, C.freeze - 0.15, 0.25), transform: `scale(${E.back(prog(t, C.freeze - 0.15, 0.35)) * pulse})`,
      boxShadow: t > C.freeze ? `0 0 ${30 + 30 * Math.sin((t - C.freeze) * 8.8)}px rgba(254,44,85,.6)` : 'none' });
  }

  // ---------------- 信息层 ----------------
  function renderOv(t) {
    const cr = $('chipReal');
    css(cr, { opacity: t < C.expand ? E.out(prog(t, 0.05, 0.3)) * (1 - prog(t, C.expand - 0.2, 0.2)) : 0 });
    const hud = $('hud'), hi = E.out(prog(t, C.progressIn, 0.35)), ho = prog(t, C.endCard, 0.25);
    css(hud, { opacity: hi * (1 - ho), transform: `translateY(${(1 - hi) * -40}px)` });
    const red = t >= C.redStart && t < C.redStart + 0.75 && Math.floor((t - C.redStart) / 0.125) % 2 === 0;
    $('hudRed').style.opacity = red ? 0.95 : 0;
    $('hudTag').style.opacity = t >= C.redStart && t < C.redEnd ? 1 : 0;
    const b18 = t >= C.badge18 && t < C.highlight - 0.1;
    css($('big18'), { opacity: b18 ? 1 - prog(t, C.highlight - 0.3, 0.2) : 0, transform: `translate(-50%,-50%) rotate(-8deg) scale(${E.back(prog(t, C.badge18, 0.3))})` });
    const sv = t >= C.stamp && t < S[4].end + 0.05;
    css($('stamp'), { opacity: sv ? 1 : 0, transform: `translate(-50%,-50%) rotate(-9deg) scale(${lerp(2.4, 1, E.out(prog(t, C.stamp, 0.16)))})` });
    const tp = prog(t, C.toast, 0.25), tv = t >= C.toast && t < S[4].end + 0.05;
    css($('toast'), { opacity: tv ? tp : 0, transform: `scale(${lerp(0.85, 1, E.back(tp))})` });
    $('black').style.opacity = t >= C.fall + 0.22 && t < C.reportIn ? 1 : 0;
    const ao = t >= C.ctaIn && t < C.endCard + 0.4 ? prog(t, C.ctaIn + 1.0, 0.2) * (1 - prog(t, C.endCard, 0.3)) : 0;
    $('arrowG').setAttribute('opacity', ao);
    const bounce = 10 * Math.abs(Math.sin(t * 6));
    $('arrowG').setAttribute('transform', `translate(${bounce * 0.5} ${bounce})`);

    // 字幕：【】内高亮
    let sub = '';
    TL.shots.forEach((s) => s.segments.forEach((g, i) => {
      const next = s.segments[i + 1];
      const until = Math.min(g.end + 0.3, next ? next.start : g.end + 0.3);
      if (g.sub && t >= g.start - 0.03 && t < until) sub = g.sub;
    }));
    const h = !sub ? '' : sub.split('\n').map((l) => `<span class="ln">${l.replace(/【(.+?)】/g, '<em>$1</em>')}</span>`).join('<br>');
    html($('sub'), h);
  }

  // 胶片颗粒：4 张噪点轮换
  let grains = [];
  function makeGrain() {
    const cv = $('grain'), ctx = cv.getContext('2d');
    for (let k = 0; k < 4; k++) {
      const img = ctx.createImageData(540, 960);
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.floor(hash(i * 0.37 + k * 1000.1) * 255); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      grains.push(img);
    }
  }

  function render(t) {
    for (const k in W) show($(k), inW(k, t));
    if (inW('pf', t)) renderPf(t);
    renderFlip(t);
    if (inW('lab', t)) renderLab(t);
    if (inW('ai', t)) renderAI(t);
    if (inW('cam', t)) renderCam(t);
    if (inW('rep', t)) renderRep(t);
    if (inW('cta', t)) renderCta(t);
    if (inW('end', t)) renderEnd(t);
    renderOv(t);
    const fr = Math.floor(Math.min(t, C.freeze + 0.5) * 30);
    $('grain').getContext('2d').putImageData(grains[fr % 4], 0, 0);
  }

  function initStatic() {
    const a = CFG.account;
    $('pfName').textContent = a.name; $('endName').textContent = a.name;
    $('nLikes').textContent = a.likes; $('nMutual').textContent = a.mutual; $('nFollowing').textContent = a.following; $('nFans').textContent = a.fans;
    $('bio').innerHTML = a.bio.join('<br>');
    $('hudV').textContent = `${CFG.progress.current}/${CFG.progress.target}`;
    $('epV').textContent = `${CFG.progress.current} / ${CFG.progress.target}`;
    $('mkFans').setAttribute('d', handEllipse(501, 702, 92, 74));
    $('mkLikes').setAttribute('d', handEllipse(75, 702, 66, 74));
    $('mkVisit').setAttribute('d', handEllipse(706, 238, 150, 64));
    const b = BANNER;
    $('mkBanner').setAttribute('d', `M ${b.x - 6} ${b.y + 20} Q ${b.x - 10} ${b.y - 12} ${b.x + 40} ${b.y - 10} L ${b.x + b.w - 30} ${b.y - 14} Q ${b.x + b.w + 14} ${b.y - 8} ${b.x + b.w + 10} ${b.y + 30}
      L ${b.x + b.w + 12} ${b.y + b.h - 20} Q ${b.x + b.w + 8} ${b.y + b.h + 14} ${b.x + b.w - 40} ${b.y + b.h + 12} L ${b.x + 30} ${b.y + b.h + 14} Q ${b.x - 12} ${b.y + b.h + 8} ${b.x - 8} ${b.y + b.h - 30} L ${b.x - 4} ${b.y + 10}`);
    makeGrain();
    layoutAI();
  }

  window.ready = async function () {
    initStatic();
    const text = $('stage').textContent + JSON.stringify(CFG) + JSON.stringify(TL) + ITEMS.join('') + EX.join('') +
      'RESEARCH PROJECT #001 研究员陈工（粉丝 0）开始时间今天 23:47 预计完成不知道状态进行中 0123456789%/→：';
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    $('fontWarm').innerHTML = ['400', '700', '900'].map((w) => `<div style="font-family:'Noto Sans SC';font-weight:${w}">${esc(text)}</div>`).join('') +
      `<div style="font-family:'JetBrains Mono';font-weight:500">${esc(text)}</div><div style="font-family:'JetBrains Mono';font-weight:700">${esc(text)}</div>`;
    await Promise.all(['400', '700', '900'].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, text))
      .concat([document.fonts.load('500 40px "JetBrains Mono"', text), document.fonts.load('700 40px "JetBrains Mono"', text)]));
    await document.fonts.ready;
    await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
    layoutAI();
    render(0);
    return [...document.fonts].filter((f) => f.status === 'loaded').length;
  };
  window.seek = async function (t) { render(t); };
})();
