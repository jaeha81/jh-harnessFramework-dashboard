"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/lib/store";
import { FRAMEWORKS } from "@/lib/framework-data";

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
      <div className="mb-14">
        <div
          className="font-mono text-[10px] tracking-[.2em] mb-5"
          style={{ color: "#3a3a3a" }}
        >
          JH SYSTEM · CLAUDE CODE HARNESS
        </div>
        <h1
          className="font-extrabold leading-[1.05] mb-5 tracking-[-0.03em]"
          style={{ fontSize: "clamp(30px,6vw,46px)", color: "#fff" }}
        >
          JH-하네스<br />프레임워크<br />대시보드
        </h1>
        <p className="text-[13px] leading-[1.7] max-w-sm" style={{ color: "#555" }}>
          개발 요청을 입력하면 AI가 최적의 Claude Code 프레임워크를 분석하고
          즉시 실행 가능한 착수 패키지를 생성합니다.
        </p>
      </div>

      {/* 프레임워크 뱃지 */}
      <div className="flex gap-1.5 mb-12 flex-wrap">
        {Object.values(FRAMEWORKS).map((fw) => (
          <div
            key={fw.key}
            className="flex items-center gap-2 px-3.5 py-2.5"
            style={{ border: "1px solid #1e1e1e" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: fw.color }}
            />
            <span className="text-[12px] font-mono" style={{ color: "#ccc" }}>
              {fw.name}
            </span>
            <span className="text-[10px]" style={{ color: "#444" }}>
              {fw.tagline}
            </span>
          </div>
        ))}
      </div>

      {/* CTA 버튼 */}
      <div className="flex flex-col gap-2.5 max-w-sm">
        <button
          onClick={handleNewProject}
          className="w-full bg-white text-black font-bold text-[14px] px-5 py-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
        >
          새 개발 착수 시작 <span>→</span>
        </button>
        <Link
          href="/frameworks"
          className="w-full text-[13px] px-5 py-3.5 flex justify-between items-center transition-colors hover:border-[#333]"
          style={{
            background: "transparent",
            border: "1px solid #222",
            color: "#ccc",
          }}
        >
          프레임워크 상세 보기{" "}
          <span style={{ color: "#444" }}>→</span>
        </Link>
        {history.length > 0 && (
          <Link
            href="/history"
            className="w-full text-[13px] px-5 py-3.5 flex justify-between items-center transition-colors hover:border-[#333]"
            style={{
              background: "transparent",
              border: "1px solid #222",
              color: "#ccc",
            }}
          >
            이전 기록 ({history.length}){" "}
            <span style={{ color: "#444" }}>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
