#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
fail=[]

def read(path):
    return (ROOT/path).read_text(encoding="utf-8")

app=read("app.js")
if app.count("const $=(s,r=document)=>r.querySelector(s);") != 1:
    fail.append("SELECTOR_HELPER_SINGLE_DECLARATION")
if app.count("const $$=(s,r=document)=>[...r.querySelectorAll(s)];") != 1:
    fail.append("SELECTOR_HELPER_PLURAL_DECLARATION")
release=read("hide-release-v01.js")
pwa_update=read("hide-pwa-update-v01.js")
event_envelope=read("vendor/taky/event-envelope.js")
vision_ingest=read("vendor/taky/vision-ingest.js")
http_json=read("vendor/taky/http-json.js")
language_evidence=read("hide-language-evidence.js")
language_model=read("hide-language-model.js")
runtime=read("hide-runtime.js")
bridge=read("hide-bridge.js")
css=read("styles.css")
runtime_css=read("hide-runtime.css")
bridge_css=read("hide-bridge.css")
all_css=css+"\n"+runtime_css+"\n"+bridge_css
manifest=read("manifest.json")
index=read("index.html")

for token in ["길잡이","Guide Companion"]:
    if token.lower() in index.lower():
        fail.append("CHILD_FACING_LEGACY_CREW_TERM:"+token)

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
    "if(attempt.hintLevel>0)return false",
    "futureRecallCarryCount",
    "futureRecallWordIds",
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
    "$('.hidden-choice').forEach",
]:
    if needle not in app:
        fail.append("MISSING_LEARNING_RESUME_OR_PROVENANCE:"+needle)

for needle in [
    "THINKING_SCENE:1",
    "mockWeak",
    "stage:'MEMORY_LADDER'",
    "외울 때 만든 장면부터 다시 꺼내보자",
]:
    if needle not in app:
        fail.append("THINKING_SCENE_MEMORY_LADDER:"+needle)

for needle in [
    "renderMemorizeStage",
    "MEMORIZATION_EXPOSURE",
    "FIRST_RECALL_CORRECT",
    "FIRST_RECALL_WRONG",
    "missionRole",
    "inferMissionRole",
    "applyMissionRoles",
    "NEW",
    "REVIEW",
]:
    if needle not in app:
        fail.append("MEMORIZATION_FIRST_RECALL_CONTRACT:"+needle)

for needle in [
    "renderMockTestEntry",
    "MORNING_MOCK_TEST",
    "PARENT_CHILD",
    "ASSISTED_CORRECT",
    "RECOVERED_CORRECT",
    "assessment",
]:
    if needle not in app:
        fail.append("MORNING_MOCK_TEST_MEMORY_CONTRACT:"+needle)

for needle in [
    "SPECIALIST_MEMORY_ADVISORY_ONLY",
    "missionComposition",
    "morningMockTest",
    "thinkingSceneAssistanceCount",
]:
    if needle not in bridge:
        fail.append("READY_ADVISORY_HANDOFF_CONTRACT:"+needle)

for needle in [
    "taskStateForStatus",
    "status === 'COMPLETED' || status === 'TEST_READY'",
    "trailMastery:",
    "goal_id",
    "task_id",
    "lap_id",
    "child_id",
    "actor_role",
    "crew_member_id",
    "crew_member_name",
    "crew_rules_version",
    "explorationMissionId",
    "explorationMissionTitle",
    "inputActorRole",
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
    "memory_summary",
    "safeReturnUrl(taskState, event)",
    "specialist_report",
    "explorationMissionId",
    "inputActorRole",
]:
    if needle not in bridge:
        fail.append("MISSING_SHARED_SESSION_CONTRACT:"+needle)

for forbidden in [
    "S.guide.",
    "GUIDE_OPTIONS",
    "selectedGuide",
    "selectedGuideName",
]:
    if forbidden in app:
        fail.append("LEGACY_CREW_OWNER_REGRESSION:"+forbidden)

for needle in [
    'const CREW_AUTHORITY={owner:"snap-pop"',
    'crewMember:clone(DEFAULT_CREW_MEMBER)',
    'source:"LEGACY_GUIDE_MIGRATION"',
    '탐험 미션',
    '탐험대원',
]:
    if needle not in app:
        fail.append("MISSING_CREW_OR_MISSION_CONTRACT:"+needle)

for needle in [
    "inputActorRole",
    "S.sharedLearningContext?.actor_role",
]:
    if needle not in runtime:
        fail.append("MISSING_PARENT_CHILD_INPUT_PROVENANCE:"+needle)

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


family_ocr=read("hide-family-ocr-adapter.js")
for needle in [
    "analysis_domain",
    "HIDE_VOCABULARY",
    "FAMILY_CAPTURE_OCR_TRANSPORT",
    "/api/capture/analyze",
    "HIDE_VOCABULARY_RESULT_UNSUPPORTED",
    "TakyVisionIngest",
    "VisionIngest.validateEvidence",
    "OCR_EVIDENCE_MISMATCH",
    "vision_ingest_request_id",
    "TakyHttpJson",
    "HttpJson.request",
    "credentials:'same-origin'",
]:
    if needle not in family_ocr:
        fail.append("FAMILY_OCR_ADAPTER_CONTRACT:"+needle)

for needle in [
    "sourceColumn",
    "sourceRowIndex",
    "sourceColumnIndex",
]:
    if needle not in family_ocr:
        fail.append("FAMILY_OCR_LAYOUT_CONTRACT:"+needle)

for needle in [
    "missionComposition",
    "expectedNew:12",
    "expectedReview:24",
    "layoutIndependent:true",
    "MISSION_REVIEW_CONFIRMATION",
    "LEARNER_HISTORY_INFERENCE",
    "hide-role-toggle",
]:
    if needle not in runtime:
        fail.append("MISSION_COMPOSITION_CONTRACT:"+needle)

for needle in [
    "window.FamilyCaptureOcrAdapter",
    "analyzeVocabularyPage",
    "ocrAnalysisDomain",
    "reopenCommittedMission",
    "sourcePages",
    "editingSheetId",
]:
    if needle not in runtime:
        fail.append("HIDE_SHARED_OCR_USAGE:"+needle)

sw=read("sw.js")

for needle in [
    "importScripts('./hide-release-v01.js')",
    "const CACHE='hide-seek:'+RELEASE.release_id",
    "'./hide-family-ocr-adapter.js'",
    "'./hide-language-evidence.js'",
    "'./hide-runtime.js'",
    "'./hide-runtime.css'",
    "'./hide-bridge.js'",
    "'./hide-bridge.css'",
    "'./vendor/taky/release-contract.js'",
    "'./vendor/taky/pwa-update-state.js'",
    "'./vendor/taky/event-envelope.js'",
    "'./vendor/taky/vision-ingest.js'",
    "'./vendor/taky/http-json.js'",
    "'./hide-pwa-update-v01.js'",
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
    "globalThis.HideSeekReleaseDescriptor",
    "TakyReleaseContract",
    "const APP_REV=RELEASE.app_version",
    "const SCHEMA_VERSION=RELEASE.data_schema_version",
]:
    if needle not in app:
        fail.append("APP_RELEASE_CONTRACT:"+needle)

for needle in [
    "app_version:'REV_09'",
    "data_schema_version:9",
    "release_id:'hide-seek-rev09-r1'",
]:
    if needle not in release:
        fail.append("RELEASE_DESCRIPTOR_CONTRACT:"+needle)

for needle in [
    "const HIDE_RUNTIME_VERSION = '2026.09.21-c'",
]:
    if needle not in runtime:
        fail.append("RUNTIME_VERSION_CONTRACT:"+needle)

for needle in [
    "const BRIDGE_VERSION = '2026.09.21-b'",
]:
    if needle not in bridge:
        fail.append("BRIDGE_VERSION_CONTRACT:"+needle)

for needle in [
    "normalizedImageBase64",
    "function gemini",
    "Gemini API Key가 필요해요.",
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
    "source:'PAST_EXPOSURE'",
    "result:'MISMATCH'",
    "sourceSide:selectedTile.dataset.side",
    "source:'MEMORY_TRAIL'",
    "result:'UNASSISTED_RECALL'",
    "event:'MEMORIZATION_EXPOSURE'",
    "sceneText:w.example||''",
    "FIRST_RECALL_CORRECT",
    "FIRST_RECALL_WRONG",
]:
    if needle not in app:
        fail.append("TRACE_SEPARATION_CONTRACT:"+needle)



for needle in [
    "EventEnvelope.create",
    "globalThis.HideSeekPwaSafePoint=isSafeUpdatePoint",
]:
    if needle not in bridge:
        fail.append("TAKY_SHARED_BRIDGE_CONTRACT:"+needle)

for forbidden in ["const id = prefix =>","applyWaitingUpdate(","watchSafeUpdates("]:
    if forbidden in bridge:
        fail.append("DUPLICATE_SHARED_RUNTIME_OWNER:"+forbidden)

for needle in ["CAP-PWA-UPDATE-001","navigator.serviceWorker.register('./sw.js')"]:
    if needle not in pwa_update:
        fail.append("TAKY_SHARED_PWA_CONTRACT:"+needle)

for needle in ["buildRequest","normalizeResult","validateEvidence"]:
    if needle not in vision_ingest:
        fail.append("TAKY_SHARED_VISION_CONTRACT:"+needle)

for needle in ["request","normalizeStatus","buildRequestInit"]:
    if needle not in http_json:
        fail.append("TAKY_SHARED_HTTP_CONTRACT:"+needle)

for needle in [
    "SCHEMA_VERSION=2",
    "SOURCE_POLICY='VERIFIED_SOURCE_REQUIRED_FOR_HISTORICAL_CLAIM'",
    "invalidRecords",
    "SUPPORT_TYPES",
    "SOURCE_TYPES",
    "validSourceRef",
    "validNode",
    "historicalClaim",
    "validateRecord",
]:
    if needle not in language_evidence:
        fail.append("LANGUAGE_EVIDENCE_CONTRACT:"+needle)

for needle in [
    "ENGLISH",
    "KOREAN",
    "HANJA",
    "PREFIX",
    "ROOT",
    "ETYMOLOGY",
    "HANJA_ORIGIN",
    "RADICAL",
    "COMPONENT",
    "verificationState==='VERIFIED'",
    "MEANING_MAP",
    "renderMeaningMapHtml",
]:
    if needle not in language_model:
        fail.append("LANGUAGE_MODEL_CONTRACT:"+needle)

for needle in [
    "starterExploration",
    "renderStarterExplorationHtml",
    "CURATED_SEMANTIC_SUPPORT",
    "claimsHistoricalEtymology:false",
    "TRANSPARENT_COMPOUND",
    "SEMANTIC_SCENE",
]:
    if needle not in language_model:
        fail.append("THINKING_FIRST_LANGUAGE_SUPPORT:"+needle)

for needle in [
    "THINKING_SCENE",
    "MEANING_CONFIRMATION",
    "thinkingTrailUsed",
    "먼저 네 머릿속에 장면",
]:
    if needle not in app:
        fail.append("THINKING_FIRST_MEMORIZATION:"+needle)

for needle in [
    "FIRST_SEEN_PREDICTION",
    "recallScoreImpact:false",
    "transferSkillEvidence=true",
    "assessmentSource='LEARNER_SELF_REPORT'",
    "objectiveVerified=false",
    "자기판단 맞음+근접",
    "inferenceRecordSummary",
    "(S.sheets||[]).flatMap",
    "inference-outcome-btn",
    "bindInferenceOutcomeButtons",
    "document.querySelectorAll('.inference-outcome-btn')",
    "맞았어",
    "비슷했어",
    "달랐어",
    "prioritizeExistingAssistance",
    "TRANSFERABLE_INFERENCE_HISTORY",
    "adaptiveClue",
    "evidenceLevel",
    "currentWordApplicable:true",
    "calibrationEvidenceBasis:'LEARNER_SELF_REPORT'",
    "evidenceBasis:'LEARNER_SELF_REPORT'",
    "selfReportedFitRate",
    "inferenceWordDomain",
    "languageDomain:currentDomain",
    "inferenceRecordSummary(currentDomain)",
    "inferenceRecordSummary(inferenceWordDomain(w))",
    "domainInf=['ENGLISH','KOREAN','HANJA']",
    "hintPlanSource",
    "planSource:codeSession.hintPlanSource",
    "showParentExplanation",
    "supplementalMapHtml=role==='NEW'&&thinkingHtml?'':mapHtml",
    "VERIFIED_STRUCTURE_MAP",
    "VERIFIED_MEANING_MAP",
    "supportStep",
    "ROOT_PROGRESSIVE_REVEAL",
    "scene-step-next",
    "data-scene-link-step",
    "data-next-scene",
    "SCENE_PROGRESSIVE_REVEAL",
    "supportType:plan?.type||null",
    "PARENT_CHILD",
]:
    if needle not in app:
        fail.append("TRANSFERABLE_INFERENCE_CONTRACT:"+needle)

for needle in [
    ".scene-trail [data-scene-step][hidden]",
    ".scene-link[hidden]",
]:
    if needle not in all_css:
        fail.append("TRANSFERABLE_SCENE_CSS:"+needle)

for needle in [
    "summarizeInferenceSkill",
    "CLUE_LABELS",
    "clueLabel",
    "scene-trail",
    "prior-skill-cue",
    "RECALIBRATE",
    "parentExplanation",
    "clueOptions",
    "clueApplicableToPlan",
    "HANJA_ORIGIN",
    "COMPONENT",
    "RADICAL",
    "검증 구조",
    "preferredAssistanceSteps",
    "prioritizeExistingAssistance",
    "attempts>=3",
    "ESTABLISHED",
    "EMERGING",
    "evidenceLevel",
    "parent-explain-card",
    ".root-orbit-node[hidden]",
]:
    if needle not in language_model and needle not in css:
        fail.append("TRANSFERABLE_LANGUAGE_MODEL:"+needle)


for needle in [
    "globalThis.HideLanguageModel?.normalizeItem",
    "globalThis.HideLanguageModel?.hasVerifiedMeaningMap",
    "MEANING_MAP",
    "VERIFIED_LANGUAGE_MODEL",
]:
    if needle not in app:
        fail.append("LANGUAGE_MEMORY_LADDER_INTEGRATION:"+needle)

if fail:
    print("FAIL: Hide & Seek runtime contract")
    for item in fail:
        print(item)
    raise SystemExit(1)

print("PASS: Hide & Seek capture, review, shared-session, device, cache, migration and active-world contracts")
