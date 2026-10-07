// Guarda la presentación completa para que funcione sin internet una vez cargada
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(/assets\.json$|\/$|index\.html$|sw\.js$/.test(u.pathname))return; // siempre frescos
  var range=e.request.headers.get('range');
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(r){
    if(!r)return fetch(e.request);
    if(!range)return r;
    return r.blob().then(function(b){var m=/bytes=(\d*)-(\d*)/.exec(range)||[];var s=m[1]?+m[1]:0,end=m[2]?+m[2]:b.size-1;if(end>=b.size)end=b.size-1;
      return new Response(b.slice(s,end+1),{status:206,headers:{'Content-Type':r.headers.get('Content-Type')||'video/mp4','Content-Range':'bytes '+s+'-'+end+'/'+b.size,'Content-Length':String(end-s+1),'Accept-Ranges':'bytes'}});});
  }));
});
