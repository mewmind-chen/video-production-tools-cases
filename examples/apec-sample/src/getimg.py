import json, urllib.request, urllib.parse, time, sys
UA="KidsVideoSample/0.1 (https://github.com/mewmind-chen/video-production-tools-cases) python-urllib"
S=sys.argv[1]; keys=sys.argv[2:]
db=json.load(open(S+"/thumbs/db.json")); bykey={v["k"]:(t,v) for t,v in db.items()}
def get(url):
    for i in range(6):
        try: return urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":UA}),timeout=120).read()
        except Exception as e: print("retry",e,file=sys.stderr); time.sleep(5*(i+1))
credits=[]
for k in keys:
    t,v=bykey[k]
    r=json.loads(get("https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({"action":"query","titles":t,"prop":"imageinfo","iiprop":"url","iiurlwidth":2560,"format":"json"})))
    ii=list(r["query"]["pages"].values())[0]["imageinfo"][0]
    open(f"{S}/proj/img/{k}.jpg","wb").write(get(ii["thumburl"]))
    credits.append(dict(k=k,title=t[5:],artist=v["artist"],lic=v["lic"],url=ii["descriptionurl"]))
    print(k,"ok"); time.sleep(1)
json.dump(credits,open(S+"/proj/credits.json","w"),indent=1,ensure_ascii=False)
