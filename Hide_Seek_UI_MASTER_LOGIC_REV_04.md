# Hide & Seek UI Master Logic — REV_04

> Status: FORMAL BASELINE / SOURCE OF TRUTH
> Date: 2026-09-07
> Supersedes: `Hide_Seek_UI_MASTER_LOGIC_REV_03.md`
> Product Name: **Hide & Seek**
> Tagline: **머릿속에 숨어버린 단어 찾기**
> World Model: **보물찾기 + 술래잡기 + 숨은 단어 탐험**

REV_04 is the active product baseline. Child-facing and active product terminology SHALL use Hide & Seek exploration language only.

Historical product names, detective/police/arrest metaphors and related child-facing concepts are not active product authority.

## 1. PRODUCT ROLE — HARD LOCK

Hide & Seek is the connected island's vocabulary discovery and retrieval specialist.

Child-facing experience:
`WORD DISCOVERED → WORD HIDES → CLUE → SEEK → FIND → SPEAK/USE → HIDES AGAIN → SEEK AGAIN → STABLE MEMORY`

Core fantasy:
- words hide like treasure,
- the learner explores and finds them,
- the exploration crew member accompanies the learner,
- missed words hide again and are found again,
- success means retrieval, not arrest/capture.

Do not expose educational jargon or legacy product names as the primary child-facing concept.

## 2. WORLD / BRAND CONTRACT — HARD LOCK

Active world language:
- 보물찾기
- 술래잡기
- 숨은 단어
- 단어 탐험
- 길 / Trail
- 단서 / Clue
- 찾기 / Seek
- 발견 / Find
- 다시 찾기 / Seek Again
- 탐험대원

Possible hiding environments may include forest, beach, cave, ruins, underground spaces, secret boxes, trees, rocks, maps, paths and other original island locations.

Forbidden as active child-facing world language:
- 경찰
- 형사
- 수사
- 체포
- 검거
- 범인
- 사건
- 사건 파일
- 단어 체포
- police/detective/arrest/case framing

World styling must remain original and must not imitate a copyrighted commercial game world.

## 3. NAME / LINEAGE CONTRACT

The active product name is **Hide & Seek**.

Any prior name may survive only in migration compatibility, repository history or archival evidence. It SHALL NOT appear as the normal installed-app name, primary UI title, onboarding identity, active project card or current master terminology.

`CURRENT PRODUCT NAME = HIDE & SEEK`
`LEGACY NAME ≠ CURRENT UI`
`LEGACY NAME ≠ CURRENT MASTER LANGUAGE`

## 4. PRESERVE LEARNING CORE

Preserve reliable source intake and vocabulary learning functions, including:
- camera/photo vocabulary-list intake,
- trustworthy word/meaning pairing,
- review-before-commit for uncertain OCR,
- bidirectional retrieval,
- speaking/TTS where supported,
- repeated recall of missed/weak words,
- multiple worksheet/list sets and separate/combined statistics where useful.

World changes must not reduce capture/OCR reliability.

### 4.0 LEARNING LINEAGE TRACE — HARD LOCK

Historical former-name terminology/world framing is SUPERSEDED, but validated learning semantics are not deleted merely because their old names disappear.

The following learning lineage remains protected at semantic level when supported by actual implementation/evidence:
- trustworthy word↔meaning pairing,
- recognition vs unaided recall distinction,
- weak/missed-word prioritization,
- relearn → recall-again behavior,
- cumulative word/sense memory,
- worksheet/list-level readiness vs longer-term memory strength,
- interrupt/resume continuity.

Legacy internal identifiers such as `codeRed`, `caseMastery`, older storage keys or old label names may remain temporarily for migration compatibility only.

`LEGACY IDENTIFIER ≠ LEGACY CHILD-FACING WORLD`
`OLD LABEL REMOVED ≠ LEARNING SEMANTIC DELETED`
`HISTORICAL DETAIL ≠ AUTOMATIC CURRENT AUTHORITY`

If a historical rule is needed to explain current behavior, trace it to the active Hide/Family Learning owner and current runtime evidence before treating it as preserved. Do not revive police/case/arrest framing during lineage recovery.

## 4.1 SHARED ASSIGNMENT / RAPID CAPTURE INHERITANCE — HARD LOCK

When Hide & Seek captures a printed vocabulary handout, it inherits the family shared Capture/OCR transport contract. Ready & Set is the current family learning-status/base-camp owner; Hide must not fork an independent OCR transport when the shared adapter is available.

`SHUTTER → IMMEDIATE TEMP SAVE → NEXT SHOT`

`ANALYZE ≠ END CAPTURE`
`BATCH ANALYZED ≠ SESSION CLOSED`

A targeted retake SHALL preserve unaffected valid photos/results and reprocess only affected evidence where safe.

Hide & Seek continues to own vocabulary-specific interpretation/retrieval semantics; it does not absorb MAIN assignment authority.

Family OCR transport contract:
- endpoint: `/api/capture/analyze`
- Ready default domain: `READY_ASSIGNMENT_FACT`
- Hide domain: `HIDE_VOCABULARY`
- Hide frontend SHALL NOT require a private Gemini API key or direct provider client.
- assignment drafts MUST NOT be accepted as Hide vocabulary rows.
- unsupported Hide-domain server response = explicit fail-closed, original capture preserved.

## 4.2 OCR REVIEW PROVENANCE — HARD LOCK

`OCR DRAFT ≠ CONFIRMED WORD SET`

A low-confidence / `needsReview` item SHALL NOT become confirmed solely because a batch commit action occurred.
Confirmation requires a valid explicit resolution state such as user correction, user acceptance, or project-approved deterministic evidence.

## 5. SEEKING FLOW — ACTIVE CHILD-FACING MODEL

Preferred child-facing progression:

`FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → SEEK AGAIN`

Semantics:
- FIRST FIND = initial word exposure/acquisition
- MEANING CLUE = bidirectional meaning check
- CONNECTION TRAIL = word↔meaning association
- HIDDEN WORDS = weak/missed-word priority practice
- FINAL SEEK = final spelling retrieval challenge
- SEEK AGAIN = relearn then re-retrieve unstable words

Internal legacy implementation identifiers may remain temporarily for migration safety, but they are not product terminology.

Examples of migration-only identifiers:
- `codeRed`
- `caseMastery`
- legacy storage keys

`LEGACY INTERNAL KEY ≠ CHILD-FACING COPY`
`LEGACY INTERNAL KEY ≠ ACTIVE PRODUCT LANGUAGE`

## 6. PROGRESS TERMINOLOGY

Preferred user-facing progress terminology:
- **Trail Mastery** = current worksheet/list readiness
- **Memory Strength** = longer-term retention

Do not present police/case terminology as the learner's progress model.

`TRAIL MASTERY ≠ MEMORY STRENGTH`

## 7. CONNECTED SESSION CONTRACT

When called from Ready & Set:
- receive the current input actor role when available (`PARENT` / `CHILD`),
- treat the printed vocabulary intake as an `탐험 미션`,
- report learning status back to Ready & Set after specialist progress/result changes,
- inherit `session_id / goal_id / task_id / lap_id / return_target`,
- app switch does not pause/reset the shared timer,
- app switch does not end the current Lap,
- Hide & Seek owns vocabulary-task results only,
- return `COMPLETED / PARTIAL / BLOCKED / HELP_NEEDED` as task-level state,
- never close the full Ready & Set session.


## 7.1 READY & SET LEARNING STATUS REPORT — HARD LOCK

Ready & Set is the family learning-status / Learning Master / Planner owner.
Hide & Seek SHALL report specialist evidence rather than independently deciding the family's next study allocation.

Minimum report projection:
- explorationMissionId / explorationMissionTitle
- inputActorRole when known (`PARENT` / `CHILD`)
- validWordCount
- Trail Mastery
- Memory Strength summary
- needsUnassistedRecallCount
- reasonCounts: recovery / confusion / orthographic / latency / hint / decay / stable
- topReviewPriorities
- taskState
- session_id / goal_id / task_id / lap_id

Authority boundary:
`HIDE LEARNING EVIDENCE != READY ASSIGNMENT FACT != READY PLANNER AUTHORITY`

## 8. SNAP & POP HANDOFF

A found word may become expression material for Snap & Pop.

Example:
`FIND WORD → SPEAK WORD → SEND WORD/CONTEXT TO SNAP & POP → CHILD MAKES SENTENCE OR SPEAKS → RESULT RETURNS TO SHARED LEARNING HISTORY`

Do not create a duplicate independent long-term vocabulary registry inside Snap & Pop.

## 9. EXPLORATION CREW MEMBER

Exploration crew identity, personality, intervention grammar and reaction rules are owned and coordinated by Snap & Pop `SNAP-EXPLORATION-CREW-MASTER`. Hide & Seek consumes those rules and SHALL NOT define an independent crew personality system.

The active exploration crew member may give a minimal clue or short support, but must not reveal every answer immediately.

Clue use is a learning event, not a punishment.

Preferred exploration crew behavior:
- 탐험대원
- 단서를 건네는 동료
- Snap & Pop 탐험대 규칙을 따르는 동행

Do not use police/detective-partner framing.

## 10. IMAGINATION CLOUD

Hide & Seek may call the shared Imagination Cloud when a word's meaning, context or image association would materially help retrieval.

Rules:
- child question may trigger it,
- visual/context support must explain rather than decorate,
- do not replace retrieval effort with answer display,
- preserve session/task/lap,
- return to the same vocabulary task.

## 11. REWARD IDENTITY

Hide & Seek may use found-word, hidden-word, treasure-map, trail, clue or treasure-style collection feedback.

Do not copy Snap & Pop's gem/wish/blessing economy wholesale.
Do not make reward accumulation more important than actual retrieval.

Historical/runtime reward mechanics such as XP, streak, level, calendar, themes, best record or achievements SHALL NOT be silently promoted to protected Hide & Seek identity or silently removed while current product authority remains unresolved.

## 12. DEVICE / RESPONSIVE CONTRACT — HARD LOCK

Phone:
- Portrait Only.

Tablet:
- Portrait + Landscape.

Tablet UI Scale Ceiling:
- landscape usable height.

Additional tablet width should expand World / Environment before inflating the core UI into an oversized phone-like surface.

`TEXT IS NEVER BAKED INTO IMAGE`
`BACKGROUND ≠ UI`
`SYSTEM FACT ≠ GUIDE VOICE`

Unintended overlap, excessive separation, clipping, broken alignment/anchoring or alternate-orientation composition failure = FAIL.

### 12.1 DEVICE RUNTIME VALIDATION BOUNDARY — HARD LOCK

The MASTER device contract is normative, but manifest metadata alone does not prove runtime realization.

Current PWA packaging may use a permissive manifest orientation value for compatibility. This SHALL NOT be interpreted as device-contract PASS or automatic contradiction resolution.

Before DEVICE / RELEASE PASS, validate the actual combined behavior of:
- manifest/app-shell metadata,
- CSS responsive/orientation behavior,
- JS/device-state behavior where present,
- phone portrait handling,
- tablet portrait handling,
- tablet landscape composition,
- installed Safari/PWA behavior on representative real devices.

If actual phone behavior permits an unsupported landscape experience or tablet landscape violates the scale/composition contract, classify the affected runtime as `RE-TEST / UPDATE-REQUIRED / FAIL` as applicable.

`MANIFEST VALUE ≠ DEVICE CONTRACT PASS`
`STATIC PACKAGE ≠ REAL-DEVICE PASS`

## 13. PWA SAFE AUTO-UPDATE — HARD LOCK

Inherit shared update strategy:
`GITHUB PUSH → HOST AUTO DEPLOY → AUTO VERSION DETECT → PREPARE UPDATE → APPLY AT SAFE POINT`

Never force reload during an active shared session or active vocabulary attempt.
Persist current sheet/list, word position, task/lap/session identifiers and committed results before activation.

## 14. APP NAME / ICON RELEASE GATE

Installed product identity SHALL be Hide & Seek.

At UI freeze:
- create an original ultra-high-density illustration master icon,
- derive required PWA/Apple touch icon sizes,
- update manifest `name`, `short_name`, icons and relevant title metadata,
- test Safari + iPhone Home Screen installation/update behavior,
- verify no legacy product naming or detective/police/arrest world language remains in the approved release.

## 15. MIGRATION / COMPATIBILITY

Do not break existing learner data solely to rename the product/world.

Allowed temporarily:
- legacy localStorage/IndexedDB key names,
- legacy internal state-property names,
- migration code that recognizes older versions.

These identifiers must be documented as compatibility-only and must not leak into ordinary UI copy.

When safe migration is implemented:
`READ LEGACY → NORMALIZE → WRITE CURRENT → VERIFY → RETAIN FALLBACK WINDOW → RETIRE LEGACY`

## 16. REGRESSION FAIL CONDITIONS

FAIL if:
- legacy product name appears as current child-facing brand,
- police/detective/arrest/case framing appears as active child-facing world language,
- old world terms are reintroduced by fallback/runtime normalization,
- OCR/capture safety is weakened for visual novelty,
- a low-confidence OCR item is silently promoted to confirmed without a valid resolution state,
- rapid shared capture inserts per-shot blocking confirmation/classification,
- analysis is treated as automatic capture-session termination,
- phone/tablet orientation behavior contradicts the device contract,
- app switch resets timer/session/lap,
- Hide & Seek completes the whole multi-task session,
- clues reveal answers by default,
- Imagination Cloud bypasses retrieval,
- vocabulary results become isolated from shared Learning History,
- app update interrupts active learning.

## 17. LATER TAKY PROMOTION NOTE

When the user explicitly authorizes central TAKY application, promote this project correction as:

`FORMER CHILD-FACING PRODUCT IDENTITY → SUPERSEDED`
`POLICE / DETECTIVE / ARREST WORD WORLD → SUPERSEDED`
`HIDE & SEEK + TREASURE SEEK / TAG / HIDDEN WORD EXPLORATION → ACTIVE`

Do not infer central TAKY write authorization from this project-master update alone.

END — HIDE & SEEK UI MASTER LOGIC REV_04
