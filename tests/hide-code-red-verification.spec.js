const {test,expect}=require('@playwright/test');

test('main Code Red candidate survives the richer Hide Draft trace without minting verified proof',async({page})=>{
 await page.goto('/');
 await expect.poll(()=>page.evaluate(()=>
  typeof emitCodeRedRetrievalCandidate==='function'&&!!globalThis.HideSeekBridge?.emit)).toBe(true);
 const observed=await page.evaluate(()=>{
  const w={id:'w-a',lexicalId:'a::뜻'},source={sheetId:'sheet-a'};
  const initial=(S.takyLearningOutbox||[]).length;
  const trials=[
   ['CORRECT',0,0,1],['SLOW_CORRECT',0,0,1],
   ['WRONG',0,1,0],['HINT_USED',1,0,0],['TIMEOUT',0,0,0],
   ['CORRECT',1,0,0]
  ];
  const emitted=trials.map(([type,hintLevel,wrongAttempts])=>
   emitCodeRedRetrievalCandidate(type,w,
    {hintLevel,wrongAttempts,elapsedMs:1200},source));
  const pass=emitCodeRedRetrievalCandidate('PASS',w,
   {hintLevel:0,wrongAttempts:0,elapsedMs:500},source);
  const stored=S.takyLearningOutbox.slice(-trials.length);
  return {initial,after:S.takyLearningOutbox.length,
   pass,stored:stored.map(e=>({
    type:e.event_type,valid:TakyEventEnvelope.validate(e).ok,
    data:e.payload,receipt:e.payload.verification_receipt,
    verified:e.payload.verified_outcome
   })),emitted:emitted.map((e,i)=>({
    eventId:e.event_id,same:e.event_id===stored[i].event_id
   }))};
 });
 expect(observed.after-observed.initial).toBe(6);
 expect(await page.evaluate(()=>recordCodeResult.toString().includes('emitCodeRedRetrievalCandidate(type,w,attempt,sh)'))).toBe(true);
 expect(observed.pass).toBeNull();
 expect(observed.stored).toHaveLength(6);
 expect(observed.stored.map(x=>x.data.verification_candidate.outcome))
  .toEqual([1,1,0,0,0,0]);
 expect(observed.stored.map(x=>x.data.verification_candidate.result_type))
  .toEqual(['CORRECT','SLOW_CORRECT','WRONG','HINT_USED','TIMEOUT','CORRECT']);
 for(const row of observed.stored){
  expect(row.type).toBe('RETRIEVAL_ATTEMPT_RESULT');
  expect(row.valid).toBe(true);
  expect(row.data.lexical_id).toBe('a::뜻');
  expect(row.data.verification_candidate.reference_id)
   .toBe('hide-word:sheet-a:w-a:spelling');
  expect(row.data.verification_candidate.verifier_type).toBe('RETRIEVAL_EXACT_MATCH');
  expect(row.data.verification_candidate.target_semantics).toBe('UNASSISTED_EXACT_RETRIEVAL');
  expect(row.receipt).toBeUndefined();
  expect(row.verified).toBeUndefined();
 }
 expect(observed.emitted.every(x=>x.eventId&&x.same)).toBe(true);
});

test('main learning-memory signal keeps child/skill context and remains advisory only',async({page})=>{
 await page.goto('/?'+new URLSearchParams({child_id:'CHILD_A',subject:'english',
  concept_skill_target:'vocabulary',learning_target_id:'a::뜻'}));
 await expect.poll(()=>page.evaluate(()=>typeof globalThis.HideSeekBridge?.emitLearningMemorySignal)).toBe('function');
 const result=await page.evaluate(()=>{
  const e=globalThis.HideSeekBridge.emitLearningMemorySignal({
    word:'a',correct:false,assisted:true,nextReviewPriority:80,spacedEvidence:false,
    source_refs:['source-sheet-1'],provenance:['answer-trail-1']
  });
  return {type:e.event_type,data:e.payload,valid:TakyEventEnvelope.validate(e).ok};
 });
 expect(result.type).toBe('LEARNING_MEMORY_SIGNAL');
 expect(result.valid).toBe(true);
 expect(result.data).toMatchObject({member_id:'CHILD_A',subject:'english',
  concept_skill_target:'vocabulary',learning_target_id:'a::뜻',
  correct:false,assisted:true,nextReviewPriority:80,spacedEvidence:false,
  observation_only:true,global_mastery_claim:false,
  schedule_date_owned_by:'READY_SET_PLANNER',
  evidence_source_refs:['source-sheet-1'],evidence_provenance:['answer-trail-1']});
 expect(result.data).not.toHaveProperty('verified_outcome');
 expect(result.data).not.toHaveProperty('verification_receipt');
 expect(result.data).not.toHaveProperty('planner_date');
});
