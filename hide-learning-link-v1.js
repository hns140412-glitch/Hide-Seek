/* Hide & Seek ↔ TAKY Learning Engine link (2026-11-14).
 * Logic owner: TAKY/MASTER/LEARNING_APP_FAMILY_MASTER (one learning history; apps capture/execute,
 * the central Learning Domain interprets). Hide REV_04 §16: vocabulary results isolated from shared
 * Learning History = FAIL.
 * What this adds (nothing else changes):
 *  - one family sign-in per device (TakyFamilySigninV1) from the ☰ menu; later visits restore silently;
 *  - who is learning: one family member chosen once (auto when the family has a single other member);
 *  - standalone scope: when Hide is NOT opened from a Ready session, events carry
 *    child_id = chosen learner, subject ENGLISH, concept vocabulary (Hide's word pairs are English
 *    vocabulary). A Ready session's own context always wins and is never overwritten;
 *  - the existing TakyLearningEvidenceClientV1 then sends queued events to /api/learning/evidence.
 */
(function(){
'use strict';
if(window.HideLearningLinkV1)return;
const VERSION='2026.11.14-hide-learning-link-v1';
const LEARNER_KEY='hide.learningLink.learner.v1';
const SCOPE_TAG='HIDE_STANDALONE_FAMILY_SIGNIN';
const DEFAULT_SCOPE=Object.freeze({subject:'ENGLISH',concept_skill_target:'vocabulary'});
const clean=v=>typeof v==='string'?v.trim():'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let signin=null,session=null;

function readLearners(){try{const x=JSON.parse(localStorage.getItem(LEARNER_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
/* Stored per family as {member, at, only}: `at` = when this learner was chosen, `only` = the family has one child,
 * so nothing can be mixed. (Older builds stored a bare member id.) */
function learnerRow(familyId){const v=readLearners()[familyId];if(typeof v==='string')return {member:clean(v),at:0,only:false};return v&&typeof v==='object'?{member:clean(v.member),at:Number(v.at)||0,only:v.only===true}:{member:'',at:0,only:false}}
function learnerFor(familyId){return learnerRow(familyId).member}
function setLearner(familyId,memberId,{only=false}={}){const all=readLearners();const cur=learnerRow(familyId);
 all[familyId]=cur.member===memberId&&cur.only===only?{member:memberId,at:cur.at,only}:{member:memberId,at:Date.now(),only};
 try{localStorage.setItem(LEARNER_KEY,JSON.stringify(all))}catch{}}

/* Ready-launched sessions carry their own scope in the URL/context; never touch those. */
function readyOwned(ctx){return !!(ctx&&(ctx.session_id||ctx.task_id||ctx.lap_id))}
function applyScope(memberId){
 try{
  const ctx=S.sharedLearningContext||{};
  if(readyOwned(ctx)&&ctx.scope_source!==SCOPE_TAG)return 'READY_SCOPE_KEPT';
  S.sharedLearningContext={...ctx,child_id:memberId,
   subject:ctx.scope_source===SCOPE_TAG||!ctx.subject?DEFAULT_SCOPE.subject:ctx.subject,
   concept_skill_target:ctx.scope_source===SCOPE_TAG||!ctx.concept_skill_target?DEFAULT_SCOPE.concept_skill_target:ctx.concept_skill_target,
   scope_source:SCOPE_TAG};
  save();
  return 'STANDALONE_SCOPE_SET';
 }catch{return 'SCOPE_UNAVAILABLE'}
}
function clearScope(){
 try{
  const ctx=S.sharedLearningContext||{};
  if(ctx.scope_source!==SCOPE_TAG)return;
  const {child_id,subject,concept_skill_target,scope_source,...rest}=ctx;
  S.sharedLearningContext=rest;save();
 }catch{}
}
function client(){return window.TakyLearningEvidenceClientV1}
/* Hide events recorded on this device before sign-in were queued without a learner. Give ONLY those
 * standalone Hide rows (no Ready session id in the event) the chosen learner and Hide's vocabulary
 * scope; rows that already carry a scope are left exactly as they are.
 * No mixing between children (Taky 2026-11-14 "사용자에 따라 데이터 혼용은 안생길까?"): when the family has
 * more than one child, a row is given the learner only if it was recorded AFTER that learner was chosen;
 * earlier unnamed rows stay on this device unsent rather than be credited to the wrong child. */
const QUEUE_KEY='taky_learning_evidence_pending_v1';
function fillQueuedScope(memberId,{since=0,only=false}={}){
 if(!memberId)return 0;
 let q;try{q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch{return 0}
 if(!Array.isArray(q))return 0;
 let n=0;
 for(const row of q){
  if(row?.app!=='hide-seek'||!row.scope_hint)continue;
  const e=row.event||{};
  if(e.session_id||e.task_id||e.lap_id)continue;
  const h=row.scope_hint;
  if(clean(h.member_id))continue;
  if(!only&&!(Date.parse(row.enqueued_at||'')>=since))continue;
  row.scope_hint={...h,member_id:memberId,subject:clean(h.subject)||DEFAULT_SCOPE.subject,
   concept_skill_target:clean(h.concept_skill_target)||DEFAULT_SCOPE.concept_skill_target};
  n++;
 }
 if(n)try{localStorage.setItem(QUEUE_KEY,JSON.stringify(q))}catch{return 0}
 return n;
}
async function sendNow(){
 const c=client();if(!c)return null;
 try{c.scan({allowAmbientScope:true})}catch{}
 try{if(session){const l=learnerRow(session.family_id);fillQueuedScope(l.member,{since:l.at,only:l.only})}}catch{}
 try{return await c.flush()}catch{return null}
}

/* ---------- panel ---------- */
function ensurePanel(){
 let el=document.getElementById('hsLearnLink');if(el)return el;
 el=document.createElement('section');el.id='hsLearnLink';el.className='hs-ll';el.hidden=true;
 el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','hsLlTitle');
 el.innerHTML='<div class="hs-ll-sheet">'+
  '<header class="hs-ll-head"><h2 id="hsLlTitle">가족 학습 연결</h2><button type="button" class="hs-ll-x" data-ll-close aria-label="닫기">닫기</button></header>'+
  '<p class="hs-ll-lead">찾은 단어 기록을 가족 학습 기록으로 보내요. 이 기기에서 한 번만 로그인하면 돼요.</p>'+
  '<div id="familyLogin" class="hs-ll-login"><button id="familySignInBtn" class="hs-ll-btn" type="button" disabled>Google로 가족 로그인</button>'+
  '<div id="familyGoogleTarget"></div><div id="familyChooseTarget" class="hs-ll-choices"></div>'+
  '<p id="familyLoginStatus" class="hs-ll-status" role="status">로그인하지 않음</p>'+
  '<button id="familySignOutBtn" class="hs-ll-ghost" type="button" hidden>이 기기에서 로그아웃</button></div>'+
  '<div class="hs-ll-learner" data-ll-learner hidden><h3>누가 공부하나요?</h3><div class="hs-ll-choices" data-ll-members></div></div>'+
  '<p class="hs-ll-sync" data-ll-sync aria-live="polite"></p>'+
 '</div>';
 document.body.appendChild(el);
 el.querySelector('[data-ll-close]').onclick=close;
 el.addEventListener('click',e=>{if(e.target===el)close()});
 return el;
}
function open(){const el=ensurePanel();el.hidden=false;document.documentElement.classList.add('hs-ll-open');renderLearner();renderSync();if(signin&&!session)signin.restore?.()}
function close(){const el=document.getElementById('hsLearnLink');if(el)el.hidden=true;document.documentElement.classList.remove('hs-ll-open')}

function renderLearner(){
 const box=document.querySelector('[data-ll-learner]');if(!box)return;
 if(!session){box.hidden=true;return}
 const members=(session.authorized_member_ids||[]).slice();
 const chosen=learnerFor(session.family_id);
 box.hidden=false;
 const list=box.querySelector('[data-ll-members]');
 let k=0;
 list.innerHTML=members.map(m=>'<button type="button" class="hs-ll-btn'+(m===chosen?' is-on':'')+'" data-ll-member="'+esc(m)+'" aria-pressed="'+(m===chosen)+'">'+
  (m===session.self_member_id?'로그인한 나':'가족 구성원 '+(++k))+'</button>').join('');
 list.querySelectorAll('[data-ll-member]').forEach(b=>b.onclick=()=>choose(b.dataset.llMember));
}
function renderSync(text){
 const p=document.querySelector('[data-ll-sync]');if(!p)return;
 if(text){p.textContent=text;return}
 const c=client();if(!c){p.textContent='';return}
 const pending=(()=>{try{return c.pending().length}catch{return 0}})(),acked=(()=>{try{return c.acked().length}catch{return 0}})();
 p.textContent=session?(learnerFor(session.family_id)?'보낸 기록 '+acked+'개 · 보낼 기록 '+pending+'개':'누가 공부하는지 골라 주세요.'):'';
}
async function choose(memberId){
 if(!session||!(session.authorized_member_ids||[]).includes(memberId))return;
 {const others=(session.authorized_member_ids||[]).filter(m=>m!==session.self_member_id);setLearner(session.family_id,memberId,{only:others.length===1&&memberId===others[0]})}
 applyScope(memberId);
 renderLearner();renderSync('기록 보내는 중…');
 const r=await sendNow();
 renderSync(r&&(r.ok||r.reason==='FLUSH_IN_PROGRESS')?null:'지금은 보내지 못했어요. 다음에 앱을 열면 다시 보내요.');setTimeout(()=>renderSync(),1500);
}

async function onBound(){
 try{session=await window.TAKY_FAMILY_RUNTIME.currentSession()}catch{session=null}
 if(!session)return;
 const ctx=(()=>{try{return S.sharedLearningContext||{}}catch{return {}}})();
 let learner=learnerFor(session.family_id);
 const fromUrl=clean(ctx.scope_source===SCOPE_TAG?'':ctx.child_id);
 if(readyOwned(ctx)&&ctx.scope_source!==SCOPE_TAG){renderLearner();renderSync();void sendNow();return}
 const members=session.authorized_member_ids||[];
 const others=members.filter(m=>m!==session.self_member_id);
 const only=others.length===1;
 // A child named in the link (Ready / family hub) always wins over the one remembered on this device.
 if(fromUrl&&members.includes(fromUrl))learner=fromUrl;
 else if(learner&&!members.includes(learner))learner='';
 if(!learner&&only)learner=others[0];
 if(learner){setLearner(session.family_id,learner,{only:only&&learner===others[0]});applyScope(learner);void sendNow().then(()=>{renderSync();setTimeout(()=>renderSync(),1500)})}
 renderLearner();renderSync();
}
function onCleared(){session=null;clearScope();renderLearner();renderSync()}

/* ---------- menu entry (approved HOME composition unchanged) ---------- */
function addMenuEntry(){
 const menu=document.getElementById('hsMenu');
 if(!menu||menu.querySelector('[data-hs-learn-link]'))return;
 const b=document.createElement('button');b.type='button';b.dataset.hsLearnLink='1';b.textContent='🔗 가족 학습 연결';
 const settings=menu.querySelector('[data-hs-menu="settings"]');menu.insertBefore(b,settings||null);
 b.onclick=()=>{menu.hidden=true;document.getElementById('hsMenuBtn')?.setAttribute('aria-expanded','false');open()};
}
if(typeof renderHome==='function'){
 const base=renderHome;
 renderHome=function hideLearningLinkHome(){
  const out=base.apply(this,arguments);
  if(out&&typeof out.then==='function')return out.then(v=>{try{addMenuEntry()}catch{}return v});
  try{addMenuEntry()}catch{}return out;
 };
}

function boot(){
 ensurePanel();
 const F=window.TakyFamilySigninV1;
 if(!F){renderSync('로그인 모듈을 불러오지 못했어요.');return}
 signin=F.createFamilySignin({viaCentral:true});
 window.addEventListener('taky-central-auth-ready',()=>void onBound());
 window.addEventListener('taky-central-auth-cleared',onCleared);
 signin.mount();
 try{addMenuEntry()}catch{}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.HideLearningLinkV1=Object.freeze({version:VERSION,open,close,status:()=>({bound:!!session,family_id:session?.family_id||null,learner:session?learnerFor(session.family_id)||null:null}),
 _test:{applyScope,clearScope,readyOwned,fillQueuedScope,SCOPE_TAG}});
})();
