'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn,execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port=45700+Math.floor(Math.random()*400);let srv,browser;
const checks=[],failed=[],errors=[];
function ck(id,ok,value){checks.push({id,ok:!!ok,value});if(!ok)failed.push(id)}
(async()=>{
 srv=spawn(process.execPath,[host,root,String(port)],{stdio:'ignore',windowsHide:true});
 let ready=false;
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:'+port+'/__taky_qa_probe')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
 if(!ready)throw Error('NO_FIXTURE');
 browser=await chromium.launch({channel:'chrome',headless:true});
 const cx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await cx.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const pg=await cx.newPage();pg.on('pageerror',e=>errors.push(String(e)));
 await pg.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await pg.evaluate(()=>{
  S.onboardingDone=true;S.settings.partnerVoice=false;S.memory={};
  const src=S.sheets[0],id='qa-reviewed-english';
  S.sheets=[{...src,sheetId:id,title:'확인된 모의 영어 단어',sourceType:'manual',
   recognitionMeta:{reviewedAt:nowISO(),count:src.items.length},
   items:src.items.map(w=>({...w,needsReview:false,manuallyEdited:true,reviewResolution:'USER_CORRECTED'}))}];
  S.activeSheetId=id;save();renderComplete();
 });
 const baseline=await pg.evaluate(()=>({word:validWords()[0].eng,meaning:validWords()[0].kor,visible:document.querySelector('.memory-event')?.textContent,hasInput:!!document.querySelector('#memoryAnswer')}));
 ck('ANSWER_NOT_EXPOSED',!baseline.visible?.toLowerCase().includes(baseline.word.toLowerCase()),{word:baseline.word,visible:baseline.visible?.slice(0,150)});
 ck('RECALL_INPUT_PRESENT',baseline.hasInput,baseline);
 await pg.screenshot({path:'D:/Git PWA/TAKY/.local/family-qa/HIDE_MEMORY_RECALL_390_20261017.png'});
 const cover=await pg.evaluate(()=>{
  const launcher=document.querySelector('#takyCrewSelectionLauncher'),event=document.querySelector('.memory-event');
  if(!launcher||!event)return {overlap:false,launcherPresent:!!launcher};
  if(getComputedStyle(launcher).display==='none')return {overlap:false,hidden:true};
  const a=launcher.getBoundingClientRect(),b=event.getBoundingClientRect();
  return {overlap:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))>0&&Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))>0,hidden:false};
 });
 ck('MEMORY_INPUT_NOT_OBSCURED_BY_CREW',!cover.overlap,cover);
 if(baseline.hasInput){
  await pg.locator('#memoryAnswer').fill('zzz-not-real-word');
  await pg.locator('#memoryCheck').click();
  const wrong=await pg.evaluate(()=>({event:S.learning.history.at(-1),memory:S.memory[validWords()[0].id]||null}));
  ck('WRONG_RECORDED_AS_IMMEDIATE_NOT_MEMORY',wrong?.event?.result==='WRONG'&&wrong?.event?.mode==='post-completion-recall'&&wrong?.memory===null,wrong);
  await pg.evaluate(()=>{S.memory={};renderComplete()});
  await pg.locator('#memoryAnswer').fill(baseline.word);
  await pg.locator('#memoryCheck').click();
  const right=await pg.evaluate(()=>({event:S.learning.history.at(-1),memory:S.memory[validWords()[0].id]||null}));
  ck('CORRECT_IMMEDIATE_IS_NOT_LONG_TERM_MASTERY',right?.event?.result==='CORRECT'&&right?.event?.mode==='post-completion-recall'&&right?.memory===null,right);
  await pg.evaluate(()=>{S.memory={};renderComplete()});
  await pg.locator('#memorySkip').click();
  const skip=await pg.evaluate(()=>S.memory[validWords()[0].id]||null);
  ck('SKIP_NOT_SCORED',skip===null,skip);
 }
 await pg.evaluate(()=>renderRecords());
 const records=await pg.locator('#view').innerText();
 ck('NO_CHILD_FACING_CASE_FRAMING',!/(?:\bCase\b|사건)/.test(records),records.slice(0,180));
 const evidence=await pg.evaluate(()=>({delayedLabel:[...document.querySelectorAll('.hs-discovery-stats small')].at(-1)?.textContent,
  delayedValue:[...document.querySelectorAll('.hs-discovery-stats b')].at(-1)?.textContent,
  reviewCount:document.querySelectorAll('.hs-discovery-word').length,
  hasPercentage:/100%|기억 강도/.test(document.querySelector('#view').innerText),
  showsGamification:/총 XP|연속 학습/.test(document.querySelector('#view').innerText)}));
 ck('NO_UNVERIFIED_MEMORY_PERCENT',evidence.delayedLabel?.includes('나중에도 기억')&&evidence.delayedValue==='0'&&!evidence.hasPercentage&&!evidence.showsGamification,evidence);
 await pg.reload({waitUntil:'domcontentloaded'});
 const persisted=await pg.evaluate(()=>({history:S.learning.history.filter(e=>e.mode==='post-completion-recall').map(e=>e.result),memory:S.memory[validWords()[0]?.id]||null}));
 ck('RELOAD_KEEPS_IMMEDIATE_EVIDENCE_SEPARATE',persisted.history.includes('WRONG')&&persisted.history.includes('CORRECT')&&persisted.memory===null,persisted);
 ck('NO_PAGE_ERRORS',errors.length===0,errors);
 console.log(JSON.stringify({suite:'MEMORY_RETRIEVAL_REAL_CHROME',checks,failed},null,2));
 await cx.close();
})().catch(e=>{failed.push('HARNESS: '+String(e));console.error('HARNESS',String(e.stack||e))}).finally(async()=>{
 await browser?.close().catch(()=>{});
 if(srv)try{execFileSync('taskkill',['/T','/F','/PID',String(srv.pid)],{stdio:'ignore',timeout:5000})}catch{}
 if(failed.length){console.error('MEMORY_QUALITY_FAIL '+failed.join(', '));process.exitCode=1}else console.log('MEMORY_QUALITY_PASS');
});
