"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface CareRequestSummary {
  patient_name: string | null;
  service_type: string | null;
  address: string | null;
}

interface Payment {
  id: string;
  request_id: string;
  amount: number | null;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  care_requests: CareRequestSummary[] | null;
}

const statusLabel: Record<string, string> = {
  ready: "결제 준비",
  paid: "결제 완료",
  failed: "결제 실패",
  refunded: "환불 완료",
  cancelled: "결제 취소",
};

const methodLabel: Record<string, string> = {
  card: "카드",
  bank: "계좌이체",
  virtual_account: "가상계좌",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
      window.location.href = "/";
      return;
    }

    const { data, error } = await supabase
      .from("payments")
      .select("id,request_id,amount,payment_method,payment_status,created_at,care_requests(patient_name,service_type,address)")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setPayments([]);
    } else {
      setPayments((data || []) as Payment[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(
    () => filter === "all" ? payments : payments.filter((item) => item.payment_status === filter),
    [payments, filter]
  );

  const summary = useMemo(() => ({
    total: payments.reduce((sum, item) => sum + (item.payment_status === "paid" ? Number(item.amount || 0) : 0), 0),
    paid: payments.filter((item) => item.payment_status === "paid").length,
    ready: payments.filter((item) => item.payment_status === "ready").length,
    refunded: payments.filter((item) => item.payment_status === "refunded").length,
  }), [payments]);

  if (loading) return <main className="authPage"><p className="loadingText">결제 내역을 불러오는 중입니다...</p></main>;

  return (
    <main className="dashboardPage adminPage">
      <header className="dashboardHeader">
        <a className="brand" href="/admin"><span className="brandMark">C</span><span>케어택 관리자</span></a>
        <div className="headerActions"><a className="textButton" href="/admin">대시보드</a><button className="smallPrimary dashboardButton" onClick={load}>새로고침</button></div>
      </header>

      <section className="dashboardHero">
        <span className="eyebrow">PAYMENT MANAGEMENT</span>
        <h1>결제 관리</h1>
        <p>결제 준비, 완료, 실패, 환불 상태를 확인합니다.</p>
      </section>

      <section className="adminStats">
        <div><b>{summary.total.toLocaleString()}원</b><span>누적 결제 완료액</span></div>
        <div><b>{summary.paid}</b><span>결제 완료</span></div>
        <div><b>{summary.ready}</b><span>결제 준비</span></div>
        <div><b>{summary.refunded}</b><span>환불 완료</span></div>
      </section>

      <section className="dashboardSection">
        <div className="dashboardTitle">
          <h2>결제 내역</h2>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">전체 상태</option><option value="ready">결제 준비</option><option value="paid">결제 완료</option><option value="failed">결제 실패</option><option value="refunded">환불 완료</option>
          </select>
        </div>
        <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>환자·서비스</th><th>결제수단</th><th>금액</th><th>상태</th><th>등록일</th></tr></thead><tbody>
          {visible.map((item) => {
            const careRequest = item.care_requests?.[0];
            return <tr key={item.id}>
              <td><b>{careRequest?.patient_name || "환자"}</b><small>{careRequest?.service_type || "간병 서비스"} · {careRequest?.address || "지역 미입력"}</small></td>
              <td>{methodLabel[item.payment_method || ""] || item.payment_method || "-"}</td>
              <td><b>{Number(item.amount || 0).toLocaleString()}원</b></td>
              <td><span className={`adminBadge ${item.payment_status || "ready"}`}>{statusLabel[item.payment_status || "ready"] || item.payment_status}</span></td>
              <td>{new Date(item.created_at).toLocaleDateString("ko-KR")}</td>
            </tr>;
          })}
          {visible.length === 0 && <tr><td colSpan={5}>표시할 결제 내역이 없습니다.</td></tr>}
        </tbody></table></div>
      </section>

      {message && <p className="formMessage error dashboardMessage">{message}</p>}
    </main>
  );
}
