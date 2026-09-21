(() => {
  'use strict';
  const now=()=>new Date().toISOString();
  function record(missionId,wordId,evidence){
    HideV2Mission.updateMission(missionId,m=>{
      const w=m.items.find(x=>x.id===wordId);if(!w)return;
      w.evidence=Array.isArray(w.evidence)?w.evidence:[];
      w.evidence.push({at:now(),...evidence});
      if(w.evidence.length>120)w.evidence=w.evidence.slice(-120);
    });
  }
  function summary(word){
    const rows=Array.isArray(word?.evidence)?word.evidence:[];
    const recall=rows.filter(x=>x.objectiveRecall===true);
    const verified=rows.filter(x=>x.objectiveVerified===true);
    const wrong=rows.filter(x=>x.result==='WRONG'||x.result==='MISMATCH');
    const assisted=rows.filter(x=>x.assisted===true);
    const strength=Math.max(0,Math.min(100,50+recall.filter(x=>x.result==='CORRECT').length*12-wrong.length*10-assisted.length*4));
    return {
      lexicalId:word?.lexicalId||null,
      memoryStrength:strength,
      recallCount:recall.length,
      verifiedCount:verified.length,
      wrongCount:wrong.length,
      assistedCount:assisted.length,
      needsUnassistedRecall:wrong.length>0&&recall.filter(x=>x.result==='CORRECT'&&x.assisted!==true).length===0
    };
  }
  function missionSummary(mission){
    const advisories=(mission?.items||[]).map(w=>({word:w,...summary(w)})).filter(x=>x.needsUnassistedRecall||x.memoryStrength<60);
    return {
      authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
      reviewAdvisories:advisories.map(x=>({
        lexicalId:x.word.lexicalId,
        nextReviewPriority:Math.max(0,100-x.memoryStrength),
        memoryStrength:x.memoryStrength,
        needsUnassistedRecall:x.needsUnassistedRecall,
        advisoryOnly:true,
        evidenceBasis:'HIDE_MEMORY_EVIDENCE',
        learningContextRef:x.word.learningContext||null
      }))
    };
  }
  window.HideV2Memory=Object.freeze({record,summary,missionSummary});
})();