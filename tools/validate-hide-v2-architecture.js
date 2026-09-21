#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
const modules=[
  'src/v2/app-store.js','src/v2/mission-service.js','src/v2/memory-engine.js',
  'src/v2/learning-session.js','src/v2/capture-controller.js','src/v2/router.js',
  'src/v2/legacy-migration.js','src/v2/ready-bridge.js','src/v2/app.js'
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

const store=fs.readFileSync(path.join(ROOT,'src/v2/app-store.js'),'utf8');
if(!store.includes("const KEY='hide_seek_v2_state'"))fail.push('V2_STATE_OWNER_MISSING');
const mission=fs.readFileSync(path.join(ROOT,'src/v2/mission-service.js'),'utf8');
if(!mission.includes('HideV2Store.transaction'))fail.push('MISSION_WRITE_MUST_USE_STORE');
const memory=fs.readFileSync(path.join(ROOT,'src/v2/memory-engine.js'),'utf8');
if(!memory.includes("authority:'SPECIALIST_MEMORY_ADVISORY_ONLY'"))fail.push('MEMORY_ADVISORY_AUTHORITY_MISSING');
if(!memory.includes("reviewPolicyOwner:'READY_LEARNING_ENGINE'"))fail.push('READY_POLICY_OWNER_MISSING');
if(!memory.includes("scheduleOwner:'READY_SET_PLANNER'"))fail.push('PLANNER_OWNER_MISSING');
const migration=fs.readFileSync(path.join(ROOT,'src/v2/legacy-migration.js'),'utf8');
if(migration.includes('removeItem(LEGACY_KEY)')||migration.includes("removeItem('hide_seek_state')"))fail.push('LEGACY_DATA_MUST_NOT_BE_DELETED');
if(!migration.includes('legacyPreserved:true'))fail.push('NON_DESTRUCTIVE_MIGRATION_EVIDENCE_MISSING');

if(fail.length){
  console.error('FAIL: Hide Runtime V2 architecture');
  for(const x of fail)console.error(x);
  process.exit(1);
}
console.log('PASS: Hide Runtime V2 is isolated from legacy monolithic runtime and preserves ownership boundaries');

const ready=fs.readFileSync(path.join(ROOT,'src/v2/ready-bridge.js'),'utf8');
for(const token of ["EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE","reviewPolicyOwner:'READY_LEARNING_ENGINE'","scheduleOwner:'READY_SET_PLANNER'"]){
  if(!ready.includes(token))fail.push('V2_READY_OWNERSHIP_MISSING:'+token);
}
