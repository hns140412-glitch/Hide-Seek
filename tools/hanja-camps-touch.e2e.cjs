'use strict';
// Hanja 구간 practice, driven with real touch taps on a phone and a tablet viewport.
// TRACE look -> cover recall (one "아직이야" comes back) -> map -> CORE on 구간 2 with one miss ->
// the miss comes back once -> "다시 만날 한자" clears it -> progress survives a reload.
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=46700+Math.floor(Math.random()*700);
const shotDir=process.env.HANJA_SHOTS||path.join(root,'.local');
const fails=[];const check=(v,label)=>{if(!v)fails.push(label)};
const idOf=ch=>'hanja-'+ch.codePointAt(0).toString(16);
async function run(browser,name,viewport){
 const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,serviceWorkers:'block'}),page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const tap=async sel=>{await page.locator(sel).first().tap();await page.waitForTimeout(120)};
 const shot=async label=>page.screenshot({path:path.join(shotDir,'hanja-camps-'+name+'-'+label+'.png')});
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
 await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;delete S.hanjaPractice;currentTab='home';hsHomeSubject=null;render()});
 await tap('[data-hs-subject=HANJA]');
 await tap('[data-mode=trace]');
 await page.waitForSelector('[data-hanja-mode=TRACE] .hs-hanja-big',{timeout:15000});
 const first=await page.evaluate(()=>({label:document.querySelector('.hs-hanja-camplabel').textContent,count:document.querySelector('.learn-head b').textContent,trail:document.querySelectorAll('.hs-hanja-trail li').length,overflow:document.documentElement.scrollWidth-innerWidth}));
 check(/^1구간/.test(first.label)&&first.count==='1/5'&&first.trail===5&&first.overflow<=0,name+' TRACE camp 1 start '+JSON.stringify(first));
 await shot('1-view');
 for(let i=0;i<5;i++)await tap('#hanjaNext');
 const cover=await page.evaluate(()=>({h:document.querySelector('.learn-head h2').textContent,hidden:getComputedStyle(document.querySelector('.hs-hanja-selfmark')).display==='none',reveal:!!document.querySelector('.hs-hanja-learning .word-card > .hs-hanja-reveal')}));
 check(cover.h==='가리고 떠올리기'&&cover.hidden&&!cover.reveal,name+' cover step hides 훈음 '+JSON.stringify(cover));
 await shot('2-cover');
 await tap('#hanjaReveal');
 check(await page.locator('.hs-hanja-selfmark').isVisible(),name+' self mark after reveal');
 await shot('3-cover-open');
 await tap('#hanjaNotYet');
 for(let i=0;i<5;i++){await tap('#hanjaReveal');await tap('#hanjaKnow')}
 const traceDone=await page.evaluate(()=>({score:document.querySelector('.hs-hanja-score')?.textContent,miss:document.querySelectorAll('.hs-hanja-chars li.miss').length,camp:S.hanjaPractice.camps[0]}));
 check(traceDone.score==='가리고 바로 떠올린 한자 4/5'&&traceDone.miss===1&&traceDone.camp?.seen&&traceDone.camp.cover===4,name+' TRACE summary '+JSON.stringify(traceDone));
 await shot('4-trace-summary');
 await tap('#hanjaMap');
 const map=await page.evaluate(()=>({camps:document.querySelectorAll('[data-hanja-camp]').length,here:document.querySelector('[data-hanja-camp].here')?.dataset.hanjaCamp,line:document.querySelector('[data-hanja-camp="0"] small').textContent,overflow:document.documentElement.scrollWidth-innerWidth}));
 check(map.camps===10&&map.here==='0'&&/떠올리기 4\/5/.test(map.line)&&map.overflow<=0,name+' map '+JSON.stringify(map));
 await shot('5-map');
 await tap('[data-hanja-switch=CORE]');
 await tap('[data-hanja-camp="1"]');
 await page.waitForSelector('[data-hanja-mode=CORE] [data-hanja-answer]');
 let missChar=null;
 for(let guard=0;guard<12;guard++){
  if(await page.locator('.hs-hanja-score').count())break;
  const ch=await page.locator('.hs-hanja-question .hs-hanja-big').textContent();
  if(!missChar){
   missChar=ch;
   const wrongId=await page.evaluate(c=>[...document.querySelectorAll('[data-hanja-answer]')].map(b=>b.dataset.hanjaAnswer).find(x=>x!==c),idOf(ch));
   await tap('[data-hanja-answer="'+wrongId+'"]');
  }
  if(guard===0)await shot('6-core-wrong');
  await tap('[data-hanja-answer="'+idOf(ch)+'"]');
  await tap('#hanjaNext');
 }
 const core=await page.evaluate(()=>({score:document.querySelector('.hs-hanja-score')?.textContent,label:document.querySelector('.hs-hanja-camplabel').textContent,log:S.hanjaPractice.wrongLog,best:S.hanjaPractice.camps[1]?.best,review:document.querySelector('#hanjaReviewGo')?.textContent}));
 check(core.score==='한 번에 찾은 한자 4/5'&&/^2구간/.test(core.label)&&core.log[idOf(missChar)]===1&&core.best?.CORE===4&&/1자/.test(core.review||''),name+' CORE camp 2 summary '+JSON.stringify(core));
 const recs=await page.evaluate(()=>S.hanjaPractice.records.filter(r=>r.mode==='CORE').map(r=>r.result));
 check(recs.length===6&&recs.filter(r=>r==='WRONG').length===1,name+' miss came back once '+JSON.stringify(recs));
 await shot('7-core-summary');
 await tap('#hanjaReviewGo');
 const rch=await page.locator('.hs-hanja-question .hs-hanja-big').textContent();
 check(rch===missChar,name+' review starts with the missed char');
 await tap('[data-hanja-answer="'+idOf(rch)+'"]');
 await shot('8-review-cleared');
 const cleared=await page.evaluate(()=>({log:{...S.hanjaPractice.wrongLog},recovered:S.hanjaPractice.recovered,outbox:(S.takyLearningOutbox||[]).filter(x=>x.payload?.instrument_version==='HIDE_HANJA_REFERENCE_PRACTICE_V1').length,practice:S.hanjaPractice.records.every(r=>r.practice_only&&r.grade_authority==='NONE_REFERENCE_PRACTICE_ONLY')}));
 check(!cleared.log[idOf(missChar)]&&cleared.recovered===1&&cleared.outbox===0&&cleared.practice,name+' review cleared, practice only '+JSON.stringify(cleared));
 await page.reload({waitUntil:'load'});
 await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';hsHomeSubject=null;render()});
 await tap('[data-hs-subject=HANJA]');
 await tap('[data-mode=recall]');
 await page.waitForSelector('[data-hanja-mode=RECALL] [data-hanja-answer]');
 const resumed=await page.evaluate(()=>({label:document.querySelector('.hs-hanja-camplabel').textContent,camp:S.hanjaPractice.camp,seen:!!S.hanjaPractice.camps[0]?.seen,options:document.querySelectorAll('[data-hanja-answer]').length}));
 check(/^2구간/.test(resumed.label)&&resumed.camp===1&&resumed.seen&&resumed.options===4,name+' progress survives reload '+JSON.stringify(resumed));
 await shot('9-resume-recall');
 await tap('#hanjaExit');
 check(await page.locator('[data-mode=trace]').count()===1,name+' exit returns to the four Hanja modes');
  check(errors.length===0,name+' page errors '+errors.join(' | '));
 await ctx.close();
 return {first,traceDone,map,core,cleared,resumed};
}
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((resolve,reject)=>{srv.stdout.on('data',v=>String(v).includes('READY')&&resolve());srv.on('exit',()=>reject(Error('host stopped')));setTimeout(()=>reject(Error('host timeout')),12000)});
 let browser;const out={};
 try{
  require('node:fs').mkdirSync(shotDir,{recursive:true});
  browser=await chromium.launch({headless:true,channel:'chrome'});
  out.phone=await run(browser,'phone',{width:390,height:844});
  out.tablet=await run(browser,'tablet',{width:1180,height:820});
 }catch(e){fails.push('crash '+e.message)}
 finally{await browser?.close();srv.kill()}
 console.log(JSON.stringify(out));
 if(fails.length){console.error('HANJA_CAMPS FAIL\n'+fails.join('\n'));process.exitCode=1}
 else console.log('HANJA_CAMPS PASS: 구간 trace+cover, map, CORE miss comes back, review clears, resume (phone+tablet, touch)');
})();
