import { NextRequest, NextResponse } from "next/server";
import { createAdminServerClient, createUserServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { paymentId, paymentRowId } = await request.json();
    if (!paymentId || !paymentRowId) {
      return NextResponse.json({ error: "결제 식별 정보가 없습니다." }, { status: 400 });
    }

    const apiSecret = process.env.PORTONE_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ error: "PortOne API Secret이 설정되지 않았습니다." }, { status: 500 });
    }

    const userClient = createUserServerClient(accessToken);
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "사용자 인증에 실패했습니다." }, { status: 401 });
    }

    const { data: paymentRow, error: paymentError } = await userClient
      .from("payments")
      .select("id,request_id,amount,payment_status")
      .eq("id", paymentRowId)
      .single();

    if (paymentError || !paymentRow) {
      return NextResponse.json({ error: "결제 준비 내역을 찾을 수 없습니다." }, { status: 404 });
    }
    if (paymentRow.payment_status !== "ready") {
      return NextResponse.json({ error: "이미 처리되었거나 결제할 수 없는 내역입니다." }, { status: 409 });
    }

    const portoneResponse = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${apiSecret}` },
      cache: "no-store",
    });
    const portonePayment = await portoneResponse.json();
    if (!portoneResponse.ok) {
      return NextResponse.json({ error: portonePayment?.message || "PortOne 결제 조회에 실패했습니다." }, { status: 502 });
    }

    const paidAmount = Number(portonePayment?.amount?.total || 0);
    if (portonePayment.status !== "PAID") {
      return NextResponse.json({ error: "결제가 완료 상태가 아닙니다." }, { status: 400 });
    }
    if (paidAmount !== Number(paymentRow.amount || 0)) {
      return NextResponse.json({ error: "결제 금액이 신청 금액과 일치하지 않습니다." }, { status: 400 });
    }

    const admin = createAdminServerClient();
    const { error: updateError } = await admin
      .from("payments")
      .update({
        payment_status: "paid",
        transaction_id: paymentId,
        payment_method: portonePayment?.method?.type || "CARD",
      })
      .eq("id", paymentRow.id)
      .eq("payment_status", "ready");

    if (updateError) {
      return NextResponse.json({ error: `결제 저장에 실패했습니다: ${updateError.message}` }, { status: 500 });
    }

    await admin.from("care_requests").update({ request_status: "active", status: "active" }).eq("id", paymentRow.request_id);

    return NextResponse.json({ ok: true, paymentId, amount: paidAmount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
