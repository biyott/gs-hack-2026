# 참고 자료 — 확인된 기능과 우리 팀의 설계

정리일: 2026-09-21

이 문서는 [전체 구조](./README.md), [역할 설명](./roles.md),
[일하는 방법](./harness.md)의 근거를 정리한다.
공식 자료가 제공하는 기능과 이 프로젝트에서 선택한 조직도를 구분한다.
현재 운영 전제는 [raphthon 대규모 병렬 운영](./operating-mode.md)에 정의한다.
권한·변경·소통·QA 승인 정책은 [R&R](./responsibilities.md), 그 근거는 이 문서 6절에 정리한다.

## 1. Codex에서 확인한 기능

| 공식 자료 | 확인한 내용 | 이 문서에 적용한 내용 |
| --- | --- | --- |
| [OpenAI: Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) | 전문 하위 에이전트를 실행하고 결과를 모을 수 있음. 병렬 작업에는 충돌과 사용량 고려가 필요함 | 메인이 구체적인 업무를 배정하고 결과를 모음 |
| [OpenAI: Authentication](https://learn.chatgpt.com/docs/auth) | ChatGPT 구독 로그인과 API 키 로그인이 구분됨 | 사용자가 가진 구독으로 Codex를 사용하는 경로를 기본으로 함 |

10개 책임자를 어떻게 나누는지, 어떤 리서처·디자이너·QA를 둘지는 공식 내장 조직도가 아니다.
에이전트 생성 도구가 있다고 Blender 제작 도구나 검증 장치까지 자동으로 생기지는 않는다.

## 2. 앞선 조사에서 가져온 일반 원칙

앞서 확인한 다음 자료의 원칙을 유지한다. Codex 기능이나 Blender 기능의 보증으로
사용하는 것이 아니라 업무를 나누고 검증하는 방법의 근거로 사용한다.
자료의 비용 효율·소규모 시작 권고가 사용자의 대규모·품질 우선 요구를 덮어쓰지는 않는다.

| 자료 | 가져온 원칙 |
| --- | --- |
| [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | 작업 경계를 명확히 하고 관리 절차의 불필요한 복잡성을 줄임. 실행 인원 최소화 규칙으로 적용하지 않음 |
| [Anthropic: Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | 위임할 목표·산출물·작업 경계를 분명히 함 |
| [Microsoft: AI agent orchestration patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) | 독립 작업만 병렬화하고 공유 상태와 의존성을 관리함 |
| [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | 진행 기록과 실제 사용자 흐름 검증으로 성급한 완료 선언을 막음 |
| [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | 완료 발언이 아니라 실제 결과를 평가하고 검사 방법 자체도 점검함 |

## 3. 사용자 요구에 따라 정한 설계

- raphthon에서 6~12시간 품질 중심의 지속 병렬 실행을 구현한다.
- 토큰 절약을 목표로 하지 않으며 같은 역할을 대량 복제하고 독립 후보를 비교한다.
- 같은 FE 역할의 수백 개 동시 실행도 확장 목표에 포함하되 실제 가능 수는 검증한다.
- 총괄 PM과 Orchestrator는 분리한다.
- 리서치 Lead와 서브 리서처는 여러 팀이 사용할 정보와 근거를 조사한다.
- 기획 Lead와 서브 기획자를 둔다.
- 개발 Lead와 Frontend·Backend·Mobile Lead 및 개발자를 둔다.
- UI 디자이너 Lead 아래에 웹·Blender 디자이너를 두고 필요하면 전문 분야를 추가한다.
- QA Lead와 서브 QA가 목표 달성을 독립적으로 검증하고 QA Lead만 공식 결과 승인을 발행한다.
- Sub는 배정 범위만 수행하며 확정 기준 변경은 변경 요청·권한자 승인·새 버전·재검증을 거친다.
- 업무 지시·변경 협의는 Sub와 자기 Lead, 팀 사이에는 Lead끼리 수행한다. 권한 있는 자료 열람은 별개다.
- 사람에게 보이는 창구는 Codex 대화창 하나로 유지한다.

UI 디자이너 Lead가 웹·모바일·3D 디자인을 함께 책임지는 것은 이 팀의 역할 정의다.
Blender 디자이너와 웹 디자이너의 이름은 항상 실행 중인 고정 프로세스 이름이 아니다.

## 4. 리서치팀 이름과 역할을 정한 근거

- [Anthropic의 멀티에이전트 연구 시스템](https://www.anthropic.com/engineering/multi-agent-research-system)은
  LeadResearcher가 전문 subagent의 조사 결과를 모으고 추가 조사 여부를 판단하는 구조를 설명한다.
- [Microsoft의 Researcher 소개](https://learn.microsoft.com/en-us/microsoft-365/copilot/researcher-agent)는
  복잡한 조사와 출처를 갖춘 보고서를 만드는 Researcher 역할을 설명한다.

이를 참고해 우리 팀 이름은 **리서치 Lead(Research Lead)**와 **서브 리서처(Researcher)**로 정한다.
쉬운 설명은 각각 “정보 조사 책임자”, “분야별 탐색 담당자”다.
검색뿐 아니라 대상 식별·출처 확인·정리·전달까지 맡으므로 탐색만을 뜻하는 이름보다 적합하다.

특정 회사의 제품을 설치하거나 그대로 복제한다는 뜻은 아니다.
대상·배경, 기술·제원, 시각 자료, 출처 검증으로 나누는 방식과 중앙 Orchestrator를 통한
실제 생성은 이 팀의 설계다. 사례의 성능·비용 수치를 우리 팀의 보장값으로 사용하지 않는다.

사용자 제공 크레인 링크는 [자료 조사와 전달 예시](./research.md)에 출발 자료로 보존한다.
현재 본문을 확인하지 못했으며, 기종과 제원에 대한 근거로 사용하지 않았다.

## 5. 아직 구현하거나 검증하지 않은 것

- raphthon 지속 실행 관리자와 6~12시간 운전, 수백 개 동시 실행 능력.
- 이 역할 이름으로 실행되는 custom agent 설정.
- 리서치 작업의 자동 분할·저장·후속 팀 전달 장치.
- Blender 연결과 실제 모델 제작·내보내기·검증 도구.
- QA 판정 기록을 기술적으로 보호하는 권한 설정.
- 역할별 메시지 경로·파일/도구 권한·기준 변경 승인과 무단 상태 전이를 막는 장치.
- 영구 작업 기록, 자동 재시작·복구, 중복 실행 방지 장치.
- Discord 접속과 무인 상시 운영.

역할 문서와 실제 설치를 혼동하지 않는다. 구현 시 설치된 Codex와 도구의 지원 범위를
다시 확인한다. 외부 자료는 변경될 수 있으므로 특정 버전의 고정 명세로 취급하지 않는다.
raphthon은 사용자가 지정한 구현 대상 이름이다. 이 저장소에서 관련 구현을 확인한 것은
아니며, 위 실행 규모와 시간은 공식 자료의 보장값이 아니라 사용자 요구와 설계 목표다.

## 6. R&R과 소통 규칙의 근거

2026-09-21에 아래 공식 본문을 확인했다. 자료에 있는 설명과 우리 팀에 적용한 정책을 구분한다.

| 공식 자료 | 확인한 설명 | 우리 하네스에서의 적용 |
| --- | --- | --- |
| [Anthropic: Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | Sub에게 목표·결과 형식·사용 도구/출처·명확한 작업 경계를 주어야 함 | 업무 카드에 허용 결정·금지 변경·제출물·보고 경로를 명시 |
| [Microsoft: Handoff와 Agent-as-Tools의 차이](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/handoff#differences-between-handoff-and-agent-as-tools) | Handoff는 작업의 제어·소유권을 넘기는 방식. Agent-as-Tools는 주 에이전트가 전체 책임을 유지하며 부분 업무를 위임하는 방식 | Sub에게 전체 기획권을 넘기지 않고 배정 업무의 실행만 위임 |
| [Microsoft: AI agent orchestration patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) | 순차·병렬·handoff 등 여러 패턴을 구분. 병렬 작업의 공유 상태·충돌 해결과 다단계 전달 지연을 고려해야 함 | 팀 간 제어는 Lead 중심, 독립 수행과 자료 읽기는 병렬. 모든 자료를 메인 대화로 복사하지 않음 |
| [Microsoft: Least privilege for AI agents](https://learn.microsoft.com/en-us/security/zero-trust/sfi/least-privilege-for-ai-agents) | 신원·작업 범위·도구 권한·감사 기록을 명시하고 실제 호출 경계에서도 권한을 강제해야 함 | Sub·Lead·QA의 도구/파일/판정 권한을 분리하고 우회·권한 회수 시험을 요구 |

이 자료들이 “어떤 팀이든 Lead끼리만 대화하라”거나 “QA Lead라는 직책만 최종 승인하라”는
공통 표준을 제시하는 것은 아니다. **Lead 중심 업무 소통, QA의 독점적 결과 인수,
동결 기준 변경 절차는 사용자 요구에 맞춰 선택한 우리 팀의 정책**이다.
공식 자료는 그 판단의 바탕인 명확한 위임·제어권 구분·공유 상태 관리·최소 권한을 뒷받침한다.

Lead가 모든 내용을 실시간 중계하면 대규모 병렬 작업이 막힐 수 있다.
따라서 승인된 기준·자료는 권한에 따라 직접 읽고, 실제 배정·예외·변경 협의만 정해진
책임 경로를 거치도록 설계했다. 안전 신고는 일반 업무 경로와 별도로 보장한다.
QA의 독립성도 프롬프트 문구만으로 보장하지 않으며 구현·시험 전에는 통제 완료라고 하지 않는다.
