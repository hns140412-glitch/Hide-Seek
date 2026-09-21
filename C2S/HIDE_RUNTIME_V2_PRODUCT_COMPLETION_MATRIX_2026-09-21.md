# HIDE & SEEK RUNTIME V2 — PRODUCT COMPLETION MATRIX

Date: 2026-09-21
Branch: rewrite/hide-runtime-v2-2026-09-21
Status: REWRITE IN PROGRESS / DRAFT / DO NOT MERGE / DO NOT DEPLOY

## TAKY product-integrity basis

- V1 reusable asset maturity and V2 product completion are separate.
- CI/documentation/contracts do not directly raise product completion.
- DEVICE_VERIFIED remains 0 until physical-device evidence exists.
- Fixture OCR/browser evidence does not equal representative real-print completion.
- V1 remains reference/rollback; V2 is the replacement execution architecture.

## Current matrix

| Product area | Status | User path reachable | Representative input | Evidence | Known gaps |
|---|---|---:|---:|---|---|
| V2 app bootstrap/store/router | RUNTIME_VERIFIED | yes | N/A | V2 CI | no release/PWA cutover |
| V1 non-destructive migration | RUNTIME_VERIFIED | yes | partial | browser migration fixture | broader legacy variants not yet sampled |
| Mission create/active ownership | RUNTIME_VERIFIED | yes | partial | browser + store tests | advanced filters/bulk operations not implemented |
| Camera input path | PARTIAL | yes | no | code/browser file input | physical camera permission/device not verified |
| Album multi-image intake | FUNCTIONAL | yes | partial | browser input | large/odd image sets not representative-tested |
| Capture blob persistence | RUNTIME_VERIFIED | yes | fixture blob | IndexedDB + reload test | storage quota/recovery not verified |
| OCR shared adapter integration | RUNTIME_VERIFIED | yes | fixture only | OCR browser fixture | real varied prints/provider behavior unverified |
| OCR review persistence/resume | RUNTIME_VERIFIED | yes | fixture only | reload + editable review browser tests | confidence guidance/duplicate merge UX still incomplete |
| MEMORIZE | FUNCTIONAL | yes | fixture | V2 browser flow | richer exploration assistance not yet ported |
| FIRST FIND | FUNCTIONAL | yes | fixture | V2 browser flow | recovery/retry pedagogy still simplified |
| MEANING recall | FUNCTIONAL | yes | fixture | V2 browser flow | recognition/contrast variants not yet ported |
| English CONNECTION | PARTIAL | yes | fixture | V2 browser flow | full thinking/structure imagery engine UI not fully ported |
| Korean RESPONSE TRAIL | FUNCTIONAL | yes | fixture | V2 browser evidence semantics | qualitative feedback not implemented |
| Hanja SOUND FIND | PARTIAL | yes when verified soundEvidence exists | fixture | domain contract | dedicated V2 browser Hanja path still needed |
| FINAL SEEK | FUNCTIONAL | yes | fixture | V2 browser flow | richer reconstruction/hint ladder not ported |
| Memory evidence recording | RUNTIME_VERIFIED | yes | fixture | V2 Memory Ladder browser flow | long-term calibration still needs representative history |
| Memory advisory to Ready | FUNCTIONAL | yes | fixture | Ready bridge contract | live cross-app current-candidate roundtrip unverified |
| Ready Planner directive intake | RUNTIME_VERIFIED | yes | fixture contract | browser directed lexical-id test | live current Ready runtime integration unverified |
| Session reload/resume | RUNTIME_VERIFIED | yes | fixture | browser reload test | background/PWA lifecycle not verified |
| Exploration crew / child-facing polished UI | SKELETON | partial | no | minimal V2 shell | product UI redesign still required |
| Mission management surface | RUNTIME_VERIFIED | yes | N/A | selection/rename/archive/delete browser flow | richer history/filtering/bulk actions pending |
| Records / wordbook surfaces | RUNTIME_VERIFIED | yes | fixture/history-shaped | cumulative wordbook + weakness dashboard browser flow | filtering/search/detail drill-down pending |
| PWA install/offline/update | NOT_STARTED | no | no | none for V2 | V2 service-worker/release integration pending |
| Physical device behavior | NOT_STARTED | no | no | DEVICE_VERIFIED=0 | camera/touch/keyboard/install all pending |
| Production/release | NOT_STARTED | no | no | none | intentional hold |

## Claim levels

- PRODUCT_COMPLETION: approximately 44%
- CODED: approximately 61%
- CI_VERIFIED: approximately 55%
- BROWSER_RUNTIME_VERIFIED: approximately 46%
- DEVICE_VERIFIED: 0%
- RELEASE_VERIFIED: 0%

These values are conservative product-level estimates, not code-volume or gate-count ratios.

### 2026-09-21 surgery increment
- Mission lifecycle ownership now includes list/select/rename/archive/delete.
- Active-session mission deletion fails closed.
- OCR review rows can be corrected or excluded before commit.
- OCR commit lands in the mission-management surface rather than pretending the home summary is management.
- Exact pre-document code HEAD `6c419115797afca6e52fdcfc84edc99150769d7c` passed:
  - Validate Hide Runtime V2 #26 — SUCCESS
  - Validate Hide & Seek #480 — SUCCESS
- The completion increase reflects these reachable product capabilities only; test/doc additions themselves do not increase completion.

## Reusable validated asset pool — separate from V2 completion

Approximately 65% maturity for reusable assets/contracts:
- shared OCR adapter contract
- language model/evidence truth boundaries
- Ready Learning Basis adapter
- memory advisory ownership
- Ready Learning Engine / Planner review directive contract
- legacy fixtures/regressions
- migration source data
- exploration/learning canonical decisions

This 65% SHALL NOT be averaged into V2 PRODUCT_COMPLETION.

## Rewrite cutover conditions

V2 cannot replace V1 root entry until all are true:
1. all critical product journeys are present in V2;
2. mission management and review editing are functional;
3. representative OCR inputs pass against current provider path;
4. mobile responsive/touch/keyboard checks pass;
5. PWA persistence/update path is V2-owned;
6. current Ready ↔ Hide roundtrip is verified against frozen candidates;
7. V1 legacy migration regression passes;
8. no critical feature depends on V1 app.js/hide-runtime/hide-bridge;
9. DEVICE_VERIFIED is performed for camera/mobile claims;
10. human approval is recorded for cutover.

## Current exact validation evidence before this document commit

Head before matrix document: 63db5206a836050c3dfe5f2b9fd0238d6baeb464
- Validate Hide Runtime V2 #16: SUCCESS
- Validate Hide & Seek #470: SUCCESS
- no Netlify / deploy / merge / production / device verification


### Memory Ladder / records surgery increment
- V2 Memory Ladder derives memory strength, next review priority, recovery status and weakness dimensions from V2 evidence.
- Weakness dimensions now include semantic, phonological, orthographic, confusion, slow/timeout recall, hint dependency and decay.
- Spaced unassisted recall is distinguished from immediate recovery.
- Wordbook merges the same lexical item across missions without duplicating the memory identity.
- Records screen exposes aggregate memory state and per-word review priority.
- Exact pre-document code HEAD `065f9064c23b2198719573da559e5618109f940d` passed V2 #33 and full Hide #487.
- Completion increase reflects the newly reachable Memory Ladder/wordbook product path only.
