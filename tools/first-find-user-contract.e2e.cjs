'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const ledger=JSON.parse(fs.readFileSync(path.join(root,'docs','HIDE_USER_DECISION_PROVENANCE_20261017.json'),'utf8'));
if(!ledger.decisions.some(x=>x.id==='FIRST_FIND_DISTINCTION'&&x.status==='USER_DIRECT'))throw Error('USER_FIRST_FIND_SOURCE_NOT_FOUND');
const port=45170+Math.floor(Math.random()*350),faults=[];
const requireState=(test,msg)=>{if(!test)faults.push(msg)};
(async()=>{
 const server=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 server.stderr.on('data',b=>process.stderr.write(String(b).slice(0,600)));
 let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.on('data',b=>String(b).includes('READY')&&resolve());server.on('exit',()=>reject(Error('HOST_EXIT')));setTimeout(()=>reject(Error('HOST_TIMEOUT')),9000)});
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await page.evaluate(()=>{
    S.onboardingDone=true;
    S.settings.partnerVoice=false;
    S.sheets[0].sourceType='synthetic-qa-confirmed';
    S.sheets[0].recognitionMeta={reviewedAt:nowISO(),qaOnly:true};
    S.learning.history=[];
    currentTab='home';hsHomeSubject='ENGLISH';
    render();
  });
  await page.click('[data-mode=recall]');
  await page.waitForSelector('#hsRecallAnswer',{timeout:9000});
  const before=await page.evaluate(()=>({hintDisabled:document.querySelector('#hsPedagogyHint').disabled,answerHidden:document.querySelector('#hsPedagogyReveal').hidden,history:S.learning.history.length,typed:document.querySelector('#hsRecallAnswer').value}));
  requireState(before.hintDisabled&&before.answerHidden&&!before.history&&!before.typed,'FIRST_FIND_INITIAL_HINT_OR_ANSWER_LEAK '+JSON.stringify(before));
  await page.fill('#hsRecallAnswer','__wrong_initial_try__');
  await page.click('#hsPedagogyCheck');
  const wrong=await page.evaluate(()=>({hintDisabled:document.querySelector('#hsPedagogyHint').disabled,answerHidden:document.querySelector('#hsPedagogyReveal').hidden,history:S.learning.history.length}));
  requireState(!wrong.hintDisabled&&wrong.answerHidden&&wrong.history===0,'FIRST_FIND_WRONG_ATTEMPT_NOT_UNLOCKING_RETRY '+JSON.stringify(wrong));
  await page.click('#hsPedagogyHint');
  const hinted=await page.evaluate(()=>({revealed:!document.querySelector('#hsPedagogyReveal').hidden,answer:document.querySelector('#hsRecallAnswer').value}));
  requireState(!hinted.revealed&&hinted.answer==='__wrong_initial_try__','FIRST_FIND_HINT_LEAKS_ANSWER '+JSON.stringify(hinted));
  const firstWord=await page.evaluate(()=>validWords()[0].eng);
  await page.fill('#hsRecallAnswer',firstWord);
  await page.click('#hsPedagogyCheck');
  const first=await page.evaluate(()=>S.learning.history.at(-1));
  requireState(first.mode==='RECALL'&&first.result==='WRONG'&&first.retrievalStep==='FIRST_FIND'&&first.firstAttemptResult==='WRONG'&&first.hintLevel===1&&first.memorizationEvidence==='NOT_VERIFIED_IN_HIDE','FIRST_FIND_FALSE_UNASSISTED_CREDIT '+JSON.stringify(first));
  await page.click('#hsPedagogyNext');
  const secondWord=await page.evaluate(()=>validWords()[1].eng);
  const secondBefore=await page.evaluate(()=>({hintDisabled:document.querySelector('#hsPedagogyHint').disabled,revealed:!document.querySelector('#hsPedagogyReveal').hidden}));
  requireState(secondBefore.hintDisabled&&!secondBefore.revealed,'SECOND_FIRST_FIND_HINT_PREMATURE');
  await page.fill('#hsRecallAnswer',secondWord);
  await page.click('#hsPedagogyCheck');
  const second=await page.evaluate(()=>S.learning.history.at(-1));
  requireState(second.retrievalStep==='FIRST_FIND'&&second.firstAttemptResult==='CORRECT'&&second.result==='CORRECT'&&!second.hintLevel,'INDEPENDENT_FIRST_FIND_NOT_RECORDED '+JSON.stringify(second));
  await page.evaluate(()=>{currentTab='home';render()});
  await page.click('[data-mode=recall]');
  const revisit=await page.evaluate(()=>({hintDisabled:document.querySelector('#hsPedagogyHint').disabled,revealed:!document.querySelector('#hsPedagogyReveal').hidden}));
  await page.fill('#hsRecallAnswer',firstWord);
  await page.click('#hsPedagogyCheck');
  const repeated=await page.evaluate(()=>S.learning.history.at(-1));
  requireState(revisit.hintDisabled&&!revisit.revealed&&repeated.result==='CORRECT'&&repeated.retrievalStep===null,'SECOND_RETRIEVAL_MISLABELED_FIRST_FIND '+JSON.stringify(repeated));
  requireState(errors.length===0,'BROWSER_ERRORS '+errors.join('; '));
  console.log(JSON.stringify({before,wrong,hinted,first:{result:first.result,step:first.retrievalStep,firstAttempt:first.firstAttemptResult,help:first.hintLevel},second:{result:second.result,step:second.retrievalStep},repeated:{result:repeated.result,step:repeated.retrievalStep},browserErrors:errors,failures:faults},null,2));
  await ctx.close();
 }catch(error){faults.push('HARNESS '+error.stack)}
 finally{await browser?.close().catch(()=>{});server.kill()}
 if(faults.length){console.error('FIRST_FIND_USER_CONTRACT_FAIL '+faults.join('\n'));process.exitCode=1}
 else console.log('FIRST_FIND_USER_CONTRACT: first unassisted retrieval distinguished from hints, prior exposure, and repetition');
})().catch(error=>{console.error(error.stack);process.exitCode=1});
