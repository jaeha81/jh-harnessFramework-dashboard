export interface FrameworkData {
  key: string;
  name: string;
  author: string;
  install: string;
  tagline: string;
  description: string;
  color: string;
  roles: string[];
  avoid: string[];
  stars: string;
  workflow: string;
}

export const FRAMEWORKS: Record<string, FrameworkData> = {
  superpowers: {
    key: "superpowers",
    name: "Superpowers",
    author: "Jesse Vincent / Prime Radiant",
    install: "/plugin install superpowers@claude-plugins-official",
    tagline: "실행 품질 강제",
    description:
      "TDD 중심, 단계 강제, 테스트 우선 구현. 스킬이 자동 활성화되어 단계 건너뜀 불가. chardet v7.0.0 재작성에서 41배 성능 향상 달성.",
    color: "#60a5fa",
    roles: [
      "brainstorming — 코딩 전 아이디어 정제, 디자인 문서 저장",
      "using-git-worktrees — 격리 워크스페이스 생성",
      "writing-plans — 2-5분 단위 태스크 분해, 파일 경로 명시",
      "subagent-driven-development — 태스크당 신규 서브에이전트, 2단계 리뷰",
      "test-driven-development — RED→GREEN→REFACTOR 강제",
      "systematic-debugging — 근본 원인 디버깅",
      "requesting-code-review — 플랜 대비 코드 리뷰",
      "dispatching-parallel-agents — 병렬 에이전트 실행",
      "finishing-a-development-branch — 머지/PR 완료 처리",
    ],
    avoid: [
      "단순 CSS·문구 수정 (오버헤드 과다)",
      "아이디어 탐색 단계 (brainstorming만으로 충분)",
      "서브에이전트 미지원 환경 (executing-plans 폴백 필요)",
    ],
    stars: "166k",
    workflow:
      "brainstorming → using-git-worktrees → writing-plans → subagent-driven-development → requesting-code-review → finishing-a-development-branch",
  },
  gsd: {
    key: "gsd",
    name: "GSD",
    author: "Lex Christopherson / TÂCHES",
    install: "npx get-shit-done-cc@latest",
    tagline: "컨텍스트 안정화",
    description:
      "Phase별 독립 컨텍스트로 컨텍스트 오염 방지. .planning/ 디렉토리에 모든 상태 저장. 오케스트레이터는 컨텍스트 50% 이하 유지.",
    color: "#a78bfa",
    roles: [
      "/gsd-new-project — 전체 초기화: 질문→리서치→요구사항→로드맵",
      "/gsd-discuss-phase N — 단계 착수 전 선호사항 확정",
      "/gsd-plan-phase N — 리서치 + 플랜 + 검증",
      "/gsd-execute-phase N — 병렬 실행 (신규 컨텍스트)",
      "/gsd-verify-work N — 수동 UAT",
      "/gsd-ship N — PR 생성",
      "/gsd-spike — 2-5개 실현가능성 실험",
      "/gsd-sketch — 2-3개 HTML 목업 변형",
      "/gsd-quick — 플랜 없는 빠른 태스크",
      "/gsd-next — 다음 단계 자동 감지",
      "/gsd-progress — 현재 위치 확인",
    ],
    avoid: [
      "단기 단일 파일 수정 (/gsd-quick 사용)",
      "아이디어 방향 미확정 단계 (gstack 먼저)",
      "임시 작업 (상태 저장 오버헤드 불필요)",
    ],
    stars: "51k",
    workflow:
      "/gsd-new-project → /gsd-discuss-phase → /gsd-plan-phase → /gsd-execute-phase → /gsd-verify-work → /gsd-ship",
  },
  gstack: {
    key: "gstack",
    name: "gstack",
    author: "Garry Tan (Y Combinator CEO)",
    install:
      "git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup",
    tagline: "방향 판단 + 역할 거버넌스",
    description:
      "YC CEO Garry Tan의 실제 셋업. 23개 전문가 역할 기반. '이걸 만들어야 하는가'를 빌드 전에 먼저 질문. 10-star 제품 비전.",
    color: "#34d399",
    roles: [
      "/office-hours — YC 방식 6개 강제 질문 (수요 현실, 현상 유지, 최소 쐐기 등)",
      "/plan-ceo-review — 10-star 제품 비전, 스코프 모드 4가지",
      "/plan-eng-review — 아키텍처 리뷰, 데이터 플로우 검증",
      "/plan-design-review — 디자인 시스템 리뷰",
      "/plan-devex-review — 개발자 경험 리뷰",
      "/autoplan — CEO+디자인+엔지니어링 리뷰 한 번에",
      "/review — PR 사전 검토 (SQL 안전성, LLM 신뢰 경계)",
      "/qa — 헤드리스 브라우저 QA (100-200ms)",
      "/browse — Chromium 세션 (Claude for Chrome의 20배 속도)",
      "/ship — 원커맨드 배포",
      "/codex — Claude+GPT+Gemini 크로스모델 리뷰",
      "/careful — 파괴적 커맨드 사전 경고",
      "/retro — 엔지니어링 회고",
    ],
    avoid: [
      "확정된 기능의 단순 구현 (Superpowers가 적합)",
      "빠른 버그 수정 (/gsd-quick이 적합)",
      "테스트 코드 보강만 (Superpowers TDD가 적합)",
    ],
    stars: "71k",
    workflow:
      "/office-hours → /plan-ceo-review → /plan-eng-review → 구현 → /review → /qa → /ship",
  },
};

export const FRAMEWORK_COMBINATION_OPTIONS = [
  "Superpowers",
  "GSD",
  "gstack",
  "gstack+GSD+Superpowers",
  "gstack+Superpowers",
  "GSD+Superpowers",
];
