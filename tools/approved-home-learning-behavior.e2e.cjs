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
  await page.waitForSelector('.hs-home');
  const forest=await page.evaluate(async()=>{const raw=getComputedStyle(document.querySelector('.hs-home')).backgroundImage;const src=raw.slice(5,-2);const img=new Image();img.src=src;await img.decode();return {loaded:img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight}});
  assert(forest.loaded,'forest image failed to load');
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_HOME_CLAUDE_20261016.png'});
  const home=await page.evaluate(()=>({
    buttons:[...document.querySelectorAll('.hs-subject-sign')].map(e=>({label:e.textContent,subject:e.dataset.hsSubject,rect:e.getBoundingClientRect().toJSON()})),
    bg:getComputedStyle(document.querySelector('.hs-home')).backgroundImage,
    overflow:document.documentElement.scrollWidth-innerWidth,
    topHidden:getComputedStyle(document.querySelector('.top-safe')).display,
    menuHidden:document.querySelector('#hsMenu').hidden
  }));
  assert(home.buttons.length===6,'home must show six subjects');
  assert(home.buttons.map(x=>x.subject).join(',')==='ENGLISH,KOREAN,HANJA,SOCIAL,SCIENCE,MATH','subject order/labels changed');
  assert(home.bg.includes('hide_seek_forest_asset.png'),'approved background missing');
  assert(home.overflow<=0,'home horizontal overflow '+home.overflow);
  assert(home.topHidden==='none','old header visible');
  assert(home.buttons.every(x=>x.rect.right<=391&&x.rect.left>=0&&x.rect.bottom<=845),'button outside viewport');
  assert(await page.evaluate(()=>getComputedStyle(document.querySelector('#takyCrewSelectionLauncher')).display==='none'),'crew launcher overlaps approved HOME');
  for(const vp of [{width:320,height:568},{width:1024,height:768}]){
    await page.setViewportSize(vp);
    const check=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,buttons:[...document.querySelectorAll('.hs-subject-sign')].map(e=>e.getBoundingClientRect().toJSON())}));
    assert(check.overflow<=0&&check.buttons.every(b=>b.left>=0&&b.right<=vp.width&&b.top>=0&&b.bottom<=vp.height),'bad viewport '+JSON.stringify({vp,check}));
  }
  await page.setViewportSize({width:390,height:844});
  await page.click('#hsMenuBtn');assert(await page.locator('#hsMenu').isVisible(),'menu failed');await page.click('[data-hs-menu=close]');
  await page.click('[data-hs-subject="ENGLISH"]');
  assert(await page.locator('.hs-mode-sign').count()===4,'selected subject should show four learning modes');
  assert(await page.locator('#hsBackSubjects').count()===1,'subject back button missing');
  async function mode(id,selector,phase){
    await page.evaluate(()=>{currentTab='home';viewStack=[];render()});
    await page.click('[data-mode='+id+']');
    await page.waitForSelector(selector);
    const actual=await page.evaluate(()=>S.learning.phase);
    assert(actual===phase,'mode '+id+' wrong phase '+actual);
  }
  await mode('trace','#firstNext','first');
  await mode('link','.tile-eng','connection');
  await mode('core','[data-core]','core');
  const before=await page.evaluate(()=>({w:validWords().map(w=>({id:w.id,wrong:w.wrong,hint:w.hint})),history:S.learning.history.length}));
  const wrong=page.locator('[data-core]').filter({hasText:'__impossible__'});
  const state=await page.evaluate(()=>{const btns=[...document.querySelectorAll('[data-core]')], w=validWords().find(x=>x.kor===document.querySelector('.word-card .kor').textContent);return {correct:w.id,wrongId:btns.find(b=>b.dataset.core!==w.id)?.dataset.core}});
  assert(!!state.wrongId,'no wrong option in CORE');
  await page.click('[data-core="'+state.wrongId+'"]');
  const wrongResult=await page.evaluate(()=>S.learning.history.at(-1)?.result);
  assert(wrongResult==='WRONG_ATTEMPT','wrong core result missing: '+wrongResult);
  await page.click('[data-core="'+state.correct+'"]');
  const afterResult=await page.evaluate(()=>S.learning.history.at(-1)?.result);
  assert(afterResult==='WRONG','wrong then correct got unassisted credit: '+afterResult);
  await mode('core','[data-core]','core');
  for(let i=0;i<3;i++) await page.click('#coreHint');
  const leak=await page.evaluate(()=>{
    const first=document.querySelector('.core-box')?.textContent.trim().toLowerCase(),options=[...document.querySelectorAll('[data-core]')].map(el=>el.textContent.toLowerCase());
    return {first,remaining:options.filter(s=>s.startsWith(first)).length,hints:document.querySelector('#coreFeedback')?.textContent};
  });
  assert(!(leak.first&&leak.remaining===1),'CORE hint makes answer unique via first letter '+JSON.stringify(leak));
  await mode('recall','#codeHint','code');
  const snap=()=>page.evaluate(()=>({selected:document.querySelectorAll('.letter-key.selected').length,filled:document.querySelectorAll('.slot.filled').length,n:Object.keys(codeSession.answers).length}));
  for(let n=0;n<3;n++){await page.click('#codeHint');const a=await snap();assert(a.selected===0&&a.filled===0&&a.n===0,'RECALL hint leaks '+JSON.stringify(a))}
  assert(errors.length===0,'page errors: '+errors.join('; '));
  console.log(JSON.stringify({home,core_wrong_followup:afterResult,core_hint:leak,errors,failures:fail},null,2));
  await ctx.close();
 }catch(e){fail.push('harness: '+e.stack);console.error(fail.join('\n'))}
 finally{await browser?.close().catch(()=>{});server.kill();}
 if(fail.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});