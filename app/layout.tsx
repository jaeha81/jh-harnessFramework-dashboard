import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JH 하네스 프레임워크 대시보드",
  description: "Claude Code 프레임워크 분석 및 착수 프롬프트 생성기",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen" style={{ background: "#080808" }}>
          <main className="max-w-xl mx-auto px-5 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
