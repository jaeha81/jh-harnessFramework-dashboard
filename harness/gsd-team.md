# GSD Harness Team

## 설치
```bash
npx get-shit-done-cc@latest
```

## 핵심 커맨드
| 커맨드 | 역할 |
|---|---|
| `/gsd-new-project` | 전체 초기화: 질문→리서치→요구사항→로드맵 |
| `/gsd-discuss-phase N` | 단계 착수 전 선호사항 확정 |
| `/gsd-plan-phase N` | 리서치 + 플랜 + 검증 |
| `/gsd-execute-phase N` | 병렬 실행 (신규 컨텍스트) |
| `/gsd-verify-work N` | 수동 UAT |
| `/gsd-ship N` | PR 생성 |
| `/gsd-quick` | 플랜 없는 빠른 태스크 |
| `/gsd-spike` | 2-5개 실현가능성 실험 |
| `/gsd-sketch` | 2-3개 HTML 목업 변형 |
| `/gsd-next` | 다음 단계 자동 감지 |
| `/gsd-progress` | 현재 위치 확인 |

## 아키텍처
- Phase별 독립 오케스트레이터 (컨텍스트 50% 이하 유지)
- `.planning/` 디렉토리에 모든 상태 저장 (Markdown + YAML frontmatter)
- 서브에이전트: gsd-executor / gsd-planner / gsd-verifier / gsd-phase-researcher

## 피해야 할 경우
- 단기 단일 파일 수정 (`/gsd-quick` 사용)
- 아이디어 방향 미확정 단계
- 임시 작업
