const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const visual=path.join(root,'assets/visual/hide_seek_forest_asset.png');
const hasBinary=fs.existsSync(visual);

test('environment-first HOME never regresses to cards or fake selectable learning mode tiles',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/v2.html');
  await expect(page.locator('body')).toHaveAttribute('data-visual-id','TAKY-LAF-HIDE-HOME-MOSSFALL-20260927-A');
  await expect(page.locator('body')).toHaveAttribute('data-v2-surface','home');
  await expect(page.locator('.mossfall-world')).toBeVisible();
  expect(await page.locator('.quest-grid,.quest-tile,.mossfall-mode-signs,.quest-hero').count()).toBe(0);
  const spots=page.locator('[data-world-anchor]');
  await expect(spots).toHaveCount(6);
  const ids=['#v2BeginWithMission','#v2MissionList','#v2Camera','#v2Library','#v2Records','#v2OcrImport'];
  for(const id of ids){
    const node=page.locator(id);await expect(node).toBeVisible();
    const rect=await node.boundingBox();
    expect(rect).toBeTruthy();
    expect(rect.height).toBeGreaterThanOrEqual(48);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x+rect.width).toBeLessThanOrEqual(391);
  }
  const metrics=await page.evaluate(()=>({
    width:document.documentElement.scrollWidth,
    height:document.documentElement.scrollHeight,
    viewportWidth:innerWidth,viewportHeight:innerHeight,
    background:getComputedStyle(document.querySelector('.app-shell')).backgroundImage
  }));
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewportWidth+1);
  expect(metrics.height).toBeLessThanOrEqual(metrics.viewportHeight+1);
  expect(metrics.background).toContain('hide_seek_forest_asset.png');
  await page.locator('#v2BeginWithMission').click();
  await expect(page.getByRole('heading',{name:'오늘의 탐험 지도'})).toBeVisible();
  await page.getByRole('button',{name:'홈으로'}).click();
  await page.locator('#v2OcrImport').click();
  await expect(page.locator('body')).toHaveAttribute('data-v2-surface','source');
  await expect(page.getByRole('heading',{name:'OCR 결과 가져오기'})).toBeVisible();
  const sheet=await page.locator('.ocr-review-card').evaluate(el=>({
    radius:getComputedStyle(el).borderRadius,shadow:getComputedStyle(el).boxShadow
  }));
  expect(sheet.radius).toBe('0px');
  expect(sheet.shadow).toBe('none');
});

test('exact original PNG is bound in-browser, environment distinct from focused work',async({page,request})=>{
  test.skip(!hasBinary,'RELEASE HOLD: original artwork absent from GitHub branch; source-only CI cannot prove image parity');
  await page.setViewportSize({width:390,height:844});
  const asset=await request.get('/assets/visual/hide_seek_forest_asset.png');
  expect(asset.status()).toBe(200);
  await page.goto('/v2.html');
  const bg=await page.locator('.app-shell').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(bg).toContain('hide_seek_forest_asset.png');
  await page.screenshot({path:'test-results/mossfall-environment-home.png',fullPage:true});
  await page.locator('#v2OcrImport').click();
  const shallow=await page.locator('.app-shell').evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
  expect(shallow).toContain('hide_seek_forest_asset.png');
  await page.screenshot({path:'test-results/mossfall-source-review.png',fullPage:true});
});
