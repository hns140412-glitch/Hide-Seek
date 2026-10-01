# Hide & Seek — Learning Engine Memory Routing Contract

Status: CANDIDATE / branch validation
Date: 2026-10-02

## Authority

Hide & Seek executes vocabulary interactions.
TAKY Learning Engine owns per-word adaptive routing, past-word exposure mix, and delayed-recall intent.
Planner owns dated allocation.

`HIDE != LEARNING ENGINE`
`LEARNING INTENT != CALENDAR DATE`

## Per-word route

- NEW / unobserved → TRACE
- recognition weakness → TRACE
- confusion / connection weakness → LINK
- spelling / orthographic weakness → CORE
- assisted-only / retrieval weakness → RECALL
- recent unassisted success → RECALL after a delay
- spaced stable success → low-priority RECALL maintenance

This does not force a global stage order. Direct mode selection may remain available.

## Current / past-word mixture

Established operating baseline:
- current assignment: 12
- past words: 24
- baseline past-word exposure share: 2/3

Learning Engine may adjust prompt exposure:
- weak current-word signal: 0.50 past share
- balanced/early/unknown: 2/3
- strong current-word signal: 0.75 past share

All current assignment words remain mandatory.
The mix changes exposure/distractor/review frequency only; it never removes current homework words.

## Delayed recall

Supported relative semantics:
- AFTER_INTERVENING_ITEMS, normally after 3-5 other items
- AFTER_RECOVERY
- NEXT_SESSION_SPACED_RECALL

No calendar date is emitted by Hide or the vocabulary policy.

## Runtime

`Hide word event`
→ `canonical item memory evidence`
→ `TAKY Learning Engine policy`
→ `authenticated decision API`
→ `Hide policy consumer`
→ `TRACE/LINK/CORE/RECALL execution`
→ `new evidence`

When central policy is absent or invalid, Hide falls back to the existing safe flow.
It must not invent a substitute policy.

## Branch implementation

- `hide-bridge.js`
  - authenticated policy request
  - policy validation/storage
  - per-word route lookup
  - delayed-recall queue exposure
  - adaptive TRACE distractor mix
- `app.js`
  - TRACE/LINK/CORE item evidence emission
  - adaptive TRACE option composition
  - non-blocking central policy refresh
- browser regression: `tests/central-evidence.spec.js`

No main merge or deployment is authorized by this contract.
