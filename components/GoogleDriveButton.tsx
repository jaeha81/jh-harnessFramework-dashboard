"use client";

import { useState } from "react";
import { saveToGoogleDrive } from "@/lib/googleDrive";

interface GoogleDriveButtonProps {
  filename: string;
  content: string;
}

type Status = "idle" | "loading" | "success" | "error";

export function GoogleDriveButton({ filename, content }: GoogleDriveButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      await saveToGoogleDrive(filename, content);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "저장 실패");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const label = {
    idle: "☁ Google Drive에 저장",
    loading: "저장 중...",
    success: "✓ 저장 완료",
    error: `✕ ${errorMsg}`,
  }[status];

  const borderColor = {
    idle: "#2a2a2a",
    loading: "#333",
    success: "#22c55e",
    error: "#ef4444",
  }[status];

  const textColor = {
    idle: "#666",
    loading: "#555",
    success: "#22c55e",
    error: "#ef4444",
  }[status];

  const iconColor = {
    idle: "#4285f4",
    loading: "#4285f4",
    success: "#22c55e",
    error: "#ef4444",
  }[status];

  return (
    <button
      onClick={handleSave}
      disabled={status === "loading" || status === "success"}
      className="w-full text-[12px] font-mono py-3 flex items-center justify-center gap-2 transition-colors"
      style={{
        background: "transparent",
        border: `1px dashed ${borderColor}`,
        color: textColor,
        cursor: status === "loading" || status === "success" ? "default" : "pointer",
        opacity: status === "loading" ? 0.7 : 1,
      }}
    >
      {status === "loading" ? (
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            border: "1px solid #444",
            borderTopColor: "#4285f4",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      ) : (
        <span style={{ color: iconColor }}>☁</span>
      )}
      {label}
      {status === "idle" && (
        <span style={{ color: "#333", fontSize: "10px" }}>
          ("JH 하네스 대시보드" 폴더)
        </span>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
