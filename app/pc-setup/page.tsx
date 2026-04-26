"use client";

import { useState } from "react";
import Link from "next/link";
import { DriveImportButton } from "@/components/DriveImportButton";
import { CopyButton } from "@/components/CopyButton";

type PcEnv = "home" | "office" | "laptop";
type Step = "load" | "env" | "github" | "script";

const PC_PATHS: Record<PcEnv, string> = {
  home: "D:\\ai프로젝트",
  office: "C:\\ai프로젝트",
  laptop: "C:\\ai프로젝트",
};

const PC_LABELS: Record<PcEnv, string> = {
  home: "🏠 집 PC (D:\\ai프로젝트\\)",
  office: "🏢 사무실 PC (C:\\ai프로젝트\\)",
  laptop: "💻 노트북 (C:\\ai프로젝트\\)",
};

interface ParsedRequest {
  meta?: { framework?: string; created_at?: string };
  form?: { title?: string; purpose?: string };
  generated?: { claude_code_prompt?: string };
}

interface RepoInfo {
  html_url: string;
  clone_url: string;
  full_name: string;
  safe_name: string;
}

export default function PcSetupPage() {
  const [step, setStep] = useState<Step>("load");
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);
  const [rawJson, setRawJson] = useState("");
  const [pcEnv, setPcEnv] = useState<PcEnv>("home");
  const [githubToken, setGithubToken] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [repoStatus, setRepoStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [repoError, setRepoError] = useState("");
  const [repo, setRepo] = useState<RepoInfo | null>(null);

  const handleDriveImport = (filename: string, content: string) => {
    setRawJson(content);
    try {
      const p = JSON.parse(content) as ParsedRequest;
      setParsed(p);
    } catch {
      setParsed(null);
    }
    setStep("env");
    void filename;
  };

  const handleCreateRepo = async () => {
    if (!githubToken || !parsed?.form?.title) return;
    setRepoStatus("loading");
    setRepoError("");
    try {
      const res = await fetch("/api/create-github-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: githubToken,
          repoName: parsed.form.title,
          description: parsed.form.purpose ?? "",
          isPrivate,
        }),
      });
      const json = await res.json() as { success: boolean; repo?: RepoInfo; error?: string };
      if (!json.success || !json.repo) throw new Error(json.error ?? "레포 생성 실패");
      setRepo(json.repo);
      setRepoStatus("done");
      setStep("script");
    } catch (e) {
      setRepoError(e instanceof Error ? e.message : "레포 생성 실패");
      setRepoStatus("error");
    }
  };

  const basePath = PC_PATHS[pcEnv];
  const repoName = repo?.safe_name ?? parsed?.form?.title?.replace(/\s+/g, "-").toLowerCase() ?? "new-project";
  const localPath = `${basePath}\\${repoName}`;
  const cloneUrl = repo?.clone_url ?? "";
  const claudePrompt = parsed?.generated?.claude_code_prompt ?? "";
  const framework = parsed?.meta?.framework ?? "Superpowers";

  const setupScript = `# ── JH 개발 환경 자동 셋업 스크립트 ──
# 환경: ${PC_LABELS[pcEnv]}
# 프로젝트: ${parsed?.form?.title ?? repoName}

# 1. 프로젝트 폴더 생성 & 이동
New-Item -ItemType Directory -Force -Path "${localPath}"
Set-Location "${localPath}"

# 2. GitHub 레포 클론
git clone ${cloneUrl || "<clone_url>"} .

# 3. Claude Code 착수
claude`;

  const codexScript = `# ── Codex 검수 실행 ──
cd "${localPath}"
# Codex로 독립 검수 시작
codex "${claudePrompt.slice(0, 200).replace(/"/g, "'")}"`;

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
  };

  return (
    <div>
      <Link href="/">
        <button className="text-[12px] font-mono pb-5 block"
          style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}>
          ← 홈
        </button>
      </Link>

      <div className="mb-7">
        <div className="text-[9px] font-mono tracking-[.15em] mb-1.5" style={{ color: "#4285f4" }}>
          PC MODE
        </div>
        <h2 className="text-[20px] font-bold mb-1">PC 개발 환경 셋업</h2>
        <p className="text-[12px]" style={{ color: "#555" }}>
          Drive에 저장된 분석 결과를 불러와 GitHub 레포 생성 + 로컬 개발 환경을 구성합니다
        </p>
      </div>

      {/* 진행 스텝 */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {(["load", "env", "github", "script"] as Step[]).map((s, i) => {
          const labels = { load: "Drive 불러오기", env: "PC 환경", github: "GitHub", script: "개발 시작" };
          const done = ["load", "env", "github", "script"].indexOf(step) > i;
          const active = step === s;
          return (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap"
                style={{
                  background: active ? "#fff" : done ? "#1a1a1a" : "transparent",
                  color: active ? "#000" : done ? "#555" : "#333",
                  border: `1px solid ${active ? "#fff" : done ? "#333" : "#1e1e1e"}`,
                }}>
                {done && <span style={{ color: "#22c55e" }}>✓</span>}
                {labels[s]}
              </div>
              {i < 3 && <span className="text-[10px] px-1" style={{ color: "#222" }}>→</span>}
            </div>
          );
        })}
      </div>

      {/* STEP 1: Drive 불러오기 */}
      {step === "load" && (
        <div>
          <div className="text-[9px] font-mono tracking-[.12em] mb-4" style={{ color: "#333" }}>
            STEP 1 — DRIVE에서 분석 결과 불러오기
          </div>
          <div className="p-5 mb-4" style={{ border: "1px dashed #222" }}>
            <p className="text-[12px] mb-4" style={{ color: "#555" }}>
              모바일에서 저장한 착수 요청 JSON 파일을 선택하세요
            </p>
            <DriveImportButton onImport={handleDriveImport} />
          </div>
          <p className="text-[10px] font-mono" style={{ color: "#2a2a2a" }}>
            Drive 파일이 없으면 먼저 모바일에서 분석 후 저장하세요
          </p>
        </div>
      )}

      {/* STEP 2: PC 환경 선택 */}
      {step === "env" && (
        <div>
          <div className="text-[9px] font-mono tracking-[.12em] mb-4" style={{ color: "#333" }}>
            STEP 2 — PC 환경 선택
          </div>

          {parsed?.form?.title && (
            <div className="px-4 py-3 mb-5" style={{ border: "1px solid #161616", background: "#0d0d0d" }}>
              <div className="text-[9px] font-mono mb-1" style={{ color: "#444" }}>불러온 프로젝트</div>
              <div className="text-[14px] font-bold" style={{ color: "#ccc" }}>{parsed.form.title}</div>
              {parsed.meta?.framework && (
                <div className="text-[10px] font-mono mt-0.5" style={{ color: "#555" }}>
                  프레임워크: {parsed.meta.framework}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-6">
            {(Object.entries(PC_LABELS) as [PcEnv, string][]).map(([key, label]) => (
              <label key={key} onClick={() => setPcEnv(key)}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all"
                style={{
                  border: `1px solid ${pcEnv === key ? "#aaa" : "#1a1a1a"}`,
                  background: pcEnv === key ? "#ffffff08" : "transparent",
                }}>
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                  style={{ border: `1px solid ${pcEnv === key ? "#aaa" : "#333"}` }}>
                  {pcEnv === key && <span className="text-[9px] text-white">✓</span>}
                </div>
                <div>
                  <div className="text-[13px]" style={{ color: pcEnv === key ? "#ccc" : "#555" }}>{label}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "#333" }}>
                    {PC_PATHS[key]}\\{repoName}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button onClick={() => setStep("github")}
            className="w-full text-[13px] font-bold py-4 hover:bg-gray-100 transition-colors"
            style={{ background: "#fff", color: "#000", border: "none", cursor: "pointer" }}>
            다음: GitHub 레포 생성 →
          </button>
        </div>
      )}

      {/* STEP 3: GitHub 레포 생성 */}
      {step === "github" && (
        <div>
          <div className="text-[9px] font-mono tracking-[.12em] mb-4" style={{ color: "#333" }}>
            STEP 3 — GITHUB 레포 생성
          </div>

          <div className="mb-4 p-4" style={{ border: "1px solid #161616", background: "#0d0d0d" }}>
            <div className="text-[10px] font-mono mb-1" style={{ color: "#444" }}>생성될 경로</div>
            <div className="text-[12px] font-mono" style={{ color: "#888" }}>
              github.com/jaeha81/{repoName}
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "#333" }}>
              → {localPath}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-mono tracking-[.1em] mb-1.5" style={{ color: "#555" }}>
              GITHUB PERSONAL ACCESS TOKEN
            </label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              style={inputStyle}
            />
            <p className="text-[10px] font-mono mt-1" style={{ color: "#2a2a2a" }}>
              github.com/settings/tokens → Generate new token (repo 권한 필요)
            </p>
          </div>

          <label onClick={() => setIsPrivate(!isPrivate)}
            className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer mb-5 transition-all"
            style={{ border: `1px solid ${isPrivate ? "#444" : "#1a1a1a"}` }}>
            <div className="w-4 h-4 flex items-center justify-center"
              style={{ border: `1px solid ${isPrivate ? "#aaa" : "#333"}` }}>
              {isPrivate && <span className="text-[9px] text-white">✓</span>}
            </div>
            <span className="text-[12px]" style={{ color: isPrivate ? "#ccc" : "#555" }}>
              Private 레포로 생성
            </span>
          </label>

          {repoError && (
            <div className="text-[11px] px-3 py-2 mb-4 font-mono" style={{ border: "1px solid #ef4444", color: "#ef4444" }}>
              {repoError}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep("env")}
              className="flex-1 text-[12px] py-3.5"
              style={{ background: "transparent", border: "1px solid #222", color: "#555", cursor: "pointer" }}>
              ← 이전
            </button>
            <button
              onClick={handleCreateRepo}
              disabled={!githubToken || repoStatus === "loading"}
              className="flex-[2] text-[13px] font-bold py-3.5 transition-colors"
              style={{
                background: githubToken && repoStatus !== "loading" ? "#fff" : "#141414",
                color: githubToken && repoStatus !== "loading" ? "#000" : "#333",
                border: "none",
                cursor: githubToken && repoStatus !== "loading" ? "pointer" : "not-allowed",
              }}>
              {repoStatus === "loading" ? "생성 중..." : "GitHub 레포 생성 →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 개발 시작 스크립트 */}
      {step === "script" && repo && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
            <div className="text-[9px] font-mono tracking-[.15em]" style={{ color: "#22c55e" }}>READY</div>
          </div>

          <div className="px-4 py-3 mb-6" style={{ border: "1px solid #22c55e33", background: "#22c55e08" }}>
            <div className="text-[10px] font-mono mb-1" style={{ color: "#444" }}>생성된 레포</div>
            <a href={repo.html_url} target="_blank" rel="noreferrer"
              className="text-[13px] font-mono" style={{ color: "#4285f4" }}>
              {repo.html_url}
            </a>
            <div className="text-[10px] font-mono mt-1" style={{ color: "#333" }}>
              로컬 경로: {localPath}
            </div>
          </div>

          {/* PowerShell 셋업 스크립트 */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[9px] font-mono tracking-[.1em]" style={{ color: "#444" }}>
                POWERSHELL 셋업 스크립트
              </div>
              <CopyButton text={setupScript} label="복사" />
            </div>
            <pre className="text-[11px] font-mono leading-[1.8] overflow-x-auto whitespace-pre-wrap break-words p-4"
              style={{ background: "#080808", border: "1px solid #161616", color: "#888" }}>
              {setupScript}
            </pre>
            <p className="text-[10px] font-mono mt-1.5" style={{ color: "#2a2a2a" }}>
              PowerShell(관리자)에서 위 스크립트 실행 → 폴더 생성 + 클론 + Claude Code 시작
            </p>
          </div>

          {/* Claude Code 착수 프롬프트 */}
          {claudePrompt && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[9px] font-mono tracking-[.1em]" style={{ color: "#444" }}>
                  CLAUDE CODE 착수 프롬프트
                </div>
                <CopyButton text={claudePrompt} label="복사" />
              </div>
              <pre className="text-[11px] font-mono leading-[1.7] overflow-x-auto whitespace-pre-wrap break-words p-4 max-h-64"
                style={{ background: "#080808", border: "1px solid #161616", color: "#888", overflow: "auto" }}>
                {claudePrompt.slice(0, 800)}{claudePrompt.length > 800 ? "\n...(복사 버튼으로 전체 복사)" : ""}
              </pre>
            </div>
          )}

          {/* Codex 검수 스크립트 */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[9px] font-mono tracking-[.1em]" style={{ color: "#444" }}>
                CODEX 독립 검수
              </div>
              <CopyButton text={codexScript} label="복사" />
            </div>
            <pre className="text-[11px] font-mono leading-[1.8] overflow-x-auto whitespace-pre-wrap break-words p-4"
              style={{ background: "#080808", border: "1px solid #161616", color: "#888" }}>
              {codexScript}
            </pre>
          </div>

          {/* 개발 순서 가이드 */}
          <div className="p-4 mb-5" style={{ border: "1px solid #1a1a1a" }}>
            <div className="text-[9px] font-mono tracking-[.1em] mb-3" style={{ color: "#333" }}>
              개발 진행 순서
            </div>
            {[
              `① PowerShell 스크립트 실행 → ${localPath} 생성 + 클론`,
              `② claude 명령어로 Claude Code 시작`,
              `③ 위 착수 프롬프트 붙여넣기 → ${framework} 프레임워크로 개발 시작`,
              `④ 구현 완료 후 Codex 검수 스크립트 실행`,
              `⑤ 결과 GitHub 커밋 → ${repo.html_url}`,
            ].map((s, i) => (
              <div key={i} className="text-[11px] py-2" style={{ borderBottom: "1px solid #111", color: "#666" }}>
                {s}
              </div>
            ))}
          </div>

          <Link href="/">
            <button className="w-full text-[12px] py-3.5 transition-colors"
              style={{ background: "transparent", border: "1px solid #222", color: "#555", cursor: "pointer" }}>
              홈으로
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
