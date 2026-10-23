'use strict';
// Real-Chrome behavioral check: CODE RED hints must scaffold, never reveal/auto-place the answer.
// Local only (127.0.0.1 static host). --negative-control injects the old answer-exposing hint in page memory only.
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
const negative=process.argv.includes('--negative-control');
const root=path.resolve(__dirname,'..'),host=path.resolve('D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs');
const port=41000+Math.floor(Math.random()*2000);
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg);};
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','inherit'],windowsHide:true});
 await new Promise((res,rej)=>{srv.stdout.on('data',d=>String(d).includes('READY')&&res());srv.on('exit',()=>rej(new Error('host exited')));setTimeout(()=>rej(new Error('host timeout')),8000);});
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome',timeout:15000});
  const ctx=await browser.newContext(),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
  await page.evaluate(()=>{
   S.onboardingDone=true;
   const src=S.sheets[0],id='qa-reviewed-english';
   S.sheets=[{...src,sheetId:id,title:'확인된 모의 영어 단어',sourceType:'manual',
    recognitionMeta:{reviewedAt:nowISO(),count:src.items.length},
    items:src.items.map(w=>({...w,needsReview:false,manuallyEdited:true,reviewResolution:'USER_CORRECTED'}))}];
   S.activeSheetId=id;save();startCodeRed(false);
  });
  await page.waitForSelector('#codeHint');
  if(negative)await page.evaluate(()=>{ // old behavior: highlight correct key, auto-place on 3rd hint
   $('#codeHint').onclick=()=>{codeSession.hintLevel++;const un=codeSession.blankIdx.map((_,i)=>i).filter(i=>!codeSession.answers[i]);if(!un.length)return;const slot=un[0],need=codeSession.word.eng[codeSession.blankIdx[slot]].toLowerCase(),key=codeSession.keys.find(k=>!k.used&&k.ch===need);if(!key)return;if(codeSession.hintLevel>=3)placeKey(key.id,slot);else $(`[data-key="${CSS.escape(key.id)}"]`)?.classList.add('selected');};
  });
  const snap=()=>page.evaluate(()=>({
   hintLevel:codeSession.hintLevel,answers:JSON.stringify(codeSession.answers),
   selected:document.querySelectorAll('.letter-key.selected').length,
   filled:[...document.querySelectorAll('.slot')].filter(s=>s.textContent.trim()||/filled/.test(s.className)).length,
   anyAnswer:Object.keys(codeSession.answers).filter(k=>codeSession.answers[k]).length,
   used:codeSession.keys.filter(k=>k.used).length}));
  const base=await snap();
  check(base.hintLevel===0&&base.filled===0&&base.selected===0,'unexpected baseline '+JSON.stringify(base));
  for(let n=1;n<=3;n++){
   await page.click('#codeHint');
   const s=await snap();
   check(s.hintLevel===n,`hint ${n}: hintLevel=${s.hintLevel}`);
   check(s.selected===0,`hint ${n}: ${s.selected} .letter-key.selected exposes a key`);
   check(s.filled===0,`hint ${n}: ${s.filled} slot(s) filled`);
   check(s.answers===base.answers&&s.anyAnswer===0&&s.used===0,`hint ${n}: codeSession.answers changed ${s.answers}`);
  }
  if(!negative&&failures.length===0){
   const target=await page.evaluate(()=>({id:codeSession.word.id,blanks:codeSession.blankIdx.length}));
   for(let slot=0;slot<target.blanks;slot++){
     const keyId=await page.evaluate(slot=>{
       const expected=codeSession.word.eng[codeSession.blankIdx[slot]].toLowerCase();
       return codeSession.keys.find(k=>!k.used&&k.ch===expected)?.id||null;
     },slot);
     check(Boolean(keyId),'correct key available for slot '+slot);
     if(!keyId)break;
     await page.locator('[data-key="'+keyId+'"]').click();
     await page.locator('[data-slot="'+slot+'"]').click();
   }
   await page.waitForFunction(id=>Boolean(S.codeRed.results[id]),target.id,{timeout:5000});
   const outcome=await page.evaluate(id=>({type:S.codeRed.results[id]?.type,retrace:S.codeRed.retrace.includes(id)}),target.id);
   check(outcome.type==='HINT_USED','hint-assisted answer was not HINT_USED: '+outcome.type);
   check(outcome.retrace===true,'hint-assisted answer skipped retrace');
   const emitted=await page.evaluate(id=>(S.takyLearningOutbox||[]).findLast(x=>x.type==='RETRIEVAL_ATTEMPT_RESULT'&&x.payload?.word_id===id)?.payload||null,target.id);
   check(emitted?.interaction_mode==='RECALL'&&emitted?.result_type==='HINT_USED'&&emitted?.assisted===true,'RECALL hint evidence emitted with incorrect learning mode: '+JSON.stringify(emitted));
  }
  check(errors.length===0,'page errors: '+errors.join(' | '));
  await ctx.close();
 }catch(e){failures.push('harness error: '+e.message);}
 finally{await browser?.close().catch(()=>{});srv.kill();}
 if(failures.length){console.error('CODE_RED_HINT_BEHAVIOR FAIL'+(negative?' (negative-control)':'')+'\n - '+failures.join('\n - '));process.exit(1);}
 console.log('CODE_RED_HINT_BEHAVIOR PASS: 3 hints, no key highlighted, no slot filled, answers untouched');
})();
