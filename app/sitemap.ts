import type { MetadataRoute } from "next";

const routes = ["", "/care-request", "/caregivers", "/caregiver-register", "/vip", "/login", "/signup"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `https://caretaek.co.kr${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/care-request" ? 0.9 : 0.7,
  }));
}
