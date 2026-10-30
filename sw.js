const CACHE='editar-pdf-v2';
const SHARED='editar-pdf-recebido';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png',
  './pdf.min.js','./pdf.worker.min.js','./pdf-lib.min.js','./fontkit.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==SHARED).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // PDF compartilhado pelo WhatsApp (ou outro app): guarda e abre o aplicativo
  if(e.request.method==='POST'&&url.pathname.endsWith('/receber')){
    e.respondWith((async()=>{
      try{
        const fd=await e.request.formData();
        const f=fd.get('pdf');
        if(f&&f.size){
          const c=await caches.open(SHARED);
          await c.put('./recebido.pdf',new Response(f,{headers:{'Content-Type':'application/pdf','X-Nome':encodeURIComponent(f.name||'documento.pdf')}}));
        }
      }catch(err){}
      return Response.redirect('./?recebido=1',303);
    })());
    return;
  }
  if(e.request.method!=='GET') return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:url.pathname.endsWith('/')||url.pathname.endsWith('index.html')});
    const net=fetch(e.request).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(e.request,r.clone());return r;}).catch(()=>hit);
    return hit||net;
  }));
});
