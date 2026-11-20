/* Hide & Seek (rebuild) — EXPLORE: the learner picks a way to explore. Not a fixed course.
   The crew may point at one path, but every path is open. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const MODES = [
    { id: 'trace', en: 'TRACE', ko: '흔적 찾기', sub: '보고 · 듣고 · 떠올리기' },
    { id: 'link', en: 'LINK', ko: '연결 찾기', sub: '엮고 · 가려내기' },
    { id: 'piece', en: 'PIECE', ko: '조각 맞추기', sub: '빠진 조각 채우기' },
    { id: 'recall', en: 'RECALL', ko: '숨은 단어 찾기', sub: '혼자 힘으로 꺼내기' }
  ];

  function suggest(p) {
    if (!p.total) return null;
    if (p.unmetNew > 0 || p.trace < Math.ceil(p.total / 2)) return 'trace';
    if (p.link < Math.ceil(p.total / 2)) return 'link';
    if (p.piece < Math.ceil(p.total / 2)) return 'piece';
    return 'recall';
  }

  function render(view) {
    const W = S.words, p = W.progress();
    if (!p.total) {
      view.innerHTML = `<section class="sk-explore"><div class="sk-goal"><small>EXPLORE</small><b>아직 숨은 단어가 없어</b></div>
        <div class="sk-home-cta"><button type="button" class="sk-btn main big" id="skGet">오늘의 단어 가져오기</button></div></section>`;
      $('#skGet', view).onclick = () => S.intake.open();
      return S.crewSay('', { speak: false });
    }
    const tip = suggest(p), stat = { trace: `${p.trace} / ${p.total}`, link: `${p.link} / ${p.total}`, piece: `${p.piece} / ${p.total}`, recall: `찾음 ${p.found} / ${p.total}` };
    view.innerHTML = `
      <section class="sk-explore">
        <div class="sk-goal"><small>EXPLORE</small><b>어느 길로 갈까?</b></div>
        <ul class="sk-signs">
          ${MODES.map(m => `<li><button type="button" class="sk-sign ${m.id === tip ? 'tip' : ''}" data-mode="${m.id}">
            <span class="sk-sign-name"><small>${m.en}</small><b>${m.ko}</b></span>
            <span class="sk-sign-sub">${m.sub}</span><span class="sk-sign-stat">${stat[m.id]}</span></button></li>`).join('')}
        </ul>
      </section>`;
    $$('.sk-sign', view).forEach(b => b.onclick = () => globalThis.SeekApp.play(b.dataset.mode));
    S.crewSay('가까운 단서를 하나씩 만나며 숲길을 따라가자. 어느 길부터 시작할지도 네가 고를 수 있어.', { speak: !S.seekState().exploreIntroSaid });
    S.setSeek({ exploreIntroSaid: true });
  }

  S.explore = { render, MODES };
})();
