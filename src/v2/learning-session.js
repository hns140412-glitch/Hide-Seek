(() => {
  'use strict';

  const STAGES=['MEMORIZE','FIRST_FIND','MEANING','DOMAIN_EXTENSION','FINAL_SEEK','SEEK_AGAIN_RELEARN','SEEK_AGAIN','COMPLETE'];
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
    if(next.stage==='SEEK_AGAIN_RELEARN'){next.stage='SEEK_AGAIN';return next}
    if(next.stage==='SEEK_AGAIN')return nextItemOrComplete(next,mission);
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
      const contextEvidence=globalThis.HideLanguageModel?.normalizeContextEvidence?.(w?.contextEvidence,'KOREAN')||null;
      if(contextEvidence&&Object.prototype.hasOwnProperty.call(payload,'selectedEvidence')){
        const attempt=recordAttempt(session,w.id,'EVIDENCE_TRAIL');
        const selected=String(payload.selectedEvidence||'').trim();
        const ok=selected===contextEvidence.evidenceText;
        HideV2Memory.record(mission.id,w.id,{
          stage:'EVIDENCE_TRAIL',
          evidenceType:'VERIFIED_CONTEXT_EVIDENCE_SELECTION',
          evidenceMode:'EVIDENCE_SELECTION',
          axes:['EVIDENCE','MEANING'],
          result:ok?'CORRECT':'WRONG',
          objectiveVerified:true,
          objectiveRecall:false,
          recallScoreImpact:false,
          assisted:false,
          source:contextEvidence.sourceRef,
          selectedEvidence:selected,
          expectedEvidence:contextEvidence.evidenceText,
          attempt:attempt.count
        });
        return {ok,session:attempt.session,evidenceCompleted:true};
      }
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

  function useFinalSupport(session,mission,support={}){
    const w=current(session,mission);
    const next=clone(session);
    next.attempts=next.attempts||{};
    const key=`${w.id}:FINAL_SEEK_ASSIST`;
    if(Number(next.attempts[key]||0)>0)return {session:next,alreadyUsed:true};
    next.attempts[key]=1;
    HideV2Memory.record(mission.id,w.id,{
      stage:'FINAL_SEEK_SUPPORT',
      evidenceMode:'ASSISTANCE',
      axes:['MEANING','CONTEXT'],
      result:'USED',
      objectiveVerified:false,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true,
      supportType:String(support.supportType||'SEMANTIC_SCENE'),
      sourceType:support.sourceType||null,
      source:support.sourceRef||null
    });
    return {session:next,alreadyUsed:false};
  }

  function checkFinalSeek(session,mission,answer){
    const w=current(session,mission);
    const attempt=recordAttempt(session,w.id,'FINAL_SEEK');
    const assisted=Number(attempt.session.attempts?.[`${w.id}:FINAL_SEEK_ASSIST`]||0)>0;
    const a=String(answer||'').trim().normalize('NFKC').toLowerCase();
    const target=String(w?.token||'').trim().normalize('NFKC').toLowerCase();
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'FINAL_SEEK',
      evidenceMode:'RECONSTRUCTION',
      axes:['FORM','RECALL','WRITE_OR_RECONSTRUCT'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:!assisted,
      recallScoreImpact:!assisted,
      assisted,
      hintLevel:assisted?1:0,
      attempt:attempt.count
    });
    if(ok&&!assisted)return {ok,assisted:false,session:nextItemOrComplete(attempt.session,mission)};
    const next=clone(attempt.session);
    next.stage='SEEK_AGAIN_RELEARN';
    return {ok,assisted,session:next};
  }

  function submitSeekAgainRelearn(session,mission){
    const w=current(session,mission);
    HideV2Memory.record(mission.id,w.id,{
      stage:'SEEK_AGAIN_RELEARN',
      evidenceMode:'RELEARN_EXPOSURE',
      axes:['FORM','MEANING'],
      result:'SEEN',
      objectiveVerified:false,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true
    });
    return {session:advance(session,mission)};
  }

  function checkSeekAgain(session,mission,answer){
    const w=current(session,mission);
    const attempt=recordAttempt(session,w.id,'SEEK_AGAIN');
    const a=String(answer||'').trim().normalize('NFKC').toLowerCase();
    const target=String(w?.token||'').trim().normalize('NFKC').toLowerCase();
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'SEEK_AGAIN',
      evidenceMode:'RECALL',
      axes:['FORM','RECALL'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:true,
      assisted:false,
      attempt:attempt.count,
      spacedEvidence:false
    });
    if(ok)return {ok,session:nextItemOrComplete(attempt.session,mission)};
    const next=clone(attempt.session);
    next.stage='SEEK_AGAIN_RELEARN';
    return {ok,session:next};
  }

  window.HideV2Learning=Object.freeze({
    STAGES,create,current,advance,submitMemorize,checkFirstFind,checkMeaning,submitDomainExtension,useFinalSupport,checkFinalSeek,submitSeekAgainRelearn,checkSeekAgain
  });
})();
