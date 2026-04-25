"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "복사" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="font-mono text-[11px] px-3 py-1.5 transition-all duration-200"
      style={{
        background: copied ? "#22c55e18" : "transparent",
        border: `1px solid ${copied ? "#22c55e" : "#333"}`,
        color: copied ? "#22c55e" : "#666",
        cursor: "pointer",
      }}
    >
      {copied ? "✓ 복사됨" : label}
    </button>
  );
}
