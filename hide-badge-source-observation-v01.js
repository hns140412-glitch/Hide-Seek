(() => {
  'use strict';

  const VERSION='HIDE_BADGE_SOURCE_OBSERVATION_V1';
  const CONTRACT='TAKY_BADGE_SOURCE_OBSERVATION_V1';
  const ALLOWED_FAMILIES=new Set([
    'SELF_START','TIME_CREATION','EXTRA_TASK','FOCUS','RETURN_RECOVERY',
    'HELP_REQUEST','ERROR_DISCOVERY','RETRY','DEEP_THINKING','ISSUE_DURATION',
    'SELF_EXPLANATION','PLAN_ADAPTATION','SPECIAL_BEHAVIOR','WRITING_EXPLORATION',
    'GOAL_COMPLETE','SELF_CHOICE','SELF_PLANNING','HELP_USE','ERROR_CORRECTION',
    'ERROR_ANALYSIS','BREAKTHROUGH','CONCEPT_UNDERSTANDING','SELF_REGULATION',
    'STRATEGY_SWITCH','IMPROVEMENT'
  ]);
  const FORBIDDEN_KEYS=new Set([
    'score','grade','mastery','masteryLevel','mastery_level','ability','abilityLabel','ability_label',
    'intelligence','trait','characterTrait','character_trait','aiInference','ai_inference',
    'modelInference','model_inference','confidence','elapsedMs','elapsed_ms','responseLatencyMs','response_latency_ms',
    'attemptCount','attempt_count','silenceMs','silence_ms'
  ]);
  const clean=(value,max=180)=>typeof value==='string'?value.trim().slice(0,max):'';

  function hasForbiddenKeyDeep(value,depth=0){
    if(depth>4||value===null||typeof value!=='object')return false;
    if(Array.isArray(value))return value.some(x=>hasForbiddenKeyDeep(x,depth+1));
    for(const [key,item] of Object.entries(value)){
      if(FORBIDDEN_KEYS.has(key))return true;
      if(hasForbiddenKeyDeep(item,depth+1))return true;
    }
    return false;
  }

  function cleanPayload(payload={}){
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return {};
    if(hasForbiddenKeyDeep(payload))throw new Error('HIDE_BADGE_SOURCE_WEAK_PROXY_FORBIDDEN');
    const out={};
    for(const [key,value] of Object.entries(payload).slice(0,24)){
      if(value===null||typeof value==='boolean'||Number.isFinite(value))out[key]=value;
      else if(typeof value==='string')out[key]=clean(value,180);
      else if(Array.isArray(value))out[key]=value.filter(x=>typeof x==='string').map(x=>clean(x,100)).slice(0,12);
    }
    return out;
  }

  function normalize(input={}){
    const eventId=clean(input.event_id||input.eventId,160);
    const family=clean(input.event_family||input.eventFamily,80).toUpperCase();
    const behaviorCode=clean(input.behavior_code||input.behaviorCode,120).toUpperCase();
    const sourceContractId=clean(input.source_contract_id||input.sourceContractId,140);
    const evidenceRef=clean(input.evidence_ref||input.evidenceRef,220);
    if(!eventId)throw new Error('HIDE_BADGE_SOURCE_EVENT_ID_REQUIRED');
    if(!ALLOWED_FAMILIES.has(family))throw new Error('HIDE_BADGE_SOURCE_FAMILY_INVALID');
    if(!behaviorCode)throw new Error('HIDE_BADGE_SOURCE_BEHAVIOR_CODE_REQUIRED');
    if(!sourceContractId)throw new Error('HIDE_BADGE_SOURCE_CONTRACT_REQUIRED');
    if(!evidenceRef)throw new Error('HIDE_BADGE_SOURCE_EVIDENCE_REF_REQUIRED');
    if(input.explicit_child_action!==true&&input.explicitChildAction!==true)
      throw new Error('HIDE_BADGE_SOURCE_EXPLICIT_CHILD_ACTION_REQUIRED');
    return Object.freeze({
      contract_version:CONTRACT,
      event_id:eventId,
      app_id:'HIDE_SEEK',
      event_family:family,
      behavior_code:behaviorCode,
      occurred_at:clean(input.occurred_at||input.occurredAt||input.at,80)||new Date().toISOString(),
      source_contract_id:sourceContractId,
      evidence_ref:evidenceRef,
      explicit_child_action:true,
      payload:cleanPayload(input.payload||{}),
      disposition:'OBSERVATION_ONLY',
      badge_award_authorized:false,
      economy_mutation_authorized:false,
      catalog_activation_allowed:false
    });
  }

  function record(state,input={}){
    if(!state||typeof state!=='object')return null;
    const observation=normalize(input);
    const ledger=Array.isArray(state.badgeSourceObservations)?state.badgeSourceObservations:[];
    const existing=ledger.find(x=>x?.event_id===observation.event_id);
    if(existing)return existing;
    state.badgeSourceObservations=[observation,...ledger].slice(0,500);
    try{window.dispatchEvent(new CustomEvent('hide-badge-source-observation',{detail:observation}))}catch{}
    return observation;
  }

  function recordErrorReview({state,sheetId,targetWordIds,at}={}){
    if(!state)return null;
    const sheet=clean(sheetId,160);
    const targets=Array.isArray(targetWordIds)?targetWordIds.map(x=>clean(x,160)).filter(Boolean):[];
    if(!sheet||!targets.length)return null;
    const occurredAt=clean(at,80)||new Date().toISOString();
    const eventId=`hide_badge_error_review_${sheet}_${occurredAt}`;
    return record(state,{
      event_id:eventId,
      event_family:'ERROR_DISCOVERY',
      behavior_code:'ERROR_REVIEW',
      occurred_at:occurredAt,
      source_contract_id:'HIDE_EXPLICIT_RETRACE_REVIEW_V1',
      evidence_ref:`hide-retrace-review:${sheet}:${occurredAt}`,
      explicit_child_action:true,
      payload:{
        sheetId:sheet,
        targetWordIds:targets,
        reviewMode:'RETRACE'
      }
    });
  }

  function recordRetraceCorrection({state,sheetId,wordId,priorAttempt,currentAttempt}={}){
    if(!state||priorAttempt?.type!=='WRONG'||currentAttempt?.type!=='CORRECT')return null;
    const sheet=clean(sheetId,160);
    const word=clean(wordId,160);
    const priorAt=clean(priorAttempt?.at,80);
    const currentAt=clean(currentAttempt?.at,80);
    if(!sheet||!word||!priorAt||!currentAt)return null;
    const eventId=`hide_badge_error_corrected_${sheet}_${word}_${currentAt}`;
    return record(state,{
      event_id:eventId,
      event_family:'ERROR_CORRECTION',
      behavior_code:'ERROR_CORRECTED_COMPLETE',
      occurred_at:currentAt,
      source_contract_id:'HIDE_RETRACE_CORRECTION_V1',
      evidence_ref:`hide-retrace-correction:${sheet}:${word}:${currentAt}`,
      explicit_child_action:true,
      payload:{
        sheetId:sheet,
        wordId:word,
        priorAttemptAt:priorAt,
        correctedAttemptAt:currentAt,
        priorResultType:'WRONG',
        correctedResultType:'CORRECT',
        interactionMode:'CORE'
      }
    });
  }


  function recordCorrectionCourage({state,sheetId,wordId,priorAttempt,currentAttempt,reviewObservation}={}){
    if(!state||priorAttempt?.type!=='WRONG'||currentAttempt?.type!=='CORRECT')return null;
    if(reviewObservation?.event_family!=='ERROR_DISCOVERY'||reviewObservation?.behavior_code!=='ERROR_REVIEW')return null;
    const sheet=clean(sheetId,160),word=clean(wordId,160);
    const priorAt=clean(priorAttempt?.at,80),currentAt=clean(currentAttempt?.at,80);
    const reviewAt=clean(reviewObservation?.occurred_at,80);
    const reviewSheet=clean(reviewObservation?.payload?.sheetId,160);
    const targets=Array.isArray(reviewObservation?.payload?.targetWordIds)?reviewObservation.payload.targetWordIds.map(x=>clean(x,160)):[];
    const reviewId=clean(reviewObservation?.event_id,160);
    if(!sheet||!word||!priorAt||!currentAt||!reviewAt||!reviewId)return null;
    if(reviewSheet!==sheet||!targets.includes(word))return null;
    // Resolve persisted child actions and exact-match artifacts; result labels alone are insufficient.
    if(reviewObservation.contract_version!==CONTRACT||reviewObservation.app_id!=='HIDE_SEEK'||
      reviewObservation.source_contract_id!=='HIDE_EXPLICIT_RETRACE_REVIEW_V1'||
      reviewObservation.explicit_child_action!==true||reviewObservation.payload?.reviewMode!=='RETRACE'||
      !state.badgeSourceObservations?.includes(reviewObservation))return null;
    const history=state.codeRed?.history;
    if(!Array.isArray(history)||!history.includes(priorAttempt)||!history.includes(currentAttempt)||
      history.indexOf(priorAttempt)>=history.indexOf(currentAttempt))return null;
    if(priorAttempt.sheetId!==sheet||currentAttempt.sheetId!==sheet||
      priorAttempt.wordId!==word||currentAttempt.wordId!==word)return null;
    const target=state.sheets?.find(x=>x.sheetId===sheet)?.items?.find(x=>x.id===word)?.eng?.toLowerCase();
    const rejected=priorAttempt.rejectedSelection,answer=currentAttempt.answerArtifact;
    if(!target||rejected?.target!==target||!Number.isInteger(rejected.position)||
      rejected.position<0||rejected.position>=target.length||
      typeof rejected.selected!=='string'||rejected.selected.length!==1||
      rejected.selected===target[rejected.position])return null;
    if(currentAttempt.verificationBasis!=='RETRIEVAL_EXACT_MATCH_V1'||answer?.target!==target||
      !Array.isArray(answer.positions)||!answer.positions.length||!Array.isArray(answer.letters)||
      answer.positions.length!==answer.letters.length||new Set(answer.positions).size!==answer.positions.length||
      !answer.positions.every((position,i)=>Number.isInteger(position)&&position>=0&&position<target.length&&
        answer.letters[i]===target[position]))return null;

    const p=Date.parse(priorAt),r=Date.parse(reviewAt),n=Date.parse(currentAt);
    if(!Number.isFinite(p)||!Number.isFinite(r)||!Number.isFinite(n)||p>r||r>n)return null;
    return record(state,{
      event_id:`hide_badge_correction_courage_${sheet}_${word}_${currentAt}`,
      event_family:'ERROR_CORRECTION',
      behavior_code:'CORRECTION_COURAGE',
      occurred_at:currentAt,
      source_contract_id:'HIDE_RETRACE_CORRECTION_COURAGE_V1',
      evidence_ref:`hide-retrace-correction-courage:${sheet}:${word}:${currentAt}`,
      explicit_child_action:true,
      payload:{
        sheetId:sheet,
        wordId:word,
        priorWrongAt:priorAt,
        errorArtifactRef:`hide-code-result:${sheet}:${word}:${priorAt}:rejectedSelection`,
        correctedArtifactRef:`hide-code-result:${sheet}:${word}:${currentAt}:answerArtifact`,
        verificationBasis:'RETRIEVAL_EXACT_MATCH_V1',
        explicitRetraceReviewEventId:reviewId,
        explicitRetraceReviewAt:reviewAt,
        correctedAt:currentAt,
        priorResultType:'WRONG',
        correctedResultType:'CORRECT',
        interactionMode:'CORE'
      }
    });
  }

  globalThis.HideBadgeSourceObservationV01=Object.freeze({
    VERSION,CONTRACT,
    families:Object.freeze([...ALLOWED_FAMILIES]),
    normalize,record,recordErrorReview,recordRetraceCorrection,recordCorrectionCourage,hasForbiddenKeyDeep
  });
})();
