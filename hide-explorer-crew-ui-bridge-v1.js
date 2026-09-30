(function(root,factory){
  'use strict';
  const api=factory(root?.HideExplorerCrewAdapter,root?.TakyExplorerCrewRenderPlanDomConsumer,root?.TakyExplorerCrewPersonalityRegistry);
  if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./hide-explorer-crew-adapter-v1.js'),require('./vendor/taky/explorer-crew/render-plan-dom-consumer-v1.js'),require('./vendor/taky/explorer-crew/personality-registry-v2.js'));
  else if(root)root.HideExplorerCrewUiBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(adapter,domConsumer,personalityRegistry){
  'use strict';
  const VERSION='HIDE_EXPLORER_CREW_UI_BRIDGE_V1';

  function applyDataset(host,projection={}){
    if(!host?.dataset)return false;
    host.dataset.explorerCrewBridge=VERSION;
    host.dataset.explorerCrewMode='OBSERVE_ONLY';
    host.dataset.explorerCrewApp='HIDE';
    host.dataset.explorerCrewCharacter=projection.crew_member_id||'';
    host.dataset.explorerCrewSource=projection.source||'HIDE_READ_ONLY_PROJECTION';
    host.dataset.explorerCrewRelationOwned='false';
    host.dataset.explorerCrewAffinityOwned='false';
    host.dataset.explorerCrewMemoryOwned='false';
    return true;
  }

  function sync(state,host){
    if(!adapter||typeof adapter.projectState!=='function')return {ok:false,reason:'HIDE_ADAPTER_MISSING'};
    const projection=adapter.projectState(state||{});
    applyDataset(host||document.documentElement,projection);
    return Object.freeze({ok:true,mode:'OBSERVE_ONLY',projection});
  }

  function boot(getState){
    const host=document.documentElement;
    const run=()=>{try{sync(typeof getState==='function'?getState():{},host)}catch{host.dataset.explorerCrewStatus='ERROR'}};
    run();
    addEventListener('hide-seek-state-saved',run);
    return Object.freeze({run});
  }

  async function renderCanonicalMain(canonicalHost,host){
    const rootHost=host||document.documentElement;
    if(!canonicalHost||!domConsumer)return Object.freeze({ok:false,reason:'CANONICAL_RENDER_CONSUMER_MISSING'});
    const snapshot=canonicalHost.snapshot?canonicalHost.snapshot():canonicalHost.reload(),id=snapshot?.relation?.main_character_id||'';
    if(!id)return Object.freeze({ok:false,reason:'CANONICAL_MAIN_MISSING'});
    const resolved=await canonicalHost.renderPlan({character_id:id,scene_id:'PARTNER_BAR',delivery_mode:'NONE'});
    const out=resolved?.result,rendered=out?.output?.rendered,plan=resolved?.render_plan,promotion=out?.output?.visual?.composable_promotion,profile=personalityRegistry?.get?.(id),img=document.querySelector('#partnerAvatar');
    rootHost.dataset.explorerCrewStaticReady=String(promotion?.static_ready===true);rootHost.dataset.explorerCrewBaseComposableReady=String(promotion?.base_composable_ready===true);rootHost.dataset.explorerCrewAllActionsReady=String(promotion?.all_actions_ready===true);rootHost.dataset.explorerCrewMotionStatus=promotion?.motion_status||'UNKNOWN';rootHost.dataset.explorerCrewReleasePass=String(promotion?.release_pass===true);
    let composite=document.querySelector('#partnerComposableAvatar');
    if(!composite&&img?.parentElement){
      composite=document.createElement('span');composite.id='partnerComposableAvatar';composite.className='partner-composable-avatar';composite.hidden=true;
      img.insertAdjacentElement('afterend',composite);
    }
    let ok=false;
    if(rendered?.blocked!==true&&rendered?.plan_ready===true&&plan?.kind==='STATIC_APPROVED_COMPAT'){
      domConsumer.clearComposable?.(composite);if(composite)composite.hidden=true;
      img.hidden=false;ok=domConsumer.applyImage(img,plan,{alt:(profile?.name_ko||id)+' 승인 원화'});
    }else if(rendered?.blocked!==true&&rendered?.plan_ready===true&&plan?.kind==='COMPOSABLE_APPROVED'){
      if(img){img.removeAttribute('src');img.hidden=true;}
      if(composite){composite.hidden=false;ok=domConsumer.mountComposable?.(composite,plan)===true;if(!ok)composite.hidden=true;}
    }
    if(!ok){
      if(img){img.removeAttribute('src');img.hidden=true;}
      domConsumer.clearComposable?.(composite);if(composite)composite.hidden=true;
    }
    rootHost.dataset.explorerCrewRenderPlan=ok?(plan?.kind||''):'BLOCKED';
    rootHost.dataset.explorerCrewRenderCharacter=id;
    if(profile?.name_ko&&document.querySelector('#partnerName'))document.querySelector('#partnerName').textContent=profile.name_ko;
    return Object.freeze({ok,character_id:id,render_plan:ok?plan:null,render_mode:ok?(plan?.kind||null):null,relationWrite:false,affinityWrite:false,memoryWrite:false});
  }

  return Object.freeze({VERSION,applyDataset,sync,boot,renderCanonicalMain});
});
if(typeof window!=='undefined'&&window.HideExplorerCrewUiBridge&&typeof S!=='undefined'){
  window.HideExplorerCrewUiBridge.boot(()=>S);
  if(window.TakyExplorerCrewAppConsumerV2){
    window.HideExplorerCrewV2Consumer=window.TakyExplorerCrewAppConsumerV2.create({app_id:'HIDE',storage:localStorage,locationHref:location.href,replaceUrl:u=>history.replaceState(null,'',u)});
    window.HideExplorerCrewCanonicalHost=window.HideExplorerCrewV2Consumer.system;
    const syncCanonical=()=>{const s=window.HideExplorerCrewCanonicalHost.reload();document.documentElement.dataset.explorerCrewStoreRevision=String(s.store_revision||0);document.documentElement.dataset.explorerCrewCanonicalMain=s.relation.main_character_id||'';void window.HideExplorerCrewV2Consumer.sync({host:document.documentElement,character_id:s.relation.main_character_id||'',scene_id:'PARTNER_BAR',render:false});void window.HideExplorerCrewUiBridge.renderCanonicalMain(window.HideExplorerCrewCanonicalHost);};
    void window.HideExplorerCrewCanonicalHost.consumeUrl().then(syncCanonical);
    addEventListener('hide-seek-state-saved',syncCanonical);
  }
}
