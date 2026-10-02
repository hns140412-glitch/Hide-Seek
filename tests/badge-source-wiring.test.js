const fs=require('fs');
const vm=require('vm');

function assert(name,condition){
  if(!condition)throw new Error('FAIL '+name);
  console.log('PASS',name);
}

const source=fs.readFileSync('hide-badge-source-observation-v01.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

const sandbox={
  console,
  CustomEvent:function(type,init){this.type=type;this.detail=init?.detail},
  window:{dispatchEvent(){}}
};
sandbox.globalThis=sandbox;
vm.runInNewContext(source,sandbox,{filename:'hide-badge-source-observation-v01.js'});

const api=sandbox.HideBadgeSourceObservationV01;
assert('hide-badge-source-contract-loaded',api?.CONTRACT==='TAKY_BADGE_SOURCE_OBSERVATION_V1');
const state={badgeSourceObservations:[]};
const prior={wordId:'w1',type:'WRONG',at:'2026-10-02T00:00:00.000Z'};
const current={wordId:'w1',type:'CORRECT',at:'2026-10-02T00:01:00.000Z'};
const obs=api.recordRetraceCorrection({state,sheetId:'sample',wordId:'w1',priorAttempt:prior,currentAttempt:current});
assert('wrong-then-retrace-correct-emits-source',obs?.event_family==='ERROR_CORRECTION'&&obs?.behavior_code==='ERROR_CORRECTED_COMPLETE');
assert('hide-source-is-observation-only',obs?.badge_award_authorized===false&&obs?.economy_mutation_authorized===false&&obs?.catalog_activation_allowed===false);
assert('source-ledger-persists-observation',state.badgeSourceObservations?.length===1);
const skipped=api.recordRetraceCorrection({
  state,sheetId:'sample',wordId:'w2',
  priorAttempt:{wordId:'w2',type:'HINT_USED',at:'2026-10-02T00:00:00.000Z'},
  currentAttempt:{wordId:'w2',type:'CORRECT',at:'2026-10-02T00:01:00.000Z'}
});
assert('hint-used-does-not-masquerade-as-error-correction',skipped===null&&state.badgeSourceObservations.length===1);
let weakBlocked=false;
try{
  api.normalize({
    event_id:'weak',event_family:'ERROR_CORRECTION',behavior_code:'ERROR_CORRECTED_COMPLETE',
    source_contract_id:'HIDE_RETRACE_CORRECTION_V1',evidence_ref:'weak',explicit_child_action:true,
    payload:{responseLatencyMs:1000}
  });
}catch{weakBlocked=true}
assert('weak-proxy-payload-blocked',weakBlocked===true);
assert('app-wires-only-retry-correct-after-prior-wrong',
  app.includes("S.codeRed.retryOnly&&type==='CORRECT'")&&
  app.includes("x?.wordId===w.id&&x?.type==='WRONG'")&&
  app.includes("HideBadgeSourceObservationV01?.recordRetraceCorrection"));
assert('source-runtime-loads-before-app',
  index.indexOf('hide-badge-source-observation-v01.js')<index.indexOf('./app.js'));
assert('source-runtime-is-precached',sw.includes("'./hide-badge-source-observation-v01.js'"));

console.log('HIDE_BADGE_SOURCE_PRODUCER_PASS');
