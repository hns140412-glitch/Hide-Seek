'use strict';
/**
 * Real Hide & Seek -> HTTPS-equivalent local HTTP authenticated Central
 * Learning Endpoint E2E. Binds ONLY loopback test servers + synthetic bearer
 * and family, NEVER real learner credentials or operational approval.
 */
const {test,before,after}=require('node:test');
const watchdog=setTimeout(()=>{console.error('E2E_WATCHDOG_EXIT_TIMEOUT_45S');process.exit(124);},45000);
watchdog.unref();
const checkpoint=(value)=>console.error('TAKY_HTTP_CHROME_E2E_STEP='+value);
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const Endpoint=require('D:/Git PWA/TAKY/LEARNING/transport/term-recommendation-http-endpoint.js');
const Evidence=require('D:/Git PWA/TAKY/LEARNING/transport/central-learning-http-endpoint.js');
const {LocalJsonStrongStore}=require('D:/Git PWA/TAKY/LEARNING/transport/local-json-strong-store.js');
const os=require('node:os');
const fsp=require('node:fs/promises');
const catalog=require('D:/Git PWA/TAKY/LEARNING/projection/term-decoder-mined-catalog-v1.json');
const app=path.resolve('D:/Git PWA/Hide & Seek');
const evidence=path.resolve('D:/Git PWA/TAKY_AI_WORKBENCH/01_BACKLOG_AND_ADOPTION/80_EVIDENCE/FORMING_LEARNING_VISUAL_MOCK');
const token='testonlysyntheticlocalbearer123456789';
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8',
 '.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.woff2':'font/woff2','.ico':'image/x-icon','.mp3':'audio/mpeg'};
let appServer,apiServer,appUrl,apiUrl,browser;
let previewMode=false;
let evidenceEndpoint=null;
const bearerIdentity=async supplied=>{
 if(supplied!==token)throw Error('TEST_ONLY_BAD_TOKEN');
 return {authenticated:true,principal_id:'fixture-parent-1',
  active_family_id:'family-1',families:[{family_id:'family-1',
   self_member_id:'guardian-1',authorized_member_ids:['child-1']}]};
};
let endpoint=Endpoint.create({
 verifyBearerToken:async supplied=>{
   if(supplied!==token)throw Error('TEST_ONLY_BAD_TOKEN');
   return {authenticated:true,principal_id:'fixture-parent-1',
    active_family_id:'family-1',
    families:[{family_id:'family-1',self_member_id:'guardian-1',
      authorized_member_ids:['child-1']}]};
 },
 resolveLearnerProfile:async scope=>{
   assert.equal(scope.family_id,'family-1');
   assert.equal(scope.member_id,'child-1');
   return {school_stage:'E5'};
 },
 resolveCurriculumTerms:async scope=>({
   source_ref:catalog.source_ref,allow_provisional:true,
   unit_text:'자료를 조사하고 결과를 비교하여 변화 과정을 설명한다. 조사한 자료를 확인한다.',
   academic_vocab_explicit_terms:['자료','조사'],
   terms:catalog.terms.filter(x=>x.subject===scope.subject)
 }),
 resolveTermEvidence:async()=>[
   {learning_target_id:'sci-hanraengjeonseon',interaction_mode:'CORE',
     result_type:'WRONG',observed_at:'2026-10-09T01:00:00Z'},
   {learning_target_id:'sci-hanraengjeonseon',interaction_mode:'LINK',
     result_type:'WRONG',observed_at:'2026-10-10T01:00:00Z'}
 ]
});
async function listen(server){
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 return 'http://127.0.0.1:'+server.address().port;
}
before(async()=>{
 checkpoint('BEFORE_SERVERS');
 appServer=http.createServer((req,res)=>{
  try{
   const rel=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\//,'')||'index.html';
   const f=path.resolve(app,rel);
   if(f!==path.join(app,'index.html')&&!f.startsWith(app+path.sep)){
    res.writeHead(403).end();return;
   }
   if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404).end();return;}
   res.setHeader('Cache-Control','no-store');
   res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');
   fs.createReadStream(f).pipe(res);
  }catch{res.writeHead(400).end();}
 });
 appUrl=await listen(appServer);
 checkpoint('APP_SERVER_LISTENING');
 apiServer=http.createServer(async(req,res)=>{
  const cors={
   'Access-Control-Allow-Origin':appUrl,'Access-Control-Allow-Headers':'Authorization,Content-Type',
   'Access-Control-Allow-Methods':'POST,OPTIONS',
   'Cache-Control':'no-store'
  };
  if(req.method==='OPTIONS'){res.writeHead(204,cors).end();return;}
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>8192){res.writeHead(413,cors).end();return;}chunks.push(chunk);}
  const target=req.url&&new URL(req.url,apiUrl).pathname;
  const handler=target===Evidence.ENDPOINT?evidenceEndpoint:endpoint;
  const response=handler?await handler.handle({
   method:req.method,path:new URL(req.url,apiUrl).pathname,
   headers:req.headers,body:Buffer.concat(chunks).toString('utf8')}):
   {status:404,headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ok:false,reason:'UNREGISTERED_TEST_ROUTE'})};
  let body=response.body;
  if(previewMode&&response.status===200){
   const untrusted=JSON.parse(body);
   untrusted.authority='TAKY_LEARNING_PREVIEW_NOT_OPERATIONAL';
   untrusted.preview_only=true;
   untrusted.release_approved=false;
   body=JSON.stringify(untrusted);
  }
  res.writeHead(response.status,{...response.headers,...cors});
  res.end(body);
 });
 apiUrl=await listen(apiServer);
 checkpoint('API_SERVER_LISTENING');
 browser=await chromium.launch({headless:true,channel:'chrome',timeout:8500});
 checkpoint('CHROME_LAUNCHED');
});
after(async()=>{
 checkpoint('AFTER_CLEANUP_START');
 if(browser)await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3500))]);
 for(const s of [apiServer,appServer])if(s){
  s.closeAllConnections?.();
  await Promise.race([new Promise(resolve=>s.close(resolve)),new Promise(resolve=>setTimeout(resolve,1200))]);
 }
 checkpoint('AFTER_CLEANUP_DONE');
});
async function load(child='child-1'){
 const context=await browser.newContext({serviceWorkers:'block',
  viewport:{width:1180,height:820},locale:'ko-KR'});
 const page=await context.newPage();
 page.on('console',msg=>{if(msg.text().includes('TAKY_TRACE_'))checkpoint(msg.text());});
 page.setDefaultTimeout(6000);
 page.setDefaultNavigationTimeout(8000);
 checkpoint('NEW_PAGE_'+child);
 const requests=[];
 page.on('request',req=>requests.push(req.url()));
 await page.route('**/*',route=>{
  const u=route.request().url();
  if(u.startsWith(appUrl+'/')||u.startsWith(apiUrl+'/'))return route.continue();
  return route.abort();
 });
 await page.goto(appUrl+'/?school_stage=E5&subject=SCIENCE&child_id='+child,{waitUntil:'domcontentloaded',timeout:8000});
 checkpoint('APP_DOM_LOADED_'+child);
 await page.waitForFunction(()=>document.documentElement.dataset.hideLearningTermLoader==='BOUND'
  &&window.HideTermDecoderV1?.snapshot?.().engineOwnedCards===true,null,{timeout:6500});
 checkpoint('STATIC_BOUND_'+child);
 const first=await page.evaluate(()=>HideTermDecoderV1.snapshot());
 assert.equal(first.engineProjection.source_kind,'STATIC_PROJECTION_FALLBACK');
 const configured=await page.evaluate(({url,token})=>{
   try{
    window.TAKY_FAMILY_RUNTIME={
      apiBaseUrl:url,
      getToken:async()=>token,
      getFamilyId:async()=> 'family-1'
    };
    return window.TAKY_FAMILY_RUNTIME.apiBaseUrl;
   }catch(e){return 'ERROR:'+e.message;}
 },{url:apiUrl,token});
 assert.equal(configured,apiUrl);
 return {context,page,first,requests};
}
test('authenticated REAL central HTTP endpoint binds learning pattern to real Hide & Seek app',{timeout:18000},async()=>{
 previewMode=false;
 const {context,page,requests}=await load();
 try{
  checkpoint('REQUEST_LIVE_BEFORE');
  const boot=await page.evaluate(()=>HideLearningTermLoaderV1.boot());
  checkpoint('REQUEST_LIVE_AFTER_'+boot.source);
  assert.equal(boot.source,'LIVE_SERVER');
  checkpoint('LIVE_SNAPSHOT_BEFORE');
  const snap=await page.evaluate(()=>HideTermDecoderV1.snapshot());
  checkpoint('LIVE_SNAPSHOT_AFTER_'+snap.cardCount);
  assert.equal(snap.engineProjection.source_kind,'LIVE_SERVER');
  assert.equal(snap.engineProjection.authority_class,'AUTHENTICATED_LIVE_LEARNING_ENGINE');
  assert.equal(snap.engineProjection.school_stage,'E5');
  const card=snap.cards.find(x=>x.id==='sci-hanraengjeonseon');
  assert(card,'Central curated term source not rendered');
  assert(card.miningLearningPattern?.pattern_ids?.includes('P_ERROR_TO_CONCEPT_GAP'));
  checkpoint('LIVE_CORE_OPEN_BEFORE');
  await page.evaluate(()=>HideTermDecoderV1.open('CORE'));
  checkpoint('LIVE_CORE_OPEN_RETURNED');
  await page.waitForTimeout(200);
  const dom=await page.evaluate(()=>({
    viewStart:document.querySelector('#view')?.innerHTML.slice(0,350),
    hasTermDecoder:!!document.querySelector('.term-decoder-shell'),
    activePanels:document.querySelectorAll('#view section').length,
    appLocation:location.pathname,
    loaderState:document.documentElement.dataset.hideLearningTermLoader
  }));
  checkpoint('CORE_DOM_READBACK_'+JSON.stringify(dom));
  const coreText=await page.locator('.term-decoder-shell').innerText({timeout:3500});
  checkpoint('LIVE_CORE_TEXT_READ');
  assert(coreText.includes('한랭전선'));
  assert(coreText.includes('여러 번 헷갈린 개념'));
  const shot=path.join(evidence,'TAKY_HIDE_REAL_AUTHENTICATED_HTTP_CORE_1180X820.png');
  checkpoint('LIVE_SCREENSHOT_BEFORE');
  await page.screenshot({path:shot,fullPage:true,timeout:7000,animations:'disabled'});
  checkpoint('LIVE_SCREENSHOT_AFTER');
  assert(requests.some(url=>url.startsWith(apiUrl+'/api/learning/term-recommendations')));
  assert(requests.every(url=>url.startsWith(appUrl+'/')||url.startsWith(apiUrl+'/')));
  console.log(JSON.stringify({status:'REAL_AUTHENTICATED_HTTP_TO_HIDE_CORE_PASS',
   cards:snap.cardCount,term:card.term,pattern:card.miningLearningPattern.pattern_ids,
   screenshot:shot,synthetic_family_only:true,production_deploy:false}));
 }finally{await context.close();}
});
test('signed-but-non-operational FORMING preview cannot be promoted by real Hide & Seek loader',{timeout:15000},async()=>{
 previewMode=true;
 const {context,page,first,requests}=await load();
 try{
  checkpoint('REQUEST_LIVE_BEFORE');
  const boot=await page.evaluate(()=>HideLearningTermLoaderV1.boot());
  checkpoint('REQUEST_LIVE_AFTER_'+boot.source);
  assert.equal(boot.source,'STATIC_PROJECTION_FALLBACK');
  const failure=await page.evaluate(()=>document.documentElement.dataset.hideLearningTermLiveFallback);
  assert.equal(failure,'LIVE_OPERATIONAL_TERM_AUTHORITY_REQUIRED');
  const snap=await page.evaluate(()=>HideTermDecoderV1.snapshot());
  assert.equal(snap.engineProjection.source_kind,'STATIC_PROJECTION_FALLBACK');
  assert.equal(snap.cardCount,first.cardCount);
  assert(requests.some(url=>url.startsWith(apiUrl+'/api/learning/term-recommendations')));
  console.log(JSON.stringify({status:'UNAPPROVED_FORMING_API_REJECTED_IN_ACTUAL_HIDE_BROWSER',
   fallback:failure,app_cards_preserved:snap.cardCount,operational:false}));
 }finally{previewMode=false;await context.close();}
});
test('real central endpoint denies unauthorized member; app falls back with no learning privileges',{timeout:15000},async()=>{
 previewMode=false;
 const {context,page,first}=await load('unauthorized-member');
 try{
  checkpoint('REQUEST_LIVE_BEFORE');
  const boot=await page.evaluate(()=>HideLearningTermLoaderV1.boot());
  checkpoint('REQUEST_LIVE_AFTER_'+boot.source);
  assert.equal(boot.source,'STATIC_PROJECTION_FALLBACK');
  const failure=await page.evaluate(()=>document.documentElement.dataset.hideLearningTermLiveFallback);
  assert.equal(failure,'AUTHORIZED_MEMBER_REQUIRED');
  const snap=await page.evaluate(()=>HideTermDecoderV1.snapshot());
  assert.equal(snap.engineProjection.source_kind,'STATIC_PROJECTION_FALLBACK');
  assert.equal(snap.cardCount,first.cardCount);
  console.log(JSON.stringify({status:'UNAUTHORIZED_CHILD_LEARNING_ENDPOINT_FORBIDDEN',
   denial:failure,real_app_unchanged:true}));
 }finally{await context.close();}
});

test('literacy panel re-render is idempotent and external academic words cannot execute HTML',{timeout:12000},async()=>{
 previewMode=false;
 const {context,page,requests}=await load();
 try{
  const boot=await page.evaluate(()=>HideLearningTermLoaderV1.boot());
  assert.equal(boot.source,'LIVE_SERVER');
  await page.evaluate(()=>HideTermDecoderV1.open('CORE'));
  const audit=await page.evaluate(async()=>{
    const panel=document.getElementById('hideAcademicVocabUnitTargets');
    if(!panel)return {missing:true};
    let changes=0;
    const watcher=new MutationObserver(records=>{
      changes+=records.reduce((n,r)=>n+r.addedNodes.length+r.removedNodes.length,0);
    });
    watcher.observe(panel,{childList:true,subtree:true});
    const initial=panel.innerHTML;
    for(let n=0;n<6;n++)HideLiteracyAdapterV1.decorate();
    await new Promise(resolve=>setTimeout(resolve,100));
    watcher.disconnect();
    const stable=panel.innerHTML===initial;
    const previous=window.HideTermDecoderV1;
    const hostile='<img src=x onerror=window.__TAKY_MOCK_XSS=true>';
    window.__TAKY_MOCK_XSS=false;
    window.HideTermDecoderV1={snapshot:()=>({
      engineProjection:{literacy_intent:{consumers:{hide_seek:{
        academic_vocabulary_targets:[{term:hostile,academic_role:'PRIMARY'}],
        targets:[{mode_bias:['CORE']}]
      }}}}
    })};
    try{
      HideLiteracyAdapterV1.decorate();
      return {initialPanelPresent:true,changes,stable,
        textEscaped:panel.textContent.includes(hostile),
        imgInjected:!!panel.querySelector('img'),
        scriptExecuted:window.__TAKY_MOCK_XSS};
    }finally{window.HideTermDecoderV1=previous;}
  });
  assert.equal(audit.initialPanelPresent,true);
  assert.equal(audit.changes,0,'Repeated passive decorate must not alter DOM children');
  assert.equal(audit.stable,true);
  assert.equal(audit.textEscaped,true);
  assert.equal(audit.imgInjected,false);
  assert.equal(audit.scriptExecuted,false);
  assert(requests.every(url=>url.startsWith(appUrl+'/')||url.startsWith(apiUrl+'/')));
  console.log(JSON.stringify({status:'REAL_HTTP_LITERACY_PANEL_IDEMPOTENT_AND_SAFE_TEXT_PASS',
    observer_child_mutations_after_six_redecorations:0,
    untrusted_html_interpreted_as_text:true,external_requests:0}));
 }finally{await context.close();}
});

test('real Hide & Seek wrong-clicks validated by pinned server-owned catalog, reload -> RECOVERY',{timeout:25000},async()=>{
 const temp=await fsp.mkdtemp(path.join(os.tmpdir(),'taky-hide-real-feedback-'));
 const originalEndpoint=endpoint;
 const front=catalog.terms.find(x=>x.term_id==='sci-jeungbal');
 const ServerTerm=require('D:/Git PWA/TAKY/LEARNING/verification/server-term-decoder-reference.js');
 const crypto=require('node:crypto');
 const catalogPath='D:/Git PWA/TAKY/LEARNING/projection/term-decoder-mined-catalog-v1.json';
 const pinnedSha256=crypto.createHash('sha256').update(fs.readFileSync(catalogPath)).digest('hex');
 assert.equal(front.grade_alignment.state,'VERIFIED');
 const science=catalog.terms.filter(x=>x.subject==='SCIENCE');
 assert(front&&science.length>=4);
 const selected=[front,...science.filter(x=>x.term_id!==front.term_id).slice(0,3)];
 const createTerm=store=>Endpoint.create({
   verifyBearerToken:bearerIdentity,
   durableTermStore:store,
   resolveLearnerProfile:async()=>({school_stage:'E5'}),
   resolveCurriculumTerms:async()=>({
     source_ref:catalog.source_ref,allow_provisional:true,terms:selected,
     unit_text:'자료를 조사하고 결과를 비교하여 변화 과정을 설명한다.',
     academic_vocab_explicit_terms:['자료','조사']})
 });
 let context=null;
 try{
   const store=await new LocalJsonStrongStore(temp).init();
   endpoint=createTerm(store);
   const audited=[];
   const verifiedOwner=ServerTerm.create({
     catalogPath,pinnedSha256,
     resolveLearnerProfile:async()=>({school_stage:'E5'}),
     authorizeCatalogRelease:async scope=>scope.catalog_sha256===pinnedSha256
       &&scope.term_id==='sci-jeungbal'&&scope.consumer==='HIDE_SEEK'
   });
   evidenceEndpoint=Evidence.create({
     verifyBearerToken:bearerIdentity,store,
     verifySpecialistEvidence:async input=>{
       const result=await verifiedOwner(input);
       if(result.ok)audited.push({
         event:result.packet.event.event_id,
         serverAssignedOutcome:result.packet.event.payload.verification_candidate.outcome
       });
       return result;
     }
   });
   const {page,context:browserContext,requests}=await load();
   context=browserContext;
   let first=await page.evaluate(()=>HideLearningTermLoaderV1.boot());
   assert.equal(first.source,'LIVE_SERVER');
   let before=await page.evaluate(()=>HideTermDecoderV1.snapshot());
   const entry=before.cards.find(x=>x.id===front.term_id);
   assert(entry,'Real central curriculum term not included in app');
   assert.equal(before.engineProjection.evidence_count,0);
   assert(!entry.miningLearningPattern.recovery.concept_gap);
   const index=before.cards.findIndex(x=>x.id===front.term_id);
   for(let n=1;n<=2;n++){
     await page.evaluate(i=>{
       const snap=HideTermDecoderV1.snapshot();
       const mode=(snap.selectedSubject||'ALL')+':CORE';
       S.termDecoder.cursor[mode]=i;
       HideTermDecoderV1.open('CORE');
     },index);
     assert((await page.locator('.term-title').innerText()).includes('증발'));
     const wrong=page.locator('[data-core-index][data-correct="0"]').first();
     assert(await wrong.count()===1);
     await wrong.click();
     // The actual HideSeekBridge -> TakyLearningEvidenceClientV1
     // event queue must yield a durable server ACK, not merely enqueue.
     await page.waitForFunction(expected=>
       window.TakyLearningEvidenceClientV1?.acked?.().length>=expected,
       n,{timeout:9500});
     assert.equal(audited.length,n,'Server fixture independently validated every click');
     assert.equal(audited.at(-1).serverAssignedOutcome,0);
   }
   // Emulate a fresh central process reading the same persistent CAS store.
   const reopened=await new LocalJsonStrongStore(temp).init();
   endpoint=createTerm(reopened);
   const later=await page.evaluate(()=>HideLearningTermLoaderV1.boot());
   assert.equal(later.source,'LIVE_SERVER');
   const after=await page.evaluate(()=>HideTermDecoderV1.snapshot());
   assert.equal(after.engineProjection.evidence_count,2);
   const remediated=after.cards.find(x=>x.id===front.term_id);
   assert(remediated?.miningLearningPattern?.recovery?.concept_gap===true);
   await page.evaluate(i=>{
     const snap=HideTermDecoderV1.snapshot();
     S.termDecoder.cursor[(snap.selectedSubject||'ALL')+':CORE']=i;
     HideTermDecoderV1.open('CORE');
   },after.cards.findIndex(x=>x.id===front.term_id));
   const hints=await page.locator('.term-decoder-pattern-hints').innerText({timeout:3000});
   assert.match(hints,/여러 번 헷갈린 개념/);
   const screenshot=path.join(evidence,'TAKY_HIDE_REAL_PINNED_SERVER_REFERENCE_JEUNGBAL_RECOVERY_1180X820.png');
   await page.screenshot({path:screenshot,fullPage:true,timeout:6000});
   assert(requests.every(u=>u.startsWith(appUrl+'/')||u.startsWith(apiUrl+'/')));
   console.log(JSON.stringify({
     status:'HIDE_REAL_CLICKS_VERIFIED_DURABLE_RECOVERY_CLOSED_LOOP_PASS',
     before:'DISCOVERY',after:'RECOVERY',real_wrong_clicks:2,
     server_verified_outcomes:audited.map(x=>x.serverAssignedOutcome),
     app_acknowledged_events:2,durable_data_reopened:true,
     prefix_id_normalized:true,source_skill_default:'vocabulary',
     shown_on_existing_core_screen:true,external_http_calls:0,screenshot,
     synthetic_browser_family_only:true,production_learner_data_written:false
   }));
 }finally{
   if(context)await context.close();
   evidenceEndpoint=null;
   endpoint=originalEndpoint;
   await fsp.rm(temp,{recursive:true,force:true});
 }
});
