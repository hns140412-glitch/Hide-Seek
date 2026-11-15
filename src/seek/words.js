/* Hide & Seek (rebuild) — word-set helpers. Selection only; no scoring authority.
   Long-term review selection belongs to the Learning Engine; here we only order what is on hand. */
(() => {
  'use strict';
  const S = globalThis.Seek;
  const mission = () => HideV2Mission.activeMission();
  const words = () => (mission()?.items || []).filter(w => w.token && w.meaning);
  const realMissions = () => HideV2Store.snapshot().missions.filter(m => m.provenance?.source !== 'SAMPLE' && m.status !== 'ARCHIVED');
  // a word may belong to an earlier word set (old-word review): find it and the set it lives in, so evidence lands there
  function locate(id) {
    const active = mission(), own = (active?.items || []).find(w => w.id === id);
    if (own) return { mission: active, word: own };
    for (const m of realMissions()) { const w = (m.items || []).find(x => x.id === id); if (w) return { mission: m, word: w }; }
    return null;
  }
  const fresh = id => locate(id)?.word || null;
  const has = (w, pred) => (w.evidence || []).some(pred);
  const met = w => has(w, e => e.stage === 'TRACE_MEET');
  const traced = w => has(w, e => e.stage === 'TRACE_CHASE' && e.result === 'CORRECT');
  const linked = w => has(w, e => e.stage === 'LINK_CONNECT' && e.result === 'CORRECT');
  const pieced = w => has(w, e => e.stage === 'PIECE' && e.result === 'CORRECT');
  const found = w => HideV2Trail.wordReadiness(w).ready;
  const isNew = w => w.missionRole !== 'REVIEW';
  const isSample = () => mission()?.provenance?.source === 'SAMPLE';

  function progress() {
    const all = words();
    return {
      total: all.length,
      newCount: all.filter(isNew).length,
      reviewCount: all.filter(w => !isNew(w)).length,
      trace: all.filter(traced).length,
      link: all.filter(linked).length,
      piece: all.filter(pieced).length,
      found: all.filter(found).length,
      unmetNew: all.filter(w => isNew(w) && !met(w)).length
    };
  }
  // First trace is NEW-only; once every new word has been met, trace becomes the review-play variant.
  function tracePool() {
    const all = words(), unmet = all.filter(w => isNew(w) && !met(w));
    if (unmet.length) return { variant: 'FIRST', items: unmet.slice(0, 12) };
    const byNeed = all.map(w => ({ w, p: HideV2Memory.summary(w).nextReviewPriority + (traced(w) ? 0 : 40) })).sort((a, b) => b.p - a.p);
    return { variant: 'REVIEW', items: byNeed.slice(0, 12).map(x => x.w) };
  }
  function byPriority(limit = 12) {
    return words().map(w => ({ w, p: HideV2Memory.summary(w).nextReviewPriority + (found(w) ? 0 : 30) }))
      .sort((a, b) => b.p - a.p).slice(0, limit).map(x => x.w);
  }

  /* Old-word review (spec 13: sparse, skippable, never lowers today's readiness): words from earlier sets that
     hid again, or were found only on the day they were learned and are due to be found again after a real gap. */
  const DAY = 20 * 60 * 60 * 1000;
  function hiddenAcross(limit = 8) {
    const active = mission(), out = [], seen = new Set((active?.items || []).map(w => String(w.token).toLowerCase()));
    for (const m of realMissions()) {
      if (m.id === active?.id) continue;
      for (const w of m.items || []) {
        const rows = w.evidence || [], key = String(w.token).toLowerCase();
        if (!w.token || !w.meaning || !rows.length || seen.has(key)) continue;
        const sum = HideV2Memory.summary(w), last = Date.parse(rows[rows.length - 1].at) || 0;
        const rehidden = sum.needsUnassistedRecall, due = sum.memorySignature.traceCounts.spaced === 0 && sum.recallCount > 0;
        if ((rehidden || due) && Date.now() - last >= DAY) { seen.add(key); out.push({ w, p: sum.nextReviewPriority + (rehidden ? 30 : 0) }); }
      }
    }
    return out.sort((a, b) => b.p - a.p).slice(0, limit).map(x => x.w);
  }

  /* look-alike distance: confusable boundary items come from the learner's own set, never invented */
  function distance(a, b) {
    a = a.toLowerCase(); b = b.toLowerCase();
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n] - (a[0] === b[0] ? 0.5 : 0);
  }
  // the learner's own mix-ups come first: a word once picked instead of the target is the most useful boundary item
  function confusedWith(target) { return new Set((target.evidence || []).map(e => e.confusedWith).filter(Boolean)); }
  function lookAlikes(target, pool, n = 2) {
    const mine = confusedWith(target);
    return pool.filter(w => w.id !== target.id && w.meaning !== target.meaning)
      .map(w => ({ w, d: distance(w.token, target.token) + Math.random() * 0.4 - (mine.has(w.lexicalId) ? 5 : 0) }))
      .sort((a, b) => a.d - b.d).slice(0, n).map(x => x.w);
  }
  function distractors(target, n = 2, alike = false) {
    const pool = words();
    const picked = alike ? lookAlikes(target, pool, n) : S.sample(pool.filter(w => w.id !== target.id && w.meaning !== target.meaning), n);
    return picked;
  }

  /* PIECE: which part of the form is "critical". Verified compound parts first; otherwise a plain letter chunk
     (said to the child as letters, never as a root). */
  const VOWELS = 'aeiou';
  function chunkPlan(word) {
    const token = String(word.token), lower = token.toLowerCase();
    const ex = globalThis.HideLanguageModel?.starterExploration?.(word, {}) || null;
    const parts = (ex?.type === 'TRANSPARENT_COMPOUND' ? ex.parts : []).map(p => String(p.label || '')).filter(Boolean);
    if (parts.length >= 2 && parts.join('').toLowerCase() === lower && Math.random() < 0.5) {
      const i = Math.floor(Math.random() * parts.length), start = parts.slice(0, i).join('').length;
      return { start, len: parts[i].length, kind: 'WORD_PART' };
    }
    if (token.length <= 3) return { start: token.length - 1, len: 1, kind: 'LETTERS' };
    const len = token.length >= 7 ? 3 : 2;
    // prefer a chunk that contains a vowel: vowels are where spelling slips happen
    const starts = []; for (let i = 1; i + len <= token.length; i++) if ([...lower.slice(i, i + len)].some(c => VOWELS.includes(c))) starts.push(i);
    const start = starts.length ? starts[Math.floor(Math.random() * starts.length)] : 1;
    return { start, len, kind: 'LETTERS' };
  }
  function fakeChunks(chunk, n = 2) {
    const out = new Set(), c = chunk.toLowerCase(), swap = { a: 'e', e: 'i', i: 'e', o: 'u', u: 'o' };
    const tries = [
      [...c].map(ch => swap[ch] || ch).join(''),
      c.length > 1 ? c[1] + c[0] + c.slice(2) : c,
      [...c].map((ch, i) => i === c.length - 1 && swap[ch] ? swap[ch] : ch).join(''),
      c.replace(/[aeiou]/, m => ({ a: 'o', e: 'a', i: 'y', o: 'a', u: 'a' }[m])),
      c.length > 1 ? c.slice(0, -1) + 'bcdfglmnprst'[Math.floor(Math.random() * 12)] : 'aeiou'[Math.floor(Math.random() * 5)]
    ];
    for (const t of tries) { if (t && t !== c) out.add(t); if (out.size >= n) break; }
    let guard = 0; while (out.size < n && guard++ < 20) { const t = [...c].map(ch => Math.random() < 0.5 ? 'abcdefghijklmnoprstuvwy'[Math.floor(Math.random() * 22)] : ch).join(''); if (t !== c) out.add(t); }
    return [...out].slice(0, n);
  }

  S.words = { mission, words, fresh, locate, hiddenAcross, confusedWith, met, traced, linked, pieced, found, isNew, isSample, progress, tracePool, byPriority, distractors, lookAlikes, chunkPlan, fakeChunks, distance };
})();
