const {test,expect}=require('@playwright/test');
const word=(id,lexicalId,token)=>({
 id,lexicalId,token,meaning:token+' 뜻',languageDomain:'ENGLISH',
 missionRole:'REVIEW',evidence:[],source:{}
});
const mission=(id,items,status='READY')=>({
 id,title:'탐험 '+id,status,createdAt:'2026-09-27T00:00:00Z',
 updatedAt:'2026-09-27T00:00:00Z',sourceCount:0,
 provenance:{source:'TEST_FIXTURE'},items
});
const directive=(ids,task='task-1',central=true)=>({
 authority:central?'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE':
   'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
 reviewPolicyOwner:central?'TAKY_LEARNING_ENGINE_CORE':'READY_LEARNING_ENGINE',
 scheduleOwner:'READY_SET_PLANNER',lexicalIds:ids,
 directiveId:'review:'+task,taskId:task,scheduledDate:'2026-09-30',
 ...(central?{basisKind:'OBSERVATION_ADVISORY_ONLY',observationIsVerifiedProof:false}:{})
});
const visit=async(page,config,missions,activeMissionId='wrong',activeSession=null)=>{
 await page.addInitScript(state=>localStorage.setItem('hide_seek_v2_state',
  JSON.stringify({version:1,profile:{displayName:'검증 탐험가'},missions:state.missions,
   activeMissionId:state.activeMissionId,activeSession:state.activeSession,
   events:[],updatedAt:'2026-09-27T00:00:00Z'})),
  {missions,activeMissionId,activeSession});
 const q=new URLSearchParams({session_id:'ready-session-1',task_id:'task-1',
  lap_id:'ready-lap-1',child_id:'CHILD_A',review_directive:JSON.stringify(config)});
 await page.goto('/v2.html?'+q.toString());
};
test('central lexical directive finds exact V2 mission and preserves scoped memory/advisory',async({page})=>{
 const wrong=mission('wrong',[word('other','other::뜻','other')]);
 const correct=mission('matched',[
  word('a','a::뜻','a'),word('b','b::뜻','b'),word('c','c::뜻','c')]);
 await visit(page,directive(['a::뜻','b::뜻']),[wrong,correct]);
 const started=await page.evaluate(()=>{
  const x=HideV2App.start(),s=HideV2Store.snapshot();
  return {ok:x.ok,missionId:s.activeMissionId,session:s.activeSession,
   targets:HideV2ReadyBridge.targetItemIds(s.missions[1])};
 });
 expect(started.ok).toBe(true);
 expect(started.missionId).toBe('matched');
 expect(started.session.queue).toEqual(['a','b']);
 expect(started.session.reviewAuthority).toBe('EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE');
 expect(started.targets).toEqual(['a','b']);
 await page.evaluate(()=>{
  HideV2Memory.record('matched','a',{stage:'FINAL_SEEK',evidenceMode:'RECALL',
   axes:['FORM','RECALL'],result:'WRONG',objectiveRecall:true,
   objectiveVerified:true,assisted:false});
  HideV2Memory.record('matched','c',{stage:'FINAL_SEEK',evidenceMode:'RECALL',
   axes:['FORM','RECALL'],result:'WRONG',objectiveRecall:true,
   objectiveVerified:true,assisted:false});
 });
 const before=await page.evaluate(()=>HideV2ReadyBridge.buildResult());
 expect(before.taskState).toBe('PARTIAL');
 const partial=await page.evaluate(()=>HideV2ReadyBridge.returnToReady());
 expect(partial.ok).toBe(false);
 expect(partial.event.event_type).toBe('TASK_PARTIAL');
 expect(partial.event.payload.taskState).toBe('PARTIAL');
 expect(before.memorySummary.scopedItemIds).toEqual(['a','b']);
 expect(before.memorySummary.reviewAdvisories.map(x=>x.lexicalId)).not.toContain('c::뜻');
 await page.evaluate(()=>{
  const s=HideV2Store.snapshot().activeSession;
  HideV2Session.update({...s,stage:'COMPLETE',completedAt:new Date().toISOString()});
 });
 const result=await page.evaluate(()=>HideV2ReadyBridge.buildResult());
 expect(result.taskState).toBe('COMPLETED');
 const completed=await page.evaluate(()=>HideV2ReadyBridge.returnToReady());
 expect(completed.ok).toBe(false);
 expect(completed.event.event_type).toBe('TASK_COMPLETED');
 expect(completed.event.payload.taskState).toBe('COMPLETED');
 expect(result.memorySummary.authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
 expect(result.memorySummary.fullMissionScope).toBe(false);
 expect(result.trailSummary.totalWordCount).toBe(2);
 expect(result.reviewDirective.observationIsVerifiedProof).toBe(false);
 expect(result.reviewedLexicalIds).toEqual(['a::뜻','b::뜻']);
 const emitted=await page.evaluate(()=>HideV2ReadyBridge.emitTaskEvent('TASK_COMPLETED'));
 expect(emitted.event_type).toBe('TASK_COMPLETED');
 expect(emitted.payload.resultContract).toBe('HIDE_SPECIALIST_RESULT_V2');
 expect(emitted.payload.reviewedLexicalIds).toEqual(['a::뜻','b::뜻']);
 expect(emitted.payload.memorySummary.scopedItemIds).toEqual(['a','b']);
 expect(emitted.payload.trailSummary.scopeItemIds).toEqual(['a','b']);
 expect(emitted.payload.taskContext.task_id).toBe('task-1');
 await page.evaluate(()=>HideV2Router.go('learn'));
 const stored=await page.evaluate(()=>{
  const m=HideV2Mission.activeMission();
  return {status:m.status,missionMemoryIds:m.memorySummary.scopedItemIds,
   missionTrailCount:m.trailSummary.totalWordCount,
   returned:HideV2ReadyBridge.buildResult().memorySummary.scopedItemIds};
 });
 expect(stored.status).toBe('PARTIAL');
 expect(stored.missionMemoryIds).toEqual(['a','b','c']);
 expect(stored.missionTrailCount).toBe(3);
 expect(stored.returned).toEqual(['a','b']);
});
test('missing or invalid central target cannot silently run the full active mission',async({page})=>{
 await visit(page,directive(['missing::뜻']),
  [mission('wrong',[word('a','a::뜻','a')])]);
 const result=await page.evaluate(()=>({
  selected:HideV2ReadyBridge.resolveTargetMission(),
  itemIds:HideV2ReadyBridge.targetItemIds(HideV2Mission.activeMission()),
  started:HideV2App.start(),active:HideV2Store.snapshot().activeSession
 }));
 expect(result.selected.reason).toBe('REVIEW_TARGETS_NOT_AVAILABLE');
 expect(result.itemIds).toEqual([]);
 expect(result.started.ok).toBe(false);
 expect(result.active).toBe(null);
 const unstarted=await page.evaluate(()=>{
  const before=HideV2Store.snapshot().events.length;
  const attempt=HideV2ReadyBridge.returnToReady();
  return {attempt,delta:HideV2Store.snapshot().events.length-before};
 });
 expect(unstarted.attempt.reason).toBe('MATCHED_ACTIVE_REVIEW_SESSION_REQUIRED');
 expect(unstarted.attempt.event).toBeUndefined();
 expect(unstarted.delta).toBe(0);
 expect(await page.evaluate(()=>HideV2ReadyBridge.buildResult().taskState)).toBe('PARTIAL');
 await page.evaluate(()=>HideV2Router.go('learn'));
 await expect(page.getByText(/다른 단어로 바꾸어 진행하지 않았어요/)).toBeVisible();
 expect(await page.locator('#view').getByText('REVIEW_TARGETS_NOT_AVAILABLE').count()).toBe(0);
});
test('a previously finished mission and unrelated in-progress session cannot certify a new central task',async({page})=>{
 const unrelated=mission('wrong',[word('a','a::뜻','a')],'COMPLETED');
 const matching=mission('matching',[word('b','b::뜻','b')]);
 const unrelatedSession={id:'old-session',missionId:'wrong',index:0,
  queue:['a'],stage:'FIRST_FIND',attempts:{},startedAt:'2026-09-27T00:00:00Z'};
 await visit(page,directive(['b::뜻']),[unrelated,matching],'wrong',unrelatedSession);
 const r=await page.evaluate(()=>({
  before:HideV2ReadyBridge.buildResult(),
  result:HideV2App.start(),after:HideV2Store.snapshot().activeSession
 }));
 expect(r.before.taskState).toBe('PARTIAL');
 expect(r.result.reason).toBe('DIFFERENT_ACTIVE_SESSION_REQUIRES_EXPLICIT_RESOLUTION');
 expect(r.after.id).toBe('old-session');
 expect(r.after.queue).toEqual(['a']);
});
test('mismatched task binding is rejected and local Ready directive remains supported',async({page})=>{
 await visit(page,directive(['a::뜻'],'another-task'),
  [mission('matched',[word('a','a::뜻','a')])],'matched');
 expect(await page.evaluate(()=>HideV2ReadyBridge.reviewDirective())).toBe(null);
 expect((await page.evaluate(()=>HideV2App.start())).reason).toBe('EXPLICIT_REVIEW_DIRECTIVE_INVALID');
 const local=directive(['a::뜻'],'task-1',false);
 await page.goto('/v2.html?'+new URLSearchParams({session_id:'ready-session-1',
  task_id:'task-1',lap_id:'ready-lap-1',review_directive:JSON.stringify(local)}));
 const selected=await page.evaluate(()=>({
  directive:HideV2ReadyBridge.reviewDirective(),
  started:HideV2App.start()
 }));
 expect(selected.directive.reviewPolicyOwner).toBe('READY_LEARNING_ENGINE');
 expect(selected.started.ok).toBe(true);
});

test('unapproved return target never receives scoped child learning envelope',async({page})=>{
 const target=encodeURIComponent('https://untrusted.example/collect');
 await page.goto('/v2.html?return_target='+target);
 const result=await page.evaluate(()=>({
  response:HideV2ReadyBridge.returnToReady(),
  eventCount:HideV2Store.snapshot().events.length
 }));
 expect(result.response.ok).toBe(false);
 expect(result.response.reason).toBe('EXPLICIT_READY_RETURN_ORIGIN_REQUIRED');
 expect(result.eventCount).toBe(0);
 await page.goto('/v2.html?return_target='+encodeURIComponent('javascript:alert(1)'));
 const unsafe=await page.evaluate(()=>HideV2ReadyBridge.returnToReady());
 expect(unsafe.reason).toBe('EXPLICIT_READY_RETURN_ORIGIN_REQUIRED');
});

test('approved Ready return carries scoped V2 feedback in fragment without server query',async({page})=>{
 await visit(page,directive(['a::뜻']),
  [mission('matched',[word('a','a::뜻','a')])],'matched');
 const started=await page.evaluate(()=>{
  const r=HideV2App.start();
  const url=new URL(location.href);
  url.searchParams.set('return_target',location.origin+'/v2.html');
  history.replaceState(null,'',url.href);
  setTimeout(()=>HideV2ReadyBridge.returnToReady(),0);
  return r.ok;
 });
 expect(started).toBe(true);
 await page.waitForURL(/#learning_event=/);
 const url=new URL(page.url());
 expect(url.searchParams.has('learning_event')).toBe(false);
 const event=JSON.parse(new URLSearchParams(url.hash.slice(1)).get('learning_event'));
 expect(event.source).toBe('hide-seek');
 expect(event.event_type).toBe('TASK_PARTIAL');
 expect(event.payload.taskState).toBe('PARTIAL');
 expect(event.payload.reviewedLexicalIds).toEqual(['a::뜻']);
});

test('central multi-mission bundle returns the exact scoped result and writes evidence to original words once',async({page})=>{
 const unrelated=mission('unrelated',[word('unrelated-item','other::뜻','other')]);
 const sourceA=mission('source-a',[
  word('a-original','a::뜻','a'),word('c-original','c::뜻','c')]);
 const sourceB=mission('source-b',[word('b-original','b::뜻','b')]);
 await visit(page,directive(['a::뜻','b::뜻']),[unrelated,sourceA,sourceB]);
 const started=await page.evaluate(()=>{
  const before=HideV2Memory.wordbook();
  const start=HideV2App.start(),state=HideV2Store.snapshot();
  const m=state.missions.find(x=>x.id===state.activeMissionId);
  return {start,wordCount:before.length,activeMissionId:m?.id,
   provenance:m?.provenance,items:m?.items.map(x=>({
    id:x.id,lexicalId:x.lexicalId,reviewSource:x.reviewSource})),
   queue:state.activeSession?.queue};
 });
 expect(started.start.ok).toBe(true);
 expect(started.wordCount).toBe(4);
 expect(started.provenance.source).toBe('READY_SCOPED_REVIEW_BUNDLE');
 expect(started.provenance.targetLexicalIds).toEqual(['a::뜻','b::뜻']);
 expect(started.items).toEqual([
  {id:'review-item-0',lexicalId:'a::뜻',
   reviewSource:{missionId:'source-a',itemId:'a-original'}},
  {id:'review-item-1',lexicalId:'b::뜻',
   reviewSource:{missionId:'source-b',itemId:'b-original'}}
 ]);
 expect(started.queue).toEqual(['review-item-0','review-item-1']);
 const written=await page.evaluate(()=>{
  const bundle=HideV2Mission.activeMission();
  HideV2Memory.record(bundle.id,'review-item-0',{
   stage:'FINAL_SEEK',evidenceMode:'RECALL',axes:['FORM','RECALL'],
   result:'WRONG',objectiveRecall:true,objectiveVerified:false,assisted:false});
  HideV2Memory.record(bundle.id,'review-item-1',{
   stage:'FINAL_SEEK',evidenceMode:'RECALL',axes:['FORM','RECALL'],
   result:'HINT_USED',objectiveRecall:true,objectiveVerified:false,assisted:true});
  const s=HideV2Store.snapshot();
  const find=(missionId,itemId)=>s.missions.find(x=>x.id===missionId)
    ?.items.find(x=>x.id===itemId);
  const originalA=find('source-a','a-original');
  const originalB=find('source-b','b-original');
  const unrelated=find('unrelated','unrelated-item');
  const untouched=find('source-a','c-original');
  const result=HideV2ReadyBridge.buildResult();
  const after=HideV2Memory.wordbook();
  const resumed=HideV2App.start();
  return {originalA:originalA?.evidence,originalB:originalB?.evidence,
   unrelated:unrelated?.evidence,untouched:untouched?.evidence,
   result,resumed,bundles:HideV2Mission.listMissions().filter(m=>
    m.provenance?.source==='READY_SCOPED_REVIEW_BUNDLE').length,
   wordCount:after.length,lexicalIds:after.map(x=>x.lexicalId)};
 });
 expect(written.originalA).toHaveLength(1);
 expect(written.originalB).toHaveLength(1);
 expect(written.originalA[0].reviewBundleId).toBe(started.activeMissionId);
 expect(written.originalB[0].reviewBundleId).toBe(started.activeMissionId);
 expect(written.unrelated).toEqual([]);
 expect(written.untouched).toEqual([]);
 expect(written.bundles).toBe(1);
 expect(written.wordCount).toBe(4);
 expect(new Set(written.lexicalIds).size).toBe(4);
 expect(written.resumed.ok).toBe(true);
 expect(written.result.taskState).toBe('PARTIAL');
 expect(written.result.reviewedLexicalIds).toEqual(['a::뜻','b::뜻']);
 expect(written.result.memorySummary.scopedItemIds)
  .toEqual(['review-item-0','review-item-1']);
 expect(written.result.trailSummary.scopeItemIds)
  .toEqual(['review-item-0','review-item-1']);
 const completed=await page.evaluate(()=>{
  const active=HideV2Store.snapshot().activeSession;
  HideV2Session.update({...active,stage:'COMPLETE',completedAt:new Date().toISOString()});
  const sent=HideV2ReadyBridge.returnToReady();
  return {event:sent.event,originalCounts:[
   HideV2Store.snapshot().missions.find(x=>x.id==='source-a')
    .items.find(x=>x.id==='a-original').evidence.length,
   HideV2Store.snapshot().missions.find(x=>x.id==='source-b')
    .items.find(x=>x.id==='b-original').evidence.length]};
 });
 expect(completed.event.event_type).toBe('TASK_COMPLETED');
 expect(completed.event.payload.taskState).toBe('COMPLETED');
 expect(completed.event.payload.reviewedLexicalIds).toEqual(['a::뜻','b::뜻']);
 expect(completed.originalCounts).toEqual([1,1]);
});

test('scoped review protects source deletion and refuses an orphaned bundle return',async({page})=>{
 const sources=[mission('source-a',[word('a','a::뜻','a')]),
  mission('source-b',[word('b','b::뜻','b')])];
 await visit(page,directive(['a::뜻','b::뜻']),sources,'source-a');
 const result=await page.evaluate(()=>{
  const first=HideV2App.start(),before=HideV2Store.snapshot();
  const previous=before.activeSession;
  let singleError=null,bulkError=null;
  try{HideV2Mission.deleteMission('source-a')}catch(e){singleError=e.message}
  try{HideV2Mission.bulkDeleteMissions(['source-b'])}catch(e){bulkError=e.message}
  const protectedCount=HideV2Store.snapshot().missions.length;
  HideV2Session.clear();
  HideV2Mission.deleteMission('source-b');
  HideV2Session.update(previous);
  const beforeEvents=HideV2Store.snapshot().events.length;
  const orphaned=HideV2ReadyBridge.resolveTargetMission();
  const rejected=HideV2ReadyBridge.returnToReady();
  const after=HideV2Store.snapshot();
  return {first,singleError,bulkError,protectedCount,orphaned,rejected,
   eventDelta:after.events.length-beforeEvents,
   sourceEvidence:after.missions.find(m=>m.id==='source-a').items[0].evidence,
   hasDeletedSource:after.missions.some(m=>m.id==='source-b')};
 });
 expect(result.first.ok).toBe(true);
 expect(result.singleError).toBe('ACTIVE_REVIEW_SOURCE_DELETE_BLOCKED');
 expect(result.bulkError).toBe('ACTIVE_REVIEW_SOURCE_DELETE_BLOCKED');
 expect(result.protectedCount).toBe(3);
 expect(result.orphaned.reason).toBe('REVIEW_TARGETS_NOT_AVAILABLE');
 expect(result.rejected.reason).toBe('MATCHED_ACTIVE_REVIEW_SESSION_REQUIRED');
 expect(result.eventDelta).toBe(0);
 expect(result.sourceEvidence).toEqual([]);
 expect(result.hasDeletedSource).toBe(false);
});
