const {test,expect}=require('@playwright/test');

test('Hide V2 evening: direct 12 new + 24 review -> local mission -> learning',async({page})=>{
  await page.goto('http://127.0.0.1:4174/evening-v2.html',{waitUntil:'load'});
  await expect(page.locator('#eveningManualEntry')).toBeAttached();
  await page.locator('#eveningManualEntry summary').click();
  const newer=Array.from({length:12},(_,i)=>'newword'+i+' | 새 단어 뜻 '+i).join('\n');
  const review=Array.from({length:24},(_,i)=>'oldword'+i+' | 복습 단어 뜻 '+i).join('\n');
  await page.locator('#eveningNewWords').fill(newer);
  await page.locator('#eveningReviewWords').fill(review);
  await page.locator('#eveningSaveWords').click();
  await expect(page.locator('#view')).toContainText('36개의 숨은 단어');
  const saved=await page.evaluate(()=>{
    const s=window.HideV2Store.snapshot();
    const m=window.HideV2Mission.activeMission();
    return {mission:m,activeSession:s.activeSession,htmlSource:location.pathname};
  });
  expect(saved.mission.items).toHaveLength(36);
  expect(saved.mission.items.filter(x=>x.missionRole==='NEW')).toHaveLength(12);
  expect(saved.mission.items.filter(x=>x.missionRole==='REVIEW')).toHaveLength(24);
  expect(saved.mission.provenance.ocrUsed).toBe(false);
  expect(saved.mission.provenance.parentFactConfirmed).toBe(false);
  expect(saved.activeSession).toBeNull();
  await page.locator('[data-action="open"]').first().click();
  await expect(page.locator('#v2Start')).toBeVisible();
  await page.locator('#v2Start').click();
  const active=await page.evaluate(()=>window.HideV2Store.snapshot().activeSession);
  expect(active).toBeTruthy();
});

test('Hide V2 manual parse fails closed without creating invented OCR evidence',async({page})=>{
  await page.goto('http://127.0.0.1:4174/evening-v2.html',{waitUntil:'load'});
  await page.locator('#eveningManualEntry summary').click();
  await page.locator('#eveningNewWords').fill('without separator');
  await page.locator('#eveningSaveWords').click();
  await expect(page.locator('#eveningManualStatus')).toContainText('단어 | 뜻');
  expect(await page.evaluate(()=>window.HideV2Mission.listMissions().length)).toBe(0);
  await page.locator('#eveningNewWords').fill('apple | 사과\napple | 사과');
  await page.locator('#eveningSaveWords').click();
  await expect(page.locator('#eveningManualStatus')).toContainText('중복');
  expect(await page.evaluate(()=>window.HideV2Mission.listMissions().length)).toBe(0);
});
