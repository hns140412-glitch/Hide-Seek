const CACHE="hide-seek-capture-v05";
const CORE=[
  "./","./index.html","./styles.css","./hide-runtime.css","./hide-bridge.css","./app.js","./hide-runtime.js","./hide-bridge.js","./hide-brand-current.js","./manifest.json","./assets/asset-map.json",
  "./assets/icons/icon-180x180.png","./assets/icons/icon-192x192.png","./assets/icons/icon-512x512.png",
  "./assets/backgrounds/academy.png","./assets/backgrounds/park.png","./assets/backgrounds/bookstore.png","./assets/backgrounds/cafe.png","./assets/backgrounds/classroom.png","./assets/backgrounds/station.png",
  "./assets/characters/guide_default.png","./assets/characters/guide_smile.png","./assets/characters/guide_hint.png","./assets/characters/guide_note.png","./assets/characters/guide_radio.png","./assets/characters/guide_fever.png","./assets/characters/guide_focus.png","./assets/characters/guide_cheer.png","./assets/characters/rabbit.png","./assets/characters/fennec.png","./assets/characters/sloth.png",
  "./assets/ui/home.png","./assets/ui/study.png","./assets/ui/quiz.png","./assets/ui/review.png","./assets/ui/mypage.png"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("message",event=>{
  if(event.data?.type==="APPLY_UPDATE")self.skipWaiting();
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>event.request.mode==="navigate"?caches.match("./index.html"):Promise.reject())));
});
