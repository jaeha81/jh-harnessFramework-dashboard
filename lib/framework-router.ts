import type {
  ProjectFormData,
  AnalysisResult,
  RiskLevel,
  RecommendedFramework,
} from "./types";

// ─── 점수 계산 ────────────────────────────────────────────────
function scoreFrameworks(form: ProjectFormData): Record<string, number> {
  const scores = { superpowers: 0, gsd: 0, gstack: 0 };

  // 유형 기반
  const typeMap: Record<string, keyof typeof scores> = {
    신규개발: "gstack",
    기능추가: "superpowers",
    리팩터링: "superpowers",
    버그수정: "superpowers",
    문서정리: "gsd",
    출시전검토: "gstack",
    마이그레이션: "gsd",
  };
  if (typeMap[form.type]) scores[typeMap[form.type]] += 3;

  // 규모 기반
  if (form.scale === "대 (1개월+)") {
    scores.gsd += 3;
    scores.gstack += 1;
  } else if (form.scale === "중 (1-2주)") {
    scores.gsd += 1;
    scores.superpowers += 1;
  } else {
    scores.superpowers += 2;
  }

  // 플래그 기반
  if (form.needs_test) scores.superpowers += 3;
  if (form.is_longterm) scores.gsd += 3;
  if (form.needs_ux) scores.gstack += 2;
  if (form.needs_security) scores.gstack += 2;

  return scores;
}

function calcRisk(form: ProjectFormData): RiskLevel {
  let risk = 0;
  if (form.scale === "대 (1개월+)") risk += 2;
  if (form.scale === "중 (1-2주)") risk += 1;
  if (form.is_longterm) risk += 2;
  if (form.needs_security) risk += 1;
  return risk >= 4 ? "높음" : risk >= 2 ? "보통" : "낮음";
}

function toLevel(flag: boolean, scale: string): RiskLevel {
  if (!flag) return "낮음";
  return scale === "대 (1개월+)" ? "높음" : "보통";
}

// ─── 메인 라우터 ──────────────────────────────────────────────
export function routeFramework(form: ProjectFormData): AnalysisResult {
  const scores = scoreFrameworks(form);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0][0];
  const second = sorted[1][0];
  const third = sorted[2][0];

  // 조합 판단: 신규개발 + 대규모이거나 상위 두 점수 차이가 1 이하
  const isCombo =
    (form.type === "신규개발" && form.scale !== "소 (1-2일)") ||
    sorted[0][1] - sorted[1][1] <= 1;

  let recommended: RecommendedFramework;
  let combinationOrder: string[] = [];
  let reason = "";

  if (isCombo) {
    recommended = "조합";
    // 워크플로우 순서: gstack(방향) → GSD(컨텍스트) → Superpowers(실행)
    combinationOrder = ["gstack", "GSD", "Superpowers"];

    reason = `${form.type} + ${form.scale} 규모는 단일 프레임워크보다 조합이 효과적입니다. ` +
      `/office-hours로 방향 확정 후 /gsd-new-project로 장기 컨텍스트 관리, ` +
      `Superpowers subagent-driven-development로 실행합니다.`;
  } else if (top === "superpowers") {
    recommended = "Superpowers";
    reason = `${form.needs_test ? "테스트 필요도가 높아 " : ""}brainstorming → writing-plans → subagent-driven-development 흐름이 적합합니다. ` +
      `태스크당 신규 서브에이전트 + 2단계 리뷰로 코드 품질을 보장합니다.`;
  } else if (top === "gsd") {
    recommended = "GSD";
    reason = `${form.is_longterm ? "장기 작업으로 " : ""}컨텍스트 오염 위험이 있습니다. ` +
      `/gsd-new-project로 .planning/ 상태를 생성하고 Phase별 독립 컨텍스트로 진행합니다.`;
  } else {
    recommended = "gstack";
    reason = `${form.needs_ux || form.needs_security ? "UX/보안 검토가 필요하여 " : ""}` +
      `/office-hours로 방향을 먼저 확정해야 합니다. ` +
      `${form.type === "출시전검토" ? "/qa와 /codex로 크로스모델 최종 검증을 권장합니다." : "/plan-ceo-review로 10-star 제품 비전을 수립합니다."}`;
  }

  // 제외 이유
  const excluded = [
    { key: "superpowers", name: "Superpowers" },
    { key: "gsd", name: "GSD" },
    { key: "gstack", name: "gstack" },
  ]
    .filter((f) => f.key !== top || isCombo)
    .filter((f) => !isCombo || f.key === second || f.key === third)
    .map((f) => {
      const excludeReasons: Record<string, string> = {
        superpowers: "현 단계에서 실행 품질보다 방향 확정 또는 컨텍스트 관리가 우선입니다.",
        gsd: "단기 작업이거나 컨텍스트 오염 위험이 낮아 .planning/ 오버헤드가 불필요합니다.",
        gstack: "제품 방향이 이미 확정되어 있어 거버넌스 레이어가 불필요합니다.",
      };
      return { name: f.name, reason: excludeReasons[f.key] };
    })
    .slice(0, isCombo ? 0 : 2);

  // 워크플로우
  const workflowMap: Record<string, string[]> = {
    Superpowers: ["brainstorming", "using-git-worktrees", "writing-plans", "subagent-driven-development", "requesting-code-review", "finishing-a-development-branch"],
    GSD: ["/gsd-new-project", "/gsd-discuss-phase 1", "/gsd-plan-phase 1", "/gsd-execute-phase 1", "/gsd-verify-work 1", "/gsd-ship 1"],
    gstack: ["/office-hours", "/plan-ceo-review", "/plan-eng-review", "구현", "/review", "/qa", "/ship"],
    조합: ["/office-hours", "/gsd-new-project", "/gsd-plan-phase", "brainstorming", "subagent-driven-development", "/gsd-ship"],
  };

  // Codex 항목
  const codexBase = [
    "모든 테스트 통과 확인",
    "플랜 대비 구현 항목 전체 체크",
    "엣지 케이스 처리 확인",
    "에러 핸들링 누락 없음",
    "타입 안전성 확인 (any/unknown 금지)",
  ];
  if (form.needs_security) codexBase.push("보안: SQL 인젝션 / LLM 신뢰 경계 확인");
  if (form.needs_ux) codexBase.push("UX: 모바일 반응형 / 접근성 확인");
  if (form.type === "출시전검토") codexBase.push("/codex 크로스모델 리뷰 실행");

  // 착수 전 확인사항
  const precautions: string[] = [];
  if (recommended === "GSD" || isCombo) {
    precautions.push("npx get-shit-done-cc@latest 설치 완료 확인");
    precautions.push(".planning/ 디렉토리 없으면 /gsd-new-project부터 시작");
  }
  if (recommended === "gstack" || isCombo) {
    precautions.push("gstack ./setup 완료 확인 (CLAUDE.md에 skill routing 추가)");
    precautions.push("/office-hours 전에 아이디어 1-2문장으로 정리");
  }
  if (recommended === "Superpowers" || isCombo) {
    precautions.push("/plugin install superpowers@claude-plugins-official 완료 확인");
  }
  precautions.push("Git 클린 상태에서 착수 (미커밋 변경사항 정리)");

  return {
    purpose_summary: `${form.title}: ${form.purpose.slice(0, 60)}${form.purpose.length > 60 ? "…" : ""}`,
    task_type: form.type,
    scale: form.scale.slice(0, 1) as "소" | "중" | "대",
    context_risk: calcRisk(form),
    test_necessity: toLevel(form.needs_test, form.scale),
    ux_necessity: toLevel(form.needs_ux, form.scale),
    security_necessity: toLevel(form.needs_security, form.scale),
    recommended_framework: recommended,
    combination_order: combinationOrder,
    recommendation_reason: reason,
    excluded_frameworks: excluded,
    workflow: workflowMap[recommended] ?? [],
    agent_teams:
      recommended === "Superpowers"
        ? ["subagent-driven-development", "test-driven-development"]
        : recommended === "GSD"
        ? ["gsd-executor", "gsd-planner", "gsd-verifier"]
        : recommended === "gstack"
        ? ["plan-ceo-review", "plan-eng-review", "qa"]
        : ["gstack-ceo", "gsd-planner", "subagent-driven-development"],
    codex_items: codexBase,
    precautions,
  };
}
