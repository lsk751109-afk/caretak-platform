import type { Metadata } from "next";
import "./globals.css";
import "./forms.css";
import "./brand.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://caretaek.co.kr"),
  title: "케어택 | 전문 간병 매칭 플랫폼",
  description: "보호자와 검증된 간병인을 빠르고 안전하게 연결하는 케어택",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/caretak-logo.svg",
    shortcut: "/caretak-logo.svg",
    apple: "/caretak-logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "케어택",
    title: "케어택 | 전문 간병 매칭 플랫폼",
    description: "보호자와 검증된 간병인을 빠르고 안전하게 연결하는 케어택",
    images: [{ url: "/caretak-home-hero-v2.webp", width: 1672, height: 941, alt: "케어택 재가·방문 전문 간병 서비스" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "케어택 | 전문 간병 매칭 플랫폼",
    description: "보호자와 검증된 간병인을 빠르고 안전하게 연결하는 케어택",
    images: ["/caretak-home-hero-v2.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
