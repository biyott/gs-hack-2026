# GS Hack 2026

여러 애플리케이션과 제작 리소스를 함께 관리하는 모노레포입니다.

```text
apps/       애플리케이션별 소스 코드
resources/  Blender 모델 등 공유·제작 리소스
```

현재 Blender 상어 모델은 `resources/blender/shark-scene/`에 있습니다.

## GS 안전 시뮬레이터

중장비와 화재·가스의 두 시뮬레이션, 작업자 Flutter 앱, 관리자 웹, RAG 지식 데이터,
6종 크레인과 네 폰 책상 시연을 통합하는 프로젝트입니다. 실제 현장 안전 인증용이 아닙니다.

- [로컬 실행·LAN 연결·역할 배정·보정·시연 인계](./docs/demo-runbook.md)
- [실제 목표 입력과 실행 기록](./docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/run.json)
- [필수 요구사항과 고정 범위](./docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/requirements/scope-freeze.v1.0.md)
- [AC별 QA 판정·증거](./docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/acceptance.md)
- [18개 합성 지식 문서](./knowledge/README.md) · [일관성 검토](./consistency-report.md)
- [실제 로컬 모델 준비](./data/knowledge/runtime/README.md) · [영상 표식·책상 보정](./tools/calibration/README.md)
- [기술 계약](./docs/contracts/v1.md) · [상태 순서·장비 동작·기기 연결 추가 계약](./docs/contracts/v1.0.1-addendum.md)
- [서버 인증·API·복구 절차](./src/server/README.md) · [Android 앱 빌드·설치](./apps/mobile/README.md)

현재 실행·시연 문서는 통합 중인 초안입니다. 실행 성공과 전체 완료 여부는 실제 증거와 QA 판정으로 구분합니다.

Node.js 22와 npm 10 기준입니다. 환경 설정과 DB 준비 후 저장소 루트에서
`npm run db:migrate`, `npm run db:seed`, `npm run dev` 순서로 실행합니다.
새 설치·앱 빌드·실제 모델 준비와 아직 검증되지 않은 단계는 위 실행 인계 문서에 구분되어 있습니다.
