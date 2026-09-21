(() => {
  'use strict';

  const BRIDGE_VERSION = '2026.09.21-b';
  const EVENT_LIMIT = 120;
  const SHARED_PARAM_NAMES = ['session_id', 'goal_id', 'task_id', 'lap_id', 'return_target', 'snap_target', 'child_id', 'actor_role', 'crew_member_id', 'crew_member_name', 'crew_rules_version'];
  const legacyTerms = [
    [/Word Detective Team/g, 'Hidden Word Trail'],
    [/사건 파일/g, '단어 탐험'],
    [/수사/g, '탐험'],
    [/사건/g, '탐험']
  ];

  const originalSave = save;
  let bridgePersisting = false;
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

  function taskStateForStatus(status) {
    if (status === 'COMPLETED' || status === 'TEST_READY') return 'COMPLETED';
    if (status === 'BLOCKED') return 'BLOCKED';
    if (status === 'HELP_NEEDED') return 'HELP_NEEDED';
    return 'PARTIAL';
  }

  function eventTypeForStatus(status) {
    const taskState = taskStateForStatus(status);
    if (taskState === 'COMPLETED') return 'TASK_COMPLETED';
    if (taskState === 'BLOCKED') return 'TASK_BLOCKED';
    if (taskState === 'HELP_NEEDED') return 'HELP_NEEDED';
    if (status === 'LEARNING') return 'TASK_STARTED';
    return 'TASK_PROGRESS';
  }

  function buildMemorySummary() {
    let words = [];
    try { words = validWords(); } catch {}
    const reasonCounts = { recovery: 0, confusion: 0, orthographic: 0, latency: 0, hint: 0, decay: 0, stable: 0 };
    const priorities = [];
    let measured = 0;
    let strengthTotal = 0;
    for (const w of words) {
      let view = null;
      try { view = memoryStatusView(w); } catch {}
      const key = view?.reason?.key || 'stable';
      if (key in reasonCounts) reasonCounts[key] += 1;
      if (Number.isFinite(view?.strength)) { measured += 1; strengthTotal += Number(view.strength); }
      if (Number.isFinite(view?.priority)) priorities.push({ lexicalId: w.lexicalId || senseKey(w), priority: Math.round(Number(view.priority)), reason: key });
    }
    priorities.sort((a, b) => b.priority - a.priority);
    const roleCounts = words.reduce((a,w)=>{const role=String(w.missionRole||'').toUpperCase();if(role==='NEW'||role==='REVIEW')a[role]+=1;return a},{NEW:0,REVIEW:0});
    const mockCounts={CORRECT:0,CONFUSED:0,WRONG:0,ASSISTED_CORRECT:0,RECOVERED_CORRECT:0};
    let thinkingSceneAssistanceCount=0;
    for(const w of words){
      const assessment=Array.isArray(w.learningStats?.assessmentTrace)?w.learningStats.assessmentTrace:[];
      for(const x of assessment){
        if(x?.source==='MORNING_MOCK_TEST'&&x?.result in mockCounts)mockCounts[x.result]+=1;
      }
      const assistance=Array.isArray(w.learningStats?.assistanceTrace)?w.learningStats.assistanceTrace:[];
      thinkingSceneAssistanceCount+=assistance.filter(x=>x?.step==='THINKING_SCENE').length;
    }
    return {
      authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
      averageMemoryStrength: measured ? Math.round(strengthTotal / measured) : 0,
      reasonCounts,
      needsUnassistedRecallCount: reasonCounts.recovery,
      topReviewPriorities: priorities.slice(0, 5),
      missionComposition:{newCount:roleCounts.NEW,reviewCount:roleCounts.REVIEW},
      morningMockTest:{
        recordedCount:Object.values(mockCounts).reduce((a,n)=>a+n,0),
        resultCounts:mockCounts
      },
      thinkingSceneAssistanceCount
    };
  }

  function buildTaskSnapshot() {
    let sh = null;
    try { sh = sheet(); } catch {}
    return {
      activeSheetId: S.activeSheetId || null,
      explorationMissionId: S.activeSheetId || null,
      explorationMissionTitle: sh?.title || null,
      inputActorRole: S.hideSeekCaptureSession?.inputActorRole || getContext().actor_role || null,
      sheetStatus: sh?.status || null,
      trailMastery: Number(sh?.caseMastery || 0),
      legacyCaseMastery: Number(sh?.caseMastery || 0),
      taskState: taskStateForStatus(sh?.status || null),
      validWordCount: (() => { try { return validWords().length; } catch { return 0; } })(),
      captureActive: !!(S.hideSeekCaptureSession && S.hideSeekCaptureSession.status === 'CAPTURING'),
      learningPhase: S.learning?.phase || null,
      learningHistoryCount: Array.isArray(S.learning?.history) ? S.learning.history.length : 0,
      finalSeekAttemptCount: Array.isArray(S.codeRed?.history) ? S.codeRed.history.length : 0,
      seekAgainRemainingCount: Array.isArray(S.codeRed?.retrace) ? S.codeRed.retrace.length : 0,
      learningProvenance: sh?.learningProvenance ? { ...sh.learningProvenance } : {},
      cumulativeLexiconCount: Object.keys(S.lexicon || {}).length,
      missionComposition: sh?.missionComposition ? { ...sh.missionComposition } : (()=>{const ms=buildMemorySummary();return {expectedNew:ms.missionComposition.newCount,expectedReview:ms.missionComposition.reviewCount,layoutIndependent:true}})(),
      morningMockTestSummary: buildMemorySummary().morningMockTest,
      memorySummary: buildMemorySummary()
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
      actor_role: context.actor_role || null
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

  function safeReturnUrl(taskState = 'PARTIAL', event = null) {
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
      if (event?.event_id) url.searchParams.set('event_id', event.event_id);
      const summary = event?.payload?.memorySummary;
      if (summary) url.searchParams.set('memory_summary', JSON.stringify(summary));
      if (event?.payload) {
        const p = event.payload;
        const report = {
          explorationMissionId: p.explorationMissionId || null,
          explorationMissionTitle: p.explorationMissionTitle || null,
          inputActorRole: p.inputActorRole || context.actor_role || null,
          validWordCount: Number(p.validWordCount || 0),
          trailMastery: Number(p.trailMastery || 0),
          learningPhase: p.learningPhase || null,
          finalSeekAttemptCount: Number(p.finalSeekAttemptCount || 0),
          seekAgainRemainingCount: Number(p.seekAgainRemainingCount || 0),
          missionComposition: p.missionComposition || null,
          morningMockTestSummary: p.morningMockTestSummary || null,
          specialistAuthority: 'SPECIALIST_MEMORY_ADVISORY_ONLY'
        };
        url.searchParams.set('specialist_report', JSON.stringify(report));
      }
      return url.href;
    } catch {
      return null;
    }
  }

  function returnToBase(taskState = 'PARTIAL', payload = {}) {
    const event = emit(
      taskState === 'COMPLETED' ? 'TASK_COMPLETED' :
      taskState === 'BLOCKED' ? 'TASK_BLOCKED' :
      taskState === 'HELP_NEEDED' ? 'HELP_NEEDED' :
      'TASK_PARTIAL',
      { ...buildTaskSnapshot(), ...payload }
    );
    const url = safeReturnUrl(taskState, event);
    if (url) location.href = url;
    else toast('베이스캠프 연결 주소가 없어요. 현재 결과는 기기에 보존했어요.');
  }

  function sendToSnap(word, contextText = '') {
    const context = getContext();
    const event = emit('HANDOFF_TO_SNAP', {
      word: String(word || '').trim(),
      context: String(contextText || '').trim(),
      sourceSheetId: S.activeSheetId || null,
      crewMemberId: S.crewMember?.explorerId || null,
      crewMemberName: S.crewMember?.name || null,
      crewRulesVersion: S.crewMember?.rulesVersion || null
    });
    if (!context.snap_target) return event;
    try {
      const url = new URL(context.snap_target, location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return event;
      if (context.session_id) url.searchParams.set('session_id', context.session_id);
      if (context.goal_id) url.searchParams.set('goal_id', context.goal_id);
      if (context.task_id) url.searchParams.set('task_id', context.task_id);
      if (context.lap_id) url.searchParams.set('lap_id', context.lap_id);
      if (context.return_target) url.searchParams.set('return_target', context.return_target);
      if (context.child_id) url.searchParams.set('child_id', context.child_id);
      if (event.payload.crewMemberId) url.searchParams.set('crew_member_id', event.payload.crewMemberId);
      if (event.payload.crewMemberName) url.searchParams.set('crew_member_name', event.payload.crewMemberName);
      if (event.payload.crewRulesVersion) url.searchParams.set('crew_rules_version', event.payload.crewRulesVersion);
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
        try { state = taskStateForStatus(sheet()?.status || null); } catch {}
        returnToBase(state);
      };
      document.body.appendChild(chip);
    }
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
      if (incoming.crew_member_id || incoming.crew_member_name) {
        S.crewMember = {
          ...(S.crewMember || {}),
          explorerId: incoming.crew_member_id || S.crewMember?.explorerId || '',
          name: incoming.crew_member_name || S.crewMember?.name || '탐험대원',
          source: 'SNAP_POP_CANONICAL',
          rulesVersion: incoming.crew_rules_version || S.crewMember?.rulesVersion || null
        };
      }
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

    window.HideSeekBridge = Object.freeze({
      version: BRIDGE_VERSION,
      context: () => ({ ...getContext() }),
      emit,
      returnToBase,
      sendToSnap,
      requestImaginationCloud,
      buildMemorySummary,
      isSafeUpdatePoint
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootBridge, { once: true });
  else bootBridge();
})();