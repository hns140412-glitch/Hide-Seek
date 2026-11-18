(() => {
  'use strict';
  const RELEASE=globalThis.HideSeekReleaseDescriptor;
  const ReleaseContract=globalThis.TakyReleaseContract;
  const UpdateState=globalThis.TakyPwaUpdateState;
  const STATE_KEY='hide_seek_pwa_update_state_v01';
  const RESTORE_KEY='hide_seek_pwa_update_restore_v01';
  const CHECK_MS=2000, INSTALL_MS=12000, RELOAD_MS=4000;
  let registration=null;
  let state=sessionStorage.getItem(STATE_KEY)||'IDLE';

  function persist(next){
    state=next;
    sessionStorage.setItem(STATE_KEY,state);
    window.dispatchEvent(new CustomEvent('hide-seek-pwa-update-state',{detail:{state,release_id:RELEASE?.release_id||null}}));
    return state;
  }
  function step(event,context={}){
    const result=UpdateState?.transition?.(state,event,context);
    if(!result?.ok) return result||{ok:false,state,error:'UPDATE_STATE_UNAVAILABLE'};
    persist(result.state);
    return result;
  }
  // While the launch gate covers the app nothing has been started in this page view, so applying a waiting
  // release is safe. After the gate lifts, only the app's own safe points count.
  let launchGated=!!document.getElementById('hideLaunchGate');
  function isSafePoint(){
    if(launchGated) return true;
    try{return globalThis.HideSeekPwaSafePoint?.()===true}catch{return false}
  }
  async function evaluateWaiting(reason='ACTIVE_HIDE_SESSION'){
    const waiting=registration?.waiting;
    if(!waiting) return {ok:false,reason:'NO_WAITING_WORKER'};
    if(state!=='DOWNLOADED_WAITING'){
      if(state!=='UPDATE_DETECTED') persist('UPDATE_DETECTED');
      const d=step('DOWNLOAD_COMPLETE');
      if(!d?.ok) return d;
    }
    const evaluated=step('EVALUATE_SAFE_POINT',{safe_point:isSafePoint(),reason});
    if(!evaluated?.ok||evaluated.state!=='SAFE_TO_ACTIVATE') return evaluated;
    const activating=step('ACTIVATE',{safe_point:true});
    if(!activating?.ok) return activating;
    sessionStorage.setItem(RESTORE_KEY,RELEASE.release_id);
    waiting.postMessage({type:'APPLY_UPDATE',release_id:RELEASE.release_id});
    return activating;
  }
  function observe(reg){
    registration=reg;
    if(reg.waiting&&navigator.serviceWorker.controller){
      persist('UPDATE_DETECTED'); step('DOWNLOAD_COMPLETE'); evaluateWaiting();
    }
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;
      if(!worker) return;
      if(navigator.serviceWorker.controller){
        if(state==='IDLE'||state==='READY'||state==='FAILED') persist('IDLE');
        step('DETECT');
      }
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller&&reg.waiting){
          if(state==='IDLE') step('DETECT');
          if(state==='UPDATE_DETECTED') step('DOWNLOAD_COMPLETE');
          evaluateWaiting();
        }
      });
    });
  }
  function finalizeRestore(){
    const pending=sessionStorage.getItem(RESTORE_KEY);
    if(!pending) return;
    if(state==='RESTORING'){ const r=step('RESTORE_COMPLETE'); if(r?.ok) step('SETTLE'); }
    else persist('IDLE');
    sessionStorage.removeItem(RESTORE_KEY);
    window.dispatchEvent(new CustomEvent('hide-seek-pwa-update-restored',{detail:{release_id:pending}}));
  }
  function liftGate(){
    launchGated=false;
    const g=document.getElementById('hideLaunchGate');
    if(!g) return;
    g.style.opacity='0'; g.style.pointerEvents='none'; setTimeout(()=>g.remove(),260);
  }
  function holdGate(text){
    const g=document.getElementById('hideLaunchGate');
    if(!g) return;
    g.dataset.held='1';
    const t=document.getElementById('hideLaunchGateText'); if(t&&text) t.textContent=text;
  }
  const waitMs=ms=>new Promise(r=>setTimeout(r,ms));
  /* Launch gate. A page served from the cache may be an older release. Before showing it, ask the network once
     whether a newer release exists. If one does, keep the cover up, let it install and reload into it, so the
     learner never sees the old screen replaced under their hands. No controller (first visit), offline, or a
     slow answer: show the app at once; a late update then waits for a safe point as before. */
  async function launchGate(reg){
    try{
      if(!reg||!navigator.serviceWorker.controller||navigator.onLine===false) return liftGate();
      if(!reg.waiting&&!reg.installing) await Promise.race([reg.update().catch(()=>null),waitMs(CHECK_MS)]);
      if(!reg.waiting&&!reg.installing) return liftGate();
      holdGate('새 탐험 길을 준비하는 중');
      const worker=reg.installing;
      if(worker) await Promise.race([new Promise(r=>{const on=()=>{if(worker.state==='installed'||worker.state==='redundant'||worker.state==='activated')r()};worker.addEventListener('statechange',on);on()}),waitMs(INSTALL_MS)]);
      if(!reg.waiting) return liftGate();
      if(state!=='ACTIVATING'){   // the install listener may already have applied it
        const applied=await evaluateWaiting('LAUNCH');
        if(!applied?.ok||applied.state!=='ACTIVATING') return liftGate();
      }
      await waitMs(RELOAD_MS); liftGate();   // the reload normally happens first
    }catch{ liftGate(); }
  }
  let registering=null;
  function register(){ return registering||(registering=registerOnce()); }
  async function registerOnce(){
    if(!('serviceWorker' in navigator)) return {ok:false,reason:'SERVICE_WORKER_UNSUPPORTED'};
    const valid=ReleaseContract?.validateDescriptor?.(RELEASE);
    if(!valid?.ok) return {ok:false,reason:'INVALID_RELEASE_DESCRIPTOR'};
    try{
      const reg=await navigator.serviceWorker.register('./sw.js');
      observe(reg); finalizeRestore(); launchGate(reg); return {ok:true,registration:reg};
    }catch(error){ step('FAIL',{error:String(error?.message||error)}); return {ok:false,reason:String(error?.message||error)}; }
  }
  navigator.serviceWorker?.addEventListener?.('controllerchange',()=>{
    if(!sessionStorage.getItem(RESTORE_KEY)) return;
    if(state==='ACTIVATING') step('CONTROLLER_CHANGED');
    location.reload();
  });
  window.addEventListener('hide-seek-state-saved',()=>evaluateWaiting());
  window.addEventListener('hide-seek-safe-point',()=>evaluateWaiting('SAFE_POINT_EVENT'));
  // registered at once (not on load) so the launch gate can check for a newer release before the app is shown
  register().then(r=>{ if(!r?.ok) liftGate(); },()=>liftGate());
  globalThis.HideSeekPwaUpdate=Object.freeze({version:'1.0.0',capability:'CAP-PWA-UPDATE-001',state:()=>state,release:()=>RELEASE,evaluateWaiting,register});
})();
