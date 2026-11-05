'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core'),{spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=49300+Math.floor(Math.random()*200);
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((ok,no)=>{srv.stdout.on('data',b=>String(b).includes('READY')&&ok());srv.on('exit',()=>no(Error('host stopped')));setTimeout(()=>no(Error('host timeout')),9000)});
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;hsHomeSubject='ENGLISH';currentTab='home';render()});
  await page.waitForSelector('#hsHomeQuick');
  const noSource=await page.locator('#hsHomeQuick').innerText();
  if(!noSource.includes('시험지로 시작'))throw Error('no-source quick entrance mislabeled '+noSource);
  await page.click('#hsHomeQuick');await page.waitForSelector('#cameraSheet');
  await page.evaluate(()=>{S.sheets[0].sourceType='synthetic-qa-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};currentTab='home';hsHomeSubject='ENGLISH';render()});
  await page.waitForSelector('#hsHomeQuick');
  await page.waitForLoadState('networkidle');
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_HOME_WITH_CONTINUE_20261017.png'});
  const ready=await page.evaluate(()=>({modes:document.querySelectorAll('.hs-mode-sign').length,quick:document.querySelector('#hsHomeQuick').textContent,
    quickRect:document.querySelector('#hsHomeQuick').getBoundingClientRect().toJSON(),
    signs:[...document.querySelectorAll('.hs-mode-sign')].map(x=>x.getBoundingClientRect().toJSON()),overflow:document.documentElement.scrollWidth-innerWidth}));
  if(ready.modes!==4||!ready.quick.includes('이어서')||ready.overflow>0)throw Error('Home entry hidden '+JSON.stringify(ready));
  const overlap=ready.signs.some(r=>Math.min(r.right,ready.quickRect.right)-Math.max(r.left,ready.quickRect.left)>0&&Math.min(r.bottom,ready.quickRect.bottom)-Math.max(r.top,ready.quickRect.top)>0);
  if(overlap)throw Error('Home continue button overlaps Golden learning signs');
  await page.click('#hsHomeQuick');await page.waitForSelector('.hs-journey');
  const next=await page.evaluate(()=>({phase:S.learning.phase,steps:document.querySelectorAll('.hs-journey-trail li').length}));
  if(next.steps!==6||errors.length)throw Error('Home->forest journey broken '+JSON.stringify({next,errors}));
  console.log(JSON.stringify({noSource,ready,next,errors},null,2));
 }catch(e){console.error('HOME_QUICK_UX_ERROR '+e.stack);process.exitCode=1}
 finally{await browser?.close().catch(()=>{});srv.kill()}
})();