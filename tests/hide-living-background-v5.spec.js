const {test,expect}=require('@playwright/test');
test('Hide V5 living background binds exact master and motion-off fallback',async({page,request})=>{
  await page.setViewportSize({width:390,height:844});
  const master=await request.get('/assets/visual/hide_seek_forest_asset.png');
  const motion=await request.get('/assets/visual/hide_seek_forest_motion_v5.mp4');
  expect(master.status()).toBe(200);
  expect(motion.status()).toBe(200);
  await page.goto('/v2.html');
  await expect(page.locator('#hideMossfallMotion source')).toHaveAttribute('src','../../assets/visual/hide_seek_forest_motion_v5.mp4');
  const size=await page.evaluate(()=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({w:i.naturalWidth,h:i.naturalHeight});i.src='./assets/visual/hide_seek_forest_asset.png'}));
  expect(size).toEqual({w:941,h:1672});
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('html')).toHaveAttribute('data-hide-living-motion','off');
  await expect(page.locator('#hideMossfallMotion')).toHaveCSS('display','none');
});
