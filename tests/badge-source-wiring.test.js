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
const review=api.recordErrorReview({
  state,sheetId:'sample',targetWordIds:['w1','w2'],at:'2026-10-02T00:00:30.000Z'
});
assert('explicit-retrace-review-emits-source',review?.event_family==='ERROR_DISCOVERY'&&review?.behavior_code==='ERROR_REVIEW'&&review?.source_contract_id==='HIDE_EXPLICIT_RETRACE_REVIEW_V1');
assert('retrace-review-is-observation-only',review?.badge_award_authorized===false&&review?.economy_mutation_authorized===false&&review?.catalog_activation_allowed===false);
assert('wrong-then-retrace-correct-emits-source',obs?.event_family==='ERROR_CORRECTION'&&obs?.behavior_code==='ERROR_CORRECTED_COMPLETE');
assert('hide-source-is-observation-only',obs?.badge_award_authorized===false&&obs?.economy_mutation_authorized===false&&obs?.catalog_activation_allowed===false);
assert('source-ledger-persists-observations',state.badgeSourceObservations?.length===2);
const skipped=api.recordRetraceCorrection({
  state,sheetId:'sample',wordId:'w2',
  priorAttempt:{wordId:'w2',type:'HINT_USED',at:'2026-10-02T00:00:00.000Z'},
  currentAttempt:{wordId:'w2',type:'CORRECT',at:'2026-10-02T00:01:00.000Z'}
});
assert('hint-used-does-not-masquerade-as-error-correction',skipped===null&&state.badgeSourceObservations.length===2);
let weakBlocked=false;
try{
  api.normalize({
    event_id:'weak',event_family:'ERROR_CORRECTION',behavior_code:'ERROR_CORRECTED_COMPLETE',
    source_contract_id:'HIDE_RETRACE_CORRECTION_V1',evidence_ref:'weak',explicit_child_action:true,
    payload:{responseLatencyMs:1000}
  });
}catch{weakBlocked=true}
assert('weak-proxy-payload-blocked',weakBlocked===true);
assert('app-wires-explicit-retrace-review-to-retry-button',
  app.includes("HideBadgeSourceObservationV01?.recordErrorReview")&&
  app.includes("targetWordIds:targets.map(w=>w.id)")&&
  app.includes("startCodeRed(true)"));
assert('app-wires-only-retry-correct-after-prior-wrong',
  app.includes("S.codeRed.retryOnly&&type==='CORRECT'")&&
  app.includes("x?.wordId===w.id&&x?.type==='WRONG'")&&
  app.includes("HideBadgeSourceObservationV01?.recordRetraceCorrection"));

const courageState={badgeSourceObservations:[]};
const couragePrior={wordId:'w1',type:'WRONG',at:'2026-10-02T00:00:00.000Z'};
const courageReview=api.recordErrorReview({
  state:courageState,sheetId:'sample',targetWordIds:['w1'],at:'2026-10-02T00:00:30.000Z'
});
const courageCurrent={wordId:'w1',type:'CORRECT',at:'2026-10-02T00:01:00.000Z'};
Object.assign(couragePrior,{sheetId:'sample',rejectedSelection:{target:'cat',position:0,selected:'b'}});
Object.assign(courageCurrent,{sheetId:'sample',verificationBasis:'RETRIEVAL_EXACT_MATCH_V1',answerArtifact:{target:'cat',positions:[0],letters:['c']}});
courageState.sheets=[{sheetId:'sample',items:[{id:'w1',eng:'cat'}]}];
courageState.codeRed={history:[couragePrior,courageCurrent]};
const courage=api.recordCorrectionCourage({
  state:courageState,sheetId:'sample',wordId:'w1',
  priorAttempt:couragePrior,currentAttempt:courageCurrent,reviewObservation:courageReview
});
assert('explicit-retrace-intent-plus-correction-emits-correction-courage',
  courage?.event_family==='ERROR_CORRECTION'&&
  courage?.behavior_code==='CORRECTION_COURAGE'&&
  courage?.source_contract_id==='HIDE_RETRACE_CORRECTION_COURAGE_V1');
assert('correction-courage-stays-observation-only',
  courage?.badge_award_authorized===false&&
  courage?.economy_mutation_authorized===false&&
  courage?.catalog_activation_allowed===false);
assert('correction-courage-rejects-missing-explicit-review',
  api.recordCorrectionCourage({
    state:courageState,sheetId:'sample',wordId:'w1',
    priorAttempt:couragePrior,currentAttempt:courageCurrent,reviewObservation:null
  })===null);

assert('source-runtime-loads-before-app',
  index.indexOf('hide-badge-source-observation-v01.js')<index.indexOf('./app.js'));
assert('source-runtime-is-precached',sw.includes("'./hide-badge-source-observation-v01.js'"));

console.log('HIDE_BADGE_SOURCE_PRODUCER_PASS');

const args={state:courageState,sheetId:'sample',wordId:'w1',priorAttempt:couragePrior,currentAttempt:courageCurrent,reviewObservation:courageReview};
function rejects(name,change){
  const copy=JSON.parse(JSON.stringify(args));
  copy.priorAttempt=copy.state.codeRed.history[0];copy.currentAttempt=copy.state.codeRed.history[1];
  copy.reviewObservation=copy.state.badgeSourceObservations.find(x=>x.behavior_code==='ERROR_REVIEW');
  change(copy);
  const before=copy.state.badgeSourceObservations.length;
  assert(name,api.recordCorrectionCourage(copy)===null&&copy.state.badgeSourceObservations.length===before);
}
rejects('labels-without-error-artifact',x=>delete x.priorAttempt.rejectedSelection);
rejects('counter-is-not-error-artifact',x=>{delete x.priorAttempt.rejectedSelection;x.priorAttempt.wrongAttempts=10});
rejects('missing-answer-artifact',x=>delete x.currentAttempt.answerArtifact);
rejects('unverified-correct-label',x=>delete x.currentAttempt.verificationBasis);
rejects('incorrect-answer',x=>x.currentAttempt.answerArtifact.letters=['b']);
rejects('empty-answer',x=>{x.currentAttempt.answerArtifact.positions=[];x.currentAttempt.answerArtifact.letters=[]});
rejects('non-error-selection',x=>x.priorAttempt.rejectedSelection.selected='c');
rejects('different-prior-word',x=>x.priorAttempt.wordId='w2');
rejects('different-prior-sheet',x=>x.priorAttempt.sheetId='other');
rejects('changed-target',x=>x.state.sheets[0].items[0].eng='dog');
rejects('missing-history',x=>x.state.codeRed.history=[]);
rejects('unrecorded-review',x=>x.state.badgeSourceObservations=[]);
rejects('non-child-review',x=>x.reviewObservation.explicit_child_action=false);
rejects('wrong-review-contract',x=>x.reviewObservation.source_contract_id='HIDE_RETRACE_CORRECTION_V1');
rejects('review-other-target',x=>x.reviewObservation.payload.targetWordIds=['w2']);
rejects('review-before-error',x=>x.reviewObservation.occurred_at='2026-10-01T00:00:00Z');
rejects('review-after-correction',x=>x.reviewObservation.occurred_at='2026-10-03T00:00:00Z');
rejects('invalid-date',x=>x.currentAttempt.at='invalid');
rejects('hint-result',x=>x.currentAttempt.type='HINT_USED');
assert('deduplicates-courage',api.recordCorrectionCourage(args)===courage&&courageState.badgeSourceObservations.length===2);
assert('distinct-from-retrace-correction',courage.source_contract_id!==obs.source_contract_id&&courage.behavior_code!==obs.behavior_code);
assert('explicit-child-and-artifact-links',courage.explicit_child_action===true&&!!courage.payload.errorArtifactRef&&!!courage.payload.correctedArtifactRef);
assert('runtime-captures-rejected-selection',app.includes('codeSession.rejectedSelection={target:wTarget(codeSession.word)'));
assert('runtime-captures-answer-artifact',app.includes('attempt.answerArtifact={target:wTarget(w)'));
assert('runtime-prior-is-same-sheet',app.includes("x?.type==='WRONG'&&x?.sheetId===(sheet()?.sheetId||'unknown')"));
console.log('HIDE_CORRECTION_COURAGE_FAIL_CLOSED_PASS');

// Execute the actual selection/result producers with isolated state and no browser/network.
const word={id:'w1',eng:'cat'};
const runtimeState={sheets:[{sheetId:'sample',items:[word]}],badgeSourceObservations:[],
  codeRed:{history:[],results:{},retrace:[],index:0,retryOnly:false},learning:{combo:0,flow:0}};
const runtime={S:runtimeState,HideBadgeSourceObservationV01:api,
  sheet:()=>runtimeState.sheets[0],nowISO:()=> '2026-10-02T00:00:00Z',
  $:()=>null,$$:()=>[],CSS:{escape:x=>x},setPartner(){},updateCodeUI(){},setTimeout(){},
  stopCodeTimer(){},markStudy(){},save(){},codeTargets:()=>[],finishCodeRed(){}};
vm.createContext(runtime);
vm.runInContext(app.slice(app.indexOf('function wTarget('),app.indexOf('function updateCodeUI(')),runtime);
vm.runInContext(app.slice(app.indexOf('function checkCodeAnswer('),app.indexOf('function startCodeTimer(')),runtime);
function session(){return {word,blankIdx:[0],keys:[{id:'bad',ch:'b'},{id:'good',ch:'c'}],answers:{},wrongAttempts:0,hintLevel:0}}
runtime.codeSession=session();
runtime.placeKey('bad',0);runtime.placeKey('good',0);runtime.checkCodeAnswer();
assert('real-selection-persists-error-artifact',runtimeState.codeRed.history[0].rejectedSelection.selected==='b');
api.recordErrorReview({state:runtimeState,sheetId:'sample',targetWordIds:['w1'],at:runtime.nowISO()});
runtimeState.codeRed.retryOnly=true;runtime.codeSession=session();
runtime.placeKey('good',0);runtime.checkCodeAnswer();
const produced=runtimeState.badgeSourceObservations.filter(x=>x.behavior_code==='CORRECTION_COURAGE');
assert('real-child-action-to-verified-outcome',produced.length===1&&produced[0].explicit_child_action===true);
assert('equal-timestamps-no-duration-evidence',produced[0].payload.priorWrongAt===produced[0].payload.correctedAt);
assert('no-counter-or-score-in-observation',!api.hasForbiddenKeyDeep(produced[0].payload));
console.log('HIDE_CORRECTION_COURAGE_RUNTIME_PASS');



const improvementState={badgeSourceObservations:[]};
const improvementComparison={
  contract_version:'TAKY_LEARNING_BADGE_IMPROVEMENT_COMPARISON_V1',
  authority:'LEARNING_VERIFICATION_RECEIPT_COMPARISON',
  comparison_id:'improvement:word:a:a1:a2',
  source_app:'hide-seek',learning_target_id:'word:a',
  prior_event_id:'a1',current_event_id:'a2',
  prior_receipt_id:'vr-a1',current_receipt_id:'vr-a2',
  prior_verified_outcome:0,current_verified_outcome:1,
  prior_child_action_ref:'hide-action:a1',current_child_action_ref:'hide-action:a2',
  verified_improvement:true,explicit_child_action:true
};
const improvement=api.recordVerifiedImprovement({state:improvementState,comparison:improvementComparison});
assert('verified-same-target-improvement-emits-source',improvement?.event_family==='IMPROVEMENT'&&improvement?.behavior_code==='IMPROVEMENT'&&improvement?.source_contract_id==='HIDE_VERIFIED_SAME_TARGET_IMPROVEMENT_V1');
assert('improvement-observation-is-observation-only',improvement?.badge_award_authorized===false&&improvement?.economy_mutation_authorized===false);
assert('improvement-requires-comparison-authority',api.recordVerifiedImprovement({state:{badgeSourceObservations:[]},comparison:{...improvementComparison,authority:'BROWSER_SELF_REPORT'}})===null);
assert('improvement-requires-action-linkage',api.recordVerifiedImprovement({state:{badgeSourceObservations:[]},comparison:{...improvementComparison,current_child_action_ref:''}})===null);
assert('improvement-requires-fail-to-success',api.recordVerifiedImprovement({state:{badgeSourceObservations:[]},comparison:{...improvementComparison,prior_verified_outcome:1}})===null);
assert('improvement-has-no-weak-proxy-payload',!api.hasForbiddenKeyDeep(improvement.payload));
console.log('HIDE_VERIFIED_IMPROVEMENT_CONTRACT_PASS');


const rootCauseState={
  sheets:[{sheetId:'sample',items:[{id:'w1',eng:'cat'}]}],
  badgeSourceObservations:[],
  codeRed:{history:[{
    wordId:'w1',sheetId:'sample',type:'WRONG',at:'2026-10-02T00:00:00.000Z',
    rejectedSelection:{target:'cat',position:0,selected:'b'}
  }]}
};
const rootError=rootCauseState.codeRed.history[0];
const rootCause=api.recordRootCauseFound({
  state:rootCauseState,sheetId:'sample',wordId:'w1',errorAttempt:rootError,
  causeText:'발음이 비슷해서 헷갈렸어요',
  causeActionRef:'hide-root-cause-action:sample:w1:1',
  at:'2026-10-02T00:00:30.000Z'
});
assert('root-cause-binds-captured-error-artifact',
  rootCause?.event_family==='ERROR_ANALYSIS'&&
  rootCause?.behavior_code==='ROOT_CAUSE_FOUND'&&
  rootCause?.source_contract_id==='HIDE_ERROR_ARTIFACT_ROOT_CAUSE_V1'&&
  rootCause?.payload?.errorArtifactRef==='hide-code-result:sample:w1:2026-10-02T00:00:00.000Z:rejectedSelection');
assert('root-cause-is-observation-only',
  rootCause?.explicit_child_action===true&&rootCause?.badge_award_authorized===false&&
  rootCause?.economy_mutation_authorized===false&&rootCause?.catalog_activation_allowed===false);
assert('root-cause-rejects-missing-error-history',
  api.recordRootCauseFound({state:{...rootCauseState,codeRed:{history:[]}},sheetId:'sample',wordId:'w1',
    errorAttempt:rootError,causeText:'헷갈렸어요',causeActionRef:'a'})===null);
assert('root-cause-rejects-generic-label-without-artifact',
  api.recordRootCauseFound({state:rootCauseState,sheetId:'sample',wordId:'w1',
    errorAttempt:{wordId:'w1',sheetId:'sample',type:'WRONG',at:'2026-10-02T00:00:00.000Z'},
    causeText:'헷갈렸어요',causeActionRef:'a'})===null);
assert('root-cause-rejects-empty-child-explanation',
  api.recordRootCauseFound({state:rootCauseState,sheetId:'sample',wordId:'w1',
    errorAttempt:rootError,causeText:'',causeActionRef:'a'})===null);
assert('app-wires-root-cause-action-to-retrace-error-artifact',
  app.includes('root-cause-retrace')&&app.includes('openRootCauseModal')&&
  app.includes('recordRootCauseFound')&&app.includes("x?.type==='WRONG'")&&
  app.includes('x?.rejectedSelection'));
console.log('HIDE_ROOT_CAUSE_ARTIFACT_PASS');


const persistenceState={
  sheets:[{sheetId:'sample',items:[{id:'w1',eng:'cat'}]}],
  badgeSourceObservations:[],
  codeRed:{history:[]}
};
const persistencePrior={
  wordId:'w1',sheetId:'sample',type:'WRONG',at:'2026-10-02T00:00:00.000Z',
  rejectedSelection:{target:'cat',position:0,selected:'b'}
};
persistenceState.codeRed.history.push(persistencePrior);
const persistenceReview=api.recordErrorReview({
  state:persistenceState,sheetId:'sample',targetWordIds:['w1'],at:'2026-10-02T00:00:30.000Z'
});
const persistenceCurrent={
  wordId:'w1',sheetId:'sample',type:'CORRECT',at:'2026-10-02T00:01:00.000Z',
  verificationBasis:'RETRIEVAL_EXACT_MATCH_V1',
  answerArtifact:{target:'cat',positions:[0],letters:['c']}
};
persistenceState.codeRed.history.push(persistenceCurrent);
const persistence=api.recordPersistentBreakthrough({
  state:persistenceState,sheetId:'sample',wordId:'w1',
  priorAttempt:persistencePrior,currentAttempt:persistenceCurrent,reviewObservation:persistenceReview
});
assert('persistent-breakthrough-requires-error-retrace-solve-chain',
  persistence?.event_family==='BREAKTHROUGH'&&
  persistence?.behavior_code==='PERSISTENT_BREAKTHROUGH'&&
  persistence?.source_contract_id==='HIDE_BLOCKED_CONTINUE_SOLVE_V1');
assert('persistent-breakthrough-links-three-direct-evidence-points',
  !!persistence?.payload?.blockedArtifactRef&&
  persistence?.payload?.continueActionRef===persistenceReview.event_id&&
  !!persistence?.payload?.solvedArtifactRef);
assert('persistent-breakthrough-stays-observation-only',
  persistence?.explicit_child_action===true&&persistence?.badge_award_authorized===false&&
  persistence?.economy_mutation_authorized===false&&persistence?.catalog_activation_allowed===false);
assert('persistent-breakthrough-rejects-missing-retrace',
  api.recordPersistentBreakthrough({
    state:persistenceState,sheetId:'sample',wordId:'w1',
    priorAttempt:persistencePrior,currentAttempt:persistenceCurrent,reviewObservation:null
  })===null);
assert('app-wires-persistent-breakthrough-after-retrace',
  app.includes('recordPersistentBreakthrough')&&app.includes('priorAttempt:priorWrong,currentAttempt:attempt,reviewObservation:review'));
console.log('HIDE_PERSISTENT_BREAKTHROUGH_PASS');
