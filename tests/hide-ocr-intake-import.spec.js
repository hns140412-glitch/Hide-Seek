const {test,expect}=require('@playwright/test');
const packet={
  schema:'HIDE_OCR_INTAKE_V1',packetId:'synthetic_new_and_three_exams',
  documents:[
    {documentId:'printed_source',kind:'NEW_PRINT',sourceLabel:'independent new print',
      rows:Array.from({length:12},(_,i)=>({
        sourceRowIndex:i+1,eng:'entry'+i,kor:'뜻'+i,confidence:'high'
      }))},
    {documentId:'marked_source',kind:'HISTORICAL_EXAMS',
      examRegions:{
        LEFT:{dateRelation:'LAST_WEEK_MONDAY',weekday:'MONDAY',dateVerified:false},
        CENTER:{dateRelation:'PREVIOUS_WEEK_WED_OR_FRI_UNRESOLVED',weekday:null,dateVerified:false},
        RIGHT:{dateRelation:'PREVIOUS_WEEK_WED_OR_FRI_UNRESOLVED',weekday:null,dateVerified:false}
      },
      rows:['LEFT','CENTER','RIGHT'].flatMap((region,j)=>
        Array.from({length:12},(_,i)=>({
          region,sourceRowIndex:i+1,observedWordCandidate:'testcandidate'+j+'_'+i,
          childAnswerRaw:'',redCorrectionRaw:'',redMarkRaw:i===4?'circled':''
        })))}
  ]
};
test('source-aware local OCR review creates only 12-parent-confirmed-word mission and three unscored historical exam records',async({page})=>{
  await page.goto('/v2.html');
  await page.locator('#ocrImportInput').setInputFiles({
    name:'synthetic-ocr.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(packet))
  });
  await expect(page.getByRole('heading',{name:'서로 다른 자료로 나누었어요'})).toBeVisible();
  await expect(page.locator('[data-imported-row]')).toHaveCount(12);
  await expect(page.locator('[data-imported-row]:visible')).toHaveCount(1);
  await expect(page.locator('#v2IntakePageCount')).toHaveText('1/12');
  await expect(page.locator('[data-intake-role="1"]')).toContainText('NEW 후보 · 이 기기 기준');
  await expect(page.locator('.ocr-review-card>.ocr-review-next')).toHaveCSS('border-radius','0px');
  await page.locator('#v2IntakeNext').click();
  await expect(page.locator('#v2IntakePageCount')).toHaveText('2/12');
  await expect(page.locator('[data-imported-row="1"]')).toBeVisible();
  await expect(page.locator('[data-imported-row="0"]')).toBeHidden();
  await page.locator('#v2IntakePrev').click();
  await expect(page.locator('#v2IntakePageCount')).toHaveText('1/12');
  await expect(page.locator('[data-exam-region]')).toHaveCount(3);
  const staged=await page.evaluate(()=>{
    const s=HideV2Store.snapshot();
    return {missions:s.missions.length,history:s.historicalExamDrafts.map(x=>({
      region:x.region,count:x.rows.length,weekday:x.weekday,status:x.status,
      grade:x.gradingState,signal:x.memorySignalEligible})),
      memory:HideV2Memory.dashboard().total};
  });
  expect(staged.missions).toBe(0);
  expect(staged.history.map(x=>x.region)).toEqual(['LEFT','CENTER','RIGHT']);
  expect(staged.history.map(x=>x.count)).toEqual([12,12,12]);
  expect(staged.history[1].weekday).toBe(null);
  expect(staged.history[2].weekday).toBe(null);
  expect(staged.history.every(x=>x.status==='PENDING_PARENT_REVIEW'&&x.grade==='UNVERIFIED'&&x.signal===false)).toBe(true);
  expect(staged.memory).toBe(0);

  await page.locator('[data-import-eng="0"]').fill('editedentry');
  await page.locator('[data-import-eng="0"]').blur();
  await page.reload();
  await page.locator('#v2OcrImport').click();
  await expect(page.locator('[data-import-eng="0"]')).toHaveValue('editedentry');
  await page.locator('#v2ConfirmImportedPrint').click();
  await expect.poll(()=>page.evaluate(()=>HideV2Store.snapshot().missions.length)).toBe(0);
  await page.locator('#v2ParentVerifiedNew').check();
  await page.locator('#v2ConfirmImportedPrint').click();
  await expect.poll(()=>page.evaluate(()=>HideV2Store.snapshot().missions.length)).toBe(1);
  const finished=await page.evaluate(()=>{
    const s=HideV2Store.snapshot();
    return {packet:s.ocrIntakePacket.packetId,missions:s.missions.length,
      mission:s.missions[0],history:s.historicalExamDrafts,
      memory:HideV2Memory.wordbook().map(x=>({token:x.token,evidence:x.evidence.length})),
      activeSession:s.activeSession,events:s.events.length};
  });
  expect(finished.mission.items).toHaveLength(12);
  expect(finished.mission.items[0].token).toBe('editedentry');
  expect(finished.mission.items.every(x=>x.missionRole==='NEW'&&x.missionRoleSource==='PARENT_CONFIRMED_NEW_PRINT_NO_LOCAL_MATCH')).toBe(true);
  expect(finished.mission.items.some(x=>x.token.startsWith('testcandidate'))).toBe(false);
  expect(finished.mission.provenance.source).toBe('PARENT_CONFIRMED_OCR_IMPORT');
  expect(finished.mission.provenance.noAutoPlanner).toBe(true);
  expect(finished.history).toHaveLength(3);
  expect(finished.history.every(x=>x.gradingState==='UNVERIFIED'&&x.memorySignalEligible===false)).toBe(true);
  // An imported mission appears in the wordbook, but it has no recall evidence:
  // historical OCR must never become a scored memory/learning event.
  expect(finished.memory).toHaveLength(12);
  expect(finished.memory.every(x=>x.evidence===0&&!x.token.startsWith('testcandidate'))).toBe(true);
  expect(finished.activeSession).toBe(null);
  expect(finished.events).toBe(0);
  await page.reload();
  expect(await page.evaluate(()=>HideV2Store.snapshot().historicalExamDrafts.length)).toBe(3);
  expect(await page.evaluate(()=>HideV2Store.snapshot().missions.length)).toBe(1);
});
test('ambiguous Wednesday/Friday mapping cannot be silently asserted by OCR JSON',async({page})=>{
  await page.goto('/v2.html');
  const invalid=JSON.parse(JSON.stringify(packet));
  invalid.documents[1].examRegions.CENTER.weekday='WEDNESDAY';
  await page.locator('#ocrImportInput').setInputFiles({
    name:'invalid-ocr.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(invalid))
  });
  const s=await page.evaluate(()=>HideV2Store.snapshot());
  expect(s.ocrIntakePacket).toBe(null);
  expect(s.missions).toHaveLength(0);
  expect(s.historicalExamDrafts).toHaveLength(0);
});

test('printed source label does not override exact local lexical history or ambiguous sense review',async({page})=>{
  await page.goto('/v2.html');
  await page.evaluate(()=>{
    HideV2Mission.addMission({title:'Synthetic earlier approved vocabulary',
      provenance:{source:'SYNTHETIC_PRIOR_LOCAL_HISTORY'},
      items:[{eng:'entry1',kor:'뜻1'},{eng:'entry2',kor:'다른 뜻'}],sourceCount:1});
  });
  await page.locator('#ocrImportInput').setInputFiles({
    name:'synthetic-ocr.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(packet))
  });
  await expect(page.locator('[data-imported-row]')).toHaveCount(12);
  await expect(page.locator('[data-intake-role="2"]')).toContainText('REVIEW');
  await expect(page.locator('[data-intake-role="3"]')).toContainText('뜻 확인 필요');
  await expect(page.locator('[data-confirm-distinct-sense="3"]')).toHaveCount(1);
  await page.locator('#v2ParentVerifiedNew').check();
  await page.locator('#v2ConfirmImportedPrint').click();
  expect(await page.evaluate(()=>HideV2Store.snapshot().missions.length)).toBe(1);
  await expect(page.locator('#v2IntakePageCount')).toHaveText('3/12');
  await page.locator('[data-confirm-distinct-sense="3"]').check();
  await page.locator('#v2ConfirmImportedPrint').click();
  await expect.poll(()=>page.evaluate(()=>HideV2Store.snapshot().missions.length)).toBe(2);
  const outcome=await page.evaluate(()=>{
    const s=HideV2Store.snapshot();
    const m=s.missions.find(x=>x.provenance?.source==='PARENT_CONFIRMED_OCR_IMPORT');
    const previous=s.missions.find(x=>x.title==='Synthetic earlier approved vocabulary');
    const firstNew=HideV2Learning.create(m,{targetItemIds:[m.items[0].id]});
    const priorSenseReview=HideV2Learning.create(m,{targetItemIds:[m.items[1].id]});
    const distinctNewSense=HideV2Learning.create(m,{targetItemIds:[m.items[2].id]});
    return {mission:m,previous,
      firstStages:[firstNew.stage,priorSenseReview.stage,distinctNewSense.stage],
      histories:s.historicalExamDrafts.map(x=>({region:x.region,signal:x.memorySignalEligible,grading:x.gradingState})),
      memoryEvidence:HideV2Memory.wordbook().reduce((n,x)=>n+x.evidence.length,0),
      plannerActions:s.events.length};
  });
  expect(outcome.mission.items).toHaveLength(12);
  expect(outcome.mission.items[1].missionRole).toBe('REVIEW');
  expect(outcome.mission.items[1].missionRoleSource).toBe('EXACT_LOCAL_LEXICAL_SENSE_MATCH');
  expect(outcome.mission.items[2].missionRole).toBe('NEW');
  expect(outcome.mission.items[2].missionRoleSource).toBe('PARENT_CONFIRMED_DISTINCT_SENSE');
  expect(outcome.firstStages).toEqual(['MEMORIZE','FIRST_FIND','MEMORIZE']);
  expect(outcome.mission.provenance.historyScope).toBe('LOCAL_MISSIONS_ONLY');
  expect(outcome.mission.provenance.historyNotComplete).toBe(true);
  expect(outcome.previous.items).toHaveLength(2);
  expect(outcome.histories).toHaveLength(3);
  expect(outcome.histories.every(h=>h.signal===false&&h.grading==='UNVERIFIED')).toBe(true);
  expect(outcome.memoryEvidence).toBe(0);
  expect(outcome.plannerActions).toBe(0);
});

test('separate photo packet sequence preserves three old exams before the fresh printed list',async({page})=>{
  await page.goto('/v2.html');
  const historicalOnly={schema:packet.schema,packetId:'synthetic_hist_first',
    documents:[packet.documents[1]]};
  const printedOnly={schema:packet.schema,packetId:'synthetic_print_second',
    documents:[packet.documents[0]]};
  await page.locator('#ocrImportInput').setInputFiles({
    name:'older-exams.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(historicalOnly))
  });
  await expect(page.locator('[data-exam-region]')).toHaveCount(3);
  expect(await page.evaluate(()=>HideV2Store.snapshot().missions.length)).toBe(0);
  await page.locator('#v2ImportAnother').click();
  await page.locator('#ocrImportInput').setInputFiles({
    name:'new-list.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(printedOnly))
  });
  await expect(page.locator('[data-imported-row]')).toHaveCount(12);
  await expect(page.locator('[data-exam-region]')).toHaveCount(3);
  await page.locator('#v2ParentVerifiedNew').check();
  await page.locator('#v2ConfirmImportedPrint').click();
  await expect.poll(()=>page.evaluate(()=>HideV2Store.snapshot().missions.length)).toBe(1);
  await page.reload();
  await page.locator('#v2OcrImport').click();
  await page.locator('#v2ImportAnother').click();
  await page.locator('#ocrImportInput').setInputFiles({
    name:'older-exams-duplicate.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(historicalOnly))
  });
  const status=await page.evaluate(()=>{
    const s=HideV2Store.snapshot();
    return {activePacket:s.ocrIntakePacket.packetId,
      missions:s.missions.length,
      historical:s.historicalExamDrafts.map(h=>({region:h.region,packetId:h.packetId,rows:h.rows.length}))};
  });
  expect(status.activePacket).toBe('synthetic_print_second');
  expect(status.missions).toBe(1);
  expect(status.historical.map(x=>x.region)).toEqual(['LEFT','CENTER','RIGHT']);
  expect(status.historical.every(x=>x.packetId==='synthetic_hist_first'&&x.rows===12)).toBe(true);
});
