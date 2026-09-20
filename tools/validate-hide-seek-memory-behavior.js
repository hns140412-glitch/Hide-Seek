#!/usr/bin/env node
const fs=require('fs');
const vm=require('vm');
const src=fs.readFileSync('app.js','utf8');

function extractFunction(name){
  const start=src.indexOf('function '+name+'(');
  if(start<0) throw new Error('missing function '+name);
  const brace=src.indexOf('{',start);
  let depth=0, quote=null, esc=false;
  for(let i=brace;i<src.length;i++){
    const ch=src[i];
    if(quote){
      if(esc){esc=false;continue}
      if(ch==='\\'){esc=true;continue}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==="'"||ch==='"'||ch===String.fromCharCode(96)){quote=ch;continue}
    if(ch==='{')depth++;
    if(ch==='}'){depth--;if(depth===0)return src.slice(start,i+1)}
  }
  throw new Error('unterminated function '+name);
}

const names=[
  'senseKey','lexiconEntry','traceList','addWordTrace','weakScore',
  'memoryWeaknessProfile','memorySceneCue','memoryChunks','memoryShapeCue',
  'lastConfusionTrace','lastPersonalErrorTrace','hintCueCost',
  'deriveMemorySignature','buildMemoryLadder','hiddenWordStrategy','hiddenWordPriority','hiddenWordActivityModel','memoryQualityModel','syncSheetToLexicon','recallSpacingEvidence','seekAgainResolved'
];
const sandbox={
  console,Date,Math,Set,Number,Object,Array,String,
  S:{learning:{history:[]},codeRed:{history:[]},lexicon:{}},
  codeSession:null,
  nowISO:()=>new Date('2026-09-20T00:00:00Z').toISOString()
};
vm.createContext(sandbox);
for(const n of names) vm.runInContext(extractFunction(n),sandbox);

function assert(cond,msg){if(!cond)throw new Error(msg)}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}

const sceneWord={id:'scene',eng:'challenge',kor:'도전',example:'This word is a challenge.',wrong:0,pass:0,hint:0,learningStats:{
  acquisitionTrace:[
    {event:'EXPOSURE',sheetId:'s1',sceneShown:true,sceneText:'This word is a challenge.'},
    {event:'LEARNER_UNSURE',sheetId:'s1'}
  ]
}};
const confusionWord={id:'conf',eng:'benefit',kor:'혜택',wrong:0,pass:0,hint:0,learningStats:{
  associationTrace:[{result:'MISMATCH',confusedWithId:'x',confusedWithEng:'profit',confusedWithKor:'이익'}]
}};
const errorWord={id:'err',eng:'essential',kor:'필수적인',wrong:0,pass:0,hint:0,learningStats:{
  retrievalTrace:[{result:'WRONG',errorTrace:[{slot:2,chosen:'a',needed:'e'}]}]
}};

const scenePlan=sandbox.buildMemoryLadder(sceneWord);
const confusionPlan=sandbox.buildMemoryLadder(confusionWord);
const errorPlan=sandbox.buildMemoryLadder(errorWord);
assert(scenePlan.includes('SCENE')&&scenePlan.includes('MEANING'),'scene/unsure trace must route through SCENE+MEANING');
assert(confusionPlan.includes('CONFUSION_TRACE'),'confusion trace must route through CONFUSION_TRACE');
assert(errorPlan.includes('ERROR_TRACE'),'retrieval error must route through ERROR_TRACE');
assert(!same(scenePlan,confusionPlan)&&!same(confusionPlan,errorPlan),'different trace profiles must produce different Memory Trail routes');

const sceneSig=sandbox.deriveMemorySignature(sceneWord);
const confusionSig=sandbox.deriveMemorySignature(confusionWord);
const errorSig=sandbox.deriveMemorySignature(errorWord);
assert(sceneSig.semanticWeakness>0,'learner uncertainty must contribute to semantic weakness');
assert(confusionSig.confusionPattern.count===1,'confusion signature must preserve mismatch count');
assert(errorSig.orthographicWeakness>0,'retrieval spelling error must contribute to orthographic weakness');
assert(sceneSig.recoveryStatus==='UNPROVEN','no recovery evidence must remain unproven');

const recoveredWord={id:'rec',eng:'present',kor:'현재의',wrong:0,pass:0,hint:0,learningStats:{
  recoveryTrace:[{result:'UNASSISTED_RECALL',spacedEvidence:true}],
  assistanceTrace:[{step:'SHAPE',cost:2}]
}};
const recoveredSig=sandbox.deriveMemorySignature(recoveredWord);
assert(recoveredSig.recoveryStatus==='SPACED_RECOVERED','spaced unassisted recall must be reflected in Memory Signature');
assert(recoveredSig.hintDependency>0,'assistance cost must contribute to hint dependency');

const sceneStrategy=sandbox.hiddenWordStrategy(sceneWord);
const confusionStrategy=sandbox.hiddenWordStrategy(confusionWord);
const errorStrategy=sandbox.hiddenWordStrategy(errorWord);
assert(['SEMANTIC_CONTRAST','CONFUSION_CONTRAST'].includes(sceneStrategy.type),'semantic uncertainty must choose semantic reinforcement');
assert(confusionStrategy.type==='CONFUSION_CONTRAST','confusion-heavy word must choose confusion contrast');
assert(errorStrategy.type==='ORTHOGRAPHIC_SCAFFOLD','spelling error must choose orthographic scaffold');
assert(sandbox.hiddenWordPriority(errorWord)>0,'adaptive hidden word priority must be positive for weak word');

const spacingWord={id:'space',eng:'remember',kor:'기억하다',wrong:0,pass:0,hint:0,learningStats:{needsUnassistedRecall:true}};
assert(sandbox.hiddenWordStrategy(spacingWord).type==='SPACED_RECALL','pending unassisted recall must route to spaced recall');
const semanticModel=sandbox.hiddenWordActivityModel(sceneWord,sceneStrategy);
const confusionModel=sandbox.hiddenWordActivityModel(confusionWord,confusionStrategy);
const orthoModel=sandbox.hiddenWordActivityModel(errorWord,errorStrategy);
const spacingModel=sandbox.hiddenWordActivityModel(spacingWord,sandbox.hiddenWordStrategy(spacingWord));
assert(semanticModel.mode==='CHOICE','semantic strategy must render choice interaction');
assert(confusionModel.mode==='CHOICE'&&confusionModel.contrast,'confusion strategy must preserve real contrast cue');
assert(orthoModel.mode==='SPELL'&&orthoModel.cue==='SHAPE','orthographic strategy must render spelling scaffold');
assert(spacingModel.mode==='SPELL'&&spacingModel.cue==='UNASSISTED','spaced recall must render unassisted spelling interaction');

const scene=sandbox.memorySceneCue(sceneWord);
assert(scene&&scene.source==='PAST_EXPOSURE'&&scene.text.includes('_____'),'SCENE cue must come from actual past exposure');

const now=Date.parse('2026-09-20T10:00:00Z');
const recent={learningStats:{lastAssistedAttemptOrdinal:5,lastAssistedAt:'2026-09-20T09:59:55Z'}};
const immediate=sandbox.recallSpacingEvidence(recent,6,now);
const separated=sandbox.recallSpacingEvidence(recent,7,now);
assert(immediate.interveningItemCount===0&&!immediate.spacedEvidence,'immediate unassisted repeat must not count as recovered memory');
assert(separated.interveningItemCount===1&&separated.spacedEvidence,'one intervening item must satisfy spacing evidence');
const noAssist=sandbox.recallSpacingEvidence({learningStats:{}},3,now);
assert(noAssist.interveningItemCount===null&&!noAssist.spacedEvidence,'no prior assistance must not fabricate spacing evidence');

const assistedWord={id:'assist',learningStats:{needsUnassistedRecall:true}};
const immediateAttempt={type:'CORRECT',hintLevel:0,spacedEvidence:false};
const spacedAttempt={type:'CORRECT',hintLevel:0,spacedEvidence:true};
const hintedAttempt={type:'CORRECT',hintLevel:1,spacedEvidence:true};
assert(!sandbox.seekAgainResolved(assistedWord,immediateAttempt),'immediate unassisted success after assistance must remain in retrace');
assert(sandbox.seekAgainResolved(assistedWord,spacedAttempt),'spaced unassisted success must resolve retrace');
assert(!sandbox.seekAgainResolved(assistedWord,hintedAttempt),'hinted success must never resolve retrace');
assert(sandbox.seekAgainResolved({id:'clean',learningStats:{}},{type:'CORRECT',hintLevel:0,spacedEvidence:false}),'clean unassisted success without pending recall requirement may resolve');

const word={id:'w1',lexicalId:'maintain::유지하다',eng:'maintain',kor:'유지하다',wrong:0,pass:0,hint:0,learningStats:{}};
const sh={sheetId:'sheet-1',createdAt:'2026-09-20T00:00:00Z',items:[word]};
sandbox.S.lexicon={};
sandbox.S.codeRed.history=[
  {wordId:'w1',type:'CORRECT',at:'2026-09-20T00:01:00Z'},
  {wordId:'w1',type:'WRONG',at:'2026-09-20T00:02:00Z'}
];
sandbox.syncSheetToLexicon(sh);
const first=JSON.parse(JSON.stringify(sandbox.S.lexicon[word.lexicalId]));
sandbox.syncSheetToLexicon(sh);
const second=JSON.parse(JSON.stringify(sandbox.S.lexicon[word.lexicalId]));
assert(first.correctTotal===1&&first.wrongTotal===1,'first aggregation must reflect one correct + one wrong');
assert(second.correctTotal===1&&second.wrongTotal===1,'re-sync must not double-count same sheet evidence');
assert(second.sourceRefs.length===1&&second.sourceRefs[0]==='sheet-1','sourceRefs must remain de-duplicated');
assert(second.memorySignature&&typeof second.memorySignature.orthographicWeakness==='number','lexicon must persist derived Memory Signature');
assert(second.memoryQuality&&typeof second.memoryQuality.weaknessPenalty==='number','lexicon must persist memory quality decomposition');

const baseSig={semanticWeakness:0,hintDependency:0,timeoutRisk:0,orthographicWeakness:0,longTermDecay:0,recoveryStatus:'UNPROVEN'};
const spacedQ=sandbox.memoryQualityModel({...baseSig,recoveryStatus:'SPACED_RECOVERED'},2,0,0);
const immediateQ=sandbox.memoryQualityModel({...baseSig,recoveryStatus:'IMMEDIATE_ONLY'},2,0,0);
const pendingQ=sandbox.memoryQualityModel({...baseSig,recoveryStatus:'NEEDS_UNASSISTED_RECALL'},2,0,0);
assert(spacedQ.memoryStrength>immediateQ.memoryStrength,'spaced recovery must score stronger than immediate-only');
assert(immediateQ.memoryStrength>pendingQ.memoryStrength,'immediate-only must remain stronger than unresolved pending recall');
const dependentQ=sandbox.memoryQualityModel({...baseSig,hintDependency:60,timeoutRisk:30,orthographicWeakness:50},2,0,0);
assert(dependentQ.memoryStrength<spacedQ.memoryStrength,'hint/timeout/orthographic weakness must reduce memory quality');
assert(dependentQ.nextReviewPriority>spacedQ.nextReviewPriority,'weaker signature must increase review priority');

const decayWord={id:'decay',lexicalId:'decay::감소',eng:'decay',kor:'감소',wrong:0,pass:0,hint:0,learningStats:{}};
sandbox.S.lexicon[decayWord.lexicalId]={memoryStrength:70,reviewDecay:40};
const decaySig=sandbox.deriveMemorySignature(decayWord);
assert(decaySig.longTermDecay===40,'long-term decay must come from explicit reviewDecay evidence, not inverse memoryStrength');

console.log('PASS: Hide & Seek Memory Trail behavior fixtures');
