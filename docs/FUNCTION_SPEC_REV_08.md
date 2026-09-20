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

## 7. FIRST FIND

Purpose: initial acquisition, not testing.
Interaction: see English word, Korean meaning, example, hear English TTS, move through cards.
Data: progress/history and study session counters.
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
