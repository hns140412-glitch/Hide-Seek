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


## Additional implementation continuation
- Parent explanation is now derived from the same canonical truth-gated language evidence.
  - PARENT / PARENT_CHILD context only.
  - No second explanation database.
  - Verified paths explain the verified center/history; semantic-only paths explicitly say not to force etymology.
- Thinking-first exploration is no longer English-starter-only at the language-engine layer.
  - A verified Korean or Hanja `meaningMap` can enter `VERIFIED_MEANING_MAP` exploration.
  - Generic verified meaning maps are labeled `검증 의미 구조`, not `검증 어원` unless historical etymology is actually established.
- Externally checked NEW-12 truth gate was expanded:
  - verified/history-supported: environment, mountain, planet, desert, island, jungle, glacier, earthquake, climate, harvest
  - transparent morphology: rainforest
  - semantic scene / no fabricated deeper root: ocean

Latest code HEAD before this delta refresh: `80b002b18a81ec324a990fbec9dd6cef7e61201e`.
GitHub Actions note: no new run has been emitted for post-#245 synchronize commits yet. Therefore the latest HEAD remains CODED but not CI_VERIFIED until a matching run exists.


## Adaptive assistance + progressive exploration delta
- Transferable inference evidence may reorder existing Memory Ladder help, but it may not invent unavailable help.
- Adaptive reuse requires repeated evidence: at least 2 assessed outcomes for the same clue with >=50% self-reported MATCH/NEAR.
- One self-report remains descriptive only and cannot become an adaptive learner preference.
- Adaptive hint provenance is stored as `TRANSFERABLE_INFERENCE_HISTORY` with `objectiveVerified=false`; recall scoring remains independent.
- Strong assistance remains terminal: `FRAGMENT → MINIMUM_REVEAL` is not promoted by inference preference.
- Added browser coverage for verified Korean/Hanja thinking-first maps.
- Verified root/etymology maps now reveal progressively: center concept first, then one verified node at a time. Progressive reveals are assistance evidence with `recallScoreImpact=false`.

Latest observed branch HEAD for this delta: `31290116a6bedc4f8b38e7469bb77cbb58870d40`.
GitHub Actions still has not emitted a run for post-#245 synchronize commits. Latest-head CI remains NOT CLAIMED.


## Language-domain isolation + clue applicability delta
- Transferable inference is cumulative, but adaptive preference is now scoped by `languageDomain`.
  - ENGLISH history cannot personalize KOREAN or HANJA assistance.
  - KOREAN and HANJA remain separate even when both use verified character/meaning maps.
- New inference traces persist `languageDomain`; older traces are attributed from their owning lexical item during aggregation.
- Clue UI is language-specific:
  - ENGLISH: WORD_PART / ROOT_ETYMOLOGY / SCENE / PRIOR_WORD / OTHER
  - KOREAN: AFFIX / HANJA_ORIGIN / ETYMOLOGY / SCENE / PRIOR_WORD / OTHER
  - HANJA: COMPONENT / RADICAL / SOUND / SCENE / PRIOR_WORD / OTHER
- Adaptive clue display is also word-specific. A historically useful clue is only surfaced when the current plan actually supports it.
  - Example: prior ENGLISH ROOT_ETYMOLOGY preference does not appear for `ocean`, because current truth-gate support is semantic-scene only.
- Verified structure is distinguished from verified etymology.
  - `earthquake` remains a source-verified transparent compound and renders as `검증 구조`, not `검증 어원`.
- Records keep overall descriptive inference counts, but adaptive-clue projection is displayed separately for English / Korean / Hanja.

Latest observed code HEAD before this delta refresh: `0d86f3486843e1aafd0b6e6774cd90e92bce083b`.
Latest-head GitHub Actions run: still not emitted; CI_VERIFIED remains NOT CLAIMED for the current HEAD.
