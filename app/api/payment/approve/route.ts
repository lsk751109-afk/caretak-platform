import { NextRequest, NextResponse } from "next/server";
import { createAdminServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.KCP_CALLBACK_SECRET;
    const receivedSecret = request.headers.get("x-caretak-payment-secret");

    if (!expectedSecret || !receivedSecret || receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: "승인되지 않은 결제 콜백입니다." }, { status: 401 });
    }

    const body = await request.json();
    const paymentId = String(body.paymentId || "");
    const transactionId = String(body.transactionId || "");
    const status = String(body.status || "");

    if (!paymentId || !transactionId || !["paid", "failed", "refunded"].includes(status)) {
      return NextResponse.json({ error: "결제 승인 결과가 올바르지 않습니다." }, { status: 400 });
    }

    // 중요: 이 API는 브라우저에서 직접 호출하지 않습니다.
    // KCP 승인 응답을 서버에서 검증한 어댑터만 이 엔드포인트를 호출해야 합니다.
    const supabase = createAdminServerClient();
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id,payment_status")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if (payment.payment_status === "paid" && status === "paid") {
      return NextResponse.json({ ok: true, duplicated: true });
    }

    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: status,
        transaction_id: transactionId,
      })
      .eq("id", paymentId);

    if (error) throw error;

    return NextResponse.json({ ok: true, paymentId, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "결제 결과 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
