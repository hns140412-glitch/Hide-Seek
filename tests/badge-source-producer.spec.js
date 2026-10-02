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
