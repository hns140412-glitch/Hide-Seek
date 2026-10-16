'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),http=require('node:http');
const crypto=require('node:crypto');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const app=path.resolve('D:/Git PWA/Hide & Seek');
const adapter=path.join(app,'tools','hide-signed-forming-browser-preview-adapter-v1.js');
const proofDir=path.resolve('D:/Git PWA/TAKY_AI_WORKBENCH/01_BACKLOG_AND_ADOPTION/80_EVIDENCE/FORMING_LEARNING_VISUAL_MOCK');
const proof=JSON.parse(fs.readFileSync(path.join(proofDir,'TAKY_FORMING_LEARNING_VISUAL_MOCK_4eb54e90bbb39d2b0dba.json'),'utf8'));
const outcomes=proof.real_selector_pattern_recommendations;
assert.equal(outcomes.ref081.signedVerified,true);
assert.equal(outcomes.ref085.signedVerified,true);
assert.equal(outcomes.ref081.appRelease,false);
assert.equal(outcomes.ref085.appRelease,false);
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8',
 '.json':'application/json;charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon','.mp3':'audio/mpeg'};
let srv,host,browser;
before(async()=>{
 srv=http.createServer((req,res)=>{
  try {
   const url=new URL(req.url,'http://127.0.0.1');
   const rel=decodeURIComponent(url.pathname.replace(/^\//,''))||'index.html';
   const file=path.resolve(app,rel);
   if(!file.startsWith(app+path.sep)&&file!==path.join(app,'index.html')){res.writeHead(403).end();return;}
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
   res.setHeader('Cache-Control','no-store');
   res.setHeader('Content-Type',mime[path.extname(file).toLowerCase()]||'application/octet-stream');
   fs.createReadStream(file).pipe(res);
  }catch(err){res.writeHead(400).end();}
 });
 await new Promise((resolve,reject)=>srv.once('error',reject).listen(0,'127.0.0.1',resolve));
 host='http://127.0.0.1:'+srv.address().port;
 browser=await chromium.launch({headless:true,channel:'chrome'});
});
after(async()=>{
 if(browser)await browser.close();
 if(srv)await new Promise(resolve=>srv.close(resolve));
});
async function pageFor(suffix=''){
 const context=await browser.newContext({
  viewport:{width:1180,height:820},serviceWorkers:'block',
  permissions:[],locale:'ko-KR'
 });
 await context.addInitScript(()=>{window.__TAKY_ISOLATED_SIGNED_FORMING_E2E__=true;});
 const page=await context.newPage();
 const external=[];
 page.on('request',req=>{
   if(!req.url().startsWith(host+'/'))external.push(req.url());
 });
 await page.route('**/*',route=>{
   const u=route.request().url();
   if(!u.startsWith(host+'/'))return route.abort();
   return route.continue();
 });
 await page.goto(host+'/?school_stage=E5&subject=SCIENCE'+suffix,{
  waitUntil:'domcontentloaded',timeout:17000});
 await page.waitForFunction(()=>
  document.documentElement.dataset.hideLearningTermLoader==='BOUND'
   &&window.HideTermDecoderV1?.snapshot?.().cardCount>0,{
 },{timeout:18000});
 const prior=await page.evaluate(()=>window.HideTermDecoderV1.snapshot());
 assert.equal(prior.engineProjection?.source_kind,'STATIC_PROJECTION_FALLBACK');
 await page.addScriptTag({path:adapter});
 assert.equal(await page.evaluate(()=>!!window.HideSeekFormingPreviewE2EV1),true);
 return {page,context,external,prior};
}
async function checkCase(tag,fixture,expected){
 const {page,context,external,prior}=await pageFor();
 try{
  const state=await page.evaluate(data=>
      window.HideSeekFormingPreviewE2EV1.apply(data),fixture);
  assert.equal(state.status,'REAL_HIDE_SEEK_TERM_DECODER_TEST_PREVIEW_BOUND');
  assert.equal(state.after_cards,prior.cardCount+1);
  const snap=await page.evaluate(()=>window.HideTermDecoderV1.snapshot());
  assert.equal(snap.engineProjection.authority_class,'TEST_ED25519_FIXTURE_NON_OPERATIONAL');
  assert.equal(snap.engineProjection.learning_consumed,false);
  assert.equal(snap.engineProjection.production_released,false);
  assert.equal(snap.cards[0].miningLearningPattern.source_refs.includes('INDEX:'+fixture.sourceId),true);
  assert.deepEqual(snap.cards[0].miningLearningPattern.pattern_ids,expected.patterns);
  await page.evaluate(()=>HideTermDecoderV1.open('CORE'));
  const hints=await page.locator('.term-decoder-pattern-hints').allInnerTexts();
  assert(hints.length>0,'App must render original CORE learning pattern hints');
  for(const wanted of expected.hints) assert(hints.join(' ').includes(wanted),tag+': missing '+wanted);
  assert.equal(await page.locator('.term-title').first().innerText().then(x=>x.includes('한랭전선')),true);
  const png=path.join(proofDir,'TAKY_HIDE_REAL_APP_'+tag+'_CORE_1180X820.png');
  await page.screenshot({path:png,fullPage:true});
  assert.equal(external.length,0,'External network calls detected');
  console.log(JSON.stringify({result:'REAL_HIDE_APP_PREVIEW_PASS',scenario:tag,
     before_card_count:prior.cardCount,after_card_count:snap.cardCount,
     patterns:snap.cards[0].miningLearningPattern.pattern_ids,
     rendered_core_hints:hints,screenshot:png,network_requests:external.length,
     operating_app_files_modified:false,fixture_only:true}));
 }finally{await context.close();}
}
test('REF-081 signing fixture really renders repeated-error recovery in unchanged Hide & Seek CORE',async()=>{
 await checkCase('REF081',outcomes.ref081,{patterns:['P_ERROR_TO_CONCEPT_GAP','P_VISUAL_CONCEPT_CARD'],
  hints:['여러 번 헷갈린 개념','관계부터 다시 연결']});
});
test('REF-085 signed source changes real Hide & Seek CORE hint from recovery to concept graph',async()=>{
 await checkCase('REF085',outcomes.ref085,{
   patterns:['P_VISUAL_CONCEPT_CARD','P_CONCEPT_GRAPH','P_BLANK_RECALL'],
   hints:['개념 관계 함께 보기']});
});
test('invalid or absent signed-stage payload fails closed, existing Hide & Seek cards unchanged',async()=>{
 const {page,context,external,prior}=await pageFor();
 try{
  const bad={...outcomes.ref081,sourceId:'NOT-A-SOURCE'};
  const result=await page.evaluate(x=>HideSeekFormingPreviewE2EV1.apply(x),bad);
  assert.equal(result.ok,false);
  assert.equal((await page.evaluate(()=>HideTermDecoderV1.snapshot())).cardCount,prior.cardCount);
  const empty=await page.evaluate(()=>HideSeekFormingPreviewE2EV1.apply(null));
  assert.equal(empty.ok,false);
  assert.equal((await page.evaluate(()=>HideTermDecoderV1.snapshot())).cardCount,prior.cardCount);
  const blocked=await page.evaluate(x=>{
    window.__TAKY_ISOLATED_SIGNED_FORMING_E2E__=false;
    return HideSeekFormingPreviewE2EV1.apply(x);
  },outcomes.ref081);
  assert.equal(blocked.ok,false);
  assert.equal((await page.evaluate(()=>HideTermDecoderV1.snapshot())).cardCount,prior.cardCount);
  assert.equal(external.length,0);
  console.log(JSON.stringify({result:'REAL_HIDE_APP_FORGED_AND_ABSENT_SCOPE_HOLD_PASS',
    source_unchanged:true,app_cards_before:prior.cardCount,app_cards_after:prior.cardCount,
    external_network_requests:0,student_learning_written:false}));
 }finally{await context.close();}
});

test('real app LINK and RECALL consume source-specific signed pattern hints, still no learner evidence',async()=>{
 for(const [tag,fixture,modes] of [
   ['REF081',outcomes.ref081,[['LINK','여러 번 헷갈린 개념']]],
   ['REF085',outcomes.ref085,[['LINK','개념 관계 함께 보기'],['RECALL','문맥에서 빈칸 회상']]]
 ]){
  const {page,context,external,prior}=await pageFor();
  try{
   const ok=await page.evaluate(x=>HideSeekFormingPreviewE2EV1.apply(x),fixture);
   assert.equal(ok.ok,true);
   for(const [mode,wanted] of modes){
    await page.evaluate(m=>HideTermDecoderV1.open(m),mode);
    const text=await page.locator('.term-decoder-pattern-hints').allInnerTexts();
    assert(text.join(' ').includes(wanted),tag+': '+mode+' missing '+wanted);
    const snap=await page.evaluate(()=>HideTermDecoderV1.snapshot());
    assert.equal(snap.evidenceCount,prior.evidenceCount);
    console.log(JSON.stringify({result:'ACTUAL_HIDE_APP_'+mode+'_PASS',source:tag,hints:text,
      learner_evidence_created:0}));
   }
   assert.equal(external.length,0);
  }finally{await context.close();}
 }
});
test('real signed preview on 390px mobile retains card selection without viewport overflow',async()=>{
 const {page,context,external}=await pageFor();
 try{
  await page.setViewportSize({width:390,height:844});
  const result=await page.evaluate(x=>HideSeekFormingPreviewE2EV1.apply(x),outcomes.ref085);
  assert.equal(result.ok,true);
  await page.evaluate(()=>HideTermDecoderV1.open('CORE'));
  assert.match((await page.locator('.term-decoder-pattern-hints').innerText()),/개념 관계 함께 보기/);
  const viewport=await page.evaluate(()=>({
   screen:innerWidth,body:document.body.scrollWidth,
   document:document.documentElement.scrollWidth,
   heading:document.querySelector('.term-title').textContent
  }));
  assert.equal(viewport.body,viewport.screen);
  assert.equal(viewport.document,viewport.screen);
  assert(viewport.heading.includes('한랭전선'));
  const screenshot=path.join(proofDir,'TAKY_HIDE_REAL_APP_REF085_CORE_MOBILE_390X844.png');
  await page.screenshot({path:screenshot,fullPage:true});
  assert.equal(external.length,0);
  console.log(JSON.stringify({result:'REAL_HIDE_SIGNED_MOBILE_NO_OVERFLOW_PASS',
   viewport,screenshot,external_requests:0}));
 }finally{await context.close();}
});
