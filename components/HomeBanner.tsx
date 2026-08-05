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
    id: "fallback-care",
    title: "24시간 믿을 수 있는 간병 매칭",
    subtitle: "보호자 상황과 환자 상태를 확인해 적합한 간병인을 빠르게 연결합니다.",
    link_url: "/care-request",
    image_url: "/caretak-hero-men.webp",
  },
  {
    id: "fallback-vip",
    title: "VIP 전담간병 서비스",
    subtitle: "전담 코디네이터가 상담부터 배정과 일정 관리까지 세심하게 지원합니다.",
    link_url: "/vip",
    image_url: "/caretak-hero-women.webp",
  },
  {
    id: "fallback-safe",
    title: "신청부터 결제까지 한곳에서",
    subtitle: "간병 신청, 배정 현황, 결제와 알림을 케어택에서 편리하게 관리하세요.",
    link_url: "/login",
    image_url: null,
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
    () => (cmsBanners.length ? [...fallbackBanners.slice(0, 2), ...cmsBanners] : fallbackBanners),
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
      style={banner.image_url ? { backgroundImage: `linear-gradient(90deg,rgba(3,37,45,.9) 0%,rgba(4,66,62,.62) 38%,rgba(4,66,62,.14) 72%),url(${banner.image_url})` } : undefined}
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
