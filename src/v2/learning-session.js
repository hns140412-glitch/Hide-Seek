(() => {
  'use strict';

  const STAGES=['MEMORIZE','FIRST_FIND','MEANING','DOMAIN_EXTENSION','FINAL_SEEK','COMPLETE'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const current=(session,mission)=>mission.items.find(x=>x.id===session.queue?.[session.index])||null;
  const initialStageFor=w=>String(w?.missionRole||'NEW').toUpperCase()==='REVIEW'?'FIRST_FIND':'MEMORIZE';

  function create(mission,options={}){
    if(!mission?.items?.length)throw new Error('MISSION_REQUIRED');
    const requested=Array.isArray(options.targetItemIds)?options.targetItemIds:[];
    const queue=(requested.length?requested:mission.items.map(x=>x.id)).filter(id=>mission.items.some(x=>x.id===id));
    if(!queue.length)throw new Error('SESSION_QUEUE_EMPTY');
    const first=mission.items.find(x=>x.id===queue[0]);
    return {
      id:'session-'+Date.now().toString(36),
      missionId:mission.id,
      index:0,
      queue,
      stage:initialStageFor(first),
      startedAt:new Date().toISOString(),
      completedAt:null,
      attempts:{}
    };
  }

  function nextItemOrComplete(session,mission){
    const next=clone(session);
    if(next.index<(next.queue?.length||mission.items.length)-1){
      next.index++;
      next.stage=initialStageFor(current(next,mission));
      return next;
    }
    next.stage='COMPLETE';
    next.completedAt=new Date().toISOString();
    return next;
  }

  function advance(session,mission){
    const next=clone(session);
    if(next.stage==='MEMORIZE'){next.stage='FIRST_FIND';return next}
    if(next.stage==='FIRST_FIND'){next.stage='MEANING';return next}
    if(next.stage==='MEANING'){next.stage='DOMAIN_EXTENSION';return next}
    if(next.stage==='DOMAIN_EXTENSION'){next.stage='FINAL_SEEK';return next}
    if(next.stage==='FINAL_SEEK')return nextItemOrComplete(next,mission);
    return next;
  }

  function recordAttempt(session,wordId,stage){
    const next=clone(session);
    next.attempts=next.attempts||{};
    const key=`${wordId}:${stage}`;
    next.attempts[key]=Number(next.attempts[key]||0)+1;
    return {session:next,count:next.attempts[key]};
  }

  function submitMemorize(session,mission){
    const w=current(session,mission);
    HideV2Memory.record(mission.id,w.id,{
      stage:'MEMORIZE',
      evidenceMode:'EXPOSURE',
      axes:['FORM','MEANING'],
      result:'SEEN',
      objectiveVerified:false,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true
    });
    return {session:advance(session,mission)};
  }

  function checkFirstFind(session,mission,answer){
    const w=current(session,mission);
    const attempt=recordAttempt(session,w.id,'FIRST_FIND');
    const a=String(answer||'').trim().normalize('NFKC').toLowerCase();
    const target=String(w?.token||'').trim().normalize('NFKC').toLowerCase();
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'FIRST_FIND',
      evidenceMode:'RECALL',
      axes:['FORM','RECALL'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:true,
      assisted:false,
      attempt:attempt.count
    });
    return {ok,session:advance(attempt.session,mission)};
  }

  function checkMeaning(session,mission,answer){
    const w=current(session,mission);
    const attempt=recordAttempt(session,w.id,'MEANING');
    const a=String(answer||'').trim().normalize('NFKC');
    const target=String(w?.meaning||'').trim().normalize('NFKC');
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'MEANING',
      evidenceMode:'RECALL',
      axes:['MEANING','RECALL'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:true,
      assisted:false,
      attempt:attempt.count
    });
    return {ok,session:advance(attempt.session,mission)};
  }

  function submitDomainExtension(session,mission,payload={}){
    const w=current(session,mission);
    const domain=w?.languageDomain||'ENGLISH';
    if(domain==='KOREAN'){
      const text=String(payload.responseText||'').trim();
      HideV2Memory.record(mission.id,w.id,{
        stage:'RESPONSE_TRAIL',
        evidenceMode:'PRODUCTION',
        axes:['EXPRESSION','CONTEXT'],
        result:text.includes(w.token)?'TARGET_USED':'TARGET_NOT_USED',
        responseText:text,
        objectiveVerified:false,
        objectiveRecall:false,
        recallScoreImpact:false,
        assisted:false
      });
    }else if(domain==='HANJA'&&w?.soundEvidence){
      const a=String(payload.sound||'').trim().normalize('NFKC');
      const target=String(w.soundEvidence.reading||'').trim().normalize('NFKC');
      HideV2Memory.record(mission.id,w.id,{
        stage:'SOUND_FIND',
        evidenceMode:'RECALL',
        axes:['SOUND','RECALL'],
        result:a===target?'CORRECT':'WRONG',
        objectiveVerified:true,
        objectiveRecall:true,
        assisted:false,
        source:w.soundEvidence.sourceRef
      });
    }else{
      HideV2Memory.record(mission.id,w.id,{
        stage:'CONNECTION',
        evidenceMode:'EXPOSURE',
        axes:['MEANING','CONTEXT'],
        result:'SEEN',
        objectiveVerified:false,
        objectiveRecall:false,
        recallScoreImpact:false,
        assisted:false
      });
    }
    return {session:advance(session,mission)};
  }

  function checkFinalSeek(session,mission,answer){
    const w=current(session,mission);
    const attempt=recordAttempt(session,w.id,'FINAL_SEEK');
    const a=String(answer||'').trim().normalize('NFKC').toLowerCase();
    const target=String(w?.token||'').trim().normalize('NFKC').toLowerCase();
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'FINAL_SEEK',
      evidenceMode:'RECONSTRUCTION',
      axes:['FORM','RECALL','WRITE_OR_RECONSTRUCT'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:true,
      assisted:false,
      attempt:attempt.count
    });
    return {ok,session:advance(attempt.session,mission)};
  }

  window.HideV2Learning=Object.freeze({
    STAGES,create,current,advance,submitMemorize,checkFirstFind,checkMeaning,submitDomainExtension,checkFinalSeek
  });
})();
