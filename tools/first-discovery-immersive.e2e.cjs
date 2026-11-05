'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core'),{spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=48800+Math.floor(Math.random()*200);
const fail=msg=>{throw Error(msg)};
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((ok,err)=>{srv.stdout.on('data',d=>String(d).includes('READY')&&ok());srv.on('exit',()=>err(Error('host stopped')));setTimeout(()=>err(Error('host timeout')),9000)});
 let browser;
 try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
 await page.evaluate(()=>{
  S.onboardingDone=true;S.settings.partnerVoice=false;
  S.sheets[0].sourceType='synthetic-qa-confirmed';S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};
  currentTab='home';S.learning=clone(DEFAULT_STATE.learning);
  render();
 });
 await page.waitForTimeout(300);
 await page.evaluate(()=>renderFirstContact());
 await page.waitForSelector('#hsFirstFlip',{timeout:7000});
 const before=await page.evaluate(()=>({answerHidden:document.querySelector('#hsFirstAnswer').hidden,history:S.learning.history.length,caseMastery:sheet().caseMastery,checkTop:document.querySelector('#firstNext').getBoundingClientRect().bottom,navTop:document.querySelector('#bottomNav').getBoundingClientRect().top,partner:getComputedStyle(document.querySelector('#partnerBar')).display,overflow:document.documentElement.scrollWidth-innerWidth}));
 if(!before.answerHidden||before.partner!=='none'||before.overflow>0||before.checkTop>before.navTop)fail('FirstContact UX obstructed '+JSON.stringify(before));
 await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_FIRST_DISCOVERY_BEFORE_20261017.png'});
 await page.click('#hsFirstFlip');
 const reveal=await page.evaluate(()=>({revealed:!document.querySelector('#hsFirstAnswer').hidden,history:S.learning.history.length,expanded:document.querySelector('#hsFirstFlip').getAttribute('aria-expanded'),overflow:document.documentElement.scrollWidth-innerWidth}));
 if(!reveal.revealed||reveal.history!==before.history||reveal.expanded!=='true'||reveal.overflow>0)fail('Leaf flip not unscored and interactive '+JSON.stringify(reveal));
 await page.waitForTimeout(260);
 await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_FIRST_DISCOVERY_OPEN_20261017.png'});
 await page.click('#firstUnsure');
 const result=await page.evaluate(()=>({record:S.learning.history.at(-1),firstIndex:S.learning.firstIndex,mastery:sheet().caseMastery,view:document.querySelector('.hs-first-story')?.getAttribute('aria-label')}));
 if(result.record.result!=='REVISIT_REQUESTED'||result.record.scoreAuthority!=='EXPOSURE_ONLY'||!result.record.revealed||result.mastery!==before.caseMastery)fail('TRACE falsely scores exposure '+JSON.stringify(result));
 await page.click('#firstNext');
 const skip=await page.evaluate(()=>S.learning.history.at(-1));
 if(skip.result!=='SKIPPED_UNOBSERVED'||skip.heard||skip.revealed||skip.scoreAuthority!=='EXPOSURE_ONLY')fail('Unopened leaf incorrectly counted as exposure '+JSON.stringify(skip));
 console.log(JSON.stringify({before,reveal,result,skip,errors},null,2));
 if(errors.length)fail('JS runtime '+errors.join('; '));
 await ctx.close();
 }catch(e){console.error('FIRST_DISCOVERY_BROWSER_ERROR',e.stack);process.exitCode=1}
 finally{await browser?.close().catch(()=>{});srv.kill()}
})();