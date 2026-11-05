'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=45900+Math.floor(Math.random()*750);
const fails=[];const check=(value,label)=>{if(!value)fails.push(label)};
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((resolve,reject)=>{srv.stdout.on('data',v=>String(v).includes('READY')&&resolve());srv.on('exit',()=>reject(Error('host stopped')));setTimeout(()=>reject(Error('host timeout')),12000)});
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';render()});
  check(await page.locator('[data-mode]').count()===4,'English should open with four modes');
  const missing=await page.evaluate(()=>HideEnglishCycleV1.status());
  check(missing.state==='NO_REVIEWED_SHEETS','sample fixture was accepted as reviewed');
  const composed=await page.evaluate(()=>{
    const make=(k,stamp)=>({sheetId:'qa-exam-'+k,title:'Synthetic '+k,testDate:stamp,createdAt:stamp+'T12:00:00.000Z',sourceType:'manual',recognitionMeta:{reviewedAt:stamp+'T12:30:00.000Z',qaOnly:true},status:'READY',caseMastery:0,items:Array.from({length:12},(_,n)=>({id:'qa-'+k+'-'+n,eng:'word'+k+'x'+n,kor:'뜻'+k+'-'+n,needsReview:false,reviewResolution:'USER_CORRECTED',wrong:0,pass:0,hint:0,learningStats:{}}))});
    S.sheets=[make(3,'2026-10-16'),make(2,'2026-10-14'),make(1,'2026-10-12'),...S.sheets.filter(x=>x.sourceType==='sample')];S.activeSheetId='qa-exam-3';save();
    const x=HideEnglishCycleV1.compose(),enabled=HideEnglishCycleV1.enable();validWords()[12].wrong++;save();
    return {state:x.state,newCount:x.newCount,reviewCount:x.reviewCount,sourceIds:x.sources,enabled:enabled.state,total:validWords().length,sourceWrong:S.sheets[1].items[0].wrong,origin:HideEnglishCycleV1.originOf('qa-2-0')?.role};
  });
  check(composed.state==='READY'&&composed.newCount===12&&composed.reviewCount===24&&composed.total===36,'36-cycle composition '+JSON.stringify(composed));
  check(composed.sourceWrong===1&&composed.origin==='REVIEW','review result failed to modify original word');
  await page.evaluate(()=>HideEnglishCycleV1.show());
  const overview=await page.evaluate(()=>({newCount:document.querySelectorAll('.hs-cycle-new li').length,reviewCount:document.querySelectorAll('.hs-cycle-review li').length,overflow:document.documentElement.scrollWidth-innerWidth}));
  check(overview.newCount===12&&overview.reviewCount===24&&overview.overflow<=0,'NEW12 left / REVIEW24 right was not displayed '+JSON.stringify(overview));
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_ENGLISH_12_24_20261017.png',fullPage:true});
  // Exercise real DOM PASS actions for one NEW and one REVIEW word, with verified source metadata.
  await page.evaluate(()=>startCodeRed(false));
  await page.click('#passCode');
  await page.evaluate(()=>{S.codeRed.index=12;renderCodeRed()});
  await page.click('#passCode');
  const sourceEvidence=await page.evaluate(()=>{
    const events=(S.takyLearningOutbox||[]).filter(x=>x.type==='RETRIEVAL_ATTEMPT_RESULT'&&x.payload?.word_set==='NEW_12_REVIEW_24');
    const summary=HideEnglishCycleV1.summarizePractice();
    return {events:events.slice(-2).map(x=>({role:x.payload.source_role,id:x.payload.source_sheet_id,mode:x.payload.interaction_mode,result:x.payload.result_type})),runId:summary.runId,
      newSummary:summary.new12,reviewSummary:summary.review24,delayed:summary.delayed_retrieval_verified};
  });
  check(sourceEvidence.events.length===2&&sourceEvidence.events[0].role==='NEW'&&sourceEvidence.events[1].role==='REVIEW'&&sourceEvidence.events.every(x=>x.mode==='RECALL'&&x.result==='PASS'),'word origin / mode evidence incorrect '+JSON.stringify(sourceEvidence));
  check(sourceEvidence.newSummary.attempted===1&&sourceEvidence.reviewSummary.attempted===1&&!sourceEvidence.delayed&&sourceEvidence.newSummary.independent_correct===0,'cycle summary wrongly grants mastery '+JSON.stringify(sourceEvidence));
  const duplicate=await page.evaluate(()=>{const latest=S.sheets.find(x=>x.sheetId==='qa-exam-3'),before=latest.items[1].eng;latest.items[1].eng=latest.items[0].eng.toUpperCase();const test=HideEnglishCycleV1.compose(),words=validWords().length;latest.items[1].eng=before;return {state:test.state,words}});
  check(duplicate.state==='LATEST_WORD_DUPLICATE'&&duplicate.words===0,'duplicate newest vocabulary was accepted '+JSON.stringify(duplicate));
  const refusal=await page.evaluate(()=>{S.sheets[0].recognitionMeta.reviewedAt=null;const c=HideEnglishCycleV1.compose();return {state:c.state,available:validWords().length}});
  check(refusal.available===0,'old cycle continued after source review was revoked '+JSON.stringify(refusal));
  await page.evaluate(()=>{S.englishPracticeCycle.active=false;currentTab='home';hsHomeSubject=null;render()});
  await page.click('[data-hs-subject=HANJA]');
  await page.click('[data-mode=trace]');
  await page.waitForSelector('[data-hanja-mode=TRACE]',{timeout:15000});
  const trace=await page.evaluate(()=>({status:HideHanjaPracticeV1.status(),char:document.querySelector('.hs-hanja-big')?.textContent,read:document.querySelector('.hs-hanja-reveal')?.textContent}));
  check(trace.status.cards===48&&!!trace.char&&!!trace.read,'Hanja TRACE missing '+JSON.stringify(trace));
  await page.click('#hanjaNext');
  await page.evaluate(()=>{currentTab='home';render()});
  await page.click('[data-mode=recall]');
  await page.waitForSelector('[data-hanja-mode=RECALL]',{timeout:15000});
  const before=await page.evaluate(()=>({choices:document.querySelectorAll('[data-hanja-answer]').length,feedback:document.querySelector('#hanjaFeedback').textContent,records:S.hanjaPractice?.records.length||0}));
  check(before.choices>=4&&before.feedback==='','Hanja RECALL exposed answer in feedback before attempts');
  for(let i=0;i<3;i++)await page.click('#hanjaHint');
  const afterHint=await page.evaluate(()=>({feedback:document.querySelector('#hanjaFeedback')?.textContent,marked:document.querySelectorAll('[data-hanja-answer].correct').length,records:S.hanjaPractice?.records.length||0}));
  check(afterHint.marked===0&&afterHint.records===before.records,'Hanja hint revealed answer or scored');
  const answer=await page.evaluate(()=>({all:[...document.querySelectorAll('[data-hanja-answer]')].map(b=>b.dataset.hanjaAnswer)}));
  // Script lexical rows are private: infer the expected ID from the verified trace item (not the UI).
  const correctId='hanja-'+trace.char.codePointAt(0).toString(16);
  const wrongId=answer.all.find(x=>x!==correctId);
  check(!!wrongId,'Hanja RECALL lacks distractors');
  if(wrongId)await page.click('[data-hanja-answer="'+wrongId+'"]');
  await page.click('[data-hanja-answer="'+correctId+'"]');
  const last=await page.evaluate(()=>S.hanjaPractice.records.at(-1));
  check(last.result==='WRONG'&&last.practice_only===true&&last.grade_authority==='NONE_REFERENCE_PRACTICE_ONLY','Hanja wrong->correct scored incorrectly '+JSON.stringify(last));
  const hanjaOutbox=await page.evaluate(()=>(S.takyLearningOutbox||[]).filter(x=>x.type==='RETRIEVAL_ATTEMPT_RESULT'&&x.payload?.instrument_version==='HIDE_HANJA_REFERENCE_PRACTICE_V1').length);
  check(hanjaOutbox===0,'reference-only Hanja was emitted as canonical scored learning evidence');
  for(const mode of ['link','core']){
   await page.click('#hanjaExit');
   await page.click('[data-mode='+mode+']');
   await page.waitForSelector('[data-hanja-mode='+mode.toUpperCase()+']',{timeout:15000});
   const choices=await page.locator('[data-hanja-answer]').count();
   check(choices>=4,'HANJA '+mode+' lacks answer options');
   await page.click('#hanjaPass');
   const outcome=await page.evaluate(()=>S.hanjaPractice.records.at(-1));
   check(outcome.mode===mode.toUpperCase()&&outcome.result==='PASS'&&outcome.practice_only,'HANJA '+mode+' answer evidence wrong');
  }
  check(errors.length===0,'page errors '+errors.join(' | '));
  console.log(JSON.stringify({cycle:composed,revoked:refusal,hanja:trace,hint:afterHint,hanja_result:last,error_count:errors.length,failures:fails},null,2));
  await ctx.close();
 }catch(e){fails.push('EXCEPTION '+e.stack)}
 finally{await browser?.close().catch(()=>{});srv.kill()}
 if(fails.length){console.error('RESTORE_CYCLE_HANJA FAIL\n'+fails.join('\n'));process.exitCode=1}
 else console.log('RESTORE_CYCLE_HANJA PASS: 12+24 source composition, isolation, Hanja reference actions, hint and wrong scoring');
})().catch(e=>{console.error(e);process.exitCode=1});