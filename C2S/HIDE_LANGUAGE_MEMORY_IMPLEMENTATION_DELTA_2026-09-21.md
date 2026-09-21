# HIDE & SEEK — LANGUAGE MEMORY IMPLEMENTATION DELTA — 2026-09-21

## Scope
Implementation continuation after `C2S/HIDE_LANGUAGE_MEMORY_C2S_CLOSURE_2026-09-21.md`.

## Implemented decisions
- Preserve the real NEW 12 fixture; do not hard-code 12/24 globally.
- Add truth-gated lexical support classes:
  - VERIFIED_ETYMOLOGY / VERIFIED_ROOT
  - TRANSPARENT_COMPOUND
  - SEMANTIC_SCENE
  - MNEMONIC_BRIDGE
- NEW-word sequence:
  `prediction → clue used → confidence → structure/scene reveal → meaning reveal → learner self-comparison → memorization → FIRST FIND`.
- Store first-seen inference in `inferenceTrace`; it has `recallScoreImpact:false`.
- Learner comparison (MATCH/NEAR/MISS) is explicitly `assessmentSource=LEARNER_SELF_REPORT`, `objectiveVerified=false`.
- Transferable inference skill is cumulative across missions, not scoped to the active mission.
- Prior best clue may reappear only as an optional hint; it does not force the learner's clue choice.
- Semantic-scene words now have a visual reasoning trail without pretending the trail is historical etymology.

## NEW 12 truth-gate state
Externally supported verified history/structure:
- environment
- mountain
- planet
- desert
- island
- jungle
- glacier
- earthquake
- climate
- harvest

Non-historical support retained:
- rainforest — transparent compound
- ocean — semantic scene; deeper origin remains uncertain and is not fabricated

## Validation contracts
- `tools/validate-hide-language-model.js` guards:
  - verified etymology routes,
  - ocean truth-gate fallback,
  - semantic-scene visual trail,
  - transferable inference aggregation.
- `tools/validate-hide-seek-runtime-contract.py` guards:
  - inference vs recall separation,
  - self-report provenance,
  - cumulative cross-mission aggregation,
  - optional prior-skill clue reuse.
- Browser fixture now includes a prior mission so the records view must aggregate prior + current inference evidence.

## Current execution boundary
Repository: `hns140412-glitch/Hide-Seek`
Branch: `implementation/hide-seek-capture-session-v02`
PR #4: DRAFT / HOLD / DO NOT MERGE
Netlify / production deploy: NOT CALLED
User testing: NOT USED

Latest pre-delta code HEAD observed: `5834ca97624ebee2323fccdbf750c993a213b0d9`.

CI note:
- #244 on `320700c...`: SUCCESS.
- #245 on `e7abb01...`: FAILURE because the old browser flow did not yet select the new inference self-comparison before advancing.
- The browser fixture was updated after that failure.
- No GitHub Actions run has yet appeared for the latest post-fix HEADs, so CI_VERIFIED must remain NOT CLAIMED for the latest HEAD until a matching run exists.

## Next implementation frontier
1. Parent explanation projection from the same truth-gated data, without creating a separate source of truth.
2. Extend transferable inference from English into Korean/Hanja using language-specific decomposition.
3. Use inference evidence to choose optional assistance order, while never contaminating recall score.
4. Full CI when GitHub emits a run for the latest HEAD.
5. No device/Netlify/merge until frozen candidate + TAKY gate.
