# HIDE & SEEK RUNTIME V2 — PRODUCT COMPLETION MATRIX

Date: 2026-09-21
Branch: rewrite/hide-runtime-v2-2026-09-21
Status: REWRITE IN PROGRESS / DRAFT / DO NOT MERGE / DO NOT DEPLOY

## TAKY product-integrity basis

- V1 reusable asset maturity and V2 product completion are separate.
- CI/documentation/contracts do not directly raise product completion.
- DEVICE_VERIFIED remains 0 until physical-device evidence exists.
- Fixture OCR/browser evidence does not equal representative real-print completion.
- V1 remains reference/rollback; V2 is the replacement execution architecture.

## Current matrix

| Product area | Status | User path reachable | Representative input | Evidence | Known gaps |
|---|---|---:|---:|---|---|
| V2 app bootstrap/store/router | RUNTIME_VERIFIED | yes | N/A | V2 CI | no release/PWA cutover |
| V1 non-destructive migration | RUNTIME_VERIFIED | yes | partial | browser migration fixture | broader legacy variants not yet sampled |
| Mission create/active ownership | RUNTIME_VERIFIED | yes | partial | browser + store tests | advanced filters/bulk operations not implemented |
| Camera input path | PARTIAL | yes | no | code/browser file input | physical camera permission/device not verified |
| Album multi-image intake | RUNTIME_VERIFIED | yes | synthetic multi-page | browser multi-page + retry flow | large/odd real image sets not representative-tested |
| Capture blob persistence | RUNTIME_VERIFIED | yes | fixture blob | IndexedDB + reload test | storage quota/recovery not verified |
| OCR shared adapter integration | RUNTIME_VERIFIED | yes | provider-shaped fixture only | multi-page partial-failure/retry browser flow | real varied prints/provider behavior unverified |
| OCR review persistence/resume | RUNTIME_VERIFIED | yes | provider-shaped fixture only | reload + editable review + warning/provenance browser tests | duplicate merge UX and real-provider calibration incomplete |
| MEMORIZE | FUNCTIONAL | yes | fixture | V2 browser flow | richer exploration assistance not yet ported |
| FIRST FIND | FUNCTIONAL | yes | fixture | V2 browser flow | recovery/retry pedagogy still simplified |
| MEANING recall | FUNCTIONAL | yes | fixture | V2 browser flow | recognition/contrast variants not yet ported |
| English CONNECTION | RUNTIME_VERIFIED | yes | fixture | Thinking Trail browser flow | adaptive clue personalization and broader representative vocabulary still pending |
| Korean RESPONSE TRAIL | FUNCTIONAL | yes | fixture | V2 browser evidence semantics | qualitative feedback not implemented |
| Hanja SOUND FIND | PARTIAL | yes when verified soundEvidence exists | fixture | domain contract | dedicated V2 browser Hanja path still needed |
| FINAL SEEK | FUNCTIONAL | yes | fixture | V2 browser flow | richer reconstruction/hint ladder not ported |
| Memory evidence recording | RUNTIME_VERIFIED | yes | fixture | V2 Memory Ladder browser flow | long-term calibration still needs representative history |
| Memory advisory to Ready | PARTIAL | no current hosted V2 target | candidate-contract shaped | Hide V2 producer + Ready V2 consumer contract CI | hosted current-candidate roundtrip unverified |
| Ready Planner directive intake | RUNTIME_VERIFIED | yes | fixture contract | browser directed lexical-id test | live current Ready runtime integration unverified |
| Session reload/resume | RUNTIME_VERIFIED | yes | fixture | browser reload test | background/PWA lifecycle not verified |
| Child-facing core UI/UX | RUNTIME_VERIFIED | yes | browser/mobile viewport | redesigned home/mission/learning/memory hierarchy + 390×844 flow tests | final art direction, motion and device visual QA pending |
| Exploration crew presentation layer | SKELETON | partial | no | canonical crew rules only | crew member presence/interaction UI not yet rebuilt in V2 |
| Mission management surface | RUNTIME_VERIFIED | yes | N/A | selection/rename/archive/delete browser flow | richer history/filtering/bulk actions pending |
| Records / wordbook surfaces | RUNTIME_VERIFIED | yes | fixture/history-shaped | cumulative wordbook + weakness dashboard + evidence detail browser flow | filtering/search/export pending |
| PWA install/offline/update | RUNTIME_VERIFIED | yes | browser | isolated V2 manifest/SW/offline shell/update safe-point tests | physical install/device lifecycle still unverified |
| Mobile 390×844 browser layout | RUNTIME_VERIFIED | yes | browser viewport | overflow/touch target/focus reduced-height tests | physical keyboard/touch/device browser still unverified |
| Physical device behavior | NOT_STARTED | no | no | DEVICE_VERIFIED=0 | camera permission/touch/OS keyboard/install all pending |
| Production/release | NOT_STARTED | no | no | none | intentional hold |

## Claim levels

- PRODUCT_COMPLETION: approximately 66%
- CODED: approximately 82%
- CI_VERIFIED: approximately 79%
- BROWSER_RUNTIME_VERIFIED: approximately 75%
- DEVICE_VERIFIED: 0%
- RELEASE_VERIFIED: 0%

These values are conservative product-level estimates, not code-volume or gate-count ratios.

### 2026-09-21 surgery increment
- Mission lifecycle ownership now includes list/select/rename/archive/delete.
- Active-session mission deletion fails closed.
- OCR review rows can be corrected or excluded before commit.
- OCR commit lands in the mission-management surface rather than pretending the home summary is management.
- Exact pre-document code HEAD `6c419115797afca6e52fdcfc84edc99150769d7c` passed:
  - Validate Hide Runtime V2 #26 — SUCCESS
  - Validate Hide & Seek #480 — SUCCESS
- The completion increase reflects these reachable product capabilities only; test/doc additions themselves do not increase completion.

## Reusable validated asset pool — separate from V2 completion

Approximately 65% maturity for reusable assets/contracts:
- shared OCR adapter contract
- language model/evidence truth boundaries
- Ready Learning Basis adapter
- memory advisory ownership
- Ready Learning Engine / Planner review directive contract
- legacy fixtures/regressions
- migration source data
- exploration/learning canonical decisions

This 65% SHALL NOT be averaged into V2 PRODUCT_COMPLETION.

## Rewrite cutover conditions

V2 cannot replace V1 root entry until all are true:
1. all critical product journeys are present in V2;
2. mission management and review editing are functional;
3. representative OCR inputs pass against current provider path;
4. mobile responsive/touch/keyboard checks pass;
5. PWA persistence/update path is V2-owned;
6. current Ready ↔ Hide roundtrip is verified against frozen candidates;
7. V1 legacy migration regression passes;
8. no critical feature depends on V1 app.js/hide-runtime/hide-bridge;
9. DEVICE_VERIFIED is performed for camera/mobile claims;
10. human approval is recorded for cutover.

## Current exact validation evidence before this document commit

Head before matrix document: 63db5206a836050c3dfe5f2b9fd0238d6baeb464
- Validate Hide Runtime V2 #16: SUCCESS
- Validate Hide & Seek #470: SUCCESS
- no Netlify / deploy / merge / production / device verification


### Memory Ladder / records surgery increment
- V2 Memory Ladder derives memory strength, next review priority, recovery status and weakness dimensions from V2 evidence.
- Weakness dimensions now include semantic, phonological, orthographic, confusion, slow/timeout recall, hint dependency and decay.
- Spaced unassisted recall is distinguished from immediate recovery.
- Wordbook merges the same lexical item across missions without duplicating the memory identity.
- Records screen exposes aggregate memory state and per-word review priority.
- Exact pre-document code HEAD `065f9064c23b2198719573da559e5618109f940d` passed V2 #33 and full Hide #487.
- Completion increase reflects the newly reachable Memory Ladder/wordbook product path only.


### English Thinking Trail / memory detail surgery increment
- V2 MEMORIZE now consumes the canonical HideLanguageModel thinking renderer instead of duplicating etymology/root/scene rules.
- Learner inference is recorded before reveal as `INFERENCE_SELF_REPORT`; it never inflates objective recall.
- Verified etymology/root/meaning structures remain truth-gated by the domain model.
- Transparent compounds and semantic scenes remain distinct from historical etymology claims.
- Progressive root/scene reveal interactions are wired in V2.
- Wordbook entries now open a Memory Detail surface showing strength, priority, weakness signature, recovery status and recent Evidence Trail.
- Exact pre-document code HEAD `ce0ad263af71a14d2c4939934f2c81cf5f7a3cad` passed:
  - Validate Hide Runtime V2 #40 — SUCCESS
  - Validate Hide & Seek #494 — SUCCESS
- Completion increase reflects these reachable product capabilities only.


### V2 PWA/offline ownership surgery increment
- V2 now owns `manifest-v2.json`, `sw-v2.js`, `release-v2.js`, and `pwa-v2.js`.
- The V2 service worker caches only V2 runtime assets; it does not cache V1 `index.html/app.js/hide-runtime.js`.
- Offline navigation falls back to cached `v2.html`.
- Update activation is blocked while an active learning session or CAPTURING/REVIEW capture session exists.
- V2 store persistence emits a safe-point signal for update evaluation.
- Product-flow Playwright previously had `serviceWorkers:'block'`; this made PWA claims impossible to verify. The product-flow project now allows service workers and performs real SW registration/offline-shell checks.
- Exact pre-document code HEAD `eaafb969ff4b40c3bb547bbc81dea8f6240d030b` passed:
  - Validate Hide Runtime V2 #54 — SUCCESS
  - Validate Hide & Seek #508 — SUCCESS
- Physical-device installation, camera permission and mobile browser lifecycle remain unverified and do not count toward DEVICE_VERIFIED.


### OCR resilience / mobile browser surgery increment
- V2 capture now persists per-page `analysisRows`.
- If page 1 succeeds and page 2 fails, page 1 remains ANALYZED and is not sent to OCR again.
- Retry analyzes failed pages only and merges preserved successful rows into REVIEW.
- OCR confidence, warnings, provider/model/version provenance survive into mission item source metadata and are visible in review.
- V2 mobile shell owns `visualViewport` height tracking and focused-control visibility.
- 390×844 browser checks enforce no horizontal overflow and >=44px primary touch targets.
- Reduced-height 390×520 checks verify focused recall input / Korean textarea remain within the visual viewport after focus.
- Exact pre-document code HEAD `a5b4734bc06c49d37eb80c05752b7f75ca7538d8` passed:
  - Validate Hide Runtime V2 #68 — SUCCESS
  - Validate Hide & Seek #522 — SUCCESS
- These are browser-runtime proofs only. They do not prove real OCR provider accuracy, real camera permission behavior, OS keyboard behavior, or DEVICE_VERIFIED.


### Ready ↔ Hide V2 contract correction
- Hide V2 now publishes explicit `HIDE_SPECIALIST_RESULT_V2` with mission fields and task/session correlation.
- Ready PR #100 now consumes that exact result/event contract.
- Historical V1 sheet fields are not aliased onto V2 mission semantics.
- `trailMastery=null` remains null; Memory Strength is not relabeled as Trail Mastery.
- Planner-directed review launch fails closed unless a current `hideSeekV2` specialist target is explicitly configured.
- Hide producer HEAD `4a9797a048a1c4a2c04023e90f35f97ee6d43d12`: V2 #73 PASS / full Hide #527 PASS.
- Ready consumer pre-doc HEAD `84b68624612c745b5a30274cb0b5744199963a53`: roundtrip #13 PASS / Integration #278 PASS / Runtime E2E #445 PASS.
- PRODUCT_COMPLETION remains approximately 56%. Contract hardening and removal of a stale route do not count as a completed user journey.
- Live current-candidate cross-app browser roundtrip remains OPEN until a frozen Hide V2 target exists under the external-resource gate.


### Seek Again / Trail Mastery / child-facing UI surgery increment
- FINAL SEEK miss now enters `다시 만나기 → 다시 찾기` instead of closing the item.
- Same-day recovery is credited to current Trail Mastery but remains `IMMEDIATE_ONLY` for long-term Memory Strength.
- `HideV2Trail` is a separate owner for current session/mission readiness.
- Ready-directed subset sessions compute Trail Mastery only over the directed queue and do not falsely complete the entire Hide mission.
- Child-facing runtime/version jargon was removed from the learner UI.
- Hide & Seek installed/product identity remains stable while V2 stays an internal implementation label.
- Hide code HEAD `42f7627b405d1026a0339fb5ed11b563d65d8003`: V2 #102 PASS / full Hide #556 PASS.
- Ready consumer HEAD `91e06f2e51fdfb4df265e600e940ae97df598768`: roundtrip #16 / Integration #281 / Runtime E2E #468 PASS.

### Product UI/UX surgery increment
- Home is reorganized around one primary user decision: today’s active exploration.
- Camera/library intake, mission management and Memory Ladder are visually subordinate secondary actions.
- Learning screens now expose a compact progress hierarchy while keeping one primary action per stage.
- Mission management uses child-facing mission cards and explicit active state rather than raw status rows.
- Memory surfaces use Memory Ladder summary, weakness signals and per-word meters instead of developer-style metric tables.
- 390×844 browser flow remains inside viewport and primary CTA/touch targets remain usable.
- UI-specific architecture/browser gates prevent fallback to raw developer/status-table presentation.
- Exact pre-document UI code HEAD `e006dc0ca3fdadb704e9403f7af566668093a88f`:
  - Validate Hide Runtime V2 #116 — SUCCESS
  - Validate Hide & Seek #570 — SUCCESS
- PRODUCT_COMPLETION increase reflects reachable child-facing product surfaces, not CSS volume or test count.
- UI/UX is materially improved but not final: exploration crew presence, motion/celebration, final visual art direction and physical-device visual QA remain OPEN.
