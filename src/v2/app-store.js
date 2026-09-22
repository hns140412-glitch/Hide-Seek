(() => {
  'use strict';
  const KEY='hide_seek_v2_state';
  const VERSION=1;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const now=()=>new Date().toISOString();
  const initial=()=>({version:VERSION,profile:{displayName:'탐험가'},missions:[],activeMissionId:null,activeSession:null,captureSession:null,events:[],updatedAt:now()});
  function migrate(raw){
    const s={...initial(),...(raw||{})};
    s.version=VERSION;
    s.profile={...initial().profile,...(raw?.profile||{})};
    s.missions=Array.isArray(raw?.missions)?raw.missions:[];
    s.events=Array.isArray(raw?.events)?raw.events:[];
    s.captureSession=raw?.captureSession&&typeof raw.captureSession==='object'?raw.captureSession:null;
    return s;
  }
  function load(){try{return migrate(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return initial()}}
  let state=load();
  const listeners=new Set();
  function snapshot(){return clone(state)}
  function persist(){state.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(state));listeners.forEach(fn=>fn(snapshot()));window.dispatchEvent(new CustomEvent('hide-v2-state-saved',{detail:{updatedAt:state.updatedAt}}))}
  function transaction(mutator){const draft=clone(state);mutator(draft);state=migrate(draft);persist();return snapshot()}
  function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
  function reset(){state=initial();persist()}
  window.HideV2Store=Object.freeze({KEY,VERSION,snapshot,transaction,subscribe,reset});
})();