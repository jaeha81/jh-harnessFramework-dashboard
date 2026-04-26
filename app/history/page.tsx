"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useDashboardStore } from "@/lib/store";
import { CopyButton } from "@/components/CopyButton";
import { DriveImportButton } from "@/components/DriveImportButton";
import type { HistoryEntry, ProjectFormData } from "@/lib/types";

interface DriveRecord {
  filename: string;
  raw: string;
}

interface ParsedRequest {
  meta?: { framework?: string; created_at?: string };
  form?: ProjectFormData;
  generated?: {
    claude_code_prompt?: string;
    codex_checklist?: string[];
    handoff_prompt?: string;
    llm_wiki_entry?: string;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const { history, deleteHistory, resetSession, setFormData } = useDashboardStore();
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [driveRecord, setDriveRecord] = useState<DriveRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"prompt" | "codex" | "handoff" | "wiki">("prompt");

  const handleNew = () => {
    resetSession();
    router.push("/new-project");
  };

  const handleDriveImport = (filename: string, content: string) => {
    setSelected(null);
    setDriveRecord({ filename, raw: content });
    setActiveTab("prompt");
  };

  // Re-analyze: load formData from Drive record into store, go to new-project
  const handleReAnalyze = (form: ProjectFormData) => {
    resetSession();
    setFormData(form);
    router.push("/new-project");
  };

  // ── Drive record detail view ──────────────────────────────────────
  if (driveRecord) {
    let parsed: ParsedRequest | null = null;
    try {
      parsed = JSON.parse(driveRecord.raw) as ParsedRequest;
    } catch {
      parsed = null;
    }

    const form = parsed?.form;
    const gen = parsed?.generated;
    const tabs = [
      { id: "prompt" as const, label: "프롬프트", content: gen?.claude_code_prompt ?? "" },
      { id: "codex" as const, label: "Codex", content: (gen?.codex_checklist ?? []).map((i) => `- [ ] ${i}`).join("\n") },
      { id: "handoff" as const, label: "Handoff", content: gen?.handoff_prompt ?? "" },
      { id: "wiki" as const, label: "Wiki", content: gen?.llm_wiki_entry ?? "" },
    ];
    const activeContent = tabs.find((t) => t.id === activeTab)?.content ?? "";

    return (
      <div>
        <button
          onClick={() => setDriveRecord(null)}
          className="text-[12px] font-mono pb-5 block"
          style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}
        >
          ← 목록으로
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: "#4285f4", fontSize: "11px" }}>☁</span>
          <h2 className="text-[16px] font-bold" style={{ color: "#ccc" }}>
            {driveRecord.filename}
          </h2>
        </div>
        {parsed?.meta && (
          <p className="text-[10px] font-mono mb-5" style={{ color: "#333" }}>
            {parsed.meta.framework ?? ""} · {parsed.meta.created_at ? new Date(parsed.meta.created_at).toLocaleDateString("ko-KR") : ""}
          </p>
        )}

        {/* Form summary */}
        {form && (
          <div className="mb-5 p-4" style={{ border: "1px solid #161616" }}>
            <div className="text-[9px] font-mono tracking-[.12em] mb-3" style={{ color: "#333" }}>
              입력 요약
            </div>
            {(
              [
                ["제목", form.title],
                ["목적", form.purpose],
                ...(form.notes ? [["메모", form.notes]] : []),
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="flex gap-3 mb-1.5">
                <span className="text-[10px] font-mono w-10 shrink-0" style={{ color: "#444" }}>{k}</span>
                <span className="text-[11px]" style={{ color: "#888", wordBreak: "break-word" }}>{v}</span>
              </div>
            ))}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {form.needs_test && <span className="text-[9px] font-mono px-2 py-1" style={{ border: "1px solid #222", color: "#555" }}>테스트</span>}
              {form.is_longterm && <span className="text-[9px] font-mono px-2 py-1" style={{ border: "1px solid #222", color: "#555" }}>장기</span>}
              {form.needs_ux && <span className="text-[9px] font-mono px-2 py-1" style={{ border: "1px solid #222", color: "#555" }}>UX</span>}
              {form.needs_security && <span className="text-[9px] font-mono px-2 py-1" style={{ border: "1px solid #222", color: "#555" }}>보안</span>}
            </div>
          </div>
        )}

        {/* Generated output tabs */}
        {gen && (
          <div>
            <div className="flex overflow-x-auto mb-4" style={{ borderBottom: "1px solid #161616" }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="font-mono text-[10px] px-3 py-2 whitespace-nowrap transition-all"
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${activeTab === t.id ? "#fff" : "transparent"}`,
                    color: activeTab === t.id ? "#fff" : "#444",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end mb-2">
              <CopyButton text={activeContent} label="복사" />
            </div>
            <pre
              className="text-[11px] font-mono leading-[1.7] overflow-x-auto whitespace-pre-wrap break-words p-4"
              style={{ background: "#080808", border: "1px solid #161616", color: "#888" }}
            >
              {activeContent || "내용 없음"}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {form && (
            <button
              onClick={() => handleReAnalyze(form)}
              className="text-[12px] font-mono px-4 py-2.5 transition-colors"
              style={{ background: "#fff", color: "#000", border: "none", cursor: "pointer" }}
            >
              이 요청으로 재분석 →
            </button>
          )}
          <CopyButton text={driveRecord.raw} label="전체 JSON 복사" />
        </div>
      </div>
    );
  }

  // ── Local history detail view ─────────────────────────────────────
  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="text-[12px] font-mono pb-5 block"
          style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}
        >
          ← 목록으로
        </button>
        <h2 className="text-[18px] font-bold mb-1">{selected.title}</h2>
        <p className="text-[11px] font-mono mb-5" style={{ color: "#444" }}>
          {selected.framework} · {selected.date}
        </p>

        {/* Output tabs */}
        {(() => {
          const tabs = [
            { id: "prompt" as const, label: "프롬프트", content: selected.output.claude_code_prompt },
            { id: "codex" as const, label: "Codex", content: (selected.output.codex_checklist ?? []).map((i) => `- [ ] ${i}`).join("\n") },
            { id: "handoff" as const, label: "Handoff", content: selected.output.handoff_prompt },
            { id: "wiki" as const, label: "Wiki", content: selected.output.llm_wiki_entry },
          ];
          const activeContent = tabs.find((t) => t.id === activeTab)?.content ?? "";
          return (
            <>
              <div className="flex overflow-x-auto mb-4" style={{ borderBottom: "1px solid #161616" }}>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className="font-mono text-[10px] px-3 py-2 whitespace-nowrap"
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: `2px solid ${activeTab === t.id ? "#fff" : "transparent"}`,
                      color: activeTab === t.id ? "#fff" : "#444",
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end mb-2">
                <CopyButton text={activeContent} label="복사" />
              </div>
              <pre
                className="text-[11px] font-mono leading-[1.7] overflow-x-auto whitespace-pre-wrap break-words p-4"
                style={{ background: "#080808", border: "1px solid #161616", color: "#888" }}
              >
                {activeContent}
              </pre>
            </>
          );
        })()}

        <div className="flex gap-2 mt-5 flex-wrap">
          <button
            onClick={() => {
              resetSession();
              setFormData(selected.formData);
              router.push("/new-project");
            }}
            className="text-[12px] font-mono px-4 py-2.5 transition-colors"
            style={{ background: "#fff", color: "#000", border: "none", cursor: "pointer" }}
          >
            이 요청으로 재분석 →
          </button>
          <button
            onClick={() => { deleteHistory(selected.id); setSelected(null); }}
            className="text-[11px] px-3 py-2 font-mono transition-colors"
            style={{ background: "transparent", border: "1px solid #2a1515", color: "#ef444488", cursor: "pointer" }}
          >
            삭제
          </button>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex justify-between items-start mb-7">
        <div>
          <Link href="/">
            <button
              className="text-[12px] font-mono pb-2 block"
              style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}
            >
              ← 홈
            </button>
          </Link>
          <h2 className="text-[20px] font-bold">개발 착수 기록</h2>
          <p className="text-[11px] font-mono mt-1" style={{ color: "#333" }}>
            로컬 {history.length}건
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleNew}
            className="text-[12px] font-bold px-4 py-2.5 hover:bg-gray-100 transition-colors"
            style={{ background: "#fff", color: "#000", border: "none", cursor: "pointer" }}
          >
            + 새 착수
          </button>
          <DriveImportButton onImport={handleDriveImport} />
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16" style={{ color: "#333" }}>
          <div className="text-[10px] font-mono tracking-[.15em] mb-2.5">NO RECORDS</div>
          <p className="text-[12px]">아직 개발 착수 기록이 없습니다</p>
          <p className="text-[11px] mt-2" style={{ color: "#2a2a2a" }}>
            Drive 기록 불러오기로 이전 요청을 조회할 수 있습니다
          </p>
        </div>
      ) : (
        <div>
          {history.map((entry) => (
            <div
              key={entry.id}
              onClick={() => { setSelected(entry); setActiveTab("prompt"); }}
              className="px-4 py-4 mb-1.5 cursor-pointer transition-all duration-200 hover:border-[#333]"
              style={{ border: "1px solid #161616" }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-[13px] font-medium mb-0.5 truncate" style={{ color: "#ccc" }}>
                    {entry.title}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: "#444" }}>
                    {entry.framework}
                  </div>
                </div>
                <div className="text-[10px] font-mono shrink-0" style={{ color: "#333" }}>
                  {entry.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
