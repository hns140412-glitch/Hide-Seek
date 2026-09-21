(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const view=()=>$('#view');
  let flash='';

  function mission(){return HideV2Mission.activeMission()}
  function setFlash(x){flash=x;setTimeout(()=>{flash='';render()},1200)}

  function home(){
    const s=HideV2Store.snapshot(),m=mission();
    const resumable=globalThis.HideV2Session?.isResumable?.()===true;
    view().innerHTML=`<section class="world-hero"><div class="hero-case"><div class="hero-kicker"><span>HIDE V2</span><span>REWRITE</span></div><h1>${m?esc(m.title):'새 단어 탐험을 시작해요'}</h1><p>${m?`${m.items.length}개 단어 · 구조 분리형 런타임`:'프린트 사진을 분석하거나 테스트 미션을 만들어 학습 흐름을 확인할 수 있어요.'}</p><div class="hero-actions"><button class="btn primary" id="v2Capture">프린트 분석</button>${m?`<button class="btn secondary" id="v2Start">${resumable?'학습 이어하기':'학습 시작'}</button>`:''}</div></div></section><section class="card"><div class="section-title"><h2>V2 상태</h2><span>monolith-free</span></div><div class="metric"><span>미션</span><b>${s.missions.length}</b></div><div class="metric"><span>저장</span><b>Local-first</b></div><div class="metric"><span>Domain</span><b>EN/KR/HANJA</b></div></section>`;
    $('#v2Capture').onclick=()=>$('#sheetLibraryInput').click();
    if($('#v2Start'))$('#v2Start').onclick=()=>{
      const existing=globalThis.HideV2Session?.ensureActiveMission?.();
      if(!existing){const active=mission();HideV2Session.start(active,{targetItemIds:globalThis.HideV2ReadyBridge?.targetItemIds?.(active)||null})}
      HideV2Router.go('learn')
    };
  }

  function review(rows){
    const normalized=rows.map((r,i)=>HideV2Mission.normalizeItem(r,i)).filter(Boolean);
    view().innerHTML=`<section class="card"><div class="hero-kicker"><span>OCR REVIEW</span><span>V2</span></div><h2>분석 결과 확인</h2><div class="weak-list">${normalized.map((w,i)=>`<div class="weak-item"><div><b>${esc(w.token)}</b><small> · ${esc(w.meaning)}</small></div><span class="badge">${esc(w.languageDomain)}</span></div>`).join('')}</div><button class="btn primary full" id="v2Commit" type="button">미션으로 저장</button></section>`;
    $('#v2Commit').onclick=()=>{HideV2Mission.addMission({items:normalized,sourceCount:1,provenance:{source:'V2_OCR_REVIEW'}});HideV2Router.go('home')};
  }

  function learn(){
    let pair=globalThis.HideV2Session?.ensureActiveMission?.();
    if(!pair){
      const active=mission();if(!active){HideV2Router.go('home');return}
      HideV2Session.start(active,{targetItemIds:globalThis.HideV2ReadyBridge?.targetItemIds?.(active)||null});
      pair=HideV2Session.current();
    }
    const {session,mission:m}=pair;
    if(session.stage==='COMPLETE'){complete();return}
    const w=HideV2Learning.current(session,m);const idx=session.index+1,total=session.queue?.length||m.items.length;
    if(session.stage==='FIRST_FIND'){
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">FIRST FIND</span><b>${idx}/${total}</b></div><section class="card word-card"><p>뜻을 보고 단어를 기억에서 꺼내보세요.</p><div class="bigword">${esc(w.meaning)}</div><input id="v2Answer" class="input" aria-label="회상 답 입력"><button id="v2Check" class="btn primary full">기억 확인</button></section></section>`;
      $('#v2Check').onclick=()=>{const r=HideV2Learning.checkFirstFind(session,m,$('#v2Answer').value);HideV2Session.update(r.session);setFlash(r.ok?'기억에서 찾았어요':'다시 연결해볼게요');render()};
    }else if(session.stage==='MEANING'){
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">MEANING</span><b>${idx}/${total}</b></div><section class="card word-card"><div class="bigword">${esc(w.token)}</div><input id="v2Meaning" class="input" aria-label="뜻 회상 입력"><button id="v2MeaningCheck" class="btn primary full">뜻 확인</button></section></section>`;
      $('#v2MeaningCheck').onclick=()=>{const r=HideV2Learning.checkMeaning(session,m,$('#v2Meaning').value);HideV2Session.update(r.session);render()};
    }else{
      if(w.languageDomain==='KOREAN'){
        view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">RESPONSE TRAIL</span></div><section class="card"><h2>내 문장으로 표현하기</h2><p>“${esc(w.token)}”을 넣어 짧은 문장을 만들어보세요.</p><textarea id="v2Response" class="input" rows="3"></textarea><button id="v2DomainDone" class="btn primary full">표현 남기기</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{responseText:$('#v2Response').value}).session);render()};
      }else if(w.languageDomain==='HANJA'&&w.soundEvidence){
        view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">SOUND FIND</span></div><section class="card"><div class="bigword">${esc(w.token)}</div><input id="v2Sound" class="input" aria-label="한자 음 입력"><button id="v2DomainDone" class="btn primary full">음 기억 확인</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{sound:$('#v2Sound').value}).session);render()};
      }else{
        view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">CONNECTION</span></div><section class="card">${globalThis.HideLanguageModel?.renderMeaningMapHtml?.({eng:w.token,word:w.token,languageDomain:w.languageDomain,meaningMap:w.meaningMap},esc)||`<p>${esc(w.example||w.meaning)}</p>`}<button id="v2DomainDone" class="btn primary full">다음</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{}).session);render()};
      }
    }
  }

  function complete(){
    const m=mission(),summary=HideV2Memory.missionSummary(m);
    HideV2Mission.updateMission(m.id,x=>{x.status='COMPLETED';x.memorySummary=summary});
    const readyContext=globalThis.HideV2ReadyBridge?.context?.()||{};
    const returnButton=readyContext.return_target?'<button id="v2ReturnReady" class="btn primary full" style="margin-top:8px">Ready & Set으로 돌아가기</button>':'';
    view().innerHTML=`<section class="card tint-leaf" style="text-align:center"><h1>탐험 완료</h1><p>학습 결과는 기억 증거로 저장됐고, 복습 필요 신호만 Ready Learning Engine에 넘길 수 있어요.</p><div class="metric"><span>복습 후보</span><b>${summary.reviewAdvisories.length}</b></div><button id="v2Home" class="btn secondary full">홈으로</button>${returnButton}</section>`;
    globalThis.HideV2ReadyBridge?.emitTaskEvent?.('TASK_COMPLETED');
    $('#v2Home').onclick=()=>{HideV2Session.clear();HideV2Router.go('home')};
    if($('#v2ReturnReady'))$('#v2ReturnReady').onclick=()=>globalThis.HideV2ReadyBridge?.returnToReady?.();
  }

  async function onFiles(files){
    view().innerHTML='<section class="card"><h2>프린트 분석 중</h2><p>원본을 기준으로 단어와 뜻을 추출하고 있어요.</p></section>';
    const r=await HideV2Capture.analyzeFiles(files);
    if(!r.ok){view().innerHTML=`<section class="card"><h2>분석하지 못했어요</h2><p>${esc(r.reason)}</p><button id="v2Back" class="btn secondary full">돌아가기</button></section>`;$('#v2Back').onclick=()=>HideV2Router.go('home');return}
    review(r.rows);
  }

  function render(){
    if(flash){const t=$('#toast');if(t){t.textContent=flash;t.classList.add('show')}}
    const r=HideV2Router.current();
    if(r.name==='learn')learn();else home();
  }
  function boot(){
    globalThis.HideV2LegacyMigration?.migrateIfNeeded?.();
    $('#settingsBtn').hidden=true;$('#backBtn').hidden=true;$('#partnerBar').hidden=true;$('#bottomNav').hidden=true;
    $('#sheetLibraryInput').addEventListener('change',e=>{const files=[...e.target.files];e.target.value='';if(files.length)onFiles(files)});
    HideV2Router.subscribe(render);HideV2Store.subscribe(()=>{});render();
    window.HideV2App=Object.freeze({render,review,onFiles,start:()=>{const m=mission();HideV2Session.start(m,{targetItemIds:globalThis.HideV2ReadyBridge?.targetItemIds?.(m)||null});HideV2Router.go('learn')}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();