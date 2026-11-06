import json, subprocess, numpy as np, sys
P=sys.argv[1]; SR=44100
sc=json.load(open(P+"/script.json")); W=json.load(open(P+"/words.json"))
def load(fn):
    raw=subprocess.run(["ffmpeg","-v","error","-i",fn,"-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True).stdout
    return np.frombuffer(raw,np.float32)
LEAD,GAP,TAIL,TR=1.0,0.75,0.9,0.7
t=0; scenes=[]; clips=[]; sfx=[]
for s in sc:
    st=t; lines=[]
    if not s["lines"]: t+=s["hold"]
    else:
        t+=LEAD
        for i,(en,zh) in enumerate(s["lines"]):
            a=load(f'{P}/tts/{s["id"]}_{i}.mp3'); d=len(a)/SR
            words=[[w,round(t+a0,3),round(t+a1,3)] for w,a0,a1 in W[f'{s["id"]}_{i}']]
            lines.append(dict(en=en,zh=zh,start=round(t,3),end=round(t+d,3),words=words)); clips.append((t,a)); t+=d+GAP
        t+=TAIL-GAP
    scenes.append(dict(s,start=round(st,3),end=round(t,3),lines=lines)); sfx.append(("whoosh",st))
total=t
json.dump(dict(total=round(total,3),scenes=scenes),open(P+"/timeline.json","w"),ensure_ascii=False,indent=1)
N=int((total+0.5)*SR); voice=np.zeros(N,np.float32)
for st,a in clips: i=int(st*SR); voice[i:i+len(a)]+=a
voice/=max(1e-6,np.abs(voice).max())/0.9
# ---- music: C G Am F, 100 bpm, plucks + bass + soft drums
bpm=100; beat=60/bpm; rng=np.random.default_rng(7); mus=np.zeros(N,np.float32)
def pluck(f,dur,amp):
    n=int(dur*SR); p=int(SR/f); buf=rng.uniform(-1,1,p).astype(np.float32); out=np.zeros(n,np.float32)
    for i in range(n):
        out[i]=buf[i%p]; buf[i%p]=0.996*0.5*(buf[i%p]+buf[(i+1)%p])
    return out*amp
cache={}
def P_(f,d,a):
    k=(round(f,2),d)
    if k not in cache: cache[k]=pluck(f,d,1)
    return cache[k]*a
def add(sig,t0):
    i=int(t0*SR)
    if i>=N: return
    seg=sig[:N-i]; mus[i:i+len(seg)]+=seg
def hz(m): return 440*2**((m-69)/12)
chords=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]]  # C G Am F
roots=[48,43,45,41]
patt=[0,1,2,1,0,2,1,2]
bar=4*beat; nb=int(total/bar)+2
for b in range(nb):
    c=chords[b%4]; t0=b*bar
    for k in range(8):
        n=c[patt[k]]+(12 if k in (2,6) else 0)
        add(P_(hz(n),1.2,0.22 if k%2==0 else 0.15),t0+k*beat/2)
    tt=np.arange(int(bar*SR))/SR
    bass=np.sin(2*np.pi*hz(roots[b%4])*tt)*np.exp(-tt*1.2)*0.35
    add(bass.astype(np.float32),t0); add((bass*0.6).astype(np.float32),t0+2*beat)
    for k in range(4):  # kick on 1,3 / clap-ish on 2,4
        kt=np.arange(int(0.25*SR))/SR
        if k%2==0: add((np.sin(2*np.pi*(50+90*np.exp(-kt*30))*kt)*np.exp(-kt*14)*0.5).astype(np.float32),t0+k*beat)
        else: add((rng.uniform(-1,1,len(kt))*np.exp(-kt*28)*0.12).astype(np.float32),t0+k*beat)
    for k in range(8):  # shaker
        st=np.arange(int(0.06*SR))/SR; add((rng.uniform(-1,1,len(st))*np.exp(-st*70)*0.05).astype(np.float32),t0+k*beat/2+0.0)
    # bell melody every other bar
    if b%2==1 and b<nb-1:
        mel=[c[2]+12,c[1]+12,c[0]+12,c[1]+12]
        for k,m in enumerate(mel):
            tt2=np.arange(int(0.9*SR))/SR; f=hz(m)
            bell=(np.sin(2*np.pi*f*tt2)+0.3*np.sin(2*np.pi*f*2.76*tt2))*np.exp(-tt2*5)*0.09
            add(bell.astype(np.float32),t0+k*beat)
# simple lowpass smoothing + fades
mus=np.convolve(mus,np.ones(3)/3,mode="same").astype(np.float32)
mus/=np.abs(mus).max()/0.8
fi=int(1.0*SR); mus[:fi]*=np.linspace(0,1,fi); fo=int(4*SR); end=int(total*SR); mus[end-fo:end]*=np.linspace(1,0,fo); mus[end:]=0
# ---- sfx
fx=np.zeros(N,np.float32)
def addfx(sig,t0):
    i=int(t0*SR); seg=sig[:max(0,N-i)]; fx[i:i+len(seg)]+=seg
for kind,t0 in sfx[1:]:
    d=0.7; n=int(d*SR); noise=rng.uniform(-1,1,n).astype(np.float32); env=np.sin(np.linspace(0,np.pi,n))**2
    # band sweep via moving average of varying width
    out=np.zeros(n,np.float32); acc=np.cumsum(noise)
    for i in range(1,n):
        w=int(40-35*i/n); out[i]=(acc[i]-acc[max(0,i-w)])/w
    addfx(out*env*0.6,t0-0.25)
for s in scenes:  # pop when tag card appears
    if s.get("tag"):
        tt=np.arange(int(0.18*SR))/SR; addfx((np.sin(2*np.pi*(500+900*tt/0.18)*tt)*np.exp(-tt*25)*0.35).astype(np.float32),s["start"]+0.35)
def wav(fn,x):
    subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","-",fn],input=np.clip(x,-1,1).astype(np.float32).tobytes())
wav(P+"/voice.wav",voice); wav(P+"/music.wav",mus); wav(P+"/sfx.wav",fx)
print("total",total)
