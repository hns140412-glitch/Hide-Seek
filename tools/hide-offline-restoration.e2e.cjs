'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port=46850+Math.floor(Math.random()*500),fail=[];
(async()=>{
 const server=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((res,rej)=>{server.stdout.on('data',b=>String(b).includes('READY')&&res());setTimeout(()=>rej(Error('server timeout')),11000)});
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({serviceWorkers:'allow',viewport:{width:390,height:844}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;save();render()});
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,{timeout:30000});
  const cacheSafety=await page.evaluate(async()=>{
    const privateLooking=await fetch('./index.html?qa_session_key=synthetic_check_only');
    const nonPrecached=await fetch('./Hide_Seek_UI_MASTER_LOGIC_REV_04.md');
    await new Promise(r=>setTimeout(r,180));
    const keys=await caches.keys(),all=(await Promise.all(keys.map(async k=>(await (await caches.open(k)).keys()).map(x=>x.url)))).flat();
    return {queryFetched:privateLooking.ok,nonPrecachedFetched:nonPrecached.ok,
      queryCached:all.some(x=>x.includes('qa_session_key=')),
      nonPrecachedCached:all.some(x=>x.endsWith('/Hide_Seek_UI_MASTER_LOGIC_REV_04.md'))};
  });
  if(!cacheSafety.queryFetched||!cacheSafety.nonPrecachedFetched||cacheSafety.queryCached||cacheSafety.nonPrecachedCached)
    fail.push('PWA cache stored non-static or session-query resource '+JSON.stringify(cacheSafety));
  const files=await page.evaluate(async()=>{const x=await caches.keys(),entries=await Promise.all(x.map(async k=>({name:k,keys:await (await caches.open(k)).keys()})));return entries.map(x=>({name:x.name,count:x.keys.length,hanja:x.keys.some(k=>k.url.endsWith('/data/hanja-reference-practice-projection-v1.json')),forest:x.keys.some(k=>k.url.endsWith('/assets/world/hide_seek_forest_asset.png'))}))});
  if(!files.some(x=>x.hanja&&x.forest))fail.push('PWA did not cache restored source/assets '+JSON.stringify(files));
  await context.setOffline(true);await page.reload({waitUntil:'load',timeout:10000});
  await page.waitForSelector('.hs-home',{timeout:8000});
  const offline=await page.evaluate(()=>({online:navigator.onLine,cycle:!!window.HideEnglishCycleV1,hanja:!!window.HideHanjaPracticeV1,pedagogy:!!window.HideEnglishPedagogyV1,forest:getComputedStyle(document.querySelector('.hs-home')).backgroundImage}));
  if(offline.online||!offline.cycle||!offline.hanja||!offline.pedagogy)fail.push('offline scripts missing '+JSON.stringify(offline));
  await page.click('#hsBackSubjects');
  await page.click('[data-hs-subject=HANJA]');
  await page.click('[data-mode=trace]');
  await page.waitForSelector('[data-hanja-mode=TRACE]',{timeout:8000});
  const card=await page.locator('.hs-hanja-big').first().textContent();
  if(!card)fail.push('offline Hanja card not loaded');
  await page.evaluate(()=>{S.sheets[0].sourceType='synthetic-qa-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};hsHomeSubject='ENGLISH';currentTab='home';render()});
  await page.click('[data-mode=recall]');
  await page.waitForSelector('#hsRecallAnswer',{timeout:8000});
  if(!await page.locator('#hsRecallAnswer').isVisible())fail.push('offline typed RECALL not usable');
  if(errors.length)fail.push('browser error '+errors.slice(0,3).join(' | '));
  console.log(JSON.stringify({cache:files,offline,first_hanja_char:card,errors,failures:fail},null,2));
  await context.close();
 }catch(e){fail.push('HARNESS '+e.stack)}
 finally{await browser?.close().catch(()=>{});server.kill()}
 if(fail.length){console.error('HIDE_OFFLINE FAIL '+fail.join('\n'));process.exitCode=1}
 else console.log('HIDE_OFFLINE PASS: PWA forest and Hanja restored sources cached and usable offline');
})().catch(e=>{console.error(e);process.exitCode=1});