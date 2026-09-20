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
            {eng:'benefit',kor:'혜택',confidence:'high',evidence_item_id:'fixture-page',warnings:[]},
            {eng:'essential',kor:'필수적인',confidence:'low',evidence_item_id:'fixture-page',warnings:['일부 흐림']}
          ]
        }
      })
    });
  });

  await page.goto('/?actor_role=CHILD&session_id=session-e2e&task_id=task-e2e&lap_id=lap-e2e');

  await expect(page.getByRole('heading',{name:'새 탐험 미션',exact:true})).toBeVisible();

  const file=Buffer.from('fake-image-content');
  await page.locator('#sheetLibraryInput').setInputFiles({
    name:'vocab.jpg',
    mimeType:'image/jpeg',
    buffer:file
  });

  await page.waitForFunction(()=>window.HideCaptureRuntime?.currentSession?.()?.pages?.length===1);
  await page.waitForTimeout(50);
  await expect(page.getByRole('heading',{name:'숨은 단어 촬영',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'지금 분석'}).click();

  await expect(page.getByText('단어 결과 확인')).toBeVisible();
  await expect(page.locator('#hideBatchRows')).toContainText('benefit');
  await expect(page.locator('#hideBatchRows')).toContainText('essential');
  await expect(page.getByText('확인 필요')).toBeVisible();

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
      validCount:mission.items.filter(x=>x.eng&&x.kor&&!x.needsReview).length
    };
  });

  expect(snapshot.inputActorRole).toBe('CHILD');
  expect(snapshot.analysisDomain).toBe('HIDE_VOCABULARY');
  expect(snapshot.providers).toContain('FIXTURE_VISION');
  expect(snapshot.evidenceItemIds.length).toBeGreaterThan(0);
  expect(snapshot.validCount).toBe(2);

  await page.getByRole('button',{name:'학습'}).click();
  await page.getByRole('button',{name:/학습 시작|이어하기/}).click();
  await expect(page.getByText('FIRST FIND')).toBeVisible();
  await expect(page.getByText('benefit')).toBeVisible();
});
