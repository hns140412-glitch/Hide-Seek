/* Hide & Seek V2: manual fallback when OCR is unavailable.
 * Distinct USER_MANUAL_ENTRY provenance. Never asserts OCR, Ready review
 * directive, official fact or central memory schedule completion.
 */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const limits={NEW:12,REVIEW:24};
  function parseLines(raw, role) {
    const rows=String(raw||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(rows.length>limits[role])throw new Error(role==='NEW'?'신규 단어는 한 번에 12개까지 입력해 주세요.':'복습 단어는 한 번에 24개까지 입력해 주세요.');
    return rows.map((line,i)=>{
      const sep=line.includes('\t')?'\t':'|';
      const at=line.indexOf(sep);
      const token=at>=0?line.slice(0,at).trim():'';
      const meaning=at>=0?line.slice(at+1).trim():'';
      if(!token||!meaning||token.length>100||meaning.length>240)
        throw new Error((role==='NEW'?'신규':'복습')+' '+(i+1)+'번째 줄은 단어 | 뜻 형식으로 입력해 주세요.');
      return {token,meaning,missionRole:role,languageDomain:'ENGLISH',
        source:{provider:'USER_MANUAL_ENTRY',pageId:'',rowIndex:i,confidence:'manual',warnings:[]}};
    });
  }
  function parseInput(newLines,reviewLines) {
    const rows=[...parseLines(newLines,'NEW'),...parseLines(reviewLines,'REVIEW')];
    if(!rows.length)throw new Error('단어를 한 개 이상 입력해 주세요.');
    const keys=new Set();
    for(const row of rows){
      const key=row.token.toLowerCase()+'::'+row.meaning.replace(/\s+/g,' ').toLowerCase();
      if(keys.has(key))throw new Error('같은 단어와 뜻이 중복됐어요. 필요한 줄만 남겨 주세요.');
      keys.add(key);
    }
    return rows;
  }
  function showMessage(message) {
    const el=$('#eveningManualStatus');if(el){el.textContent=message;el.setAttribute('role','status');}
  }
  function insert() {
    const view=$('#view'),hero=view?.querySelector('.quest-hero');
    if(!hero||!$('#v2Camera')||$('#eveningManualEntry'))return;
    const details=document.createElement('details');details.id='eveningManualEntry';details.className='eveningManualEntry';
    details.innerHTML=
      '<summary>사진 인식 없이 단어 직접 입력</summary>'+
      '<p>신규 12개 + 복습 24개 순서로 적을 수 있어요. 한 줄마다 단어 | 뜻. 입력한 개수만 저장하며, OCR 성공이나 시험 완료로 표시하지 않아요.</p>'+
      '<label>새 단어 · 최대 12개<textarea id="eveningNewWords" rows="4" spellcheck="false" placeholder="apple | 사과&#10;bridge | 다리"></textarea></label>'+
      '<label>복습 단어 · 최대 24개<textarea id="eveningReviewWords" rows="4" spellcheck="false" placeholder="forest | 숲"></textarea></label>'+
      '<button id="eveningSaveWords" type="button" class="btn primary">직접 입력한 단어 저장</button>'+
      '<p id="eveningManualStatus" role="status" aria-live="polite">이 기기에만 저장하는 수동 입력이에요.</p>';
    hero.appendChild(details);
    $('#eveningSaveWords').addEventListener('click',()=>{
      try{
        const store=globalThis.HideV2Store?.snapshot?.();
        if(!store||!globalThis.HideV2Mission?.addMission)throw new Error('학습 저장소를 열 수 없어요.');
        if(store.activeSession)throw new Error('진행 중인 탐험이 있어요. 그 탐험을 마친 뒤 새 단어를 저장해 주세요.');
        const items=parseInput($('#eveningNewWords').value,$('#eveningReviewWords').value);
        const mission=HideV2Mission.addMission({
          title:'직접 입력한 단어 · '+new Date().toLocaleDateString('ko-KR'),
          items,sourceCount:0,
          provenance:{source:'USER_MANUAL_ENTRY',ocrUsed:false,
            parentFactConfirmed:false,centralReviewDirective:false,
            manualEntry:true,enteredAt:new Date().toISOString()}
        });
        showMessage(mission.items.length+'개를 임시 미션으로 저장했어요.');
        globalThis.HideV2Router?.go?.('missions');
      }catch(error){showMessage(error?.message||'단어를 저장하지 못했어요. 다시 확인해 주세요.');}
    });
  }
  function boot() {
    const root=$('#view');if(!root)return;
    const observer=new MutationObserver(insert);
    observer.observe(root,{childList:true,subtree:true});
    insert();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
  window.HideEveningManual=Object.freeze({parseInput,version:'MANUAL_FALLBACK_V1'});
})();
