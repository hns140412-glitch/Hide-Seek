const assert = require('node:assert/strict');

const view = { innerHTML:'' };
const stubs = {};
const emitted = [];
// Last button list handed to the decoder per `[data-*]` selector, parsed from the rendered HTML.
const buttons = {};
global.window = { HideSeekBridge:{ emit(type, payload){ emitted.push({ type, payload }); } } };
global.document = {
  readyState:'complete',
  querySelector(selector){
    if (selector === '#view') return view;
    if (!selector.startsWith('#term')) return null;
    return stubs[selector] ||= { classList:{ remove(){} }, style:{}, dataset:{} };
  },
  querySelectorAll(selector){
    const m = selector.match(/^\[data-([a-z-]+)\]$/);
    if (!m) return [];
    const re = new RegExp(`<button([^>]*\\bdata-${m[1]}="[^"]*"[^>]*)>([^<]*)</button>`, 'g');
    return buttons[selector] = [...view.innerHTML.matchAll(re)].map(([, attrs, text]) => {
      const dataset = {};
      for (const [, k, v] of attrs.matchAll(/data-([a-z-]+)="([^"]*)"/g)) dataset[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
      return { dataset, textContent:text, classList:{ add(){} }, addEventListener(type, fn){ this['on' + type] = fn; } };
    });
  }
};
global.MutationObserver = class { observe(){} };
global.S = {};
global.save = () => {};
global.markStudy = () => {};
global.setPartner = () => {};
global.pushView = fn => fn();

require('../hide-term-decoder-v1.js');

const api = window.HideTermDecoderV1;
assert.ok(api, 'API missing');
assert.equal(api.state, 'BOUND');
assert.equal(api.snapshot().cardCount, 26);
assert.equal(api.snapshot().cards.filter(x => x.subject === 'SCIENCE').length, 17);
assert.equal(api.snapshot().cards.filter(x => x.subject === 'MATH').length, 3);
assert.ok(api.snapshot().cards.find(x => x.id === 'sci-taeyanggye')?.concept?.hierarchy?.length);
assert.ok(api.snapshot().cards.find(x => x.id === 'sci-hanraengjeonseon')?.concept?.compare?.length);
assert.deepEqual(api.modes, ['TRACE','LINK','CORE','RECALL']);
assert.deepEqual(api.subjects.map(x => x.label), ['전체','국어','사회','과학','수학']);

api.open();
assert.match(view.innerHTML, /교과 용어 탐험/);
assert.match(view.innerHTML, /TERM DECODER/);
assert.match(view.innerHTML, /TRACE/);
assert.match(view.innerHTML, /RECALL/);
// Unknown grade: seed cards are a labelled, non-authoritative preview only.
assert.match(view.innerHTML, /미리보기 · 학년 미확인/);
assert.doesNotMatch(view.innerHTML, /5-6학년군/);
api.open('TRACE');
assert.match(view.innerHTML, /미리보기 · 학년 미확인/);
stubs['#termTraceReveal'].onclick();
assert.equal(api.snapshot().evidence.at(-1).term_projection.authority, 'GENERIC_PREVIEW_NON_AUTHORITATIVE');
assert.equal(emitted.at(-1).type, 'TERM_DECODER_EXPOSURE');
assert.equal(emitted.at(-1).payload.term_projection.grade_context_state, 'NO_GRADE_CONTEXT');

// Subject selection: an actual hub button click must stick (no stale state handle).
api.open();
const scienceButton = buttons['[data-term-subject]'].find(b => b.dataset.termSubject === 'SCIENCE');
assert.ok(scienceButton?.onclick, 'subject button not bound');
scienceButton.onclick();
assert.equal(api.snapshot().selectedSubject, 'SCIENCE');
assert.match(view.innerHTML, /과학 · 17개 용어/);
assert.match(view.innerHTML, /term-decoder-subject active" data-term-subject="SCIENCE"/);

const add = api.registerCards([{
  id:'test-term',
  subject:'SCIENCE',
  term:'용해',
  hanja:'溶解',
  meaning:'물질이 액체에 고르게 섞여 들어가는 현상',
  components:[{text:'溶',meaning:'녹다'},{text:'解',meaning:'풀다'}]
}]);
assert.equal(add.accepted, 1);
assert.equal(api.snapshot().cardCount, 27);
const engine = api.registerCards([{
  id:'engine-term',subject:'SCIENCE',term:'광합성',hanja:'光合成',meaning:'빛을 이용해 양분을 만드는 과정'
}],{replace:true,engineOwned:true,projection:{school_stage:'E5',subject:'SCIENCE'}});
assert.equal(engine.accepted,1);
assert.equal(api.snapshot().engineOwnedCards,true);
assert.equal(api.snapshot().cardCount,1);
assert.equal(api.snapshot().engineProjection.school_stage,'E5');

// Lower-elementary adapted engine card: meaning/audio first, Hanja only as optional support.
api.registerCards([{
  id:'engine-low',subject:'SCIENCE',gradeBand:'1-2',term:'물',hanja:'水',meaning:'흐르는 맑은 액체',
  components:[{text:'水',meaning:'물'}],
  adaptation:{effective_band:'LOWER_ELEMENTARY',base_band:'LOWER_ELEMENTARY',evidence_step:0,display_first:'MEANING',hanja_mode:'OPTIONAL_SUPPORT',decomposition:'BAND_LIMITED'}
}],{replace:true,engineOwned:true,projection:{school_stage:'E2',subject:'SCIENCE',grade_context:{state:'RESOLVED',school_stage:'E2',base_band:'LOWER_ELEMENTARY',effective_band:'LOWER_ELEMENTARY',evidence_step:0}}});
api.open('TRACE');
assert.match(view.innerHTML, /1-2학년군 · 저학년/);
assert.match(view.innerHTML, /흐르는 맑은 액체/);
assert.match(view.innerHTML, /소리 듣기/);
assert.match(view.innerHTML, /도움 글자/);
assert.doesNotMatch(view.innerHTML, /학년 미확인/);
stubs['#termTraceReveal'].onclick();
const lowEvidence = api.snapshot().evidence.at(-1).term_projection;
assert.equal(lowEvidence.authority, 'ENGINE_PROJECTION');
assert.equal(lowEvidence.effective_band, 'LOWER_ELEMENTARY');
assert.equal(lowEvidence.decomposition, 'BAND_LIMITED');
assert.equal(emitted.at(-1).payload.term_projection.school_stage, 'E2');
assert.equal(api.snapshot().cards[0].adaptation.display_first, 'MEANING');

// Suppressed decomposition: LINK must not fabricate a morpheme item or score retrieval.
const resolvedE5 = { school_stage:'E5', subject:'SCIENCE', grade_context:{ state:'RESOLVED', school_stage:'E5', base_band:'UPPER_ELEMENTARY', effective_band:'UPPER_ELEMENTARY', evidence_step:0 } };
api.registerCards([{
  id:'engine-opaque', subject:'SCIENCE', gradeBand:'5-6', term:'광합성', meaning:'빛을 이용해 양분을 만드는 과정',
  components:[{text:'光',meaning:'빛'}], families:[{anchor:'光',words:['광선']}],
  adaptation:{ effective_band:'UPPER_ELEMENTARY', base_band:'UPPER_ELEMENTARY', evidence_step:0, display_first:'TERM', hanja_mode:'SUPPRESSED', decomposition:'SUPPRESSED' }
}, {
  id:'engine-nofamily', subject:'SCIENCE', gradeBand:'5-6', term:'증발', meaning:'액체가 기체로 변하는 현상',
  adaptation:{ effective_band:'UPPER_ELEMENTARY', base_band:'UPPER_ELEMENTARY', evidence_step:0, display_first:'TERM', hanja_mode:'SUPPRESSED', decomposition:'SUPPRESSED' }
}],{ replace:true, engineOwned:true, projection:resolvedE5 });
const evidenceBefore = api.snapshot().evidenceCount;
const emittedBefore = emitted.length;
api.open('LINK');
assert.match(view.innerHTML, /뜻조각으로 나누어 연결하지 않아요/);
assert.match(view.innerHTML, /빛을 이용해 양분을 만드는 과정/);
assert.doesNotMatch(view.innerHTML, /data-link-index/);
assert.doesNotMatch(view.innerHTML, /광선/);
stubs['#termLinkNext'].onclick();
assert.match(view.innerHTML, /증발/);
assert.match(view.innerHTML, /뜻조각으로 나누어 연결하지 않아요/);
assert.doesNotMatch(view.innerHTML, /data-link-index/);
assert.equal(api.snapshot().evidenceCount, evidenceBefore);
assert.equal(emitted.length, emittedBefore);
assert.equal(typeof stubs['#termLinkToCore'].onclick, 'function');

// Mining-derived concept-link pattern: LINK may use a curriculum concept relation even when
// no morpheme family is available. This is a relation task, not a fabricated Hanja family.
api.registerCards([{
  id:'engine-concept-link', subject:'SCIENCE', gradeBand:'5-6', term:'저기압', meaning:'주변보다 기압이 낮은 곳',
  conceptLinks:['기압','날씨','구름'], concept:{summary:'저기압과 날씨의 관계'},
  miningLearningPattern:{eligible_modes:['LINK','CORE','RECALL'],pattern_ids:['P_CONCEPT_RELATION','P_CONTEXT_TRANSFER']},
  adaptation:{ effective_band:'UPPER_ELEMENTARY', base_band:'UPPER_ELEMENTARY', evidence_step:0, display_first:'TERM', hanja_mode:'NONE', decomposition:'NONE' }
}, {
  id:'engine-concept-distractor', subject:'SCIENCE', gradeBand:'5-6', term:'용해', meaning:'물질이 고르게 섞이는 현상',
  conceptLinks:['용질','용매'],
  miningLearningPattern:{eligible_modes:['LINK','CORE','RECALL'],pattern_ids:['P_CONCEPT_RELATION']},
  adaptation:{ effective_band:'UPPER_ELEMENTARY', base_band:'UPPER_ELEMENTARY', evidence_step:0, display_first:'TERM', hanja_mode:'NONE', decomposition:'NONE' }
}],{ replace:true, engineOwned:true, projection:resolvedE5 });
api.open('LINK');
assert.match(view.innerHTML, /교과 개념/);
assert.match(view.innerHTML, /기압/);
assert.match(view.innerHTML, /data-link-index/);
const conceptCorrect = buttons['[data-link-index]'].find(b => b.dataset.correct === '1');
assert.ok(conceptCorrect?.onclick);
conceptCorrect.onclick();
const conceptEvidence=api.snapshot().evidence.at(-1);
assert.equal(conceptEvidence.mode,'LINK');
assert.equal(conceptEvidence.link_type,'CONCEPT_RELATION');
assert.equal(conceptEvidence.term_projection.mining_learning_pattern.pattern_ids[0],'P_CONCEPT_RELATION');
assert.equal(emitted.at(-1).payload.verification_observation.link_type,'CONCEPT_RELATION');

// Grade label from engine data is escaped before reaching the mode header HTML.
api.registerCards([{
  id:'engine-xss', subject:'SCIENCE', gradeBand:'<img src=x onerror=alert(1)>', term:'기체', meaning:'모양이 없는 물질의 상태',
  adaptation:{ effective_band:'<b>pwn</b>', base_band:'UPPER_ELEMENTARY', evidence_step:0, display_first:'TERM', hanja_mode:'DECOMPOSE', decomposition:'FULL' }
}],{ replace:true, engineOwned:true, projection:resolvedE5 });
api.open('TRACE');
assert.doesNotMatch(view.innerHTML, /<img src=x/);
assert.doesNotMatch(view.innerHTML, /<b>pwn<\/b>/);
assert.match(view.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;학년군 · &lt;b&gt;pwn&lt;\/b&gt;/);

assert.equal(api.clearCustomCards(), 1);
assert.equal(api.snapshot().engineOwnedCards,false);
assert.equal(api.snapshot().cardCount, 26);

// Real loader -> real decoder: a fail-closed boot must clear the prior engine projection
// and fall back to the generic, non-authoritative seed preview.
(async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const dataset = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'learning-term-recommendation-packs-v1.json'), 'utf8'));
  const E5_SCIENCE = '?school_stage=E5&subject=%EA%B3%BC%ED%95%99';
  global.location = { search:E5_SCIENCE };
  global.fetch = async () => ({ ok:true, json:async () => dataset });
  global.CustomEvent = class { constructor(type, init){ this.type = type; this.detail = init?.detail; } };
  window.dispatchEvent = () => {};
  document.documentElement = { dataset:{} };
  require('../hide-learning-term-loader-v1.js');
  const L = window.HideLearningTermLoaderV1;
  await new Promise(r => setTimeout(r, 20)); // let the loader's own auto-boot settle

  const expectBound = async () => {
    location.search = E5_SCIENCE;
    const bound = await L.boot();
    assert.equal(bound.state, 'BOUND');
    assert.equal(api.snapshot().engineOwnedCards, true);
    assert.equal(api.snapshot().cardCount, dataset.by_stage.E5.SCIENCE.cards.length);
    assert.equal(api.snapshot().engineProjection.grade_context.school_stage, 'E5');
  };
  const expectCleared = result => {
    assert.equal(result.stale_projection_cleared, true);
    const snap = api.snapshot();
    assert.equal(snap.engineOwnedCards, false);
    assert.equal(snap.engineProjection, null);
    assert.equal(snap.cardCount, 26);
    api.open();
    assert.match(view.innerHTML, /미리보기 · 학년 미확인/);
  };

  await expectBound();
  location.search = '?subject=%EA%B3%BC%ED%95%99';
  const unknown = await L.boot();
  assert.equal(unknown.state, 'NO_GRADE_CONTEXT');
  expectCleared(unknown);

  await expectBound();
  location.search = '?age=8&school_stage=E5&subject=%EA%B3%BC%ED%95%99';
  const conflict = await L.boot();
  assert.equal(conflict.reason, 'AGE_GRADE_CONFLICT');
  expectCleared(conflict);

  await expectBound();
  location.search = '?school_stage=E4&subject=%EA%B3%BC%ED%95%99';
  const e4 = await L.boot();
  assert.equal(e4.state, 'BOUND');
  assert.equal(e4.school_stage, 'E4');
  assert.equal(api.snapshot().engineOwnedCards, true);
  assert.equal(api.snapshot().cardCount, dataset.by_stage.E4.SCIENCE.cards.length);
  assert.equal(api.snapshot().engineProjection.grade_context.effective_band, 'MIDDLE_ELEMENTARY');

  console.log('TERM_DECODER_V1_SMOKE: PASS');
})().catch(err => { console.error(err); process.exit(1); });
