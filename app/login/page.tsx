"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

function loginErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. 받은 메일에서 인증을 완료해주세요.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "등록된 이메일 또는 비밀번호가 일치하지 않습니다.";
  }

  if (normalized.includes("api key") || normalized.includes("invalid key")) {
    return "Supabase 공개 키가 현재 프로젝트와 일치하지 않습니다. 관리자에게 문의해주세요.";
  }

  return `로그인 오류: ${message}`;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(loginErrorMessage(error.message));
        return;
      }

      if (!data.session) {
        setMessage("로그인 세션을 만들지 못했습니다. 잠시 후 다시 시도해주세요.");
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
        setMessage(result?.error || "회원정보를 불러오지 못했습니다. 다시 로그인해주세요.");
        return;
      }

      window.location.href = "/mypage";
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessage(`네트워크 또는 설정 오류: ${detail}`);
    } finally {
      setLoading(false);
    }
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
