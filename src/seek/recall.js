/* Hide & Seek (rebuild) — 숨은 단어 찾기 (RECALL): the meaning is shown, the word is hidden.
   Weak / missed words come first. Real and fake letter keys are mixed; a wrong key is rejected at once.
   Clues follow the Memory Trail (scene -> sound -> shape -> one letter) and never show the whole answer.
   A word found with a clue is assisted: it must be found again later without one.
   Missed words are learned again, and only then looked for again (never the same answer straight after a miss). */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

  function start(view, done) {
    const W = S.words, mission = W.mission();
    const pool = W.byPriority(12).filter(w => !W.isNew(w) || W.met(w));
    if (!pool.length) { S.toast('먼저 흔적 찾기에서 단어를 만나고 오자.'); return done(); }
    const st = { queue: pool.map(w => w.id), stage: 'FINAL_SEEK', again: [], found: 0, total: pool.length, at: 0 };
    const head = () => `<header class="sk-mode-head"><button class="sk-back" id="skBack" type="button" aria-label="탐험으로">‹</button><div><small>RECALL</small><b>${st.stage === 'SEEK_AGAIN' ? '다시 찾기' : '숨은 단어 찾기'}</b></div><span class="sk-count">${st.found} / ${st.total}</span></header>`;
    const bindBack = () => { $('#skBack', view).onclick = () => { S.quiet(); done(); }; };

    function next() {
      if (st.queue.length) return seek(W.fresh(st.queue.shift()));
      if (st.stage === 'FINAL_SEEK' && st.again.length) return relearn();
      finish();
    }

    function cluePlan(w) {
      const ex = globalThis.HideLanguageModel?.starterExploration?.(w, {}) || null;
      const sig = HideV2Memory.summary(w).memorySignature, steps = [];
      // only a scene the child actually met in TRACE may be replayed as "a memory"
      const sawScene = (w.evidence || []).some(e => e.stage === 'TRACE_MEET' && e.supportType);
      if (ex?.scene && sawScene) steps.push({ type: 'SCENE', text: ex.scene });
      steps.push({ type: 'SOUND', text: '소리 단서: 다시 들어 봐.' });
      steps.push({ type: 'SHAPE', text: `모양 단서: ${w.token[0]}로 시작하는 ${w.token.length}글자.` });
      steps.push({ type: 'MINIMUM_REVEAL', text: '글자 하나가 열렸어.' });
      if (sig.phonologicalWeakness > sig.semanticWeakness) steps.sort((a, b) => (a.type === 'SOUND' ? -1 : 0) - (b.type === 'SOUND' ? -1 : 0));
      return steps;
    }

    function seek(w) {
      if (!w) return next();
      const token = String(w.token), chars = [...token];
      const need = chars.map(c => !/[\s\-'.,]/.test(c));
      const fill = chars.map((c, i) => need[i] ? '' : c);
      const realKeys = chars.filter((_, i) => need[i]).map(c => c.toLowerCase());
      // fake keys: latin letters for English; for other scripts, characters from the learner's other words
      const latin = realKeys.every(c => LETTERS.includes(c));
      const fakePool = latin ? [...LETTERS] : [...new Set(W.words().filter(x => x.id !== w.id).flatMap(x => [...String(x.token).toLowerCase()]))].filter(c => !/\s/.test(c));
      const fakes = S.sample(fakePool.filter(c => !realKeys.includes(c)), Math.min(3, Math.max(2, Math.floor(realKeys.length / 3))));
      const keys = S.shuffle([...realKeys, ...fakes]).map((ch, i) => ({ ch, i, used: false }));
      const clues = cluePlan(w), hintTrace = []; let wrong = 0, clueAt = 0; const t0 = Date.now();
      const cursor = () => fill.findIndex((v, i) => need[i] && !v);
      const draw = () => {
        view.innerHTML = `${head()}
          <section class="sk-card recall">
            <p class="sk-step">${st.stage === 'SEEK_AGAIN' ? '혼자 힘으로 다시 찾기' : '뜻을 보고 단어를 찾아 줘'}</p>
            <p class="sk-meaning lead">${esc(w.meaning)}</p>
            <div class="sk-slots">${fill.map((v, i) => `<span class="${v ? 'on' : ''} ${i === cursor() ? 'cur' : ''}">${esc(v || '')}</span>`).join('')}</div>
            <p class="sk-clue" id="skClue">${hintTrace.length ? esc(hintTrace[hintTrace.length - 1].text) : ''}</p>
            <div class="sk-keys">${keys.map(k => `<button type="button" class="sk-key" data-i="${k.i}" ${k.used ? 'disabled' : ''}>${esc(k.ch)}</button>`).join('')}</div>
            <div class="sk-row2">
              <button type="button" class="sk-btn ghost" id="skClueBtn" ${clueAt >= clues.length ? 'disabled' : ''}>길 단서</button>
              <button type="button" class="sk-btn ghost" id="skPass">아직 안 떠올라</button>
            </div>
          </section>`;
        bindBack();
        $$('.sk-key', view).forEach(b => b.onclick = () => press(keys[+b.dataset.i], b));
        $('#skClueBtn', view).onclick = clue;
        $('#skPass', view).onclick = () => end('PASS');
      };
      function press(k, btn) {
        const at = cursor(); if (at < 0) return;
        if (k.ch !== chars[at].toLowerCase()) {
          wrong++; btn.classList.add('no'); setTimeout(() => btn.classList.remove('no'), 350);
          return;
        }
        k.used = true; fill[at] = chars[at];
        if (cursor() < 0) return end('DONE');
        draw();
      }
      function clue() {
        const c = clues[clueAt++]; if (!c) return;
        hintTrace.push({ step: c.type, at: new Date().toISOString(), text: c.text });
        S.record(mission.id, w, { stage: 'FINAL_SEEK_SUPPORT', evidenceMode: 'ASSISTANCE', axes: ['RECALL'], result: 'HINT_USED', assisted: true, hintLevel: clueAt, supportType: c.type });
        if (c.type === 'SOUND') S.sayWord(token);
        if (c.type === 'MINIMUM_REVEAL') { const at = cursor(); if (at >= 0) { const k = keys.find(x => !x.used && x.ch === chars[at].toLowerCase()); if (k) k.used = true; fill[at] = chars[at]; if (cursor() < 0) return end('DONE'); } }
        draw();
      }
      async function end(kind) {
        const assisted = hintTrace.length > 0, ms = Date.now() - t0;
        const result = kind === 'PASS' ? 'PASS' : wrong >= 3 ? 'WRONG' : 'CORRECT';
        // found alone = objective recall; found with a clue = assisted reconstruction, to be re-checked later
        S.record(mission.id, w, {
          stage: st.stage, evidenceMode: assisted ? 'ASSISTED_RECONSTRUCTION' : 'RETRIEVAL', axes: ['FORM', 'RECALL'], result,
          objectiveVerified: true, objectiveRecall: !assisted, recallScoreImpact: !assisted, assisted, hintLevel: hintTrace.length,
          hintTrace: hintTrace.map(h => ({ step: h.step, at: h.at })), wrongAttempts: wrong, elapsedMs: ms, slow: result === 'CORRECT' && ms >= 12000
        });
        const clean = result === 'CORRECT' && !assisted;
        if (clean) st.found++;
        else if (st.stage === 'FINAL_SEEK') { st.again.push(w.id); if (kind === 'PASS') S.crewSay('이 단어는 추적 목록에 넣어둘게. 뒤에서 더 자주 만나자.'); }
        if (kind === 'PASS') return next();
        fill.forEach((_, i) => { fill[i] = chars[i]; }); draw(); view.querySelector('.sk-card').classList.add(clean ? 'win' : 'soft');
        S.sayWord(token); await S.wait(900); next();
      }
      draw();
      if (st.at++ === 0) S.crewSay(st.stage === 'SEEK_AGAIN' ? '놓쳤다고 끝난 건 아니지. 다시 익힌 뒤 같은 단어만 재검증하자.' : '진짜 철자 열쇠만 골라. 가짜도 섞여 있어.');
    }

    /* SEEK AGAIN: learn the unstable words again, then look for them again */
    function relearn() {
      const ids = st.again.slice(); let i = 0;
      const card = () => {
        const w = W.fresh(ids[i]);
        view.innerHTML = `${head()}<section class="sk-card meet">
          <p class="sk-step">다시 익히기 ${i + 1} / ${ids.length}</p>
          <button type="button" class="sk-word big" id="skHear">${esc(w.token)} <span class="sk-spk">🔊</span></button>
          <p class="sk-meaning">${esc(w.meaning)}</p>
          <button type="button" class="sk-btn main" id="skNext">다시 기억했어</button></section>`;
        bindBack(); S.sayWord(w.token); $('#skHear', view).onclick = () => S.sayWord(w.token);
        $('#skNext', view).onclick = () => {
          S.record(mission.id, w, { stage: 'SEEK_AGAIN_RELEARN', evidenceMode: 'EXPOSURE', axes: ['MEANING', 'FORM'], result: 'SEEN' });
          if (++i < ids.length) return card();
          st.stage = 'SEEK_AGAIN'; st.queue = S.shuffle(ids); st.again = []; st.at = 0; next();
        };
      };
      card();
    }

    function finish() {
      S.quiet();
      const left = st.total - st.found;
      view.innerHTML = `${head()}<section class="sk-card done">
        <p class="sk-step">숨은 단어 찾기 끝</p><h2>혼자 힘으로 ${st.found}개를 찾았어</h2>
        <p class="sk-sub">${left > 0 ? `${left}개는 다시 숨었어. 다음 탐험에서 먼저 만나자.` : '오늘 숨은 단어를 모두 찾았어.'}</p>
        <button type="button" class="sk-btn main" id="skDone">탐험 길로</button></section>`;
      bindBack(); $('#skDone', view).onclick = done;
      S.crewSay('오늘 탐험을 마쳤어. 다시 찾을 단어는 다음에 만나자.');
      S.setSeek({ lastMode: 'RECALL', lastAt: new Date().toISOString() });
    }
    next();
  }

  S.recall = { start };
})();
