"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthActions() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser(user: { id: string; email?: string } | null) {
    setEmail(user?.email ?? null);
    if (!user) { setRole(null); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    setRole(profile?.role || null);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => loadUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
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
        <span className="userEmail" title={email}>{email.split("@")[0]}님</span>
        <a className="myPageButton" href={role === "caregiver" ? "/caregiver" : role === "admin" ? "/admin" : "/mypage"}><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></svg><span>마이페이지</span></a>
        <button className="textButton authButton" type="button" onClick={logout}>로그아웃</button>
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
