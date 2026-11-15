/* Hide & Seek (rebuild) — app shell: three places (HOME / EXPLORE / CATCH), the menu, and the companion.
   The shell owns navigation only. Learning rules live in the mode files and the core engines. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const MODES = { trace: () => S.trace, link: () => S.link, piece: () => S.piece, recall: () => S.recall };
  const VIEWS = { home: v => S.home.render(v), explore: v => S.explore.render(v), catch: v => S.catchView.render(v) };
  let tab = 'home', playing = null;

  const app = () => $('#seekApp'), view = () => $('#skView');
  function paintCrew() { const c = S.crewInfo(); $('#skCrewImg').src = c.img; $('#skCrewImg').alt = c.name; }

  function go(next = tab) {
    S.quiet(); S.closeSheet(); playing = null;
    tab = VIEWS[next] ? next : 'home';
    const el = app(); el.dataset.tab = tab; delete el.dataset.mode;
    $$('#skNav button').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    const v = view(); v.scrollTop = 0; delete v.dataset.lock;
    VIEWS[tab](v);
  }

  function play(mode) {
    const m = MODES[mode]?.(); if (!m) return;
    if (!S.words.mission()) { S.toast('먼저 오늘의 단어를 가져오자.'); return S.intake.open(); }
    S.quiet(); playing = mode;
    const el = app(); el.dataset.mode = mode;
    S.crewSay('', { speak: false });
    const v = view(); v.scrollTop = 0; delete v.dataset.lock;
    m.start(v, () => go('explore'));
  }

  /* ---------- companion: who comes along never changes what is learned ---------- */
  function crewSheet(first = false) {
    const bound = S.boundCrew(), cur = S.crewId();
    S.sheet(`
      <header class="sk-sheet-head"><h2>${first ? '누구와 함께 갈까?' : '함께 가는 탐험대원'}</h2>${first ? '' : '<button class="sk-x" data-close aria-label="닫기">×</button>'}</header>
      <p class="sk-note">누구와 가도 탐험은 똑같아. 목소리와 말투만 달라져.</p>
      <ul class="sk-crew-pick">${S.CREW.map(c => `<li><button type="button" class="${c.id === cur ? 'on' : ''}" data-crew="${c.id}" ${bound && bound !== c.id ? 'disabled' : ''}><img src="./characters/ui_cutouts/${c.id}.png" alt=""><b>${esc(c.name)}</b></button></li>`).join('')}</ul>
      ${bound ? '<p class="sk-note">Ready &amp; Set에서 정한 대원과 함께 가고 있어.</p>' : ''}`, el => {
      $$('[data-crew]', el).forEach(b => b.onclick = () => {
        S.setSeek({ crewId: b.dataset.crew, crewChosen: true });
        paintCrew(); S.closeSheet();
        if (!playing) go(tab);
      });
    });
  }

  /* ---------- menu: word sets, sound, the classic app ---------- */
  function menu() {
    const missions = HideV2Mission.listMissions().filter(m => m.status !== 'ARCHIVED'), active = HideV2Store.snapshot().activeMissionId;
    S.sheet(`
      <header class="sk-sheet-head"><h2>메뉴</h2><button class="sk-x" data-close aria-label="닫기">×</button></header>
      <h3 class="sk-menu-h">단어 묶음</h3>
      ${missions.length ? `<ul class="sk-sets">${missions.map(m => `<li class="${m.id === active ? 'on' : ''}">
        <button type="button" class="sk-set" data-set="${esc(m.id)}"><b>${esc(m.title || '단어 묶음')}</b><i>${(m.items || []).length}개${m.provenance?.source === 'SAMPLE' ? ' · 연습용' : ''}</i></button>
        <button type="button" class="sk-del" data-del="${esc(m.id)}" aria-label="${esc(m.title || '단어 묶음')} 지우기">지우기</button></li>`).join('')}</ul>` : '<p class="sk-note">아직 단어 묶음이 없어.</p>'}
      <div class="sk-row2"><button type="button" class="sk-btn main" id="skMenuAdd">새 단어 가져오기</button><button type="button" class="sk-btn ghost" id="skMenuMute">${S.isMuted() ? '소리 켜기' : '소리 끄기'}</button></div>
      <button type="button" class="sk-btn ghost" id="skMenuFamily">가족 학습 연결${S.family?.status().bound ? ' · 연결됨' : ''}</button>
      <a class="sk-link" href="./index.html">이전 화면으로 가기</a>
      <p class="sk-note">${esc(globalThis.HIDE_RELEASE?.release_id || '')}</p>`, el => {
      $$('[data-set]', el).forEach(b => b.onclick = () => { HideV2Mission.setActive(b.dataset.set); S.closeSheet(); go('home'); });
      $$('[data-del]', el).forEach(b => b.onclick = () => {
        if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '정말 지울까?'; return; }
        try { HideV2Mission.deleteMission(b.dataset.del); } catch (e) { return S.toast('이 묶음은 지금 지울 수 없어.'); }
        go(tab); menu();
      });
      $('#skMenuFamily', el).onclick = () => { S.closeSheet(); S.family?.open(); };
      $('#skMenuAdd', el).onclick = () => { S.closeSheet(); S.intake.open(); };
      $('#skMenuMute', el).onclick = () => { const v = !S.isMuted(); S.setMuted(v); S.setSeek({ muted: v }); S.closeSheet(); S.toast(v ? '소리를 껐어.' : '소리를 켰어.'); };
    });
  }

  function boot() {
    try { globalThis.HideV2LegacyMigration?.migrateIfNeeded?.(); } catch (e) { console.warn('[seek] legacy migration skipped', e); }
    S.setMuted(!!S.seekState().muted);
    paintCrew();
    $$('#skNav button').forEach(b => b.onclick = () => go(b.dataset.tab));
    $('#skMenuBtn').onclick = menu;
    $('#skCrewBtn').onclick = () => crewSheet(false);
    go('home');
    if (!S.boundCrew() && !S.seekState().crewChosen) crewSheet(true);
  }

  globalThis.SeekApp = { go, play, menu, crewSheet };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
