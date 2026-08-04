import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    kcpSiteCode: Boolean(process.env.KCP_SITE_CODE),
    kcpCallbackSecret: Boolean(process.env.KCP_CALLBACK_SECRET),
  };

  const requiredReady = checks.supabaseUrl && checks.supabaseAnonKey;
  const paymentReady = checks.supabaseServiceRole && checks.kcpSiteCode && checks.kcpCallbackSecret;

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
