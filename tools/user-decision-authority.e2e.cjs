'use strict';
// Independent user-decision regression; never promotes assistant-authored UI/tests to authority.
// Browser storage is isolated, with synthetic fixture. No app/source/memory mutation.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.local','decision_authority_regression_20261017');
fs.mkdirSync(out,{recursive:true});
const port=49889,checks=[],pageErrors=[];
const provenance=JSON.parse(fs.readFileSync(path.join(root,'docs','HIDE_USER_DECISION_PROVENANCE_20261017.json'),'utf8'));
if(provenance.schema!=='HIDE_USER_DECISION_PROVENANCE_LEDGER_20261017_V1')throw Error('SOURCE_LEDGER_MISSING');
function add(id,expected,observed,pass,source,impact){checks.push({id,expected,observed,pass:!!pass,source,impact});}
(async()=>{
 const server=spawn(process.execPath,['D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs',root,String(port)],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 server.stderr.on('data',data=>console.error('HOST_ERROR',String(data).slice(0,2000)));
 let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.on('data',b=>String(b).includes('READY')&&resolve());server.on('exit',()=>reject(Error('host died')));setTimeout(()=>reject(Error('host timeout')),9000)});
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const pg=await context.newPage();pg.on('pageerror',e=>pageErrors.push(String(e.message)));
  await pg.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
  await pg.evaluate(()=>{S.onboardingDone=true;S.settings.partnerVoice=false;currentTab='home';render()});
  await pg.waitForSelector('.hs-mode-sign');
  const nav=await pg.evaluate(()=>[...document.querySelectorAll('#bottomNav [data-tab]')].map(x=>({id:x.dataset.tab,label:x.innerText.trim()})));
  add('USER_0922_NAV_HOME_EXPLORE_CATCH',
   'HOME/EXPLORE/CATCH three primary tabs; Korean labels with small English',
   nav,nav.length===3&&nav.map(x=>x.id).join(',')==='home,explore,catch'&&nav.every(x=>/[a-zA-Z]/.test(x.label)),
   'USER 2026-09-22 04:03/04:06','P1 UI decision altered');
  const home=await pg.evaluate(()=>({fourModes:document.querySelectorAll('.hs-mode-sign').length,subjectShortcut:!!document.querySelector('#hsBackSubjects'),sixSubjectOnScreen:document.querySelectorAll('.hs-subject-sign').length,photoMenu:!!document.querySelector('[data-hs-menu=camera]')}));
  add('USER_1001_ENGLISH_DEFAULT_OPTIONAL_SIX','English initial Home + user-accessible six subjects',home,home.fourModes===4&&home.subjectShortcut,'USER 2026-10-01 10:34','P1 preserve approved user intent');
  await pg.click('#hsBackSubjects');
  const subj=await pg.evaluate(()=>[...document.querySelectorAll('.hs-subject-sign')].map(x=>x.dataset.hsSubject));
  add('USER_1001_SIX_SUBJECTS','ENGLISH KOREAN HANJA SOCIAL SCIENCE MATH remain selectable',subj,['ENGLISH','KOREAN','HANJA','SOCIAL','SCIENCE','MATH'].every(x=>subj.includes(x)),'USER 2026-10-01 10:34','P1 missing subjects');
  await pg.click('[data-hs-subject=ENGLISH]');
  await pg.evaluate(()=>{S.sheets=[0,1,2].map((g)=>({sheetId:'qa-source-'+g,title:'synthetic source '+g,
   sourceType:'manual',testDate:'2026-10-'+String(16-g*2).padStart(2,'0'),
   createdAt:'2026-10-'+String(16-g*2).padStart(2,'0')+'T09:00:00Z',
   recognitionMeta:{reviewedAt:'2026-10-16T09:00:00Z',qaOnly:true},
   items:Array.from({length:12},(_,k)=>({id:'qa-'+g+'-'+k,eng:'testword'+g+'x'+k,kor:'검증용 뜻 '+g+'-'+k,needsReview:false,learningStats:{}}))}));
   S.activeSheetId='qa-source-0';const result=HideEnglishCycleV1.enable();
   window.__testCycleState=result.state;currentTab='home';render()});
  const total=await pg.evaluate(()=>({count:validWords().length,state:window.__testCycleState,sourceNew:HideEnglishCycleV1.compose().newCount,sourceReview:HideEnglishCycleV1.compose().reviewCount}));
  add('USER_12_24_COMPOSITION_SOURCE_PROVENANCE','Confirmed new 12 + separate review 24 and provenance',total,total.state==='ENABLED'&&total.count===36&&total.sourceNew===12&&total.sourceReview===24,'USER 2026-10-01 and original approved learning scope','data counts');
  await pg.click('[data-mode=trace]');
  const trace=await pg.evaluate(()=>({pager:document.querySelector('.hs-first-pager')?.innerText,
    word:document.querySelector('.hs-first-word')?.innerText,interactions:['#firstNext','#firstUnsure','#hsFirstFlip','#speakWord'].map(q=>!!document.querySelector(q)),
    exposureState:S.learning.phase,activeWords:validWords().length}));
  add('USER_0922_FIRST_TRACE_NEW_ONLY','First TRACE covers only 12 NEW; review TRACE separate',trace,
    /1\s*\/\s*12/.test(trace.pager||'')&&trace.word==='testword0x0','USER 2026-09-22 03:41','P1 review24 intrudes first exposure');
  const code=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const first=code.slice(code.indexOf('function renderFirstContact'),code.indexOf('function renderMeaningCheck'));
  const recallCode=fs.readFileSync(path.join(root,'hide-english-pedagogy-v1.js'),'utf8');
  const firstFind={
    traceExposureOnly:first.includes("scoreAuthority:'EXPOSURE_ONLY'"),
    firstRetrievalTracked:recallCode.includes("retrievalStep:st.mode==='RECALL'&&st.firstFind?'FIRST_FIND'"),
    hintLockedInitially:recallCode.includes("if(run.mode==='RECALL'&&!run.firstAttemptMade)return;"),
    memorizationNotFaked:recallCode.includes('memorization_verified:false')
  };
  add('FIRST_FIND_RETRIEVAL_NOT_SIMPLY_EXPOSURE','First unaided recall distinct from exposure and unverifiable prior memorization',firstFind,
    Object.values(firstFind).every(Boolean),
    'Direct USER 2026-09-20T23:27:06Z and 23:27:15Z','P0 separate exposure, first recall, and assisted result');
  await pg.evaluate(()=>{currentTab='home';render()});
  await pg.click('[data-mode=link]');
  const link=await pg.evaluate(()=>({headline:document.querySelector('#view')?.innerText.slice(0,180),
   hasPairTiles:document.querySelectorAll('.tile').length,principleStep:document.querySelectorAll('[data-link-principle],.link-principle,#linkPrinciple').length,
   relatedChoiceStep:document.querySelectorAll('[data-link-related],.link-related,#linkRelated').length}));
  const linkFunction=code.slice(code.indexOf('function renderConnection'),code.indexOf('function renderWeak'));
  const hasThreeState=/principle|원리|etymolog|어근|related|관련/.test(linkFunction)&&/choice|선택/.test(linkFunction);
  // Real fixture has no verified relation: this must be a visible source HOLD,
  // not fabricated root/etymology or a hidden pass. Exercise supported flow below.
  const emptySourceHeld=link.principleStep===0&&link.relatedChoiceStep===0&&
    /LINK 전체 학습은 보류/.test(link.headline||'');
  const backed=await pg.evaluate(()=>{
    const set=connectionSet(),active=sheet();
    const anchor=set.find(x=>active.items.includes(x));
    const related=set.find(x=>anchor&&x.id!==anchor.id);
    if(!anchor||!related)return null;
    anchor.linkEvidence={sourceSupported:true,sourceSheetId:active.sheetId,reviewedAt:'2026-10-16T09:00:00Z',
      sourceRef:'SYNTHETIC_TEST_SOURCE_NOT_REAL_LEARNING',principle:'synthetic relation for flow regression only',
      relatedWordId:related.id};
    renderConnection();
    return {relatedId:related.id};
  });
  const firstBacked=!!backed&&await pg.locator('[data-link-principle]').count()===1;
  if(firstBacked)await pg.click('#linkPrincipleNext');
  const secondBacked=firstBacked&&await pg.locator('[data-link-related]').count()===1;
  if(secondBacked)await pg.click('[data-link-choice="'+backed.relatedId+'"]');
  const thirdBacked=secondBacked&&await pg.locator('[data-link-mixed]').count()===1&&await pg.locator('.tile').count()>0;
  add('USER_0922_LINK_THREE_STATES','Verified source -> touch related discrimination -> mixed relation matching, without inventing missing teaching source',
    {realSourceMissingHeld:emptySourceHeld,sourceBackedSyntheticStages:[firstBacked,secondBacked,thirdBacked]},
    hasThreeState&&emptySourceHeld&&firstBacked&&secondBacked&&thirdBacked,
    'Direct user 2026-09-22 LINK interaction; browser flow functional on synthetic source only',
    'Source-backed flow implemented, but no claim of real original content or UI approval');
  add('LINK_REAL_SOURCE_COVERAGE','Original learning source relations verified against approved worksheet or canonical source',
    {realSourcePresent:false,syntheticOnly:true,sourceContentNotApproved:true},false,
    'Original source/semantic approval required; no fabricated etymology or relation',
    'P0 material real-content gap; product completion/release HOLD');
  add('LINK_SOURCE_BACKED_THREE_STEP_BROWSER','Synthetic only: checked source principle -> tap related word -> mixed matching', 
    {first:firstBacked,second:secondBacked,third:thirdBacked,source:'SYNTHETIC_NOT_RELEASE_AUTHORITY'},
    firstBacked&&secondBacked&&thirdBacked,
    'Direct user LINK sequence 2026-09-22 + synthetic verified-source schema fixture',
    'Functional regression only; real source content, screen design and release remain HOLD');
  await pg.click('[data-tab=explore]');
  const journey=await pg.evaluate(()=>({stageCount:document.querySelectorAll('.hs-journey-trail li').length,
    hasSixStagePrimary:!!document.querySelector('#hsJourneyGo'),
    hasDirectMode:document.querySelectorAll('[data-mode]').length,
    hasCollapsedJump:!!document.querySelector('details.hs-journey-jump')}));
  add('USER_0922_NO_MANDATORY_LINEAR_COURSE','Learner primarily enters free-select exploration; internal phase states may still exist',journey,
    !journey.hasSixStagePrimary||journey.hasDirectMode>=3,
    'USER 2026-09-22 03:15 and 09-22 C2S §15','P1 assistant-authored primary stage list');
  await pg.evaluate(()=>renderRecords());
  const catchPage=await pg.evaluate(()=>({title:document.querySelector('#view')?.innerText.slice(0,115),
    badgeBook:!!document.querySelector('[data-catch=badges],#badgeBook,#catchBadges'),
    calendar:!!document.querySelector('[data-catch=calendar],#catchCalendar'),
    itemDetail:!!document.querySelector('[data-catch=item],#catchItemDetail'),
    memoryLadder:!!document.querySelector('[data-catch=memory],#memoryLadder'),
    backBtn:!!document.querySelector('#hsRecordContinue'),
    directLabels:document.querySelector('#view')?.innerText.includes('배지북')||false}));
  add('USER_0922_CATCH_SCOPE','CATCH offers items + badge book + calendar + item detail + contextual memory',catchPage,
    catchPage.badgeBook&&catchPage.calendar&&catchPage.itemDetail,
    'USER 2026-09-22 04:00/04:02 and UI C2S §6','P1 record/badge/calendar omission');
  // Inspect only the DEFAULT image-analysis handler. External Gemini lives
  // in a separately labeled, user-initiated fallback and is not evidence that
  // the local-first entry point requires a key or makes a provider call.
  const capture=code.slice(code.indexOf('async function analyzeSheet('),code.indexOf('async function analyzeSheetExternal('));
  const localRecognizer=code.slice(code.indexOf('async function detectLocalOCR('),code.indexOf('// On-device first:'));
  const optionalExternal=code.slice(code.indexOf('async function analyzeSheetExternal('),code.indexOf('async function gemini('));
  const ocr={
    requiresPrivateKey:/\bruntimeApiKey\b/.test(capture),
    callsProviderDirect:/\bgemini\s*\(|generativelanguage\.googleapis\.com/.test(capture),
    nativeFirst:capture.includes('await detectLocalOCR(file)')&&localRecognizer.includes('window.TextDetector'),
    optionalExternalRequiresConsent:optionalExternal.includes('window.confirm(')&&optionalExternal.includes('if(!runtimeApiKey)'),
    unsupportedManualFallback:capture.includes('renderManualEntry(why'),
    allRowsNeedReview:localRecognizer.includes("needsReview:true")
  };
  add('USER_1001_ONDEVICE_OCR_FIRST','Supported browsers use on-device OCR before key/network; unsupported devices retain manual intake',ocr,
    ocr.nativeFirst&&!ocr.requiresPrivateKey&&!ocr.callsProviderDirect&&ocr.optionalExternalRequiresConsent&&ocr.unsupportedManualFallback&&ocr.allRowsNeedReview,
    'USER 2026-10-01 08:18 and HIDE_RUNTIME_V2 family shared Capture contract','P1 user accepted option not reflected in code');
  const master=fs.readFileSync(path.join(root,'Hide_Seek_UI_MASTER_LOGIC_REV_04.md'),'utf8');
  add('ASSISTANT_MASTER_GOVERNANCE_UNVERIFIED','Assistant-added reconciliation text must not be treated as direct user-approved authority',{
    sectionAdded:/### 5\.1 ENGLISH-DEFAULT \/ SIX-SUBJECT SWITCH/.test(master),
    candidateArchived:fs.existsSync(path.join(root,'.local','AUTHORITY_CLEANUP_20261017','ASSISTANT_CANDIDATE_NOT_APPROVED.md'))},
    !/### 5\.1 ENGLISH-DEFAULT \/ SIX-SUBJECT SWITCH/.test(master)&&fs.existsSync(path.join(root,'.local','AUTHORITY_CLEANUP_20261017','ASSISTANT_CANDIDATE_NOT_APPROVED.md')),
    'Worktree diff uncommitted and 2026-10-01 user source vs assistant prose','AUDIT: review clauses independently; not a functional failure');
  add('QA_NOT_PARITY','An E2E test of 4 controls and background cannot prove 1:1 golden visual parity',{
    goldenBinaryCompared:false,existingTest:'tools/approved-home-learning-behavior.e2e.cjs',nameIncludesApproved:true},false,
    'Visual registry: approved image vs background; 10/04 parity HOLD','AUDIT: misleading test name/claims');
  // Dated direct user LINK interaction recovered 2026-09-22.
  // Verified synthetic stage flow cannot authorize real teaching content;
  // CATCH detail and visual parity retain separate source/approval gaps.
  const evidenceOnly=new Set(['USER_0922_CATCH_SCOPE','QA_NOT_PARITY','LINK_REAL_SOURCE_COVERAGE']);
  const violations=checks.filter(x=>!x.pass&&!evidenceOnly.has(x.id)).map(x=>x.id);
  const sourceGaps=checks.filter(x=>!x.pass&&evidenceOnly.has(x.id)).map(x=>x.id);
  const result={suite:'USER_DECISION_INDEPENDENT_REGRESSION_V1',sourceRunId:process.env.TAKY_QA_RUN_ID||('LOCAL_ONLY_'+process.pid+'_'+Date.now()),source:'Dated direct user decisions + approved artifacts + runtime; source-gaps are not assumed direct-user rejections',
    appCodeModified:false,syntheticFixture:true,checks,pageErrors,violations,sourceGaps,
    verdict:violations.length||pageErrors.length?'USER_CONTRACT_VIOLATION':sourceGaps.length?'SOURCE_EVIDENCE_HOLD':'DIRECT_CHECKS_PASS_NO_GAPS',
    failed:[...violations,...sourceGaps]};
  fs.writeFileSync(path.join(out,'USER_DECISION_INDEPENDENT_REGRESSION.json'),JSON.stringify(result,null,2),'utf8');
  console.log(JSON.stringify({checks:checks.map(x=>({id:x.id,pass:x.pass,observed:x.observed})),failed:result.failed,pageErrors},null,2));
  // A source/visual approval HOLD is not a proven code regression. The
  // aggregate QA consumes this receipt's sourceGaps as separate P0/P1 gaps.
  if(violations.length||pageErrors.length)process.exitCode=1;
  else if(sourceGaps.length)console.log('SOURCE_EVIDENCE_HOLD '+JSON.stringify(sourceGaps));
  await context.close();
 }catch(e){console.error('INDEPENDENT_AUDIT_HARNESS_ERROR',e.stack);process.exitCode=3}
 finally{await browser?.close().catch(()=>{});server.kill()}
})().catch(e=>{console.error('INDEPENDENT_AUDIT_FATAL',e.stack);process.exitCode=3});
