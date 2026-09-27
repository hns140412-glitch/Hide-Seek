const {test,expect}=require('@playwright/test');
test('central V2 exact Ready run identity is required',async({page})=>{
 const m={id:'one',title:'one',status:'READY',items:[{id:'a',lexicalId:'a::뜻',token:'a',meaning:'뜻',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[]}],provenance:{source:'TEST_FIXTURE'}};
 await page.addInitScript(missions=>localStorage.setItem('hide_seek_v2_state',JSON.stringify({version:1,profile:{displayName:'test'},missions,activeMissionId:'one',activeSession:null,events:[]})),[m]);
 const d={authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE',reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE',scheduleOwner:'READY_SET_PLANNER',lexicalIds:['a::뜻'],directiveId:'central-hide:todo-one',taskId:'task-one',basisKind:'OBSERVATION_ADVISORY_ONLY',observationIsVerifiedProof:false};
 const qs=new URLSearchParams({session_id:'session-one',task_id:'task-one',lap_id:'lap-one',child_id:'CHILD_A',review_directive:JSON.stringify(d)});
 await page.goto('/v2.html?'+qs);
 const r=await page.evaluate(()=>{
   const first=HideV2App.start();
   const s=HideV2Store.snapshot().activeSession;
   HideV2Session.update({...s,stage:'COMPLETE'});
   const u=new URL(location.href);u.searchParams.set('lap_id','lap-two');u.searchParams.set('session_id','session-two');history.replaceState(null,'',u);
   const old=HideV2ReadyBridge.returnToReady();
   const next=HideV2App.start(),current=HideV2Store.snapshot().activeSession;
   return {first,old,next,current,taskState:HideV2ReadyBridge.buildResult().taskState};
 });
 expect(r.first.ok).toBe(true);
 expect(r.old.reason).toBe('MATCHED_ACTIVE_REVIEW_SESSION_REQUIRED');
 expect(r.next.ok).toBe(true);
 expect(r.current.readySessionId).toBe('session-two');
 expect(r.current.readyLapId).toBe('lap-two');
 expect(r.current.stage).not.toBe('COMPLETE');
 expect(r.taskState).toBe('PARTIAL');
});

test('missing central Ready session prevents mutation before a multi-mission bundle is made',async({page})=>{
 const word=(id,lexicalId)=>({id,lexicalId,token:id,meaning:'뜻',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[]});
 const missions=['a','b'].map(id=>({id,title:id,status:'READY',items:[word(id,id+'::뜻')],provenance:{source:'TEST_FIXTURE'}}));
 await page.addInitScript(missions=>localStorage.setItem('hide_seek_v2_state',JSON.stringify({version:1,missions,profile:{displayName:'test'},activeMissionId:'a',activeSession:null,events:[]})),missions);
 const d={authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE',reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE',scheduleOwner:'READY_SET_PLANNER',lexicalIds:['a::뜻','b::뜻'],directiveId:'central-hide:todo-two',taskId:'task-two',basisKind:'OBSERVATION_ADVISORY_ONLY',observationIsVerifiedProof:false};
 await page.goto('/v2.html?'+new URLSearchParams({task_id:'task-two',lap_id:'lap-one',review_directive:JSON.stringify(d)}));
 const r=await page.evaluate(()=>{
  const before=HideV2Store.snapshot(),start=HideV2App.start(),after=HideV2Store.snapshot();
  return {start,before:before.missions.length,after:after.missions.length,session:after.activeSession,events:after.events.length};
 });
 expect(r.start.reason).toBe('CENTRAL_READY_RUN_IDENTITY_REQUIRED');
 expect(r.after).toBe(r.before);
 expect(r.session).toBe(null);
 expect(r.events).toBe(0);
});

test('central V2 refuses a changed member even when session and lexical IDs match',async({page})=>{
 const m={id:'member-check',title:'member-check',status:'READY',items:[{id:'a',lexicalId:'a::뜻',token:'a',meaning:'뜻',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[]}],provenance:{source:'TEST_FIXTURE'}};
 await page.addInitScript(items=>localStorage.setItem('hide_seek_v2_state',JSON.stringify({version:1,profile:{displayName:'test'},missions:items,activeMissionId:'member-check',activeSession:null,events:[]})),[m]);
 const d={authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE',reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE',scheduleOwner:'READY_SET_PLANNER',lexicalIds:['a::뜻'],directiveId:'central-hide:todo-one',taskId:'task-one',basisKind:'OBSERVATION_ADVISORY_ONLY',observationIsVerifiedProof:false};
 await page.goto('/v2.html?'+new URLSearchParams({session_id:'session-one',task_id:'task-one',lap_id:'lap-one',child_id:'CHILD_A',review_directive:JSON.stringify(d)}));
 const result=await page.evaluate(()=>{
  const first=HideV2App.start(),initial=HideV2Store.snapshot().activeSession;
  const url=new URL(location.href);url.searchParams.set('child_id','CHILD_B');history.replaceState(null,'',url);
  const old=HideV2ReadyBridge.returnToReady(),newRun=HideV2App.start(),after=HideV2Store.snapshot().activeSession;
  return {first,initial,old,newRun,after};
 });
 expect(result.first.ok).toBe(true);
 expect(result.initial.readyChildId).toBe('CHILD_A');
 expect(result.old.reason).toBe('MATCHED_ACTIVE_REVIEW_SESSION_REQUIRED');
 expect(result.newRun.reason).toBe('DIFFERENT_ACTIVE_SESSION_REQUIRES_EXPLICIT_RESOLUTION');
 expect(result.after.id).toBe(result.initial.id);
});

test('the same central Planner directive starts a distinct bundle on a later Ready run',async({page})=>{
 const make=(id,lexicalId)=>({id,lexicalId,token:id,meaning:'뜻',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[]});
 const missions=['a','b'].map(id=>({id,title:id,status:'READY',items:[make(id,id+'::뜻')],provenance:{source:'TEST_FIXTURE'}}));
 await page.addInitScript(rows=>localStorage.setItem('hide_seek_v2_state',JSON.stringify({
  version:1,profile:{displayName:'test'},missions:rows,activeMissionId:'a',activeSession:null,events:[]})),missions);
 const d={authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE',reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE',
  scheduleOwner:'READY_SET_PLANNER',lexicalIds:['a::뜻','b::뜻'],directiveId:'central-hide:same-todo',
  taskId:'task-one',basisKind:'OBSERVATION_ADVISORY_ONLY',observationIsVerifiedProof:false};
 await page.goto('/v2.html?'+new URLSearchParams({session_id:'ready-old',task_id:'task-one',
  lap_id:'old-lap',child_id:'CHILD_A',review_directive:JSON.stringify(d)}));
 const result=await page.evaluate(()=>{
  const first=HideV2App.start(),firstState=HideV2Store.snapshot();
  const oldBundleId=firstState.activeMissionId;
  HideV2Memory.record(oldBundleId,'review-item-0',{stage:'FINAL_SEEK',evidenceMode:'RECALL',
   objectiveRecall:true,objectiveVerified:false,result:'WRONG'});
  HideV2Session.update({...HideV2Store.snapshot().activeSession,stage:'COMPLETE'});
  const oldReturn=HideV2ReadyBridge.buildResult().taskState;
  const url=new URL(location.href);url.searchParams.set('session_id','ready-new');
  url.searchParams.set('lap_id','new-lap');history.replaceState(null,'',url);
  const started=HideV2App.start(),fresh=HideV2Store.snapshot();
  const newBundle=fresh.missions.find(m=>m.id===fresh.activeMissionId);
  const counts=fresh.missions.filter(m=>m.provenance?.source==='READY_SCOPED_REVIEW_BUNDLE').length;
  const originalCount=fresh.missions.find(m=>m.id==='a').items[0].evidence.length;
  const resumed=HideV2App.start(),again=HideV2Store.snapshot();
  return {first,oldReturn,started,resumed,oldBundleId,newBundleId:newBundle.id,
   newSource:newBundle.provenance.readyRun,firstEvidence:newBundle.items[0].evidence.length,
   oldEvidence:again.missions.find(m=>m.id===oldBundleId).items[0].evidence.length,
   newStage:again.activeSession.stage,counts,
   bundleCountAfter:again.missions.filter(m=>m.provenance?.source==='READY_SCOPED_REVIEW_BUNDLE').length,
   originalCount,originalCountAfter:again.missions.find(m=>m.id==='a').items[0].evidence.length,
   wordCount:HideV2Memory.wordbook().length};
 });
 expect(result.first.ok).toBe(true);
 expect(result.oldReturn).toBe('COMPLETED');
 expect(result.started.ok).toBe(true);
 expect(result.newBundleId).not.toBe(result.oldBundleId);
 expect(result.newSource).toEqual({session_id:'ready-new',task_id:'task-one',lap_id:'new-lap',child_id:'CHILD_A'});
 expect(result.oldEvidence).toBe(1);
 expect(result.firstEvidence).toBe(1);
 expect(result.newStage).not.toBe('COMPLETE');
 expect(result.counts).toBe(2);
 expect(result.resumed.ok).toBe(true);
 expect(result.bundleCountAfter).toBe(2);
 expect(result.originalCount).toBe(1);
 expect(result.originalCountAfter).toBe(1);
 expect(result.wordCount).toBe(2);
});
