# HIDE & SEEK — HANDOFF — 2026-09-21 LATEST

## Resume command
Use latest TAKY governance. Read:
- `C2S/HIDE_LANGUAGE_MEMORY_C2S_CLOSURE_2026-09-21.md`
- this handoff
Then inspect the latest branch HEAD and CI before editing.

Repository: `hns140412-glitch/Hide-Seek`
Branch: `implementation/hide-seek-capture-session-v02`
PR #4: DRAFT / HOLD / DO NOT MERGE
Do not deploy or call Netlify.

## Current product direction
Hide & Seek is a **Language Memory & Meaning Engine**.

The core learner value is:
**word structure / root / etymology → concept → visual scene → inference → memorization → retrieval → cumulative Memory Ladder**

The user explicitly wants root/etymology structure to be easy to visualize because:
- a child can infer unfamiliar words,
- the process is fun,
- a parent can explain it easily.

Do not reduce this to a static infographic or ordinary vocabulary cards.

## Real routine / evidence
Observed current cycle:
- Monday, Wednesday, Friday are independent vocabulary learn/test cycles.
- Current observed composition: NEW 12 + REVIEW 24.
- Uploaded sheet = parent-child morning mock test, not source print.
- Source print formats can vary.
- Never infer NEW/REVIEW from left/right page position.

Current real NEW 12 fixture:
`environment, rainforest, mountain, planet, desert, ocean, island, jungle, glacier, earthquake, climate, harvest`

## Locked learning flow
`variable print capture → review → NEW/REVIEW → MEMORIZATION → FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → morning test / later review → cumulative Memory Ladder`

FIRST FIND = first unassisted retrieval after memorization.
Exposure does not count as recall.

## Language model
Shared engine:
`decompose when valid → connect meaning → visualize → retrieve`

Language-specific interpretation:
- English: prefix/root/suffix/compound/context
- Korean: etymology/affix/Hanja origin/semantic/context
- Hanja: radical/component/sound/meaning/compound context

Historical etymology must be verified.
Transparent morphology or mnemonic support must be labeled separately.

## Current implementation state
Current branch HEAD at handoff refresh:
`88731750f3491422518e84959042e088b3b2cc78`

Current implementation now includes:
- verified language evidence extracted to `hide-language-evidence.js` with schema validation / fail-closed behavior,
- language-domain-isolated inference adaptation,
- LOW / EMERGING / ESTABLISHED evidence maturity,
- current-word applicability gating for adaptive clues,
- language-specific clue taxonomies,
- Korean/Hanja thinking-first verified meaning maps,
- language-aware parent explanations,
- progressive verified root reveal,
- progressive semantic scene reveal with child-facing Korean labels,
- explicit support provenance for root/scene reveals,
- self-report naming via `selfReportedFitRate` / `evidenceBasis='LEARNER_SELF_REPORT'`,
- adaptive FINAL SEEK hint provenance and current-word applicability gate,
- NEW-word duplicate meaning-map bypass removed,
- real NEW12 + REVIEW24 browser regression coverage extended.

Status claims:
- CODED = YES for the above current branch implementation.
- CI_VERIFIED = check the matching latest HEAD run live; do not inherit any older PASS.
- BROWSER_RUNTIME_VERIFIED = only if the matching latest HEAD browser run passes.
- LIVE_OCR = NOT VERIFIED.
- REAL_DEVICE = NOT VERIFIED.
- DEPLOYED = NO.

## Immediate next task
Continue pre-deploy implementation, not deployment.

Priority:
1. Close latest-head CI only when the exact HEAD has a matching run.
2. Continue implementation gaps in Memory Ladder / retrieval / learning interaction.
3. Keep adaptive inference descriptive until ESTABLISHED and applicable to the current word.
4. Preserve self-report vs objective recall separation.
5. Expand language-specific behavior without forcing English morphology onto Korean/Hanja.
6. Keep C2S delta and this handoff synchronized after substantial implementation.

Do not:
- fabricate etymology,
- expose an entire word family as a memorization list,
- hard-code 12/24 globally,
- treat mock-test page layout as source authority,
- count exposure as recall,
- use the user as tester/debugger,
- call Netlify,
- deploy,
- merge PR #4 without explicit approval.

## Next-chat instruction
“최신 TAKY 기준으로 Hide & Seek를 재개해. GitHub의 C2S/HIDE_LANGUAGE_MEMORY_C2S_CLOSURE_2026-09-21.md와 HANDOFF/HIDE_SEEK_HANDOFF_2026-09-21_LATEST.md를 먼저 읽고, implementation/hide-seek-capture-session-v02 최신 HEAD와 CI를 확인해. 신규 12개 실제 fixture를 유지하면서 검증된 어원·어근 시각화 엔진과 처음 본 단어 추론 인터랙션부터 이어서 구현해. 사용자 테스트 금지, Netlify/배포/merge 금지.”


## 2026-09-21 implementation continuation
Read additionally:
- `C2S/HIDE_LANGUAGE_MEMORY_IMPLEMENTATION_DELTA_2026-09-21.md`

Implemented after the original handoff:
- truth-gated verified etymology/root paths expanded across the real NEW 12,
- first-seen prediction + clue + confidence capture,
- learner self-comparison after meaning reveal,
- inference evidence isolated from recall score,
- cumulative cross-mission transferable inference summary,
- optional reuse of the learner's historically effective clue,
- semantic-scene visual trails where historical decomposition would be misleading.

Important truth boundary:
- learner MATCH/NEAR/MISS is self-report, not objective correctness,
- ocean stays semantic-scene support because deeper origin is uncertain,
- rainforest stays transparent compound support.

Latest branch state must be checked live before work resumes. Do not reuse the old #229/#244 result as proof for a newer HEAD.


## Language Memory ownership lock
- Language Memory != homework / assignment / Hanja grade.
- Ready Learning Engine owns homework interpretation, Learning Unit, and Hanja grade/level resolution.
- Hide consumes resolved `learningContext` only.
- Hide owns cumulative language-memory evidence and within-session Memory Ladder adaptation only; it emits review-need signals but does not schedule review dates.
- Do not add independent Hanja-grade inference back into Hide.


## Final handoff checkpoint
- Exact HEAD: `88731750f3491422518e84959042e088b3b2cc78`
- CI: Validate Hide & Seek #333 = SUCCESS.
- Language Memory ownership is locked:
  - Ready owns homework / Learning Unit / Hanja level.
  - Hide consumes resolved `learningContext`.
  - Hide owns cumulative memory evidence and Memory Ladder state; Ready Learning Engine interprets review need and Ready & Set Planner schedules it.
- Do not reintroduce independent Hanja-grade inference into Hide.
- Continue pre-deploy implementation only.


## Long-term review ownership correction
- Hide does **not** own review dates, long-term review cadence, or calendar allocation.
- Hide owns memory evidence and advisory signals only, including memory strength, confusion, assisted/unassisted recall, spaced-recall evidence, recovery state, and next-review priority.
- Ready Learning Engine interprets those signals into subject/review policy.
- Ready & Set Planner owns actual scheduling and rescheduling through dated TODOs, free-window allocation, carry-over, and planner constraints.
- Canonical loop: `Hide memory evidence -> Ready learning/review policy -> Ready & Set Planner schedule -> future Hide retrieval -> new memory evidence`.
- A Hide-side `nextReviewPriority` is a priority signal, never a date/time schedule.


## Planner-owned review activation lock
- `nextReviewPriority` = advisory signal only; never a schedule or permission for Hide to start a future review by itself.
- Hide must not autonomously pick a past word for review from its priority ranking.
- Future/past-memory review activation requires explicit `review_directive` from the Ready chain:
  - review policy owner: `READY_LEARNING_ENGINE`
  - schedule owner: `READY_SET_PLANNER`
  - target: explicit lexical IDs
- Hide executes retrieval and returns new memory evidence; it does not choose the review date.


## Memory advisory handoff contract
Hide exports `reviewAdvisories` as evidence, not a schedule. The packet may include memory strength, weakness dimensions, confusion, latency, hint dependence, recovery state, spaced-recall evidence and `nextReviewPriority`. Ready Learning Engine interprets the packet, and Ready & Set Planner decides when/where a review becomes a dated task.


## Resolved context correlation lock
- Word-level normalized state now preserves the semantic-light Ready-resolved `learningContext`; the prior discard bug is fixed.
- `reviewAdvisories[].learningContextRef` may correlate Hide memory evidence to Ready context IDs/unit/range and upstream-resolved Hanja level metadata.
- This is correlation only. Hide must not infer grade/range, identity/role, review policy, or schedule from the context.


## Hanja evidence separation lock
- Hanja memory evidence is separated into FORM / SOUND / MEANING / RECALL / WRITE_OR_RECONSTRUCT.
- FIRST FIND, MEANING CLUE and FINAL SEEK emit axis-specific evidence.
- SOUND replay remains exposure evidence only unless an actual sound-recall interaction exists.
- Ready Learning Engine may interpret these evidence axes; Hide does not infer grade/range or schedule review.


## Korean evidence separation lock
- Korean memory evidence axes are CONTEXT / MEANING / EVIDENCE / RECALL / EXPRESSION.
- Context exposure is not objective context recall.
- Word-meaning association is not source-text evidence selection.
- EVIDENCE must remain unearned until a real evidence-selection/justification interaction exists.
- Hide collects memory evidence only; Ready owns higher-level Korean learning policy and Planner owns scheduling.


## Korean verified EVIDENCE TRAIL lock
- Hide may earn Korean EVIDENCE only from explicit interaction with verified `contextEvidence`.
- `contextEvidence` must fail closed unless source/context/evidence/candidates satisfy the canonical truth gate.
- MEANING CLUE may hand off to EVIDENCE TRAIL for eligible Korean items.
- Evidence selection records EVIDENCE + MEANING objective evidence.
- Do not convert context exposure or evidence selection into objective CONTEXT recall.
- Hide remains a memory-evidence specialist; this is not a full Korean reading-comprehension engine.


## Ready OCR reuse lock
- Ready owns the shared family capture/OCR transport foundation.
- Hide reuses the same `/api/capture/analyze` + TAKY vision-ingest boundary and must not duplicate the OCR engine.
- Hide adds only HIDE_VOCABULARY domain semantics and vocabulary review/evidence normalization.
- Implementation reporting must separate shared OCR foundation implementation from live-provider and device verification.


## Ready ↔ Hide memory review roundtrip
- Ready branch `integration/hide-memory-review-roundtrip-v01`, draft PR #100.
- Canonical flow is now implemented branch-side:
  `Hide evidence -> Ready review policy -> Planner confirmed-window dated TODO -> review directive -> Hide retrieval -> new evidence`.
- Ready review-policy decision contains no schedule date.
- Planner fails closed without confirmed availability.
- Hide must continue to activate old-memory retrieval only from `EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE`.
- Initial Ready integration/Runtime/Planner/TAKY CI all passed. No merge or deployment.


## Session-level review roundtrip
- Ready PR #100 now launches Hide with the exact Planner-created review directive.
- Hide return memorySummary is validated and preserved in the Ready session task result.
- Session wrap-up carries Hide specialistResult together with Planner outcome.
- Keep Hide scheduling authority at zero; Ready Learning Engine owns policy and Planner owns dates/TODOs.


## Evidence truth-boundary lock
- Do not equate objective correctness with recall.
- Use `objectiveVerified` for checkable recognition/association/evidence-selection.
- Use `objectiveRecall` only for actual retrieval/reconstruction.
- Memory summaries expose both counters and evidence modes.


## Learning App Family integration delta — 2026-09-21

Integration branch:
- `taky/learning-app-family-hide-context-v3-2026-09-21`
- exact verified integration SHA: `5ff6a4a4e6b65588acf4c8da503411320365b900`
- based on the then-latest active Hide head; active product development remains separate.

Implemented:
- consumes `READY_LEARNING_CONTEXT_V1` from Ready.
- requires learning_unit_id / analysis_id / assignment_id and central contract version.
- rejects role/permission/Planner authority/family identity/Hanja-grade authority fields.
- projects only a resolved context marked `resolvedBy = READY_LEARNING_ENGINE`.
- Language Memory consumes the resolved projection.
- Hide remains owner of Memory Ladder and cumulative language-memory evidence only.
- Hanja grade/level resolution, review policy and scheduling remain outside Hide.
- validated Ready context is preserved through Hide -> Snap handoff.

Verification:
- Validate Hide & Seek run `35585463113`: SUCCESS.
- consumer boundary: PASS.
- JavaScript syntax: PASS.
- shared runtime: PASS.
- browser product flows: PASS.
- central TAKY cross-app contract with exact SHA: PASS.
- CODED=YES / CI_VERIFIED=YES / RUNTIME_VERIFIED=YES for Hide integration scope.
- DEVICE_VERIFIED=NO / PRODUCTION_VERIFIED=NO.
- Netlify/deploy/merge=NOT_RUN.

Do not replace the active Hide product branch with this integration history. Re-check live HEAD and carry this capability forward by delta if active development advances.
