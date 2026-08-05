import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/mypage/", "/caregiver-dashboard/"],
    },
    sitemap: "https://caretaek.co.kr/sitemap.xml",
    host: "https://caretaek.co.kr",
  };
}
