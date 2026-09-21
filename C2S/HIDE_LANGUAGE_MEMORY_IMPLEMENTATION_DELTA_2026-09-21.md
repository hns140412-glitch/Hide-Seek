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
- Inference evidence maturity is explicitly separated:
  - LOW: descriptive only.
  - EMERGING: a clue may be shown as “관찰 중” after at least 2 assessed attempts for that clue with >=50% self-reported MATCH/NEAR, but it **must not reorder Memory Ladder assistance**.
  - ESTABLISHED: only after at least 6 assessed outcomes in that language domain, with the candidate clue observed at least 3 times and >=60% self-reported MATCH/NEAR, may it reorder **existing** assistance.
- One self-report never becomes an adaptive learner preference, and EMERGING evidence is not treated as established personalization.
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


## Evidence-contract extraction + inference hardening delta
- Verified lexical evidence is no longer embedded inside `hide-language-model.js`.
- New canonical runtime asset: `hide-language-evidence.js`.
  - `VERSION = 2026.09.21-evidence-v1`
  - `SCHEMA_VERSION = 1`
  - source policy = `VERIFIED_SOURCE_REQUIRED_FOR_HISTORICAL_CLAIM`
  - invalid records fail closed through `invalidRecords`.
- `hide-language-model.js` now consumes `window.HideLanguageEvidence`; if schema is missing/mismatched or any record is invalid, verified evidence returns empty rather than guessing.
- Index script order is locked: evidence asset before language model.
- Service worker cache advanced to `hide-seek-capture-v12` and includes the evidence asset.
- CI syntax check and runtime contract now include the evidence asset.

### Inference hardening
- Inference aggregation/personalization remains cumulative but is isolated by language domain.
- Language-specific clue taxonomies are enforced for English / Korean / Hanja.
- Current-word applicability gates adaptive clue reuse; a prior root preference cannot appear on a word whose current plan has no reliable root path.
- Evidence levels are separated:
  - LOW: descriptive only
  - EMERGING: visible as an observation; does not reorder Memory Ladder
  - ESTABLISHED: may reorder existing assistance only
- ESTABLISHED adaptation requires at least 6 assessed outcomes overall and the candidate clue to have at least 3 attempts with >=60% learner self-reported MATCH/NEAR.
- Strong assistance (`FRAGMENT`, `MINIMUM_REVEAL`) remains terminal.

### Truth/provenance corrections
- Verified support logs are no longer collapsed into `VERIFIED_ETYMOLOGY_MAP`.
  - historical etymology -> `VERIFIED_ETYMOLOGY_MAP`
  - verified transparent structure -> `VERIFIED_STRUCTURE_MAP`
  - verified Korean/Hanja meaning structure -> `VERIFIED_MEANING_MAP`
- Progressive root reveals now persist language domain, support type, source, sourceRef, historical-claim flag, and `recallScoreImpact=false`.
- `earthquake` is explicitly `검증 구조`, not `검증 어원`.
- NEW words with verified meaning maps no longer expose a duplicate `뜻 연결 더 보기` route before inference; thinking-first is the single answer-reveal path.

Latest-head CI note must still be checked live. No Netlify / deploy / merge / user testing is authorized.


## TAKY shared-runtime base synchronization — 2026-09-21
- Root cause of the missing post-#245 PR workflows was identified as PR #4 being `mergeable_state=dirty`: the working branch had diverged behind main while TAKY shared-runtime mechanisms landed on main.
- Main shared capabilities were integrated into the working branch without reverting Hide's current semantic owners:
  - `CAP-RELEASE-COMPAT-001`
  - `CAP-PWA-UPDATE-001`
  - `CAP-EVENT-ENVELOPE-001`
  - `CAP-OCR-INGEST-001`
  - `CAP-HTTP-ADAPTER-001`
- Shared mechanisms remain semantic-light:
  - TAKY owns release/PWA state mechanics, immutable event envelope, vision evidence mechanics, and HTTP transport.
  - Hide retains learning/session/capture semantics, safe-point rules, vocabulary OCR domain/pairing/review semantics, language evidence, and Memory Ladder semantics.
- Branch release descriptor was preserved at current product state:
  - app revision = `REV_09`
  - data schema = `9`
  - runtime = `2026.09.21-c`
  - release id = `hide-seek-rev09-r1`
- Family OCR remains the canonical OCR owner. Vision-ingest and HTTP transport were integrated **inside** `hide-family-ocr-adapter.js`; obsolete main-side direct Gemini OCR ownership was not restored.
- Duplicate bridge-owned service-worker update machinery was removed; Hide exposes its safe-point semantic through `HideSeekPwaSafePoint`, while the shared PWA adapter owns registration/update mechanics.
- A branch-only two-parent base synchronization commit was created with the existing working-branch tree and latest main as parents. This did **not** merge PR #4 to main.
- After that sync, compare state became `behind=0` and PR #4 became `mergeable=true`; Actions resumed with run #253.
- Run #253 passed product identity and runtime-contract guards, then failed in the standalone Memory behavior fixture because that harness did not provide the newly required inference helper dependencies. The harness was updated; this was a fixture dependency failure, not evidence of a runtime product regression.


## CI closure repair delta
- GitHub Actions resumed for the branch and browser failures were reduced from 5 to 2, then isolated to two concrete causes.
- OCR/capture browser fixtures were corrected to obey shared vision provenance instead of bypassing evidence validation.
- Progressive root visibility is now enforced by CSS: hidden nodes remain hidden until explicitly revealed.
- Inference outcome binding was refactored into `bindInferenceOutcomeButtons(w)` using native `document.querySelectorAll('.inference-outcome-btn')` to avoid single-element selector misuse and storage-time `$$` normalization.
- The real NEW12 browser fixture now targets the actual thinking path container (`.thinking-why`) instead of a non-existent legacy class.
- Current source cross-check confirms:
  - native multi-button outcome binder present and called,
  - progressive hidden-node gate present,
  - thinking-path assertion aligned to rendered DOM.
- Latest head still requires a matching Actions run before CI_VERIFIED can be claimed.


## Progressive scene trail delta
- Child-facing semantic scene trails now preserve stable machine IDs while rendering Korean mental-image labels.
- Scene trails are progressive rather than fully exposed at once:
  - first beat visible,
  - later beats hidden,
  - learner reveals each next beat with `다음 장면 이어보기`,
  - completion state becomes `장면 연결 완료`.
- Each reveal logs `SCENE_PROGRESSIVE_REVEAL` with beat index, beat ID, language domain, support type, source/sourceRef, and `recallScoreImpact=false`.
- Real NEW12 browser coverage verifies mountain as GROUND -> RISE -> PEAK while the child sees `평평한 땅 -> 위로 솟기 -> 높은 꼭대기`.


## Verified multilingual meaning-map truth gate delta
- Item-level Korean/Hanja `meaningMap` can no longer become verified from `verified:true` alone.
- A verified meaning map now requires:
  - explicit verification state,
  - non-empty `sourceType`,
  - non-empty `sourceRef`,
  - at least one valid meaning/component node,
  - non-empty `coreMeaning`.
- Missing provenance or incomplete structure fails closed to no verified map rather than rendering `검증 의미 구조`.
- Browser fixtures use explicit test provenance; production semantics remain responsible for real source references.
- This closes the path where Korean/Hanja structure could be presented as verified without traceable evidence.


## Dynamic mission composition correction
- Removed the runtime assumption that every mission is NEW 12 + REVIEW 24.
- The observed 12/24 routine remains evidence/test context only; it is not a product quota.
- Capture review UI now states that print composition may vary and that role is determined from confirmed role/history rather than page position.
- Committed mission metadata now stores:
  - `observedNew`,
  - `observedReview`,
  - `classificationSource='ROLE_CONFIRMATION_OR_HISTORY'`,
  - `layoutIndependent=true`.
- `expectedNew:12` / `expectedReview:24` are forbidden in runtime contract.
- Browser capture-to-mission regression verifies observed counts sum to the actual valid-word count and no expected 12/24 quota is persisted.


## Mission-role provenance + truth-gate hardening delta
- Mission role inference is explicitly layout-independent.
  - sourceColumn / sourceRowIndex / sourceColumnIndex may preserve reading order only.
  - They are forbidden inputs to `inferMissionRole`.
- Mission-role provenance is now separated:
  - `EXPLICIT_OCR_ROLE` / `EXPLICIT_SOURCE_ROLE`
  - `LEARNER_HISTORY_INFERENCE`
  - `FIRST_ENCOUNTER_INFERENCE`
  - `MISSION_REVIEW_CONFIRMATION`
- OCR adapter now preserves canonical explicit NEW/REVIEW role evidence and discards noncanonical role labels.
- Review UI shows the current role provenance and a review-screen correction becomes `MISSION_REVIEW_CONFIRMATION`, which persists through commit.
- Dynamic mission composition persists observed NEW/REVIEW counts only; no global 12/24 quota is stored.
- Fail-closed meaning-map normalization was strengthened:
  - if the language model rejects a raw meaningMap, `normalizeWord` may not resurrect the original raw map.
  - generic verified meaning maps require sourceType, sourceRef, coreMeaning and valid nodes.
  - generic meaning maps cannot escalate themselves into historical etymology even if the input claims it.
- Adaptive Memory Ladder personalization now re-checks clue applicability against the current word before reordering help.


## Exact-head CI closure checkpoint
- Exact branch HEAD `5a0867a0d625bd55c06440f63f8c6ae0797a1210` completed Validate Hide & Seek run #298 with SUCCESS.
- Passed in the matching run:
  - product identity guard,
  - runtime contracts,
  - Memory Trail behavior fixtures,
  - Family OCR adapter fixtures,
  - language memory model fixtures,
  - JavaScript syntax,
  - TAKY shared runtime contract,
  - browser product flows (all configured browser tests).
- This establishes CI_VERIFIED for that exact SHA only.
- No Netlify call, deployment, merge, or real-device verification is implied by this checkpoint.


## Ready Learning Engine basis for Language Memory
- Language Memory does not define an independent school-subject pedagogy stack.
- Korean and Hanja memory behavior is grounded in the existing Ready & Set Learning Engine / Subject Master profiles.
- Basis snapshot used by Hide:
  - Ready Learning Master `0.5.1`
  - Ready Subject Master `0.2.1`
  - Ready Learning Reference `0.3.0`
- New adapter: `hide-learning-basis-v01.js`.
- Korean basis:
  - subject = `국어`
  - method = `READ_UNDERSTAND_EVIDENCE_RESPOND`
  - Ready loop = `READ_OR_LISTEN -> UNDERSTAND -> FIND_EVIDENCE -> RESPOND_OR_EXPRESS -> REVIEW`
  - Hide projection = form/context -> meaning -> evidence -> recall -> response -> review.
- Hanja basis:
  - subject = `한자`
  - method = `FORM_SOUND_MEANING_RECALL`
  - Ready loop = `ENCODE -> RECALL -> CHECK -> RETRY`
  - Hide projection = form + sound + meaning encoding -> recall -> check -> retry/reconstruct.
- English keeps the existing Hide word-structure / inference specialist path while referencing the Ready English learning profile for the higher-level learning loop.
- Memory Ladder now reorders only existing assistance through the learning-basis profile; it does not invent assistance unavailable for the current word.
- Ready and Hide remain sibling products. No user/family/org identity, role, or permission model is shared through this adapter.


## Homework / Learning Context / Language Memory ownership correction
- Language Memory is **not** homework, assignment range, or Hanja grade itself.
- Ready Learning Engine owns:
  - assignment / homework interpretation,
  - learning-unit construction,
  - Hanja grade/level resolution when a verified scheme/source is available,
  - unit/range/progression context,
  - subject-level review flow.
- Hide & Seek consumes only the resolved `learningContext` and does not infer or own Hanja grade classification.
- Hide Language Memory owns cumulative learner memory evidence:
  - form / sound / meaning memory,
  - confusion relationships,
  - assisted vs unassisted recall,
  - writing/reconstruction evidence when available,
  - retrieval latency / hint dependence / recovery,
  - spaced-recall / retention evidence and Memory Ladder state; scheduling remains outside Hide.
- Homework and Hanja grade are contextual inputs that may shape a session; they are not themselves Language Memory.
- Ready and Hide remain sibling products; this handoff shares semantic-light learning context only, not identity/role/permission ownership.


## Long-term review ownership correction
- Hide does **not** own review dates, long-term review cadence, or calendar allocation.
- Hide owns memory evidence and advisory signals only, including memory strength, confusion, assisted/unassisted recall, spaced-recall evidence, recovery state, and next-review priority.
- Ready Learning Engine interprets those signals into subject/review policy.
- Ready & Set Planner owns actual scheduling and rescheduling through dated TODOs, free-window allocation, carry-over, and planner constraints.
- Canonical loop: `Hide memory evidence -> Ready learning/review policy -> Ready Planner schedule -> future Hide retrieval -> new memory evidence`.
- A Hide-side `nextReviewPriority` is a priority signal, never a date/time schedule.
