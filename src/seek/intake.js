/* Hide & Seek (rebuild) — getting today's words in: photo (on-device only), paste/typing, review-before-commit.
   OCR DRAFT != CONFIRMED WORD SET: nothing becomes a learning item until the reviewed rows are saved,
   and a row the device was unsure about must be ticked by a person first. No network or paid call here. */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const HANGUL = /[ㄱ-ㆎ가-힣]/;

  function parseLines(text) {
    const rows = [];
    for (const raw of String(text || '').split(/\r?\n/)) {
      const line = raw.replace(/^\s*\d+[.)]\s*/, '').trim();
      if (!line) continue;
      let token = '', meaning = '';
      const cut = line.split(/\s*(?:\t|=|:|,|\s-\s|\s{2,})\s*/).filter(Boolean);
      if (cut.length >= 2) { token = cut[0]; meaning = cut.slice(1).join(', '); }
      else { const i = line.search(HANGUL); if (i > 0) { token = line.slice(0, i).trim(); meaning = line.slice(i).trim(); } }
      if (token && meaning) { if (HANGUL.test(token) && !HANGUL.test(meaning)) [token, meaning] = [meaning, token]; rows.push({ token, meaning }); }
    }
    return rows;
  }

  // NEW / REVIEW comes from the learner's own history, never from where a word sat on the page.
  function inferRole(token) {
    // "met before" means real evidence in the learner's own word sets; example words and never-opened lists do not count
    const t = String(token).trim().toLowerCase();
    const seen = HideV2Store.snapshot().missions.some(m => m.provenance?.source !== 'SAMPLE' && (m.items || []).some(w => String(w.token).toLowerCase() === t && (w.evidence || []).length > 0));
    return seen ? 'REVIEW' : 'NEW';
  }

  async function detectOnDevice(file) {
    if (!('TextDetector' in window)) return { state: 'UNSUPPORTED', rows: [] };
    try {
      const bmp = await createImageBitmap(file), found = await new window.TextDetector().detect(bmp);
      const lines = found.map(b => ({ t: String(b.rawValue || '').trim(), y: b.boundingBox?.y || 0, x: b.boundingBox?.x || 0 })).filter(b => b.t)
        .sort((a, b) => a.y - b.y || a.x - b.x);
      const merged = []; let last = null;
      for (const l of lines) { if (last && Math.abs(l.y - last.y) < 14) last.t += '  ' + l.t; else { last = { ...l }; merged.push(last); } }
      const rows = parseLines(merged.map(m => m.t).join('\n')).map(r => ({ ...r, unsure: true }));
      return { state: rows.length ? 'OK' : 'NO_CANDIDATE', rows };
    } catch { return { state: 'FAILED', rows: [] }; }
  }

  const PHOTO_NOTES = {
    UNSUPPORTED: '이 기기는 사진 속 글자 읽기를 지원하지 않아. 사진은 어디에도 보내지 않았어. 직접 적어 줘.',
    NO_CANDIDATE: '사진에서 단어와 뜻의 짝을 찾지 못했어. 사진은 어디에도 보내지 않았어. 직접 적어 줘.',
    FAILED: '사진 읽기를 마치지 못했어. 사진은 어디에도 보내지 않았어. 직접 적어 줘.'
  };

  function open(startText = '', note = '') {
    S.sheet(`
      <header class="sk-sheet-head"><h2>오늘의 단어 가져오기</h2><button class="sk-x" data-close aria-label="닫기">×</button></header>
      <p class="sk-note">${esc(note || '단어장이나 시험지에 있는 단어를 한 줄에 하나씩 적어 줘. 예) ocean 대양')}</p>
      <div class="sk-row2">
        <button class="sk-btn ghost" id="skInPhoto" type="button">사진에서 읽기</button>
        <button class="sk-btn ghost" id="skInSample" type="button">예시 단어로 해 보기</button>
      </div>
      <textarea id="skInText" class="sk-textarea" rows="8" placeholder="ocean 대양&#10;island 섬&#10;rainforest 열대우림">${esc(startText)}</textarea>
      <button class="sk-btn main" id="skInNext" type="button">단어 확인하기</button>`, el => {
      $('#skInNext', el).onclick = () => {
        const rows = parseLines($('#skInText', el).value);
        if (!rows.length) return S.toast('단어와 뜻을 한 줄에 하나씩 적어 줘.');
        review(rows.map(r => ({ ...r, unsure: false })), 'MANUAL');
      };
      $('#skInSample', el).onclick = () => { S.closeSheet(); addSample(); };
      $('#skInPhoto', el).onclick = () => {
        const input = $('#skPhotoInput'); input.value = '';
        input.onchange = async () => {
          const f = input.files?.[0]; if (!f) return;
          S.toast('이 기기 안에서 글자를 찾는 중이야.');
          const res = await detectOnDevice(f);
          if (res.rows.length) return review(res.rows, 'DEVICE_OCR');
          open($('#skInText', el)?.value || '', PHOTO_NOTES[res.state]);
        };
        input.click();
      };
    });
  }

  function review(rows, source) {
    const data = rows.map((r, i) => ({ i, token: r.token, meaning: r.meaning, unsure: !!r.unsure, ok: !r.unsure, role: inferRole(r.token, r.meaning) }));
    const find = node => data.find(x => x.i === +node.closest('li').dataset.i);
    const draw = () => { const top = $('.sk-sheet-card')?.scrollTop || 0; S.sheet(`
      <header class="sk-sheet-head"><h2>단어 확인</h2><button class="sk-x" data-close aria-label="닫기">×</button></header>
      <p class="sk-note">${source === 'DEVICE_OCR' ? '사진에서 찾은 후보야. 틀릴 수 있으니 한 줄씩 보고 고친 다음 ✓를 눌러 줘.' : '맞는지 보고, 틀린 곳은 바로 고쳐 줘.'}</p>
      <ul class="sk-review">${data.map(d => `
        <li data-i="${d.i}" class="${d.ok ? '' : 'unsure'}">
          <input class="sk-in" data-f="token" value="${esc(d.token)}" aria-label="단어" autocapitalize="off" autocomplete="off" spellcheck="false">
          <input class="sk-in" data-f="meaning" value="${esc(d.meaning)}" aria-label="뜻">
          <button type="button" class="sk-role ${d.role === 'NEW' ? 'new' : 'rev'}" data-role>${d.role === 'NEW' ? '새 단어' : '복습'}</button>
          ${d.unsure ? `<button type="button" class="sk-tick ${d.ok ? 'on' : ''}" data-ok aria-label="확인함">✓</button>` : ''}
          <button type="button" class="sk-del" data-del aria-label="이 줄 빼기">×</button>
        </li>`).join('')}</ul>
      <button class="sk-btn main" id="skRvSave" type="button">이 단어들로 탐험 준비</button>`, el => {
      el.oninput = e => { const li = e.target.closest('li'); if (li) find(e.target)[e.target.dataset.f] = e.target.value; };
      $$('[data-role]', el).forEach(b => b.onclick = () => { const d = find(b); d.role = d.role === 'NEW' ? 'REVIEW' : 'NEW'; draw(); });
      $$('[data-ok]', el).forEach(b => b.onclick = () => { const d = find(b); d.ok = !d.ok; draw(); });
      $$('[data-del]', el).forEach(b => b.onclick = () => { data.splice(data.indexOf(find(b)), 1); draw(); });
      $('#skRvSave', el).onclick = () => {
        const valid = data.filter(d => d.token.trim() && d.meaning.trim());
        if (!valid.length) return S.toast('단어가 하나도 없어.');
        if (valid.some(d => !d.ok)) return S.toast('아직 확인하지 않은 줄이 있어. 보고 ✓를 눌러 줘.');
        commit(valid, source);
      };
      $('.sk-sheet-card', el).scrollTop = top;
    }); };
    draw();
  }

  function commit(rows, source) {
    const d = new Date();
    HideV2Mission.addMission({
      title: `${d.getMonth() + 1}월 ${d.getDate()}일 단어 탐험`,
      items: rows.map((r, i) => ({ word: r.token.trim(), meaning: r.meaning.trim(), missionRole: r.role, missionRoleSource: 'REVIEW_SCREEN', sourceRowIndex: i, confidence: r.unsure ? 'low' : 'high' })),
      provenance: { source, reviewConfirmed: true, confirmedAt: d.toISOString() }
    });
    S.closeSheet(); S.toast(`${rows.length}개의 단어가 숲에 숨었어.`);
    globalThis.SeekApp?.go('home');
  }

  // Example words: playable at once, never reported as the child's learning record.
  const SAMPLE = [['ocean', '대양'], ['island', '섬'], ['rainforest', '열대우림'], ['mountain', '산'], ['desert', '사막'], ['planet', '행성'], ['jungle', '정글'], ['glacier', '빙하'], ['earthquake', '지진'], ['climate', '기후'], ['harvest', '수확'], ['environment', '환경']];
  function addSample() {
    HideV2Mission.addMission({ title: '예시 단어 탐험', items: SAMPLE.map(([word, meaning], i) => ({ word, meaning, missionRole: 'NEW', sourceRowIndex: i })), provenance: { source: 'SAMPLE' } });
    S.toast('예시 단어 12개가 숲에 숨었어.'); globalThis.SeekApp?.go('home');
  }

  S.intake = { open, review, parseLines, inferRole, addSample };
})();
