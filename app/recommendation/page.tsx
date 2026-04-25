"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store";
import { StepBar } from "@/components/StepBar";
import type { RiskLevel } from "@/lib/types";

const RISK_COLOR: Record<RiskLevel, string> = {
  낮음: "#22c55e",
  보통: "#f59e0b",
  높음: "#ef4444",
};

const FW_COLOR: Record<string, string> = {
  Superpowers: "#60a5fa",
  GSD: "#a78bfa",
  gstack: "#34d399",
  조합: "#f59e0b",
};

export default function RecommendationPage() {
  const router = useRouter();
  const { analysis, chosenFramework } = useDashboardStore();

  useEffect(() => {
    if (!analysis) router.replace("/new-project");
  }, [analysis, router]);

  if (!analysis) return null;

  const displayFw =
    analysis.recommended_framework === "조합"
      ? (analysis.combination_order ?? []).join(" → ")
      : analysis.recommended_framework;

  const mainColor = FW_COLOR[analysis.recommended_framework] ?? "#aaa";

  const metrics = [
    { label: "작업 유형", value: analysis.task_type, color: undefined },
    { label: "작업 규모", value: analysis.scale, color: undefined },
    { label: "컨텍스트 위험", value: analysis.context_risk, color: RISK_COLOR[analysis.context_risk] },
    { label: "테스트 필요도", value: analysis.test_necessity, color: RISK_COLOR[analysis.test_necessity] },
    { label: "UX 검토", value: analysis.ux_necessity, color: RISK_COLOR[analysis.ux_necessity] },
    { label: "보안 검토", value: analysis.security_necessity, color: RISK_COLOR[analysis.security_necessity] },
  ];

  return (
    <div>
      <Link href="/new-project">
        <button className="text-[12px] font-mono pb-5 block" style={{ background:"none", border:"none", color:"#444", cursor:"pointer" }}>
          ← 다시 입력
        </button>
      </Link>

      <StepBar current="recommendation" />

      <div className="mb-7">
        <div className="text-[9px] font-mono tracking-[.15em] mb-1.5" style={{ color:"#444" }}>
          ANALYSIS COMPLETE
        </div>
        <h2 className="text-[20px] font-bold mb-1">분석 결과</h2>
        <p className="text-[12px]" style={{ color:"#555" }}>{analysis.purpose_summary}</p>
      </div>

      {/* 지표 그리드 */}
      <div className="grid grid-cols-2 gap-1.5 mb-7">
        {metrics.map((m) => (
          <div key={m.label} className="px-3 py-2.5" style={{ border:"1px solid #161616" }}>
            <div className="text-[9px] font-mono mb-1" style={{ color:"#444" }}>{m.label}</div>
            <div className="text-[13px] font-medium" style={{ color: m.color ?? "#ccc" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* 추천 프레임워크 */}
      <div className="px-5 py-5 mb-5" style={{ border:`1px solid ${mainColor}30`, background:`${mainColor}08` }}>
        <div className="text-[9px] font-mono tracking-[.15em] mb-2.5" style={{ color:"#444" }}>RECOMMENDED</div>
        <div className="text-[22px] font-extrabold font-mono mb-2 tracking-tight" style={{ color: mainColor }}>
          {displayFw}
        </div>
        <p className="text-[12px] leading-[1.65]" style={{ color:"#888" }}>
          {analysis.recommendation_reason}
        </p>
      </div>

      {/* 제외 프레임워크 */}
      {analysis.excluded_frameworks?.length > 0 && (
        <div className="mb-5">
          <div className="text-[9px] font-mono tracking-[.15em] mb-2.5" style={{ color:"#444" }}>EXCLUDED</div>
          {analysis.excluded_frameworks.map((f) => (
            <div key={f.name} className="flex gap-3 py-2.5 text-[12px]" style={{ borderBottom:"1px solid #111" }}>
              <span className="font-mono min-w-[90px]" style={{ color:"#444" }}>{f.name}</span>
              <span style={{ color:"#555" }}>{f.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* 워크플로우 */}
      {analysis.workflow?.length > 0 && (
        <div className="mb-5">
          <div className="text-[9px] font-mono tracking-[.15em] mb-2.5" style={{ color:"#444" }}>WORKFLOW</div>
          <div className="flex flex-wrap items-center gap-0">
            {analysis.workflow.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="px-2.5 py-1.5 text-[11px] font-mono" style={{ background:"#111", border:"1px solid #1e1e1e", color:"#888" }}>
                  {s}
                </div>
                {i < analysis.workflow.length - 1 && (
                  <span className="text-[10px] px-1" style={{ color:"#333" }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Codex 검증 미리보기 */}
      {analysis.codex_items?.length > 0 && (
        <div className="mb-7">
          <div className="text-[9px] font-mono tracking-[.15em] mb-2.5" style={{ color:"#444" }}>CODEX VALIDATION PREVIEW</div>
          {analysis.codex_items.map((item, i) => (
            <div key={i} className="flex gap-2.5 py-1.5 text-[11px]" style={{ borderBottom:"1px solid #111", color:"#666" }}>
              <span className="font-mono" style={{ color:"#333" }}>{String(i + 1).padStart(2, "0")}</span>
              {item}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => router.push("/review")}
        className="w-full text-[13px] font-bold py-4 transition-colors hover:bg-gray-100"
        style={{ background:"#fff", color:"#000", border:"none", cursor:"pointer" }}>
        검토 및 승인 →
      </button>
    </div>
  );
}
