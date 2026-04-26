import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateOutput } from "@/lib/prompt-generator";
import type { ProjectFormData, AnalysisResult } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 Claude Code 착수 패키지 생성 전문가입니다.
사용자가 제공한 프로젝트 정보와 분석 결과를 바탕으로 실제 사용 가능한 Claude Code 프롬프트와 문서를 생성합니다.

규칙:
- 업로드된 지침서 내용을 실제로 읽고 반영하세요
- 이 프로젝트에만 해당되는 구체적 내용을 작성하세요
- Claude Code CLI에 바로 붙여넣어 실행 가능한 프롬프트를 작성하세요
- JSON만 출력하고 다른 텍스트는 쓰지 마세요`;

export async function POST(request: NextRequest) {
  let formData: ProjectFormData;
  let analysis: AnalysisResult;
  let chosenFramework: string;

  try {
    const body = await request.json() as {
      formData: ProjectFormData;
      analysis: AnalysisResult;
      chosenFramework: string;
    };
    formData = body.formData;
    analysis = body.analysis;
    chosenFramework = body.chosenFramework;
    if (!formData || !analysis || !chosenFramework) {
      return NextResponse.json({ success: false, error: "필수 데이터 누락" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "요청 파싱 실패" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    const data = generateOutput(formData, analysis, chosenFramework);
    return NextResponse.json({ success: true, data, mode: "rule-based" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userContent = `## 프로젝트 정보
이름: ${formData.title}
목적: ${formData.purpose}
${formData.notes ? `메모: ${formData.notes}` : ""}
${formData.references ? `참고링크:\n${formData.references}` : ""}
${formData.instructions ? `\n===== 지침서 원문 =====\n${formData.instructions}\n=====` : ""}

## 선정 프레임워크: ${chosenFramework}

## GPT 분석 결과
- 요약: ${analysis.purpose_summary}
- 추천 이유: ${analysis.recommendation_reason}
- 워크플로우: ${analysis.workflow.join(" → ")}
- 에이전트: ${analysis.agent_teams.join(", ")}
- 착수 확인: ${analysis.precautions.join(", ")}

---
아래 JSON을 생성하세요:

{
  "claude_code_prompt": "Claude Code에 바로 붙여넣을 착수 프롬프트. 마크다운. 지침서 내용 기반 핵심 요구사항, 프레임워크 설치/시작 커맨드, 작업 흐름, 구체적 구현 지침 포함. 최소 500자 이상.",
  "codex_checklist": ["지침서 기반 구체 검증 항목 (최소 8개, 각 항목 완성된 문장)"],
  "handoff_prompt": "다음 세션 재개용 핸드오프 프롬프트. 이전 세션 요약, 지침서 기반 미완료 항목, 다음 커맨드 포함.",
  "llm_wiki_entry": "LLM Wiki 항목. 프로젝트 개요, 요구사항 목록(지침서 기반), 선정 이유, 작업흐름, 리스크 포함."
}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4096,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as {
      claude_code_prompt: string;
      codex_checklist: string[];
      handoff_prompt: string;
      llm_wiki_entry: string;
    };

    return NextResponse.json({ success: true, data, mode: "gpt-4o-mini" });
  } catch (err) {
    console.error("GPT 생성 실패, 템플릿 폴백:", err);
    const data = generateOutput(formData, analysis, chosenFramework);
    return NextResponse.json({ success: true, data, mode: "rule-based-fallback" });
  }
}
