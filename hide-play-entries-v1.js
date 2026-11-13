/* Entry points for 한 판 숨바꼭질 and 판정 고치기.
 * The approved HOME composition (four mode signs on the forest art) is not changed:
 * entries are added inside the existing ☰ menu and at the end of the 보물함 (records) page.
 */
(function(){
'use strict';
const qs=()=>window.HideQuickSeekV1,gc=()=>window.HideGradingCorrectionV1;
if(typeof renderHome==='function'){
 const baseHome=renderHome;
 renderHome=function hidePlayEntriesHome(){
  const out=baseHome.apply(this,arguments);
  const addEntries=()=>{try{
   const menu=document.getElementById('hsMenu');
   if(menu&&!menu.querySelector('[data-hs-play]')){
    const anchor=menu.querySelector('[data-hs-menu="words"]');
    const mk=(id,label)=>{const b=document.createElement('button');b.type='button';b.dataset.hsPlay=id;b.textContent=label;return b};
    const quick=mk('quick','⏱️ 한 판 숨바꼭질'),fix=mk('fix','🛠️ 판정 고치기 (보호자)');
    menu.insertBefore(quick,anchor||null);
    const settings=menu.querySelector('[data-hs-menu="settings"]');menu.insertBefore(fix,settings||null);
    const closeMenu=()=>{menu.hidden=true;document.getElementById('hsMenuBtn')?.setAttribute('aria-expanded','false')};
    quick.onclick=()=>{closeMenu();viewStack=[];qs()?.open()};
    fix.onclick=()=>{closeMenu();viewStack=[];gc()?.open()};
   }
  }catch{}};
  if(out&&typeof out.then==='function')return out.then(v=>{addEntries();return v});
  addEntries();return out;
 };
}
if(typeof renderRecords==='function'){
 const baseRecords=renderRecords;
 renderRecords=function hidePlayEntriesRecords(){
  const out=baseRecords.apply(this,arguments);
  try{
   const host=document.querySelector('#view .hs-discovery-log')||document.getElementById('view');
   if(host&&!host.querySelector('.hs-play-entries')){
    host.insertAdjacentHTML('beforeend','<section class="hs-play-entries" aria-label="빠른 놀이와 보호자 도구">'+
     '<button type="button" class="hs-play-entry" data-hs-play-rec="quick"><span aria-hidden="true">⏱️</span><span><b>한 판 숨바꼭질</b><small>학습지 단어로 짧게 한 판</small></span></button>'+
     '<button type="button" class="hs-play-entry is-parent" data-hs-play-rec="fix"><span aria-hidden="true">🛠️</span><span><b>판정 고치기</b><small>보호자 전용 · 원래 기록은 그대로</small></span></button></section>');
    host.querySelector('[data-hs-play-rec="quick"]').onclick=()=>{viewStack=[];qs()?.open()};
    host.querySelector('[data-hs-play-rec="fix"]').onclick=()=>{viewStack=[];gc()?.open()};
   }
  }catch{}
  return out;
 };
}
})();
