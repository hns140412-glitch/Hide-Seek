/* Hide & Seek (rebuild) — word-set helpers. Selection only; no scoring authority.
   Long-term review selection belongs to the Learning Engine; here we only order what is on hand. */
(() => {
  'use strict';
  const S = globalThis.Seek;
  const mission = () => HideV2Mission.activeMission();
  const words = () => (mission()?.items || []).filter(w => w.token && w.meaning);
  const fresh = id => words().find(w => w.id === id) || null;
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

  /* look-alike distance: confusable boundary items come from the learner's own set, never invented */
  function distance(a, b) {
    a = a.toLowerCase(); b = b.toLowerCase();
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n] - (a[0] === b[0] ? 0.5 : 0);
  }
  function lookAlikes(target, pool, n = 2) {
    return pool.filter(w => w.id !== target.id && w.meaning !== target.meaning)
      .map(w => ({ w, d: distance(w.token, target.token) + Math.random() * 0.4 }))
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

  S.words = { mission, words, fresh, met, traced, linked, pieced, found, isNew, isSample, progress, tracePool, byPriority, distractors, lookAlikes, chunkPlan, fakeChunks, distance };
})();
