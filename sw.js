
importScripts('./hide-release-v01.js');
const RELEASE=globalThis.HideSeekReleaseDescriptor;
const CACHE='hide-seek:'+RELEASE.release_id;
const CORE=[
  './',
  './index.html',
  './styles.css',
  './hide-runtime.css',
  './hide-bridge.css',
  './vendor/taky/release-contract.js',
  './vendor/taky/pwa-update-state.js',
  './vendor/taky/central-evidence-browser-v1.js',
  './hide-release-v01.js',
  './hide-pwa-update-v01.js',
  './app.js',
  './hide-runtime.js',
  './hide-recall-direction-v1.js',
  './hide-language-evidence.js',
  './hide-family-character-profile-adapter-v1.js',
  './hide-character-asset-read-adapter-v1.js',
  './taky-family-auth-runtime-v1.js',
  './taky-account-auth-config-v1.js',
  './taky-google-account-auth-v1.js',
  './hide-family-runtime-bootstrap-v1.js',
  './hide-bridge.js',
  './hide-brand-current.js',
  './manifest.json',
  './assets/asset-map.json',
  './assets/icons/icon-180x180.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/backgrounds/academy.png',
  './assets/backgrounds/park.png',
  './assets/backgrounds/bookstore.png',
  './assets/backgrounds/cafe.png',
  './assets/backgrounds/classroom.png',
  './assets/backgrounds/station.png',
  './assets/characters/guide_default.png',
  './assets/characters/guide_smile.png',
  './assets/characters/guide_hint.png',
  './assets/characters/guide_note.png',
  './assets/characters/guide_radio.png',
  './assets/characters/guide_fever.png',
  './assets/characters/guide_focus.png',
  './assets/characters/guide_cheer.png',
  './assets/characters/rabbit.png',
  './assets/characters/fennec.png',
  './assets/characters/sloth.png',
  './assets/ui/home.png',
  './assets/ui/study.png',
  './assets/ui/quiz.png',
  './assets/ui/review.png',
  './assets/ui/mypage.png',
  './hide-term-decoder-v1.css',
  './hide-explorer-crew-authority-consumer-v2.js',
  './vendor/taky/explorer-crew/contracts-v1.js',
  './vendor/taky/explorer-crew/runtime-v1.js',
  './vendor/taky/explorer-crew/relation-affinity-v1.js',
  './vendor/taky/explorer-crew/shared-memory-episode-v1.js',
  './vendor/taky/explorer-crew/state-store-v1.js',
  './vendor/taky/explorer-crew/personality-source-board-v1.js',
  './vendor/taky/explorer-crew/personality-registry-v2.js',
  './vendor/taky/explorer-crew/behavior-patterns-v1.js',
  './vendor/taky/explorer-crew/personality-behavior-v1.js',
  './vendor/taky/explorer-crew/dialogue-script-authority-v1.js',
  './vendor/taky/explorer-crew/dialogue-personality-v1.js',
  './vendor/taky/explorer-crew/role-behavior-policy-v1.js',
  './vendor/taky/explorer-crew/semantic-command-compat-v1.js',
  './vendor/taky/explorer-crew/runtime-policy-pr10-v1.js',
  './vendor/taky/explorer-crew/runtime-policy-adapter-v1.js',
  './vendor/taky/explorer-crew/composable-asset-manifest-pr10-v1.js',
  './vendor/taky/explorer-crew/manifest-registry-pr10-v1.js',
  './vendor/taky/explorer-crew/asset-engine-pr10-v1.js',
  './vendor/taky/explorer-crew/ui-renderer-pr10-v1.js',
  './vendor/taky/explorer-crew/composable-promotion-gate-v1.js',
  './vendor/taky/explorer-crew/asset-render-adapter-v1.js',
  './vendor/taky/explorer-crew/runtime-log-pr10-v1.js',
  './vendor/taky/explorer-crew/runtime-log-adapter-v1.js',
  './vendor/taky/explorer-crew/canonical-runtime-v1.js',
  './vendor/taky/explorer-crew/handoff-v1.js',
  './vendor/taky/explorer-crew/companion-gate-registry-v1.js',
  './vendor/taky/explorer-crew/companion-gate-policy-v1.js',
  './vendor/taky/explorer-crew/story-gate-v1.js',
  './vendor/taky/explorer-crew/browser-host-v1.js',
  './vendor/taky/explorer-crew/render-plan-dom-consumer-v1.js',
  './vendor/taky/explorer-crew/system-v2.js',
  './vendor/taky/explorer-crew/app-consumer-v2.js',
  './characters/ui_cutouts/dubi.png',
  './characters/ui_cutouts/lori.png',
  './characters/ui_cutouts/ink.png',
  './characters/ui_cutouts/nova.png',
  './characters/ui_cutouts/take.png',
  './characters/ui_cutouts/zero.png',
  './characters/ui_cutouts/guide-07.png',
  './characters/ui_cutouts/guide-08.png',
  './characters/ui_cutouts/guide-09.png',
  './characters/ui_cutouts/guide-10.png',
  './characters/ui_cutouts/guide-11.png',
  './characters/ui_cutouts/guide-12.png',
  './characters/ui_cutouts/guide-13.png',
  './characters/ui_cutouts/guide-14.png',
  './characters/ui_cutouts/guide-15.png',
  './characters/ui_cutouts/guide-16.png',
  './characters/ui_cutouts/guide-17.png',
  './characters/ui_cutouts/guide-18.png',
  './characters/ui_cutouts/guide-19.png',
  './characters/ui_cutouts/guide-20.png',
  './characters/ui_cutouts/guide-21.png',
  './characters/ui_cutouts/guide-22.png',
  './characters/ui_cutouts/guide-23.png',
  './characters/ui_cutouts/guide-24.png',
  './hide-hanja-practice-v1.js',
  './hide-english-cycle-v1.js',
  './hide-english-pedagogy-v1.js',
  './data/hanja-reference-practice-projection-v1.json',
  './assets/world/hide_seek_forest_asset.png',
  './hide-term-decoder-v1.js',
  './hide-learning-term-loader-v1.js',
  './data/learning-term-recommendation-packs-v1.json',
  './hide-learning-evidence-source-v1.js',
  './hide-literacy-adapter-v1.js',
  './taky-learning-evidence-client-v1.js',
  './explorer-crew-voice/data-registry.js',
  './explorer-crew-voice/data-mock.js',
  './explorer-crew-voice/data-approved.js',
  './explorer-crew-voice/explorer-crew-dialogue-voice-bridge-v1.js',
  './explorer-crew-voice/explorer-crew-tts-mock-switch-v1.js',
  './explorer-crew-voice/explorer-crew-voice-event-adapter-v1.js',
  './explorer-crew-voice/explorer-crew-selection-preview-v1.js',
  './explorer-crew-voice/explorer-crew-learner-voice-context-v1.js',
  './explorer-crew-voice/explorer-crew-content-owner-v1.js',
  './explorer-crew-voice/explorer-crew-learning-voice-route-v1.js',
  './explorer-crew-voice/explorer-crew-ui-voice-integration-v1.js'
];
// Ignore version queries only for explicitly precached static files. Never broaden
// matching to family/API GET routes or user-specific responses.
const STATIC_CACHE_PATHS=new Set(CORE.map(p=>new URL(p,self.registration.scope).pathname));
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
  const isPrecachedStatic=STATIC_CACHE_PATHS.has(url.pathname);
  // Family/learning/auth endpoints are never stored in a shared service worker cache.
  if(!isPrecachedStatic&&event.request.mode!=="navigate")return;
  event.respondWith((async()=>{
    const exact=await caches.match(event.request);
    if(exact)return exact;
    if(isPrecachedStatic){
      const byStaticPath=await caches.match(event.request,{ignoreSearch:true});
      if(byStaticPath)return byStaticPath;
    }
    try{
      const response=await fetch(event.request);
      if(response.ok&&isPrecachedStatic&&!url.search){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }catch(error){
      if(event.request.mode==="navigate"){
        const home=await caches.match("./index.html");
        if(home)return home;
      }
      throw error;
    }
  })());
});
