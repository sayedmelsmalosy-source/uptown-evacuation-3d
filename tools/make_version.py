# writes version.json: every file the offline copy needs, with size and SHA-256, grouped into core + per-floor drawings
import json,hashlib,os,sys,datetime
os.chdir(os.path.join(os.path.dirname(__file__),'..'))
def ent(p):b=open(p,'rb').read();return {'p':p,'size':len(b),'sha':hashlib.sha256(b).hexdigest()}
core=['index.html','manifest.webmanifest','config.json','icons/icon-192.png','icons/icon-512.png','data/building.json','avatar/me.png']
for r,_,fs in os.walk('vendor'):
    for f in fs:core.append(os.path.join(r,f).replace('\\','/'))
B=json.load(open('data/building.json'))
floors={f['k']:[ent(f['tex'])] for f in B['floors'] if f.get('tex') and os.path.exists(f['tex'])}
now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=4)))
ver=sys.argv[1] if len(sys.argv)>1 else now.strftime('%Y.%m.%d-%H%M')
json.dump({'version':ver,'date':now.strftime('%Y-%m-%d'),'core':[ent(p) for p in core],'floors':floors},open('version.json','w'),indent=0)
print('version',ver,'core files',len(core),'floors',len(floors))
