"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useDashboardStore } from "@/lib/store";
import { CopyButton } from "@/components/CopyButton";
import { DriveImportButton } from "@/components/DriveImportButton";
import type { HistoryEntry } from "@/lib/types";

interface DriveRecord {
  filename: string;
  raw: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { history, deleteHistory, resetSession } = useDashboardStore();
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [driveRecord, setDriveRecord] = useState<DriveRecord | null>(null);

  const handleNew = () => {
    resetSession();
    router.push("/new-project");
  };

  const handleDriveImport = (filename: string, content: string) => {
    setSelected(null);
    setDriveRecord({ filename, raw: content });
  };

  if (driveRecord) {
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(driveRecord.raw) as Record<string, unknown>;
    } catch {
      parsed = null;
    }

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
        <p className="text-[10px] font-mono mb-5" style={{ color: "#333" }}>
          Drive에서 불러온 착수 요청
        </p>

        {parsed && typeof parsed.formData === "object" && parsed.formData !== null && (
          <div className="mb-4 p-4" style={{ border: "1px solid #161616" }}>
            <div className="text-[10px] font-mono tracking-[.1em] mb-3" style={{ color: "#333" }}>
              FORM DATA
            </div>
            {Object.entries(parsed.formData as Record<string, unknown>).map(([k, v]) => (
              <div key={k} className="flex gap-3 mb-1.5">
                <span className="text-[10px] font-mono w-24 shrink-0" style={{ color: "#444" }}>
                  {k}
                </span>
                <span className="text-[11px] font-mono" style={{ color: "#888" }}>
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-3">
          <CopyButton text={driveRecord.raw} label="JSON 복사" />
        </div>

        <pre
          className="text-[10px] font-mono leading-[1.7] overflow-x-auto whitespace-pre-wrap break-words p-4"
          style={{ background: "#080808", border: "1px solid #161616", color: "#444" }}
        >
          {driveRecord.raw}
        </pre>
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)}
          className="text-[12px] font-mono pb-5 block"
          style={{ background:"none", border:"none", color:"#444", cursor:"pointer" }}>
          ← 목록으로
        </button>
        <h2 className="text-[18px] font-bold mb-1">{selected.title}</h2>
        <p className="text-[11px] font-mono mb-5" style={{ color:"#444" }}>
          {selected.framework} · {selected.date}
        </p>

        <div className="flex gap-2 mb-3">
          <CopyButton text={selected.output.claude_code_prompt} label="프롬프트 복사" />
          <CopyButton text={selected.output.handoff_prompt} label="Handoff 복사" />
          <CopyButton text={selected.output.llm_wiki_entry} label="Wiki 복사" />
        </div>

        <pre className="text-[11px] font-mono leading-[1.7] overflow-x-auto whitespace-pre-wrap break-words p-4"
          style={{ background:"#080808", border:"1px solid #161616", color:"#888" }}>
          {selected.output.claude_code_prompt}
        </pre>

        <div className="mt-5">
          <button onClick={() => { deleteHistory(selected.id); setSelected(null); }}
            className="text-[11px] px-3 py-2 font-mono transition-colors"
            style={{ background:"transparent", border:"1px solid #2a1515", color:"#ef444488", cursor:"pointer" }}>
            이 기록 삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-7">
        <div>
          <Link href="/">
            <button className="text-[12px] font-mono pb-2 block"
              style={{ background:"none", border:"none", color:"#444", cursor:"pointer" }}>
              ← 홈
            </button>
          </Link>
          <h2 className="text-[20px] font-bold">개발 착수 기록</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={handleNew}
            className="text-[12px] font-bold px-4 py-2.5 hover:bg-gray-100 transition-colors"
            style={{ background:"#fff", color:"#000", border:"none", cursor:"pointer" }}>
            + 새 착수
          </button>
          <DriveImportButton onImport={handleDriveImport} />
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16" style={{ color:"#333" }}>
          <div className="text-[10px] font-mono tracking-[.15em] mb-2.5">NO RECORDS</div>
          <p className="text-[12px]">아직 개발 착수 기록이 없습니다</p>
        </div>
      ) : (
        <div>
          {history.map((entry) => (
            <div key={entry.id} onClick={() => setSelected(entry)}
              className="px-4 py-4 mb-1.5 cursor-pointer transition-all duration-200 hover:border-[#333]"
              style={{ border:"1px solid #161616" }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[13px] font-medium mb-0.5" style={{ color:"#ccc" }}>
                    {entry.title}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color:"#444" }}>
                    {entry.framework}
                  </div>
                </div>
                <div className="text-[10px] font-mono" style={{ color:"#333" }}>
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
