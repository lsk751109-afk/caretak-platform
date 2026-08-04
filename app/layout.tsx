import type { Metadata } from "next";
import "./globals.css";
import "./forms.css";

export const metadata: Metadata = {
  title: "케어택 | 전문 간병 매칭 플랫폼",
  description: "보호자와 검증된 간병인을 빠르고 안전하게 연결하는 케어택",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
