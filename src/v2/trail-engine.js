(() => {
  'use strict';

  function latestTerminalRecall(word){
    const rows=(Array.isArray(word?.evidence)?word.evidence:[])
      .filter(x=>['FINAL_SEEK','SEEK_AGAIN'].includes(x.stage)&&x.objectiveRecall===true);
    return rows.length?rows[rows.length-1]:null;
  }

  function wordReadiness(word){
    const terminal=latestTerminalRecall(word);
    const ready=terminal?.result==='CORRECT';
    return Object.freeze({
      lexicalId:word?.lexicalId||null,
      ready,
      terminalStage:terminal?.stage||null,
      terminalResult:terminal?.result||null,
      recoveredToday:ready&&terminal?.stage==='SEEK_AGAIN'
    });
  }

  function missionSummary(mission){
    const items=Array.isArray(mission?.items)?mission.items:[];
    const rows=items.map(wordReadiness);
    const readyWordCount=rows.filter(x=>x.ready).length;
    const totalWordCount=rows.length;
    const recoveredTodayCount=rows.filter(x=>x.recoveredToday).length;
    const trailMastery=totalWordCount?Math.round((readyWordCount/totalWordCount)*100):0;
    return Object.freeze({
      authority:'HIDE_CURRENT_MISSION_READINESS',
      semantics:'CURRENT_MISSION_READINESS_NOT_LONG_TERM_MEMORY',
      trailMastery,
      readyWordCount,
      totalWordCount,
      recoveredTodayCount,
      unstableLexicalIds:rows.filter(x=>!x.ready).map(x=>x.lexicalId).filter(Boolean)
    });
  }

  window.HideV2Trail=Object.freeze({latestTerminalRecall,wordReadiness,missionSummary});
})();