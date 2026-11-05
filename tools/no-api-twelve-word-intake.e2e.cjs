'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core'),{spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=49500+Math.floor(Math.random()*200);
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((ok,no)=>{srv.stdout.on('data',b=>String(b).includes('READY')&&ok());srv.on('exit',()=>no(Error('host stopped')));setTimeout(()=>no(Error('host timeout')),8500)});
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],paidRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('generativelanguage.googleapis.com'))paidRequests.push(r.url())});
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';hsHomeSubject='ENGLISH';render()});
  // The user-approved HOME uses a menu; the retired auto-quick shortcut is not a valid navigation target.
  await page.click('#hsMenuBtn');
  await page.click('[data-hs-menu="sheets"]');
  await page.waitForSelector('#manualSheet');
  await page.click('#manualSheet');await page.waitForSelector('#hsBulkText');
  const invalid='apple - 사과\nbanana 바나나\nriver - 강';
  await page.fill('#hsBulkText',invalid);
  await page.click('#hsImportBulk');
  const failState=await page.evaluate(()=>({notice:document.querySelector('#ocrReviewNotice').textContent,rows:document.querySelectorAll('#ocrRows .row').length}));
  if(!failState.notice.includes('2번째')||failState.rows!==1)throw Error('Malformed source erased review rows '+JSON.stringify(failState));
  const lineData=[
   'apple - 사과','banana - 바나나','river - 강','forest - 숲','cloud - 구름','flower - 꽃',
   'garden - 정원','window - 창문','school - 학교','morning - 아침','friend - 친구','island - 섬'
  ].join('\n');
  await page.fill('#hsBulkText',lineData);
  await page.click('#hsImportBulk');
  await page.waitForSelector('#ocrRows .row:nth-child(12)');
  await page.fill('#hsSheetTestDate','2026-10-19');
  await page.waitForLoadState('networkidle');
  await page.locator('#hsSheetTestDate').evaluate(el=>el.blur());
  await page.waitForTimeout(180);
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_FREE_12_WORD_INTAKE_20261017.png',fullPage:false});
  const pre=await page.evaluate(()=>({rows:document.querySelectorAll('#ocrRows .row').length,
    first:[document.querySelector('#ocrRows .row .eng').value,document.querySelector('#ocrRows .row .kor').value],
    unresolved:document.querySelectorAll('#ocrRows .badge.weak').length, date:document.querySelector('#hsSheetTestDate').value}));
  if(pre.rows!==12||pre.first[0]!=='apple'||pre.unresolved||pre.date!=='2026-10-19')throw Error('Batch edit not ready '+JSON.stringify(pre));
  await page.click('#commitSheet');await page.waitForSelector('.hs-mode-sign');
  const saved=await page.evaluate(()=>({count:S.sheets[0].items.length,sourceType:S.sheets[0].sourceType,
    reviewedAt:S.sheets[0].recognitionMeta.reviewedAt,testDate:S.sheets[0].testDate,words:validWords().length,
    modes:document.querySelectorAll('.hs-mode-sign').length,sampleRetained:S.sheets.some(x=>x.sourceType==='sample')}));
  if(saved.count!==12||saved.words!==12||saved.sourceType!=='manual'||saved.testDate!=='2026-10-19'||saved.modes!==4||!saved.reviewedAt||!saved.sampleRetained)throw Error('Saved sheet does not preserve source '+JSON.stringify(saved));
  await page.click('[data-mode=trace]');await page.waitForSelector('#hsFirstFlip');
  await page.click('#hsFirstFlip');
  const actual=await page.evaluate(()=>({meaning:document.querySelector('#hsFirstAnswer').textContent,
    word:document.querySelector('.hs-first-word').textContent,source:sheet().sourceType}));
  if(actual.word!=='apple'||actual.meaning!=='사과'||paidRequests.length||errors.length)throw Error('No-cost learning path failed '+JSON.stringify({actual,paidRequests,errors}));
  console.log(JSON.stringify({malformed:failState,review:pre,stored:saved,firstContact:actual,paidRequests,errors},null,2));
  await context.close();
 }catch(e){console.error('DIRECT_INTAKE_BROWSER_ERROR',e.stack);process.exitCode=1}
 finally{await browser?.close().catch(()=>{});srv.kill()}
})();