const {test,expect}=require('@playwright/test');

test('printed handout becomes Hide exploration mission and enters FIRST FIND',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_state',JSON.stringify({
      onboardingDone:true,
      onboardingStep:4,
      profile:{displayName:'테스트 탐험가'},
      sheets:[{
        sheetId:'seed',
        title:'기존 미션',
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
        status:'READY',
        caseMastery:0,
        items:[]
      }],
      activeSheetId:'seed'
    }));
  });

  await page.route('**/api/capture/analyze',async route=>{
    const body=route.request().postDataBuffer()?.toString('utf8')||'';
    expect(body).toContain('HIDE_VOCABULARY');
    expect(body).toContain('VOCABULARY_PRINT');
    await route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({
        ok:true,
        provider:'FIXTURE_VISION',
        model:'fixture-v1',
        actor_role:'CHILD',
        analysis_domain:'HIDE_VOCABULARY',
        result:{
          analysis_domain:'HIDE_VOCABULARY',
          analysis_version:'HIDE_VOCABULARY_OCR_V1',
          rows:[
            {eng:'benefit',kor:'혜택',confidence:'high',warnings:[]},
            {eng:'essential',kor:'필수적인',confidence:'low',warnings:['일부 흐림']}
          ]
        }
      })
    });
  });

  await page.goto('/?actor_role=CHILD&session_id=session-e2e&task_id=task-e2e&lap_id=lap-e2e');

  await expect(page.getByRole('heading',{name:'새 탐험 미션',exact:true})).toBeVisible();

  await page.locator('#sheetLibraryInput').setInputFiles({
    name:'vocab.jpg',
    mimeType:'image/jpeg',
    buffer:Buffer.from('fake-image-content')
  });

  await page.waitForFunction(()=>window.HideCaptureRuntime?.currentSession?.()?.pages?.length===1);
  await expect(page.getByRole('heading',{name:'숨은 단어 촬영',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'지금 분석'}).click();

  await expect(page.getByText('단어 결과 확인')).toBeVisible();
  await expect(page.locator('#hideBatchRows .eng').nth(0)).toHaveValue('benefit');
  await expect(page.locator('#hideBatchRows .kor').nth(0)).toHaveValue('혜택');
  await expect(page.locator('#hideBatchRows .eng').nth(1)).toHaveValue('essential');
  await expect(page.locator('#hideBatchRows .kor').nth(1)).toHaveValue('필수적인');
  await expect(page.getByText('확인 필요')).toBeVisible();
  await expect(page.getByText('첫 등장',{exact:true}).first()).toBeVisible();
  await page.locator('[data-role-toggle="0"]').click();
  await expect(page.getByText('검토에서 확정',{exact:true}).first()).toBeVisible();
  await page.locator('[data-role-toggle="0"]').click();


  await page.getByRole('button',{name:'이대로 확인'}).click();
  await page.getByRole('button',{name:'탐험 미션 만들기'}).click();

  await expect(page.getByText('학습 준비')).toBeVisible();

  const snapshot=await page.evaluate(()=>{
    const raw=JSON.parse(localStorage.getItem('hide_seek_state'));
    const mission=raw.sheets.find(x=>x.sheetId===raw.activeSheetId);
    return {
      activeSheetId:raw.activeSheetId,
      inputActorRole:mission.recognitionMeta?.inputActorRole,
      analysisDomain:mission.recognitionMeta?.analysisDomain,
      providers:mission.recognitionMeta?.providers,
      evidenceItemIds:mission.recognitionMeta?.evidenceItemIds,
      missionComposition:mission.recognitionMeta?.missionComposition,
      validCount:mission.items.filter(x=>x.eng&&x.kor&&!x.needsReview).length,
      latestOutbox:(raw.takyLearningOutbox||[]).at(-1)||null
    };
  });

  expect(snapshot.inputActorRole).toBe('CHILD');
  expect(snapshot.analysisDomain).toBe('HIDE_VOCABULARY');
  expect(snapshot.providers).toContain('FIXTURE_VISION');
  expect(snapshot.evidenceItemIds.length).toBeGreaterThan(0);
  expect(snapshot.validCount).toBe(2);
  expect(snapshot.missionComposition.observedNew+snapshot.missionComposition.observedReview).toBe(2);
  expect(snapshot.missionComposition.classificationSource).toBe('ROLE_CONFIRMATION_OR_HISTORY');
  expect(snapshot.missionComposition.layoutIndependent).toBe(true);
  expect(snapshot.missionComposition.expectedNew).toBeUndefined();
  expect(snapshot.missionComposition.expectedReview).toBeUndefined();
  expect(snapshot.latestOutbox?.app).toBe('hide-seek');
  expect(snapshot.latestOutbox?.actor_role).toBe('CHILD');
  expect(snapshot.latestOutbox?.payload?.explorationMissionId).toBe(snapshot.activeSheetId);
  expect(snapshot.latestOutbox?.payload?.inputActorRole).toBe('CHILD');
  expect(snapshot.latestOutbox?.payload?.validWordCount).toBe(2);
  expect(snapshot.latestOutbox?.payload?.memorySummary).toBeTruthy();

  await page.getByRole('button',{name:'외우기 시작'}).click();
  await expect(page.getByText('새 단어 이해하고 외우기')).toBeVisible();
  await expect(page.getByText('benefit')).toBeVisible();
  await page.getByRole('button',{name:'외웠어요 · 다음'}).click();
  await page.getByRole('button',{name:'외우기 완료 · FIRST FIND'}).click();
  await expect(page.getByText('FIRST FIND',{exact:true})).toBeVisible();
  await expect(page.getByText('혜택')).toBeVisible();
});


test('parent can create the same Hide exploration mission intake path',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('hide_seek_state',JSON.stringify({
      onboardingDone:true,
      onboardingStep:4,
      profile:{displayName:'부모 입력 테스트'},
      sheets:[{
        sheetId:'seed-parent',
        title:'기존 미션',
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
        status:'READY',
        caseMastery:0,
        items:[]
      }],
      activeSheetId:'seed-parent'
    }));
  });

  await page.route('**/api/capture/analyze',async route=>{
    const body=route.request().postDataBuffer()?.toString('utf8')||'';
    expect(body).toContain('HIDE_VOCABULARY');
    await route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({
        ok:true,
        provider:'FIXTURE_VISION',
        model:'fixture-parent-v1',
        actor_role:'PARENT',
        analysis_domain:'HIDE_VOCABULARY',
        result:{
          analysis_domain:'HIDE_VOCABULARY',
          analysis_version:'HIDE_VOCABULARY_OCR_V1',
          rows:[
            {eng:'challenge',kor:'도전',confidence:'high',warnings:[]}
          ]
        }
      })
    });
  });

  await page.goto('/?actor_role=PARENT&session_id=session-parent&task_id=task-parent&lap_id=lap-parent');

  await page.locator('#sheetLibraryInput').setInputFiles({
    name:'parent-vocab.jpg',
    mimeType:'image/jpeg',
    buffer:Buffer.from('parent-image-content')
  });
  await page.waitForFunction(()=>window.HideCaptureRuntime?.currentSession?.()?.pages?.length===1);

  await page.getByRole('button',{name:'지금 분석'}).click();
  await expect(page.locator('#hideBatchRows .eng').nth(0)).toHaveValue('challenge');
  await page.getByRole('button',{name:'탐험 미션 만들기'}).click();

  const snapshot=await page.evaluate(()=>{
    const raw=JSON.parse(localStorage.getItem('hide_seek_state'));
    const mission=raw.sheets.find(x=>x.sheetId===raw.activeSheetId);
    return {
      inputActorRole:mission.recognitionMeta?.inputActorRole,
      analysisDomain:mission.recognitionMeta?.analysisDomain,
      validCount:mission.items.filter(x=>x.eng&&x.kor&&!x.needsReview).length
    };
  });

  expect(snapshot.inputActorRole).toBe('PARENT');
  expect(snapshot.analysisDomain).toBe('HIDE_VOCABULARY');
  expect(snapshot.validCount).toBe(1);
});
