'use strict';
const CACHE='ot-trainer-v6';
const SHELL=['./','index.html','trainer.css?v=5','trainer.js?v=6','engine.js?v=6','storage.js','questions.json','manifest.webmanifest','icon.svg','import-report.html','import-report.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ot-trainer-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
// Shared navigation is cached explicitly because it lives outside this worker's scope.
self.addEventListener('message',event=>{if(event.data==='CACHE_SHARED')event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['../site-nav.css?v=1','../site-nav.js?v=2'])));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const scope=new URL('./',self.location.href).pathname;
 if(!url.pathname.startsWith(scope)&&!(/\/site-nav\.(css|js)$/.test(url.pathname)))return;
 // Keep source PDFs out of the app cache; they remain immutable downloadable evidence.
 if(url.pathname.includes('/sources/'))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>{
  const cached=await caches.match(event.request);if(cached)return cached;
  if(event.request.mode==='navigate')return caches.match(new URL('index.html',self.location.href));
  return Response.error();
 }));
});
