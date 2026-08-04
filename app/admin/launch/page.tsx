"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../../forms.css";

type RequestRow = { id: string; patient_name: string | null; request_status: string | null; service_type: string | null; is_vip?: boolean | null; estimated_amount?: number | null; created_at: string };
type CaregiverRow = { id: string; name: string; status: string | null; available?: boolean | null; is_vip?: boolean | null; rating?: number | null };
type PaymentRow = { id: string; amount: number | null; payment_status: string | null; created_at: string };
type OutboxRow = { id: string; channel: string; title: string; status: string; attempts: number; created_at: string };

const label: Record<string, string> = {
  waiting: "접수 대기", reviewing: "검토 중", matching: "매칭 중", matched: "배정 완료", active: "서비스 진행", completed: "서비스 완료", cancelled: "취소",
  ready: "결제 대기", pending: "결제 중", paid: "결제 완료", failed: "결제 실패", refunded: "환불 완료",
};

export default function LaunchControlPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [caregivers, setCaregivers] = useState<CaregiverRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/login"; return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    if (profile?.role !== "admin") { setMessage("관리자 권한이 필요합니다."); setLoading(false); return; }

    const [requestResult, caregiverResult, paymentResult, outboxResult] = await Promise.all([
      supabase.from("care_requests").select("id,patient_name,request_status,service_type,is_vip,estimated_amount,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("caregivers").select("id,name,status,available,is_vip,rating").order("created_at", { ascending: false }).limit(100),
      supabase.from("payments").select("id,amount,payment_status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("notification_outbox").select("id,channel,title,status,attempts,created_at").order("created_at", { ascending: false }).limit(30),
    ]);

    if (requestResult.error) setMessage(requestResult.error.message);
    else setRequests(requestResult.data || []);
    if (!caregiverResult.error) setCaregivers(caregiverResult.data || []);
    if (!paymentResult.error) setPayments(paymentResult.data || []);
    if (!outboxResult.error) setOutbox(outboxResult.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const paid = payments.filter((row) => row.payment_status === "paid");
    const totalRevenue = paid.reduce((sum, row) => sum + (row.amount || 0), 0);
    return {
      requests: requests.length,
      pending: requests.filter((row) => ["waiting", "reviewing", "matching"].includes(row.request_status || "waiting")).length,
      vip: requests.filter((row) => row.is_vip || row.service_type?.toLowerCase().includes("vip")).length,
      active: requests.filter((row) => row.request_status === "active").length,
      approvedCaregivers: caregivers.filter((row) => row.status === "approved").length,
      availableCaregivers: caregivers.filter((row) => row.status === "approved" && row.available !== false).length,
      paid: paid.length,
      revenue: totalRevenue,
      notificationPending: outbox.filter((row) => row.status === "pending").length,
      notificationFailed: outbox.filter((row) => row.status === "failed").length,
    };
  }, [requests, caregivers, payments, outbox]);

  if (loading) return <main className="authPage"><p className="loadingText">오픈 현황을 불러오는 중입니다...</p></main>;

  return (
    <main className="dashboardPage adminPage">
      <header className="dashboardHeader">
        <a className="brand" href="/admin"><span className="brandMark">C</span><span>케어택 오픈센터</span></a>
        <div className="headerActions"><a className="textButton" href="/admin">운영 대시보드</a><a className="textButton" href="/admin/content">CMS</a><button className="smallPrimary dashboardButton" onClick={load}>새로고침</button></div>
      </header>
      <section className="dashboardHero"><span className="eyebrow">CARETAK LAUNCH V1</span><h1>1순위부터 7순위까지 통합 운영 현황</h1><p>신청, VIP, 간병인, 매칭, 결제, 알림, 통계를 한 화면에서 점검합니다.</p></section>
      {message && <p className="formMessage error dashboardMessage">{message}</p>}

      <section className="adminStats">
        <div><b>{stats.requests}</b><span>전체 신청</span></div><div><b>{stats.pending}</b><span>검토·매칭 대기</span></div><div><b>{stats.vip}</b><span>VIP 신청</span></div><div><b>{stats.active}</b><span>서비스 진행</span></div>
        <div><b>{stats.approvedCaregivers}</b><span>승인 간병인</span></div><div><b>{stats.availableCaregivers}</b><span>배정 가능</span></div><div><b>{stats.paid}</b><span>결제 완료</span></div><div><b>{stats.revenue.toLocaleString()}원</b><span>누적 결제액</span></div>
      </section>

      <section className="dashboardGrid">
        <article className="dashboardCard"><h2>1. 간병 신청·관리자 배정</h2><p>신청 데이터 저장, 상태 관리, 승인 간병인 배정 흐름을 운영합니다.</p><a className="primaryButton" href="/admin">신청·매칭 관리</a></article>
        <article className="dashboardCard"><h2>2. VIP 전담간병</h2><p>VIP 신청을 분리 집계하고 VIP 간병인을 우선 배정합니다.</p><a className="primaryButton" href="/vip">VIP 신청 화면</a></article>
        <article className="dashboardCard"><h2>3. 간병인 등록·프로필</h2><p>승인, 활동 가능 여부, VIP 여부, 평점과 자격 정보를 관리합니다.</p><a className="primaryButton" href="/caregivers">간병인 목록</a></article>
        <article className="dashboardCard"><h2>4. 실시간 매칭</h2><p>승인된 간병인을 신청에 배정하고 진행 상태를 기록합니다.</p><a className="primaryButton" href="/admin">매칭 실행</a></article>
        <article className="dashboardCard"><h2>5. 결제·영수증</h2><p>PortOne/KCP 결제, 서버 검증, 결제 상태와 환불 정보를 관리합니다.</p><a className="primaryButton" href="/payment">결제 화면</a></article>
        <article className="dashboardCard"><h2>6. SMS·카카오·이메일</h2><p>알림 아웃박스에서 발송 대기 {stats.notificationPending}건, 실패 {stats.notificationFailed}건을 관리합니다.</p><a className="primaryButton" href="#notifications">알림 현황</a></article>
        <article className="dashboardCard"><h2>7. 관리자 통계</h2><p>신청, VIP, 배정 가능 간병인, 결제 완료와 매출을 실시간 집계합니다.</p><a className="primaryButton" href="/admin">상세 통계</a></article>
      </section>

      <section className="dashboardSection"><div className="dashboardTitle"><h2>최근 신청</h2><span>{requests.length}건</span></div><div className="adminTableWrap"><table className="adminTable"><thead><tr><th>접수일</th><th>환자</th><th>서비스</th><th>예상금액</th><th>상태</th></tr></thead><tbody>
        {requests.slice(0, 15).map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("ko-KR")}</td><td>{row.patient_name || "-"}</td><td>{row.is_vip ? "VIP · " : ""}{row.service_type || "간병"}</td><td>{(row.estimated_amount || 0).toLocaleString()}원</td><td><span className={`adminBadge ${row.request_status || "waiting"}`}>{label[row.request_status || "waiting"] || row.request_status}</span></td></tr>)}
      </tbody></table></div></section>

      <section className="dashboardSection" id="notifications"><div className="dashboardTitle"><h2>알림 아웃박스</h2><span>{outbox.length}건</span></div><div className="adminTableWrap"><table className="adminTable"><thead><tr><th>생성일</th><th>채널</th><th>제목</th><th>시도</th><th>상태</th></tr></thead><tbody>
        {outbox.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("ko-KR")}</td><td>{row.channel}</td><td>{row.title}</td><td>{row.attempts}</td><td><span className={`adminBadge ${row.status}`}>{row.status}</span></td></tr>)}
        {outbox.length === 0 && <tr><td colSpan={5}>아직 생성된 알림이 없습니다.</td></tr>}
      </tbody></table></div></section>
    </main>
  );
}
