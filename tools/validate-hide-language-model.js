const fs=require('fs');
const vm=require('vm');
const assert=(x,m)=>{if(!x)throw new Error(m)};
const code=fs.readFileSync('hide-language-model.js','utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(code,sandbox);
const api=sandbox.window.HideLanguageModel;
assert(api,'language model missing');

assert(api.detectDomain({eng:'transport',kor:'운반하다'})==='ENGLISH','english detection');
assert(api.detectDomain({word:'불가피'})==='KOREAN','korean detection');
assert(api.detectDomain({word:'學'})==='HANJA','hanja detection');

const unverified=api.normalizeItem({eng:'transport',meaningMap:{verified:false,nodes:[{label:'port',meaning:'나르다'}]}});
assert(!unverified.meaningMap,'unverified meaning map must fail closed');

const english=api.normalizeItem({
  eng:'transport',kor:'운반하다',
  meaningMap:{
    verified:true,sourceType:'CURATED',
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
  meaningMap:{verificationState:'VERIFIED',nodes:[
    {role:'HANJA_ORIGIN',label:'不',meaning:'아니다'},
    {role:'HANJA_ORIGIN',label:'避',meaning:'피하다'}
  ],memoryBridge:'피하는 것이 가능하지 않다 → 피할 수 없다'}
});
assert(korean.meaningMap?.domain==='KOREAN','korean verified map');

const hanja=api.normalizeItem({
  word:'學',languageDomain:'HANJA',
  meaningMap:{verified:true,nodes:[
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


const html=api.renderMeaningMapHtml(english,x=>String(x));
assert(html.includes('건너서 나르다'),'memory bridge rendering');
assert(html.includes('PREFIX')&&html.includes('ROOT'),'role rendering');

const starter=api.starterExploration({eng:'rainforest'},{encounteredWords:['jungle']});
assert(starter?.type==='TRANSPARENT_COMPOUND','rainforest should use transparent compound support');
assert(starter?.links.includes('jungle'),'encountered connection should appear');
assert(starter?.claimsHistoricalEtymology===false,'starter support must not claim historical etymology');
const opaque=api.starterExploration({eng:'island'},{encounteredWords:['ocean']});
assert(opaque?.type==='SEMANTIC_SCENE','island must avoid fake structural split');
assert(!opaque?.parts?.length,'island should not be split into fake parts');
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
const inferenceHtml=api.renderStarterExplorationHtml({eng:'environment'},{encounteredWords:[]},x=>String(x));
assert(inferenceHtml.includes('inference-prediction')&&inferenceHtml.includes('inference-confidence'),'first-seen inference controls');
assert(inferenceHtml.includes('검증 어원')&&inferenceHtml.includes('environ'),'verified visual grammar');


const adaptive=api.prioritizeExistingAssistance(['SOUND','THINKING_SCENE','SHAPE','FRAGMENT','MINIMUM_REVEAL'],{bestClue:{clue:'WORD_PART'}});
assert(adaptive[0]==='THINKING_SCENE'&&adaptive[1]==='SHAPE','word-part skill should reorder existing weak cues');
assert(adaptive.at(-2)==='FRAGMENT'&&adaptive.at(-1)==='MINIMUM_REVEAL','strong reveal cues must remain terminal');
const noInvent=api.prioritizeExistingAssistance(['SOUND','SHAPE','FRAGMENT','MINIMUM_REVEAL'],{bestClue:{clue:'ROOT_ETYMOLOGY'}});
assert(!noInvent.includes('MEANING_MAP')&&!noInvent.includes('THINKING_SCENE'),'adaptive ordering must not invent unavailable help');
const parentVerified=api.parentExplanation({eng:'mountain'});
assert(parentVerified?.mode==='VERIFIED'&&parentVerified?.text.includes('mons / montis'),'parent verified explanation');
const parentSemantic=api.parentExplanation({eng:'ocean'});
assert(parentSemantic?.mode==='SEMANTIC_SCENE'&&parentSemantic?.text.includes('억지로 어원을 나누지 않고'),'parent semantic truth boundary');
const skill=api.summarizeInferenceSkill([
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'HIGH',outcome:'MATCH'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'SCENE',confidence:'MEDIUM',outcome:'NEAR'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'ROOT_ETYMOLOGY',confidence:'HIGH',outcome:'MISS'},
  {event:'FIRST_SEEN_PREDICTION',clueUsed:'WORD_PART',confidence:'LOW'}
]);
assert(skill.attempts===4&&skill.assessed===3,'inference skill counts');
assert(skill.successRate===67,'inference success rate');
assert(skill.bestClue?.clue==='SCENE','best clue should derive from assessed outcomes');
assert(skill.highConfidenceMisses===1,'confidence calibration evidence');

console.log('PASS: language memory model supports truth-gated etymology, inference and multilingual exploration');
