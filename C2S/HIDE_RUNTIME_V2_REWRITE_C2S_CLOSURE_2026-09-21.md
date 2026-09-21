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
Child-facing continuity is now browser-verified across home, mission map, learning journey, completion, Memory Ladder/memory detail, and OCR review/recovery. Exploration Crew presentation and reduced-motion-safe completion motion are implemented. The next conversation should continue final art-direction/device-ready polish against `Hide_Seek_UI_MASTER_LOGIC_REV_04.md`, but must first restore exact-head CI if the latest documentation/UI gate run is not green.

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
- PRODUCT_COMPLETION: ~68%
- CODED: ~84%
- CI_VERIFIED: ~81%
- Browser RUNTIME_VERIFIED: ~77%
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


## 14. 2026-09-22 child-facing continuity correction
- Exploration Crew presentation is no longer only a skeleton: the V2 adapter/fallback and answer-safe presentation are browser-runtime verified.
- Hide consumes crew presentation only; Snap & Pop remains owner of crew identity/personality/intervention grammar.
- Child-facing surfaces now form one continuous product language:
  `홈 → 오늘의 탐험 지도 → 6단계 단어 탐험 → 탐험 완료 → 기억 사다리/기억 길`.
- Memory Ladder UI semantics were corrected to the actual Memory Engine. UI-only 80/45 thresholds were removed.
- `primaryReason`, `needsUnassistedRecall`, and engine-owned `memoryStrength < 60` advisory criteria now drive child-facing path labels.
- Technical memory diagnostics and OCR provider/warning codes remain inspectable but are not the primary child surface.
- OCR review/recovery preserves edit/exclude/provenance and failed-page-only retry while using child-readable setup/recovery copy.
- Completion celebration motion is browser-verified and fully disabled under `prefers-reduced-motion: reduce`.
- Exact pre-document code HEAD: `6a3c31e70c2e30aa770e08733162f1eaad2cf7dc`.
  - Validate Hide Runtime V2 #173: SUCCESS.
  - Validate Hide & Seek #627: SUCCESS.
- Locked reporting remains PRODUCT_COMPLETION ~66%, CODED ~82%, CI_VERIFIED ~79%, Browser RUNTIME_VERIFIED ~75%, DEVICE_VERIFIED 0%, RELEASE_VERIFIED 0%.
- Remaining OPEN claims: representative live OCR prints/provider, physical camera/device/keyboard/PWA lifecycle, current frozen Ready↔Hide hosted roundtrip, final art direction, exact-ref release/deploy.


## 15. 2026-09-22 language-domain runtime closure
- Hanja SOUND FIND now has dedicated Runtime V2 browser proof using canonical verified `soundEvidence`.
- A typed sound answer records `SOUND + RECALL`, objective verification/recall, and the source-linked evidence reference.
- Korean verified EVIDENCE TRAIL is now present in Runtime V2 rather than existing only as a V1/reference rule:
  - activation is fail-closed through `HideLanguageModel.normalizeContextEvidence(..., 'KOREAN')`;
  - the learner explicitly chooses among verified evidence candidates;
  - the event records `EVIDENCE + MEANING` and objective verification;
  - evidence selection does not earn objective CONTEXT recall and does not inflate recall score;
  - RESPONSE TRAIL remains a separate production event before FINAL SEEK.
- The child-facing exploration art-direction pass has browser checks at 390px width. This is browser evidence only, not physical-device visual QA.
- Exact pre-document code HEAD `3e63d5250d7f636046b50d2e164e028d925ffde9`:
  - Validate Hide Runtime V2 #182 — SUCCESS.
  - Validate Hide & Seek #636 — SUCCESS.
- Conservative reporting after this material user-reachable increment:
  - PRODUCT_COMPLETION ~67%
  - CODED ~83%
  - CI_VERIFIED ~80%
  - Browser RUNTIME_VERIFIED ~76%
  - DEVICE_VERIFIED 0%
  - RELEASE_VERIFIED 0%.
- Still OPEN: representative live-provider OCR, physical camera/device/OS keyboard/PWA lifecycle, current frozen Ready↔Hide hosted roundtrip, physical-device visual QA, exact-ref release/deploy.


## 16. 2026-09-22 assisted recall / OCR provenance closure
- FINAL SEEK assistance is explicit evidence, not hidden success inflation.
- Correct FINAL SEEK after support is `assisted=true`, `objectiveRecall=false`, and cannot complete the item as an unassisted recall.
- The learner must pass through Seek Again; same-day unassisted recovery remains `IMMEDIATE_ONLY` until later spaced evidence exists.
- OCR review-to-mission commit preserves source page/row/confidence/provider/model/analysisVersion.
- Duplicate lexical OCR rows require explicit review merge; merged mission items preserve every source occurrence under `source.occurrences`.
- Editing a merged row invalidates the grouping instead of silently carrying a stale merge.
- Exact code HEAD `771e4888af4ff3121347d93ca4184f63768e94f1` passed V2 #196 and full Hide #654.
- Locked reporting: PRODUCT ~69%, CODED ~85%, CI ~82%, Browser Runtime ~78%, Device 0%, Release 0%.


## 17. 2026-09-22 local-first OCR review-draft continuity
- Persistent review now includes the learner/parent's edited review draft, not only OCR source rows.
- `captureSession.lastRows` preserves raw normalized OCR output; `captureSession.reviewDraft` preserves editable human review state.
- Token/meaning corrections, exclusions, and explicit duplicate merge decisions survive reload and resume.
- New capture/re-analysis clears stale reviewDraft before a new review begins.
- Exact code HEAD `75dd5431625ac7b37b857df9aeb346487176c4ab` passed V2 #213 / full Hide #671.
- Memory Ladder search/state filters and mission map status filters are also browser-verified; they reuse existing Memory Engine/mission status semantics and do not create new policy.
- Locked reporting remains PRODUCT ~69%, CODED ~85%, CI ~82%, Browser Runtime ~78%, Device 0%, Release 0%.


## 18. 2026-09-22 FIRST FIND miss recovery
- FIRST FIND miss now routes through an explicit, child-facing relearn exposure rather than silently advancing.
- Wrong retrieval evidence remains wrong retrieval evidence; seeing the answer afterward is stored separately as assisted exposure and cannot inflate recall.
- `FIRST_FIND_RELEARN` is an internal recovery state mapped to the canonical FIRST FIND journey position.
- Exact code HEAD `506029061ac9e2873595545758f1b737e9f1aa4e` passed V2 #220 / full Hide #678.
- Locked reporting remains PRODUCT ~69%, CODED ~85%, CI ~82%, Browser Runtime ~78%, Device 0%, Release 0%.


## 2026-09-22 First Find explicit-failure delta
- Exact code HEAD `9261d6c07dbd37df1e9132bf6d15799072338983` passed V2 #227 / full Hide #685.
- FIRST FIND supports correct typed recall, objectively checked wrong typed recall, and explicit child `아직 안 떠올라` PASS.
- UNSURE is a recall attempt but not an objectively verified answer: `objectiveRecall=true`, `objectiveVerified=false`.
- Wrong/unsure both route into assisted non-recall relearn exposure before MEANING.
- Current locked reporting: PRODUCT ~69%, CODED ~85%, CI ~82%, Browser Runtime ~78%, Device 0%, Release 0%.


## 19. 2026-09-22 HIDDEN WORDS conditional reinforcement
- HIDDEN WORDS is restored in Runtime V2 as a conditional reinforcement nested in the canonical learning journey, not as a new policy owner.
- Entry authority is the V2 Memory Engine `primaryReason`; stable words bypass reinforcement.
- Reinforcement recall is objective retrieval; a failed reinforcement may show one relearn exposure, which remains assisted/non-recall.
- Memory Engine correction: ordinary memorization/relearn exposure no longer contributes to `hintDependency`; only actual ASSISTANCE/hint-level evidence does.
- Exact code HEAD `b2577641cbbc3703eb84e7ab583d6d741ff22eee` passed V2 #236 / full Hide #694.
- Locked reporting: PRODUCT ~70%, CODED ~86%, CI ~83%, Browser Runtime ~79%, Device 0%, Release 0%.


## 20. 2026-09-22 reason-specific HIDDEN WORDS
- HIDDEN WORDS activity now follows the existing Memory Engine `primaryReason` rather than one generic retry.
- Supported bounded modes: confusion→meaning, orthographic→English shape scaffold, verified sound→sound recall, otherwise unassisted token recall.
- Stable words still bypass HIDDEN WORDS.
- Exact code HEAD `f19dcd84f650ca4e80d970f36a911b4694d9ecd5` passed V2 #243 / full Hide #701.
- Locked reporting: PRODUCT ~71%, CODED ~87%, CI ~84%, Browser Runtime ~80%, Device 0%, Release 0%.


## 21. 2026-09-22 bidirectional MEANING CLUE
- MEANING CLUE now supports session-scoped bidirectional recognition while retaining direct typed recall for peerless sessions.
- Recognition evidence is objectively checkable but is not recall evidence.
- Wrong recognition is recorded as `MISMATCH` with the confused token/meaning pair and feeds Memory Engine confusion.
- Confusion can therefore route into the existing HIDDEN WORDS meaning reinforcement without introducing a separate confusion policy.
- Ready review scope is preserved: comparison peers are selected only from the active `session.queue`.
- Initial implementation incorrectly considered unrelated mission items outside a Ready-directed queue; exact-head CI caught the regression and the queue-scoped correction is now green.
- Exact code HEAD `e15e86fdd7053903c1093251d13bdc31398a8bea` passed V2 #251 / full Hide #709.
- Locked reporting: PRODUCT ~72%, CODED ~88%, CI ~85%, Browser Runtime ~81%, Device 0%, Release 0%.


## 22. 2026-09-22 staged HIDDEN WORDS assistance
- HIDDEN WORDS now uses a bounded escalation rather than jumping from first miss directly to full answer exposure.
- Safe path: reinforcement → one minimal clue when available → assisted retry → full relearn only if still needed → FINAL SEEK.
- TOKEN mode may use the existing English shape scaffold; MEANING mode may use existing example/context. No unsupported clue is invented for SOUND or already-assisted SHAPE paths.
- Assisted retry success remains objectively checkable but not objective recall; FINAL SEEK remains the unassisted proof.
- SHAPE reinforcement truth boundary corrected: visible shape cue means assisted/non-recall even when the typed answer is correct.
- Direct typed MEANING reinforcement remains recall.
- Exact code HEAD `28a70fc7ff3e1f89d1bfaba6b59acf47af5f1557` passed V2 #261 / full Hide #719.
- Locked reporting: PRODUCT ~73%, CODED ~89%, CI ~86%, Browser Runtime ~82%, Device 0%, Release 0%.


## 23. 2026-09-22 FINAL SEEK reconstruction recovery
- FINAL SEEK first attempt remains unassisted.
- An unassisted English miss may use one shape-based reconstruction before any full answer reveal.
- Reconstruction is assisted, objectively verifiable, non-recall evidence.
- Reconstruction success goes directly to SEEK AGAIN for unassisted proof; reconstruction failure goes through relearn exposure before SEEK AGAIN.
- If semantic FINAL SEEK support was already used, do not stack reconstruction support; fail closed to relearn.
- Exact code HEAD `47cf0c0391c13311cb3faa3c33cf305a2c8e5c63` passed V2 #268 / full Hide #726.
- Locked reporting: PRODUCT ~74%, CODED ~90%, CI ~87%, Browser Runtime ~83%, Device 0%, Release 0%.


## 24. 2026-09-22 Hanja SOUND miss recovery
- Hanja SOUND FIND now has an explicit miss-recovery path using only verified source-linked `soundEvidence`.
- Wrong SOUND recall → assisted/non-recall reading re-exposure → re-hide → SOUND-specific HIDDEN WORDS reinforcement.
- Immediate activity specificity is preserved even when generic Memory Engine recovery is the top summary reason; the session handoff changes only the current reinforcement activity, not Memory Engine scores or Ready review/scheduling ownership.
- First implementation exposed an omitted public action export; exact-head browser CI caught it and the export was repaired.
- Exact code HEAD `ad8872a9305a121b783142f00e4a8d2c22e6ad1c` passed V2 #284 / full Hide #742.
- Locked reporting: PRODUCT ~75%, CODED ~91%, CI ~88%, Browser Runtime ~84%, Device 0%, Release 0%.


## 25. 2026-09-22 active THINKING TRAIL inference loop
- Runtime V2 MEMORIZE now preserves the canonical first-seen inference loop instead of only rendering the answer structure.
- Flow: prediction → clue/confidence self-report → reveal → MATCH/NEAR/MISS self-comparison.
- Comparison is `LEARNER_SELF_REPORT`, `objectiveVerified=false`, `objectiveRecall=false`, and has no recall-score impact.
- Existing `summarizeInferenceSkill()` now consumes V2 events; only ESTABLISHED and plan-applicable clue tendencies surface as optional later guidance.
- This does not create a new learning-policy owner or override the learner's current clue choice.
- Exact code HEAD `42a524f6474db74896fc507e7a61724ba99f48ee` passed V2 #292 / full Hide #750.
- Locked reporting: PRODUCT ~76%, CODED ~92%, CI ~89%, Browser Runtime ~85%, Device 0%, Release 0%.


## 26. 2026-09-22 bounded FIRST FIND assistance
- FIRST FIND wrong/UNSURE may use one safe English shape cue before full relearn exposure.
- Initial retrieval evidence remains unassisted recall evidence.
- Shape-assisted retry is `ASSISTED_RECONSTRUCTION`, objectively verified, non-recall, and has no recall-score impact.
- Assisted success moves to MEANING; assisted failure moves to the existing assisted/non-recall full relearn exposure.
- Unsupported domains fail closed; no Korean/Hanja shape cue is fabricated.
- Exact code HEAD `56452289a112d338e2e9abd818a8acb9590794ee` passed V2 #300 / full Hide #758.
- Locked reporting: PRODUCT ~77%, CODED ~93%, CI ~90%, Browser Runtime ~86%, Device 0%, Release 0%.


## 25. 2026-09-22 active inference THINKING TRAIL
- MEMORIZE now preserves an active inference loop: prediction → clue/confidence self-report → reveal → MATCH/NEAR/MISS self-comparison.
- These inference records are transfer-skill/self-report evidence only and never objective recall.
- Accumulated `FIRST_SEEN_PREDICTION` events are summarized through the existing inference-skill model.
- Only established clue tendencies are surfaced as optional future guidance; the child can choose another clue.
- Exact HEAD `2714be8bd84985c7e3dde763aee270723486c1be` passed V2 #304 / full Hide #762.
- Locked reporting: PRODUCT ~76%, CODED ~92%, CI ~89%, Browser Runtime ~85%, Device 0%, Release 0%.


## 26. 2026-09-22 multilingual FIRST FIND recovery
- FIRST FIND bounded assistance is now multilingual but evidence-gated.
- English uses deterministic shape scaffolding; Korean requires a verified meaningMap; Hanja requires verified soundEvidence.
- Unverified/missing multilingual support fails closed to full relearn rather than inventing a clue.
- Assisted success remains non-recall and cannot inflate memory strength.
- Exact HEAD `950631cd774d85a1227c51235d3168f9bb013146` passed V2 #311 / full Hide #769.
- Locked reporting: PRODUCT ~77%, CODED ~93%, CI ~90%, Browser Runtime ~86%, Device 0%, Release 0%.
