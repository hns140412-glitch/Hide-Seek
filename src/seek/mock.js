/* Hide & Seek (rebuild) — morning mock test record (spec 20).
   A parent and child do a paper mock test in the morning; the result is written here in a few taps.
   It is external learning evidence: it is kept apart from this app's own 숨은 단어 찾기 results, it never marks a word
   "found" here, and it is not sent as this app's recall event. What it does: weak words come up first in the next
   exploration, and a word answered with help must still be found alone. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const OUTCOMES = [
    { key: 'CORRECT', label: '맞음' },
    { key: 'CONFUSED', label: '헷갈림' },
    { key: 'WRONG', label: '틀림' },
    { key: 'ASSISTED_CORRECT', label: '도움 받고 맞음' },
    { key: 'RECOVERED_CORRECT', label: '다시 해서 맞음' }
  ];
  // how each outcome is written down (memory rules of spec 20)
  const ROW = {
    CORRECT: { result: 'CORRECT', objectiveRecall: true },
    CONFUSED: { result: 'CONFUSED', objectiveRecall: false, uncertain: true },
    WRONG: { result: 'WRONG', objectiveRecall: true },
    ASSISTED_CORRECT: { result: 'CORRECT', objectiveRecall: false, assisted: true },
    RECOVERED_CORRECT: { result: 'CORRECT', objectiveRecall: true, spacedEvidence: false, recovered: true }
  };

  function open() {
    const W = S.words, mission = W.mission(), words = W.words();
    if (!mission || !words.length) return S.toast('먼저 오늘의 단어를 가져오자.');
    if (W.isSample()) return S.toast('예시 단어에는 시험 결과를 적지 않아.');
    const picked = {};
    const draw = () => {
      const top = $('.sk-sheet-card')?.scrollTop || 0, n = Object.keys(picked).length;
      S.sheet(`
        <header class="sk-sheet-head"><h2>아침 시험 결과 적기</h2><button class="sk-x" data-close aria-label="닫기">×</button></header>
        <p class="sk-note">종이 시험을 본 단어만 눌러 줘. 안 본 단어는 그대로 두면 돼. 틀린 단어와 헷갈린 단어는 다음 탐험에서 먼저 나와.</p>
        <ul class="sk-mock">${words.map(w => `<li data-id="${esc(w.id)}"><p><b>${esc(w.token)}</b><i>${esc(w.meaning)}</i></p>
          <div>${OUTCOMES.map(o => `<button type="button" class="${picked[w.id] === o.key ? 'on ' : ''}${o.key.toLowerCase()}" data-o="${o.key}" aria-pressed="${picked[w.id] === o.key}">${o.label}</button>`).join('')}</div></li>`).join('')}</ul>
        <div class="sk-row2"><button type="button" class="sk-btn ghost" id="skMockAll">안 누른 단어는 모두 맞음</button><button type="button" class="sk-btn main" id="skMockSave" ${n ? '' : 'disabled'}>${n}개 적어 두기</button></div>`, el => {
        $$('[data-o]', el).forEach(b => b.onclick = () => { const id = b.closest('li').dataset.id; if (picked[id] === b.dataset.o) delete picked[id]; else picked[id] = b.dataset.o; draw(); });
        $('#skMockAll', el).onclick = () => { words.forEach(w => { if (!picked[w.id]) picked[w.id] = 'CORRECT'; }); draw(); };
        $('#skMockSave', el).onclick = save;
        $('.sk-sheet-card', el).scrollTop = top;
      });
    };
    function save() {
      const testId = 'mock_' + Date.now().toString(36);
      for (const [id, key] of Object.entries(picked)) {
        const w = W.fresh(id); if (!w) continue;
        S.record(mission.id, w, {
          stage: 'MORNING_MOCK_TEST', evidenceMode: 'EXTERNAL_ASSESSMENT', axes: ['FORM', 'RECALL'], source: 'MORNING_MOCK_TEST', actor: 'PARENT_CHILD',
          objectiveVerified: false, recallScoreImpact: false, mockOutcome: key, mockTestId: testId, ...ROW[key]
        });
      }
      const weak = Object.values(picked).filter(k => k !== 'CORRECT').length;
      S.closeSheet(); S.toast(weak ? `적어 뒀어. ${weak}개는 다음 탐험에서 먼저 만나자.` : '적어 뒀어. 모두 맞았네.');
      globalThis.SeekApp?.go('home');
    }
    draw();
  }

  S.mock = { open, OUTCOMES };
})();
