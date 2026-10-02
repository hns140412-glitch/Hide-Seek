const {test,expect}=require('@playwright/test');

test('Hide badge source runtime stays observation-only and records verified retrace correction',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideBadgeSourceObservationV01)).toBe(true);
  const out=await page.evaluate(()=>{
    const state={badgeSourceObservations:[]};
    const observation=globalThis.HideBadgeSourceObservationV01.recordRetraceCorrection({
      state,
      sheetId:'sample',
      wordId:'w1',
      priorAttempt:{wordId:'w1',type:'WRONG',at:'2026-10-02T00:00:00.000Z'},
      currentAttempt:{wordId:'w1',type:'CORRECT',at:'2026-10-02T00:01:00.000Z'}
    });
    return {observation,count:state.badgeSourceObservations.length};
  });
  expect(out.count).toBe(1);
  expect(out.observation).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'HIDE_SEEK',
    event_family:'ERROR_CORRECTION',
    behavior_code:'ERROR_CORRECTED_COMPLETE',
    source_contract_id:'HIDE_RETRACE_CORRECTION_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false
  });
});


test('Hide explicit RETRACE review is observation-only and distinct from correction',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideBadgeSourceObservationV01)).toBe(true);
  const out=await page.evaluate(()=>{
    const state={badgeSourceObservations:[]};
    const review=globalThis.HideBadgeSourceObservationV01.recordErrorReview({
      state,sheetId:'sample',targetWordIds:['w1','w2'],at:'2026-10-02T00:00:30.000Z'
    });
    return {review,count:state.badgeSourceObservations.length};
  });
  expect(out.count).toBe(1);
  expect(out.review).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'HIDE_SEEK',
    event_family:'ERROR_DISCOVERY',
    behavior_code:'ERROR_REVIEW',
    source_contract_id:'HIDE_EXPLICIT_RETRACE_REVIEW_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      sheetId:'sample',
      targetWordIds:['w1','w2'],
      reviewMode:'RETRACE'
    }
  });
});


test('Hide correction courage requires explicit RETRACE review between wrong and corrected result',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideBadgeSourceObservationV01)).toBe(true);
  const out=await page.evaluate(()=>{
    const state={badgeSourceObservations:[]};
    const priorAttempt={wordId:'w1',type:'WRONG',at:'2026-10-02T00:00:00.000Z'};
    const review=globalThis.HideBadgeSourceObservationV01.recordErrorReview({
      state,sheetId:'sample',targetWordIds:['w1'],at:'2026-10-02T00:00:30.000Z'
    });
    const currentAttempt={wordId:'w1',type:'CORRECT',at:'2026-10-02T00:01:00.000Z'};
    Object.assign(priorAttempt,{sheetId:'sample',rejectedSelection:{target:'cat',position:0,selected:'b'}});
    Object.assign(currentAttempt,{sheetId:'sample',verificationBasis:'RETRIEVAL_EXACT_MATCH_V1',answerArtifact:{target:'cat',positions:[0],letters:['c']}});
    state.sheets=[{sheetId:'sample',items:[{id:'w1',eng:'cat'}]}];
    state.codeRed={history:[priorAttempt,currentAttempt]};
    const observation=globalThis.HideBadgeSourceObservationV01.recordCorrectionCourage({
      state,sheetId:'sample',wordId:'w1',priorAttempt,currentAttempt,reviewObservation:review
    });
    const missingReview=globalThis.HideBadgeSourceObservationV01.recordCorrectionCourage({
      state,sheetId:'sample',wordId:'w1',priorAttempt,currentAttempt,reviewObservation:null
    });
    return {observation,missingReview,count:state.badgeSourceObservations.length};
  });
  expect(out.missingReview).toBeNull();
  expect(out.count).toBe(2);
  expect(out.observation).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'HIDE_SEEK',
    event_family:'ERROR_CORRECTION',
    behavior_code:'CORRECTION_COURAGE',
    source_contract_id:'HIDE_RETRACE_CORRECTION_COURAGE_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      sheetId:'sample',
      wordId:'w1',
      priorResultType:'WRONG',
      correctedResultType:'CORRECT',
      interactionMode:'CORE'
    }
  });
});


test('Hide root cause producer requires a captured Code Red error artifact and explicit child explanation',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideBadgeSourceObservationV01)).toBe(true);
  const out=await page.evaluate(()=>{
    const errorAttempt={
      wordId:'w1',sheetId:'sample',type:'WRONG',at:'2026-10-02T00:00:00.000Z',
      rejectedSelection:{target:'cat',position:0,selected:'b'}
    };
    const state={
      sheets:[{sheetId:'sample',items:[{id:'w1',eng:'cat'}]}],
      badgeSourceObservations:[],
      codeRed:{history:[errorAttempt]}
    };
    const observation=globalThis.HideBadgeSourceObservationV01.recordRootCauseFound({
      state,sheetId:'sample',wordId:'w1',errorAttempt,
      causeText:'발음이 비슷해서 헷갈렸어요',
      causeActionRef:'hide-root-cause-action:sample:w1:1',
      at:'2026-10-02T00:00:30.000Z'
    });
    const noHistory=globalThis.HideBadgeSourceObservationV01.recordRootCauseFound({
      state:{...state,codeRed:{history:[]}},sheetId:'sample',wordId:'w1',errorAttempt,
      causeText:'헷갈렸어요',causeActionRef:'a'
    });
    return {observation,noHistory,count:state.badgeSourceObservations.length};
  });
  expect(out.noHistory).toBeNull();
  expect(out.count).toBe(1);
  expect(out.observation).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'HIDE_SEEK',
    event_family:'ERROR_ANALYSIS',
    behavior_code:'ROOT_CAUSE_FOUND',
    source_contract_id:'HIDE_ERROR_ARTIFACT_ROOT_CAUSE_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      sheetId:'sample',
      wordId:'w1',
      errorArtifactRef:'hide-code-result:sample:w1:2026-10-02T00:00:00.000Z:rejectedSelection',
      verificationBasis:'BOUND_TO_CAPTURED_CODE_RED_ERROR_ARTIFACT_V1',
      interactionMode:'CORE'
    }
  });
});


test('Hide persistent breakthrough requires explicit retrace between wrong and exact solve',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(()=>page.evaluate(()=>!!globalThis.HideBadgeSourceObservationV01)).toBe(true);
  const out=await page.evaluate(()=>{
    const priorAttempt={
      wordId:'w1',sheetId:'sample',type:'WRONG',at:'2026-10-02T00:00:00.000Z',
      rejectedSelection:{target:'cat',position:0,selected:'b'}
    };
    const currentAttempt={
      wordId:'w1',sheetId:'sample',type:'CORRECT',at:'2026-10-02T00:01:00.000Z',
      verificationBasis:'RETRIEVAL_EXACT_MATCH_V1',
      answerArtifact:{target:'cat',positions:[0],letters:['c']}
    };
    const state={
      sheets:[{sheetId:'sample',items:[{id:'w1',eng:'cat'}]}],
      badgeSourceObservations:[],
      codeRed:{history:[priorAttempt,currentAttempt]}
    };
    const review=globalThis.HideBadgeSourceObservationV01.recordErrorReview({
      state,sheetId:'sample',targetWordIds:['w1'],at:'2026-10-02T00:00:30.000Z'
    });
    const observation=globalThis.HideBadgeSourceObservationV01.recordPersistentBreakthrough({
      state,sheetId:'sample',wordId:'w1',priorAttempt,currentAttempt,reviewObservation:review
    });
    const noReview=globalThis.HideBadgeSourceObservationV01.recordPersistentBreakthrough({
      state,sheetId:'sample',wordId:'w1',priorAttempt,currentAttempt,reviewObservation:null
    });
    return {observation,noReview};
  });
  expect(out.noReview).toBeNull();
  expect(out.observation).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'HIDE_SEEK',
    event_family:'BREAKTHROUGH',
    behavior_code:'PERSISTENT_BREAKTHROUGH',
    source_contract_id:'HIDE_BLOCKED_CONTINUE_SOLVE_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      sheetId:'sample',
      wordId:'w1',
      verificationBasis:'RETRIEVAL_EXACT_MATCH_V1',
      interactionMode:'CORE'
    }
  });
});


test('Hide verified improvement intake persists source and fails closed before trusted transport is configured', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const comparison={
    contract_version:'TAKY_LEARNING_BADGE_IMPROVEMENT_COMPARISON_V1',
    authority:'LEARNING_VERIFICATION_RECEIPT_COMPARISON',
    comparison_id:'improvement:word:bridge:b1:b2',
    source_app:'hide-seek',learning_target_id:'word:bridge',
    prior_event_id:'b1',current_event_id:'b2',
    prior_receipt_id:'vr-b1',current_receipt_id:'vr-b2',
    prior_verified_outcome:0,current_verified_outcome:1,
    prior_child_action_ref:'hide-action:b1',current_child_action_ref:'hide-action:b2',
    verified_improvement:true,explicit_child_action:true
  };
  const pending=await page.evaluate(async cmp=>window.HideVerifiedImprovementIntakeV01.accept(cmp),comparison);
  expect(pending.status).toBe('PENDING_ENDPOINT');
  const saved=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_state'));
    const improvement=s.badgeSourceObservations.filter(x=>x.behavior_code==='IMPROVEMENT');
    const pendingRows=Object.values(s.badgeTransportPending||{});
    return {improvement,pendingRows};
  });
  expect(saved.improvement).toHaveLength(1);
  expect(saved.improvement[0]).toMatchObject({
    app_id:'HIDE_SEEK',event_family:'IMPROVEMENT',behavior_code:'IMPROVEMENT',
    source_contract_id:'HIDE_VERIFIED_SAME_TARGET_IMPROVEMENT_V1',
    explicit_child_action:true,badge_award_authorized:false
  });
  expect(saved.pendingRows).toHaveLength(1);
  expect(saved.pendingRows[0].status).toBe('PENDING_ENDPOINT');

  const blocked=await page.evaluate(async cmp=>window.HideVerifiedImprovementIntakeV01.accept(cmp,{endpoint:'/.netlify/functions/badge-observation'}),comparison);
  expect(blocked.status).toBe('PENDING_TRUSTED_TRANSPORT');
  expect(blocked.error).toContain('BADGE_SOURCE_IDENTITY_NOT_REGISTERED');
});
