/* Hide & Seek — 기초 다지기 (BSP-20261113)
 * HS-1 비와 비율 생각말: TRACE -> LINK -> CORE -> RECALL
 * HS-2 숨은 진짜 낱말: 한 자모만 틀린 가짜 이름표 찾아 고치기
 * Patterns mined from 국가기초학력지원포털 materials (structure only). All words, numbers and
 * scenes here are original TAKY content. Additive module: no change to app.js state.
 */
(function (root) {
  'use strict';
  var VERSION = '2026.11.13-hide-basic-skills-v1';
  var SOURCE_REF = 'BSP-20261113';

  // ---------- Hangul helpers (pure) ----------
  var L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
  var V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('');
  var T = [''].concat('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.split(''));
  function decompose(ch) {
    var c = ch.charCodeAt(0) - 0xAC00;
    if (c < 0 || c > 11171) return null;
    return { l: Math.floor(c / 588), v: Math.floor((c % 588) / 28), t: c % 28 };
  }
  function compose(p) { return String.fromCharCode(0xAC00 + p.l * 588 + p.v * 28 + p.t); }
  // Returns [{index, slot:'l'|'v'|'t', real, fake}] for every jamo that differs.
  function jamoDiff(real, fake) {
    if (real.length !== fake.length) return null;
    var out = [];
    for (var i = 0; i < real.length; i++) {
      if (real[i] === fake[i]) continue;
      var a = decompose(real[i]), b = decompose(fake[i]);
      if (!a || !b) return null;
      ['l', 'v', 't'].forEach(function (k) {
        if (a[k] !== b[k]) out.push({ index: i, slot: k, real: a[k], fake: b[k] });
      });
    }
    return out;
  }
  function jamoLabel(slot, idx) { return slot === 'l' ? L[idx] : slot === 'v' ? V[idx] : T[idx]; }

  // ---------- HS-2 data: real / one-jamo-off fake ----------
  var NAME_TAGS = [
    { real: '하마', fake: '허마', pic: '🦛' }, { real: '모자', fake: '머자', pic: '🧢' },
    { real: '바나나', fake: '버나나', pic: '🍌' }, { real: '토마토', fake: '투마토', pic: '🍅' },
    { real: '구두', fake: '고두', pic: '👞' }, { real: '나무', fake: '나모', pic: '🌳' },
    { real: '고구마', fake: '거구마', pic: '🍠' }, { real: '가방', fake: '거방', pic: '🎒' },
    { real: '사과', fake: '서과', pic: '🍎' }, { real: '기차', fake: '기처', pic: '🚂' },
    { real: '포도', fake: '푸도', pic: '🍇' }, { real: '수박', fake: '수벅', pic: '🍉' },
    { real: '우산', fake: '우선', pic: '☂️', skip: true } // 우선 is a real word -> excluded by rule
  ].filter(function (x) { return !x.skip; });
  // Distractor jamo for the fix step: same slot class, visually close.
  var NEAR_V = { 0: [4, 8], 4: [0, 13], 8: [13, 4], 13: [8, 0] }; // ㅏ ㅓ ㅗ ㅜ

  // ---------- HS-1 data ----------
  var UNIT = { unit_path: '수학 > 변화와 관계 > 비와 비율', floor_level: 2, grade_band: '5-6' };
  var TERMS = [
    { term: '비', easy: '두 수를 나눗셈으로 견주어 나타낸 것', ex: '구슬 3개와 5개 → 3 : 5' },
    { term: '기준량', easy: "'~에 대한' 앞에 오는, 기준이 되는 양", ex: '5에 대한 3의 비 → 기준량 5' },
    { term: '비교하는 양', easy: '기준량과 견주어 보는 양', ex: '5에 대한 3의 비 → 비교하는 양 3' },
    { term: '비율', easy: '비교하는 양 ÷ 기준량 (비의 값이라고도 해요)', ex: '3 : 5 → 3/5 = 0.6' },
    { term: '백분율', easy: '기준량을 100으로 볼 때의 비율, %로 써요', ex: '0.6 → 60%' },
    { term: '할인율', easy: '원래 값에 대한 깎아 준 값의 비율', ex: '2000원에서 400원 깎음 → 20%' }
  ];
  var HANJA = [
    { term: '비', hanja: '比', gloss: '견줄 비', note: '두 사람이 나란히 선 모양 → 나란히 놓고 견주다' },
    { term: '비율', hanja: '比率', gloss: '견줄 비 · 비율 률', note: '견준 정도' },
    { term: '기준량', hanja: '基準量', gloss: '터 기 · 법도 준 · 헤아릴 량', note: '바탕이 되는 양' },
    { term: '백분율', hanja: '百分率', gloss: '일백 백 · 나눌 분 · 비율 률', note: '100으로 나눈 비율' }
  ];
  // phrase forms: 'of' = "B의 A에 대한 비", 'to' = "A에 대한 B의 비", 'and' = "B와 A의 비" — all mean B : A
  function ratioPhrase(cmp, base, form) {
    if (form === 'to') return base + '에 대한 ' + cmp + '의 비';
    if (form === 'of') return cmp + '의 ' + base + '에 대한 비';
    return cmp + josaWa(cmp) + ' ' + base + '의 비';
  }
  // 와/과 follows the Sino-Korean reading of the last digit: 영 일 삼 육 칠 팔 (and 십) end in a consonant.
  function josaWa(n) { return /[013678]$/.test(String(n)) ? '과' : '와'; }
  var CORE_ITEMS = [
    { cmp: 3, base: 5, form: 'to', scene: '🔴 빨간 구슬 3개, 🔵 파란 구슬 5개' },
    { cmp: 7, base: 4, form: 'of', scene: '🍪 쿠키 7개, 🥛 우유 4잔' },
    { cmp: 2, base: 9, form: 'to', scene: '🐟 금붕어 2마리, 🐢 거북 9마리' },
    { cmp: 12, base: 13, form: 'and', scene: '🙋 남학생 12명, 🙋‍♀️ 여학생 13명' }
  ];
  var RECALL = {
    target: 10,
    tiles: [
      { cmp: 4, base: 10, form: 'to' }, { cmp: 10, base: 4, form: 'to' },
      { cmp: 6, base: 10, form: 'and' }, { cmp: 10, base: 6, form: 'and' },
      { cmp: 3, base: 10, form: 'of' }, { cmp: 10, base: 3, form: 'of' }
    ]
  };
  var PERCENT_ITEM = { scene: '반 친구 25명 중 15명이 소풍 장소로 바다를 골랐어요.', q: '바다를 고른 비율은 몇 %일까요?',
    choices: ['60%', '15%', '40%'], answer: '60%', why: '15 ÷ 25 = 0.6 → 0.6 × 100 = 60%' };

  // ---------- evidence (local event only; central wiring is a later step) ----------
  function emit(activity, payload) {
    var detail = Object.assign({ app: 'HIDE_SEEK', activity_id: activity, source_ref: SOURCE_REF, at: new Date().toISOString() }, payload || {});
    try { root.dispatchEvent(new CustomEvent('taky:basic-skills-result', { detail: detail })); } catch (e) {}
    try {
      var k = 'hide.basicSkills.v1', log = JSON.parse(root.localStorage.getItem(k) || '[]');
      log.push(detail); root.localStorage.setItem(k, JSON.stringify(log.slice(-200)));
    } catch (e) {}
  }

  // ---------- UI ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var host, body, state = {}, gen = 0;
  // Delayed transitions only fire if nothing re-rendered in between.
  function later(fn, ms) { var g = gen; setTimeout(function () { if (g === gen) fn(); }, ms); }

  function open(which) {
    if (!host) {
      host = document.createElement('div');
      host.id = 'hsBasics'; host.className = 'hsb'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', '기초 다지기');
      host.innerHTML = '<div class="hsb-sheet"><header class="hsb-head"><b>기초 다지기</b><button type="button" class="hsb-x" aria-label="닫기">닫기</button></header><div class="hsb-body"></div></div>';
      document.body.appendChild(host);
      host.querySelector('.hsb-x').addEventListener('click', close);
      body = host.querySelector('.hsb-body');
    }
    host.hidden = false; document.documentElement.classList.add('hsb-open');
    if (which === 'ratio') ratioStart(); else if (which === 'tags') tagsStart(); else menu();
  }
  function close() { gen++; if (host) host.hidden = true; document.documentElement.classList.remove('hsb-open'); if (location.hash.indexOf('#basics') === 0) history.replaceState(null, '', location.pathname + location.search); }

  function menu() {
    gen++;
    body.innerHTML = '<p class="hsb-lead">오늘은 어떤 걸 찾아볼까?</p>' +
      '<button type="button" class="hsb-card" data-go="tags"><span class="hsb-emoji">🔎</span><span><b>숨은 진짜 낱말</b><small>한 글자가 틀린 가짜 이름표를 찾아 고쳐요 · 1~2학년</small></span></button>' +
      '<button type="button" class="hsb-card" data-go="ratio"><span class="hsb-emoji">⚖️</span><span><b>비와 비율 생각말</b><small>기준량 · 비율 · 백분율 · 5~6학년</small></span></button>';
    body.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { open(b.dataset.go); }); });
  }

  // ----- HS-2 -----
  function tagsStart() { state.tags = { round: 0, rounds: 3, pool: shuffle(NAME_TAGS), misses: 0 }; tagsRound(); }
  function tagsRound() {
    gen++;
    var s = state.tags;
    if (s.round >= s.rounds) {
      emit('HS-2', { stage: 'APPLY', correct: true, misses: s.misses, rounds: s.rounds });
      body.innerHTML = '<div class="hsb-done"><div class="hsb-big">🎉</div><b>가짜 이름표를 모두 고쳤어!</b><p>틀린 곳은 늘 한 군데뿐이었지?</p><button type="button" class="hsb-cta" data-again>한 번 더</button><button type="button" class="hsb-ghost" data-menu>처음으로</button></div>';
      body.querySelector('[data-again]').addEventListener('click', tagsStart); body.querySelector('[data-menu]').addEventListener('click', menu); return;
    }
    var picks = s.pool.slice(s.round * 6, s.round * 6 + 6);
    if (picks.length < 6) picks = shuffle(NAME_TAGS).slice(0, 6);
    var fakeIdx = Math.floor(Math.random() * 6);
    s.cur = { picks: picks, fakeIdx: fakeIdx };
    body.innerHTML = '<p class="hsb-step">' + (s.round + 1) + ' / ' + s.rounds + '</p><p class="hsb-lead">이름표 하나가 <b>한 글자</b> 틀렸어. 어디 숨었을까?</p><div class="hsb-tags">' +
      picks.map(function (w, i) { return '<button type="button" class="hsb-tag" data-i="' + i + '"><span class="hsb-pic">' + w.pic + '</span><span class="hsb-name">' + esc(i === fakeIdx ? w.fake : w.real) + '</span></button>'; }).join('') + '</div>';
    body.querySelectorAll('.hsb-tag').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i;
        if (i !== fakeIdx) { s.misses++; b.classList.add('hsb-nope'); setTimeout(function () { b.classList.remove('hsb-nope'); }, 500); return; }
        tagsFix(picks[i]);
      });
    });
  }
  function tagsFix(w) {
    gen++;
    var d = jamoDiff(w.real, w.fake)[0];
    var fakeChars = w.fake.split('');
    var opts = [d.real, d.fake];
    var near = d.slot === 'v' ? (NEAR_V[d.real] || []) : [];
    near.forEach(function (n) { if (opts.indexOf(n) < 0 && opts.length < 3) opts.push(n); });
    opts = shuffle(opts);
    body.innerHTML = '<p class="hsb-lead">찾았다! <b>' + w.pic + '</b> 진짜 이름이 되게 고쳐 볼까?</p>' +
      '<div class="hsb-word">' + fakeChars.map(function (c, i) { return '<span class="' + (i === d.index ? 'hsb-hot' : '') + '">' + esc(c) + '</span>'; }).join('') + '</div>' +
      '<p class="hsb-hint">반짝이는 글자의 ' + (d.slot === 'v' ? '모음' : d.slot === 'l' ? '첫소리' : '받침') + '을 바꿔요</p>' +
      '<div class="hsb-opts">' + opts.map(function (o) { return '<button type="button" class="hsb-opt" data-o="' + o + '">' + jamoLabel(d.slot, o) + '</button>'; }).join('') + '</div>';
    body.querySelectorAll('.hsb-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var o = +b.dataset.o, p = decompose(fakeChars[d.index]); p[d.slot] = o;
        var tried = fakeChars.slice(); tried[d.index] = compose(p);
        var hot = body.querySelector('.hsb-hot'); hot.textContent = tried[d.index];
        if (o === d.real) {
          hot.classList.add('hsb-ok'); emit('HS-2', { stage: 'CHECK', word: w.real, correct: true });
          later(function () { state.tags.round++; tagsRound(); }, 700);
        } else { state.tags.misses++; b.disabled = true; b.classList.add('hsb-nope'); }
      });
    });
  }

  // ----- HS-1 -----
  var STAGES = ['TRACE', 'LINK', 'CORE', 'RECALL'];
  var STAGE_KO = { TRACE: '뜻 보기', LINK: '한자 잇기', CORE: '기준량 찾기', RECALL: '숨은 문장' };
  function ratioStart() { state.ratio = { stage: 0, core: 0, misses: 0 }; ratioRender(); }
  function stageBar(cur) {
    return '<ol class="hsb-stages">' + STAGES.map(function (s, i) { return '<li class="' + (i < cur ? 'done' : i === cur ? 'cur' : '') + '">' + STAGE_KO[s] + '</li>'; }).join('') + '</ol>';
  }
  function next() { state.ratio.stage++; ratioRender(); }
  function ratioRender() {
    gen++;
    var r = state.ratio, st = STAGES[r.stage];
    if (!st) return ratioPercent();
    var html = stageBar(r.stage);
    if (st === 'TRACE') {
      html += '<p class="hsb-lead">비와 비율에서 쓰는 생각말이야. 카드를 눌러 예를 봐.</p><div class="hsb-terms">' +
        TERMS.map(function (t) { return '<button type="button" class="hsb-term"><b>' + esc(t.term) + '</b><span>' + esc(t.easy) + '</span><em>' + esc(t.ex) + '</em></button>'; }).join('') + '</div><button type="button" class="hsb-cta" data-next>다음</button>';
    } else if (st === 'LINK') {
      html += '<p class="hsb-lead">한자로 보면 뜻이 보여.</p><div class="hsb-terms">' +
        HANJA.map(function (h) { return '<div class="hsb-hanja"><span class="hsb-hz">' + h.hanja + '</span><span><b>' + esc(h.term) + '</b> · ' + esc(h.gloss) + '<small>' + esc(h.note) + '</small></span></div>'; }).join('') + '</div><button type="button" class="hsb-cta" data-next>다음</button>';
    } else if (st === 'CORE') { return ratioCore(); }
    else if (st === 'RECALL') { return ratioRecall(); }
    body.innerHTML = html;
    if (st === 'TRACE') body.querySelectorAll('.hsb-term').forEach(function (b) { b.addEventListener('click', function () { b.classList.toggle('open'); }); });
    body.querySelector('[data-next]').addEventListener('click', next);
  }
  function ratioCore() {
    gen++;
    var r = state.ratio, item = CORE_ITEMS[r.core];
    if (!item) { r.stage = 3; return ratioRender(); }
    var phrase = ratioPhrase(item.cmp, item.base, item.form);
    var nums = shuffle([item.cmp, item.base]);
    body.innerHTML = stageBar(2) + '<p class="hsb-step">' + (r.core + 1) + ' / ' + CORE_ITEMS.length + '</p><div class="hsb-scene">' + esc(item.scene) + '</div>' +
      '<div class="hsb-phrase">' + esc(phrase) + '</div><p class="hsb-lead">① 기준량은 어느 수일까?</p><div class="hsb-opts">' +
      nums.map(function (n) { return '<button type="button" class="hsb-opt" data-n="' + n + '">' + n + '</button>'; }).join('') + '</div><div class="hsb-q2"></div>';
    body.querySelectorAll('[data-n]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (+b.dataset.n !== item.base) {
          r.misses++; b.classList.add('hsb-nope');
          var ph = body.querySelector('.hsb-phrase');
          ph.innerHTML = esc(phrase).replace(/(에 대한)/, '<mark>$1</mark>').replace(/(와|과)( )/, '<mark>$1</mark>$2');
          body.querySelector('.hsb-q2').innerHTML = '<p class="hsb-hint">' + (item.form === 'and' ? "'와/과' 뒤에 오는 수가 기준량이야" : "'에 대한' 바로 앞의 수가 기준량이야") + '</p>';
          return;
        }
        b.classList.add('hsb-good');
        body.querySelectorAll('[data-n]').forEach(function (x) { x.disabled = true; });
        var a = item.cmp + ' : ' + item.base, w = item.base + ' : ' + item.cmp;
        body.querySelector('.hsb-q2').innerHTML = '<p class="hsb-lead">② 기호로 쓰면?</p><div class="hsb-opts">' +
          shuffle([a, w]).map(function (t) { return '<button type="button" class="hsb-opt wide" data-t="' + t + '">' + t + '</button>'; }).join('') + '</div><div class="hsb-q3"></div>';
        body.querySelectorAll('[data-t]').forEach(function (c) {
          c.addEventListener('click', function () {
            if (c.dataset.t !== a) { r.misses++; c.classList.add('hsb-nope'); c.disabled = true; return; }
            c.classList.add('hsb-good');
            body.querySelector('.hsb-q3').innerHTML = '<p class="hsb-ok-line">비율 = ' + item.cmp + ' ÷ ' + item.base + ' = ' + item.cmp + '/' + item.base + '</p><button type="button" class="hsb-cta" data-c>다음</button>';
            emit('HS-1', { stage: 'CORE', item: phrase, correct: true });
            body.querySelector('[data-c]').addEventListener('click', function () { r.core++; ratioCore(); });
          });
        });
      });
    });
  }
  function ratioRecall() {
    gen++;
    var r = state.ratio, want = RECALL.tiles.map(function (t, i) { return t.base === RECALL.target ? i : -1; }).filter(function (i) { return i >= 0; });
    var found = {};
    body.innerHTML = stageBar(3) + '<p class="hsb-lead">기준량이 <b>' + RECALL.target + '</b>인 문장 ' + want.length + '개가 숨어 있어. 모두 찾아!</p><div class="hsb-sent">' +
      RECALL.tiles.map(function (t, i) { return '<button type="button" class="hsb-tile" data-i="' + i + '">' + esc(ratioPhrase(t.cmp, t.base, t.form)) + '</button>'; }).join('') + '</div><p class="hsb-count">0 / ' + want.length + '</p>';
    body.querySelectorAll('.hsb-tile').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i;
        if (want.indexOf(i) < 0) { r.misses++; b.classList.add('hsb-nope'); setTimeout(function () { b.classList.remove('hsb-nope'); }, 500); return; }
        found[i] = 1; b.classList.add('hsb-good'); b.disabled = true;
        var n = Object.keys(found).length; body.querySelector('.hsb-count').textContent = n + ' / ' + want.length;
        if (n === want.length) { emit('HS-1', { stage: 'RECALL', correct: true, misses: r.misses }); later(next, 600); }
      });
    });
  }
  function ratioPercent() {
    gen++;
    var p = PERCENT_ITEM;
    body.innerHTML = stageBar(4) + '<p class="hsb-lead">마지막! 생활 속 비율</p><div class="hsb-scene">' + esc(p.scene) + '</div><p class="hsb-lead">' + esc(p.q) + '</p><div class="hsb-opts">' +
      shuffle(p.choices).map(function (c) { return '<button type="button" class="hsb-opt wide" data-p="' + c + '">' + c + '</button>'; }).join('') + '</div><div class="hsb-q2"></div>';
    body.querySelectorAll('[data-p]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.p !== p.answer) { state.ratio.misses++; b.classList.add('hsb-nope'); b.disabled = true; return; }
        b.classList.add('hsb-good');
        emit('HS-1', { stage: 'APPLY', correct: true, misses: state.ratio.misses });
        body.querySelector('.hsb-q2').innerHTML = '<p class="hsb-ok-line">' + esc(p.why) + '</p><p class="hsb-hint">찾은 생각말은 Snap &amp; Pop에서 내 문장으로 써 볼 수 있어요.</p><button type="button" class="hsb-cta" data-menu>처음으로</button>';
        body.querySelector('[data-menu]').addEventListener('click', menu);
      });
    });
  }

  function mountEntry() {
    if (document.getElementById('hsBasicsEntry')) return;
    var b = document.createElement('button');
    b.id = 'hsBasicsEntry'; b.type = 'button'; b.className = 'hsb-entry'; b.textContent = '기초 다지기';
    b.addEventListener('click', function () { open(); });
    document.body.appendChild(b);
    if (location.hash.indexOf('#basics') === 0) open(location.hash.split('/')[1]);
  }

  var api = { VERSION: VERSION, UNIT: UNIT, NAME_TAGS: NAME_TAGS, TERMS: TERMS, HANJA: HANJA, CORE_ITEMS: CORE_ITEMS, RECALL: RECALL, PERCENT_ITEM: PERCENT_ITEM,
    decompose: decompose, compose: compose, jamoDiff: jamoDiff, ratioPhrase: ratioPhrase, open: open, close: close };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.HideBasicSkillsV1 = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountEntry); else mountEntry();
})(typeof window !== 'undefined' ? window : globalThis);
