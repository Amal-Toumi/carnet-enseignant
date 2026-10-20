// Service worker: keeps the app working without internet, and picks up new versions on the first reopening when online.
// Network first (4 s limit), cache as the offline fallback. Change V when you ship a new version so old caches are removed.
const V='carnet-v3';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{
  const c=await caches.open(V);
  const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r});
  try{return await Promise.race([net,new Promise((_,no)=>setTimeout(()=>no(new Error('slow')),4000))])}
  catch(x){const hit=await c.match(e.request,{ignoreSearch:true});return hit||net.catch(()=>c.match('index.html'))}
 })())});
