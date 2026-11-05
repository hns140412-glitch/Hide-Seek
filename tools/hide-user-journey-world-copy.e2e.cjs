'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');const path=require('node:path');
const root=path.resolve(__dirname,'..');const host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port=48400+Math.floor(Math.random()*250);
const bad=/(?:수사|사건\s*파일|체포|검거|범인|경찰|형사|CODE\s+RED|ZPD\s*WORD|내 ZPD 프로필)/i;
(async()=>{
 const server=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((ok,fail)=>{server.stdout.on('data',d=>String(d).includes('READY')&&ok());server.on('exit',()=>fail(Error('host stopped')));setTimeout(()=>fail(Error('host timeout')),9000)});
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,timeout:15000});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  const screens=await page.evaluate(()=>{
   const pages=[];
   function record(name){
    const text=document.querySelector('#view')?.innerText||'';
    const root=document.querySelector('body')?.innerText||'';
    const forbidden=/수사|사건\s*파일|체포|검거|범인|경찰|형사|CODE\s+RED|ZPD\s*WORD|내 ZPD 프로필/gi;
    const hits=[...root.matchAll(forbidden)].map(x=>x[0]);
    pages.push({name,hits,visibleTextLength:text.length,scrollX:document.documentElement.scrollWidth-innerWidth});
   }
   S.settings.partnerVoice=false;
   for(const n of [0,1,2,3]){S.onboardingDone=false;S.onboardingStep=n;renderOnboarding();record('onboarding-'+n);}
   S.onboardingDone=true;S.sheets[0].sourceType='qa-fixture-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};S.activeSheetId='sample';currentTab='home';
   render();record('home');
   renderSheets();record('sheets');
   renderLearningHub();record('learning-hub');
   renderFirstContact();record('first-find');
   renderMeaningCheck();record('meaning-clue');
   renderConnection();record('connection-trail');
   renderWeak();record('hidden-words');
   startCodeRed(false);record('final-seek');
   stopCodeTimer();renderRetrace();record('seek-again');
   renderRecords();record('records');
   openSettings();record('settings');
   return pages;
  });
  const failures=screens.filter(x=>x.hits.length||x.scrollX>0);
  console.log(JSON.stringify({screens,errors,failures},null,2));
  if(errors.length||failures.length)process.exitCode=1;
  await context.close();
 }catch(e){console.error(e.stack);process.exitCode=2}
 finally{await browser?.close().catch(()=>{});server.kill()}
})();