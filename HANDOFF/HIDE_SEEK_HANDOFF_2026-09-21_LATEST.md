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
Latest observed branch HEAD at handoff creation:
`b51172dcc52f9c11c456cb1bc9fb979e8aaaf7f3`

Latest observed CI:
Validate Hide & Seek run #229 = SUCCESS.

Important implemented pieces:
- Language core v2
- starter thinking plans for the real NEW 12
- thinking-first NEW-word memorization UI
- dynamic encountered-word links using prior lexicon + current mission
- THINKING_SCENE support in Memory Ladder
- morning mock-test evidence
- NEW/REVIEW separation
- FIRST FIND retrieval semantics
- real 12+24 browser scenario and regression guards

Status claims:
- CODED = YES for above
- CI_VERIFIED = YES at latest observed HEAD
- BROWSER_RUNTIME_VERIFIED = YES
- LIVE_OCR = NOT VERIFIED
- REAL_DEVICE = NOT VERIFIED
- DEPLOYED = NO

## Immediate next task
Continue implementation, not documentation-only work.

Priority:
1. Build a **verified root/etymology data contract**.
2. For each word, choose:
   - VERIFIED_ROOT / VERIFIED_ETYMOLOGY
   - TRANSPARENT_COMPOUND
   - SEMANTIC_SCENE
   - MNEMONIC_BRIDGE
3. Build the interactive visual grammar:
   - center root/concept,
   - word parts,
   - semantic arrows,
   - one strong mental scene,
   - current target highlighted,
   - prior encountered words only as optional reconnects.
4. Add learner prediction before meaning reveal.
5. Record prediction/clue/confidence separately from recall score.
6. Re-run focused tests, then full CI.

Do not:
- fabricate etymology,
- expose an entire word family as a memorization list,
- hard-code 12/24 globally,
- treat mock-test page layout as source authority,
- count exposure as recall,
- use the user as tester/debugger,
- deploy/merge without approval.

## Next-chat instruction
“최신 TAKY 기준으로 Hide & Seek를 재개해. GitHub의 C2S/HIDE_LANGUAGE_MEMORY_C2S_CLOSURE_2026-09-21.md와 HANDOFF/HIDE_SEEK_HANDOFF_2026-09-21_LATEST.md를 먼저 읽고, implementation/hide-seek-capture-session-v02 최신 HEAD와 CI를 확인해. 신규 12개 실제 fixture를 유지하면서 검증된 어원·어근 시각화 엔진과 처음 본 단어 추론 인터랙션부터 이어서 구현해. 사용자 테스트 금지, Netlify/배포/merge 금지.”
