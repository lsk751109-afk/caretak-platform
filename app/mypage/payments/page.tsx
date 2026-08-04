"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../../forms.css";
import "../../dashboard.css";

interface Payment {
  id: string;
  request_id: string;
  amount: number | null;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  care_requests: {
    patient_name: string | null;
    service_type: string | null;
    address: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
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

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("payments")
      .select("id,request_id,amount,payment_method,payment_status,created_at,care_requests(patient_name,service_type,address,start_date,end_date)")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);

    const normalizedPayments: Payment[] = (data ?? []).map((item) => ({
      ...item,
      care_requests: Array.isArray(item.care_requests)
        ? item.care_requests[0] ?? null
        : item.care_requests ?? null,
    })) as Payment[];

    setPayments(normalizedPayments);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const totalPaid = useMemo(
    () => payments
      .filter((payment) => payment.payment_status === "paid")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  if (loading) {
    return (
      <main className="authPage">
        <p className="loadingText">결제 내역을 불러오는 중입니다...</p>
      </main>
    );
  }

  return (
    <main className="dashboardPage">
      <header className="dashboardHeader">
        <a className="brand" href="/mypage">
          <span className="brandMark">C</span>
          <span>케어택</span>
        </a>
        <div className="headerActions">
          <a className="textButton" href="/mypage">마이페이지</a>
          <a className="smallPrimary" href="/">메인으로</a>
        </div>
      </header>

      <section className="dashboardHero">
        <span className="eyebrow">MY PAYMENTS</span>
        <h1>결제 내역</h1>
        <p>간병 서비스 결제 상태와 금액을 확인합니다.</p>
      </section>

      <section className="dashboardGrid paymentOverviewGrid">
        <article className="dashboardCard summaryCard">
          <h2>결제 요약</h2>
          <div className="summaryNumbers">
            <div><b>{payments.length}</b><span>전체 결제</span></div>
            <div><b>{payments.filter((payment) => payment.payment_status === "paid").length}</b><span>결제 완료</span></div>
            <div><b>{totalPaid.toLocaleString()}</b><span>결제 완료액(원)</span></div>
          </div>
        </article>
      </section>

      <section className="dashboardSection">
        <div className="dashboardTitle">
          <h2>상세 내역</h2>
          <button className="textAction" onClick={load}>새로고침</button>
        </div>

        {payments.length === 0 ? (
          <div className="emptyState">아직 결제 내역이 없습니다.</div>
        ) : (
          <div className="paymentHistoryList">
            {payments.map((item) => (
              <article className="paymentHistoryCard" key={item.id}>
                <div>
                  <b>{item.care_requests?.patient_name || "환자"} · {item.care_requests?.service_type || "간병 서비스"}</b>
                  <p>
                    {item.care_requests?.address || "지역 미입력"} · {item.care_requests?.start_date || "시작일 미정"}
                    {item.care_requests?.end_date ? ` ~ ${item.care_requests.end_date}` : ""}
                  </p>
                  <small>{new Date(item.created_at).toLocaleString("ko-KR")}</small>
                </div>
                <div className="paymentHistoryMeta">
                  <strong>{Number(item.amount || 0).toLocaleString()}원</strong>
                  <span>{methodLabel[item.payment_method || ""] || item.payment_method || "결제수단 미정"}</span>
                  <span className={`paymentStatusTag payment-${item.payment_status || "ready"}`}>
                    {statusLabel[item.payment_status || "ready"] || item.payment_status}
                  </span>
                  {item.payment_status !== "paid" && item.payment_status !== "refunded" && (
                    <a className="smallPrimary" href={`/payment/${item.request_id}`}>결제 계속하기</a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {message && <p className="formMessage error dashboardMessage">{message}</p>}
    </main>
  );
}
