#!/usr/bin/env python3
from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
text_ext={".md",".txt",".js",".json",".html",".css",".yml",".yaml",".ps1",".sha256"}
fail=[]
for p in ROOT.rglob("*"):
    if not p.is_file() or ".git" in p.parts or p.suffix.lower() not in text_ext:
        continue
    s=p.read_text(encoding="utf-8",errors="ignore")
    if re.search(r"zpd",s,re.I):
        fail.append(f"SUPERSEDED_NAME:{p.relative_to(ROOT)}")

app=(ROOT/"app.js").read_text(encoding="utf-8")
ocr=(ROOT/"hide-family-ocr-adapter.js").read_text(encoding="utf-8")
for needle in [
    'const STORAGE_KEY="hide_seek_state";',
    'const ASSET_DB_NAME="hide-seek-assets";',
    'window.FamilyCaptureOcrAdapter',
    'function discoverCompatibleLegacyState()',
    'function discoverCompatibleLegacyAsset(k)'
]:
    source = ocr if needle == 'window.FamilyCaptureOcrAdapter' else app
    if needle not in source:
        fail.append("MISSING_MIGRATION_OR_NATIVE_ID:"+needle)

if fail:
    print("FAIL: Hide & Seek product-name purge")
    for x in fail: print(x)
    raise SystemExit(1)
print("PASS: current Hide & Seek text surfaces contain no superseded product name and native storage migration hooks exist")
