# Hide & Seek Runtime V2 — New Chat Start

Date: 2026-09-22
Governance: latest TAKY
Repository: `hns140412-glitch/Hide-Seek`
Branch: `rewrite/hide-runtime-v2-2026-09-21`

## Start prompt

최신 TAKY 기준으로 Hide & Seek Runtime V2 대수술을 재개해.

GitHub `hns140412-glitch/Hide-Seek`의 `rewrite/hide-runtime-v2-2026-09-21` 브랜치를 먼저 live refresh하고, 아래 문서를 순서대로 읽어 현재 상태를 복원해.

1. `C2S/HIDE_RUNTIME_V2_REWRITE_C2S_CLOSURE_2026-09-21.md`
2. `C2S/HIDE_RUNTIME_V2_REWRITE_ATOMS_2026-09-21.json`
3. `C2S/HIDE_RUNTIME_V2_PRODUCT_COMPLETION_MATRIX_2026-09-21.md`
4. `C2S/HIDE_RUNTIME_V2_EXTERNAL_RESOURCE_GATE_2026-09-21.md`
5. `HANDOFF/HIDE_SEEK_HANDOFF_2026-09-21_LATEST.md`
6. `Hide_Seek_UI_MASTER_LOGIC_REV_04.md`

마지막 검증된 코드 checkpoint는 `322c804ab7abe2ec43bc47f91d037774d7f254ed`이며,
- Validate Hide Runtime V2 #392 — SUCCESS
- Validate Hide & Seek #850 — SUCCESS

단, 위 checkpoint를 현재 HEAD라고 가정하지 말고 반드시 branch를 live refresh한 뒤 최신 exact HEAD의 V2/full-Hide CI부터 확인해.
red면 새 기능을 추가하지 말고 현재 regression만 원인 분류 → 최소 수정 → exact-head green까지 닫아.
green이면 이미 닫힌 child-journey 기능을 재작성하지 말고 remaining gate classification 기준으로 다음 실제 GAP을 선택해.

## Locked current reporting
- PRODUCT_COMPLETION ~81%
- CODED ~97%
- CI_VERIFIED ~94%
- BROWSER_RUNTIME_VERIFIED ~90%
- DEVICE_VERIFIED 0%
- RELEASE_VERIFIED 0%

문서/테스트/CSS만 추가했다고 구현율을 올리지 마.
Device/Release는 실제 증거 없이는 절대 올리지 마.

## Runtime V2 locked architecture
- V2 active path only.
- V1 root `app.js`, `hide-runtime.js`, `hide-bridge.js`는 reference/rollback only. 기능 추가 금지.
- canonical child journey는 유지:
  `단어 만나기 → 첫 찾기 → 뜻 단서 → 언어별 연결 → 마지막 찾기 → [필요 시 다시 만나기/다시 찾기] → 탐험 완료`.
- internal recovery state는 canonical journey step을 늘리는 정책 엔진이 아니다.
- Hide owns objective recall evidence / Memory Strength / weakness signature / Trail Mastery / advisory nextReviewPriority.
- Ready owns review policy, dated Planner scheduling, carry-over/reschedule.
- `Trail Mastery != Memory Strength`.
- same-day recovery는 `IMMEDIATE_ONLY`; long-term spacing으로 승격 금지.
- assisted exposure/reconstruction/support 성공은 objective recall로 세지 않는다.

## Current closed internal capability highlights
- OCR local-first capture/review with editable draft persistence.
- OCR provenance preservation and explicit duplicate merge with source occurrences.
- First Find wrong/unsure recovery + bounded safe assistance.
- English/Korean/Hanja evidence-gated First Find assistance.
- bidirectional Meaning Clue + mismatch comparison + bounded direct-meaning recovery.
- language-specific CONNECTION / RESPONSE / SOUND paths with truth boundaries.
- Memory Engine conditional and reason-specific HIDDEN WORDS.
- staged HIDDEN WORDS assistance.
- Final Seek assisted reconstruction + Seek Again unassisted proof.
- multilingual Final Seek reconstruction.
- bounded Seek Again assistance without changing IMMEDIATE_ONLY rule.
- Thinking Trail prediction → reveal → MATCH/NEAR/MISS self-comparison and established optional clue reuse.
- Korean expression human-review candidate handoff without semantic auto-scoring.
- Memory Ladder search/filter/detail and safe JSON/CSV export.
- Mission map filters and atomic bulk archive/delete with active-session protection.
- 390×844 browser/mobile behavior, offline/PWA/update safe-point, completion motion/reduced-motion browser evidence.

## Major remaining gates — do not fake with more internal tests
1. Representative real printed-sheet OCR + current provider calibration.
2. Physical-device camera permission / touch / keyboard / PWA lifecycle / visual QA.
3. Frozen current Ready↔Hide browser roundtrip with exact source-ref proof.
4. Live Snap Exploration Crew provider roundtrip.
5. Exact-source release proof + HUMAN APPROVAL.

## External-resource rules
- Netlify/siteId-only deploy 금지.
- exact frozen source SHA/ref를 선택·증명할 수 없으면 deploy 금지.
- main merge / production / release 금지 until gate is satisfied.
- 사용자를 테스터/디버거로 쓰지 마.

## Secondary polish
가능하지만 major blocker를 닫았다고 보고하면 안 됨:
- custom mission sorting
- large-history UX/export stress
- broader legacy migration samples
- small visual polish

## C2S state
- UNMAPPED_MATERIAL = 0
- SILENT_LOSS = 0
- FALSE_CONVERGENCE = 0
- C2S_COMPILE_CLOSED = true

새 대화에서는 첫 답변부터 항상:
1. live HEAD
2. exact-head CI 상태
3. 현재 작업
4. 남은 major gates
5. 전체 구현율
을 같이 보고해.

배포/Netlify/main merge 없이 branch-only로 계속 진행해.
