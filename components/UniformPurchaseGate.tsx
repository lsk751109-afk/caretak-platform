"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PurchaseState = "loading" | "guest" | "guardian" | "caregiver";

export default function UniformPurchaseGate({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<PurchaseState>("loading");

  useEffect(() => {
    let active = true;

    async function checkRole() {
      const { data: auth } = await supabase.auth.getUser();
      if (!active) return;

      if (!auth.user) {
        setState("guest");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!active) return;
      setState(profile?.role === "caregiver" ? "caregiver" : "guardian");
    }

    checkRole();
    return () => { active = false; };
  }, []);

  if (state === "loading") {
    return <span className={`uniformGateButton disabled ${compact ? "compact" : ""}`}>회원 확인 중…</span>;
  }

  if (state === "caregiver") {
    return <a className={`uniformGateButton ${compact ? "compact" : ""}`} href="tel:0318682436">간병인 구매 문의 <span>→</span></a>;
  }

  if (state === "guest") {
    return <div className={`uniformGateNotice ${compact ? "compact" : ""}`}><b>간병인 회원 전용</b><span>로그인 후 구매할 수 있습니다.</span><a href="/login">간병인 로그인</a></div>;
  }

  return <div className={`uniformGateNotice blocked ${compact ? "compact" : ""}`}><b>보호자 계정은 구매할 수 없습니다.</b><span>유니폼은 등록된 간병인 회원에게만 판매합니다.</span></div>;
}
