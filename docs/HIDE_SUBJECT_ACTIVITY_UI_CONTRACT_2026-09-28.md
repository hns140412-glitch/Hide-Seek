# Hide & Seek — 과목별 학습 활동 · UI 계약
Date: 2026-09-28  
Status: DRAFT_REVIEW_REQUIRED / DESIGN_BINDING_ONLY / NOT_RUNTIME_ACTIVE / NOT_RELEASED  
Owner: Hide & Seek project. Subordinate to applicable TAKY / Learning App Family / Hide current owner.  
Machine-readable companion: docs/hide-subject-activity-binding.v1.json

## 0. 의도와 기존 상태 상속
기존 영어 중심 Hide 학습의 명확성과 회상 중심 구조를 공통 기본형으로 상속한다. 국어·한자·사회·과학을 별개의 Snap & Pop식 게임/지도/섬으로 만들지 않는다. 과목마다 색을 바꿔 같은 문제를 제공하는 것도 금지한다. 개별 과제가 요구하는 관찰·추론·이미징·묶기·복원·회상에 따라 작은 활동 화면을 선택한다.

현재 검토한 소스는 Hide PR #22 exact head b58d99d866d9e62d7ec8bd9d8f54c9f717ed9daf이며, PR #22는 기존 PR #20/PR #12 계열 위의 DRAFT이다. PR #12와 #19를 병합·리베이스하지 않는다. PR #22의 TRACE/LINK/CORE/RECALL 표기는 **정보 표시 상태**이며 자유 선택 가능한 네 모드의 구현 완료를 뜻하지 않는다. 이 문서는 실제 제품 활성화가 아닌 상세 설계/기계 판독형 계약이다.

승인 비주얼: TAKY-LAF-HIDE-HOME-MOSSFALL-20260927-A, 원본 941×1672, approved home environment only. 자산 SHA-256 1f7aa500a177e25820649cc485355297cbc4fb89909df1f7f43e4ff7ddbe2419. 원화 재생성·크롭·캐릭터 삽입 금지. PR #22의 GitHub 원본 PNG 바이너리 연결/1:1 QA는 아직 OPEN. 실패 참고 이미지 expedition.html은 레이아웃 권위가 아니다.

## 1. 바뀌는 결정의 정확한 경계
**PRESERVE:** 기존 영어 학습 의미, 기존 승인 시안, 아이가 주체인 탐험, 모드 자유 선택 설계, 음성/단서 보조, 약점·혼동·보조 여부·무힌트 회상을 분리한 기록, 역할 소유권, 앱 이동 후 동일 Ready session/task/lap.  
**ADJUST:** 과거의 '카드 전면 금지'를 '홈/주요 세계 화면의 반복 대시보드 카드 금지; 학습 활동 내부의 의도 있는 카드·조각·묶음·비교는 허용'으로 세분화한다. 이것은 홈 시안의 승인 상태를 변경하지 않는다.  
**ADD/DESIGN ONLY:** 과제 선택형 렌더러, 과목별 스킬 축, 예측→이미징→검증→회상 증거, 분류·관계형 상호작용, 사회·과학 별도 도메인 어댑터.  
**HOLD:** 자동 모드 전환, 실제 분류 UI 배포, 사회·과학의 V2 런타임 등록, 새 에셋, 원본 한자 교재 OCR의 확정 지식화, main 병합·Netlify.

## 2. 공통 모드와 학습 실제 수행
TRACE / 흔적 찾기: 형태·소리·뜻·개념을 처음 관찰하고 구별한다. 노출, 힌트 열람, 듣기만으로 회상 성공 처리하지 않는다.  
LINK / 연결 찾기: 구성 요소→뜻, 어휘 간 관계, 의미군, 사건의 선후·인과, 분류 기준, 근거를 찾는다. 아이가 먼저 예측한 뒤 근거를 확인한다.  
CORE / 핵심 조각: 철자·한자 구성·문장 핵심·연결 원리·실험 결과의 필요한 부분을 복원하고 적용한다. 전체 키보드 타이핑은 강제하지 않는다.  
RECALL / 숨은 단어: 답이 가려진 상태에서 스스로 회상한다. 틀리면 필요한 만큼 도움을 주고 **이후 별도 무힌트 재시도**로 회복을 확인한다.

네 모드는 아동의 선택 가능한 활동 분류이며 반드시 순차 진행하는 수업 단계가 아니다. 기존 V2 내부 상태 MEMORIZE / FIRST_FIND / MEANING / DOMAIN_EXTENSION / FINAL_SEEK / SEEK_AGAIN과 명칭만 바꾸어 일대일 대응한다고 주장하지 않는다. 마이그레이션·회귀 검증 후 연결할 별도 어댑터가 필요하다.

## 3. 다섯 과목은 '문제 형식'을 공유하고 '판단 축'을 분리
| 과목 | 핵심 스킬 및 자료 | 유효한 활동 |
|---|---|---|
| 영어 | 발음·뜻·철자·접두사/어근/접미사(유효할 때)·문맥 | 1점 집중, 소리, 조각 복원, 간단 연결 |
| 국어 | 어휘 의미·접사·한자어 기원·유의/반의·문맥 근거 | 의미군 칩, 비교쌍, 문장 슬롯, 제한 보드 |
| 한자 | 자형·훈·음·구성 요소·한자어·문장 활용 | 중앙 한자, 어휘 군집, 부분 조립, 혼동 비교 |
| 사회 | 개념/범주·지리 위치·시간 순서·원인/결과·자료 근거 | 범주 묶기, 짧은 연표/관계 줄기, 지도 일부 가리기 |
| 과학 | 관찰·특징·분류·예상·원리·결과/근거 | 표본 조각, 관찰 마스크, 비교, 인과 연결 |

주의: 기존 hide-language-model.js와 hide-learning-basis-v01.js에는 ENGLISH/KOREAN/HANJA 세 언어 프로필만 있다. SOCIAL/SCIENCE를 여기에 넣어 자동 ENGLISH fallback시키지 않는다. 별도의 subject_domain + unit_type + skill_target 해석과 명시적 미지원 처리를 먼저 구현해야 한다. 영어의 현재 신규12/복습24 관찰 사례를 타 과목의 보편 정량 규칙으로 복제하지 않는다. 회차·급수·학년 범위와 계획은 Learning Engine/Planner가 정한다.

## 4. 렌더러 11종의 역할과 화면 문법
1. FOCUS_CUE: 핵심 항목 하나를 크게; 세부 도움은 필요시. 무한 카드 캐러셀 금지.
2. SOUND_KEY: 무전기형 듣기+글자 대안; 소리 선택은 회상과 별도 축.
3. SOFT_TILE: 의미/정답 후보를 가볍게 선택; 얇은 대비와 명확한 선택상태, 의미 없는 뒤집기 금지.
4. CLUSTER_CHIP: 중심 한자·어근/개념 주위에 3~6개 작은 조각. 이미 만난 단어부터 표시해 외울 목록 폭증 방지.
5. CONSTRAINED_GROUP: 아이가 기준을 보고 2~4군에 3~6개 조각을 탭해 넣는 유한 보드. 드래그는 부가기능; 탭→목적지 탭 필수.
6. RELATION_SPINE: 부분→전체, 형태→뜻, 선후, 원인→결과 등 관계 종류를 표시한 깨끗한 연결선. 무근거 인과 단정 방지.
7. COMPARISON_PAIR: 혼동쌍의 다른 점 한 가지에 초점을 두고 문장/그림/특징으로 판단.
8. SENTENCE_SLOT: 짧은 맥락과 빈칸; 모호한 복수 정답이면 자동 오답 처리하지 않고 수정/검토.
9. PART_ASSEMBLY: 영어 철자/한자 부분/핵심 개념 조각을 작은 트레이에서 탭 조립.
10. IMAGE_MASK: 지형/현상/관찰 그림 일부를 가리고 예상 후 공개. 이미지 노출은 정답/회상 성공이 아니다.
11. EXPANDABLE_FRAGMENT: 처음엔 한 줄, 요청 시 정확한 근거·뜻·예문을 펼침. 펼친 순간 hint evidence 기록.

최소 충분 렌더러 선택 원칙: 같은 과목이라도 익숙하지 않은 글자 한 개는 FOCUS_CUE, 유추 가능한 4개 어휘는 CLUSTER_CHIP, 두 의미의 차이는 COMPARISON_PAIR, 문맥 적용은 SENTENCE_SLOT이 더 적합하다. 따라서 과목당 UI 한 벌 고정은 금지한다.

## 5. 현대적 카드 표현: 기능이 모양을 결정
카드를 '화면을 채우는 사각 박스'가 아니라 **학습용 조작 조각**으로 제한한다. 2.5D Mossfall 세계관·승인 배경을 가리지 않는 얕고 투명한 소재, 밝고 절제된 표면, 미세한 그림자·선택광, 충분한 행간, 한 화면에 하나의 주활동을 기본으로 한다. 중앙 항목은 분명하게 크게, 주변 조각은 단어/한자/핵심 의미만 보여준다. 예문·훈음·출처·이미지 설명은 펼친 이후에 보여준다. 정보 조각의 색은 정오답만 의존하지 않으며 접근 가능한 문자·도형 상태가 동반된다. 정렬이 필요한 경우에도 기계적인 2열 카드 대시보드를 재현하지 않는다.

탭 우선, 짧은 선택/흡착은 선택적, 오배치 뒤 되돌리기/초기화 제공, 가림 해제/축소 동작, 한 화면 전환형 기본, 좁은 폰에서도 핵심 답안과 CTA 겹침 금지. 최소 터치 영역, VoiceOver 대체 텍스트, 키보드/스위치 접근성, 움직임 감소 설정을 고려한다. 기능 문구·한자·문항·버튼은 반드시 live HTML/CSS/JS 텍스트. 원화에 문자 굽기 금지. 이미지/캐릭터는 승인된 자산 슬롯만 활용.

## 6. 어근·유추·이미징·그룹핑의 진짜 학습 루프
1) **관찰:** 먼저 이미 아는 글자·어휘·현상과 새로운 단서를 보여준다.  
2) **아이의 예측:** 정답·해설 공개 전 무엇을 뜻할지, 어떻게 묶을지 스스로 택하거나 말한다. prediction/confidence 별도 기록.  
3) **상호작용:** 중심 요소와 관련 조각을 탭 연결/분류/부분 복원한다. 그룹핑은 정답 맞히기만 아니라 기준 설명을 짧게 유도한다.  
4) **이미징:** 유의미할 때만 간단한 장면을 연결한다. 아이가 이미지를 선택/구술하도록 지원하되 장식 이미지 수집으로 흐르지 않는다.  
5) **검증:** 실제 단어 뜻·문장·출처와 비교한다. 역사적 어원, 현재 형태소 분해, 한자 자형의 학습용 연상, 의미 장면을 서로 다른 라벨로 표시한다.  
6) **회상:** 설명·힌트를 숨긴 상태에서 다시 꺼낸다. 힌트 후 정답은 assisted recovery이지 unassisted recall이 아니다.  
7) **피드백:** 도움이 된 단서·혼동 항목·자력 회상 여부를 Hide가 관찰로 전송한다. 복습 필요성은 중앙 Learning Engine, 날짜 배치는 Planner가 결정한다.

예시(제공 교재를 토대로 한 UI 흐름의 예시이며 OCR 확정 데이터 아님): 한자 學(배울 학)을 크게 제시 → 학습/학교/학문 등의 어휘 조각 분류 → 뜻을 유추하도록 질문 → 문장 속 적절한 어휘를 넣음 → 해설 없이 훈음 또는 단어 회상. 다른 항목 記(기록할 기)와 함께 기록/기억/기입의 차이를 문맥으로 비교할 수 있지만 동형어/공통 어원 여부는 사전 검증 뒤 표기한다.

## 7. 지식·원본·이미지 진실성 게이트
검증된 역사적 어원, 검증된 형태소/투명한 합성어, 검증된 한자어 구조, 의미 연상 이미지, 학습용 이야기/기억법, 사회·과학 관찰 사실을 각각 다른 interpretation_kind로 보관한다. '학습상 유용한 상상 그림'을 '실제 자형 기원'처럼 설명하지 않는다. 출처 불명 OCR 문장이나 비유를 확정 원리로 사용하지 않는다. 제공 교재 사진은 소스 후보이며, 페이지/행/교재 정보·문맥·훈음/표기 검토 전 자동 확정하지 않는다. 진위가 부족하면 이미지 없이 정확한 텍스트·사용자 확인 가능한 학습 활동으로 축소한다.

## 8. 화면 상태와 이벤트
공통 화면 상태는 IDLE → PROMPT_VISIBLE → CHILD_COMMITTED → FEEDBACK → (ASSISTED_RECOVERY 또는 UNASSISTED_RETRY) → RESULT_PENDING_ACK이다. 모드 이동·화면 전환 중 현재 답안/도움/타이밍·원본 ref를 보존한다. 그룹핑은 부분 배치·되돌리기·완료를 분리한다. 이미지 가리기는 예상 전에 정답이 보이지 않도록 한다. 오답을 낙인찍거나 힌트를 벌점으로 쓰지 않는다. 음성 권한이 없으면 탭/문자 대안으로 진행한다.

활동 관찰에 최소 포함: event_id, member_id, subject, concept_skill_target, source_app, unit_id, mode, activity_id, renderer, attempt_index, answer_state, assisted, hint_types, objective_verified, unassisted, source_ref, occurred_at. 선택 필드: prediction, prediction_confidence, group_assignments, relation_type, latency_ms, confusion_target, image_prompt_ref, source_row_ref, session_id/task_id/lap_id. 항상 observation_only=true, global_mastery_claim=false. 예상 또는 자기 보고는 검증된 정답/장기기억으로 격상하지 않음.

## 9. 실제 바인딩 위치와 구현 순서
- Hide_Seek_UI_MASTER_LOGIC_REV_04.md: 정본 소유자. 이번 문서는 하위 제안으로 별도 유지하고 원본을 덮지 않음.
- hide-language-model.js / hide-learning-basis-v01.js: 영어·국어·한자 기존 해석을 우선 소비. 사회·과학은 신규 subject adapter가 생기기 전까지 기능 구현 완료 처리하지 않음.
- src/v2/learning-session.js: 기존 내부 상태/기억 흐름 보존. 모드선택/과제별 activity state를 넣을 때 상태 호환 테스트 필요.
- src/v2/app.js: 기존 V2 렌더러. 활동 프리미티브 도입 위치 후보이나 현재 PR에서는 수정하지 않음.
- src/v2/mossfall-world.js / assets/visual/hide-mossfall.binding.json: 승인 홈 세계관/자산 포인터 유지. 홈에 그룹핑 카드판 추가하지 않음.
- 새 docs/hide-subject-activity-binding.v1.json: 과목 5, 모드 4, 렌더러 11, 선택 규칙, 증거 계약, 소유권, 회귀 게이트를 기계 판독형으로 명시.
- 다음 구현 단계는 renderer adapter + 명시적 subject adapter → 소규모 fixture(영어/한자/국어/사회/과학 각 1개) → OCR 원본 및 증거 연결 → 모바일 시안 비교 → 1:1 검증. 기능 테스트만으로 디자인 승인 주장 금지.

## 10. 사례 검토를 활용하는 범위(복제 아님)
Quizlet 공식 Study Modes의 한 자료를 여러 문제 형식으로 활용하는 방식을 '모드 공통/문항 유형 분리' 원리로 참조한다. Anki Image Occlusion의 '그림의 일부를 가려 되찾기'는 관찰/그림 기반 단서에만 참고한다. Figma FigJam의 카드 정렬은 소규모 그룹핑에 맞춰 **무한 캔버스가 아닌 제한 보드**로 축소한다. Brilliant의 시각적 문제 해결과 단계적 피드백은 과학 관찰/예측 과제의 원칙 수준으로만 참고한다. 어느 제품도 Hide 화면을 복제하거나 기존 승인 아트를 대체하는 권위가 없다.

사례 URL:
- https://quizlet.com/features/study-modes
- https://docs.ankiweb.net/editing
- https://www.figma.com/templates/card-sorting-tool/
- https://brilliant.org/faq/

## 11. 승인/검증 전후 게이트
PRE: 현재 브랜치/부모 exact head, 승인 Visual ID, 기존 런타임·Owner 계약, PR의 미해결 OPEN을 확인한다. POST: 스키마/모드·과목 포괄, 경로 실재, 근거/기억 분리, 소유권 회귀, 카드 범위, 원화 불변, OCR/Ready/Planner 경계 확인. 실제 런타임 버튼·데이터 파이프라인·기기 검증 및 main merge/Netlify는 개별 승인과 검증 전까지 OPEN/HOLD.

**계약 작성 ≠ UI 코드 구현 ≠ 에셋 바인딩 PASS ≠ 기기 검증 ≠ 배포.**
