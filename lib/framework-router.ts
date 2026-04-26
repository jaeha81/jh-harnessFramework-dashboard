import type {
  ProjectFormData,
  AnalysisResult,
  RiskLevel,
  RecommendedFramework,
} from "./types";

// ─── 텍스트 신호 추출 ─────────────────────────────────────────
interface TextSignals {
  hasTest: boolean;
  hasLongterm: boolean;
  hasUx: boolean;
  hasSecurity: boolean;
  complexity: "낮음" | "보통" | "높음";
  detectedKeywords: string[];
  taskLines: string[];      // 지침서에서 뽑은 실행 가능한 라인들
  scopeSize: number;        // 글자 수 기준 규모
}

const TEST_KW = ["테스트", "test", "tdd", "jest", "vitest", "cypress", "e2e", "단위", "통합", "spec"];
const LONGTERM_KW = ["장기", "단계", "phase", "마일스톤", "milestone", "sprint", "스프린트", "로드맵", "roadmap", "v2", "v3", "리팩토링", "refactor", "이관", "migration"];
const UX_KW = ["ux", "ui", "디자인", "design", "반응형", "responsive", "모바일", "mobile", "접근성", "animation", "애니메이션", "레이아웃", "layout", "figma", "와이어프레임", "화면"];
const SECURITY_KW = ["보안", "security", "인증", "auth", "oauth", "jwt", "권한", "permission", "암호화", "encrypt", "sql injection", "xss", "csrf", "취약점"];

function extractSignals(form: ProjectFormData): TextSignals {
  const combined = `${form.title} ${form.purpose} ${form.instructions} ${form.notes}`.toLowerCase();

  const detectedKeywords: string[] = [];

  const hasTest = form.needs_test || TEST_KW.some((k) => { if (combined.includes(k)) { detectedKeywords.push(k); return true; } return false; });
  const hasLongterm = form.is_longterm || LONGTERM_KW.some((k) => { if (combined.includes(k)) { detectedKeywords.push(k); return true; } return false; });
  const hasUx = form.needs_ux || UX_KW.some((k) => { if (combined.includes(k)) { detectedKeywords.push(k); return true; } return false; });
  const hasSecurity = form.needs_security || SECURITY_KW.some((k) => { if (combined.includes(k)) { detectedKeywords.push(k); return true; } return false; });

  // 지침서에서 실행 가능한 라인 추출 (번호매김 / 불릿 / 헤더)
  const taskLines: string[] = [];
  if (form.instructions) {
    const lines = form.instructions.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^(\d+[\.\)]\s|[-*•]\s|#{1,3}\s|>\s)/.test(line) && line.length > 4 && line.length < 200) {
        taskLines.push(line.replace(/^[-*•#>]+\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim());
      }
    }
  }

  const scopeSize = form.instructions.length + form.purpose.length;
  let complexity: "낮음" | "보통" | "높음";
  if (scopeSize > 2000 || taskLines.length > 10) complexity = "높음";
  else if (scopeSize > 500 || taskLines.length > 4) complexity = "보통";
  else complexity = "낮음";

  return { hasTest, hasLongterm, hasUx, hasSecurity, complexity, detectedKeywords: detectedKeywords.filter((v, i, a) => a.indexOf(v) === i), taskLines, scopeSize };
}

// ─── 점수 계산 ────────────────────────────────────────────────
function scoreFrameworks(form: ProjectFormData, sig: TextSignals): Record<string, number> {
  const scores = { superpowers: 0, gsd: 0, gstack: 0 };

  if (sig.hasTest) scores.superpowers += 3;
  if (sig.hasLongterm) scores.gsd += 3;
  if (sig.hasUx) scores.gstack += 2;
  if (sig.hasSecurity) scores.gstack += 2;

  // 복잡도에 따른 추가 가중
  if (sig.complexity === "높음") scores.gsd += 2;
  else if (sig.complexity === "보통") scores.gsd += 1;

  // 지침서가 길고 구조화돼 있으면 GSD (컨텍스트 관리 필요)
  if (sig.taskLines.length > 6) scores.gsd += 1;

  // 플래그 없고 신호도 없으면 Superpowers 기본
  if (!sig.hasTest && !sig.hasLongterm && !sig.hasUx && !sig.hasSecurity) {
    scores.superpowers += 1;
  }

  return scores;
}

function calcRisk(sig: TextSignals): RiskLevel {
  let risk = 0;
  if (sig.hasLongterm) risk += 2;
  if (sig.hasSecurity) risk += 1;
  if (sig.complexity === "높음") risk += 1;
  return risk >= 3 ? "높음" : risk >= 1 ? "보통" : "낮음";
}

function toLevel(flag: boolean): RiskLevel {
  return flag ? "보통" : "낮음";
}

// ─── purpose_summary 생성 ─────────────────────────────────────
function buildPurposeSummary(form: ProjectFormData, sig: TextSignals): string {
  const base = `${form.title}: ${form.purpose.slice(0, 80)}${form.purpose.length > 80 ? "…" : ""}`;
  if (sig.taskLines.length > 0) {
    const preview = sig.taskLines.slice(0, 3).map((t) => `"${t}"`).join(", ");
    return `${base} (핵심 작업: ${preview}${sig.taskLines.length > 3 ? ` 외 ${sig.taskLines.length - 3}개` : ""})`;
  }
  return base;
}

// ─── 메인 라우터 ──────────────────────────────────────────────
export function routeFramework(form: ProjectFormData): AnalysisResult {
  const sig = extractSignals(form);
  const scores = scoreFrameworks(form, sig);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0][0];

  const isCombo = sorted[0][1] - sorted[1][1] <= 1;

  let recommended: RecommendedFramework;
  let combinationOrder: string[] = [];
  let reason = "";

  const kwNote = sig.detectedKeywords.length > 0
    ? ` (감지된 키워드: ${sig.detectedKeywords.slice(0, 5).join(", ")})`
    : "";

  if (isCombo) {
    recommended = "조합";
    combinationOrder = ["gstack", "GSD", "Superpowers"];
    reason =
      `복합적인 요구사항이 지침서에서 감지됐습니다${kwNote}. ` +
      "/office-hours로 방향 확정 → /gsd-new-project로 장기 컨텍스트 관리 → " +
      "Superpowers subagent-driven-development로 실행합니다.";
  } else if (top === "superpowers") {
    recommended = "Superpowers";
    reason =
      `${sig.hasTest ? "테스트 필요도가 높아 " : ""}brainstorming → writing-plans → subagent-driven-development 흐름이 적합합니다${kwNote}. ` +
      "태스크당 신규 서브에이전트 + 2단계 리뷰로 코드 품질을 보장합니다.";
  } else if (top === "gsd") {
    recommended = "GSD";
    reason =
      `${sig.hasLongterm ? "장기 작업으로 " : ""}${sig.complexity === "높음" ? "지침서 분량이 많아 " : ""}컨텍스트 오염 위험이 있습니다${kwNote}. ` +
      "/gsd-new-project로 .planning/ 상태를 생성하고 Phase별 독립 컨텍스트로 진행합니다.";
  } else {
    recommended = "gstack";
    reason =
      `${sig.hasUx || sig.hasSecurity ? "UX/보안 검토가 필요하여 " : ""}` +
      `/office-hours로 방향을 먼저 확정해야 합니다${kwNote}. ` +
      "/plan-ceo-review로 10-star 제품 비전을 수립합니다.";
  }

  const excluded = [
    { key: "superpowers", name: "Superpowers" },
    { key: "gsd", name: "GSD" },
    { key: "gstack", name: "gstack" },
  ]
    .filter((f) => f.key !== top || isCombo)
    .filter((f) => !isCombo || false)
    .map((f) => {
      const excludeReasons: Record<string, string> = {
        superpowers: "현 단계에서 실행 품질보다 방향 확정 또는 컨텍스트 관리가 우선입니다.",
        gsd: "장기 작업이 아니거나 컨텍스트 오염 위험이 낮아 .planning/ 오버헤드가 불필요합니다.",
        gstack: "제품 방향이 이미 확정되어 있어 거버넌스 레이어가 불필요합니다.",
      };
      return { name: f.name, reason: excludeReasons[f.key] };
    })
    .slice(0, isCombo ? 0 : 2);

  const workflowMap: Record<string, string[]> = {
    Superpowers: ["brainstorming", "using-git-worktrees", "writing-plans", "subagent-driven-development", "requesting-code-review", "finishing-a-development-branch"],
    GSD: ["/gsd-new-project", "/gsd-discuss-phase 1", "/gsd-plan-phase 1", "/gsd-execute-phase 1", "/gsd-verify-work 1", "/gsd-ship 1"],
    gstack: ["/office-hours", "/plan-ceo-review", "/plan-eng-review", "구현", "/review", "/qa", "/ship"],
    조합: ["/office-hours", "/gsd-new-project", "/gsd-plan-phase", "brainstorming", "subagent-driven-development", "/gsd-ship"],
  };

  const codexBase = [
    "모든 테스트 통과 확인",
    "플랜 대비 구현 항목 전체 체크",
    "엣지 케이스 처리 확인",
    "에러 핸들링 누락 없음",
    "타입 안전성 확인 (any/unknown 금지)",
  ];
  if (sig.hasSecurity) codexBase.push("보안: SQL 인젝션 / LLM 신뢰 경계 확인");
  if (sig.hasUx) codexBase.push("UX: 모바일 반응형 / 접근성 확인");
  if (sig.taskLines.length > 0) {
    codexBase.push(`지침서 항목 ${sig.taskLines.length}개 전체 이행 확인`);
  }

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
    purpose_summary: buildPurposeSummary(form, sig),
    context_risk: calcRisk(sig),
    test_necessity: toLevel(sig.hasTest),
    ux_necessity: toLevel(sig.hasUx),
    security_necessity: toLevel(sig.hasSecurity),
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
