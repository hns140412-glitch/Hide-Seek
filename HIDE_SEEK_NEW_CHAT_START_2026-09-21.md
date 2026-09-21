# HIDE & SEEK — NEW CHAT START — 2026-09-21

최신 TAKY 기준으로 Hide & Seek를 재개해.

먼저 GitHub에서 아래 파일을 읽고 현재 상태를 복원해.
- `C2S/HIDE_LANGUAGE_MEMORY_C2S_CLOSURE_2026-09-21.md`
- `C2S/HIDE_LANGUAGE_MEMORY_IMPLEMENTATION_DELTA_2026-09-21.md`
- `HANDOFF/HIDE_SEEK_HANDOFF_2026-09-21_LATEST.md`

Repository:
- `hns140412-glitch/Hide-Seek`

Branch:
- `implementation/hide-seek-capture-session-v02`

PR:
- #4
- OPEN / DRAFT / HOLD / DO NOT MERGE

Last CI-verified implementation checkpoint before handoff refresh:
- HEAD `88731750f3491422518e84959042e088b3b2cc78`
- Validate Hide & Seek #333 = SUCCESS

Important ownership locks:
1. Language Memory != homework / assignment / Hanja grade.
2. Ready Learning Engine owns:
   - homework / assignment interpretation,
   - Learning Unit construction,
   - Hanja grade/level resolution,
   - subject progression / range / review context.
3. Hide consumes resolved `learningContext` only.
4. Hide must not independently infer Hanja grade/level.
5. Hide owns cumulative language-memory evidence:
   - form / sound / meaning,
   - confusion,
   - assisted vs unassisted recall,
   - writing/reconstruction evidence when available,
   - latency / hint dependence / recovery,
   - spaced-recall evidence / retention evidence,
   - Memory Ladder.
6. Ready and Hide remain sibling products. Do not share identity/role/permission ownership through the learning-basis adapter.

Learning basis currently referenced:
- Ready Learning Master 0.5.1
- Ready Subject Master 0.2.1
- Ready Learning Reference 0.3.0
- Korean basis: 국어 / READ_UNDERSTAND_EVIDENCE_RESPOND
- Hanja basis: 한자 / FORM_SOUND_MEANING_RECALL / ENCODE -> RECALL -> CHECK -> RETRY

Locked Hide learning flow:
`variable print capture → review → NEW/REVIEW → MEMORIZATION → FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → morning test/later review → cumulative Memory Ladder`

Critical semantics:
- MEMORIZATION_EXPOSURE != RECALL_SUCCESS
- FIRST FIND = first unassisted retrieval after memorization
- assisted success != independent recall
- same-day recovery != spaced recovery
- mission pass != stable long-term memory
- NEW/REVIEW is not inferred from page position
- observed NEW12 + REVIEW24 is evidence/fixture only, never a global quota
- historical etymology must be truth-gated
- self-reported inference fit is not objective recall correctness
- adaptive inference must be ESTABLISHED and applicable to the current word before reordering existing assistance

Current implementation highlights:
- verified evidence contract and fail-closed truth gate
- progressive root/meaning reveal
- progressive semantic scene reveal
- child-facing Korean scene labels with stable internal IDs
- language-specific parent explanation modes
- Korean/Hanja verified meaning-map provenance gate
- multilingual FIRST FIND / MEANING CLUE / FINAL SEEK
- current-word adaptive applicability
- dynamic mission composition
- Memory Ladder with cumulative memory evidence
- Ready learning-basis adapter loaded and cached

Next work:
- Continue pre-deploy implementation only.
- First read the three canonical files, then check the latest branch HEAD and exact matching CI.
- If the branch has advanced beyond the checkpoint, use the latest exact HEAD/CI rather than the old checkpoint.
- Continue implementation gaps in Korean/Hanja Language Memory using resolved `learningContext`, without duplicating Learning Engine ownership.
- Keep C2S and handoff synchronized after substantial changes.

Do not:
- use the user as tester/debugger,
- call Netlify,
- deploy,
- merge PR #4,
- fabricate etymology,
- add independent Hanja grade inference to Hide,
- hard-code 12/24,
- treat the mock-test layout as source authority.


## Long-term review ownership correction
- Hide does **not** own review dates, long-term review cadence, or calendar allocation.
- Hide owns memory evidence and advisory signals only, including memory strength, confusion, assisted/unassisted recall, spaced-recall evidence, recovery state, and next-review priority.
- Ready Learning Engine interprets those signals into subject/review policy.
- Ready & Set Planner owns actual scheduling and rescheduling through dated TODOs, free-window allocation, carry-over, and planner constraints.
- Canonical loop: `Hide memory evidence -> Ready learning/review policy -> Ready & Set Planner schedule -> future Hide retrieval -> new memory evidence`.
- A Hide-side `nextReviewPriority` is a priority signal, never a date/time schedule.


Planner-owned review activation:
- `nextReviewPriority` is advisory only.
- Do not let Hide autonomously choose a prior word and decide to review it now.
- A prior-memory review must come from an explicit `review_directive` owned by `READY_LEARNING_ENGINE` + `READY_SET_PLANNER`, with explicit lexical IDs.
- Hide performs the retrieval and emits new memory evidence; Ready/Planner own policy and timing.


Memory advisory packet:
- Hide may emit `reviewAdvisories` with memory-state evidence and advisory priority.
- Do not add dates/TODO/carry-over/reschedule ownership to Hide.
- Ready Learning Engine interprets; Ready & Set Planner schedules.


Resolved context persistence:
- Preserve only Ready-resolved semantic-light `learningContext` on normalized words.
- Correlate memory advisory evidence through `learningContextRef`.
- Never infer Hanja grade/range or scheduling inside Hide from that context.
