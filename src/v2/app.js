(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const childStageLabel=stage=>({
    MEMORIZE:'단어 만나기',
    FIRST_FIND:'첫 찾기',
    MEANING:'뜻 단서',
    DOMAIN_EXTENSION:'연결 길',
    FINAL_SEEK:'마지막 찾기',
    SEEK_AGAIN_RELEARN:'다시 만나기',
    SEEK_AGAIN:'다시 찾기',
    COMPLETE:'탐험 완료'
  })[stage]||'단어 탐험';
  const childEvidenceLabel=e=>({
    MEMORIZE:'단어 만나기',
    FIRST_FIND:'첫 찾기',
    MEANING:'뜻 단서',
    RESPONSE_TRAIL:'표현 길',
    SOUND_FIND:'소리 찾기',
    CONNECTION:'연결 길',
    FINAL_SEEK:'마지막 찾기',
    SEEK_AGAIN_RELEARN:'다시 만나기',
    SEEK_AGAIN:'다시 찾기',
    THINKING_TRAIL:'생각 길'
  })[e]||'기억 흔적';
  const view=()=>$('#view');
  let flash='';

  function mission(){return HideV2Mission.activeMission()}
  function setFlash(x){flash=x;setTimeout(()=>{flash='';render()},1200)}

  function bindThinkingTrail(missionId,w){
    const card=$('.thinking-map-card');if(!card)return;
    const submit=$('.inference-submit',card),reveal=$('.thinking-reveal',card);
    if(submit){
      submit.onclick=()=>{
        const prediction=$('.inference-prediction',card)?.value.trim()||'';
        const clue=$('.inference-clue',card)?.value||'OTHER';
        const confidence=$('.inference-confidence',card)?.value||'MEDIUM';
        if(!prediction){setFlash('정답 보기 전에 한 번 추측해보세요.');return}
        HideV2Memory.record(missionId,w.id,{
          stage:'THINKING_TRAIL',
          evidenceMode:'INFERENCE_SELF_REPORT',
          axes:['MEANING','CONTEXT'],
          result:'SUBMITTED',
          objectiveVerified:false,
          objectiveRecall:false,
          recallScoreImpact:false,
          assisted:false,
          prediction,clue,confidence
        });
        submit.disabled=true;
        if(reveal)reveal.disabled=false;
      };
    }
    if(reveal){
      reveal.onclick=()=>{
        const body=$('.thinking-reveal-body',card);if(body)body.hidden=false;
        reveal.disabled=true;
      };
    }
    const rootNext=$('.root-step-next',card);
    if(rootNext)rootNext.onclick=()=>{
      const hidden=[...card.querySelectorAll('[data-root-step][hidden]')];
      if(hidden.length)hidden[0].hidden=false;
      if(hidden.length<=1)rootNext.hidden=true;
    };
    const sceneNext=$('.scene-step-next',card);
    if(sceneNext)sceneNext.onclick=()=>{
      const hidden=[...card.querySelectorAll('[data-scene-step][hidden]')];
      if(hidden.length){
        const step=hidden[0].dataset.sceneStep;
        const link=card.querySelector(`[data-scene-link-step="${step}"]`);
        if(link)link.hidden=false;
        hidden[0].hidden=false;
      }
      if(hidden.length<=1)sceneNext.hidden=true;
    };
  }

  function home(){
    const s=HideV2Store.snapshot(),m=mission();
    const resumable=globalThis.HideV2Session?.isResumable?.()===true;
    const capture=globalThis.HideV2Capture?.state?.();
    const reviewReady=globalThis.HideV2Capture?.hasResumableReview?.()===true;
    view().innerHTML=`<section class="world-hero"><div class="hero-case"><div class="hero-kicker"><span>HIDE & SEEK</span><span>숨은 단어 탐험</span></div><h1>${m?esc(m.title):'새 단어 탐험을 시작해요'}</h1><p>${m?`${m.items.length}개의 숨은 단어가 기다리고 있어요.`:'프린트 사진을 보고 오늘의 숨은 단어를 찾아봐요.'}</p><div class="hero-actions"><button class="btn primary" id="v2Camera">카메라 촬영</button><button class="btn secondary" id="v2Library">사진 추가</button>${m?`<button class="btn secondary" id="v2Start">${resumable?'학습 이어하기':'학습 시작'}</button>`:''}</div></div></section><section class="card" style="display:grid;gap:8px"><button class="btn secondary full" id="v2MissionList">미션 관리</button><button class="btn secondary full" id="v2Records">기억 기록</button></section>${reviewReady?`<section class="card tint-sky"><div class="section-title"><h2>분석 결과가 남아 있어요</h2><span>${capture?.lastRows?.length||0}개</span></div><p>앱을 다시 열어도 검토 중인 OCR 결과를 이어갈 수 있어요.</p><button class="btn primary full" id="v2ResumeReview">분석 결과 이어보기</button></section>`:''}<section class="card"><div class="section-title"><h2>탐험 준비</h2><span>${m?'READY':'NEW'}</span></div><div class="metric"><span>탐험 미션</span><b>${s.missions.filter(x=>x.status!=='ARCHIVED').length}</b></div><div class="metric"><span>사진 확인</span><b>${capture?.status==='REVIEW'?'검토 필요':capture?.status==='CAPTURING'?'분석 중':'준비됨'}</b></div><div class="metric"><span>기억 기록</span><b>${HideV2Memory.dashboard().total}단어</b></div></section>`;
    $('#v2Camera').onclick=()=>$('#sheetCameraInput').click();
    $('#v2MissionList').onclick=()=>HideV2Router.go('missions');
    $('#v2Records').onclick=()=>HideV2Router.go('records');
    $('#v2Library').onclick=()=>$('#sheetLibraryInput').click();
    if($('#v2ResumeReview'))$('#v2ResumeReview').onclick=()=>review(HideV2Capture.reviewRows());
    if($('#v2Start'))$('#v2Start').onclick=()=>{
      const existing=globalThis.HideV2Session?.ensureActiveMission?.();
      if(!existing){const active=mission();HideV2Session.start(active,{targetItemIds:globalThis.HideV2ReadyBridge?.targetItemIds?.(active)||null})}
      HideV2Router.go('learn')
    };
  }

  function review(rows){
    const normalized=rows.map((r,i)=>HideV2Mission.normalizeItem(r,i)).filter(Boolean);
    const draft=normalized.map(x=>({...x,excluded:false}));
    const renderRows=()=>{
      view().innerHTML=`<section class="card"><div class="hero-kicker"><span>사진 확인</span><span>단어 탐험 준비</span></div><h2>분석 결과 확인</h2><p>틀린 단어/뜻은 고치고, 필요 없는 행은 제외한 뒤 저장하세요.</p><div class="weak-list">${draft.map((w,i)=>`<div class="weak-item" data-review-row="${i}"><div style="display:grid;gap:6px;flex:1"><input class="input" data-review-token="${i}" aria-label="OCR 단어 ${i+1}" value="${esc(w.token)}"><input class="input" data-review-meaning="${i}" aria-label="OCR 뜻 ${i+1}" value="${esc(w.meaning)}"><small>${esc(w.languageDomain)} · ${esc(w.source?.pageId||'source')} · confidence ${esc(w.source?.confidence||'medium')}</small>${w.source?.warnings?.length?`<small class="ocr-warning">확인 필요 · ${esc(w.source.warnings.join(', '))}</small>`:''}</div><button class="btn secondary" data-review-toggle="${i}" type="button">${w.excluded?'복원':'제외'}</button></div>`).join('')}</div><button class="btn primary full" id="v2Commit" type="button">미션으로 저장</button></section>`;
      draft.forEach((w,i)=>{
        const token=$(`[data-review-token="${i}"]`),meaning=$(`[data-review-meaning="${i}"]`),toggle=$(`[data-review-toggle="${i}"]`);
        token.disabled=w.excluded;meaning.disabled=w.excluded;
        if(w.excluded)token.closest('.weak-item').style.opacity='.45';
        token.oninput=()=>{draft[i].token=token.value.trim();draft[i].lexicalId=`${draft[i].token.toLowerCase()}::${draft[i].meaning.replace(/\s+/g,' ')}`};
        meaning.oninput=()=>{draft[i].meaning=meaning.value.trim();draft[i].lexicalId=`${draft[i].token.toLowerCase()}::${draft[i].meaning.replace(/\s+/g,' ')}`};
        toggle.onclick=()=>{draft[i].excluded=!draft[i].excluded;renderRows()};
      });
      $('#v2Commit').onclick=()=>{
        const kept=draft.filter(x=>!x.excluded&&x.token&&x.meaning);
        if(!kept.length){setFlash('저장할 단어가 없어요.');return}
        const mission=HideV2Mission.addMission({items:kept,sourceCount:Number(HideV2Capture.state()?.pages?.length||1),provenance:{source:'V2_OCR_REVIEW',captureSessionId:HideV2Capture.state()?.id||null}});
        HideV2Capture.markCommitted(mission.id);
        HideV2Router.go('missions');
      };
    };
    renderRows();
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

    if(session.stage==='MEMORIZE'){
      const item={eng:w.token,word:w.token,kor:w.meaning,languageDomain:w.languageDomain,meaningMap:w.meaningMap};
      const thinkingHtml=globalThis.HideLanguageModel?.renderStarterExplorationHtml?.(item,{encounteredWords:[]},esc)||'';
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">${childStageLabel('MEMORIZE')}</span><b>${idx}/${total}</b></div><section class="card word-card"><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}</section>${thinkingHtml}<button id="v2Memorized" class="btn primary full">기억하고 찾아보기</button></section>`;
      bindThinkingTrail(m.id,w);
      $('#v2Memorized').onclick=()=>{HideV2Session.update(HideV2Learning.submitMemorize(session,m).session);render()};
      return;
    }

    if(session.stage==='FIRST_FIND'){
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">${childStageLabel('FIRST_FIND')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>뜻을 보고 단어를 기억에서 꺼내보세요.</p><div class="bigword">${esc(w.meaning)}</div><input id="v2Answer" class="input" aria-label="회상 답 입력" autocomplete="off" spellcheck="false"><button id="v2Check" class="btn primary full">기억 확인</button></section></section>`;
      $('#v2Check').onclick=()=>{const r=HideV2Learning.checkFirstFind(session,m,$('#v2Answer').value);HideV2Session.update(r.session);setFlash(r.ok?'기억에서 찾았어요':'이번 회상은 틀렸어요. 뒤 단계에서 다시 확인할게요.');render()};
      return;
    }

    if(session.stage==='MEANING'){
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">${childStageLabel('MEANING')}</span><b>${idx}/${total}</b></div><section class="card word-card"><div class="bigword">${esc(w.token)}</div><input id="v2Meaning" class="input" aria-label="뜻 회상 입력" autocomplete="off"><button id="v2MeaningCheck" class="btn primary full">뜻 확인</button></section></section>`;
      $('#v2MeaningCheck').onclick=()=>{const r=HideV2Learning.checkMeaning(session,m,$('#v2Meaning').value);HideV2Session.update(r.session);setFlash(r.ok?'뜻도 기억했어요':'뜻 회상은 틀렸어요.');render()};
      return;
    }

    if(session.stage==='DOMAIN_EXTENSION'){
      if(w.languageDomain==='KOREAN'){
        view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">표현 길</span><b>${idx}/${total}</b></div><section class="card"><h2>내 문장으로 표현하기</h2><p>“${esc(w.token)}”을 넣어 짧은 문장을 만들어보세요.</p><textarea id="v2Response" class="input" rows="3" aria-label="국어 문장 표현"></textarea><button id="v2DomainDone" class="btn primary full">표현 남기기</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{const text=$('#v2Response').value.trim();if(text.length<4){setFlash('짧은 문장으로 표현해 주세요.');return}HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{responseText:text}).session);render()};
      }else if(w.languageDomain==='HANJA'&&w.soundEvidence){
        view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">소리 찾기</span><b>${idx}/${total}</b></div><section class="card"><div class="bigword">${esc(w.token)}</div><input id="v2Sound" class="input" aria-label="한자 음 입력" autocomplete="off"><button id="v2DomainDone" class="btn primary full">음 기억 확인</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{sound:$('#v2Sound').value}).session);render()};
      }else{
        view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">연결 길</span><b>${idx}/${total}</b></div><section class="card">${globalThis.HideLanguageModel?.renderMeaningMapHtml?.({eng:w.token,word:w.token,languageDomain:w.languageDomain,meaningMap:w.meaningMap},esc)||`<p>${esc(w.example||w.meaning)}</p>`}<button id="v2DomainDone" class="btn primary full">다음</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{}).session);render()};
      }
      return;
    }

    if(session.stage==='FINAL_SEEK'){
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">${childStageLabel('FINAL_SEEK')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>마지막으로 힌트 없이 단어를 다시 꺼내보세요.</p><div class="bigword">${esc(w.meaning)}</div><input id="v2Final" class="input" aria-label="최종 회상 답 입력" autocomplete="off" spellcheck="false"><button id="v2FinalCheck" class="btn primary full">마지막 기억 확인</button></section></section>`;
      $('#v2FinalCheck').onclick=()=>{const r=HideV2Learning.checkFinalSeek(session,m,$('#v2Final').value);HideV2Session.update(r.session);setFlash(r.ok?'마지막 찾기 성공':'괜찮아요. 잠깐 다시 보고 한 번 더 찾아봐요.');render()};
      return;
    }

    if(session.stage==='SEEK_AGAIN_RELEARN'){
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">${childStageLabel('SEEK_AGAIN_RELEARN')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>놓친 단어를 잠깐 다시 만나봐요.</p><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}<button id="v2Rehide" class="btn primary full">다시 숨기기</button></section></section>`;
      $('#v2Rehide').onclick=()=>{HideV2Session.update(HideV2Learning.submitSeekAgainRelearn(session,m).session);render()};
      return;
    }

    if(session.stage==='SEEK_AGAIN'){
      view().innerHTML=`<section class="learning-shell"><div class="learn-head"><span class="phase-chip">${childStageLabel('SEEK_AGAIN')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>이번에는 다시 찾을 수 있을까요?</p><div class="bigword">${esc(w.meaning)}</div><input id="v2SeekAgain" class="input" aria-label="다시 찾기 답 입력" autocomplete="off" spellcheck="false"><button id="v2SeekAgainCheck" class="btn primary full">다시 찾기</button></section></section>`;
      $('#v2SeekAgainCheck').onclick=()=>{const r=HideV2Learning.checkSeekAgain(session,m,$('#v2SeekAgain').value);HideV2Session.update(r.session);setFlash(r.ok?'다시 찾았어요':'한 번 더 보고 다시 찾아봐요.');render()};
      return;
    }
  }

  function complete(){
    const m=mission(),active=HideV2Store.snapshot().activeSession;
    const scopedIds=Array.isArray(active?.queue)?active.queue:null;
    const summary=HideV2Memory.missionSummary(m),trail=HideV2Trail.missionSummary(m,{itemIds:scopedIds});
    const fullMissionScope=trail.fullMissionScope===true;
    HideV2Mission.updateMission(m.id,x=>{x.status=fullMissionScope?'COMPLETED':'PARTIAL';x.memorySummary=summary;x.trailSummary=trail});
    const readyContext=globalThis.HideV2ReadyBridge?.context?.()||{};
    const returnButton=readyContext.return_target?'<button id="v2ReturnReady" class="btn primary full" style="margin-top:8px">Ready & Set으로 돌아가기</button>':'';
    view().innerHTML=`<section class="card tint-leaf" style="text-align:center"><h1>탐험 완료</h1><p>오늘 찾은 정도와 오래 기억할 정도를 따로 기록했어요.</p><div class="grid3"><div class="status-pill"><b>${trail.trailMastery}%</b><span>길 익힘</span></div><div class="status-pill"><b>${summary.averageMemoryStrength}%</b><span>기억 힘</span></div><div class="status-pill"><b>${trail.recoveredTodayCount}</b><span>다시 찾음</span></div></div><div class="metric"><span>다음에 다시 볼 단어</span><b>${summary.reviewAdvisories.length}</b></div><button id="v2Home" class="btn secondary full">홈으로</button>${returnButton}</section>`;
    globalThis.HideV2ReadyBridge?.emitTaskEvent?.('TASK_COMPLETED');
    $('#v2Home').onclick=()=>{HideV2Session.clear();HideV2Router.go('home')};
    if($('#v2ReturnReady'))$('#v2ReturnReady').onclick=()=>globalThis.HideV2ReadyBridge?.returnToReady?.();
  }

  function renderOcrFailure(result){
    const retained=(result?.rows||[]).length;
    view().innerHTML=`<section class="card"><h2>${result?.retryAttempt?'다시 분석하지 못했어요':'분석하지 못했어요'}</h2><p>${esc(result?.reason||'OCR_ANALYSIS_FAILED')}</p>${retained?`<p>${retained}개 결과는 보존되어 있어요.</p>`:''}${result?.retryable?'<button id="v2RetryOcr" class="btn primary full">실패한 페이지만 다시 분석</button>':''}<button id="v2Back" class="btn secondary full">돌아가기</button></section>`;
    if($('#v2RetryOcr'))$('#v2RetryOcr').onclick=async()=>{
      view().innerHTML='<section class="card"><h2>다시 분석 중</h2><p>성공한 페이지는 유지하고 실패한 페이지만 다시 확인해요.</p></section>';
      const retry=await HideV2Capture.analyzePending();
      if(retry.ok){review(retry.rows);return}
      renderOcrFailure({...retry,retryAttempt:true});
    };
    $('#v2Back').onclick=()=>HideV2Router.go('home');
  }

  async function onFiles(files){
    view().innerHTML='<section class="card"><h2>프린트 분석 중</h2><p>원본을 기준으로 단어와 뜻을 추출하고 있어요.</p></section>';
    const r=await HideV2Capture.analyzeFiles(files);
    if(!r.ok){renderOcrFailure(r);return}
    review(r.rows);
  }

  function missions(){
    const list=HideV2Mission.listMissions();
    view().innerHTML=`<section class="card"><div class="section-title"><h2>탐험 미션</h2><span>${list.length}개</span></div>${list.length?list.map(m=>`<div class="weak-item" data-mission-id="${esc(m.id)}"><div style="flex:1"><b>${esc(m.title)}</b><small style="display:block">${m.items.length}개 · ${esc(m.status)}</small></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn secondary" data-action="open" data-id="${esc(m.id)}">선택</button><button class="btn secondary" data-action="rename" data-id="${esc(m.id)}">이름</button><button class="btn secondary" data-action="archive" data-id="${esc(m.id)}">보관</button><button class="btn secondary" data-action="delete" data-id="${esc(m.id)}">삭제</button></div></div>`).join(''):'<p>아직 저장된 미션이 없어요.</p>'}<button class="btn secondary full" id="v2MissionHome">홈으로</button></section>`;
    $('#v2MissionHome').onclick=()=>HideV2Router.go('home');
    view().querySelectorAll('[data-action]').forEach(btn=>{
      btn.onclick=()=>{
        const id=btn.dataset.id,action=btn.dataset.action;
        try{
          if(action==='open'){HideV2Mission.setActive(id);HideV2Router.go('home');return}
          if(action==='rename'){const current=HideV2Mission.listMissions().find(x=>x.id===id);const next=prompt('미션 이름',current?.title||'');if(next!==null)HideV2Mission.renameMission(id,next)}
          if(action==='archive')HideV2Mission.archiveMission(id);
          if(action==='delete'){if(confirm('이 미션을 삭제할까요?'))HideV2Mission.deleteMission(id)}
          missions();
        }catch(e){setFlash(e?.message||'미션을 변경하지 못했어요.')}
      };
    });
  }

  function records(){
    const book=HideV2Memory.wordbook(),dash=HideV2Memory.dashboard();
    view().innerHTML=`<section class="card"><div class="section-title"><h2>기억 기록</h2><span>${dash.total}단어</span></div><div class="grid3"><div class="status-pill"><b>${dash.averageStrength}%</b><span>기억 힘</span></div><div class="status-pill"><b>${dash.needsRecall}</b><span>재회상</span></div><div class="status-pill"><b>${dash.stable}</b><span>안정</span></div></div><div class="metric"><span>뜻 혼동</span><b>${dash.confusion}</b></div><div class="metric"><span>글자 형태 취약</span><b>${dash.orthographic}</b></div><div class="metric"><span>소리 회상 취약</span><b>${dash.sound}</b></div><div class="metric"><span>느린 회상</span><b>${dash.slowRecall}</b></div><div class="metric"><span>힌트 의존</span><b>${dash.hintDependent}</b></div></section><section class="card"><div class="section-title"><h2>단어장</h2><span>우선 복습순</span></div>${book.length?book.map((x,i)=>`<article class="weak-item" data-wordbook-index="${i}"><div style="flex:1"><b>${esc(x.token)}</b><small style="display:block">${esc(x.meaning)} · ${esc(x.languageDomain)} · ${x.encounters}회</small><small style="display:block">${esc(x.primaryReason.label)}</small></div><div style="text-align:right"><b>${x.memoryStrength}%</b><small style="display:block">P${x.nextReviewPriority}</small><button class="btn secondary" data-word-detail="${i}" type="button">상세</button></div></article>`).join(''):'<p>아직 기억 기록이 없어요.</p>'}<button class="btn secondary full" id="v2RecordsHome">홈으로</button></section>`;
    $('#v2RecordsHome').onclick=()=>HideV2Router.go('home');
    view().querySelectorAll('[data-word-detail]').forEach(btn=>{
      btn.onclick=()=>{const entry=book[Number(btn.dataset.wordDetail)];if(entry)HideV2Router.go('record-detail',{lexicalId:entry.lexicalId})};
    });
  }

  function recordDetail(params={}){
    const entry=HideV2Memory.wordbook().find(x=>x.lexicalId===params.lexicalId);
    if(!entry){HideV2Router.go('records');return}
    const sig=entry.memorySignature||{},events=(entry.evidence||[]).slice().reverse().slice(0,20);
    view().innerHTML=`<section class="card"><div class="hero-kicker"><span>기억 자세히</span><span>${esc(entry.languageDomain)}</span></div><h2>${esc(entry.token)}</h2><p>${esc(entry.meaning)}</p><div class="grid3"><div class="status-pill"><b>${entry.memoryStrength}%</b><span>Memory</span></div><div class="status-pill"><b>P${entry.nextReviewPriority}</b><span>다시 찾기</span></div><div class="status-pill"><b>${entry.encounters}</b><span>만난 횟수</span></div></div><div class="metric"><span>주요 이유</span><b>${esc(entry.primaryReason.label)}</b></div><div class="metric"><span>회복 상태</span><b>${esc(sig.recoveryStatus||'UNPROVEN')}</b></div><div class="metric"><span>뜻 취약</span><b>${sig.semanticWeakness||0}</b></div><div class="metric"><span>소리 취약</span><b>${sig.phonologicalWeakness||0}</b></div><div class="metric"><span>형태 취약</span><b>${sig.orthographicWeakness||0}</b></div><div class="metric"><span>혼동</span><b>${sig.confusionPattern?.count||0}</b></div></section><section class="card"><div class="section-title"><h2>기억 흔적</h2><span>최근 ${events.length}</span></div>${events.length?events.map(e=>`<div class="weak-item"><div><b>${esc(childEvidenceLabel(e.stage||e.evidenceMode))}</b><small style="display:block">${esc(e.result||'')} · ${esc(e.evidenceMode||'')}</small></div><small>${esc(e.at||'')}</small></div>`).join(''):'<p>기록 없음</p>'}<button class="btn secondary full" id="v2RecordBack">기록으로</button></section>`;
    $('#v2RecordBack').onclick=()=>HideV2Router.go('records');
  }

  function render(){
    if(flash){const t=$('#toast');if(t){t.textContent=flash;t.classList.add('show')}}
    const r=HideV2Router.current();
    if(r.name==='learn')learn();else if(r.name==='missions')missions();else if(r.name==='records')records();else if(r.name==='record-detail')recordDetail(r.params);else home();
  }
  function boot(){
    globalThis.HideV2LegacyMigration?.migrateIfNeeded?.();
    $('#settingsBtn').hidden=true;$('#backBtn').hidden=true;$('#partnerBar').hidden=true;$('#bottomNav').hidden=true;
    const bindFileInput=id=>$(id)?.addEventListener('change',e=>{const files=[...e.target.files];e.target.value='';if(files.length)onFiles(files)});
    bindFileInput('#sheetCameraInput');bindFileInput('#sheetLibraryInput');
    HideV2Router.subscribe(render);HideV2Store.subscribe(()=>{});render();
    globalThis.HideV2Pwa?.ensureRegistered?.();
    window.HideV2App=Object.freeze({render,review,onFiles,start:()=>{const m=mission();HideV2Session.start(m,{targetItemIds:globalThis.HideV2ReadyBridge?.targetItemIds?.(m)||null});HideV2Router.go('learn')}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();