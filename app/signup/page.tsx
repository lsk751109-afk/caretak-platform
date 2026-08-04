"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [role, setRole] = useState<"guardian" | "caregiver">("guardian");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");

    if (!name || !phone || !email || password.length < 6) {
      setMessage("모든 항목을 입력하고 비밀번호는 6자 이상으로 설정해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password, role }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "회원가입을 완료하지 못했습니다.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setMessage("회원가입은 완료되었습니다. 로그인 페이지에서 다시 로그인해주세요.");
        window.setTimeout(() => { window.location.href = "/login"; }, 1200);
        return;
      }

      formElement.reset();
      window.location.href = role === "caregiver" ? "/caregiver-register" : "/mypage";
    } catch {
      setMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <a className="brand authBrand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
      <section className="authCard">
        <span className="eyebrow">CREATE ACCOUNT</span>
        <h1>케어택 회원가입</h1>
        <p className="authIntro">보호자 또는 간병인으로 가입하고 필요한 서비스를 시작하세요.</p>

        <div className="rolePicker">
          <button type="button" className={role === "guardian" ? "active" : ""} onClick={() => setRole("guardian")}>
            <b>보호자</b><span>간병을 신청하고 매칭을 확인합니다.</span>
          </button>
          <button type="button" className={role === "caregiver" ? "active" : ""} onClick={() => setRole("caregiver")}>
            <b>간병인</b><span>경력 정보를 등록하고 일정을 관리합니다.</span>
          </button>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>이름<input name="name" placeholder="이름을 입력하세요" autoComplete="name" required /></label>
          <label>휴대폰번호<input name="phone" placeholder="010-0000-0000" autoComplete="tel" required /></label>
          <label>이메일<input name="email" type="email" placeholder="name@example.com" autoComplete="email" required /></label>
          <label>비밀번호<input name="password" type="password" placeholder="6자 이상 입력하세요" autoComplete="new-password" minLength={6} required /></label>
          <button className="primaryButton formButton" disabled={loading}>{loading ? "가입 처리 중..." : "회원가입"}</button>
        </form>

        {message && <p className="formMessage">{message}</p>}
        <p className="authFoot">이미 회원이신가요? <a href="/login">로그인</a></p>
      </section>
    </main>
  );
}
