import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serverSecret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublicKey: Boolean(publicKey),
    supabaseServerSecret: Boolean(serverSecret),
    kcpSiteCode: Boolean(process.env.KCP_SITE_CODE),
    kcpCallbackSecret: Boolean(process.env.KCP_CALLBACK_SECRET),
  };

  const requiredReady = checks.supabaseUrl && checks.supabasePublicKey;
  const paymentReady = checks.supabaseServerSecret && checks.kcpSiteCode && checks.kcpCallbackSecret;

  return NextResponse.json(
    {
      status: requiredReady ? "ok" : "configuration_required",
      appReady: requiredReady,
      paymentServerReady: paymentReady,
      checks,
    },
    { status: requiredReady ? 200 : 503 }
  );
}
