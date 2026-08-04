import { NextRequest, NextResponse } from "next/server";
import { createAdminServerClient } from "@/lib/supabase-server";

type PortOnePayment = {
  id?: string;
  status?: string;
  orderName?: string;
  amount?: { total?: number };
  method?: { type?: string };
  paidAt?: string;
  transactionId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!accessToken) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const paymentId = String(body.paymentId || "").trim();
    const requestId = String(body.requestId || "").trim();
    const expectedAmount = Number(body.amount || 0);

    if (!paymentId || !requestId || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json({ error: "결제 검증 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const apiSecret = process.env.PORTONE_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ error: "PortOne 서버 API Secret이 설정되지 않았습니다." }, { status: 503 });
    }

    const admin = createAdminServerClient();
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "로그인 세션이 만료되었습니다." }, { status: 401 });
    }

    const { data: guardian } = await admin
      .from("guardians")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!guardian?.id) {
      return NextResponse.json({ error: "보호자 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const { data: careRequest } = await admin
      .from("care_requests")
      .select("id,guardian_id")
      .eq("id", requestId)
      .eq("guardian_id", guardian.id)
      .maybeSingle();

    if (!careRequest) {
      return NextResponse.json({ error: "본인의 간병 신청만 결제할 수 있습니다." }, { status: 403 });
    }

    const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const payment = (await response.json().catch(() => null)) as PortOnePayment | null;
    if (!response.ok || !payment) {
      return NextResponse.json({ error: "PortOne 결제 정보를 확인하지 못했습니다." }, { status: 502 });
    }

    const paid = payment.status === "PAID";
    const actualAmount = Number(payment.amount?.total || 0);

    if (!paid) {
      return NextResponse.json({ error: `결제가 완료되지 않았습니다. 현재 상태: ${payment.status || "UNKNOWN"}` }, { status: 400 });
    }

    if (actualAmount !== expectedAmount) {
      return NextResponse.json({ error: "결제 금액이 주문 금액과 일치하지 않습니다." }, { status: 400 });
    }

    const { data: saved, error: saveError } = await admin
      .from("payments")
      .upsert({
        request_id: requestId,
        amount: actualAmount,
        payment_method: payment.method?.type || "card",
        payment_status: "paid",
        transaction_id: payment.transactionId || paymentId,
      }, { onConflict: "request_id" })
      .select("id,request_id,amount,payment_method,payment_status,transaction_id")
      .single();

    if (saveError) {
      return NextResponse.json({ error: `결제 저장 오류: ${saveError.message}` }, { status: 500 });
    }

    await admin
      .from("care_requests")
      .update({ request_status: "active" })
      .eq("id", requestId)
      .in("request_status", ["matched", "active"]);

    await admin.from("notifications").insert({
      user_id: userData.user.id,
      title: "결제가 완료되었습니다",
      message: `${actualAmount.toLocaleString("ko-KR")}원 결제가 정상적으로 확인되었습니다.`,
      is_read: false,
    });

    return NextResponse.json({ verified: true, payment: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "결제 검증 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
