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
  await expect(page.locator('.mossfall-live-fx')).toHaveCount(1);
  await expect(page.locator('.mossfall-fx--fall')).toHaveCount(4);
  const livingFx=await page.locator('.mossfall-live-fx').evaluate(el=>({
    display:getComputedStyle(el).display,
    shaftAnimation:getComputedStyle(el,'::before').animationName,
    poolAnimation:getComputedStyle(el.querySelector('.mossfall-fx--pool')).animationName
  }));
  expect(livingFx.display).not.toBe('none');
  expect(livingFx.shaftAnimation).toBe('mossfallShaftDrift');
  expect(livingFx.poolAnimation).toBe('mossfallPoolRipple');
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
  await page.screenshot({path:'test-results/mossfall-environment-home-phase-a.png',fullPage:true});
  await page.waitForTimeout(3900);
  await page.screenshot({path:'test-results/mossfall-environment-home-phase-b.png',fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();
  await page.screenshot({path:'test-results/mossfall-environment-home-reduced-motion.png',fullPage:true});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.reload();
  await page.locator('#v2OcrImport').click();
  const shallow=await page.locator('.app-shell').evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
  expect(shallow).toContain('hide_seek_forest_asset.png');
  await page.screenshot({path:'test-results/mossfall-source-review.png',fullPage:true});
});


test('focus keeps the approved environmental scene, compact accessible evidence journal and existing learning controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    const iso='2026-09-29T00:00:00.000Z';
    localStorage.setItem('hide_seek_v2_state',JSON.stringify({
      version:1,profile:{displayName:'synthetic learner'},
      missions:[{id:'focus-visual-fixture',title:'Synthetic focus sample',
        status:'READY',createdAt:iso,updatedAt:iso,
        items:[{id:'w1',lexicalId:'island::섬',token:'island',meaning:'섬',
          languageDomain:'ENGLISH',missionRole:'NEW',evidence:[],source:{}}],
        sourceCount:0,provenance:{}}],
      activeMissionId:'focus-visual-fixture',activeSession:null,
      captureSession:null,events:[],updatedAt:iso
    }));
  });
  await page.goto('/v2.html');
  await page.getByRole('button',{name:'탐험 시작'}).click();
  await expect(page.locator('body')).toHaveAttribute('data-v2-surface','focus');
  await expect(page.locator('.journey-path li.is-current small')).toHaveText('01 만나기');
  await expect(page.locator('.thinking-map-card')).toBeVisible();
  const view=await page.evaluate(()=>{
    const app=document.querySelector('.app-shell');
    const journal=document.querySelector('.learning-shell');
    const assist=document.querySelector('.crew-support-btn');
    const selectors=document.querySelector('.inference-row');
    return {
      scene:getComputedStyle(app).backgroundImage,
      header:getComputedStyle(document.querySelector('.top-safe')).backgroundImage,
      oldTopSlice:getComputedStyle(app,'::before').display,
      journalRadius:getComputedStyle(journal).borderRadius,
      journalShadow:getComputedStyle(journal).boxShadow,
      journalBackground:getComputedStyle(journal).backgroundImage,
      selectorColumns:getComputedStyle(selectors).gridTemplateColumns.trim().split(/\s+/).length,
      assistHeight:Math.round(assist.getBoundingClientRect().height),
      width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
      viewportWidth:innerWidth,viewportHeight:innerHeight
    };
  });
  // This verifies the source-level CSS binding; actual image bytes must pass
  // the independent --require-asset gate, not this text-only GitHub CI.
  expect(view.scene).toContain('hide_seek_forest_asset.png');
  expect(view.header).toContain('gradient');
  expect(view.oldTopSlice).toBe('none');
  expect(view.journalRadius).toBe('0px');
  expect(view.journalShadow).toBe('none');
  expect(view.journalBackground).toContain('gradient');
  expect(view.journalBackground).toMatch(/rgba\(251,\s*249,\s*235,\s*0\.66\)/);
  expect(view.journalBackground).toMatch(/rgba\(251,\s*249,\s*235,\s*0\.79\)/);
  expect(view.selectorColumns).toBe(2);
  expect(view.assistHeight).toBeGreaterThanOrEqual(44);
  expect(view.width).toBeLessThanOrEqual(view.viewportWidth+1);
  expect(view.height).toBeLessThanOrEqual(view.viewportHeight+10);
  await page.setViewportSize({width:430,height:932});
  const tall=await page.evaluate(()=>({width:document.documentElement.scrollWidth,
    height:document.documentElement.scrollHeight,vw:innerWidth,vh:innerHeight}));
  expect(tall.width).toBeLessThanOrEqual(tall.vw+1);
  expect(tall.height).toBeLessThanOrEqual(tall.vh+1);
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'짧은 응원'}).click();
  await expect(page.locator('.crew-support-copy')).not.toBeEmpty();
  await page.getByRole('button',{name:'기억하고 찾아보기'}).click();
  await expect(page.locator('.journey-path li.is-current small')).toHaveText('02 첫 찾기');
  await expect(page.getByLabel('회상 답 입력')).toBeVisible();
});
