const fs=require('fs');
const vm=require('vm');
const assert=(x,m)=>{if(!x)throw new Error(m)};
const basisCode=fs.readFileSync('hide-learning-basis-v01.js','utf8');
const evidenceCode=fs.readFileSync('hide-language-evidence.js','utf8');
const code=fs.readFileSync('hide-language-model.js','utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(basisCode,sandbox);
sandbox.HideLearningBasis=sandbox.window.HideLearningBasis;
vm.runInContext(evidenceCode,sandbox);
vm.runInContext(code,sandbox);
const api=sandbox.window.HideLanguageModel;
assert(api,'language model missing');
const basis=sandbox.window.HideLearningBasis;
assert(basis?.VERSION==='2026.09.21-learning-basis-v1','learning basis version');
const koBasis=basis.resolve('KOREAN');
const hanjaBasis=basis.resolve('HANJA');
assert(koBasis.basis_subject==='국어'&&koBasis.ready_method==='READ_UNDERSTAND_EVIDENCE_RESPOND','Korean basis must follow Ready Korean profile');
assert(hanjaBasis.basis_subject==='한자'&&hanjaBasis.ready_method==='FORM_SOUND_MEANING_RECALL','Hanja basis must follow Ready Hanja profile');
assert(hanjaBasis.ready_loop.join('>')==='ENCODE>RECALL>CHECK>RETRY','Hanja learning loop');
assert(api.normalizeItem({word:'學',languageDomain:'HANJA'}).learningProfile?.basis_subject==='한자','normalized Hanja item must carry learning basis');

const evidence=sandbox.window.HideLanguageEvidence;
assert(evidence?.SCHEMA_VERSION===2,'language evidence schema');
assert(Array.isArray(evidence.invalidRecords)&&evidence.invalidRecords.length===0,'language evidence records must validate');
assert(Object.keys(evidence.records||{}).length===10,'verified evidence record count');
for(const [word,record] of Object.entries(evidence.records||{}))assert(evidence.validateRecord(word,record),'evidence record '+word);
assert(evidence.validateRecord('earthquake',evidence.records.earthquake),'verified compound contract');
assert(!evidence.validateRecord('bad',{supportType:'VERIFIED_ETYMOLOGY',sourceType:'ETYMONLINE',sourceRef:'http://example.com',center:{label:'x',meaning:'x'},nodes:[{role:'ROOT',label:'x',meaning:'x'}],bridge:'x',scene:'x'}),'invalid source must fail');
assert(!evidence.validateRecord('bad',{supportType:'TRANSPARENT_COMPOUND',sourceType:'ETYMONLINE',sourceRef:'https://www.etymonline.com/word/bad',center:{label:'a+b',meaning:'x'},nodes:[{role:'COMPOUND_PART',label:'a',meaning:'x'}],bridge:'x',scene:'x'}),'compound historical flag must be explicitly false');

assert(api.detectDomain({eng:'transport',kor:'운반하다'})==='ENGLISH','english detection');
assert(api.detectDomain({word:'불가피'})==='KOREAN','korean detection');
assert(api.detectDomain({word:'學'})==='HANJA','hanja detection');
const koParent=api.parentExplanation({word:'불가피',languageDomain:'KOREAN',meaningMap:{verified:true,sourceType:'TEST_FIXTURE',sourceRef:'fixture://ko-meaning-map',title:'불가피',coreMeaning:'피할 수 없음',imageryCue:'피할 수 없는 길',memoryBridge:'不(아닐 불)+避(피할 피) → 피할 수 없음',nodes:[{role:'HANJA_ORIGIN',label:'不',meaning:'아니다'},{role:'HANJA_ORIGIN',label:'避',meaning:'피하다'}],bridges:[]}});
assert(koParent?.mode==='VERIFIED_MEANING_STRUCTURE'&&koParent.text.includes('구성 요소'),'korean parent explanation must use meaning structure');
const hanjaParent=api.parentExplanation({word:'學',languageDomain:'HANJA',meaningMap:{verified:true,sourceType:'TEST_FIXTURE',sourceRef:'fixture://hanja-meaning-map',title:'學',coreMeaning:'배우다',imageryCue:'배우는 장면',memoryBridge:'구성을 보고 뜻을 연결',nodes:[{role:'COMPONENT',label:'學',meaning:'배우다'}],bridges:[]}});
assert(hanjaParent?.mode==='VERIFIED_CHARACTER_STRUCTURE'&&hanjaParent.text.includes('글자의 핵심 구성'),'hanja parent explanation must use character structure');
const unprovenMap=api.normalizeItem({word:'미검증',languageDomain:'KOREAN',meaningMap:{verified:true,sourceType:'CURATED',coreMeaning:'근거 없음',nodes:[{role:'CONCEPT',label:'미검증',meaning:'근거 없음'}]}});
assert(!unprovenMap.meaningMap,'verified meaning map without sourceRef must fail closed');
const emptyNodeMap=api.normalizeItem({word:'빈구조',languageDomain:'KOREAN',meaningMap:{verified:true,sourceType:'TEST_FIXTURE',sourceRef:'fixture://empty-node',coreMeaning:'뜻은 있으나 구조 없음',nodes:[]}});
assert(!emptyNodeMap.meaningMap,'verified meaning map without nodes must fail closed');
const emptyMeaningMap=api.normalizeItem({word:'빈뜻',languageDomain:'KOREAN',meaningMap:{verified:true,sourceType:'TEST_FIXTURE',sourceRef:'fixture://empty-meaning',coreMeaning:'',nodes:[{role:'CONCEPT',label:'빈뜻',meaning:'구조'}]}});
assert(!emptyMeaningMap.meaningMap,'verified meaning map without coreMeaning must fail closed');
const englishClues=api.clueOptions('ENGLISH').map(x=>x.value);
const koreanClues=api.clueOptions('KOREAN').map(x=>x.value);
const hanjaClues=api.clueOptions('HANJA').map(x=>x.value);
assert(englishClues.includes('ROOT_ETYMOLOGY')&&!englishClues.includes('HANJA_ORIGIN'),'english clue taxonomy');
assert(koreanClues.includes('HANJA_ORIGIN')&&koreanClues.includes('AFFIX')&&!koreanClues.includes('ROOT_ETYMOLOGY'),'korean clue taxonomy');
assert(hanjaClues.includes('COMPONENT')&&hanjaClues.includes('RADICAL')&&!hanjaClues.includes('ROOT_ETYMOLOGY'),'hanja clue taxonomy');

const unverified=api.normalizeItem({eng:'transport',meaningMap:{verified:false,nodes:[{label:'port',meaning:'나르다'}]}});
assert(!unverified.meaningMap,'unverified meaning map must fail closed');

const english=api.normalizeItem({
  eng:'transport',kor:'운반하다',
  meaningMap:{
    verified:true,sourceType:'TEST_FIXTURE',sourceRef:'fixture://transport-map',
    title:'transport',
    coreMeaning:'운반하다',
    imageryCue:'한 곳에서 다른 곳으로 물건을 옮기는 장면',
    memoryBridge:'건너서 나르다 → 운반하다',
    nodes:[
      {id:'trans',role:'PREFIX',label:'trans',meaning:'건너서'},
      {id:'port',role:'ROOT',label:'port',meaning:'나르다'}
    ],
    bridges:[{from:'trans + port',to:'transport',explanation:'건너서 나르는 것'}]
  }
});
assert(english.languageDomain==='ENGLISH','english model domain');
assert(english.meaningMap?.verified,'verified english map');
assert(api.cuePlan(english)?.type==='MEANING_MAP','english cue plan');

const korean=api.normalizeItem({
  word:'불가피',kor:'피할 수 없음',languageDomain:'KOREAN',
  meaningMap:{verificationState:'VERIFIED',sourceType:'TEST_FIXTURE',sourceRef:'fixture://korean-map',coreMeaning:'피할 수 없음',nodes:[
    {role:'HANJA_ORIGIN',label:'不',meaning:'아니다'},
    {role:'HANJA_ORIGIN',label:'避',meaning:'피하다'}
  ],memoryBridge:'피하는 것이 가능하지 않다 → 피할 수 없다'}
});
assert(korean.meaningMap?.domain==='KOREAN','korean verified map');

const hanja=api.normalizeItem({
  word:'學',languageDomain:'HANJA',
  meaningMap:{verified:true,sourceType:'TEST_FIXTURE',sourceRef:'fixture://hanja-map',coreMeaning:'배우다',nodes:[
    {role:'COMPONENT',label:'學',meaning:'배우다'}
  ],imageryCue:'배움을 익히는 장면'}
});
assert(hanja.meaningMap?.domain==='HANJA','hanja verified map');
const koreanExplore=api.starterExploration(korean,{});
assert(koreanExplore?.type==='VERIFIED_MEANING_MAP','korean verified map should enter thinking-first exploration');
assert(koreanExplore?.claimsHistoricalEtymology===false,'generic verified map must not become fake historical etymology');
const hanjaExplore=api.starterExploration(hanja,{});
assert(hanjaExplore?.type==='VERIFIED_MEANING_MAP','hanja verified map should enter thinking-first exploration');
const hanjaHtml=api.renderStarterExplorationHtml(hanja,{},x=>String(x));
assert(hanjaHtml.includes('검증 의미 구조')&&hanjaHtml.includes('學'),'hanja verified meaning-map visual');
const maliciousHistorical=api.normalizeItem({word:'가상어',languageDomain:'KOREAN',meaningMap:{verified:true,verificationState:'VERIFIED',sourceType:'TEST_FIXTURE',sourceRef:'fixture://malicious-history',coreMeaning:'가상 뜻',claimsHistoricalEtymology:true,nodes:[{role:'HANJA_ORIGIN',label:'假',meaning:'가짜'}]}});
const maliciousPlan=api.starterExploration(maliciousHistorical,{});
const maliciousHtml=api.renderStarterExplorationHtml(maliciousHistorical,{},x=>String(x));
assert(maliciousPlan?.claimsHistoricalEtymology===false,'generic verified meaning map must ignore historical-claim escalation');
assert(maliciousHtml.includes('검증 의미 구조')&&!maliciousHtml.includes('검증 어원'),'generic verified meaning map must never render as verified etymology');


const html=api.renderMeaningMapHtml(english,x=>String(x));
assert(html.includes('건너서 나르다'),'memory bridge rendering');
assert(html.includes('PREFIX')&&html.includes('ROOT'),'role rendering');

const starter=api.starterExploration({eng:'rainforest'},{encounteredWords:['jungle']});
assert(starter?.type==='TRANSPARENT_COMPOUND','rainforest should use transparent compound support');
assert(starter?.links.includes('jungle'),'encountered connection should appear');
assert(starter?.claimsHistoricalEtymology===false,'starter support must not claim historical etymology');
const islandPlan=api.starterExploration({eng:'island'},{encounteredWords:['ocean']});
assert(islandPlan?.type==='VERIFIED_ETYMOLOGY'&&islandPlan?.verified===true,'island should use verified historical path');
assert(!islandPlan?.parts?.length,'island must not be split using a fake modern is+land decomposition');
assert(islandPlan?.nodes?.some(x=>x.role==='SPELLING_NOTE'&&x.label==='s'),'island must preserve the later spelling-s note');
const thinkingHtml=api.renderStarterExplorationHtml({eng:'earthquake'},{encounteredWords:['environment']},x=>String(x));
assert(thinkingHtml.includes('earth')&&thinkingHtml.includes('quake'),'earthquake compound pieces should render');
assert(thinkingHtml.includes('environment'),'encountered link should render');

const verifiedEnvironment=api.starterExploration({eng:'environment'},{encounteredWords:[]});
assert(verifiedEnvironment?.type==='VERIFIED_ETYMOLOGY','environment should use verified etymology');
assert(verifiedEnvironment?.sourceType==='ETYMONLINE','verified source type required');
assert(verifiedEnvironment?.sourceRef?.includes('/environment'),'verified source ref required');
assert(verifiedEnvironment?.claimsHistoricalEtymology===true,'verified etymology may claim historical origin');
const verifiedMountain=api.verifiedEvidence({eng:'mountain'});
assert(verifiedMountain?.nodes?.some(x=>x.label==='*men-'),'mountain verified root path');
const verifiedPlanet=api.verifiedEvidence({eng:'planet'});
assert(verifiedPlanet?.center?.label==='planētēs','planet wandering-star origin');
const verifiedDesert=api.verifiedEvidence({eng:'desert'});
assert(verifiedDesert?.nodes?.some(x=>x.label==='deserere'),'desert abandon path');
const verifiedIsland=api.verifiedEvidence({eng:'island'});
assert(verifiedIsland?.nodes?.some(x=>x.role==='SPELLING_NOTE'&&x.label==='s'),'island spelling history');
const verifiedJungle=api.verifiedEvidence({eng:'jungle'});
assert(verifiedJungle?.nodes?.some(x=>x.label==='jangala'),'jungle semantic-shift path');
const verifiedEarthquake=api.starterExploration({eng:'earthquake'},{encounteredWords:[]});
assert(verifiedEarthquake?.verified===true&&verifiedEarthquake?.sourceType==='ETYMONLINE','earthquake verified compound source');
assert(verifiedEarthquake?.type==='TRANSPARENT_COMPOUND'&&verifiedEarthquake?.claimsHistoricalEtymology===false,'earthquake must remain verified structure, not etymology');
const earthquakeHtml=api.renderStarterExplorationHtml({eng:'earthquake'},{encounteredWords:[]},x=>String(x));
assert(earthquakeHtml.includes('검증 구조')&&!earthquakeHtml.includes('검증 어원'),'earthquake truth badge');
const oceanTruthGate=api.starterExploration({eng:'ocean'},{encounteredWords:[]});
assert(oceanTruthGate?.verified===false&&oceanTruthGate?.type==='SEMANTIC_SCENE','ocean must remain semantic scene when deeper origin is unknown');
const verifiedGlacier=api.verifiedEvidence({eng:'glacier'});
assert(verifiedGlacier?.center?.label==='glace','glacier verified center concept');
const verifiedClimate=api.verifiedEvidence({eng:'climate'});
assert(verifiedClimate?.nodes?.some(x=>x.label==='klima'),'climate historical path');
const verifiedHarvest=api.verifiedEvidence({eng:'harvest'});
assert(verifiedHarvest?.nodes?.some(x=>x.label==='*kerp-'),'harvest root path');
const scenePlan=api.starterExploration({eng:'island'},{encounteredWords:['ocean']});
assert(scenePlan?.visual?.join('>')==='WATER>LAND>SURROUNDED','semantic scene visual trail');
const sceneHtml=api.renderStarterExplorationHtml({eng:'island'},{encounteredWords:['ocean']},x=>String(x));
assert(sceneHtml.includes('scene-trail')&&sceneHtml.includes('SURROUNDED'),'scene visual grammar rendering');
const rootProfile={adaptiveClue:{clue:'ROOT_ETYMOLOGY'}};
const environmentAdaptiveHtml=api.renderStarterExplorationHtml({eng:'environment'},{encounteredWords:[],skillProfile:rootProfile},x=>String(x));
assert(environmentAdaptiveHtml.includes('반복해서 확인된 단서'),'verified root may reuse root preference');
const oceanAdaptiveHtml=api.renderStarterExplorationHtml({eng:'ocean'},{encounteredWords:[],skillProfile:rootProfile},x=>String(x));
assert(!oceanAdaptiveHtml.includes('반복해서 확인된 단서'),'unsupported root preference must not leak into ocean');
assert(api.clueApplicableToPlan(api.starterExploration({eng:'rainforest'},{}),'WORD_PART'),'compound should allow word-part clue');
assert(!api.clueApplicableToPlan(api.starterExploration({eng:'ocean'},{}),'ROOT_ETYMOLOGY'),'semantic ocean should reject root clue');
const mountainScene=api.renderStarterExplorationHtml({eng:'mountain'},{encounteredWords:[]},x=>String(x));
assert(mountainScene.includes('평평한 땅')&&mountainScene.includes('위로 솟기')&&mountainScene.includes('높은 꼭대기'),'child-facing mountain scene labels');
assert(!mountainScene.includes('>GROUND<')&&!mountainScene.includes('>RISE<')&&!mountainScene.includes('>PEAK<'),'internal scene ids must not leak as labels');
assert(mountainScene.includes('data-scene-id="GROUND"'),'scene id should remain machine-stable');
const inferenceHtml=api.renderStarterExplorationHtml({eng:'environment'},{encounteredWords:[]},x=>String(x));
assert(inferenceHtml.includes('inference-prediction')&&inferenceHtml.includes('inference-confidence'),'first-seen inference controls');
assert(inferenceHtml.includes('검증 어원')&&inferenceHtml.includes('environ'),'verified visual grammar');
assert(inferenceHtml.includes('root-step-next')&&inferenceHtml.includes('data-root-step="1" hidden'),'verified roots should reveal progressively');


const adaptive=api.prioritizeExistingAssistance(['SOUND','THINKING_SCENE','SHAPE','FRAGMENT','MINIMUM_REVEAL'],{adaptiveClue:{clue:'WORD_PART'}});
assert(adaptive[0]==='THINKING_SCENE'&&adaptive[1]==='SHAPE','word-part skill should reorder existing weak cues');
const koreanAdaptive=api.prioritizeExistingAssistance(['SOUND','MEANING_MAP','THINKING_SCENE','FRAGMENT','MINIMUM_REVEAL'],{adaptiveClue:{clue:'HANJA_ORIGIN'}});
assert(koreanAdaptive[0]==='MEANING_MAP','korean Hanja-origin clue should prioritize verified meaning map');
assert(adaptive.at(-2)==='FRAGMENT'&&adaptive.at(-1)==='MINIMUM_REVEAL','strong reveal cues must remain terminal');
const noInvent=api.prioritizeExistingAssistance(['SOUND','SHAPE','FRAGMENT','MINIMUM_REVEAL'],{adaptiveClue:{clue:'ROOT_ETYMOLOGY'}});
assert(!noInvent.includes('MEANING_MAP')&&!noInvent.includes('THINKING_SCENE'),'adaptive ordering must not invent unavailable help');
assert(api.clueApplicableToPlan(null,'ROOT_ETYMOLOGY')===false,'adaptive clue must fail safe when current word has no exploration plan');
const parentVerified=api.parentExplanation({eng:'mountain'});
assert(parentVerified?.mode==='VERIFIED_ETYMOLOGY_OR_ROOT'&&parentVerified?.text.includes('mons / montis'),'parent verified explanation');
const parentSemantic=api.parentExplanation({eng:'ocean'});
assert(parentSemantic?.mode==='SEMANTIC_SCENE'&&parentSemantic?.text.includes('억지로 어원을 나누지 않고'),'parent semantic truth boundary');
const skill=api.summarizeInferenceSkill([
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'HIGH',outcome:'MATCH'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'SCENE',confidence:'MEDIUM',outcome:'NEAR'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'HIGH',outcome:'MISS'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'WORD_PART',confidence:'LOW'}
]);
assert(skill.attempts===4&&skill.assessed===3,'inference skill counts');
assert(skill.selfReportedFitRate===67&&skill.successRate===67,'inference self-reported fit rate');
assert(skill.evidenceBasis==='LEARNER_SELF_REPORT'&&skill.calibrationEvidenceBasis==='LEARNER_SELF_REPORT','inference evidence basis');
assert(skill.bestClue?.clue==='SCENE','best clue should derive from assessed outcomes');
assert(skill.highConfidenceMisses===1,'confidence calibration evidence');
assert(!skill.adaptiveClue&&skill.emergingClue?.clue==='ROOT_ETYMOLOGY'&&skill.evidenceLevel==='EMERGING','early repeated clue evidence should remain emerging');
const oneShot=api.summarizeInferenceSkill([{event:'FIRST_SEEN_PREDICTION',clueUsed:'SCENE',confidence:'HIGH',outcome:'MATCH'}]);
assert(oneShot.bestClue?.clue==='SCENE'&&!oneShot.adaptiveClue&&oneShot.evidenceLevel==='LOW','one self-report must not become adaptive preference');
const established=api.summarizeInferenceSkill([
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'MEDIUM',outcome:'MATCH'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'MEDIUM',outcome:'MATCH'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'MEDIUM',outcome:'NEAR'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'SCENE',confidence:'MEDIUM',outcome:'MISS'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'WORD_PART',confidence:'MEDIUM',outcome:'MATCH'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'SCENE',confidence:'LOW',outcome:'NEAR'}
]);
assert(established.evidenceLevel==='ESTABLISHED'&&established.adaptiveClue?.clue==='ROOT_ETYMOLOGY','adaptive preference requires established evidence');
assert(established.adaptiveClue?.selfReportedFitRate>=60&&established.adaptiveClue?.evidenceBasis==='LEARNER_SELF_REPORT','adaptive clue must expose self-report basis');

console.log('PASS: language memory model supports truth-gated etymology, inference and multilingual exploration');
