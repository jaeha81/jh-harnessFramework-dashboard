"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { history, resetSession } = useDashboardStore();

  const handleNewProject = () => {
    resetSession();
    router.push("/new-project");
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-12">
        <div className="font-mono text-[10px] tracking-[.2em] mb-5" style={{ color: "#3a3a3a" }}>
          JH SYSTEM · CLAUDE CODE HARNESS
        </div>
        <h1
          className="font-extrabold leading-[1.05] mb-5 tracking-[-0.03em]"
          style={{ fontSize: "clamp(28px,6vw,44px)", color: "#fff" }}
        >
          JH-하네스<br />프레임워크<br />대시보드
        </h1>
        <p className="text-[13px] leading-[1.7] max-w-sm" style={{ color: "#555" }}>
          개발 자료를 입력하면 GPT가 분석해 Drive에 저장합니다.
          PC에서 불러와 Claude Code + Codex로 개발을 시작합니다.
        </p>
      </div>

      {/* 두 경로 카드 */}
      <div className="flex flex-col gap-3 mb-10 max-w-sm">

        {/* 모바일 경로 */}
        <div style={{ border: "1px solid #1e1e1e" }}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[18px]">📱</span>
              <div>
                <div className="text-[11px] font-mono" style={{ color: "#f59e0b" }}>MOBILE · ANALYZE</div>
                <div className="text-[14px] font-bold" style={{ color: "#ccc" }}>개발 착수 분석</div>
              </div>
            </div>
            <p className="text-[11px] leading-[1.6] mb-4" style={{ color: "#444" }}>
              개발 목적과 자료를 입력하면 GPT-4o-mini가 분석해
              최적 프레임워크를 추천하고 Google Drive에 저장합니다
            </p>
            <div className="flex flex-col gap-1.5 text-[10px] font-mono mb-4" style={{ color: "#333" }}>
              <div>① 개발 정의 + 자료 입력</div>
              <div>② GPT-4o-mini 분석 → 프레임워크 추천</div>
              <div>③ Claude Code 착수 패키지 생성</div>
              <div>④ Google Drive 자동 저장</div>
            </div>
          </div>
          <button
            onClick={handleNewProject}
            className="w-full text-[13px] font-bold px-5 py-3.5 flex justify-between items-center hover:bg-gray-100 transition-colors"
            style={{ background: "#fff", color: "#000", border: "none", borderTop: "1px solid #1e1e1e", cursor: "pointer" }}
          >
            새 개발 착수 시작 <span>→</span>
          </button>
        </div>

        {/* PC 경로 */}
        <div style={{ border: "1px solid #1e1e1e" }}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[18px]">💻</span>
              <div>
                <div className="text-[11px] font-mono" style={{ color: "#4285f4" }}>PC · DEVELOP</div>
                <div className="text-[14px] font-bold" style={{ color: "#ccc" }}>PC 개발 환경 셋업</div>
              </div>
            </div>
            <p className="text-[11px] leading-[1.6] mb-4" style={{ color: "#444" }}>
              Drive에서 분석 결과를 불러와 GitHub 레포를 생성하고
              집/사무실/노트북 경로에 맞는 개발 환경을 자동 구성합니다
            </p>
            <div className="flex flex-col gap-1.5 text-[10px] font-mono mb-4" style={{ color: "#333" }}>
              <div>① Google Drive에서 착수 요청 불러오기</div>
              <div>② PC 환경 선택 (집/사무실/노트북)</div>
              <div>③ GitHub 레포 자동 생성</div>
              <div>④ 로컬 폴더 생성 + Claude Code 착수</div>
            </div>
          </div>
          <Link href="/pc-setup" className="block">
            <button
              className="w-full text-[13px] font-bold px-5 py-3.5 flex justify-between items-center transition-colors hover:border-[#4285f4]"
              style={{
                background: "transparent",
                color: "#4285f4",
                border: "none",
                borderTop: "1px solid #1e1e1e",
                cursor: "pointer",
              }}
            >
              PC 개발 시작 <span>→</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 보조 링크 */}
      <div className="flex flex-col gap-2 max-w-sm">
        <Link
          href="/frameworks"
          className="w-full text-[12px] px-5 py-3 flex justify-between items-center transition-colors hover:border-[#333]"
          style={{ background: "transparent", border: "1px solid #1a1a1a", color: "#555" }}
        >
          프레임워크 상세 보기 <span style={{ color: "#333" }}>→</span>
        </Link>
        {history.length > 0 && (
          <Link
            href="/history"
            className="w-full text-[12px] px-5 py-3 flex justify-between items-center transition-colors hover:border-[#333]"
            style={{ background: "transparent", border: "1px solid #1a1a1a", color: "#555" }}
          >
            이전 분석 기록 ({history.length}) <span style={{ color: "#333" }}>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
