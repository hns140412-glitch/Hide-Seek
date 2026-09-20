#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
fail=[]

def read(path):
    return (ROOT/path).read_text(encoding="utf-8")

app=read("app.js")
runtime=read("hide-runtime.js")
bridge=read("hide-bridge.js")
css=read("styles.css")
runtime_css=read("hide-runtime.css")
bridge_css=read("hide-bridge.css")
all_css=css+"\n"+runtime_css+"\n"+bridge_css
manifest=read("manifest.json")

for token in ["ZPD","수사","사건","체포","검거","경찰","CODE RED","Case Mastery","FIRST CONTACT","MEANING CHECK","WEAK WORD"]:
    if token.lower() in app.lower():
        fail.append("CHILD_FACING_LEGACY_APP:"+token)

for needle in [
    "SHUTTER",
]:
    pass


for needle in [
    "S.captureSession",
    "renderCaptureSession",
    "analyzeCaptureBatch",
    "captureFiles(",
]:
    if needle in app:
        fail.append("DUPLICATE_LEGACY_CAPTURE_OWNER:"+needle)

for needle in [
    "const CAPTURE_STATE_KEY = 'hideSeekCaptureSession'",
    "migrateLegacyCaptureSession",
    "delete S.captureSession",
]:
    if needle not in runtime:
        fail.append("MISSING_CANONICAL_CAPTURE_MIGRATION:"+needle)

for needle in [
    "captureSessionId",
    "analysisBatches",
    "saveCaptureBlob",
    "renderCaptureHub",
    "analyzeDirtyPages",
    "분석해도 촬영 세션은 끝나지 않아요",
    "needsReview: confidence === 'low'",
    "if (unresolved.length) return toast",
]:
    if needle not in runtime:
        fail.append("MISSING_CAPTURE_OR_REVIEW_CONTRACT:"+needle)

for needle in [
    "memoryWeaknessProfile",
    "buildMemoryLadder",
    "memorySceneCue",
    "memoryShapeCue",
    "memoryFragmentCue",
    "hintPlan:buildMemoryLadder(w)",
    "MINIMUM_REVEAL",
    "hintTrace:[]",
    "errorTrace:[]",
    "needsUnassistedRecall",
    "recoveredWithoutHintAt",
    "CONNECTION TRAIL",
    "meaningStartedAt",
    "elapsedMs",
    "optionLabel",
    "function connectionSet",
    "baseRounds",
    "hasWeak",
    "memoryEvents",
    "shownBySheet",
    "lastLexicalId",
    "markMemoryEventShown",
    "senseKey",
    "lexiconEntry",
    "syncSheetToLexicon",
    "selectPastMemoryEvent",
    "nextReviewPriority",
    "canonicalSpelling",
    "SLOW_CORRECT",
    "learningStats?.timeout",
    "learningStats?.slowCorrect",
    "['CORRECT','SLOW_CORRECT'].includes",
    "resumeCurrentLearning",
    "learningProvenance",
    "finalSeekAttempts",
    "seekAgainCycles",
    "traceList",
    "addWordTrace",
    "selectedId",
    "confusedWithId",
    "CONFUSION_TRACE",
    "lastConfusionTrace",
    "lastPersonalErrorTrace",
    "hintCueCost",
    "cueCost",
    "hintTypes",
    "interveningItemCount",
    "elapsedSinceAssistMs",
    "spacedEvidence",
    "immediateRecallAt",
    "deriveMemorySignature",
    "semanticWeakness",
    "recognitionWeakness",
    "phonologicalWeakness",
    "orthographicWeakness",
    "confusionPattern",
    "slowRecall",
    "timeoutRisk",
    "hintDependency",
    "recoveryStatus",
    "longTermDecay",
    "memorySignature:sig",
    "hiddenWordStrategy",
    "hiddenWordPriority",
    "HIDDEN_WORD_STRATEGY",
    "SEMANTIC_CONTRAST",
    "CONFUSION_CONTRAST",
    "SOUND_REACTIVATION",
    "ORTHOGRAPHIC_SCAFFOLD",
    "SPACED_RECALL",
    "hiddenWordActivityModel",
    "renderHiddenWordActivity",
    "HIDDEN_WORD_OUTCOME",
    "seekAgainResolved",
    "if(w.learningStats?.needsUnassistedRecall)return !!attempt.spacedEvidence",
    "memoryQualityModel",
    "reviewDecay",
    "reviewStrengthDelta",
    "memoryQuality:{recoveryBonus:quality.recoveryBonus,weaknessPenalty:quality.weaknessPenalty}",
    "memoryReasonLabel",
    "memoryStatusView",
    "memoryRecordSummary",
    "무힌트 재회상 필요",
    "뜻 혼동",
    "철자 취약",
    "느린 회상",
    "힌트 의존",
    "장기기억 약화",
    "$('.speak-retrace').forEach",
]:
    if needle not in app:
        fail.append("MISSING_LEARNING_RESUME_OR_PROVENANCE:"+needle)

for needle in [
    "taskStateForStatus",
    "status === 'COMPLETED' || status === 'TEST_READY'",
    "trailMastery:",
    "goal_id",
    "task_id",
    "lap_id",
    "child_id",
    "return_target",
    "learningHistoryCount",
    "finalSeekAttemptCount",
    "seekAgainRemainingCount",
    "learningProvenance",
    "cumulativeLexiconCount",
    "buildMemorySummary",
    "memorySummary: buildMemorySummary()",
    "averageMemoryStrength",
    "reasonCounts",
    "needsUnassistedRecallCount",
    "topReviewPriorities",
]:
    if needle not in bridge:
        fail.append("MISSING_SHARED_SESSION_CONTRACT:"+needle)

for legacy in [
    "필요한 열쇠 하나가 살짝 반응했어.",
    "정답 열쇠를 조금 더 눈여겨봐.",
]:
    if legacy in app:
        fail.append("RIGID_HINT_LADDER_REGRESSION:"+legacy)

for needle in [
    ".hide-camera-overlay",
    ".hide-phone-orientation-guard",
    ".hide-retake",
    ".slot.hint-target",
    "Tablet contract",
    "@media (min-width:768px)",
    "orientation:landscape",
]:
    if needle not in all_css:
        fail.append("MISSING_DEVICE_OR_CAPTURE_STYLE:"+needle)

for needle in ['"name":"Hide & Seek"','"orientation":"any"']:
    if needle.replace(" ","") not in manifest.replace(" ",""):
        fail.append("MANIFEST_CONTRACT:"+needle)

if css.count("@media (min-width:768px) and (orientation:landscape)") > 1:
    fail.append("DUPLICATE_TABLET_LANDSCAPE_RULE")


sw=read("sw.js")

for needle in [
    'const CACHE="hide-seek-capture-v05"',
    '"./hide-runtime.js"',
    '"./hide-runtime.css"',
    '"./hide-bridge.js"',
    '"./hide-bridge.css"',
]:
    if needle not in sw:
        fail.append("SERVICE_WORKER_CACHE_CONTRACT:"+needle)

for needle in [
    "migrateLegacyState",
    "window.HideCaptureRuntime?.migrateLegacyState?.()",
]:
    source = runtime if needle == "migrateLegacyState" else app
    if needle not in source:
        fail.append("IMPORT_MIGRATION_CONTRACT:"+needle)



for needle in [
    'const APP_REV="REV_08"',
    'const SCHEMA_VERSION=8',
]:
    if needle not in app:
        fail.append("APP_SCHEMA_REVISION_CONTRACT:"+needle)

for needle in [
    "const HIDE_RUNTIME_VERSION = '2026.09.20-b'",
]:
    if needle not in runtime:
        fail.append("RUNTIME_VERSION_CONTRACT:"+needle)

for needle in [
    "const BRIDGE_VERSION = '2026.09.20-c'",
]:
    if needle not in bridge:
        fail.append("BRIDGE_VERSION_CONTRACT:"+needle)

for needle in [
    "normalizedImageBase64",
    "function gemini",
    "renderManualEntry",
    "function dbDel",
]:
    if needle in app:
        fail.append("DEAD_LEGACY_OCR_PATH:"+needle)

function_spec=read("docs/FUNCTION_SPEC_REV_08.md")
for needle in [
    "# Hide & Seek Function Specification — REV_08 WORLD MIGRATION",
    "timeout, slow-correct",
    "`SLOW_CORRECT`",
]:
    if needle not in function_spec:
        fail.append("FUNCTION_SPEC_REV08_CONTRACT:"+needle)



trace_spec=read("docs/LEARNING_TRACE_STANDARD_REV_01.md")
for needle in [
    "UNSURE ≠ WRONG",
    "CONNECTION MISMATCH ≠ FINAL RETRIEVAL WRONG",
    "assisted success ≠ independent recall",
    "sourceEvidence per sheet",
]:
    if needle not in trace_spec:
        fail.append("LEARNING_TRACE_STANDARD:"+needle)

for forbidden in [
    "firstUnsure').onclick=()=>{w.wrong",
    "connectionMismatch=(w.learningStats.connectionMismatch||0)+1;w.wrong",
    "if(!ok){w.wrong=(w.wrong||0)+1",
    "meaningAnswer(btn,w,ok){$('[data-choice]').forEach",
    "if(ok){$(",
    "if($('.tile:not(.matched)').length===0)",
]:
    if forbidden in app:
        fail.append("TRACE_CONTAMINATION:"+forbidden)

for needle in [
    "$$('[data-choice]').forEach",
    "if(ok){$$(",
    "if($$('.tile:not(.matched)').length===0)",
    "learningStats.unsure",
    "addWordTrace(w,'acquisition'",
    "addWordTrace(w,'recognition'",
    "addWordTrace(w,'association'",
    "addWordTrace(w,'retrieval'",
    "addWordTrace(w,'assistance'",
    "addWordTrace(w,'recovery'",
    "learningStats.meaningWrong",
    "learningStats.connectionMismatch",
    "sourceEvidence",
    "legacyBaseline",
    "event:'EXPOSURE'",
    "sceneText:w.example||''",
    "source:'PAST_EXPOSURE'",
    "event:'LEARNER_UNSURE'",
    "result:'MISMATCH'",
    "sourceSide:selectedTile.dataset.side",
    "source:'MEMORY_TRAIL'",
    "result:'UNASSISTED_RECALL'",
]:
    if needle not in app:
        fail.append("TRACE_SEPARATION_CONTRACT:"+needle)

if fail:
    print("FAIL: Hide & Seek runtime contract")
    for item in fail:
        print(item)
    raise SystemExit(1)

print("PASS: Hide & Seek capture, review, shared-session, device, cache, migration and active-world contracts")
