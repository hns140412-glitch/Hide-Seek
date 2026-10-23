'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port=44700+Math.floor(Math.random()*1000);
const fails=[];
const assert=(ok,msg)=>{if(!ok)fails.push(msg)};
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((ok,no)=>{srv.stdout.on('data',d=>String(d).includes('READY')&&ok());srv.on('exit',()=>no(new Error('local host exited')));setTimeout(()=>no(new Error('local host timeout')),10000)});
 let browser;
 try{
   browser=await chromium.launch({headless:true,channel:'chrome',timeout:20000});
   const fresh=async query=>{
     const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
     const page=await context.newPage();
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     await page.goto('http://127.0.0.1:'+port+'/index.html'+query,{waitUntil:'load'});
     await page.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';render()});
     await page.waitForSelector('.hs-mode-sign');
     return {page,context,errors};
   };
   // Known grade => 6 subjects, subject-specific Learning Engine cards.
   const grade=await fresh('?school_grade=5');
   const pg=grade.page;
   assert(await pg.locator('.hs-mode-sign').count()===4,'direct Home should default to English four modes');
   await pg.click('#hsBackSubjects');
   assert(await pg.locator('.hs-subject-sign').count()===6,'subject switch should expose six subjects');
   await pg.click('[data-hs-subject=SCIENCE]');
   assert(await pg.locator('.hs-mode-sign').count()===4,'science should have four modes');
   await pg.click('[data-mode=trace]');
   await pg.waitForSelector('#termTraceReveal',{timeout:30000});
   const science=await pg.evaluate(()=>{const s=HideTermDecoderV1.snapshot();return {subject:s.selectedSubject,projection:s.engineProjection?.subject,source:s.engineProjection?.source_kind,grade:s.engineProjection?.school_stage,cards:s.cards.length,foreign:s.cards.filter(x=>x.subject!=='SCIENCE').length,evidence:s.evidence.length}});
   assert(science.subject==='SCIENCE'&&science.projection==='SCIENCE'&&science.grade==='E5'&&science.cards>0&&science.foreign===0,'science projection wrong '+JSON.stringify(science));
   assert(science.evidence===0,'science TRACE is pre-scored before exposure');
   await pg.click('#termTraceReveal');
   const exposed=await pg.evaluate(()=>HideTermDecoderV1.snapshot().evidence.at(-1));
   assert(exposed?.result==='EXPOSED'&&exposed.subject==='SCIENCE'&&exposed.mode==='TRACE','TRACE evidence not correctly attributed');
   for(const [mode,expected] of [['link','.term-decoder-shell .phase-chip'],['core','[data-core-index]'],['recall','[data-recall-index]']]){
     await pg.evaluate(()=>{currentTab='home';render()});
     await pg.click('[data-mode='+mode+']');
     await pg.waitForSelector(expected,{timeout:30000});
     const actual=await pg.locator('.term-decoder-shell .phase-chip').first().textContent();
     assert(actual.trim()===mode.toUpperCase(),'SCIENCE '+mode+' opened wrong mode '+actual);
   }
   await pg.evaluate(()=>{currentTab='home';render()});
   await pg.click('#hsBackSubjects');
   await pg.click('[data-hs-subject=KOREAN]');
   await pg.click('[data-mode=core]');
   await pg.waitForSelector('[data-core-index]',{timeout:30000});
   const korean=await pg.evaluate(()=>{const s=HideTermDecoderV1.snapshot();return {subject:s.selectedSubject,projection:s.engineProjection?.subject,cards:s.cards.length,foreign:s.cards.filter(x=>x.subject!=='KOREAN').length}});
   assert(korean.subject==='KOREAN'&&korean.projection==='KOREAN'&&korean.cards>0&&korean.foreign===0,'KOREAN projection contaminated '+JSON.stringify(korean));
   const otherSubjects={};
   for(const [subject,mode,selector] of [['SOCIAL','link','.term-decoder-shell'],['MATH','recall','[data-recall-index]']]){
     await pg.evaluate(()=>{currentTab='home';render()});
     await pg.click('#hsBackSubjects');
     await pg.click('[data-hs-subject='+subject+']');
     await pg.click('[data-mode='+mode+']');
     await pg.waitForSelector(selector,{timeout:30000});
     const snap=await pg.evaluate(()=>{const s=HideTermDecoderV1.snapshot();return {subject:s.selectedSubject,projection:s.engineProjection?.subject,count:s.cards.length,foreign:s.cards.filter(x=>x.subject!==s.selectedSubject).length}});
     otherSubjects[subject]=snap;
     assert(snap.subject===subject&&snap.projection===subject&&snap.count>0&&snap.foreign===0,subject+' route contaminated '+JSON.stringify(snap));
   }
   await pg.evaluate(()=>{currentTab='home';render()});
   await pg.click('#hsBackSubjects');
   await pg.click('[data-hs-subject=HANJA]');
   await pg.click('[data-mode=core]');
   await pg.waitForSelector('[data-hanja-mode=CORE]',{timeout:15000});
   const hanja=await pg.evaluate(()=>({mode:document.querySelector('[data-hanja-mode]')?.dataset.hanjaMode,source:HideHanjaPracticeV1.status(),termDecoderVisible:!!document.querySelector('.term-decoder-shell')}));
   assert(hanja.mode==='CORE'&&hanja.source.cards>=16&&!hanja.termDecoderVisible,'HANJA must run source-bound reference practice rather than masquerading as another subject');
   assert(grade.errors.length===0,'grade5 page errors '+grade.errors.join('; '));
   await grade.context.close();
   // No grade => no silent stage guess, no scored curriculum.
   const noGrade=await fresh('');
   await noGrade.page.click('#hsBackSubjects');
   await noGrade.page.click('[data-hs-subject=SOCIAL]');
   await noGrade.page.click('[data-mode=recall]');
   const noGradeMsg=await noGrade.page.locator('#hsHomeNotice').textContent();
   const noGradeEvidence=await noGrade.page.evaluate(()=>HideTermDecoderV1.snapshot().evidence.length);
   assert(noGradeMsg.includes('학년 확인')&&noGradeEvidence===0,'unresolved grade is scored/routed');
   assert(noGrade.errors.length===0,'no-grade page errors '+noGrade.errors.join('; '));
   await noGrade.context.close();
   // Ready assignment must not be credited to another subject.
   const ready=await fresh('?school_grade=5&subject=SCIENCE&session_id=synthetic-qa');
   assert((await ready.page.locator('#hsSubjectContext').textContent()).includes('과학'),'Ready subject should take precedence');
   await ready.page.click('#hsBackSubjects');
   await ready.page.click('[data-hs-subject=KOREAN]');
   await ready.page.click('[data-mode=link]');
   const readyMsg=await ready.page.locator('#hsHomeNotice').textContent();
   assert(readyMsg.includes('Ready')&&readyMsg.includes('과목'),'Ready mismatch not protected');
   assert(ready.errors.length===0,'Ready page errors '+ready.errors.join('; '));
   await ready.context.close();
   console.log(JSON.stringify({SCIENCE:science,KOREAN:korean,OTHER_SUBJECTS:otherSubjects,HANJA_NOTICE:hanja,NO_GRADE:noGradeMsg,READY_MISMATCH:readyMsg,errors:[],failures:fails},null,2));
 }catch(e){fails.push('HARNESS '+e.stack);console.error(e.stack)}
 finally{await browser?.close().catch(()=>{});srv.kill()}
 if(fails.length){console.error('HIDE_SUBJECT_ROUTING_FAIL '+fails.join('\n'));process.exitCode=1}
 else console.log('HIDE_SUBJECT_ROUTING PASS: six subjects + typed projections + age/grade gate + Ready boundary');
})().catch(e=>{console.error(e);process.exitCode=1});