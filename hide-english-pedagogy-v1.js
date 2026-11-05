/* Hide English Home CORE=spelling pieces / RECALL=unaided typed retrieval.
   Evidence is immediate observation, never long-term mastery or Ready completion. */
(()=>{
'use strict';
if(window.HideEnglishPedagogyV1)return;
const VERSION='2026.10.17-hide-english-core-recall-v1';
let run=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().normalize('NFC').toLocaleLowerCase('en');
const node=s=>document.querySelector(s);
const ordered=mode=>validWords().filter(w=>w.eng&&w.kor&&(mode==='RECALL'||/[a-zA-Z]/.test(w.eng)));
function blanks(word){
 const len=word.length;const amount=Math.max(1,Math.min(3,Math.floor(len/3)));
 const possible=Array.from({length:len},(_,i)=>i).filter(i=>i>0&&i<len-1&&/[a-zA-Z]/.test(word[i]));
 if(!possible.length)return [Array.from({length:len},(_,i)=>i).find(i=>/[a-zA-Z]/.test(word[i]))??0];
 const slots=[];
 for(let n=1;n<=amount;n++){const candidate=possible[Math.min(possible.length-1,Math.floor(n*possible.length/(amount+1)))];if(!slots.includes(candidate))slots.push(candidate)}
 return slots;
}
function tiles(word,slots){
 const needed=slots.map(i=>word[i].toLowerCase());
 const decoys=[...'aceilnorstbdmup'].filter(c=>!needed.includes(c)).slice(0,Math.max(3,needed.length));
 const chars=[...needed,...decoys].map((ch,i)=>({id:'t'+i,ch}));
 const rotation=word.length%chars.length;return chars.slice(rotation).concat(chars.slice(0,rotation));
}
function showNotice(s){const el=node('#hsPedagogyFeedback');if(el)el.textContent=s;}
function current(){return run?.words?.[run.index]||null}
function renderSummary(){
 const entries=S.learning.history.filter(x=>x.runId===run.id&&x.mode===run.mode);
 const first=new Map();
 for(const e of entries){if(!first.has(e.wordId))first.set(e.wordId,e)}
 const values=[...first.values()];
 const unassisted=values.filter(x=>x.result==='CORRECT'&&!x.hintLevel&&!x.wrongAttempts).length;
 const cycle=window.HideEnglishCycleV1?.status?.();
 let split='';
 if(cycle?.active&&S.englishPracticeCycle?.active){
  const group=role=>{
   const owned=run.words.filter(w=>window.HideEnglishCycleV1?.originOf?.(w.id)?.role===role);
   const attempts=owned.map(w=>first.get(w.id)).filter(Boolean);
   return {total:owned.length,attempted:attempts.length,independent_correct:attempts.filter(x=>x.result==='CORRECT'&&!x.hintLevel&&!x.wrongAttempts).length,
    assisted_or_retry:attempts.filter(x=>x.result==='HINT_USED'||x.result==='WRONG').length,
    passed:attempts.filter(x=>x.result==='PASS').length};
  };
  const new12=group('NEW'),review24=group('REVIEW');
  const summary={state:'LOCAL_IMMEDIATE_PRACTICE_ONLY',runId:run.id,mode:run.mode,recordedAt:nowISO(),new12,review24,
    delayed_retrieval_verified:false,central_achievement_verified:false};
  S.englishPracticeCycle.lastResult=summary;save();
  split='<div class="grid2 hs-weekly-mode-result"><div class="status-pill"><b>'+new12.independent_correct+'/'+new12.total+'</b><span>신규 · 도움 없는 회상</span></div><div class="status-pill"><b>'+review24.independent_correct+'/'+review24.total+'</b><span>지난 단어 · 도움 없는 회상</span></div></div>';
 }
 node('#view').innerHTML='<section class="learning-shell hs-pedagogy"><div class="learn-head"><span class="phase-chip">'+run.mode+'</span><h2>이번 탐험을 기록했어요</h2></div><section class="card"><p>처음부터 도움 없이 떠올린 단어 <b>'+unassisted+'/'+run.words.length+'</b></p>'+split+'<p>이 결과는 <b>지금의 회상 기록</b>이에요. 나중에도 기억하는지는 Learning Engine이 별도로 확인해요.</p><button class="btn primary" type="button" id="hsPedagogyHome">숲으로 돌아가기</button></section></section>';
 node('#hsPedagogyHome').onclick=home;
}
function home(){currentTab='home';viewStack=[];renderHome()}
function record(word,result,responseValue=null){
 const st=run,source=window.HideEnglishCycleV1?.originOf?.(word.id)||null;
 const event={at:nowISO(),mode:st.mode,wordId:word.id,result,
  hintLevel:st.hints,wrongAttempts:st.wrong,attemptCount:st.wrong+1,runId:st.id,
  retrievalStep:st.mode==='RECALL'&&st.firstFind?'FIRST_FIND':null,
  firstAttemptResult:st.firstAttemptResult||null,memorizationEvidence:'NOT_VERIFIED_IN_HIDE',
  scoreAuthority:'IMMEDIATE_ONLY',...(source?{sourceSheetId:source.sourceSheetId,sourceRole:source.role}:{})};
 S.learning.history.push(event);
 if(result==='PASS')word.pass=(word.pass||0)+1;
 else if(result==='WRONG')word.wrong=(word.wrong||0)+1;
 else if(result==='HINT_USED')word.hint=(word.hint||0)+1;
 save();
 if(window.HideSeekBridge?.emit){
  const payload={learning_target_id:word.id,word_id:word.id,subject:'ENGLISH',instrument_version:'HIDE_HOME_'+st.mode+'_V1',
   interaction_mode:st.mode,attemptCount:st.wrong+1,assisted:st.hints>0,
   result_type:result,responseLatencyMs:Math.max(0,Date.now()-st.started),
   score_authority:'IMMEDIATE_ONLY',retrieval_step:st.mode==='RECALL'&&st.firstFind?'FIRST_FIND':null,
   first_attempt_result:st.firstAttemptResult||null,memorization_verified:false,
   ...(source?{word_set:'NEW_12_REVIEW_24',source_sheet_id:source.sourceSheetId,source_role:source.role}:{})};
  if(responseValue!=null)payload.verification_observation={response_value:responseValue,score_authority:'IMMEDIATE_ONLY'};
  try{window.HideSeekBridge.emit('RETRIEVAL_ATTEMPT_RESULT',payload)}catch{}
 }
}
function completed(word,result,responseValue=null){
 record(word,result,responseValue);run.done=true;
 showNotice(result==='CORRECT'?'도움 없이 찾았어!':result==='HINT_USED'?'힌트를 활용해서 찾아냈어.':result==='WRONG'?'다시 확인할 단어로 남길게.':'모르는 단어로 기록하고 다시 만날게.');
 const reveal=node('#hsPedagogyReveal');if(reveal){const ev=window.HideLanguageEvidence,key=String(word.eng||'').trim().toLowerCase(),origin=ev&&!ev.invalidRecords.includes(key)?ev.records[key]:null;reveal.textContent=(origin?origin.bridge+' · ':'')+'정답 · '+word.eng+' — '+word.kor;reveal.hidden=false}
 node('#hsPedagogyNext').hidden=false;
 for(const selector of ['#hsPedagogyCheck','#hsPedagogyHint','#hsPedagogyPass']){const btn=node(selector);if(btn)btn.disabled=true}
 for(const btn of document.querySelectorAll('.hs-piece-key,.hs-piece-slot'))btn.disabled=true;
 if(node('#hsRecallAnswer'))node('#hsRecallAnswer').disabled=true;
}
function hint(){
 if(!run||run.done)return;
 if(run.mode==='RECALL'&&!run.firstAttemptMade)return;
 run.hints++;
 const mode=run.mode;
 const messages=mode==='CORE'
  ?['뜻을 먼저 말하고, 보이는 글자들의 소리를 차례로 이어 봐.','빈칸에 자음이 자연스러울까, 모음이 자연스러울까? 직접 추론해 봐.','다른 글자 조합을 만들어 소리 내 보자. 어떤 칸이 맞는지는 알려주지 않을게.']
  :['한글 뜻을 보고 영어 단어를 마음속으로 먼저 떠올려 봐.','소리부터 천천히 떠올린 뒤 입력해 봐. 정답 글자를 알려주지 않을게.','모르겠으면 도움을 청해도 좋아. 정답을 대신 입력하지는 않을게.'];
 showNotice(messages[Math.min(3,run.hints)-1]);
}
function buildCore(word){
 run.slots=blanks(word.eng.trim());run.keys=tiles(word.eng.trim(),run.slots);run.answers={};run.activeKey=null;
 const indexes=new Set(run.slots);
 const letters=[...word.eng.trim()].map((c,i)=>indexes.has(i)
  ?'<button type="button" class="hs-piece-slot" data-piece-slot="'+run.slots.indexOf(i)+'" aria-label="'+(i+1)+'번째 빈칸">_</button>'
  :'<span class="hs-piece-fixed">'+esc(c)+'</span>').join('');
 const buttons=run.keys.map(k=>'<button class="hs-piece-key" data-piece-key="'+k.id+'" type="button">'+esc(k.ch)+'</button>').join('');
 return '<div class="hs-spelling-tiles" aria-label="글자 빈칸 맞추기">'+letters+'</div><div class="hs-piece-keys" aria-label="사용할 글자 조각">'+buttons+'</div><p class="hs-piece-instruction">글자 조각을 고르고 빈칸을 누르세요. 다 채운 뒤 직접 확인해요.</p>';
}
function bindCore(word){
 function update(){
  for(const slot of document.querySelectorAll('[data-piece-slot]')){
   const k=run.keys.find(x=>x.id===run.answers[slot.dataset.pieceSlot]);
   slot.textContent=k?.ch||'_';
  }
  for(const k of document.querySelectorAll('[data-piece-key]')){
   k.classList.toggle('is-selected',k.dataset.pieceKey===run.activeKey);
   k.disabled=Object.values(run.answers).includes(k.dataset.pieceKey);
  }
 }
 document.querySelectorAll('[data-piece-key]').forEach(btn=>btn.onclick=()=>{run.activeKey=btn.dataset.pieceKey;update()});
 document.querySelectorAll('[data-piece-slot]').forEach(btn=>btn.onclick=()=>{
  if(run.done)return;
  const slot=btn.dataset.pieceSlot;
  if(!run.activeKey){delete run.answers[slot];update();return}
  for(const [k,v] of Object.entries(run.answers))if(v===run.activeKey)delete run.answers[k];
  run.answers[slot]=run.activeKey;run.activeKey=null;update();
 });
 node('#hsPedagogyCheck').onclick=()=>{
  if(Object.keys(run.answers).length!==run.slots.length){showNotice('먼저 빈칸을 모두 채워 주세요.');return}
  const actual=[...word.eng.trim()].map((c,i)=>run.slots.includes(i)?run.keys.find(k=>k.id===run.answers[run.slots.indexOf(i)])?.ch||'':c).join('');
  if(norm(actual)!==norm(word.eng)){run.wrong++;showNotice('아직 맞지 않는 부분이 있어. 어느 칸인지는 표시하지 않을게. 글자를 바꾸고 다시 확인해 봐.');return}
  completed(word,run.wrong?'WRONG':run.hints?'HINT_USED':'CORRECT',actual);
 };
}
function bindRecall(word){
 const input=node('#hsRecallAnswer');
 node('#hsPedagogyCheck').onclick=()=>{
  const answer=input.value.trim();
  if(!answer){showNotice('기억나는 단어를 직접 적거나 모르겠어를 눌러 주세요.');return}
  if(norm(answer)!==norm(word.eng)){run.firstAttemptMade=true;run.firstAttemptResult=run.firstAttemptResult||'WRONG';run.wrong++;node('#hsPedagogyHint').disabled=false;showNotice('이번 답은 아직 맞지 않아. 철자와 뜻을 다시 생각해 봐. 정답은 아직 보여주지 않을게.');return}
  run.firstAttemptMade=true;run.firstAttemptResult=run.firstAttemptResult||'CORRECT';
  completed(word,run.wrong?'WRONG':run.hints?'HINT_USED':'CORRECT',answer);
 };
 input.onkeydown=e=>{if(e.key==='Enter')node('#hsPedagogyCheck').click()};
}
function render(){
 const word=current();
 if(!word)return renderSummary();
 run.started=Date.now();run.hints=0;run.wrong=0;run.done=false;
 run.firstAttemptMade=false;run.firstAttemptResult=null;
 run.firstFind=run.mode==='RECALL'&&!S.learning.history.some(x=>x.wordId===word.id&&x.mode==='RECALL'&&['CORRECT','HINT_USED','WRONG','PASS'].includes(x.result));
 const recall=run.mode==='RECALL';
 node('#view').innerHTML='<section class="learning-shell hs-pedagogy" data-hs-pedagogy="'+run.mode+'"><header class="hs-learning-forest-hero"><div class="hs-learning-hero-title"><span class="phase-chip">'+run.mode+'</span><h2>'+(recall?'숨은 단어 · 혼자 떠올리기':'핵심 조각 · 글자 만들기')+'</h2><small>숲과 폭포의 단어 탐험 · '+(run.index+1)+'/'+run.words.length+'</small></div></header><section class="card word-card"><p>이 뜻을 가진 영어 단어는?</p><div class="kor hs-pedagogy-meaning">'+esc(word.kor)+'</div>'+
 (recall?'<label for="hsRecallAnswer">기억나는 영어 단어를 입력하세요.</label><input class="input" id="hsRecallAnswer" type="text" autocapitalize="none" autocomplete="off" spellcheck="false" placeholder="직접 떠올려 입력하기">':buildCore(word))+
 '<p id="hsPedagogyFeedback" aria-live="polite" role="status"></p><p id="hsPedagogyReveal" hidden></p><div class="btn-row"><button class="btn gold" id="hsPedagogyHint" type="button">힌트</button><button class="btn secondary" id="hsPedagogyPass" type="button">모르겠어</button><button class="btn primary" id="hsPedagogyCheck" type="button">확인하기</button><button class="btn primary" id="hsPedagogyNext" type="button" hidden>다음</button></div></section><button type="button" id="hsPedagogyHome" class="btn secondary">숲으로 돌아가기</button></section>';
 node('#hsPedagogyHint').onclick=hint;
 node('#hsPedagogyPass').onclick=()=>completed(word,'PASS');
 node('#hsPedagogyNext').onclick=()=>{run.index++;render()};
 node('#hsPedagogyHome').onclick=home;
 if(recall){node('#hsPedagogyHint').disabled=true;bindRecall(word)}else bindCore(word);
}
function open(mode){
 const selected=String(mode||'').toUpperCase();
 if(!['CORE','RECALL'].includes(selected))return {state:'BAD_MODE'};
 const words=ordered(selected);
 if(!words.length){if(typeof hsShowNotice==='function')hsShowNotice('확인된 영어 단어가 없거나 글자 학습에 맞지 않습니다. 원문 단어를 확인하세요.');return {state:'NO_VALID_WORDS'}}
 run={mode:selected,index:0,words,id:'home-'+selected+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)};
 S.learning.phase=selected.toLowerCase();save();render();
 return {state:'READY',mode:selected,count:words.length};
}
window.HideEnglishPedagogyV1=Object.freeze({version:VERSION,open,status:()=>({active:run?.mode||null,index:run?.index??null})});
})();