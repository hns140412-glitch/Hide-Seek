/* Hide & Seek (rebuild) — 숨은 단어 찾기 (RECALL): the meaning is shown, the word is hidden.
   Weak / missed words come first. Real and fake letter keys are mixed; a wrong key is rejected at once.
   Clues follow the adaptive Memory Trail (spec 11): cues that reactivate memory come before any letter is shown,
   the order leans on what has helped this learner before, and the last fallback opens one letter only.
   A word found with a clue is assisted: it must be found again later without one.
   Missed words are learned again, and only then looked for again (never the same answer straight after a miss).
   A quiet time gauge runs under the meaning (spec 11). When it runs out the attempt is kept as its own TIMEOUT
   result: no failure mark, the word is shown, learned again and sought again. Time stops while the page is hidden.
   With opts.pool the same play runs over words from earlier sets (old-word review); evidence lands on their own set. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
  const CLUE_NAME = { SCENE: '장면 단서', SOUND: '소리 단서', SHAPE: '모양 단서', PERSONAL_ERROR_TRACE: '지난 흔적', FRAGMENT: '조각 단서', MINIMUM_REVEAL: '글자 하나' };

  const CLUE_MS = 10000, limitMs = letters => 20000 + 4000 * Math.max(1, letters);

  function start(view, done, opts = {}) {
    const W = S.words, old = Array.isArray(opts.pool);
    const pool = old ? opts.pool.map(W.fresh).filter(Boolean) : W.byPriority(12).filter(w => !W.isNew(w) || W.met(w));
    if (!pool.length) { S.toast(old ? '지금은 다시 찾을 옛 단어가 없어.' : '먼저 흔적 찾기에서 단어를 만나고 오자.'); return done(); }
    const title = old ? '옛 단어 다시 찾기' : '숨은 단어 찾기';
    const st = { queue: pool.map(w => w.id), stage: 'FINAL_SEEK', again: [], found: 0, total: pool.length, at: 0 };
    const mid = w => W.locate(w.id)?.mission.id;
    const head = () => `<header class="sk-mode-head"><button class="sk-back" id="skBack" type="button" aria-label="탐험으로">‹</button><div><small>RECALL</small><b>${st.stage === 'SEEK_AGAIN' ? '다시 찾기' : title}</b></div><span class="sk-count">${st.found} / ${st.total}</span></header>`;
    const stopClock = () => { clearInterval(st.tick); st.tick = 0; };
    const bindBack = () => { $('#skBack', view).onclick = () => { stopClock(); S.quiet(); done(); }; };

    function next() {
      if (st.queue.length) return seek(W.fresh(st.queue.shift()));
      if (st.stage === 'FINAL_SEEK' && st.again.length) return relearn();
      finish();
    }

    /* Which cues exist for this word, and in which order for this learner. Nothing is invented: a scene is replayed
       only if the child met it, a personal trace only if the child left one. */
    function cluePlan(w, chars, need) {
      const M = globalThis.HideLanguageModel, ex = M?.starterExploration?.(w, {}) || null, rows = w.evidence || [];
      const steps = [];
      if (ex?.scene && rows.some(e => e.stage === 'TRACE_MEET' && e.supportType)) steps.push({ type: 'SCENE', text: ex.scene });
      steps.push({ type: 'SOUND', text: '다시 들어 봐.' });
      steps.push({ type: 'SHAPE', text: `${chars[0]}로 시작하는 ${chars.filter((_, i) => need[i]).length}글자.` });
      const slips = rows.flatMap(e => Array.isArray(e.wrongAt) ? e.wrongAt : []).filter(i => need[i]);
      if (slips.length) {
        const at = slips.sort((a, b) => slips.filter(x => x === b).length - slips.filter(x => x === a).length)[0];
        steps.push({ type: 'PERSONAL_ERROR_TRACE', text: `지난번에는 ${at + 1}번째 글자에서 헷갈렸어.`, at });
      }
      if (chars.length >= 5) steps.push({ type: 'FRAGMENT', text: '조각 하나가 열렸어.' });
      steps.push({ type: 'MINIMUM_REVEAL', text: '글자 하나가 열렸어.' });
      // order: the learner's own best clue first (self-reported inference history), then weakness, letters always last
      let order = steps.map(x => x.type);
      const skill = M?.summarizeInferenceSkill?.(HideV2Store.snapshot().events || []) || null;
      if (M?.prioritizeExistingAssistance) order = M.prioritizeExistingAssistance(order, skill);
      const sig = HideV2Memory.summary(w).memorySignature;
      if (sig.phonologicalWeakness > sig.semanticWeakness && order.includes('SOUND')) order = ['SOUND', ...order.filter(x => x !== 'SOUND')];
      if (order.includes('PERSONAL_ERROR_TRACE') && sig.orthographicWeakness >= 22) order = ['PERSONAL_ERROR_TRACE', ...order.filter(x => x !== 'PERSONAL_ERROR_TRACE')];
      // a word that ran out of time before gets a short sound or shape cue first, not more meaning (memory trace standard)
      if (sig.timeoutRisk > 0) order = [...['SOUND', 'SHAPE'].filter(x => order.includes(x)), ...order.filter(x => x !== 'SOUND' && x !== 'SHAPE')];
      const tail = ['FRAGMENT', 'MINIMUM_REVEAL'];
      order = [...order.filter(x => !tail.includes(x)), ...tail.filter(x => order.includes(x))];
      return order.map(t => steps.find(x => x.type === t));
    }

    function seek(w) {
      if (!w) return next();
      const token = String(w.token), chars = [...token];
      const need = chars.map(c => !/[\s\-'.,]/.test(c));
      const fill = chars.map((c, i) => need[i] ? '' : c);
      const realKeys = chars.filter((_, i) => need[i]).map(c => c.toLowerCase());
      // fake keys: letters this learner pressed by mistake on this word before come first (their own trap),
      // then latin letters for English; for other scripts, characters from the learner's other words
      const latin = realKeys.every(c => LETTERS.includes(c));
      const mine = [...new Set((w.evidence || []).flatMap(e => Array.isArray(e.wrongKeys) ? e.wrongKeys : []))].filter(c => !realKeys.includes(c));
      const fakePool = (latin ? [...LETTERS] : [...new Set(W.words().filter(x => x.id !== w.id).flatMap(x => [...String(x.token).toLowerCase()]))].filter(c => !/\s/.test(c))).filter(c => !realKeys.includes(c));
      const fakeN = Math.min(3, Math.max(2, Math.floor(realKeys.length / 3)));
      const fakes = [...S.sample(mine, Math.min(mine.length, fakeN)), ...S.sample(fakePool.filter(c => !mine.includes(c)), fakeN)].slice(0, fakeN);
      const keys = S.shuffle([...realKeys, ...fakes]).map((ch, i) => ({ ch, i, used: false }));
      const clues = cluePlan(w, chars, need), hintTrace = [], wrongAt = [], wrongKeys = []; let wrong = 0, clueAt = 0, hot = -1, note = ''; const t0 = Date.now();
      // time allowance grows with the word and with each clue read; only time spent looking at the page counts
      let limit = limitMs(realKeys.length), used = 0, lastTick = Date.now(), over = false;
      const left = () => Math.max(0, 1 - used / limit);
      const paint = () => { const g = $('.sk-gauge', view); if (!g) return false; g.classList.toggle('low', left() <= .25); g.firstElementChild.style.width = `${Math.round(left() * 1000) / 10}%`; return true; };
      const tick = () => {
        const now = Date.now(), d = now - lastTick; lastTick = now;
        if (!document.hidden) used += Math.min(d, 1000);
        if (!paint()) return stopClock();
        if (used >= limit) end('TIMEOUT');
      };
      const cursor = () => fill.findIndex((v, i) => need[i] && !v);
      const open = at => { const k = keys.find(x => !x.used && x.ch === chars[at].toLowerCase()); if (k) k.used = true; fill[at] = chars[at]; };
      const draw = () => {
        const last = hintTrace[hintTrace.length - 1];
        view.innerHTML = `${head()}
          <section class="sk-card recall">
            <p class="sk-step">${st.stage === 'SEEK_AGAIN' ? '혼자 힘으로 다시 찾기' : '뜻을 보고 단어를 찾아 줘'}</p>
            <p class="sk-meaning lead">${esc(w.meaning)}</p>
            <div class="sk-gauge${left() <= .25 ? ' low' : ''}" role="img" aria-label="남은 시간"><i style="width:${Math.round(left() * 1000) / 10}%"></i></div>
            <div class="sk-slots">${fill.map((v, i) => `<span class="${v ? 'on' : ''} ${i === cursor() ? 'cur' : ''} ${i === hot && !v ? 'hot' : ''}">${esc(v || '')}</span>`).join('')}</div>
            <p class="sk-clue" id="skClue">${note ? esc(note) : last ? `<b>${CLUE_NAME[last.step]}</b> ${esc(last.text)}` : ''}</p>
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
        const at = cursor(); if (at < 0 || over) return;
        if (k.ch !== chars[at].toLowerCase()) {
          // where and with which letter the slip happened is kept: it becomes this learner's own clue and trap next time
          wrong++; wrongAt.push(at); wrongKeys.push(k.ch);
          btn.classList.add('no'); setTimeout(() => btn.classList.remove('no'), 350);
          return;
        }
        k.used = true; fill[at] = chars[at];
        if (cursor() < 0) return end('DONE');
        draw();
      }
      function clue() {
        if (over) return;
        const c = clues[clueAt++]; if (!c) return;
        limit += CLUE_MS;
        hintTrace.push({ step: c.type, at: new Date().toISOString(), text: c.text });
        S.record(mid(w), w, { stage: 'FINAL_SEEK_SUPPORT', evidenceMode: 'ASSISTANCE', axes: ['RECALL'], result: 'HINT_USED', assisted: true, hintLevel: clueAt, supportType: c.type });
        if (c.type === 'SOUND') S.sayWord(token);
        if (c.type === 'PERSONAL_ERROR_TRACE') hot = c.at;
        if (c.type === 'FRAGMENT') {
          // a middle chunk, never the whole word: at least two letters stay for the learner
          const plan = W.chunkPlan(w), left = () => fill.filter((v, i) => need[i] && !v).length;
          for (let i = plan.start; i < plan.start + plan.len && left() > 2; i++) if (need[i] && !fill[i]) open(i);
        }
        if (c.type === 'MINIMUM_REVEAL') { const at = cursor(); if (at >= 0) open(at); }
        if (cursor() < 0) return end('DONE');
        draw();
      }
      async function end(kind) {
        if (over) return; over = true; stopClock();
        const assisted = hintTrace.length > 0, ms = Date.now() - t0;
        const result = kind === 'PASS' ? 'PASS' : kind === 'TIMEOUT' ? 'TIMEOUT' : wrong >= 3 ? 'WRONG' : 'CORRECT';
        if (kind === 'TIMEOUT') note = '시간이 다 됐어. 이 단어는 다시 익히고 또 찾자.';
        // found alone = objective recall; found with a clue = assisted reconstruction, to be re-checked later
        S.record(mid(w), w, {
          stage: st.stage, evidenceMode: assisted ? 'ASSISTED_RECONSTRUCTION' : 'RETRIEVAL', axes: ['FORM', 'RECALL'], result,
          objectiveVerified: true, objectiveRecall: !assisted, recallScoreImpact: !assisted, assisted, hintLevel: hintTrace.length,
          hintTrace: hintTrace.map(h => ({ step: h.step, at: h.at })), wrongAttempts: wrong, wrongAt: wrongAt.slice(0, 12), wrongKeys: [...new Set(wrongKeys)].slice(0, 8),
          elapsedMs: ms, timeLimitMs: limit, slow: result === 'CORRECT' && ms >= 12000, oldWordReview: old || undefined
        });
        const clean = result === 'CORRECT' && !assisted;
        if (clean) st.found++;
        else if (st.stage === 'FINAL_SEEK') { st.again.push(w.id); if (kind === 'PASS') S.crewSay('이 단어는 추적 목록에 넣어둘게. 뒤에서 더 자주 만나자.'); }
        if (kind === 'PASS') return next();
        fill.forEach((_, i) => { fill[i] = chars[i]; }); hot = -1; draw(); view.querySelector('.sk-card').classList.add(clean ? 'win' : 'soft');
        S.sayWord(token); await S.wait(kind === 'TIMEOUT' ? 1800 : 900); next();
      }
      draw();
      stopClock(); st.tick = setInterval(tick, 250);
      if (st.at++ === 0) S.crewSay(st.stage === 'SEEK_AGAIN' ? '놓쳤다고 끝난 건 아니지. 다시 익힌 뒤 같은 단어만 재검증하자.' : '진짜 철자 열쇠만 골라. 가짜도 섞여 있어.');
    }

    /* SEEK AGAIN: learn the unstable words again, then look for them again */
    function relearn() {
      const ids = st.again.slice(); let i = 0;
      const card = () => {
        const w = W.fresh(ids[i]), slips = [...new Set((w.evidence || []).slice(-3).flatMap(e => Array.isArray(e.wrongAt) ? e.wrongAt : []))];
        // the letters that slipped are marked, so the second look goes to the right place
        const shown = [...String(w.token)].map((c, k) => slips.includes(k) ? `<mark>${esc(c)}</mark>` : esc(c)).join('');
        view.innerHTML = `${head()}<section class="sk-card meet">
          <p class="sk-step">다시 익히기 ${i + 1} / ${ids.length}</p>
          <button type="button" class="sk-word big" id="skHear">${shown} <span class="sk-spk">🔊</span></button>
          <p class="sk-meaning">${esc(w.meaning)}</p>
          <button type="button" class="sk-btn main" id="skNext">다시 기억했어</button></section>`;
        bindBack(); S.sayWord(w.token); $('#skHear', view).onclick = () => S.sayWord(w.token);
        $('#skNext', view).onclick = () => {
          S.record(mid(w), w, { stage: 'SEEK_AGAIN_RELEARN', evidenceMode: 'EXPOSURE', axes: ['MEANING', 'FORM'], result: 'SEEN' });
          if (++i < ids.length) return card();
          st.stage = 'SEEK_AGAIN'; st.queue = S.shuffle(ids); st.again = []; st.at = 0; next();
        };
      };
      card();
    }

    function finish() {
      stopClock(); S.quiet();
      const left = st.total - st.found;
      view.innerHTML = `${head()}<section class="sk-card done">
        <p class="sk-step">${title} 끝</p><h2>혼자 힘으로 ${st.found}개를 찾았어</h2>
        <p class="sk-sub">${left > 0 ? `${left}개는 다시 숨었어. 다음 탐험에서 먼저 만나자.` : old ? '옛 단어를 모두 다시 찾았어.' : '오늘 숨은 단어를 모두 찾았어.'}</p>
        <button type="button" class="sk-btn main" id="skDone">탐험 길로</button></section>`;
      bindBack(); $('#skDone', view).onclick = done;
      S.crewSay('오늘 탐험을 마쳤어. 다시 찾을 단어는 다음에 만나자.');
      S.setSeek({ lastMode: 'RECALL', lastAt: new Date().toISOString() });
      if (!old) try { S.family?.reportTask?.(); } catch { /* reporting never blocks learning */ }
    }
    next();
  }

  S.recall = { start, limitMs };
})();
