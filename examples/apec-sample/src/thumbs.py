import json, urllib.request, urllib.parse, time, sys, os, re
UA="KidsVideoSample/0.1 (https://github.com/mewmind-chen/video-production-tools-cases) python-urllib"
out=sys.argv[1]; terms=sys.argv[2:]
def get(url):
    for i in range(5):
        try: return urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":UA}),timeout=60).read()
        except Exception as e: print("retry",e,file=sys.stderr); time.sleep(4*(i+1))
db={}
if os.path.exists(out+"/db.json"): db=json.load(open(out+"/db.json"))
for term in terms:
    r=json.loads(get("https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({"action":"query","generator":"search","gsrsearch":term,"gsrnamespace":6,"gsrlimit":10,"prop":"imageinfo","iiprop":"url|size|extmetadata|mime","iiurlwidth":480,"format":"json"})))
    for p in r.get("query",{}).get("pages",{}).values():
        ii=p["imageinfo"][0]
        if "image" not in ii["mime"] or ii["width"]<1600: continue
        if p["title"] in db: continue
        k="i%03d"%len(db); m=ii.get("extmetadata",{})
        db[p["title"]]=dict(k=k,url=ii["url"],w=ii["width"],h=ii["height"],lic=m.get("LicenseShortName",{}).get("value"),artist=re.sub("<[^>]+>","",m.get("Artist",{}).get("value","")).strip(),term=term)
        open(f"{out}/{k}.jpg","wb").write(get(ii["thumburl"])); time.sleep(0.5)
    time.sleep(1)
json.dump(db,open(out+"/db.json","w"),indent=1,ensure_ascii=False)
for t,v in db.items(): print(v["k"],v["w"],v["h"],v["lic"],t)
