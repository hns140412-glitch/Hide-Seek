# Hide & Seek Runtime V2 Architecture

Status: REWRITE TARGET
Authority: TAKY TKY-PRODUCT-001 + Hide project canonical
Base reference: V1 validated HEAD cbc2939002c90775e492026345cbc54f23363a3d

## Rewrite principle
Preserve validated product/domain contracts; replace the defective execution architecture.

## Preserve
- Hide Language Model truth gates
- Language Evidence semantics
- Ready Learning Basis adapter
- Family OCR transport/evidence contract
- Capture asset preservation semantics
- Memory advisory contract
- Ready Learning Engine / Planner ownership boundary
- regression fixtures and known failure cases
- canonical product decisions / C2S

## Replace
- monolithic app.js runtime ownership
- mixed UI/domain/state responsibilities
- uncontrolled global mutable state
- direct DOM coupling across domain logic
- stale/hard-coded integration endpoints
- completion accounting based on internal artifact count

## Target modules
src/
  app/
    bootstrap.js
    router.js
    store.js
  mission/
    mission-model.js
    mission-service.js
    mission-store.js
  capture/
    capture-controller.js
    ocr-adapter.js
    review-controller.js
  learning/
    session-engine.js
    flow-controller.js
    first-find.js
    meaning-clue.js
    connection-trail.js
    final-seek.js
  language-memory/
    engine.js
    english.js
    korean.js
    hanja.js
    evidence.js
  memory/
    memory-ladder.js
    memory-signature.js
    review-advisory.js
  integration/
    ready-bridge.js
    planner-review.js
    snap-bridge.js
  persistence/
    local-store.js
    asset-store.js
    migration-v1.js
  ui/
    screens/
    components/

## Execution order
1. headless domain/session runtime
2. V1 state/data migration adapter
3. core mission path
4. capture/OCR/review
5. learning flow
6. memory evidence/advisory
7. Ready/Planner integration
8. UI screens and responsive states
9. representative real-input browser E2E
10. physical-device validation
11. frozen candidate / release gate

## Cutover
V1 remains reference/rollback only until V2 satisfies the product completion matrix for all critical journeys and regression/migration checks.
