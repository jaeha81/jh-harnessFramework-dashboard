import { NextRequest, NextResponse } from "next/server";
import { routeFramework } from "@/lib/framework-router";
import type { ProjectFormData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { formData: ProjectFormData };
    const { formData } = body;

    if (!formData.title || !formData.purpose) {
      return NextResponse.json({ success: false, error: "필수 항목 누락" }, { status: 400 });
    }

    const data = routeFramework(formData);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "분석 실패";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
