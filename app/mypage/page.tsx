"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";

interface Profile {
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface CareRequest {
  id: string;
  patient_name: string | null;
  service_type: string | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  request_status: string | null;
  created_at: string;
}

interface SupportRequest {
  id: string;
  category: string | null;
  title: string | null;
  status: string | null;
  created_at: string;
}

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [support, setSupport] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const [profileResult, guardianResult, supportResult] = await Promise.all([
        supabase.from("profiles").select("name,email,phone,role").eq("id", user.id).maybeSingle(),
        supabase.from("guardians").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("customer_support").select("id,category,title,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileResult.data) setProfile(profileResult.data);
      if (supportResult.data) setSupport(supportResult.data);

      if (guardianResult.data?.id) {
        const requestResult = await supabase
          .from("care_requests")
          .select("id,patient_name,service_type,address,start_date,end_date,request_status,created_at")
          .eq("guardian_id", guardianResult.data.id)
          .order("created_at", { ascending: false });

        if (requestResult.data) setRequests(requestResult.data);
        if (requestResult.error) setMessage(requestResult.error.message);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return <main className="authPage"><p className="loadingText">회원 정보를 불러오는 중입니다...</p></main>;
  }

  return (
    <main className="dashboardPage">
      <header className="dashboardHeader">
        <a className="brand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
        <div className="headerActions">
          <a className="textButton" href="/care-request">간병 신청</a>
          <button className="smallPrimary dashboardButton" onClick={logout}>로그아웃</button>
        </div>
      </header>

      <section className="dashboardHero">
        <span className="eyebrow">MY CARETAK</span>
        <h1>{profile?.name || "회원"}님, 안녕하세요.</h1>
        <p>신청한 간병 서비스와 상담 진행 상태를 한곳에서 확인하세요.</p>
      </section>

      <section className="dashboardGrid">
        <article className="dashboardCard profileCard">
          <h2>회원 정보</h2>
          <dl>
            <div><dt>이름</dt><dd>{profile?.name || "-"}</dd></div>
            <div><dt>이메일</dt><dd>{profile?.email || "-"}</dd></div>
            <div><dt>전화번호</dt><dd>{profile?.phone || "-"}</dd></div>
            <div><dt>회원 유형</dt><dd>{profile?.role === "caregiver" ? "간병인" : "보호자"}</dd></div>
          </dl>
        </article>

        <article className="dashboardCard summaryCard">
          <h2>이용 현황</h2>
          <div className="summaryNumbers">
            <div><b>{requests.length}</b><span>간병 신청</span></div>
            <div><b>{support.length}</b><span>상담 접수</span></div>
            <div><b>{requests.filter((item) => item.request_status === "waiting").length}</b><span>대기 중</span></div>
          </div>
        </article>
      </section>

      <section className="dashboardSection">
        <div className="dashboardTitle"><h2>간병 신청 내역</h2><a href="/care-request">새 신청</a></div>
        {requests.length === 0 ? (
          <div className="emptyState">아직 등록된 간병 신청이 없습니다.</div>
        ) : (
          <div className="historyList">
            {requests.map((request) => (
              <article key={request.id} className="historyItem">
                <div>
                  <b>{request.patient_name || "환자"} · {request.service_type || "간병 서비스"}</b>
                  <p>{request.address || "지역 미입력"} · {request.start_date || "시작일 미정"}{request.end_date ? ` ~ ${request.end_date}` : ""}</p>
                </div>
                <span className="historyStatus">{request.request_status === "waiting" ? "접수 대기" : request.request_status || "확인 중"}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboardSection">
        <div className="dashboardTitle"><h2>상담 접수 내역</h2><a href="/vip">VIP 상담</a></div>
        {support.length === 0 ? (
          <div className="emptyState">접수된 상담이 없습니다.</div>
        ) : (
          <div className="historyList">
            {support.map((item) => (
              <article key={item.id} className="historyItem">
                <div><b>{item.title || "상담 요청"}</b><p>{new Date(item.created_at).toLocaleDateString("ko-KR")}</p></div>
                <span className="historyStatus">{item.status === "waiting" ? "답변 대기" : item.status || "확인 중"}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      {message && <p className="formMessage error dashboardMessage">{message}</p>}
    </main>
  );
}
