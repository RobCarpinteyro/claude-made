// Guarda la presentación completa para que funcione sin internet una vez cargada.
// Páginas HTML: primero la red (siempre la versión más nueva) y, si no hay señal, la copia guardada.
// Imágenes, video y tipografías: primero la copia guardada.
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(/assets\.json$|sw\.js$/.test(u.pathname))return;
  if(/\.html$|\/$/.test(u.pathname)){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(function(r){
      if(r.ok){var cl=r.clone();caches.keys().then(function(ks){ks.forEach(function(k){if(k.indexOf('pretextos-')===0)caches.open(k).then(function(c){c.put(u.origin+u.pathname,cl.clone());});});});}
      return r;}).catch(function(){return caches.match(e.request,{ignoreSearch:true});}));
    return;
  }
  var range=e.request.headers.get('range');
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(r){
    if(!r)return fetch(e.request);
    if(!range)return r;
    return r.blob().then(function(b){var m=/bytes=(\d*)-(\d*)/.exec(range)||[];var s=m[1]?+m[1]:0,end=m[2]?+m[2]:b.size-1;if(end>=b.size)end=b.size-1;
      return new Response(b.slice(s,end+1),{status:206,headers:{'Content-Type':r.headers.get('Content-Type')||'video/mp4','Content-Range':'bytes '+s+'-'+end+'/'+b.size,'Content-Length':String(end-s+1),'Accept-Ranges':'bytes'}});});
  }));
});
