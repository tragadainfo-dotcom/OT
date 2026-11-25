const CACHE='ot-223n-v2';
const RESOURCES=['./','index.html','document.css?v=1','search.js?v=2','view.js?v=1','document.js?v=2','document.json','../trainer/trainer.css?v=9','../site-nav.css?v=2','../site-nav.js?v=5','../manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(RESOURCES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ot-223n-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&!new URL(e.request.url).pathname.includes('/sources/')){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;}).catch(()=>caches.match(e.request).then(r=>r||Response.error())));});
