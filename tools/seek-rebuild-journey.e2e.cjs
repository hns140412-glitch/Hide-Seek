'use strict';
/* Hide & Seek rebuild (seek.html) — whole-journey check on a real browser, phone and tablet.
   Portable: serves the repo itself, no paid API, no network. Run: node tools/seek-rebuild-journey.e2e.cjs
   What it proves (trace standards):
   - words enter only through the review screen; a NEW word's meaning stays hidden on HOME until it is met;
   - TRACE / LINK / PIECE never write objective recall; only 숨은 단어 찾기 can mark a word found;
   - a word found with a clue is NOT found (it must be found again alone); a passed word is relearned, then sought again;
   - example (sample) words are never reported; real words report exactly one event per recall attempt. */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('playwright-core')); }
const root = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
const WORDS = 'unhappy 불행한\nrewrite 다시 쓰다\npreview 미리 보기\nteacher 선생님\ncareful 조심하는\ndesert 사막\ndessert 후식\nquiet 조용한\nquite 꽤\nice cream 아이스크림\nbridge 다리\nforest 숲';
const assert = (ok, msg) => { if (!ok) throw new Error('FAIL: ' + msg); };

async function journey(browser, base, name, viewport) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' }), p = await ctx.newPage();
  const errors = [], outside = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('request', r => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) outside.push(r.url()); });
  await p.addInitScript(() => { window.__events = []; window.addEventListener('taky-learning-event', e => window.__events.push(e.detail)); });
  await p.goto(base + '/seek.html', { waitUntil: 'load' });
  const has = s => p.locator(s).count().then(c => c > 0);
  const stages = () => p.evaluate(() => { const c = {}; [Seek.words.mission()].forEach(m => m.items.forEach(w => (w.evidence || []).forEach(e => { const k = e.stage + ':' + e.result + (e.objectiveRecall ? ':OR' : ''); c[k] = (c[k] || 0) + 1; }))); return c; });

  await p.click('[data-crew="dubi"]');
  // 1) sample words: playable, never reported, never in the treasure box
  await p.click('#skSample');
  await play('trace'); await play('recall', { limit: 2 });
  assert((await p.evaluate(() => window.__events.length)) === 0, 'sample words were reported');
  await p.click('#skNav [data-tab="catch"]');
  assert(await has('.sk-empty'), 'sample words appeared in the treasure box');

  // 2) real words go through the review screen
  await p.click('#skMenuBtn'); await p.click('#skMenuAdd');
  await p.fill('#skInText', WORDS); await p.click('#skInNext');
  assert((await p.locator('.sk-review li').count()) === 12, 'review screen did not list 12 words');
  await p.click('#skRvSave');
  assert((await p.locator('.sk-slip').count()) === 12, 'home board did not show 12 words');
  await p.locator('.sk-slip').first().click();
  assert(!(await has('.sk-slip.open')), 'meaning of an unmet NEW word was shown on HOME');

  // 3) TRACE, LINK, PIECE: no objective recall, nothing found, nothing reported
  await play('trace'); await play('link'); await play('piece');
  let c = await stages();
  assert(c['TRACE_MEET:SEEN'] === 12, 'TRACE did not meet all 12 words: ' + JSON.stringify(c));
  assert(!Object.keys(c).some(k => k.endsWith(':OR') && !/^(FINAL_SEEK|SEEK_AGAIN):/.test(k)), 'a non-recall stage wrote objective recall');
  let prog = await p.evaluate(() => Seek.words.progress());
  assert(prog.found === 0, 'a word was marked found without 숨은 단어 찾기');
  assert((await p.evaluate(() => window.__events.length)) === 0, 'exposure / association / reconstruction was reported');

  // 4) RECALL: word 2 is passed, word 3 uses a clue; both must come back in 다시 찾기
  const firstRound = await play('recall', { passAt: 2, clueAt: 3, stopAfterFirstRound: true });
  prog = await p.evaluate(() => Seek.words.progress());
  assert(prog.found === 10, 'after one pass and one clue, found should be 10, got ' + prog.found);
  assert(firstRound.relearn === 2, 'passed + assisted words were not relearned before seeking again');
  await play('recall', { resume: true });
  c = await stages(); prog = await p.evaluate(() => Seek.words.progress());
  assert(prog.found === 12, 'words found alone in 다시 찾기 were not counted: ' + prog.found);
  assert(c['FINAL_SEEK:CORRECT'] === 1 && c['FINAL_SEEK_SUPPORT:HINT_USED'] >= 1, 'assisted find was not kept apart from recall: ' + JSON.stringify(c));
  const ev = await p.evaluate(() => window.__events.map(e => ({ t: e.type, app: e.app, i: e.payload.instrument_version, r: e.payload.result_type, a: e.payload.assisted, s: e.payload.learning_scope })));
  const attempts = Object.entries(c).filter(([k]) => /^(FINAL_SEEK|SEEK_AGAIN):/.test(k)).reduce((n, [, v]) => n + v, 0);
  assert(ev.length === attempts, `reported ${ev.length} events for ${attempts} recall attempts`);
  assert(ev.every(e => e.t === 'RETRIEVAL_ATTEMPT_RESULT' && e.app === 'hide-seek' && e.i === 'HIDE_HOME_RECALL_V1' && e.s.subject === 'ENGLISH'), 'event shape drifted');
  assert(ev.filter(e => e.a).length === 1 && ev.find(e => e.a).r === 'HINT_USED', 'assisted attempt was not reported as assisted');

  // 4b) thinking trail is self-report: kept for the learner's clue profile, never recall
  assert(c['THINKING_TRAIL:SUBMITTED'] >= 6 && Object.keys(c).some(k => k.startsWith('THINKING_TRAIL_COMPARE:')), 'thinking trail was not recorded: ' + JSON.stringify(c));
  const skill = await p.evaluate(() => HideLanguageModel.summarizeInferenceSkill(HideV2Store.snapshot().events));
  assert(skill.assessed >= 6, 'guess / compare history did not reach the inference profile');

  // 4c) morning mock test: external evidence. It re-hides and re-prioritises a word; it never marks one found.
  await p.click('#skMenuBtn'); await p.click('#skMenuMock');
  const mockId = await p.locator('.sk-mock li').first().getAttribute('data-id');
  await p.click(`.sk-mock li[data-id="${mockId}"] [data-o="WRONG"]`);
  await p.click('.sk-mock li:nth-child(2) [data-o="CORRECT"]');
  await p.click('#skMockSave');
  const mock = await p.evaluate(id => { const W = Seek.words, w = W.fresh(id), s = HideV2Memory.summary(w); return { found: W.progress().found, rank: W.byPriority(12).findIndex(x => x.id === id), needs: s.needsUnassistedRecall, events: window.__events.length, rows: w.evidence.filter(e => e.stage === 'MORNING_MOCK_TEST').map(e => e.source + ':' + e.actor) }; }, mockId);
  assert(mock.found === 12, 'a paper mock test changed today\'s found count');
  assert(mock.needs, 'a word missed in the mock test did not hide again');
  assert(mock.rank >= 0 && mock.rank <= 2, 'a word missed in the mock test did not move to the front: rank ' + mock.rank);
  assert(mock.rows[0] === 'MORNING_MOCK_TEST:PARENT_CHILD' && mock.events === ev.length, 'mock test evidence was mislabeled or reported as an app recall');

  // 4d) old-word review: a word from an earlier set, due after a real gap, is offered in the treasure box;
  //     finding it alone is spaced evidence on its own set, not on today's set
  const firstSet = await p.evaluate(() => { const id = Seek.words.mission().id; HideV2Store.transaction(s => s.missions.find(m => m.id === id).items.forEach(w => (w.evidence || []).forEach(e => { e.at = new Date(Date.parse(e.at) - 26 * 3600 * 1000).toISOString(); }))); return id; });
  await p.click('#skMenuBtn'); await p.click('#skMenuAdd');
  await p.fill('#skInText', 'window 창문\ngarden 정원\nriver 강'); await p.click('#skInNext'); await p.click('#skRvSave');
  await p.click('#skNav [data-tab="catch"]');
  assert(await has('#skOld'), 'old-word review was not offered after a real gap');
  await p.click('#skOld'); await play('recall', { resume: true, limit: 1 });
  const oldRow = await p.evaluate(id => HideV2Store.snapshot().missions.find(m => m.id === id).items.flatMap(w => w.evidence || []).filter(e => e.oldWordReview).map(e => e.stage + ':' + e.result + ':' + e.spacedEvidence), firstSet);
  assert(oldRow.length === 1 && oldRow[0] === 'FINAL_SEEK:CORRECT:true', 'old-word recall did not land on its own set as spaced evidence: ' + oldRow);
  assert((await p.evaluate(() => Seek.family.reportTask())) === null, 'a status report was built without a Ready session');
  await p.evaluate(id => { HideV2Mission.setActive(id); SeekApp.go('home'); }, firstSet);

  // 5) treasure box: items, story, calendar
  await p.click('#skNav [data-tab="catch"]');
  assert((await p.locator('.sk-item').count()) === 15, 'treasure box did not list the 15 real words');
  await p.locator('.sk-item').first().click(); assert(await has('.sk-ladder'), 'word story did not open'); await p.click('.sk-x');
  await p.click('[data-t="calendar"]'); assert((await p.locator('.sk-cal span.on').count()) >= 1, 'calendar did not show a learning day');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('#skView *')].some(e => e.getBoundingClientRect().right > innerWidth + 1));
  assert(!overflow, 'layout overflows the screen at ' + name);
  assert(!errors.length, 'page errors: ' + errors.join(' | '));
  assert(!outside.filter(u => !/family-auth-config|accounts\.google\.com/.test(u)).length, 'unexpected outside request: ' + outside[0]);
  await ctx.close();
  return { name, stages: c, events: ev.length };

  async function play(mode, o = {}) {
    if (!o.resume) await p.evaluate(m => SeekApp.play(m), mode);
    const seen = { relearn: 0, seeks: 0 };
    for (let i = 0; i < 600; i++) {
      if (await has('#skDone')) { await p.click('#skDone'); return seen; }
      if (!(await p.evaluate(() => document.querySelector('#seekApp').dataset.mode))) return seen;
      // thinking trail: mostly pick a clue and compare the guess; sometimes "아직 모르겠어"
      if (await has('[data-clue]')) { await p.locator(i % 5 === 4 ? '[data-clue="NONE"]' : '.sk-chip-btn[data-clue]').first().click(); continue; }
      if (await has('[data-outcome]')) { await p.locator('[data-outcome]').nth(i % 3).click(); continue; }
      if (await has('#skHide:not(:disabled)')) { await p.click('#skHide'); await p.waitForTimeout(450); continue; }
      if (await has('#skHide')) { await p.waitForTimeout(100); continue; }
      if (await has('#skShow')) { await p.click('#skShow'); continue; }
      if (await has('[data-r]')) { await p.click('[data-r="CAME"]'); continue; }
      if (await has('#skCmpNext')) { await p.click('#skCmpNext'); continue; }
      if (await has('.sk-card.principle')) { await p.click('#skNext'); continue; }
      if (await has('.sk-card.meet #skNext')) {
        if (o.stopAfterFirstRound) { seen.relearn = await p.evaluate(() => +document.querySelector('.sk-step').textContent.split('/')[1]); return seen; }
        await p.click('#skNext'); continue;
      }
      if (await has('.sk-pairs')) {
        const ids = await p.$$eval('.sk-tile[data-side="w"]:not(.done)', els => els.map(e => e.dataset.id));
        if (!ids.length) { await p.waitForTimeout(200); continue; }
        await p.click(`.sk-tile[data-side="w"][data-id="${ids[0]}"]`); await p.click(`.sk-tile[data-side="m"][data-id="${ids[0]}"]`); continue;
      }
      if (await has('.sk-card.piece')) {
        if (await has('.sk-gap.filled')) { await p.waitForTimeout(150); continue; }
        await p.locator('.sk-opt:not(:disabled)').first().click(); await p.waitForTimeout(60); continue;
      }
      if (await has('.sk-card.recall')) {
        if (await has('.sk-card.win, .sk-card.soft')) { await p.waitForTimeout(150); continue; }
        const token = await p.evaluate(() => { const m = document.querySelector('.sk-card.recall .sk-meaning.lead')?.textContent; return m ? HideV2Store.snapshot().missions.flatMap(x => x.items).find(w => w.meaning === m).token : null; });
        if (!token) continue;
        seen.seeks++;
        if (o.limit && seen.seeks > o.limit) { await p.click('#skBack'); return seen; }
        if (seen.seeks === o.passAt) { await p.click('#skPass'); continue; }
        if (seen.seeks === o.clueAt) await p.click('#skClueBtn');
        for (;;) {
          const at = await p.evaluate(() => document.querySelector('.sk-card.win, .sk-card.soft') ? -1 : [...document.querySelectorAll('.sk-slots span')].findIndex(x => x.classList.contains('cur')));
          if (at < 0) break;
          const ch = [...token][at].toLowerCase();
          await p.locator('.sk-key:not(:disabled)', { hasText: new RegExp('^' + ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click();
        }
        continue;
      }
      if (await has('.sk-card.chase .sk-opt')) {
        // answer from what is visible; a sound-only turn is answered by the first option (a miss is allowed in TRACE)
        const pick = await p.evaluate(() => {
          const blink = document.querySelector('.sk-word.blink')?.textContent, lead = document.querySelector('.sk-meaning.lead')?.textContent, ws = Seek.words.words();
          const w = blink ? ws.find(x => x.token === blink) : lead ? ws.find(x => x.meaning === lead) : null;
          return w ? w.id : null;
        });
        await (pick ? p.locator(`.sk-opt[data-id="${pick}"]`) : p.locator('.sk-opt').first()).click(); await p.waitForTimeout(pick ? 450 : 950); continue;
      }
      await p.waitForTimeout(100);
    }
    throw new Error('STUCK in ' + mode + ': ' + (await p.locator('#skView').innerText()).slice(0, 160));
  }
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  try {
    for (const [name, vp] of [['phone-390x844', { width: 390, height: 844 }], ['tablet-1180x820', { width: 1180, height: 820 }]]) {
      const r = await journey(browser, base, name, vp);
      console.log('PASS', r.name, 'events', r.events, JSON.stringify(r.stages));
    }
  } catch (e) { console.error(e.message); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
