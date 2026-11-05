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
 const external=[];
 await ctx.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external.push(r.request().url());return r.abort()});
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
 await page.reload({waitUntil:'domcontentloaded'});
 const preserved=await page.evaluate(()=>({sourceType:S.sheets[0]?.sourceType,review:S.sheets[0]?.items[0]?.reviewResolution,needsReview:S.sheets[0]?.items[0]?.needsReview}));
 check('RELOAD_PRESERVES_MANUAL_REVIEW',preserved.sourceType==='manual'&&preserved.review==='USER_CORRECTED'&&!preserved.needsReview,true);
 // On-device TextDetector first: offline, no API key, mocked detector, no external call.
 const makeFile=()=>page.evaluate(async()=>{const c=document.createElement('canvas');c.width=64;c.height=64;c.getContext('2d').fillRect(0,0,64,64);const b=await new Promise(r=>c.toBlob(r,'image/png'));window.__f=new File([b],'sheet.png',{type:'image/png'});return true});
 await makeFile();
 await ctx.setOffline(true);
 await page.evaluate(()=>{runtimeApiKey='';window.__confirmCalls=0;window.confirm=()=>{window.__confirmCalls++;return false};window.__detectBitmap=null;
  window.TextDetector=class{async detect(img){window.__detectBitmap=img instanceof ImageBitmap;const t=(rawValue,x,y)=>({rawValue,boundingBox:{x,y,width:100,height:20}});
   return [t('apple 사과',0,0),t('river',0,40),t('강',0,60),t('book',0,100),t('책',0,120),t('책상',0,140),t('42',0,200)]}}});
 const localBase=await page.evaluate(()=>S.sheets.length);
 await page.evaluate(()=>analyzeSheet(window.__f,{quality:'t'}));
 let l=await page.evaluate(()=>({rows:[...document.querySelectorAll('#ocrRows .row')].map(r=>[r.querySelector('.eng').value,r.querySelector('.kor').value,r.querySelector('.badge').textContent]),bitmap:window.__detectBitmap,confirm:window.__confirmCalls,count:S.sheets.length,src:S.ocrDraft?.source,conf:S.ocrDraft?.rows.map(x=>x.confidence+':'+x.needsReview)}));
 check('LOCAL_OCR_OFFLINE_NO_KEY_ROWS',JSON.stringify(l.rows),JSON.stringify([['apple','사과','확인 필요'],['river','강','확인 필요']]));
 check('LOCAL_OCR_AMBIGUOUS_NOT_PAIRED',l.rows.some(r=>r[0]==='book'),false);
 check('LOCAL_OCR_USES_IMAGE_BITMAP',l.bitmap,true);
 check('LOCAL_OCR_LOW_NEEDS_REVIEW',JSON.stringify(l.conf),JSON.stringify(['low:true','low:true']));
 check('LOCAL_OCR_SOURCE_METADATA',l.src&&l.src.engine==='BROWSER_TEXTDETECTOR'&&l.src.onDevice===true&&l.src.network===false,true);
 check('LOCAL_OCR_NO_CONFIRM_NO_SHEET',l.confirm===0&&l.count===localBase,true);
 // Independently saving another app setting must not persist the unapproved
 // child worksheet draft, even if an older version accidentally stored it.
 const draftPrivacy=await page.evaluate(()=>{
   const before=S.ocrDraft?.rows?.length;
   save();
   const payload=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
   const oldState={...payload,ocrDraft:{rows:[{eng:'private',kor:'비공개',needsReview:true}]}};
   return {before,persisted:Object.hasOwn(payload,'ocrDraft'),legacyMigrated:migrate(oldState).ocrDraft};
 });
 check('OCR_DRAFT_NOT_PERSISTED_BY_UNRELATED_SAVE',
   draftPrivacy.before===2&&!draftPrivacy.persisted&&draftPrivacy.legacyMigrated===null,true);
 await page.locator('#commitSheet').click();
 check('LOCAL_OCR_BLOCKED_UNTIL_REVIEW',await page.evaluate(()=>S.sheets.length),localBase);
 await page.locator('[data-review-accept="0"]').click();await page.locator('[data-review-accept="1"]').click();
 await page.locator('#commitSheet').click();
 const approved=await page.evaluate(()=>S.sheets[0].items.map(x=>[x.eng,x.reviewResolution,x.needsReview]));
 check('LOCAL_OCR_REVIEWED_ROWS_SAVED',JSON.stringify(approved),JSON.stringify([['apple','USER_ACCEPTED',false],['river','USER_ACCEPTED',false]]));
 const storedOcrSource=await page.evaluate(()=>({engine:S.sheets[0]?.recognitionMeta?.sourceEngine,
   deviceOnly:S.sheets[0]?.recognitionMeta?.deviceOnly,mastery:S.sheets[0]?.caseMastery}));
 check('LOCAL_OCR_SOURCE_SURVIVES_EXPLICIT_ACCEPT',JSON.stringify(storedOcrSource),
   JSON.stringify({engine:'BROWSER_TEXTDETECTOR',deviceOnly:true,mastery:0}));
 // Unsupported fallback.
 await page.evaluate(()=>{delete window.TextDetector;});
 await page.evaluate(()=>analyzeSheet(window.__f,{quality:'t'}));
 const un=await page.evaluate(()=>({rows:document.querySelectorAll('#ocrRows .row').length,msg:document.querySelector('#view p')?.textContent||'',bulk:!!document.querySelector('#hsBulkText'),count:S.sheets.length}));
 check('UNSUPPORTED_MANUAL_FALLBACK',un.rows===1&&un.bulk&&/지원하지 않/.test(un.msg)&&/전송하지 않/.test(un.msg),true);
 check('UNSUPPORTED_NO_NEW_SHEET',un.count,localBase+1);
 // Detector with no usable pair and detector failure.
 await page.evaluate(()=>{window.TextDetector=class{async detect(){return [{rawValue:'42',boundingBox:{x:0,y:0,width:10,height:10}}]}}});
 await page.evaluate(()=>analyzeSheet(window.__f,{quality:'t'}));
 check('NO_CANDIDATE_MANUAL_FALLBACK',await page.evaluate(()=>/찾지 못/.test(document.querySelector('#view p')?.textContent||'')),true);
 await page.evaluate(()=>{window.TextDetector=class{async detect(){throw new Error('x')}}});
 await page.evaluate(()=>analyzeSheet(window.__f,{quality:'t'}));
 check('DETECT_FAILURE_MANUAL_FALLBACK',await page.evaluate(()=>/완료하지 못/.test(document.querySelector('#view p')?.textContent||'')),true);
 await ctx.setOffline(false);
 check('LOCAL_OCR_NO_EXTERNAL_REQUESTS',external.length,0);
 check('LOCAL_OCR_NO_CONFIRM_ANY',await page.evaluate(()=>window.__confirmCalls),0);
 check('NO_BROWSER_EXCEPTIONS',errors.length,0);
 console.log(JSON.stringify({suite:'OCR_LOW_CONFIDENCE_REAL_CHROME',checks,errors,failed},null,2));
 await ctx.close();
})().catch(e=>{failed.push('HARNESS: '+String(e.stack||e));console.error('HARNESS: '+String(e.stack||e))}).finally(async()=>{
 await browser?.close().catch(()=>{});
 if(server){try{execFileSync('taskkill',['/T','/F','/PID',String(server.pid)],{stdio:'ignore',timeout:5000})}catch{}}
 if(failed.length){console.error('OCR_PROVENANCE_FAIL '+JSON.stringify(failed));process.exitCode=1}else console.log('OCR_PROVENANCE_PASS');
});
