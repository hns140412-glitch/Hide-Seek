# Hide & Seek Function Specification — REV_08 WORLD MIGRATION

Status: FUNCTION SPEC APPROVED FOR CURRENT HIDE & SEEK BASELINE
Master: `Hide_Seek_UI_MASTER_LOGIC_REV_04.md`

## 1. Onboarding / User Profile

Entry: first launch or explicit profile reset.
Input: display name; optional camera/library image.
State: `onboardingStep`, `profile`, `onboardingDone`.
Data: display name in state; stylized avatar derivative in IndexedDB; original photo is not intentionally persisted long-term.
Error/fallback: photo can be skipped; default avatar remains usable.
Next: Guide creation or Home.

## 2. Guide Creation

Entry: onboarding step after optional avatar.
Input: animal companion choice, emphasis style, recommended/direct name, or skip.
State/data: `guide.id`, `guide.name`, `guide.style`, `guide.voice`.
Rule: no learning-power differences by character/name.
Child-facing role: Guide / 탐험 친구. Police/detective-partner framing is not allowed.
Next: Home.

## 3. Home

Primary action: **사진으로 시험지 만들기**.
Secondary action: continue active/recent trail.
Displayed state: active sheet, Trail Mastery, current progress, user/guide separation.
Rule: reward/stat/character content must not push the photo-first CTA below the primary hierarchy.

## 4. Camera / Photo Library Intake

Entry: Home or 시험지 tab.
Inputs: rear-camera capture and photo-library selection.
Rapid capture rule: `SHUTTER → IMMEDIATE TEMP SAVE → NEXT SHOT`.
Preflight: file existence/type/size, image decode, dimensions, simple quality warnings.
Normalization: orientation-aware processing copy for OCR.
Error: unsupported/invalid image produces a specific recovery message and does not alter committed sheet data.
Next: OCR or manual-entry fallback.

## 5. OCR SEE / PAIR

SEE: transcribe only visible word/meaning rows; no examples/hints/invention.
PAIR: validate only the SEE rows and preserve sequence; no new source rows.
Confidence: high/medium/low.
Fallback: manual entry when OCR/network/API is unavailable.
Next: Review.

## 6. Review Before Commit

Entry: successful OCR output, manual entry, or existing sheet review.
Input: edit/delete/add word/meaning rows.
Rule: nothing becomes a learning item until user commits the reviewed rows.
Commit: create/update a sheet atomically after valid rows exist.
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

Signals: wrong, pass, hint, slow-correct and repeated error.
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
Hint: progressive help state; hint-used success is not treated as fully secure.
Timeout: separate TIMEOUT result.
Pass: separate PASS result.
Data: `CORRECT`, `WRONG`, `PASS`, `TIMEOUT`, `HINT_USED` are recorded separately.
Next: SEEK AGAIN when unstable words exist; otherwise completion.

Compatibility note: legacy internal property names such as `codeRed` may remain temporarily to avoid breaking existing learner data. They must not be shown as current child-facing product terminology.

## 12. SEEK AGAIN

Entry: FINAL SEEK collected unstable target ids.
Purpose: learn again before recall again.
Interaction: meaning/spelling/TTS exposure for only the unstable pool.
Rule: no immediate same-answer repetition directly after failure.
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
- Hide & Seek as active product name,
- police/detective/arrest framing,
- 수사/사건/체포/검거/범인/사건파일 wording,
- a child-facing 'case' metaphor.

Active world must remain:
**Hide & Seek / treasure-seek / tag / hidden-word exploration.**
