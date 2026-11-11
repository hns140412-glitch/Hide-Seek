'use strict';
/* E2E: 한 판 숨바꼭질 (one-action recall rounds) + 판정 고치기 (append-only parent correction).
 * Usage: node tools/quick-seek-grading-correction.e2e.cjs [screenshotDir]
 * Runs its own static server; uses the global `playwright` package, or Play Camp's playwright-core on the PC. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
let chromium;
try{({chromium}=require('playwright'))}catch{({chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core'))}
const root=path.resolve(__dirname,'..');
const shots=process.argv[2]||path.join(root,'.local','qa-quick-seek');
fs.mkdirSync(shots,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s)});
const fail=[],notes=[];const assert=(v,n)=>{if(!v)fail.push(n)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await ctx.newPage();const errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))missing.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.waitForFunction(()=>window.HideQuickSeekV1&&window.HideGradingCorrectionV1);
  // Negative control: the shipped demo sheet is not learner data -> quick seek must refuse it.
  await page.evaluate(async()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';viewStack=[];await renderHome();HideQuickSeekV1.open()});
  assert(await page.locator('[data-qs-round]').count()===0,'quick seek accepted the demo (unconfirmed) sheet');
  assert(await page.locator('[data-qs-camera]').count()===1,'empty state has no photo action');
  // Isolated synthetic confirmed worksheet (QA only).
  await page.evaluate(()=>{S.sheets[0].sourceType='synthetic-qa-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};S.learning.history=[];S.codeRed.history=[];S.gradingCorrections=[];S.quickSeek=null;save();currentTab='home';viewStack=[];render()});
  await page.waitForSelector('#hsMenu',{state:'attached'});await sleep(150);
  // Approved HOME unchanged; entries live in the menu.
  const home=await page.evaluate(()=>({signs:[...document.querySelectorAll('.hs-mode-sign')].map(e=>e.dataset.mode).join(','),bg:getComputedStyle(document.querySelector('.hs-home')).backgroundImage,overflow:document.documentElement.scrollWidth-innerWidth}));
  assert(home.signs==='trace,link,core,recall','approved HOME mode signs changed: '+home.signs);
  assert(home.bg.includes('hide_seek_forest_asset.png'),'approved HOME background changed');
  assert(home.overflow<=0,'HOME overflow');
  await page.click('#hsMenuBtn');
  assert(await page.locator('[data-hs-play=quick]').isVisible(),'menu: quick seek entry missing');
  assert(await page.locator('[data-hs-play=fix]').isVisible(),'menu: grading fix entry missing');
  await page.screenshot({path:path.join(shots,'01-menu.png')});
  await page.click('[data-hs-play=quick]');
  await page.waitForSelector('[data-qs-round]');
  assert(await page.locator('[data-qs-round]').count()===3,'hub must offer 3 rounds');
  await page.screenshot({path:path.join(shots,'02-hub.png')});
  const words=await page.evaluate(()=>validWords().map(w=>({id:w.id,eng:w.eng,kor:w.kor})));
  const byKor=new Map(words.map(w=>[w.kor,w]));
  async function play(round,{wrongEvery=4,shotAt=-1}={}){
   await page.evaluate(r=>HideQuickSeekV1.start(r),round);
   let n=0,right=0,wrong=0,shot=false;
   const t0=Date.now();
   while(Date.now()-t0<90000){
    if(await page.locator('[data-qs-end]').count())break;
    const enabled=page.locator('.hs-qs-stage [data-qs-pick]:not([disabled])');
    if(!(await enabled.count())){await sleep(80);continue}
    const p=await page.evaluate(()=>{const st=document.querySelector('.hs-qs-stage');return {meaning:st.querySelector('[data-qs-flash-meaning]:not([hidden]),.hs-qs-meaning:not([data-qs-flash-meaning])')?.textContent||'',
      word:st.querySelector('.hs-qs-word')?[...st.querySelector('.hs-qs-word').childNodes].map(n=>n.nodeType===1?'?':n.textContent).join(''):null,
      pair:[...st.querySelectorAll('.hs-qs-pair b')].map(b=>b.textContent),picks:[...st.querySelectorAll('[data-qs-pick]')].map(b=>b.dataset.qsPick)}});
    let correct;
    if(round==='pair'){const w=words.find(x=>x.eng===p.pair[0]);correct=w&&w.kor===p.pair[1]?'O':'X'}
    else if(round==='flash'){correct=byKor.get(p.meaning)?.id}
    else{const w=byKor.get(p.meaning);const i=p.word.indexOf('?');correct=w.eng[i].toLowerCase()}
    assert(correct&&p.picks.includes(correct),'cannot find correct option in '+round+' '+JSON.stringify(p));
    const goWrong=(n%wrongEvery)===wrongEvery-1;
    const choice=goWrong?p.picks.find(x=>x!==correct):correct;
    if(n===shotAt&&!shot){await page.screenshot({path:path.join(shots,'03-play-'+round+'.png')});shot=true;
      const lay=await page.evaluate(()=>{const pb=document.getElementById('partnerBar'),nav=document.getElementById('bottomNav');const vis=el=>el&&getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0;const bar={top:Math.min(vis(pb)?pb.getBoundingClientRect().top:innerHeight,vis(nav)?nav.getBoundingClientRect().top:innerHeight)};const picks=[...document.querySelectorAll('.hs-qs-stage [data-qs-pick]')].map(b=>b.getBoundingClientRect());return {barTop:bar.top,maxBottom:Math.max(...picks.map(r=>r.bottom)),minW:Math.min(...picks.map(r=>r.width)),minH:Math.min(...picks.map(r=>r.height)),overflow:document.documentElement.scrollWidth-innerWidth}});
      assert(lay.maxBottom<=lay.barTop,round+': answer buttons hidden under guide bar '+JSON.stringify(lay));
      assert(lay.minW>=44&&lay.minH>=44,round+': tap target smaller than 44px '+JSON.stringify(lay));
      assert(lay.overflow<=0,round+': horizontal overflow');}
    await page.click('.hs-qs-stage [data-qs-pick="'+choice+'"]');
    // one action: after one tap every option is locked
    assert(await page.locator('.hs-qs-stage [data-qs-pick]:not([disabled])').count()===0,round+': options still enabled after one tap');
    n++;goWrong?wrong++:right++;
    await sleep(120);
   }
   await page.waitForSelector('[data-qs-end]',{timeout:15000});
   return {n,right,wrong,ms:Date.now()-t0};
  }
  const wrongBefore=await page.evaluate(()=>validWords().reduce((a,w)=>a+(w.wrong||0),0));
  const r1=await play('pair',{shotAt:1});
  await page.screenshot({path:path.join(shots,'04-end-pair.png')});
  const end1=await page.evaluate(()=>({count:Number(document.querySelector('.hs-qs-end-count b').textContent),chips:document.querySelectorAll('.hs-qs-chip').length,
    ev:S.learning.history.filter(e=>e.mode==='quick-seek'),code:S.codeRed.history.length,best:S.quickSeek.best.pair,runs:S.quickSeek.runs.length,outbox:(S.takyLearningOutbox||[]).filter(e=>e.type==='QUICK_SEEK_ROUND_RESULT').length}));
  notes.push('pair round '+JSON.stringify(r1));
  assert(end1.ev.length===r1.n,'quick-seek events '+end1.ev.length+' != taps '+r1.n);
  assert(new Set(end1.ev.map(e=>e.eventId)).size===end1.ev.length,'event ids not unique');
  assert(end1.ev.every(e=>e.scoreAuthority==='QUICK_SEEK_PRACTICE'&&e.evidenceLevel==='RECOGNITION_PAIR_VERIFY'),'quick seek evidence mislabeled');
  assert(end1.ev.filter(e=>e.result==='WRONG').length===r1.wrong,'wrong count mismatch');
  assert(end1.code===0,'quick seek wrote FINAL SEEK (codeRed) evidence');
  assert(end1.chips>0&&end1.chips<=end1.count,'end reveal chips wrong');
  assert(end1.best===end1.count&&end1.runs===1&&end1.outbox===1,'run summary/best not stored');
  assert(r1.ms>=19000,'pair round ended before 20s ('+r1.ms+'ms)');
  const wrongAfter=await page.evaluate(()=>validWords().reduce((a,w)=>a+(w.wrong||0),0));
  assert(wrongAfter-wrongBefore===end1.ev.filter(e=>e.result==='WRONG').length,'weak signal not recorded for wrong taps');
  await page.click('[data-qs-again]');
  await page.waitForSelector('[data-hs-qs-run]');
  await page.click('[data-qs-hub]').catch(()=>{});
  await page.evaluate(()=>HideQuickSeekV1.open());
  const r2=await play('letter',{shotAt:0,wrongEvery:3});notes.push('letter round '+JSON.stringify(r2));
  await page.screenshot({path:path.join(shots,'05-end-letter.png')});
  const r3=await play('flash',{shotAt:1,wrongEvery:3});notes.push('flash round '+JSON.stringify(r3));
  assert(r3.ms>=29000,'flash round ended early');
  // abandon mid-run: back button kills timers, no errors afterwards
  await page.evaluate(()=>HideQuickSeekV1.start('letter'));
  await page.waitForSelector('.hs-qs-stage [data-qs-pick]:not([disabled])');
  await page.click('.hs-qs-stage [data-qs-pick]');
  await sleep(200);
  await page.evaluate(()=>{currentTab='home';viewStack=[];render()});
  await sleep(3000);
  const ab=await page.evaluate(()=>({active:HideQuickSeekV1.activeRun(),last:S.quickSeek.runs.at(-1).status,home:!!document.querySelector('.hs-home')}));
  assert(!ab.active&&ab.last==='ABANDONED'&&ab.home,'abandon not handled '+JSON.stringify(ab));
  // safe point: blocked while playing, released after
  const safeBase=await page.evaluate(()=>HideSeekPwaSafePoint());
  await page.evaluate(()=>HideQuickSeekV1.start('pair'));await sleep(2600);
  assert(await page.evaluate(()=>HideSeekPwaSafePoint()===false),'PWA update allowed during an active round');
  await page.evaluate(()=>{currentTab='home';viewStack=[];render()});await sleep(300);
  assert(await page.evaluate(()=>HideSeekPwaSafePoint())===safeBase,'safe point not released after leaving round');

  // ---------- 판정 고치기 ----------
  await page.evaluate(()=>{S.codeRed.history.push({wordId:validWords()[0].id,type:'WRONG',at:new Date(Date.now()-60000).toISOString(),hintLevel:0,wrongAttempts:1});save();currentTab='catch';viewStack=[];render()});
  await page.waitForSelector('[data-hs-play-rec=fix]');
  await page.screenshot({path:path.join(shots,'06-records-entries.png'),fullPage:false});
  const statOf=()=>page.evaluate(()=>Number((document.querySelector('.hs-discovery-log')?.innerText.match(/(\d+)\s*\n\s*도움 없이/)||[])[1]));
  const indepBefore=await statOf();
  await page.click('[data-hs-play-rec=fix]');
  await page.waitForSelector('#hsGcGateInput');
  await page.screenshot({path:path.join(shots,'07-gate.png')});
  await page.fill('#hsGcGateInput','1');await page.click('[data-gc-ok]');
  assert((await page.textContent('#hsGcGateMsg')).length>0,'gate accepted a wrong answer');
  const q=await page.textContent('.hs-gc-q');const [a,b]=q.match(/\d+/g).map(Number);
  await page.fill('#hsGcGateInput',String(a*b));await page.click('[data-gc-ok]');
  await page.waitForSelector('.hs-gc-list');
  await page.screenshot({path:path.join(shots,'08-gc-list.png')});
  const target=await page.evaluate(()=>{const e=S.learning.history.find(x=>x.mode==='quick-seek'&&x.result==='WRONG');return {key:e.eventId,snap:JSON.stringify(e),wordId:e.wordId,wrong:validWords().find(w=>w.id===e.wordId).wrong}});
  await page.click('[data-gc-filter=wrong]');
  await page.click('[data-gc-fix="'+target.key+'"]');
  await page.waitForSelector('.hs-gc-reasons');
  await page.screenshot({path:path.join(shots,'09-gc-fix.png')});
  await page.click('.hs-gc-reasons label:nth-child(2)');
  await page.click('[data-gc-save]');
  await page.waitForSelector('.hs-gc-list');
  const c1=await page.evaluate(t=>({snap:JSON.stringify(S.learning.history.find(x=>x.eventId===t.key)),log:S.gradingCorrections,wrong:validWords().find(w=>w.id===t.wordId).wrong,out:(S.takyLearningOutbox||[]).filter(e=>e.type==='GRADING_CORRECTION').length,fixedRow:!!document.querySelector('[data-gc-fix="'+t.key+'"]')?.closest('.is-fixed')}),target);
  assert(c1.snap===target.snap,'original event was modified by correction');
  assert(c1.log.length===1&&c1.log[0].originalResult==='WRONG'&&c1.log[0].correctedResult==='CORRECT'&&c1.log[0].actorRole==='PARENT'&&c1.log[0].targetKey===target.key,'correction event malformed '+JSON.stringify(c1.log));
  assert(c1.wrong===Math.max(0,target.wrong-1),'weak counter not adjusted');
  assert(c1.out===1,'correction not emitted to shared learning bridge');
  await page.click('[data-gc-filter=fixed]');
  assert(await page.locator('.hs-gc-item.is-fixed').count()===1,'fixed filter wrong');
  await page.screenshot({path:path.join(shots,'10-gc-fixed.png')});
  await page.click('[data-gc-undo="'+target.key+'"]');
  const c2=await page.evaluate(t=>({log:S.gradingCorrections,wrong:validWords().find(w=>w.id===t.wordId).wrong,eff:HideGradingCorrectionV1.effective(S.learning.history.find(x=>x.eventId===t.key)).result}),target);
  assert(c2.log.length===2&&c2.log[1].kind==='GRADING_CORRECTION_REVERT'&&c2.log[1].supersedes===c2.log[0].correctionId,'revert not appended');
  assert(c2.wrong===target.wrong&&c2.eff==='WRONG','revert did not restore');
  // FINAL SEEK verdict correction flows into the records view (effective, original untouched)
  const codeKey=await page.evaluate(()=>{const it=HideGradingCorrectionV1.collect().find(i=>i.source==='codeRed');return it.key});
  await page.evaluate(k=>HideGradingCorrectionV1._applyForTest(k,'CORRECT','INPUT_MISREAD'),codeKey);
  await page.evaluate(()=>{currentTab='catch';viewStack=[];render()});
  await page.waitForSelector('.hs-discovery-log');
  const rec=await page.evaluate(()=>({orig:S.codeRed.history.at(-1).type}));
  const indepAfter=await statOf();
  assert(Number.isFinite(indepBefore)&&indepAfter===indepBefore+1,'records did not use corrected FINAL SEEK verdict '+indepBefore+'->'+indepAfter);
  assert(rec.orig==='WRONG','codeRed original mutated');
  notes.push('records 도움 없이 철자 회상: '+indepBefore+' -> '+indepAfter);
  // persistence
  await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.HideGradingCorrectionV1);
  const per=await page.evaluate(()=>({n:(S.gradingCorrections||[]).length,runs:(S.quickSeek?.runs||[]).length}));
  assert(per.n===3&&per.runs>=4,'state not persisted '+JSON.stringify(per));
  // small phone
  await page.setViewportSize({width:320,height:568});
  await page.evaluate(()=>{S.onboardingDone=true;HideQuickSeekV1.open()});await sleep(200);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,'320px overflow on hub');
  await page.screenshot({path:path.join(shots,'11-hub-320.png')});
  assert(!errors.length,'page errors: '+errors.join(' | '));
  assert(!missing.length,'missing assets: '+missing.join(' | '));
 }finally{await browser.close();server.close()}
 console.log(notes.join('\n'));
 if(fail.length){console.error('QUICK_SEEK_GRADING_E2E: FAIL\n- '+fail.join('\n- '));process.exit(1)}
 console.log('QUICK_SEEK_GRADING_E2E: PASS ('+shots+')');
})().catch(e=>{console.error(e);server.close();process.exit(1)});
