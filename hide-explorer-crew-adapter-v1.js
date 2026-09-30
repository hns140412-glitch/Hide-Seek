(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.HideExplorerCrewAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='HIDE_EXPLORER_CREW_ADAPTER_V1';

  function clean(v){return typeof v==='string'?v.trim():'';}

  function fromIncomingContext(incoming={},current={}){
    const id=clean(incoming.crew_member_id)||clean(current.explorerId)||'';
    const name=clean(incoming.crew_member_name)||clean(current.name)||'탐험대원';
    const rulesVersion=clean(incoming.crew_rules_version)||clean(current.rulesVersion)||null;
    return Object.freeze({
      explorerId:id,
      name,
      voice:current.voice!==false,
      source:id?'EXPLORER_CREW_CANONICAL_PROJECTION':'EXPLORER_CREW_UNBOUND',
      rulesVersion,
      canonicalWrite:false,
      relationWrite:false,
      affinityWrite:false,
      memoryWrite:false
    });
  }

  function migrateLegacyGuide(legacyGuide={}){
    return Object.freeze({
      explorerId:clean(legacyGuide.id),
      name:clean(legacyGuide.name)||'탐험대원',
      voice:legacyGuide.voice!==false,
      source:'LEGACY_GUIDE_MIGRATION_READ_ONLY',
      rulesVersion:null,
      canonicalWrite:false,
      relationWrite:false,
      affinityWrite:false,
      memoryWrite:false
    });
  }
  function projectState(state={}){
    const member=state.crewMember||{};
    return Object.freeze({
      app_id:'HIDE',
      crew_member_id:clean(member.explorerId)||null,
      crew_member_name:clean(member.name)||'탐험대원',
      crew_rules_version:clean(member.rulesVersion)||null,
      role:'MAIN',
      relation_state:null,
      affinity:null,
      source:'HIDE_READ_ONLY_PROJECTION',
      canonicalWrite:false,
      relationWrite:false,
      affinityWrite:false,
      memoryWrite:false
    });
  }

  function applyIncoming(state={},incoming={}){
    const next={...state};
    next.crewMember=fromIncomingContext(incoming,state.crewMember||{});
    return next;
  }

  return Object.freeze({
    VERSION,
    fromIncomingContext,
    migrateLegacyGuide,
    projectState,
    applyIncoming
  });
});
