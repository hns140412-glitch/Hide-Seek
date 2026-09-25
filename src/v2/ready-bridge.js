(() => {
  'use strict';
  const PARAMS=['session_id','goal_id','task_id','lap_id','return_target','snap_target','child_id','actor_role','crew_member_id','crew_member_name','crew_rules_version','review_directive','learning_context','material_binding'];
  function context(){
    const q=new URLSearchParams(location.search),out={};
    for(const k of PARAMS){const v=q.get(k);if(v)out[k]=v}
    return out;
  }
  function decodeReadyLearningContext(raw){
    if(!raw||typeof raw!=='string'||raw.length>6000)return null;
    try{
      const normalized=raw.replace(/-/g,'+').replace(/_/g,'/');
      const padded=normalized+'='.repeat((4-normalized.length%4)%4);
      const binary=atob(padded);
      const bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));
      const value=JSON.parse(new TextDecoder().decode(bytes));
      if(!value||value.contract_version!=='READY_LEARNING_CONTEXT_V1')return null;
      const forbiddenKeys=new Set(['role','permission','permissions','planner_authority','allocation_authority','family_id','child_id','hanja_grade','hanja_level','grade_inference']);
      if(Object.keys(value).some(key=>forbiddenKeys.has(key)))return null;
      const required=['learning_unit_id','analysis_id','assignment_id'];
      if(required.some(key=>!String(value[key]||'').trim()))return null;
      const list=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean))].slice(0,12):[];
      return Object.freeze({
        contract_version:'READY_LEARNING_CONTEXT_V1',
        learning_unit_id:String(value.learning_unit_id).slice(0,120),
        analysis_id:String(value.analysis_id).slice(0,120),
        assignment_id:String(value.assignment_id).slice(0,120),
        source_range:String(value.source_range||'').slice(0,160)||null,
        workbook_ref_id:String(value.workbook_ref_id||'').slice(0,120)||null,
        subject:String(value.subject||'').slice(0,80)||null,
        concept_skill_target:String(value.concept_skill_target||'').slice(0,180)||null,
        activity_types:list(value.activity_types),
        cognitive_load_profile:list(value.cognitive_load_profile),
        divisible_boundary:String(value.divisible_boundary||'').slice(0,80)||null,
        confidence:Number.isFinite(value.confidence)?Math.max(0,Math.min(1,value.confidence)):null,
        unresolved_flags:list(value.unresolved_flags),
        provenance:{
          engine:String(value.provenance?.engine||'').slice(0,80)||null,
          version:String(value.provenance?.version||'').slice(0,40)||null,
          confirmation_state:String(value.provenance?.confirmation_state||'').slice(0,40)||null
        }
      });
    }catch{return null}
  }
  function readyLearningContext(){return decodeReadyLearningContext(context().learning_context)}
  function materialBinding(){
    const raw=context().material_binding;
    if(!raw)return null;
    let value;try{value=typeof raw==='string'?JSON.parse(raw):raw}catch{return null}
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    if(value.contract_version!=='READY_SPECIALIST_MATERIAL_BINDING_V1')return null;
    if(value.confirmation_state!=='HUMAN_CONFIRMED')return null;
    if(String(value.specialist_app||'').trim()!=='hide-seek')return null;
    const ready=readyLearningContext();if(!ready)return null;
    const same=(a,b)=>String(a||'').trim()===String(b||'').trim();
    if(!same(value.assignment_id,ready.assignment_id))return null;
    if(value.analysis_id&&!same(value.analysis_id,ready.analysis_id))return null;
    if(value.learning_unit_id&&!same(value.learning_unit_id,ready.learning_unit_id))return null;
    if(!same(value.source_range,ready.source_range))return null;
    if(!same(value.workbook_ref_id,ready.workbook_ref_id))return null;
    if(!same(value.concept_skill_target,ready.concept_skill_target))return null;
    if(!String(value.specialist_material_id||'').trim())return null;
    return Object.freeze({
      contract_version:'READY_SPECIALIST_MATERIAL_BINDING_V1',
      assignment_id:ready.assignment_id,
      analysis_id:ready.analysis_id,
      learning_unit_id:ready.learning_unit_id,
      source_range:ready.source_range,
      workbook_ref_id:ready.workbook_ref_id,
      concept_skill_target:ready.concept_skill_target,
      specialist_app:'hide-seek',
      specialist_material_id:String(value.specialist_material_id).slice(0,160),
      specialist_material_kind:String(value.specialist_material_kind||'HIDE_MISSION').slice(0,80),
      confirmation_state:'HUMAN_CONFIRMED',
      confirmation_source:String(value.confirmation_source||'READY_STORED_BINDING').slice(0,80)
    });
  }

  function applyConfirmedMaterialBinding(){
    const binding=materialBinding();if(!binding)return null;
    const missionId=binding.specialist_material_id;
    const s=HideV2Store.snapshot();
    if(!(s.missions||[]).some(m=>m.id===missionId))return null;
    HideV2Mission.setActive(missionId);
    return missionId;
  }

  function materialBindingCandidate(){
    const ready=readyLearningContext();if(!ready)return null;
    const s=HideV2Store.snapshot();
    const mission=(s.missions||[]).find(m=>m.id===s.activeMissionId)||null;
    if(!mission)return null;
    return Object.freeze({
      contract_version:'READY_SPECIALIST_MATERIAL_BINDING_V1',
      assignment_id:ready.assignment_id,
      analysis_id:ready.analysis_id,
      learning_unit_id:ready.learning_unit_id,
      source_range:ready.source_range,
      workbook_ref_id:ready.workbook_ref_id,
      concept_skill_target:ready.concept_skill_target,
      specialist_app:'hide-seek',
      specialist_material_id:mission.id,
      specialist_material_kind:'HIDE_MISSION',
      confirmation_state:'HUMAN_CONFIRMED',
      confirmation_source:'HIDE_USER_ACTION'
    });
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

  function buildResult(options={}){
    const s=HideV2Store.snapshot();
    const m=s.missions.find(x=>x.id===s.activeMissionId)||null;
    const activeSession=s.activeSession||null;
    const completed=m?.status==='COMPLETED'||activeSession?.stage==='COMPLETE';
    const scopeItemIds=activeSession?.queue||null;
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
      memorySummary:m?HideV2Memory.missionSummary(m):null,
      expressionReviewCandidates:expressionReviews,
      humanSemanticReviewAvailable:expressionReviews.length>0,
      reviewDirective:reviewDirective(),
      readyLearningContext:readyLearningContext(),
      materialBinding:materialBinding()||(options.confirmMaterialBinding===true?materialBindingCandidate():null),
      completedAt:new Date().toISOString()
    };
  }
  function emitTaskEvent(type='TASK_PROGRESS',options={}){
    const payload=buildResult(options);
    const envelope=globalThis.TakyEventEnvelope?.create
      ? globalThis.TakyEventEnvelope.create({source:'hide-seek',event_type:type,payload})
      : {event_id:'v2-'+Date.now(),source:'hide-seek',event_type:type,payload,created_at:new Date().toISOString()};
    HideV2Store.transaction(s=>{s.events.push(envelope);if(s.events.length>120)s.events=s.events.slice(-120)});
    return envelope;
  }
  function returnToReady(options={}){
    const c=context(),target=c.return_target;if(!target)return {ok:false,reason:'RETURN_TARGET_MISSING',event:emitTaskEvent('TASK_COMPLETED',options)};
    const event=emitTaskEvent('TASK_COMPLETED',options);
    const url=new URL(target,location.href);
    url.searchParams.set('learning_event',JSON.stringify(event));
    location.assign(url.href);
    return {ok:true,event};
  }
  window.HideV2ReadyBridge=Object.freeze({context,decodeReadyLearningContext,readyLearningContext,materialBinding,materialBindingCandidate,applyConfirmedMaterialBinding,reviewDirective,targetItemIds,expressionReviewCandidates,buildResult,emitTaskEvent,returnToReady});
  applyConfirmedMaterialBinding();
})();