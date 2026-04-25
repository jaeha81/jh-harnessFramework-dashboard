# Superpowers Harness Team

## 설치
```bash
/plugin install superpowers@claude-plugins-official
```

## 스킬 자동 활성화 순서
1. **brainstorming** — 코딩 전 아이디어 정제. Socratic 질문으로 디자인 문서 생성.
2. **using-git-worktrees** — 격리된 워크스페이스 생성. 새 브랜치 + 클린 베이스라인.
3. **writing-plans** — 2-5분 단위 태스크 분해. 파일 경로 + 완전한 코드 + 검증 단계.
4. **subagent-driven-development** — 태스크당 신규 서브에이전트. 2단계 리뷰 (스펙 준수 → 코드 품질).
5. **test-driven-development** — RED→GREEN→REFACTOR 강제. 실패 테스트 먼저.
6. **systematic-debugging** — 근본 원인 분석. 증상이 아닌 원인 수정.
7. **requesting-code-review** — 플랜 대비 구현 검토. 크리티컬 이슈 시 진행 차단.
8. **dispatching-parallel-agents** — 독립 태스크 병렬 실행.
9. **finishing-a-development-branch** — 테스트 통과 확인. Merge/PR/Keep/Discard 선택.

## 핵심 원칙
- 프로덕션 코드는 실패 테스트를 통과하기 위해서만 작성
- 서브에이전트는 격리된 컨텍스트로 실행 (오염 방지)
- 단계 건너뛰기 불가

## 피해야 할 경우
- 단순 CSS/문구 수정
- 아이디어 탐색 단계
- 서브에이전트 미지원 환경
