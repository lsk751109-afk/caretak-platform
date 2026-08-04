"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "../../forms.css";
import "../../dashboard.css";

type RequestRow = {
  id: string;
  patient_name: string | null;
  service_type: string | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  request_status: string | null;
};

type MatchingRow = {
  id: string;
  status: string | null;
  caregivers: {
    name: string | null;
    career_years: number | null;
    hourly_rate: number | null;
    certificate: string | null;
  } | null;
};

type PaymentRow = {
  id: string;
  amount: number | null;
  payment_method: string | null;
  payment_status: string | null;
  transaction_id: string | null;
};

function daysBetween(start: string | null, end: string | null) {
  if (!start || !end) return 1;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  return Math.max(diff, 1);
}

export default function PaymentPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [matching, setMatching] = useState<MatchingRow | null>(null);
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState("card");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const [requestResult, matchingResult, paymentResult] = await Promise.all([
        supabase
          .from("care_requests")
          .select("id,patient_name,service_type,address,start_date,end_date,request_status")
          .eq("id", requestId)
          .maybeSingle(),
        supabase
          .from("matching")
          .select("id,status,caregivers(name,career_years,hourly_rate,certificate)")
          .eq("request_id", requestId)
          .in("status", ["accepted", "active", "completed"])
          .maybeSingle(),
        supabase
          .from("payments")
          .select("id,amount,payment_method,payment_status,transaction_id")
          .eq("request_id", requestId)
          .maybeSingle(),
      ]);

      if (requestResult.error || matchingResult.error || paymentResult.error) {
        setIsError(true);
        setMessage(requestResult.error?.message || matchingResult.error?.message || paymentResult.error?.message || "정보를 불러오지 못했습니다.");
      }

      setRequest(requestResult.data || null);
      setMatching((matchingResult.data || null) as MatchingRow | null);
      setPayment(paymentResult.data || null);
      if (paymentResult.data?.payment_method) setMethod(paymentResult.data.payment_method);
      setLoading(false);
    }

    load();
  }, [requestId]);

  const estimate = useMemo(() => {
    const hourlyRate = matching?.caregivers?.hourly_rate || 0;
    const days = daysBetween(request?.start_date || null, request?.end_date || null);
    return {
      days,
      hourlyRate,
      amount: hourlyRate > 0 ? hourlyRate * 8 * days : 0,
    };
  }, [matching, request]);

  async function preparePayment() {
    if (!agreed) {
      setIsError(true);
      setMessage("서비스 계약 및 환불 규정을 확인하고 동의해 주세요.");
      return;
    }
    if (!matching || matching.status !== "accepted") {
      setIsError(true);
      setMessage("간병인이 배정을 수락한 후 결제를 준비할 수 있습니다.");
      return;
    }
    if (!estimate.amount) {
      setIsError(true);
      setMessage("결제 금액을 확정하려면 간병인의 희망 시급이 등록되어 있어야 합니다.");
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    const payload = {
      request_id: requestId,
      amount: estimate.amount,
      payment_method: method,
      payment_status: "ready",
    };

    const result = payment
      ? await supabase.from("payments").update(payload).eq("id", payment.id).select("id,amount,payment_method,payment_status,transaction_id").single()
      : await supabase.from("payments").insert(payload).select("id,amount,payment_method,payment_status,transaction_id").single();

    if (result.error) {
      setIsError(true);
      setMessage(result.error.message);
    } else {
      setPayment(result.data);
      setMessage("결제 준비 정보가 저장되었습니다. KCP 운영 연동 후 실제 결제창이 연결됩니다.");
    }
    setSaving(false);
  }

  if (loading) return <main className="authPage"><p className="loadingText">계약 정보를 불러오는 중입니다...</p></main>;

  if (!request) {
    return <main className="authPage"><section className="authCard compact"><h1>신청 정보를 찾을 수 없습니다.</h1><p className="authFoot"><a href="/mypage">마이페이지로 돌아가기</a></p></section></main>;
  }

  return (
    <main className="paymentPage">
      <header className="dashboardHeader">
        <a className="brand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
        <a className="secondaryButton compactButton" href="/mypage">마이페이지</a>
      </header>

      <section className="paymentHero">
        <span className="eyebrow">CARE CONTRACT & PAYMENT</span>
        <h1>계약 확인 및 결제 준비</h1>
        <p>배정된 간병 일정과 예상 결제 금액을 확인해 주세요.</p>
      </section>

      <section className="paymentLayout">
        <div className="paymentMain">
          <article className="paymentCard">
            <h2>간병 서비스 정보</h2>
            <dl className="contractList">
              <div><dt>환자</dt><dd>{request.patient_name || "-"}</dd></div>
              <div><dt>서비스</dt><dd>{request.service_type || "-"}</dd></div>
              <div><dt>지역</dt><dd>{request.address || "-"}</dd></div>
              <div><dt>일정</dt><dd>{request.start_date || "미정"}{request.end_date ? ` ~ ${request.end_date}` : ""}</dd></div>
              <div><dt>배정 상태</dt><dd>{matching?.status === "accepted" ? "간병인 수락 완료" : "배정 확정 대기"}</dd></div>
            </dl>
          </article>

          <article className="paymentCard">
            <h2>배정 간병인</h2>
            {matching?.caregivers ? (
              <dl className="contractList">
                <div><dt>이름</dt><dd>{matching.caregivers.name || "-"}</dd></div>
                <div><dt>경력</dt><dd>{matching.caregivers.career_years || 0}년</dd></div>
                <div><dt>자격증</dt><dd>{matching.caregivers.certificate || "미등록"}</dd></div>
                <div><dt>기준 시급</dt><dd>{matching.caregivers.hourly_rate ? `${matching.caregivers.hourly_rate.toLocaleString()}원` : "관리자 협의"}</dd></div>
              </dl>
            ) : <div className="emptyState">수락 완료된 간병인이 없습니다.</div>}
          </article>

          <article className="paymentCard">
            <h2>계약 및 환불 안내</h2>
            <div className="termsBox">
              <p>예상 금액은 1일 8시간 기준으로 계산되며, 실제 근무시간과 추가 서비스에 따라 최종 금액이 달라질 수 있습니다.</p>
              <p>서비스 시작 전 취소 및 환불 기준은 최종 계약서와 결제 안내에서 확인합니다.</p>
              <p>실제 결제는 NHN KCP 운영 결제창에서 진행되며, 결제 완료 여부는 서버 검증 후 확정됩니다.</p>
            </div>
            <label className="agreementCheck">
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              <span>위 계약 내용과 환불 안내를 확인했으며 이에 동의합니다.</span>
            </label>
          </article>
        </div>

        <aside className="paymentSummary">
          <span className="eyebrow">PAYMENT SUMMARY</span>
          <h2>결제 예상 금액</h2>
          <div className="priceRows">
            <div><span>기준 시급</span><b>{estimate.hourlyRate ? `${estimate.hourlyRate.toLocaleString()}원` : "미정"}</b></div>
            <div><span>일수</span><b>{estimate.days}일</b></div>
            <div><span>일 기준</span><b>8시간</b></div>
          </div>
          <div className="totalPrice"><span>예상 합계</span><strong>{estimate.amount ? `${estimate.amount.toLocaleString()}원` : "관리자 확인 필요"}</strong></div>

          <label className="paymentMethod">결제수단
            <select value={method} onChange={(event) => setMethod(event.target.value)}>
              <option value="card">신용·체크카드</option>
              <option value="bank_transfer">계좌이체</option>
              <option value="virtual_account">가상계좌</option>
            </select>
          </label>

          <button className="primaryButton paymentButton" onClick={preparePayment} disabled={saving || payment?.payment_status === "paid"}>
            {payment?.payment_status === "paid" ? "결제 완료" : saving ? "저장 중..." : "결제 준비하기"}
          </button>
          {payment && <p className="paymentState">현재 상태: {payment.payment_status === "ready" ? "결제 준비" : payment.payment_status || "확인 중"}</p>}
        </aside>
      </section>

      {message && <p className={`formMessage paymentMessage ${isError ? "error" : ""}`}>{message}</p>}
    </main>
  );
}
