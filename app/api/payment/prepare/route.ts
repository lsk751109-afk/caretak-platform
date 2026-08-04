import { NextRequest, NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase-server";

function getBearerToken(request: NextRequest) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const requestId = String(body.requestId || "");
    const amount = Number(body.amount || 0);
    const paymentMethod = String(body.paymentMethod || "card");

    if (!requestId || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "결제 요청 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (!["card", "bank", "virtual_account"].includes(paymentMethod)) {
      return NextResponse.json({ error: "지원하지 않는 결제수단입니다." }, { status: 400 });
    }

    const supabase = createUserServerClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "로그인 정보를 확인할 수 없습니다." }, { status: 401 });
    }

    const { data: guardian } = await supabase
      .from("guardians")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!guardian) {
      return NextResponse.json({ error: "보호자 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const { data: careRequest } = await supabase
      .from("care_requests")
      .select("id,patient_name,service_type,guardian_id")
      .eq("id", requestId)
      .eq("guardian_id", guardian.id)
      .maybeSingle();

    if (!careRequest) {
      return NextResponse.json({ error: "본인의 간병 신청만 결제할 수 있습니다." }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from("payments")
      .select("id,payment_status")
      .eq("request_id", requestId)
      .maybeSingle();

    let paymentId = existing?.id;

    if (existing?.payment_status === "paid") {
      return NextResponse.json({ error: "이미 결제가 완료된 신청입니다." }, { status: 409 });
    }

    if (paymentId) {
      const { error } = await supabase
        .from("payments")
        .update({ amount, payment_method: paymentMethod, payment_status: "ready" })
        .eq("id", paymentId);
      if (error) throw error;
    } else {
      const { data: created, error } = await supabase
        .from("payments")
        .insert({
          request_id: requestId,
          amount,
          payment_method: paymentMethod,
          payment_status: "ready",
        })
        .select("id")
        .single();
      if (error) throw error;
      paymentId = created.id;
    }

    return NextResponse.json({
      paymentId,
      orderId: `CARETAK-${String(paymentId).replaceAll("-", "").slice(0, 20)}`,
      orderName: `${careRequest.patient_name || "환자"} ${careRequest.service_type || "간병"}`,
      amount,
      siteCode: process.env.KCP_SITE_CODE || "",
      ready: Boolean(process.env.KCP_SITE_CODE),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "결제 준비 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
