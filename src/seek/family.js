/* Hide & Seek (rebuild) — family learning link.
   One learning history: what the child finds alone here is sent to the TAKY Learning Engine, which interprets it.
   - Only unassisted-recall attempts (숨은 단어 찾기 / 다시 찾기) are reported. Meeting, linking and piecing are
     exposure / association / reconstruction and stay on this device.
   - Example (sample) words are never reported.
   - A Ready-launched session keeps its own scope. Standalone play uses the learner chosen once on this device.
   - No mixing between children: rows recorded before a learner was chosen are credited only when the family has
     exactly one child (same rule as hide-learning-link-v1, whose stored choice is shared). */
(() => {
  'use strict';
  const S = globalThis.Seek, { $, $$, esc } = S;
  const LEARNER_KEY = 'hide.learningLink.learner.v1', QUEUE_KEY = 'taky_learning_evidence_pending_v1';
  const RECALL_STAGES = new Set(['FINAL_SEEK', 'SEEK_AGAIN']);
  const DEFAULT_SCOPE = Object.freeze({ subject: 'ENGLISH', concept_skill_target: 'vocabulary' });
  const clean = v => typeof v === 'string' ? v.trim() : '';
  let signin = null, session = null;

  /* ---------- who is learning ---------- */
  function readLearners() { try { const x = JSON.parse(localStorage.getItem(LEARNER_KEY) || '{}'); return x && typeof x === 'object' ? x : {}; } catch { return {}; } }
  function learnerRow(familyId) {
    const v = readLearners()[familyId];
    if (typeof v === 'string') return { member: clean(v), at: 0, only: false };
    return v && typeof v === 'object' ? { member: clean(v.member), at: Number(v.at) || 0, only: v.only === true } : { member: '', at: 0, only: false };
  }
  function setLearner(familyId, memberId, only) {
    const all = readLearners(), cur = learnerRow(familyId);
    all[familyId] = cur.member === memberId && cur.only === only ? { member: memberId, at: cur.at, only } : { member: memberId, at: Date.now(), only };
    try { localStorage.setItem(LEARNER_KEY, JSON.stringify(all)); } catch { /* stays for this visit only */ }
  }
  const learner = () => session ? learnerRow(session.family_id).member : '';

  /* ---------- scope: Ready's own session wins; otherwise the chosen learner + English vocabulary ---------- */
  function readyContext() {
    try {
      const p = new URLSearchParams(location.search), g = k => clean(p.get(k));
      return { session_id: g('session_id'), task_id: g('task_id'), lap_id: g('lap_id'), goal_id: g('goal_id'), child_id: g('child_id'), subject: g('subject'), concept_skill_target: g('concept_skill_target') };
    } catch { return {}; }
  }
  const readyOwned = c => !!(c.session_id || c.task_id || c.lap_id);

  function eventFor(missionId, word, row) {
    if (!RECALL_STAGES.has(row.stage) || row.objectiveVerified !== true) return null;
    const mission = HideV2Store.snapshot().missions.find(m => m.id === missionId);
    if (!mission || mission.provenance?.source === 'SAMPLE') return null;
    const ctx = readyContext(), owned = readyOwned(ctx);
    // standalone word pairs are reported as English vocabulary only when they are English; other scripts wait for a Ready scope
    if (!owned && globalThis.HideLanguageModel?.detectDomain?.(word) !== 'ENGLISH') return null;
    const Envelope = globalThis.TakyEventEnvelope; if (!Envelope?.create) return null;
    const assisted = row.assisted === true;
    const target = String(word.lexicalId || word.id || '');
    const payload = {
      learning_target_id: target, word_id: String(word.id || ''), instrument_version: 'HIDE_HOME_RECALL_V1', recall_direction: 'MEANING_TO_FORM',
      interaction_mode: 'RECALL', assisted, attemptCount: Math.max(1, Number(row.wrongAttempts || 0) + 1), responseLatencyMs: Math.max(0, Number(row.elapsedMs || 0)),
      result_type: assisted && row.result === 'CORRECT' ? 'HINT_USED' : String(row.result || ''),
      learning_scope: { subject: owned ? ctx.subject : DEFAULT_SCOPE.subject, concept_skill_target: owned ? ctx.concept_skill_target : DEFAULT_SCOPE.concept_skill_target }
    };
    if (row.result === 'CORRECT') payload.verification_observation = { response_value: String(word.token || '') };
    if (!payload.learning_scope.subject) delete payload.learning_scope.subject;
    if (!payload.learning_scope.concept_skill_target) delete payload.learning_scope.concept_skill_target;
    const envelope = Envelope.create({ source: 'hide-seek', event_type: 'RETRIEVAL_ATTEMPT_RESULT', occurred_at: new Date().toISOString(), correlation_id: ctx.session_id || ctx.task_id || null, payload });
    return {
      ...envelope, type: 'RETRIEVAL_ATTEMPT_RESULT', app: 'hide-seek', at: envelope.occurred_at,
      session_id: ctx.session_id || null, goal_id: ctx.goal_id || null, task_id: ctx.task_id || null, lap_id: ctx.lap_id || null,
      child_id: owned ? (ctx.child_id || null) : (learner() || null), payload
    };
  }
  function onEvidence(missionId, word, row) {
    const event = eventFor(missionId, word, row); if (!event) return null;
    // TakyLearningEvidenceClientV1 listens for this event, queues it on the device and sends it when signed in.
    try { window.dispatchEvent(new CustomEvent('taky-learning-event', { detail: event })); } catch { /* reporting never blocks learning */ }
    return event;
  }

  /* rows queued before a learner was known: credit them only when that cannot mix two children */
  function fillQueuedScope(memberId, { since = 0, only = false } = {}) {
    if (!memberId) return 0;
    let q; try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return 0; }
    if (!Array.isArray(q)) return 0;
    let n = 0;
    for (const r of q) {
      if (r?.app !== 'hide-seek' || !r.scope_hint) continue;
      const e = r.event || {};
      if (e.session_id || e.task_id || e.lap_id || clean(r.scope_hint.member_id)) continue;
      if (!only && !(Date.parse(r.enqueued_at || '') >= since)) continue;
      r.scope_hint = { ...r.scope_hint, member_id: memberId, subject: clean(r.scope_hint.subject) || DEFAULT_SCOPE.subject, concept_skill_target: clean(r.scope_hint.concept_skill_target) || DEFAULT_SCOPE.concept_skill_target };
      n++;
    }
    if (n) try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { return 0; }
    return n;
  }
  const client = () => globalThis.TakyLearningEvidenceClientV1;
  async function sendNow() {
    const c = client(); if (!c) return null;
    try { if (session) { const l = learnerRow(session.family_id); fillQueuedScope(l.member, { since: l.at, only: l.only }); } } catch { /* keep queue as is */ }
    try { return await c.flush(); } catch { return null; }
  }

  /* ---------- panel (stays in the page: the sign-in module binds to these ids once) ---------- */
  function ensurePanel() {
    let el = $('#skFamily'); if (el) return el;
    el = document.createElement('div'); el.id = 'skFamily'; el.className = 'sk-sheet'; el.hidden = true;
    el.innerHTML = `<div class="sk-sheet-back" data-fclose></div>
      <section class="sk-sheet-card" role="dialog" aria-modal="true" aria-labelledby="skFamTitle">
        <header class="sk-sheet-head"><h2 id="skFamTitle">가족 학습 연결</h2><button class="sk-x" data-fclose aria-label="닫기">×</button></header>
        <p class="sk-note">혼자 힘으로 찾은 단어 기록을 가족 학습 기록으로 보내. 이 기기에서 한 번만 로그인하면 돼.</p>
        <div id="familyLogin" class="sk-fam-login">
          <button id="familySignInBtn" class="sk-btn main" type="button" disabled>Google로 가족 로그인</button>
          <div id="familyGoogleTarget"></div><div id="familyChooseTarget" class="sk-fam-choices"></div>
          <p id="familyLoginStatus" class="sk-note" role="status">로그인하지 않음</p>
          <button id="familySignOutBtn" class="sk-btn ghost" type="button" hidden>이 기기에서 로그아웃</button>
        </div>
        <div id="skFamLearner" hidden><h3 class="sk-menu-h">누가 공부하나요?</h3><div class="sk-fam-choices" id="skFamMembers"></div></div>
        <p class="sk-note" id="skFamSync" aria-live="polite"></p>
      </section>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target.closest('[data-fclose]')) close(); });
    return el;
  }
  function open() { ensurePanel().hidden = false; renderLearner(); renderSync(); if (signin && !session) signin.restore?.(); }
  function close() { const el = $('#skFamily'); if (el) el.hidden = true; }

  function renderLearner() {
    const box = $('#skFamLearner'); if (!box) return;
    if (!session) { box.hidden = true; return; }
    const chosen = learner(); let k = 0; box.hidden = false;
    $('#skFamMembers').innerHTML = (session.authorized_member_ids || []).map(m => `<button type="button" class="sk-btn ${m === chosen ? 'main' : 'ghost'}" data-member="${esc(m)}" aria-pressed="${m === chosen}">${m === session.self_member_id ? '로그인한 나' : `가족 구성원 ${++k}`}</button>`).join('');
    $$('[data-member]', box).forEach(b => b.onclick = () => choose(b.dataset.member));
  }
  function renderSync(text) {
    const p = $('#skFamSync'); if (!p) return;
    if (text) { p.textContent = text; return; }
    const c = client(); if (!c || !session) { p.textContent = ''; return; }
    const count = f => { try { return f().length; } catch { return 0; } };
    p.textContent = learner() ? `보낸 기록 ${count(c.acked)}개 · 보낼 기록 ${count(c.pending)}개` : '누가 공부하는지 골라 줘.';
  }
  async function choose(memberId) {
    if (!session || !(session.authorized_member_ids || []).includes(memberId)) return;
    const others = (session.authorized_member_ids || []).filter(m => m !== session.self_member_id);
    setLearner(session.family_id, memberId, others.length === 1 && memberId === others[0]);
    renderLearner(); renderSync('기록 보내는 중…');
    const r = await sendNow();
    renderSync(r && (r.ok || r.reason === 'FLUSH_IN_PROGRESS') ? null : '지금은 보내지 못했어. 다음에 앱을 열면 다시 보낼게.');
    setTimeout(() => renderSync(), 1500);
  }
  async function onBound() {
    try { session = await globalThis.TAKY_FAMILY_RUNTIME.currentSession(); } catch { session = null; }
    if (!session) return;
    const ctx = readyContext(), members = session.authorized_member_ids || [], others = members.filter(m => m !== session.self_member_id), only = others.length === 1;
    let who = learner();
    if (ctx.child_id && members.includes(ctx.child_id)) who = ctx.child_id;   // a child named in the link always wins
    else if (who && !members.includes(who)) who = '';
    if (!who && only) who = others[0];
    if (who) { setLearner(session.family_id, who, only && who === others[0]); void sendNow().then(() => setTimeout(() => renderSync(), 300)); }
    renderLearner(); renderSync();
  }
  function onCleared() { session = null; renderLearner(); renderSync(); }

  function boot() {
    ensurePanel();
    const F = globalThis.TakyFamilySigninV1;
    if (!F) { renderSync('로그인 모듈을 불러오지 못했어.'); return; }
    signin = F.createFamilySignin({ viaCentral: true });
    window.addEventListener('taky-central-auth-ready', () => void onBound());
    window.addEventListener('taky-central-auth-cleared', onCleared);
    signin.mount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();

  globalThis.SeekBridge = { onEvidence };
  S.family = { open, close, status: () => ({ bound: !!session, family_id: session?.family_id || null, learner: learner() || null }), _test: { eventFor, fillQueuedScope, readyOwned } };
})();
