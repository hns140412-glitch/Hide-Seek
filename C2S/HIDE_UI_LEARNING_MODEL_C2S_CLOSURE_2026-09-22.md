# HIDE & SEEK UI LEARNING MODEL — C2S CLOSURE — 2026-09-22

Status: UI/LEARNING MODEL LOCKED FOR DESIGN / NO CODE CHANGE / NO DEPLOY
Authority: latest TAKY + Runtime V2 truth boundaries + Hide_Seek_UI_MASTER_LOGIC_REV_04, superseded only where explicitly corrected below
Scope: UI learning-model design, navigation, cross-app ownership, badge evidence projection

## 1. Core correction
The learner-facing UI MUST NOT mirror Runtime V2 internal stages as separate mandatory screens.
Internal runtime states remain implementation evidence; child-facing product structure is now:
- TRACE / 흔적
- LINK / 연결
- PIECE / 조각
- CATCH / 보물함·기록
These are product modes/spaces, not a single forced linear course.

TRACE/LINK/PIECE may be selected by the learner when available.
The system may recommend a mode from evidence/weakness, but recommendation != forced route.

## 2. TRACE / 흔적
Primary role: first-contact familiarization and rapid retrieval attempts.
Default first-trace pool = NEW items only.

Experience:
- short repeated encounters rather than long one-item lessons;
- form, sound, meaning, scene are checked in varying directions;
- think-first is allowed; every turn does not require answer submission;
- lightweight response forms: tap, voice/walkie-talkie, small random blanks, quick recognition;
- examples include sound→meaning tile, meaning→spoken word, word→meaning, word→spoken form, scene→word, sound→word;
- brief appearance/disappearance and reappearance may create a hide-and-seek rhythm;
- spelling interaction in TRACE is never full mandatory transcription; use small blanks/fragments only when useful;
- errors carry no punitive framing: a missed item may simply hide again and reappear later.

Exploration Crew:
- crew member presentation comes from character_id;
- Hide owns only the UI slot and learning-safe intervention request;
- Snap & Pop remains owner of crew identity/personality/intervention grammar;
- crew may use a walkie-talkie metaphor for one short clue/reaction;
- clue must not convert assisted success into unassisted recall.

Review variant:
- when learner enters review play, TRACE game mechanics may mix prior items with current/new items;
- missed/weak/re-hidden items may be prioritized;
- this review pool is distinct from first-trace NEW-only intake.

## 3. LINK / 연결
Primary role: build a durable memory path by understanding why/how the item connects.

LINK may use 3 screens/states within the mode:
1. PRINCIPLE: verified root/etymology/morphology/semantic mechanism/imagery.
2. RELATED CHOICE: choose related scene/word/expression among plausible unrelated distractors; purpose is boundary formation and misconception rejection.
3. CONNECTION TEST: multiple words and meanings/relations are mixed; learner completes correct pairings by tap-based selection rather than drag as the default.

Examples of valid relation types:
- English: prefix/root/suffix, verified etymology, phrasal-expression contrasts such as intro/outro, take out/take off, look at/look for/look after.
- Korean: verified affix/word origin/Hanja-origin/semantic/context relation.
- Hanja: verified component/radical/sound/meaning/compound relation.
- Social studies: cause↔effect, person↔event, place↔event, institution↔role, chronology.
- Science: structure↔function, cause↔effect, process↔stage, concept↔classification.

Truth gate:
- unverified etymology/root/Hanja/sound/decomposition MUST NOT be invented;
- unsupported branches disappear or fall back to meaning/context;
- LINK evidence is assisted learning/association evidence unless an explicit unassisted retrieval event separately proves recall.

## 4. PIECE / 조각
Primary role: final form/structure completion.

English:
- spelling completion is the canonical form;
- use random blanks, critical letter chunks, confusable fragments, or small reconstruction choices;
- full keyboard transcription is not the default requirement.

Cross-subject abstraction:
PIECE != English spelling only.
PIECE = complete the missing critical structure.
Examples:
- Hanja: component/reading/meaning element where verified;
- Korean: orthographic or morphological critical segment;
- Social studies: missing event/location/concept relation;
- Science: missing process step/structure/label/classification element.

PIECE completion is not automatically long-term memory proof.
Assisted/reconstruction success remains distinct from unassisted recall.

## 5. CATCH / 기록·보물함
CATCH is the child-facing space for accumulated learning traces, not merely a technical log.
It may include:
- found/encountered items;
- wrong/missed items;
- re-hidden items;
- weakness patterns;
- search/history;
- review entry points;
- export/technical detail only in secondary surfaces.

CATCH is a circular source for future review, not the end of a linear course.

## 6. Memory Ladder
Memory Ladder remains a learning-state visualization owned by Hide memory semantics, but is NOT a required bottom-tab destination.
Prefer access from:
- Home summary;
- CATCH item detail;
- completion/result surface.
Child-facing states remain intuitive (stable / rising / needs finding again); technical evidence is secondary.

## 7. Navigation direction
Phone baseline 390×844 portrait.
Primary bottom navigation candidate:
- HOME / 홈
- EXPLORE / 탐험
- CATCH / 보물함

Bottom labels: Korean is primary; small English label sits above Korean.
TRACE/LINK/PIECE are NOT bottom tabs; they are exploration modes inside EXPLORE.
OCR/intake is not a permanent bottom tab; enter from Home/setup.

## 8. Ready & Set ownership
Ready & Set owns:
- learning goal;
- Planner/date/schedule;
- family/parent completion sharing;
- task completion reception and broader learning-plan interpretation.

Hide owns:
- actual specialist learning activity;
- pre-start mission/set sharing;
- learning evidence;
- completion report back to Ready.

Flow:
READY GOAL → HIDE PRE-START/OPTIONAL SHARE → HIDE LEARNING → HIDE COMPLETION → REPORT COMPLETE/PARTIAL/BLOCKED/HELP_NEEDED TO READY → READY FAMILY/PLANNER SHARING.

Hide must not independently schedule dated review.

## 9. Badge system
Hide emits achievement/evidence events to the shared badge system; it does not own the global badge catalog/policy.
Badge evidence may include:
- successful unassisted recall;
- LINK discrimination;
- PIECE completion;
- re-found/recovered item;
- delayed retention;
- playful mistake patterns and persistence.

Badge tone may celebrate unusual/error patterns humorously, but MUST NOT shame or label learner ability.
Failure-pattern badges should convert error into a playful episode and encourage retry.
Assisted, same-day recovery, reconstruction, and delayed unassisted recall remain distinct evidence classes.

## 10. Visual/UI direction
- avoid emoji as primary visual language;
- use ultra-high-density illustration, but keep the learning action visually calm and legible;
- illustration is a memory/exploration layer, not decorative clutter;
- do not use generic forest/mountain/game wallpaper as a substitute for learning meaning;
- one-screen interaction is preferred where practical; screen transitions are allowed when they clarify mode structure;
- major CTA touch targets >=44px;
- no horizontal overflow;
- child-facing UI avoids developer/model/provider/status jargon;
- characters are placeholders/slots in design and instantiated by character_id at runtime.

## 11. Cross-subject product definition
Hide & Seek is NOT an English-only vocabulary app.
Shared product abstraction:
TRACE = become familiar and repeatedly retrieve early traces.
LINK = understand and discriminate meaningful relations.
PIECE = complete missing critical structure.
CATCH = retain learning traces and drive review.
Subject adapters provide domain-specific content under truth gates.

## 12. Supersession note
The older child-facing progression in UI Master Logic REV_04:
FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → SEEK AGAIN
is retained as Runtime V2 internal/evidence lineage, but MUST NOT be treated as the mandatory learner-facing IA.
UI design shall project those internal events into the TRACE/LINK/PIECE/CATCH model without falsifying evidence semantics.

## 13. No-silent-loss checklist
Locked from this conversation:
- English-main / Korean-small naming applies to TRACE/LINK/PIECE within exploration mode.
- Bottom navigation uses Korean primary with small English above.
- first TRACE = NEW-only.
- TRACE review mode may mix new/prior/re-hidden items.
- think-first and low-input interaction.
- walkie-talkie voice input and crew hints.
- LINK center-word/verified principle + related discrimination + multi-word connection test.
- PIECE is final spelling/form completion, generalized cross-subject.
- CATCH is record/treasure space.
- Ready pre/post ownership split.
- Hide evidence contributes to shared badge system including playful failure-pattern badges.
- Memory Ladder not forced into bottom navigation.

UNMAPPED_MATERIAL = 0 for this UI-learning-model conversation scope.
