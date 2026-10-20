'use strict';
const canvas=document.getElementById('film'),ctx=canvas.getContext('2d');const W=1280,H=720;let seed=321;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}function layer(w=W,h=H){let c=document.createElement('canvas');c.width=w;c.height=h;return c}const bg=layer(),g=bg.getContext('2d');
function line(c,pts,col='#4c5959',width=.8){c.strokeStyle=col;c.lineWidth=width;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke()}
function wash(c,x,y,rx,ry,color,n=5){c.fillStyle=color;for(let k=0;k<n;k++){c.beginPath();for(let j=0;j<=36;j++){let a=j/36*Math.PI*2,r=.84+rand()*.26;let X=x+Math.cos(a)*rx*r,Y=y+Math.sin(a)*ry*r;j?c.lineTo(X,Y):c.moveTo(X,Y)}c.fill()}}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
g.fillStyle='#f1eee3';g.fillRect(0,0,W,H);wash(g,690,200,690,200,'#99b0af09',12);wash(g,1020,230,260,240,'#b0b8ab09',9);wash(g,220,285,260,220,'#8aaba509',8);
// Soft distant skyline
for(let i=0;i<36;i++){let x=i*39-25,y=215+rand()*100,w=25+rand()*50;rect(g,x,y,w,430-y,'#a3b4b525');line(g,[[x,y+2],[x,y],[x+w,y],[x+w,421]],'#748e8d25',.7);for(let j=0;j<8;j++)rect(g,x+5+(j%3)*9,y+15+Math.floor(j/3)*18,3,7,'#69888820')}
// Perspective roadway and wet washes
let road=g.createLinearGradient(0,410,0,720);road.addColorStop(0,'#9eafac19');road.addColorStop(1,'#809b9d48');g.fillStyle=road;g.beginPath();g.moveTo(583,410);g.lineTo(1280,720);g.lineTo(0,720);g.lineTo(0,510);g.closePath();g.fill();
for(let i=0;i<60;i++){let y=439+rand()*280,x=rand()*1280;wash(g,x,y,20+rand()*150,2+rand()*6,['#7e9b9d06','#c19c6c09','#f8f2df18'][i%3],2)}
function building(x,y,w,h,col,rows,cols){wash(g,x+w*.5,y+h*.52,w*.55,h*.54,col,4);g.fillStyle=col;g.fillRect(x,y,w,h);line(g,[[x,y+h],[x,y],[x+w,y+rand()*3],[x+w,y+h]],'#405353a0',1);line(g,[[x-2,y-5],[x+w+5,y-3]],'#4a575690',1.4);line(g,[[x+2,y+4],[x+w,y+4]],'#45585850');for(let r=0;r<rows;r++){let yy=y+22+r*(h-54)/rows;for(let j=0;j<cols;j++){let xx=x+12+j*(w-16)/cols,ww=(w-22)/cols*.58,hh=Math.min(34,(h-50)/rows*.63);rect(g,xx,yy,ww,hh,'#56717332');line(g,[[xx,yy+hh],[xx,yy],[xx+ww,yy],[xx+ww,yy+hh],[xx,yy+hh]],'#435b5a99',.75);line(g,[[xx+ww*.52,yy],[xx+ww*.52,yy+hh]],'#3f555660',.6);line(g,[[xx-3,yy+hh+2],[xx+ww+3,yy+hh+2]],'#45595977',.8);if(rand()>.6)rect(g,xx+1,yy+1,ww*.45,hh-2,'#d9b97b35')}}for(let j=0;j<18;j++){let yy=y+rand()*h;line(g,[[x+rand()*w,yy],[x+rand()*w,yy+1]],'#64726a16',.5)}}
building(785,258,83,180,'#a5b0a91b',4,3);building(868,230,102,231,'#a4afaa22',5,3);building(972,178,146,305,'#899d9c22',6,4);building(1117,112,191,400,'#7d979426',7,4);
building(-38,95,223,435,'#b8aa8f25',7,4);building(184,172,144,326,'#a3ada135',5,3);building(329,240,105,237,'#b7b29b2a',5,3);building(435,291,75,159,'#b2b8a62b',4,2);building(511,330,54,109,'#9dac9c22',3,2);
// Cornices and foreground café
for(let y of [152,165,358,366])line(g,[[0,y],[181,y+2]],'#4f5e5777',1);
rect(g,10,401,148,113,'#526e683d');rect(g,17,411,132,87,'#c8b17832');for(let x of [18,61,105,148])line(g,[[x,410],[x,504]],'#354f4ca0',1.7);line(g,[[18,451],[148,452]],'#354f4c99',1.1);
g.fillStyle='#496765';g.beginPath();g.moveTo(0,395);g.lineTo(172,395);g.lineTo(194,424);g.lineTo(0,424);g.closePath();g.fill();for(let i=0;i<10;i++)line(g,[[i*20,397],[i*22,423]],'#c4cec34a',7);line(g,[[0,424],[193,424]],'#334e4bc0',1.7);
g.fillStyle='#e8dfc6';g.font='12px Georgia';g.textAlign='center';g.fillText('CAFÉ  ·  PLUIE',83,388);rect(g,27,367,114,23,'#3f5a54b0');g.fillStyle='#eae3cc';g.fillText('CAFÉ  ·  PLUIE',84,383);
// Pavements and receding perspective
line(g,[[0,539],[566,434],[624,430]],'#52686299',1);line(g,[[0,566],[562,441]],'#52686255',1);line(g,[[804,451],[1280,557]],'#647c7666',1);for(let i=0;i<16;i++){let z=i/16;let x=570-Math.pow(z,1.8)*660,y=438+Math.pow(z,1.8)*127;line(g,[[x,y],[x-6,y+18]],'#62726d4a',.7)}
for(let i=0;i<18;i++){let y=460+i*i*.69;line(g,[[550-i*21,y],[644+i*35,y+rand()*3]],'#7b8f871c',.6)}
// Street lamps
function lamp(x,y,s){line(g,[[x,y+170*s],[x,y],[x-3*s,y-8*s],[x-20*s,y-8*s]],'#3a5553bb',2*s);g.fillStyle='#cbb77b60';g.beginPath();g.arc(x-23*s,y+4*s,9*s,0,7);g.fill();line(g,[[x-31*s,y-5*s],[x-16*s,y-5*s],[x-18*s,y+12*s],[x-28*s,y+12*s],[x-31*s,y-5*s]],'#3f5553a0',s);wash(g,x-23*s,y+4*s,22*s,29*s,'#d7b97808',3)}lamp(1010,290,1.4);lamp(808,344,.7);lamp(710,374,.36);
// Loose overhead wires
for(let k=0;k<3;k++){g.beginPath();g.moveTo(0,160+k*8);g.bezierCurveTo(350,280+k*4,670,300+k*4,1280,168+k*16);g.strokeStyle='#52655c33';g.lineWidth=.7;g.stroke()}
// Plane tree, right foreground
line(g,[[1235,536],[1225,365],[1246,202],[1220,75]],'#4b62595a',15);line(g,[[1230,329],[1167,232],[1132,155]],'#53675a65',6);line(g,[[1241,235],[1280,153]],'#53675a55',6);for(let i=0;i<90;i++){let x=1110+rand()*250,y=15+rand()*230;wash(g,x,y,12+rand()*44,10+rand()*26,['#7a90700b','#8e9e7109','#788f810a'][i%3],2)}
// Fine pen accents and paper fibres
for(let i=0;i<1200;i++){let x=rand()*W,y=rand()*H;line(g,[[x,y],[x+1+rand()*4,y+rand()*2]],'#605d4e0a',.5)}
const paper=layer();const p=paper.getContext('2d');let im=p.createImageData(W,H);for(let i=0;i<im.data.length;i+=4){let v=rand()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=12+rand()*10}p.putImageData(im,0,0);
const drops=Array.from({length:460},()=>({x:rand()*1500-100,y:rand()*900,z:.25+rand()*.75}));const ripples=Array.from({length:55},()=>({x:rand()*1400-60,y:470+rand()*250,phase:rand()*5,r:5+rand()*16}));
function person(c,x,y,s,t,alpha=1){c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha=alpha;const sway=Math.sin(t*1.4)*1.3;c.translate(sway,0);
// Boots and long raincoat silhouette
c.fillStyle='#3e5356';c.beginPath();c.moveTo(-12,-65);c.lineTo(-10,-7);c.lineTo(-17,0);c.quadraticCurveTo(-8,5,-2,0);c.lineTo(1,-50);c.lineTo(5,-5);c.lineTo(3,2);c.lineTo(18,2);c.lineTo(13,-8);c.lineTo(14,-65);c.fill();
c.fillStyle='#b98d69';c.beginPath();c.moveTo(-12,-140);c.quadraticCurveTo(-26,-125,-22,-104);c.lineTo(-30,-51);c.quadraticCurveTo(0,-39,27,-53);c.lineTo(17,-117);c.quadraticCurveTo(14,-137,7,-140);c.closePath();c.fill();wash(c,-2,-95,19,42,'#dfc29a13',3);line(c,[[-11,-134],[-6,-121],[-2,-51]],'#665f5266',1);line(c,[[14,-119],[5,-101],[16,-91],[29,-116]],'#665f5299',2);line(c,[[-19,-112],[-25,-82]],'#665f5277',1);line(c,[[-21,-58],[18,-56]],'#665f5266',.8);
c.fillStyle='#343e3e';c.beginPath();c.ellipse(-3,-151,14,20,-.08,0,7);c.fill();c.fillStyle='#d9b89a';c.beginPath();c.ellipse(4,-149,7,13,-.05,0,7);c.fill();c.fillStyle='#384342';c.beginPath();c.moveTo(-17,-147);c.quadraticCurveTo(-20,-179,4,-172);c.quadraticCurveTo(18,-166,12,-149);c.lineTo(3,-161);c.lineTo(-1,-134);c.lineTo(-18,-133);c.closePath();c.fill();
// Umbrella pole and hand
line(c,[[28,-196],[28,-100],[23,-95]],'#3f514f',1.7);c.fillStyle='#d6b59c';c.beginPath();c.ellipse(28,-113,4,6,.2,0,7);c.fill();
const uy=-183+Math.sin(t*1.4)*.8;c.fillStyle='#476f76';c.beginPath();c.moveTo(-67,uy);c.quadraticCurveTo(-47,uy-48,9,uy-50);c.quadraticCurveTo(58,uy-49,86,uy);c.quadraticCurveTo(65,uy-10,48,uy+2);c.quadraticCurveTo(29,uy-10,10,uy+2);c.quadraticCurveTo(-9,uy-10,-28,uy+1);c.quadraticCurveTo(-49,uy-9,-67,uy);c.fill();line(c,[[-67,uy],[-50,uy-23],[-25,uy-42],[9,uy-50],[42,uy-42],[68,uy-21],[86,uy]],'#304f55b0',1);for(let x of [-28,10,48]){c.beginPath();c.moveTo(9,uy-50);c.quadraticCurveTo((x+9)/2,uy-33,x,uy+1);c.strokeStyle='#aec2bb65';c.lineWidth=.8;c.stroke()}line(c,[[9,uy-55],[9,uy-49]],'#3a5658',1.5);c.restore()}
// Pre-render character so watercolor randomness stays stable in time.
const actor=layer(280,360),ac=actor.getContext('2d');person(ac,130,330,1.25,0);
function frame(t){ctx.clearRect(0,0,W,H);ctx.fillStyle='#f1eee3';ctx.fillRect(0,0,W,H);ctx.save();let ease=(1-Math.cos(Math.min(t,12)/12*Math.PI))/2;let zoom=1.025+.035*ease;ctx.translate(W/2-11*ease,H/2-3*ease);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);ctx.drawImage(bg,0,0);
// Reflections break into horizontal streaks in shallow water.
let ax=650+ease*8,ay=590+Math.sin(t*1.3)*.55;ctx.save();ctx.translate(ax,ay);ctx.scale(1,-.42);ctx.globalAlpha=.13;ctx.drawImage(actor,-130,-330,280,360);ctx.restore();ctx.save();ctx.globalAlpha=.15;ctx.fillStyle='#f1eee3';for(let i=0;i<27;i++){let yy=ay+i*3;ctx.fillRect(ax-92+Math.sin(i*4+t)*12,yy,175,1.6)}ctx.restore();
// Amber pools underneath the café and lantern.
for(let i=0;i<13;i++){ctx.fillStyle=`rgba(184,151,90,${.025*(1-i/15)})`;ctx.fillRect(60-i*3+Math.sin(t+i)*3,550+i*7,45+i*9,2);ctx.fillRect(958-i*2+Math.cos(t+i)*4,515+i*5,32+i*5,2)}
for(const r of ripples){let f=((t*.55+r.phase)%1);ctx.beginPath();ctx.ellipse(r.x,r.y,r.r*f*(.5+(r.y-450)/200),r.r*f*.17,0,0,7);ctx.strokeStyle=`rgba(84,111,111,${(1-f)*.23})`;ctx.lineWidth=.65;ctx.stroke();if(f<.35)line(ctx,[[r.x,r.y-4*(1-f/.35)],[r.x,r.y]],'#b8cac55a',.7)}
ctx.drawImage(actor,ax-130,ay-330,280,360);
// Passing distant pedestrian
ctx.save();ctx.translate(594-t*1.2,441);ctx.scale(.18,.18);ctx.globalAlpha=.55;ctx.drawImage(actor,-130,-330,280,360);ctx.restore();
for(const d of drops){let yy=((d.y+t*(210+360*d.z))%900)-80,xx=d.x-(yy-d.y)*.14;xx=((xx+150)%1500)-100;let len=7+14*d.z;line(ctx,[[xx,yy],[xx-2.5*d.z,yy+len]],`rgba(99,128,135,${.09+.14*d.z})`,.5+d.z*.5)}
// Occasional drops running from umbrella rim
for(let i=0;i<5;i++){let q=(t*1.1+i*.23)%1;let x=ax-80+i*43;line(ctx,[[x,ay-226+q*94],[x-1,ay-222+q*94]],`rgba(80,117,123,${.22*(1-q)})`,.8)}ctx.restore();ctx.drawImage(paper,0,0);
// Printed typography and wide white page margin
ctx.fillStyle='#f1eee3';ctx.fillRect(0,0,W,36);ctx.fillRect(0,H-36,W,36);ctx.fillRect(0,0,34,H);ctx.fillRect(W-34,0,34,H);ctx.strokeStyle='#6d79742b';ctx.lineWidth=.6;ctx.strokeRect(34.5,36.5,W-69,H-73);
let titleFade=Math.min(1,t/1.4);ctx.globalAlpha=titleFade;ctx.fillStyle='#405958';ctx.textAlign='left';ctx.font='32px Georgia,"Songti SC",serif';ctx.fillText('雨落之后',84,106);ctx.font='10px Georgia';ctx.fillStyle='#6d827c';ctx.fillText('A CITY SKETCH IN THE RAIN',87,128);ctx.globalAlpha=1;
let a=Math.min(1,Math.max(0,(t-2)/1.5));ctx.globalAlpha=a;ctx.textAlign='right';ctx.font='16px Georgia,"Songti SC",serif';ctx.fillStyle='#435f60';ctx.fillText(t<7?'雨把街道，写成一封没有寄出的信。':'你走过以后，整座城仍在等雨停。',1190,628);ctx.globalAlpha=1;ctx.font='9px Georgia';ctx.textAlign='left';ctx.fillStyle='#7f8980';ctx.fillText('PLUVIAL / STUDY No. 01',50,700);ctx.textAlign='right';ctx.fillText('PEN, WASH & A LITTLE TIME',1230,700)}
window.DURATION=12;window.renderFrame=frame;let running=true,time=0,last=performance.now();const seek=document.getElementById('seek'),play=document.getElementById('play'),clock=document.getElementById('clock');function loop(now){if(running)time=(time+Math.min((now-last)/1000,.1))%12;last=now;frame(time);seek.value=time;clock.textContent='00:'+String(Math.floor(time)).padStart(2,'0')+' / 00:12';requestAnimationFrame(loop)}play.onclick=()=>{running=!running;play.textContent=running?'暂停':'播放'};seek.oninput=()=>{time=+seek.value;running=false;play.textContent='播放';frame(time)};document.getElementById('full').onclick=()=>{if(canvas.requestFullscreen)canvas.requestFullscreen();else canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#e6e1d7;z-index:99'};window.pauseAt=t=>{running=false;time=t;frame(t);play.textContent='播放'};requestAnimationFrame(loop);
