"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";
import "../dashboard.css";

interface Profile { name: string | null; email: string | null; phone: string | null; role: string | null; }
interface CareRequest { id: string; patient_name: string | null; service_type: string | null; address: string | null; start_date: string | null; end_date: string | null; request_status: string | null; created_at: string; }
interface SupportRequest { id: string; category: string | null; title: string | null; status: string | null; created_at: string; }
interface MatchRow {
  id: string; status: string | null; matched_at: string | null;
  care_requests: { id: string; patient_name: string | null; service_type: string | null; address: string | null; start_date: string | null; end_date: string | null; } | null;
  caregivers: { name: string | null; phone: string | null; address: string | null; career_years: number | null; certificate: string | null; hourly_rate: number | null; } | null;
}
interface NotificationRow { id: string; title: string | null; message: string | null; is_read: boolean | null; created_at: string; }
interface PaymentRow { id: string; request_id: string; amount: number | null; payment_method: string | null; payment_status: string | null; created_at: string; }

const paymentStatusLabel: Record<string, string> = { ready: "결제 준비", paid: "결제 완료", failed: "결제 실패", refunded: "환불 완료", cancelled: "결제 취소" };
function requestStatusLabel(status: string | null) { const labels: Record<string, string> = { waiting: "접수 대기", reviewing: "검토 중", matching: "매칭 진행", matched: "간병인 배정", active: "서비스 진행", completed: "서비스 완료", cancelled: "취소" }; return labels[status || ""] || status || "확인 중"; }
function matchingStatusLabel(status: string | null) { const labels: Record<string, string> = { assigned: "간병인 응답 대기", accepted: "배정 확정", rejected: "재매칭 진행", active: "서비스 진행", completed: "서비스 완료" }; return labels[status || ""] || status || "확인 중"; }

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [support, setSupport] = useState<SupportRequest[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { window.location.href = "/login"; return; }

    const [profileResult, guardianResult, supportResult, notificationResult] = await Promise.all([
      supabase.from("profiles").select("name,email,phone,role").eq("id", user.id).maybeSingle(),
      supabase.from("guardians").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("customer_support").select("id,category,title,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("id,title,message,is_read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (profileResult.data) setProfile(profileResult.data);
    if (supportResult.data) setSupport(supportResult.data);
    if (notificationResult.data) setNotifications(notificationResult.data);

    if (guardianResult.data?.id) {
      const [requestResult, matchingResult, paymentResult] = await Promise.all([
        supabase.from("care_requests").select("id,patient_name,service_type,address,start_date,end_date,request_status,created_at").eq("guardian_id", guardianResult.data.id).order("created_at", { ascending: false }),
        supabase.from("matching").select("id,status,matched_at,care_requests(id,patient_name,service_type,address,start_date,end_date),caregivers(name,phone,address,career_years,certificate,hourly_rate)").order("matched_at", { ascending: false }),
        supabase.from("payments").select("id,request_id,amount,payment_method,payment_status,created_at").order("created_at", { ascending: false }),
      ]);
      if (requestResult.data) setRequests(requestResult.data);
      if (matchingResult.data) setMatches(matchingResult.data as MatchRow[]);
      if (paymentResult.data) setPayments(paymentResult.data);
      const error = requestResult.error || matchingResult.error || paymentResult.error;
      if (error) setMessage(error.message);
    }
    const error = profileResult.error || supportResult.error || notificationResult.error;
    if (error) setMessage(error.message);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  async function markNotificationRead(id: string) { const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id); if (error) return setMessage(error.message); setNotifications((c) => c.map((i) => i.id === id ? { ...i, is_read: true } : i)); }
  async function markAllRead() { const ids = notifications.filter((i) => !i.is_read).map((i) => i.id); if (!ids.length) return; const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids); if (error) return setMessage(error.message); setNotifications((c) => c.map((i) => ({ ...i, is_read: true }))); }
  async function logout() { await supabase.auth.signOut(); window.location.href = "/"; }
  if (loading) return <main className="authPage"><p className="loadingText">회원 정보를 불러오는 중입니다...</p></main>;

  const unreadCount = notifications.filter((i) => !i.is_read).length;
  const acceptedMatches = matches.filter((i) => i.status === "accepted" || i.status === "active");
  const paidCount = payments.filter((i) => i.payment_status === "paid").length;

  return <main className="dashboardPage">
    <header className="dashboardHeader"><a className="brand" href="/"><span className="brandMark">C</span><span>케어택</span></a><div className="headerActions"><a className="textButton" href="/mypage/payments">결제 내역</a><a className="textButton" href="/care-request">간병 신청</a><button className="smallPrimary dashboardButton" onClick={logout}>로그아웃</button></div></header>
    <section className="dashboardHero"><span className="eyebrow">MY CARETAK</span><h1>{profile?.name || "회원"}님, 안녕하세요.</h1><p>신청, 간병인 배정, 결제와 알림을 한곳에서 확인하세요.</p></section>
    <section className="dashboardGrid">
      <article className="dashboardCard profileCard"><h2>회원 정보</h2><dl><div><dt>이름</dt><dd>{profile?.name || "-"}</dd></div><div><dt>이메일</dt><dd>{profile?.email || "-"}</dd></div><div><dt>전화번호</dt><dd>{profile?.phone || "-"}</dd></div><div><dt>회원 유형</dt><dd>{profile?.role === "caregiver" ? "간병인" : "보호자"}</dd></div></dl></article>
      <article className="dashboardCard summaryCard"><h2>이용 현황</h2><div className="summaryNumbers"><div><b>{requests.length}</b><span>간병 신청</span></div><div><b>{acceptedMatches.length}</b><span>배정 확정</span></div><div><b>{paidCount}</b><span>결제 완료</span></div></div></article>
    </section>

    <section className="dashboardSection"><div className="dashboardTitle"><h2>배정된 간병인</h2><a href="/care-request">새 신청</a></div>{matches.length === 0 ? <div className="emptyState">아직 배정된 간병인이 없습니다.</div> : <div className="assignmentGrid">{matches.map((match) => {
      const payment = match.care_requests?.id ? payments.find((p) => p.request_id === match.care_requests?.id) : undefined;
      const canPay = match.status === "accepted" || match.status === "active";
      return <article className="assignedCaregiverCard" key={match.id}><div className="assignedCardTop"><div className="caregiverAvatar">{match.caregivers?.name?.slice(0, 1) || "간"}</div><div><h3>{match.caregivers?.name || "간병인 확인 중"}</h3><p>{match.care_requests?.patient_name || "환자"} · {match.care_requests?.service_type || "간병 서비스"}</p></div><span className={`historyStatus match-${match.status || "unknown"}`}>{matchingStatusLabel(match.status)}</span></div>
      <dl className="assignmentDetails"><div><dt>근무 지역</dt><dd>{match.care_requests?.address || "-"}</dd></div><div><dt>근무 기간</dt><dd>{match.care_requests?.start_date || "미정"}{match.care_requests?.end_date ? ` ~ ${match.care_requests.end_date}` : ""}</dd></div><div><dt>경력</dt><dd>{match.caregivers?.career_years || 0}년</dd></div><div><dt>자격증</dt><dd>{match.caregivers?.certificate || "등록 정보 없음"}</dd></div><div><dt>희망 시급</dt><dd>{match.caregivers?.hourly_rate ? `${match.caregivers.hourly_rate.toLocaleString()}원` : "협의"}</dd></div><div><dt>연락처</dt><dd>{canPay ? match.caregivers?.phone || "확인 중" : "수락 후 공개"}</dd></div></dl>
      <div className="paymentActionRow"><span className={`paymentStatusTag payment-${payment?.payment_status || "none"}`}>{payment ? paymentStatusLabel[payment.payment_status || "ready"] || payment.payment_status : "미결제"}</span>{match.care_requests?.id && canPay && payment?.payment_status !== "paid" && <a className="smallPrimary" href={`/payment/${match.care_requests.id}`}>{payment?.payment_status === "ready" ? "결제 계속하기" : "결제하기"}</a>}{payment?.payment_status === "paid" && <a className="secondaryButton compactButton" href="/mypage/payments">결제 내역</a>}</div>
      </article>;
    })}</div>}</section>

    <section className="dashboardSection"><div className="dashboardTitle"><h2>알림</h2>{unreadCount > 0 && <button className="textAction" onClick={markAllRead}>모두 읽음</button>}</div>{notifications.length === 0 ? <div className="emptyState">새로운 알림이 없습니다.</div> : <div className="notificationList">{notifications.map((item) => <button className={`notificationItem ${item.is_read ? "read" : "unread"}`} key={item.id} onClick={() => !item.is_read && markNotificationRead(item.id)}><span className="notificationDot"/><span className="notificationCopy"><b>{item.title || "케어택 알림"}</b><span>{item.message || "새로운 안내가 있습니다."}</span><small>{new Date(item.created_at).toLocaleString("ko-KR")}</small></span></button>)}</div>}</section>

    <section className="dashboardSection"><div className="dashboardTitle"><h2>간병 신청 내역</h2><a href="/care-request">새 신청</a></div>{requests.length === 0 ? <div className="emptyState">아직 등록된 간병 신청이 없습니다.</div> : <div className="historyList">{requests.map((request) => { const payment = payments.find((p) => p.request_id === request.id); return <article key={request.id} className="historyItem"><div><b>{request.patient_name || "환자"} · {request.service_type || "간병 서비스"}</b><p>{request.address || "지역 미입력"} · {request.start_date || "시작일 미정"}{request.end_date ? ` ~ ${request.end_date}` : ""}</p></div><div className="historyActions"><span className="historyStatus">{requestStatusLabel(request.request_status)}</span>{payment && <span className={`paymentStatusTag payment-${payment.payment_status || "ready"}`}>{paymentStatusLabel[payment.payment_status || "ready"] || payment.payment_status}</span>}</div></article>; })}</div>}</section>

    <section className="dashboardSection"><div className="dashboardTitle"><h2>상담 접수 내역</h2><a href="/vip">VIP 상담</a></div>{support.length === 0 ? <div className="emptyState">접수된 상담이 없습니다.</div> : <div className="historyList">{support.map((item) => <article key={item.id} className="historyItem"><div><b>{item.title || "상담 요청"}</b><p>{new Date(item.created_at).toLocaleDateString("ko-KR")}</p></div><span className="historyStatus">{item.status === "waiting" ? "답변 대기" : item.status || "확인 중"}</span></article>)}</div>}</section>
    {message && <p className="formMessage error dashboardMessage">{message}</p>}
  </main>;
}
