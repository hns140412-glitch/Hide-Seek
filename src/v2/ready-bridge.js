(() => {
  'use strict';
  const PARAMS=['session_id','goal_id','task_id','lap_id','return_target','snap_target','child_id','actor_role','crew_member_id','crew_member_name','crew_rules_version','review_directive'];
  function context(){
    const q=new URLSearchParams(location.search),out={};
    for(const k of PARAMS){const v=q.get(k);if(v)out[k]=v}
    return out;
  }
  function hasReviewRequest(){return !!context().review_directive}
  function reviewDirective(){
    const ctx=context(),raw=ctx.review_directive;if(!raw)return null;
    let x;try{x=JSON.parse(raw)}catch{return null}
    if(!x||typeof x!=='object'||Array.isArray(x))return null;
    const central=x.authority==='EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE';
    if(!central&&x.authority!=='EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE')return null;
    if(x.reviewPolicyOwner!==(central?'TAKY_LEARNING_ENGINE_CORE':'READY_LEARNING_ENGINE')||
       x.scheduleOwner!=='READY_SET_PLANNER')return null;
    if(central&&(!['OBSERVATION_ADVISORY_ONLY','VERIFIED_ONLY',
      'VERIFIED_WITH_OBSERVATION_ADVISORY'].includes(x.basisKind)||
      x.observationIsVerifiedProof!==false))return null;
    const lexicalIds=[...new Set((Array.isArray(x.lexicalIds)?x.lexicalIds:[])
      .map(v=>String(v||'').trim()).filter(Boolean))].slice(0,24);
    if(!lexicalIds.length||!String(ctx.task_id||'').trim()||
       String(x.taskId||'').trim()!==String(ctx.task_id).trim())return null;
    return Object.freeze({
      authority:x.authority,
      reviewPolicyOwner:x.reviewPolicyOwner,
      scheduleOwner:'READY_SET_PLANNER',
      lexicalIds,
      directiveId:String(x.directiveId||'').trim()||null,
      taskId:String(x.taskId).trim(),
      scheduledDate:String(x.scheduledDate||'').trim()||null,
      basisKind:central?x.basisKind:null,
      observationIsVerifiedProof:false
    });
  }
  function targetItemIds(mission){
    if(!hasReviewRequest())return null;
    const d=reviewDirective();if(!d)return [];
    const matched=(mission?.items||[]).filter(w=>d.lexicalIds.includes(w.lexicalId));
    const coverage=new Set(matched.map(w=>w.lexicalId));
    return d.lexicalIds.every(id=>coverage.has(id))?matched.map(w=>w.id):[];
  }
  function resolveTargetMission(){
    const active=HideV2Mission.activeMission();
    if(!hasReviewRequest())return {ok:!!active,mission:active,targetItemIds:null,
      reason:active?null:'MISSION_REQUIRED'};
    const d=reviewDirective();
    if(!d)return {ok:false,reason:'EXPLICIT_REVIEW_DIRECTIVE_INVALID'};
    const candidates=HideV2Mission.listMissions().filter(m=>
      m.status!=='ARCHIVED'&&
      (m.provenance?.source!=='READY_SCOPED_REVIEW_BUNDLE'||
       m.provenance?.reviewDirectiveId===d.directiveId));
    const ordered=[active,...candidates].filter((m,i,a)=>m&&
      candidates.some(x=>x.id===m.id)&&a.findIndex(x=>x?.id===m.id)===i);
    const chosen=ordered.find(m=>targetItemIds(m)?.length>0);
    if(chosen)return {ok:true,mission:chosen,targetItemIds:targetItemIds(chosen),
      directive:d};
    // Preserve the exact lexical scope even when the review items originate
    // from separate source sheets. A linked bundle is persisted only after
    // the unrelated-active-session guard in the app has passed.
    const original=ordered.filter(m=>
      m.provenance?.source!=='READY_SCOPED_REVIEW_BUNDLE');
    const picked=d.lexicalIds.map((lexicalId,i)=>{
      for(const m of original){
        const w=m.items?.find(x=>x.lexicalId===lexicalId);
        if(w)return {id:'review-item-'+i,lexicalId,token:w.token,
          meaning:w.meaning,example:w.example,languageDomain:w.languageDomain,
          learningContext:w.learningContext,meaningMap:w.meaningMap,
          contextEvidence:w.contextEvidence,soundEvidence:w.soundEvidence,
          missionRole:'REVIEW',evidence:structuredClone(w.evidence||[]),
          reviewSource:{missionId:m.id,itemId:w.id}};
      }
      return null;
    });
    if(picked.some(x=>!x))return {ok:false,reason:'REVIEW_TARGETS_NOT_AVAILABLE',
      missingLexicalIds:d.lexicalIds.filter((id,i)=>!picked[i])};
    const bundle={id:'ready-bundle:'+d.directiveId,
      title:'함께 다시 찾기 · '+picked.length+'개 단어',
      items:picked,sourceCount:0,provenance:{
        source:'READY_SCOPED_REVIEW_BUNDLE',reviewDirectiveId:d.directiveId,
        targetLexicalIds:[...d.lexicalIds]}};
    return {ok:true,mission:null,reviewBundle:bundle,
      targetItemIds:picked.map(x=>x.id),directive:d};
  }
  function matchesActiveReview(session,mission){
    if(!hasReviewRequest())return true;
    const d=reviewDirective(),expected=targetItemIds(mission),ctx=context();
    const central=d?.authority==='EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE';
    const sameRun=!central||(!!ctx.session_id&&!!ctx.task_id&&!!ctx.lap_id&&!!ctx.child_id&&
      session?.readySessionId===ctx.session_id&&session.readyTaskId===ctx.task_id&&
      session.readyLapId===ctx.lap_id&&session.readyChildId===ctx.child_id);
    return !!(sameRun&&d&&session&&mission&&session.missionId===mission.id&&
      (session.reviewDirectiveId===d.directiveId||
        (d.authority==='EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE'&&
         !session.reviewDirectiveId))&&
      Array.isArray(expected)&&expected.length&&
      JSON.stringify(session.queue)===JSON.stringify(expected));
  }
  function expressionReviewCandidates(mission,itemIds=null){
    if(!mission)return [];
    const scope=Array.isArray(itemIds)?new Set(itemIds):null;
    return (mission.items||[])
      .filter(w=>!scope||scope.has(w.id))
      .map(w=>{
        const rows=(Array.isArray(w.evidence)?w.evidence:[]).filter(x=>x.stage==='RESPONSE_TRAIL'&&x.evidenceMode==='PRODUCTION');
        const latest=rows.length?rows[rows.length-1]:null;
        if(!latest)return null;
        return {
          itemId:w.id,
          lexicalId:w.lexicalId||null,
          token:w.token,
          languageDomain:w.languageDomain,
          responseText:String(latest.responseText||''),
          targetUsed:latest.targetUsed===true,
          semanticCorrectnessClaimed:false,
          objectiveVerified:false,
          reviewState:'HUMAN_SEMANTIC_REVIEW_AVAILABLE',
          evidenceAt:latest.at||null
        };
      })
      .filter(Boolean);
  }

  function buildResult(){
    const s=HideV2Store.snapshot();
    const m=s.missions.find(x=>x.id===s.activeMissionId)||null;
    const activeSession=s.activeSession||null;
    const scopedMission=!!(m&&activeSession?.missionId===m.id);
    const completed=scopedMission&&activeSession.stage==='COMPLETE'&&
      matchesActiveReview(activeSession,m);
    const scopeItemIds=scopedMission?activeSession.queue:null;
    const scopeSet=Array.isArray(scopeItemIds)?new Set(scopeItemIds):null;
    const reviewedLexicalIds=(m?.items||[])
      .filter(w=>!scopeSet||scopeSet.has(w.id)).map(w=>w.lexicalId).filter(Boolean);
    const trail=m?HideV2Trail.missionSummary(m,{itemIds:scopeItemIds}):null;
    const expressionReviews=expressionReviewCandidates(m,scopeItemIds);
    return {
      resultContract:'HIDE_SPECIALIST_RESULT_V2',
      sourceApp:'hide-seek',
      runtime:'V2',
      taskContext:context(),
      activeMissionId:m?.id||null,
      missionTitle:m?.title||null,
      missionStatus:m?.status||null,
      taskState:completed?'COMPLETED':'PARTIAL',
      learningPhase:activeSession?.stage|| (completed?'COMPLETE':null),
      trailMastery:trail?.trailMastery??null,
      trailSummary:trail,
      reviewedLexicalIds,
      memorySummary:m?HideV2Memory.missionSummary(m,{itemIds:scopeItemIds}):null,
      expressionReviewCandidates:expressionReviews,
      humanSemanticReviewAvailable:expressionReviews.length>0,
      reviewDirective:reviewDirective(),
      completedAt:new Date().toISOString()
    };
  }
  function emitTaskEvent(type='TASK_PROGRESS'){
    const payload=buildResult();
    const envelope=globalThis.TakyEventEnvelope?.create
      ? globalThis.TakyEventEnvelope.create({source:'hide-seek',event_type:type,payload})
      : {event_id:'v2-'+Date.now(),source:'hide-seek',event_type:type,payload,created_at:new Date().toISOString()};
    HideV2Store.transaction(s=>{s.events.push(envelope);if(s.events.length>120)s.events=s.events.slice(-120)});
    return envelope;
  }
  function returnToReady(){
    const c=context(),target=c.return_target;
    // Reject an unapproved return destination before any attempt to export
    // child progress; this check is independent of whether a session exists.
    let url=null;
    if(target){
      try{
        url=new URL(target,location.href);
        const allowed=Array.isArray(globalThis.HideV2TrustedReadyOrigins)
          ?globalThis.HideV2TrustedReadyOrigins:[];
        const localhost=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
        if(url.username||url.password||url.hash||
           (url.protocol!=='https:'&&!(url.protocol==='http:'&&localhost))||
           (url.origin!==location.origin&&!allowed.includes(url.origin)))
          return {ok:false,reason:'EXPLICIT_READY_RETURN_ORIGIN_REQUIRED'};
      }catch{return {ok:false,reason:'EXPLICIT_READY_RETURN_ORIGIN_REQUIRED'}}
    }
    const s=HideV2Store.snapshot();
    const mission=s.missions.find(x=>x.id===s.activeMissionId);
    const active=s.activeSession;
    if(!mission||!active||active.missionId!==mission.id||
       !String(active.startedAt||'').trim()||
       !Array.isArray(active.queue)||!active.queue.length||
       !matchesActiveReview(active,mission))
      return {ok:false,reason:'MATCHED_ACTIVE_REVIEW_SESSION_REQUIRED'};
    const eventType=buildResult().taskState==='COMPLETED'?'TASK_COMPLETED':'TASK_PARTIAL';
    if(!target)return {ok:false,reason:'RETURN_TARGET_MISSING',event:emitTaskEvent(eventType)};
    const event=emitTaskEvent(eventType);
    // A URL query is sent to the destination server and its access logs.
    // Keep the bounded local return envelope in the browser fragment instead.
    url.hash='learning_event='+encodeURIComponent(JSON.stringify(event));
    location.assign(url.href);
    return {ok:true,event};
  }
  window.HideV2ReadyBridge=Object.freeze({context,hasReviewRequest,reviewDirective,targetItemIds,
    resolveTargetMission,matchesActiveReview,expressionReviewCandidates,buildResult,emitTaskEvent,returnToReady});
})();