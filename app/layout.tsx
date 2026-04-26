import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "JH 하네스 프레임워크 대시보드",
  description: "Claude Code 프레임워크 분석 및 착수 프롬프트 생성기",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JH Harness",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <ServiceWorkerRegistrar />
        <div className="min-h-screen" style={{ background: "#080808" }}>
          <main className="max-w-xl mx-auto px-5 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
