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
    images: [{ url: "/caretak-hero-women.webp", width: 1920, height: 1080, alt: "케어택 전문 간병 서비스" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "케어택 | 전문 간병 매칭 플랫폼",
    description: "보호자와 검증된 간병인을 빠르고 안전하게 연결하는 케어택",
    images: ["/caretak-hero-women.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
