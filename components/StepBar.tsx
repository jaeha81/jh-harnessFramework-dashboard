"use client";

const STEPS = [
  { id: "input", label: "입력" },
  { id: "analyzing", label: "분석" },
  { id: "recommendation", label: "추천" },
  { id: "review", label: "검토" },
  { id: "generating", label: "생성" },
  { id: "output", label: "결과" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface StepBarProps {
  current: StepId;
}

export function StepBar({ current }: StepBarProps) {
  const idx = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center mb-10">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-mono transition-all duration-300"
              style={{
                border: `1px solid ${i <= idx ? "#fff" : "#2a2a2a"}`,
                background: i === idx ? "#ffffff12" : "transparent",
                color: i <= idx ? "#fff" : "#3a3a3a",
              }}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span
              className="text-[9px] font-mono whitespace-nowrap"
              style={{ color: i === idx ? "#aaa" : "#333" }}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="w-8 h-px mb-[18px] mx-0.5"
              style={{ background: i < idx ? "#333" : "#1a1a1a" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
