importScripts('./src/v2/release-v2.js');
const RELEASE=globalThis.HideSeekV2ReleaseDescriptor;
const CACHE='hide-seek-v2:'+RELEASE.release_id;
const CORE=[
  './v2.html','./manifest-v2.json',
  './styles.css','./hide-runtime.css','./hide-bridge.css','./src/v2/v2.css',
  './vendor/taky/event-envelope.js','./vendor/taky/vision-ingest.js','./vendor/taky/http-json.js','./vendor/taky/pwa-update-state.js',
  './hide-learning-basis-v01.js','./hide-language-evidence.js','./hide-language-model.js','./hide-family-ocr-adapter.js',
  './src/v2/release-v2.js','./src/v2/app-store.js','./src/v2/mission-service.js','./src/v2/memory-engine.js','./src/v2/trail-engine.js','./src/v2/crew-adapter.js',
  './src/v2/learning-session.js','./src/v2/session-service.js','./src/v2/capture-store.js','./src/v2/capture-controller.js',
  './src/v2/router.js','./src/v2/legacy-migration.js','./src/v2/ready-bridge.js','./src/v2/pwa-v2.js','./src/v2/mobile-shell.js','./src/v2/app.js',
  './assets/icons/icon-192x192.png','./assets/icons/icon-512x512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('message',event=>{
  if(event.data?.type==='APPLY_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k.startsWith('hide-seek-v2:')&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request).then(response=>{
        if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./v2.html',copy));}
        return response;
      }).catch(()=>caches.match('./v2.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }))
  );
});
