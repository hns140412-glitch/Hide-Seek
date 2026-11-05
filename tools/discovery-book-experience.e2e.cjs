'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core'),{spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=49000+Math.floor(Math.random()*300);
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((yes,no)=>{srv.stdout.on('data',b=>String(b).includes('READY')&&yes());srv.on('exit',()=>no(Error('host stopped')));setTimeout(()=>no(Error('host timeout')),9000)});
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  const first=await page.evaluate(()=>{
   S.onboardingDone=true;S.settings.partnerVoice=false;
   S.sheets[0].sourceType='synthetic-qa-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};
   const ws=validWords(),now=nowISO();
   for(const w of ws){w.wrong=0;w.pass=0;w.hint=0;w.learningStats={}}
   S.learning.history=[
    {at:now,mode:'TRACE',wordId:ws[0].id,result:'EXPOSED',scoreAuthority:'EXPOSURE_ONLY'},
    {at:now,mode:'RECALL',wordId:ws[1].id,result:'CORRECT',hintLevel:0,wrongAttempts:0},
    {at:now,mode:'RECALL',wordId:ws[2].id,result:'HINT_USED',hintLevel:1,wrongAttempts:0},
    {at:now,mode:'RECALL',wordId:ws[3].id,result:'PASS',hintLevel:0,wrongAttempts:0}
   ];
   S.memory[ws[1].id]={verification:'DELAYED_RETRIEVAL_CORRECT'};
   ws[2].hint=1;ws[3].pass=1;
   currentTab='records';render();
   return {history:S.learning.history.length,xp:S.xp};
  });
  await page.waitForSelector('.hs-discovery-log');
  const before=await page.evaluate(()=>({
   stat:[...document.querySelectorAll('.hs-discovery-stats b')].map(x=>x.textContent),
   review:[...document.querySelectorAll('.hs-discovery-word b')].map(x=>x.textContent),
   xpVisible:/총 XP|연속 학습/.test(document.querySelector('#view').innerText),
   horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
   companion:getComputedStyle(document.querySelector('#partnerBar')).display,
   totalWords:validWords().length
  }));
  if(before.stat.join('|')!=='1|2|1'||before.xpVisible||before.horizontalOverflow>0||before.companion!=='none')throw Error('book incorrectly attributes scores '+JSON.stringify(before));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_DISCOVERY_BOOK_20261017.png',fullPage:false});
  await page.click('[data-discover-word]');
  const after=await page.evaluate(()=>({
   message:document.querySelector('#hsDiscoveryReveal').textContent,
   records:S.learning.history.length,
   fields:[...document.querySelectorAll('.hs-discovery-stats b')].map(x=>x.textContent),
  }));
  if(!after.message.includes('—')||after.records!==first.history)throw Error('book action altered learning outcome '+JSON.stringify(after));
  await page.click('#hsRecordContinue');
  await page.waitForSelector('.hs-journey');
  const onward=await page.evaluate(()=>({journey:document.querySelectorAll('.hs-journey-trail li').length,phase:S.learning.phase}));
  if(onward.journey!==6||errors.length)throw Error('book journey return broken '+JSON.stringify({onward,errors}));
  console.log(JSON.stringify({first,before,after,onward,errors},null,2));
 }catch(e){console.error('DISCOVERY_BOOK_BROWSER_ERROR '+e.stack);process.exitCode=1}
 finally{await browser?.close().catch(()=>{});srv.kill()}
})();