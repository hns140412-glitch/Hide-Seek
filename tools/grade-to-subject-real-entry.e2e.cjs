'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core'),{spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',port=49800+Math.floor(Math.random()*200);
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((yes,no)=>{srv.stdout.on('data',b=>String(b).includes('READY')&&yes());srv.on('exit',()=>no(Error('host stopped')));setTimeout(()=>no(Error('host timeout')),9000)});
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.waitForSelector('#profileName');
  await page.fill('#profileName','테스트 탐험가');
  await page.selectOption('#profileGrade','5');
  await page.screenshot({path:'D:/Git PWA/Hide & Seek/.local/HIDE_GRADE_ONBOARDING_20261017.png'});
  await page.click('#nextProfileName');
  const first=await page.evaluate(()=>({name:S.profile.displayName,grade:S.profile.school_grade,stage:S.profile.school_stage}));
  if(first.grade!==5||first.stage!=='elementary')throw Error('grade not saved from onboarding '+JSON.stringify(first));
  await page.evaluate(()=>{S.onboardingDone=true;currentTab='home';hsHomeSubject='ENGLISH';render()});
  await page.click('#hsBackSubjects');
  await page.click('[data-hs-subject=SCIENCE]');
  await page.click('[data-mode=trace]');
  await page.waitForSelector('.term-decoder-shell',{timeout:15000});
  const learned=await page.evaluate(()=>{const r=HideTermDecoderV1.snapshot();return {subject:r.selectedSubject,projection:r.engineProjection?.subject,cards:r.cards?.length||0,grade:r.gradeContext?.grade}});
  if(learned.subject!=='SCIENCE'||learned.projection!=='SCIENCE'||learned.cards===0)throw Error('grade 5 science not projected '+JSON.stringify(learned));
  await page.evaluate(()=>{currentTab='home';hsHomeSubject='ENGLISH';render()});
  await page.click('#hsMenuBtn');await page.click('[data-hs-menu=settings]');await page.waitForSelector('#settingSchoolGrade');
  await page.selectOption('#settingSchoolGrade','4');
  await page.click('#saveSettings');
  const revised=await page.evaluate(()=>({grade:S.profile.school_grade,stage:S.profile.school_stage}));
  if(revised.grade!==4)throw Error('grade change not saved '+JSON.stringify(revised));
  await page.click('#hsBackSubjects');
  await page.click('[data-hs-subject=KOREAN]');await page.click('[data-mode=trace]');
  await page.waitForSelector('.term-decoder-shell',{timeout:15000});
  const korean=await page.evaluate(()=>{const r=HideTermDecoderV1.snapshot();return {subject:r.selectedSubject,projection:r.engineProjection?.subject,cards:r.cards?.length||0,grade:r.gradeContext?.grade}});
  if(korean.subject!=='KOREAN'||korean.projection!=='KOREAN'||korean.cards===0)throw Error('grade 4 korean not projected '+JSON.stringify(korean));
  if(errors.length)throw Error('JS errors '+errors.join('; '));
  console.log(JSON.stringify({first,science:learned,settings:revised,korean,errors},null,2));
 }catch(e){console.error('GRADE_SUBJECT_REAL_BROWSER_ERROR '+e.stack);process.exitCode=1}
 finally{await browser?.close().catch(()=>{});srv.kill()}
})();