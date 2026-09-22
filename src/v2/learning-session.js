(() => {
  'use strict';

  const STAGES=['MEMORIZE','FIRST_FIND','FIRST_FIND_ASSIST','FIRST_FIND_RELEARN','MEANING','MEANING_ASSIST','MEANING_RELEARN','DOMAIN_EXTENSION','SOUND_FIND_RELEARN','HIDDEN_WORDS','HIDDEN_WORDS_ASSIST','FINAL_SEEK','FINAL_SEEK_RECONSTRUCT','SEEK_AGAIN_RELEARN','SEEK_AGAIN','COMPLETE'];
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
    if(next.stage==='FIRST_FIND_RELEARN'){next.stage='MEANING';return next}
    if(next.stage==='MEANING'){next.stage='DOMAIN_EXTENSION';return next}
    if(next.stage==='MEANING_ASSIST'){next.stage='DOMAIN_EXTENSION';return next}
    if(next.stage==='MEANING_RELEARN'){next.stage='DOMAIN_EXTENSION';return next}
    if(next.stage==='DOMAIN_EXTENSION'){next.stage='FINAL_SEEK';return next}
    if(next.stage==='HIDDEN_WORDS'){next.stage='FINAL_SEEK';return next}
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
    if(ok)return {ok,session:advance(attempt.session,mission)};
    const next=clone(attempt.session);
    const support=firstFindSupportPlan(w);
    next.stage=support?'FIRST_FIND_ASSIST':'FIRST_FIND_RELEARN';
    return {ok,support,session:next};
  }

  function firstFindSupportPlan(word){
    const domain=String(word?.languageDomain||'').toUpperCase();
    const token=String(word?.token||'').trim().normalize('NFKC');
    if(domain==='ENGLISH'){
      const cue=englishShapeCue(token);
      return cue?{type:'SHAPE',label:'글자 골격 단서',cue,sourceRef:null}:null;
    }
    if(domain==='KOREAN'){
      const plan=globalThis.HideLanguageModel?.cuePlan?.({
        token,
        word:token,
        kor:word?.meaning,
        languageDomain:'KOREAN',
        meaningMap:word?.meaningMap
      })||null;
      if(!plan?.sourceRef||!Array.isArray(plan.nodes))return null;
      const node=plan.nodes.find(x=>{
        const label=String(x?.label||'').trim();
        return label&&label.normalize('NFKC')!==token;
      })||null;
      if(!node)return null;
      const cue=[node.label,node.meaning].filter(Boolean).join(' · ');
      return cue?{type:'MEANING_MAP',label:'뜻의 구조 단서',cue,sourceRef:plan.sourceRef}:null;
    }
    if(domain==='HANJA'&&word?.soundEvidence?.verified&&word.soundEvidence.reading){
      const cue=String(word.soundEvidence.reading).trim().normalize('NFKC');
      if(!cue||cue===token)return null;
      return {type:'SOUND',label:'검증된 음 단서',cue,sourceRef:word.soundEvidence.sourceRef||null};
    }
    return null;
  }

  function submitFirstFindAssist(session,mission,answer){
    const w=current(session,mission);
    const support=firstFindSupportPlan(w);
    if(!support){
      const next=clone(session);
      next.stage='FIRST_FIND_RELEARN';
      return {ok:false,unsupported:true,support:null,session:next};
    }
    const a=String(answer||'').trim().normalize('NFKC').toLowerCase();
    const target=String(w?.token||'').trim().normalize('NFKC').toLowerCase();
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'FIRST_FIND_ASSIST',
      evidenceMode:'ASSISTED_RECONSTRUCTION',
      axes:support.type==='SOUND'?['SOUND','FORM','RECALL']:support.type==='MEANING_MAP'?['MEANING','FORM','RECALL']:['FORM','RECALL'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true,
      supportType:support.type,
      source:support.sourceRef||null
    });
    const next=clone(session);
    next.stage=ok?'MEANING':'FIRST_FIND_RELEARN';
    return {ok,support,session:next};
  }

  function markFirstFindUnsure(session,mission){
    const w=current(session,mission);
    const attempt=recordAttempt(session,w.id,'FIRST_FIND');
    HideV2Memory.record(mission.id,w.id,{
      stage:'FIRST_FIND',
      evidenceMode:'RECALL',
      axes:['FORM','RECALL'],
      result:'PASS',
      objectiveVerified:false,
      objectiveRecall:true,
      assisted:false,
      reason:'UNSURE_SELF_REPORT',
      attempt:attempt.count
    });
    const next=clone(attempt.session);
    const support=firstFindSupportPlan(w);
    next.stage=support?'FIRST_FIND_ASSIST':'FIRST_FIND_RELEARN';
    return {ok:false,unsure:true,support,session:next};
  }

  function submitFirstFindRelearn(session,mission){
    const w=current(session,mission);
    HideV2Memory.record(mission.id,w.id,{
      stage:'FIRST_FIND_RELEARN',
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

  function meaningChallenge(session,mission){
    const w=current(session,mission);
    if(!w)return null;
    const queueSet=new Set(Array.isArray(session?.queue)?session.queue:[]);
    const peers=(mission?.items||[]).filter(x=>queueSet.has(x.id)&&x.id!==w.id&&x.languageDomain===w.languageDomain&&x.token&&x.meaning);
    if(!peers.length)return null;
    const direction=Number(session?.index||0)%2===1?'MEANING_TO_TOKEN':'TOKEN_TO_MEANING';
    const selected=[w,...peers.slice(0,3)];
    return {
      direction,
      prompt:direction==='MEANING_TO_TOKEN'?w.meaning:w.token,
      answer:w.id,
      options:selected.map(x=>({
        id:x.id,
        label:direction==='MEANING_TO_TOKEN'?x.token:x.meaning,
        token:x.token,
        meaning:x.meaning
      }))
    };
  }

  function checkMeaningChoice(session,mission,selectedId){
    const w=current(session,mission);
    const challenge=meaningChallenge(session,mission);
    if(!challenge)return {ok:false,unsupported:true,session};
    const attempt=recordAttempt(session,w.id,'MEANING');
    const selected=challenge.options.find(x=>x.id===selectedId)||null;
    const ok=selectedId===w.id;
    HideV2Memory.record(mission.id,w.id,{
      stage:'MEANING',
      evidenceType:'MEANING_RECOGNITION',
      evidenceMode:'RECOGNITION',
      axes:['MEANING','RECOGNITION'],
      result:ok?'CORRECT':'MISMATCH',
      objectiveVerified:true,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:false,
      direction:challenge.direction,
      selectedId:selectedId||null,
      confusedWithToken:ok?null:selected?.token||null,
      confusedWithMeaning:ok?null:selected?.meaning||null,
      attempt:attempt.count
    });
    return {ok,challenge,selected,session:advance(attempt.session,mission)};
  }

  function meaningSupportPlan(word){
    const token=String(word?.token||'').trim();
    const contextEvidence=globalThis.HideLanguageModel?.normalizeContextEvidence?.(word?.contextEvidence,word?.languageDomain)||null;
    const raw=String(contextEvidence?.contextText||word?.example||'').trim();
    if(!raw)return null;
    const cue=token?raw.replaceAll(token,'____'):raw;
    if(!cue||cue===raw&&raw.length<8)return null;
    return {
      type:contextEvidence?'VERIFIED_CONTEXT':'CONTEXT',
      label:contextEvidence?'검증된 문맥 단서':'문장 단서',
      cue,
      sourceRef:contextEvidence?.sourceRef||null
    };
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
    if(ok)return {ok,session:advance(attempt.session,mission)};
    const next=clone(attempt.session);
    const support=meaningSupportPlan(w);
    next.stage=support?'MEANING_ASSIST':'MEANING_RELEARN';
    return {ok,support,session:next};
  }

  function submitMeaningAssist(session,mission,answer){
    const w=current(session,mission);
    const support=meaningSupportPlan(w);
    if(!support){
      const next=clone(session);
      next.stage='MEANING_RELEARN';
      return {ok:false,unsupported:true,support:null,session:next};
    }
    const a=String(answer||'').trim().normalize('NFKC');
    const target=String(w?.meaning||'').trim().normalize('NFKC');
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'MEANING_ASSIST',
      evidenceMode:'ASSISTED_RECALL',
      axes:['MEANING','RECALL'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true,
      supportType:support.type,
      source:support.sourceRef||null
    });
    const next=clone(session);
    next.stage=ok?'DOMAIN_EXTENSION':'MEANING_RELEARN';
    return {ok,support,session:next};
  }

  function submitMeaningRelearn(session,mission){
    const w=current(session,mission);
    HideV2Memory.record(mission.id,w.id,{
      stage:'MEANING_RELEARN',
      evidenceMode:'RELEARN_EXPOSURE',
      axes:['MEANING','FORM'],
      result:'SEEN',
      objectiveVerified:false,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true
    });
    return {session:advance(session,mission)};
  }

  function englishShapeCue(token){
    const w=String(token||'').toLowerCase();
    if(!/^[a-z]+$/.test(w)||w.length<4)return '';
    const suffixes=['tion','sion','ment','ness','able','ible','ful','less','ing','ed','ly'];
    const suffix=suffixes.find(x=>w.length>x.length+2&&w.endsWith(x));
    const chunks=suffix?[w.slice(0,-suffix.length),suffix]:[w.slice(0,Math.max(2,Math.ceil(w.length/2))),w.slice(Math.max(2,Math.ceil(w.length/2)))].filter(Boolean);
    return chunks.map(x=>x.length<=2?x:x[0]+'·'.repeat(Math.max(1,x.length-2))+x.at(-1)).join('  ');
  }

  function hiddenWordsPlan(word,session=null){
    const mem=HideV2Memory.summary(word);
    const primaryReason=HideV2Memory.reason(mem);
    let key=primaryReason?.key||'stable';
    const soundWeakness=Number(mem?.memorySignature?.phonologicalWeakness||0);
    const explicit=session?.reinforcementOverride;
    if(
      explicit?.wordId===word?.id&&
      explicit?.key==='sound'&&
      word?.soundEvidence?.verified&&
      word.soundEvidence.reading
    ) key='sound';
    else if(
      String(word?.languageDomain||'').toUpperCase()==='HANJA'&&
      soundWeakness>0&&
      word?.soundEvidence?.verified&&
      word.soundEvidence.reading
    ) key='sound';
    const labels={
      recovery:'힌트 없이 다시 꺼내기',
      confusion:'뜻 헷갈림 다시 구분하기',
      orthographic:'글자 모양 다시 붙잡기',
      sound:'소리에서 다시 찾기',
      latency:'조금 더 빠르게 꺼내기',
      hint:'힌트 없이 다시 꺼내기',
      decay:'기억 길 다시 깨우기',
      stable:'지금은 보강 없이 통과'
    };
    const mode=key==='confusion'?'MEANING':key==='sound'&&word?.soundEvidence?.reading?'SOUND':key==='orthographic'&&englishShapeCue(word?.token)?'SHAPE':'TOKEN';
    return {
      key,
      label:labels[key]||labels.stable,
      primaryReason,
      activityReason:key,
      reasonSource:explicit?.wordId===word?.id&&explicit?.key===key?'SESSION_RECOVERY_HANDOFF':key!==primaryReason?.key?'MEMORY_SIGNATURE_AXIS_OVERRIDE':'PRIMARY_REASON',
      memory:mem,
      mode,
      prompt:mode==='MEANING'?word?.token:mode==='SHAPE'?englishShapeCue(word?.token):mode==='SOUND'?word?.token:word?.meaning
    };
  }

  function hiddenWordsSupportPlan(word,plan=hiddenWordsPlan(word)){
    if(plan?.mode==='TOKEN'){
      const cue=englishShapeCue(word?.token);
      if(cue)return {type:'SHAPE',label:'글자 골격 단서',cue};
    }
    if(plan?.mode==='MEANING'&&String(word?.example||'').trim()){
      return {type:'CONTEXT',label:'문장 단서',cue:String(word.example).trim()};
    }
    return null;
  }

  function nextAfterDomain(session,mission){
    const next=clone(session);
    const w=current(next,mission);
    const plan=hiddenWordsPlan(w,session);
    next.stage=plan.key==='stable'?'FINAL_SEEK':'HIDDEN_WORDS';
    return {session:next,plan};
  }

  function submitHiddenWords(session,mission,payload={}){
    const w=current(session,mission);
    const plan=hiddenWordsPlan(w,session);
    const typed=String(payload.answer||'').trim().normalize('NFKC');
    const mode=plan.mode||'TOKEN';
    const target=mode==='SOUND'
      ?String(w.soundEvidence?.reading||'').trim().normalize('NFKC')
      :mode==='MEANING'
        ?String(w.meaning||'').trim().normalize('NFKC')
        :String(w.token||'').trim().normalize('NFKC').toLowerCase();
    const answer=(mode==='SOUND'||mode==='MEANING')?typed:typed.toLowerCase();
    const ok=!!answer&&answer===target;
    const assisted=mode==='SHAPE';
    HideV2Memory.record(mission.id,w.id,{
      stage:'HIDDEN_WORDS',
      evidenceMode:assisted?'ASSISTED_RECONSTRUCTION':'REINFORCEMENT_RECALL',
      axes:mode==='SOUND'?['SOUND','RECALL']:mode==='MEANING'?['MEANING','RECALL']:['FORM','RECALL'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:!assisted,
      recallScoreImpact:!assisted,
      assisted,
      reinforcementReason:plan.key,
      reinforcementMode:mode,
      source:mode==='SOUND'?(w.soundEvidence?.sourceRef||null):null
    });
    const next=clone(session);
    delete next.reinforcementOverride;
    const support=hiddenWordsSupportPlan(w,plan);
    next.stage=ok?'FINAL_SEEK':support?'HIDDEN_WORDS_ASSIST':'HIDDEN_WORDS_RELEARN';
    return {ok,plan,support,session:next};
  }

  function submitHiddenWordsAssist(session,mission,payload={}){
    const w=current(session,mission);
    const plan=hiddenWordsPlan(w);
    const support=hiddenWordsSupportPlan(w,plan);
    if(!support){
      const next=clone(session);
      next.stage='HIDDEN_WORDS_RELEARN';
      return {ok:false,unsupported:true,plan,support:null,session:next};
    }
    const typed=String(payload.answer||'').trim().normalize('NFKC');
    const mode=plan.mode||'TOKEN';
    const target=mode==='MEANING'
      ?String(w.meaning||'').trim().normalize('NFKC')
      :String(w.token||'').trim().normalize('NFKC').toLowerCase();
    const answer=mode==='MEANING'?typed:typed.toLowerCase();
    const ok=!!answer&&answer===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'HIDDEN_WORDS_ASSIST',
      evidenceMode:'ASSISTED_RECALL',
      axes:mode==='MEANING'?['MEANING','RECALL']:['FORM','RECALL'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true,
      reinforcementReason:plan.key,
      reinforcementMode:mode,
      supportType:support.type
    });
    const next=clone(session);
    next.stage=ok?'FINAL_SEEK':'HIDDEN_WORDS_RELEARN';
    return {ok,plan,support,session:next};
  }

  function submitHiddenWordsRelearn(session,mission){
    const w=current(session,mission);
    const plan=hiddenWordsPlan(w);
    HideV2Memory.record(mission.id,w.id,{
      stage:'HIDDEN_WORDS_RELEARN',
      evidenceMode:'RELEARN_EXPOSURE',
      axes:['FORM','MEANING'],
      result:'SEEN',
      objectiveVerified:false,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true,
      reinforcementReason:plan.key
    });
    const next=clone(session);
    next.stage='FINAL_SEEK';
    return {plan,session:next};
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
      const target=String(w.token||'').trim().normalize('NFKC');
      const targetUsed=!!target&&text.normalize('NFKC').includes(target);
      HideV2Memory.record(mission.id,w.id,{
        stage:'RESPONSE_TRAIL',
        evidenceMode:'PRODUCTION',
        axes:['EXPRESSION','CONTEXT'],
        result:targetUsed?'TARGET_USED':'TARGET_NOT_USED',
        responseText:text,
        targetUsed,
        objectiveVerified:false,
        objectiveRecall:false,
        recallScoreImpact:false,
        assisted:false
      });
      const next=nextAfterDomain(session,mission);
      return {
        ...next,
        feedback:{
          targetUsed,
          semanticCorrectnessClaimed:false,
          message:targetUsed
            ?'목표 단어를 문장에 넣었어요. 문장의 의미 정확도는 여기서 자동 판정하지 않아요.'
            :`문장은 기록했어요. 목표 단어 “${w.token}”는 들어가지 않았어요. 의미 정확도는 자동 판정하지 않아요.`
        }
      };
    }else if(domain==='HANJA'&&w?.soundEvidence){
      const a=String(payload.sound||'').trim().normalize('NFKC');
      const target=String(w.soundEvidence.reading||'').trim().normalize('NFKC');
      const ok=!!a&&a===target;
      HideV2Memory.record(mission.id,w.id,{
        stage:'SOUND_FIND',
        evidenceMode:'RECALL',
        axes:['SOUND','RECALL'],
        result:ok?'CORRECT':'WRONG',
        objectiveVerified:true,
        objectiveRecall:true,
        assisted:false,
        source:w.soundEvidence.sourceRef
      });
      if(!ok){
        const next=clone(session);
        next.stage='SOUND_FIND_RELEARN';
        return {ok:false,session:next,soundEvidence:w.soundEvidence};
      }
    }else{
      const guidance=payload.connectionGuidance&&typeof payload.connectionGuidance==='object'?payload.connectionGuidance:null;
      if(guidance){
        HideV2Memory.record(mission.id,w.id,{
          stage:'CONNECTION_GUIDANCE',
          evidenceMode:'ADAPTIVE_CONNECTION_GUIDANCE',
          axes:['MEANING','CONTEXT'],
          result:'SEEN',
          objectiveVerified:false,
          objectiveRecall:false,
          recallScoreImpact:false,
          assisted:true,
          clue:String(guidance.clue||''),
          evidenceBasis:String(guidance.evidenceBasis||'LEARNER_SELF_REPORT'),
          sourceType:guidance.sourceType||null,
          source:guidance.sourceRef||null
        });
      }
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
    return nextAfterDomain(session,mission);
  }

  function submitSoundRelearn(session,mission){
    const w=current(session,mission);
    if(!w?.soundEvidence?.verified||!w.soundEvidence.reading){
      const next=clone(session);
      next.stage='FINAL_SEEK';
      return {unsupported:true,session:next};
    }
    HideV2Memory.record(mission.id,w.id,{
      stage:'SOUND_FIND_RELEARN',
      evidenceMode:'RELEARN_EXPOSURE',
      axes:['SOUND','FORM'],
      result:'SEEN',
      objectiveVerified:false,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true,
      source:w.soundEvidence.sourceRef
    });
    const next=clone(session);
    next.stage='HIDDEN_WORDS';
    next.reinforcementOverride={
      wordId:w.id,
      key:'sound',
      source:'VERIFIED_SOUND_MISS_RECOVERY'
    };
    return {session:next,plan:hiddenWordsPlan(w,next)};
  }

  function finalReconstructionPlan(word){
    if(String(word?.languageDomain||'').toUpperCase()!=='ENGLISH')return null;
    const cue=englishShapeCue(word?.token);
    if(!cue)return null;
    return {type:'SHAPE',label:'글자 골격 재구성',cue};
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
    const reconstruction=!assisted&&!ok?finalReconstructionPlan(w):null;
    next.stage=reconstruction?'FINAL_SEEK_RECONSTRUCT':'SEEK_AGAIN_RELEARN';
    return {ok,assisted,reconstruction,session:next};
  }

  function submitFinalReconstruction(session,mission,answer){
    const w=current(session,mission);
    const plan=finalReconstructionPlan(w);
    if(!plan){
      const next=clone(session);
      next.stage='SEEK_AGAIN_RELEARN';
      return {ok:false,unsupported:true,plan:null,session:next};
    }
    const a=String(answer||'').trim().normalize('NFKC').toLowerCase();
    const target=String(w?.token||'').trim().normalize('NFKC').toLowerCase();
    const ok=!!a&&a===target;
    HideV2Memory.record(mission.id,w.id,{
      stage:'FINAL_SEEK_RECONSTRUCT',
      evidenceMode:'ASSISTED_RECONSTRUCTION',
      axes:['FORM','RECALL','WRITE_OR_RECONSTRUCT'],
      result:ok?'CORRECT':'WRONG',
      objectiveVerified:true,
      objectiveRecall:false,
      recallScoreImpact:false,
      assisted:true,
      supportType:plan.type
    });
    const next=clone(session);
    next.stage=ok?'SEEK_AGAIN':'SEEK_AGAIN_RELEARN';
    return {ok,plan,session:next};
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
    STAGES,create,current,advance,submitMemorize,checkFirstFind,firstFindSupportPlan,submitFirstFindAssist,markFirstFindUnsure,submitFirstFindRelearn,meaningChallenge,checkMeaningChoice,meaningSupportPlan,checkMeaning,submitMeaningAssist,submitMeaningRelearn,hiddenWordsPlan,hiddenWordsSupportPlan,submitDomainExtension,submitSoundRelearn,submitHiddenWords,submitHiddenWordsAssist,submitHiddenWordsRelearn,finalReconstructionPlan,useFinalSupport,checkFinalSeek,submitFinalReconstruction,submitSeekAgainRelearn,checkSeekAgain
  });
})();
