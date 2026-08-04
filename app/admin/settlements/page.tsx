"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../../forms.css";
import "../../dashboard.css";

type PaymentRow = {
  id: string;
  request_id: string;
  amount: number | null;
  payment_status: string | null;
  settlement_status: string | null;
  settlement_amount: number | null;
  settled_at: string | null;
  created_at: string;
  care_requests: { patient_name: string | null; service_type: string | null } | null;
};

export default function SettlementPage() {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") { setMessage("관리자 권한이 필요합니다."); setLoading(false); return; }

    const { data, error } = await supabase
      .from("payments")
      .select("id,request_id,amount,payment_status,settlement_status,settlement_amount,settled_at,created_at,care_requests(patient_name,service_type)")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    const normalized = (data || []).map((row: any) => ({
      ...row,
      care_requests: Array.isArray(row.care_requests) ? row.care_requests[0] ?? null : row.care_requests ?? null,
    })) as PaymentRow[];
    setItems(normalized);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function complete(item: PaymentRow) {
    if (!confirm("이 결제를 정산 완료 처리하시겠습니까?")) return;
    setWorkingId(item.id);
    setMessage("");
    const { error } = await supabase.rpc("complete_settlement", { target_payment_id: item.id, note: "관리자 정산 완료" });
    if (error) setMessage(error.message);
    else {
      setItems((rows) => rows.map((row) => row.id === item.id ? {
        ...row,
        settlement_status: "completed",
        settlement_amount: row.settlement_amount ?? Math.floor((row.amount || 0) * 0.85),
        settled_at: new Date().toISOString(),
      } : row));
      setMessage("정산 완료 처리했습니다.");
    }
    setWorkingId(null);
  }

  const stats = useMemo(() => {
    const waiting = items.filter((item) => item.settlement_status !== "completed");
    const completed = items.filter((item) => item.settlement_status === "completed");
    return {
      waitingCount: waiting.length,
      waitingAmount: waiting.reduce((sum, item) => sum + (item.settlement_amount ?? Math.floor((item.amount || 0) * 0.85)), 0),
      completedCount: completed.length,
      completedAmount: completed.reduce((sum, item) => sum + (item.settlement_amount || 0), 0),
    };
  }, [items]);

  return <main className="dashboardPage adminPage">
    <header className="dashboardHeader">
      <a className="brand" href="/admin"><span className="brandMark">C</span><span>케어택 정산관리</span></a>
      <div className="headerActions"><a className="textButton" href="/admin">운영 대시보드</a><button className="smallPrimary dashboardButton" onClick={load}>새로고침</button></div>
    </header>

    <section className="dashboardHero">
      <span className="eyebrow">CARETAK SETTLEMENT</span>
      <h1>간병 서비스 정산</h1>
      <p>결제 완료 건의 간병인 정산 금액과 처리 상태를 관리합니다.</p>
    </section>

    <section className="adminStats">
      <div><b>{stats.waitingCount}</b><span>정산 대기</span></div>
      <div><b>{stats.waitingAmount.toLocaleString()}원</b><span>정산 예정액</span></div>
      <div><b>{stats.completedCount}</b><span>정산 완료</span></div>
      <div><b>{stats.completedAmount.toLocaleString()}원</b><span>정산 완료액</span></div>
    </section>

    <section className="dashboardSection">
      <div className="dashboardTitle"><h2>결제 완료 내역</h2><span>{items.length}건</span></div>
      {loading ? <div className="emptyState">정산 내역을 불러오는 중입니다...</div> : <div className="adminTableWrap"><table className="adminTable">
        <thead><tr><th>결제일</th><th>환자·서비스</th><th>결제금액</th><th>정산금액</th><th>상태</th><th>관리</th></tr></thead>
        <tbody>
          {items.map((item) => <tr key={item.id}>
            <td>{new Date(item.created_at).toLocaleString("ko-KR")}</td>
            <td><b>{item.care_requests?.patient_name || "환자"}</b><small>{item.care_requests?.service_type || "간병 서비스"}</small></td>
            <td>{(item.amount || 0).toLocaleString()}원</td>
            <td>{(item.settlement_amount ?? Math.floor((item.amount || 0) * 0.85)).toLocaleString()}원</td>
            <td><span className={`adminBadge ${item.settlement_status === "completed" ? "paid" : "ready"}`}>{item.settlement_status === "completed" ? "정산 완료" : "정산 대기"}</span></td>
            <td>{item.settlement_status === "completed" ? (item.settled_at ? new Date(item.settled_at).toLocaleString("ko-KR") : "완료") : <button className="smallPrimary" disabled={workingId === item.id} onClick={() => complete(item)}>{workingId === item.id ? "처리 중" : "정산 완료"}</button>}</td>
          </tr>)}
          {items.length === 0 && <tr><td colSpan={6}>결제 완료 내역이 없습니다.</td></tr>}
        </tbody>
      </table></div>}
    </section>

    {message && <p className={`formMessage dashboardMessage ${message.includes("필요") || message.includes("오류") ? "error" : ""}`}>{message}</p>}
  </main>;
}
