(() => {
  'use strict';
  const RELEASE=globalThis.HideSeekReleaseDescriptor;
  const ReleaseContract=globalThis.TakyReleaseContract;
  const UpdateState=globalThis.TakyPwaUpdateState;
  const STATE_KEY='hide_seek_pwa_update_state_v01';
  const RESTORE_KEY='hide_seek_pwa_update_restore_v01';
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
  function isSafePoint(){
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
  async function register(){
    if(!('serviceWorker' in navigator)) return {ok:false,reason:'SERVICE_WORKER_UNSUPPORTED'};
    const valid=ReleaseContract?.validateDescriptor?.(RELEASE);
    if(!valid?.ok) return {ok:false,reason:'INVALID_RELEASE_DESCRIPTOR'};
    try{
      const reg=await navigator.serviceWorker.register('./sw.js');
      observe(reg); finalizeRestore(); return {ok:true,registration:reg};
    }catch(error){ step('FAIL',{error:String(error?.message||error)}); return {ok:false,reason:String(error?.message||error)}; }
  }
  navigator.serviceWorker?.addEventListener?.('controllerchange',()=>{
    if(!sessionStorage.getItem(RESTORE_KEY)) return;
    if(state==='ACTIVATING') step('CONTROLLER_CHANGED');
    location.reload();
  });
  window.addEventListener('hide-seek-state-saved',()=>evaluateWaiting());
  window.addEventListener('hide-seek-safe-point',()=>evaluateWaiting('SAFE_POINT_EVENT'));
  window.addEventListener('load',()=>register());
  globalThis.HideSeekPwaUpdate=Object.freeze({version:'1.0.0',capability:'CAP-PWA-UPDATE-001',state:()=>state,release:()=>RELEASE,evaluateWaiting,register});
})();
