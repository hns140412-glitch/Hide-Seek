# Codex narrow implementation task — Hide HOME only — 2026-10-04

WORKTREE
D:\Git PWA\HIDE_DESIGN_UI_20261004
BASE
5da6594510cc89341054aafef66d5f4ea47a0210 (fresh origin/main detached worktree)

READ FIRST
- design/HIDE_HOME_DESIGN_AUTHORITY_CORRECTION_20261004.json
- Hide_Seek_UI_MASTER_LOGIC_REV_04.md
- app.js: renderHome and the existing learning entry functions it can safely reuse
- styles.css
- index.html only if needed for understanding existing chrome
Do NOT read unrelated repos or broad history.

GOAL
Correct only the child-facing HOME screen to the current approved Hide & Seek exploration authority while preserving current learning/data/runtime semantics.

HARD LOCKS
- Exact approved runtime background already exists at assets/world/hide_seek_forest_asset.png and SHA-256 is 1f7aa500a177e25820649cc485355297cbc4fb89909df1f7f43e4ff7ddbe2419. Reuse it. Do not generate/edit/re-encode the image.
- The approved reference is external Library authority; do NOT create or fake design/golden/home.png.
- Previous PR #194 Golden based on the 9-screen storyboard is superseded for current authority.
- Do not claim Golden parity or DESIGN PASS.
- Child-facing detective/police/arrest/case framing is forbidden by REV_04. Internal legacy identifiers may remain for compatibility.
- Background != UI. All brand, labels, buttons, progress, avatar/guide must remain live DOM.
- No changes to OCR semantics, Learning Engine evidence semantics, persistence schemas, sync/auth, badge logic, service worker, or API behavior.
- No push/merge/deploy/Netlify/network/API calls.
- No dependency installation.
- USER != DEBUGGER.

HOME REQUIRED RESULT
1. Full visual HOME environment uses the approved Mossfall background, covering the HOME region.
2. Live DOM top identity: "Hide & Seek" with small Korean subtitle consistent with current authority.
3. Four clear live mode entry controls, English first with smaller Korean:
   TRACE / 흔적 찾기
   LINK / 연결 찾기
   CORE / 핵심 조각
   RECALL / 숨은 단어
4. Reuse existing learning functions instead of inventing a second learning engine. Choose the closest safe existing entry function for each mode and document the mapping in a small source comment/test. If an exact semantic mapping is not safe, fail closed: route to the existing learning hub rather than misrepresenting behavior.
5. Keep camera/photo worksheet intake reachable as a secondary HOME action, not the dominant old "case" card.
6. Keep existing user/guide identity as separate live DOM; no baked-in character.
7. Remove HOME-visible legacy terms such as ACTIVE CASE, 수사, 사건, Case Mastery, CODE RED where they are child-facing HOME copy. Do not rewrite unrelated downstream screens in this task.
8. 390x844 must not horizontally overflow. Keep accessible button labels and existing safe-area behavior.

ALLOWED MODIFICATIONS
- app.js
- styles.css
- one or more focused tests under tests/
- design/HIDE_HOME_DESIGN_AUTHORITY_CORRECTION_20261004.json only if you need to append implementation evidence fields without changing authority
Do NOT change index.html unless strictly necessary; if it is necessary explain why in final output.

VALIDATION
Run only existing/no-cost local checks plus focused new test(s):
- node --check app.js
- any existing fast tests that cover HOME or syntax, without installing packages
- focused static/DOM assertions you add
- git diff --check
Do not run broad browser suites that require downloads/install.

FINAL RESPONSE
Return:
- files changed
- exact TRACE/LINK/CORE/RECALL function mapping
- tests/results
- remaining blockers
- explicitly state GOLDEN_PARITY=HOLD
No commit, no push.
