"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import "@/app/banner.css";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  link_url: string | null;
  image_url: string | null;
};

const fallbackBanners: Banner[] = [
  {
    id: "fallback-home-care",
    title: "집에서도 안심할 수 있는 따뜻한 돌봄",
    subtitle: "어르신의 일상과 보호자의 마음을 헤아리는 재가·방문 간병을 연결합니다.",
    link_url: "/care-request",
    image_url: "/caretak-home-hero-v2.webp",
  },
  {
    id: "fallback-hospital-care",
    title: "병원에서도 이어지는 전문적인 간병",
    subtitle: "입원 생활에 필요한 돌봄을 세심하게 확인하고 믿을 수 있는 간병인을 연결합니다.",
    link_url: "/care-request",
    image_url: "/caretak-hospital-care-v2.webp",
  },
  {
    id: "fallback-family-connect",
    title: "보호자와 함께 확인하는 안심 간병",
    subtitle: "간병 진행과 필요한 소식을 보호자가 편리하게 확인할 수 있도록 돕습니다.",
    link_url: "/mypage",
    image_url: "/caretak-guardian-app-v2.webp",
  },
];

export default function HomeBanner() {
  const [cmsBanners, setCmsBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function loadBanners() {
      const { data } = await supabase
        .from("site_banners")
        .select("id,title,subtitle,link_url,image_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data?.length) setCmsBanners(data);
    }

    loadBanners();
  }, []);

  const banners = useMemo(
    () => (cmsBanners.length ? [...fallbackBanners, ...cmsBanners] : fallbackBanners),
    [cmsBanners],
  );

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (index >= banners.length) setIndex(0);
  }, [banners.length, index]);

  const banner = banners[index];

  return (
    <section
      className="homeBanner"
      aria-label="케어택 주요 안내"
      style={banner.image_url ? { backgroundImage: `linear-gradient(90deg,rgba(3,31,44,.93) 0%,rgba(5,57,63,.62) 40%,rgba(5,57,63,.08) 74%),url(${banner.image_url})` } : undefined}
    >
      <div className="homeBannerGlow" aria-hidden="true" />
      <div className="homeBannerContent">
        <span>CARETAK SERVICE</span>
        <h2>{banner.title}</h2>
        <p>{banner.subtitle}</p>
        <a href={banner.link_url || "/care-request"}>자세히 보기 <b>→</b></a>
      </div>

      <div className="homeBannerControls" aria-label="배너 이동">
        {banners.map((item, itemIndex) => (
          <button
            key={`${item.id}-${itemIndex}`}
            type="button"
            className={itemIndex === index ? "active" : ""}
            aria-label={`${itemIndex + 1}번째 배너 보기`}
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </section>
  );
}
