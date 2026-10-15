(() => {
'use strict';
if(window.HideLearningEvidenceSourceV1)return;
const VERSION='2026.10.04-hide-learning-evidence-source-v1';
const original=typeof recordCodeResult==='function'?recordCodeResult:null;
if(!original){window.HideLearningEvidenceSourceV1={version:VERSION,state:'UNBOUND'};return;}

function capture(){
  try{
    const c=codeSession,w=c?.word;
    if(!c||!w)return null;
    const chars=[...String(w.eng||'')];
    for(let slot=0;slot<c.blankIdx.length;slot++){
      const idx=c.blankIdx[slot],keyId=c.answers?.[slot],key=c.keys?.find(x=>x.id===keyId);
      if(key?.ch)chars[idx]=key.ch;
    }
    const complete=c.blankIdx.every((_,slot)=>!!c.answers?.[slot]);
    return {
      learning_target_id:String(w.id||''),
      word_id:String(w.id||''),
      instrument_version:'HIDE_CODE_RED_V1',
      interaction_mode:'CORE',
      assisted:Number(c.hintLevel||0)>0,
      attemptCount:Math.max(1,Number(c.wrongAttempts||0)+1),
      responseLatencyMs:Math.max(0,Date.now()-Number(c.start||Date.now())),
      result_type:null,
      response_value:complete?chars.join(''):null
    };
  }catch{return null}
}
recordCodeResult=function takyEvidenceWrappedRecordCodeResult(type){
  const raw=capture();
  const out=original.apply(this,arguments);
  if(raw&&window.HideSeekBridge?.emit){
    const payload={...raw,result_type:String(type||'')};
    if(raw.response_value!=null)payload.verification_observation={response_value:raw.response_value};
    delete payload.response_value;
    try{window.HideSeekBridge.emit('RETRIEVAL_ATTEMPT_RESULT',payload)}catch{}
  }
  return out;
};
try{window.recordCodeResult=recordCodeResult}catch{}
window.HideLearningEvidenceSourceV1=Object.freeze({version:VERSION,state:'BOUND'});
})();
