/* Hide & Seek (rebuild) — TRACE / 흔적 찾기.
   First trace is NEW-only: think first, then the meaning, then the word hides.
   Chase = short, fast turns in changing directions (word->meaning, meaning->word, sound->meaning, think-first).
   A miss is not punished: the word hides again and comes back later.
   Records: meeting = exposure only; a tap choice = recognition; "it came to mind" = self-report (never verified recall). */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const BATCH = 4;

  function start(view, done) {
    const W = S.words, pool = W.tracePool(), mission = W.mission();
    if (!pool.items.length) { S.toast('흔적을 찾을 단어가 없어.'); return done(); }
    const ids = pool.items.map(w => w.id);
    const st = { variant: pool.variant, ids, batchAt: 0, phase: 'MEET', meetAt: 0, queue: [], requeued: {}, caught: new Set(), turns: 0, t0: 0 };
    const batch = () => st.ids.slice(st.batchAt, st.batchAt + BATCH).map(W.fresh).filter(Boolean);
    const head = () => `<header class="sk-mode-head"><button class="sk-back" id="skBack" type="button" aria-label="탐험으로">‹</button><div><small>TRACE</small><b>흔적 찾기</b></div><span class="sk-count">${st.caught.size} / ${st.ids.length}</span></header>`;
    const bindBack = () => { $('#skBack', view).onclick = () => { S.quiet(); done(); }; };

    function next() {
      const b = batch();
      if (!b.length) return finish();
      if (st.phase === 'MEET') {
        // review variant: words already met skip the meeting and go straight to the chase
        const needMeet = b.filter(w => !W.met(w));
        if (needMeet.length) return meet(needMeet[0]);
        st.phase = 'CHASE'; st.queue = S.shuffle(b.map(w => w.id)); st.requeued = {};
        if (st.batchAt === 0) S.crewSay('이번에는 정답을 맞히는 시험이 아니야. 말하고, 듣고, 뜻을 살펴보자.');
      }
      if (!st.queue.length) { st.batchAt += BATCH; st.phase = 'MEET'; st.meetAt = 0; return next(); }
      chase(W.fresh(st.queue.shift()));
    }

    /* ---- meet: WORD -> THINKING QUESTION -> (optional scene) -> MEANING -> hide ---- */
    function meet(w) {
      const ex = globalThis.HideLanguageModel?.starterExploration?.(w, { encounteredWords: W.words().filter(W.met).map(x => x.token) }) || null;
      const parts = (ex?.parts || []).filter(p => p.label);
      view.innerHTML = `${head()}
        <section class="sk-card meet">
          <p class="sk-step">처음 만나는 단어</p>
          <button type="button" class="sk-word big" id="skHear" aria-label="소리 듣기">${esc(w.token)} <span class="sk-spk">🔊</span></button>
          ${parts.length >= 2 ? `<div class="sk-parts">${parts.map(p => `<span><b>${esc(p.label)}</b><i>${esc(p.meaning || '')}</i></span>`).join('<em>+</em>')}</div>` : ''}
          <p class="sk-think">${esc(ex?.question || '이 단어를 보면 어떤 장면이 떠올라? 뜻을 먼저 생각해 봐.')}</p>
          <div id="skMeetNext"><button type="button" class="sk-btn main" id="skThought">생각했어, 뜻 보기</button></div>
        </section>`;
      bindBack(); S.sayWord(w.token);
      $('#skHear', view).onclick = () => S.sayWord(w.token);
      const t0 = Date.now();
      $('#skThought', view).onclick = () => {
        S.record(mission.id, w, { stage: 'TRACE_MEET', evidenceMode: 'EXPOSURE', axes: ['MEANING'], result: 'SEEN', thinkingFirst: true, supportType: ex ? (ex.type || 'THINKING_SCENE') : null, elapsedMs: Date.now() - t0 });
        $('#skMeetNext', view).innerHTML = `
          <p class="sk-meaning">${esc(w.meaning)}</p>
          ${ex?.scene ? `<p class="sk-scene">${esc(ex.scene)}</p>` : ''}
          <button type="button" class="sk-btn main" id="skHide">기억했어, 숨겨 줘</button>`;
        $('#skHide', view).onclick = async e => { if (e.currentTarget.disabled) return; e.currentTarget.disabled = true; view.querySelector('.sk-card').classList.add('hiding'); await S.wait(380); st.meetAt++; next(); };
      };
    }

    /* ---- chase: one quick turn ---- */
    function chase(w) {
      if (!w) return next();
      st.turns++;
      const kinds = ['W2M', 'M2W', 'S2M', 'THINK'];
      const kind = kinds[(st.turns + Math.floor(Math.random() * 2)) % kinds.length];
      if (kind === 'THINK') return think(w);
      const others = W.distractors(w, 2), opts = S.shuffle([w, ...others]);
      const showMeaning = kind !== 'M2W';
      const prompt = kind === 'W2M' ? `<p class="sk-word blink">${esc(w.token)}</p><p class="sk-ask">방금 지나간 단어의 뜻은?</p>`
        : kind === 'S2M' ? `<button type="button" class="sk-word ear" id="skHear">🔊 다시 듣기</button><p class="sk-ask">들린 단어의 뜻은?</p>`
          : `<p class="sk-meaning lead">${esc(w.meaning)}</p><p class="sk-ask">이 뜻을 가진 단어는?</p>`;
      view.innerHTML = `${head()}<section class="sk-card chase">${prompt}
        <div class="sk-opts">${opts.map(o => `<button type="button" class="sk-opt" data-id="${esc(o.id)}">${esc(showMeaning ? o.meaning : o.token)}</button>`).join('')}</div></section>`;
      bindBack(); st.t0 = Date.now();
      if (kind !== 'M2W') S.sayWord(w.token);
      $('#skHear', view)?.addEventListener('click', () => S.sayWord(w.token));
      $$('.sk-opt', view).forEach(b => b.onclick = async () => {
        if (view.dataset.lock) return; view.dataset.lock = '1';
        const ok = b.dataset.id === w.id;
        S.record(mission.id, w, { stage: 'TRACE_CHASE', evidenceMode: 'RECOGNITION', axes: kind === 'S2M' ? ['SOUND', 'MEANING'] : kind === 'M2W' ? ['MEANING', 'FORM'] : ['MEANING'], direction: kind, result: ok ? 'CORRECT' : 'MISMATCH', objectiveVerified: true, elapsedMs: Date.now() - st.t0 });
        b.classList.add(ok ? 'ok' : 'no');
        if (ok) { st.caught.add(w.id); await S.wait(420); }
        else { $$('.sk-opt', view).find(x => x.dataset.id === w.id)?.classList.add('ok'); rehide(w); await S.wait(900); }
        delete view.dataset.lock; next();
      });
    }
    function think(w) {
      view.innerHTML = `${head()}<section class="sk-card chase">
        <p class="sk-meaning lead">${esc(w.meaning)}</p><p class="sk-ask">머릿속으로 단어를 떠올려 봐.</p>
        <div id="skThinkNext"><button type="button" class="sk-btn main" id="skShow">떠올렸어, 확인</button></div></section>`;
      bindBack(); st.t0 = Date.now();
      $('#skShow', view).onclick = () => {
        const ms = Date.now() - st.t0; S.sayWord(w.token);
        $('#skThinkNext', view).innerHTML = `<p class="sk-word">${esc(w.token)}</p>
          <div class="sk-row2"><button type="button" class="sk-btn ghost" data-r="UNSURE">아직 흐릿해</button><button type="button" class="sk-btn main" data-r="CAME">떠올랐어</button></div>`;
        $$('[data-r]', view).forEach(b => b.onclick = () => {
          const came = b.dataset.r === 'CAME';
          // self-report: never verified, never counted as recall; "unsure" is not "wrong"
          S.record(mission.id, w, { stage: 'TRACE_THINK', evidenceMode: 'SELF_REPORT', axes: ['RECALL'], result: came ? 'SELF_CAME' : 'UNSURE', elapsedMs: ms });
          if (came) st.caught.add(w.id); else rehide(w);
          next();
        });
      };
    }
    function rehide(w) {
      st.requeued[w.id] = (st.requeued[w.id] || 0) + 1;
      if (st.requeued[w.id] <= 2) st.queue.splice(Math.min(st.queue.length, 2), 0, w.id);
      S.toast('다시 숨었어. 조금 뒤에 또 만나자.');
    }

    function finish() {
      S.quiet();
      view.innerHTML = `${head()}<section class="sk-card done">
        <p class="sk-step">흔적 찾기 끝</p>
        <h2>${st.caught.size}개의 흔적을 찾았어</h2>
        <p class="sk-sub">${st.ids.length - st.caught.size > 0 ? `아직 흐릿한 단어 ${st.ids.length - st.caught.size}개는 다음에 또 만나자.` : '모든 단어의 흔적을 한 번씩 찾았어.'}</p>
        <button type="button" class="sk-btn main" id="skDone">탐험 길로</button></section>`;
      bindBack(); $('#skDone', view).onclick = done;
      S.setSeek({ lastMode: 'TRACE', lastAt: new Date().toISOString() });
    }
    next();
  }

  S.trace = { start };
})();
