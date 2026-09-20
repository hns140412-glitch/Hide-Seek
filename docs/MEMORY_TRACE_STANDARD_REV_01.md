# Hide & Seek Memory Trace Standard — REV_01

Status: PROJECT WORKING STANDARD / IMPLEMENTATION INPUT / NOT CENTRAL TAKY CANONICAL  
Owner: Hide & Seek learning engine  
Purpose: 흩어진 학습·오류·힌트·기억 흔적을 하나의 체계로 묶고, "답을 보여주는 힌트"가 아니라 "개인 기억경로를 복구하는 학습 개입"을 구현하기 위한 기준.

---

## 0. 핵심 선언

**TRACE ≠ SCORE**  
**HINT ≠ ANSWER REVEAL**  
**ASSISTED SUCCESS ≠ RECOVERED MEMORY**  
**UNCERTAINTY ≠ WRONG**  
**CURRENT SHEET WEAKNESS ≠ LONG-TERM MEMORY WEAKNESS**  
**GENERIC CUE ≠ PERSONAL MEMORY TRACE**

Memory Trail의 목적은 힌트 단계를 늘리는 것이 아니다.

> 아이가 실제 학습 중 남긴 기억 흔적을 보존하고, 막혔을 때 가장 적은 도움으로 그 흔적을 다시 열고, 이후 무힌트 회상으로 복구를 증명한다.

---

# 1. 흔적 계층

## T0. SOURCE TRACE — 원자료 흔적
학습내용이 어디에서 왔는지 보존한다.

- sheetId
- sourcePageId
- captureSessionId
- source order
- OCR confidence
- manuallyEdited
- reviewConfirmed

학습 개입이 원자료를 임의 생성·변형하면 안 된다.

## T1. ACQUISITION TRACE — 처음 만난 흔적
FIRST FIND에서 실제로 무엇을 경험했는지 기록한다.

후보:
- seenAt
- meaningSeen
- pronunciationPlayed
- exampleSeen
- sceneCueId
- shapeCueId
- learnerUnsure
- exposureCount

Hard:
- `learnerUnsure`는 WRONG으로 기록하지 않는다.
- 실제로 보여준 scene/sound/shape만 나중에 "기억 흔적"으로 재사용한다.
- 실패 후 처음 생성한 장면을 "예전에 본 기억"처럼 가장하지 않는다.

## T2. RECOGNITION TRACE — 의미 인식 흔적
MEANING CLUE에서 저장한다.

- direction: ENG_TO_KOR | KOR_TO_ENG
- result: CORRECT | WRONG | SLOW_CORRECT
- elapsedMs
- selectedChoiceId / selectedLabel
- confusedWithWordId when resolvable
- attemptNo

Hard:
- 단순 WRONG count만 남기지 않는다.
- 무엇과 헷갈렸는지 보존할 수 있으면 보존한다.

## T3. ASSOCIATION TRACE — 연결 흔적
CONNECTION TRAIL에서 저장한다.

- leftWordId
- selectedRightWordId
- result
- elapsedMs
- confusionPair
- recurrenceRound

Hard:
- 오연결은 단순 `wrong++`으로만 축약하지 않는다.
- 반복되는 confusion pair는 이후 Memory Trail의 개인 단서가 될 수 있다.

## T4. RETRIEVAL TRACE — 철자 회상 흔적
FINAL SEEK에서 저장한다.

- blank positions
- correct key set
- wrong key choice
- wrong slot
- elapsedMs
- PASS
- TIMEOUT
- SLOW_CORRECT
- wrongAttempts
- attempt sequence

Hard:
- "틀렸다"보다 **어디에서 어떻게 틀렸는지**가 우선이다.
- 동일 단어라도 오류 위치·오류 문자는 서로 다른 약점이다.

## T5. ASSISTANCE TRACE — 도움 흔적
Memory Trail 사용 시 저장한다.

- cueType
- cueSource
- cueOrder
- shownAt
- revealCost
- responseAfterCue
- elapsedAfterCue
- hintDependency

cueType:
- SCENE
- MEANING
- SOUND
- SHAPE
- ERROR_TRACE
- CONFUSION_TRACE
- FRAGMENT
- MINIMUM_REVEAL

cueSource:
- PRIOR_ACTUAL_EXPOSURE
- PERSONAL_ERROR
- PERSONAL_CONFUSION
- SOURCE_MEANING
- GENERATED_STRUCTURE
- LAST_RESORT_REVEAL

Hard:
- PRIOR_ACTUAL_EXPOSURE가 있으면 GENERATED_STRUCTURE보다 우선한다.
- MINIMUM_REVEAL은 최후 수단이다.
- revealCost가 높은 도움일수록 숙달 판정 신뢰도를 낮춘다.

## T6. RECOVERY TRACE — 회복 증명
SEEK AGAIN 이후 기록한다.

- assistedAttemptId
- spacingDistance
- interveningItemCount
- unassistedResult
- unassistedElapsedMs
- recoveredWithoutHintAt

Hard:
- 힌트 받고 맞힘 = assisted recall.
- recovery는 **후속 무힌트 회상 성공**이 있어야 성립한다.
- 같은 문제를 즉시 반복해 맞힌 것은 recovery proof로 사용하지 않는다.

## T7. LONG-TERM TRACE — 장기기억 흔적
현재 시험지 완료 이후 별도 관리한다.

- firstSeen
- lastSeen
- sourceRefs
- correctTotal
- wrongTotal
- consecutiveCorrect
- lastWrong
- memoryStrength
- nextReviewPriority
- past-memory event history

Hard:
- current-sheet readiness와 분리.
- 현재 학습을 방해하지 않는다.
- 동일 evidence를 재동기화해 cumulative total을 중복 가산하지 않는다.

---

# 2. MEMORY SIGNATURE — 단어별 개인 기억 서명

각 단어는 단일 weakScore가 아니라 다음 축으로 해석한다.

- semanticWeakness
- recognitionWeakness
- phonologicalWeakness
- orthographicWeakness
- confusionPattern
- slowRecall
- timeoutRisk
- hintDependency
- recoveryStatus
- longTermDecay

이 값은 원시 trace에서 파생한다.
원시 trace를 덮어쓰거나 버리고 점수만 저장하지 않는다.

**TRACE FIRST → PROFILE DERIVED**

---

# 3. Adaptive Memory Trail 선택 규칙

고정된 1→2→3→4 단계 금지.

### semanticWeakness가 큰 경우
PRIOR SCENE → MEANING → SOUND → SHAPE

### 뜻은 안정적이나 철자가 약한 경우
SOUND → SHAPE → PERSONAL ERROR TRACE → FRAGMENT

### 특정 보기/단어와 반복 혼동
CONFUSION TRACE → MEANING CONTRAST → SOUND/SHAPE

### timeout/slow recall 중심
짧은 SOUND 또는 SHAPE → 재시도
불필요한 의미 공개 금지.

### hint dependency가 반복
이전 고비용 cue보다 한 단계 낮은 cue부터 시작하고,
후속 unassisted recall을 강화한다.

### trace가 충분하지 않은 신규 단어
SOURCE MEANING / SOUND / GENERATED SHAPE를 제한적으로 사용.
"예전에 본 흔적"으로 표현하지 않는다.

---

# 4. Cue Cost — 도움 강도

도움은 정답 노출량에 따라 비용을 가진다.

- Cost 0: 실제 이전 장면/문맥 회상 유도
- Cost 1: 의미 또는 소리 재활성화
- Cost 2: 단어 형태/chunk 구조
- Cost 3: 개인 오류 위치/혼동 대비
- Cost 4: 철자 fragment
- Cost 5: 한 글자 reveal

숙달 판정은 단순 성공 여부가 아니라:
`success × cueCost × latency × laterUnassistedRecall`
의 관계로 해석한다.

정확한 수치 가중치는 CONTROLLED FLEX이며 현재 고정하지 않는다.

---

# 5. 특별함의 핵심 — 흔적 재사용 우선순위

Memory Trail은 "새 힌트를 잘 만드는 기능"이 아니라
**이미 생긴 개인 기억 흔적을 잘 되찾는 기능**이어야 한다.

우선순위:

1. 아이가 실제로 본/들은 흔적
2. 아이가 실제로 틀린 흔적
3. 아이가 실제로 혼동한 상대
4. 원자료의 의미/문맥
5. 단어 구조에서 안전하게 파생한 형태 cue
6. 최후의 최소 정답 reveal

Generic AI mnemonic이나 사후 생성 장면은 기본 우선순위에서 제외한다.
사용 시 반드시 GENERATED로 provenance를 남긴다.

---

# 6. Chapter 연결

## FIRST FIND
"기억 흔적 생성" 단계.
보여준 장면·뜻·발음·형태와 unsure를 기록한다.

## MEANING CLUE
의미 경로 진단.
wrong choice와 방향/속도를 저장한다.

## CONNECTION TRAIL
단어↔뜻 confusion pair를 진단한다.

## HIDDEN WORDS
단순 weakScore 목록이 아니라
어떤 종류의 약점인지 보여주는 준비 단계가 되어야 한다.

## FINAL SEEK
철자 회상 + Memory Trail 개입.
힌트는 adaptive intervention이다.

## SEEK AGAIN
assisted recall을 unassisted recall로 바꾸는 회복 단계.

## MEMORY EVENT
완료된 현재 과제와 분리된 장기 회상 관찰 단계.

---

# 7. 현재 코드에서 확인된 교정 대상

1. FIRST FIND `아직 헷갈려`가 `wrong++`으로 처리됨.
   - FAIL: UNCERTAINTY ≠ WRONG.

2. CONNECTION 오연결이 단순 wrong 증가로 축약됨.
   - confusion pair trace 필요.

3. MEANING CLUE가 wrong 선택 상대를 충분히 보존하지 않음.
   - selectedChoice/confusedWith 필요.

4. SCENE cue가 실제 FIRST FIND exposure 저장본이 아니라 예문에서 사후 생성됨.
   - GENERATED_STRUCTURE로 강등하고 실제 scene exposure provenance 필요.

5. ERROR_TRACE가 현재 Final Seek session 중심.
   - word-level/session-level trace history로 승격 필요.

6. Memory Trail plan이 FIRST FIND unsure / CONNECTION confusion을 아직 활용하지 못함.

7. SEEK AGAIN이 "후속" 재회상은 하지만 spacingDistance/interveningItemCount 기준이 명시되지 않음.
   - immediate repeat 방지 증명 필요.

8. cumulative lexicon은 동일 evidence 재동기화 시 idempotency를 다시 검증해야 함.

9. `HINT_USED` 하나로 도움의 종류/강도를 축약하면 안 됨.
   - hintTrace/cueCost 기반 해석 필요.

10. 현재 static CI는 trace semantics의 실제 행동을 증명하지 못함.
    - fixture 기반 behavior validation 필요.

---

# 8. 금지 규칙

- "힌트" 버튼을 누를 때마다 무조건 답을 더 많이 보여주기.
- 모든 단어에 동일 cue 순서를 적용하기.
- unsure를 wrong으로 간주하기.
- generated cue를 실제 과거 기억처럼 표현하기.
- hint-assisted success를 완전 숙달로 처리하기.
- raw trace를 없애고 weakScore 하나만 보존하기.
- current-sheet weakness와 long-term memory를 하나의 점수로 합치기.
- 즉시 반복 성공을 memory recovery로 인정하기.
- 정답을 알려준 뒤 "스스로 기억했다"고 기록하기.

---

# 9. 검증 기준

PASS를 위해 최소 확인:

- FIRST FIND unsure가 WRONG과 분리되는가?
- 실제 exposure trace가 저장되는가?
- MEANING wrong choice 상대가 보존되는가?
- CONNECTION confusion pair가 보존되는가?
- FINAL SEEK error position/letter가 보존되는가?
- Memory Trail이 단어별로 다른 path를 선택하는가?
- cue source와 cue cost가 기록되는가?
- assisted success가 recovery로 즉시 승격되지 않는가?
- 최소 한 번의 later unassisted recall이 필요한가?
- long-term totals가 동일 evidence에 대해 idempotent한가?
- current task flow를 장기 memory event가 방해하지 않는가?

---

# 10. 구현 순서

1. Trace schema
2. FIRST FIND uncertainty/exposure trace
3. MEANING selected-choice trace
4. CONNECTION confusion trace
5. FINAL SEEK retrieval/error trace persistence
6. Memory Signature derivation
7. adaptive cue selector
8. cue provenance + cost
9. SEEK AGAIN spacing + unassisted recovery proof
10. long-term idempotent aggregation
11. behavior fixtures
12. UI polish

**UI 연출보다 trace integrity가 먼저다.**
