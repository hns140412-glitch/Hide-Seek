# HIDE & SEEK REBUILD MANIFEST V01

## Preserve as domain assets
- hide-language-model.js
- hide-learning-basis-v01.js
- hide-language-evidence.js
- resolved Ready learning-context boundary
- hide-family-ocr-adapter.js
- Memory Ladder evidence semantics

## Rewrite/split targets
- app.js -> shell + learning/retrieval views + state actions
- hide-runtime.js -> capture/runtime services separated from UI
- hide-bridge.js -> integration adapter only

## Target tree
src/
  shell/
  capture/
  vocabulary/
  retrieval/
  memory/
  language/
  integrations/
  persistence/
  views/

## Migration order
H0 shell/store boundary
H1 vocabulary normalized state
H2 retrieval state machine
H3 memory evidence engine
H4 capture/OCR adapter
H5 views
H6 bridge + old-path removal after parity

## Guard
No autonomous Hanja grade or review scheduling authority may appear during rebuild.
