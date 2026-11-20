/* Hide & Seek (rebuild) — HOME: today's launch surface, not a dashboard.
   A: no words yet -> get today's words.  C: words ready -> the 12-word notebook over the waterfall + one start.
   (B, review-before-commit, is the intake sheet.)  A Ready & Set goal, when present, is shown as today's goal. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;

  function readyGoal() {
    try { const q = new URLSearchParams(location.search); return q.get('goal_title') || q.get('task_title') || ''; } catch { return ''; }
  }

  function render(view) {
    const W = S.words, mission = W.mission(), all = W.words();
    if (!mission || !all.length) return renderEmpty(view);
    const p = W.progress(), goal = readyGoal();
    // the board shows what today's first trail is about: new words first, then review
    const board = [...all.filter(W.isNew), ...all.filter(w => !W.isNew(w))].slice(0, 12);
    const rest = all.length - board.length;
    view.innerHTML = `
      <section class="sk-home">
        <div class="sk-goal">${goal ? `<small>오늘의 탐험 목표</small><b>${esc(goal)}</b>` : `<small>${esc(mission.title)}</small><b>숨은 단어 ${all.length}개</b>`}
          <span class="sk-goal-meta">${p.newCount ? `새 단어 ${p.newCount}` : ''}${p.newCount && p.reviewCount ? ' · ' : ''}${p.reviewCount ? `복습 ${p.reviewCount}` : ''}${W.isSample() ? ' · 예시' : ''}</span>
        </div>
        <ul class="sk-board" aria-label="오늘의 단어">
          ${board.map(w => `<li><button type="button" class="sk-slip ${W.found(w) ? 'found' : W.met(w) ? 'met' : ''}" data-id="${esc(w.id)}"><b>${esc(w.token)}</b><i>${esc(w.meaning)}</i></button></li>`).join('')}
        </ul>
        ${rest > 0 ? `<p class="sk-more">그리고 ${rest}개 더</p>` : ''}
        <div class="sk-home-cta">
          <button type="button" class="sk-btn main big" id="skGo">${p.unmetNew === p.newCount && !p.found ? '탐험 출발' : '탐험 이어가기'}</button>
          <button type="button" class="sk-btn ghost" id="skNewWords">새 단어 가져오기</button>
        </div>
        <p class="sk-found">오늘 혼자 찾은 단어 <b>${p.found}</b> / ${p.total}</p>
      </section>`;
    $$('.sk-slip', view).forEach(b => b.onclick = () => {
      const w = W.fresh(b.dataset.id); if (!w) return;
      // meaning stays hidden for a word not met yet: first meeting is think-first, in TRACE
      if (W.isNew(w) && !W.met(w)) { S.sayWord(w.token); return S.toast('아직 만나지 않은 단어야. 탐험에서 먼저 생각해 보자.'); }
      b.classList.toggle('open'); S.sayWord(w.token);
    });
    $('#skGo', view).onclick = () => globalThis.SeekApp.go('explore');
    $('#skNewWords', view).onclick = () => S.intake.open();
    S.crewSay(p.found === p.total ? '오늘 탐험을 마쳤어. 다시 찾을 단어는 다음에 만나자.' : '단어 하나하나가 작은 발견이야. 다시 만나볼 단어도 여기에서 찾을 수 있어.', { speak: false });
  }

  function renderEmpty(view) {
    view.innerHTML = `
      <section class="sk-home empty">
        <div class="sk-goal"><small>숲과 폭포</small><b>오늘은 어떤 단어가 숨었을까?</b></div>
        <div class="sk-home-cta">
          <button type="button" class="sk-btn main big" id="skGet">오늘의 단어 가져오기</button>
          <button type="button" class="sk-btn ghost" id="skSample">예시 단어로 해 보기</button>
        </div>
      </section>`;
    $('#skGet', view).onclick = () => S.intake.open();
    $('#skSample', view).onclick = () => S.intake.addSample();
    S.crewSay('단어장이나 시험지를 가져오면 탐험 길이 열려.', { speak: false });
  }

  S.home = { render };
})();
