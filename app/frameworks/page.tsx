"use client";

import Link from "next/link";
import { useState } from "react";
import { FRAMEWORKS } from "@/lib/framework-data";

export default function FrameworksPage() {
  const [active, setActive] = useState("superpowers");
  const fw = FRAMEWORKS[active];

  return (
    <div>
      <Link href="/">
        <button className="text-[12px] font-mono pb-5 block"
          style={{ background:"none", border:"none", color:"#444", cursor:"pointer" }}>
          ← 홈
        </button>
      </Link>

      <h2 className="text-[20px] font-bold mb-1.5">프레임워크 가이드</h2>
      <p className="text-[11px] font-mono mb-6" style={{ color:"#444" }}>실제 레포 기반 정보</p>

      {/* 탭 */}
      <div className="flex gap-1.5 mb-7">
        {Object.values(FRAMEWORKS).map((f) => (
          <button key={f.key} onClick={() => setActive(f.key)}
            className="text-[11px] font-mono px-3.5 py-2 transition-all duration-200"
            style={{
              background: active === f.key ? "#fff" : "transparent",
              color: active === f.key ? "#000" : "#555",
              border: `1px solid ${active === f.key ? "#fff" : "#222"}`,
              cursor:"pointer",
            }}>
            {f.name}
          </button>
        ))}
      </div>

      {/* 프레임워크 카드 */}
      <div className="px-5 py-5 mb-5" style={{ border:`1px solid ${fw.color}28` }}>
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: fw.color }} />
          <h3 className="text-[18px] font-mono" style={{ color: fw.color }}>{fw.name}</h3>
          <span className="text-[10px]" style={{ color:"#444" }}>★ {fw.stars}</span>
        </div>
        <div className="text-[10px] font-mono mb-2.5" style={{ color:"#444" }}>{fw.author}</div>
        <p className="text-[12px] leading-[1.65] mb-4" style={{ color:"#888" }}>{fw.description}</p>

        <div className="px-3 py-2.5 mb-3" style={{ background:"#0a0a0a", border:"1px solid #1a1a1a" }}>
          <div className="text-[9px] font-mono mb-1.5" style={{ color:"#333" }}>INSTALL</div>
          <code className="text-[10px] font-mono break-all" style={{ color:"#666" }}>{fw.install}</code>
        </div>

        <div className="px-3 py-2.5" style={{ background:"#0a0a0a", border:"1px solid #1a1a1a" }}>
          <div className="text-[9px] font-mono mb-1.5" style={{ color:"#333" }}>WORKFLOW</div>
          <code className="text-[10px] font-mono" style={{ color:"#666" }}>{fw.workflow}</code>
        </div>
      </div>

      {/* Skills / Commands + Avoid */}
      <div className="grid grid-cols-2 gap-3.5 mb-7">
        <div>
          <div className="text-[9px] font-mono tracking-[.12em] mb-2.5" style={{ color:"#444" }}>
            SKILLS / COMMANDS
          </div>
          {fw.roles.map((r) => (
            <div key={r} className="flex gap-1.5 py-1.5 text-[11px]"
              style={{ borderBottom:"1px solid #111", color:"#777" }}>
              <span className="flex-shrink-0" style={{ color: fw.color }}>+</span>
              <span className="font-mono">{r}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] font-mono tracking-[.12em] mb-2.5" style={{ color:"#444" }}>
            AVOID WHEN
          </div>
          {fw.avoid.map((a) => (
            <div key={a} className="flex gap-1.5 py-1.5 text-[11px]"
              style={{ borderBottom:"1px solid #111", color:"#777" }}>
              <span className="flex-shrink-0" style={{ color:"#333" }}>—</span>{a}
            </div>
          ))}
        </div>
      </div>

      <Link href="/new-project">
        <button className="w-full text-[13px] font-bold py-3.5 hover:bg-gray-100 transition-colors"
          style={{ background:"#fff", color:"#000", border:"none", cursor:"pointer" }}>
          새 개발 착수 시작 →
        </button>
      </Link>
    </div>
  );
}
