"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";

type Caregiver = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  career_years: number | null;
  status: string | null;
  created_at: string;
};

type CareRequest = {
  id: string;
  patient_name: string | null;
  service_type: string | null;
  address: string | null;
  start_date: string | null;
  request_status: string | null;
  created_at: string;
};

type SupportRequest = {
  id: string;
  category: string | null;
  title: string | null;
  status: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [support, setSupport] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authorized, setAuthorized] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      setMessage("관리자 권한이 없습니다.");
      setLoading(false);
      return;
    }

    setAuthorized(true);

    const [caregiverResult, requestResult, supportResult] = await Promise.all([
      supabase.from("caregivers").select("id,name,phone,address,career_years,status,created_at").order("created_at", { ascending: false }),
      supabase.from("care_requests").select("id,patient_name,service_type,address,start_date,request_status,created_at").order("created_at", { ascending: false }),
      supabase.from("customer_support").select("id,category,title,status,created_at").order("created_at", { ascending: false }),
    ]);

    if (caregiverResult.data) setCaregivers(caregiverResult.data);
    if (requestResult.data) setRequests(requestResult.data);
    if (supportResult.data) setSupport(supportResult.data);

    const firstError = caregiverResult.error || requestResult.error || supportResult.error;
    if (firstError) setMessage(firstError.message);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function updateCaregiverStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("caregivers").update({ status }).eq("id", id);
    if (error) return setMessage(error.message);
    setCaregivers((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function updateRequestStatus(id: string, request_status: string) {
    const { error } = await supabase.from("care_requests").update({ request_status }).eq("id", id);
    if (error) return setMessage(error.message);
    setRequests((items) => items.map((item) => (item.id === id ? { ...item, request_status } : item)));
  }

  async function updateSupportStatus(id: string, status: string) {
    const { error } = await supabase.from("customer_support").update({ status }).eq("id", id);
    if (error) return setMessage(error.message);
    setSupport((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  const stats = useMemo(() => ({
    pendingCaregivers: caregivers.filter((item) => item.status === "waiting").length,
    pendingRequests: requests.filter((item) => item.request_status === "waiting").length,
    activeRequests: requests.filter((item) => item.request_status === "matching" || item.request_status === "matched").length,
    pendingSupport: support.filter((item) => item.status === "waiting").length,
  }), [caregivers, requests, support]);

  if (loading) return <main className="authPage"><p className="loadingText">관리자 정보를 불러오는 중입니다...</p></main>;

  if (!authorized) {
    return (
      <main className="authPage">
        <section className="authCard compact">
          <h1>접근 제한</h1>
          <p className="formMessage error">{message || "관리자 권한이 필요합니다."}</p>
          <p className="authFoot"><a href="/">메인으로 돌아가기</a></p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboardPage adminPage">
      <header className="dashboardHeader">
        <a className="brand" href="/"><span className="brandMark">C</span><span>케어택 관리자</span></a>
        <div className="headerActions"><a className="textButton" href="/">사이트 보기</a><button className="smallPrimary dashboardButton" onClick={loadDashboard}>새로고침</button></div>
      </header>

      <section className="dashboardHero">
        <span className="eyebrow">CARETAK ADMIN</span>
        <h1>운영 대시보드</h1>
        <p>간병인 승인, 간병 신청, VIP 상담 상태를 관리합니다.</p>
      </section>

      <section className="adminStats">
        <div><b>{stats.pendingCaregivers}</b><span>간병인 승인 대기</span></div>
        <div><b>{stats.pendingRequests}</b><span>신규 간병 신청</span></div>
        <div><b>{stats.activeRequests}</b><span>매칭 진행</span></div>
        <div><b>{stats.pendingSupport}</b><span>상담 답변 대기</span></div>
      </section>

      <section className="dashboardSection">
        <div className="dashboardTitle"><h2>간병인 승인 관리</h2><span>{caregivers.length}명</span></div>
        <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>이름</th><th>지역</th><th>경력</th><th>상태</th><th>관리</th></tr></thead><tbody>
          {caregivers.map((item) => <tr key={item.id}><td><b>{item.name}</b><small>{item.phone || "연락처 없음"}</small></td><td>{item.address || "-"}</td><td>{item.career_years || 0}년</td><td><span className={`adminBadge ${item.status || "waiting"}`}>{item.status === "approved" ? "승인" : item.status === "rejected" ? "반려" : "대기"}</span></td><td><div className="adminActions"><button onClick={() => updateCaregiverStatus(item.id, "approved")}>승인</button><button className="danger" onClick={() => updateCaregiverStatus(item.id, "rejected")}>반려</button></div></td></tr>)}
        </tbody></table></div>
      </section>

      <section className="dashboardSection">
        <div className="dashboardTitle"><h2>간병 신청 관리</h2><span>{requests.length}건</span></div>
        <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>환자·서비스</th><th>지역</th><th>시작일</th><th>상태</th><th>변경</th></tr></thead><tbody>
          {requests.map((item) => <tr key={item.id}><td><b>{item.patient_name || "환자"}</b><small>{item.service_type || "간병"}</small></td><td>{item.address || "-"}</td><td>{item.start_date || "미정"}</td><td><span className={`adminBadge ${item.request_status || "waiting"}`}>{item.request_status || "waiting"}</span></td><td><select value={item.request_status || "waiting"} onChange={(event) => updateRequestStatus(item.id, event.target.value)}><option value="waiting">접수 대기</option><option value="reviewing">검토 중</option><option value="matching">매칭 중</option><option value="matched">매칭 완료</option><option value="completed">서비스 완료</option><option value="cancelled">취소</option></select></td></tr>)}
        </tbody></table></div>
      </section>

      <section className="dashboardSection">
        <div className="dashboardTitle"><h2>VIP·고객 상담 관리</h2><span>{support.length}건</span></div>
        <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>상담 제목</th><th>분류</th><th>접수일</th><th>상태</th><th>변경</th></tr></thead><tbody>
          {support.map((item) => <tr key={item.id}><td><b>{item.title || "상담 요청"}</b></td><td>{item.category === "vip_care" ? "VIP 간병" : item.category || "일반"}</td><td>{new Date(item.created_at).toLocaleDateString("ko-KR")}</td><td><span className={`adminBadge ${item.status || "waiting"}`}>{item.status || "waiting"}</span></td><td><select value={item.status || "waiting"} onChange={(event) => updateSupportStatus(item.id, event.target.value)}><option value="waiting">답변 대기</option><option value="contacted">연락 완료</option><option value="processing">처리 중</option><option value="completed">완료</option></select></td></tr>)}
        </tbody></table></div>
      </section>

      {message && <p className="formMessage error dashboardMessage">{message}</p>}
    </main>
  );
}
