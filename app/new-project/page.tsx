"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useDashboardStore } from "@/lib/store";
import { StepBar } from "@/components/StepBar";
import type { AnalysisResult } from "@/lib/types";

const inputStyle = {
  background: "#0e0e0e",
  border: "1px solid #222",
  color: "#ddd",
  padding: "10px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
  borderRadius: 0,
  appearance: "none" as const,
};

export default function NewProjectPage() {
  const router = useRouter();
  const { formData, setFormData, setAnalysis } = useDashboardStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) =>
    setFormData({ [k]: v } as Parameters<typeof setFormData>[0]);

  const isValid = formData.title.trim() && formData.purpose.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      const json = await res.json() as { success: boolean; data?: AnalysisResult; error?: string };

      if (!json.success || !json.data) {
        throw new Error(json.error ?? "분석 실패");
      }

      const rec = json.data.recommended_framework === "조합"
        ? (json.data.combination_order ?? []).join("+")
        : json.data.recommended_framework;

      setAnalysis(json.data, rec);
      router.push("/recommendation");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const labelCls = "block text-[10px] font-mono tracking-[.12em] mb-1.5";
  const labelStyle = { color: "#555" };
  const sectionLabel = "text-[9px] font-mono tracking-[.15em] border-b pb-1.5 mb-4 mt-7";
  const sectionStyle = { color: "#333", borderColor: "#161616" };

  return (
    <div>
      <Link href="/">
        <button className="text-[12px] font-mono pb-5 block" style={{ background:"none", border:"none", color:"#444", cursor:"pointer" }}>
          ← 홈
        </button>
      </Link>

      <StepBar current="input" />

      <h2 className="text-[20px] font-bold mb-1.5 tracking-tight">개발 요청 입력</h2>
      <p className="text-[12px] mb-7" style={{ color: "#555" }}>
        개발 목적과 필요 조건을 입력하면 최적의 프레임워크가 추천됩니다
      </p>

      {error && (
        <div className="text-[12px] px-3 py-3 mb-5" style={{ border:"1px solid #ef4444", background:"#ef444410", color:"#ef4444" }}>
          {error}
        </div>
      )}

      {/* REQUIRED */}
      <div className={sectionLabel} style={sectionStyle}>REQUIRED</div>

      <div className="mb-4">
        <label className={labelCls} style={labelStyle}>개발 제목</label>
        <input style={inputStyle} placeholder="예: JH-키아누 async 클라이언트 버그 수정"
          value={formData.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div className="mb-4">
        <label className={labelCls} style={labelStyle}>개발 목적</label>
        <textarea style={{ ...inputStyle, resize:"vertical", minHeight:"72px" }}
          placeholder="왜 이것을 만드는가?"
          value={formData.purpose} onChange={(e) => set("purpose", e.target.value)} />
      </div>

      {/* ANALYSIS FLAGS */}
      <div className={sectionLabel} style={sectionStyle}>ANALYSIS FLAGS</div>
      <div className="grid grid-cols-2 gap-2 mb-7">
        {[
          { k: "needs_test", l: "테스트 필요" },
          { k: "is_longterm", l: "장기 작업 (3일+)" },
          { k: "needs_ux", l: "UX/UI 검토 필요" },
          { k: "needs_security", l: "보안 검토 필요" },
        ].map(({ k, l }) => {
          const checked = formData[k as keyof typeof formData] as boolean;
          return (
            <label key={k} onClick={() => set(k, !checked)}
              className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-all duration-200"
              style={{ border:`1px solid ${checked ? "#444" : "#1a1a1a"}`, background: checked ? "#ffffff06" : "transparent" }}>
              <div className="w-[15px] h-[15px] flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{ border:`1px solid ${checked ? "#aaa" : "#333"}` }}>
                {checked && <span className="text-white text-[9px] leading-none">✓</span>}
              </div>
              <span className="text-[12px]" style={{ color: checked ? "#ccc" : "#555" }}>{l}</span>
            </label>
          );
        })}
      </div>

      {/* OPTIONAL */}
      <div className={sectionLabel} style={sectionStyle}>OPTIONAL</div>
      <div className="mb-6">
        <label className={labelCls} style={labelStyle}>참고 링크 또는 메모</label>
        <textarea style={{ ...inputStyle, resize:"vertical", minHeight:"56px" }}
          placeholder="GitHub 링크, 관련 문서, 특이사항 등"
          value={formData.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <button onClick={handleSubmit} disabled={!isValid || loading}
        className="w-full text-[14px] font-bold py-4 px-6 transition-all duration-200"
        style={{
          background: isValid && !loading ? "#fff" : "#141414",
          color: isValid && !loading ? "#000" : "#333",
          border: "none",
          cursor: isValid && !loading ? "pointer" : "not-allowed",
        }}>
        {loading ? "AI 분석 중..." : isValid ? "AI 분석 시작 →" : "제목과 목적을 입력해주세요"}
      </button>
    </div>
  );
}
