# Hide & Seek Function Specification — REV_08 WORLD MIGRATION

Status: FUNCTION SPEC APPROVED FOR CURRENT HIDE & SEEK BASELINE
Master: `Hide_Seek_UI_MASTER_LOGIC_REV_04.md`
Learning trace standard: `docs/MEMORY_TRACE_STANDARD_REV_01.md`

## 1. Onboarding / User Profile

Entry: first launch or explicit profile reset.
Input: display name; optional camera/library image.
State: `onboardingStep`, `profile`, `onboardingDone`.
Data: display name in state; stylized avatar derivative in IndexedDB; original photo is not intentionally persisted long-term.
Error/fallback: photo can be skipped; default avatar remains usable.
Next: Guide creation or Home.

## 2. Exploration Crew Member

Authority: Snap & Pop `SNAP-EXPLORATION-CREW-MASTER` owns 탐험대 / 탐험대원 / 탐험대 규칙.
Hide consumes the active crew member and does not create an independent character roster or personality authority.
Legacy `guide` state is migration input only; new Hide state uses `crewMember`.
Rule: no learning-power differences by character/name.
Next: Home.

## 3. Home

Primary action: **프린트로 탐험 미션 만들기**.
Secondary action: continue active/recent trail.
Displayed state: active sheet, Trail Mastery, current progress, user/guide separation.
Rule: reward/stat/character content must not push the photo-first CTA below the primary hierarchy.

## 4. Camera / Photo Library Intake

Entry: Home or 탐험 미션 tab. Parent and child may both create an exploration mission from a printed vocabulary handout.
Inputs: rear-camera capture and photo-library selection.
Rapid capture rule: `SHUTTER → IMMEDIATE TEMP SAVE → NEXT SHOT`.
Preflight: file existence/type/size, image decode, dimensions, simple quality warnings.
Normalization: orientation-aware processing copy for OCR.
Error: unsupported/invalid image produces a specific recovery message and does not alter committed sheet data.
Input provenance: capture session/page preserves the current actor role when known (`PARENT` / `CHILD`).
Next: shared family OCR transport or manual-entry fallback.

## 5. SHARED OCR → HIDE WORD/MEANING INTERPRETER

Shared OCR transport owns image/OCR execution. Hide calls the family `/api/capture/analyze` transport with `analysis_domain=HIDE_VOCABULARY` and owns only the vocabulary-domain interpretation/review semantics.
SEE: transcribe only visible word/meaning rows; no examples/hints/invention.
PAIR: validate only the SEE rows and preserve sequence; no new source rows.
Confidence: high/medium/low.
Fallback: manual entry when OCR/network/API is unavailable. If the family server does not yet return the `HIDE_VOCABULARY` rows contract, the client must fail closed with `HIDE_VOCABULARY_RESULT_UNSUPPORTED`; it must not fabricate rows or fall back to a private Gemini client.
Next: Review.

## 6. Review Before Exploration Mission Commit

Entry: successful OCR output, manual entry, or existing sheet review.
Input: edit/delete/add word/meaning rows.
Rule: nothing becomes a learning item until user commits the reviewed rows.
Commit: create/update an exploration mission atomically after valid rows exist. Internal `sheet` identifiers may remain for compatibility.
Data: `recognitionMeta`, `sourceType`, `sourceCount`, normalized word records.
Next: Learning Hub.

## 7. MEMORIZATION → FIRST FIND

### MEMORIZATION
Purpose: the learner first memorizes the reviewed print items before Hide retrieval begins.
Interaction: word + meaning + pronunciation + optional verified meaning map.
Role-aware rule:
- NEW: richer understanding support may be offered.
- REVIEW: resume prior memory context; do not treat the word as newly learned.
Data: exposure is recorded as memorization exposure only. Exposure does not count as independent recall.
Next: FIRST FIND.

### FIRST FIND
Purpose: first unassisted retrieval after memorization.
Interaction: meaning is shown while the target word is hidden; learner types the recalled word or marks that it did not come to mind.
Data: FIRST_RECALL_CORRECT / FIRST_RECALL_WRONG are retrieval evidence.
Rule: showing a word during memorization must never be counted as a successful memory-ladder step.
Next: MEANING CLUE.

## 8. MEANING CLUE

Purpose: bidirectional recognition and early weakness detection.
Interaction: four-choice style task; direction can alternate between English→Korean and Korean→English.
Data: correct/wrong response signals feed weak score/history.
Next: CONNECTION TRAIL.

## 9. CONNECTION TRAIL

Purpose: fast word↔meaning association.
Interaction: tap matching tiles.
Exposure: broad current-sheet exposure first; weak signals influence later practice.
Next: HIDDEN WORDS / FINAL SEEK readiness.

## 10. HIDDEN WORDS PRIORITY

Signals: wrong, pass, hint, timeout, slow-correct and repeated error.
Rule: weak words receive more study opportunity, but stable words are not permanently removed.
Data: per-word counters plus `learningStats`.
Next: FINAL SEEK.

## 11. FINAL SEEK — Final Spelling Retrieval

Target set: all valid words from the current sheet for the first pass.
UI: partial spelling + Blank Slots + mixed real/fake Letter Key Tray + Pulse Time Gauge + Hint + PASS + Guide.
Primary input: Drag & Drop.
Accessibility fallback: Tap Key → Tap Slot.
Fake-key rule: fake letters never duplicate required blank characters in the current key set.
Wrong key: immediate rejection; no slot occupation; `wrongAttempts` increments.
Hint: adaptive **Memory Trail** rather than a fixed reveal ladder.
- Candidate cues: SCENE → MEANING → SOUND → SHAPE → PERSONAL ERROR TRACE → FRAGMENT → MINIMUM REVEAL.
- The actual path is selected from the learner's prior meaning/spelling/timeout/hint history; irrelevant cues may be skipped.
- Earlier cues must reactivate memory before exposing letters.
- Personal error trace may reuse the learner's own recent wrong-key location as a cue.
- Minimum Reveal is the final fallback and reveals only one necessary letter.
- Every cue type and timestamp is recorded in `hintTrace`.
- hint-used success is assisted recall, not secure recall.
Timeout: separate TIMEOUT result.
Pass: separate PASS result.
Data: `CORRECT`, `SLOW_CORRECT`, `WRONG`, `PASS`, `TIMEOUT`, `HINT_USED` are recorded separately.
Next: SEEK AGAIN when unstable words exist; otherwise completion.

Compatibility note: legacy internal property names such as `codeRed` may remain temporarily to avoid breaking existing learner data. They must not be shown as current child-facing product terminology.

## 12. SEEK AGAIN

Entry: FINAL SEEK collected unstable target ids.
Purpose: learn again before recall again.
Interaction: meaning/spelling/TTS exposure for only the unstable pool.
Rule: no immediate same-answer repetition directly after failure.
Hint-dependent words set `needsUnassistedRecall=true`. During targeted FINAL SEEK, a later CORRECT/SLOW_CORRECT with no hint records `recoveredWithoutHintAt` and clears that flag.
Next: targeted FINAL SEEK with only unstable targets.

Compatibility note: legacy internal property names such as `retrace` may remain internally during migration.

## 13. Completion / Memory Event

Trail Mastery: current-sheet readiness. Set independently of long-term memory.
Memory Strength: cumulative retention signal.
Optional old-word event: sparse and skippable; it must not reduce completed Trail Mastery or block current work.

Compatibility note: legacy `caseMastery` may remain as an internal persisted key until a verified migration is completed.

## 14. Records / Wordbook

Wordbook: current valid words, sorted with weakness status.
Records: Trail Mastery, Memory Strength and any approved runtime history.
Rule: current-sheet readiness and long-term memory remain separate metrics.

## 15. Data Safety / Migration

Preserve existing learner data while renaming world concepts.
Legacy storage/internal identifiers may be read for compatibility.
Migration path:
`READ LEGACY → NORMALIZE → WRITE CURRENT → VERIFY → RETAIN FALLBACK WINDOW → RETIRE LEGACY`

Legacy identifier presence in storage does not authorize legacy wording in UI.

## 16. PWA

Manifest current product identity: Hide & Seek.
Offline target after successful caching: app shell, stored sheets, learning, records.
Online dependency: new OCR/AI requests.
Release rule: local/static validation is not Release PASS. Live HTTPS, install, offline relaunch, cache/update and real-device camera/OCR remain separate release gates.

## 17. WORLD REGRESSION GATE

FAIL if current UI reintroduces:
- superseded product names or police/detective/arrest/case framing as active child-facing terminology,
- police/detective/arrest framing,
- 수사/사건/체포/검거/범인/사건파일 wording,
- a child-facing 'case' metaphor.

Active world must remain:
**Hide & Seek / treasure-seek / tag / hidden-word exploration.**

## 18. READY & SET LEARNING STATUS REPORT

Hide reports specialist evidence to Ready & Set; Ready owns cross-app learning status, Learning Master, Planner and TODAY.

Report includes:
- explorationMissionId / explorationMissionTitle
- inputActorRole when known
- validWordCount
- taskState / Trail Mastery
- learning phase / attempt counts / remaining Seek Again
- compact Memory Summary and top review priorities
- shared session/task/lap identifiers

`HIDE REPORT != READY FACT AUTHORITY != READY PLANNER AUTHORITY`


## 19. LANGUAGE MEMORY & MEANING CORE

Hide & Seek's domain is language memory and meaning, not English-only vocabulary.

Shared principle:
`decompose when valid → connect meaning → form imagery → retrieve → record memory evidence`.

Language-specific interpretation:
- ENGLISH: PREFIX / ROOT / SUFFIX / MEANING_BRIDGE / CONTEXT.
- KOREAN: ETYMOLOGY / AFFIX / HANJA_ORIGIN / SEMANTIC_RELATION / CONTEXT.
- HANJA: RADICAL / COMPONENT / SOUND / MEANING / COMPOUND_CONTEXT.

A verified meaning map may be used as a Memory Ladder cue (`MEANING_MAP`).
It must help the learner reconstruct meaning; it must not expand the current mission into an unsolicited related-word memorization list.

Truth gate:
- etymology/root/Hanja claims require verified source data,
- no runtime invention,
- no "plausible" decomposition,
- missing verification falls back to ordinary meaning/context support.

The meaning map is dynamic and may grow only from verified analysis and learner encounters.


### NEW / REVIEW mission role
Each committed mission item carries a mission role:
- NEW: no prior lexical history before this mission.
- REVIEW: the same lexical/sense item already exists in prior mission history.

The role is inferred from learner history unless explicitly preserved from a trusted source. Current real-world patterns such as 12 NEW + 24 REVIEW are valid mission instances, not hard-coded universal counts.

### Current morning mock-test evidence
The attached photographed sheet is not the source learning print. It is a morning mock vocabulary test performed by parent and child.

Observed routine from this mock-test evidence:
- total 36 items
- 12 NEW items
- 24 REVIEW items
- in this specific mock-test sheet, the NEW 12 happened to be placed in the left block.

Critical rule:
- source learning prints may use different layouts,
- left/right position must NOT determine NEW / REVIEW,
- 12 + 24 is the current mission composition pattern, not a universal print-layout parser rule.

Role assignment authority:
1. explicit mission role already preserved,
2. prior learner lexical history can infer REVIEW,
3. review screen allows quick NEW / REVIEW correction,
4. source-column metadata is provenance only and carries no learning-role authority.

Mission metadata may preserve the current expected composition:
`expectedNew=12 / expectedReview=24 / layoutIndependent=true`.


## 20. MORNING MOCK TEST EVIDENCE

A parent-child morning mock test is external learning evidence, not a source-print parser and not the same thing as Hide's internal retrieval test.

Supported quick outcomes:
- CORRECT
- CONFUSED
- WRONG
- ASSISTED_CORRECT
- RECOVERED_CORRECT

Provenance:
- source = MORNING_MOCK_TEST
- actor = PARENT_CHILD

Memory rules:
- CORRECT is positive assessment evidence.
- CONFUSED increases recall-latency/uncertainty evidence.
- WRONG increases retrieval/orthographic weakness evidence but does not reset the Memory Ladder.
- ASSISTED_CORRECT sets needsUnassistedRecall=true.
- RECOVERED_CORRECT records unassisted recovery with spacedEvidence=false unless a real time gap is established.
- External mock-test evidence must not be mislabeled as Hide internal FINAL SEEK evidence.


## 21. THINKING-FIRST NEW WORD EXPLORATION

NEW words must not default to immediate word-meaning display when a supported thinking trail exists.

Preferred order:
`WORD → THINKING QUESTION → OPTIONAL SCENE CUE → MEANING CONFIRMATION → MEMORIZATION → FIRST FIND`

Rules:
- The learner is invited to form a mental scene before checking the Korean meaning.
- The next-word action remains locked until meaning confirmation on supported NEW words.
- REVIEW words remain fast reactivation, not full first-learning exploration.
- Transparent compounds may use visible word-part composition when linguistically safe (for example rain+forest, earth+quake).
- Opaque-looking words must not be split into plausible-but-false pieces (for example island is treated as a semantic scene, not is+land).
- Curated semantic support is explicitly not historical etymology.
- Related-word links show only already encountered words so the map does not become a second memorization list.
- THINKING_SCENE usage is assistance/acquisition support, not independent recall.


### Reuse in Memory Ladder
Thinking-first support must not disappear after memorization.

When a supported NEW word later shows weak evidence such as MORNING_MOCK_TEST WRONG/CONFUSED, the Memory Ladder may use:
`THINKING_SCENE → later cues`

Properties:
- THINKING_SCENE is low-cost assistance.
- It restores the learner's semantic/visual route before exposing spelling.
- It does not count as independent recall.
- It may include transparent word parts and already encountered connections.
- It must not introduce unseen related words as new memorization targets.
