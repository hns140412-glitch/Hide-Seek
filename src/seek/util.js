/* Hide & Seek (rebuild) — shared helpers: DOM, speech, crew companion, small store helpers.
   Screens and learning modes live in their own files; this file owns no learning rule. */
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Explorer Crew companion (Core6; the canonical Main from Ready wins when bound) ---------- */
  const CREW = Object.freeze([
    { id: 'dubi', name: '두비' }, { id: 'lori', name: '로리' }, { id: 'ink', name: '잉크' },
    { id: 'nova', name: '노바' }, { id: 'take', name: '테이크' }, { id: 'zero', name: '제로' }
  ]);
  const VOICE_FAMILY = Object.freeze({ dubi: 'VF01', lori: 'VF02', ink: 'VF03', take: 'VF04', nova: 'VF05', zero: 'VF06' });
  if (!globalThis.TakyCrewVoiceRegistry) {
    globalThis.TakyCrewVoiceRegistry = Object.freeze({ rows: Object.entries(VOICE_FAMILY).map(([character_id, voice_family]) => ({ character_id, voice_family })) });
  }
  function boundCrew() {
    try {
      const p = globalThis.HideExplorerCrewAuthorityConsumer?.snapshot?.(localStorage);
      if (p?.status === 'BOUND' && VOICE_FAMILY[p.character_id]) return p.character_id;
    } catch { /* standalone */ }
    return null;
  }
  const seekState = () => HideV2Store.snapshot().seek || {};
  const setSeek = patch => HideV2Store.transaction(s => { s.seek = { ...(s.seek || {}), ...patch }; });
  function crewId() { return boundCrew() || seekState().crewId || 'dubi'; }
  function crewInfo(id = crewId()) { const c = CREW.find(x => x.id === id) || CREW[0]; return { ...c, img: `./characters/ui_cutouts/${c.id}.png` }; }

  /* ---------- Speech: recorded crew line when the exact text is recorded, else the best device voice ---------- */
  let muted = false;
  function tts(text, lang = 'ko-KR', rate = 1) {
    if (muted || !('speechSynthesis' in window) || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang; u.rate = rate;
      speechSynthesis.speak(u);
    } catch { /* speech is optional */ }
  }
  function sayWord(token, lang = 'en-US') { globalThis.TakyCrewGuideLineVoice?.stop?.(); tts(token, lang, 0.9); }
  function crewSay(text, { speak = true } = {}) {
    const bar = $('#skCrewBar'); if (!bar) return;
    $('#skCrewLine').textContent = text || '';
    $('#skCrewBarImg').src = crewInfo().img;
    bar.hidden = !text;
    if (!text || !speak || muted) return;
    const consumer = { snapshot: () => ({ status: 'BOUND', character_id: crewId() }) };
    const fallback = () => tts(text, 'ko-KR', 1.02);
    if (!globalThis.TakyCrewGuideLineVoice?.play?.(text, consumer, fallback)) fallback();
  }
  function quiet() { try { speechSynthesis.cancel(); } catch { } globalThis.TakyCrewGuideLineVoice?.stop?.(); }

  /* ---------- Toast / bottom sheet ---------- */
  let toastTimer = 0;
  function toast(msg) { const t = $('#skToast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2200); }
  function sheet(html, onMount) {
    const el = $('#skSheet');
    el.innerHTML = `<div class="sk-sheet-back" data-close></div><section class="sk-sheet-card" role="dialog" aria-modal="true">${html}</section>`;
    el.hidden = false;
    el.onclick = e => { if (e.target.closest('[data-close]')) closeSheet(); };
    onMount?.(el);
  }
  function closeSheet() { const el = $('#skSheet'); el.hidden = true; el.innerHTML = ''; }

  /* ---------- Evidence: one place decides what a record means (trace standards) ---------- */
  const SPACED_GAP_MS = 12 * 60 * 60 * 1000;
  function lastEvidenceAt(word) { const rows = word?.evidence || []; return rows.length ? Date.parse(rows[rows.length - 1].at) || 0 : 0; }
  function record(missionId, word, ev) {
    const prior = lastEvidenceAt(word);
    const spaced = ev.objectiveRecall === true && prior > 0 && (Date.now() - prior) >= SPACED_GAP_MS;
    const row = { objectiveVerified: false, objectiveRecall: false, assisted: false, recallScoreImpact: false, spacedEvidence: spaced, app: 'HIDE_SEEK_R13', ...ev };
    HideV2Memory.record(missionId, word.id, row);
    try { globalThis.SeekBridge?.onEvidence?.(missionId, word, row); } catch { /* reporting never blocks learning */ }
    return row;
  }

  globalThis.Seek = { $, $$, esc, shuffle, sample, dayKey, wait, CREW, crewId, crewInfo, boundCrew, seekState, setSeek, tts, sayWord, crewSay, quiet, toast, sheet, closeSheet, record, setMuted: v => { muted = !!v; if (muted) quiet(); }, isMuted: () => muted };
})();
