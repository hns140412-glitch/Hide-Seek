import fs from 'node:fs';

function loadSource(path){
  return fs.readFileSync(path,'utf8');
}
async function importSource(path){
  const source=loadSource(path);
  const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
  return import(url);
}
function assert(name,cond){
  if(!cond) throw new Error('FAIL '+name);
  console.log('PASS '+name);
}

const storeMod=await importSource('src/core/state-store.js');
const shellMod=await importSource('src/shell/app-shell.js');
const gateMod=await importSource('src/integrations/contract-gate.js');

const store=storeMod.createStateStore({count:0},{app:'hide-seek'});
let observed=null;
const off=store.subscribe((next,event,prev)=>{observed={next,event,prev};});
store.update(draft=>{draft.count+=1;},{reason:'REBUILD_TEST'});
assert('store-update',store.snapshot().count===1);
assert('store-revision',store.revision()===1);
assert('store-observer',observed?.event?.type==='STATE_REPLACED'&&observed.prev.count===0&&observed.next.count===1);
off();

const shell=shellMod.createAppShell({app:'hide-seek'});
const trace=[];
shell.registerView('home',{render:()=>trace.push('render-home'),enter:()=>trace.push('enter-home'),leave:()=>trace.push('leave-home')});
shell.registerView('work',{render:()=>trace.push('render-work'),enter:()=>trace.push('enter-work')});
await shell.show('home');
await shell.show('work');
assert('shell-active-view',shell.activeView()==='work');
assert('shell-lifecycle',trace.join('|')==='render-home|enter-home|leave-home|render-work|enter-work');

const gate=gateMod.createIntegrationGate({app:'hide-seek',allowedContractVersions:['READY_LEARNING_CONTEXT_V1']});
assert('contract-allow',gate.validateContract({contract_version:'READY_LEARNING_CONTEXT_V1'}).ok===true);
assert('contract-fail-closed',gate.validateContract({contract_version:'UNKNOWN'}).ok===false);
assert('contract-no-object',gate.validateContract(null).ok===false);


const legacyApp=loadSource('app.js');
const wordMod=await importSource('src/vocabulary/word-domain.js');
const normalized=wordMod.normalizeWord({id:'x',eng:'  Test ',kor:' 시험 ',missionRole:'new',sourceColumn:'left',wrong:2},0,{
  senseKey:({eng,kor})=>eng+'|'+kor,
  normalizeLanguageItem:x=>({...x,languageDomain:'ENGLISH',learningContext:{resolved:true}})
});
assert('word-normalize-text',normalized.eng==='Test'&&normalized.kor==='시험');
assert('word-normalize-role',normalized.missionRole==='NEW'&&normalized.sourceColumn==='LEFT');
assert('word-normalize-context',normalized.learningContext?.resolved===true);
assert('word-role-explicit',wordMod.inferMissionRole({missionRole:'REVIEW'},{sheetId:'s'})==='REVIEW');
assert('word-role-history',wordMod.inferMissionRole({},{sheetId:'s2',lexiconEntry:()=>({sourceRefs:['s1']})})==='REVIEW');
assert('word-role-new',wordMod.inferMissionRole({},{sheetId:'s1',lexiconEntry:()=>({sourceRefs:['s1']})})==='NEW');
assert('word-parity-normalizer',legacyApp.includes('function normalizeWord(w,i=0)'));
assert('word-parity-role',legacyApp.includes('function inferMissionRole(w,sheetId="")'));


const flowMod=await importSource('src/retrieval/retrieval-flow.js');
assert('retrieval-sequence',flowMod.RETRIEVAL_PHASES.join('>')==='prepare>first>meaning>connection>weak>code>done');
assert('retrieval-valid-transition',flowMod.canTransitionRetrieval('meaning','connection')===true);
assert('retrieval-invalid-transition',flowMod.canTransitionRetrieval('first','code')===false);
for(const phase of ['prepare','first','meaning','connection','weak','code','done'])assert('retrieval-parity-'+phase,legacyApp.includes("S.learning.phase='"+phase+"'"));

console.log('REBUILD_DOMAIN_PARITY_PASS');

console.log('REBUILD_V01_FOUNDATION_PASS hide-seek');
