(() => {
'use strict';
if(window.HideLiteracyAdapterV1)return;
const VERSION='2026.10.07-hide-literacy-adapter-v1';
let activeIntent=null;
const clone=v=>JSON.parse(JSON.stringify(v));
// Central literacy terms are source data, not trusted HTML.
const escapeText=v=>String(v??'').replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[ch]);
function currentIntent(){
  try{return window.HideTermDecoderV1?.snapshot?.()?.engineProjection?.literacy_intent||activeIntent}catch{return activeIntent}
}
function recommendedModes(intent=currentIntent()){
  const t=intent?.consumers?.hide_seek?.targets?.[0];
  return Array.isArray(t?.mode_bias)?t.mode_bias:[];
}
function metadataForWord(word){
  const w=String(word??'').trim();
  try{
    const card=(window.HideTermDecoderV1?.snapshot?.()?.cards||[]).find(x=>String(x?.term||'').trim()===w);
    return card?.academicVocabulary||null;
  }catch{return null}
}
function unitTargets(intent=currentIntent()){
  const rows=intent?.consumers?.hide_seek?.academic_vocabulary_targets;
  return Array.isArray(rows)?rows:[];
}
function ensureUnitTargets(){
  const rows=unitTargets().slice(0,8);
  let panel=document.querySelector('#hideAcademicVocabUnitTargets');
  if(!rows.length){panel?.remove();return;}
  const host=document.querySelector('.term-decoder-shell');
  if(!host)return;
  if(!panel){
    panel=document.createElement('section');
    panel.id='hideAcademicVocabUnitTargets';
    panel.style.cssText='margin:14px 0;padding:14px;border-radius:18px;background:rgba(255,255,255,.82);box-shadow:0 6px 18px rgba(0,0,0,.07)';
    host.appendChild(panel);
  }
  // This adapter observes childList for the entire document. An unconditional
  // panel.innerHTML write recursively triggers this observer on every callback
  // when live literacy_intent has targets. Only write for a genuine revision.
  const revision=JSON.stringify(rows.map(x=>[String(x.term||''),String(x.academic_role||'')]));
  if(panel.dataset.literacyContentKey===revision)return;
  panel.dataset.literacyContentKey=revision;
  panel.innerHTML='<b style="display:block;margin-bottom:8px">이 단원에서 쓰는 생각말</b><div style="display:flex;gap:7px;flex-wrap:wrap">'+
    rows.map(x=>'<span style="padding:7px 10px;border-radius:999px;background:#fff7dd;font-weight:800">'+
      escapeText(x.term||'')+' · '+(x.academic_role==='PRIMARY'?'5~6학년 중심':x.academic_role==='FOUNDATION'?'기초':'단원 맥락')+
    '</span>').join('')+
    '</div><small style="display:block;margin-top:8px;opacity:.66">단원 원문에서 확인된 말만 표시해요. 뜻·한자는 확인된 자료가 있을 때만 학습 카드로 사용해요.</small>';
}
function decorate(){
  const modes=new Set(recommendedModes());
  document.querySelectorAll('[data-term-mode]').forEach(b=>{
    const on=modes.has(b.dataset.termMode);
    b.dataset.literacyRecommended=on?'1':'0';
    b.style.outline=on?'3px solid rgba(255,167,38,.45)':'';
    if(on&&!b.querySelector('.literacy-rec')){
      const s=document.createElement('small');
      s.className='literacy-rec';
      s.textContent=' · 추천';
      b.querySelector('b')?.appendChild(s);
    }
    if(!on)b.querySelector('.literacy-rec')?.remove();
  });
  if(modes.size)document.documentElement.dataset.hideLiteracyModes=[...modes].join(',');
  ensureUnitTargets();
}
function enrich(event){
  if(!event||event.app!=='hide-seek')return event;
  const intent=currentIntent(); if(!intent)return event;
  event.payload=event.payload||{};
  event.payload.literacy_context={
    framework:'CNE_LITERACY',
    recommended_modes:recommendedModes(intent),
    academic_vocab_source:intent.source_signals?.academic_vocabulary?.source_ref||null,
    reading_material_ondok:intent.source_signals?.reading_material?.ondok_index??null,
    reading_difficulty_state:intent.source_signals?.reading_material?.difficulty_state||'UNKNOWN'
  };
  return event;
}
window.addEventListener('hide-learning-term-projection-ready',()=>{activeIntent=currentIntent();setTimeout(decorate,0)});
window.addEventListener('taky-learning-event',e=>{if(e?.detail)enrich(e.detail)},true);
new MutationObserver(()=>decorate()).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{activeIntent=currentIntent();decorate()},200);
window.HideLiteracyAdapterV1=Object.freeze({version:VERSION,currentIntent,recommendedModes,unitTargets,metadataForWord,decorate,enrich,snapshot:()=>clone(currentIntent())});
})();