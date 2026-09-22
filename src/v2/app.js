(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const childStageLabel=stage=>({
    MEMORIZE:'단어 만나기',
    FIRST_FIND:'첫 찾기',
    FIRST_FIND_ASSIST:'단서로 다시 찾기',
    FIRST_FIND_RELEARN:'다시 만나기',
    MEANING:'뜻 단서',
    MEANING_CHOICE_REVIEW:'헷갈린 뜻 비교',
    MEANING_ASSIST:'뜻 단서로 다시 찾기',
    MEANING_RELEARN:'뜻 다시 만나기',
    DOMAIN_EXTENSION:'연결 길',
    SOUND_FIND_RELEARN:'소리 다시 만나기',
    HIDDEN_WORDS:'숨은 단어 보강',
    HIDDEN_WORDS_ASSIST:'단서로 다시 찾기',
    HIDDEN_WORDS_RELEARN:'다시 만나기',
    FINAL_SEEK:'마지막 찾기',
    FINAL_SEEK_RECONSTRUCT:'글자 조립',
    SEEK_AGAIN_ASSIST:'단서로 다시 찾기',
    SEEK_AGAIN_RELEARN:'다시 만나기',
    SEEK_AGAIN:'다시 찾기',
    COMPLETE:'탐험 완료'
  })[stage]||'단어 탐험';
  const childEvidenceLabel=e=>({
    MEMORIZE:'단어 만나기',
    FIRST_FIND:'첫 찾기',
    FIRST_FIND_ASSIST:'첫 찾기 단서',
    FIRST_FIND_RELEARN:'첫 찾기 다시 보기',
    MEANING:'뜻 단서',
    MEANING_CHOICE_REVIEW:'헷갈린 뜻 비교',
    MEANING_ASSIST:'뜻 단서 도움',
    MEANING_RELEARN:'뜻 다시 보기',
    RESPONSE_TRAIL:'표현 길',
    EVIDENCE_TRAIL:'근거 찾기',
    SOUND_FIND:'소리 찾기',
    SOUND_FIND_RELEARN:'소리 다시 보기',
    CONNECTION:'연결 길',
    HIDDEN_WORDS:'숨은 단어 보강',
    HIDDEN_WORDS_ASSIST:'보강 단서',
    HIDDEN_WORDS_RELEARN:'보강 다시 보기',
    FINAL_SEEK:'마지막 찾기',
    FINAL_SEEK_RECONSTRUCT:'마지막 찾기 글자 조립',
    SEEK_AGAIN_ASSIST:'다시 찾기 단서',
    SEEK_AGAIN_RELEARN:'다시 만나기',
    SEEK_AGAIN:'다시 찾기',
    THINKING_TRAIL:'생각 길'
  })[e]||'기억 흔적';
  const missionStatusLabel=status=>({
    READY:'준비됨',PARTIAL:'이어가기',COMPLETED:'완료',ARCHIVED:'보관됨'
  })[status]||'탐험 중';
  const languageLabel=domain=>({ENGLISH:'영어',KOREAN:'국어',HANJA:'한자'})[domain]||'언어';
  const memoryPathState=entry=>{
    if(entry?.needsUnassistedRecall||Number(entry?.memoryStrength||0)<60)return {key:'SEEK_AGAIN',label:'다시 찾기',action:'다시 만나기'};
    if(entry?.primaryReason?.key==='stable')return {key:'STABLE',label:'안정',action:'지금 안정'};
    return {key:'CLIMBING',label:'올라가기',action:'기억 길 잇기'};
  };
  const childMemoryReason=entry=>{
    const key=entry?.primaryReason?.key||'stable';
    if(key==='recovery')return '바로 다시 찾은 기록만 있어요. 다음에는 힌트 없이 스스로 떠올리는 게 목표예요.';
    if(key==='confusion')return '비슷한 뜻이랑 헷갈린 흔적이 있어요. 뜻을 구분해서 다시 찾아봐요.';
    if(key==='orthographic')return '글자 모양에서 막힌 흔적이 있어요. 형태를 눈으로 확인하고 다시 떠올려 봐요.';
    if(key==='sound')return '소리로 꺼내는 길이 아직 약해요. 소리를 떠올리며 다시 찾아봐요.';
    if(key==='latency')return '생각해내는 데 시간이 걸린 흔적이 있어요. 한 번 더 꺼내면 길이 더 빨라질 수 있어요.';
    if(key==='hint')return '힌트 도움을 받은 흔적이 있어요. 다음엔 힌트 없이 찾아보는 게 목표예요.';
    if(key==='decay')return '시간이 지나면 흐려질 수 있는 흔적이 있어요. 다음 탐험에서 다시 떠오르는지 확인해요.';
    return '지금 기록에서는 특별히 약한 흔적이 보이지 않아요. 다음 탐험에서도 그대로 떠오르는지 확인해요.';
  };
  const crewHtml=(word,stage)=>{
    const crew=globalThis.HideV2Crew?.presentation?.({word,stage})||{displayName:'탐험대원',supportText:'필요할 때 짧은 단서를 함께 찾아봐요.',avatarText:'탐'};
    return `<aside class="crew-strip" aria-label="탐험대원"><span class="crew-strip__avatar">${esc(crew.avatarText)}</span><span class="crew-strip__copy"><b>${esc(crew.displayName)}</b><small class="crew-support-copy">${esc(crew.supportText)}</small></span><button class="btn ghost crew-support-btn" data-crew-support type="button">짧은 응원</button></aside>`;
  };

  const journeyHtml=stage=>{
    const steps=[
      ['MEMORIZE','01 만나기'],['FIRST_FIND','02 첫 찾기'],['MEANING','03 뜻 단서'],['DOMAIN_EXTENSION','04 연결 길'],['FINAL_SEEK','05 마지막 찾기'],['SEEK_AGAIN','06 다시 찾기']
    ];
    const normalized=stage==='FINAL_SEEK_RECONSTRUCT'?'FINAL_SEEK':(stage==='SEEK_AGAIN_ASSIST'||stage==='SEEK_AGAIN_RELEARN')?'SEEK_AGAIN':(stage==='FIRST_FIND_ASSIST'||stage==='FIRST_FIND_RELEARN')?'FIRST_FIND':(stage==='MEANING_CHOICE_REVIEW'||stage==='MEANING_ASSIST'||stage==='MEANING_RELEARN')?'MEANING':(stage==='SOUND_FIND_RELEARN'||stage==='HIDDEN_WORDS'||stage==='HIDDEN_WORDS_ASSIST'||stage==='HIDDEN_WORDS_RELEARN')?'DOMAIN_EXTENSION':stage;
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
    const submit=$('.inference-submit',card),reveal=$('.thinking-reveal',card),compare=$('.inference-compare',card);
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
        HideV2Store.transaction(s=>{
          s.events=Array.isArray(s.events)?s.events:[];
          s.events.push({
            event:'FIRST_SEEN_PREDICTION',
            at:new Date().toISOString(),
            missionId,
            wordId:w.id,
            lexicalId:w.lexicalId||null,
            word:w.token,
            prediction,
            clueUsed:clue,
            confidence,
            objectiveVerified:false,
            recallScoreImpact:false,
            assessmentSource:'LEARNER_SELF_REPORT'
          });
          if(s.events.length>120)s.events=s.events.slice(-120);
        });
        submit.disabled=true;
        if(reveal)reveal.disabled=false;
      };
    }
    if(reveal){
      reveal.onclick=()=>{
        const body=$('.thinking-reveal-body',card);if(body)body.hidden=false;
        if(compare)compare.hidden=false;
        reveal.disabled=true;
      };
    }
    card.querySelectorAll('.inference-outcome-btn').forEach(btn=>{
      btn.onclick=()=>{
        const outcome=String(btn.dataset.outcome||'').toUpperCase();
        if(!['MATCH','NEAR','MISS'].includes(outcome))return;
        HideV2Store.transaction(s=>{
          const events=Array.isArray(s.events)?s.events:[];
          for(let i=events.length-1;i>=0;i--){
            const e=events[i];
            if(e?.event==='FIRST_SEEN_PREDICTION'&&e.wordId===w.id&&!e.outcome){
              e.outcome=outcome;
              e.outcomeAt=new Date().toISOString();
              e.assessmentSource='LEARNER_SELF_REPORT';
              e.objectiveVerified=false;
              e.transferSkillEvidence=true;
              e.recallScoreImpact=false;
              break;
            }
          }
        });
        HideV2Memory.record(missionId,w.id,{
          stage:'THINKING_TRAIL_COMPARE',
          evidenceMode:'INFERENCE_SELF_REPORT',
          axes:['MEANING','CONTEXT'],
          result:outcome,
          objectiveVerified:false,
          objectiveRecall:false,
          recallScoreImpact:false,
          assisted:false,
          assessmentSource:'LEARNER_SELF_REPORT'
        });
        card.querySelectorAll('.inference-outcome-btn').forEach(x=>x.disabled=true);
        btn.classList.add('selected');
        setFlash(outcome==='MATCH'?'내 추론이 잘 맞았어요.':outcome==='NEAR'?'거의 가까이 갔어요.':'어떤 단서가 달랐는지 다음에 다시 써볼 수 있어요.');
      };
    });
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
    const clone=x=>JSON.parse(JSON.stringify(x));
    const persisted=globalThis.HideV2Capture?.reviewDraft?.()||[];
    const normalized=rows.map((r,i)=>HideV2Mission.normalizeItem(r,i)).filter(Boolean);
    const draft=persisted.length
      ?persisted.map(x=>clone(x))
      :normalized.map(x=>({...x,excluded:false,mergedInto:null,originalSource:clone(x.source||{})}));
    const persistDraft=()=>globalThis.HideV2Capture?.saveReviewDraft?.(draft);
    if(!persisted.length&&draft.length)persistDraft();
    const activeGroup=(i)=>draft
      .map((x,j)=>({x,j}))
      .filter(({x})=>!x.excluded&&x.lexicalId===draft[i].lexicalId)
      .map(({j})=>j);
    const sourceOccurrences=(source={})=>{
      const nested=Array.isArray(source.occurrences)&&source.occurrences.length?source.occurrences:[source];
      const seen=new Set();
      return nested.filter(Boolean).map(x=>clone(x)).filter(x=>{
        const key=[x.pageId,x.rowIndex,x.provider,x.model,x.analysisVersion].map(v=>String(v??'')).join('|');
        if(seen.has(key))return false;seen.add(key);return true;
      });
    };
    const resetGroup=(primaryId)=>{
      draft.forEach(x=>{
        if(x.id===primaryId||x.mergedInto===primaryId){
          x.mergedInto=null;
          x.source=clone(x.originalSource||x.source||{});
        }
      });
    };
    const resetRelated=(i)=>{
      const w=draft[i];
      if(w.mergedInto){resetGroup(w.mergedInto);return true}
      if(draft.some(x=>x.mergedInto===w.id)){resetGroup(w.id);return true}
      return false;
    };
    const mergeGroup=(i)=>{
      const group=activeGroup(i);
      if(group.length<2)return;
      resetRelated(i);
      const refreshed=activeGroup(i);
      const primaryIndex=refreshed[0],primary=draft[primaryIndex];
      const allSources=refreshed.flatMap(j=>sourceOccurrences(draft[j].source));
      const rank={high:3,medium:2,low:1};
      const sorted=allSources.slice().sort((a,b)=>(rank[String(b.confidence||'').toLowerCase()]||0)-(rank[String(a.confidence||'').toLowerCase()]||0));
      const best=clone(sorted[0]||primary.source||{});
      best.warnings=[...new Set(allSources.flatMap(x=>Array.isArray(x.warnings)?x.warnings:[]).map(String))];
      best.occurrences=allSources;
      primary.source=best;
      refreshed.slice(1).forEach(j=>{draft[j].mergedInto=primary.id});
    };
    const renderRows=()=>{
      view().innerHTML=`<section class="card ocr-review-card"><div class="hero-kicker"><span>프린트에서 찾았어요</span><span>단어 탐험 준비</span></div><h2>찾은 단어 확인하기</h2><p class="ocr-review-intro">사진에서 찾은 단어와 뜻이에요. 틀린 곳만 고치고, 같은 단어가 여러 곳에서 보이면 확인한 뒤 하나로 묶을 수 있어요.</p><div class="ocr-review-list">${draft.map((w,i)=>{
        const group=activeGroup(i),dupCount=group.length,isMerged=!!w.mergedInto;
        const ownsMerge=draft.some(x=>x.mergedInto===w.id);
        const isPrimary=dupCount>1&&!isMerged&&(ownsMerge||group[0]===i);
        const badge=isMerged?'<b class="ocr-duplicate-badge">묶음에 포함</b>':dupCount>1?`<b class="ocr-duplicate-badge">같은 단어 ${dupCount}곳</b>`:w.source?.warnings?.length?'<b>확인 필요</b>':'<small>확인해 주세요</small>';
        const occurrenceCount=Array.isArray(w.source?.occurrences)?w.source.occurrences.length:1;
        const mergeAction=isPrimary?`<button class="btn secondary full" data-review-merge="${i}" type="button">${ownsMerge?'중복 묶음 풀기':`같은 단어 ${dupCount}곳 하나로 묶기`}</button>`:'';
        const rowAction=isMerged?'<small class="ocr-merged-note">위 대표 단어의 출처 묶음에 포함돼요.</small>':`<button class="btn secondary full" data-review-toggle="${i}" type="button">${w.excluded?'다시 넣기':'이번 미션에서 빼기'}</button>`;
        return `<article class="ocr-review-row ${w.excluded?'is-excluded':''} ${isMerged?'is-merged':''}" data-review-row="${i}"><div class="ocr-review-row__head"><span>찾은 단어 ${i+1}</span>${badge}</div><div class="ocr-review-fields"><label><span>단어</span><input class="input" data-review-token="${i}" aria-label="OCR 단어 ${i+1}" value="${esc(w.token)}"></label><label><span>뜻</span><input class="input" data-review-meaning="${i}" aria-label="OCR 뜻 ${i+1}" value="${esc(w.meaning)}"></label></div>${w.source?.warnings?.length?`<p class="ocr-warning">사진 인식에서 확인이 필요한 흔적이 있어요. 직접 보고 맞는지 확인해 주세요.</p>`:''}<details class="ocr-source-details"><summary>인식 정보</summary><small>${esc(w.languageDomain)} · ${esc(w.source?.pageId||'source')} · confidence ${esc(w.source?.confidence||'medium')}${occurrenceCount>1?` · 출처 ${occurrenceCount}곳`:''}${w.source?.warnings?.length?` · ${esc(w.source.warnings.join(', '))}`:''}</small></details>${mergeAction}${rowAction}</article>`;
      }).join('')}</div><section class="ocr-review-next"><b>확인이 끝났나요?</b><span>묶은 단어도 모든 사진 출처를 보존한 채 탐험 미션 1개로 저장돼요.</span></section><button class="btn primary full" id="v2Commit" type="button">이 단어로 탐험 만들기</button></section>`;
      draft.forEach((w,i)=>{
        const token=$(`[data-review-token="${i}"]`),meaning=$(`[data-review-meaning="${i}"]`),toggle=$(`[data-review-toggle="${i}"]`),merge=$(`[data-review-merge="${i}"]`);
        const locked=w.excluded||!!w.mergedInto;
        token.disabled=locked;meaning.disabled=locked;
        token.oninput=()=>{
          draft[i].token=token.value.trim();
          draft[i].lexicalId=`${draft[i].token.toLowerCase()}::${draft[i].meaning.replace(/\s+/g,' ')}`;
          persistDraft();
        };
        meaning.oninput=()=>{
          draft[i].meaning=meaning.value.trim();
          draft[i].lexicalId=`${draft[i].token.toLowerCase()}::${draft[i].meaning.replace(/\s+/g,' ')}`;
          persistDraft();
        };
        token.onchange=()=>{if(resetRelated(i)){persistDraft();renderRows()}};
        meaning.onchange=()=>{if(resetRelated(i)){persistDraft();renderRows()}};
        if(toggle)toggle.onclick=()=>{
          resetRelated(i);
          draft[i].excluded=!draft[i].excluded;
          persistDraft();
          renderRows()
        };
        if(merge)merge.onclick=()=>{
          if(draft.some(x=>x.mergedInto===w.id))resetGroup(w.id);else mergeGroup(i);
          persistDraft();
          renderRows()
        };
      });
      $('#v2Commit').onclick=()=>{
        const kept=draft.filter(x=>!x.excluded&&!x.mergedInto&&x.token&&x.meaning).map(x=>{
          const copy=clone(x);delete copy.excluded;delete copy.mergedInto;delete copy.originalSource;return copy
        });
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
      const inferenceEvents=HideV2Store.snapshot().events||[];
      const skillProfile=globalThis.HideLanguageModel?.summarizeInferenceSkill?.(inferenceEvents)||null;
      const thinkingHtml=globalThis.HideLanguageModel?.renderStarterExplorationHtml?.(item,{encounteredWords:[],skillProfile},esc)||'';
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEMORIZE')}</span><b>${idx}/${total}</b></div><section class="card word-card"><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}</section>${thinkingHtml}<button id="v2Memorized" class="btn primary full">기억하고 찾아보기</button></section>`;
      bindThinkingTrail(m.id,w);
      $('#v2Memorized').onclick=()=>{HideV2Session.update(HideV2Learning.submitMemorize(session,m).session);render()};
      return;
    }

    if(session.stage==='FIRST_FIND'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('FIRST_FIND')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>뜻을 보고 단어를 기억에서 꺼내보세요.</p><div class="bigword">${esc(w.meaning)}</div><input id="v2Answer" class="input" aria-label="회상 답 입력" autocomplete="off" spellcheck="false"><div class="btn-row first-find-actions"><button id="v2Unsure" class="btn secondary" type="button">아직 안 떠올라</button><button id="v2Check" class="btn primary" type="button">기억 확인</button></div></section></section>`;
      $('#v2Check').onclick=()=>{
        const answer=$('#v2Answer').value.trim();
        if(!answer){setFlash('떠올린 단어를 입력하거나, 아직 안 떠오르면 알려주세요.');return}
        const r=HideV2Learning.checkFirstFind(session,m,answer);
        HideV2Session.update(r.session);
        setFlash(r.ok?'기억에서 찾았어요':r.support?'작은 단서로 한 번 더 찾아볼게요.':'잠깐 다시 만나고 다음 단서로 이어가요.');
        render()
      };
      $('#v2Unsure').onclick=()=>{
        const r=HideV2Learning.markFirstFindUnsure(session,m);
        HideV2Session.update(r.session);
        setFlash(r.support?'괜찮아요. 작은 단서로 한 번 더 찾아볼게요.':'괜찮아요. 잠깐 다시 만나고 이어가요.');
        render()
      };
      return;
    }

    if(session.stage==='FIRST_FIND_ASSIST'){
      const support=HideV2Learning.firstFindSupportPlan(w);
      if(!support){
        HideV2Session.update({...session,stage:'FIRST_FIND_RELEARN'});
        render();
        return;
      }
      const supportPrompt=support.type==='SOUND'
        ?'검증된 음을 단서로 글자를 다시 떠올려보세요.'
        :support.type==='MEANING_MAP'
          ?'검증된 뜻의 구조를 단서로 단어를 다시 떠올려보세요.'
          :'글자 골격을 보고 전체 단어를 다시 떠올려보세요.';
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('FIRST_FIND_ASSIST')}</span><b>${idx}/${total}</b></div><section class="card word-card first-find-assist"><p class="quest-overline">ONE SMALL CLUE</p><h2>${esc(support.label)}</h2><p>${esc(supportPrompt)}</p><div class="memory-trace"><b>${esc(support.label)}</b><span>${esc(support.cue)}</span></div>${support.sourceRef?`<small class="truth-source">출처 확인됨 · ${esc(support.sourceRef)}</small>`:''}<small>이 단서를 본 뒤 맞혀도 무힌트 회상 성공으로 세지 않아요.</small><input id="v2FirstFindAssistAnswer" class="input" aria-label="첫 찾기 도움 답 입력" autocomplete="off" spellcheck="false"><button id="v2FirstFindAssistCheck" class="btn primary full" type="button">단서로 다시 확인</button></section></section>`;
      $('#v2FirstFindAssistCheck').onclick=()=>{
        const answer=$('#v2FirstFindAssistAnswer').value.trim();
        if(!answer){setFlash('단서를 보고 떠올린 단어를 입력해 주세요.');return}
        const r=HideV2Learning.submitFirstFindAssist(session,m,answer);
        HideV2Session.update(r.session);
        setFlash(r.ok?'단서로 다시 찾았어요. 이제 뜻 단서로 이어가요.':'이번엔 단어를 잠깐 다시 보고 이어갈게요.');
        render()
      };
      return;
    }

    if(session.stage==='FIRST_FIND_RELEARN'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('FIRST_FIND_RELEARN')}</span><b>${idx}/${total}</b></div><section class="card word-card first-find-relearn"><p>방금 놓친 단어를 잠깐 다시 만나봐요.</p><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}<small>지금 보는 건 다시 익히는 시간이에요. 회상 성공으로 세지 않아요.</small><button id="v2FirstFindRehide" class="btn primary full">다시 숨기고 뜻 단서로</button></section></section>`;
      $('#v2FirstFindRehide').onclick=()=>{HideV2Session.update(HideV2Learning.submitFirstFindRelearn(session,m).session);render()};
      return;
    }

    if(session.stage==='MEANING'){
      const challenge=HideV2Learning.meaningChallenge(session,m);
      if(challenge){
        const title=challenge.direction==='MEANING_TO_TOKEN'?'뜻에서 단어 찾기':'단어에서 뜻 찾기';
        view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEANING')}</span><b>${idx}/${total}</b></div><section class="card word-card meaning-choice-card"><p class="quest-overline">MEANING CLUE</p><h2>${esc(title)}</h2><div class="bigword">${esc(challenge.prompt)}</div><div class="choice-grid">${challenge.options.map(x=>`<button class="choice meaning-choice" type="button" data-meaning-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div><small>여기는 뜻 연결을 빠르게 확인하는 단계예요. 선택형 성공은 회상 성공으로 세지 않아요.</small></section></section>`;
        view().querySelectorAll('[data-meaning-id]').forEach(btn=>{btn.onclick=()=>{
          const r=HideV2Learning.checkMeaningChoice(session,m,btn.dataset.meaningId||'');
          HideV2Session.update(r.session);
          setFlash(r.ok?'뜻 연결을 찾았어요':'헷갈린 짝을 바로 비교해볼게요.');
          render()
        }});
      }else{
        view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEANING')}</span><b>${idx}/${total}</b></div><section class="card word-card"><div class="bigword">${esc(w.token)}</div><input id="v2Meaning" class="input" aria-label="뜻 회상 입력" autocomplete="off"><button id="v2MeaningCheck" class="btn primary full">뜻 확인</button></section></section>`;
        $('#v2MeaningCheck').onclick=()=>{
          const answer=$('#v2Meaning').value.trim();
          if(!answer){setFlash('기억에서 떠올린 뜻을 입력해 주세요.');return}
          const r=HideV2Learning.checkMeaning(session,m,answer);
          HideV2Session.update(r.session);
          setFlash(r.ok?'뜻도 기억했어요':r.support?'문맥 단서로 한 번 더 찾아볼게요.':'뜻을 잠깐 다시 보고 이어갈게요.');
          render()
        };
      }
      return;
    }

    if(session.stage==='MEANING_CHOICE_REVIEW'){
      const mismatch=session.meaningMismatch;
      if(!mismatch||mismatch.wordId!==w.id){
        HideV2Session.update(HideV2Learning.submitMeaningChoiceReview(session,m).session);
        render();
        return;
      }
      const picked=mismatch.direction==='MEANING_TO_TOKEN'
        ?mismatch.selectedToken
        :mismatch.selectedMeaning;
      const correct=mismatch.direction==='MEANING_TO_TOKEN'
        ?mismatch.correctToken
        :mismatch.correctMeaning;
      const prompt=mismatch.direction==='MEANING_TO_TOKEN'
        ?w.meaning
        :w.token;
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEANING_CHOICE_REVIEW')}</span><b>${idx}/${total}</b></div><section class="card word-card meaning-choice-review"><p class="quest-overline">COMPARE</p><h2>헷갈린 연결을 한 번 비교해봐요</h2><div class="bigword">${esc(prompt)}</div><div class="choice-compare-grid"><div><small>내가 고른 연결</small><b>${esc(picked||'—')}</b></div><div><small>실제 연결</small><b>${esc(correct||'—')}</b></div></div><small>이 비교는 정답을 다시 보는 시간이에요. 회상 성공으로 세지 않아요.</small><button id="v2MeaningCompareDone" class="btn primary full" type="button">비교하고 연결 길로</button></section></section>`;
      $('#v2MeaningCompareDone').onclick=()=>{
        HideV2Session.update(HideV2Learning.submitMeaningChoiceReview(session,m).session);
        render()
      };
      return;
    }

    if(session.stage==='MEANING_ASSIST'){
      const support=HideV2Learning.meaningSupportPlan(w);
      if(!support){
        HideV2Session.update({...session,stage:'MEANING_RELEARN'});
        render();
        return;
      }
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEANING_ASSIST')}</span><b>${idx}/${total}</b></div><section class="card word-card meaning-assist"><p class="quest-overline">ONE SMALL CLUE</p><h2>${esc(support.label)}</h2><p>문맥을 보고 뜻을 다시 떠올려보세요.</p><div class="memory-trace"><b>${esc(support.label)}</b><span>${esc(support.cue)}</span></div>${support.sourceRef?`<small class="truth-source">출처 확인됨 · ${esc(support.sourceRef)}</small>`:''}<small>이 단서를 본 뒤 맞혀도 무힌트 뜻 회상 성공으로 세지 않아요.</small><input id="v2MeaningAssistAnswer" class="input" aria-label="뜻 도움 답 입력" autocomplete="off"><button id="v2MeaningAssistCheck" class="btn primary full" type="button">단서로 뜻 다시 확인</button></section></section>`;
      $('#v2MeaningAssistCheck').onclick=()=>{
        const answer=$('#v2MeaningAssistAnswer').value.trim();
        if(!answer){setFlash('단서를 보고 떠올린 뜻을 입력해 주세요.');return}
        const r=HideV2Learning.submitMeaningAssist(session,m,answer);
        HideV2Session.update(r.session);
        setFlash(r.ok?'단서로 뜻을 다시 찾았어요.':'이번엔 뜻을 잠깐 다시 보고 이어갈게요.');
        render()
      };
      return;
    }

    if(session.stage==='MEANING_RELEARN'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('MEANING_RELEARN')}</span><b>${idx}/${total}</b></div><section class="card word-card meaning-relearn"><p>방금 놓친 뜻을 잠깐 다시 만나봐요.</p><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2><small>지금 보는 건 다시 익히는 시간이에요. 뜻 회상 성공으로 세지 않아요.</small><button id="v2MeaningRehide" class="btn primary full" type="button">다시 숨기고 연결 길로</button></section></section>`;
      $('#v2MeaningRehide').onclick=()=>{HideV2Session.update(HideV2Learning.submitMeaningRelearn(session,m).session);render()};
      return;
    }

    if(session.stage==='DOMAIN_EXTENSION'){
      if(w.languageDomain==='KOREAN'){
        const contextEvidence=globalThis.HideLanguageModel?.normalizeContextEvidence?.(w.contextEvidence,'KOREAN')||null;
        const evidenceDone=Number(session.attempts?.[`${w.id}:EVIDENCE_TRAIL`]||0)>0;
        if(contextEvidence&&!evidenceDone){
          view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,'EVIDENCE_TRAIL')}<div class="learn-head"><span class="phase-chip">근거 찾기</span><b>${idx}/${total}</b></div><section class="card word-card korean-evidence-card"><h2>문맥에서 뜻의 근거 찾기</h2><p class="example">${esc(contextEvidence.contextText)}</p><p>“${esc(w.token)}”의 뜻을 이해하는 데 가장 직접적인 근거를 골라보세요.</p><div class="choice-grid">${contextEvidence.candidates.map(x=>`<button class="choice korean-evidence-choice" type="button" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div><small class="truth-source">출처 확인됨 · ${esc(contextEvidence.sourceType)}</small></section></section>`;
          view().querySelectorAll('.korean-evidence-choice').forEach(btn=>{btn.onclick=()=>{const r=HideV2Learning.submitDomainExtension(session,m,{selectedEvidence:btn.dataset.value||''});HideV2Session.update(r.session);setFlash(r.ok?'뜻의 근거를 찾았어요':'이 근거는 아니에요. 표현 길에서 뜻을 다시 써보며 이어가요.');render()}});
        }else{
          view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">표현 길</span><b>${idx}/${total}</b></div><section class="card"><h2>내 문장으로 표현하기</h2><p>“${esc(w.token)}”을 넣어 짧은 문장을 만들어보세요.</p><textarea id="v2Response" class="input" rows="3" aria-label="국어 문장 표현"></textarea><button id="v2DomainDone" class="btn primary full">표현 남기기</button><div id="v2ResponseFeedback" class="example response-feedback" hidden aria-live="polite"></div></section></section>`;
          $('#v2DomainDone').onclick=()=>{
            const text=$('#v2Response').value.trim();
            if(text.length<4){setFlash('짧은 문장으로 표현해 주세요.');return}
            const r=HideV2Learning.submitDomainExtension(session,m,{responseText:text});
            const feedback=$('#v2ResponseFeedback');
            feedback.textContent=r.feedback?.message||'내 문장 표현을 기억 흔적으로 남겼어요.';
            feedback.hidden=false;
            $('#v2Response').disabled=true;
            $('#v2DomainDone').disabled=true;
            setTimeout(()=>{HideV2Session.update(r.session);render()},340);
          };
        }
      }else if(w.languageDomain==='HANJA'&&w.soundEvidence){
        view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">소리 찾기</span><b>${idx}/${total}</b></div><section class="card"><div class="bigword">${esc(w.token)}</div><input id="v2Sound" class="input" aria-label="한자 음 입력" autocomplete="off"><button id="v2DomainDone" class="btn primary full">음 기억 확인</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{
          const sound=$('#v2Sound').value.trim();
          if(!sound){setFlash('기억에서 떠올린 음을 입력해 주세요.');return}
          const r=HideV2Learning.submitDomainExtension(session,m,{sound});
          HideV2Session.update(r.session);
          setFlash(r.ok===false?'음을 잠깐 다시 만나고 다시 찾아볼게요.':'음을 기억에서 찾았어요.');
          render()
        };
      }else{
        const inferenceEvents=HideV2Store.snapshot().events||[];
        const skillProfile=globalThis.HideLanguageModel?.summarizeInferenceSkill?.(inferenceEvents)||null;
        const guide=globalThis.HideLanguageModel?.connectionGuidance?.({
          eng:w.token,word:w.token,token:w.token,kor:w.meaning,meaning:w.meaning,
          languageDomain:w.languageDomain,meaningMap:w.meaningMap
        },skillProfile)||null;
        const guideHtml=guide
          ?`<aside class="prior-skill-cue connection-guidance" aria-label="연결 길 개인화 단서"><small>내 추론 기록에서 자주 맞았던 길</small><b>${esc(guide.title)}</b><span>${esc(guide.cue)}</span><em>${esc(guide.clueLabel)} · 참고용</em></aside>`
          :'';
        view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">연결 길</span><b>${idx}/${total}</b></div><section class="card">${guideHtml}${globalThis.HideLanguageModel?.renderMeaningMapHtml?.({eng:w.token,word:w.token,languageDomain:w.languageDomain,meaningMap:w.meaningMap},esc)||`<p>${esc(w.example||w.meaning)}</p>`}<button id="v2DomainDone" class="btn primary full">다음</button></section></section>`;
        $('#v2DomainDone').onclick=()=>{
          HideV2Session.update(HideV2Learning.submitDomainExtension(session,m,{connectionGuidance:guide}).session);
          render()
        };
      }
      return;
    }

    if(session.stage==='SOUND_FIND_RELEARN'){
      const sound=w?.soundEvidence;
      if(!sound?.verified||!sound.reading){
        HideV2Session.update({...session,stage:'FINAL_SEEK'});
        render();
        return;
      }
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('SOUND_FIND_RELEARN')}</span><b>${idx}/${total}</b></div><section class="card word-card sound-relearn-card"><p>방금 놓친 음을 잠깐 다시 만나봐요.</p><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(sound.reading)}</h2><small>검증된 음만 보여줘요. 지금 보는 것은 회상 성공으로 세지 않아요.</small><button id="v2SoundRehide" class="btn primary full" type="button">다시 숨기고 소리 찾기</button></section></section>`;
      $('#v2SoundRehide').onclick=()=>{
        HideV2Session.update(HideV2Learning.submitSoundRelearn(session,m).session);
        render()
      };
      return;
    }

    if(session.stage==='HIDDEN_WORDS'){
      const plan=HideV2Learning.hiddenWordsPlan(w,session);
      const prompt=plan.mode==='SOUND'
        ?'이 글자의 음을 기억에서 다시 꺼내보세요.'
        :plan.mode==='MEANING'
          ?'단어를 보고 뜻을 다시 구분해보세요.'
          :plan.mode==='SHAPE'
            ?'글자 골격을 보고 전체 단어를 다시 꺼내보세요.'
            :'뜻을 보고 단어를 힌트 없이 다시 꺼내보세요.';
      const cue=plan.prompt||w.meaning;
      const aria=plan.mode==='SOUND'?'숨은 단어 음 답 입력':plan.mode==='MEANING'?'숨은 단어 뜻 답 입력':'숨은 단어 보강 답 입력';
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('HIDDEN_WORDS')}</span><b>${idx}/${total}</b></div><section class="card word-card hidden-words-card"><p class="quest-overline">HIDDEN WORDS</p><h2>${esc(plan.label)}</h2><p>${esc(prompt)}</p><div class="bigword">${esc(cue)}</div><small>보강 이유 · ${esc(plan.primaryReason?.label||'기억 흔적')}</small><input id="v2HiddenAnswer" class="input" aria-label="${esc(aria)}" autocomplete="off" spellcheck="false"><button id="v2HiddenCheck" class="btn primary full" type="button">보강 기억 확인</button></section></section>`;
      $('#v2HiddenCheck').onclick=()=>{
        const answer=$('#v2HiddenAnswer').value.trim();
        if(!answer){setFlash('기억에서 떠올린 답을 입력해 주세요.');return}
        const r=HideV2Learning.submitHiddenWords(session,m,{answer});
        HideV2Session.update(r.session);
        setFlash(r.ok?'보강 기억을 찾았어요':r.support?'작은 단서로 한 번 더 찾아볼게요.':'잠깐 다시 만나고 마지막 찾기로 갈게요.');
        render()
      };
      return;
    }

    if(session.stage==='HIDDEN_WORDS_ASSIST'){
      const plan=HideV2Learning.hiddenWordsPlan(w);
      const support=HideV2Learning.hiddenWordsSupportPlan(w,plan);
      if(!support){
        HideV2Session.update({...session,stage:'HIDDEN_WORDS_RELEARN'});
        render();
        return;
      }
      const prompt=plan.mode==='MEANING'
        ?'문장 단서를 보고 뜻을 다시 떠올려보세요.'
        :'글자 골격 단서를 보고 전체 단어를 다시 떠올려보세요.';
      const aria=plan.mode==='MEANING'?'숨은 단어 도움 뜻 답 입력':'숨은 단어 도움 답 입력';
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('HIDDEN_WORDS_ASSIST')}</span><b>${idx}/${total}</b></div><section class="card word-card hidden-words-assist"><p class="quest-overline">ONE SMALL CLUE</p><h2>${esc(support.label)}</h2><p>${esc(prompt)}</p><div class="memory-trace"><b>${esc(support.label)}</b><span>${esc(support.cue)}</span></div><small>이 단서를 본 뒤 맞혀도 바로 무힌트 회상으로 세지 않아요. 마지막 찾기에서 다시 확인해요.</small><input id="v2HiddenAssistAnswer" class="input" aria-label="${esc(aria)}" autocomplete="off" spellcheck="false"><button id="v2HiddenAssistCheck" class="btn primary full" type="button">단서로 다시 확인</button></section></section>`;
      $('#v2HiddenAssistCheck').onclick=()=>{
        const answer=$('#v2HiddenAssistAnswer').value.trim();
        if(!answer){setFlash('단서를 보고 떠올린 답을 입력해 주세요.');return}
        const r=HideV2Learning.submitHiddenWordsAssist(session,m,{answer});
        HideV2Session.update(r.session);
        setFlash(r.ok?'단서로 다시 찾았어요. 마지막엔 무힌트로 확인해요.':'이번엔 정답을 잠깐 다시 보고 마지막 찾기로 갈게요.');
        render()
      };
      return;
    }

    if(session.stage==='HIDDEN_WORDS_RELEARN'){
      const plan=HideV2Learning.hiddenWordsPlan(w);
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('HIDDEN_WORDS_RELEARN')}</span><b>${idx}/${total}</b></div><section class="card word-card hidden-words-relearn"><p>보강에서 놓친 단어를 한 번만 다시 보고 마지막 찾기로 가요.</p><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}<small>${esc(plan.label)} · 지금 보는 것은 회상 성공으로 세지 않아요.</small><button id="v2HiddenRehide" class="btn primary full" type="button">다시 숨기고 마지막 찾기</button></section></section>`;
      $('#v2HiddenRehide').onclick=()=>{HideV2Session.update(HideV2Learning.submitHiddenWordsRelearn(session,m).session);render()};
      return;
    }

    if(session.stage==='FINAL_SEEK'){
      const supportPlan=globalThis.HideLanguageModel?.starterExploration?.({
        eng:w.token,word:w.token,kor:w.meaning,languageDomain:w.languageDomain,meaningMap:w.meaningMap
      },{encounteredWords:[]})||null;
      const supportUsed=Number(session.attempts?.[`${w.id}:FINAL_SEEK_ASSIST`]||0)>0;
      const supportHtml=supportPlan?.scene
        ?`<section class="final-support"><button id="v2FinalSupport" class="btn secondary full" type="button" ${supportUsed?'disabled':''}>기억 장면 보기</button><div id="v2FinalSupportScene" class="final-support__scene" ${supportUsed?'':'hidden'}><b>기억 장면</b><span>${esc(supportPlan.scene)}</span><small>이 도움을 본 뒤의 성공은 바로 장기 회상으로 세지 않고, 한 번 더 무힌트로 확인해요.</small></div></section>`
        :'';
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('FINAL_SEEK')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>마지막으로 단어를 기억에서 다시 꺼내보세요.</p><div class="bigword">${esc(w.meaning)}</div><input id="v2Final" class="input" aria-label="최종 회상 답 입력" autocomplete="off" spellcheck="false">${supportHtml}<button id="v2FinalCheck" class="btn primary full">마지막 기억 확인</button></section></section>`;
      if($('#v2FinalSupport'))$('#v2FinalSupport').onclick=()=>{
        const r=HideV2Learning.useFinalSupport(session,m,{supportType:'SEMANTIC_SCENE',sourceType:supportPlan.sourceType||'CURATED_SEMANTIC_SUPPORT',sourceRef:supportPlan.sourceRef||null});
        HideV2Session.update(r.session);
        $('#v2FinalSupport').disabled=true;
        const scene=$('#v2FinalSupportScene');if(scene)scene.hidden=false;
      };
      $('#v2FinalCheck').onclick=()=>{
        const live=HideV2Session.current()?.session||session;
        const r=HideV2Learning.checkFinalSeek(live,m,$('#v2Final').value);
        HideV2Session.update(r.session);
        setFlash(r.ok?(r.assisted?'도움을 썼으니 한 번 더 무힌트로 찾아봐요.':'마지막 찾기 성공'):(r.reconstruction?'글자 골격으로 한 번 더 조립해볼게요.':'괜찮아요. 잠깐 다시 보고 한 번 더 찾아봐요.'));
        render()
      };
      return;
    }

    if(session.stage==='FINAL_SEEK_RECONSTRUCT'){
      const plan=HideV2Learning.finalReconstructionPlan(w);
      if(!plan){
        HideV2Session.update({...session,stage:'SEEK_AGAIN_RELEARN'});
        render();
        return;
      }
      const chunkMode=plan.type==='CHUNK_ASSEMBLY'&&Array.isArray(plan.tiles)&&plan.tiles.length>0;
      const title=chunkMode?'글자 조각으로 다시 조립하기':'단서로 다시 재구성하기';
      const prompt=chunkMode
        ?'아래 조각은 어근이 아니라 단순한 글자 묶음이에요. 순서를 생각해서 단어를 다시 만들어봐요.'
        :plan.type==='VERIFIED_SOUND_RECONSTRUCTION'
          ?'검증된 음을 단서로 한자를 다시 떠올려보세요.'
          :'검증된 뜻의 구조를 단서로 단어를 다시 떠올려보세요.';
      const builder=chunkMode
        ?`<div class="reconstruct-builder" aria-label="글자 조각 조립"><div class="reconstruct-output"><small>내 조립</small><b id="v2ReconstructPreview">—</b></div><div class="reconstruct-tiles">${plan.tiles.map((chunk,i)=>`<button class="btn secondary reconstruct-tile" type="button" data-chunk="${esc(chunk)}" data-tile-index="${i}">${esc(chunk)}</button>`).join('')}</div><div class="btn-row reconstruct-tools"><button id="v2ReconstructUndo" class="btn ghost" type="button">한 조각 지우기</button><button id="v2ReconstructReset" class="btn ghost" type="button">다시 시작</button></div></div>`
        :'';
      const truth=plan.sourceRef?`<small class="truth-source">출처 확인됨 · ${esc(plan.sourceRef)}</small>`:'';
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('FINAL_SEEK_RECONSTRUCT')}</span><b>${idx}/${total}</b></div><section class="card word-card final-reconstruct-card"><p class="quest-overline">RECONSTRUCT</p><h2>${esc(title)}</h2><p>${esc(prompt)}</p><div class="memory-trace"><b>${esc(plan.label)}</b><span>${esc(plan.cue)}</span></div>${truth}${builder}<small>${chunkMode?'조각은 글자 순서를 떠올리게 돕는 장치예요.':'이 단서는 검증된 자료를 바탕으로 한 재구성 도움이에요.'} 성공해도 바로 무힌트 회상으로 세지 않고, 다음 다시 찾기에서 확인해요.</small><input id="v2FinalReconstruct" class="input" aria-label="재구성 답 입력" autocomplete="off" spellcheck="false"><button id="v2FinalReconstructCheck" class="btn primary full" type="button">${chunkMode?'조립 기억 확인':'재구성 기억 확인'}</button></section></section>`;
      const reconstructInput=$('#v2FinalReconstruct');
      if(chunkMode){
        const preview=$('#v2ReconstructPreview');
        const selected=[];
        const syncReconstruct=()=>{
          const text=selected.join('');
          reconstructInput.value=text;
          preview.textContent=text||'—';
        };
        view().querySelectorAll('.reconstruct-tile').forEach(btn=>{btn.onclick=()=>{
          selected.push(btn.dataset.chunk||'');
          btn.disabled=true;
          syncReconstruct()
        }});
        $('#v2ReconstructUndo').onclick=()=>{
          if(!selected.length)return;
          selected.pop();
          view().querySelectorAll('.reconstruct-tile').forEach(x=>x.disabled=false);
          const used=new Map();
          selected.forEach(chunk=>used.set(chunk,(used.get(chunk)||0)+1));
          view().querySelectorAll('.reconstruct-tile').forEach(x=>{
            const chunk=x.dataset.chunk||'',n=used.get(chunk)||0;
            if(n>0){x.disabled=true;used.set(chunk,n-1)}
          });
          syncReconstruct()
        };
        $('#v2ReconstructReset').onclick=()=>{
          selected.length=0;
          view().querySelectorAll('.reconstruct-tile').forEach(x=>x.disabled=false);
          syncReconstruct()
        };
        reconstructInput.oninput=()=>{preview.textContent=reconstructInput.value.trim()||'—'};
      }
      $('#v2FinalReconstructCheck').onclick=()=>{
        const answer=reconstructInput.value.trim();
        if(!answer){setFlash(chunkMode?'글자 조각을 보고 떠올린 단어를 입력해 주세요.':'단서를 보고 떠올린 답을 입력해 주세요.');return}
        const r=HideV2Learning.submitFinalReconstruction(session,m,answer);
        HideV2Session.update(r.session);
        setFlash(r.ok?'재구성했어요. 이제 힌트 없이 다시 찾아봐요.':'이번엔 단어를 잠깐 다시 보고 다시 찾아볼게요.');
        render()
      };
      return;
    }

    if(session.stage==='SEEK_AGAIN_ASSIST'){
      const support=HideV2Learning.firstFindSupportPlan(w);
      if(!support){
        HideV2Session.update({...session,stage:'SEEK_AGAIN_RELEARN'});
        render();
        return;
      }
      const prompt=support.type==='SOUND'
        ?'검증된 음을 단서로 글자를 다시 떠올려보세요.'
        :support.type==='MEANING_MAP'
          ?'검증된 뜻의 구조를 단서로 단어를 다시 떠올려보세요.'
          :'글자 골격을 보고 단어를 다시 떠올려보세요.';
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('SEEK_AGAIN_ASSIST')}</span><b>${idx}/${total}</b></div><section class="card word-card seek-again-assist"><p class="quest-overline">ONE LAST CLUE</p><h2>${esc(support.label)}</h2><p>${esc(prompt)}</p><div class="memory-trace"><b>${esc(support.label)}</b><span>${esc(support.cue)}</span></div>${support.sourceRef?`<small class="truth-source">출처 확인됨 · ${esc(support.sourceRef)}</small>`:''}<small>이 단서를 보고 맞혀도 아직 무힌트 성공은 아니에요. 다음 화면에서 다시 혼자 찾아봐요.</small><input id="v2SeekAgainAssist" class="input" aria-label="다시 찾기 도움 답 입력" autocomplete="off" spellcheck="false"><button id="v2SeekAgainAssistCheck" class="btn primary full" type="button">단서로 다시 확인</button></section></section>`;
      $('#v2SeekAgainAssistCheck').onclick=()=>{
        const answer=$('#v2SeekAgainAssist').value.trim();
        if(!answer){setFlash('단서를 보고 떠올린 답을 입력해 주세요.');return}
        const r=HideV2Learning.submitSeekAgainAssist(session,m,answer);
        HideV2Session.update(r.session);
        setFlash(r.ok?'단서로 찾았어요. 이제 힌트 없이 한 번 더 확인해요.':'이번엔 단어를 잠깐 다시 보고 다시 찾아봐요.');
        render()
      };
      return;
    }

    if(session.stage==='SEEK_AGAIN_RELEARN'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('SEEK_AGAIN_RELEARN')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>놓친 단어를 잠깐 다시 만나봐요.</p><div class="bigword">${esc(w.token)}</div><h2 style="text-align:center">${esc(w.meaning)}</h2>${w.example?`<p class="example">${esc(w.example)}</p>`:''}<button id="v2Rehide" class="btn primary full">다시 숨기기</button></section></section>`;
      $('#v2Rehide').onclick=()=>{HideV2Session.update(HideV2Learning.submitSeekAgainRelearn(session,m).session);render()};
      return;
    }

    if(session.stage==='SEEK_AGAIN'){
      view().innerHTML=`<section class="learning-shell">${progressHtml(idx,total)}${journeyHtml(session.stage)}${crewHtml(w,session.stage)}<div class="learn-head"><span class="phase-chip">${childStageLabel('SEEK_AGAIN')}</span><b>${idx}/${total}</b></div><section class="card word-card"><p>이번에는 다시 찾을 수 있을까요?</p><div class="bigword">${esc(w.meaning)}</div><input id="v2SeekAgain" class="input" aria-label="다시 찾기 답 입력" autocomplete="off" spellcheck="false"><button id="v2SeekAgainCheck" class="btn primary full">다시 찾기</button></section></section>`;
      $('#v2SeekAgainCheck').onclick=()=>{
        const answer=$('#v2SeekAgain').value.trim();
        if(!answer){setFlash('기억에서 떠올린 단어를 입력해 주세요.');return}
        const r=HideV2Learning.checkSeekAgain(session,m,answer);
        HideV2Session.update(r.session);
        setFlash(r.ok?'다시 찾았어요':r.support?'마지막으로 작은 단서 하나만 써볼게요.':'한 번 더 보고 다시 찾아봐요.');
        render()
      };
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
    const expressionReviews=globalThis.HideV2ReadyBridge?.expressionReviewCandidates?.(m,scopedIds)||[];
    const returnButton=readyContext.return_target?'<button id="v2ReturnReady" class="btn primary full" style="margin-top:8px">Ready & Set으로 돌아가기</button>':'';
    const expressionReviewHtml=expressionReviews.length
      ?`<section class="completion-next expression-review-note"><span>함께 확인할 표현</span><b>${expressionReviews.length}개 문장이 있어요.</b><small>목표 단어 사용 여부만 확인됐고, 문장의 의미 정확도는 부모·교사와 함께 확인해요.</small></section>`
      :'';
    const crew=globalThis.HideV2Crew?.presentation?.({screen:'COMPLETE',mission:m})||{displayName:'탐험대원',avatarText:'탐'};
    const exploredCount=scopedIds?.length||m.items.length;
    const achievement=trail.recoveredTodayCount>0
      ?('오늘 '+exploredCount+'개 단어를 끝까지 찾았고, 놓쳤던 '+trail.recoveredTodayCount+'개도 다시 찾아냈어요.')
      :('오늘 '+exploredCount+'개 단어의 탐험 길을 끝까지 걸었어요.');
    const nextStep=summary.reviewAdvisories.length>0
      ?('기억 사다리에 다시 만나볼 단어가 '+summary.reviewAdvisories.length+'개 있어요. 날짜는 Ready & Set이 정하고, 여기서는 기억 흔적만 보여줘요.')
      :'지금은 다시 볼 단어 신호가 없어요. 다음 탐험에서도 스스로 떠오르는지 확인해봐요.';
    view().innerHTML=`<section class="card tint-leaf completion-card completion-card--story"><div class="completion-mark" aria-hidden="true">✦</div><p class="quest-overline">MISSION COMPLETE</p><h1>탐험 완료</h1><p class="completion-achievement">${esc(achievement)}</p><div class="completion-crew"><span class="completion-crew__avatar">${esc(crew.avatarText||'탐')}</span><span><b>${esc(crew.displayName||'탐험대원')}</b><small>오늘 길을 끝까지 함께 왔어요.</small></span></div><section class="completion-next"><span>다음 탐험</span><b>${esc(nextStep)}</b></section>${expressionReviewHtml}<button id="v2MemoryLadder" class="btn primary full">기억 사다리 보기</button><button id="v2Home" class="btn secondary full">홈으로</button>${returnButton}<details class="completion-details"><summary>오늘의 기록 보기</summary><div class="grid3"><div class="status-pill"><b>${trail.trailMastery}%</b><span>길 익힘</span></div><div class="status-pill"><b>${summary.averageMemoryStrength}%</b><span>기억 힘</span></div><div class="status-pill"><b>${trail.recoveredTodayCount}</b><span>다시 찾음</span></div></div><div class="metric"><span>다음에 다시 볼 단어</span><b>${summary.reviewAdvisories.length}</b></div></details></section>`;
    globalThis.HideV2ReadyBridge?.emitTaskEvent?.('TASK_COMPLETED');
    $('#v2MemoryLadder').onclick=()=>{HideV2Session.clear();HideV2Router.go('records')};
    $('#v2Home').onclick=()=>{HideV2Session.clear();HideV2Router.go('home')};
    if($('#v2ReturnReady'))$('#v2ReturnReady').onclick=()=>globalThis.HideV2ReadyBridge?.returnToReady?.();
  }

  function renderOcrFailure(result){
    const retained=(result?.rows||[]).length;
    const title=result?.retryAttempt?'아직 못 찾은 페이지가 있어요':'사진에서 단어를 다 찾지 못했어요';
    const lead=retained
      ?('이미 찾은 '+retained+'개 결과는 그대로 보관했어요. 못 찾은 페이지만 다시 확인하면 돼요.')
      :'원본 사진은 그대로 남아 있어요. 다시 확인할 수 있는 페이지만 골라 재시도해요.';
    view().innerHTML=`<section class="card ocr-recovery-card"><p class="quest-overline">KEEP WHAT WE FOUND</p><h2>${esc(title)}</h2><p class="ocr-recovery-lead">${esc(lead)}</p>${result?.retryable?'<button id="v2RetryOcr" class="btn primary full">못 찾은 페이지만 다시 보기</button>':''}<button id="v2Back" class="btn secondary full">홈으로 돌아가기</button><details class="ocr-error-details"><summary>오류 정보</summary><small>${esc(result?.reason||'OCR_ANALYSIS_FAILED')}</small></details></section>`;
    if($('#v2RetryOcr'))$('#v2RetryOcr').onclick=async()=>{
      view().innerHTML='<section class="card ocr-recovery-card"><p class="quest-overline">TRY AGAIN</p><h2>못 찾은 페이지만 다시 보고 있어요</h2><p>이미 찾은 결과는 그대로 두고, 실패했던 페이지만 다시 확인해요.</p></section>';
      const retry=await HideV2Capture.analyzePending();
      if(retry.ok){review(retry.rows);return}
      renderOcrFailure({...retry,retryAttempt:true});
    };
    $('#v2Back').onclick=()=>HideV2Router.go('home');
  }

  async function onFiles(files){
    view().innerHTML='<section class="card ocr-recovery-card"><p class="quest-overline">FIND WORDS</p><h2>프린트에서 단어를 찾고 있어요</h2><p>원본 사진을 기준으로 단어와 뜻을 찾아 탐험 준비를 하고 있어요.</p></section>';
    const r=await HideV2Capture.analyzeFiles(files);
    if(!r.ok){renderOcrFailure(r);return}
    review(r.rows);
  }

  function missions(){
    const list=HideV2Mission.listMissions(),activeId=HideV2Store.snapshot().activeMissionId;
    const missionGroup=m=>m.status==='ARCHIVED'?'ARCHIVED':m.status==='COMPLETED'?'COMPLETED':'OPEN';
    const missionStateRank=state=>({OPEN:0,COMPLETED:1,ARCHIVED:2})[state]??3;
    const mapSummary=list.length
      ?(list.some(x=>x.id===activeId)?'지금 이어갈 탐험이 맨 앞에 있어요. 끝난 탐험은 뒤에서 조용히 기다려요.':'이어갈 탐험을 하나 골라 오늘의 길을 정해봐요.')
      :'새 프린트를 가져오면 첫 탐험 길이 여기 생겨요.';
    view().innerHTML=`<section class="screen-head mission-map-head"><p class="quest-overline">MISSION MAP</p><h1>오늘의 탐험 지도</h1><p>${esc(mapSummary)}</p></section>${list.length?`<section class="mission-find-tools" aria-label="탐험 미션 찾기"><label><span>탐험 찾기</span><input id="v2MissionSearch" class="input" type="search" placeholder="미션 이름 또는 단어 검색" aria-label="탐험 미션 검색"></label><label class="mission-sort"><span>탐험 순서</span><select id="v2MissionSort" class="input" aria-label="탐험 미션 정렬"><option value="SMART">오늘 길 우선</option><option value="RECENT">최근 활동순</option><option value="NAME">이름순</option><option value="SIZE">단어 많은 순</option></select></label><div class="mission-filter-row" role="group" aria-label="탐험 상태 필터"><button class="btn ghost is-active" type="button" data-mission-filter="ALL">전체</button><button class="btn ghost" type="button" data-mission-filter="OPEN">이어가기</button><button class="btn ghost" type="button" data-mission-filter="COMPLETED">끝낸 탐험</button><button class="btn ghost" type="button" data-mission-filter="ARCHIVED">보관함</button></div><small id="v2MissionFilterCount" aria-live="polite">${list.length}개 탐험 보기</small><div class="mission-bulk-tools" aria-label="선택 미션 정리"><span id="v2MissionSelectedCount">0개 선택</span><div class="btn-row"><button id="v2BulkArchive" class="btn ghost" type="button" disabled>선택 보관</button><button id="v2BulkDelete" class="btn ghost danger-lite" type="button" disabled>선택 삭제</button><button id="v2BulkClear" class="btn ghost" type="button" disabled>선택 해제</button></div></div></section>`:''}<section class="mission-path" aria-label="탐험 미션 지도">${list.length?list.map((m,i)=>`<article class="mission-card mission-map-card ${m.id===activeId?'is-active':''}" data-mission-id="${esc(m.id)}" data-mission-state="${missionGroup(m)}" data-mission-active="${m.id===activeId?'1':'0'}" data-mission-updated="${esc(m.updatedAt||'')}" data-mission-title="${esc(String(m.title||'').toLowerCase())}" data-mission-size="${m.items.length}" data-mission-text="${esc((m.title+" "+m.items.map(x=>x.token+" "+x.meaning).join(" ")).toLowerCase())}"><label class="mission-select"><input type="checkbox" data-mission-select="${esc(m.id)}" aria-label="${esc(m.title)} 선택"><span>선택</span></label><div class="mission-map-marker" aria-hidden="true"><span>${i+1}</span></div><div class="mission-card__main"><span class="mission-card__status">${missionStatusLabel(m.status)}</span><h2>${esc(m.title)}</h2><p>${m.items.length}개의 숨은 단어 · ${m.id===activeId?'지금 이어갈 길':'다른 탐험 길'}</p></div><div class="mission-map-actions"><button class="btn primary" data-action="open" data-id="${esc(m.id)}">${m.id===activeId?'이어서 탐험':'이 길 선택'}</button><details class="mission-tools"><summary>정리 도구</summary><div class="mission-card__actions"><button class="btn ghost" data-action="rename" data-id="${esc(m.id)}">이름 바꾸기</button><button class="btn ghost" data-action="archive" data-id="${esc(m.id)}">보관</button><button class="btn ghost danger-lite" data-action="delete" data-id="${esc(m.id)}">삭제</button></div></details></div></article>`).join(''):'<div class="empty-state"><b>아직 탐험 길이 없어요</b><p>홈에서 프린트 사진을 추가하면 첫 미션을 만들 수 있어요.</p></div>'}</section><button class="btn secondary full" id="v2MissionHome">홈으로</button>`;
    $('#v2MissionHome').onclick=()=>HideV2Router.go('home');
    let activeMissionFilter='ALL';
    let activeMissionSort='SMART';
    const applyMissionSort=()=>{
      const path=$('.mission-path');
      if(!path)return;
      const cards=[...view().querySelectorAll('[data-mission-state]')];
      const compare=(a,b)=>{
        if(activeMissionSort==='NAME'){
          const byName=String(a.dataset.missionTitle||'').localeCompare(String(b.dataset.missionTitle||''),'ko');
          return byName||String(b.dataset.missionUpdated||'').localeCompare(String(a.dataset.missionUpdated||''));
        }
        if(activeMissionSort==='SIZE'){
          const bySize=Number(b.dataset.missionSize||0)-Number(a.dataset.missionSize||0);
          return bySize||String(b.dataset.missionUpdated||'').localeCompare(String(a.dataset.missionUpdated||''));
        }
        if(activeMissionSort==='RECENT'){
          return String(b.dataset.missionUpdated||'').localeCompare(String(a.dataset.missionUpdated||''));
        }
        const activeDelta=Number(b.dataset.missionActive||0)-Number(a.dataset.missionActive||0);
        if(activeDelta)return activeDelta;
        const stateDelta=missionStateRank(a.dataset.missionState)-missionStateRank(b.dataset.missionState);
        if(stateDelta)return stateDelta;
        return String(b.dataset.missionUpdated||'').localeCompare(String(a.dataset.missionUpdated||''));
      };
      cards.sort(compare).forEach((card,index)=>{
        path.appendChild(card);
        const marker=card.querySelector('.mission-map-marker span');
        if(marker)marker.textContent=String(index+1);
      });
    };
    const applyMissionFilter=()=>{
      const q=String($('#v2MissionSearch')?.value||'').trim().toLowerCase();
      let visible=0;
      view().querySelectorAll('[data-mission-state]').forEach(card=>{
        const stateMatch=activeMissionFilter==='ALL'||card.dataset.missionState===activeMissionFilter;
        const textMatch=!q||String(card.dataset.missionText||'').includes(q);
        const show=stateMatch&&textMatch;
        card.hidden=!show;
        card.style.display=show?'':'none';
        if(show)visible++;
      });
      const count=$('#v2MissionFilterCount');
      if(count)count.textContent=`${visible}개 탐험 보기`;
    };
    if($('#v2MissionSearch'))$('#v2MissionSearch').oninput=applyMissionFilter;
    if($('#v2MissionSort'))$('#v2MissionSort').onchange=()=>{
      activeMissionSort=$('#v2MissionSort').value||'SMART';
      applyMissionSort();
      applyMissionFilter();
    };
    applyMissionSort();
    const selectedMissionIds=()=>[...view().querySelectorAll('[data-mission-select]:checked')].map(x=>x.dataset.missionSelect).filter(Boolean);
    const refreshMissionBulk=()=>{
      const n=selectedMissionIds().length;
      const label=$('#v2MissionSelectedCount');
      if(label)label.textContent=n+'개 선택';
      ['#v2BulkArchive','#v2BulkDelete','#v2BulkClear'].forEach(sel=>{const el=$(sel);if(el)el.disabled=n===0});
    };
    view().querySelectorAll('[data-mission-select]').forEach(box=>{box.onchange=refreshMissionBulk});
    if($('#v2BulkClear'))$('#v2BulkClear').onclick=()=>{
      view().querySelectorAll('[data-mission-select]').forEach(x=>{x.checked=false});
      refreshMissionBulk();
    };
    if($('#v2BulkArchive'))$('#v2BulkArchive').onclick=()=>{
      const ids=selectedMissionIds();
      if(!ids.length)return;
      try{
        if(confirm(ids.length+'개 미션을 보관할까요?')){
          HideV2Mission.bulkArchiveMissions(ids);
          missions();
        }
      }catch(e){setFlash(e?.message==='ACTIVE_SESSION_MISSION_BULK_BLOCKED'?'진행 중인 탐험은 함께 보관할 수 없어요.':'선택한 미션을 보관하지 못했어요.')}
    };
    if($('#v2BulkDelete'))$('#v2BulkDelete').onclick=()=>{
      const ids=selectedMissionIds();
      if(!ids.length)return;
      try{
        if(confirm(ids.length+'개 미션을 삭제할까요?')){
          HideV2Mission.bulkDeleteMissions(ids);
          missions();
        }
      }catch(e){setFlash(e?.message==='ACTIVE_SESSION_MISSION_BULK_BLOCKED'?'진행 중인 탐험은 함께 삭제할 수 없어요.':'선택한 미션을 삭제하지 못했어요.')}
    };
    view().querySelectorAll('[data-mission-filter]').forEach(btn=>{btn.onclick=()=>{
      activeMissionFilter=btn.dataset.missionFilter||'ALL';
      view().querySelectorAll('[data-mission-filter]').forEach(x=>x.classList.toggle('is-active',x===btn));
      applyMissionFilter();
    }});
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

  function safeCsvCell(value){
    let s=String(value??'').replace(/\r?\n/g,' ');
    if(/^[=+\-@]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }

  function memoryExportSnapshot(book){
    return {
      schema:'HIDE_V2_MEMORY_EXPORT_V1',
      exportedAt:new Date().toISOString(),
      authority:'SPECIALIST_MEMORY_EVIDENCE_NOT_READY_SCHEDULE',
      items:(book||[]).map(x=>({
        lexicalId:x.lexicalId,
        token:x.token,
        meaning:x.meaning,
        languageDomain:x.languageDomain,
        memoryStrength:x.memoryStrength,
        nextReviewPriority:x.nextReviewPriority,
        encounters:x.encounters,
        needsUnassistedRecall:x.needsUnassistedRecall===true,
        primaryReason:x.primaryReason||null,
        memorySignature:x.memorySignature||null
      }))
    };
  }

  function downloadTextFile(filename,mime,text){
    const blob=new Blob([text],{type:mime});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.hidden=true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  }

  function records(){
    const book=HideV2Memory.wordbook(),dash=HideV2Memory.dashboard();
    const ladderBand=x=>memoryPathState(x).key;
    const bandLabel={SEEK_AGAIN:'다시 찾을 단어',CLIMBING:'올라가는 단어',STABLE:'안정된 단어'};
    const bands=['SEEK_AGAIN','CLIMBING','STABLE'].map(key=>({key,items:book.filter(x=>ladderBand(x)===key)}));
    view().innerHTML=`
      <section class="screen-head"><p class="quest-overline">MEMORY LADDER</p><h1>기억 사다리</h1><p>단어가 다시 찾기에서 안정된 기억까지 올라가는 길을 보여줘요.</p></section>
      <section class="memory-route-intro" aria-label="다시 찾기 길 안내"><b>다시 찾기 길</b><span>다시 찾기 → 올라가기 → 안정</span><small>Hide는 기억 흔적만 보여주고, 언제 다시 할지는 Ready & Set이 정해요.</small></section>
      ${book.length?`<section class="memory-find-tools" aria-label="기억 단어 찾기"><label><span>단어 찾기</span><input id="v2MemorySearch" class="input" type="search" placeholder="단어 또는 뜻 검색" aria-label="기억 단어 검색"></label><div class="memory-filter-row" role="group" aria-label="기억 단계 필터"><button class="btn ghost is-active" type="button" data-memory-filter="ALL">전체</button><button class="btn ghost" type="button" data-memory-filter="SEEK_AGAIN">다시 찾기</button><button class="btn ghost" type="button" data-memory-filter="CLIMBING">올라가기</button><button class="btn ghost" type="button" data-memory-filter="STABLE">안정</button></div><small id="v2MemoryFilterCount" aria-live="polite">${book.length}개 단어 보기</small></section>`:'' }
      <section class="ladder-board" aria-label="기억 사다리 단계">
        ${bands.map((band,index)=>`<article class="ladder-rung ladder-rung--${band.key.toLowerCase()}"><div class="ladder-rung__head"><span>${index+1}</span><div><b>${bandLabel[band.key]}</b><small>${band.items.length}개 단어</small></div></div><div class="ladder-rung__words">${band.items.length?band.items.slice(0,8).map(x=>`<button type="button" data-ladder-word="${esc(x.lexicalId)}" data-memory-state="${band.key}" data-memory-text="${esc((x.token+' '+x.meaning).toLowerCase())}"><b>${esc(x.token)} · 사다리</b><small>${band.key==='SEEK_AGAIN'?'다시 만나기':band.key==='CLIMBING'?'기억 길 잇기':'지금 안정'}</small></button>`).join(''):'<span class="ladder-empty">아직 이 단계의 단어가 없어요</span>'}</div></article>`).join('')}
      </section>
      ${book.length?`<section class="memory-why-card"><p class="quest-overline">WORD PATH</p><h2>이 단어는 지금 어떤 길일까?</h2><div class="memory-why-card__word"><b>${esc(book[0].token)} · 기억 길</b><span>${esc(childMemoryReason(book[0]))}</span></div><div class="memory-crew-mini"><span class="crew-strip__avatar">${esc((globalThis.HideV2Crew?.presentation?.({word:book[0],stage:'MEMORY_LADDER'})||{avatarText:'탐'}).avatarText)}</span><div><b>${esc((globalThis.HideV2Crew?.presentation?.({word:book[0],stage:'MEMORY_LADDER'})||{displayName:'탐험대원'}).displayName)}</b><small class="memory-crew-copy">정답 대신, 다시 떠올릴 수 있게 옆에서 도와줄게요.</small></div><button class="btn ghost" type="button" data-memory-support="${esc(book[0].lexicalId)}">짧은 응원</button></div></section>`:''}
      <details class="memory-record-details"><summary>기억 기록 자세히 보기</summary>
        <section class="memory-summary"><div class="quest-stat"><b>${dash.averageStrength}%</b><span>전체 기억 힘</span></div><div class="quest-stat"><b>${dash.needsRecall}</b><span>다시 찾기</span></div><div class="quest-stat"><b>${dash.stable}</b><span>안정 단어</span></div></section>
        <section class="memory-signals"><span>뜻 혼동 <b>${dash.confusion}</b></span><span>글자 형태 <b>${dash.orthographic}</b></span><span>소리 <b>${dash.sound}</b></span><span>느린 회상 <b>${dash.slowRecall}</b></span><span>힌트 의존 <b>${dash.hintDependent}</b></span></section>
        ${book.length?`<section class="memory-export-tools" aria-label="기억 기록 내보내기"><div><b>내 기억 기록 가져가기</b><small>Hide의 현재 기억 흔적만 내보내요. 복습 날짜나 Ready & Set 일정은 포함하지 않아요.</small></div><div class="btn-row"><button id="v2ExportMemoryCsv" class="btn ghost" type="button">CSV 내보내기</button><button id="v2ExportMemoryJson" class="btn ghost" type="button">JSON 내보내기</button></div></section>`:''}
        <section class="wordbook"><div class="section-title"><div><p class="quest-overline">WORD TRAIL</p><h2>단어 기록</h2></div><span>다시 볼 순서</span></div><div id="v2WordbookRows"></div><button id="v2WordbookMore" class="btn ghost full" type="button" hidden>더 보기</button></section>
      </details>
      <button class="btn secondary full" id="v2RecordsHome">홈으로</button>`;
    $('#v2RecordsHome').onclick=()=>HideV2Router.go('home');
    if($('#v2ExportMemoryJson'))$('#v2ExportMemoryJson').onclick=()=>{
      const snapshot=memoryExportSnapshot(book);
      downloadTextFile('hide-seek-memory.json','application/json;charset=utf-8',JSON.stringify(snapshot,null,2));
    };
    if($('#v2ExportMemoryCsv'))$('#v2ExportMemoryCsv').onclick=()=>{
      const header=['lexicalId','token','meaning','languageDomain','memoryStrength','nextReviewPriority','encounters','needsUnassistedRecall','primaryReason'];
      const rows=book.map(x=>[
        x.lexicalId,x.token,x.meaning,x.languageDomain,x.memoryStrength,x.nextReviewPriority,x.encounters,
        x.needsUnassistedRecall===true?'true':'false',x.primaryReason?.key||''
      ]);
      const csv='\uFEFF'+[header,...rows].map(row=>row.map(safeCsvCell).join(',')).join('\r\n');
      downloadTextFile('hide-seek-memory.csv','text/csv;charset=utf-8',csv);
    };
    let activeMemoryFilter='ALL';
    const WORD_WINDOW=60;
    let wordWindow=WORD_WINDOW;
    const filteredBook=()=>{
      const q=String($('#v2MemorySearch')?.value||'').trim().toLowerCase();
      return book.filter(x=>{
        const state=ladderBand(x);
        const text=(x.token+' '+x.meaning).toLowerCase();
        return (activeMemoryFilter==='ALL'||state===activeMemoryFilter)&&(!q||text.includes(q));
      });
    };
    const bindWordDetails=()=>{
      view().querySelectorAll('[data-word-detail]').forEach(btn=>{
        btn.onclick=()=>{
          const entry=book.find(x=>x.lexicalId===btn.dataset.wordDetail);
          if(entry)HideV2Router.go('record-detail',{lexicalId:entry.lexicalId});
        };
      });
    };
    const renderWordbook=()=>{
      const rows=filteredBook();
      const shown=rows.slice(0,wordWindow);
      const host=$('#v2WordbookRows');
      if(host)host.innerHTML=shown.length?shown.map(x=>`<article class="word-row" data-memory-state="${ladderBand(x)}" data-memory-text="${esc((x.token+' '+x.meaning).toLowerCase())}"><div class="word-row__body"><b>${esc(x.token)}</b><span>${esc(x.meaning)} · ${languageLabel(x.languageDomain)}</span><small>${esc(x.primaryReason.label)} · ${x.encounters}번 만남</small></div><div class="word-row__meter"><b>${x.memoryStrength}%</b><div class="mini-meter"><span style="width:${x.memoryStrength}%"></span></div><button class="btn ghost" data-word-detail="${esc(x.lexicalId)}" type="button">기억 보기</button></div></article>`).join(''):'<div class="empty-state"><b>조건에 맞는 단어가 없어요</b><p>검색어나 기억 단계를 바꿔보세요.</p></div>';
      const more=$('#v2WordbookMore');
      if(more){
        more.hidden=shown.length>=rows.length;
        more.textContent=shown.length<rows.length?`더 보기 (${shown.length}/${rows.length})`:'더 보기';
      }
      const count=$('#v2MemoryFilterCount');
      if(count)count.textContent=rows.length>wordWindow?`${shown.length}/${rows.length}개 단어 보기`:`${rows.length}개 단어 보기`;
      bindWordDetails();
    };
    const applyMemoryFilter=()=>{
      wordWindow=WORD_WINDOW;
      renderWordbook();
      const q=String($('#v2MemorySearch')?.value||'').trim().toLowerCase();
      view().querySelectorAll('.ladder-rung [data-memory-state][data-memory-text]').forEach(el=>{
        const state=el.dataset.memoryState||'';
        const text=el.dataset.memoryText||'';
        const visible=(activeMemoryFilter==='ALL'||state===activeMemoryFilter)&&(!q||text.includes(q));
        el.hidden=!visible;
        el.style.display=visible?'':'none';
      });
    };
    if($('#v2MemorySearch'))$('#v2MemorySearch').oninput=applyMemoryFilter;
    if($('#v2WordbookMore'))$('#v2WordbookMore').onclick=()=>{wordWindow+=WORD_WINDOW;renderWordbook()};
    view().querySelectorAll('[data-memory-filter]').forEach(btn=>{btn.onclick=()=>{
      activeMemoryFilter=btn.dataset.memoryFilter||'ALL';
      view().querySelectorAll('[data-memory-filter]').forEach(x=>x.classList.toggle('is-active',x===btn));
      applyMemoryFilter();
    }});
    view().querySelectorAll('[data-ladder-word]').forEach(btn=>{btn.onclick=()=>HideV2Router.go('record-detail',{lexicalId:btn.dataset.ladderWord})});
    view().querySelectorAll('[data-memory-support]').forEach(btn=>{btn.onclick=()=>{const entry=book.find(x=>x.lexicalId===btn.dataset.memorySupport);if(!entry)return;const support=globalThis.HideV2Crew?.supportFor?.({word:entry,stage:'MEMORY_LADDER'})||{text:'천천히 떠올려 봐요. 지금은 정답을 보여주지 않을게요.',revealsAnswer:false};if(support.revealsAnswer===true)return;const copy=btn.closest('.memory-crew-mini')?.querySelector('.memory-crew-copy');if(copy)copy.textContent=support.text}});
    renderWordbook();
  }

  function recordDetail(params={}){
    const entry=HideV2Memory.wordbook().find(x=>x.lexicalId===params.lexicalId);
    if(!entry){HideV2Router.go('records');return}
    const sig=entry.memorySignature||{},events=(entry.evidence||[]).slice().reverse().slice(0,20),path=memoryPathState(entry);
    view().innerHTML=`<section class="card memory-detail-story"><div class="hero-kicker"><span>기억 길 보기</span><span>${esc(languageLabel(entry.languageDomain))}</span></div><h2>${esc(entry.token)}</h2><p class="memory-detail-meaning">${esc(entry.meaning)}</p><div class="memory-detail-path"><span>지금 위치</span><b>${esc(path.label)}</b><small>${esc(childMemoryReason(entry))}</small></div><div class="memory-detail-next"><span>다음 행동</span><b>${esc(path.action)}</b><small>복습 날짜는 Ready & Set이 정하고, Hide는 기억 흔적만 보여줘요.</small></div><details class="memory-tech-details"><summary>기억 기록 자세히 보기</summary><div class="grid3"><div class="status-pill"><b>${entry.memoryStrength}%</b><span>Memory</span></div><div class="status-pill"><b>P${entry.nextReviewPriority}</b><span>우선 신호</span></div><div class="status-pill"><b>${entry.encounters}</b><span>만난 횟수</span></div></div><div class="metric"><span>주요 이유</span><b>${esc(entry.primaryReason.label)}</b></div><div class="metric"><span>회복 상태</span><b>${esc(sig.recoveryStatus||'UNPROVEN')}</b></div><div class="metric"><span>뜻 취약</span><b>${sig.semanticWeakness||0}</b></div><div class="metric"><span>소리 취약</span><b>${sig.phonologicalWeakness||0}</b></div><div class="metric"><span>형태 취약</span><b>${sig.orthographicWeakness||0}</b></div><div class="metric"><span>혼동</span><b>${sig.confusionPattern?.count||0}</b></div></details></section><section class="card"><div class="section-title"><h2>기억 흔적</h2><span>최근 ${events.length}</span></div>${events.length?events.map(e=>`<div class="weak-item"><div><b>${esc(childEvidenceLabel(e.stage||e.evidenceMode))}</b><small style="display:block">${esc(e.result||'')} · ${esc(e.evidenceMode||'')}</small></div><small>${esc(e.at||'')}</small></div>`).join(''):'<p>기록 없음</p>'}<button class="btn secondary full" id="v2RecordBack">기록으로</button></section>`;
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