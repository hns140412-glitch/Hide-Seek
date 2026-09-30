const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.use({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });

test('capture primary home surface for TAKY Golden comparison', async ({page})=>{
  fs.mkdirSync('ui-audit',{recursive:true});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.waitForTimeout(500);
  await page.screenshot({path:'ui-audit/01-home.png',fullPage:false});
  const body=page.locator('body');
  await expect(body).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBeFalsy();
});
