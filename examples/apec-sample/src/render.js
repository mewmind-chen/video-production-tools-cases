const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
const [,,mode,...args]=process.argv;const FPS=30;
async function open(){const b=await chromium.launch({args:['--allow-file-access-from-files','--force-color-profile=srgb']});const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+path.resolve('index.html'));await p.evaluate(()=>window.ready);
  await p.evaluate(async()=>{const txt=document.body.innerText+DATA.timeline.scenes.map(s=>s.lines.map(l=>l.zh+l.en).join('')+(s.tagzh||'')+(s.tag||'')).join('');
    for(const f of ['600 40px Fredoka','700 40px Fredoka','40px "ZCOOL KuaiLe"','40px "Noto Color Emoji"'])await document.fonts.load(f,txt);});
  return [b,p]}
(async()=>{
 if(mode==='stills'){const [b,p]=await open();for(const t of args){await p.evaluate(t=>render(+t),t);await p.screenshot({path:`stills/s_${t}.jpg`,type:'jpeg',quality:80});}await b.close();return}
 // chunk: start end out
 const [a,e,out]=args.map((x,i)=>i<2?+x:x);const [b,p]=await open();
 const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',''+FPS,'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r',''+FPS,out],{stdio:['pipe','inherit','inherit']});
 for(let f=a;f<e;f++){await p.evaluate(t=>render(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(f%300===0)console.error(out,f)}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();
})();
