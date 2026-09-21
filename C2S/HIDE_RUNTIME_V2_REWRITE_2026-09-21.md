# HIDE RUNTIME V2 REWRITE C2S — 2026-09-21

## Decision

Hide & Seek V1 structural integrity is classified REWRITE_REQUIRED for continued product growth.
This is not a feature rewrite from zero. Validated domain/evidence/integration assets are preserved while the defective execution architecture is replaced.

## Correction

Previous implementation percentages over-weighted code existence, fixture CI and contract closure.
Product completion and reusable-asset maturity are now separate measures.

## Protected invariants

- Hide owns memory evidence, not cross-session schedule.
- Ready Learning Engine owns review policy.
- Ready & Set Planner owns dated scheduling.
- OCR provider transport remains shared Family capture capability.
- Language truth boundaries remain preserved.
- V1 persistent data is not destructively migrated.
- User is not the tester/debugger.

## Runtime V2 implemented in rewrite branch

- independent state store
- mission service
- learning-session state machine
- memory engine
- OCR controller
- router
- UI/controller
- non-destructive legacy migration
- Ready review/return bridge
- architecture isolation gate
- V2 browser product-flow tests

## Claim status

V2 is NOT production-ready.
V2 product completion must be measured independently from the reusable V1/domain asset pool.
No merge, deploy, Netlify, production or device verification has occurred.


## Rewrite execution status — current
- V2 now owns independent Store / Mission / Learning Session / Memory / Capture Asset Store / Capture Controller / Router / Ready Bridge / UI controller.
- V2 does not load legacy `app.js`, `hide-runtime.js`, or `hide-bridge.js`.
- NEW learning flow: MEMORIZE → FIRST FIND → MEANING → DOMAIN_EXTENSION → FINAL SEEK → COMPLETE.
- REVIEW flow skips MEMORIZE and begins with retrieval.
- Capture blobs persist in V2 IndexedDB; OCR review state persists across reload.
- V1 migration is non-destructive and keeps legacy storage intact.
- Product completion is tracked separately in `C2S/HIDE_RUNTIME_V2_PRODUCT_COMPLETION_MATRIX_2026-09-21.md`.
- V2 product completion is ~35%; reusable asset maturity is separate (~65%) and must not be averaged into V2 completion.
- No deploy/merge/device verification.


## Surgery increment — mission lifecycle / OCR review
- Mission Service now owns list/select/rename/archive/delete.
- Delete is blocked for a mission with an active persisted learning session.
- OCR review is editable before commit: token/meaning correction and row exclusion.
- The saved result routes into the V2 mission-management surface.
- This moves V2 PRODUCT_COMPLETION from ~35% to ~39%; reusable asset maturity remains separate.


## Surgery increment — Memory Ladder / wordbook
- V2 now owns memory signatures rather than depending on V1 lexicon runtime.
- Derived dimensions: semantic/phonological/orthographic weakness, confusion, slow recall, timeout risk, hint dependency, recovery status and long-term decay.
- Memory strength and next-review priority are projections of evidence, not scheduling authority.
- Same lexicalId across missions is merged into a cumulative wordbook record.
- Records surface exposes aggregate memory and per-word review reasons.
- V2 PRODUCT_COMPLETION moves from ~39% to ~44%; DEVICE_VERIFIED remains 0%.


## Surgery increment — English Thinking Trail / memory detail
- V2 uses `HideLanguageModel.renderStarterExplorationHtml()` as the canonical English structure/scene renderer.
- Learner predicts meaning/concept and selects the clue used before structure reveal.
- Inference evidence is self-report only and does not raise objective recall.
- Verified root/etymology, transparent compound, and semantic-scene truth classes remain distinct.
- Wordbook now provides per-word Memory Detail and recent Evidence Trail.
- Pre-doc code HEAD `ce0ad263af71a14d2c4939934f2c81cf5f7a3cad`: V2 #40 PASS, full Hide #494 PASS.
- V2 PRODUCT_COMPLETION: ~48%; DEVICE_VERIFIED remains 0%.


## Surgery increment — V2 PWA/offline ownership
- Added V2-owned manifest, release descriptor, service worker and update controller.
- V2 service worker has an isolated `hide-seek-v2:` cache namespace and excludes V1 runtime assets.
- Offline shell reopen is browser-verified.
- Update safe-point logic blocks activation during active learning and unfinished OCR capture/review.
- Validation defect found and corrected: the main Playwright product-flow project had `serviceWorkers:'block'`, so prior PWA verification could not prove actual SW behavior.
- Pre-doc code HEAD `eaafb969ff4b40c3bb547bbc81dea8f6240d030b`: V2 #54 PASS, full Hide #508 PASS.
- V2 PRODUCT_COMPLETION: ~52%; DEVICE_VERIFIED remains 0%.


## Surgery increment — OCR resilience / mobile browser
- Multi-page OCR now stores successful page rows before later pages finish.
- Partial provider failure keeps successful pages and retries failed pages only.
- Confidence/warning/provider provenance is preserved into review/mission source metadata.
- Added V2 mobile shell for visualViewport tracking and focus visibility.
- 390×844 no-overflow/touch-target and reduced-height focused-control browser checks are active.
- Pre-doc code HEAD `a5b4734bc06c49d37eb80c05752b7f75ca7538d8`: V2 #68 PASS, full Hide #522 PASS.
- Real provider OCR accuracy and physical-device camera/keyboard remain OPEN.
- V2 PRODUCT_COMPLETION: ~56%; DEVICE_VERIFIED remains 0%.
