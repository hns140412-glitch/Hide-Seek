(() => {
'use strict';
if(window.HideHanjaPracticeV1)return;
const DATA='./data/hanja-reference-practice-projection-v1.json',MODES=['TRACE','LINK','CORE','RECALL'];
let loaded=null,rows=[],mode='TRACE',index=0,started=0,wrong=0,hints=0,done=false;
const q=s=>document.querySelector(s);
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const grade=()=>{const x=window.HideLearningTermLoaderV1,c=x?.context?.()||{},p=typeof S==='object'?S.profile||{}:{};return x?.resolveGradeContext?.({...c,age:c.age||p.age||'',school_grade:c.school_grade||p.school_grade||''})||{state:'NO_GRADE_CONTEXT'}};
async function load(){
 if(loaded)return;
 const r=await fetch(DATA,{cache:'no-cache'});if(!r.ok)throw Error('훈음 원천 자료를 읽지 못했습니다');
 const d=await r.json();
 if(d.schema!=='TAKY_HIDE_HANJA_REFERENCE_PRACTICE_PROJECTION_V1'||d.grade_authority!=='NONE_REFERENCE_PRACTICE_ONLY')throw Error('훈음 출처·권한 미확인');
 rows=(d.items||[]).filter(x=>x?.char&&x?.reading&&x?.meaning&&/^[\u3400-\u9fff]$/.test(x.char));
 if(rows.length<4)throw Error('확인된 한자 카드가 부족합니다');loaded=d;
}
function options(card,field){
 const seen=new Set([card[field]]),other=[];
 for(const x of rows){if(x.id===card.id||seen.has(x[field]))continue;seen.add(x[field]);other.push(x);if(other.length>=Math.max(3,index%8+3))break}
 const vals=[card,...other.slice(-3)];
 const shift=(index+1)%vals.length;
 return vals.slice(shift).concat(vals.slice(0,shift));
}
function record(card,result){
 const g=grade();
 const item={at:new Date().toISOString(),subject:'HANJA',mode,word_id:card.id,char:card.char,source_ref:loaded.created_from.source_id,source_sha256:loaded.created_from.sha256,grade:g.state==='RESOLVED'?g.grade:null,grade_authority:'NONE_REFERENCE_PRACTICE_ONLY',result,hintLevel:hints,wrongAttempts:wrong,responseLatencyMs:Date.now()-started,practice_only:true};
 S.hanjaPractice=S.hanjaPractice||{records:[]};
 S.hanjaPractice.records=[...(S.hanjaPractice.records||[]),item].slice(-250);
 // No canonical evidence emission: this is reference-only practice, not a verified
 // grade-specific task. Engine-owned HANJA projections must authorize promotion.
 save();
}
function finish(card,result){
 done=true;record(card,result);
 q('#hanjaFeedback').textContent=(result==='CORRECT'?'찾았어! ':'다시 찾을 수 있어! ')+card.char+' · '+card.meaning+' '+card.reading;
 document.querySelectorAll('[data-hanja-answer]').forEach(b=>{b.disabled=true;if(b.dataset.hanjaAnswer===card.id)b.classList.add('correct')});
 q('#hanjaNext').disabled=false;
 q('#hanjaHint')?.setAttribute('disabled','');
 q('#hanjaPass')?.setAttribute('disabled','');
}
// TRACE card shows "<meaning> <reading>" (훈음, e.g. 날 일); the voice says the same. Recorded clip in the bound
// companion's voice family when one exists (explorer-crew-voice/data-hanja-lines.js), otherwise device TTS.
let voice=null;
function hear(card){
 const said=card.meaning+' '+card.reading;
 const tts=()=>{if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(said);u.lang='ko-KR';u.rate=.85;speechSynthesis.speak(u)}};
 if(voice){try{voice.pause()}catch{}voice=null}
 const fam=window.TakyCrewGuideLineVoice?.familyFor?.(window.HideExplorerCrewAuthorityConsumer);
 const url=fam&&window.TakyCrewHanjaLines?.clips?.[fam+'-'+card.id];
 if(!url||typeof Audio!=='function')return tts();
 try{window.TakyCrewGuideLineVoice?.stop?.();speechSynthesis?.cancel?.()}catch{}
 const a=new Audio(url);voice=a;let failed=false;
 const fail=()=>{if(failed||voice!==a)return;failed=true;voice=null;tts()};
 a.addEventListener('error',fail,{once:true});a.addEventListener('ended',()=>{if(voice===a)voice=null},{once:true});
 try{Promise.resolve(a.play()).catch(fail)}catch{fail()}
}
function render(){
 const card=rows[index%rows.length];started=Date.now();wrong=0;hints=0;done=false;
 const desc={TRACE:'보고·소리 듣기',LINK:'한자와 음 연결',CORE:'글자의 의미 찾기',RECALL:'음·뜻에서 글자 회상'}[mode];
 const field=mode==='LINK'?'reading':mode==='CORE'?'meaning':'char';
 const question=mode==='TRACE'?'<div class="hs-hanja-big">'+e(card.char)+'</div><div class="hs-hanja-reveal">'+e(card.meaning)+' '+e(card.reading)+'</div>':mode==='RECALL'?'<p class="hs-hanja-question">'+e(card.meaning)+' '+e(card.reading)+'에 맞는 글자는?</p>':'<p class="hs-hanja-question"><strong class="hs-hanja-big">'+e(card.char)+'</strong>'+ (mode==='LINK'?'를 읽는 소리는?':'의 뜻은?')+'</p>';
 const choices=mode==='TRACE'?'':'<div class="choice-grid hs-hanja-options">'+options(card,field).map(o=>'<button class="choice" type="button" data-hanja-answer="'+e(o.id)+'">'+e(o[field])+'</button>').join('')+'</div>';
 const g=grade();
 q('#view').innerHTML='<section class="learning-shell hs-hanja-learning" data-hanja-mode="'+mode+'"><div class="learn-head"><div><span class="phase-chip">'+mode+'</span><h2>'+desc+'</h2></div><b>'+((index%rows.length)+1)+'/'+rows.length+'</b></div><section class="card word-card">'+question+choices+'<p id="hanjaFeedback" role="status" aria-live="polite"></p><div class="btn-row">'+(mode==='TRACE'?'<button class="btn secondary" id="hanjaHear" type="button">발음 듣기</button>':'<button class="btn gold" id="hanjaHint" type="button">힌트</button><button class="btn secondary" id="hanjaPass" type="button">모르겠어</button>')+'<button class="btn primary" id="hanjaNext" type="button" '+(mode==='TRACE'?'':'disabled')+'>다음</button></div></section><p class="hs-hanja-authority">출처 검증 훈음 참고 학습 · '+(g.state==='RESOLVED'?'학년 맥락 확인':'학년 미확인')+' · 교과 성취 점수와 별도</p><button class="btn secondary" id="hanjaExit" type="button">학습 방법으로 돌아가기</button></section>';
 q('#hanjaExit').onclick=()=>{currentTab='home';renderHome()};
 q('#hanjaNext').onclick=()=>{if(mode==='TRACE')record(card,'EXPOSED');index++;render()};
 if(mode==='TRACE'){
  q('#hanjaHear').onclick=()=>hear(card);
  return;
 }
 q('#hanjaHint').onclick=()=>{
  if(done)return;hints++;
  const messages=['그림처럼 글자의 모양과 전에 들은 소리를 떠올려 보자.','여러 보기의 차이점을 비교해 보자. 정답은 아직 보여주지 않을게.','어렵다면 모르겠어를 눌러 배우고 다음에 다시 만나자.'];
  q('#hanjaFeedback').textContent=messages[Math.min(hints,3)-1];
 };
 q('#hanjaPass').onclick=()=>{if(!done)finish(card,'PASS')};
 document.querySelectorAll('[data-hanja-answer]').forEach(b=>b.onclick=()=>{
  if(done)return;
  if(b.dataset.hanjaAnswer!==card.id){wrong++;b.disabled=true;b.classList.add('wrong');q('#hanjaFeedback').textContent='아직 아니야. 남은 보기를 비교해 볼까?';return}
  finish(card,wrong?'WRONG':hints?'HINT_USED':'CORRECT');
 });
}
async function open(raw){
 const chosen=String(raw||'').toUpperCase();if(!MODES.includes(chosen))return {state:'BAD_MODE'};
 try{await load();mode=chosen;index=0;render();return {state:'READY',mode,card_count:rows.length,grade_authority:loaded.grade_authority}}
 catch(ex){if(typeof hsShowNotice==='function')hsShowNotice('한자 학습 자료 연결 실패: '+String(ex.message||ex));return {state:'BLOCKED',reason:String(ex.message||ex)}}
}
window.HideHanjaPracticeV1=Object.freeze({version:'2026.10.17-hanja-reference-v1',open,status:()=>({state:loaded?'REFERENCE_LOADED':'NOT_LOADED',cards:rows.length})});
})();