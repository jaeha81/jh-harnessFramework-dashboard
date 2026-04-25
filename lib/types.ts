// ─── 입력 폼 ─────────────────────────────────────────────────
export interface ProjectFormData {
  title: string;
  purpose: string;
  type: ProjectType;
  scale: ProjectScale;
  problem: string;
  desired_output: string;
  tech_stack: string;
  notes: string;
  needs_test: boolean;
  is_longterm: boolean;
  needs_ux: boolean;
  needs_security: boolean;
}

export type ProjectType =
  | "신규개발"
  | "기능추가"
  | "리팩터링"
  | "버그수정"
  | "문서정리"
  | "출시전검토"
  | "마이그레이션";

export type ProjectScale = "소 (1-2일)" | "중 (1-2주)" | "대 (1개월+)";

// ─── 분석 결과 ────────────────────────────────────────────────
export interface AnalysisResult {
  purpose_summary: string;
  task_type: string;
  scale: "소" | "중" | "대";
  context_risk: RiskLevel;
  test_necessity: RiskLevel;
  ux_necessity: RiskLevel;
  security_necessity: RiskLevel;
  recommended_framework: RecommendedFramework;
  combination_order: string[];
  recommendation_reason: string;
  excluded_frameworks: ExcludedFramework[];
  workflow: string[];
  agent_teams: string[];
  codex_items: string[];
  precautions: string[];
}

export type RiskLevel = "낮음" | "보통" | "높음";
export type RecommendedFramework = "Superpowers" | "GSD" | "gstack" | "조합";

export interface ExcludedFramework {
  name: string;
  reason: string;
}

// ─── 생성 결과 ────────────────────────────────────────────────
export interface GeneratedOutput {
  claude_code_prompt: string;
  codex_checklist: string[];
  handoff_prompt: string;
  llm_wiki_entry: string;
}

// ─── 기록 ─────────────────────────────────────────────────────
export interface HistoryEntry {
  id: string;
  title: string;
  framework: string;
  date: string;
  formData: ProjectFormData;
  analysis: AnalysisResult;
  output: GeneratedOutput;
}

// ─── API 요청/응답 ────────────────────────────────────────────
export interface AnalyzeRequest {
  formData: ProjectFormData;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

export interface GenerateRequest {
  formData: ProjectFormData;
  analysis: AnalysisResult;
  chosenFramework: string;
}

export interface GenerateResponse {
  success: boolean;
  data?: GeneratedOutput;
  error?: string;
}
