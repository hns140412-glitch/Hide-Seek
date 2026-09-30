(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewSystemV2,root?.TakyExplorerCrewPersonalityRegistry);
  if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./vendor/taky/explorer-crew/system-v2.js'),require('./vendor/taky/explorer-crew/personality-registry-v2.js'));
  else if(root)root.HideExplorerCrewAuthorityConsumer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(systemV2,personalityRegistry){
  'use strict';
  const VERSION='HIDE_EXPLORER_CREW_AUTHORITY_CONSUMER_V2';
  const SYSTEM_VERSION='EXPLORER_CREW_SYSTEM_V2';
  const SYSTEM_BOUND=systemV2?.VERSION===SYSTEM_VERSION;
  const PROJECTION_KEY='hide_explorer_crew_authority_projection_v2';
  const CANONICAL_STATE_KEY='taky_explorer_crew_canonical_v1';
  const CREW_EVENT_PARAM='crew_event';
  const AUTHORITY=Object.freeze({
    repository:'hns140412-glitch/TAKY',
    commit:'bdc6aeb94aaf82dffbcee4f47c170110b7eff959',
    runtime_schema_version:'CREW_RUNTIME_TRACE_V2',
    runtime_system_version:SYSTEM_VERSION,
    source_lock_version:'EXPLORER_CREW_V2_SOURCE_LOCK_20261001'
  });
  const roster=()=>Array.isArray(systemV2?.ALL_CREW)?systemV2.ALL_CREW:[];
  const clean=v=>typeof v==='string'?v.trim():'';
  const validId=id=>roster().includes(clean(id));
  const nameOf=id=>personalityRegistry?.get?.(id)?.name_ko||personalityRegistry?.get?.(id)?.display_name||id;

  function empty(){return Object.freeze({
    version:VERSION,system_version:SYSTEM_VERSION,status:SYSTEM_BOUND?'UNBOUND':'RUNTIME_UNAVAILABLE',
    character_id:null,relation_state:null,source:null,source_event_id:null,observed_at:null,authority:AUTHORITY,
    relation_write:false,affinity_write:false,memory_write:false,behavior_owner:false,asset_resolver:false,runtime_owner:false,renderer:false
  })}
  function validProjection(x){return !!(SYSTEM_BOUND&&x&&x.version===VERSION&&x.system_version===SYSTEM_VERSION&&validId(x.character_id)&&x.authority?.commit===AUTHORITY.commit&&x.runtime_owner===false&&x.relation_write===false&&x.affinity_write===false&&x.memory_write===false&&x.behavior_owner===false&&x.asset_resolver===false)}
  function load(storage){try{const x=JSON.parse(storage?.getItem?.(PROJECTION_KEY)||'null');return validProjection(x)?Object.freeze(x):empty()}catch{return empty()}}
  function persist(storage,input={}){
    if(!SYSTEM_BOUND)return {ok:false,reason:'CANONICAL_RUNTIME_REQUIRED',projection:empty()};
    const id=clean(input.character_id);if(!validId(id))return {ok:false,reason:'CHARACTER_ID_NOT_COMPATIBLE',projection:load(storage)};
    const at=clean(input.observed_at)||new Date().toISOString(),current=load(storage);
    if(current.status==='BOUND'&&current.observed_at){
      const prev=Date.parse(current.observed_at),next=Date.parse(at);
      if(Number.isFinite(prev)&&Number.isFinite(next)&&next<prev)return {ok:false,reason:'STALE_PROJECTION',projection:current};
      if(Number.isFinite(prev)&&Number.isFinite(next)&&next===prev&&current.character_id!==id)return {ok:false,reason:'PROJECTION_CONFLICT_SAME_TIME',projection:current};
    }
    const next=Object.freeze({
      version:VERSION,system_version:SYSTEM_VERSION,status:'BOUND',character_id:id,
      relation_state:clean(input.relation_state)||'MAIN_COMPANION',source:clean(input.source)||'CANONICAL_PROJECTION',
      source_event_id:clean(input.source_event_id)||null,observed_at:at,authority:AUTHORITY,
      relation_write:false,affinity_write:false,memory_write:false,behavior_owner:false,asset_resolver:false,runtime_owner:false,renderer:false
    });
    storage?.setItem?.(PROJECTION_KEY,JSON.stringify(next));return {ok:true,projection:next};
  }
  function consumeCanonicalStore(storage){
    try{
      const raw=storage?.getItem?.(CANONICAL_STATE_KEY);if(!raw)return {ok:true,consumed:false,reason:'NO_LOCAL_CANONICAL_STATE',projection:load(storage)};
      const env=JSON.parse(raw),rel=env?.state?.relation||env?.relation,id=clean(rel?.main_character_id),member=id?rel?.members?.[id]:null;
      if(!id)return {ok:true,consumed:false,reason:'NO_CANONICAL_MAIN',projection:load(storage)};
      if(!validId(id))return {ok:false,consumed:false,reason:'CHARACTER_ID_NOT_COMPATIBLE',projection:load(storage)};
      if(clean(member?.relation_state)!=='MAIN_COMPANION')return {ok:false,consumed:false,reason:'MAIN_RELATION_STATE_REQUIRED',projection:load(storage)};
      const saved=persist(storage,{character_id:id,relation_state:'MAIN_COMPANION',source:'CANONICAL_STATE_ENVELOPE',observed_at:clean(env?.updated_at)||new Date().toISOString()});
      return {...saved,consumed:saved.ok};
    }catch{return {ok:false,consumed:false,reason:'INVALID_LOCAL_CANONICAL_STATE',projection:load(storage)}}
  }
  function decode(token){try{if(typeof Buffer!=='undefined')return JSON.parse(Buffer.from(token,'base64url').toString('utf8'));const s=String(token||'').replace(/-/g,'+').replace(/_/g,'/'),pad=s+'='.repeat((4-s.length%4)%4),bin=atob(pad),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes))}catch{return null}}
  function consumeHandoffUrl(rawUrl,{storage,replaceUrl}={}){
    let url;try{url=new URL(rawUrl,typeof location!=='undefined'?location.href:'http://localhost/')}catch{return {ok:false,consumed:false,reason:'INVALID_URL',projection:load(storage)}}
    const token=url.searchParams.get(CREW_EVENT_PARAM);if(!token)return {ok:true,consumed:false,reason:'NO_CREW_EVENT',projection:load(storage)};
    const packed=decode(token),event=packed?.event||null,rel=event?.relation_event||null,type=clean(rel?.type),id=clean(rel?.character_id);
    if(!['MAIN_SELECTED','MAIN_CHANGED'].includes(type)||!validId(id))return {ok:false,consumed:false,reason:'UNSUPPORTED_CREW_EVENT',projection:load(storage)};
    const saved=persist(storage,{character_id:id,relation_state:'MAIN_COMPANION',source:'CANONICAL_HANDOFF_EVENT',source_event_id:clean(rel?.event_id)||clean(event?.event_id)||null,observed_at:clean(rel?.at)||clean(event?.at)||clean(packed?.at)||new Date().toISOString()});
    if(saved.ok){url.searchParams.delete(CREW_EVENT_PARAM);const cleanUrl=url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():'')+url.hash;if(typeof replaceUrl==='function')replaceUrl(cleanUrl)}
    return {...saved,consumed:saved.ok};
  }
  function syncHost(host,projection=empty()){
    if(!host?.dataset)return false;
    host.dataset.explorerCrewAuthority=AUTHORITY.commit;host.dataset.explorerCrewRuntime='CANONICAL_ONLY';
    host.dataset.explorerCrewSystemVersion=SYSTEM_VERSION;host.dataset.explorerCrewSourceLock=AUTHORITY.source_lock_version;
    host.dataset.explorerCrewStatus=projection.status;host.dataset.explorerCrewRuntimeOwner='false';
    if(projection.character_id)host.dataset.explorerCrewCharacter=projection.character_id;else delete host.dataset.explorerCrewCharacter;
    return true;
  }
  const CORE6_STATIC=Object.freeze({dubi:'./characters/ui_cutouts/dubi.png',lori:'./characters/ui_cutouts/lori.png',ink:'./characters/ui_cutouts/ink.png',nova:'./characters/ui_cutouts/nova.png',take:'./characters/ui_cutouts/take.png',zero:'./characters/ui_cutouts/zero.png'});
  function syncDom({storage,host,img,name}={}){
    const p=load(storage);syncHost(host,p);
    const currentSrc=img?.getAttribute?.('src')||img?.src||'';
    if(img?.dataset&&currentSrc&&!/characters\/ui_cutouts\//.test(currentSrc))img.dataset.explorerCrewLocalSrc=currentSrc;
    if(name?.dataset){
      const currentName=String(name.textContent||'').trim();
      const previousCanonicalName=String(name.dataset.explorerCrewCanonicalName||'').trim();
      if(currentName&&currentName!==previousCanonicalName)name.dataset.explorerCrewLocalName=currentName;
    }
    const approved=!!(p.status==='BOUND'&&CORE6_STATIC[p.character_id]);
    if(host?.dataset)host.dataset.explorerCrewVisual=approved?'STATIC_APPROVED_ONLY':p.character_id?'CANONICAL_VISUAL_UNAVAILABLE':'UNBOUND';
    if(approved){
      if(img)img.src=CORE6_STATIC[p.character_id];
      if(name){const canonicalName=nameOf(p.character_id);name.textContent=canonicalName;if(name.dataset)name.dataset.explorerCrewCanonicalName=canonicalName;}
    }else{
      if(img?.dataset?.explorerCrewLocalSrc)img.src=img.dataset.explorerCrewLocalSrc;
      if(name?.dataset?.explorerCrewLocalName)name.textContent=name.dataset.explorerCrewLocalName;
      if(name?.dataset)delete name.dataset.explorerCrewCanonicalName;
    }
    return p;
  }
  function boot({storage,locationHref,replaceUrl,host,img,name,win=typeof window!=='undefined'?window:null}={}){
    consumeCanonicalStore(storage);consumeHandoffUrl(locationHref,{storage,replaceUrl});const p=syncDom({storage,host,img,name});
    if(win?.addEventListener){win.addEventListener('storage',e=>{if(e.key===CANONICAL_STATE_KEY||e.key===PROJECTION_KEY){consumeCanonicalStore(storage);syncDom({storage,host,img,name})}})}
    return p;
  }
  return Object.freeze({VERSION,SYSTEM_VERSION,SYSTEM_BOUND,PROJECTION_KEY,CANONICAL_STATE_KEY,CREW_EVENT_PARAM,AUTHORITY,empty,snapshot:load,persist,consumeCanonicalStore,consumeHandoffUrl,syncHost,syncDom,boot,CORE6_STATIC,ownership:Object.freeze({semantic:'CONSUMER_ONLY',canonicalRuntime:SYSTEM_VERSION,relationWrite:false,affinityWrite:false,memoryWrite:false,behaviorOwner:false,assetResolver:false,runtimeOwner:false,renderer:false})});
});
