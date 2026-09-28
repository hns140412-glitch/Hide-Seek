const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const visual=path.join(root,'assets/visual/hide_seek_forest_asset.png');
const hasBinary=fs.existsSync(visual);
// GitHub text connector cannot commit a binary PNG: skip UI bitmap proof until
// the exact approved bytes have been added to the bundled release source.
// This is a release HOLD, never a passing artwork binding assertion.
test('approved Hide Mossfall home is the exact regional art with live sign controls',async({page,request})=>{
  test.skip(!hasBinary,'RELEASE HOLD: immutable approved PNG is not in current GitHub tree');
  await page.setViewportSize({width:390,height:844});
  const asset=await request.get('/assets/visual/hide_seek_forest_asset.png');
  expect(asset.status()).toBe(200);
  await page.goto('/v2.html');
  await expect(page.locator('body')).toHaveAttribute('data-visual-id','TAKY-LAF-HIDE-HOME-MOSSFALL-20260927-A');
  await expect(page.locator('body')).toHaveAttribute('data-v2-surface','home');
  await expect(page.locator('.mossfall-home')).toBeVisible();
  const bg=await page.locator('.app-shell').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(bg).toContain('hide_seek_forest_asset.png');
  await expect(page.locator('.mossfall-mode-signs [role=listitem]')).toHaveCount(4);
  const legend=await page.locator('.mossfall-mode-signs').innerText();
  for(const name of ['TRACE','LINK','CORE','RECALL'])expect(legend).toContain(name);
  expect(await page.locator('.quest-tile__icon').allTextContents()).toEqual(['01','02']);
  for(const id of ['#v2Camera','#v2Library','#v2OcrImport','#v2MissionList','#v2Records']){
    await expect(page.locator(id)).toBeVisible();
  }
  const dimensions=await page.evaluate(()=>({
    viewport:window.innerHeight,
    main:document.querySelector('#view').getBoundingClientRect().height,
    width:document.documentElement.scrollWidth,
    innerWidth:window.innerWidth
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.innerWidth+1);
  await page.screenshot({path:'test-results/approved-mossfall-home-390x844.png',fullPage:true});
  await page.locator('#v2OcrImport').click();
  await expect(page.locator('body')).toHaveAttribute('data-v2-surface','source');
  await expect(page.getByRole('heading',{name:'OCR 결과 가져오기'})).toBeVisible();
  const workBg=await page.locator('.app-shell').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(workBg).not.toContain('hide_seek_forest_asset.png');
  const scenicHeader=await page.locator('.app-shell').evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
  expect(scenicHeader).toContain('hide_seek_forest_asset.png');
  await page.screenshot({path:'test-results/approved-mossfall-source-390x844.png',fullPage:true});
});
