import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { PwaInstallButton } from "@/components/PwaInstallButton";

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
  maximumScale: 1,   // iOS: prevent zoom on input focus
  userScalable: false,
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
        {/* iOS PWA splash / status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JH Harness" />
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ServiceWorkerRegistrar />
        <div className="min-h-screen" style={{ background: "#080808" }}>
          <PwaInstallButton />
          <main className="max-w-xl mx-auto px-5 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
