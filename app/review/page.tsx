"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useDashboardStore } from "@/lib/store";
import { StepBar } from "@/components/StepBar";
import { FRAMEWORK_COMBINATION_OPTIONS } from "@/lib/framework-data";
import type { GeneratedOutput } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const { analysis, formData, chosenFramework, setChosenFramework, setOutput, saveToHistory } =
    useDashboardStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!analysis) {
    router.replace("/new-project");
    return null;
  }

  const aiRec =
    analysis.recommended_framework === "조합"
      ? (analysis.combination_order ?? []).join("+")
      : analysis.recommended_framework;

  const handleApprove = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, analysis, chosenFramework }),
      });
      const json = await res.json() as { success: boolean; data?: GeneratedOutput; error?: string };

      if (!json.success || !json.data) throw new Error(json.error ?? "생성 실패");

      setOutput(json.data);
      saveToHistory();
      router.push("/output");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/recommendation">
        <button className="text-[12px] font-mono pb-5 block" style={{ background:"none", border:"none", color:"#444", cursor:"pointer" }}>
          ← 분석 결과로
        </button>
      </Link>

      <StepBar current="review" />

      <h2 className="text-[20px] font-bold mb-1.5">프레임워크 확정</h2>
      <p className="text-[12px] mb-7" style={{ color:"#555" }}>
        AI 추천안을 승인하거나 직접 변경하세요
      </p>

      {error && (
        <div className="text-[12px] px-3 py-3 mb-5" style={{ border:"1px solid #ef4444", background:"#ef444410", color:"#ef4444" }}>
          {error}
        </div>
      )}

      {/* 프레임워크 선택 */}
      <div className="mb-7">
        {FRAMEWORK_COMBINATION_OPTIONS.map((fw) => {
          const selected = chosenFramework === fw;
          return (
            <label key={fw} onClick={() => setChosenFramework(fw)}
              className="flex items-center gap-3 px-3.5 py-3.5 mb-1.5 cursor-pointer select-none transition-all duration-200"
              style={{ border:`1px solid ${selected ? "#555" : "#1a1a1a"}`, background: selected ? "#ffffff05" : "transparent" }}>
              <div className="w-[15px] h-[15px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ border:`1px solid ${selected ? "#aaa" : "#333"}` }}>
                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <div className="text-[13px] font-mono" style={{ color: selected ? "#fff" : "#888" }}>{fw}</div>
                {fw === aiRec && (
                  <div className="text-[9px] mt-0.5" style={{ color:"#444" }}>AI 추천</div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* 착수 전 확인사항 */}
      {analysis.precautions?.length > 0 && (
        <div className="px-4 py-4 mb-7" style={{ border:"1px solid #2a220a", background:"#f59e0b06" }}>
          <div className="text-[9px] font-mono tracking-[.15em] mb-2.5" style={{ color:"#f59e0b" }}>
            ⚠ 착수 전 확인사항
          </div>
          {analysis.precautions.map((p, i) => (
            <div key={i} className="flex gap-2 text-[12px] py-1" style={{ color:"#888" }}>
              <span className="flex-shrink-0" style={{ color:"#f59e0b" }}>—</span>{p}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5">
        <Link href="/recommendation" className="flex-1">
          <button className="w-full text-[12px] py-3.5 transition-colors"
            style={{ background:"transparent", color:"#666", border:"1px solid #222", cursor:"pointer" }}>
            ← 다시 보기
          </button>
        </Link>
        <button onClick={handleApprove} disabled={loading || !chosenFramework}
          className="flex-[2] text-[13px] font-bold py-3.5 transition-colors"
          style={{
            background: loading || !chosenFramework ? "#141414" : "#fff",
            color: loading || !chosenFramework ? "#333" : "#000",
            border:"none",
            cursor: loading || !chosenFramework ? "not-allowed" : "pointer",
          }}>
          {loading ? "프롬프트 생성 중..." : "승인 · 프롬프트 생성 →"}
        </button>
      </div>
    </div>
  );
}
