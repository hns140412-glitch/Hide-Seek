(() => {
  'use strict';
  const STAGES=['FIRST_FIND','MEANING','DOMAIN_EXTENSION','COMPLETE'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  function create(mission){
    if(!mission?.items?.length)throw new Error('MISSION_REQUIRED');
    return {id:'session-'+Date.now().toString(36),missionId:mission.id,index:0,stage:'FIRST_FIND',startedAt:new Date().toISOString(),completedAt:null};
  }
  function current(session,mission){return mission.items[session.index]||null}
  function advance(session,mission){
    const next=clone(session);
    const stageIndex=STAGES.indexOf(next.stage);
    if(stageIndex<STAGES.length-2){next.stage=STAGES[stageIndex+1];return next}
    if(next.index<mission.items.length-1){next.index++;next.stage='FIRST_FIND';return next}
    next.stage='COMPLETE';next.completedAt=new Date().toISOString();return next;
  }
  function checkFirstFind(session,mission,answer){
    const w=current(session,mission);const a=String(answer||'').trim().normalize('NFKC').toLowerCase();const target=String(w?.token||'').trim().normalize('NFKC').toLowerCase();
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:ok?'CORRECT':'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false});
    return {ok,session:advance(session,mission)};
  }
  function checkMeaning(session,mission,answer){
    const w=current(session,mission);const a=String(answer||'').trim().normalize('NFKC');const target=String(w?.meaning||'').trim().normalize('NFKC');
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{stage:'MEANING',evidenceMode:'RECALL',axes:['MEANING','RECALL'],result:ok?'CORRECT':'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false});
    return {ok,session:advance(session,mission)};
  }
  function submitDomainExtension(session,mission,payload={}){
    const w=current(session,mission);const domain=w?.languageDomain||'ENGLISH';
    if(domain==='KOREAN'){
      const text=String(payload.responseText||'').trim();
      HideV2Memory.record(mission.id,w.id,{stage:'RESPONSE_TRAIL',evidenceMode:'PRODUCTION',axes:['EXPRESSION','CONTEXT'],result:text.includes(w.token)?'TARGET_USED':'TARGET_NOT_USED',responseText:text,objectiveVerified:false,objectiveRecall:false,recallScoreImpact:false});
    }else if(domain==='HANJA'&&w?.soundEvidence){
      const a=String(payload.sound||'').trim().normalize('NFKC'),target=String(w.soundEvidence.reading||'').trim().normalize('NFKC');
      HideV2Memory.record(mission.id,w.id,{stage:'SOUND_FIND',evidenceMode:'RECALL',axes:['SOUND','RECALL'],result:a===target?'CORRECT':'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false,source:w.soundEvidence.sourceRef});
    }else{
      HideV2Memory.record(mission.id,w.id,{stage:'DOMAIN_EXTENSION',evidenceMode:'EXPOSURE',axes:['MEANING'],result:'SEEN',objectiveVerified:false,objectiveRecall:false,recallScoreImpact:false});
    }
    return {session:advance(session,mission)};
  }
  window.HideV2Learning=Object.freeze({STAGES,create,current,advance,checkFirstFind,checkMeaning,submitDomainExtension});
})();