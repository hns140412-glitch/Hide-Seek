'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn,execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port=45300+Math.floor(Math.random()*450);
const errors=[],failed=[],checks=[];let server,browser;
const check=(id,actual,expected)=>{const ok=actual===expected;checks.push({id,ok,actual,expected});if(!ok)failed.push(id);};
const low=()=>({id:'ocr-low-1',eng:'appple',kor:'사과',confidence:'low',needsReview:true});
const high=()=>({id:'ocr-high-2',eng:'book',kor:'책',confidence:'high',needsReview:false});
const outcome=async page=>page.evaluate(()=>({
  count:S.sheets.length,activeSheet:S.activeSheetId,
  rows:document.querySelectorAll('#ocrRows .row').length,
  items:(S.sheets[0]?.items||[]).map(x=>({eng:x.eng,needsReview:x.needsReview,manuallyEdited:x.manuallyEdited,reviewResolution:x.reviewResolution||null})),
  notice:document.querySelector('#ocrReviewNotice')?.textContent||''
}));
(async()=>{
 server=spawn(process.execPath,[host,root,String(port)],{windowsHide:true,stdio:'ignore'});
 let ready=false;
 for(let n=0;n<60;n++){try{if((await fetch('http://127.0.0.1:'+port+'/__taky_qa_probe')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
 if(!ready)throw Error('FIXTURE_UNAVAILABLE');
 browser=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(String(e.message)));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;save();});
 const baseline=await page.evaluate(()=>S.sheets.length);
 await page.evaluate(([a,b])=>renderOCRReview([a,b],true),[low(),high()]);
 await page.screenshot({path:'D:/Git PWA/TAKY/.local/family-qa/HIDE_OCR_REVIEW_390_20261017.png'});
 await page.locator('#commitSheet').click();
 let o=await outcome(page);
 check('UNREVIEWED_LOW_MUST_NOT_ENTER_SHEET',o.count,baseline);
 check('UNREVIEWED_LOW_STAYS_ON_REVIEW',o.rows,2);
 // Low-confidence user acceptance must be independent of batch commit.
 await page.evaluate(([a,b])=>renderOCRReview([a,b],true),[low(),high()]);
 const accept=page.locator('[data-review-accept="0"]');
 check('EXPLICIT_ACCEPT_CONTROL',await accept.count(),1);
 if(await accept.count()){
  await accept.click();
  await page.locator('#commitSheet').click();
  o=await outcome(page);
  check('AFTER_ACCEPT_SHEET_CREATED',o.count,baseline+1);
  const accepted=o.items.find(x=>x.eng==='appple');
  check('USER_ACCEPT_RESOLUTION',accepted?.reviewResolution,'USER_ACCEPTED');
 }
 // Fresh isolated synthetic input: editing a flagged OCR row counts as correction.
 await page.evaluate(a=>renderOCRReview([a],true),low());
 await page.locator('#ocrRows .row .eng').fill('apple');
 await page.locator('#commitSheet').click();
 o=await outcome(page);
 check('EXPLICIT_EDIT_CREATED_SHEET',o.count,baseline+2);
 const corrected=o.items.find(x=>x.eng==='apple');
 check('USER_CORRECTION_PROVENANCE',corrected?.reviewResolution,'USER_CORRECTED');
 // Blank manually entered word must not be accepted.
 await page.evaluate(()=>renderManualEntry('수동 입력 시험'));
 await page.locator('#commitSheet').click();
 o=await outcome(page);
 check('EMPTY_MANUAL_ROW_BLOCKED',o.count,baseline+2);
 await page.locator('#ocrRows .row .eng').fill('tree');
 await page.locator('#ocrRows .row .kor').fill('나무');
 await page.locator('#commitSheet').click();
 o=await outcome(page);
 check('MANUAL_INPUT_CREATED_SHEET',o.count,baseline+3);
 check('MANUAL_INPUT_CORRECTED',o.items.find(x=>x.eng==='tree')?.reviewResolution,'USER_CORRECTED');
 const sourceType=await page.evaluate(()=>S.sheets[0]?.sourceType);
 check('MANUAL_PROVENANCE',sourceType,'manual');
 check('NO_BROWSER_EXCEPTIONS',errors.length,0);
 console.log(JSON.stringify({suite:'OCR_LOW_CONFIDENCE_REAL_CHROME',checks,errors,failed},null,2));
 await ctx.close();
})().catch(e=>{failed.push('HARNESS: '+String(e.stack||e));console.error('HARNESS: '+String(e.stack||e))}).finally(async()=>{
 await browser?.close().catch(()=>{});
 if(server){try{execFileSync('taskkill',['/T','/F','/PID',String(server.pid)],{stdio:'ignore',timeout:5000})}catch{}}
 if(failed.length){console.error('OCR_PROVENANCE_FAIL '+JSON.stringify(failed));process.exitCode=1}else console.log('OCR_PROVENANCE_PASS');
});
