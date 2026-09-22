import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { DevTools } from "@/client/dev-tools";

export const metadata: Metadata = {
  title: "GS Safety Operations | 안전 시뮬레이션",
  description: "작업자별 위험 회피 안내와 대응을 연결하는 건설 현장 안전 시뮬레이션 관제.",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">
          본문으로 이동
        </a>
        {children}
        <DevTools />
      </body>
    </html>
  );
}
