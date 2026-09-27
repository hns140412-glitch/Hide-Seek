const {test,expect}=require('@playwright/test');
test('central V2 exact Ready run identity is required',async({page})=>{
 const m={id:'one',title:'one',status:'READY',items:[{id:'a',lexicalId:'a::뜻',token:'a',meaning:'뜻',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[]}],provenance:{source:'TEST_FIXTURE'}};
 await page.addInitScript(missions=>localStorage.setItem('hide_seek_v2_state',JSON.stringify({version:1,profile:{displayName:'test'},missions,activeMissionId:'one',activeSession:null,events:[]})),[m]);
 const d={authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE',reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE',scheduleOwner:'READY_SET_PLANNER',lexicalIds:['a::뜻'],directiveId:'central-hide:todo-one',taskId:'task-one',basisKind:'OBSERVATION_ADVISORY_ONLY',observationIsVerifiedProof:false};
 const qs=new URLSearchParams({session_id:'session-one',task_id:'task-one',lap_id:'lap-one',review_directive:JSON.stringify(d)});
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
