(() => {
  'use strict';
  const now=()=>new Date().toISOString();
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));

  function record(missionId,wordId,evidence){
    HideV2Mission.updateMission(missionId,m=>{
      const w=m.items.find(x=>x.id===wordId);if(!w)return;
      w.evidence=Array.isArray(w.evidence)?w.evidence:[];
      w.evidence.push({at:now(),...evidence});
      if(w.evidence.length>120)w.evidence=w.evidence.slice(-120);
    });
  }

  function weakness(rows,predicate,weight=18){
    const bad=rows.filter(predicate).length;
    return clamp(bad*weight);
  }

  function signature(word){
    const rows=Array.isArray(word?.evidence)?word.evidence:[];
    const recall=rows.filter(x=>x.objectiveRecall===true);
    const correctRecall=recall.filter(x=>x.result==='CORRECT');
    const wrongRecall=recall.filter(x=>['WRONG','MISMATCH','TIMEOUT','PASS'].includes(x.result));
    const assisted=rows.filter(x=>x.assisted===true);
    const recognition=rows.filter(x=>x.evidenceMode==='RECOGNITION');
    const association=rows.filter(x=>x.evidenceMode==='ASSOCIATION');
    const reconstruction=rows.filter(x=>x.evidenceMode==='RECONSTRUCTION');
    const sound=rows.filter(x=>Array.isArray(x.axes)&&x.axes.includes('SOUND'));
    const meaning=rows.filter(x=>Array.isArray(x.axes)&&x.axes.includes('MEANING'));
    const form=rows.filter(x=>Array.isArray(x.axes)&&(x.axes.includes('FORM')||x.axes.includes('WRITE_OR_RECONSTRUCT')));
    const spaced=rows.filter(x=>x.spacedEvidence===true&&x.objectiveRecall===true&&x.result==='CORRECT');
    const immediateRecovery=rows.filter(x=>['FINAL_SEEK','SEEK_AGAIN'].includes(x.stage)&&x.objectiveRecall===true&&x.result==='CORRECT'&&x.spacedEvidence!==true);
    const confusionCount=association.filter(x=>x.result==='MISMATCH').length+meaning.filter(x=>x.result==='MISMATCH').length;
    const hintCount=rows.filter(x=>x.evidenceMode==='ASSISTANCE'||Number(x.hintLevel||0)>0).length;
    const timeoutCount=rows.filter(x=>x.result==='TIMEOUT').length;
    const slowCount=rows.filter(x=>Number(x.elapsedMs||0)>=8000).length;
    const recallDirections={};
    for(const row of rows.filter(x=>x.objectiveRecall===true&&x.recallDirection)){
      const key=String(row.recallDirection);
      const bucket=recallDirections[key]||(recallDirections[key]={attempts:0,correct:0,wrong:0,assisted:0});
      bucket.attempts++;
      if(row.result==='CORRECT')bucket.correct++;
      else if(['WRONG','MISMATCH','TIMEOUT','PASS'].includes(row.result))bucket.wrong++;
      if(row.assisted===true)bucket.assisted++;
    }

    const recoveryAssist=rows.filter(x=>x.assisted===true&&['FINAL_SEEK_SUPPORT','FINAL_SEEK','SEEK_AGAIN','FIRST_FIND'].includes(x.stage));
    let recoveryStatus='UNPROVEN';
    if(spaced.length) recoveryStatus='SPACED_RECOVERED';
    else if(recoveryAssist.length&&correctRecall.length) recoveryStatus='IMMEDIATE_ONLY';
    else if(recoveryAssist.length&&!correctRecall.length) recoveryStatus='NEEDS_UNASSISTED_RECALL';
    else if(correctRecall.length&&wrongRecall.length) recoveryStatus='IMMEDIATE_ONLY';
    else if(wrongRecall.length&&!correctRecall.length) recoveryStatus='NEEDS_UNASSISTED_RECALL';

    return {
      semanticWeakness:weakness(meaning,x=>['WRONG','MISMATCH'].includes(x.result),22),
      recognitionWeakness:weakness(recognition,x=>['WRONG','MISMATCH'].includes(x.result),18),
      phonologicalWeakness:weakness(sound,x=>['WRONG','MISMATCH'].includes(x.result),24),
      orthographicWeakness:weakness(form,x=>['WRONG','MISMATCH','TIMEOUT'].includes(x.result),22),
      confusionPattern:{count:confusionCount},
      slowRecall:clamp(slowCount*20),
      timeoutRisk:clamp(timeoutCount*30),
      hintDependency:clamp(hintCount*18),
      recoveryStatus,
      recallDirections,
      longTermDecay:spaced.length?0:(immediateRecovery.length?18:(wrongRecall.length?32:10)),
      traceCounts:{
        total:rows.length,
        recall:recall.length,
        recognition:recognition.length,
        association:association.length,
        reconstruction:reconstruction.length,
        spaced:spaced.length
      }
    };
  }

  function summary(word){
    const rows=Array.isArray(word?.evidence)?word.evidence:[];
    const sig=signature(word);
    const recall=rows.filter(x=>x.objectiveRecall===true);
    const verified=rows.filter(x=>x.objectiveVerified===true);
    const wrong=rows.filter(x=>x.result==='WRONG'||x.result==='MISMATCH'||x.result==='TIMEOUT'||x.result==='PASS');
    const assisted=rows.filter(x=>x.assisted===true);
    const successfulRecall=recall.filter(x=>x.result==='CORRECT'&&x.assisted!==true).length;
    const evidenceBase=50+successfulRecall*11;
    const recoveryBonus=sig.recoveryStatus==='SPACED_RECOVERED'?12:sig.recoveryStatus==='IMMEDIATE_ONLY'?-4:sig.recoveryStatus==='NEEDS_UNASSISTED_RECALL'?-10:0;
    const weaknessPenalty=Math.round((sig.semanticWeakness+sig.phonologicalWeakness+sig.orthographicWeakness+sig.hintDependency+sig.timeoutRisk+sig.longTermDecay)/18);
    const strength=clamp(evidenceBase+recoveryBonus-weaknessPenalty,10,100);
    const priority=clamp(100-strength+wrong.length*8+Math.round((sig.semanticWeakness+sig.phonologicalWeakness+sig.orthographicWeakness+sig.hintDependency+sig.timeoutRisk+sig.longTermDecay)/10)+(sig.recoveryStatus==='NEEDS_UNASSISTED_RECALL'||sig.recoveryStatus==='IMMEDIATE_ONLY'?18:0),0,200);
    return {
      lexicalId:word?.lexicalId||null,
      memoryStrength:strength,
      nextReviewPriority:priority,
      recallCount:recall.length,
      verifiedCount:verified.length,
      wrongCount:wrong.length,
      assistedCount:assisted.length,
      needsUnassistedRecall:sig.recoveryStatus==='NEEDS_UNASSISTED_RECALL'||sig.recoveryStatus==='IMMEDIATE_ONLY',
      memorySignature:sig
    };
  }

  function reason(summary){
    const sig=summary.memorySignature||{};
    const reasons=[];
    if(summary.needsUnassistedRecall)reasons.push({key:'recovery',label:'무힌트 재회상 필요',severity:100});
    if(Number(sig.confusionPattern?.count||0)>0)reasons.push({key:'confusion',label:'뜻 혼동',severity:Math.min(100,Number(sig.confusionPattern.count)*30+Number(sig.semanticWeakness||0))});
    if(Number(sig.orthographicWeakness||0)>0)reasons.push({key:'orthographic',label:'글자 형태 취약',severity:sig.orthographicWeakness});
    if(Number(sig.phonologicalWeakness||0)>0)reasons.push({key:'sound',label:'소리 회상 취약',severity:sig.phonologicalWeakness});
    if(Number(sig.slowRecall||0)>0||Number(sig.timeoutRisk||0)>0)reasons.push({key:'latency',label:'느린 회상',severity:Math.max(sig.slowRecall||0,sig.timeoutRisk||0)});
    if(Number(sig.hintDependency||0)>0)reasons.push({key:'hint',label:'힌트 의존',severity:sig.hintDependency});
    if(Number(sig.longTermDecay||0)>=25)reasons.push({key:'decay',label:'기억 약화 가능성',severity:sig.longTermDecay});
    if(!reasons.length)reasons.push({key:'stable',label:'현재 안정',severity:0});
    return reasons.sort((a,b)=>b.severity-a.severity)[0];
  }

  function missionSummary(mission){
    const rows=(mission?.items||[]).map(w=>({word:w,...summary(w)}));
    const advisories=rows.filter(x=>x.needsUnassistedRecall||x.memoryStrength<60);
    return {
      authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
      averageMemoryStrength:rows.length?Math.round(rows.reduce((a,x)=>a+x.memoryStrength,0)/rows.length):0,
      reviewAdvisories:advisories.map(x=>({
        lexicalId:x.word.lexicalId,
        nextReviewPriority:x.nextReviewPriority,
        memoryStrength:x.memoryStrength,
        needsUnassistedRecall:x.needsUnassistedRecall,
        semanticWeakness:x.memorySignature.semanticWeakness,
        phonologicalWeakness:x.memorySignature.phonologicalWeakness,
        orthographicWeakness:x.memorySignature.orthographicWeakness,
        confusionCount:x.memorySignature.confusionPattern.count,
        slowRecall:x.memorySignature.slowRecall,
        timeoutRisk:x.memorySignature.timeoutRisk,
        hintDependency:x.memorySignature.hintDependency,
        recoveryStatus:x.memorySignature.recoveryStatus,
        recallDirections:x.memorySignature.recallDirections,
        longTermDecay:x.memorySignature.longTermDecay,
        advisoryOnly:true,
        evidenceBasis:'HIDE_MEMORY_EVIDENCE',
        learningContextRef:x.word.learningContext||null
      }))
    };
  }

  function wordbook(){
    const missions=HideV2Mission.listMissions();
    const map=new Map();
    for(const mission of missions){
      for(const word of mission.items||[]){
        const key=word.lexicalId||word.id;
        const current=map.get(key)||{lexicalId:key,token:word.token,meaning:word.meaning,languageDomain:word.languageDomain,encounters:0,missions:[],evidence:[]};
        current.encounters++;
        current.missions.push({id:mission.id,title:mission.title,status:mission.status});
        current.evidence.push(...(word.evidence||[]));
        current.learningContext=word.learningContext||current.learningContext||null;
        map.set(key,current);
      }
    }
    return [...map.values()].map(entry=>{
      const pseudo={lexicalId:entry.lexicalId,evidence:entry.evidence};
      const mem=summary(pseudo);
      return {...entry,...mem,primaryReason:reason(mem)};
    }).sort((a,b)=>b.nextReviewPriority-a.nextReviewPriority||a.token.localeCompare(b.token));
  }

  function dashboard(){
    const entries=wordbook();
    const average=entries.length?Math.round(entries.reduce((a,x)=>a+x.memoryStrength,0)/entries.length):0;
    const count=key=>entries.filter(x=>x.primaryReason.key===key).length;
    return {
      total:entries.length,
      averageStrength:average,
      needsRecall:count('recovery'),
      confusion:count('confusion'),
      orthographic:count('orthographic'),
      sound:count('sound'),
      slowRecall:count('latency'),
      hintDependent:count('hint'),
      decay:count('decay'),
      stable:count('stable')
    };
  }

  window.HideV2Memory=Object.freeze({record,signature,summary,reason,missionSummary,wordbook,dashboard});
})();
