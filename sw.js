importScripts('./hide-release-v01.js');
const RELEASE=globalThis.HideSeekReleaseDescriptor;
const CACHE='hide-seek:'+RELEASE.release_id;
const EXPLORER_CREW_V2_CORE=[
'./vendor/taky/explorer-crew/app-consumer-v2.js',
'./vendor/taky/explorer-crew/asset-engine-pr10-v1.js',
'./vendor/taky/explorer-crew/asset-render-adapter-v1.js',
'./vendor/taky/explorer-crew/behavior-patterns-v1.js',
'./vendor/taky/explorer-crew/browser-host-v1.js',
'./vendor/taky/explorer-crew/canonical-runtime-v1.js',
'./vendor/taky/explorer-crew/companion-gate-policy-v1.js',
'./vendor/taky/explorer-crew/companion-gate-registry-v1.js',
'./vendor/taky/explorer-crew/companion-gate-registry-v1.json',
'./vendor/taky/explorer-crew/composable-asset-manifest-pr10-v1.js',
'./vendor/taky/explorer-crew/composable-asset-manifest-pr10-v1.json',
'./vendor/taky/explorer-crew/composable-promotion-gate-v1.js',
'./vendor/taky/explorer-crew/contracts-v1.js',
'./vendor/taky/explorer-crew/dialogue-personality-v1.js',
'./vendor/taky/explorer-crew/handoff-v1.js',
'./vendor/taky/explorer-crew/manifest-registry-pr10-v1.js',
'./vendor/taky/explorer-crew/personality-behavior-v1.js',
'./vendor/taky/explorer-crew/personality-registry-v1.js',
'./vendor/taky/explorer-crew/personality-registry-v2.js',
'./vendor/taky/explorer-crew/personality-source-board-v1.js',
'./vendor/taky/explorer-crew/relation-affinity-v1.js',
'./vendor/taky/explorer-crew/render-plan-dom-consumer-v1.js',
'./vendor/taky/explorer-crew/role-behavior-policy-v1.js',
'./vendor/taky/explorer-crew/runtime-log-adapter-v1.js',
'./vendor/taky/explorer-crew/runtime-log-pr10-v1.js',
'./vendor/taky/explorer-crew/runtime-policy-adapter-v1.js',
'./vendor/taky/explorer-crew/runtime-policy-pr10-v1.js',
'./vendor/taky/explorer-crew/runtime-v1.js',
'./vendor/taky/explorer-crew/semantic-command-compat-v1.js',
'./vendor/taky/explorer-crew/shared-memory-episode-v1.js',
'./vendor/taky/explorer-crew/state-store-v1.js',
'./vendor/taky/explorer-crew/story-gate-v1.js',
'./vendor/taky/explorer-crew/system-v2.js',
'./vendor/taky/explorer-crew/ui-renderer-pr10-v1.js',
'./vendor/taky/explorer-crew/source-lock-v2.json',
'./hide-explorer-crew-authority-consumer-v2.js',
'./characters/ui_cutouts/dubi.png',
'./characters/ui_cutouts/ink.png',
'./characters/ui_cutouts/lori.png',
'./characters/ui_cutouts/nova.png',
'./characters/ui_cutouts/take.png',
'./characters/ui_cutouts/zero.png'
];
const CORE=[...EXPLORER_CREW_V2_CORE,
  './','./index.html','./styles.css','./hide-runtime.css','./hide-bridge.css',
  './vendor/taky/release-contract.js','./vendor/taky/pwa-update-state.js',
  './hide-release-v01.js','./hide-pwa-update-v01.js',
  './app.js','./hide-runtime.js','./hide-bridge.js','./hide-brand-current.js','./manifest.json','./assets/asset-map.json',
  './assets/icons/icon-180x180.png','./assets/icons/icon-192x192.png','./assets/icons/icon-512x512.png',
  './assets/backgrounds/academy.png','./assets/backgrounds/park.png','./assets/backgrounds/bookstore.png','./assets/backgrounds/cafe.png','./assets/backgrounds/classroom.png','./assets/backgrounds/station.png',
  './assets/characters/guide_default.png','./assets/characters/guide_smile.png','./assets/characters/guide_hint.png','./assets/characters/guide_note.png','./assets/characters/guide_radio.png','./assets/characters/guide_fever.png','./assets/characters/guide_focus.png','./assets/characters/guide_cheer.png','./assets/characters/rabbit.png','./assets/characters/fennec.png','./assets/characters/sloth.png',
  './assets/ui/home.png','./assets/ui/study.png','./assets/ui/quiz.png','./assets/ui/review.png','./assets/ui/mypage.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('message',event=>{
  if(event.data?.type==='APPLY_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('hide-seek-runtime-')||k.startsWith('hide-seek:'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Promise.reject())));
});
