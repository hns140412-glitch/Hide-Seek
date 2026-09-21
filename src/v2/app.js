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
  const missionStatusLabel=status=>({
    READY:'준비됨',PARTIAL:'이어가기',COMPLETED:'완료',ARCHIVED:'보관됨'
  })[status]||'탐험 중';
  const languageLabel=domain=>({ENGLISH:'영어',KOREAN:'국어',HANJA:'한자'})[domain]||'언어';
  const childMemoryReason=entry=>{
    const sig=entry?.memorySignature||{};
    if((sig.confusionPattern?.count||0)>0)return '비슷한 뜻이랑 헷갈린 흔적이 있어요. 한 번 더 스스로 찾아보면 좋아요.';
    if((sig.semanticWeakness||0)>0)return '뜻을 꺼낼 때 조금 막혔어요. 뜻부터 다시 떠올려 봐요.';
    if((sig.orthographicWeakness||0)>0)return '글자 모양이 아직 완전히 익숙하지 않아요. 눈으로 보고 다시 찾아봐요.';
    if((sig.phonologicalWeakness||0)>0)return '소리 연결이 아직 약해요. 소리를 떠올리며 다시 찾아봐요.';
    if((sig.hintDependent||0)>0)return '힌트 도움을 받은 흔적이 있어요. 다음엔 힌트 없이 찾아보는 게 목표예요.';
    if((sig.slowRecall||0)>0)return '생각해내는 데 시간이 조금 걸렸어요. 한 번 더 꺼내면 더 빨라질 수 있어요.';
    if((entry?.memoryStrength||0)>=80)return '지금은 꽤 안정적으로 기억하고 있어요. 다음 탐험에서도 그대로 떠오르는지 확인해요.';
    return '아직 혼자서 바로 꺼낸 기록이 충분하지 않아요. 한 번 더 스스로 찾아봐요.';
  };
  const crewHtml=(word,stage)=>{
    const crew=globalThis.HideV2Crew?.presentation?.({word,stage})||{displayName:'탐험대원',supportText:'필요할 때 짧은 단서를 함께 찾아봐요.',avatarText:'탐'};
    return `<aside class="crew-strip" aria-label="탐험대원"><span class="crew-strip__avatar">${esc(crew.avatarText)}</span><span class="crew-strip__copy"><b>${esc(crew.displayName)}</b><small class="crew-support-copy">${esc(crew.supportText)}</small></span><button class="btn ghost crew-support-btn" data-crew-support type="button">짧은 응원</button></aside>`;
  };

  const journeyHtml=stage=>{
    const steps=[
      ['MEMORIZE','01 만나기'],['FIRST_FIND','02 첫 찾기'],['MEANING','03 뜻 단서'],['DOMAIN_EXTENSION','04 연결 길'],['FINAL_SEEK','05 마지막 찾기'],['SEEK_AGAIN','06 다시 찾기']
    ];
    const normalized=stage==='SEEK_AGAIN_RELEARN'?'SEEK_AGAIN':stage;
    const activeIndex=Math.max(0,steps.findIndex(([key])=>key===normalized));
    return `<ol class="journey-path" aria-label="단어 탐험 길">${steps.map(([key,label],i)=>`<li class="${i<activeIndex?'is-done':''} ${i===activeIndex?'is-current':''}"><span aria-hidden="true">${i<activeIndex?'✓':i+1}</span><small>${esc(label)}</small></li>`).join('')}</ol>`;
  };

  const progressHtml=(idx,total,label='탐험 진행')=>{
    const pct=Math.max(0,Math.min(100,Math.round(((Math.max(1,idx)-1)/Math.max(1,total))*100)));
    return `<div class="quest-progress" aria-label="${esc(label)}"><div class="quest-progress__meta"><span>${esc(label)}</span><b>${idx}/${total}</b></div><div class="quest-progress__track"><span style="width:${pct}%"></span></div></div>`;
  };
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
    const memory=HideV2Memory.dashboard();
    const homeCrew=globalThis.HideV2Crew?.presentation?.({stage:'HOME',mission:m})||{displayName:'탐험대원',supportText:'오늘 찾을 단어 길을 같이 살펴봐요.',avatarText:'탐'};
    const memoryMessage=memory.total
      ?(memory.needsRecall>0?('다시 찾아볼 단어가 '+memory.needsRecall+'개 있어요. 오늘은 그 단어부터 만나도 좋아요.'):'지금은 기억이 꽤 안정적이에요. 다음 탐험에서도 스스로 떠오르는지 확인해봐요.')
      :'첫 탐험을 마치면 기억 사다리가 여기서 이어져요.';
    const activeCount=s.missions.filter(x=>x.status!=='ARCHIVED').length;
    const missionAction=m?`<button class="btn primary quest-main-action" id="v2Start">${resumable?'탐험 이어가기':'탐험 시작'}</button>`:'';
    view().innerHTML=`
      <section class="quest-hero">
        <div class="quest-hero__eyebrow">HIDE & SEEK · 숨은 단어 탐험</div>
        <div class="quest-hero__body">
          <div>
            <p class="quest-overline">${m?'오늘의 탐험':'새 탐험 준비'}</p>
            <h1>${m?esc(m.title):'프린트에서 숨은 단어를 찾아봐요'}</h1>
            <p class="quest-subcopy">${m?`${m.items.length}개 단어 · ${missionStatusLabel(m.status)}`:'사진을 찍으면 단어를 확인하고 바로 탐험을 시작할 수 있어요.'}</p>
          </div>
          ${m?`<div class="quest-count"><b>${m.items.length}</b><span>숨은 단어</span></div>`:''}
        </div>
        <div class="quest-hero__actions">
          ${missionAction}
          <button class="btn secondary" id="v2Camera">카메라 촬영</button>
          <button class="btn ghost" id="v2Library">사진에서 가져오기</button>
        </div>
      </section>

      ${reviewReady?`<section class="quest-alert"><div><b>확인하던 단어가 남아 있어요</b><p>${capture?.lastRows?.length||0}개 단어를 이어서 확인할 수 있어요.</p></div><button class="btn primary" id="v2ResumeReview">이어서 확인</button></section>`:''}

      <section class="quest-grid">
        <button class="quest-tile" id="v2MissionList" type="button"><span class="quest-tile__icon">🧭</span><span><b>탐험 미션</b><small>${activeCount}개 미션</small></span><i>›</i></button>
        <button class="quest-tile" id="v2Records" type="button"><span class="quest-tile__icon">🪜</span><span><b>기억 사다리</b><small>${memory.total}개 단어 기록</small></span><i>›</i></button>
      </section>

      <section class="trail-bridge" aria-label="탐험과 기억의 연결">
        <div class="trail-bridge__step"><span>1</span><b>미션 고르기</b><small>오늘 찾을 단어</small></div>
        <i aria-hidden="true">→</i>
        <div class="trail-bridge__step"><span>2</span><b>단어 찾기</b><small>생각하고 꺼내기</small></div>
        <i aria-hidden="true">→</i>
        <div class="trail-bridge__step"><span>3</span><b>기억 사다리</b><small>다음 탐험 준비</small></div>
      </section>

      <section class="quest-status quest-status--story">
        <div class="section-title"><div><p class="quest-overline">MY TRAIL</p><h2>다음 탐험은 이렇게 이어져요</h2></div><span>${memory.total?'기억 사다리 연결':'첫 탐험 전'}</span></div>
        <p class="quest-status__story">${esc(memoryMessage)}</p>
        <aside class="home-crew" aria-label="홈 탐험대원">
          <span class="crew-strip__avatar">${esc(homeCrew.avatarText)}</span>
          <span><b>${esc(homeCrew.displayName)}</b><small>${esc(homeCrew.supportText)}</small></span>
        </aside>
        <div class="quest-stat-row quest-stat-row--quiet" aria-label="기억 상태 보조 정보">
          <div class="quest-stat"><b>${memory.averageStrength||0}%</b><span>기억 힘</span></div>
          <div class="quest-stat"><b>${memory.needsRecall||0}</b><span>다시 찾기</span></div>
          <div class="quest-stat"><b>${memory.stable||0}</b><span>안정 단어</span></div>
        </div>
      </section>`;

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
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEMORIZE')}</span><b>${idx}/${total}</b></div><section class="card word-card"><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}</section>${thinkingHtml}<button id="v2Memorized" class="btn primary full">기억하고 찾아보기</button></section>`;
      bindThinkingTrail(m.id,w);
      $('#v2Memorized').onclick=()=>{HideV2Session.update(HideV2Learning.submitMemorize(session,m).session);render()};
      return;
    }

    if(session.stage==='FIRST_FIND'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('FIRST_FIND')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>뜻을 보고 단어를 기억에서 꺼내보세요.</p><div class="bigword">${esc(w.meaning)}</div><input id="v2Answer" class="input" aria-label="회상 답 입력" autocomplete="off" spellcheck="false"><button id="v2Check" class="btn primary full">기억 확인</button></section></section>`;
      $('#v2Check').onclick=()=>{const r=HideV2Learning.checkFirstFind(session,m,$('#v2Answer').value);HideV2Session.update(r.session);setFlash(r.ok?'기억에서 찾았어요':'이번 회상은 틀렸어요. 뒤 단계에서 다시 확인할게요.');render()};
      return;
    }

    if(session.stage==='MEANING'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEANING')}</span><b>${idx}/${total}</b></div><section class="card word-card"><div class="bigword">${esc(w.token)}</div><input id="v2Meaning" class="input" aria-label="뜻 회상 입력" autocomplete="off"><button id="v2MeaningCheck" class="btn primary full">뜻 확인</button></section></section>`;
      $('#v2MeaningCheck').onclick=()=>{const r=HideV2Learning.checkMeaning(session,m,$('#v2Meaning').value);HideV2Session.update(r.session);setFlash(r.ok?'뜻도 기억했어요':'뜻 회상은 틀렸어요.');render()};
      return;
    }

    if(session.stage==='DOMAIN_EXTENSION'){
      if(w.languageDomain==='KOREAN'){
        view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">표현 길</span><b>${idx}/${total}</b></div><section class="card"><h2>내 문장으로 표현하기</h2><p>“${esc(w.token)}”을 넣어 짧은 문장을 만들어보세요.</p><textarea id="v2Response" class="input" rows="3" aria-label="국어 문장 표현"></textarea><button id="v2DomainDone" class="btn primary full">표현 남기기</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{const text=$('#v2Response').value.trim();if(text.length<4){setFlash('짧은 문장으로 표현해 주세요.');return}HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{responseText:text}).session);render()};
      }else if(w.languageDomain==='HANJA'&&w.soundEvidence){
        view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">소리 찾기</span><b>${idx}/${total}</b></div><section class="card"><div class="bigword">${esc(w.token)}</div><input id="v2Sound" class="input" aria-label="한자 음 입력" autocomplete="off"><button id="v2DomainDone" class="btn primary full">음 기억 확인</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{sound:$('#v2Sound').value}).session);render()};
      }else{
        view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">연결 길</span><b>${idx}/${total}</b></div><section class="card">${globalThis.HideLanguageModel?.renderMeaningMapHtml?.({eng:w.token,word:w.token,languageDomain:w.languageDomain,meaningMap:w.meaningMap},esc)||`<p>${esc(w.example||w.meaning)}</p>`}<button id="v2DomainDone" class="btn primary full">다음</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{}).session);render()};
      }
      return;
    }

    if(session.stage==='FINAL_SEEK'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('FINAL_SEEK')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>마지막으로 힌트 없이 단어를 다시 꺼내보세요.</p><div class="bigword">${esc(w.meaning)}</div><input id="v2Final" class="input" aria-label="최종 회상 답 입력" autocomplete="off" spellcheck="false"><button id="v2FinalCheck" class="btn primary full">마지막 기억 확인</button></section></section>`;
      $('#v2FinalCheck').onclick=()=>{const r=HideV2Learning.checkFinalSeek(session,m,$('#v2Final').value);HideV2Session.update(r.session);setFlash(r.ok?'마지막 찾기 성공':'괜찮아요. 잠깐 다시 보고 한 번 더 찾아봐요.');render()};
      return;
    }

    if(session.stage==='SEEK_AGAIN_RELEARN'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('SEEK_AGAIN_RELEARN')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>놓친 단어를 잠깐 다시 만나봐요.</p><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}<button id="v2Rehide" class="btn primary full">다시 숨기기</button></section></section>`;
      $('#v2Rehide').onclick=()=>{HideV2Session.update(HideV2Learning.submitSeekAgainRelearn(session,m).session);render()};
      return;
    }

    if(session.stage==='SEEK_AGAIN'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('SEEK_AGAIN')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>이번에는 다시 찾을 수 있을까요?</p><div class="bigword">${esc(w.meaning)}</div><input id="v2SeekAgain" class="input" aria-label="다시 찾기 답 입력" autocomplete="off" spellcheck="false"><button id="v2SeekAgainCheck" class="btn primary full">다시 찾기</button></section></section>`;
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
    const crew=globalThis.HideV2Crew?.presentation?.({screen:'COMPLETE',mission:m})||{displayName:'탐험대원',avatarText:'탐'};
    const exploredCount=scopedIds?.length||m.items.length;
    const achievement=trail.recoveredTodayCount>0
      ?('오늘 '+exploredCount+'개 단어를 끝까지 찾았고, 놓쳤던 '+trail.recoveredTodayCount+'개도 다시 찾아냈어요.')
      :('오늘 '+exploredCount+'개 단어의 탐험 길을 끝까지 걸었어요.');
    const nextStep=summary.reviewAdvisories.length>0
      ?('기억 사다리에 다시 만나볼 단어가 '+summary.reviewAdvisories.length+'개 있어요. 날짜는 Ready & Set이 정하고, 여기서는 기억 흔적만 보여줘요.')
      :'지금은 다시 볼 단어 신호가 없어요. 다음 탐험에서도 스스로 떠오르는지 확인해봐요.';
    view().innerHTML=`<section class="card tint-leaf completion-card completion-card--story"><div class="completion-mark" aria-hidden="true">✦</div><p class="quest-overline">MISSION COMPLETE</p><h1>탐험 완료</h1><p class="completion-achievement">${esc(achievement)}</p><div class="completion-crew"><span class="completion-crew__avatar">${esc(crew.avatarText||'탐')}</span><span><b>${esc(crew.displayName||'탐험대원')}</b><small>오늘 길을 끝까지 함께 왔어요.</small></span></div><section class="completion-next"><span>다음 탐험</span><b>${esc(nextStep)}</b></section><button id="v2MemoryLadder" class="btn primary full">기억 사다리 보기</button><button id="v2Home" class="btn secondary full">홈으로</button>${returnButton}<details class="completion-details"><summary>오늘의 기록 보기</summary><div class="grid3"><div class="status-pill"><b>${trail.trailMastery}%</b><span>길 익힘</span></div><div class="status-pill"><b>${summary.averageMemoryStrength}%</b><span>기억 힘</span></div><div class="status-pill"><b>${trail.recoveredTodayCount}</b><span>다시 찾음</span></div></div><div class="metric"><span>다음에 다시 볼 단어</span><b>${summary.reviewAdvisories.length}</b></div></details></section>`;
    globalThis.HideV2ReadyBridge?.emitTaskEvent?.('TASK_COMPLETED');
    $('#v2MemoryLadder').onclick=()=>{HideV2Session.clear();HideV2Router.go('records')};
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
    const list=HideV2Mission.listMissions(),activeId=HideV2Store.snapshot().activeMissionId;
    const mapSummary=list.length
      ?(list.some(x=>x.id===activeId)?'지금 이어갈 탐험이 맨 앞에 있어요. 끝난 탐험은 뒤에서 조용히 기다려요.':'이어갈 탐험을 하나 골라 오늘의 길을 정해봐요.')
      :'새 프린트를 가져오면 첫 탐험 길이 여기 생겨요.';
    view().innerHTML=`<section class="screen-head mission-map-head"><p class="quest-overline">MISSION MAP</p><h1>오늘의 탐험 지도</h1><p>${esc(mapSummary)}</p></section><section class="mission-path" aria-label="탐험 미션 지도">${list.length?list.map((m,i)=>`<article class="mission-card mission-map-card ${m.id===activeId?'is-active':''}" data-mission-id="${esc(m.id)}"><div class="mission-map-marker" aria-hidden="true"><span>${i+1}</span></div><div class="mission-card__main"><span class="mission-card__status">${missionStatusLabel(m.status)}</span><h2>${esc(m.title)}</h2><p>${m.items.length}개의 숨은 단어 · ${m.id===activeId?'지금 이어갈 길':'다른 탐험 길'}</p></div><div class="mission-map-actions"><button class="btn primary" data-action="open" data-id="${esc(m.id)}">${m.id===activeId?'이어서 탐험':'이 길 선택'}</button><details class="mission-tools"><summary>정리 도구</summary><div class="mission-card__actions"><button class="btn ghost" data-action="rename" data-id="${esc(m.id)}">이름 바꾸기</button><button class="btn ghost" data-action="archive" data-id="${esc(m.id)}">보관</button><button class="btn ghost danger-lite" data-action="delete" data-id="${esc(m.id)}">삭제</button></div></details></div></article>`).join(''):'<div class="empty-state"><b>아직 탐험 길이 없어요</b><p>홈에서 프린트 사진을 추가하면 첫 미션을 만들 수 있어요.</p></div>'}</section><button class="btn secondary full" id="v2MissionHome">홈으로</button>`;
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
    const ladderBand=x=>x.memoryStrength>=80?'STABLE':x.memoryStrength>=45?'CLIMBING':'SEEK_AGAIN';
    const bandLabel={SEEK_AGAIN:'다시 찾을 단어',CLIMBING:'올라가는 단어',STABLE:'안정된 단어'};
    const bands=['SEEK_AGAIN','CLIMBING','STABLE'].map(key=>({key,items:book.filter(x=>ladderBand(x)===key)}));
    view().innerHTML=`
      <section class="screen-head"><p class="quest-overline">MEMORY LADDER</p><h1>기억 사다리</h1><p>잘 기억되는 단어와 다시 찾아볼 단어를 한눈에 봐요.</p></section>
      <section class="memory-summary"><div class="quest-stat"><b>${dash.averageStrength}%</b><span>전체 기억 힘</span></div><div class="quest-stat"><b>${dash.needsRecall}</b><span>다시 찾기</span></div><div class="quest-stat"><b>${dash.stable}</b><span>안정 단어</span></div></section>
      <section class="ladder-board" aria-label="기억 사다리 단계">
        ${bands.map((band,index)=>`<article class="ladder-rung ladder-rung--${band.key.toLowerCase()}"><div class="ladder-rung__head"><span>${index+1}</span><div><b>${bandLabel[band.key]}</b><small>${band.items.length}개 단어</small></div></div><div class="ladder-rung__words">${band.items.length?band.items.slice(0,8).map(x=>`<button type="button" data-ladder-word="${esc(x.lexicalId)}"><b>${esc(x.token)} · 사다리</b><small>${x.memoryStrength}%</small></button>`).join(''):'<span class="ladder-empty">아직 이 단계의 단어가 없어요</span>'}</div></article>`).join('')}
      </section>
      ${book.length?`<section class="memory-why-card"><p class="quest-overline">WHY THIS WORD?</p><h2>왜 다시 찾아볼까?</h2><div class="memory-why-card__word"><b>${esc(book[0].token)} · 다시 볼 이유</b><span>${esc(childMemoryReason(book[0]))}</span></div><div class="memory-crew-mini"><span class="crew-strip__avatar">${esc((globalThis.HideV2Crew?.presentation?.({word:book[0],stage:'MEMORY_LADDER'})||{avatarText:'탐'}).avatarText)}</span><div><b>${esc((globalThis.HideV2Crew?.presentation?.({word:book[0],stage:'MEMORY_LADDER'})||{displayName:'탐험대원'}).displayName)}</b><small class="memory-crew-copy">정답 대신, 다시 떠올릴 수 있게 옆에서 도와줄게요.</small></div><button class="btn ghost" type="button" data-memory-support="${esc(book[0].lexicalId)}">짧은 응원</button></div></section>`:''}
      <section class="memory-signals"><span>뜻 혼동 <b>${dash.confusion}</b></span><span>글자 형태 <b>${dash.orthographic}</b></span><span>소리 <b>${dash.sound}</b></span><span>느린 회상 <b>${dash.slowRecall}</b></span><span>힌트 의존 <b>${dash.hintDependent}</b></span></section>
      <section class="wordbook"><div class="section-title"><div><p class="quest-overline">WORD TRAIL</p><h2>단어 기록</h2></div><span>다시 볼 순서</span></div>${book.length?book.map((x,i)=>`<article class="word-row" data-wordbook-index="${i}"><div class="word-row__body"><b>${esc(x.token)}</b><span>${esc(x.meaning)} · ${languageLabel(x.languageDomain)}</span><small>${esc(x.primaryReason.label)} · ${x.encounters}번 만남</small></div><div class="word-row__meter"><b>${x.memoryStrength}%</b><div class="mini-meter"><span style="width:${x.memoryStrength}%"></span></div><button class="btn ghost" data-word-detail="${i}" type="button">기억 보기</button></div></article>`).join(''):'<div class="empty-state"><b>아직 기억 기록이 없어요</b><p>단어 탐험을 마치면 이곳에 기억 사다리가 생겨요.</p></div>'}</section>
      <button class="btn secondary full" id="v2RecordsHome">홈으로</button>`;
    $('#v2RecordsHome').onclick=()=>HideV2Router.go('home');
    view().querySelectorAll('[data-ladder-word]').forEach(btn=>{btn.onclick=()=>HideV2Router.go('record-detail',{lexicalId:btn.dataset.ladderWord})});
    view().querySelectorAll('[data-memory-support]').forEach(btn=>{btn.onclick=()=>{const entry=book.find(x=>x.lexicalId===btn.dataset.memorySupport);if(!entry)return;const support=globalThis.HideV2Crew?.supportFor?.({word:entry,stage:'MEMORY_LADDER'})||{text:'천천히 떠올려 봐요. 지금은 정답을 보여주지 않을게요.',revealsAnswer:false};if(support.revealsAnswer===true)return;const copy=btn.closest('.memory-crew-mini')?.querySelector('.memory-crew-copy');if(copy)copy.textContent=support.text}});
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
    view().addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-crew-support]');if(!btn)return;
      const pair=HideV2Session.current?.();if(!pair)return;
      const word=HideV2Learning.current(pair.session,pair.mission);if(!word)return;
      const support=HideV2Crew.supportFor({word,stage:pair.session.stage});
      const copy=btn.closest('.crew-strip')?.querySelector('.crew-support-copy');
      if(copy)copy.textContent=support.text;
    });
    HideV2Router.subscribe(render);HideV2Store.subscribe(()=>{});render();
    globalThis.HideV2Pwa?.ensureRegistered?.();
    window.HideV2App=Object.freeze({render,review,onFiles,start:()=>{const m=mission();HideV2Session.start(m,{targetItemIds:globalThis.HideV2ReadyBridge?.targetItemIds?.(m)||null});HideV2Router.go('learn')}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();