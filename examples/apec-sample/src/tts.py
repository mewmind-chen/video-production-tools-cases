import certifi; certifi.where=lambda: "/root/.ccr/ca-bundle.crt"
import asyncio, json, sys, edge_tts, os
P=sys.argv[1]; sc=json.load(open(P+"/script.json")); os.makedirs(P+"/tts",exist_ok=True)
async def one(text,fn):
    c=edge_tts.Communicate(text,"en-US-AnaNeural",rate="-8%",boundary="WordBoundary")
    words=[]
    with open(fn,"wb") as f:
        async for ch in c.stream():
            if ch["type"]=="audio": f.write(ch["data"])
            elif ch["type"]=="WordBoundary": words.append([ch["text"],ch["offset"]/1e7,(ch["offset"]+ch["duration"])/1e7])
    return words
async def main():
    out={}
    for s in sc:
        for i,(en,zh) in enumerate(s["lines"]):
            k=f'{s["id"]}_{i}'; out[k]=await one(en,f"{P}/tts/{k}.mp3"); print(k,len(out[k]))
    json.dump(out,open(P+"/words.json","w"),indent=0)
asyncio.run(main())
