const CACHE="admin-v2";
const SHELL=["/admin/","/shared/base.css?v2","/shared/common.js?v2","/admin/admin.js?v2","/admin/icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("admin-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.pathname.startsWith("/api/"))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&(u.origin===location.origin||u.host.endsWith("gstatic.com")||u.host.endsWith("googleapis.com"))){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:e.request.mode==="navigate"}).then(r=>r||caches.match("/admin/"))))});
