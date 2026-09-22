# Hide & Seek Runtime V2 Architecture

Status: REWRITE / BRANCH-ONLY / DO NOT MERGE
Branch: rewrite/hide-runtime-v2-2026-09-21
Reference V1 HEAD: cbc2939002c90775e492026345cbc54f23363a3d

## Rewrite decision

V1 is retained as reference/rollback evidence only. The V2 runtime does not load V1 app.js, hide-runtime.js or hide-bridge.js.

Root cause being removed:
- monolithic application state and UI ownership;
- global mutable S state;
- learning/domain/UI/persistence coupling;
- broad change amplification;
- validation confidence that exceeded product completion.

## V2 owners

- src/v2/app-store.js — durable application state owner.
- src/v2/router.js — screen navigation owner.
- src/v2/mission-service.js — mission/item normalization and mutation owner.
- src/v2/learning-session.js — learning-session state machine owner.
- src/v2/memory-engine.js — Hide memory evidence and advisory owner.
- src/v2/capture-controller.js — OCR orchestration only; shared Family OCR adapter remains provider transport owner.
- src/v2/ready-bridge.js — Ready/Planner federation contract only.
- src/v2/legacy-migration.js — read-only V1 -> V2 migration adapter.
- src/v2/app.js — presentation/controller composition; no persistent-state ownership.

## Preserved validated assets

- hide-learning-basis-v01.js
- hide-language-evidence.js
- hide-language-model.js
- hide-family-ocr-adapter.js
- TAKY vision-ingest / HTTP / event-envelope primitives
- Ready reviewPolicyOwner / Planner scheduleOwner contract
- SPECIALIST_MEMORY_ADVISORY_ONLY authority
- Language Memory evidence truth boundary
- existing V1 test corpus as regression/reference evidence

## Explicitly not migrated

- V1 app.js execution architecture
- global S state
- V1 hide-runtime.js ownership pattern
- V1 hide-bridge.js dependence on global app state
- stale deployed endpoint assumptions as integration proof

## Migration boundary

V1 localStorage key hide_seek_state is never deleted by V2.
V2 writes hide_seek_v2_state.
Legacy missions/items/evidence are projected into V2 through src/v2/legacy-migration.js.
Cutover is forbidden until migration regression and V2 product-flow evidence pass.

## Current end-to-end path

V2 Store -> Mission -> Learning Session -> Evidence -> Memory Summary -> Ready advisory.

Variable input path:
image files -> FamilyCaptureOcrAdapter -> OCR review -> V2 Mission.

Ready review path:
EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE -> lexical ID target queue -> V2 learning session -> new evidence -> TASK_COMPLETED event/result.

## Cutover conditions

1. architecture isolation gate PASS;
2. JavaScript syntax PASS;
3. V1 regression suite remains PASS;
4. V2 browser E2E PASS for English/Korean/Hanja and OCR;
5. non-destructive V1 migration PASS;
6. Ready directive roundtrip PASS;
7. representative mobile viewport/UI review PASS;
8. representative real-input OCR evidence remains separately classified;
9. device-only behavior remains unclaimed until DEVICE_VERIFIED;
10. human approval before merge/deploy.
