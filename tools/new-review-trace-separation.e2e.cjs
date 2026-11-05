'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=45420+Math.floor(Math.random()*350);
const errors=[];const fail=[];
function ok(value,label){if(!value)fail.push(label)}
(async()=>{
 const server=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 let browser;
 try{
  await new Promise((yes,no)=>{server.stdout.on('data',b=>String(b).includes('READY')&&yes());server.on('exit',()=>no(Error('STATIC_HOST_EXIT')));setTimeout(()=>no(Error('STATIC_HOST_TIMEOUT')),9000)});
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  const initial=await page.evaluate(()=>{
    S.onboardingDone=true;S.settings.partnerVoice=false;
    S.learning=clone(DEFAULT_STATE.learning);S.codeRed=clone(DEFAULT_STATE.codeRed);
    S.englishPracticeCycle=null;
    const make=(g,date)=>({sheetId:'synthetic-fixture-'+g,title:'Fixture'+g,
       createdAt:date+'T08:00:00Z',testDate:date,sourceType:'manual',
       recognitionMeta:{reviewedAt:date+'T08:15:00Z',qaOnly:true},
       items:Array.from({length:12},(_,k)=>({id:'fixture-'+g+'-'+k,eng:'trailword'+g+'x'+k,
         kor:'synthetic-meaning-'+g+'-'+k,needsReview:false,wrong:0,hint:0,pass:0,learningStats:{}}))});
    S.sheets=[make(0,'2026-10-17'),make(1,'2026-10-15'),make(2,'2026-10-13')];
    S.activeSheetId=S.sheets[0].sheetId;
    const enabled=HideEnglishCycleV1.enable();
    currentTab='home';hsHomeSubject='ENGLISH';render();
    const review=HideEnglishCycleV1.compose().rows.find(x=>x.role==='REVIEW');
    review.word.wrong=3;
    renderWeak();
    return {state:enabled.state,reviewId:review.word.id,reviewWord:review.word.eng,reviewRole:review.role,first:traceWords().length,all:validWords().length};
  });
  ok(initial.state==='ENABLED'&&initial.reviewRole==='REVIEW'&&initial.first===12&&initial.all===36,'12/24 setup not separately attributed '+JSON.stringify(initial));
  await page.waitForTimeout(280); // wait for delayed app bootstrap rendering before user action
  await page.evaluate(()=>renderWeak());
  const surface=await page.evaluate(()=>({phase:S.learning.phase,weak:!!document.querySelector('#weakReplay'),text:document.querySelector('#view')?.innerText.slice(0,230),active:S.englishPracticeCycle?.active}));
  console.log('SETUP_SURFACE',JSON.stringify({initial,surface,errors}));
  await page.waitForSelector('#weakReplay',{timeout:4500});
  await page.click('#weakReplay');
  await page.waitForSelector('.hs-first-story',{timeout:9000});
  const focus=await page.evaluate(()=>({word:document.querySelector('.hs-first-word').textContent,
    progress:document.querySelector('.hs-first-pager').textContent,
    focusId:S.learning.traceFocusWordId,
    traceCount:traceWords().length,
    history:S.learning.history.length}));
  ok(focus.word===initial.reviewWord&&focus.focusId===initial.reviewId&&focus.traceCount===1&&/1\s*\/\s*1/.test(focus.progress),'weak review redirects to new vocabulary '+JSON.stringify(focus));
  await page.click('#firstNext');
  await page.waitForSelector('#weakReplay',{timeout:9000});
  const returned=await page.evaluate(()=>({
    phase:S.learning.phase,focus:S.learning.traceFocusWordId,
    events:S.learning.history.filter(x=>x.wordId==='fixture-1-0'),
    weakVisible:!!document.querySelector('.weak-list'),
    newCount:traceWords().length}));
  ok(returned.phase==='weak'&&!returned.focus&&returned.weakVisible&&returned.newCount===12,'review single-word route incorrectly enters full new TRACE/meaning stage '+JSON.stringify(returned));
  await page.evaluate(()=>renderFirstContact());
  const newTrace=await page.evaluate(()=>({word:document.querySelector('.hs-first-word').textContent,
   pager:document.querySelector('.hs-first-pager').textContent,origin:HideEnglishCycleV1.originOf(traceWords()[0].id).role}));
  ok(/1\s*\/\s*12/.test(newTrace.pager)&&newTrace.origin==='NEW','initial trace erroneously includes old review '+JSON.stringify(newTrace));
  await page.evaluate(()=>{S.learning.traceFocusWordId='fixture-1-0';currentTab='home';render()});
  await page.click('[data-mode=trace]');
  await page.waitForSelector('.hs-first-story');
  const fresh=await page.evaluate(()=>({pager:document.querySelector('.hs-first-pager').textContent,focus:S.learning.traceFocusWordId,first:document.querySelector('.hs-first-word').textContent}));
  ok(/1\s*\/\s*12/.test(fresh.pager)&&!fresh.focus&&fresh.first==='trailword0x0','fresh TRACE resumed old focused review instead of NEW12 '+JSON.stringify(fresh));
  ok(errors.length===0,'pageErrors '+errors.join('; '));
  console.log(JSON.stringify({initial,focus,returned,newTrace,errors,fail},null,2));
  await ctx.close();
 }catch(e){fail.push('HARNESS '+e.stack)}
 finally{await browser?.close().catch(()=>{});server.kill()}
 if(fail.length){console.error('HIDE_NEW_REVIEW_TRACE_SEPARATION_FAIL '+fail.join('\n'));process.exitCode=1}
 else console.log('HIDE_TRACE_SEPARATED_SOURCE: NEW12 initial, REVIEW24 focus routed independently');
})().catch(e=>{console.error(e);process.exitCode=1});
