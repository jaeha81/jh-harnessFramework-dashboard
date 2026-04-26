"use client";

import { useState } from "react";
import { listDriveRequests, readDriveFile } from "@/lib/googleDrive";
import type { DriveFileInfo } from "@/lib/googleDrive";

interface DriveImportButtonProps {
  onImport: (filename: string, content: string) => void;
}

type Status = "idle" | "listing" | "reading" | "error";

export function DriveImportButton({ onImport }: DriveImportButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [files, setFiles] = useState<DriveFileInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setStatus("listing");
    setErrorMsg("");
    try {
      const list = await listDriveRequests();
      setFiles(list);
      setOpen(true);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "목록 조회 실패");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleSelect = async (file: DriveFileInfo) => {
    setStatus("reading");
    try {
      const content = await readDriveFile(file.id);
      setOpen(false);
      setStatus("idle");
      onImport(file.name, content);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "파일 읽기 실패");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const isLoading = status === "listing" || status === "reading";

  const label =
    status === "listing"
      ? "목록 조회 중..."
      : status === "reading"
      ? "파일 읽는 중..."
      : status === "error"
      ? `✕ ${errorMsg}`
      : "Drive 기록 불러오기";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        disabled={isLoading}
        className="text-[12px] font-mono py-2 px-3 flex items-center gap-2 transition-colors"
        style={{
          background: "transparent",
          border: `1px dashed ${
            status === "error" ? "#ef4444" : open ? "#4285f4" : "#222"
          }`,
          color:
            status === "error" ? "#ef4444" : open ? "#4285f4" : "#555",
          cursor: isLoading ? "default" : "pointer",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? (
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              border: "1px solid #444",
              borderTopColor: "#4285f4",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : (
          <span style={{ color: "#4285f4", opacity: 0.7 }}>☁</span>
        )}
        {label}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            zIndex: 50,
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {files.length === 0 ? (
            <div
              className="text-[11px] font-mono p-3"
              style={{ color: "#444" }}
            >
              Drive에 저장된 착수 요청이 없습니다
            </div>
          ) : (
            files.map((f) => (
              <button
                key={f.id}
                onClick={() => handleSelect(f)}
                className="w-full text-left px-3 py-2.5 transition-colors hover:bg-[#111]"
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #111",
                  cursor: "pointer",
                  display: "block",
                }}
              >
                <div
                  className="text-[11px] font-mono"
                  style={{ color: "#bbb", marginBottom: 2 }}
                >
                  {f.name}
                </div>
                <div
                  className="text-[10px] font-mono"
                  style={{ color: "#333" }}
                >
                  {new Date(f.modifiedTime).toLocaleDateString("ko-KR")}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
