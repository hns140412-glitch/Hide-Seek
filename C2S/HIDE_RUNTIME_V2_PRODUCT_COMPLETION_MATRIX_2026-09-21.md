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
| Mission create/active ownership | RUNTIME_VERIFIED | yes | partial | browser + store tests | bulk operations not implemented |
| Camera input path | PARTIAL | yes | no | code/browser file input | physical camera permission/device not verified |
| Album multi-image intake | RUNTIME_VERIFIED | yes | synthetic multi-page | browser multi-page + retry flow | large/odd real image sets not representative-tested |
| Capture blob persistence | RUNTIME_VERIFIED | yes | fixture blob | IndexedDB + reload test | storage quota/recovery not verified |
| OCR shared adapter integration | RUNTIME_VERIFIED | yes | provider-shaped fixture only | multi-page partial-failure/retry browser flow | real varied prints/provider behavior unverified |
| OCR review persistence/resume | RUNTIME_VERIFIED | yes | provider-shaped fixture only | reload + editable review-draft persistence + warning/provenance + explicit duplicate-merge browser tests | real-provider calibration incomplete |
| MEMORIZE / THINKING TRAIL | RUNTIME_VERIFIED | yes | fixture | prediction→reveal→self-comparison + established-clue reuse browser flow | representative multilingual inference histories still open |
| FIRST FIND | RUNTIME_VERIFIED | yes | fixture | correct/wrong/unsure + English shape + verified Korean meaning-map + verified Hanja sound assist + relearn truth-boundary browser flows | representative source breadth still open |
| MEANING CLUE | RUNTIME_VERIFIED | yes | fixture | direct recall + bounded context-assist/relearn + session-scoped bidirectional recognition + confusion handoff browser flow | broader representative confusion/context sets still open |
| English CONNECTION | RUNTIME_VERIFIED | yes | fixture | established inference-history personalization + non-recall guidance browser flow | broader representative vocabulary/history still open |
| Korean RESPONSE TRAIL | RUNTIME_VERIFIED | yes | fixture | production evidence + target-use feedback + scoped human-review handoff/completion note browser flow | external parent/teacher review UI and representative responses remain open |
| Korean EVIDENCE TRAIL | RUNTIME_VERIFIED | yes when verified contextEvidence exists | verified-context fixture | browser evidence-selection truth-boundary flow | representative Korean source evidence still open |
| Hanja SOUND FIND | RUNTIME_VERIFIED | yes when verified soundEvidence exists | verified-sound fixture | dedicated V2 browser sound-recall flow | representative Hanja source/device pronunciation workflow still open |
| HIDDEN WORDS reinforcement | RUNTIME_VERIFIED | conditional | fixture | Memory Engine-gated + reason-specific + staged-assistance browser flows | deeper multi-step ladder remains partial beyond one safe clue escalation |
| FINAL SEEK | RUNTIME_VERIFIED | yes | fixture | unassisted recall + optional support + failed-recall shape reconstruction + Seek Again browser regressions | full letter-key reconstruction game remains reference-only |
| Memory evidence recording | RUNTIME_VERIFIED | yes | fixture | V2 Memory Ladder browser flow | long-term calibration still needs representative history |
| Memory advisory to Ready | PARTIAL | no current hosted V2 target | candidate-contract shaped | Hide V2 producer + Ready V2 consumer contract CI | hosted current-candidate roundtrip unverified |
| Ready Planner directive intake | RUNTIME_VERIFIED | yes | fixture contract | browser directed lexical-id test | live current Ready runtime integration unverified |
| Session reload/resume | RUNTIME_VERIFIED | yes | fixture | browser reload test | background/PWA lifecycle not verified |
| Child-facing core UI/UX | RUNTIME_VERIFIED | yes | browser/mobile viewport | home/mission/learning/completion/Memory Ladder/OCR review-recovery + 390×844 + exploration art-direction checks | physical-device visual QA/final device polish pending |
| Exploration crew presentation layer | RUNTIME_VERIFIED | yes | adapter/fallback browser fixture | answer-safe crew strip + home/completion/Memory Ladder presentation tests | live current Snap crew-provider roundtrip and final art direction remain open |
| Mission management surface | RUNTIME_VERIFIED | yes | N/A | selection/rename/archive/delete browser flow | richer history/filtering/bulk actions pending |
| Records / wordbook surfaces | RUNTIME_VERIFIED | yes | fixture/history-shaped | cumulative wordbook + weakness dashboard + evidence detail browser flow | export pending |
| PWA install/offline/update | RUNTIME_VERIFIED | yes | browser | isolated V2 manifest/SW/offline shell/update safe-point tests | physical install/device lifecycle still unverified |
| Mobile 390×844 browser layout | RUNTIME_VERIFIED | yes | browser viewport | overflow/touch target/focus reduced-height tests | physical keyboard/touch/device browser still unverified |
| Physical device behavior | NOT_STARTED | no | no | DEVICE_VERIFIED=0 | camera permission/touch/OS keyboard/install all pending |
| Production/release | NOT_STARTED | no | no | none | intentional hold |

## Claim levels

- PRODUCT_COMPLETION: approximately 79%
- CODED: approximately 94%
- CI_VERIFIED: approximately 92%
- BROWSER_RUNTIME_VERIFIED: approximately 88%
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


### 2026-09-22 child-facing continuity / truth-alignment increment
- Home, mission map, six-stage learning journey, completion, Memory Ladder, memory detail, OCR review and OCR recovery now use one child-facing exploration hierarchy.
- Exploration Crew presentation is consumed through the V2 crew adapter; Hide still does not own crew personality or intervention grammar.
- Answer-safe crew support remains non-answer-revealing.
- Completion metrics are subordinate to achievement/next-action messaging.
- Memory Ladder no longer uses invented UI-only 80/45 thresholds. It follows Memory Engine semantics:
  - `needsUnassistedRecall || memoryStrength < 60` -> 다시 찾기;
  - `primaryReason.key === stable` -> 안정;
  - otherwise -> 올라가기.
- Child memory reasons now use the engine-owned `primaryReason` rather than ad-hoc signature field guesses.
- Raw Memory/priority/weakness diagnostics remain available but are collapsed behind child-facing path explanations.
- OCR review presents visible human-readable warnings while raw provider/warning codes remain available under technical details.
- OCR partial-success recovery remains preserve-first and retries failed pages only.
- Completion celebration has subtle browser motion and a verified `prefers-reduced-motion: reduce` no-animation path.
- Exact pre-document code HEAD `6a3c31e70c2e30aa770e08733162f1eaad2cf7dc` passed:
  - Validate Hide Runtime V2 #173 — SUCCESS
  - Validate Hide & Seek #627 — SUCCESS.
- PRODUCT_COMPLETION remains approximately 66%; CODED approximately 82%; CI_VERIFIED approximately 79%; BROWSER_RUNTIME_VERIFIED approximately 75%; DEVICE_VERIFIED 0%; RELEASE_VERIFIED 0%.
- No percentage increase is claimed for CSS/test/document volume. Remaining material blockers are representative live-provider OCR, physical-device verification, current frozen Ready↔Hide roundtrip, final visual art direction, and release/deploy source-ref proof.


### 2026-09-22 language-domain runtime closure increment
- A browser-verified exploration art-direction pass now visually connects home, mission map, learning journey, completion and Memory Ladder. This does not count as device visual QA.
- Hanja SOUND FIND now has a dedicated Runtime V2 browser journey using verified source-linked `soundEvidence`; typed sound recall records `SOUND + RECALL` with objective recall and the verified sourceRef.
- Korean verified EVIDENCE TRAIL is now implemented in Runtime V2:
  - only canonical `normalizeContextEvidence` output can activate the path;
  - the learner explicitly selects evidence from verified candidates;
  - the event records `EVIDENCE + MEANING`, `EVIDENCE_SELECTION`, and `objectiveVerified=true`;
  - it does **not** claim objective CONTEXT recall or recall-score impact;
  - after evidence selection, the same DOMAIN_EXTENSION continues to RESPONSE TRAIL and then FINAL SEEK.
- Exact pre-document code HEAD `3e63d5250d7f636046b50d2e164e028d925ffde9` passed:
  - Validate Hide Runtime V2 #182 — SUCCESS
  - Validate Hide & Seek #636 — SUCCESS.
- The conservative product estimate rises only for the newly reachable Korean evidence-selection path plus newly runtime-proven Hanja sound path: PRODUCT_COMPLETION ~67%, CODED ~83%, CI_VERIFIED ~80%, BROWSER_RUNTIME_VERIFIED ~76%. DEVICE_VERIFIED and RELEASE_VERIFIED remain 0%.


### 2026-09-22 assisted-recall / OCR provenance closure increment
- FINAL SEEK support is now truth-separated from unassisted recall:
  - using the answer-safe memory scene records explicit assistance;
  - a correct answer after assistance does not count as objective recall;
  - the learner must pass through Seek Again for an unassisted retrieval;
  - same-day recovery remains `IMMEDIATE_ONLY` and `needsUnassistedRecall=true` until spaced evidence exists.
- OCR review → mission commit now preserves page/row/confidence/provider/model/analysisVersion instead of losing nested source provenance during a second normalize pass.
- Duplicate OCR lexical rows are no longer silently deleted or duplicated by default:
  - review visibly marks repeated lexical rows;
  - the user explicitly chooses to merge them;
  - one mission item is created while all source occurrences remain under `source.occurrences`;
  - editing a merged row breaks the merge rather than silently preserving a stale grouping.
- Exact code HEAD `771e4888af4ff3121347d93ca4184f63768e94f1` passed:
  - Validate Hide Runtime V2 #196 — SUCCESS
  - Validate Hide & Seek #654 — SUCCESS.
- Conservative reporting after this user-reachable closure: PRODUCT_COMPLETION ~68%, CODED ~84%, CI_VERIFIED ~81%, BROWSER_RUNTIME_VERIFIED ~77%, DEVICE_VERIFIED 0%, RELEASE_VERIFIED 0%.


### 2026-09-22 local-first review-draft continuity increment
- OCR review now persists the actual human review draft, not only raw OCR rows.
- Corrections, exclusions and explicit duplicate-merge decisions survive reload and resume.
- Raw OCR `lastRows` remain immutable evidence input while `reviewDraft` stores human review state separately.
- Fresh capture/re-analysis clears stale reviewDraft before a new review is created.
- Memory Ladder search/state filters and mission map status filters are browser-verified but do not change memory/mission semantics.
- Exact code HEAD `75dd5431625ac7b37b857df9aeb346487176c4ab` passed V2 #213 / full Hide #671.
- Conservative completion percentages remain unchanged at PRODUCT ~68%, CODED ~84%, CI ~81%, Browser Runtime ~77%, Device 0%, Release 0%.


### 2026-09-22 First Find recovery increment
- A wrong FIRST FIND no longer disappears into the next stage with no child-facing correction.
- Wrong recall is recorded first as objective retrieval evidence, then the runtime enters `FIRST_FIND_RELEARN`.
- The relearn scene briefly re-exposes token + meaning (+ example when present) and records `RELEARN_EXPOSURE`, `objectiveRecall=false`, `assisted=true`.
- After the child explicitly hides the word again, the journey proceeds to MEANING.
- The internal recovery stage remains visually anchored to the FIRST FIND step; it does not create a seventh canonical journey stage.
- Exact code HEAD `506029061ac9e2873595545758f1b737e9f1aa4e` passed V2 #220 / full Hide #678.
- Conservative completion percentages remain PRODUCT ~68%, CODED ~84%, CI ~81%, Browser Runtime ~77%, Device 0%, Release 0% pending broader learning-assistance closure.


### 2026-09-22 First Find explicit-failure closure
- FIRST FIND now supports an explicit child-facing `아직 안 떠올라` action.
- An unsure action is stored as a real recall attempt with `result=PASS`, `objectiveRecall=true`, `objectiveVerified=false`, `assisted=false`; it is not fabricated as a typed wrong answer.
- Wrong typed answers remain objectively checked WRONG retrieval.
- Both wrong and unsure paths enter the same relearn exposure before MEANING.
- The exposure remains assisted/non-recall and cannot inflate Memory Strength.
- Exact code HEAD `9261d6c07dbd37df1e9132bf6d15799072338983` passed:
  - Validate Hide Runtime V2 #227 — SUCCESS
  - Validate Hide & Seek #685 — SUCCESS.
- Combined with the newly verified local-first editable OCR review continuity since the prior locked estimate, the conservative product-level report moves by one point only: PRODUCT ~69%, CODED ~85%, CI ~82%, Browser Runtime ~78%, Device 0%, Release 0%.


### 2026-09-22 Hidden Words / hint-dependency correction increment
- Runtime V2 now conditionally inserts a child-facing HIDDEN WORDS reinforcement before FINAL SEEK only when the V2 Memory Engine says the current word is not stable.
- The reinforcement plan consumes the engine-owned `primaryReason`; it does not introduce a second weakness scoring authority.
- Stable words skip HIDDEN WORDS and continue directly to FINAL SEEK.
- Reinforcement failure enters `HIDDEN_WORDS_RELEARN`; that re-exposure is assisted, non-recall evidence and cannot inflate recall.
- A latent Memory Engine bug was found and corrected: ordinary MEMORIZE/relearn exposure with `assisted=true` no longer automatically counts as `hintDependency`. Hint dependency now derives from actual ASSISTANCE/hint-level evidence.
- Exact code HEAD `b2577641cbbc3703eb84e7ab583d6d741ff22eee` passed V2 #236 / full Hide #694.
- Conservative reporting rises one point for the newly reachable reinforcement journey plus corrected engine semantics: PRODUCT ~70%, CODED ~86%, CI ~83%, Browser Runtime ~79%, Device 0%, Release 0%.


### 2026-09-22 reason-specific Hidden Words increment
- HIDDEN WORDS no longer treats every weakness as the same spelling retry.
- Memory Engine `primaryReason` maps to a bounded activity mode:
  - confusion → meaning re-identification;
  - orthographic → English shape scaffold reconstructed from the token;
  - sound → verified source-linked sound recall when soundEvidence exists;
  - recovery/hint/latency/decay → unassisted token recall.
- No second weakness score is introduced; the Memory Engine remains the single selector.
- Exact code HEAD `f19dcd84f650ca4e80d970f36a911b4694d9ecd5` passed V2 #243 / full Hide #701.
- Conservative report moves one point for this newly runtime-proven adaptive child journey: PRODUCT ~71%, CODED ~87%, CI ~84%, Browser Runtime ~80%, Device 0%, Release 0%.


### 2026-09-22 bidirectional Meaning Clue increment
- MEANING CLUE now uses bidirectional recognition when the active learning session contains valid peers:
  - even session index: token → meaning;
  - odd session index: meaning → token.
- Single-item or peerless sessions retain direct typed meaning recall.
- Recognition is truth-separated from recall:
  - `evidenceMode=RECOGNITION`;
  - `objectiveVerified=true`;
  - `objectiveRecall=false`;
  - mismatch stores the confused token/meaning pair.
- A MEANING mismatch feeds the existing Memory Engine confusion signal and therefore the reason-specific HIDDEN WORDS meaning reinforcement.
- Ready Planner ownership is preserved: recognition peers are selected only from `session.queue`, never from unrelated mission items outside the directed lexical-id scope.
- The first implementation exposed this scope regression; exact-head CI caught it, and the queue-scoped fix is now green.
- Exact code HEAD `e15e86fdd7053903c1093251d13bdc31398a8bea` passed:
  - Validate Hide Runtime V2 #251 — SUCCESS
  - Validate Hide & Seek #709 — SUCCESS.
- Conservative reporting rises one point for this newly runtime-proven child learning path: PRODUCT ~72%, CODED ~88%, CI ~85%, Browser Runtime ~81%, Device 0%, Release 0%.


### 2026-09-22 staged Hidden Words assistance increment
- HIDDEN WORDS no longer reveals the full answer immediately after the first reinforcement miss when a safe minimal clue exists.
- Current bounded ladder:
  1. reason-specific reinforcement attempt;
  2. one safe minimal clue when available;
  3. assisted retry;
  4. full relearn exposure only if the assisted retry also fails;
  5. FINAL SEEK remains the unassisted verification point.
- Safe clue sources are deliberately narrow:
  - TOKEN recall → English shape scaffold when available;
  - MEANING recall → existing example/context when available;
  - SOUND and already-SHAPE-assisted paths do not invent a second clue and may fail closed to relearn.
- Assisted retry evidence is `objectiveVerified=true`, `objectiveRecall=false`, `recallScoreImpact=false`, `assisted=true`.
- A correct assisted retry still proceeds to FINAL SEEK for unassisted proof.
- SHAPE reinforcement itself was also corrected: because a form cue is visible, even a correct response is assisted/non-recall; direct typed MEANING reinforcement remains real meaning recall.
- Exact code HEAD `28a70fc7ff3e1f89d1bfaba6b59acf47af5f1557` passed V2 #261 / full Hide #719.
- Conservative reporting rises one point for this newly reachable assistance ladder: PRODUCT ~73%, CODED ~89%, CI ~86%, Browser Runtime ~82%, Device 0%, Release 0%.


### 2026-09-22 Final Seek reconstruction recovery increment
- FINAL SEEK keeps the first verification attempt unassisted.
- An unassisted English FINAL SEEK miss may enter one form-reconstruction recovery using the existing shape scaffold before any full answer exposure.
- Reconstruction evidence is `ASSISTED_RECONSTRUCTION`, objectively checkable but never objective recall.
- Reconstruction success routes directly to SEEK AGAIN, where the learner must retrieve the word without the reconstruction cue.
- Reconstruction failure routes to the existing relearn exposure and then SEEK AGAIN.
- If the learner already used the optional semantic memory-scene support during FINAL SEEK, a second reconstruction clue is not stacked; the flow fails closed to relearn.
- Exact code HEAD `47cf0c0391c13311cb3faa3c33cf305a2c8e5c63` passed V2 #268 / full Hide #726.
- Conservative reporting rises one point for this newly runtime-proven reconstruction/recovery journey: PRODUCT ~74%, CODED ~90%, CI ~87%, Browser Runtime ~83%, Device 0%, Release 0%.


### 2026-09-22 Korean Response Trail truth-boundary feedback increment
- RESPONSE TRAIL now gives child-readable feedback for whether the target word was actually used in the submitted sentence.
- This is deliberately narrow:
  - target present → TARGET_USED;
  - target absent → TARGET_NOT_USED;
  - sentence semantic correctness is **not** automatically claimed.
- Evidence remains PRODUCTION with objectiveVerified=false, objectiveRecall=false, recallScoreImpact=false.
- The response is locked after submission before the journey continues, preventing accidental duplicate production evidence.
- Exact HEAD `17ea285c2c8a53ab2735c6be08f99d5f34debfab` passed V2 #275 / full Hide #733.
- Completion percentages remain unchanged because this closes a feedback/truth-boundary gap inside an already reachable Korean path.


### 2026-09-22 Hanja SOUND miss recovery increment
- A wrong Hanja SOUND FIND no longer silently advances.
- Recovery path is now:
  1. wrong typed sound is stored as objective SOUND recall evidence;
  2. the verified source-linked reading is re-exposed once as assisted RELEARN_EXPOSURE;
  3. the reading is hidden again;
  4. the session explicitly hands off to SOUND-specific HIDDEN WORDS reinforcement;
  5. FINAL SEEK remains separate form/retrieval verification.
- No reading is inferred. Recovery is available only when canonical verified `soundEvidence` exists.
- The generic Memory Engine recovery reason can mask a more specific sound axis, so the immediate recovery handoff carries an activity-only SOUND override. It does not change Memory Engine scores, review policy, or scheduling ownership.
- A runtime API export omission in the first implementation was caught by exact-head browser CI and corrected.
- Exact code HEAD `ad8872a9305a121b783142f00e4a8d2c22e6ad1c` passed V2 #284 / full Hide #742.
- Conservative reporting moves one point for this newly runtime-proven language-domain recovery path: PRODUCT ~75%, CODED ~91%, CI ~88%, Browser Runtime ~84%, Device 0%, Release 0%.


### 2026-09-22 active Thinking Trail inference increment
- MEMORIZE now closes the active inference loop in Runtime V2:
  1. learner predicts meaning/concept before reveal;
  2. learner records which clue was used and confidence;
  3. verified/semantic structure is revealed;
  4. learner self-compares the prediction as MATCH / NEAR / MISS;
  5. the event remains learner self-report, never objective recall/correctness;
  6. accumulated self-report events feed the existing inference-skill summarizer.
- Only ESTABLISHED clue tendencies can surface as optional guidance on a later applicable word. EMERGING/LOW evidence is not promoted as stable personalization.
- Guidance remains optional: the learner can choose another clue.
- No recall score or Memory Strength inflation is introduced by inference comparison.
- Exact code HEAD `42a524f6474db74896fc507e7a61724ba99f48ee` passed V2 #292 / full Hide #750.
- Conservative reporting rises one point for this newly runtime-proven active inference/reuse path: PRODUCT ~76%, CODED ~92%, CI ~89%, Browser Runtime ~85%, Device 0%, Release 0%.


### 2026-09-22 bounded First Find assistance increment
- FIRST FIND failure no longer jumps directly to full answer exposure when a safe English form cue is available.
- Bounded path:
  1. unassisted FIRST FIND wrong or UNSURE is recorded first;
  2. one English shape cue may be shown;
  3. assisted reconstruction retry is objectively checkable but never objective recall;
  4. assisted success proceeds to MEANING;
  5. assisted failure proceeds to the existing full relearn exposure before MEANING.
- Korean/Hanja or unsupported English items fail closed to the existing full relearn path rather than inventing a cue.
- The canonical six-stage child journey remains unchanged; FIRST_FIND_ASSIST is an internal recovery state mapped to FIRST FIND.
- Exact code HEAD `56452289a112d338e2e9abd818a8acb9590794ee` passed V2 #300 / full Hide #758.
- Conservative reporting rises one point for this newly runtime-proven child recovery path: PRODUCT ~77%, CODED ~93%, CI ~90%, Browser Runtime ~86%, Device 0%, Release 0%.


### 2026-09-22 active inference Thinking Trail increment
- MEMORIZE is no longer only a reveal/observe step when Thinking Trail support exists.
- Child flow is now:
  1. predict meaning/concept before reveal;
  2. choose the clue used and confidence;
  3. reveal verified/curated structure or semantic scene;
  4. self-compare as MATCH / NEAR / MISS;
  5. reuse accumulated clue tendencies only as optional guidance on later words.
- Prediction and comparison remain learner self-report:
  - objectiveVerified=false;
  - objectiveRecall=false;
  - recallScoreImpact=false.
- `FIRST_SEEN_PREDICTION` events feed the existing `summarizeInferenceSkill()` path.
- Adaptive guidance is conservative: ESTABLISHED evidence can surface a preferred clue, while the child may still choose another clue. No forced answer or recall scoring is introduced.
- Exact HEAD `2714be8bd84985c7e3dde763aee270723486c1be` passed V2 #304 / full Hide #762.
- Conservative reporting rises one point for this newly runtime-proven active inference loop: PRODUCT ~76%, CODED ~92%, CI ~89%, Browser Runtime ~85%, Device 0%, Release 0%.


### 2026-09-22 multilingual First Find recovery increment
- FIRST FIND safe-assistance now supports more than English while remaining evidence-gated:
  - English → deterministic shape cue;
  - Korean → verified meaning-map structural cue only;
  - Hanja → verified source-linked sound cue only.
- Korean/Hanja assistance fails closed when verified evidence is unavailable; no inferred etymology, component or pronunciation is invented.
- All FIRST_FIND_ASSIST successes remain assisted/non-recall with `recallScoreImpact=false`.
- Source-backed Korean/Hanja assistance stores the source reference in evidence.
- Exact HEAD `950631cd774d85a1227c51235d3168f9bb013146` passed V2 #311 / full Hide #769.
- Conservative report moves one point for this newly runtime-proven multilingual recovery path: PRODUCT ~77%, CODED ~93%, CI ~90%, Browser Runtime ~86%, Device 0%, Release 0%.


### 2026-09-22 English Connection personalization increment
- English CONNECTION now reuses prior inference history only when the inference-skill profile is ESTABLISHED and the preferred clue actually applies to the current word.
- Current bounded guidance can prioritize existing WORD_PART, verified ROOT_ETYMOLOGY, SCENE, or PRIOR_WORD support.
- EMERGING history does not become adaptive guidance.
- The connection card remains optional guidance; it does not force an answer or a clue choice.
- Guidance evidence is stored separately as `ADAPTIVE_CONNECTION_GUIDANCE` with `objectiveRecall=false` and `recallScoreImpact=false`.
- The normal CONNECTION exposure record remains separate.
- Exact HEAD `b307014e92b8e3448c48e697154b3a2e8cb60db9` passed V2 #319 / full Hide #777.
- Conservative reporting moves one point for this runtime-proven adaptive connection path: PRODUCT ~78%, CODED ~94%, CI ~91%, Browser Runtime ~87%, Device 0%, Release 0%.


### 2026-09-22 Korean expression human-review handoff increment
- RESPONSE TRAIL now exports scoped expression review candidates through HIDE_SPECIALIST_RESULT_V2.
- Each candidate preserves the submitted sentence, target-word-use fact, lexical/item identity and the explicit boundary `semanticCorrectnessClaimed=false` / `objectiveVerified=false`.
- Review state is `HUMAN_SEMANTIC_REVIEW_AVAILABLE`; Hide does not assign a semantic correctness score.
- Candidate projection obeys the active Ready-directed `session.queue`; unrelated mission expressions are not leaked into the result.
- The child completion surface quietly reports how many expressions remain for parent/teacher semantic review.
- Exact HEAD `50d04cf2f891b4844ddf16f225b40f4bf1a947cf` passed V2 #326 / full Hide #784.
- Conservative reporting: PRODUCT ~79%, CODED stays ~94%, CI ~92%, Browser Runtime ~88%, Device 0%, Release 0%.


### 2026-09-22 bounded Meaning recall recovery increment
- Single-item direct MEANING recall no longer silently advances after a wrong answer.
- Recovery path is bounded:
  1. wrong direct meaning recall is stored as objective recall failure;
  2. if a safe context clue exists, one assisted meaning retry is offered;
  3. assisted success remains objectiveVerified but non-recall;
  4. assisted miss, or no safe clue, escalates to full meaning relearn exposure;
  5. the journey then continues to DOMAIN_EXTENSION.
- Safe context source is either normalized verified contextEvidence or an existing example sentence; the target token is masked in the cue.
- Relearn exposure is assisted/non-recall and cannot inflate Memory Strength.
- Exact HEAD `dbe3fcf7a41a8b2a0a7e831af63ee41139e18a28` passed V2 #334 / full Hide #792.
- Conservative reporting rises one point for this newly runtime-proven meaning-recovery path: PRODUCT ~78%, CODED ~94%, CI ~91%, Browser Runtime ~87%, Device 0%, Release 0%.
