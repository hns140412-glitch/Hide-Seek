'use strict';
const { chromium } = require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const host = 'D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port = 43000 + Math.floor(Math.random() * 1000);
const fail = [];
const assert = (v, note) => { if (!v) fail.push(note); };
(async()=>{
 const server = spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((ok,no)=>{server.stdout.on('data',b=>String(b).includes('READY')&&ok());server.on('exit',()=>no(new Error('server exited')));setTimeout(()=>no(new Error('server timeout')),10000)});
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome',timeout:15000});
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';render()});
  // Negative control: shipped demo worksheet must never become scored learner evidence.
  await page.click('[data-mode=trace]');
  assert(await page.evaluate(()=>validWords().length===0&&!document.querySelector('#firstNext')),'demo fixture was allowed into scored TRACE learning');
  assert(await page.evaluate(()=>S.learning.history.length===0),'demo fixture generated learning history');
  // Explicit isolated synthetic confirmed worksheet, never a real family/learner write.
  await page.evaluate(()=>{S.sheets[0].sourceType='synthetic-qa-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};hsHomeNotice='';render()});
  await page.waitForSelector('.hs-home');
  const forest=await page.evaluate(async()=>{const raw=getComputedStyle(document.querySelector('.hs-home')).backgroundImage;const src=raw.slice(5,-2);const img=new Image();img.src=src;await img.decode();return {loaded:img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight}});
  assert(forest.loaded,'forest image failed to load');
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_HOME_CLAUDE_20261016.png'});
  const home=await page.evaluate(()=>({
    buttons:[...document.querySelectorAll('.hs-mode-sign')].map(e=>({label:e.textContent,mode:e.dataset.mode,rect:e.getBoundingClientRect().toJSON()})),
    bg:getComputedStyle(document.querySelector('.hs-home')).backgroundImage,
    overflow:document.documentElement.scrollWidth-innerWidth,
    topHidden:getComputedStyle(document.querySelector('.top-safe')).display,
    menuHidden:document.querySelector('#hsMenu').hidden
  }));
  assert(home.buttons.length===4,'English default home must show four learning modes');
  assert(home.buttons.map(x=>x.mode).join(',')==='trace,link,core,recall','English home mode identity drift');
  assert(home.bg.includes('hide_seek_forest_asset.png'),'approved background missing');
  assert(home.overflow<=0,'home horizontal overflow '+home.overflow);
  assert(home.topHidden==='none','old header visible');
  assert(home.buttons.every(x=>x.rect.right<=391&&x.rect.left>=0&&x.rect.bottom<=845),'button outside viewport');
  assert(await page.evaluate(()=>getComputedStyle(document.querySelector('#takyCrewSelectionLauncher')).display==='none'),'crew launcher overlaps approved HOME');
  for(const vp of [{width:320,height:568},{width:1024,height:768}]){
    await page.setViewportSize(vp);
    const check=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,buttons:[...document.querySelectorAll('.hs-mode-sign')].map(e=>e.getBoundingClientRect().toJSON())}));
    assert(check.overflow<=0&&check.buttons.every(b=>b.left>=0&&b.right<=vp.width&&b.top>=0&&b.bottom<=vp.height),'bad viewport '+JSON.stringify({vp,check}));
  }
  await page.setViewportSize({width:390,height:844});
  await page.click('#hsMenuBtn');assert(await page.locator('#hsMenu').isVisible(),'menu failed');await page.click('[data-hs-menu=close]');
  assert(await page.locator('#hsBackSubjects').count()===1,'subject switch affordance missing');
  await page.click('#hsBackSubjects');
  assert(await page.locator('.hs-subject-sign').count()===6,'all six subjects must remain accessible');
  await page.click('[data-hs-subject="ENGLISH"]');
  assert(await page.locator('.hs-mode-sign').count()===4,'English mode stage did not return');
  async function mode(id,selector,phase){
    await page.evaluate(()=>{currentTab='home';viewStack=[];render()});
    await page.click('[data-mode='+id+']');
    await page.waitForSelector(selector);
    const actual=await page.evaluate(()=>S.learning.phase);
    assert(actual===phase,'mode '+id+' wrong phase '+actual);
  }
  await mode('trace','#firstNext','first');
  await mode('link','.tile-eng','connection');
  await mode('core','[data-piece-key]','core');
  assert(await page.evaluate(()=>getComputedStyle(document.querySelector('.hs-learning-forest-hero')).backgroundImage.includes('hide_seek_forest_asset.png')),'CORE forest hero scene missing');
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_CORE_ACTUAL_20261017.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'CORE horizontal overflow');
  const coreControl=await page.evaluate(()=>({check:document.querySelector('#hsPedagogyCheck').getBoundingClientRect().bottom,nav:document.querySelector('#bottomNav').getBoundingClientRect().top,bubble:getComputedStyle(document.querySelector('#partnerBar')).display}));
  assert(coreControl.check<coreControl.nav&&coreControl.bubble==='none','CORE button obscured on 390x844 '+JSON.stringify(coreControl));
  const historyBefore=await page.evaluate(()=>S.learning.history.length);
  const layout=await page.evaluate(()=>{
    const word=validWords()[0].eng.toLowerCase();
    const letters=[...document.querySelector('.hs-spelling-tiles').children].map(x=>x.classList.contains('hs-piece-slot')?'_':x.textContent);
    const blanks=letters.map((x,i)=>x==='_'?i:-1).filter(x=>x>=0);
    return {word,needed:blanks.map(i=>word[i]),tiles:[...document.querySelectorAll('.hs-piece-key')].map(k=>({id:k.dataset.pieceKey,ch:k.textContent}))};
  });
  assert(layout.needed.length>0,'CORE no spelling blanks');
  const wrongTile=layout.tiles.find(x=>x.ch!==layout.needed[0]);
  assert(!!wrongTile,'CORE negative control lacks wrong spelling tile');
  const selected=new Set([wrongTile.id]);
  await page.click('[data-piece-key="'+wrongTile.id+'"]');
  await page.click('[data-piece-slot="0"]');
  for(let i=1;i<layout.needed.length;i++){
    const tile=layout.tiles.find(k=>k.ch===layout.needed[i]&&!selected.has(k.id));
    assert(!!tile,'CORE missing necessary letter '+layout.needed[i]);
    if(!tile)continue;
    selected.add(tile.id);
    await page.click('[data-piece-key="'+tile.id+'"]');
    await page.click('[data-piece-slot="'+i+'"]');
  }
  await page.click('#hsPedagogyCheck');
  const wrongStep=await page.evaluate(()=>({history:S.learning.history.length,feedback:document.querySelector('#hsPedagogyFeedback').textContent,shown:!document.querySelector('#hsPedagogyReveal').hidden}));
  assert(wrongStep.history===historyBefore&&!wrongStep.shown,'CORE incorrect composition was graded or answer revealed early '+JSON.stringify(wrongStep));
  const correction=layout.tiles.find(x=>x.ch===layout.needed[0]&&!selected.has(x.id));
  assert(!!correction,'CORE cannot correct wrong composition');
  if(correction){
    await page.click('[data-piece-key="'+correction.id+'"]');
    await page.click('[data-piece-slot="0"]');
    await page.click('#hsPedagogyCheck');
  }
  const afterResult=await page.evaluate(()=>S.learning.history.at(-1)?.result);
  assert(afterResult==='WRONG','CORE wrong then correct got unassisted credit: '+afterResult);
  await mode('core','[data-piece-key]','core');
  for(let i=0;i<3;i++)await page.click('#hsPedagogyHint');
  const leak=await page.evaluate(()=>({
    slots:[...document.querySelectorAll('[data-piece-slot]')].map(s=>s.textContent),
    feedback:document.querySelector('#hsPedagogyFeedback').textContent,
    history:S.learning.history.length,
    answerVisible:!document.querySelector('#hsPedagogyReveal').hidden
  }));
  assert(leak.slots.every(x=>x==='_')&&!leak.answerVisible,'CORE hint auto-fills letters or reveals answer '+JSON.stringify(leak));
  await mode('recall','#hsRecallAnswer','recall');
  assert(await page.evaluate(()=>getComputedStyle(document.querySelector('.hs-learning-forest-hero')).backgroundImage.includes('hide_seek_forest_asset.png')),'RECALL forest hero scene missing');
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_RECALL_ACTUAL_20261017.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'RECALL horizontal overflow');
  const recallControl=await page.evaluate(()=>({check:document.querySelector('#hsPedagogyCheck').getBoundingClientRect().bottom,nav:document.querySelector('#bottomNav').getBoundingClientRect().top,bubble:getComputedStyle(document.querySelector('#partnerBar')).display}));
  assert(recallControl.check<recallControl.nav&&recallControl.bubble==='none','RECALL button obscured on 390x844 '+JSON.stringify(recallControl));
  const snap=()=>page.evaluate(()=>({answer:document.querySelector('#hsRecallAnswer').value,shown:!document.querySelector('#hsPedagogyReveal').hidden,history:S.learning.history.length}));
  assert(await page.locator('#hsPedagogyHint').isDisabled(),'RECALL first attempt must be unaided; hint should be unavailable');
  await page.fill('#hsRecallAnswer','__WRONG__');
  await page.click('#hsPedagogyCheck');
  const wrongRecall=await snap();
  assert(!wrongRecall.shown,'RECALL revealed answer on first wrong attempt');
  assert(await page.locator('#hsPedagogyHint').isEnabled(),'RECALL hint should unlock after first unaided attempt');
  for(let n=0;n<3;n++){await page.click('#hsPedagogyHint');const a=await snap();assert(a.answer==='__WRONG__'&&!a.shown,'RECALL hint leaks '+JSON.stringify(a))}
  const answer=await page.evaluate(()=>validWords()[0].eng);
  await page.fill('#hsRecallAnswer',answer);
  await page.click('#hsPedagogyCheck');
  const recallResult=await page.evaluate(()=>S.learning.history.at(-1)?.result);
  assert(recallResult==='WRONG','RECALL wrong then correct got independent credit '+recallResult);
  await mode('recall','#hsRecallAnswer','recall');
  await page.fill('#hsRecallAnswer',answer);
  await page.click('#hsPedagogyCheck');
  const unassisted=await page.evaluate(()=>S.learning.history.at(-1)?.result);
  assert(unassisted==='CORRECT','RECALL unassisted spelling not credited '+unassisted);
  assert(errors.length===0,'page errors: '+errors.join('; '));
  console.log(JSON.stringify({home,core_wrong_followup:afterResult,core_hint:leak,errors,failures:fail},null,2));
  await ctx.close();
 }catch(e){fail.push('harness: '+e.stack);console.error(fail.join('\n'))}
 finally{await browser?.close().catch(()=>{});server.kill();}
 if(fail.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});