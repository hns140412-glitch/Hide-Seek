/* Hide & Seek (rebuild) — CATCH / 보물함: the cumulative record, several views over the SAME evidence.
   Items (found / hidden again / still meeting), one word's story, and a calendar that is history, not a streak.
   Today's readiness and long-term memory are shown separately. No score is invented here. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  let tab = 'items', month = null;

  const REASON = { recovery: '혼자 다시 찾아볼 단어', confusion: '뜻이 헷갈린 단어', orthographic: '글자가 헷갈린 단어', sound: '소리가 헷갈린 단어', latency: '천천히 떠오른 단어', hint: '단서가 필요했던 단어', decay: '오랜만에 볼 단어', stable: '잘 기억하는 단어' };
  function stateOf(e) {
    // "found" is earned only in this app's own 숨은 단어 찾기; a paper mock test can hide a word again but never finds it
    const recall = (e.evidence || []).filter(x => x.objectiveRecall === true);
    const own = recall.filter(x => x.stage === 'FINAL_SEEK' || x.stage === 'SEEK_AGAIN');
    const last = recall[recall.length - 1];
    if (own.length && last?.result === 'CORRECT' && !e.needsUnassistedRecall) return { key: 'found', label: '찾음' };
    if (e.needsUnassistedRecall || own.length || (last && last.result !== 'CORRECT')) return { key: 'hidden', label: '다시 숨음' };
    return { key: 'meeting', label: '만나는 중' };
  }
  const entries = () => HideV2Memory.wordbook().filter(e => !sampleOnly(e));
  function sampleOnly(e) { const ms = HideV2Store.snapshot().missions; return (e.missions || []).every(m => ms.find(x => x.id === m.id)?.provenance?.source === 'SAMPLE'); }

  function render(view) {
    const list = entries();
    view.innerHTML = `
      <section class="sk-catch">
        <div class="sk-goal"><small>CATCH</small><b>보물함</b></div>
        <div class="sk-tabs" role="tablist">
          <button type="button" role="tab" data-t="items" class="${tab === 'items' ? 'on' : ''}">단어</button>
          <button type="button" role="tab" data-t="calendar" class="${tab === 'calendar' ? 'on' : ''}">달력</button>
        </div>
        <div id="skCatchBody" class="sk-catch-body"></div>
      </section>`;
    $$('.sk-tabs button', view).forEach(b => b.onclick = () => { tab = b.dataset.t; render(view); });
    const body = $('#skCatchBody', view);
    if (!list.length) { body.innerHTML = `<p class="sk-empty">아직 보물함이 비어 있어. 탐험에서 만난 단어가 여기에 모여.</p>`; return S.crewSay('', { speak: false }); }
    if (tab === 'calendar') return calendar(body, list);
    const counts = { found: 0, hidden: 0, meeting: 0 }; list.forEach(e => counts[stateOf(e).key]++);
    // old-word review: offered, never forced (spec 13). Only words from earlier sets that are due after a real gap.
    const old = S.words.hiddenAcross(8);
    body.innerHTML = `
      <p class="sk-catch-sum"><span class="found">찾음 ${counts.found}</span><span class="hidden">다시 숨음 ${counts.hidden}</span><span class="meeting">만나는 중 ${counts.meeting}</span></p>
      ${old.length ? `<button type="button" class="sk-btn main" id="skOld">옛 단어 ${old.length}개 다시 찾기</button>` : ''}
      <ul class="sk-items">${list.map(e => { const s = stateOf(e); return `<li><button type="button" class="sk-item ${s.key}" data-id="${esc(e.lexicalId)}"><b>${esc(e.token)}</b><i>${esc(e.meaning)}</i><span>${s.label}</span></button></li>`; }).join('')}</ul>`;
    $$('.sk-item', body).forEach(b => b.onclick = () => detail(list.find(e => e.lexicalId === b.dataset.id)));
    if (old.length) $('#skOld', body).onclick = () => globalThis.SeekApp.play('recall', { pool: old.map(w => w.id), back: 'catch' });
    S.crewSay('찾은 단어를 모아 둔 곳이야. 어려운 단어부터 다시 살펴보자.', { speak: false });
  }

  function detail(e) {
    if (!e) return;
    const ev = e.evidence || [], s = stateOf(e), fmt = iso => { const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
    const first = ev.length ? fmt(ev.map(x => x.at).sort()[0]) : '';
    const n = pred => ev.filter(pred).length;
    const alone = n(x => x.objectiveRecall === true && x.result === 'CORRECT'), missed = n(x => x.objectiveRecall === true && x.result !== 'CORRECT');
    const rows = [
      ['처음 만난 날', first || '아직'],
      ['흔적 찾기', `${n(x => String(x.stage).startsWith('TRACE'))}번`],
      ['연결 찾기', `${n(x => String(x.stage).startsWith('LINK'))}번`],
      ['조각 맞추기', `${n(x => x.stage === 'PIECE')}번`],
      ['혼자 찾음', `${alone}번`], ['다시 숨음', `${missed}번`], ['단서 사용', `${n(x => x.evidenceMode === 'ASSISTANCE')}번`]
    ];
    const mock = n(x => x.stage === 'MORNING_MOCK_TEST'); if (mock) rows.push(['아침 시험', `${mock}번`]);
    // the learner's own mix-ups and slips: shown as "watch out here", never as a score
    const mixed = [...new Set(ev.map(x => x.confusedWith).filter(Boolean))].map(id => entries().find(x => x.lexicalId === id)?.token).filter(Boolean).slice(0, 3);
    const slipAt = ev.flatMap(x => Array.isArray(x.wrongAt) ? x.wrongAt : []);
    const spell = slipAt.length ? [...String(e.token)].map((c, i) => slipAt.includes(i) ? `<mark>${esc(c)}</mark>` : esc(c)).join('') : '';
    const rung = Math.max(1, Math.min(5, Math.round(e.memoryStrength / 20)));
    S.sheet(`
      <header class="sk-sheet-head"><h2>${esc(e.token)}</h2><button class="sk-x" data-close aria-label="닫기">×</button></header>
      <p class="sk-detail-meaning">${esc(e.meaning)} <button type="button" class="sk-link" id="skDtHear">🔊</button></p>
      <p class="sk-chip ${s.key}">${s.label}</p>
      <div class="sk-ladder" aria-label="기억 사다리 ${rung}칸"><small>기억 사다리</small><div>${[1, 2, 3, 4, 5].map(i => `<span class="${i <= rung ? 'on' : ''}"></span>`).join('')}</div><em>${esc(REASON[e.primaryReason?.key] || '')}</em></div>
      ${mixed.length || spell ? `<div class="sk-watch"><small>여기를 조심해</small>${mixed.length ? `<p>헷갈린 단어 <b>${mixed.map(esc).join(', ')}</b></p>` : ''}${spell ? `<p>헷갈린 글자 <b class="sk-spell">${spell}</b></p>` : ''}</div>` : ''}
      <dl class="sk-story">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="sk-note">탐험 ${e.missions.length}번에 나온 단어야.</p>`, el => { $('#skDtHear', el).onclick = () => S.sayWord(e.token); });
  }

  function calendar(body, list) {
    const days = new Map();
    list.forEach(e => (e.evidence || []).forEach(x => { const k = S.dayKey(new Date(x.at)); const d = days.get(k) || { words: new Set(), alone: 0 }; d.words.add(e.lexicalId); if (x.objectiveRecall === true && x.result === 'CORRECT') d.alone++; days.set(k, d); }));
    const now = new Date(); month = month || { y: now.getFullYear(), m: now.getMonth() };
    const first = new Date(month.y, month.m, 1), n = new Date(month.y, month.m + 1, 0).getDate(), pad = first.getDay();
    const cells = [...Array(pad).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
    body.innerHTML = `
      <div class="sk-cal-head"><button type="button" id="skCalPrev" aria-label="이전 달">‹</button><b>${month.y}년 ${month.m + 1}월</b><button type="button" id="skCalNext" aria-label="다음 달">›</button></div>
      <div class="sk-cal">${['일', '월', '화', '수', '목', '금', '토'].map(d => `<i>${d}</i>`).join('')}${cells.map(d => {
        if (!d) return '<span class="blank"></span>';
        const k = `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, v = days.get(k);
        return `<span class="${v ? 'on' : ''}" ${v ? `data-k="${k}"` : ''}>${d}${v ? `<em>${v.words.size}</em>` : ''}</span>`;
      }).join('')}</div>
      <p class="sk-note" id="skCalNote">탐험한 날에 만난 단어 수가 보여.</p>`;
    $('#skCalPrev', body).onclick = () => { month = month.m ? { y: month.y, m: month.m - 1 } : { y: month.y - 1, m: 11 }; calendar(body, list); };
    $('#skCalNext', body).onclick = () => { month = month.m < 11 ? { y: month.y, m: month.m + 1 } : { y: month.y + 1, m: 0 }; calendar(body, list); };
    $$('.sk-cal span.on', body).forEach(c => c.onclick = () => { const v = days.get(c.dataset.k); $('#skCalNote', body).textContent = `이날 단어 ${v.words.size}개를 만났고, 혼자 힘으로 ${v.alone}번 찾았어.`; });
  }

  S.catchView = { render };
})();
