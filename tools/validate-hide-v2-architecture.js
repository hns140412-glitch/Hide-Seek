#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
const modules=[
  'src/v2/app-store.js','src/v2/mission-service.js','src/v2/memory-engine.js',
  'src/v2/learning-session.js','src/v2/session-service.js','src/v2/capture-store.js','src/v2/capture-controller.js','src/v2/router.js',
  'src/v2/legacy-migration.js','src/v2/ready-bridge.js','src/v2/pwa-v2.js','src/v2/mobile-shell.js','src/v2/app.js'
];
const fail=[];
for(const file of modules){
  const full=path.join(ROOT,file);
  if(!fs.existsSync(full)){fail.push('MISSING_MODULE:'+file);continue}
  const src=fs.readFileSync(full,'utf8');
  for(const token of ['HideCaptureRuntime','renderOCRReview','renderMissionDetail','currentTab','codeRed','S.learning','S.sheets','hideSeekCaptureSession']){
    if(src.includes(token))fail.push('LEGACY_RUNTIME_COUPLING:'+file+':'+token);
  }
}
const html=fs.readFileSync(path.join(ROOT,'v2.html'),'utf8');
for(const file of modules){
  if(!html.includes('./'+file))fail.push('V2_ENTRYPOINT_MISSING_MODULE:'+file);
}
if(html.includes('./app.js'))fail.push('V2_MUST_NOT_LOAD_LEGACY_APP_JS');
if(html.includes('./hide-runtime.js'))fail.push('V2_MUST_NOT_LOAD_LEGACY_HIDE_RUNTIME');
if(html.includes('./hide-bridge.js'))fail.push('V2_MUST_NOT_LOAD_LEGACY_HIDE_BRIDGE');

const v2css=fs.readFileSync(path.join(ROOT,'src/v2/v2.css'),'utf8');
if(!html.includes('./src/v2/v2.css'))fail.push('V2_LAYOUT_BOUNDARY_STYLESHEET_MISSING');
if(!html.includes('class="v2-runtime"'))fail.push('V2_BODY_LAYOUT_BOUNDARY_MISSING');
if(!v2css.includes('.v2-runtime .top-safe'))fail.push('V2_HEADER_HIT_AREA_OVERRIDE_MISSING');

const learning=fs.readFileSync(path.join(ROOT,'src/v2/learning-session.js'),'utf8');
for(const stage of ['MEMORIZE','FIRST_FIND','MEANING','DOMAIN_EXTENSION','FINAL_SEEK','SEEK_AGAIN_RELEARN','SEEK_AGAIN','COMPLETE']){
  if(!learning.includes("'"+stage+"'"))fail.push('V2_LEARNING_STAGE_MISSING:'+stage);
}
if(!learning.includes('submitMemorize'))fail.push('V2_MEMORIZATION_EVIDENCE_MISSING');
if(!learning.includes('checkFinalSeek'))fail.push('V2_FINAL_SEEK_EVIDENCE_MISSING');
if(!learning.includes('submitSeekAgainRelearn'))fail.push('V2_SEEK_AGAIN_RELEARN_MISSING');
if(!learning.includes('checkSeekAgain'))fail.push('V2_SEEK_AGAIN_RECALL_MISSING');
if(!app.includes("childStageLabel('SEEK_AGAIN_RELEARN')"))fail.push('V2_SEEK_AGAIN_RELEARN_UI_MISSING');
if(!app.includes("childStageLabel('SEEK_AGAIN')"))fail.push('V2_SEEK_AGAIN_UI_MISSING');

const captureStore=fs.readFileSync(path.join(ROOT,'src/v2/capture-store.js'),'utf8');
if(!captureStore.includes("const DB_NAME='hide-seek-v2-assets'"))fail.push('V2_CAPTURE_ASSET_STORE_MISSING');
const capture=fs.readFileSync(path.join(ROOT,'src/v2/capture-controller.js'),'utf8');
for(const token of ['analysisRows',"page.status==='ANALYZED'",'retryable:true']){
  if(!capture.includes(token))fail.push('V2_OCR_PAGE_RECOVERY_MISSING:'+token);
}
for(const token of ['captureSession','analysisBatches','lastRows','markCommitted','hasResumableReview']){
  if(!capture.includes(token))fail.push('V2_CAPTURE_RESUME_CONTRACT_MISSING:'+token);
}
if(!html.includes('id="sheetCameraInput"'))fail.push('V2_CAMERA_INPUT_MISSING');
if(!html.includes('id="sheetLibraryInput"'))fail.push('V2_LIBRARY_INPUT_MISSING');
if(!html.includes('./manifest-v2.json'))fail.push('V2_MANIFEST_LINK_MISSING');
if(!html.includes('./src/v2/release-v2.js'))fail.push('V2_RELEASE_DESCRIPTOR_MISSING');
if(!html.includes('./src/v2/pwa-v2.js'))fail.push('V2_PWA_OWNER_MISSING');


const store=fs.readFileSync(path.join(ROOT,'src/v2/app-store.js'),'utf8');
if(!store.includes("const KEY='hide_seek_v2_state'"))fail.push('V2_STATE_OWNER_MISSING');
if(!store.includes("hide-v2-state-saved"))fail.push('V2_STATE_SAVE_SIGNAL_MISSING');

const mission=fs.readFileSync(path.join(ROOT,'src/v2/mission-service.js'),'utf8');
for(const token of ['listMissions','renameMission','archiveMission','deleteMission','ACTIVE_SESSION_MISSION_DELETE_BLOCKED']){
  if(!mission.includes(token))fail.push('MISSION_LIFECYCLE_CONTRACT_MISSING:'+token);
}

if(!mission.includes('HideV2Store.transaction'))fail.push('MISSION_WRITE_MUST_USE_STORE');
const memory=fs.readFileSync(path.join(ROOT,'src/v2/memory-engine.js'),'utf8');
for(const token of ['signature','memoryStrength','nextReviewPriority','recoveryStatus','wordbook','dashboard']){
  if(!memory.includes(token))fail.push('V2_MEMORY_LADDER_CONTRACT_MISSING:'+token);
}

if(!memory.includes("authority:'SPECIALIST_MEMORY_ADVISORY_ONLY'"))fail.push('MEMORY_ADVISORY_AUTHORITY_MISSING');
if(!memory.includes("reviewPolicyOwner:'READY_LEARNING_ENGINE'"))fail.push('READY_POLICY_OWNER_MISSING');
if(!memory.includes("scheduleOwner:'READY_SET_PLANNER'"))fail.push('PLANNER_OWNER_MISSING');
const migration=fs.readFileSync(path.join(ROOT,'src/v2/legacy-migration.js'),'utf8');
if(migration.includes('removeItem(LEGACY_KEY)')||migration.includes("removeItem('hide_seek_state')"))fail.push('LEGACY_DATA_MUST_NOT_BE_DELETED');
if(!migration.includes('legacyPreserved:true'))fail.push('NON_DESTRUCTIVE_MIGRATION_EVIDENCE_MISSING');

const app=fs.readFileSync(path.join(ROOT,'src/v2/app.js'),'utf8');
for(const token of ['renderStarterExplorationHtml','bindThinkingTrail','inference-submit','thinking-reveal','기억 흔적','record-detail','v2RecordBack']){
  if(!app.includes(token))fail.push('V2_THINKING_OR_MEMORY_DETAIL_MISSING:'+token);
}
for(const token of ['기억 기록','단어장','우선 복습순','v2Records']){
  if(!app.includes(token))fail.push('V2_MEMORY_SURFACE_MISSING:'+token);
}

for(const token of ['confidence','ocr-warning','v2RetryOcr','renderOcrFailure']){
  if(!app.includes(token))fail.push('V2_OCR_REVIEW_RESILIENCE_UI_MISSING:'+token);
}
for(const token of ['OCR 단어','OCR 뜻','data-review-toggle','미션 관리','data-action="rename"','data-action="delete"']){
  if(!app.includes(token))fail.push('V2_PRODUCT_MANAGEMENT_UI_MISSING:'+token);
}

const mobile=fs.readFileSync(path.join(ROOT,'src/v2/mobile-shell.js'),'utf8');
for(const token of ['visualViewport','keepFocusedControlVisible','scrollIntoView','--v2-visual-height']){
  if(!mobile.includes(token))fail.push('V2_MOBILE_VIEWPORT_OWNER_MISSING:'+token);
}
if(!html.includes('./src/v2/mobile-shell.js'))fail.push('V2_MOBILE_SHELL_NOT_LOADED');
for(const forbidden of ['Runtime V2','Hide & Seek V2']){
  if(html.includes(forbidden))fail.push('CHILD_FACING_RUNTIME_JARGON:'+forbidden);
}
for(const forbidden of ['<span>HIDE V2</span>','<span>REWRITE</span>','<h2>V2 상태</h2>','monolith-free','구조 분리형 런타임']){
  if(app.includes(forbidden))fail.push('CHILD_FACING_INTERNAL_JARGON:'+forbidden);
}
for(const required of ['숨은 단어 탐험','탐험 준비','단어 만나기','첫 찾기','뜻 단서','연결 길','마지막 찾기']){
  if(!app.includes(required)&&!html.includes(required))fail.push('CHILD_FACING_EXPLORATION_COPY_MISSING:'+required);
}

for(const token of ['--v2-safe-bottom','max-width:390px','min-height:44px','overflow-wrap:anywhere']){
  if(!v2css.includes(token))fail.push('V2_MOBILE_CSS_GUARD_MISSING:'+token);
}

const pwa=fs.readFileSync(path.join(ROOT,'src/v2/pwa-v2.js'),'utf8');
for(const token of ["register('./sw-v2.js'","safePoint","captureSession","activeSession","APPLY_UPDATE"]){
  if(!pwa.includes(token))fail.push('V2_PWA_CONTRACT_MISSING:'+token);
}
const sw=fs.readFileSync(path.join(ROOT,'sw-v2.js'),'utf8');
for(const token of ["./v2.html","./manifest-v2.json","hide-seek-v2:","caches.match('./v2.html')"]){
  if(!sw.includes(token))fail.push('V2_SW_CONTRACT_MISSING:'+token);
}
if(sw.includes("'./index.html'")||sw.includes("'./app.js'")||sw.includes("'./hide-runtime.js'"))fail.push('V2_SW_MUST_NOT_CACHE_V1_RUNTIME');

const ready=fs.readFileSync(path.join(ROOT,'src/v2/ready-bridge.js'),'utf8');
for(const token of ["EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE","reviewPolicyOwner:'READY_LEARNING_ENGINE'","scheduleOwner:'READY_SET_PLANNER'"]){
  if(!ready.includes(token))fail.push('V2_READY_OWNERSHIP_MISSING:'+token);
}
const sessionService=fs.readFileSync(path.join(ROOT,'src/v2/session-service.js'),'utf8');
if(!sessionService.includes('HideV2Store.transaction'))fail.push('SESSION_STATE_MUST_USE_STORE');
if(!sessionService.includes('activeSession'))fail.push('PERSISTED_ACTIVE_SESSION_OWNER_MISSING');

if(fail.length){
  console.error('FAIL: Hide Runtime V2 architecture');
  for(const x of fail)console.error(x);
  process.exit(1);
}
console.log('PASS: Hide Runtime V2 is isolated from legacy monolithic runtime and preserves ownership boundaries');
