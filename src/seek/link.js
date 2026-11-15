/* Hide & Seek (rebuild) — LINK / 연결 찾기. Three states (decision 2026-09-22):
   1) principle: a VERIFIED word-part / scene relation is shown first. Nothing is invented: a word without a
      verified record simply has no principle card.
   2) related choice: tell the target apart from look-alike words (what it IS and IS NOT).
   3) connection test: several words and meanings are mixed and joined by tapping (no drag).
   Records are association evidence only; a mismatch here is never a recall failure. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;

  function start(view, done) {
    const W = S.words, mission = W.mission();
    const pool = W.words().filter(w => !W.isNew(w) || W.met(w));
    if (pool.length < 2) { S.toast('먼저 흔적 찾기에서 단어를 만나고 오자.'); return done(); }
    const items = pool.map(w => ({ w, p: (W.linked(w) ? 0 : 50) + HideV2Memory.summary(w).nextReviewPriority })).sort((a, b) => b.p - a.p).slice(0, 6).map(x => x.w);
    const principles = items.map(w => ({ w, ex: globalThis.HideLanguageModel?.starterExploration?.(w, { encounteredWords: pool.map(x => x.token) }) })).filter(x => x.ex);
    const st = { step: principles.length ? 'PRINCIPLE' : 'CHOICE', at: 0, right: 0 };
    const head = label => `<header class="sk-mode-head"><button class="sk-back" id="skBack" type="button" aria-label="탐험으로">‹</button><div><small>LINK</small><b>연결 찾기</b></div><span class="sk-count">${label}</span></header>`;
    const bindBack = () => { $('#skBack', view).onclick = () => { S.quiet(); done(); }; };

    function principle() {
      const { w, ex } = principles[st.at];
      const parts = (ex.parts || []).filter(p => p.label), beats = (ex.visual || []).map(v => globalThis.HideLanguageModel?.sceneBeat?.(v)?.label || v).filter(Boolean);
      view.innerHTML = `${head(`원리 ${st.at + 1} / ${principles.length}`)}
        <section class="sk-card principle">
          <p class="sk-step">이 단어는 이렇게 이어져</p>
          <button type="button" class="sk-word" id="skHear">${esc(w.token)} <span class="sk-spk">🔊</span></button>
          ${parts.length >= 2 ? `<div class="sk-parts">${parts.map(p => `<span><b>${esc(p.label)}</b><i>${esc(p.meaning || '')}</i></span>`).join('<em>+</em>')}</div>`
          : beats.length ? `<div class="sk-beats">${beats.map(b => `<span>${esc(b)}</span>`).join('<em>→</em>')}</div>` : ''}
          <p class="sk-scene">${esc(ex.why || ex.scene || '')}</p>
          <p class="sk-meaning">${esc(w.meaning)}</p>
          <button type="button" class="sk-btn main" id="skNext">알겠어</button>
        </section>`;
      bindBack(); S.sayWord(w.token); $('#skHear', view).onclick = () => S.sayWord(w.token);
      $('#skNext', view).onclick = () => {
        S.record(mission.id, w, { stage: 'LINK_PRINCIPLE', evidenceMode: 'EXPOSURE', axes: ['MEANING'], result: 'SEEN', supportType: ex.type || null, source: ex.sourceRef || null, verifiedSupport: ex.verified === true });
        st.at++; if (st.at >= principles.length) { st.step = 'CHOICE'; st.at = 0; S.crewSay('정답을 외워 찍기보다, 영어와 뜻의 연결을 빠르게 확인해보자.'); }
        next();
      };
    }

    function choice() {
      const w = W.fresh(items[st.at].id), alike = W.lookAlikes(w, W.words(), 2), opts = S.shuffle([w, ...alike]);
      view.innerHTML = `${head(`가려내기 ${st.at + 1} / ${items.length}`)}
        <section class="sk-card chase">
          <p class="sk-step">닮은 단어 사이에서 가려내기</p>
          <p class="sk-meaning lead">${esc(w.meaning)}</p>
          <div class="sk-opts">${opts.map(o => `<button type="button" class="sk-opt word" data-id="${esc(o.id)}">${esc(o.token)}</button>`).join('')}</div>
          <div id="skCompare"></div>
        </section>`;
      bindBack(); const t0 = Date.now();
      $$('.sk-opt', view).forEach(b => b.onclick = async () => {
        if (view.dataset.lock) return; view.dataset.lock = '1';
        const ok = b.dataset.id === w.id, picked = W.fresh(b.dataset.id);
        S.record(mission.id, w, { stage: 'LINK_CHOICE', evidenceMode: 'ASSOCIATION', axes: ['MEANING', 'FORM'], result: ok ? 'CORRECT' : 'MISMATCH', objectiveVerified: true, confusedWith: ok ? null : picked?.lexicalId || null, elapsedMs: Date.now() - t0 });
        b.classList.add(ok ? 'ok' : 'no');
        if (ok) { st.right++; await S.wait(420); advance(); }
        else {
          $$('.sk-opt', view).find(x => x.dataset.id === w.id)?.classList.add('ok');
          S.crewSay('연결이 살짝 엇갈렸네. 두 단서를 다시 보고 이어가자.');
          // boundary: what it is, and what the picked one is
          $('#skCompare', view).innerHTML = `<div class="sk-compare"><p><b>${esc(w.token)}</b> ${esc(w.meaning)}</p><p><b>${esc(picked.token)}</b> ${esc(picked.meaning)}</p><button type="button" class="sk-btn main" id="skCmpNext">비교했어</button></div>`;
          $('#skCmpNext', view).onclick = advance;
        }
      });
      function advance() { delete view.dataset.lock; st.at++; if (st.at >= items.length) { st.step = 'CONNECT'; st.at = 0; } next(); }
    }

    /* connection test: broad exposure first (spec 9). Every word on hand gets joined once, four at a time;
       words not joined yet and words the learner mixed up come first. */
    const rounds = (() => {
      const all = pool.map(w => ({ w, p: (W.linked(w) ? 0 : 50) + HideV2Memory.summary(w).memorySignature.confusionPattern.count * 20 + Math.random() })).sort((a, b) => b.p - a.p).slice(0, 12).map(x => x.w.id);
      const out = []; for (let i = 0; i < all.length; i += 4) out.push(all.slice(i, i + 4));
      if (out.length > 1 && out[out.length - 1].length < 2) out[out.length - 2].push(...out.pop());
      return out;
    })();
    function connect() {
      const set = rounds[st.at].map(W.fresh), left = S.shuffle(set), right = S.shuffle(set);
      let pick = null, joined = 0; const missed = new Set(), t0 = Date.now();
      view.innerHTML = `${head(`잇기 ${st.at + 1} / ${rounds.length}`)}
        <section class="sk-card connect">
          <p class="sk-step">단어와 뜻을 눌러서 이어 줘</p>
          <div class="sk-pairs">
            <div>${left.map(w => `<button type="button" class="sk-tile" data-side="w" data-id="${esc(w.id)}">${esc(w.token)}</button>`).join('')}</div>
            <div>${right.map(w => `<button type="button" class="sk-tile" data-side="m" data-id="${esc(w.id)}">${esc(w.meaning)}</button>`).join('')}</div>
          </div>
        </section>`;
      bindBack();
      $$('.sk-tile', view).forEach(b => b.onclick = async () => {
        if (b.classList.contains('done')) return;
        if (!pick || pick.dataset.side === b.dataset.side) { pick?.classList.remove('on'); pick = b; b.classList.add('on'); if (b.dataset.side === 'w') S.sayWord(b.textContent); return; }
        const a = pick; pick = null; a.classList.remove('on');
        const wordBtn = a.dataset.side === 'w' ? a : b, w = W.fresh(wordBtn.dataset.id);
        if (a.dataset.id === b.dataset.id) {
          a.classList.add('done'); b.classList.add('done'); joined++;
          S.record(mission.id, w, { stage: 'LINK_CONNECT', evidenceMode: 'ASSOCIATION', axes: ['MEANING'], result: 'CORRECT', objectiveVerified: true, afterMiss: missed.has(w.id), elapsedMs: Date.now() - t0 });
          if (!missed.has(w.id)) st.right++;
          if (joined === set.length) { await S.wait(500); st.at++; if (st.at < rounds.length) connect(); else finish(); }
        } else {
          // which meaning was joined by mistake is kept: that pair becomes this learner's own look-alike choice later
          const other = W.fresh((a.dataset.side === 'm' ? a : b).dataset.id);
          S.record(mission.id, w, { stage: 'LINK_CONNECT', evidenceMode: 'ASSOCIATION', axes: ['MEANING'], result: 'MISMATCH', objectiveVerified: true, confusedWith: other?.lexicalId || null, elapsedMs: Date.now() - t0 });
          missed.add(w.id); a.classList.add('shake'); b.classList.add('shake'); await S.wait(350); a.classList.remove('shake'); b.classList.remove('shake'); }
      });
    }

    function finish() {
      S.quiet();
      view.innerHTML = `${head('끝')}<section class="sk-card done">
        <p class="sk-step">연결 찾기 끝</p><h2>${rounds.flat().length}개의 단어를 이어 봤어</h2>
        <p class="sk-sub">이어 본 단어는 조각 맞추기나 숨은 단어에서 혼자 꺼내 보자.</p>
        <button type="button" class="sk-btn main" id="skDone">탐험 길로</button></section>`;
      bindBack(); $('#skDone', view).onclick = done;
      S.setSeek({ lastMode: 'LINK', lastAt: new Date().toISOString() });
    }
    function next() { ({ PRINCIPLE: principle, CHOICE: choice, CONNECT: connect })[st.step](); }
    next();
  }

  S.link = { start };
})();
