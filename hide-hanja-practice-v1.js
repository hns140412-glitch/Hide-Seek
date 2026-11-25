(() => {
'use strict';
if(window.HideHanjaPracticeV1)return;
// Hanja reference practice, rev 2026-11-24.
// Same four freely selectable modes (TRACE / LINK / CORE / RECALL). What changed:
//  - the 48 source-verified characters are walked in small "구간" of 5, not all 48 in one line;
//  - TRACE = look and listen, then cover and recall (알았어 / 아직이야, 아직 comes back in the same round);
//  - a miss (wrong, pass) is noted per character and the character comes back once at the end of the round;
//  - "다시 만날 한자" gathers every missed character across rounds; answering one first try takes it off the list;
//  - "48자 모두 섞어서" mixes everything; a small map shows each 구간's state. Progress lives in S.hanjaPractice.
//  - "이번 주 구간": this week's 재능 한자 registered in Ready & Set (HideHanjaWeekV1), same look/cover/voice flow
//    in parts of 5; 훈음 from the 48 chars or the TAKY gloss reference; a character with no known 훈음 is left out and named.
// Records stay practice-only (grade_authority NONE_REFERENCE_PRACTICE_ONLY); no canonical evidence is emitted.
const DATA='./data/hanja-reference-practice-projection-v1.json',GLOSS='./data/hanja-char-gloss-reference-v1.json',MODES=['TRACE','LINK','CORE','RECALL'],CAMP=5,AGAIN_MAX=2,REVIEW_MAX=10;
const DESC={TRACE:'보고·소리 듣기',LINK:'한자와 음 연결',CORE:'글자의 의미 찾기',RECALL:'음·뜻에서 글자 회상'};
const KO={TRACE:'처음 찾기',LINK:'연결의 길',CORE:'글자 조각',RECALL:'숨은 단어'};
let loaded=null,rows=[],mode='TRACE',scope={kind:'CAMP',camp:0},gloss=null,glossMeta=null;const extra=new Map();
let queue=[],pos=0,step='VIEW',again={},round=null;
let started=0,wrong=0,hints=0,done=false,revealed=false,gen=0,rec=null;
// Voice answer (TRACE cover step): the child says 뜻과 음 aloud; the device's own speech recognition
// (Web Speech API, ko-KR) turns it into text and we compare. Hidden when the device has none.
const SR=()=>window.SpeechRecognition||window.webkitSpeechRecognition||null;
const DIGIT={'0':'영','1':'일','2':'이','3':'삼','4':'사','5':'오','6':'육','7':'칠','8':'팔','9':'구'};
const norm=s=>String(s||'').replace(/10/g,'십').replace(/[0-9]/g,d=>DIGIT[d]).replace(/[^가-힣]/g,'');
function spokenMatches(card,alts){const m=norm(card.meaning),rs=(card.readings||[card.reading]).map(norm).filter(Boolean);return alts.some(a=>{const t=norm(a);return rs.some(r=>t.includes(m+r)||t.includes(r+m)||(t.includes(m)&&t.endsWith(r)))})}
function stopListening(){const r=rec;rec=null;try{r?.abort?.()}catch{}}
function listen(cb){
 const C=SR();if(!C)return cb(null);
 stopListening();try{speechSynthesis?.cancel?.()}catch{}
 let r;try{r=new C()}catch{return cb(null)}
 rec=r;r.lang='ko-KR';r.interimResults=false;r.maxAlternatives=5;r.continuous=false;
 let sent=false;const fin=v=>{if(sent)return;sent=true;if(rec===r)rec=null;cb(v)};
 r.onresult=ev=>{const res=ev?.results?.[0],alts=[];if(res)for(let i=0;i<res.length;i++)if(res[i]?.transcript)alts.push(String(res[i].transcript));fin(alts.length?alts:null)};
 r.onerror=()=>fin(null);r.onend=()=>fin(null);
 try{r.start()}catch{fin(null)}
 setTimeout(()=>{try{r.stop()}catch{}},6000);
}
const q=s=>document.querySelector(s);
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const grade=()=>{const x=window.HideLearningTermLoaderV1,c=x?.context?.()||{},p=typeof S==='object'?S.profile||{}:{};return x?.resolveGradeContext?.({...c,age:c.age||p.age||'',school_grade:c.school_grade||p.school_grade||''})||{state:'NO_GRADE_CONTEXT'}};
const persist=()=>{try{if(typeof save==='function')save()}catch{}};
async function load(){
 if(loaded)return;
 const r=await fetch(DATA,{cache:'no-cache'});if(!r.ok)throw Error('훈음 원천 자료를 읽지 못했습니다');
 const d=await r.json();
 if(d.schema!=='TAKY_HIDE_HANJA_REFERENCE_PRACTICE_PROJECTION_V1'||d.grade_authority!=='NONE_REFERENCE_PRACTICE_ONLY')throw Error('훈음 출처·권한 미확인');
 rows=(d.items||[]).filter(x=>x?.char&&x?.reading&&x?.meaning&&/^[㐀-鿿]$/.test(x.char));
 if(rows.length<4)throw Error('확인된 한자 카드가 부족합니다');loaded=d;
}
async function loadGloss(){
 if(gloss)return;
 try{const r=await fetch(GLOSS,{cache:'no-cache'});if(!r.ok)throw Error();const d=await r.json();
  if(d.schema!=='TAKY_HIDE_HANJA_GLOSS_REFERENCE_V1'||d.grade_authority!=='NONE_REFERENCE_PRACTICE_ONLY')throw Error();
  gloss=new Map((d.items||[]).filter(x=>x?.char&&x?.meaning&&x?.reading).map(x=>[x.char,x]));glossMeta=d.created_from||null}
 catch{gloss=new Map()}
}
function cardFor(ch){
 const r=rows.find(x=>x.char===ch);if(r)return r;
 if(extra.has('G-'+ch))return extra.get('G-'+ch);
 // worksheet ?덉쓬 (from Ready) first, then the TAKY gloss reference
 const w=week()?.gloss?.[ch];
 if(w){const c={id:'G-'+ch,char:ch,meaning:w.meaning,reading:w.reading,gloss:true,gloss_source:'READY_TALENT_WEEK'};extra.set(c.id,c);return c}
 const g=gloss?.get(ch);if(!g)return null;
 const c={id:'G-'+ch,char:ch,meaning:g.meaning,reading:g.reading,readings:g.readings,gloss:true,gloss_source:(g.sources||[])[0]||null};extra.set(c.id,c);return c;
}
const week=()=>window.HideHanjaWeekV1?.current?.()||null;
function weekCards(){const w=week();return w?w.chars.map(cardFor).filter(Boolean):[]}
function weekMissing(){const w=week();return w?w.chars.filter(ch=>!cardFor(ch)):[]}
const weekParts=()=>Math.ceil(weekCards().length/CAMP);
const allCards=()=>rows.concat([...extra.values()]);
function weekState(){
 const w=week(),h=book();if(!w)return null;
 h.weeks=h.weeks&&typeof h.weeks==='object'?h.weeks:{};
 const ws=h.weeks[w.week_id]=h.weeks[w.week_id]||{part:0,parts:{}};
 const keys=Object.keys(h.weeks).sort();while(keys.length>6)delete h.weeks[keys.shift()];
 return ws;
}
function groupRows(){return scope.kind==='WEEK'?weekCards().slice(scope.part*CAMP,scope.part*CAMP+CAMP):campRows(scope.camp)}
function groupState(){
 if(scope.kind==='WEEK'){const ws=weekState();if(!ws)return {best:{}};const p=ws.parts[scope.part]=ws.parts[scope.part]||{};if(!p.best||typeof p.best!=='object')p.best={};return p}
 return campState(scope.camp);
}
function book(){
 if(typeof S!=='object'||!S)return {records:[],camps:{},wrongLog:{},camp:0,recovered:0};
 const h=S.hanjaPractice=S.hanjaPractice||{records:[]};
 if(!Array.isArray(h.records))h.records=[];
 if(!h.camps||typeof h.camps!=='object')h.camps={};
 if(!h.wrongLog||typeof h.wrongLog!=='object')h.wrongLog={};
 if(!Number.isInteger(h.camp))h.camp=0;
 h.recovered=Math.max(0,h.recovered|0);
 return h;
}
const campCount=()=>Math.ceil(rows.length/CAMP);
const campRows=n=>rows.slice(n*CAMP,n*CAMP+CAMP);
const campOf=card=>Math.floor(rows.indexOf(card)/CAMP);
const campState=n=>{const h=book();const c=h.camps[n]=h.camps[n]||{};if(!c.best||typeof c.best!=='object')c.best={};return c};
function reviewPool(){
 const log=book().wrongLog;
 // missed gloss characters from an earlier week stay in the pile while their 훈음 is known
 for(const id of Object.keys(log))if(id.startsWith('G-')&&(log[id]|0)>0)cardFor(id.slice(2));
 const all=allCards();return all.filter(x=>(log[x.id]|0)>0).sort((a,b)=>(log[b.id]|0)-(log[a.id]|0)||all.indexOf(a)-all.indexOf(b));
}
function shuffled(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function scopeLabel(){
 if(scope.kind==='REVIEW')return '다시 만날 한자';
 if(scope.kind==='ALL')return rows.length+'자 모두 섞어서';
 if(scope.kind==='WEEK'){const n=weekParts();return (week()?.label||'이번 주 구간')+(n>1?' '+(scope.part+1)+'/'+n:'')}
 return (scope.camp+1)+'구간 · '+campRows(scope.camp).map(x=>x.char).join(' ');
}
function startRound(){
 const h=book();
 if(scope.kind==='CAMP'){scope.camp=Math.min(Math.max(0,scope.camp|0),campCount()-1);h.camp=scope.camp;queue=campRows(scope.camp)}
 else if(scope.kind==='WEEK'){const n=weekParts();if(n){scope.part=Math.min(Math.max(0,scope.part|0),n-1);weekState().part=scope.part;queue=groupRows()}else queue=[]}
 else if(scope.kind==='REVIEW')queue=reviewPool().slice(0,REVIEW_MAX);
 else queue=shuffled(rows);
 if(!queue.length){scope={kind:'CAMP',camp:h.camp};queue=campRows(h.camp)}
 queue=queue.slice();pos=0;again={};
 step=mode==='TRACE'?(scope.kind==='CAMP'||scope.kind==='WEEK'?'VIEW':'COVER'):'ASK';
 round={total:queue.length,first:0,firstSeen:new Set(),missed:new Set(),known:0,recovered:0};
 persist();render();
}
function options(card,field){
 const seen=new Set([card[field]]),pool=[];
 const group=scope.kind==='WEEK'?groupRows():campRows(campOf(card));
 const mates=group.filter(x=>x.id!==card.id),rest=rows.filter(x=>x.id!==card.id&&!mates.includes(x));
 for(const x of mates.concat(rest)){if(seen.has(x[field]))continue;seen.add(x[field]);pool.push(x);if(pool.length>=3)break}
 const vals=[card,...pool];
 const shift=(pos+campOf(card)+1)%vals.length;
 return vals.slice(shift).concat(vals.slice(0,shift));
}
function record(card,result,more){
 const g=grade(),h=book();
 const item={at:new Date().toISOString(),subject:'HANJA',mode,word_id:card.id,char:card.char,source_ref:card.gloss?(card.gloss_source==='READY_TALENT_WEEK'?'READY_TALENT_WEEK_V1':(glossMeta?.source_id||'TAKY_HIDE_HANJA_GLOSS_REFERENCE_V1')):loaded.created_from.source_id,source_sha256:card.gloss?(card.gloss_source==='READY_TALENT_WEEK'?null:glossMeta?.sha256||null):loaded.created_from.sha256,...(card.gloss?{gloss_source:card.gloss_source}:{}),grade:g.state==='RESOLVED'?g.grade:null,grade_authority:'NONE_REFERENCE_PRACTICE_ONLY',result,hintLevel:hints,wrongAttempts:wrong,responseLatencyMs:Date.now()-started,practice_only:true,scope:scope.kind,camp:campOf(card),...(scope.kind==='WEEK'?{week_id:week()?.week_id||null,week_part:scope.part,source_app:'ready-set'}:{}),...(more||{})};
 h.records=[...h.records,item].slice(-250);
 // No canonical evidence emission: this is reference-only practice, not a verified
 // grade-specific task. Engine-owned HANJA projections must authorize promotion.
 persist();
}
function comeBack(card){const n=again[card.id]|0;if(n>=AGAIN_MAX)return false;again[card.id]=n+1;queue.push(card);return true}
function finish(card,result){
 done=true;record(card,result);
 const h=book(),first=!round.firstSeen.has(card.id);round.firstSeen.add(card.id);
 let note='';
 if(result==='CORRECT'){
  if(first)round.first++;
  if(scope.kind==='REVIEW'&&(h.wrongLog[card.id]|0)>0){delete h.wrongLog[card.id];h.recovered++;round.recovered++;note=' · 다시 만날 한자에서 빠졌어'}
 }else{
  h.wrongLog[card.id]=(h.wrongLog[card.id]|0)+1;round.missed.add(card.id);
  if(comeBack(card))note=' · 조금 뒤에 다시 만나';
 }
 persist();
 q('#hanjaFeedback').textContent=(result==='CORRECT'?'찾았어! ':'다시 찾을 수 있어! ')+card.char+' · '+card.meaning+' '+card.reading+note;
 document.querySelectorAll('[data-hanja-answer]').forEach(b=>{b.disabled=true;if(b.dataset.hanjaAnswer===card.id)b.classList.add('correct')});
 q('#hanjaNext').disabled=false;keepInView('#hanjaNext');
 q('#hanjaHint')?.setAttribute('disabled','');
 q('#hanjaPass')?.setAttribute('disabled','');
}
// TRACE card shows "<meaning> <reading>" (훈음, e.g. 날 일); the voice says the same, ONLY when the child taps
// 발음 듣기 (Taky 2026-11-25: no sound the child did not ask for). Recorded clip in the bound
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
function trail(){
 // small step trail for the current round: one stone per character, filled once it was met
 return '<ol class="hs-hanja-trail" aria-label="이번 구간 진행">'+queue.map((x,i)=>'<li class="'+(i<pos?'met':i===pos?'now':'')+'" aria-hidden="true"></li>').join('')+'</ol>';
}
function shell(inner,extraClass,withTrail){
 const g=grade();
 return '<section class="learning-shell hs-hanja-learning'+(extraClass?' '+extraClass:'')+'" data-hanja-mode="'+mode+'" data-hanja-scope="'+scope.kind+'">'+
  '<div class="hs-hanja-campbar"><button class="hs-hanja-mapbtn" id="hanjaMap" type="button" aria-label="한자 지도 열기">지도</button><span class="hs-hanja-camplabel">'+e(scopeLabel())+'</span>'+(withTrail?trail():'')+'</div>'+
  inner+
  '<p class="hs-hanja-authority">'+(scope.kind==='WEEK'?'이번 주 재능 숙제 한자 · 훈음 참고 학습 · ':'출처 검증 훈음 참고 학습 · ')+(g.state==='RESOLVED'?'학년 맥락 확인':'학년 미확인')+' · 교과 성취 점수와 별도</p><button class="btn secondary" id="hanjaExit" type="button">학습 방법으로 돌아가기</button></section>';
}
// On short phones the companion bar covers the lower part of the card: bring the row the child has to
// tap next (다음 / 알았어 / 보기 / 다음 구간) above it. Only scrolls when that row is actually hidden.
function keepInView(sel){
 requestAnimationFrame(()=>{
  const el=document.querySelector(sel);if(!el||el.hidden||!el.getClientRects().length)return;
  const bar=document.getElementById('partnerBar'),nav=document.getElementById('bottomNav');
  const tops=[innerHeight];for(const b of [bar,nav]){const r=b?.getBoundingClientRect();if(r&&r.height&&r.top>innerHeight*.4)tops.push(r.top)}
  const limit=Math.min(...tops)-10,r=el.getBoundingClientRect();
  if(r.bottom>limit)window.scrollBy({top:Math.min(r.bottom-limit,Math.max(0,r.top-70)),behavior:'smooth'});
 });
}
function bindShell(){
 q('#hanjaExit').onclick=()=>{stopListening();try{speechSynthesis?.cancel?.()}catch{}if(typeof currentTab!=='undefined')currentTab='home';if(typeof renderHome==='function')renderHome()};
 q('#hanjaMap').onclick=()=>{stopListening();renderMap()};
}
function render(){
 if(pos>=queue.length){
  if(mode==='TRACE'&&step==='VIEW'){
   groupState().seen=true;persist();
   step='COVER';queue=groupRows().slice();pos=0;again={};round.firstSeen=new Set();
  }else return renderSummary();
 }
 stopListening();const card=queue[pos],myGen=++gen;started=Date.now();wrong=0;hints=0;done=false;revealed=false;
 const comeback=round.firstSeen.has(card.id);
 const head='<div class="learn-head"><div><span class="phase-chip">'+mode+'</span><h2>'+(mode==='TRACE'?(step==='VIEW'?'보고·소리 듣기':'가리고 떠올리기'):DESC[mode])+'</h2></div><b>'+(pos+1)+'/'+queue.length+'</b></div>';
 let body;
 if(mode==='TRACE'&&step==='VIEW'){
  body='<div class="hs-hanja-big">'+e(card.char)+'</div><div class="hs-hanja-reveal">'+e(card.meaning)+' '+e(card.reading)+'</div><p id="hanjaFeedback" role="status" aria-live="polite"></p>'+
   '<div class="btn-row"><button class="btn secondary" id="hanjaHear" type="button">발음 듣기</button><button class="btn primary" id="hanjaNext" type="button">다음</button></div>';
 }else if(mode==='TRACE'){
  body='<div class="hs-hanja-big">'+e(card.char)+'</div><button class="hs-hanja-cover" id="hanjaReveal" type="button">'+(comeback?'한 번 더! ':'')+'뜻과 음을 떠올려 보고 눌러서 확인</button>'+(SR()?'<button class="btn secondary hs-hanja-say" id="hanjaSay" type="button">말로 답하기</button>':'')+'<p id="hanjaFeedback" role="status" aria-live="polite"></p>'+
   '<div class="btn-row hs-hanja-selfmark" hidden><button class="btn secondary" id="hanjaNotYet" type="button">아직이야</button><button class="btn primary" id="hanjaKnow" type="button">알았어</button></div>';
 }else{
  const field=mode==='LINK'?'reading':mode==='CORE'?'meaning':'char';
  const question=mode==='RECALL'?'<p class="hs-hanja-question">'+e(card.meaning)+' '+e(card.reading)+'에 맞는 글자는?</p>':'<p class="hs-hanja-question"><strong class="hs-hanja-big">'+e(card.char)+'</strong>'+(mode==='LINK'?'를 읽는 소리는?':'의 뜻은?')+'</p>';
  body=(comeback?'<p class="hs-hanja-again">다시 만난 한자</p>':'')+question+'<div class="choice-grid hs-hanja-options">'+options(card,field).map(o=>'<button class="choice" type="button" data-hanja-answer="'+e(o.id)+'">'+e(o[field])+'</button>').join('')+'</div>'+
   '<p id="hanjaFeedback" role="status" aria-live="polite"></p><div class="btn-row"><button class="btn gold" id="hanjaHint" type="button">힌트</button><button class="btn secondary" id="hanjaPass" type="button">모르겠어</button><button class="btn primary" id="hanjaNext" type="button" disabled>다음</button></div>';
 }
 q('#view').innerHTML=shell(head+'<section class="card word-card">'+body+'</section>','',true);
 bindShell();
 if(pos===0&&!comeback)window.scrollTo({top:0});
 keepInView(mode==='TRACE'&&step!=='VIEW'?'#hanjaReveal':mode==='TRACE'?'#hanjaNext':'#hanjaHint');
 if(mode==='TRACE'&&step==='VIEW'){
  q('#hanjaHear').onclick=()=>hear(card);
  q('#hanjaNext').onclick=()=>{record(card,'EXPOSED');pos++;render()};
  return;
 }
 if(mode==='TRACE'){
  let voiced=null;
  const reveal=()=>{
   if(revealed)return;revealed=true;stopListening();
   const b=q('#hanjaReveal');b.classList.add('open');b.innerHTML='<span class="hs-hanja-reveal">'+e(card.meaning)+' '+e(card.reading)+'</span>';b.disabled=true;
   q('.hs-hanja-selfmark').hidden=false;const s=q('#hanjaSay');if(s)s.hidden=true;keepInView('.hs-hanja-selfmark');
  };
  q('#hanjaReveal').onclick=reveal;
  const mark=(know,result)=>{
   if(!revealed||done||myGen!==gen)return;done=true;record(card,result||(know?'SELF_KNOWN':'SELF_NOT_YET'),voiced);
   const first=!round.firstSeen.has(card.id);round.firstSeen.add(card.id);
   if(know){if(first)round.known++}else{round.missed.add(card.id);comeBack(card)}
   pos++;render();
  };
  const say=q('#hanjaSay');
  if(say)say.onclick=()=>{
   if(revealed||done||say.disabled)return;
   say.disabled=true;say.textContent='듣고 있어';q('#hanjaFeedback').textContent='뜻과 음을 말해 봐';
   listen(alts=>{
    if(myGen!==gen||done||revealed)return;
    say.disabled=false;say.textContent='말로 답하기';
    if(!alts){q('#hanjaFeedback').textContent='잘 안 들렸어. 한 번 더 말하거나 눌러서 확인해 봐.';return}
    const ok=spokenMatches(card,alts);voiced={voice:true,voice_match:ok};
    reveal();
    if(ok){q('#hanjaFeedback').textContent='맞았어! '+card.meaning+' '+card.reading;setTimeout(()=>mark(true,'VOICE_MATCH'),900)}
    else q('#hanjaFeedback').textContent='이렇게 들렸어: '+alts[0]+' · 맞게 떠올렸으면 알았어를 눌러';
   });
  };
  q('#hanjaKnow').onclick=()=>mark(true);
  q('#hanjaNotYet').onclick=()=>mark(false);
  return;
 }
 q('#hanjaNext').onclick=()=>{pos++;render()};
 q('#hanjaHint').onclick=()=>{
  if(done)return;hints++;
  const messages=['그림처럼 글자의 모양과 전에 들은 소리를 떠올려 보자.','여러 보기의 차이점을 비교해 보자. 정답은 아직 보여주지 않을게.','어렵다면 모르겠어를 눌러 배우고 다음에 다시 만나자.'];
  q('#hanjaFeedback').textContent=messages[Math.min(hints,3)-1];keepInView('#hanjaHint');
 };
 q('#hanjaPass').onclick=()=>{if(!done)finish(card,'PASS')};
 document.querySelectorAll('[data-hanja-answer]').forEach(b=>b.onclick=()=>{
  if(done)return;
  if(b.dataset.hanjaAnswer!==card.id){wrong++;b.disabled=true;b.classList.add('wrong');q('#hanjaFeedback').textContent='아직 아니야. 남은 보기를 비교해 볼까?';return}
  finish(card,wrong?'WRONG':hints?'HINT_USED':'CORRECT');
 });
}
function renderSummary(){
 const h=book(),total=round.total,missed=[...round.missed].map(id=>rows.find(x=>x.id===id)).filter(Boolean);
 const firstGood=mode==='TRACE'?round.known:round.first;
 if(scope.kind==='CAMP'||scope.kind==='WEEK'){
  const c=groupState();
  if(mode==='TRACE'){c.seen=true;c.cover=Math.max(c.cover|0,firstGood)}
  else c.best[mode]=Math.max(c.best[mode]|0,firstGood);
  persist();
 }
 const pool=reviewPool(),nextCamp=scope.kind==='CAMP'&&scope.camp<campCount()-1,nextPart=scope.kind==='WEEK'&&scope.part<weekParts()-1;
 const line=mode==='TRACE'?'가리고 바로 떠올린 한자 '+firstGood+'/'+total:'한 번에 찾은 한자 '+firstGood+'/'+total;
 const met=queue.filter((x,i,a)=>a.indexOf(x)===i);
 const inner='<div class="learn-head"><div><span class="phase-chip">'+mode+'</span><h2>'+(scope.kind==='REVIEW'?'다시 만나기 끝':scope.kind==='ALL'?'모두 섞어서 끝':scope.kind==='WEEK'?(weekParts()>1?'이번 주 구간 '+(scope.part+1)+'/'+weekParts()+' 끝':'이번 주 구간 끝'):(scope.camp+1)+'구간 끝')+'</h2></div></div>'+
  '<section class="card word-card hs-hanja-summary"><p class="hs-hanja-score">'+e(line)+'</p>'+
  '<ul class="hs-hanja-chars">'+met.map(x=>'<li class="'+(round.missed.has(x.id)?'miss':'ok')+'"><b>'+e(x.char)+'</b><small>'+e(x.meaning+' '+x.reading)+'</small></li>').join('')+'</ul>'+
  (missed.length?'<p class="hs-hanja-note">다시 만날 한자에 넣어 뒀어: '+missed.map(x=>e(x.char)).join(' ')+'</p>':'<p class="hs-hanja-note">이번에 놓친 한자는 없어.</p>')+
  (round.recovered?'<p class="hs-hanja-note">'+round.recovered+'자를 되찾았어.</p>':'')+
  '<div class="btn-row hs-hanja-next">'+
   '<button class="btn secondary" id="hanjaAgain" type="button">한 번 더</button>'+
   (nextCamp?'<button class="btn primary" id="hanjaNextCamp" type="button">'+(scope.camp+2)+'구간으로</button>':'')+
   (nextPart?'<button class="btn primary" id="hanjaNextPart" type="button">이번 주 다음 '+groupRowsAt(scope.part+1).length+'자</button>':'')+
   (pool.length?'<button class="btn gold" id="hanjaReviewGo" type="button">다시 만날 한자 '+pool.length+'자</button>':'')+
  '</div></section>';
 q('#view').innerHTML=shell(inner,'hs-hanja-done');
 bindShell();window.scrollTo({top:0});keepInView('.hs-hanja-next');
 q('#hanjaAgain').onclick=()=>startRound();
 if(nextCamp)q('#hanjaNextCamp').onclick=()=>{scope={kind:'CAMP',camp:scope.camp+1};startRound()};
 if(nextPart)q('#hanjaNextPart').onclick=()=>{scope={kind:'WEEK',part:scope.part+1};startRound()};
 if(pool.length)q('#hanjaReviewGo').onclick=()=>{scope={kind:'REVIEW'};startRound()};
}
function groupRowsAt(n){return weekCards().slice(n*CAMP,n*CAMP+CAMP)}
function dayLabel(d){const t=new Date(d+'T00:00:00');return isNaN(t)?d:(t.getMonth()+1)+'월 '+t.getDate()+'일('+'일월화수목금토'[t.getDay()]+')'}
function weekBlock(){
 const w=week(),st=window.HideHanjaWeekV1?.status?.()||{};
 if(!w){
  if(st.state==='NOT_CONFIRMED')return '<div class="hs-hanja-week wait"><b>이번 주 구간</b><small>보호자 확인을 기다리는 중이야</small></div>';
  return '';
 }
 const cards=weekCards(),miss=weekMissing(),ws=weekState(),n=weekParts();
 const done=Object.keys(ws?.parts||{}).filter(k=>ws.parts[k]?.seen).length;
 return '<div class="hs-hanja-week"><button type="button" data-hanja-week-go="'+(ws?.part|0)+'" '+(cards.length?'':'disabled')+'><b>'+e(w.label||'이번 주 구간')+'</b>'+
  '<span class="chars">'+cards.map(x=>e(x.char)).join(' ')+'</span>'+
  '<small>재능 한자'+(w.range_text?' '+e(w.range_text):'')+' · '+cards.length+'자 · '+e(dayLabel(w.deadline))+'까지'+(n>1?' · '+done+'/'+n+' 해 봤어':'')+'</small>'+
  (miss.length?'<small class="miss">뜻과 음을 아직 몰라서 빠진 글자: '+miss.map(e).join(' ')+'</small>':'')+'</button></div>';
}
function campLine(n){
 const c=book().camps[n];if(!c||(!c.seen&&!Object.keys(c.best||{}).length))return '아직 안 가 봤어';
 const parts=[];if(c.seen)parts.push('떠올리기 '+(c.cover|0)+'/'+campRows(n).length);
 for(const m of ['LINK','CORE','RECALL'])if(c.best?.[m]!=null)parts.push(KO[m]+' '+c.best[m]+'/'+campRows(n).length);
 return parts.join(' · ');
}
function renderMap(){
 try{speechSynthesis?.cancel?.()}catch{}
 const h=book(),pool=reviewPool();
 const tabs='<div class="hs-hanja-modes" role="group" aria-label="학습 방법">'+MODES.map(m=>'<button type="button" class="'+(m===mode?'on':'')+'" data-hanja-switch="'+m+'" aria-pressed="'+(m===mode)+'"><b>'+KO[m]+'</b><small>'+m+'</small></button>').join('')+'</div>';
 const camps='<ol class="hs-hanja-camps">'+Array.from({length:campCount()},(_,n)=>'<li><button type="button" data-hanja-camp="'+n+'" class="'+(n===h.camp?'here':'')+'"><span class="no">'+(n+1)+'</span><span class="chars">'+campRows(n).map(x=>e(x.char)).join(' ')+'</span><small>'+e(campLine(n))+'</small></button></li>').join('')+'</ol>';
 const more='<div class="hs-hanja-gather"><button type="button" data-hanja-scope-go="REVIEW" '+(pool.length?'':'disabled')+'><b>다시 만날 한자</b><small>'+(pool.length?pool.slice(0,8).map(x=>e(x.char)).join(' ')+(pool.length>8?' …':'')+' · '+pool.length+'자':'아직 없어')+'</small></button>'+
  '<button type="button" data-hanja-scope-go="ALL"><b>'+rows.length+'자 모두 섞어서</b><small>'+(h.recovered?'지금까지 되찾은 한자 '+h.recovered+'자':'구간을 다 돌고 나서 해 봐')+'</small></button></div>';
 const inner='<div class="learn-head"><div><span class="phase-chip">MAP</span><h2>한자 지도</h2></div><b>'+rows.length+'자</b></div>'+tabs+weekBlock()+camps+more;
 q('#view').innerHTML=shell(inner,'hs-hanja-mapview');
 bindShell();window.scrollTo({top:0});
 q('.hs-hanja-campbar').hidden=true;
 document.querySelectorAll('[data-hanja-switch]').forEach(b=>b.onclick=()=>{mode=b.dataset.hanjaSwitch;renderMap()});
 document.querySelectorAll('[data-hanja-camp]').forEach(b=>b.onclick=()=>{scope={kind:'CAMP',camp:+b.dataset.hanjaCamp};startRound()});
 document.querySelectorAll('[data-hanja-week-go]').forEach(b=>b.onclick=()=>{if(b.disabled)return;scope={kind:'WEEK',part:+b.dataset.hanjaWeekGo|0};startRound()});
 document.querySelectorAll('[data-hanja-scope-go]').forEach(b=>b.onclick=()=>{if(b.disabled)return;scope={kind:b.dataset.hanjaScopeGo};startRound()});
}
async function open(raw){
 const chosen=String(raw||'').toUpperCase();if(!MODES.includes(chosen))return {state:'BAD_MODE'};
 try{
  await load();if(week()||Object.keys(book().wrongLog).some(k=>k.startsWith('G-')))await loadGloss();
  extra.clear();
  mode=chosen;
  // this week's homework comes first when Ready registered one; the 48-char 구간 stay one tap away on the map
  scope=weekParts()?{kind:'WEEK',part:weekState().part|0}:{kind:'CAMP',camp:book().camp};
  startRound();return {state:'READY',mode,card_count:rows.length,camp:scope.camp??null,scope:scope.kind,week_count:weekCards().length,grade_authority:loaded.grade_authority}}
 catch(ex){if(typeof hsShowNotice==='function')hsShowNotice('한자 학습 자료 연결 실패: '+String(ex.message||ex));return {state:'BLOCKED',reason:String(ex.message||ex)}}
}
window.addEventListener('hide-hanja-week-changed',()=>{if(loaded&&document.querySelector('.hs-hanja-mapview'))loadGloss().then(()=>{if(document.querySelector('.hs-hanja-mapview'))renderMap()})});
window.HideHanjaPracticeV1=Object.freeze({version:'2026.11.25-tap-only-sound',open,map:async()=>{await load();await loadGloss();renderMap();return {state:'READY'}},
 status:()=>({state:loaded?'REFERENCE_LOADED':'NOT_LOADED',cards:rows.length,camps:loaded?campCount():0,review:loaded?reviewPool().length:0,week:loaded?weekCards().map(x=>x.char).join(''):'',week_missing:loaded?weekMissing().join(''):''})});
})();
