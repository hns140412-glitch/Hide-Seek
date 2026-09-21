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
`6c08a51812d13df6cc62aa2399c0282ceee3ff60`

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
- Hide owns cumulative language-memory evidence and Memory Ladder adaptation.
- Do not add independent Hanja-grade inference back into Hide.
