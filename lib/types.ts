// ─── 입력 폼 ─────────────────────────────────────────────────
export interface ProjectFormData {
  title: string;
  purpose: string;
  instructions: string;
  references: string;
  notes: string;
  needs_test: boolean;
  is_longterm: boolean;
  needs_ux: boolean;
  needs_security: boolean;
}

// ─── 분석 결과 ────────────────────────────────────────────────
export interface AnalysisResult {
  purpose_summary: string;
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
