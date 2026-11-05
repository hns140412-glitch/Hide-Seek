const {test,expect}=require('@playwright/test');

const URL='http://127.0.0.1:4173/';

test('Hide real memory producer opt-in -> separate browser IndexedDB -> exact observation-only central ACK',async({page})=>{
  await page.goto(URL);
  const initial=await page.evaluate(()=>{
    let missingProvider='';
    try{HideSeekBridge.configureCentralEvidence({});}catch(e){missingProvider=e.message;}
    return {bundle:globalThis.TakyCentralEvidence?.pipeline?.VERSION,
      missingProvider, status:HideSeekBridge.centralEvidenceStatus().status};
  });
  expect(initial).toEqual({bundle:'TAKY_PWA_SCOPED_EVIDENCE_PIPELINE_V1',
    missingProvider:'EXPLICIT_TRUSTED_CENTRAL_SESSION_REQUIRED',status:'UNBOUND'});
  const event=await page.evaluate(()=>{
    window.__centralHttpCalls=[];
    HideSeekBridge.configureCentralEvidence({
      dbName:'hide-evidence-browser-regression-v1',
      endpointUrl:'https://central.example.test/api/learning/evidence',
      sessionProvider:async()=>({authenticated:true,family_id:'F',selected_member_id:'A'}),
      tokenProvider:async()=> 'fixture-bearer-token-1234567890',
      fetchImpl:async(url,opts)=>{
        const packet=JSON.parse(opts.body);
        window.__centralHttpCalls.push({url,credentials:opts.credentials,packet});
        return {status:200,json:async()=>({ok:true,storage_confirmed:true,
          acknowledgement_kind:'OBSERVATION_INGEST_RECEIPT',receipt_id:'fixture:'+packet.event.event_id,
          receipt_scope:{family_id:packet.context.family_id,member_id:packet.context.member_id},
          source_app:packet.source_app,packet_id:packet.packet_id,event_id:packet.event.event_id,
          duplicate:false})};
      }
    });
    return HideSeekBridge.emitLearningMemorySignal({member_id:'A',subject:'english',
      concept_skill_target:'vocabulary',word:'accept',correct:false,assisted:true});
  });
  await expect.poll(()=>page.evaluate(()=>HideSeekBridge.centralEvidenceStatus().status))
    .toBe('PENDING_CENTRAL_OUTBOX');
  expect(event.payload.observation_only).toBe(true);
  expect(event.payload.global_mastery_claim).toBe(false);
  expect(event.payload.dated_allocation_owned_by_planner).toBe(true);
  expect(await page.evaluate(()=>window.__centralHttpCalls.length)).toBe(0);
  const flushed=await page.evaluate(()=>HideSeekBridge.flushCentralEvidenceOnce('hide-browser-fixture'));
  expect(flushed).toMatchObject({processed:true,settled:true,status:'ACKED',reason:'CENTRAL_ACK_VALIDATED'});
  const sent=await page.evaluate(()=>({calls:window.__centralHttpCalls,
    status:HideSeekBridge.centralEvidenceStatus()}));
  expect(sent.calls).toHaveLength(1);
  expect(sent.calls[0].credentials).toBe('omit');
  expect(sent.calls[0].packet.event.event_id).toBe(event.event_id);
  expect(sent.calls[0].packet.packet_id).toBe('hide-seek:'+event.event_id);
  expect(sent.calls[0].packet.context).toMatchObject({family_id:'F',member_id:'A',
    subject:'english',concept_skill_target:'vocabulary'});
  expect(sent.calls[0].packet.evidence_policy).toMatchObject({observation_only:true,
    planner_schedule_authority:false,auto_award:false});
  expect(sent.status.status).toBe('CENTRAL_OBSERVATION_ACKED');
  await page.evaluate(()=>HideSeekBridge.closeCentralEvidence());
});

test('No central session, member mismatch or absent learning scope never claims delivery',async({page})=>{
  await page.goto(URL+'?child_id=A');
  const earlier=await page.evaluate(()=>HideSeekBridge.emitLearningMemorySignal({
    member_id:'A',subject:'english',concept_skill_target:'vocabulary',word:'prior'
  }));
  expect(await page.evaluate(()=>HideSeekBridge.centralEvidenceStatus().status)).toBe('UNBOUND');
  expect(await page.evaluate(id=>S.takyLearningOutbox.some(e=>e.event_id===id),earlier.event_id))
    .toBe(true);
  await page.evaluate(()=>{
    window.__centralHttpCalls=0;
    HideSeekBridge.configureCentralEvidence({dbName:'hide-evidence-member-mismatch-v1',
      endpointUrl:'https://central.example.test/api/learning/evidence',
      sessionProvider:async()=>({authenticated:true,family_id:'F',selected_member_id:'B'}),
      tokenProvider:async()=> 'fixture-bearer-token-1234567890',
      fetchImpl:async()=>{window.__centralHttpCalls++;throw Error('SHOULD_NOT_SEND');}
    });
    HideSeekBridge.emitLearningMemorySignal({member_id:'A',subject:'english',
      concept_skill_target:'vocabulary',word:'mismatch'});
  });
  await expect.poll(()=>page.evaluate(()=>HideSeekBridge.centralEvidenceStatus().reason))
    .toBe('SPECIALIST_EVENT_MEMBER_SCOPE_MISMATCH');
  expect(await page.evaluate(()=>window.__centralHttpCalls)).toBe(0);
  await page.evaluate(()=>HideSeekBridge.emitLearningMemorySignal({
    member_id:'B',word:'missing-scope'
  }));
  expect(await page.evaluate(()=>HideSeekBridge.centralEvidenceStatus()))
    .toMatchObject({status:'HOLD',reason:'EXPLICIT_LEARNING_SCOPE_REQUIRED'});
  expect(await page.evaluate(()=>window.__centralHttpCalls)).toBe(0);
  await page.evaluate(()=>HideSeekBridge.closeCentralEvidence());
});

test('Browser IndexedDB serializes competing same-packet enqueue across two actual tabs',async({context,page})=>{
  const other=await context.newPage();
  await Promise.all([page.goto(URL),other.goto(URL)]);
  const enqueue=async p=>p.evaluate(async()=>{
    const pipeline=TakyCentralEvidence.pipeline.create({
      dbName:'hide-evidence-two-real-tabs-v1',
      indexedDB:globalThis.indexedDB,
      endpointUrl:'https://central.example.test/api/learning/evidence',
      sessionProvider:async()=>({authenticated:true,family_id:'F',selected_member_id:'A'}),
      tokenProvider:async()=> 'fixture-bearer-token-1234567890',
      fetchImpl:async()=>{throw Error('NOT_FLUSHING');}
    });
    const result=await pipeline.enqueueBridge('hide-seek',{
      source:'hide-seek',type:'LEARNING_MEMORY_SIGNAL',event_type:'LEARNING_MEMORY_SIGNAL',
      event_id:'same-real-browser-event',occurred_at:'2026-09-27T01:00:00Z',child_id:'A',
      payload:{member_id:'A',subject:'english',concept_skill_target:'vocabulary',
        observation_only:true,global_mastery_claim:false}
    });
    const rows=await pipeline.listActive('hide-seek');
    await pipeline.close();
    return {result,count:rows.length};
  });
  const [a,b]=await Promise.all([enqueue(page),enqueue(other)]);
  expect([a.result.queued,b.result.queued].sort()).toEqual([false,true]);
  expect([a.result.duplicate,b.result.duplicate].sort()).toEqual([false,true]);
  expect(a.count).toBe(1);
  expect(b.count).toBe(1);
  await other.close();
});
