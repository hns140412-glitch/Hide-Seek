(() => {
  'use strict';

  const BRIDGE_VERSION = '2026.09.07-a';
  const EVENT_LIMIT = 120;
  const SHARED_PARAM_NAMES = ['session_id', 'goal_id', 'task_id', 'lap_id', 'return_target', 'snap_target', 'child_id'];
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

  const iso = () => new Date().toISOString();
  const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
    const event = {
      event_id: id('hide-event'),
      type,
      app: 'hide-seek',
      at: iso(),
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
    normalizeBrandAttributes();
    new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) normalizeBrandAttributes(node);
      }));
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
      isSafeUpdatePoint
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootBridge, { once: true });
  else bootBridge();
})();