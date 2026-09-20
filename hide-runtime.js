(() => {
  'use strict';
  const HIDE_RUNTIME_VERSION = '2026.09.07-a';
  const CAPTURE_STATE_KEY = 'hideSeekCaptureSession';
  const legacyBrandReplacements = [
    [/Word Detective Team/g, 'Hidden Word Trail'],
    [/ACTIVE CASE/g, 'ACTIVE TRAIL'],
    [/시험지 · 사건 파일/g, '시험지 · 단어 탐험'],
    [/사건 파일 작성 완료/g, '단어 탐험 준비 완료'],
    [/사건 파일/g, '단어 탐험'],
    [/오늘의 수사 상태/g, '오늘의 탐험 상태'],
    [/나의 수사 동료/g, '나의 탐험 친구'],
    [/수사 동료/g, '탐험 친구'],
    [/수사 가능/g, '탐험 가능'],
    [/새 사건부터 천천히 시작해볼까\?/g, '숨은 단어부터 천천히 찾아볼까?'],
    [/지난 사건의 기록/g, '지난 탐험의 기록'],
    [/완료한 사건은 완료 상태 그대로야/g, '완료한 탐험은 완료 상태 그대로야']
  ];

  let cameraStream = null;
  let pendingReplacePageId = null;
  let captureBusy = false;
  let brandObserver = null;

  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const currentSession = () => S[CAPTURE_STATE_KEY] || null;

  function migrateLegacyCaptureSession() {
    const legacy = S.captureSession;
    if (!legacy || S[CAPTURE_STATE_KEY]) {
      if (legacy && S[CAPTURE_STATE_KEY]) {
        delete S.captureSession;
        save();
      }
      return;
    }
    const pages = Array.isArray(legacy.pages) ? legacy.pages.map((p, i) => ({
      pageId: p.pageId || makeId('page'),
      displayOrder: i + 1,
      blobKey: p.blobKey || p.assetKey || '',
      capturedAt: p.capturedAt || legacy.createdAt || nowISO(),
      source: p.source || p.sourceType || 'legacy',
      quality: {
        width: Number(p.width || p.quality?.width || 0),
        height: Number(p.height || p.quality?.height || 0),
        warnings: Array.isArray(p.warnings) ? p.warnings : (p.quality?.warnings || []),
        quality: p.quality?.quality || p.quality || '저장됨'
      },
      revision: Number(p.revision || 1),
      dirty: !p.analyzedAt
    })).filter(p => p.blobKey) : [];
    S[CAPTURE_STATE_KEY] = {
      captureSessionId: legacy.captureSessionId || legacy.sessionId || makeId('capture'),
      status: legacy.status === 'CLOSED' ? 'CANCELLED' : 'CAPTURING',
      createdAt: legacy.createdAt || nowISO(),
      updatedAt: legacy.updatedAt || nowISO(),
      pages,
      analysisBatches: Array.isArray(legacy.analysisBatches) ? legacy.analysisBatches : [],
      lastRows: S.ocrDraft?.captureSessionId === (legacy.captureSessionId || legacy.sessionId) ? (S.ocrDraft.rows || []) : [],
      dirtyPageIds: pages.filter(p => p.dirty).map(p => p.pageId),
      committedSheetId: legacy.committedSheetId || null,
      migratedFromLegacyCapture: true
    };
    delete S.captureSession;
    save();
  }

  function newCaptureSession() {
    const s = {
      captureSessionId: makeId('capture'),
      status: 'CAPTURING',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      pages: [],
      analysisBatches: [],
      lastRows: [],
      dirtyPageIds: [],
      committedSheetId: null
    };
    S[CAPTURE_STATE_KEY] = s;
    save();
    return s;
  }

  function ensureCaptureSession() {
    const s = currentSession();
    if (!s || s.status === 'COMMITTED' || s.status === 'CANCELLED') return newCaptureSession();
    return s;
  }

  function persistCaptureSession(session) {
    session.updatedAt = nowISO();
    S[CAPTURE_STATE_KEY] = session;
    save();
  }

  async function dbDelete(key) {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('assets', 'readwrite');
      tx.objectStore('assets').delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function captureBlobFromVideo(video) {
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(video, 0, 0, width, height);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  }

  async function inspectBlob(blob) {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const short = Math.min(bmp.width, bmp.height);
      const long = Math.max(bmp.width, bmp.height);
      const warnings = [];
      if (short < 700) warnings.push('해상도가 낮아요');
      if (long < 1200) warnings.push('글자가 작게 보일 수 있어요');
      if (long / Math.max(1, short) > 4.5) warnings.push('사진 비율이 너무 길어요');
      return { width: bmp.width, height: bmp.height, warnings, quality: warnings.length ? '확인 필요' : '양호' };
    } catch {
      return { width: 0, height: 0, warnings: ['사진 정보를 확인하지 못했어요'], quality: '확인 필요' };
    }
  }

  async function saveCaptureBlob(blob, source = 'camera', replacePageId = null) {
    if (!blob || blob.size <= 0) throw new Error('빈 사진은 저장할 수 없어요.');
    const session = ensureCaptureSession();
    const quality = await inspectBlob(blob);
    const pageId = replacePageId || makeId('page');
    const blobKey = `hide-capture:${session.captureSessionId}:${pageId}:${Date.now()}`;
    await dbSet(blobKey, blob);

    if (replacePageId) {
      const page = session.pages.find(p => p.pageId === replacePageId);
      if (!page) throw new Error('다시 찍을 페이지를 찾지 못했어요.');
      if (page.blobKey) await dbDelete(page.blobKey).catch(() => {});
      page.blobKey = blobKey;
      page.capturedAt = nowISO();
      page.source = source;
      page.quality = quality;
      page.revision = Number(page.revision || 0) + 1;
      page.dirty = true;
      session.lastRows = (session.lastRows || []).filter(r => r.sourcePageId !== page.pageId);
      if (!session.dirtyPageIds.includes(page.pageId)) session.dirtyPageIds.push(page.pageId);
    } else {
      const page = {
        pageId,
        displayOrder: session.pages.length + 1,
        blobKey,
        capturedAt: nowISO(),
        source,
        quality,
        revision: 1,
        dirty: true
      };
      session.pages.push(page);
      session.dirtyPageIds.push(page.pageId);
    }

    persistCaptureSession(session);
    return { session, quality };
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    document.querySelector('#hideRapidCamera')?.remove();
  }

  async function openRapidCamera(replacePageId = null) {
    pendingReplacePageId = replacePageId || null;
    ensureCaptureSession();

    if (!navigator.mediaDevices?.getUserMedia) {
      const input = document.querySelector('#sheetCameraInput');
      if (input) {
        input.value = '';
        input.click();
      }
      return;
    }

    stopCamera();
    const overlay = document.createElement('div');
    overlay.id = 'hideRapidCamera';
    overlay.className = 'hide-camera-overlay';
    overlay.innerHTML = `
      <div class="hide-camera-stage">
        <video id="hideCameraVideo" autoplay muted playsinline></video>
        <div class="hide-camera-guide">
          <b>${replacePageId ? '이 장만 다시 찍기' : '숨은 단어 빠르게 촬영'}</b>
          <span>셔터를 누르면 바로 임시 저장되고 다음 장을 찍을 수 있어요.</span>
        </div>
        <div class="hide-camera-controls">
          <button id="hideCameraClose" class="hide-camera-secondary" type="button">닫기</button>
          <button id="hideCameraShutter" class="hide-camera-shutter" type="button" aria-label="촬영"></button>
          <button id="hideCameraAnalyze" class="hide-camera-secondary" type="button">분석</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      const video = overlay.querySelector('#hideCameraVideo');
      video.srcObject = cameraStream;
      overlay.querySelector('#hideCameraClose').onclick = () => {
        stopCamera();
        renderCaptureHub();
      };
      overlay.querySelector('#hideCameraAnalyze').onclick = async () => {
        stopCamera();
        await analyzeDirtyPages();
      };
      overlay.querySelector('#hideCameraShutter').onclick = async () => {
        if (captureBusy) return;
        captureBusy = true;
        const shutter = overlay.querySelector('#hideCameraShutter');
        shutter.classList.add('saving');
        try {
          const blob = await captureBlobFromVideo(video);
          const replacement = pendingReplacePageId;
          await saveCaptureBlob(blob, 'camera', replacement);
          pendingReplacePageId = null;
          toast(replacement ? '이 장만 다시 저장했어요.' : '저장했어요. 다음 장!');
          const guide = overlay.querySelector('.hide-camera-guide span');
          if (guide) guide.textContent = '저장 완료 · 바로 다음 장을 찍어도 돼요.';
        } catch (e) {
          toast(e.message || '촬영 저장에 실패했어요.');
        } finally {
          shutter.classList.remove('saving');
          captureBusy = false;
        }
      };
    } catch {
      stopCamera();
      const input = document.querySelector('#sheetCameraInput');
      if (input) {
        input.value = '';
        input.click();
      }
    }
  }

  async function addFiles(files, source = 'library') {
    const list = [...(files || [])].filter(Boolean);
    if (!list.length) return;
    let first = true;
    for (const file of list) {
      try {
        if (!/^image\//.test(file.type || '')) throw new Error('이미지 파일만 추가할 수 있어요.');
        if (file.size > 20 * 1024 * 1024) throw new Error('20MB 이하 사진을 사용해 주세요.');
        const replaceId = first ? pendingReplacePageId : null;
        await saveCaptureBlob(file, source, replaceId);
        if (replaceId) pendingReplacePageId = null;
        first = false;
      } catch (e) {
        toast(e.message || '사진 추가에 실패했어요.');
      }
    }
    renderCaptureHub();
  }

  async function renderCaptureHub() {
    stopCamera();
    const session = ensureCaptureSession();
    const view = document.querySelector('#view');
    if (!view) return;
    view.innerHTML = `
      <section class="hide-capture-shell">
        <div class="hero-kicker"><span>RAPID CAPTURE</span><span>자동 임시 저장</span></div>
        <h2>숨은 단어 촬영</h2>
        <p>셔터 뒤 확인 화면 없이 저장하고 계속 찍어요. 분석해도 촬영 세션은 끝나지 않아요.</p>
        <div id="hideCapturePages" class="hide-capture-pages"></div>
        <div class="hide-capture-actions">
          <button id="hideCaptureCamera" class="btn primary" type="button">카메라 계속</button>
          <button id="hideCaptureLibrary" class="btn secondary" type="button">앨범 추가</button>
          <button id="hideCaptureAnalyze" class="btn dark" type="button">지금 분석</button>
          <button id="hideCaptureLeave" class="btn secondary" type="button">나중에 계속</button>
        </div>
      </section>`;

    const pagesEl = view.querySelector('#hideCapturePages');
    if (!session.pages.length) {
      pagesEl.innerHTML = '<div class="hide-capture-empty">아직 촬영한 장이 없어요.</div>';
    } else {
      pagesEl.innerHTML = session.pages
        .slice().sort((a, b) => a.displayOrder - b.displayOrder)
        .map(p => `
          <article class="hide-capture-page" data-page="${p.pageId}">
            <div class="hide-capture-thumb" data-thumb="${p.pageId}"><span>${p.displayOrder}</span></div>
            <div class="hide-capture-meta">
              <b>${p.displayOrder}번째 장</b>
              <small>${p.dirty ? '분석 필요' : '분석됨'} · ${p.quality?.quality || '저장됨'}</small>
            </div>
            <button class="btn secondary hide-retake" data-retake="${p.pageId}" type="button">다시 찍기</button>
          </article>`).join('');

      for (const page of session.pages) {
        try {
          const blob = await dbGet(page.blobKey);
          if (!blob) continue;
          const url = URL.createObjectURL(blob);
          const box = pagesEl.querySelector(`[data-thumb="${page.pageId}"]`);
          if (box) {
            box.innerHTML = `<img src="${url}" alt="${page.displayOrder}번째 장"><span>${page.displayOrder}</span>`;
            const img = box.querySelector('img');
            img.onload = () => URL.revokeObjectURL(url);
          } else URL.revokeObjectURL(url);
        } catch {}
      }
    }

    view.querySelector('#hideCaptureCamera').onclick = () => openRapidCamera();
    view.querySelector('#hideCaptureLibrary').onclick = () => {
      const input = document.querySelector('#sheetLibraryInput');
      if (input) {
        input.value = '';
        input.click();
      }
    };
    view.querySelector('#hideCaptureAnalyze').onclick = () => analyzeDirtyPages();
    view.querySelector('#hideCaptureLeave').onclick = () => {
      currentTab = 'home';
      viewStack = [];
      render();
    };
    view.querySelectorAll('[data-retake]').forEach(btn => {
      btn.onclick = () => openRapidCamera(btn.dataset.retake);
    });
    setPartner('더 찍을까, 아니면 여기까지 살펴볼까?', 'note');
  }

  async function analyzePage(page) {
    const blob = await dbGet(page.blobKey);
    if (!blob) throw new Error(`${page.displayOrder}번째 장의 임시 사진을 찾지 못했어요.`);
    if (!navigator.onLine) throw new Error('OCR 분석은 온라인 연결이 필요해요.');
    if (!runtimeApiKey) throw new Error('Gemini API Key가 필요해요.');

    const img = await normalizedImageBase64(blob);
    const seePrompt = `사진에 실제로 보이는 영어 단어와 한글 뜻만 행 순서대로 전사하세요. 원본에 없는 단어를 만들지 말고, 예문/힌트/정답 추측을 하지 마세요. 불확실하면 confidence를 low로 표시하세요. JSON만 출력: {"rows":[{"eng":"...","kor":"...","confidence":"high|medium|low"}]}`;
    const see = await gemini(seePrompt, img.b64, img.mime);
    const pairPrompt = `아래 SEE OCR 행만 사용해 영어 단어-한국어 뜻의 짝을 검증하세요. 원본에 없는 새 단어를 만들지 마세요. 헤더/번호/잡음은 제외하고 원래 순서를 유지하세요. 애매한 행은 low로 남기세요. JSON만 출력: {"rows":[{"eng":"...","kor":"...","confidence":"high|medium|low"}]}
SEE:
${JSON.stringify(see)}`;
    const paired = await gemini(pairPrompt);
    return (paired.rows || see.rows || []).filter(x => x.eng || x.kor).map((x, i) => {
      const confidence = x.confidence || 'medium';
      return {
        ...normalizeWord({
          id: `${page.pageId}-ocr-${Date.now()}-${i}`,
          eng: x.eng,
          kor: x.kor,
          confidence,
          needsReview: confidence === 'low',
          manuallyEdited: false
        }, i),
        sourcePageId: page.pageId,
        sourcePageOrder: page.displayOrder,
        reviewResolved: confidence !== 'low'
      };
    });
  }

  async function analyzeDirtyPages() {
    stopCamera();
    const session = ensureCaptureSession();
    if (!session.pages.length) return toast('먼저 한 장 이상 촬영해 주세요.');

    const dirtyIds = new Set(session.dirtyPageIds || session.pages.filter(p => p.dirty).map(p => p.pageId));
    const targets = session.pages.filter(p => dirtyIds.has(p.pageId));
    if (!targets.length && session.lastRows?.length) return renderBatchReview();

    const view = document.querySelector('#view');
    view.innerHTML = `
      <section class="card">
        <div class="hero-kicker"><span>BATCH ANALYZE</span><span>${targets.length}장</span></div>
        <h2>여기까지 분석하는 중</h2>
        <p id="hideBatchStage">촬영 세션은 그대로 유지돼요.</p>
        <div class="progress" style="margin-top:16px"><span id="hideBatchProgress" style="width:2%"></span></div>
      </section>`;

    const cleanRows = (session.lastRows || []).filter(r => !dirtyIds.has(r.sourcePageId));
    const newRows = [];
    const issues = [];
    const succeeded = [];

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];
      const stage = document.querySelector('#hideBatchStage');
      const bar = document.querySelector('#hideBatchProgress');
      if (stage) stage.textContent = `${page.displayOrder}번째 장 분석 중 · 기존 정상 결과는 유지해요.`;
      if (bar) bar.style.width = `${Math.max(5, Math.round((i / targets.length) * 100))}%`;
      try {
        const rows = await analyzePage(page);
        newRows.push(...rows);
        page.dirty = false;
        succeeded.push(page.pageId);
      } catch (e) {
        issues.push({ pageId: page.pageId, message: e.message || '분석 실패' });
      }
    }

    session.dirtyPageIds = (session.dirtyPageIds || []).filter(id => !succeeded.includes(id));
    session.lastRows = [...cleanRows, ...newRows].sort((a, b) => (a.sourcePageOrder || 0) - (b.sourcePageOrder || 0));
    session.analysisBatches.push({
      batchId: makeId('batch'),
      sourcePageIds: targets.map(p => p.pageId),
      succeededPageIds: succeeded,
      startedAt: nowISO(),
      completedAt: nowISO(),
      issues,
      rowCount: newRows.length
    });
    S.ocrDraft = { createdAt: nowISO(), captureSessionId: session.captureSessionId, rows: session.lastRows };
    persistCaptureSession(session);
    if (issues.length) toast(`${issues.length}장 분석이 남았어요. 해당 장만 다시 시도할 수 있어요.`);
    renderBatchReview();
  }

  function renderBatchReview() {
    const session = ensureCaptureSession();
    let data = (session.lastRows || []).map((row, i) => ({
      ...normalizeWord(row, i),
      sourcePageId: row.sourcePageId,
      sourcePageOrder: row.sourcePageOrder,
      reviewResolved: row.reviewResolved ?? !row.needsReview,
      manuallyEdited: !!row.manuallyEdited
    }));

    const view = document.querySelector('#view');
    view.innerHTML = `
      <section class="card">
        <div class="hero-kicker"><span>REVIEW BEFORE COMMIT</span><span>${data.length}개</span></div>
        <h2>단어 결과 확인</h2>
        <p>낮은 신뢰 항목은 직접 수정하거나 ‘이대로 확인’을 눌러야 저장할 수 있어요.</p>
        <div id="hideBatchRows" class="table" style="margin-top:12px"></div>
        <div class="hide-review-actions">
          <button id="hideReviewMore" class="btn secondary" type="button">촬영 더하기</button>
          <button id="hideReviewLibrary" class="btn secondary" type="button">앨범 추가</button>
          <button id="hideReviewAnalyze" class="btn secondary" type="button">변경 장 다시 분석</button>
          <button id="hideReviewCommit" class="btn primary" type="button">시험지 만들기</button>
        </div>
      </section>`;

    const rowsEl = view.querySelector('#hideBatchRows');
    const syncToSession = () => {
      session.lastRows = data.map(x => ({ ...x }));
      S.ocrDraft = { createdAt: nowISO(), captureSessionId: session.captureSessionId, rows: session.lastRows };
      persistCaptureSession(session);
    };

    const draw = () => {
      rowsEl.innerHTML = data.map((w, i) => `
        <div class="row hide-review-row" data-i="${i}">
          <div class="hide-page-no">${w.sourcePageOrder || '-'}</div>
          <input class="eng" value="${esc(w.eng)}" aria-label="${i + 1}번 영어 단어">
          <input class="kor" value="${esc(w.kor)}" aria-label="${i + 1}번 뜻">
          <span class="badge ${w.reviewResolved ? 'good' : 'weak'}">${w.reviewResolved ? '확인' : '확인 필요'}</span>
          ${w.reviewResolved ? '' : `<button class="hide-confirm-row" data-confirm="${i}" type="button">이대로 확인</button>`}
          <button class="row-delete" data-del="${i}" type="button" aria-label="${i + 1}번 행 삭제">×</button>
        </div>`).join('');

      rowsEl.querySelectorAll('.eng,.kor').forEach(input => {
        input.addEventListener('change', e => {
          const row = e.target.closest('[data-i]');
          const i = Number(row.dataset.i);
          data[i].eng = row.querySelector('.eng').value.trim();
          data[i].kor = row.querySelector('.kor').value.trim();
          data[i].needsReview = false;
          data[i].reviewResolved = true;
          data[i].manuallyEdited = true;
          data[i].confidence = 'manual';
          syncToSession();
          draw();
        });
      });

      rowsEl.querySelectorAll('[data-confirm]').forEach(btn => {
        btn.onclick = () => {
          const i = Number(btn.dataset.confirm);
          data[i].needsReview = false;
          data[i].reviewResolved = true;
          syncToSession();
          draw();
        };
      });

      rowsEl.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = () => {
          data.splice(Number(btn.dataset.del), 1);
          syncToSession();
          draw();
        };
      });
    };
    draw();

    view.querySelector('#hideReviewMore').onclick = () => openRapidCamera();
    view.querySelector('#hideReviewLibrary').onclick = () => {
      const input = document.querySelector('#sheetLibraryInput');
      if (input) {
        input.value = '';
        input.click();
      }
    };
    view.querySelector('#hideReviewAnalyze').onclick = () => analyzeDirtyPages();
    view.querySelector('#hideReviewCommit').onclick = () => {
      data = data.map((w, i) => {
        const row = rowsEl.querySelector(`[data-i="${i}"]`);
        return {
          ...w,
          eng: row?.querySelector('.eng')?.value.trim() ?? w.eng,
          kor: row?.querySelector('.kor')?.value.trim() ?? w.kor
        };
      }).filter(x => x.eng && x.kor);

      const unresolved = data.filter(x => x.needsReview || x.reviewResolved === false);
      if (unresolved.length) return toast(`확인 필요한 단어가 ${unresolved.length}개 남아 있어요.`);
      if (!data.length) return toast('단어와 뜻을 한 개 이상 확인해 주세요.');
      if (session.dirtyPageIds?.length) return toast('다시 찍은 장의 분석이 아직 남아 있어요.');

      const sheetId = `sheet-${Date.now()}`;
      const items = data.map((x, i) => ({
        ...normalizeWord({ ...x, needsReview: false }, i),
        sourcePageId: x.sourcePageId,
        sourcePageOrder: x.sourcePageOrder
      }));
      const newSheet = {
        sheetId,
        title: `${new Date().toLocaleDateString('ko-KR')} 숨은 단어`,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        testDate: '',
        sourceType: 'photo-batch',
        sourceCount: session.pages.length,
        status: 'READY',
        caseMastery: 0,
        items,
        recognitionMeta: {
          reviewedAt: nowISO(),
          count: items.length,
          captureSessionId: session.captureSessionId,
          analysisBatchIds: session.analysisBatches.map(b => b.batchId)
        }
      };

      S.sheets.unshift(newSheet);
      S.activeSheetId = sheetId;
      S.ocrDraft = null;
      S.learning = clone(DEFAULT_STATE.learning);
      S.codeRed = clone(DEFAULT_STATE.codeRed);
      session.status = 'COMMITTED';
      session.committedSheetId = sheetId;
      persistCaptureSession(session);
      S[CAPTURE_STATE_KEY] = null;
      save();
      toast('숨은 단어 준비 완료');
      currentTab = 'study';
      viewStack = [];
      render();
    };
    setPartner('애매한 단어만 골라서 같이 확인해보자.', 'note');
  }

  function interceptLegacyCapture() {
    document.addEventListener('click', event => {
      const id = event.target?.id;
      if (['photoFirst', 'homeCamera', 'cameraSheet'].includes(id)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openRapidCamera();
      }
      if (id === 'exportData') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const copy = clone(S);
        const blob = new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `HIDE_SEEK_DATA_${today()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    }, true);

    document.addEventListener('change', event => {
      if (event.target?.id === 'sheetCameraInput') {
        event.stopPropagation();
        event.stopImmediatePropagation();
        const files = event.target.files;
        event.target.value = '';
        addFiles(files, 'camera-fallback');
      }
      if (event.target?.id === 'sheetLibraryInput') {
        event.stopPropagation();
        event.stopImmediatePropagation();
        const files = event.target.files;
        event.target.value = '';
        addFiles(files, 'library');
      }
    }, true);
  }

  function normalizeBrandText(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p || p.closest('script,style,textarea,input,[contenteditable="true"]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      let text = node.nodeValue;
      for (const [pattern, replacement] of legacyBrandReplacements) text = text.replace(pattern, replacement);
      if (text !== node.nodeValue) node.nodeValue = text;
    });
  }

  function startBrandObserver() {
    normalizeBrandText();
    if (brandObserver) brandObserver.disconnect();
    brandObserver = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            for (const [pattern, replacement] of legacyBrandReplacements) text = text.replace(pattern, replacement);
            if (text !== node.nodeValue) node.nodeValue = text;
          } else if (node.nodeType === Node.ELEMENT_NODE) normalizeBrandText(node);
        });
      }
    });
    brandObserver.observe(document.body, { childList: true, subtree: true });
  }

  function phoneOrientationGuard() {
    let guard = document.querySelector('#hidePhoneOrientationGuard');
    const isPhone = Math.min(window.innerWidth, window.innerHeight) < 600;
    const landscape = window.innerWidth > window.innerHeight;
    if (isPhone && landscape) {
      if (!guard) {
        guard = document.createElement('div');
        guard.id = 'hidePhoneOrientationGuard';
        guard.className = 'hide-phone-orientation-guard';
        guard.innerHTML = '<div><b>휴대폰은 세로로 돌려주세요.</b><span>태블릿은 가로·세로 모두 사용할 수 있어요.</span></div>';
        document.body.appendChild(guard);
      }
    } else if (guard) guard.remove();
  }

  function bootHideRuntime() {
    document.documentElement.dataset.hideRuntime = HIDE_RUNTIME_VERSION;
    migrateLegacyCaptureSession();
    document.title = 'Hide & Seek';
    document.querySelector('#sheetLibraryInput')?.setAttribute('multiple', '');
    interceptLegacyCapture();
    startBrandObserver();
    phoneOrientationGuard();
    window.addEventListener('resize', phoneOrientationGuard);
    window.addEventListener('orientationchange', phoneOrientationGuard);

    const session = currentSession();
    if (session && session.status === 'CAPTURING' && session.pages?.length && !document.querySelector('.hide-resume-chip')) {
      const chip = document.createElement('button');
      chip.className = 'hide-resume-chip';
      chip.type = 'button';
      chip.textContent = '촬영 이어가기';
      chip.onclick = renderCaptureHub;
      document.body.appendChild(chip);
    }
  }

  window.HideCaptureRuntime = Object.freeze({
    version: HIDE_RUNTIME_VERSION,
    openRapidCamera,
    renderCaptureHub,
    analyzeDirtyPages,
    migrateLegacyState: () => {
      migrateLegacyCaptureSession();
      const session = currentSession();
      return session ? JSON.parse(JSON.stringify(session)) : null;
    },
    currentSession: () => {
      const session = currentSession();
      return session ? JSON.parse(JSON.stringify(session)) : null;
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootHideRuntime, { once: true });
  else bootHideRuntime();
})();