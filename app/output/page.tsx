"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useDashboardStore } from "@/lib/store";
import { StepBar } from "@/components/StepBar";
import { CopyButton } from "@/components/CopyButton";
import { saveToDrive } from "@/lib/google-drive";

type TabId = "prompt" | "codex" | "handoff" | "wiki";

const TABS: { id: TabId; label: string }[] = [
  { id: "prompt", label: "Claude Code 프롬프트" },
  { id: "codex", label: "Codex 체크리스트" },
  { id: "handoff", label: "Handoff" },
  { id: "wiki", label: "LLM Wiki" },
];

const CodeBlock = ({ content }: { content: string }) => (
  <pre
    className="text-[11px] font-mono leading-[1.75] overflow-x-auto whitespace-pre-wrap break-words p-5"
    style={{ background:"#080808", border:"1px solid #161616", color:"#aaa", margin:0 }}
  >
    {content}
  </pre>
);

export default function OutputPage() {
  const router = useRouter();
  const { output, formData, chosenFramework, resetSession } = useDashboardStore();
  const [tab, setTab] = useState<TabId>("prompt");
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  useEffect(() => {
    if (!output) router.replace("/new-project");
  }, [output, router]);

  if (!output) return null;

  const handleNew = () => {
    resetSession();
    router.push("/new-project");
  };

  const handleDriveSave = async () => {
    setDriveLoading(true);
    setDriveError(null);
    setDriveLink(null);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const safeTitle = formData.title.replace(/[\\/:*?"<>|]/g, "-").trim() || "착수패키지";
      const filename = `${date}-${safeTitle}.md`;
      const content = buildMdContent();
      const link = await saveToDrive(filename, content);
      setDriveLink(link);
    } catch (e) {
      setDriveError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setDriveLoading(false);
    }
  };

  const buildMdContent = () => {
    const date = new Date().toISOString().slice(0, 10);
    return [
      `# ${formData.title} — 착수 패키지`,
      `> 생성일: ${date} | 프레임워크: ${chosenFramework}`,
      ``, `---`, ``,
      `## Claude Code 프롬프트`, ``, output!.claude_code_prompt,
      ``, `---`, ``,
      `## Codex 체크리스트`, ``,
      output!.codex_checklist.map((i) => `- [ ] ${i}`).join("\n"),
      ``, `---`, ``,
      `## Handoff 프롬프트`, ``, output!.handoff_prompt,
      ``, `---`, ``,
      `## LLM Wiki`, ``, output!.llm_wiki_entry,
    ].join("\n");
  };

  const downloadMd = () => {
    const date = new Date().toISOString().slice(0, 10);
    const safeTitle = formData.title.replace(/[\\/:*?"<>|]/g, "-").trim() || "착수패키지";
    const filename = `${date}-${safeTitle}.md`;
    const blob = new Blob([buildMdContent()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <StepBar current="output" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background:"#22c55e" }} />
          <span className="text-[9px] font-mono tracking-[.15em]" style={{ color:"#22c55e" }}>GENERATED</span>
        </div>
        <h2 className="text-[20px] font-bold">개발 착수 패키지</h2>
        <p className="text-[11px] font-mono mt-1" style={{ color:"#555" }}>
          {formData.title} · {chosenFramework}
        </p>
      </div>

      {/* 탭 */}
      <div className="flex overflow-x-auto mb-5" style={{ borderBottom:"1px solid #161616" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="font-mono text-[11px] px-3.5 py-2.5 whitespace-nowrap transition-all duration-200"
            style={{
              background:"none",
              border:"none",
              borderBottom: `2px solid ${tab === t.id ? "#fff" : "transparent"}`,
              color: tab === t.id ? "#fff" : "#444",
              cursor:"pointer",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      {tab === "prompt" && (
        <div>
          <div className="flex justify-end mb-2">
            <CopyButton text={output.claude_code_prompt} label="전체 복사" />
          </div>
          <CodeBlock content={output.claude_code_prompt} />
        </div>
      )}

      {tab === "codex" && (
        <div>
          {output.codex_checklist?.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom:"1px solid #111" }}>
              <div className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ border:"1px solid #2a2a2a" }} />
              <span className="text-[12px]" style={{ color:"#999" }}>{item}</span>
            </div>
          ))}
          <div className="mt-3.5">
            <CopyButton
              text={(output.codex_checklist ?? []).map((i) => `- [ ] ${i}`).join("\n")}
              label="Markdown 복사"
            />
          </div>
        </div>
      )}

      {tab === "handoff" && (
        <div>
          <div className="flex justify-end mb-2">
            <CopyButton text={output.handoff_prompt} />
          </div>
          <CodeBlock content={output.handoff_prompt} />
        </div>
      )}

      {tab === "wiki" && (
        <div>
          <div className="flex justify-end mb-2">
            <CopyButton text={output.llm_wiki_entry} />
          </div>
          <CodeBlock content={output.llm_wiki_entry} />
        </div>
      )}

      {/* 저장 버튼 영역 */}
      <div className="mt-7 flex flex-col gap-2">
        {/* Google Drive 저장 */}
        <button onClick={handleDriveSave} disabled={driveLoading}
          className="w-full text-[12px] font-mono py-3 flex items-center justify-center gap-2 transition-colors hover:border-[#555]"
          style={{ background:"transparent", border:"1px solid #1e3a1e", color: driveLoading ? "#444" : "#4ade80", cursor: driveLoading ? "not-allowed" : "pointer" }}>
          <span>☁</span>
          {driveLoading ? "Google Drive 저장 중..." : "Google Drive에 저장"}
          <span style={{ color:"#2d5a2d", fontSize:"10px" }}>({formData.title || "착수패키지"})</span>
        </button>

        {driveLink && (
          <a href={driveLink} target="_blank" rel="noopener noreferrer"
            className="w-full text-[11px] font-mono py-2 flex items-center justify-center gap-1.5 transition-colors"
            style={{ background:"#0a1a0a", border:"1px solid #1e3a1e", color:"#4ade80" }}>
            ✓ Drive에 저장됨 — 파일 열기 →
          </a>
        )}

        {driveError && (
          <div className="text-[11px] px-3 py-2" style={{ border:"1px solid #ef4444", background:"#ef444410", color:"#ef4444" }}>
            {driveError}
          </div>
        )}

        {/* MD 다운로드 */}
        <button onClick={downloadMd}
          className="w-full text-[12px] font-mono py-3 flex items-center justify-center gap-2 transition-colors hover:border-[#444]"
          style={{ background:"transparent", border:"1px dashed #2a2a2a", color:"#555", cursor:"pointer" }}>
          <span style={{ color:"#22c55e" }}>↓</span>
          .md 파일 다운로드
          <span style={{ color:"#333", fontSize:"10px" }}>(Obsidian Vault 저장용)</span>
        </button>
      </div>

      <div className="flex gap-2.5 mt-2.5">
        <Link href="/" className="flex-1">
          <button className="w-full text-[12px] py-3.5 transition-colors"
            style={{ background:"transparent", color:"#666", border:"1px solid #222", cursor:"pointer" }}>
            홈
          </button>
        </Link>
        <Link href="/history" className="flex-1">
          <button className="w-full text-[12px] py-3.5 transition-colors"
            style={{ background:"transparent", color:"#666", border:"1px solid #222", cursor:"pointer" }}>
            기록 보기
          </button>
        </Link>
        <button onClick={handleNew} className="flex-[2] text-[13px] font-bold py-3.5 hover:bg-gray-100 transition-colors"
          style={{ background:"#fff", color:"#000", border:"none", cursor:"pointer" }}>
          새 착수 →
        </button>
      </div>
    </div>
  );
}
