"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthActions() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return <div className="headerActions" aria-hidden="true" />;

  if (email) {
    return (
      <div className="headerActions">
        <span title={email} style={{ color: "#637083", fontSize: 14, fontWeight: 700 }}>{email.split("@")[0]}님</span>
        <button
          className="textButton"
          type="button"
          onClick={logout}
          style={{ border: 0, background: "transparent", cursor: "pointer", font: "inherit" }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="headerActions">
      <a className="textButton" href="/login">로그인</a>
      <a className="smallPrimary" href="/signup">회원가입</a>
    </div>
  );
}
