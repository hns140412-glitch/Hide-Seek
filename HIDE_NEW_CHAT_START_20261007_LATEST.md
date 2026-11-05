# HIDE & SEEK — NEW CHAT START — 2026-10-07 LATEST

최신 Hide & Seek 기준으로 재개.

먼저 아래 3가지만 확인:
1) D:\Git PWA\Hide & Seek\HIDE_NEW_CHAT_START_20261007_LATEST.md
2) 현재 git HEAD/status
3) 아래 관련 파일의 현재 테스트 결과
   - tools/test-term-decoder-v1.cjs
   - tools/test-learning-term-loader-v1.cjs

기존 dirty worktree는 다른 OPEN 작업이 섞여 있으므로 reset/checkout/clean 금지.
commit/push/merge/deploy/Netlify 금지.
이미 끝난 마이닝/설계 재감사 금지. OPEN만 진행.

## CURRENT
repo: D:\Git PWA\Hide & Seek
branch: family-character-profile-consumer-2026-09-30
HEAD: 5b29db8299237d41f9ce6d054256dda765f9cd09

사용자 확정 요구:
- Term Decoder는 사용자 연령/학년 확인 후 적용.
- 우선순위: age -> school_grade/school_stage -> subject -> unit/concept_skill_target -> learner evidence.
- 학년 미확인/충돌은 fail-closed.
- 동일 학년에서도 learner evidence로 난이도 +/-1 band만 허용.
- 저학년: 그림/소리/한글 뜻 중심, 한자 보조.
- 중학년: 쉬운 의미단위 1~2개 + 교과 연결.
- 고학년: 교과 핵심어 + 한자/형태소 분해 + 개념관계 + 전이.
- 중학생 이상: source가 있을 때 한자/형태소/영어 어근 교차해독.
- 낮은 semantic_transparency / etymology_confidence는 한자 분해 억제.
- Learning Engine이 해석/추천 owner. Hide는 consumer/executor + evidence emitter.
- TRACE -> LINK -> CORE -> RECALL 유지.

## IMPLEMENTATION STATUS
Claude Code 1차 구현 진행.
Codex 독립검토에서 아래 발견:
P1
1) fail-closed 뒤 stale authoritative projection 잔존 위험
2) live grade conflict가 local resolved grade를 뛰어넘을 위험
P2
3) subject-selection stale state
4) suppressed LINK가 가짜 morpheme retrieval evidence를 만들 수 있음
5) grade label HTML escaping

Claude Code가 위 Codex findings 기반 focused repair를 적용.
현재 관련 파일:
- hide-learning-term-loader-v1.js
- hide-term-decoder-v1.js
- hide-bridge.js
- hide-literacy-adapter-v1.js
- data/learning-term-recommendation-packs-v1.json
- tools/test-learning-term-loader-v1.cjs
- tools/test-term-decoder-v1.cjs

마지막 독립 실행 결과:
- TERM_DECODER_V1_SMOKE: PASS
- HIDE_LEARNING_TERM_LOADER_V1_TEST: PASS
- git diff --check: PASS

## IMPORTANT
worktree 전체는 dirty이며 기존 작업과 신규 Term Decoder 작업이 혼재.
관련 없는 변경을 건드리지 말 것.
임시 orchestration 파일(.run_*, .taky_*_prompt, .proc_tree, help 파일 등)은 정리 전까지 삭제 금지. 필요성 확인 후 정리.

## NEXT OPEN
1) 현재 파일 diff를 Codex findings 기준으로 readback.
2) Claude repair가 P1/P2를 실제 코드+테스트로 닫았는지 검증.
3) Codex post-fix 재검토 1회만 최소 호출.
4) P0/P1 없으면 TAKY 오케스트라 최종 비교검토:
   USER INTENT vs CODE vs TEST.
5) 필요 시 실제 브라우저 runtime smoke:
   - unknown grade fail-closed
   - lower elementary simplified presentation
   - E5 science static/live
   - evidence +/-1 bounded
   - low transparency/etymology decomposition suppression
   - subject selection
   - suppressed LINK non-scored behavior
6) 완료 전 commit/push/deploy 금지.

USER≠DEBUGGER.
동일 실패 반복 금지.
문서 PASS가 아니라 런타임/테스트 증거로 닫을 것.
