# gstack Harness Team

## 설치
```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

## 핵심 커맨드 (23개 전문가 역할)
| 커맨드 | 역할 |
|---|---|
| `/office-hours` | YC 방식 6개 강제 질문 (수요 현실, 현상 유지, 최소 쐐기) |
| `/plan-ceo-review` | 10-star 제품 비전. 스코프 모드: 확장/선택적확장/유지/축소 |
| `/plan-eng-review` | 아키텍처 리뷰, 데이터 플로우 검증 |
| `/plan-design-review` | 디자인 시스템 리뷰 |
| `/plan-devex-review` | 개발자 경험 리뷰 |
| `/autoplan` | CEO+디자인+엔지니어링 리뷰 한 번에 |
| `/review` | PR 사전 검토 (SQL 안전성, LLM 신뢰 경계) |
| `/qa` | 헤드리스 브라우저 QA (100-200ms) |
| `/browse` | Chromium 세션 (Claude for Chrome의 20배 속도) |
| `/ship` | 원커맨드 배포 |
| `/codex` | Claude+GPT+Gemini 크로스모델 리뷰 |
| `/careful` | 파괴적 커맨드 사전 경고 |
| `/retro` | 엔지니어링 회고 |

## 핵심 원칙
- "이걸 만들어야 하는가"를 빌드 전에 먼저 질문 (YC Office Hours 방식)
- Boil the Lake: 각 역할은 자신이 완벽히 할 수 있는 것만 수행
- ~/.gstack/projects/ 에 비전/결정 저장 (세션 간 유지)

## 피해야 할 경우
- 확정된 기능의 단순 구현
- 빠른 버그 수정
- 테스트 코드 보강만 필요한 경우
