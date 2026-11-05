'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core'),{spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=48600+Math.floor(Math.random()*300);
const assert=(v,label)=>{if(!v)throw Error(label)};
(async()=>{
 const server=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((ok,fail)=>{server.stdout.on('data',v=>String(v).includes('READY')&&ok());server.on('exit',()=>fail(Error('server exited')));setTimeout(()=>fail(Error('host timeout')),8500)});
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;S.sheets[0].sourceType='synthetic-qa-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};currentTab='study';S.learning=clone(DEFAULT_STATE.learning);render()});
  await page.waitForSelector('.hs-journey');
  const intro=await page.evaluate(()=>({stageCount:document.querySelectorAll('.hs-journey-trail li').length,first:document.querySelector('.hs-journey-trail li.here')?.innerText,background:getComputedStyle(document.querySelector('.hs-journey-scene')).backgroundImage,overflow:document.documentElement.scrollWidth-innerWidth,controls:document.querySelector('#hsJourneyGo').getBoundingClientRect().toJSON(),nav:document.querySelector('#bottomNav').getBoundingClientRect().toJSON(),partnerHidden:getComputedStyle(document.querySelector('#partnerBar')).display}));
  assert(intro.stageCount===6&&intro.background.includes('hide_seek_forest_asset.png')&&!intro.overflow&&intro.controls.bottom<intro.nav.top&&intro.partnerHidden==='none','six-stage primary action obstructed or design mismatch '+JSON.stringify(intro));
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_SIX_STAGE_JOURNEY_20261017.png',fullPage:false});
  await page.click('#hsJourneyGo');
  await page.waitForSelector('#firstNext');
  const n=await page.evaluate(()=>validWords().length);
  for(let i=0;i<n;i++)await page.click('#firstNext');
  await page.waitForSelector('[data-choice]');
  assert(await page.evaluate(()=>S.learning.phase)==='meaning','FIRST FIND did not transition to meaning');
  // Choose a deliberately incorrect meaning. No accidental fever success or fake mastered state.
  for(let i=0;i<n;i++){
    const id=await page.evaluate(()=>{const w=validWords()[S.learning.meaningIndex%validWords().length];return [...document.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice!==w.id)?.dataset.choice});
    assert(id,'no wrong meaning candidate '+i);
    await page.click('[data-choice="'+id+'"]');
    await page.waitForTimeout(390);
  }
  await page.waitForSelector('.tile-eng');
  assert(await page.evaluate(()=>S.learning.phase)==='connection','MEANING did not transition to LINK');
  const maxRounds=Math.ceil(n/4);
  for(let round=0;round<maxRounds;round++){
    const ids=await page.evaluate(()=>[...document.querySelectorAll('.tile-eng')].map(x=>x.dataset.id));
    for(const id of ids){await page.click('.tile-eng[data-id="'+id+'"]');await page.click('.tile-kor[data-id="'+id+'"]')}
    await page.click('#connectionNext');
  }
  await page.waitForSelector('#weakToCode');
  assert(await page.evaluate(()=>S.learning.phase)==='weak','LINK did not transition to weakness priority');
  await page.click('#weakToCode');
  await page.waitForSelector('#passCode');
  for(let i=0;i<n;i++){await page.click('#passCode');if(i<n-1)await page.waitForSelector('#passCode')}
  await page.waitForSelector('#retryCode');
  const end=await page.evaluate(()=>({phase:S.learning.phase,retrace:S.codeRed.retrace.length,hits:(document.querySelector('#view')?.innerText||'').match(/CODE\s+RED|수사|사건\s*파일/g)||[],overflow:document.documentElement.scrollWidth-innerWidth}));
  assert(end.phase==='retrace'&&end.retrace===n&&!end.hits.length&&end.overflow<=0,'end-to-end SEEK AGAIN state '+JSON.stringify(end));
  await page.evaluate(()=>{currentTab='study';render()});
  const resume=await page.evaluate(()=>({phase:S.learning.phase,selected:document.querySelector('.hs-journey-trail li.here')?.textContent,stageCount:document.querySelectorAll('.hs-journey-trail li').length}));
  assert(resume.stageCount===6&&resume.phase==='retrace'&&resume.selected.includes('다시 찾아보기'),'journey must resume SEEK AGAIN at phase six');
  await page.click('#hsJourneyGo');
  await page.waitForSelector('#retryCode');
  assert(await page.locator('.retrace-item').count()===n,'returned SEEK AGAIN lost weak word list');
  await ctx.close();
  console.log(JSON.stringify({intro,words:n,rounds:maxRounds,final:end,resume,errors},null,2));
  if(errors.length)process.exitCode=1;
 }catch(e){console.error('SIX_STAGE_BROWSER_FAIL '+e.stack);process.exitCode=1}
 finally{await browser?.close().catch(()=>{});server.kill()}
})();