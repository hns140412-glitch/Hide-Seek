(() => {
  'use strict';

  const BRIDGE_VERSION = '2026.09.07-a';
  const EVENT_LIMIT = 120;
  const SHARED_PARAM_NAMES = ['session_id', 'goal_id', 'task_id', 'lap_id', 'return_target', 'snap_target', 'child_id', 'subject', 'concept_skill_target', 'learning_target_id'];
  const legacyTerms = [
    [/Word Detective Team/g, 'Hidden Word Trail'],
    [/사건 파일/g, '단어 탐험'],
    [/수사/g, '탐험'],
    [/사건/g, '탐험']
  ];

  const originalSave = save;
  let bridgePersisting = false;
  let applyingUpdate = false;
  let lastSnapshot = '';

  const EventEnvelope = globalThis.TakyEventEnvelope;
  if(!EventEnvelope?.create) throw new Error('HIDE_SHARED_EVENT_ENVELOPE_UNAVAILABLE');
  const iso = () => new Date().toISOString();

  function readIncomingContext() {
    const params = new URLSearchParams(location.search);
    const incoming = {};
    for (const key of SHARED_PARAM_NAMES) {
      const value = params.get(key);
      if (value) incoming[key] = value;
    }
    return incoming;
  }

  function getContext() {
    return S.sharedLearningContext || {};
  }

  function persistBridgeState() {
    if (bridgePersisting) return;
    bridgePersisting = true;
    try {
      originalSave();
    } finally {
      bridgePersisting = false;
    }
  }

  function eventTypeForStatus(status) {
    if (status === 'COMPLETED') return 'TASK_COMPLETED';
    if (status === 'BLOCKED') return 'TASK_BLOCKED';
    if (status === 'HELP_NEEDED') return 'HELP_NEEDED';
    if (status === 'LEARNING') return 'TASK_STARTED';
    return 'TASK_PROGRESS';
  }

  function buildTaskSnapshot() {
    let sh = null;
    try { sh = sheet(); } catch {}
    return {
      activeSheetId: S.activeSheetId || null,
      sheetStatus: sh?.status || null,
      caseMastery: Number(sh?.caseMastery || 0),
      validWordCount: (() => { try { return validWords().length; } catch { return 0; } })(),
      captureActive: !!(S.hideSeekCaptureSession && S.hideSeekCaptureSession.status === 'CAPTURING')
    };
  }

  function targetOrigin() {
    const context = getContext();
    for (const candidate of [context.return_target, context.snap_target]) {
      if (!candidate) continue;
      try {
        const url = new URL(candidate, location.href);
        if (['http:', 'https:'].includes(url.protocol)) return url.origin;
      } catch {}
    }
    return location.origin;
  }

  function emit(type, payload = {}) {
    const context = getContext();
    const envelope = EventEnvelope.create({
      source:'hide-seek',
      event_type:type,
      occurred_at:iso(),
      correlation_id:context.session_id || context.task_id || null,
      payload
    });
    const event = {
      ...envelope,
      type,
      app:'hide-seek',
      at:envelope.occurred_at,
      session_id: context.session_id || null,
      goal_id: context.goal_id || null,
      task_id: context.task_id || null,
      lap_id: context.lap_id || null,
      child_id: context.child_id || null,
      payload
    };

    S.takyLearningOutbox = [...(S.takyLearningOutbox || []), event].slice(-EVENT_LIMIT);
    persistBridgeState();

    try {
      window.dispatchEvent(new CustomEvent('taky-learning-event', { detail: event }));
    } catch {}
    try {
      if (window.opener && !window.opener.closed) window.opener.postMessage({ type: 'TAKY_LEARNING_EVENT', event }, targetOrigin());
    } catch {}
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'TAKY_LEARNING_EVENT', event }, targetOrigin());
    } catch {}
    return event;
  }

  function safeReturnUrl(taskState = 'PARTIAL') {
    const context = getContext();
    if (!context.return_target) return null;
    try {
      const url = new URL(context.return_target, location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (context.session_id) url.searchParams.set('session_id', context.session_id);
      if (context.goal_id) url.searchParams.set('goal_id', context.goal_id);
      if (context.task_id) url.searchParams.set('task_id', context.task_id);
      if (context.lap_id) url.searchParams.set('lap_id', context.lap_id);
      url.searchParams.set('task_state', taskState);
      url.searchParams.set('from_app', 'hide-seek');
      return url.href;
    } catch {
      return null;
    }
  }

  function returnToBase(taskState = 'PARTIAL', payload = {}) {
    emit(
      taskState === 'COMPLETED' ? 'TASK_COMPLETED' :
      taskState === 'BLOCKED' ? 'TASK_BLOCKED' :
      taskState === 'HELP_NEEDED' ? 'HELP_NEEDED' :
      'TASK_PARTIAL',
      { ...buildTaskSnapshot(), ...payload }
    );
    const url = safeReturnUrl(taskState);
    if (url) location.href = url;
    else toast('베이스캠프 연결 주소가 없어요. 현재 결과는 기기에 보존했어요.');
  }

  function sendToSnap(word, contextText = '') {
    const context = getContext();
    const event = emit('HANDOFF_TO_SNAP', {
      word: String(word || '').trim(),
      context: String(contextText || '').trim(),
      sourceSheetId: S.activeSheetId || null
    });
    if (!context.snap_target) return event;
    try {
      const url = new URL(context.snap_target, location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return event;
      if (context.session_id) url.searchParams.set('session_id', context.session_id);
      if (context.task_id) url.searchParams.set('task_id', context.task_id);
      if (context.lap_id) url.searchParams.set('lap_id', context.lap_id);
      url.searchParams.set('from_app', 'hide-seek');
      url.searchParams.set('word', event.payload.word);
      if (event.payload.context) url.searchParams.set('word_context', event.payload.context);
      location.href = url.href;
    } catch {}
    return event;
  }

  function emitLearningMemorySignal(input = {}) {
    const context = getContext();
    const payload = {
      skill_id: input.skill_id || input.word || input.item_id || context.concept_skill_target || null,
      word: input.word || null,
      item_id: input.item_id || null,
      member_id: input.member_id || context.child_id || null,
      subject: input.subject || context.subject || null,
      concept_skill_target: input.concept_skill_target || context.concept_skill_target || null,
      learning_target_id: input.learning_target_id || context.learning_target_id || null,
      correct: typeof input.correct === 'boolean' ? input.correct : null,
      assisted: !!(input.assisted || input.hint_used),
      confusion: input.confusion ?? null,
      strength: input.strength ?? null,
      weakness: input.weakness ?? null,
      spacedEvidence: input.spacedEvidence ?? input.spaced_evidence ?? null,
      nextReviewPriority: input.nextReviewPriority ?? input.next_review_priority ?? null,
      mode: input.mode || null,
      sourceSheetId: S.activeSheetId || null,
      evidence_source_refs: Array.isArray(input.source_refs) ? [...input.source_refs] : [],
      evidence_provenance: Array.isArray(input.provenance) ? [...input.provenance] : [],
      observation_only: true,
      global_mastery_claim: false,
      long_term_schedule_owned_by_learning_engine: true
    };
    return emit('LEARNING_MEMORY_SIGNAL', payload);
  }

  function emitChildAuthoredReflection(input = {}) {
    const context = getContext();
    const allowedDifficulty = new Set(['EASY','OK','HARD','VERY_HARD']);
    const allowedRecall = new Set(['KNEW_AND_RECALLED','KNEW_BUT_COULD_NOT_RECALL','RECALLED_WITH_HINT','DID_NOT_KNOW']);
    const allowedConfidence = new Set(['LOW','MEDIUM','HIGH']);
    const difficulty = String(input.difficulty || '').toUpperCase();
    const recall_state = String(input.recall_state || '').toUpperCase();
    const confidence = String(input.confidence || '').toUpperCase();
    const member_id = input.member_id || context.child_id || null;
    if (input.child_authored !== true || input.explicit_confirmation !== true) {
      return { ok:false, reason:'CHILD_AUTHORED_CONFIRMATION_REQUIRED' };
    }
    if (!member_id) return { ok:false, reason:'MEMBER_SCOPE_REQUIRED' };
    if (!allowedDifficulty.has(difficulty) || !allowedRecall.has(recall_state) || !allowedConfidence.has(confidence)) {
      return { ok:false, reason:'SELF_REFLECTION_SELECTION_REQUIRED' };
    }
    const payload = {
      evidence_contract:'TAKY_SELF_REFLECTION_EVIDENCE_V1',
      event_id: input.event_id || `hide-reflection-${Date.now()}`,
      observed_at: new Date().toISOString(),
      member_id,
      subject: input.subject || context.subject || '영어',
      concept_skill_target: input.concept_skill_target || context.concept_skill_target || 'vocabulary',
      evidence_type:'SELF_REFLECTION_EVIDENCE',
      source_app:'hide-seek',
      instrument_version:'HIDE_CHILD_REFLECTION_V1',
      interaction_mode:'SELF_REFLECTION',
      verified_outcome:null,
      reflection:{
        difficulty,
        recall_state,
        confidence,
        confusion_with:Array.isArray(input.confusion_with)?input.confusion_with.map(v=>String(v).trim()).filter(Boolean):[],
        used_hint:input.used_hint===true,
        notes:input.notes ? String(input.notes).trim() : null
      },
      provenance:{
        authority:'SELF_REFLECTION_OBSERVATION_ONLY',
        can_verify_performance:false,
        can_directly_set_mastery:false,
        child_authored:true,
        explicit_confirmation:true,
        inference_from_telemetry:false,
        direct_award_allowed:false,
        requires_candidate_review:true
      },
      badge_guard:{
        auto_canonicalize:false,
        auto_activate:false,
        auto_award:false,
        auto_infer_error_discovery:false,
        auto_infer_deep_thinking:false,
        auto_infer_special_behavior:false
      },
      sourceSheetId:S.activeSheetId || null
    };
    return emit('SELF_REFLECTION_EVIDENCE', payload);
  }

  function ensureChildReflectionProducer() {
    let completed = false;
    try { completed = sheet()?.status === 'TEST_READY'; } catch {}
    const existing = document.getElementById('hideChildReflectionProducer');
    if (!completed) { existing?.remove(); return; }
    if (existing) return;

    const root = document.getElementById('view');
    if (!root) return;
    const section = document.createElement('section');
    section.id = 'hideChildReflectionProducer';
    section.className = 'card';
    section.style.marginTop = '12px';
    section.innerHTML = `
      <div class="hero-kicker"><span>MY REFLECTION</span><span>내가 직접 기록</span></div>
      <h2>오늘 단어 찾기는 어땠어?</h2>
      <p>정답 기록과 별개예요. 네가 직접 고른 내용만 배지 후보 검토의 증거가 될 수 있어요.</p>
      <div data-reflect-group="difficulty" class="btn-row" style="margin-top:10px">
        <button class="btn secondary" data-value="EASY" type="button">쉬웠어</button>
        <button class="btn secondary" data-value="OK" type="button">괜찮았어</button>
        <button class="btn secondary" data-value="HARD" type="button">어려웠어</button>
        <button class="btn secondary" data-value="VERY_HARD" type="button">아주 어려웠어</button>
      </div>
      <div data-reflect-group="recall" class="btn-row" style="margin-top:8px">
        <button class="btn secondary" data-value="KNEW_AND_RECALLED" type="button">바로 떠올랐어</button>
        <button class="btn secondary" data-value="KNEW_BUT_COULD_NOT_RECALL" type="button">아는데 안 떠올랐어</button>
        <button class="btn secondary" data-value="RECALLED_WITH_HINT" type="button">힌트 후 떠올랐어</button>
        <button class="btn secondary" data-value="DID_NOT_KNOW" type="button">몰랐어</button>
      </div>
      <div data-reflect-group="confidence" class="btn-row" style="margin-top:8px">
        <button class="btn secondary" data-value="LOW" type="button">아직 자신 없어</button>
        <button class="btn secondary" data-value="MEDIUM" type="button">조금 자신 있어</button>
        <button class="btn secondary" data-value="HIGH" type="button">자신 있어</button>
      </div>
      <label style="display:block;margin-top:10px">헷갈린 단어가 있으면 적어도 돼
        <input id="hideReflectionConfusion" type="text" placeholder="예: accept, except" style="width:100%;margin-top:6px">
      </label>
      <button class="btn primary full" id="hideReflectionSubmit" type="button" style="margin-top:12px">내 기록 저장</button>
      <small id="hideReflectionStatus" style="display:block;margin-top:8px"></small>
    `;
    root.appendChild(section);

    const selected = { difficulty:null, recall_state:null, confidence:null };
    section.querySelectorAll('[data-reflect-group]').forEach(group => {
      group.querySelectorAll('[data-value]').forEach(button => {
        button.addEventListener('click', () => {
          group.querySelectorAll('[data-value]').forEach(x => x.classList.remove('primary'));
          button.classList.add('primary');
          const key = group.dataset.reflectGroup === 'recall' ? 'recall_state' : group.dataset.reflectGroup;
          selected[key] = button.dataset.value;
        });
      });
    });
    section.querySelector('#hideReflectionSubmit')?.addEventListener('click', () => {
      if (!selected.difficulty || !selected.recall_state || !selected.confidence) {
        toast('세 가지를 네가 직접 골라 주세요.');
        return;
      }
      const confusion = String(section.querySelector('#hideReflectionConfusion')?.value || '')
        .split(',').map(v => v.trim()).filter(Boolean);
      const result = emitChildAuthoredReflection({
        ...selected,
        confusion_with:confusion,
        used_hint:selected.recall_state === 'RECALLED_WITH_HINT',
        child_authored:true,
        explicit_confirmation:true
      });
      const status = section.querySelector('#hideReflectionStatus');
      if (result?.ok === false) {
        if (status) status.textContent = result.reason === 'MEMBER_SCOPE_REQUIRED'
          ? '베이스캠프에서 연결된 사용자 정보가 있어야 저장할 수 있어요.'
          : '선택 내용을 다시 확인해 주세요.';
        return;
      }
      if (status) status.textContent = '내가 직접 남긴 회고가 저장됐어요. 자동 배지 지급은 하지 않아요.';
      const submit = section.querySelector('#hideReflectionSubmit');
      if (submit) submit.disabled = true;
    });
  }

  function requestImaginationCloud(word, reason = 'retrieval_support') {
    return emit('IMAGINATION_CLOUD_REQUEST', {
      word: String(word || '').trim(),
      reason,
      returnSheetId: S.activeSheetId || null
    });
  }

  function isSafeUpdatePoint() {
    const capture = S.hideSeekCaptureSession;
    if (capture && capture.status === 'CAPTURING') return false;
    let status = null;
    try { status = sheet()?.status || null; } catch {}
    return !['LEARNING', 'CODE_RED_READY', 'RETRACE_REQUIRED'].includes(status);
  }

  globalThis.HideSeekPwaSafePoint=isSafeUpdatePoint;

  function ensureCaptureResumeChip() {
    const active = S.hideSeekCaptureSession && S.hideSeekCaptureSession.status === 'CAPTURING' && S.hideSeekCaptureSession.pages?.length;
    let chip = document.getElementById('hideCaptureResumeChip');
    if (!active) {
      chip?.remove();
      document.querySelector('.hide-resume-chip:not(#hideCaptureResumeChip)')?.remove();
      return;
    }
    document.querySelector('.hide-resume-chip:not(#hideCaptureResumeChip)')?.remove();
    if (!chip) {
      chip = document.createElement('button');
      chip.id = 'hideCaptureResumeChip';
      chip.className = 'hide-system-chip hide-system-chip-capture';
      chip.type = 'button';
      chip.textContent = '촬영 이어가기';
      chip.onclick = () => {
        currentTab = 'home';
        viewStack = [];
        render();
        setTimeout(() => document.querySelector('#photoFirst')?.click(), 0);
      };
      document.body.appendChild(chip);
    }
  }

  function ensureBaseCampChip() {
    const context = getContext();
    const linked = !!(context.session_id || context.task_id || context.return_target);
    let chip = document.getElementById('hideBaseCampChip');
    if (!linked) {
      chip?.remove();
      return;
    }
    if (!chip) {
      chip = document.createElement('button');
      chip.id = 'hideBaseCampChip';
      chip.className = 'hide-system-chip hide-system-chip-base';
      chip.type = 'button';
      chip.textContent = '베이스캠프로';
      chip.onclick = () => {
        let state = 'PARTIAL';
        try {
          const status = sheet()?.status;
          if (status === 'COMPLETED' || status === 'TEST_READY') state = 'COMPLETED';
        } catch {}
        returnToBase(state);
      };
      document.body.appendChild(chip);
    }
  }

  async function applyWaitingUpdate(registration) {
    if (applyingUpdate || !registration?.waiting) return;
    if (!isSafeUpdatePoint()) return ensureUpdateChip(registration);
    applyingUpdate = true;
    S.hideUpdateReady = false;
    persistBridgeState();
    emit('UPDATE_APPLY', { safePoint: true });
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    }, { once: true });
    registration.waiting.postMessage({ type: 'APPLY_UPDATE' });
  }

  function ensureUpdateChip(registration) {
    let chip = document.getElementById('hideUpdateChip');
    if (!registration?.waiting) {
      chip?.remove();
      return;
    }
    S.hideUpdateReady = true;
    persistBridgeState();
    if (!chip) {
      chip = document.createElement('button');
      chip.id = 'hideUpdateChip';
      chip.className = 'hide-system-chip hide-system-chip-update';
      chip.type = 'button';
      chip.textContent = '업데이트 준비됨';
      chip.onclick = () => {
        if (isSafeUpdatePoint()) applyWaitingUpdate(registration);
        else toast('학습이나 촬영이 끝난 안전한 시점에 적용할게요.');
      };
      document.body.appendChild(chip);
    }
  }

  async function inspectUpdateRegistration(registration) {
    if (!registration) return;
    if (registration.waiting) {
      if (isSafeUpdatePoint()) await applyWaitingUpdate(registration);
      else ensureUpdateChip(registration);
    }
  }

  async function watchSafeUpdates() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await inspectUpdateRegistration(registration);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setTimeout(() => inspectUpdateRegistration(registration), 0);
          }
        });
      });
      window.setInterval(() => {
        if (S.hideUpdateReady && isSafeUpdatePoint()) inspectUpdateRegistration(registration);
      }, 2500);
    } catch {}
  }

  function normalizeBrandAttributes(root = document) {
    const nodes = root.querySelectorAll?.('[aria-label],[title],[alt]') || [];
    nodes.forEach(el => {
      ['aria-label', 'title', 'alt'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        let value = el.getAttribute(attr);
        for (const [pattern, replacement] of legacyTerms) value = value.replace(pattern, replacement);
        el.setAttribute(attr, value);
      });
    });
  }

  function snapshotChanged() {
    const next = JSON.stringify(buildTaskSnapshot());
    if (next === lastSnapshot) return;
    lastSnapshot = next;
    const context = getContext();
    if (context.session_id || context.task_id || context.lap_id) {
      const snap = JSON.parse(next);
      emit(eventTypeForStatus(snap.sheetStatus), snap);
    }
  }

  function wrapSaveForBridge() {
    save = function bridgedSave() {
      originalSave();
      if (bridgePersisting) return;
      ensureCaptureResumeChip();
      ensureBaseCampChip();
      snapshotChanged();
    };
  }

  function bootContext() {
    const incoming = readIncomingContext();
    if (Object.keys(incoming).length) {
      S.sharedLearningContext = { ...(S.sharedLearningContext || {}), ...incoming, receivedAt: iso() };
      persistBridgeState();
    }
    if (!S.sharedLearningContext) S.sharedLearningContext = {};
  }

  function bootBridge() {
    document.documentElement.dataset.hideBridge = BRIDGE_VERSION;
    bootContext();
    wrapSaveForBridge();
    ensureCaptureResumeChip();
    ensureBaseCampChip();
    ensureChildReflectionProducer();
    normalizeBrandAttributes();
    new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) normalizeBrandAttributes(node);
      }));
      ensureChildReflectionProducer();
    }).observe(document.body, { childList: true, subtree: true });
    lastSnapshot = JSON.stringify(buildTaskSnapshot());
    watchSafeUpdates();

    window.HideSeekBridge = Object.freeze({
      version: BRIDGE_VERSION,
      context: () => ({ ...getContext() }),
      emit,
      returnToBase,
      sendToSnap,
      requestImaginationCloud,
      emitLearningMemorySignal,
      emitChildAuthoredReflection,
      ensureChildReflectionProducer,
      isSafeUpdatePoint
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootBridge, { once: true });
  else bootBridge();
})();