"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";

export default function CaregiverRegisterPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const payload = {
      user_id: userId,
      name: String(form.get("name") || ""),
      gender: String(form.get("gender") || ""),
      birth: String(form.get("birth") || "") || null,
      phone: String(form.get("phone") || ""),
      address: String(form.get("address") || ""),
      career_years: Number(form.get("career_years") || 0),
      certificate: String(form.get("certificate") || ""),
      introduction: String(form.get("introduction") || ""),
      hourly_rate: Number(form.get("hourly_rate") || 0),
      status: "waiting",
    };

    const { error } = await supabase.from("caregivers").insert(payload);
    setSaving(false);

    if (error) {
      setMessage(`등록에 실패했습니다: ${error.message}`);
      return;
    }

    setMessage("간병인 정보가 등록되었습니다. 관리자 승인 후 목록에 표시됩니다.");
    e.currentTarget.reset();
  }

  return (
    <main className="formPage">
      <a className="formBrand" href="/"><span className="brandMark">C</span><b>케어택</b></a>
      <section className="formCard wideForm">
        <span className="eyebrow">CAREGIVER REGISTRATION</span>
        <h1>간병인 등록</h1>
        <p className="formIntro">경력과 가능한 서비스 정보를 입력해 주세요. 등록 내용은 검토 후 공개됩니다.</p>

        <form onSubmit={submit} className="formGrid">
          <label>이름<input name="name" required placeholder="홍길동" /></label>
          <label>성별<select name="gender" required defaultValue=""><option value="" disabled>선택</option><option>여성</option><option>남성</option><option>기타</option></select></label>
          <label>생년월일<input name="birth" type="date" /></label>
          <label>휴대폰번호<input name="phone" required placeholder="010-0000-0000" /></label>
          <label className="fullField">활동 지역<input name="address" required placeholder="예: 서울 강남구, 인천 전 지역" /></label>
          <label>간병 경력(년)<input name="career_years" type="number" min="0" max="60" defaultValue="0" /></label>
          <label>희망 시급(원)<input name="hourly_rate" type="number" min="0" step="1000" placeholder="15000" /></label>
          <label className="fullField">자격 및 교육 이력<input name="certificate" placeholder="예: 요양보호사, 간병교육 수료" /></label>
          <label className="fullField">자기소개<textarea name="introduction" rows={6} required placeholder="경험, 강점, 가능한 간병 형태를 입력해 주세요." /></label>
          <div className="fullField noticeBox">등록 후 상태는 <b>승인 대기</b>로 저장됩니다. 개인정보와 증빙서류는 관리자 검토 절차에 따라 확인합니다.</div>
          <button className="submitButton fullField" disabled={saving}>{saving ? "등록 중..." : "간병인 정보 등록"}</button>
        </form>
        {message && <p className="formMessage">{message}</p>}
      </section>
    </main>
  );
}
