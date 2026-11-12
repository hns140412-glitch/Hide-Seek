/* Hide & Seek — 판정 고치기 (parent grading correction) v1
 * Mechanic reference: teamgame.kr teardown row 9 (결과 취소·점수 보정 → ADOPT).
 * Rule: a learning record is never overwritten. The original event stays exactly as it was;
 * a parent correction is appended to S.gradingCorrections as its own event that points at the
 * original. The effective verdict is computed (latest correction wins). "원래대로" is another
 * appended event, so the whole trail can be replayed.
 */
(function(){
'use strict';
const VERSION='HIDE_GRADING_CORRECTION_V1';
const GATE_MS=10*60*1000;
const NEGATIVE=new Set(['WRONG','PASS','TIMEOUT','UNSURE','WRONG_ATTEMPT']);
const CORRECTABLE=new Set(['CORRECT','SLOW_CORRECT','WRONG','HINT_USED','PASS','TIMEOUT','UNSURE','WRONG_ATTEMPT']);
const MODE_LABEL={meaning:'뜻 단서',core:'핵심 조각',code:'마지막 찾기',RECALL:'숨은 단어',recall:'숨은 단어','post-completion-recall':'다시 떠올리기','quick-seek':'한 판 숨바꼭질'};
const RESULT_LABEL={CORRECT:'맞음',SLOW_CORRECT:'맞음(천천히)',WRONG:'틀림',WRONG_ATTEMPT:'틀림',HINT_USED:'힌트로 맞음',PASS:'넘김',TIMEOUT:'시간 끝',UNSURE:'모르겠음'};
const REASONS=Object.freeze([
 {id:'INPUT_MISREAD',label:'입력·인식이 잘못됐어요',hint:'음성·손글씨·자판 인식 오류'},
 {id:'ANSWER_ACCEPTABLE',label:'이 답도 맞는 답이에요',hint:'다른 뜻·철자 변형 인정'},
 {id:'MIS_TAP',label:'아이가 잘못 눌렀어요',hint:'알고 있었지만 실수로 터치'},
 {id:'GRADER_WRONG',label:'채점이 틀렸어요',hint:'앱 판정 기준 오류'},
 {id:'ACTUALLY_WRONG',label:'사실은 몰랐어요',hint:'맞음으로 처리됐지만 모름'}
]);
let gateUntil=0;let filter='all';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const iso=()=>new Date().toISOString();
function log(){if(!Array.isArray(S.gradingCorrections))S.gradingCorrections=[];return S.gradingCorrections}
function keyOf(source,e){return e.eventId||[source,e.mode||'code',e.wordId,e.at].join('|')}
function resultOf(e){return e.result||e.type||null}
function wordById(id){for(const sh of S.sheets||[])for(const w of sh.items||[])if(w.id===id)return w;return null}

/* Collect scored judgements only: exposure/link/support events are not grading verdicts. */
function collect(){
 const out=[];
 (S.learning?.history||[]).forEach((e,idx)=>{const r=resultOf(e);if(e&&e.wordId&&e.at&&CORRECTABLE.has(r)&&e.scoreAuthority!=='EXPOSURE_ONLY')out.push({source:'learning',idx,key:keyOf('learning',e),event:e})});
 (S.codeRed?.history||[]).forEach((e,idx)=>{const r=resultOf(e);if(e&&e.wordId&&e.at&&CORRECTABLE.has(r))out.push({source:'codeRed',idx,key:keyOf('codeRed',e),event:{...e,mode:e.mode||'code'}})});
 return out.sort((a,b)=>Date.parse(b.event.at)-Date.parse(a.event.at));
}
function latestFor(key){const list=log().filter(c=>c.targetKey===key);return list.length?list[list.length-1]:null}
function effectiveResult(key,original){const c=latestFor(key);return c?c.correctedResult:original}

/* Read-only view: returns a copy carrying the effective verdict; the stored event is untouched. */
function effective(e){
 if(!e||!e.wordId||!e.at)return e;
 const source=e.type&&!e.result?'codeRed':'learning';
 const key=keyOf(source,e);const c=latestFor(key);if(!c)return e;
 const copy={...e,originalResult:resultOf(e),correctedBy:c.correctionId,correctionReason:c.reason};
 if(source==='codeRed')copy.type=c.correctedResult;else copy.result=c.correctedResult;
 if(c.correctedResult==='CORRECT'){copy.assisted=false;copy.hintLevel=0;copy.wrongAttempts=0}
 return copy;
}

function apply(item,correctedResult,reason,kind){
 const original=resultOf(item.event);
 const before=effectiveResult(item.key,original);
 if(before===correctedResult)return null;
 const w=wordById(item.event.wordId);
 let wrongDelta=0;
 if(w){
  if(NEGATIVE.has(before)&&!NEGATIVE.has(correctedResult)&&(w.wrong||0)>0)wrongDelta=-1;
  else if(!NEGATIVE.has(before)&&NEGATIVE.has(correctedResult))wrongDelta=1;
  if(wrongDelta)w.wrong=Math.max(0,(w.wrong||0)+wrongDelta);
 }
 const prev=latestFor(item.key);
 const c={correctionId:'hsgc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),kind:kind||'GRADING_CORRECTION',
  version:VERSION,at:iso(),actorRole:'PARENT',targetKey:item.key,targetSource:item.source,targetAt:item.event.at,targetMode:item.event.mode||'code',
  wordId:item.event.wordId,originalResult:original,previousEffectiveResult:before,correctedResult,reason,
  supersedes:prev?prev.correctionId:null,counterDelta:{wrong:wrongDelta},appliedToWord:!!w};
 log().push(c);
 try{save()}catch{}
 try{window.HideSeekBridge?.emit?.('GRADING_CORRECTION',{correction_id:c.correctionId,kind:c.kind,actor_role:'PARENT',word_id:c.wordId,
  original_event_ref:c.targetKey,original_event_at:c.targetAt,original_mode:c.targetMode,original_result:original,
  previous_effective_result:before,corrected_result:correctedResult,reason,supersedes:c.supersedes,instrumentVersion:VERSION})}catch{}
 return c;
}

function fmt(at){const d=new Date(at);if(isNaN(d))return '';const p=n=>String(n).padStart(2,'0');return (d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes())}
function pos(r){return r&&!NEGATIVE.has(r)}

function gate(then){
 if(Date.now()<gateUntil)return then();
 const a=3+Math.floor(Math.random()*6),b=6+Math.floor(Math.random()*4);
 const root=document.getElementById('modalRoot');
 root.innerHTML='<div class="modal-back hs-gc-back" data-gc-close><div class="modal hs-gc-modal" role="dialog" aria-modal="true" aria-labelledby="hsGcGateTitle">'+
  '<h3 id="hsGcGateTitle">어른 확인</h3><p class="hs-gc-sub">판정 고치기는 보호자만 할 수 있어요. 아래 계산의 답을 입력해 주세요.</p>'+
  '<label class="hs-gc-q" for="hsGcGateInput">'+a+' × '+b+' = ?</label>'+
  '<input id="hsGcGateInput" class="input" inputmode="numeric" autocomplete="off" aria-describedby="hsGcGateMsg">'+
  '<p id="hsGcGateMsg" class="hs-gc-msg" role="status" aria-live="polite"></p>'+
  '<div class="btn-row"><button type="button" class="btn secondary" data-gc-cancel>닫기</button><button type="button" class="btn primary" data-gc-ok>확인</button></div></div></div>';
 const input=root.querySelector('#hsGcGateInput');input.focus();
 const close=()=>{root.innerHTML=''};
 root.querySelector('[data-gc-cancel]').onclick=close;
 root.querySelector('[data-gc-close]').addEventListener('click',e=>{if(e.target===e.currentTarget)close()});
 const ok=()=>{if(Number(input.value.trim())===a*b){gateUntil=Date.now()+GATE_MS;close();then()}else{root.querySelector('#hsGcGateMsg').textContent='답이 달라요. 다시 확인해 주세요.';input.select()}};
 root.querySelector('[data-gc-ok]').onclick=ok;input.onkeydown=e=>{if(e.key==='Enter')ok()};
}

function open(){gate(renderList)}

function renderList(){
 const items=collect();
 const visible=items.filter(it=>{const now=effectiveResult(it.key,resultOf(it.event));if(filter==='wrong')return !pos(now);if(filter==='fixed')return !!latestFor(it.key);return true}).slice(0,60);
 if(typeof viewStack!=='undefined'&&!viewStack.length){try{viewStack.push(()=>render())}catch{}}
 const rows=visible.map(it=>{
  const e=it.event,w=wordById(e.wordId),orig=resultOf(e),c=latestFor(it.key),now=c?c.correctedResult:orig;
  const reason=c&&REASONS.find(r=>r.id===c.reason);
  return '<li class="hs-gc-item'+(c?' is-fixed':'')+'"><div class="hs-gc-word"><b>'+esc(w?.eng||'(지운 단어)')+'</b><small>'+esc(w?.kor||'')+'</small></div>'+
   '<div class="hs-gc-meta"><span>'+esc(MODE_LABEL[e.mode]||e.mode||'기록')+' · '+esc(fmt(e.at))+'</span>'+
   '<span class="hs-gc-verdict">'+(c?'<s>'+esc(RESULT_LABEL[orig]||orig)+'</s> → ':'')+'<em class="'+(pos(now)?'ok':'no')+'">'+esc(RESULT_LABEL[now]||now)+'</em>'+(c?' <i>보호자 고침</i>':'')+'</span>'+
   (reason?'<span class="hs-gc-reason">'+esc(reason.label)+'</span>':'')+'</div>'+
   '<div class="hs-gc-acts"><button type="button" class="hs-gc-fix" data-gc-fix="'+esc(it.key)+'">고치기</button>'+
   (c&&c.correctedResult!==orig?'<button type="button" class="hs-gc-undo" data-gc-undo="'+esc(it.key)+'">원래대로</button>':'')+'</div></li>';
 }).join('');
 const fixed=items.filter(it=>latestFor(it.key)).length;
 /* Same forest frame as HOME / 한 판 숨바꼭질 (styles in hide-quick-seek-v1.css); a parchment ledger, no white cards. */
 document.getElementById('view').innerHTML='<section class="hs-qs-scene hs-gc-scene hs-gc" aria-label="판정 고치기">'+
  '<header class="hs-qs-top"><button type="button" class="hs-qs-back" data-gc-back aria-label="뒤로 가기"><span aria-hidden="true">‹</span></button>'+
  '<div class="hs-qs-title"><h2>판정 고치기</h2><small>보호자가 채점만 바로잡는 곳</small></div><div class="hs-qs-right"></div></header>'+
  '<div class="hs-qs-body"><div class="hs-gc-ledger"><header class="hs-gc-head"><span class="hs-gc-badge">보호자 전용</span>'+
  '<p class="hs-gc-intro">앱이 잘못 채점한 것만 바로잡아요. 원래 기록은 지우지 않고, 고친 내용이 따로 남아요.</p></header>'+
  '<div class="hs-gc-filters" role="tablist" aria-label="보기">'+[['all','전체 '+items.length],['wrong','틀림·넘김'],['fixed','고친 것 '+fixed]].map(([id,l])=>'<button type="button" role="tab" aria-selected="'+(filter===id)+'" data-gc-filter="'+id+'">'+esc(l)+'</button>').join('')+'</div>'+
  (rows?'<ul class="hs-gc-list">'+rows+'</ul>':'<p class="hs-gc-empty">'+(items.length?'이 보기에 해당하는 기록이 없어요.':'아직 채점된 기록이 없어요. 아이가 탐험을 하면 여기에 쌓여요.')+'</p>')+
  '</div><p class="hs-gc-foot">최근 60개까지 보여요 · 고친 기록 '+log().length+'건 보관 중</p></div></section>';
 const back=document.querySelector('[data-gc-back]');if(back)back.onclick=()=>{try{if(viewStack.length)goBack();else{currentTab='home';render()}}catch{}};
 document.querySelectorAll('[data-gc-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.gcFilter;renderList()});
 document.querySelectorAll('[data-gc-fix]').forEach(b=>b.onclick=()=>openFix(items.find(i=>i.key===b.dataset.gcFix)));
 document.querySelectorAll('[data-gc-undo]').forEach(b=>b.onclick=()=>{const it=items.find(i=>i.key===b.dataset.gcUndo);if(!it)return;const c=apply(it,resultOf(it.event),'PARENT_REVERT','GRADING_CORRECTION_REVERT');if(c)toast('원래 판정으로 돌렸어요. 고친 이력은 남아 있어요.');renderList()});
 try{setPartner('보호자 화면이에요. 고친 판정은 원래 기록 옆에 따로 남아요.','note')}catch{}
 try{updateChrome()}catch{}
}

function openFix(it){
 if(!it)return;
 const e=it.event,w=wordById(e.wordId),orig=resultOf(e),now=effectiveResult(it.key,orig);
 const target=pos(now)?'WRONG':'CORRECT';
 const reasons=REASONS.filter(r=>target==='CORRECT'?r.id!=='ACTUALLY_WRONG':['ACTUALLY_WRONG','MIS_TAP','GRADER_WRONG'].includes(r.id));
 const root=document.getElementById('modalRoot');
 root.innerHTML='<div class="modal-back hs-gc-back" data-gc-close><div class="modal hs-gc-modal" role="dialog" aria-modal="true" aria-labelledby="hsGcFixTitle">'+
  '<h3 id="hsGcFixTitle">판정 고치기</h3>'+
  '<div class="hs-gc-target"><b>'+esc(w?.eng||'')+'</b><span>'+esc(w?.kor||'')+'</span><small>'+esc(MODE_LABEL[e.mode]||e.mode||'')+' · '+esc(fmt(e.at))+(e.response?' · 아이 답: '+esc(e.response):'')+'</small></div>'+
  '<p class="hs-gc-change"><span>지금 판정 <em class="'+(pos(now)?'ok':'no')+'">'+esc(RESULT_LABEL[now]||now)+'</em></span><span aria-hidden="true">→</span><span>고칠 판정 <em class="'+(target==='CORRECT'?'ok':'no')+'">'+(target==='CORRECT'?'맞음':'틀림')+'</em></span></p>'+
  '<fieldset class="hs-gc-reasons"><legend>왜 고치나요?</legend>'+reasons.map((r,i)=>'<label><input type="radio" name="hsGcReason" value="'+r.id+'"'+(i===0?' checked':'')+'><span><b>'+esc(r.label)+'</b><small>'+esc(r.hint)+'</small></span></label>').join('')+'</fieldset>'+
  '<p class="hs-gc-sub">원래 기록은 그대로 두고 고친 기록이 하나 더 생겨요. 언제든 원래대로 돌릴 수 있어요.</p>'+
  '<div class="btn-row"><button type="button" class="btn secondary" data-gc-cancel>취소</button><button type="button" class="btn primary" data-gc-save>'+(target==='CORRECT'?'맞음으로 고치기':'틀림으로 고치기')+'</button></div></div></div>';
 const close=()=>{root.innerHTML=''};
 root.querySelector('[data-gc-cancel]').onclick=close;
 root.querySelector('[data-gc-close]').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)close()});
 root.querySelector('[data-gc-save]').onclick=()=>{
  const reason=root.querySelector('input[name=hsGcReason]:checked')?.value||'GRADER_WRONG';
  const c=apply(it,target,reason);close();
  if(c)toast(target==='CORRECT'?'맞음으로 고쳤어요. 원래 기록도 함께 남아요.':'틀림으로 고쳤어요. 다시 찾을 단어에 들어가요.');
  renderList();
 };
}

window.HideGradingCorrectionV1=Object.freeze({version:VERSION,open,effective,collect,
 corrections:()=>log().slice(),reasons:REASONS,
 _applyForTest:(key,result,reason)=>{const it=collect().find(i=>i.key===key);return it?apply(it,result,reason||'GRADER_WRONG'):null},
 _unlockForTest:()=>{gateUntil=Date.now()+GATE_MS}});
})();
