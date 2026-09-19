(() => {
  'use strict';

  const BRAND_VERSION = '2026.09.07-b';
  const OFFICIAL_DESCRIPTION = '머릿속에 숨어버린 단어 찾기';

  // Compatibility layer only: legacy state/property/storage identifiers remain untouched.
  // This file normalizes only user-facing copy and metadata to the current Hide & Seek world.
  const replacements = [
    [/Word Detective Team/g, 'Hidden Word Trail'],

    [/ACTIVE CASE/g, 'ACTIVE TRAIL'],
    [/Case Mastery/g, 'Trail Mastery'],
    [/Case ≠ Memory/g, 'Trail ≠ Memory'],

    [/시험지 · 사건 파일/g, '시험지 · 단어 탐험'],
    [/사건 파일 작성 완료/g, '단어 탐험 준비 완료'],
    [/사건 파일/g, '단어 탐험'],
    [/오늘의 수사 상태/g, '오늘의 탐험 상태'],
    [/나의 수사 동료/g, '나의 탐험 친구'],
    [/수사 동료/g, '탐험 친구'],
    [/수사관/g, '탐험가'],
    [/수사대/g, '탐험대'],
    [/수사 가능/g, '탐험 가능'],
    [/새 사건이 들어왔어/g, '새로운 숨은 단어가 나타났어'],
    [/새 사건부터 천천히 시작해볼까\?/g, '숨은 단어부터 천천히 찾아볼까?'],
    [/사건 준비 완료/g, '단어 찾기 완료'],
    [/사건 종결/g, '탐험 완료'],
    [/작은 과거 사건/g, '다시 숨어든 단어'],
    [/지난 사건의 기록/g, '지난 탐험의 기록'],
    [/완료한 사건은 완료 상태 그대로야/g, '완료한 탐험은 완료 상태 그대로야'],
    [/현재 사건 기록/g, '현재 탐험 기록'],
    [/사건 기록/g, '탐험 기록'],
    [/사건/g, '탐험'],

    [/FIRST CONTACT/g, 'FIRST FIND'],
    [/MEANING CHECK/g, 'MEANING CLUE'],
    [/CONNECTION(?! TRAIL)/g, 'CONNECTION TRAIL'],
    [/WEAK WORD/g, 'HIDDEN WORDS'],
    [/CODE RED/g, 'FINAL SEEK'],
    [/RETRACE/g, 'SEEK AGAIN'],
    [/재추적/g, '다시 찾기']
  ];

  function replaceText(value) {
    let next = String(value ?? '');
    for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
    return next;
  }

  function normalizeElementAttributes(el) {
    if (!(el instanceof Element)) return;
    for (const attr of ['aria-label', 'title', 'placeholder']) {
      if (!el.hasAttribute(attr)) continue;
      const current = el.getAttribute(attr);
      const next = replaceText(current);
      if (next !== current) el.setAttribute(attr, next);
    }
  }

  function normalizeTree(root = document.body) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      const parent = root.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return;
      const next = replaceText(root.nodeValue);
      if (next !== root.nodeValue) root.nodeValue = next;
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) normalizeElementAttributes(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const next = replaceText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }

    if (root.querySelectorAll) root.querySelectorAll('[aria-label],[title],[placeholder]').forEach(normalizeElementAttributes);
  }

  function normalizeMetadata() {
    document.title = 'Hide & Seek';

    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = OFFICIAL_DESCRIPTION;

    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.content = 'Hide & Seek';
  }

  function startObserver() {
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') normalizeTree(record.target);
        if (record.type === 'attributes') normalizeElementAttributes(record.target);
        record.addedNodes?.forEach(normalizeTree);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'title', 'placeholder']
    });
  }

  // Prevent legacy export filenames from leaking the superseded product name.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('#exportData');
    if (!button || typeof S === 'undefined') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const copy = JSON.parse(JSON.stringify(S));
    if (copy.settings) delete copy.settings.geminiKey;
    const blob = new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    link.download = `HIDE_SEEK_DATA_${date}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    try { toast('Hide & Seek 데이터를 내보냈어요.'); } catch {}
  }, true);

  normalizeMetadata();
  normalizeTree(document.body);
  startObserver();

  window.__HIDE_BRAND_CURRENT__ = { version: BRAND_VERSION, description: OFFICIAL_DESCRIPTION };
})();
