(() => {
  'use strict';
  const PARAMS=['session_id','goal_id','task_id','lap_id','return_target','snap_target','child_id','actor_role','crew_member_id','crew_member_name','crew_rules_version','review_directive'];
  function context(){
    const q=new URLSearchParams(location.search),out={};
    for(const k of PARAMS){const v=q.get(k);if(v)out[k]=v}
    return out;
  }
  function reviewDirective(){
    const raw=context().review_directive;if(!raw)return null;
    let x;try{x=JSON.parse(raw)}catch{return null}
    if(!x||typeof x!=='object'||Array.isArray(x))return null;
    if(x.authority!=='EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE')return null;
    if(x.reviewPolicyOwner!=='READY_LEARNING_ENGINE'||x.scheduleOwner!=='READY_SET_PLANNER')return null;
    const lexicalIds=[...new Set((Array.isArray(x.lexicalIds)?x.lexicalIds:[]).map(v=>String(v||'').trim()).filter(Boolean))].slice(0,24);
    if(!lexicalIds.length)return null;
    return Object.freeze({
      authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      lexicalIds,
      directiveId:String(x.directiveId||'').trim()||null,
      taskId:String(x.taskId||context().task_id||'').trim()||null,
      scheduledDate:String(x.scheduledDate||'').trim()||null
    });
  }
  function targetItemIds(mission){
    const d=reviewDirective();if(!d)return null;
    const ids=(mission?.items||[]).filter(w=>d.lexicalIds.includes(w.lexicalId)).map(w=>w.id);
    return ids.length?ids:null;
  }
  function buildResult(){
    const s=HideV2Store.snapshot();
    const m=s.missions.find(x=>x.id===s.activeMissionId)||null;
    return {
      sourceApp:'hide-seek',
      runtime:'V2',
      taskContext:context(),
      activeMissionId:m?.id||null,
      missionTitle:m?.title||null,
      missionStatus:m?.status||null,
      memorySummary:m?HideV2Memory.missionSummary(m):null,
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
    const c=context(),target=c.return_target;if(!target)return {ok:false,reason:'RETURN_TARGET_MISSING',event:emitTaskEvent('TASK_COMPLETED')};
    const event=emitTaskEvent('TASK_COMPLETED');
    const url=new URL(target,location.href);
    url.searchParams.set('learning_event',JSON.stringify(event));
    location.assign(url.href);
    return {ok:true,event};
  }
  window.HideV2ReadyBridge=Object.freeze({context,reviewDirective,targetItemIds,buildResult,emitTaskEvent,returnToReady});
})();