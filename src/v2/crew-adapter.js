(() => {
  'use strict';

  let provider=null;

  function setProvider(next){
    provider=next&&typeof next==='object'?next:null;
  }

  function resolvedProvider(){
    return provider||
      globalThis.SnapExplorationCrewRuntime||
      globalThis.SnapExplorationCrew||
      null;
  }

  function normalizePresentation(raw={}){
    const displayName=String(raw.displayName||raw.name||'탐험대원').trim()||'탐험대원';
    const supportText=String(raw.supportText||raw.message||'필요할 때 짧은 단서를 함께 찾아봐요.').trim();
    return Object.freeze({
      displayName,
      supportText,
      avatarText:String(raw.avatarText||displayName.slice(0,1)||'탐').trim(),
      sourceAuthority:raw.sourceAuthority||'SNAP_POP_EXPLORATION_CREW_IF_AVAILABLE',
      personalityOwnedBy:'SNAP_POP',
      hintContent:null
    });
  }

  function presentation(context={}){
    const p=resolvedProvider();
    if(p?.presentation){
      try{return normalizePresentation(p.presentation(context)||{})}catch{}
    }
    if(p?.activeMember){
      try{
        const member=typeof p.activeMember==='function'?p.activeMember(context):p.activeMember;
        return normalizePresentation(member||{});
      }catch{}
    }
    return normalizePresentation({
      displayName:'탐험대원',
      supportText:'필요할 때 짧은 단서를 함께 찾아봐요.',
      sourceAuthority:'HIDE_NEUTRAL_FALLBACK_NO_PERSONALITY'
    });
  }

  function supportFor(context={}){
    const p=resolvedProvider();
    if(p?.minimalSupport){
      try{
        const raw=p.minimalSupport(context)||null;
        if(raw&&raw.revealsAnswer!==true){
          return Object.freeze({
            text:String(raw.text||'').trim(),
            revealsAnswer:false,
            sourceAuthority:'SNAP_POP_EXPLORATION_CREW'
          });
        }
      }catch{}
    }
    return Object.freeze({
      text:'천천히 떠올려 봐요. 지금은 정답을 보여주지 않을게요.',
      revealsAnswer:false,
      sourceAuthority:'HIDE_NEUTRAL_FALLBACK_NO_PERSONALITY'
    });
  }

  globalThis.HideV2Crew=Object.freeze({
    version:'1.0.0',
    setProvider,
    presentation,
    supportFor
  });
})();