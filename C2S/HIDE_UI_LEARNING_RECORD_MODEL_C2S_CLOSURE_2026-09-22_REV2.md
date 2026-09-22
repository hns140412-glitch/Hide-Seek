# HIDE & SEEK UI / LEARNING / RECORD MODEL — C2S CLOSURE REV2 — 2026-09-22

Status: DESIGN AUTHORITY FOR HIDE UI / NO CODE CHANGE / NO DEPLOY
Authority: latest TAKY + Runtime V2 truth boundaries + Hide UI C2S REV1 + Snap Exploration Crew Master + shared Badge recovery
Scope: learner-facing IA, learning-mode projection, crew appearance, badge/record surfaces, cumulative review, Ready integration

## 0. Decision summary
Hide learner-facing structure is:
- TRACE / 흔적
- LINK / 연결
- PIECE / 조각
- CATCH / 보물함
These are not a mandatory linear course.
TRACE/LINK/PIECE are selectable exploration modes.
CATCH is the cumulative record/treasure space.
Runtime V2 internal evidence states remain authoritative internally but are projected into these child-facing modes.

## 1. Home
Home is the daily launch surface, not a management dashboard.

Priority:
1. Today exploration goal / resume
2. newly acquired learning items from homework/photo intake
3. start exploration
4. optional pre-start share
5. compact cumulative record/treasure summary

If Ready & Set provided a learning goal, Hide displays that goal as today's exploration goal.
Hide does not independently create dated Planner policy.

Photo/OCR intake may create newly acquired items.
After review/confirmation, newly acquired items may appear on Home as today's first-trace set.

## 2. Navigation
Primary phone bottom navigation:
- small English above, Korean primary below
- HOME / 홈
- EXPLORE / 탐험
- CATCH / 보물함

TRACE/LINK/PIECE are not bottom tabs.
Memory Ladder is not a bottom tab.
OCR is not a bottom tab.

## 3. TRACE / 흔적
### 3.1 First Trace
First Trace is NEW-only.
Purpose: fast first-contact familiarity and repeated mental retrieval attempts.

Interaction grammar:
- short, fast, game-like turn exchange;
- think-first; not every turn requires answer submission;
- word may appear, blink, hide, and reappear;
- varying directions: sound→meaning, meaning→spoken word, word→meaning, word→sound, scene→word, sound→word;
- optional lightweight checks: tap, voice/walkie-talkie, one/few blanks, small fragment choice;
- full spelling transcription is not the TRACE default;
- wrong answer is not punitive; item may simply hide again and return later.

Experience target:
"잡힐 듯 안 잡히는 단어를 빠르게 여러 흔적으로 추적한다."

### 3.2 Review Trace
When review is needed, TRACE can switch to a review-play variant.
Pool may include:
- previously learned items;
- re-hidden/missed items;
- weakness-priority items;
- current/new items when appropriate.
This is not the first-trace NEW-only intake.
The same rapid game grammar may be reused.

## 4. LINK / 연결
Purpose: create a durable memory path by understanding and discriminating meaningful relationships.

LINK has three internal screens/states:
1. Principle / relation reveal:
   - verified root, etymology, morphology, semantic mechanism, imagery, contrast.
2. Related choice:
   - choose related word/scene/expression among plausible unrelated or confusing distractors.
   - purpose is boundary formation: proving what the concept IS and IS NOT.
3. Connection test:
   - multiple words and meanings/relations are mixed;
   - correct pairs are completed by tap-based selection as default, not drag.

Examples:
- intro/outro;
- take out/take off;
- look at/look for/look after.

Subject adapters:
- English: verified prefix/root/suffix/etymology/phrasal contrasts.
- Korean: verified affix/origin/Hanja-origin/semantic/context relation.
- Hanja: verified component/radical/sound/meaning/compound.
- Social studies: cause/effect, person/event, place/event, institution/role, chronology.
- Science: structure/function, cause/effect, process/stage, classification/concept.

Truth gate:
unverified language-history/root/Hanja/sound/decomposition claims are never invented.

## 5. PIECE / 조각
Purpose: final form/critical-structure completion.

English:
- random blanks;
- critical spelling chunks;
- confusable fragments;
- small reconstruction choices;
- full keyboard transcription is not default.

Cross-subject:
PIECE means "complete the missing critical structure", not "English spelling only".
Examples:
- Hanja component/reading/meaning element;
- Korean orthographic or morphological segment;
- Social studies missing event/location/relation;
- Science missing process step/structure/label/classification.

Assisted/reconstruction completion != delayed independent recall.

## 6. CATCH / 보물함
CATCH is a cumulative learner record and treasure space.

It contains multiple views over the SAME underlying learning-event history:
- Items: found / encountered / re-hidden / missed / weakness-priority items
- Badge Book: badge collection and badge growth history
- Calendar: date-oriented learning/activity history
- Item Detail: one item's cumulative learning story
- Memory state: contextual Memory Ladder / memory status
- Search/history/export in secondary surfaces

CATCH is not the end of a course; it is a source for later review.

## 7. Cumulative learning and review
A newly learned English word does not disappear after one mission.
Learner lexical/sense history is cumulative.
Later homework/intake may coexist with prior learned words.
Review pools may draw from prior items according to Hide evidence and Ready review policy boundary.

For one item, history may include:
- first encounter date;
- TRACE encounters;
- LINK activities;
- PIECE completions;
- misses/re-hidden events;
- later re-finds;
- hint/assistance class;
- delayed unassisted recall evidence;
- related badge observations.

A new mission never resets cumulative history.

## 8. Memory Ladder placement
Memory Ladder remains Hide's memory-state visualization, but is contextual.
Preferred entry:
- compact Home summary;
- CATCH item detail;
- completion/result.
Do not make it a required bottom-nav destination.
Do not expose raw Memory Strength/review-priority diagnostics as the child-facing primary layer.

## 9. Badge system integration
Global badge policy/catalog remains shared/Snap-family-owned.
Hide emits evidence events and renders shared badge award UI when the shared system grants an award.

### 9.1 Badge award presentation
Badge award appears as a dedicated cross-app overlay/window at meaningful transitions in Ready & Set, Hide & Seek, or Snap & Pop.
It is not restricted to one app.

Award overlay:
- badge art;
- badge name;
- short witty line;
- optional crew reaction;
- close/continue;
- optional view-in-Badge-Book.
Avoid reward spam; low-value events may accumulate silently and only meaningful award/growth moments interrupt flow.

### 9.2 Badge meaning
Badges record process/experience, not score/power.
Include:
- successful behaviors;
- recovery and persistence;
- error discovery;
- help request;
- unusually long thinking;
- playful repeated-confusion/error patterns;
- special behaviors.

Humor rule:
- joke about situation/world/crew, never learner ability or identity;
- do not shame mistakes.

### 9.3 Badge Book
User has now explicitly selected a growth-record direction for display.
Badge Book should show:
- earned badges;
- growth level/progression where the shared badge system defines it;
- first-earned date;
- recent growth date;
- contributing episodes/events;
- optional tier history.

Existing recovered badge growth presentation (GREEN / BLUE / RED / GOLD / PLATINUM with marks) may inform UI, but exact cross-app thresholds/dedupe remain shared-system authority and are not invented by Hide.

### 9.4 Calendar
Calendar is a history view, NOT a streak-pressure mechanic.
No missed-day punishment.
No earned-badge removal.
No "you broke the streak" framing.

A date may summarize app-separated activity:
- Ready goal/task activity;
- Hide TRACE/LINK/PIECE/review activity;
- badge awards/growth;
- Snap exploration activity.
Cross-app aggregation requires shared event history; Hide should not fabricate other-app events.

## 10. Exploration Crew in Hide
Authority:
Snap & Pop owns crew identity, personality, behavior grammar, intervention strength and expression.
Hide consumes character_id and context.

Crew must not be a teacher, grader, answer engine, or permanent screen mascot.

Hide appearance slots:
1. PRE-START COMPANION:
   - show current companion before exploration;
   - brief line/gesture.
2. WALKIE-TALKIE:
   - TRACE voice interaction and minimal clue delivery;
   - input and companion voice are visually distinguishable.
3. CONTEXT REACTION:
   - hesitation, interesting discovery, mode/screen transition;
   - short overlay only.
4. LINK SUPPORT:
   - point toward a relation or ask a small question; do not lecture the root/etymology.
5. PIECE SUPPORT:
   - only after help is justified/requested; one minimal fragment clue.
6. CATCH / BADGE:
   - react to odd/funny record, re-find, badge growth, treasure history.
7. COMPLETION:
   - restrained acknowledgement and next-action opening.

Rules:
- observe/wait before escalating;
- one hint at a time;
- never cover input/action target;
- no mandatory confirmation modal;
- repeated same animation/copy is avoided;
- character_id chooses identity; behavior mode is contextual and not hard-mapped 1:1 to character.

## 11. Ready & Set integration
Ready owns:
- learning goal;
- date/time/Planner;
- broader learning status;
- completion/family sharing.

Hide owns:
- specialist learning activity;
- pre-start mission/set share;
- specialist evidence;
- completion report to Ready.

Flow:
READY GOAL
→ HIDE HOME/TODAY EXPLORATION
→ OPTIONAL PRE-START SHARE
→ FREE-SELECT TRACE/LINK/PIECE
→ HIDE COMPLETION
→ REPORT TASK RESULT TO READY
→ READY handles broader family/Planner sharing.

Hide does not independently schedule dated review.

## 12. Completion screen
Priority:
1. exploration completion feeling;
2. found/encountered items;
3. re-hidden/needs-more items;
4. badge award/growth when meaningful;
5. report to Ready (primary CTA when Ready-connected);
6. CATCH / treasure view (secondary).

Avoid scoreboard-first presentation.

## 13. Visual direction
- emoji avoided as primary language;
- ultra-high-density illustration;
- high detail in world/scene, calm clarity in interaction layer;
- no generic mountain/forest wallpaper standing in for design;
- visual motifs derive from hidden traces, clues, paths, fragments, stored finds, walkie-talkie;
- learning meaning has priority over decoration;
- no excessive card/dashboard UI;
- characters are runtime character_id slots, not hard-coded art in mockups;
- 390×844 portrait baseline;
- main CTA/touch >=44px;
- no horizontal overflow.

## 14. Cross-subject invariant
TRACE = first/rapid familiarity + retrieval attempts.
LINK = meaningful relations and discrimination.
PIECE = missing critical structure completion.
CATCH = cumulative record/treasure/review source.
These meanings stay stable across English/Korean/Hanja/Social Studies/Science; content adapters vary.

## 15. Supersession / compatibility
REV_04's older child-facing linear progression:
FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → SEEK AGAIN
is now UI-superseded as mandatory learner-facing navigation.
It remains internal Runtime V2/evidence lineage and must not be deleted or falsified.

## 16. Design gate before mockup
Do NOT produce final visual mockups until these are reflected:
- bottom nav locked;
- Home hierarchy locked;
- Explore hub/free-select model locked;
- TRACE first/new vs review variant locked;
- LINK 3-state structure locked;
- PIECE cross-subject abstraction locked;
- CATCH views (items/badges/calendar/item detail) locked;
- crew appearance slots locked;
- Ready completion-report flow locked;
- badge overlay and growth-record direction locked.

UNMAPPED_MATERIAL = 0 within this conversation scope.
SILENT_LOSS = 0 within this conversation scope.


## 17. Home clue-acquisition correction — 2026-09-22
Home is the base-camp for acquiring and confirming today's learning clues before learning begins.

Three home states:
1. NO HOMEWORK / NO CONFIRMED SET
   - primary CTA may use exploration wording such as 탐험 시작 / 단서 찾으러 가기;
   - action opens capture/import flow;
   - capture/import is framed as acquiring today's clues, not as a technical file-upload task.
2. CLUE REVIEW
   - OCR/source analysis is complete or partially complete;
   - learner/parent reviews word/meaning/subject/new-review candidates;
   - correction/exclusion/duplicate merge remain available;
   - primary CTA: 단서 확인하기 / 오늘의 탐험 세트 확정.
3. SET READY
   - default child-facing home shows the confirmed English 12-word set when no Ready Planner target overrides it;
   - show the actual 12 words on one screen using translucent vocabulary-note tiles;
   - visual target: wordbook / collected clue slips, not dashboard cards;
   - 3x4 tile study is the preferred starting layout for 390px portrait, subject to visual QA;
   - main learning CTA transitions to TRACE / 흔적 after set confirmation.

Ready Planner authority:
- if Ready provides an explicit target/set, Hide presents that target instead of inventing another;
- if there is no Ready target, Hide may show the default confirmed English 12-word set;
- Hide does not independently create dated schedule policy.

Home information hierarchy after SET READY:
1. 오늘의 탐험 / Ready target context;
2. actual learning set (default English 12 words);
3. primary learning CTA;
4. secondary actions: homework capture/additional source, pre-start share;
5. compact CATCH/badge/history summary.

Visual rule:
- translucent tiles must preserve text contrast;
- no glossy casino/game-card treatment;
- world illustration may show through lightly;
- tile collection should feel like a vocabulary notebook / found clue slips.
