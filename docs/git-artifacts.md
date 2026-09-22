# Git 산출물 범위

GS-SAFETY-SIM-001의 구현, 직접 테스트, 지도·정책·시나리오, 검토된18개 합성 문서, 6종GLB와 Blender 원본·제작 스크립트, 필수 제원·현장 참고 자료, 원문·요구사항·최종QA 및 인계 기록을 버전 관리합니다.

실행 DB, 단말 비공개 캡처·세션·접속 코드, APK/빌드 결과, 내려받은 LLM·임베딩 가중치·실행 바이너리, 캐시 및 원시QA 반복 산출물은 로컬에 보존하고 Git에서 제외합니다. 기존파일은 삭제하지 않았습니다. docs/goal-runs/*/evidence/는 기본 제외하며, 검사된 최종 보고·매니페스트·요약만 명시적으로 포함합니다. 보고서의 원시 증거 링크와 .omo 작업 증거는 원래 실행 워크스페이스에서 확인할 수 있습니다. 모든 증거가 Git clone에 포함되는 것은 아닙니다.

APK·모델의 위치, 해시와 준비 절차는 [최종 인계](goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-handoff-index-v4.md)와 [로컬 실행 안내](demo-runbook.md)를 따릅니다. 현재 C6의 독립QA는 BLOCKED(4PASS/7BLOCKED/5NOT_RUN)입니다. Git 커밋은 QA 합격이나 배포 승인이 아닙니다.

C6 기록의 HEAD·소스·산출물 해시는 당시 동결 후보를 나타내므로 커밋 후에도 고치지 않습니다. 이번 Git 정리에서는 .gitignore와 추적 범위가 달라지고 README의 기존 별도 작업 부분은 스테이징하지 않습니다. C6와 현재Git트리를 동일한 후보로 간주하지 않습니다. 실행중인 C6서버·DB·모델은 변경하지 않았습니다.

기존 Hermes 설계와 K3s/Headlamp/Docmost 설치 문서 변경은 별도 작업으로 남겨 두었습니다. 현재 프로젝트를 재현하는 데 필요한 기존 docs/codex, docs/cranes, docs/field-demo와 원본Spierings제작 자료는 의존 입력으로 함께 포함합니다.
