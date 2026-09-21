# HIDE RUNTIME V2 REWRITE — C2S CLOSURE — 2026-09-21

Status: REWRITE ACTIVE / HANDOFF READY / DO NOT MERGE / DO NOT DEPLOY
Authority: latest TAKY + TKY-PRODUCT-001

## 1. Core decision
- V1 monolithic execution architecture is not the growth path.
- Runtime V2 is the active implementation direction.
- Preserve validated domain/evidence/OCR/Ready contracts; replace defective execution ownership.
- V1 remains reference/rollback only.

## 2. Current V2 product architecture
Owned V2 modules:
- app-store
- mission-service
- learning-session
- session-service
- memory-engine
- trail-engine
- capture-store / capture-controller
- Ready bridge
- router
- mobile shell
- PWA/update owner
- child-facing UI controller
- non-destructive V1 migration

V2 does not load legacy `app.js`, `hide-runtime.js`, or `hide-bridge.js`.

## 3. Current user journey
NEW:
`단어 만나기 → 첫 찾기 → 뜻 단서 → 언어별 연결 → 마지막 찾기 → [실패 시 다시 만나기 → 다시 찾기] → 탐험 완료`

REVIEW:
- skips initial memorization;
- Ready Planner may scope the session to explicit lexical IDs;
- subset completion completes the Ready specialist task but does not falsely complete unrelated Hide mission items.

## 4. Memory model ownership
Hide owns:
- objective recall evidence
- verified vs recall distinction
- Memory Strength
- weakness signature
- Memory Ladder
- advisory nextReviewPriority
- Trail Mastery for the current session/mission

Ready owns:
- review policy / Learning Engine interpretation
- dated Planner scheduling
- carry-over/reschedule

Hard separation:
- `Trail Mastery != Memory Strength`
- same-day Seek Again recovery may raise Trail Mastery but remains `IMMEDIATE_ONLY` for long-term memory.
- `nextReviewPriority` is advisory, never a date.

## 5. Capture / OCR
Implemented:
- shared family OCR adapter reuse
- local-first capture assets in V2 IndexedDB
- persistent capture/review session
- editable OCR review
- confidence/warning/provider/model/version provenance
- multi-page partial-success retention
- retry failed pages only
- successful pages are not re-sent on retry

Still OPEN:
- representative real printed sheets against current live OCR provider
- physical camera permission/device behavior
- true real-provider accuracy calibration

## 6. PWA/mobile
Implemented/browser-verified:
- V2-owned manifest/service worker/release/update controller
- V2-only cache namespace
- offline shell reopen
- update safe-point blocking during active learning/capture review
- 390x844 overflow/touch-target checks
- reduced-height focused input/textarea checks
- visualViewport owner

Still OPEN:
- physical iPhone/Android install
- OS keyboard behavior
- camera permission
- background/resume/storage pressure
- DEVICE_VERIFIED

## 7. Ready integration
Hide V2 producer:
- `HIDE_SPECIALIST_RESULT_V2`
- mission semantics, not legacy sheet aliases
- task/session/lap correlation
- Trail Mastery 0..100 current-readiness metric
- Memory Summary remains specialist advisory

Ready consumer branch:
- `integration/hide-memory-review-roundtrip-v01`
- V2 return event normalizer
- stale historical Hide URL fails closed for Planner-directed V2 review
- live current-candidate hosted roundtrip remains OPEN.

## 8. UI/UX
Current code has moved from developer-shell UI toward child-facing exploration UI:
- quest-oriented home
- mission map
- memory ladder / word trail
- child-facing stage labels
- internal V2/REWRITE/monolith jargon removed
- Hide & Seek remains installed/user-facing identity

Important: final visual-design polish is NOT closed.
The next conversation should continue UI/UX surgery against `Hide_Seek_UI_MASTER_LOGIC_REV_04.md`, but must first restore exact-head CI if the latest documentation/UI gate run is not green.

## 9. Frozen candidate
Current governed frozen candidate:
- branch: `frozen/hide-v2-candidate-2026-09-21-02`
- SHA: `42f7627b405d1026a0339fb5ed11b563d65d8003`
- Validate Hide Runtime V2 #102: SUCCESS
- Validate Hide & Seek #556: SUCCESS

Candidate 01 is superseded.

The rewrite branch has advanced beyond candidate 02 with child-facing UI work. Candidate 02 therefore remains the last fully frozen validated deployment candidate until a newer exact-head candidate is deliberately frozen.

## 10. External deployment gate
Authoritative Netlify binding:
- site: `hide-seek-taky`
- siteId: `55aa69e3-1da8-4e4f-9b83-23de14b8fc87`

Blocker:
`EXTERNAL_DEPLOY_SOURCE_REF_UNSPECIFIABLE`

The available Netlify deploy action accepts siteId only and cannot specify exact branch/SHA/source package. Do not consume the one external deploy budget because that cannot prove deployment of the frozen candidate.

## 11. Product completion — locked reporting
Current last closed product-level estimate:
- PRODUCT_COMPLETION: ~62%
- CODED: ~79%
- CI_VERIFIED: ~75%
- Browser RUNTIME_VERIFIED: ~70%
- DEVICE_VERIFIED: 0%
- RELEASE_VERIFIED: 0%

Do not raise this because of docs/tests alone.
Do not mix reusable V1/domain asset maturity into V2 product completion.

## 12. Current head / validation boundary
At closure start, rewrite branch HEAD was `6b28654590894d6d6f7c1b7fabd5d963ab0cf258`.
Its immediately observed runs #110 / #564 failed at the architecture gate because UI copy had changed while the gate was still checking superseded labels.
The current validator source has since been aligned to the new child-facing terms (`기억 사다리 / 단어 기록 / 다시 볼 순서 / 탐험 미션`).
Therefore the new-chat startup MUST:
1. live-refresh branch HEAD;
2. verify exact current validator source;
3. verify exact-head V2 + full Hide CI;
4. if not green, repair only the gate/product mismatch before feature growth.

## 13. No-silent-loss closure
Recovered/locked material:
- rewrite decision
- product-completion correction
- mission lifecycle
- OCR review/recovery
- Memory Ladder
- Thinking Trail
- PWA/offline
- mobile browser resilience
- Ready contract
- Seek Again recovery
- Trail Mastery separation
- child-facing UI direction
- frozen candidate 02
- Netlify exact-ref blocker

UNMAPPED_MATERIAL = 0 within this rewrite scope.
SILENT_LOSS = 0 within this rewrite scope.
FALSE_CONVERGENCE = 0: live deploy/device/real-provider claims remain OPEN.
