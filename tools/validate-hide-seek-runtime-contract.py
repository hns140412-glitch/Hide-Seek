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
manifest=read("manifest.json")

for token in ["ZPD","수사","사건","체포","검거","경찰","CODE RED","Case Mastery","FIRST CONTACT","MEANING CHECK","WEAK WORD"]:
    if token.lower() in app.lower():
        fail.append("CHILD_FACING_LEGACY_APP:"+token)

for needle in [
    "SHUTTER",
]:
    pass

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
    "SLOW_CORRECT",
    "learningStats?.timeout",
    "learningStats?.slowCorrect",
    "codeSession.hintLevel>=4",
    "['CORRECT','SLOW_CORRECT'].includes",
    "resumeCurrentLearning",
    "learningProvenance",
    "finalSeekAttempts",
    "seekAgainCycles",
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
]:
    if needle not in bridge:
        fail.append("MISSING_SHARED_SESSION_CONTRACT:"+needle)

for needle in [
    ".hide-camera-overlay",
    ".hide-phone-orientation-guard",
    ".slot.hint-target",
    "Tablet contract",
    "@media (min-width:768px)",
    "orientation:landscape",
]:
    if needle not in css:
        fail.append("MISSING_DEVICE_OR_CAPTURE_STYLE:"+needle)

for needle in ['"name":"Hide & Seek"','"orientation":"any"']:
    if needle.replace(" ","") not in manifest.replace(" ",""):
        fail.append("MANIFEST_CONTRACT:"+needle)

if fail:
    print("FAIL: Hide & Seek runtime contract")
    for item in fail:
        print(item)
    raise SystemExit(1)

print("PASS: Hide & Seek capture, review, shared-session, device and active-world contracts")
