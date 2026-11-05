'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=48100+Math.floor(Math.random()*800);
const fails=[];const assert=(v,s)=>{if(!v)fails.push(s)};
(async()=>{
 const server=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((yes,no)=>{server.stdout.on('data',b=>String(b).includes('READY')&&yes());server.on('exit',()=>no(Error('server exited')));setTimeout(()=>no(Error('startup timeout')),9000)});
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome',timeout:15000});
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  const setup=await page.evaluate(()=>{
   const make=(k,date)=>({sheetId:'synthetic-week-'+k,createdAt:date+'T13:00:00.000Z',testDate:date,title:'Synthetic Week '+k,sourceType:'manual',
    recognitionMeta:{reviewedAt:date+'T13:30:00.000Z',qaOnly:true},items:Array.from({length:12},(_,n)=>({id:'w-'+k+'-'+n,
     eng:['tree','stone','island','forest','river','cloud','bridge','branch','flower','garden','school','friend'][n]+'a'+k,
     kor:'합성 뜻 '+k+'-'+n,needsReview:false,wrong:0,hint:0,pass:0,learningStats:{}}))});
   S.sheets=[make('latest','2026-10-16'),make('second','2026-10-14'),make('third','2026-10-12')];S.activeSheetId='synthetic-week-latest';
   S.onboardingDone=true;S.settings.partnerVoice=false;
   const a=HideEnglishCycleV1.enable();
   currentTab='home';render();
   return {state:a.state,count:validWords().length,mastery:sheet().caseMastery};
  });
  assert(setup.state==='ENABLED'&&setup.count===36,'36-sheet setup '+JSON.stringify(setup));
  await page.click('[data-mode=recall]');
  for(let i=0;i<36;i++){
   await page.waitForSelector('[data-hs-pedagogy=RECALL]',{timeout:6500});
   await page.click('#hsPedagogyPass');
   await page.click('#hsPedagogyNext');
  }
  await page.waitForSelector('.hs-weekly-mode-result',{timeout:6500});
  const result=await page.evaluate(()=>{
   const data=S.englishPracticeCycle.lastResult;
   const actual=S.takyLearningOutbox.filter(x=>x.type==='RETRIEVAL_ATTEMPT_RESULT'&&x.payload?.instrument_version==='HIDE_HOME_RECALL_V1');
   return {state:data.state,mode:data.mode,new12:data.new12,review24:data.review24,delayed:data.delayed_retrieval_verified,
    mastery:Number(sheet().caseMastery||0),resultText:document.querySelector('.hs-weekly-mode-result').innerText,
    outbox:actual.length,roles:actual.reduce((a,x)=>(a[x.payload.source_role]=(a[x.payload.source_role]||0)+1,a),{}),
    sourceIds:new Set(actual.map(x=>x.payload.source_sheet_id)).size,
    history:S.learning.history.filter(x=>x.runId===data.runId).length,
    currentRunId:data.runId};
  });
  assert(result.new12.total===12&&result.new12.attempted===12&&result.review24.total===24&&result.review24.attempted===24,'incomplete 36 task '+JSON.stringify(result));
  assert(result.new12.independent_correct===0&&result.review24.independent_correct===0&&!result.delayed&&result.mastery===0,'PASS click fabricated learning mastery '+JSON.stringify(result));
  assert(result.outbox===36&&result.roles.NEW===12&&result.roles.REVIEW===24&&result.sourceIds===3,'cross-sheet evidence attribution wrong '+JSON.stringify(result));
  assert(errors.length===0,'page errors: '+errors.join('; '));
  console.log(JSON.stringify({setup,result,errors,failures:fails},null,2));
  await ctx.close();
 }catch(e){fails.push('EXCEPTION '+e.stack)}
 finally{await browser?.close().catch(()=>{});server.kill()}
 if(fails.length){console.error('HIDE_36_MODE FAIL '+fails.join('\n'));process.exitCode=1}
 else console.log('HIDE_36_MODE PASS: 36 real clicks, 12/24 provenance, no PASS-to-mastery');
})().catch(e=>{console.error(e);process.exitCode=1});