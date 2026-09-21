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
  await expect(page.locator('.brand-copy small')).toHaveText('숨은 단어 탐험');
  await expect(page.getByRole('heading',{name:'V2 영어 미션'})).toBeVisible();
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();

  await expect(page.getByText('첫 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'기억 확인'}).click();

  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();
  await page.getByLabel('뜻 회상 입력').fill('혜택');
  await page.getByRole('button',{name:'뜻 확인'}).click();

  await expect(page.getByText('연결 길',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
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
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('피할 수 없음');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await expect(page.getByText('표현 길',{exact:true})).toBeVisible();
  await page.locator('#v2Response').fill('비 때문에 일정 변경은 불가피했다.');
  await page.getByRole('button',{name:'표현 남기기'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
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
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('둘째',{exact:true})).toBeVisible();
  await expect(page.getByText('첫째',{exact:true})).toHaveCount(0);
  await page.getByLabel('회상 답 입력').fill('second');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('둘째');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();
  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('second');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();
  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const result=await page.evaluate(()=>window.HideV2ReadyBridge.buildResult());
  expect(result.resultContract).toBe('HIDE_SPECIALIST_RESULT_V2');
  expect(result.runtime).toBe('V2');
  expect(result.activeMissionId).toBe('m-review');
  expect(result.missionStatus).toBe('PARTIAL');
  expect(result.taskState).toBe('COMPLETED');
  expect(result.learningPhase).toBe('COMPLETE');
  expect(result.trailMastery).toBe(100);
  expect(result.trailSummary.fullMissionScope).toBe(false);
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
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('benefit');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button',{name:'탐험 이어가기'})).toBeVisible();
  await page.getByRole('button',{name:'탐험 이어가기'}).click();
  await expect(page.getByText('뜻 단서',{exact:true})).toBeVisible();
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
  await page.getByRole('button',{name:'탐험 미션'}).click();
  await expect(page.getByRole('heading',{name:'탐험 미션'})).toBeVisible();

  page.once('dialog',async d=>{expect(d.type()).toBe('prompt');await d.accept('둘 미션 수정')});
  await page.locator('[data-action="rename"][data-id="m-b"]').click();
  await expect(page.getByText('둘 미션 수정',{exact:true})).toBeVisible();

  await page.locator('[data-action="open"][data-id="m-b"]').click();
  await expect(page.getByRole('heading',{name:'둘 미션 수정'})).toBeVisible();

  await page.getByRole('button',{name:'탐험 미션'}).click();
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
  await page.getByRole('button',{name:'기억 사다리'}).click();
  await expect(page.getByRole('heading',{name:'기억 사다리'})).toBeVisible();
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
  await page.getByRole('button',{name:'기억 사다리'}).click();
  const planet=await page.evaluate(()=>window.HideV2Memory.wordbook().find(x=>x.token==='planet'));
  expect(planet.encounters).toBe(2);
  expect(planet.missions).toHaveLength(2);
  expect(planet.memorySignature.traceCounts.spaced).toBe(1);
  expect(planet.memorySignature.recoveryStatus).toBe('SPACED_RECOVERED');
});


test('Hide V2 English memorization uses thinking trail before reveal without recall inflation',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'영어추론'},missions:[{
        id:'m-think',title:'영어 구조 탐험',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-think',lexicalId:'earthquake::지진',token:'earthquake',meaning:'지진',example:'An earthquake shook the city.',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{},meaningMap:null}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-think',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('THINKING TRAIL',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'구조·장면 단서 보기'})).toBeDisabled();
  await page.locator('.inference-prediction').fill('땅이 흔들리는 것');
  await page.locator('.inference-clue').selectOption('WORD_PART');
  await page.locator('.inference-confidence').selectOption('HIGH');
  await page.getByRole('button',{name:'내 추론 남기기'}).click();
  await expect(page.getByRole('button',{name:'구조·장면 단서 보기'})).toBeEnabled();
  await page.getByRole('button',{name:'구조·장면 단서 보기'}).click();
  await expect(page.getByText(/earth \+ quake/).first()).toBeVisible();
  await expect(page.getByText(/땅의 흔들림/).first()).toBeVisible();

  const ev=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return s.missions[0].items[0].evidence.find(x=>x.stage==='THINKING_TRAIL');
  });
  expect(ev.evidenceMode).toBe('INFERENCE_SELF_REPORT');
  expect(ev.objectiveVerified).toBe(false);
  expect(ev.objectiveRecall).toBe(false);
  expect(ev.confidence).toBe('HIGH');
});

test('Hide V2 memory detail exposes evidence trail behind strength and priority',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'상세기록'},missions:[{
        id:'m-detail',title:'상세 기록 미션',status:'COMPLETED',createdAt:'2026-09-21T00:00:00.000Z',updatedAt:'2026-09-21T01:00:00.000Z',
        items:[{id:'w-detail',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
          {at:'2026-09-21T01:00:00.000Z',stage:'FIRST_FIND',evidenceMode:'RECALL',axes:['FORM','RECALL'],result:'WRONG',objectiveVerified:true,objectiveRecall:true,assisted:false},
          {at:'2026-09-21T01:05:00.000Z',stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:false}
        ]}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-detail',activeSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'기억 사다리'}).click();
  await page.locator('[data-word-detail]').click();
  await expect(page.getByText('기억 자세히',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'planet'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'기억 흔적'})).toBeVisible();
  await expect(page.getByText('첫 찾기',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('마지막 찾기',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('IMMEDIATE_ONLY',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'기록으로'}).click();
  await expect(page.getByRole('heading',{name:'기억 사다리'})).toBeVisible();
});


test('Hide V2 registers its isolated service worker and can reopen cached shell offline',async({page,context})=>{
  await page.goto('/v2.html');
  await page.waitForFunction(()=>navigator.serviceWorker?.ready);
  const reg=await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.ready;
    return {scriptURL:r.active?.scriptURL||'',scope:r.scope};
  });
  expect(reg.scriptURL).toContain('/sw-v2.js');

  const manifest=await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifest).toBe('./manifest-v2.json');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.brand-copy small')).toHaveText('숨은 단어 탐험');
  await expect(page.getByRole('button',{name:'탐험 미션'})).toBeVisible();
  await context.setOffline(false);
});

test('Hide V2 PWA safe point blocks update activation during active learning or OCR review',async({page})=>{
  await page.addInitScript(()=>{
    if(localStorage.getItem('hide_seek_v2_state'))return;
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'PWA'},missions:[{
        id:'m-pwa',title:'PWA 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-pwa',
      activeSession:{id:'s1',missionId:'m-pwa',index:0,queue:['w1'],stage:'FIRST_FIND',startedAt:new Date().toISOString(),completedAt:null,attempts:{}},
      captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  expect(await page.evaluate(()=>window.HideV2Pwa.safePoint())).toBe(false);

  await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    s.activeSession=null;
    s.captureSession={id:'c1',status:'REVIEW',pages:[],lastRows:[{eng:'island',kor:'섬'}],analysisBatches:[]};
    localStorage.setItem('hide_seek_v2_state',JSON.stringify(s));
  });
  await page.reload();
  expect(await page.evaluate(()=>window.HideV2Pwa.safePoint())).toBe(false);

  await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    s.captureSession={...s.captureSession,status:'COMMITTED'};
    localStorage.setItem('hide_seek_v2_state',JSON.stringify(s));
  });
  await page.reload();
  expect(await page.evaluate(()=>window.HideV2Pwa.safePoint())).toBe(true);
});


test('Hide V2 retries only failed OCR pages and preserves successful page rows',async({page})=>{
  let calls=0;
  await page.route('**/api/capture/analyze',async route=>{
    calls++;
    if(calls===1){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
        result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
          rows:[{eng:'environment',kor:'환경',confidence:'high',warnings:[],mission_role:'NEW'}]}
      })});
      return;
    }
    if(calls===2){
      await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,reason:'TEMPORARY_PROVIDER_FAILURE'})});
      return;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,provider:'FIXTURE_VISION',model:'v2-fixture',analysis_domain:'HIDE_VOCABULARY',
      result:{analysis_domain:'HIDE_VOCABULARY',analysis_version:'HIDE_VOCABULARY_OCR_V1',
        rows:[{eng:'island',kor:'섬',confidence:'medium',warnings:['CHECK_PRINT'],mission_role:'NEW'}]}
    })});
  });
  await page.goto('/v2.html');
  await page.locator('#sheetLibraryInput').setInputFiles([
    {name:'page-1.jpg',mimeType:'image/jpeg',buffer:Buffer.from('page-one')},
    {name:'page-2.jpg',mimeType:'image/jpeg',buffer:Buffer.from('page-two')}
  ]);
  await expect(page.getByRole('heading',{name:'분석하지 못했어요'})).toBeVisible();
  await expect(page.getByText(/1개 결과는 보존/)).toBeVisible();

  let capture=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).captureSession);
  expect(capture.pages[0].status).toBe('ANALYZED');
  expect(capture.pages[0].analysisRows[0].eng).toBe('environment');
  expect(capture.pages[1].status).toBe('FAILED');

  await page.getByRole('button',{name:'실패한 페이지만 다시 분석'}).click();
  await expect(page.getByRole('heading',{name:'분석 결과 확인'})).toBeVisible();
  await expect(page.getByLabel('OCR 단어 1')).toHaveValue('environment');
  await expect(page.getByLabel('OCR 단어 2')).toHaveValue('island');
  await expect(page.getByText(/CHECK_PRINT/)).toBeVisible();
  expect(calls).toBe(3);

  capture=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')).captureSession);
  expect(capture.status).toBe('REVIEW');
  expect(capture.pages.every(x=>x.status==='ANALYZED')).toBeTruthy();
  expect(capture.lastRows).toHaveLength(2);
});

test('Hide V2 390x844 primary surfaces have no horizontal overflow and touch targets are usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'모바일'},missions:[{
        id:'m-mobile',title:'모바일 미션',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-mobile',lexicalId:'environment::환경',token:'environment',meaning:'환경',languageDomain:'ENGLISH',missionRole:'NEW',example:'Protect the environment.',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-mobile',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  const homeMetrics=await page.evaluate(()=>({
    innerWidth:window.innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    buttons:[...document.querySelectorAll('button:not([hidden])')].map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,right:x.getBoundingClientRect().right,left:x.getBoundingClientRect().left}))
  }));
  expect(homeMetrics.scrollWidth).toBeLessThanOrEqual(homeMetrics.innerWidth+1);
  expect(homeMetrics.buttons.every(x=>x.h>=44&&x.left>=-1&&x.right<=391)).toBeTruthy();

  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.getByText('단어 만나기',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);

  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  const input=page.getByLabel('회상 답 입력');
  await input.focus();
  await page.setViewportSize({width:390,height:520});
  await page.waitForTimeout(150);
  const focused=await input.boundingBox();
  expect(focused).not.toBeNull();
  expect(focused.x).toBeGreaterThanOrEqual(0);
  expect(focused.x+focused.width).toBeLessThanOrEqual(390);
  expect(focused.y+focused.height).toBeLessThanOrEqual(520);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});

test('Hide V2 mobile Korean response keeps textarea and action visible in reduced visual height',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'모바일국어'},missions:[{
        id:'m-mobile-ko',title:'모바일 국어',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'ko-mobile',lexicalId:'불가피::피할 수 없음',token:'불가피',meaning:'피할 수 없음',languageDomain:'KOREAN',missionRole:'NEW',example:'일정 변경이 불가피했다.',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-mobile-ko',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('불가피');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('피할 수 없음');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await expect(page.getByText('표현 길',{exact:true})).toBeVisible();

  const textarea=page.getByLabel('국어 문장 표현');
  await textarea.focus();
  await page.setViewportSize({width:390,height:520});
  await page.waitForTimeout(150);
  const box=await textarea.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(390);
  expect(box.y+box.height).toBeLessThanOrEqual(520);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});


test('Hide V2 returnToReady emits a V2 learning_event envelope with exact task context',async({page})=>{
  const directive={
    authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',
    scheduleOwner:'READY_SET_PLANNER',
    lexicalIds:['second::둘째'],
    directiveId:'directive-return-1',
    taskId:'task-return-1',
    scheduledDate:'2026-09-22'
  };
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'왕복'},missions:[{
        id:'m-return',title:'왕복 미션',status:'COMPLETED',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w-return',lexicalId:'second::둘째',token:'second',meaning:'둘째',languageDomain:'ENGLISH',missionRole:'REVIEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-return',activeSession:{id:'s-hide',missionId:'m-return',index:0,queue:['w-return'],stage:'COMPLETE',startedAt:new Date().toISOString(),completedAt:new Date().toISOString(),attempts:{}},captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html?session_id=ready-session-1&goal_id=goal-1&task_id=task-return-1&lap_id=lap-1&return_target='+encodeURIComponent('http://127.0.0.1:4174/ready-return')+'&review_directive='+encodeURIComponent(JSON.stringify(directive)));

  const observed=await page.evaluate(()=>{
    const original=window.location.assign;
    let assigned=null;
    Object.defineProperty(window.location,'assign',{configurable:true,value:url=>{assigned=String(url)}});
    const out=window.HideV2ReadyBridge.returnToReady();
    return {out,assigned};
  }).catch(async()=>{
    return await page.evaluate(()=>{
      const event=window.HideV2ReadyBridge.emitTaskEvent('TASK_COMPLETED');
      const payload=window.HideV2ReadyBridge.buildResult();
      return {event,payload};
    });
  });

  const payload=observed.payload||observed.out?.event?.payload||observed.event?.payload;
  const event=observed.event||observed.out?.event;
  expect(event.event_type).toBe('TASK_COMPLETED');
  expect(event.source).toBe('hide-seek');
  expect(payload.resultContract).toBe('HIDE_SPECIALIST_RESULT_V2');
  expect(payload.taskContext.session_id).toBe('ready-session-1');
  expect(payload.taskContext.task_id).toBe('task-return-1');
  expect(payload.taskContext.lap_id).toBe('lap-1');
  expect(payload.taskState).toBe('COMPLETED');
});


test('Hide V2 child-facing shell uses exploration language and hides runtime jargon',async({page})=>{
  await page.goto('/v2.html');
  await expect(page.locator('.brand-copy small')).toHaveText('숨은 단어 탐험');
  await expect(page.getByText('탐험 준비',{exact:true})).toBeVisible();
  for(const forbidden of ['Runtime V2','HIDE V2','REWRITE','monolith-free','구조 분리형 런타임']){
    await expect(page.getByText(forbidden,{exact:true})).toHaveCount(0);
  }
  const manifest=await page.evaluate(async()=>{
    const href=document.querySelector('link[rel="manifest"]').getAttribute('href');
    return await fetch(href).then(r=>r.json());
  });
  expect(manifest.name).toBe('Hide & Seek');
  expect(manifest.description).not.toContain('V2');
});


test('Hide V2 wrong final seek enters relearn and seek-again before completing',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'다시찾기'},missions:[{
        id:'m-seek-again',title:'다시 찾기 미션',status:'READY',
        createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',example:'The island is small.',evidence:[],source:{}}],
        sourceCount:0,provenance:{}
      }],activeMissionId:'m-seek-again',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await page.getByLabel('회상 답 입력').fill('island');
  await page.getByRole('button',{name:'기억 확인'}).click();
  await page.getByLabel('뜻 회상 입력').fill('섬');
  await page.getByRole('button',{name:'뜻 확인'}).click();
  await page.getByRole('button',{name:'다음'}).click();

  await expect(page.getByText('마지막 찾기',{exact:true})).toBeVisible();
  await page.getByLabel('최종 회상 답 입력').fill('wrong');
  await page.getByRole('button',{name:'마지막 기억 확인'}).click();

  await expect(page.getByText('다시 만나기',{exact:true})).toBeVisible();
  await expect(page.getByText('island',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'다시 숨기기'}).click();

  await expect(page.locator('.phase-chip')).toHaveText('다시 찾기');
  await page.getByLabel('다시 찾기 답 입력').fill('island');
  await page.getByRole('button',{name:'다시 찾기'}).click();

  await expect(page.getByRole('heading',{name:'탐험 완료'})).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hide_seek_v2_state')));
  const word=state.missions[0].items[0];
  expect(word.evidence.some(x=>x.stage==='FINAL_SEEK'&&x.result==='WRONG')).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='SEEK_AGAIN_RELEARN'&&x.evidenceMode==='RELEARN_EXPOSURE'&&x.objectiveRecall===false)).toBeTruthy();
  expect(word.evidence.some(x=>x.stage==='SEEK_AGAIN'&&x.result==='CORRECT'&&x.objectiveRecall===true)).toBeTruthy();

  const memory=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return window.HideV2Memory.summary(s.missions[0].items[0]);
  });
  expect(memory.memorySignature.recoveryStatus).toBe('IMMEDIATE_ONLY');
  expect(memory.needsUnassistedRecall).toBe(true);
  const trail=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('hide_seek_v2_state'));
    return window.HideV2Trail.missionSummary(s.missions[0],{itemIds:s.activeSession?.queue||null});
  });
  expect(trail.trailMastery).toBe(100);
  expect(trail.recoveredTodayCount).toBe(1);
  expect(trail.semantics).toBe('CURRENT_SESSION_OR_MISSION_READINESS_NOT_LONG_TERM_MEMORY');
});


test('Hide V2 product home prioritizes active mission and keeps secondary tools subordinate',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'UI'},missions:[{
        id:'m-ui',title:'오늘 영어 탐험',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[
          {id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}},
          {id:'w2',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-ui',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await expect(page.getByText('오늘의 탐험',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'오늘 영어 탐험'})).toBeVisible();
  await expect(page.getByRole('button',{name:'탐험 시작'})).toBeVisible();
  await expect(page.getByRole('button',{name:'탐험 미션'})).toBeVisible();
  await expect(page.getByRole('button',{name:'기억 사다리'})).toBeVisible();

  const metrics=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    innerWidth:window.innerWidth,
    hero:!!document.querySelector('.quest-hero'),
    grid:!!document.querySelector('.quest-grid'),
    stats:document.querySelectorAll('.quest-stat').length,
    mainActionHeight:document.querySelector('.quest-main-action')?.getBoundingClientRect().height||0
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth+1);
  expect(metrics.hero).toBe(true);
  expect(metrics.grid).toBe(true);
  expect(metrics.stats).toBe(3);
  expect(metrics.mainActionHeight).toBeGreaterThanOrEqual(48);
});

test('Hide V2 learning surface shows progress hierarchy without crowding the task card',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'UI 학습'},missions:[{
        id:'m-progress',title:'진행도 탐험',status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[
          {id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}},
          {id:'w2',lexicalId:'planet::행성',token:'planet',meaning:'행성',languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}
        ],sourceCount:0,provenance:{}
      }],activeMissionId:'m-progress',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.locator('.quest-progress')).toBeVisible();
  await expect(page.locator('.phase-chip')).toHaveText('단어 만나기');
  const ui=await page.evaluate(()=>({
    progress:document.querySelectorAll('.quest-progress').length,
    learningWidth:document.querySelector('.learning-shell')?.getBoundingClientRect().width||0,
    overflow:document.documentElement.scrollWidth-window.innerWidth
  }));
  expect(ui.progress).toBe(1);
  expect(ui.learningWidth).toBeLessThanOrEqual(390);
  expect(ui.overflow).toBeLessThanOrEqual(1);
});

test('Hide V2 mission and memory surfaces use product cards instead of raw status tables',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'UI 기록'},missions:[{
        id:'m-card',title:'카드 미션',status:'COMPLETED',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',languageDomain:'ENGLISH',missionRole:'REVIEW',source:{},evidence:[
          {stage:'FINAL_SEEK',evidenceMode:'RECONSTRUCTION',axes:['FORM','RECALL'],result:'CORRECT',objectiveVerified:true,objectiveRecall:true,assisted:false,spacedEvidence:true}
        ]}],sourceCount:0,provenance:{}
      }],activeMissionId:'m-card',activeSession:null,captureSession:null,events:[],updatedAt:new Date().toISOString()
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 미션'}).click();
  await expect(page.locator('.mission-card')).toHaveCount(1);
  await expect(page.getByText('완료',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'홈으로'}).click();
  await page.getByRole('button',{name:'기억 사다리'}).click();
  await expect(page.locator('.memory-summary')).toBeVisible();
  await expect(page.locator('.word-row')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'기억 보기'})).toBeVisible();
});
