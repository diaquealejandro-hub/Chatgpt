const CACHE = 'ib-math-v1';
const ROOT = new URL('./', self.location.href);
const ASSETS = ['./','index.html','css/styles.css','js/app.js','js/generators.js','js/tricks.js','js/stats.js','js/storage.js','js/ui.js','manifest.json','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'].map(path=>new URL(path,ROOT).href);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ib-math-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',ROOT).href).then(cached=>cached||fetch(request))));return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    return fetch(request);
  }));
});
