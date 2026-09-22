# HIDE UI DECISION PACKET — 2026-09-22 REV3

UI_DECISION_ID: HIDE-UI-REV3-20260922
APP_ID: HIDE_SEEK
STATUS: LOCKED + LOCK_CANDIDATE VISUAL
SOURCE: latest TAKY + current conversation + existing Runtime V2 / crew / badge authorities

## DECISIONS

### Product / world
- Shared fixed island.
- Ready = Base Camp / Island Map.
- Hide = Jungle / Waterfall.
- Snap = Beach.
- Hide Home is a regional base point, not island-level map.
- Island/Base Camp naming is family onboarding; both can later be renamed without resetting state.

### Hide IA
- HOME / 홈
- EXPLORE / 탐험
- CATCH / 보물함
- Explore activities: TRACE / LINK / PIECE.
- Memory Ladder contextual only.

### Home
- state A: acquire clue/homework source;
- state B: clue review/OCR correction;
- state C: confirmed set ready.
- Ready Planner target overrides local default presentation.
- no Ready target → default confirmed English 12-word set may be shown.
- 12 words visible as translucent vocabulary-notebook / clue-slip treatment; preferred 3×4 study on 390×844.
- Home is not a dashboard wall.

### Learning
TRACE:
- first/new = NEW-only;
- fast, think-first, low-input;
- review variant may mix prior/re-hidden/weak items.

LINK:
- verified principle/relation;
- related-choice discrimination;
- mixed tap-based connection.

PIECE:
- final form/critical-structure completion;
- English spelling is one adapter, not the universal definition.

CATCH:
- item history;
- Badge Book;
- Calendar;
- item detail;
- contextual Memory Ladder;
- cumulative review source.

### Crew
Snap owns crew identity/personality/intervention grammar.
Hide consumes character_id / Explorer_ID continuity.
Slots:
- pre-start;
- walkie-talkie;
- context reaction;
- LINK support;
- PIECE support;
- CATCH/badge;
- completion.
Companion != teacher/grader/answer engine.

### Badge / record
- shared cross-app badge system;
- dedicated badge award overlay/window may interrupt meaningful transitions;
- Badge Book shows growth/history;
- mistakes/retries can create witty badges but never shame learner ability;
- Calendar is history, not streak;
- learning item history is cumulative across missions.

### Visual direction — LOCK_CANDIDATE
- fixed island environment dominates composition;
- high-density world / spatial depth;
- restrained translucent overlays rather than opaque card walls;
- character must match island lighting/material/detail language;
- separate glossy avatar-maker render pasted over the island = FAIL;
- commercial game references may inform composition/depth/motion, never be copied.

## AFFECTS
Ready-Set: shared island/naming/badge transition continuity.
Snap-Pop: shared island/crew/badge transition continuity.
Hide-Seek: full UI review.

CROSS_APP_PROPAGATION:
- shared island/naming/region/continuity/badge semantics = YES
- Hide learning composition = REFERENCE_ONLY
- Hide local 12-word board = NO / app-local

REGRESSION_RISK:
- old Runtime stage labels returning as mandatory IA;
- random/disconnected world art;
- learner avatar confused with crew;
- opaque dashboard cards hiding island;
- badge/calendar drifting into score/streak.

SUPERSEDES:
- older Hide mandatory linear child-facing journey;
- generic reward/achievement UI as product authority.

OPEN_GAPS:
- final high-fi art direction;
- exact island transitions;
- exact badge award visual;
- device visual QA.
