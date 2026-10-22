/* Offline: network first, cache as fallback. Raise CACHE whenever any file changes. */
const CACHE='wyr-v7';
const ASSETS=['./','index.html','more.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){   /* fonts: cached after the first visit, so the look survives offline */
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));return}
  if(u.origin!==location.origin)return;   /* Firebase and everything else: never touched */
  /* network first, but a slow or missing connection falls back to the saved copy after 3 seconds */
  e.respondWith(caches.match(r).then(cached=>{
    const net=Promise.race([fetch(r),new Promise((_,rej)=>setTimeout(rej,3000))]).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res});
    return net.catch(()=>cached||caches.match('index.html'));
  }));
});
