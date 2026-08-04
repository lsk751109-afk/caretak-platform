"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";

export default function VipCarePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submitVipRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setIsError(true);
      setMessage("VIP 상담 신청은 로그인 후 이용할 수 있습니다.");
      setLoading(false);
      return;
    }

    const form = new FormData(event.currentTarget);
    const patientName = String(form.get("patientName") || "");
    const phone = String(form.get("phone") || "");
    const region = String(form.get("region") || "");
    const startDate = String(form.get("startDate") || "");
    const serviceType = String(form.get("serviceType") || "");
    const details = String(form.get("details") || "");

    const content = [
      `환자명: ${patientName}`,
      `연락처: ${phone}`,
      `지역: ${region}`,
      `희망 시작일: ${startDate}`,
      `간병 유형: ${serviceType}`,
      `상세 요청: ${details}`,
    ].join("\n");

    const { error } = await supabase.from("customer_support").insert({
      user_id: user.id,
      category: "vip_care",
      title: `VIP 전담간병 상담 - ${patientName}`,
      content,
      status: "waiting",
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setMessage("VIP 전담간병 상담이 접수되었습니다. 담당자가 확인 후 연락드립니다.");
      event.currentTarget.reset();
    }

    setLoading(false);
  }

  return (
    <main className="authPage vipPage">
      <a className="brand authBrand" href="/">
        <span className="brandMark">C</span><span>케어택</span>
      </a>

      <section className="authCard requestCard vipRequestCard">
        <span className="eyebrow gold">VIP CARE SERVICE</span>
        <h1>VIP 전담간병 상담</h1>
        <p className="authIntro">전담 코디네이터가 환자 상태와 보호자 요청을 확인해 맞춤 간병 계획을 안내합니다.</p>

        <div className="vipBenefits">
          <div><b>1:1 전담 상담</b><span>상황별 맞춤 계획</span></div>
          <div><b>우선 매칭</b><span>조건별 간병인 검토</span></div>
          <div><b>일정 관리</b><span>서비스 진행 확인</span></div>
        </div>

        <form className="authForm requestForm" onSubmit={submitVipRequest}>
          <label>환자 이름<input name="patientName" required placeholder="환자 성함" /></label>
          <label>보호자 연락처<input name="phone" required placeholder="010-0000-0000" /></label>
          <label>간병 지역<input name="region" required placeholder="예: 서울 강남구" /></label>
          <label>희망 시작일<input name="startDate" type="date" required /></label>
          <label className="full">간병 유형
            <select name="serviceType" required defaultValue="">
              <option value="" disabled>간병 유형 선택</option>
              <option value="입원 간병">입원 간병</option>
              <option value="가정 간병">가정 간병</option>
              <option value="퇴원 동행">퇴원 동행</option>
              <option value="24시간 전담">24시간 전담</option>
            </select>
          </label>
          <label className="full">상세 요청
            <textarea name="details" required rows={6} placeholder="환자 상태, 필요한 도움, 선호 조건 등을 적어주세요." />
          </label>
          <button className="primaryButton formButton full" disabled={loading}>
            {loading ? "접수 중..." : "VIP 상담 신청"}
          </button>
        </form>

        {message && <p className={`formMessage ${isError ? "error" : ""}`}>{message}</p>}
        <p className="authFoot"><a href="/">메인으로 돌아가기</a></p>
      </section>
    </main>
  );
}
