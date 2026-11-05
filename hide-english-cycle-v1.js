(()=>{
'use strict';
if(window.HideEnglishCycleV1)return;
const VERSION='2026.10.17-english-12-24-v1';
const clean=w=>!!w&&!!String(w.eng||'').trim()&&!!String(w.kor||'').trim()&&!w.needsReview;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const confirmed=sh=>sh&&sh.sourceType!=='sample'&&sh.sourceType!=='synthetic-demo'&&!!sh.recognitionMeta?.reviewedAt&&Array.isArray(sh.items)&&sh.items.length>0&&sh.items.every(clean);
function eligible(){
 return [...(S.sheets||[])].filter(confirmed).sort((a,b)=>{
  const at=Date.parse(a.testDate||a.createdAt||'')||0,bt=Date.parse(b.testDate||b.createdAt||'')||0;
  return bt-at||(b.sheetId||'').localeCompare(a.sheetId||'');
 });
}
function compose(){
 const sheets=eligible(),latest=sheets[0]||null;
 if(!latest)return {state:'NO_REVIEWED_SHEETS',count:0,newCount:0,reviewCount:0,words:[]};
 if(latest.items.length!==12)return {state:'LATEST_EXAM_NOT_12',count:latest.items.length,newCount:latest.items.length,reviewCount:0,latest:latest.sheetId,words:[]};
 const latestKeys=latest.items.map(w=>w.eng.trim().normalize('NFC').toLocaleLowerCase('en'));
 if(new Set(latestKeys).size!==12)return {state:'LATEST_WORD_DUPLICATE',count:12,newCount:12,reviewCount:0,latest:latest.sheetId,words:[]};
 const old=[],all=new Set(latestKeys);
 const sources=[];
 for(const sh of sheets.slice(1)){
  let picked=0;
  for(const w of sh.items){
   const key=w.eng.trim().normalize('NFC').toLocaleLowerCase('en');
   if(all.has(key))continue;
   all.add(key);old.push({word:w,sourceSheetId:sh.sheetId,sourceKind:sh.sourceType,role:'REVIEW'});picked++;
   if(old.length===24)break;
  }
  if(picked)sources.push(sh.sheetId);
  if(old.length===24)break;
 }
 const newer=latest.items.map(w=>({word:w,sourceSheetId:latest.sheetId,sourceKind:latest.sourceType,role:'NEW'}));
 const rows=[...newer,...old],ids=new Set(rows.map(x=>x.word.id));
 const state=old.length===24&&ids.size===36?'READY':ids.size!==rows.length?'WORD_ID_COLLISION':'PREVIOUS_WORDS_INSUFFICIENT';
 return {state,latest:latest.sheetId,sources,rows:state==='READY'?rows:[],words:state==='READY'?rows.map(x=>x.word):[],newCount:12,reviewCount:old.length,count:12+old.length,totalSheets:sheets.length};
}
function selectionValid(){
 const config=S.englishPracticeCycle;
 if(!config?.active)return null;
 const c=compose();
 if(c.state!=='READY'||c.latest!==config.latest||c.rows.length!==36||c.sources.join('|')!==config.sources.join('|'))return null;
 return c;
}
function activeWords(){
 const s=selectionValid();
 return s?s.words:null;
}
function originOf(wordId){
 const c=selectionValid();
 return c?.rows.find(x=>x.word.id===wordId)||null;
}
function ensure(){
 const c=compose();
 if(c.state!=='READY')return c;
 const ids=c.rows.map(x=>x.word.id);
 if(ids.length!==new Set(ids).size)return {state:'WORD_ID_COLLISION',newCount:c.newCount,reviewCount:c.reviewCount};
 S.englishPracticeCycle={active:true,version:VERSION,latest:c.latest,sources:c.sources,createdAt:new Date().toISOString(),newCount:12,reviewCount:24};
 S.activeSheetId=c.latest;save();
 return {...c,state:'ENABLED'};
}
function summarizePractice(){
 const cycle=selectionValid();
 if(!cycle)return {state:'NO_ACTIVE_CYCLE'};
 const runId=S.codeRed?.activeRunId||null;
 const entries=(S.codeRed?.history||[]).filter(x=>runId&&x.runId===runId);
 const first=new Map();
 for(const x of entries){if(!first.has(x.wordId))first.set(x.wordId,x)}
 const tally=role=>{
  const words=cycle.rows.filter(x=>x.role===role),firstAttempts=words.map(x=>first.get(x.word.id)).filter(Boolean);
  return {total:words.length,attempted:firstAttempts.length,
   independent_correct:firstAttempts.filter(x=>x.type==='CORRECT'&&Number(x.hintLevel||0)===0&&Number(x.wrongAttempts||0)===0).length,
   assisted_or_retry:firstAttempts.filter(x=>['HINT_USED','WRONG'].includes(x.type)||Number(x.hintLevel||0)>0||Number(x.wrongAttempts||0)>0).length,
   passed_or_timed_out:firstAttempts.filter(x=>['PASS','TIMEOUT'].includes(x.type)).length};
 };
 const summary={state:'LOCAL_IMMEDIATE_PRACTICE_ONLY',runId,recordedAt:new Date().toISOString(),source_latest:cycle.latest,
  source_previous:cycle.sources.slice(),new12:tally('NEW'),review24:tally('REVIEW'),delayed_retrieval_verified:false,central_achievement_verified:false};
 S.englishPracticeCycle.lastResult=summary;save();return summary;
}
function disable(){if(S.englishPracticeCycle?.active){S.englishPracticeCycle.active=false;save()}return {state:'DISABLED'}}
function status(){const c=compose();return {state:c.state,newCount:c.newCount,reviewCount:c.reviewCount,latest:c.latest,totalSheets:c.totalSheets||0,active:!!selectionValid()}}
function show(){
 const c=compose();
 const current=status();
 const text=c.state==='READY'?'검증된 신규 12개와 이전 시험지 복습 24개가 준비됐어요.':c.state==='NO_REVIEWED_SHEETS'?'확인된 시험지가 없어요. OCR 또는 직접 입력 후 단어를 먼저 확인하세요.':c.state==='LATEST_EXAM_NOT_12'?'가장 최근 확인된 시험지가 '+c.newCount+'개입니다. 새로운 시험지 12개 구성의 확인이 필요해요.':c.state==='WORD_ID_COLLISION'?'시험지 간 단어 ID가 겹칩니다. 추적을 위해 수정 후 다시 확인하세요.':c.state==='LATEST_WORD_DUPLICATE'?'가장 최근 시험지에 같은 영어 단어가 중복됩니다. 중복을 수정해 주세요.':'신규 12개는 확인됐지만 이전 시험지의 중복 없는 복습 단어가 '+c.reviewCount+'/24개입니다. 이전 시험지를 추가하세요.';
 const view=document.querySelector('#view');
 const board=c.state==='READY'?'<div class="hs-cycle-board" aria-label="영어 신규 12개 및 지난 24개 구성">'+
   [{role:'NEW',heading:'새 단어 12개',count:12},{role:'REVIEW',heading:'지난 단어 24개',count:24}].map(group=>
     '<section class="hs-cycle-column hs-cycle-'+group.role.toLowerCase()+'"><h4>'+group.heading+'</h4><ol>'+c.rows.filter(x=>x.role===group.role).map(x=>
     '<li><strong>'+esc(x.word.eng)+'</strong><small>출처 '+esc(x.sourceSheetId)+'</small></li>').join('')+'</ol></section>'
   ).join('')+'</div>':'';
 view.innerHTML='<section class="learning-shell hs-english-cycle"><div class="learn-head"><div><span class="phase-chip">영어 · 12+24</span><h2>이번 주 단어 탐험</h2></div></div><section class="card"><h3>새 단어 12 + 전에 배운 단어 24</h3><p>'+text+'</p><div class="grid2"><div class="status-pill"><b>'+c.newCount+'/12</b><span>이번 시험지</span></div><div class="status-pill"><b>'+c.reviewCount+'/24</b><span>지난 시험지 복습</span></div></div>'+board+'<p>출처가 확인된 서로 다른 시험지만 사용합니다. 예시·미확인 OCR·중복 항목은 점수에 포함하지 않습니다.</p><div class="btn-row">'+(c.state==='READY'?'<button class="btn primary" id="cycleEnable" type="button">36개 학습 시작</button>':'')+'<button class="btn secondary" id="cycleSheets" type="button">시험지 확인</button><button class="btn secondary" id="cycleHome" type="button">돌아가기</button></div></section></section>';
 document.querySelector('#cycleEnable')?.addEventListener('click',()=>{const r=ensure();if(r.state==='ENABLED'){hsHomeSubject='ENGLISH';currentTab='home';viewStack=[];render()}else show()});
 document.querySelector('#cycleSheets').onclick=()=>{currentTab='sheets';viewStack=[];render()};
 document.querySelector('#cycleHome').onclick=()=>{currentTab='home';render()};
 return current;
}
window.HideEnglishCycleV1=Object.freeze({version:VERSION,compose,status,activeWords,originOf,summarizePractice,enable:ensure,disable,show});
})();