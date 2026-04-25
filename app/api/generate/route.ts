import { NextRequest, NextResponse } from "next/server";
import { generateOutput } from "@/lib/prompt-generator";
import type { ProjectFormData, AnalysisResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      formData: ProjectFormData;
      analysis: AnalysisResult;
      chosenFramework: string;
    };

    const { formData, analysis, chosenFramework } = body;

    if (!formData || !analysis || !chosenFramework) {
      return NextResponse.json({ success: false, error: "필수 데이터 누락" }, { status: 400 });
    }

    const data = generateOutput(formData, analysis, chosenFramework);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "생성 실패";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
