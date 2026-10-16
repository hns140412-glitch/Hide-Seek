const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const APP='http://127.0.0.1:4380/';
const outDir='D:/Git PWA/Hide & Seek/artifacts/e5-static-projection-browser-20261010';
fs.mkdirSync(outDir,{recursive:true});
const result={pass:false,subjects:[],errors:[]};

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const subject of ['SCIENCE','SOCIAL','MATH']){
   const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
   const page=await context.newPage();
   page.on('pageerror',e=>result.errors.push(subject+':PAGE:'+String(e)));
   const u=new URL(APP);u.searchParams.set('school_stage','E5');u.searchParams.set('subject',subject);
   await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:12000});
   await page.waitForFunction(()=>document.documentElement.dataset.hideLearningTermLoader==='BOUND'&&window.HideTermDecoderV1?.snapshot?.().engineOwnedCards===true,{timeout:15000});
   const snap=await page.evaluate(()=>HideTermDecoderV1.snapshot());
   assert.ok(snap.cardCount>0,subject+' no cards');
   assert.equal(snap.engineProjection?.source_kind,'STATIC_PROJECTION_FALLBACK');
   assert.equal(snap.engineProjection?.school_stage,'E5');
   assert.equal(snap.engineProjection?.subject,subject);
   assert.ok(snap.cards.every(c=>String(c.source||'').includes('STANDARD:')),subject+' ungrounded card');
   const first=snap.cards[0];
   await page.evaluate(()=>HideTermDecoderV1.open('TRACE'));
   await page.waitForSelector('.term-decoder-shell',{state:'visible',timeout:8000});
   const text=await page.locator('.term-decoder-shell').innerText();
   assert.ok(text.includes(first.term),subject+' first projected term not rendered');
   result.subjects.push({
     subject,cardCount:snap.cardCount,firstTerm:first.term,firstSource:first.source,
     projectionVersion:snap.engineProjection?.projection_version,
     sourceKind:snap.engineProjection?.source_kind,
     rendered:true
   });
   await context.close();
 }
 assert.deepEqual(result.errors,[]);
 result.pass=true;
 fs.writeFileSync(outDir+'/result.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 await browser.close();
})().catch(e=>{result.errors.push(String(e?.stack||e));fs.writeFileSync(outDir+'/result.json',JSON.stringify(result,null,2));console.error(e);process.exit(1)});