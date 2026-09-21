# HIDE & SEEK — C2S CLOSURE — 2026-09-21

## Scope
Recovered scope: the current conversation segment covering Hide & Seek vocabulary intake, NEW/REVIEW mission logic, parent-child morning mock test evidence, Memory Ladder semantics, multilingual language modeling, and the newly clarified root/etymology visualization direction.

TAKY C2S status:
- UNMAPPED_MATERIAL = 0 within recovered scope
- SILENT_LOSS = 0 within recovered scope
- FALSE_CONVERGENCE = 0
- CORRECTION_PROPAGATION = COMPLETE for the decisions listed below
- RELEASE / MERGE / DEPLOY = NOT APPROVED

## Canonical decisions

### D-001 Product identity
Hide & Seek is not an English-only vocabulary app.
It is a **Language Memory & Meaning Engine**.

Common engine:
`source → reviewed item → understand/structure → imagery → memorize → retrieve → reinforce → cumulative memory`

Language-specific interpreters:
- ENGLISH: prefix / root / suffix / compound / semantic bridge / context
- KOREAN: etymology when reliable / affix / Hanja origin when relevant / semantic relation / context
- HANJA: radical / component / sound / meaning / compound context

Do not force Korean or Hanja into an English-root model.

### D-002 Core learning value
The core is not simple word-to-meaning memorization.
The learner should be able to:
1. see a word,
2. inspect its structure when reliable,
3. connect root/etymology/word parts to a concept,
4. visualize the concept as a memorable scene,
5. infer unfamiliar words using the same concept,
6. retrieve again through the Memory Ladder.

Target experience:
**structure → concept → image → inference → retrieval**

The user explicitly values this because it:
- helps solve unfamiliar words,
- is fun,
- is easy for parent/teacher explanation.

### D-003 Visual model
Do not ship a fixed poster as the primary model.
Use a dynamic exploration template.

Desired visual grammar:
- a central semantic/root concept,
- connected word-part or related-word nodes,
- a short explanation of why the meaning forms,
- image/scene cues,
- current target emphasized,
- prior encountered words can reconnect,
- unseen related words must not become an extra memorization list.

Reference principle from the uploaded vocabulary-map example:
a shared semantic component in the center with radial connections that make meaning visually reconstructable.

### D-004 Etymology truth gate
Do not fabricate historical etymology.

Classify support explicitly:
- VERIFIED_ETYMLOGY / VERIFIED_ROOT
- TRANSPARENT_COMPOUND / MORPHOLOGY
- SEMANTIC_SCENE
- MNEMONIC_BRIDGE

A mnemonic or transparent modern decomposition must not be presented as historical etymology.
When reliable etymology is unavailable, fall back to morphology or semantic imagery.

### D-005 Actual routine
Observed current routine:
- Monday / Wednesday / Friday are independent vocabulary mission/test cycles.
- Current observed composition: NEW 12 + REVIEW 24.
- 12+24 is a current routine pattern, not a universal hard-coded quota.

The uploaded mock-test image is:
**PARENT_CHILD_MORNING_MOCK_TEST**, not the original learning print.

Correction:
- MOCK TEST != SOURCE PRINT
- PRINT POSITION != MISSION ROLE
- In that specific mock-test artifact, the NEW 12 happened to be on the left.
- Source learning prints may have different layouts.

### D-006 Current NEW 12 evidence set
Actual NEW 12 used for the real-flow fixture:
1. environment
2. rainforest
3. mountain
4. planet
5. desert
6. ocean
7. island
8. jungle
9. glacier
10. earthquake
11. climate
12. harvest

These are test/evidence data, not product hard-code.

### D-007 NEW / REVIEW semantics
Mission role belongs to learning history / explicit mission metadata, not page position.

Priority:
1. preserved explicit role,
2. learner lexical history,
3. review-screen correction.

A new mission must not reset cumulative lexical memory.

### D-008 Memorization vs retrieval
Locked flow:
`reviewed print → MEMORIZATION → FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → later review`

Critical:
- MEMORIZATION_EXPOSURE != RECALL_SUCCESS
- FIRST FIND = first unassisted retrieval after memorization
- seeing the word/meaning/example/root map does not count as recall success

### D-009 Memory Ladder
Mission = today's assigned word set.
Memory Ladder = cumulative per-word memory state across missions.

Rules:
- wrong answer does not automatically reset memory,
- assisted success != independent recall,
- immediate same-day recovery != spaced recovery,
- mission pass != stable long-term memory.

### D-010 Assistance
Help is always allowed and logged.

Examples:
- pronunciation,
- first-letter cue,
- meaning cue,
- semantic/root/etymology map,
- word-part cue,
- partial spelling.

Meaning/root map help is assisted evidence, not unassisted recall.

### D-011 Morning mock-test evidence
Supported outcomes:
- CORRECT
- CONFUSED
- WRONG
- ASSISTED_CORRECT
- RECOVERED_CORRECT

Provenance:
- source = MORNING_MOCK_TEST
- actor = PARENT_CHILD

This evidence informs Memory Ladder weakness/recovery but is not mislabeled as Hide FINAL SEEK evidence.

### D-012 Thinking-first exploration
NEW words should not immediately show the answer when a useful exploration plan exists.

Preferred sequence:
`word → thinking question → structure/scene cue → meaning reveal → memorize → FIRST FIND`

Current implementation already has starter exploration plans for the real NEW 12.
Transparent compounds such as rainforest and earthquake use word-part structure.
Other words use semantic scenes unless a reliable etymological/root analysis is available.

### D-013 Dynamic reconnection
Related-word connections should grow from:
- prior lexicon encounters,
- earlier items in the current mission.

Do not preload an entire word family as a new memorization burden.

## Correction ledger

### C-001
Old interpretation: Monday/Wednesday/Friday were progressive learning stages.
Correction: each day is an independent learn/test cycle.
Disposition: superseded.

### C-002
Old interpretation: uploaded sheet might be the source print.
Correction: it is a parent-child morning mock test.
Disposition: superseded and propagated.

### C-003
Old interpretation: left 12 could become a layout parser rule.
Correction: left placement is artifact-specific only.
Disposition: removed from role authority.

### C-004
Old FIRST FIND: initial exposure/acquisition.
Correction: FIRST FIND is first retrieval after memorization.
Disposition: implemented and guarded.

### C-005
Old product scope: English vocabulary.
Correction: language memory/meaning model spanning English, Korean, Hanja.
Disposition: architecture generalized.

### C-006
Old visual direction: static root-family poster.
Correction: thinking-first, dynamic, history-aware semantic/root exploration.
Disposition: starter dynamic exploration implemented; deeper verified etymology layer remains open.

## Implementation status

Repository: `hns140412-glitch/Hide-Seek`
Branch: `implementation/hide-seek-capture-session-v02`
PR: #4 — OPEN / DRAFT / HOLD / DO NOT MERGE
Latest observed HEAD at closure time: `b51172dcc52f9c11c456cb1bc9fb979e8aaaf7f3`
Latest workflow observed: Validate Hide & Seek run #229 — SUCCESS

Implemented / verified:
- variable print capture / review path
- mission-level NEW / REVIEW model
- observed NEW 12 + REVIEW 24 real fixture
- separate memorization stage
- FIRST FIND as retrieval
- Memory Trail / Memory Ladder evidence separation
- morning mock-test assessment evidence
- language memory model for English / Korean / Hanja
- verified meaning-map truth gate
- thinking-first starter exploration for the real NEW 12
- transparent compound support for rainforest / earthquake
- semantic-scene support for remaining starter words
- prior/current encountered-word dynamic links
- browser product-flow regression passing at latest observed HEAD

Not claimed:
- LIVE OCR provider verification
- real camera device verification
- production deployment
- Netlify verification
- PR merge

## Open implementation frontier

### F-001 Verified root/etymology data layer — HIGH PRIORITY
Current starter NEW-12 exploration is primarily semantic/morphological support.
Build a trustworthy data contract that distinguishes:
- verified historical etymology,
- verified reusable roots,
- transparent compounds,
- semantic scenes,
- mnemonic bridges.

### F-002 Root/etymology image grammar — HIGH PRIORITY
Build the exploration UI so a root/etymology concept becomes visually memorable:
- center concept/root,
- decomposed parts,
- semantic direction/arrows,
- one memorable scene,
- target word emphasized,
- previously encountered related words as optional reconnections.

The UI must support thinking, not merely display a finished infographic.

### F-003 First-seen-word inference
Add an interaction where the learner predicts meaning before answer reveal and records:
- predicted concept,
- clue used,
- confidence,
- final correction.
This should become evidence of transferable word-solving skill, separate from recall score.

### F-004 Multilingual extension
Apply the same engine with language-specific decomposition:
- Korean native/derived words,
- Sino-Korean vocabulary,
- Hanja component maps.
Do not assume English morphology semantics.

### F-005 Parent explanation mode
Create a concise explanation string/card:
- “이 단어는 [구조]라서 [핵심 뜻]이야.”
- or “이 단어는 [장면]을 떠올리면 쉬워.”
Useful for parent-child study without turning the parent into a debugger.

### F-006 Real intake / device verification
Only after the feature block is materially complete:
- live OCR provider,
- actual print photos,
- real device camera/PWA.
No Netlify/production call before frozen candidate + TAKY external-resource gate.

## Reverse reconstruction
A new chat can reconstruct the current product direction from this closure as:
1. Hide is a language memory/meaning engine.
2. Current real vocabulary routine is independent M/W/F cycles, observed 12 NEW + 24 REVIEW.
3. Source prints vary; mock-test layout is not role authority.
4. Child memorizes before Hide retrieval.
5. FIRST FIND is first retrieval.
6. Memory Ladder persists across missions.
7. Root/etymology/structure should become a fun visual concept system that helps infer unfamiliar words.
8. Dynamic thinking-first maps are preferred over static posters and extra word lists.
9. Truth-gated etymology is mandatory.
10. Next implementation focus is the verified root/etymology visual engine and transferable inference interaction.

## Closure
C2S_COMPILE_CLOSED = YES
REFLECTION_COMPLETE = YES for recovered scope
IMPLEMENTATION_COMPLETE = NO
CI_VERIFIED = YES for latest observed HEAD
RUNTIME_VERIFIED = browser flow only
DEVICE_VERIFIED = NO
DEPLOYED = NO
