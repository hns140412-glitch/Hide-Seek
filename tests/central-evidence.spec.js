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


test('Authenticated Learning Engine vocabulary policy is consumed without local authority',async({page})=>{
  await page.goto(URL+'?child_id=A&subject=english&concept_skill_target=vocabulary');
  const result=await page.evaluate(async()=>{
    window.__decisionCalls=[];
    let malformed=false;
    HideSeekBridge.configureCentralEvidence({
      dbName:'hide-policy-consumer-v1',
      endpointUrl:'https://central.example.test/api/learning/evidence',
      decisionEndpointUrl:'https://central.example.test/api/learning/decision',
      sessionProvider:async()=>({authenticated:true,family_id:'F',selected_member_id:'A'}),
      tokenProvider:async()=> 'fixture-bearer-token-1234567890',
      fetchImpl:async(url,opts)=>{
        if(String(url).includes('/decision')){
          const input=JSON.parse(opts.body);
          window.__decisionCalls.push({url,credentials:opts.credentials,input});
          if(malformed)return {status:200,json:async()=>({ok:true,authenticated_server_response:true,
            receipt_scope:{family_id:'F',member_id:'A'},runtime_result:{specialist_policy:{
              hide_seek_vocabulary:{authority:'BROWSER_FORGED_POLICY'}}}})};
          return {status:200,json:async()=>({ok:true,authenticated_server_response:true,
            receipt_scope:{family_id:'F',member_id:'A'},runtime_result:{
              specialist_policy:{hide_seek_vocabulary:{
                ok:true,version:'TAKY_HIDE_VOCABULARY_ROUTING_POLICY_V1',
                authority:'LEARNING_ENGINE_SPECIALIST_POLICY_INTENT_ONLY',
                word_policies:[
                  {learning_target_id:'new-1',origin:'CURRENT',recommended_mode:'RECALL',
                   memory_state:'RECENT_UNASSISTED_SUCCESS',priority:'MEDIUM',
                   delayed_recall:{kind:'AFTER_INTERVENING_ITEMS',min_intervening_items:3,max_intervening_items:5}},
                  {learning_target_id:'past-1',origin:'PAST',recommended_mode:'RECALL',
                   memory_state:'SPACED_UNASSISTED_STABLE',priority:'LOW',delayed_recall:null}
                ],
                past_word_mix:{past_word_share:0.75,current_word_share:0.25,
                  baseline_past_word_share:2/3,current_words_mandatory:true},
                delayed_recall_queue:[{learning_target_id:'new-1',origin:'CURRENT',
                  priority:'MEDIUM',recommended_mode:'RECALL',kind:'AFTER_INTERVENING_ITEMS',
                  min_intervening_items:3,max_intervening_items:5}],
                guards:{current_words_never_dropped:true,ratio_is_prompt_mix_not_assignment_mutation:true,
                  delayed_recall_has_no_calendar_date:true,planner_owns_dated_allocation:true,
                  hide_executes_interaction_only:true,no_mastery_claim:true}
              }},
              growth_next_step:{
                ok:true,version:'TAKY_GROWTH_NEXT_STEP_POLICY_V1',
                authority:'LEARNING_ENGINE_GROWTH_INTENT_ONLY',
                support_phase:'ELICIT_PULL',
                question_depth:{level:3},
                language_support:{
                  easy_english_definitions:['to say yes to something or receive it'],
                  expression_chunks:['accept an idea'],
                  grammar_patterns:['accept + noun']
                },
                hide_to_snap_handoff:{
                  eligible:true,to_app:'snap-pop',
                  task_intent:'USE_IN_OWN_SHORT_SENTENCE_OR_SPEECH',
                  support_phase:'ELICIT_PULL',
                  prompt_language:'ENGLISH_FIRST_KOREAN_FALLBACK',
                  material:{expression_chunks:['accept an idea'],grammar_patterns:['accept + noun']},
                  child_authorship_required:true,
                  final_answer_generation_forbidden:true
                },
                guards:{engine_guides_growth_not_answers:true}
              }
            }})};
        }
        throw Error('EVIDENCE_ENDPOINT_SHOULD_NOT_BE_CALLED_FOR_POLICY_READ');
      }
    });
    const accepted=await HideSeekBridge.requestLearningVocabularyPolicy({
      current_word_ids:['new-1'],past_word_ids:['past-1','past-2']
    });
    const options=HideSeekBridge.composeTraceOptions(
      {id:'new-1',eng:'accept',kor:'받아들이다'},
      [{id:'new-1',eng:'accept',kor:'받아들이다'},{id:'new-2',eng:'allow',kor:'허용하다'}],
      [{id:'past-1',eng:'except',kor:'제외하고'},{id:'past-2',eng:'expect',kor:'기대하다'}],4
    );
    const route=HideSeekBridge.nextAdaptiveLearningRoute();
    const delayed=HideSeekBridge.delayedRecallQueue();
    const growth=HideSeekBridge.getLearningGrowthDecision();
    malformed=true;
    const rejected=await HideSeekBridge.requestLearningVocabularyPolicy({
      current_word_ids:['new-1'],past_word_ids:['past-1']
    });
    const status=HideSeekBridge.vocabularyPolicyStatus();
    await HideSeekBridge.closeCentralEvidence();
    return {accepted,options:options.map(x=>x.id),route,delayed,growth,rejected,status,calls:window.__decisionCalls};
  });
  expect(result.accepted.ok).toBe(true);
  expect(result.calls[0].credentials).toBe('omit');
  expect(result.calls[0].input.hide_vocabulary_context).toEqual({
    current_word_ids:['new-1'],past_word_ids:['past-1','past-2']
  });
  expect(result.options).toContain('new-1');
  expect(result.options.filter(x=>x.startsWith('past-'))).toHaveLength(2);
  expect(result.route).toMatchObject({learning_target_id:'new-1',recommended_mode:'RECALL'});
  expect(result.delayed[0]).toMatchObject({learning_target_id:'new-1',kind:'AFTER_INTERVENING_ITEMS'});
  expect(result.growth).toMatchObject({authority:'LEARNING_ENGINE_GROWTH_INTENT_ONLY',support_phase:'ELICIT_PULL'});
  expect(result.growth.hide_to_snap_handoff.final_answer_generation_forbidden).toBe(true);
  expect(result.rejected).toEqual({ok:false,reason:'CENTRAL_HIDE_POLICY_INVALID'});
  expect(result.status).toMatchObject({status:'HOLD',reason:'CENTRAL_HIDE_POLICY_INVALID',policy:null});
});


test('Hide -> Snap navigation carries only continuity scope and learning target, not growth authority',async({page})=>{
  const snap='https://snap.example.test/';
  const ready='https://ready.example.test/';
  const p=new URLSearchParams({
    session_id:'S1',goal_id:'G1',task_id:'T1',lap_id:'L1',
    return_target:ready,snap_target:snap,child_id:'A',
    subject:'english',concept_skill_target:'vocabulary',
    learning_target_id:'word:accept'
  });
  await page.goto(URL+'?'+p.toString());
  await page.route('https://snap.example.test/**',route=>route.abort());
  const outbound=page.waitForRequest(r=>r.url().startsWith(snap));
  await page.evaluate(()=>HideSeekBridge.sendToSnap('accept','new context','word:accept'));
  const u=new URL((await outbound).url());
  expect(u.searchParams.get('from_app')).toBe('hide-seek');
  expect(u.searchParams.get('session_id')).toBe('S1');
  expect(u.searchParams.get('return_target')).toBe(ready);
  expect(u.searchParams.get('child_id')).toBe('A');
  expect(u.searchParams.get('subject')).toBe('english');
  expect(u.searchParams.get('concept_skill_target')).toBe('vocabulary');
  expect(u.searchParams.get('learning_target_id')).toBe('word:accept');
  expect(u.searchParams.get('word')).toBe('accept');
  expect(u.searchParams.has('support_phase')).toBe(false);
  expect(u.searchParams.has('question_depth')).toBe(false);
  expect(u.searchParams.has('expression_chunk')).toBe(false);
  expect(u.searchParams.has('grammar_pattern')).toBe(false);
});
