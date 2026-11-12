// Uptown evacuation plan — offline service worker.
// Online: always the network (so people get the newest approved plan).
// Offline: only files that were downloaded with "Download the plan for offline use" and verified by SHA-256.
const META='uptown-meta';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
async function meta(){try{const c=await caches.open(META);const r=await c.match('meta');return r?await r.json():null;}catch(e){return null;}}
async function saved(req){const m=await meta();if(!m||!m.complete||!m.cache)return null;const c=await caches.open(m.cache);return (await c.match(req,{ignoreSearch:true}))||null;}
const NOCOPY=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Evacuation plan — offline</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a111b;color:#edf2f8;font:16px system-ui;padding:20px}div{max-width:460px}h1{font-size:20px}p{color:#95a6ba}.ar{direction:rtl;color:#d9fff0}</style></head>
<body><div><h1>No internet — the evacuation plan is not saved on this phone</h1><p>This browser has no offline copy yet (or it was deleted). Connect to the internet once, open the plan and tap “⬇ Offline” → “Download the plan for offline use”.</p>
<p class="ar">مفيش إنترنت والمخطط مش محفوظ على الموبايل ده. اتصل بالإنترنت مرة، افتح المخطط واضغط «⬇ Offline» ثم «تنزيل المخطط للاستخدام بدون إنترنت».</p>
<p><b>In an emergency:</b> leave by the nearest stair — never the lift — and go to the Assembly Point. Follow your supervisor.</p></div></body></html>`;
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin!==location.origin)return;
  const base=new URL('./',self.registration.scope).pathname;if(!u.pathname.startsWith(base)||u.pathname.startsWith(base+'uptown-bim/')||u.pathname.startsWith(base+'fire-code-ch12/'))return;
  if(u.pathname.endsWith('/version.json')||u.searchParams.has('dl'))return; // update checks and downloads always go to the network
  e.respondWith((async()=>{
    try{const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),r.mode==='navigate'?8000:20000);const res=await fetch(r,{signal:ctl.signal});clearTimeout(to);return res;}
    catch(err){
      if(r.mode==='navigate'){const s=(await saved(new Request(new URL('index.html',self.registration.scope))))||(await saved(r));return s||new Response(NOCOPY,{headers:{'Content-Type':'text/html; charset=utf-8'}});}
      const s=await saved(r);return s||new Response('Not saved for offline use',{status:504,statusText:'Not saved offline'});}
  })());});
