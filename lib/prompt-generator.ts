import type { ProjectFormData, AnalysisResult, GeneratedOutput } from "./types";

const FW_INSTALL: Record<string, string> = {
  Superpowers: "/plugin install superpowers@claude-plugins-official",
  GSD: "npx get-shit-done-cc@latest",
  gstack:
    "git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup",
};

function getInstall(fw: string): string {
  const matched = Object.entries(FW_INSTALL).filter(([key]) => fw.includes(key));
  if (matched.length === 1) {
    return `## 프레임워크 설치\n\`\`\`bash\n${matched[0][1]}\n\`\`\`\n`;
  }
  const installs = matched.length > 0
    ? matched.map(([key, cmd]) => `# ${key}\n${cmd}`).join("\n\n")
    : Object.entries(FW_INSTALL).map(([key, cmd]) => `# ${key}\n${cmd}`).join("\n\n");
  return `## 프레임워크 설치\n\`\`\`bash\n${installs}\n\`\`\`\n`;
}

function getStartCommand(fw: string, form: ProjectFormData): string {
  if (fw.includes("gstack") && !fw.includes("+")) {
    return `## 시작 커맨드\n\`\`\`\n/office-hours\n\`\`\`\n> "${form.purpose}"`;
  }
  if (fw === "GSD") {
    return `## 시작 커맨드\n\`\`\`\n/gsd-new-project\n\`\`\``;
  }
  if (fw === "Superpowers") {
    return `## 시작 커맨드\nClaude Code에 아래 메시지 입력 (brainstorming 스킬 자동 활성화):\n\n> Let's build: ${form.title}. ${form.purpose}`;
  }
  return `## 시작 커맨드 (조합 순서)\n\`\`\`\n# 1단계: 방향 확정\n/office-hours\n\n# 2단계: 장기 컨텍스트 초기화\n/gsd-new-project\n\n# 3단계: 실행\n# Superpowers brainstorming 자동 활성화\n\`\`\``;
}

// ─── Claude Code 프롬프트 ──────────────────────────────────────
function buildClaudeCodePrompt(
  form: ProjectFormData,
  analysis: AnalysisResult,
  fw: string
): string {
  const date = new Date().toLocaleDateString("ko-KR");
  const workflowStr = analysis.workflow.join(" → ");

  const refLines = form.references
    ? form.references.split("\n").filter(Boolean).map((r) => `- ${r.trim()}`).join("\n")
    : "";

  return `# ${form.title} — Claude Code 착수 프롬프트
> 생성일: ${date} | 프레임워크: ${fw}

## 프로젝트 컨텍스트
- **목적**: ${form.purpose}
${form.notes ? `- **메모**: ${form.notes}` : ""}
${refLines ? `\n## 참고 링크\n${refLines}` : ""}
${form.instructions ? `\n## 상세 지침서 / 명령 프롬프트\n${form.instructions}` : ""}

## 분석 요약
${analysis.purpose_summary}

| 항목 | 값 |
|---|---|
| 컨텍스트 위험 | ${analysis.context_risk} |
| 테스트 필요도 | ${analysis.test_necessity} |
| UX 검토 | ${analysis.ux_necessity} |
| 보안 검토 | ${analysis.security_necessity} |

## 선정 프레임워크: ${fw}
${analysis.recommendation_reason}

${getInstall(fw)}

## 작업 흐름
\`\`\`
${workflowStr}
\`\`\`

${getStartCommand(fw, form)}

## 착수 전 확인사항
${analysis.precautions.map((p) => `- [ ] ${p}`).join("\n")}

## 에이전트 팀
${analysis.agent_teams.map((t) => `- \`${t}\``).join("\n")}

## 주의사항
- 사용자 승인 없이 자동 진행 금지
- 각 단계 완료 후 반드시 확인 요청
- 테스트 없는 프로덕션 코드 작성 금지
- any/unknown 타입 사용 금지
`;
}

// ─── Codex 체크리스트 ─────────────────────────────────────────
function buildCodexChecklist(
  form: ProjectFormData,
  analysis: AnalysisResult,
  fw: string
): string[] {
  const list = [...analysis.codex_items];

  if (fw.includes("Superpowers")) {
    list.push("finishing-a-development-branch 실행 완료");
    list.push("requesting-code-review 통과 확인");
  }
  if (fw.includes("GSD")) {
    list.push("/gsd-verify-work 통과 확인");
    list.push(".planning/ STATE.md 완료 상태 확인");
  }
  if (fw.includes("gstack")) {
    list.push("/review PR 사전 검토 완료");
    list.push(form.needs_ux ? "/qa 브라우저 테스트 통과" : "/qa 기본 동작 확인");
  }

  list.push("Git 커밋 메시지 컨벤션 준수");

  return list;
}

// ─── Handoff 프롬프트 ─────────────────────────────────────────
function buildHandoffPrompt(
  form: ProjectFormData,
  analysis: AnalysisResult,
  fw: string
): string {
  const date = new Date().toLocaleDateString("ko-KR");

  const nextCmd =
    fw === "GSD"
      ? "/gsd-next 또는 /gsd-progress로 현재 위치 확인"
      : fw.includes("gstack")
      ? "/plan-eng-review 또는 구현 단계 진입"
      : fw === "Superpowers"
      ? "writing-plans 스킬로 태스크 분해 재개"
      : "/gsd-next 또는 brainstorming 재개";

  return `# ${form.title} — Handoff 프롬프트
> 세션 날짜: ${date}

## 이전 세션 요약
- **프로젝트**: ${form.title}
- **선정 프레임워크**: ${fw}
- **목적**: ${form.purpose}

## 현재 상태
- 분석 완료: ${analysis.purpose_summary}
- 워크플로우: ${analysis.workflow.join(" → ")}

## 다음 세션 시작 커맨드
\`\`\`
${nextCmd}
\`\`\`

## 미완료 확인사항
${analysis.precautions.map((p) => `- [ ] ${p}`).join("\n")}

## 컨텍스트 유지 핵심
- 프레임워크: ${fw}
- 목적: ${form.purpose}
${form.notes ? `- 메모: ${form.notes}` : ""}
${form.references ? `\n## 참고 링크\n${form.references.split("\n").filter(Boolean).map((r) => `- ${r.trim()}`).join("\n")}` : ""}
${form.instructions ? `\n## 상세 지침서\n${form.instructions}` : ""}
`;
}

// ─── LLM Wiki ─────────────────────────────────────────────────
function buildLLMWiki(
  form: ProjectFormData,
  analysis: AnalysisResult,
  fw: string
): string {
  const date = new Date().toLocaleDateString("ko-KR");

  return `# LLM Wiki — ${form.title}

## 기본 정보
| 항목 | 내용 |
|---|---|
| 프로젝트 | ${form.title} |
| 착수일 | ${date} |
| 목적 | ${form.purpose} |

## 선정 프레임워크
**${fw}**
${analysis.recommendation_reason}

## 제외 프레임워크
${
  analysis.excluded_frameworks.length > 0
    ? analysis.excluded_frameworks.map((f) => `- **${f.name}**: ${f.reason}`).join("\n")
    : "- 없음 (조합 모드)"
}

## 작업 흐름
\`\`\`
${analysis.workflow.join(" → ")}
\`\`\`

## 에이전트 팀
${analysis.agent_teams.map((t) => `- \`${t}\``).join("\n")}

## 리스크
- 컨텍스트 위험: ${analysis.context_risk}
- 보안 필요도: ${analysis.security_necessity}

## 착수 전 확인사항
${analysis.precautions.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## 목적
${form.purpose}
${form.notes ? `\n## 메모\n${form.notes}` : ""}
${form.references ? `\n## 참고 링크\n${form.references.split("\n").filter(Boolean).map((r) => `- ${r.trim()}`).join("\n")}` : ""}
${form.instructions ? `\n## 상세 지침서\n${form.instructions.slice(0, 500)}${form.instructions.length > 500 ? "\n...(전체 내용은 착수 프롬프트 참조)" : ""}` : ""}
`;
}

// ─── 메인 생성기 ──────────────────────────────────────────────
export function generateOutput(
  form: ProjectFormData,
  analysis: AnalysisResult,
  chosenFramework: string
): GeneratedOutput {
  return {
    claude_code_prompt: buildClaudeCodePrompt(form, analysis, chosenFramework),
    codex_checklist: buildCodexChecklist(form, analysis, chosenFramework),
    handoff_prompt: buildHandoffPrompt(form, analysis, chosenFramework),
    llm_wiki_entry: buildLLMWiki(form, analysis, chosenFramework),
  };
}
