/* TAKY source-bound environment HOME. This render changes visual composition
 * only; routes and permission/learning contracts remain in app.js.
 * The approved PNG itself is loaded unchanged by approved-mossfall.css. */
(() => {
  'use strict';
  function render({m,resumable,activeCount,memory,reviewReady,capture,memoryMessage,missionStatusLabel,esc}){
    // Home is a single continuous world. Every live hotspot is anchored to a
    // visible landmark of the exact approved painting; none is a menu card.
    // The four study stage names are intentionally NOT fake clickable modes.
    const mainSpot=m?`<button class="mossfall-spot mossfall-spot--bridge quest-main-action" id="v2Start" type="button" data-world-anchor="bridge" aria-label="${resumable?'탐험 이어가기':'탐험 시작'}">
        <span class="mossfall-spot__beacon" aria-hidden="true"></span>
        <span class="mossfall-spot__copy"><strong>${resumable?'탐험 이어가기':'탐험 시작'}</strong><small>BRIDGE · ${m.items.length} WORDS</small></span>
      </button>`:`<button class="mossfall-spot mossfall-spot--bridge quest-main-action" id="v2BeginWithMission" type="button" data-world-anchor="bridge" aria-label="탐험 미션 고르기">
        <span class="mossfall-spot__beacon" aria-hidden="true"></span>
        <span class="mossfall-spot__copy"><strong>탐험 미션 고르기</strong><small>BRIDGE · FIRST STEP</small></span>
      </button>`;
    return `
      <section class="mossfall-world" aria-label="Hide & Seek 숲과 폭포 탐험 홈">
        <div class="mossfall-intro">
          <span class="mossfall-intro__overline">HIDE & SEEK <span aria-hidden="true">·</span> THE HIDDEN TRAIL</span>
          <h1>${m?esc(m.title):'단어가 숨어 있는 숲'}</h1>
          <p>${m?`${m.items.length}개 단어 · ${missionStatusLabel(m.status)}`:'숙제를 확보하면 탐험 길이 열려요.'}</p>
          ${!m?'<small class="mossfall-intro__state">새 탐험 준비</small>':''}
        </div>
        <nav class="mossfall-landmarks" aria-label="장면 속 탐험 진입점">
          ${mainSpot}
          <button class="mossfall-spot mossfall-spot--mission" id="v2MissionList" type="button" data-world-anchor="upper-path" aria-label="탐험 미션">
            <span class="mossfall-spot__beacon" aria-hidden="true"></span><span class="mossfall-spot__copy"><strong>탐험 미션</strong><small>${activeCount}개 준비됨</small></span>
          </button>
          <button class="mossfall-spot mossfall-spot--camera" id="v2Camera" type="button" data-world-anchor="wooden-steps" aria-label="카메라 촬영">
            <span class="mossfall-spot__beacon" aria-hidden="true"></span><span class="mossfall-spot__copy"><strong>카메라 촬영</strong><small>PHOTO · 숙제 확보</small></span>
          </button>
          <button class="mossfall-spot mossfall-spot--library" id="v2Library" type="button" data-world-anchor="lower-steps" aria-label="사진에서 가져오기">
            <span class="mossfall-spot__beacon" aria-hidden="true"></span><span class="mossfall-spot__copy"><strong>사진에서 가져오기</strong><small>LIBRARY</small></span>
          </button>
          <button class="mossfall-spot mossfall-spot--record" id="v2Records" type="button" data-world-anchor="falling-water" aria-label="기억 사다리">
            <span class="mossfall-spot__beacon" aria-hidden="true"></span><span class="mossfall-spot__copy"><strong>기억 사다리</strong><small>${memory.total}개 기록</small></span>
          </button>
          <button class="mossfall-spot mossfall-spot--ocr" id="v2OcrImport" type="button" data-world-anchor="stream-bank" aria-label="OCR 결과 검토">
            <span class="mossfall-spot__beacon" aria-hidden="true"></span><span class="mossfall-spot__copy"><strong>OCR 결과 검토</strong><small>SOURCE REVIEW</small></span>
          </button>
        </nav>
        ${reviewReady?`<aside class="mossfall-resume"><p>확인하던 단어가 남아 있어요</p><button class="mossfall-return-trail" id="v2ResumeReview" type="button" aria-label="이어서 확인">이어서 확인 <span aria-hidden="true">›</span></button></aside>`:''}
        <p class="mossfall-world__footnote" aria-label="현재 탐험 상태">${esc(memoryMessage)}</p>
      </section>`;

  }
  globalThis.HideMossfallWorld=Object.freeze({render});
})();
