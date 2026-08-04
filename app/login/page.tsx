"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      setLoading(false);
      setMessage("이메일 또는 비밀번호를 확인해주세요.");
      return;
    }

    const syncResponse = await fetch("/api/auth/sync-profile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });

    if (!syncResponse.ok) {
      const result = await syncResponse.json().catch(() => null);
      setLoading(false);
      setMessage(result?.error || "회원정보를 불러오지 못했습니다. 다시 로그인해주세요.");
      return;
    }

    window.location.href = "/mypage";
  }

  return (
    <main className="authPage">
      <a className="brand authBrand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
      <section className="authCard compact">
        <span className="eyebrow">WELCOME BACK</span>
        <h1>로그인</h1>
        <p className="authIntro">케어택 계정으로 로그인해 신청과 매칭 현황을 확인하세요.</p>
        <form className="authForm" onSubmit={handleSubmit}>
          <label>이메일<input name="email" type="email" placeholder="name@example.com" autoComplete="email" required /></label>
          <label>비밀번호<input name="password" type="password" placeholder="비밀번호를 입력하세요" autoComplete="current-password" required /></label>
          <button className="primaryButton formButton" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
        </form>
        {message && <p className="formMessage error">{message}</p>}
        <p className="authFoot">아직 회원이 아니신가요? <a href="/signup">회원가입</a></p>
      </section>
    </main>
  );
}
