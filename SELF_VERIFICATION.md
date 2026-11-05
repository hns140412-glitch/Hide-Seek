# Self-Verification · Hide & Seek world migration

## 1. 세계관 기준
- 현재 제품명은 **Hide & Seek**.
- 현재 세계관은 **보물찾기 + 술래잡기 + 숨은 단어 탐험**.
- 경찰/형사/수사/체포/검거/사건/사건파일 표현은 현재 사용자 경험에서 FAIL.
- 과거 명칭은 데이터 마이그레이션/저장키 호환에만 허용.

## 2. 학습 기능 보존
- 시험지 촬영, OCR, Review-before-Commit, 단어/뜻 학습, 취약 단어 반복, 최종 철자 검증 기능은 세계관 교체와 무관하게 보존.
- 시각적 세계관 변경이 OCR 정확도나 저장 안정성을 낮추면 FAIL.

## 3. 촬영 흐름
- `SHUTTER → IMMEDIATE TEMP SAVE → NEXT SHOT`
- 분석은 촬영 종료가 아님.
- 특정 장 재촬영은 정상 장을 보존하고 해당 장만 재처리.

## 4. 사용자 노출 용어
권장 흐름:
`FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → SEEK AGAIN`

진행 지표:
- Trail Mastery
- Memory Strength

## 5. 내부 호환
기존 학습 상태는 schema/signature 기반 호환 마이그레이션을 통해 현재 Hide & Seek 저장 구조로 승격하며, 과거 제품명 기반 저장키를 현행 코드에 유지하지 않는다.
이 값이 UI 문구나 현재 제품명으로 노출되면 FAIL.

## 6. 배포 검증
배포 후 실제 모바일에서 다음을 확인:
- Hide & Seek 명칭
- 옛 경찰/수사 세계관 문구 미노출
- 카메라/앨범
- OCR
- PWA 설치/오프라인/업데이트
- 터치 학습 흐름
