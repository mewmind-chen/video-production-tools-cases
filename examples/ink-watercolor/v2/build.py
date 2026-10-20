from pathlib import Path
import random
random.seed(41)
parts=[]
def path(d,at,dur=.55,stroke='#405c61',width=1.5,fill='none'):
 parts.append(f'<path class="draw" d="{d}" data-at="{at}" data-dur="{dur}" stroke="{stroke}" stroke-width="{width}" fill="{fill}"/>')
fills=[]
def fill(d,col,at):
 fills.append(f'<path class="wash" d="{d}" fill="{col}" data-at="{at}"/>')
# Central vanishing point, asymmetric façades.
for x,y,w,h,at in [(-30,100,236,447,.3),(210,183,151,325,1.0),(365,251,112,227,1.6),(481,307,80,151,2.1),(565,348,53,98,2.5),(1190,142,160,409,.5),(1038,209,148,307,1.2),(924,273,111,216,1.8),(838,322,83,147,2.3),(773,352,62,104,2.7)]:
 d=f'M{x},{y+h} L{x},{y} L{x+w},{y+3} L{x+w},{y+h}'
 path(d,at,1.05,width=2)
 path(f'M{x-3},{y-7} L{x+w+4},{y-4} M{x},{y+8} L{x+w},{y+10}',at+.3,.7)
 fill(d+'Z',random.choice(['#9baca9','#bdad92','#9daeb2']),5+at*.35)
 rows=max(2,int(h/62));cols=max(2,int(w/45))
 for r in range(rows):
  for c in range(cols):
   xx=x+15+c*(w-15)/cols; yy=y+27+r*(h-30)/rows;ww=(w-25)/cols*.64;hh=min(37,h/rows*.6)
   d=f'M{xx},{yy+hh} V{yy} H{xx+ww} V{yy+hh} Z M{xx+ww/2},{yy} V{yy+hh} M{xx-3},{yy+hh+3} H{xx+ww+3}'
   path(d,at+.7+r*.13+c*.06,.35,width=.85)
   fill(f'M{xx},{yy}h{ww}v{hh}h{-ww}Z',random.choice(['#6d8b94','#c5b073','#839d9b']),5.5+at*.3+r*.09)
path('M0 584 L654 442 L713 442 L1280 570 M0 612 L650 450 M731 451 L1280 595',.2,2.3,width=2)
for i in range(12):
 x=i*57;y=585-i*12
 path(f'M{x} {y} l-12 29',2+i*.06,.35,width=.8)
path('M0 430 H190 L211 468 H0 M0 474 H212 M22 476 V550 H177 V476 M70 476 V550 M126 476 V550',2.1,1.3,width=2)
fill('M0 430 H190 L211 468 H0Z','#35646c',6.5)
for i in range(9):path(f'M{i*23} 431 l18 36',3+i*.08,.35,stroke='#668681',width=7)
for x,y,s,at in [(1094,306,1.3,3),(885,365,.7,3.4),(776,394,.35,3.8)]:
 path(f'M{x} {y+190*s} V{y} q0 {-17*s} {-20*s} {-17*s} h{-12*s} m{-8*s} 0 h{20*s} l{-3*s} {22*s} h{-14*s} Z',at,.85,width=2*s)
 fill(f'M{x-39*s} {y-15*s} h{18*s} l{-3*s} {20*s} h{-12*s} Z','#d7b66e',6.9)
path('M0 181 Q540 361 1280 208 M0 192 Q540 374 1280 220',3.5,1.1,width=.7)
# Sparse hatch accents, visibly sketched in.
for i in range(90):
 x=random.choice([random.uniform(12,185),random.uniform(1060,1250)]);y=random.uniform(200,520)
 path(f'M{x:.1f} {y:.1f} l{random.uniform(5,18):.1f} -3',3.3+i*.012,.22,width=.5,stroke='#6c7e79')
svg=''.join(fills)+''.join(parts)
html='''<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>雨城 · 逐笔成画</title><style>*{box-sizing:border-box}body{margin:0;background:#e9e4d9;color:#34505a;font-family:system-ui}main{max-width:1200px;margin:5vh auto;padding:18px}header{display:flex;justify-content:space-between;margin-bottom:15px;font-size:12px;letter-spacing:3px}svg{display:block;width:100%;background:#f5f0e5;box-shadow:0 12px 40px #3b4b4b25;overflow:hidden}.draw{stroke-linecap:round;stroke-linejoin:round}.wash{opacity:0}footer{display:flex;gap:16px;align-items:center;margin-top:18px;font-size:12px}button{background:transparent;border:1px solid #80928f;padding:10px 16px;color:inherit}input{flex:1;min-width:20px;accent-color:#547b80}p{font-size:12px;color:#6c7b78;line-height:1.8}</style><main><header><span>雨城 / 逐笔成画</span><span id="stage">落笔</span></header><svg id="scene" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"><defs><filter id="soft"><feGaussianBlur stdDeviation="9"/></filter><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="8"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".065"/></feComponentTransfer></filter><linearGradient id="ground" x2="0" y2="1"><stop stop-color="#a9b9b1" stop-opacity="0"/><stop offset="1" stop-color="#739b9f" stop-opacity=".4"/></linearGradient></defs><rect width="1280" height="720" fill="#f5f0e5"/><g id="world"><g id="colorGround"><path d="M0 577 L685 440 L1280 560 V720 H0Z" fill="url(#ground)"/><ellipse cx="630" cy="220" rx="620" ry="160" fill="#a1b9b5" opacity=".13" filter="url(#soft)"/></g>SVGCONTENT<g id="reflection" opacity=".16"></g><g id="walker"></g><g id="weather"></g><g id="pen"><path d="M0 0 L8 -29 L20 -39 L28 -31 L22 -17 Z" fill="#384e56"/><path d="M0 0 L8 -9 L10 -3 Z" fill="#bca477"/></g></g><rect width="1280" height="720" filter="url(#paper)" pointer-events="none"/><rect x="15" y="15" width="1250" height="690" fill="none" stroke="#f5f0e5" stroke-width="29"/><g id="caption"><text x="65" y="653" font-size="21" fill="#355661" font-family="serif">雨把城市画出来，也把你留在画里。</text></g></svg><footer><button id="toggle">暂停</button><button id="replay">重播画线</button><input id="seek" type="range" min="0" max="16" step=".01" value="0"><span id="clock">0.0 / 16秒</span></footer><p>0–5 秒：钢笔逐笔画出街景　·　5–8 秒：淡彩铺开　·　8–16 秒：人物行走、伞面摆动、风雨与倒影<br>纯代码实时动画 · 无配乐</p></main><script src="motion-v2.js"></script></html>'''.replace('SVGCONTENT',svg)
Path(__file__).resolve().with_name('play.html').write_text(html.replace('motion-v2.js', 'motion-fixed.js'), encoding='utf-8')
print(len(parts),'独立画线笔画，已生成页面')
