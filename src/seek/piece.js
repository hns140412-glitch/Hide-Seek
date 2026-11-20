/* Hide & Seek (rebuild) — PIECE / 조각 맞추기: complete the missing critical part of the form.
   Tap a small piece into the gap; no keyboard transcription.
   A completed piece is reconstruction evidence: it is not independent recall and never marks a word "found". */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;

  function start(view, done) {
    const W = S.words, mission = W.mission();
    const pool = W.words().filter(w => !W.isNew(w) || W.met(w));
    if (!pool.length) { S.toast('먼저 흔적 찾기에서 단어를 만나고 오자.'); return done(); }
    const items = pool.map(w => ({ w, p: (W.pieced(w) ? 0 : 50) + HideV2Memory.summary(w).memorySignature.orthographicWeakness })).sort((a, b) => b.p - a.p).slice(0, 8).map(x => x.w.id);
    const st = { at: 0, right: 0 };
    const head = () => `<header class="sk-mode-head"><button class="sk-back" id="skBack" type="button" aria-label="탐험으로">‹</button><div><small>PIECE</small><b>조각 맞추기</b></div><span class="sk-count">${st.at + 1} / ${items.length}</span></header>`;
    const bindBack = () => { $('#skBack', view).onclick = () => { S.quiet(); done(); }; };

    function turn() {
      if (st.at >= items.length) return finish();
      const w = W.fresh(items[st.at]), plan = W.chunkPlan(w), token = String(w.token);
      const chunk = token.slice(plan.start, plan.start + plan.len);
      const opts = S.shuffle([chunk, ...W.fakeChunks(chunk, 2)]);
      let wrong = 0; const t0 = Date.now();
      view.innerHTML = `${head()}
        <section class="sk-card piece">
          <p class="sk-step">${plan.kind === 'WORD_PART' ? '빠진 단어 조각 찾기' : '빠진 글자 조각 찾기'}</p>
          <p class="sk-meaning lead">${esc(w.meaning)}</p>
          <p class="sk-gapword"><span>${esc(token.slice(0, plan.start))}</span><span class="sk-gap" id="skGap" style="--n:${plan.len}"></span><span>${esc(token.slice(plan.start + plan.len))}</span></p>
          <div class="sk-opts row">${opts.map(o => `<button type="button" class="sk-opt chunk" data-c="${esc(o)}">${esc(o)}</button>`).join('')}</div>
          <button type="button" class="sk-link" id="skHear">🔊 소리 듣기</button>
        </section>`;
      bindBack();
      if (st.at === 0) S.crewSay('단어를 소리 내어 천천히 읽어 보고, 빈칸에서 어떤 소리가 나는지 생각해봐.');
      let heard = false;
      $('#skHear', view).onclick = () => { heard = true; S.sayWord(token); };
      $$('.sk-opt', view).forEach(b => b.onclick = async () => {
        if (view.dataset.lock) return;
        if (b.dataset.c.toLowerCase() !== chunk.toLowerCase()) { wrong++; b.classList.add('no'); b.disabled = true; return; }
        view.dataset.lock = '1';
        $('#skGap', view).textContent = chunk; $('#skGap', view).classList.add('filled'); b.classList.add('ok');
        S.record(mission.id, w, { stage: 'PIECE', evidenceMode: 'RECONSTRUCTION', axes: ['FORM', 'WRITE_OR_RECONSTRUCT'], result: wrong ? 'MISMATCH' : 'CORRECT', objectiveVerified: true, assisted: heard, wrongAttempts: wrong, pieceKind: plan.kind, elapsedMs: Date.now() - t0 });
        if (!wrong) st.right++;
        S.sayWord(token); await S.wait(750); delete view.dataset.lock; st.at++; turn();
      });
    }
    function finish() {
      S.quiet();
      view.innerHTML = `<header class="sk-mode-head"><button class="sk-back" id="skBack" type="button" aria-label="탐험으로">‹</button><div><small>PIECE</small><b>조각 맞추기</b></div><span class="sk-count">끝</span></header>
        <section class="sk-card done"><p class="sk-step">조각 맞추기 끝</p><h2>${st.right}개를 한 번에 맞췄어</h2>
        <p class="sk-sub">조각을 맞춘 단어는 숨은 단어에서 혼자 힘으로 찾아보자.</p>
        <button type="button" class="sk-btn main" id="skDone">탐험 길로</button></section>`;
      bindBack(); $('#skDone', view).onclick = done;
      S.setSeek({ lastMode: 'PIECE', lastAt: new Date().toISOString() });
    }
    turn();
  }

  S.piece = { start };
})();
