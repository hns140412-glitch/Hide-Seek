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

const html=api.renderMeaningMapHtml(english,x=>String(x));
assert(html.includes('건너서 나르다'),'memory bridge rendering');
assert(html.includes('PREFIX')&&html.includes('ROOT'),'role rendering');

console.log('PASS: language memory model supports English, Korean, Hanja and fails closed on unverified analysis');
