"use client";

import { useEffect, useMemo, useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { supabase } from "@/lib/supabase";
import "../forms.css";

type CareRequestSummary = {
  patient_name: string | null;
  service_type: string | null;
};

type PaymentItem = {
  id: string;
  request_id: string;
  amount: number | null;
  payment_status: string | null;
  payment_method: string | null;
  care_requests: CareRequestSummary[] | null;
};

function getCareRequest(item: PaymentItem): CareRequestSummary | null {
  return item.care_requests?.[0] ?? null;
}

export default function PaymentPage() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  async function loadPayments() {
    setLoading(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("payments")
      .select("id,request_id,amount,payment_status,payment_method,care_requests(patient_name,service_type)")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    setItems((data ?? []) as PaymentItem[]);
    setLoading(false);
  }

  useEffect(() => { loadPayments(); }, []);

  const readyItems = useMemo(() => items.filter((item) => item.payment_status === "ready"), [items]);
  void readyItems;

  async function pay(item: PaymentItem) {
    if (!storeId || !channelKey) {
      setMessage("PortOne Store ID 또는 채널 키가 설정되지 않았습니다.");
      return;
    }
    if (!item.amount || item.amount <= 0) {
      setMessage("결제 금액이 올바르지 않습니다.");
      return;
    }

    const careRequest = getCareRequest(item);
    setPayingId(item.id);
    setMessage("");
    const paymentId = `caretak-${item.request_id}-${Date.now()}`;
    const response = await PortOne.requestPayment({
      storeId,
      channelKey,
      paymentId,
      orderName: `${careRequest?.patient_name || "환자"} ${careRequest?.service_type || "간병 서비스"}`,
      totalAmount: item.amount,
      currency: "CURRENCY_KRW",
      payMethod: "CARD",
    });

    if (!response) {
      setPayingId(null);
      setMessage("결제창 응답을 확인할 수 없습니다.");
      return;
    }
    if (response.code) {
      setPayingId(null);
      setMessage(response.message || "결제가 취소되었거나 실패했습니다.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const verifyResponse = await fetch("/api/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ paymentId, paymentRowId: item.id }),
    });
    const result = await verifyResponse.json();
    setPayingId(null);

    if (!verifyResponse.ok) {
      setMessage(result.error || "결제 검증에 실패했습니다.");
      return;
    }

    setMessage("결제가 정상적으로 완료되었습니다.");
    await loadPayments();
  }

  return (
    <main className="authPage requestPage">
      <a className="brand authBrand" href="/" aria-label="케어택 홈" />
      <section className="authCard requestCard">
        <span className="eyebrow">CARETAK PAYMENT</span>
        <h1>간병 서비스 결제</h1>
        <p className="authIntro">간병인 배정이 확정된 신청의 결제를 안전하게 진행합니다.</p>

        {loading ? <p>결제 내역을 불러오는 중입니다...</p> : (
          <div className="paymentList">
            {items.map((item) => {
              const careRequest = getCareRequest(item);
              return (
                <article className="paymentCard" key={item.id}>
                  <div>
                    <b>{careRequest?.patient_name || "환자"} · {careRequest?.service_type || "간병 서비스"}</b>
                    <p>{(item.amount || 0).toLocaleString()}원</p>
                  </div>
                  <div className="paymentActions">
                    <span className={`adminBadge ${item.payment_status || "ready"}`}>{item.payment_status === "paid" ? "결제 완료" : item.payment_status === "ready" ? "결제 대기" : item.payment_status}</span>
                    {item.payment_status === "ready" && (
                      <button className="primaryButton" disabled={payingId === item.id} onClick={() => pay(item)}>
                        {payingId === item.id ? "결제 진행 중..." : "카드 결제"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {items.length === 0 && <p className="noticeBox">현재 결제할 내역이 없습니다. 간병인 배정 수락 후 결제 요청이 생성됩니다.</p>}
          </div>
        )}

        {message && <p className={`formMessage ${message.includes("완료") ? "" : "error"}`}>{message}</p>}
        <p className="authFoot"><a href="/mypage">마이페이지로 돌아가기</a></p>
      </section>
    </main>
  );
}
