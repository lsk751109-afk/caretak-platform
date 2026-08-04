"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CareRequestPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startDate = String(form.get("start_date") || "");
    const endDate = String(form.get("end_date") || "");
    const patientAge = Number(form.get("patient_age") || 0);

    if (endDate && endDate < startDate) {
      setLoading(false);
      setMessage("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    if (!Number.isInteger(patientAge) || patientAge < 0 || patientAge > 120) {
      setLoading(false);
      setMessage("환자 나이를 0세부터 120세 사이로 입력해주세요.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setMessage("로그인 후 간병을 신청할 수 있습니다.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name,phone,role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setLoading(false);
      setMessage(`회원정보 확인 중 오류가 발생했습니다: ${profileError.message}`);
      return;
    }

    if (profile?.role === "caregiver") {
      setLoading(false);
      setMessage("간병 신청은 보호자 회원으로 로그인한 경우에 이용할 수 있습니다.");
      return;
    }

    const { data: guardian, error: guardianLookupError } = await supabase
      .from("guardians")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (guardianLookupError) {
      setLoading(false);
      setMessage(`보호자 정보 확인 중 오류가 발생했습니다: ${guardianLookupError.message}`);
      return;
    }

    let guardianId = guardian?.id;
    if (!guardianId) {
      const address = String(form.get("address") || "");
      const { data: created, error: guardianError } = await supabase
        .from("guardians")
        .insert({
          user_id: user.id,
          name: profile?.name || user.user_metadata?.name || "보호자",
          phone: profile?.phone || user.user_metadata?.phone || "",
          address,
        })
        .select("id")
        .single();

      if (guardianError || !created) {
        setLoading(false);
        setMessage(`보호자 정보 생성 중 오류가 발생했습니다: ${guardianError?.message || "알 수 없는 오류"}`);
        return;
      }
      guardianId = created.id;
    }

    const { error } = await supabase.from("care_requests").insert({
      guardian_id: guardianId,
      patient_name: String(form.get("patient_name") || "").trim(),
      patient_gender: String(form.get("patient_gender") || ""),
      patient_age: patientAge,
      care_grade: String(form.get("care_grade") || "").trim(),
      service_type: String(form.get("service_type") || "입원 간병"),
      address: String(form.get("address") || "").trim(),
      start_date: startDate,
      end_date: endDate || null,
      request_status: "waiting",
      status: "waiting",
    });

    setLoading(false);
    if (error) {
      setMessage(`신청 저장 중 오류가 발생했습니다: ${error.message}`);
      return;
    }

    setSuccess(true);
    setMessage("간병 신청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.");
    formElement.reset();
  }

  return (
    <main className="authPage requestPage">
      <a className="brand authBrand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
      <section className="authCard requestCard">
        <span className="eyebrow">CARE REQUEST</span>
        <h1>간병 신청</h1>
        <p className="authIntro">환자와 일정 정보를 입력하면 조건에 맞는 간병인을 확인해드립니다.</p>
        <form className="authForm requestForm" onSubmit={handleSubmit}>
          <label>환자 이름<input name="patient_name" required /></label>
          <label>성별<select name="patient_gender" required><option value="">선택</option><option>남성</option><option>여성</option></select></label>
          <label>나이<input name="patient_age" type="number" min="0" max="120" required /></label>
          <label>간병 유형<select name="service_type"><option>입원 간병</option><option>가정 간병</option><option>VIP 전담간병</option></select></label>
          <label>환자 상태<input name="care_grade" placeholder="예: 거동 불편, 수술 후 회복" required /></label>
          <label className="full">간병 장소<input name="address" placeholder="병원명 또는 주소" required /></label>
          <label>시작일<input name="start_date" type="date" required /></label>
          <label>종료일<input name="end_date" type="date" /></label>
          <button className="primaryButton formButton full" disabled={loading}>{loading ? "접수 중..." : "간병 신청 접수"}</button>
        </form>
        {message && <p className={`formMessage ${success ? "" : "error"}`}>{message}</p>}
        {success && <p className="authFoot"><a href="/mypage">마이페이지에서 신청 내역 확인하기</a></p>}
      </section>
    </main>
  );
}
