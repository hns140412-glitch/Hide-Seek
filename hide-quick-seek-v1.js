/* Hide & Seek — 한 판 숨바꼭질 (Quick Seek) v1
 * One-action recall mini rounds built only from the learner's confirmed worksheet words.
 * Mechanic reference: teamgame.kr teardown rows 2/3 (ADOPT frame only, ADJUST timer).
 *   - one line of rule + one tap per prompt, short round
 *   - the timer only offers "한 판 더?"; a wrong tap never removes anything already found
 *   - results are practice evidence (QUICK_SEEK), never FINAL SEEK / independent recall
 * Designable: rounds live in ROUNDS (add one entry to add a round type), all copy in COPY,
 * all timing in CONFIG, all colours/sizes as --qs-* tokens in hide-quick-seek-v1.css.
 * Look: the approved Mossfall HOME language (full forest art, timber signs, forest green / warm
 * timber / soft cream). No generic card shells: a hanging plank board, wooden stumps, real leaves.
 */
(function(){
'use strict';
const VERSION='HIDE_QUICK_SEEK_V1';
const CONFIG=Object.freeze({minWords:4,revealMs:950,flashShowMs:1700,coverMs:520,idleFinishMs:7000,countdownMs:2100,maxPromptsPerRun:80});
const COPY=Object.freeze({
 hubKicker:'QUICK SEEK',hubTitle:'한 판 숨바꼭질',hubSub:'폭포 숲에 단어가 숨었어',
 hubRule:'한 판은 짧아요. 틀려도 찾은 단어는 그대로예요.',
 needWords:n=>'확인한 단어가 '+n+'개 이상 있어야 숨바꼭질을 할 수 있어요.',
 needWordsAction:'학습지 사진 찍기',
 ready:'숨는 중…',go:'찾아라!',
 lastOne:'시간이 다 됐어. 이것만 찾고 끝내자!',
 foundTitle:'이번 판에 찾은 단어',
 foundNone:'이번 판은 몸풀기였어. 숨은 곳을 봤으니 다음 판엔 더 잘 보일 거야.',
 better:n=>'지난번 내 기록보다 '+n+'개 더 찾았어!',
 same:'지난번 내 기록과 똑같이 찾았어.',
 first:'첫 판 기록이 생겼어.',
 missedTitle:'한 번 놓친 단어 · 다시 찾을 보물로 갔어',
 again:'한 판 더 해볼래?',other:'다른 놀이',forest:'숲으로 돌아가기',
 evidenceNote:'숨바꼭질 결과는 연습 기록이에요. 마지막 찾기(철자) 점수와는 따로 남아요.'
});


/* 한 글자 숨바꼭질 (BSP-20261113 pattern DP2: one-change distractor, 찬찬한글 헷갈리는 모음/받침).
 * The learner's own confirmed Korean meaning hides among look-alikes that differ by exactly ONE jamo. */
const JAMO=Object.freeze({
 V:'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ',
 L:'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ',
 T:' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ',
 /* confusable groups first (the portal workbook's 헷갈리는 모음), then nearby sounds */
 vowelSwap:{'ㅏ':'ㅓㅑ','ㅓ':'ㅏㅗㅕ','ㅗ':'ㅜㅓㅛ','ㅜ':'ㅗㅡㅠ','ㅡ':'ㅜㅣ','ㅣ':'ㅡ','ㅐ':'ㅔ','ㅔ':'ㅐ','ㅑ':'ㅏㅕ','ㅕ':'ㅓㅑ','ㅛ':'ㅗㅠ','ㅠ':'ㅜㅛ','ㅘ':'ㅝ','ㅝ':'ㅘ','ㅚ':'ㅟㅙ','ㅟ':'ㅚ','ㅢ':'ㅡㅣ','ㅙ':'ㅞㅚ','ㅞ':'ㅙ','ㅒ':'ㅖ','ㅖ':'ㅒ'},
 leadSwap:{'ㄱ':'ㅋㄲ','ㅋ':'ㄱ','ㄲ':'ㄱ','ㄷ':'ㅌㄸ','ㅌ':'ㄷ','ㄸ':'ㄷ','ㅂ':'ㅍㅃ','ㅍ':'ㅂ','ㅃ':'ㅂ','ㅈ':'ㅊㅉ','ㅊ':'ㅈ','ㅉ':'ㅈ','ㅅ':'ㅆ','ㅆ':'ㅅ','ㄴ':'ㄹ','ㄹ':'ㄴ','ㅁ':'ㄴ','ㅇ':'ㅎ','ㅎ':'ㅇ'}
});
function jamoSplit(ch){const c=ch.charCodeAt(0)-0xAC00;if(c<0||c>11171)return null;return [Math.floor(c/588),Math.floor(c%588/28),c%28]}
function jamoJoin(l,v,t){return String.fromCharCode(0xAC00+l*588+v*28+t)}
/* every word that differs from `word` by exactly one vowel or one initial consonant, confusable first */
function oneJamoVariants(word){
 const out=[];const chars=[...word];
 chars.forEach((ch,i)=>{const j=jamoSplit(ch);if(!j)return;
  const v=JAMO.V[j[1]],l=JAMO.L[j[0]];
  for(const nv of JAMO.vowelSwap[v]||'')out.push(chars.slice(0,i).join('')+jamoJoin(j[0],JAMO.V.indexOf(nv),j[2])+chars.slice(i+1).join(''));
  for(const nl of JAMO.leadSwap[l]||'')out.push(chars.slice(0,i).join('')+jamoJoin(JAMO.L.indexOf(nl),j[1],j[2])+chars.slice(i+1).join(''));
 });
 return [...new Set(out)].filter(x=>x!==word);
}
/* positions where two same-length Hangul words differ, counted in jamo (null if not comparable) */
function jamoDiffCount(a,b){const A=[...a],B=[...b];if(A.length!==B.length)return null;let n=0;
 for(let i=0;i<A.length;i++){const x=jamoSplit(A[i]),y=jamoSplit(B[i]);if(!x||!y){if(A[i]!==B[i])return null;continue}n+=(x[0]!==y[0])+(x[1]!==y[1])+(x[2]!==y[2])}return n}
const isTagWord=k=>/^[가-힣]{2,5}$/.test(String(k||'').trim());

const ROUNDS={
 letter:{
  id:'letter',icon:'🔤',tag:'MISSING LETTER',title:'빠진 글자',seconds:20,
  rule:'뜻을 보고, 숨은 글자 하나를 톡!',
  level:'PARTIAL_ORTHOGRAPHIC_RECALL',
  usable:w=>/[a-z]/i.test(w.eng)&&w.eng.replace(/[^a-z]/gi,'').length>=3,
  build(target,pool){
   const eng=target.eng;const idx=[];
   for(let i=1;i<eng.length;i++)if(/[a-z]/i.test(eng[i]))idx.push(i);
   const at=idx.length?pick(idx):0;const ch=eng[at].toLowerCase();
   const vowels='aeiou',cons='bcdfghjklmnprstvwy';
   const same=vowels.includes(ch)?vowels:cons;
   const others=new Set(pool.map(w=>w.eng.toLowerCase()));
   const keys=new Set([ch]);
   const tryAdd=c=>{if(keys.size>=3||c===ch)return;const alt=(eng.slice(0,at)+c+eng.slice(at+1)).toLowerCase();if(others.has(alt))return;keys.add(c)};
   for(const c of shuffleArr([...same]))tryAdd(c);
   for(const c of shuffleArr([...'abcdefghijklmnopqrstuvwxyz']))tryAdd(c);
   return {target,at,answer:ch,options:shuffleArr([...keys])};
  },
  render(p){
   const shown=[...p.target.eng].map((c,i)=>i===p.at?'<span class="hs-qs-gap" aria-label="숨은 글자">?</span>':esc(c)).join('');
   return plate('<p class="hs-qs-ask">이 뜻을 가진 단어의 숨은 글자는?</p>'+
    '<p class="hs-qs-meaning">'+esc(p.target.kor)+'</p>'+
    '<p class="hs-qs-word" aria-hidden="true">'+shown+'</p>')+
    '<div class="hs-qs-opts hs-qs-keys">'+p.options.map((o,i)=>'<button type="button" class="hs-qs-key" style="--qs-i:'+i+'" data-qs-pick="'+esc(o)+'"><span>'+esc(o)+'</span></button>').join('')+'</div>';
  },
  judge:(p,v)=>v===p.answer,
  reveal(p,root){root.querySelectorAll('[data-qs-pick]').forEach(b=>b.classList.toggle('is-answer',b.dataset.qsPick===p.answer));const g=root.querySelector('.hs-qs-gap');if(g){g.textContent=p.target.eng[p.at];g.classList.add('is-open')}}
 },
 flash:{
  id:'flash',icon:'🍃',tag:'LEAF FLASH',title:'반짝 숨기',seconds:30,
  rule:'단어 4개가 잎 뒤로 숨어요. 뜻에 맞는 잎을 톡!',
  level:'RECOGNITION_MEANING_TO_WORD',
  usable:w=>!!w.eng,
  build(target,pool){
   const others=shuffleArr(pool.filter(w=>w.id!==target.id&&w.kor!==target.kor)).slice(0,3);
   const cells=shuffleArr([target,...others]);
   return {target,cells,answer:target.id,hidden:false};
  },
  render(p){
   return plate('<p class="hs-qs-ask" data-qs-flash-ask>잘 봐! 곧 잎 뒤로 숨어요</p>'+
    '<p class="hs-qs-meaning is-waiting" data-qs-flash-meaning>· · ·</p>')+
    '<div class="hs-qs-opts hs-qs-leaves" data-qs-leaves>'+p.cells.map((w,i)=>'<button type="button" class="hs-qs-leaf" style="--qs-i:'+i+'" data-qs-pick="'+esc(w.id)+'" disabled><i class="hs-qs-tag" aria-hidden="true">'+'ABCD'[i]+'</i><span class="hs-qs-leaf-word">'+esc(w.eng)+'</span><span class="hs-qs-leaf-cover" aria-hidden="true">'+icon('flash')+'</span></button>').join('')+'</div>';
  },
  mount(p,root,api){
   /* the show time counts toward the 30s: the round length on the card is the real length */
   api.later(()=>{
    p.hidden=true;
    root.querySelector('[data-qs-leaves]')?.classList.add('is-hidden');
    const ask=root.querySelector('[data-qs-flash-ask]');if(ask)ask.textContent='잎 뒤로 숨는 중…';
    api.later(()=>{
     root.querySelectorAll('.hs-qs-leaf').forEach(b=>{b.disabled=false;b.setAttribute('aria-label','잎 '+(1+[...b.parentNode.children].indexOf(b))+'번')});
     if(ask)ask.textContent='이 뜻의 단어는 어느 잎 뒤에 숨었을까?';
     const m=root.querySelector('[data-qs-flash-meaning]');if(m){m.textContent=p.target.kor;m.classList.remove('is-waiting')}
    },CONFIG.coverMs);
   },CONFIG.flashShowMs);
   return null;
  },
  judge:(p,v)=>v===p.answer,
  reveal(p,root){root.querySelector('[data-qs-leaves]')?.classList.remove('is-hidden');root.querySelectorAll('[data-qs-pick]').forEach(b=>b.classList.toggle('is-answer',b.dataset.qsPick===p.answer))}
 },
 pair:{
  id:'pair',icon:'🤝',tag:'MATCH O·X',title:'맞는 짝?',seconds:20,
  rule:'단어와 뜻이 짝이 맞으면 O, 아니면 X를 톡!',
  level:'RECOGNITION_PAIR_VERIFY',
  usable:w=>!!w.eng,
  build(target,pool){
   const truth=Math.random()<.5;
   const decoy=pick(pool.filter(w=>w.id!==target.id&&w.kor!==target.kor));
   const kor=truth||!decoy?target.kor:decoy.kor;
   return {target,kor,answer:(truth||!decoy)?'O':'X'};
  },
  render(p){
   return plate('<p class="hs-qs-ask">이 둘은 맞는 짝일까?</p>'+
    '<div class="hs-qs-pair"><b>'+esc(p.target.eng)+'</b><span class="hs-qs-knot" aria-hidden="true"></span><b>'+esc(p.kor)+'</b></div>')+
    '<div class="hs-qs-opts hs-qs-ox"><button type="button" class="hs-qs-o" data-qs-pick="O" aria-label="맞아요"><span>'+icon('ok')+'</span><small>맞아요</small></button><button type="button" class="hs-qs-x" data-qs-pick="X" aria-label="아니에요"><span>'+icon('no')+'</span><small>아니에요</small></button></div>';
  },
  judge:(p,v)=>v===p.answer,
  reveal(p,root){root.querySelectorAll('[data-qs-pick]').forEach(b=>b.classList.toggle('is-answer',b.dataset.qsPick===p.answer));if(p.answer==='X'){const n=root.querySelector('.hs-qs-pair');if(n&&!n.querySelector('.hs-qs-truth'))n.insertAdjacentHTML('beforeend','<small class="hs-qs-truth">'+esc(p.target.eng)+' = '+esc(p.target.kor)+'</small>')}}
 },
 jamo:{
  id:'jamo',icon:'ㄱ',tag:'ONE JAMO',title:'닮은 글자',seconds:20,
  rule:'뜻 이름표 중 진짜를 톡! 가짜는 딱 한 곳만 달라요.',
  level:'RECOGNITION_KOREAN_MINIMAL_PAIR',
  usable:w=>!!w.eng&&isTagWord(w.kor)&&oneJamoVariants(w.kor.trim()).length>=2,
  build(target,pool){
   const real=target.kor.trim();
   const known=new Set(pool.map(w=>String(w.kor||'').trim()));
   const fakes=[];for(const f of oneJamoVariants(real)){if(fakes.length>=2)break;if(!known.has(f)&&jamoDiffCount(real,f)===1&&!fakes.some(x=>x===f))fakes.push(f)}
   /* keep the variety: one confusable change first, the second picked at random from the rest */
   const rest=oneJamoVariants(real).filter(f=>!known.has(f)&&f!==fakes[0]&&jamoDiffCount(real,f)===1);
   if(rest.length)fakes[1]=pick(rest);
   return {target,answer:real,options:shuffleArr([real,...fakes.filter(Boolean)])};
  },
  render(p){
   return plate('<p class="hs-qs-ask">이 단어의 진짜 뜻 이름표는?</p>'+
    '<p class="hs-qs-word" lang="en">'+esc(p.target.eng)+'</p>')+
    '<div class="hs-qs-opts hs-qs-keys is-tags">'+p.options.map((o,i)=>'<button type="button" class="hs-qs-key" style="--qs-i:'+i+'" data-qs-pick="'+esc(o)+'"><span>'+esc(o)+'</span></button>').join('')+'</div>';
  },
  judge:(p,v)=>v===p.answer,
  reveal(p,root){root.querySelectorAll('[data-qs-pick]').forEach(b=>{b.classList.toggle('is-answer',b.dataset.qsPick===p.answer);
   if(b.dataset.qsPick!==p.answer&&!b.querySelector('mark')){const a=[...p.answer],f=[...b.dataset.qsPick];b.querySelector('span').innerHTML=f.map((c,i)=>c!==a[i]?'<mark>'+esc(c)+'</mark>':esc(c)).join('')}})}
 }
};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pick(a){return a&&a.length?a[Math.floor(Math.random()*a.length)]:null}
function shuffleArr(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
const iso=()=>new Date().toISOString();
const view=()=>document.getElementById('view');
function state(){S.quickSeek=S.quickSeek||{runs:[],best:{}};S.quickSeek.runs=S.quickSeek.runs||[];S.quickSeek.best=S.quickSeek.best||{};return S.quickSeek}
function words(){try{return (validWords()||[]).filter(w=>w&&w.id&&w.eng&&w.kor)}catch{return []}}
function weak(w){try{return weakScore(w)}catch{return 0}}

/* Weak words come first so practice goes where it is needed; stable words still appear. */
function makeQueue(pool,round){
 const usable=pool.filter(round.usable);
 const weakOnes=shuffleArr(usable.filter(w=>weak(w)>0)).sort((a,b)=>weak(b)-weak(a));
 const rest=shuffleArr(usable.filter(w=>weak(w)<=0));
 const base=[...weakOnes,...rest];const q=[];
 while(base.length&&q.length<CONFIG.maxPromptsPerRun){const lap=q.length?shuffleArr(base):base;for(const w of lap){if(q.length>=CONFIG.maxPromptsPerRun)break;if(q.at(-1)?.id!==w.id)q.push(w)}if(base.length<2)break}
 return q;
}

let run=null;let safeWrapped=false;
function wrapSafePoint(){
 if(safeWrapped)return;const orig=globalThis.HideSeekPwaSafePoint;
 if(typeof orig!=='function')return;
 globalThis.HideSeekPwaSafePoint=function(){return !(run&&run.status==='PLAYING')&&orig.apply(this,arguments)};safeWrapped=true;
}
function alive(r){return run===r&&!!document.querySelector('[data-hs-qs-run="'+r.id+'"]')}
function clearTimers(r){if(!r)return;clearInterval(r.tick);r.timeouts.forEach(clearTimeout);r.timeouts=[]}

/* One full-viewport forest scene for every quick-seek screen (same frame as the approved HOME). */
function scene(inner,{title,sub,right='',cls=''}={}){
 return '<section class="hs-qs-scene hs-qs '+cls+'" aria-label="한 판 숨바꼭질">'+
  '<header class="hs-qs-top"><button type="button" class="hs-qs-back" data-qs-back aria-label="뒤로 가기"><span aria-hidden="true">‹</span></button>'+
  '<div class="hs-qs-title"><h2 class="hs-qs-plaque"><span>'+esc(title||COPY.hubTitle)+'</span></h2>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>'+
  '<div class="hs-qs-right">'+right+'</div></header>'+
  '<div class="hs-qs-fireflies" aria-hidden="true">'+'<i></i>'.repeat(9)+'</div>'+
  '<div class="hs-qs-body">'+inner+'</div>'+
  '<p class="hs-qs-say" aria-live="polite"><img alt="" data-qs-guide hidden><span data-qs-say-text></span></p>'+
 '</section>';
}
function plate(inner){return '<div class="hs-qs-plate">'+inner+'</div>'}
/* Line icons (no emoji): one stroke style for every round so the set reads as one family. */
const ICON={
 letter:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 9 6l5 12M6 14h6"/><path d="M16 18h5"/></svg>',
 flash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 11 5 20 5c0 9-5 14-13 14"/><path d="M5 19 14 10"/></svg>',
 pair:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.5"/><circle cx="16" cy="12" r="4.5"/></svg>',
 jamo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h7v5"/><path d="M15 4v16M15 12h5"/><path d="M5 15h6v5H5z"/></svg>',
 photo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 forest:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 6 12h3l-4 6h14l-4-6h3z"/><path d="M12 18v3"/></svg>',
 ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
 no:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};
const icon=id=>ICON[id]||ICON.forest;
/* The guide speaks inside the scene (the partner bar is hidden like on HOME). */
function say(msg,mood){
 try{setPartner(msg,mood)}catch{}
 const t=document.querySelector('[data-qs-say-text]');if(t)t.textContent=msg;
 const img=document.querySelector('[data-qs-guide]'),src=document.getElementById('partnerAvatar')?.getAttribute('src');
 if(img&&src){img.src=src;img.hidden=false}
}
function onBack(fn){const b=view().querySelector('[data-qs-back]');if(b)b.onclick=fn}
function leave(){if(run){abandon(run);run=null}try{if(viewStack.length)goBack();else toForest()}catch{toForest()}}

function openHub(){
 if(run){clearTimers(run);run=null}
 const pool=words();const st=state();
 try{if(!viewStack.length)viewStack.push(()=>render())}catch{}
 if(pool.length<CONFIG.minWords){
  view().innerHTML=scene('<div class="hs-qs-signs">'+
   '<button type="button" class="hs-qs-sign" style="--qs-i:0" data-qs-camera><span class="hs-qs-sign-icon">'+icon('photo')+'</span><span class="hs-qs-sign-copy"><b>PHOTO</b><span>'+esc(COPY.needWordsAction)+'</span><small>'+esc(COPY.needWords(CONFIG.minWords))+'</small></span></button>'+
   '<button type="button" class="hs-qs-sign" style="--qs-i:1" data-qs-forest><span class="hs-qs-sign-icon">'+icon('forest')+'</span><span class="hs-qs-sign-copy"><b>FOREST</b><span>'+esc(COPY.forest)+'</span></span></button></div>',{sub:COPY.hubSub});
  view().querySelector('[data-qs-camera]').onclick=()=>document.getElementById('sheetCameraInput')?.click();
  view().querySelector('[data-qs-forest]').onclick=toForest;
  onBack(leave);say(COPY.needWords(CONFIG.minWords),'think');
  try{updateChrome()}catch{}
  return;
 }
 const signs=Object.values(ROUNDS).map((r,i)=>{
  const best=st.best[r.id];
  return '<button type="button" class="hs-qs-sign hs-qs-medal-btn" style="--qs-i:'+i+'" data-qs-round="'+r.id+'" aria-label="'+esc(r.title+' '+r.seconds+'초. '+r.rule)+'">'+
   '<span class="hs-qs-medal">'+icon(r.id)+'</span>'+
   '<span class="hs-qs-medal-name">'+esc(r.title)+'</span>'+
   '<span class="hs-qs-medal-sec">'+r.seconds+'초'+(best!=null?' · 최고 '+best:'')+'</span></button>';
 }).join('');
 const rules=Object.values(ROUNDS).map(r=>'<li><b>'+esc(r.title)+'</b><span>'+esc(r.rule)+'</span></li>').join('');
 view().innerHTML=scene('<div class="hs-qs-ribbon"><span>숨은 단어를 찾는 '+(['','한','두','세','네','다섯'][Object.keys(ROUNDS).length]||Object.keys(ROUNDS).length)+' 가지 방법</span></div>'+
  '<div class="hs-qs-medals" style="--qs-n:'+Object.keys(ROUNDS).length+'">'+signs+'</div>'+
  '<div class="hs-qs-sheet hs-qs-howto"><p class="hs-qs-pool">이번 학습지 단어 <b>'+pool.length+'</b>개'+(pool.some(w=>weak(w)>0)?' · 다시 찾을 단어부터 숨어요':'')+'</p><ul>'+rules+'</ul></div>',{sub:COPY.hubSub,cls:'is-hub'});
 view().querySelectorAll('[data-qs-round]').forEach(b=>b.onclick=()=>start(b.dataset.qsRound));
 onBack(leave);say(COPY.hubRule+' 어떤 숨바꼭질부터 해볼까?','play');
 try{updateChrome()}catch{}
}

function toForest(){if(run){clearTimers(run);run=null}try{currentTab='home';viewStack=[];render()}catch{}}

function start(roundId){
 const round=ROUNDS[roundId];if(!round)return openHub();
 const pool=words();const queue=makeQueue(pool,round);
 if(queue.length<1||pool.length<CONFIG.minWords)return openHub();
 wrapSafePoint();
 if(run)clearTimers(run);
 const sh=(()=>{try{return sheet()}catch{return null}})();
 run={id:'qs-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),round,pool,queue,i:0,found:[],missed:[],answers:0,
  startedAt:iso(),sheetId:sh?.sheetId||null,remaining:round.seconds*1000,clockOn:false,lastTick:0,status:'PLAYING',timeouts:[],over:false,prompt:null};
 const r=run;
 const clock='<div class="hs-qs-clock" role="progressbar" aria-label="남은 시간" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" style="--qs-p:100%"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/></svg><b data-qs-sec>'+round.seconds+'</b></div>';
 view().innerHTML=scene('<div class="hs-qs-play" data-hs-qs-run="'+r.id+'">'+
   '<div class="hs-qs-hud"><div class="hs-qs-pouch" aria-live="polite"><small>찾은 단어</small><b data-qs-count>0</b></div>'+
   '<div class="hs-qs-segs" aria-hidden="true">'+'<i></i>'.repeat(round.seconds)+'</div></div>'+
   '<div class="hs-qs-stage" data-qs-stage><p class="hs-qs-countdown">'+esc(COPY.ready)+'</p></div>'+
  '</div>',{title:round.title,sub:round.rule,right:clock,cls:'is-play is-'+round.id});
 onBack(()=>{abandon(r);openHub()});
 say(round.rule,'focus');
 try{updateChrome()}catch{}
 r.timeouts.push(setTimeout(()=>{if(!alive(r))return;r.tick=setInterval(()=>onTick(r),100);next(r)},CONFIG.countdownMs));
}

function onTick(r){
 if(!alive(r)){abandon(r);return}
 if(!r.clockOn)return;
 const now=performance.now();r.remaining-=now-r.lastTick;r.lastTick=now;
 const pct=Math.max(0,r.remaining/(r.round.seconds*1000)*100);
 const bar=document.querySelector('.hs-qs-clock');
 if(bar){bar.style.setProperty('--qs-p',pct.toFixed(1)+'%');bar.setAttribute('aria-valuenow',String(Math.round(pct)));const left=Math.max(0,Math.ceil(r.remaining/1000));const sec=bar.querySelector('[data-qs-sec]');if(sec)sec.textContent=String(left);bar.classList.toggle('is-low',pct<25);
  const segs=document.querySelectorAll('.hs-qs-segs i');segs.forEach((g,k)=>g.classList.toggle('is-off',k>=left))}
 if(r.remaining<=0&&!r.over){r.over=true;r.overAt=now;say(COPY.lastOne,'cheer');bar?.classList.add('is-done');const sec=bar?.querySelector('[data-qs-sec]');if(sec)sec.textContent='!'}
 if(r.over&&r.clockOn&&now-r.overAt>CONFIG.idleFinishMs)finish(r);
}
function startClock(r){if(r.over)return;r.clockOn=true;r.lastTick=performance.now()}
function pauseClock(r){if(r.clockOn){r.remaining-=performance.now()-r.lastTick;r.clockOn=false}}

function next(r){
 if(!alive(r))return abandon(r);
 if(r.over||r.i>=r.queue.length)return finish(r);
 const target=r.queue[r.i++];
 const p=r.round.build(target,r.pool);p.shownAt=performance.now();r.prompt=p;
 const stage=document.querySelector('[data-hs-qs-run="'+r.id+'"] [data-qs-stage]');
 stage.innerHTML=r.round.render(p);stage.classList.remove('is-ok','is-miss');
 const api={later:(fn,ms)=>r.timeouts.push(setTimeout(()=>{if(alive(r)&&r.prompt===p){p.shownAt=performance.now();fn()}},ms)),startClock:()=>startClock(r)};
 const m=r.round.mount?r.round.mount(p,stage,api):null;
 if(!m||!m.holdClock)startClock(r);else pauseClock(r);
 let answered=false;
 stage.querySelectorAll('[data-qs-pick]').forEach(b=>b.addEventListener('click',()=>{
  if(answered||b.disabled)return;answered=true;
  stage.querySelectorAll('[data-qs-pick]').forEach(x=>x.disabled=true);
  answer(r,p,b.dataset.qsPick,b,stage);
 }));
}

function answer(r,p,value,btn,stage){
 const ok=!!r.round.judge(p,value);
 const latency=Math.max(0,Math.round(performance.now()-p.shownAt));
 pauseClock(r);
 record(r,p,ok,value,latency);
 r.answers++;if(ok)r.correct=(r.correct||0)+1;
 btn.classList.add(ok?'is-ok':'is-miss');stage.classList.add(ok?'is-ok':'is-miss');
 if(ok){if(!r.found.some(w=>w.id===p.target.id))r.found.push(p.target)}
 else{if(!r.missed.some(w=>w.id===p.target.id))r.missed.push(p.target);r.round.reveal(p,stage)}
 const c=document.querySelector('[data-hs-qs-run="'+r.id+'"] [data-qs-count]');if(c)c.textContent=String(r.found.length);
 if(ok){const pouch=document.querySelector('.hs-qs-pouch');if(pouch){pouch.classList.remove('is-bump');void pouch.offsetWidth;pouch.classList.add('is-bump')}
}
 say(ok?pick(['찾았다! 잘 숨어 있었는데.','좋아, 바로 보였네!','그거야! 다음 단어도 숨어 있어.','눈이 반짝! 하나 더 찾았어.']):'여기 숨어 있었어. 다음에 다시 찾아보자.',ok?'cheer':'think');
 r.timeouts.push(setTimeout(()=>{if(!alive(r))return abandon(r);if(!r.over)startClock(r);next(r)},ok?520:CONFIG.revealMs));
}

/* Evidence: one immutable event per answer. QUICK_SEEK practice, never FINAL SEEK. */
function record(r,p,ok,value,latency){
 const w=p.target;
 const event={eventId:'hsqs-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),at:iso(),mode:'quick-seek',round:r.round.id,
  runId:r.id,wordId:w.id,sheetId:r.sheetId,result:ok?'CORRECT':'WRONG',evidenceLevel:r.round.level,
  scoreAuthority:'QUICK_SEEK_PRACTICE',assisted:false,latencyMs:latency,response:String(value)};
 S.learning.history.push(event);
 if(!ok){
  w.wrong=(w.wrong||0)+1;
  w.learningStats=w.learningStats||{};w.learningStats.quickSeekWrong=(w.learningStats.quickSeekWrong||0)+1;
 }
 try{save()}catch{}
 try{
  window.HideSeekBridge?.emit?.('RETRIEVAL_ATTEMPT_RESULT',{
   word_id:w.id,lexical_id:w.id,instrumentVersion:VERSION,interactionMode:'QUICK_SEEK',round_type:r.round.id,
   evidence_level:r.round.level,event_ref:event.eventId,responseLatencyMs:latency,assisted:false,attemptCount:1,result_type:event.result,
   verification_candidate:{verifier_type:'QUICK_SEEK_CHOICE',verifier_version:VERSION,target_semantics:r.round.level,outcome:ok?1:0,
    reference_id:'hide-word:'+(r.sheetId||'unknown')+':'+w.id+':quick-'+r.round.id,basis:'DETERMINISTIC_LOCAL_MATCH'}
  });
 }catch{}
}

function summarize(r,status){
 const st=state();const prevBest=st.best[r.round.id];
 const summary={runId:r.id,round:r.round.id,startedAt:r.startedAt,endedAt:iso(),status,answers:r.answers,
  found:r.found.map(w=>w.id),missed:r.missed.map(w=>w.id),sheetId:r.sheetId,prevBest:prevBest??null};
 st.runs=[...st.runs,summary].slice(-60);
 if(status==='COMPLETED'&&(prevBest==null||summary.found.length>prevBest))st.best[r.round.id]=summary.found.length;
 try{if(status==='COMPLETED'&&r.answers)markStudy(1);else save()}catch{}
 try{window.HideSeekBridge?.emit?.('QUICK_SEEK_ROUND_RESULT',{run_id:r.id,round_type:r.round.id,instrumentVersion:VERSION,status,answers:r.answers,found_count:summary.found.length,missed_count:summary.missed.length,task_effect:'NONE_PRACTICE_ONLY'})}catch{}
 return summary;
}
function abandon(r){if(!r||r.status!=='PLAYING')return;clearTimers(r);r.status='ABANDONED';if(r.answers)summarize(r,'ABANDONED');if(run===r)run=null}

function finish(r){
 clearTimers(r);r.status='DONE';
 const s=summarize(r,'COMPLETED');run=null;
 const found=r.found,missed=r.missed;
 let line=found.length?(s.prevBest==null?COPY.first:found.length>s.prevBest?COPY.better(found.length-s.prevBest):found.length===s.prevBest?COPY.same:''):COPY.foundNone;
 const chips=found.map((w,i)=>'<li class="hs-qs-chip" style="--qs-d:'+(i*90)+'ms"><b>'+esc(w.eng)+'</b><small>'+esc(w.kor)+'</small></li>').join('');
 const miss=missed.map(w=>'<li><b>'+esc(w.eng)+'</b><span>'+esc(w.kor)+'</span></li>').join('');
 const acc=r.answers?Math.round((r.correct||0)/r.answers*100):0;
 const best=state().best[r.round.id];
 const ringPct=r.answers?Math.round((r.correct||0)/r.answers*100):0;
 view().innerHTML=scene('<div class="hs-qs-end" data-qs-end="'+esc(s.runId)+'">'+
   '<div class="hs-qs-score">'+
    '<div class="hs-qs-ring" style="--qs-p:'+ringPct+'%"><p class="hs-qs-end-count"><b>'+found.length+'</b><small>개 찾았어</small></p></div>'+
    (line?'<p class="hs-qs-end-line">'+esc(line)+'</p>':'')+
    '<dl class="hs-qs-stats"><div><dt>찾은 단어</dt><dd>'+found.length+'</dd></div><div><dt>한 번 놓침</dt><dd>'+missed.length+'</dd></div>'+
    '<div><dt>맞힌 비율</dt><dd>'+acc+'<small>%</small></dd></div><div><dt>내 최고</dt><dd>'+(best??found.length)+'</dd></div></dl></div>'+
   '<div class="hs-qs-end-actions">'+
    '<button type="button" class="hs-qs-cta" data-qs-again>'+esc(COPY.again)+'</button>'+
    '<div class="hs-qs-end-row"><button type="button" class="hs-qs-plank" data-qs-hub>'+esc(COPY.other)+'</button><button type="button" class="hs-qs-plank" data-qs-forest>'+esc(COPY.forest)+'</button></div></div>'+
   '<div class="hs-qs-sheet hs-qs-results">'+
    (found.length?'<h3 class="hs-qs-h">'+esc(COPY.foundTitle)+'</h3><ul class="hs-qs-chips">'+chips+'</ul>':'')+
    (miss?'<h3 class="hs-qs-h">'+esc(COPY.missedTitle)+'</h3><ul class="hs-qs-miss">'+miss+'</ul>':'')+
    '<p class="hs-qs-evidence">'+esc(COPY.evidenceNote)+'</p></div></div>',{title:'숨바꼭질 끝!',sub:r.round.title+' · '+(missed.length?found.length+'개 찾고 '+missed.length+'개는 한 번 놓쳤어':found.length+'개를 한 번도 안 놓쳤어'),cls:'is-end'});
 view().querySelector('[data-qs-again]').onclick=()=>start(r.round.id);
 view().querySelector('[data-qs-hub]').onclick=openHub;
 view().querySelector('[data-qs-forest]').onclick=toForest;
 onBack(openHub);
 say(found.length?'찾은 단어가 하나씩 모였어. '+COPY.again:'괜찮아, 숨은 곳을 봤잖아. '+COPY.again,'cheer');
}

window.HideQuickSeekV1=Object.freeze({
 version:VERSION,config:CONFIG,copy:COPY,
 rounds:()=>Object.keys(ROUNDS),
 open:openHub,start,
 registerRound(def){if(!def||!def.id||ROUNDS[def.id]||typeof def.build!=='function'||typeof def.render!=='function'||typeof def.judge!=='function')return false;ROUNDS[def.id]=Object.assign({icon:'🌿',seconds:20,usable:()=>true,reveal(){}},def);return true},
 activeRun:()=>run?{id:run.id,round:run.round.id,status:run.status}:null,
 jamo:Object.freeze({variants:oneJamoVariants,diff:jamoDiffCount,isTagWord})
});
})();
