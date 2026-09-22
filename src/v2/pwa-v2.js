(() => {
  'use strict';
  const RELEASE=globalThis.HideSeekV2ReleaseDescriptor;
  const UpdateState=globalThis.TakyPwaUpdateState;
  const STATE_KEY='hide_seek_v2_pwa_update_state';
  const RESTORE_KEY='hide_seek_v2_pwa_restore';
  let registration=null;
  let registerPromise=null;
  let state=sessionStorage.getItem(STATE_KEY)||'IDLE';

  function persist(next){
    state=next;
    sessionStorage.setItem(STATE_KEY,state);
    window.dispatchEvent(new CustomEvent('hide-v2-pwa-update-state',{detail:{state,release_id:RELEASE?.release_id||null}}));
  }
  function step(event,context={}){
    const r=UpdateState?.transition?.(state,event,context);
    if(!r?.ok)return r||{ok:false,state,error:'UPDATE_STATE_UNAVAILABLE'};
    persist(r.state);return r;
  }
  function safePoint(){
    const s=globalThis.HideV2Store?.snapshot?.();
    if(!s)return false;
    if(s.captureSession&&['CAPTURING','REVIEW'].includes(s.captureSession.status))return false;
    if(s.activeSession&&s.activeSession.stage!=='COMPLETE')return false;
    return true;
  }
  async function evaluateWaiting(reason='ACTIVE_V2_WORK'){
    const waiting=registration?.waiting;
    if(!waiting)return {ok:false,reason:'NO_WAITING_WORKER'};
    if(state!=='DOWNLOADED_WAITING'){
      if(state!=='UPDATE_DETECTED')persist('UPDATE_DETECTED');
      const d=step('DOWNLOAD_COMPLETE');if(!d?.ok)return d;
    }
    const e=step('EVALUATE_SAFE_POINT',{safe_point:safePoint(),reason});
    if(!e?.ok||e.state!=='SAFE_TO_ACTIVATE')return e;
    const a=step('ACTIVATE',{safe_point:true});if(!a?.ok)return a;
    sessionStorage.setItem(RESTORE_KEY,RELEASE?.release_id||'unknown');
    waiting.postMessage({type:'APPLY_UPDATE',release_id:RELEASE?.release_id||null});
    return a;
  }
  function observe(reg){
    registration=reg;
    if(reg.waiting&&navigator.serviceWorker.controller){
      persist('UPDATE_DETECTED');step('DOWNLOAD_COMPLETE');evaluateWaiting();
    }
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;if(!worker)return;
      if(navigator.serviceWorker.controller){
        if(['IDLE','READY','FAILED'].includes(state))persist('IDLE');
        step('DETECT');
      }
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller&&reg.waiting){
          if(state==='IDLE')step('DETECT');
          if(state==='UPDATE_DETECTED')step('DOWNLOAD_COMPLETE');
          evaluateWaiting();
        }
      });
    });
  }
  function finalizeRestore(){
    const pending=sessionStorage.getItem(RESTORE_KEY);if(!pending)return;
    if(state==='RESTORING'){const r=step('RESTORE_COMPLETE');if(r?.ok)step('SETTLE')}
    else persist('IDLE');
    sessionStorage.removeItem(RESTORE_KEY);
  }
  async function register(){
    if(!('serviceWorker' in navigator))return {ok:false,reason:'SERVICE_WORKER_UNSUPPORTED'};
    try{
      const reg=await navigator.serviceWorker.register('./sw-v2.js',{scope:'./'});
      registration=reg;
      observe(reg);finalizeRestore();
      return {ok:true,registration:reg};
    }catch(error){
      step('FAIL',{error:String(error?.message||error)});
      return {ok:false,reason:String(error?.message||error)};
    }
  }
  function ensureRegistered(){
    if(registerPromise)return registerPromise;
    registerPromise=register().finally(()=>{ if(!registration) registerPromise=null; });
    return registerPromise;
  }
  navigator.serviceWorker?.addEventListener?.('controllerchange',()=>{
    if(!sessionStorage.getItem(RESTORE_KEY))return;
    if(state==='ACTIVATING')step('CONTROLLER_CHANGED');
    location.reload();
  });
  window.addEventListener('hide-v2-state-saved',()=>evaluateWaiting());
  window.addEventListener('online',()=>registration?.update?.());
  if(document.readyState==='complete')ensureRegistered();
  else window.addEventListener('load',()=>ensureRegistered(),{once:true});

  globalThis.HideV2Pwa=Object.freeze({
    version:'2.0.0',
    state:()=>state,
    release:()=>RELEASE,
    safePoint,
    evaluateWaiting,
    register,
    ensureRegistered
  });
})();
