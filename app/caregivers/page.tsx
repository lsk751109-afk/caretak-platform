"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";

type Caregiver = {
  id: string;
  name: string;
  gender: string | null;
  address: string | null;
  career_years: number | null;
  certificate: string | null;
  introduction: string | null;
  hourly_rate: number | null;
  status: string | null;
};

export default function CaregiversPage() {
  const [items, setItems] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    supabase
      .from("caregivers")
      .select("id,name,gender,address,career_years,certificate,introduction,hourly_rate,status")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as Caregiver[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((item) => {
    const text = `${item.name} ${item.address ?? ""} ${item.certificate ?? ""}`.toLowerCase();
    return text.includes(keyword.toLowerCase());
  });

  return (
    <main className="directoryPage">
      <header className="simpleHeader">
        <a className="brand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
        <div className="headerActions"><a className="secondaryButton" href="/caregiver-register">간병인 등록</a><a className="smallPrimary" href="/care-request">간병 신청</a></div>
      </header>

      <section className="directoryHero">
        <span className="eyebrow">CAREGIVER DIRECTORY</span>
        <h1>내 상황에 맞는 간병인을 찾아보세요.</h1>
        <p>지역, 경력, 자격 정보를 확인하고 상담을 신청할 수 있습니다.</p>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="이름, 지역 또는 자격 검색" aria-label="간병인 검색" />
      </section>

      <section className="directoryGrid">
        {loading && <p>간병인 정보를 불러오는 중입니다.</p>}
        {!loading && filtered.length === 0 && <div className="emptyCard"><b>등록된 간병인이 없습니다.</b><p>간병인 등록 후 승인되면 이곳에 표시됩니다.</p></div>}
        {filtered.map((item) => (
          <article className="caregiverCard" key={item.id}>
            <div className="caregiverTop"><div className="caregiverAvatar">{item.name.slice(0, 1)}</div><div><h2>{item.name}</h2><p>{item.gender ?? "성별 미입력"} · {item.address ?? "지역 미입력"}</p></div></div>
            <div className="tagRow"><span>경력 {item.career_years ?? 0}년</span>{item.certificate && <span>{item.certificate}</span>}<span className="approvalTag">{item.status === "approved" ? "승인" : "검토중"}</span></div>
            <p className="caregiverIntro">{item.introduction || "소개 내용이 아직 등록되지 않았습니다."}</p>
            <div className="caregiverBottom"><b>{item.hourly_rate ? `${item.hourly_rate.toLocaleString()}원/시간` : "상담 후 결정"}</b><a href="/care-request">매칭 상담</a></div>
          </article>
        ))}
      </section>
    </main>
  );
}
