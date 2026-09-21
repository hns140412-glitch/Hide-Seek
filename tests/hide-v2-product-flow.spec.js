const {test,expect}=require('@playwright/test');

test('Hide V2 boots without legacy app.js and completes a mission end-to-end',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,
      profile:{displayName:'V2 탐험가'},
      missions:[{
        id:'m1',title:'V2 영어 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        sourceCount:0,provenance:{source:'TEST_FIXTURE'},
        items:[{id:'w1',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',example:'Practice has many benefits.',languageDomain:'ENGLISH',learningContext:null,meaningMap:null,contextEvidence:null,soundEvidence:null,missionRole:'NEW',evidence:[],source:{pageId:'',rowIndex:0}}]
      }],
      activeMissionId:'m1',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await expect(page.getByText('Runtime V2')).toBeVisible();
  await expect(page.getByRole('heading',{name:'V2 영어 미션'})).toBeVisible();
  await page.getByRole('button',{name:'학습 시작'}).click();
  await expect(page.getByText('MEMORIZE',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();

  await expect(page.getByText('FIRST FIND',{exact:true})).toBeVisible();
  await page.getByLabel('회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'기억 확인'}).click();

  await expect(page.getByText('MEANING',{exact:true})).toBeVisible();
  await page.getByLabel('뜻 회상 입력').fill('혜택');
  await page.getByRole('button',{name:'뜻 확인'}).click();

  await expect(page.getByText('CONNECTION',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('FINAL SEEK',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();

  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  const word=state.missions[0].items[0];
  expect(word.evidence.some(x=>x.stage==='FIRST_FIND'&&x.objectiveRecall===true)).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='MEANING'&&x.objectiveRecall===true)).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='FINAL_SEEK'&&x.evidenceMode==='RECONSTRUCTION'&&x.objectiveRecall===true)).toBeTruthy();
  expect(state.missions[0].memorySummary.authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
});

test('Hide V2 Korean response stays production evidence, not recall inflation',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'국어 V2'},missions:[{
        id:'m-ko',title:'국어 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'ko1',lexicalId:'불가피::피할 수 없음',token:'불가피',meaning:'피할 수 없음',example:'일정 변경이 불가피했다.',languageDomain:'KOREAN',learningContext:null,meaningMap:null,contextEvidence:null,soundEvidence:null,missionRole:'NEW',evidence:[],source:{pageId:'',rowIndex:0}}],
        sourceCount:0,provenance:{source:'TEST_FIXTURE'}
      }],activeMissionId:'m-ko',events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'학습 시작'}).click();
  await expect(page.getByText('MEMORIZE',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('피할 수 없음');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await expect(page.getByText('RESPONSE TRAIL',{exact:true})).toBeVisible();
  await page.locator('#v2Response').fill('비 때문에 일정 변경은 불가피했다.');
  await page.getByRole('button',{name:'표현 남기기'}).click();
  await expect(page.getByText('FINAL SEEK',{exact:true})).toBeVisible();
  const ev=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='RESPONSE_TRAIL');
  });
  expect(ev.evidenceMode).toBe('PRODUCTION');
  expect(ev.objectiveVerified).toBe(false);
  expect(ev.objectiveRecall).toBe(false);
});

test('Hide V2 OCR path uses the shared family adapter and commits reviewed rows',async({page})=>{
  await page.route('**/api/capture/analyze',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[{eng:'environment',kor:'환경',confidence:'high',evidence_item_id:null,warnings:[],mission_role:'NEW'}]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles({name:'words.jpg',mimeType:'image/jpeg',buffer:Buffer.from('v2-image')});
  await expect(page.getByRole('heading',{name:'분석 결과 확인'})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 1')).toHaveValue('environment');
  await page.getByRole('button',{name:'미션으로 저장'}).click();
  await expect(page.getByRole('heading',{name:'탐험 미션'})).toBeVisible();
  await expect(page.getByText(/1개 · READY/)).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions).toHaveLength(1);
  expect(state.missions[0].items[0].token).toBe('environment');
});

test('Hide V2 persists OCR review state across reload',async({page})=>{
  await page.route('**/api/capture/analyze',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[{eng:'island',kor:'섬',confidence:'high',warnings:[],mission_role:'NEW'}]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles({name:'island.jpg',mimeType:'image/jpeg',buffer:Buffer.from('persistent-v2-image')});
  await expect(page.getByRole('heading',{name:'분석 결과 확인'})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 1')).toHaveValue('island');

  await page.reload();
  await expect(page.getByRole('heading',{name:'분석 결과가 남아 있어요'})).toBeVisible();
  await page.getByRole('button',{name:'분석 결과 이어보기'}).click();
  await expect(page.getByRole('heading',{name:'분석 결과 확인'})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 1')).toHaveValue('island');

  const capture=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).captureSession);
  expect(capture.status).toBe('REVIEW');
  expect(capture.pages).toHaveLength(1);
  expect(capture.lastRows[0].eng).toBe('island');
});

test('Hide V2 migrates V1 mission and memory traces without deleting legacy state',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_state',JSON.stringify({
      profile:{displayName:'기존 탐험가'},
      activeSheetId:'legacy-sheet',
      sheets:[{
        sheetId:'legacy-sheet',title:'기존 미션',status:'LEARNING',createdAt:'2026-09-20T00:00:00.000Z',
        items:[{
          id:'legacy-word',eng:'benefit',kor:'혜택',missionRole:'REVIEW',sourcePageId:'legacy-page',sourceRowIndex:0,
          learningStats:{
            retrievalTrace:[{stage:'FIRST_FIND',result:'WRONG',objectiveRecall:true}],
            recoveryTrace:[{result:'UNASSISTED_RECALL',objectiveRecall:true,spacedEvidence:true}]
          }
        }]
      }]
    }));
  });
  await page.goto('/v2.html');
  await expect(page.getByRole('heading',{name:'기존 미션'})).toBeVisible();
  const state=await page.evaluate(()=>({
    legacy:JSON.parse(localStorage.getItem('hide_seek_state')),
    v2:JSON.parse(localStorage.getItem('hide_seek_v2_state'))
  }));
  expect(state.legacy.sheets).toHaveLength(1);
  expect(state.v2.missions).toHaveLength(1);
  expect(state.v2.missions[0].items[0].missionRole).toBe('REVIEW');
  expect(state.v2.missions[0].items[0].evidence.some(x=>x.migratedFrom==='V1'&&x.legacyTraceKind==='RETRIEVAL')).toBeTruthy();
  expect(state.v2.events.some(x=>x.type==='V1_DATA_MIGRATED')).toBeTruthy();
});

test('Hide V2 obeys Ready Planner review directive and limits the session to directed lexical ids',async({page})=>{
  const directive={
    authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',
    scheduleOwner:'READY_SET_PLANNER',
    lexicalIds:['second::둘째'],
    directiveId:'directive-1',
    taskId:'task-review-1',
    scheduledDate:'2026-09-22'
  };
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'리뷰 V2'},missions:[{
        id:'m-review',title:'지정 복습',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[
          {id:'w-first',lexicalId:'first::첫째',token:'first',meaning:'첫째',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[],source:{}},
          {id:'w-second',lexicalId:'second::둘째',token:'second',meaning:'둘째',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[],source:{}}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-review',events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html?session_id=s1&task_id=task-review-1&review_directive='+encodeURIComponent(JSON.stringify(directive)));
  await page.getByRole('button',{name:'학습 시작'}).click();
  await expect(page.getByText('둘째',{exact:true})).toBeVisible();
  await expect(page.getByText('첫째',{exact:true})).toHaveCount(0);
  await page.getByLabel('회상 답 입력').fill('second');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('둘째');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('FINAL SEEK',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('second');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();
  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const result=await page.evaluate(()=>window.HideV2ReadyBridge.buildResult());
  expect(result.reviewDirective.lexicalIds).toEqual(['second::둘째']);
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions[0].items[0].evidence).toHaveLength(0);
  expect(state.missions[0].items[1].evidence.length).toBeGreaterThan(0);
  expect(state.events.some(x=>x.event_type==='TASK_COMPLETED')).toBeTruthy();
});

test('Hide V2 resumes a persisted learning session after reload',async({page})=>{
  await page.addInitScript(()=>{
    if(localStorage.getItem('hide_seek_v2_state'))return;
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'재개 탐험가'},missions:[{
        id:'m-resume',title:'재개 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-resume',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',example:'',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-resume',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'학습 시작'}).click();
  await expect(page.getByText('MEMORIZE',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await expect(page.getByText('MEANING',{exact:true})).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button',{name:'학습 이어하기'})).toBeVisible();
  await page.getByRole('button',{name:'학습 이어하기'}).click();
  await expect(page.getByText('MEANING',{exact:true})).toBeVisible();
  const stage=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).activeSession.stage);
  expect(stage).toBe('MEANING');
});

test('Hide V2 mission lifecycle supports selection rename archive and blocks active-session delete',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'미션관리'},missions:[
        {id:'m-a',title:'첫 미션',status:'READY',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',items:[{id:'a1',lexicalId:'a::에이',token:'a',meaning:'에이',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],sourceCount:0,provenance:{}},
        {id:'m-b',title:'둘 미션',status:'READY',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T02:00:00.000Z',items:[{id:'b1',lexicalId:'b::비',token:'b',meaning:'비',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],sourceCount:0,provenance:{}}
      ],activeMissionId:'m-a',activeSession:{id:'s1',missionId:'m-a',index:0,queue:['a1'],stage:'FIRST_FIND',startedAt:new Date().toISOString(),completedAt:null,attempts:{}},events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'미션 관리'}).click();
  await expect(page.getByRole('heading',{name:'탐험 미션'})).toBeVisible();

  page.once('dialog',async d=>{expect(d.type()).toBe('prompt');await d.accept('둘 미션 수정')});
  await page.locator('[data-action="rename"][data-id="m-b"]').click();
  await expect(page.getByText('둘 미션 수정',{exact:true})).toBeVisible();

  await page.locator('[data-action="open"][data-id="m-b"]').click();
  await expect(page.getByRole('heading',{name:'둘 미션 수정'})).toBeVisible();

  await page.getByRole('button',{name:'미션 관리'}).click();
  page.once('dialog',async d=>{expect(d.type()).toBe('confirm');await d.accept()});
  await page.locator('[data-action="delete"][data-id="m-a"]').click();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions.some(x=>x.id==='m-a')).toBeTruthy();
  expect(state.activeSession.missionId).toBe('m-a');
});

test('Hide V2 OCR review allows row correction and exclusion before commit',async({page})=>{
  await page.route('**/api/capture/analyze',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[
          {eng:'enviroment',kor:'환경',confidence:'medium',warnings:['SPELLING'],mission_role:'NEW'},
          {eng:'noise',kor:'소음',confidence:'high',warnings:[],mission_role:'NEW'}
        ]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles({name:'review.jpg',mimeType:'image/jpeg',buffer:Buffer.from('review-edit-image')});
  await expect(page.getByRole('heading',{name:'분석 결과 확인'})).toBeVisible();

  await page.getByLabel('OCR 단어 1').fill('environment');
  await page.locator('[data-review-toggle="1"]').click();
  await page.getByRole('button',{name:'미션으로 저장'}).click();

  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  expect(state.missions).toHaveLength(1);
  expect(state.missions[0].items).toHaveLength(1);
  expect(state.missions[0].items[0].token).toBe('environment');
  expect(state.missions[0].items[0].lexicalId.startsWith('environment::')).toBeTruthy();
});


test('Hide V2 Memory Ladder projects weakness reasons and wordbook from evidence',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'기억기록'},missions:[{
        id:'m-memory',title:'기억 미션',status:'COMPLETED',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',
        items:[
          {id:'w-weak',lexicalId:'benefit::혜택',token:'benefit',meaning:'혜택',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false},
            {stage:'MEANING',evidenceMode:'RECALL',axes:['MEANING','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false}
          ]},
          {id:'w-stable',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true},
            {stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL','WRITE_OR_RECONSTRUCT'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true}
          ]}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-memory',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'기억 기록'}).click();
  await expect(page.getByRole('heading',{name:'기억 기록'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'단어장'})).toBeVisible();
  await expect(page.getByText('benefit',{exact:true})).toBeVisible();
  await expect(page.getByText('island',{exact:true})).toBeVisible();
  await expect(page.getByText('무힌트 재회상 필요',{exact:true})).toBeVisible();

  const projected=await page.evaluate(()=>({
    book:window.HideV2Memory.wordbook(),
    dash:window.HideV2Memory.dashboard()
  }));
  const weak=projected.book.find(x=>x.token==='benefit');
  const stable=projected.book.find(x=>x.token==='island');
  expect(weak.memoryStrength).toBeLessThan(stable.memoryStrength);
  expect(weak.nextReviewPriority).toBeGreaterThan(stable.nextReviewPriority);
  expect(weak.memorySignature.semanticWeakness).toBeGreaterThan(0);
  expect(weak.memorySignature.recoveryStatus).toBe('NEEDS_UNASSISTED_RECALL');
  expect(stable.memorySignature.recoveryStatus).toBe('SPACED_RECOVERED');
  expect(projected.dash.total).toBe(2);
});

test('Hide V2 wordbook merges repeated lexical encounters across missions',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'누적기억'},missions:[
        {id:'m1',title:'첫날',status:'COMPLETED',createdAt:'2026-09-20T00:00:00.000Z',updatedAt:'2026-09-20T01:00:00.000Z',items:[
          {id:'w1',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'NEW',source:{},evidence:[
            {stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false}
          ]}
        ],sourceCount:0,provenance:{}},
        {id:'m2',title:'둘째날',status:'COMPLETED',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',items:[
          {id:'w2',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
            {stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true}
          ]}
        ],sourceCount:0,provenance:{}}
      ],activeMissionId:'m2',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'기억 기록'}).click();
  const planet=await page.evaluate(()=>window.HideV2Memory.wordbook().find(x=>x.token==='planet'));
  expect(planet.encounters).toBe(2);
  expect(planet.missions).toHaveLength(2);
  expect(planet.memorySignature.traceCounts.spaced).toBe(1);
  expect(planet.memorySignature.recoveryStatus).toBe('SPACED_RECOVERED');
});
