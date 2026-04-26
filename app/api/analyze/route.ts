import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { routeFramework } from "@/lib/framework-router";
import type { ProjectFormData, AnalysisResult } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 Claude Code 프레임워크 전문 분석가입니다.

세 가지 프레임워크를 정확히 알고 있습니다:

**Superpowers** (Jesse Vincent)
- 목적: TDD 중심 실행 품질, 서브에이전트 병렬 실행
- 적합: 테스트 필요, 코드 품질 중요, 단기~중기 기능 개발
- 워크플로우: brainstorming → using-git-worktrees → writing-plans → subagent-driven-development → requesting-code-review → finishing-a-development-branch
- 에이전트: subagent-driven-development, test-driven-development

**GSD - Get Shit Done** (Lex Christopherson)
- 목적: 장기 작업 컨텍스트 관리, .planning/ 단계별 상태 저장
- 적합: 3일 이상 프로젝트, 대규모 리팩토링, 다단계 구현
- 워크플로우: /gsd-new-project → /gsd-discuss-phase → /gsd-plan-phase → /gsd-execute-phase → /gsd-verify-work → /gsd-ship
- 에이전트: gsd-executor, gsd-planner, gsd-verifier

**gstack** (Garry Tan, YC CEO)
- 목적: 제품 방향성, UX/보안 거버넌스, 23개 전문가 역할
- 적합: 신규 제품, UX 검토, 보안 중요, 방향 불확실
- 워크플로우: /office-hours → /plan-ceo-review → /plan-eng-review → 구현 → /review → /qa → /ship
- 에이전트: plan-ceo-review, plan-eng-review, qa

사용자가 제공한 자료를 꼼꼼히 읽고 내용 기반으로 분석하세요.
반드시 JSON만 출력하고 다른 텍스트는 쓰지 마세요.`;

export async function POST(request: NextRequest) {
  let formData: ProjectFormData;
  try {
    const body = await request.json() as { formData: ProjectFormData };
    formData = body.formData;
    if (!formData.title || !formData.purpose) {
      return NextResponse.json({ success: false, error: "필수 항목 누락" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "요청 파싱 실패" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    const data = routeFramework(formData);
    return NextResponse.json({ success: true, data, mode: "rule-based" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userContent = `프로젝트명: ${formData.title}

목적: ${formData.purpose}
${formData.notes ? `\n메모/특이사항: ${formData.notes}` : ""}
${formData.references ? `\n참고 링크:\n${formData.references}` : ""}
${formData.instructions ? `\n===== 업로드된 지침서 원문 =====\n${formData.instructions}\n=====` : ""}

사용자 체크 플래그:
- 테스트 필요: ${formData.needs_test ? "예" : "아니오"}
- 장기 작업(3일+): ${formData.is_longterm ? "예" : "아니오"}
- UX/UI 검토 필요: ${formData.needs_ux ? "예" : "아니오"}
- 보안 검토 필요: ${formData.needs_security ? "예" : "아니오"}

위 내용을 분석해 아래 JSON 형식으로만 응답하세요:

{
  "purpose_summary": "프로젝트 핵심 1-2문장 요약 (지침서 내용 반영)",
  "context_risk": "낮음|보통|높음",
  "test_necessity": "낮음|보통|높음",
  "ux_necessity": "낮음|보통|높음",
  "security_necessity": "낮음|보통|높음",
  "recommended_framework": "Superpowers|GSD|gstack|조합",
  "combination_order": [],
  "recommendation_reason": "지침서 내용을 구체적으로 인용해 이 프레임워크를 선정한 이유 (2-4문장)",
  "excluded_frameworks": [{"name": "프레임워크명", "reason": "이 프로젝트에 맞지 않는 이유"}],
  "workflow": ["워크플로우 커맨드 배열"],
  "agent_teams": ["에이전트 역할 배열"],
  "codex_items": ["지침서 기반 구체적 검증 항목 8-10개"],
  "precautions": ["지침서 기반 착수 전 확인사항"]
}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as AnalysisResult;

    return NextResponse.json({ success: true, data, mode: "gpt-4o-mini" });
  } catch (err) {
    console.error("GPT 분석 실패, 룰 기반 폴백:", err);
    const data = routeFramework(formData);
    return NextResponse.json({ success: true, data, mode: "rule-based-fallback" });
  }
}
