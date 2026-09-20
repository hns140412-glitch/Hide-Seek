# Hide & Seek Learning Trace Standard — REV_01

Status: IMPLEMENTATION STANDARD / NOT CANONICAL MASTER
Purpose: 학습 과정에서 생성되는 모든 "흔적"을 분리·보존하고, 취약도·기억사다리·장기기억이 서로 오염되지 않도록 하는 구현 기준.
Authority boundary: 이 문서는 current implementation branch의 정리 기준이며 Project Master를 대체하지 않는다.

## 1. Core Principle

흔적은 점수가 아니다.

```
RAW EVENT TRACE
→ typed trace
→ per-session interpretation
→ current-sheet weakness
→ cumulative memory aggregation
```

집계값을 다시 집계하지 않는다.
한 종류의 흔적을 다른 의미의 실패로 승격하지 않는다.

## 2. Trace Types

### 2.1 SOURCE TRACE
출처/증거 계보.

Fields:
- sourcePageId
- sourcePageOrder
- captureSessionId
- analysisBatchId
- sourceType
- recognition confidence
- manuallyEdited
- reviewConfirmed

Rules:
- SOURCE TRACE는 학습 성적이 아니다.
- OCR low confidence는 learner weakness로 계산하지 않는다.

### 2.2 ACQUISITION TRACE
처음 배우는 과정의 흔적.

Examples:
- FIRST FIND: SEEN
- FIRST FIND: UNSURE
- TTS replay
- meaning exposure
- response latency

Rules:
- UNSURE ≠ WRONG.
- 아직 배우는 단계의 불확실성은 최종 회상 실패로 기록하지 않는다.
- ACQUISITION TRACE는 현재 세션의 보강 우선도에는 쓸 수 있으나 lifetime wrongTotal에 직접 합산하지 않는다.

### 2.3 ASSOCIATION TRACE
영어↔뜻 연결 과정의 흔적.

Examples:
- MEANING CLUE CORRECT / SLOW_CORRECT / WRONG
- CONNECTION TRAIL MATCH / MISMATCH

Rules:
- CONNECTION MISMATCH ≠ FINAL RETRIEVAL WRONG.
- association weakness는 current-sheet priority에 반영 가능.
- long-term spelling memory의 wrongTotal로 직접 합치지 않는다.

### 2.4 RETRIEVAL TRACE
힌트 없이 또는 제한된 조건에서 기억을 꺼낸 결과.

Examples:
- CORRECT
- SLOW_CORRECT
- WRONG
- PASS
- TIMEOUT
- HINT_USED

Rules:
- FINAL SEEK / targeted re-check 결과가 핵심 RETRIEVAL TRACE다.
- PASS, TIMEOUT, HINT_USED는 각각 별도 의미로 보존한다.
- RETRIEVAL TRACE가 cumulative memory의 핵심 증거다.

### 2.5 ASSISTANCE TRACE
도움을 어떻게 받았는지에 대한 흔적.

Memory Trail steps:
- SCENE
- MEANING
- SOUND
- SHAPE
- ERROR_TRACE
- FRAGMENT
- MINIMUM_REVEAL

Fields:
- hintTrace[]
- step
- timestamp
- errorTrace[]
- chosen / needed / slot

Rules:
- assisted success ≠ independent recall.
- 힌트 사용 후 성공은 HINT_USED로 기록하고 needsUnassistedRecall=true.
- 도움을 많이 받은 사실은 정답을 무효화하지 않지만 mastery를 확정하지도 않는다.

### 2.6 RECALL TRACE
도움 이후 실제로 혼자 다시 기억했는지에 대한 흔적.

Fields:
- needsUnassistedRecall
- recoveredWithoutHintAt
- retry attempt result
- spacing context

Rules:
- Memory Trail의 종료조건은 "답을 완성함"이 아니다.
- 적절한 간격 뒤 무힌트 재회상 성공이 recovery evidence다.
- immediate same-answer repetition은 recovery evidence로 약하게 취급하거나 배제한다.

### 2.7 CUMULATIVE MEMORY TRACE
여러 시험지에 걸친 장기기억 증거.

Fields:
- lexicalId / sense identity
- firstSeen
- lastSeen
- sourceRefs[]
- sourceEvidence{}
- correctTotal
- wrongTotal
- memoryStrength
- nextReviewPriority

Rules:
- spelling 하나만으로 다른 sense를 무조건 병합하지 않는다.
- sourceEvidence는 sheet별 원천 집계다.
- sync는 idempotent해야 한다.
- 같은 source/history를 두 번 sync해도 totals가 증가하면 FAIL.
- Trail Mastery와 Memory Strength는 독립.

## 3. Current-sheet Weakness vs Lifetime Memory

두 축을 분리한다.

### CURRENT SHEET WEAKNESS
사용 가능:
- UNSURE
- meaning wrong
- slow recognition
- connection mismatch
- FINAL SEEK wrong/pass/timeout/hint
- recent response time

목적:
- HIDDEN WORDS priority
- Memory Trail routing
- SEEK AGAIN target

### LIFETIME MEMORY
사용 가능:
- verified retrieval evidence
- later unassisted recall
- source-separated evidence
- sparse past-memory event

금지:
- FIRST FIND UNSURE를 lifetime wrong으로 직접 합산
- CONNECTION MISMATCH를 lifetime wrong으로 직접 합산
- OCR uncertainty를 learner memory weakness로 합산

## 4. Memory Trail Routing

Memory Trail은 고정 순서가 아니다.

```
meaningWeak → SCENE / MEANING
recognitionSlow → SOUND
spellingWeak → SHAPE
personal error exists → ERROR_TRACE
still blocked → FRAGMENT
last resort → MINIMUM_REVEAL
then later → UNASSISTED RECALL
```

Irrelevant cue는 skip한다.

## 5. Error Trace Rule

개인 오류를 학습 단서로 사용할 수 있다.

Examples:
- wrong key chosen
- slot position
- repeated letter confusion

But:
- 오류를 그대로 정답으로 각인시키지 않는다.
- 아이에게 과거 오답을 장시간 노출하지 않는다.
- ERROR_TRACE는 짧은 비교 단서로만 사용한다.

## 6. No Silent Conversion

다음 자동 변환은 금지:

- UNSURE → WRONG
- MISMATCH → WRONG
- HINT_USED → CORRECT
- OCR LOW → learner weakness
- assisted recall → recovered
- current-sheet mastery → long-term memory strength

## 7. Aggregation Rule

원천 이벤트를 먼저 보존한다.

```
event history
→ sourceEvidence per sheet
→ deterministic totals
→ derived memoryStrength
```

누적값에 현재 집계를 재가산하는 방식 금지.

## 8. Validation Gate

FAIL if:
1. FIRST FIND UNSURE increments `wrong`.
2. CONNECTION MISMATCH increments `wrong`.
3. Same source sync increases totals on second execution.
4. Hint-used success clears unassisted-recall requirement.
5. OCR confidence affects learner memory score.
6. Memory Trail is fixed 1→2→3→reveal regardless of learner trace.
7. Trail Mastery and Memory Strength are merged.
8. Source evidence cannot be traced back to a sheet/session.

## 9. Current Implementation Mapping

- ACQUISITION: `S.learning.history`
- ASSOCIATION: `S.learning.history` + `learningStats`
- RETRIEVAL: `S.codeRed.history`
- ASSISTANCE: `hintTrace`, `errorTrace`
- RECALL: `needsUnassistedRecall`, `recoveredWithoutHintAt`
- CUMULATIVE: `S.lexicon[*].sourceEvidence`

## 10. Status Boundary

This standard improves trace correctness.
It does not prove:
- pedagogical effectiveness on real learners,
- device behavior,
- OCR live accuracy,
- production readiness.

Those remain separate validation gates.
