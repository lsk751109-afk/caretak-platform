"use client";

import { FormEvent, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const DAILY_RATES: Record<string, number> = {
  "24시간 일반": 140000,
  "24시간 VIP": 180000,
  "12시간 주간": 90000,
  "12시간 야간": 110000,
};

const conditionOptions = [
  "보행 도움",
  "치매·인지 저하",
  "욕창 관리",
  "식사 도움",
  "기저귀 케어",
  "산소호흡기",
  "석션",
  "수술 후 회복",
];

function differenceInDays(startDate: string, endDate: string) {
  if (!startDate) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : start;
  const difference = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, difference);
}

export default function CareRequestPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [carePlan, setCarePlan] = useState("24시간 일반");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const estimatedPrice = useMemo(() => {
    const days = differenceInDays(startDate, endDate);
    return { days, total: days * DAILY_RATES[carePlan] };
  }, [carePlan, endDate, startDate]);

  function toggleCondition(condition: string) {
    setSelectedConditions((current) =>
      current.includes(condition)
        ? current.filter((item) => item !== condition)
        : [...current, condition],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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

    const hospitalDetail = [
      String(form.get("hospital_name") || "").trim(),
      String(form.get("ward") || "").trim(),
      String(form.get("room") || "").trim(),
    ].filter(Boolean).join(" · ");

    const careSummary = [
      `간병형태: ${carePlan}`,
      `환자상태: ${selectedConditions.length ? selectedConditions.join(", ") : "별도 선택 없음"}`,
      `세부상태: ${String(form.get("care_grade") || "").trim()}`,
      `예상기간: ${estimatedPrice.days}일`,
      `예상금액: ${estimatedPrice.total.toLocaleString("ko-KR")}원`,
      `요청사항: ${String(form.get("special_request") || "").trim() || "없음"}`,
    ].join(" | ");

    const serviceType = carePlan.includes("VIP") ? "VIP 전담간병" : carePlan;

    const { error } = await supabase.from("care_requests").insert({
      guardian_id: guardianId,
      patient_name: String(form.get("patient_name") || "").trim(),
      patient_gender: String(form.get("patient_gender") || ""),
      patient_age: patientAge,
      care_grade: careSummary,
      service_type: serviceType,
      address: hospitalDetail || String(form.get("address") || "").trim(),
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
    setStartDate("");
    setEndDate("");
    setCarePlan("24시간 일반");
    setSelectedConditions([]);
  }

  return (
    <main className="authPage requestPage">
      <a className="brand authBrand" href="/" aria-label="케어택 홈"><span className="brandMark">C</span><span>케어택</span></a>
      <section className="authCard requestCard">
        <span className="eyebrow">CARE REQUEST</span>
        <h1>간병 신청</h1>
        <p className="authIntro">환자 상태와 간병 일정을 자세히 입력하면 담당자가 확인해 적합한 간병인을 연결합니다.</p>

        <form className="authForm requestForm" onSubmit={handleSubmit}>
          <div className="formSectionTitle full"><b>1. 환자 정보</b><span>간병 대상자의 기본 정보를 입력하세요.</span></div>
          <label>환자 이름<input name="patient_name" required /></label>
          <label>성별<select name="patient_gender" required><option value="">선택</option><option>남성</option><option>여성</option></select></label>
          <label>나이<input name="patient_age" type="number" min="0" max="120" required /></label>
          <label>환자 상태 요약<input name="care_grade" placeholder="예: 거동 불편, 수술 후 회복" required /></label>

          <div className="formSectionTitle full"><b>2. 병원·간병 장소</b><span>입원 간병은 병원명과 병실을 함께 입력하세요.</span></div>
          <label>병원명<input name="hospital_name" placeholder="예: 인하대병원" /></label>
          <label>병동<input name="ward" placeholder="예: 7층 정형외과 병동" /></label>
          <label>병실<input name="room" placeholder="예: 703호" /></label>
          <label>주소<input name="address" placeholder="병원 또는 자택 주소" required /></label>

          <div className="formSectionTitle full"><b>3. 일정과 간병 형태</b><span>필요한 일정과 근무 형태를 선택하세요.</span></div>
          <label>시작일<input name="start_date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
          <label>종료일<input name="end_date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <label className="full">간병 형태<select name="care_plan" value={carePlan} onChange={(event) => setCarePlan(event.target.value)}>{Object.keys(DAILY_RATES).map((plan) => <option key={plan}>{plan}</option>)}</select></label>

          <div className="formSectionTitle full"><b>4. 필요한 돌봄</b><span>해당되는 항목을 모두 선택하세요.</span></div>
          <div className="conditionGrid full">
            {conditionOptions.map((condition) => (
              <button type="button" key={condition} className={selectedConditions.includes(condition) ? "selected" : ""} onClick={() => toggleCondition(condition)}>
                <span>{selectedConditions.includes(condition) ? "✓" : "+"}</span>{condition}
              </button>
            ))}
          </div>

          <label className="full">추가 요청사항<textarea name="special_request" rows={5} placeholder="투약 시간, 식사 방식, 보호자가 특별히 요청하는 내용을 입력해주세요." /></label>

          <aside className="priceEstimate full">
            <div><span>선택한 서비스</span><b>{carePlan}</b></div>
            <div><span>예상 이용 기간</span><b>{estimatedPrice.days}일</b></div>
            <div className="priceTotal"><span>예상 총 금액</span><strong>{estimatedPrice.total.toLocaleString("ko-KR")}원</strong></div>
            <small>예상 금액이며 환자 상태, 지역, 긴급 요청 및 실제 배정 조건에 따라 최종 금액이 달라질 수 있습니다.</small>
          </aside>

          <button className="primaryButton formButton full" disabled={loading}>{loading ? "접수 중..." : "간병 신청 접수"}</button>
        </form>
        {message && <p className={`formMessage ${success ? "" : "error"}`}>{message}</p>}
        {success && <p className="authFoot"><a href="/mypage">마이페이지에서 신청 내역 확인하기</a></p>}
      </section>
    </main>
  );
}
