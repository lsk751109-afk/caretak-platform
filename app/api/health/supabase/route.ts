import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function jwtProjectRef(value: string | undefined) {
  if (!value || value.split(".").length !== 3) return null;
  try {
    const payload = value.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return typeof decoded.ref === "string" ? decoded.ref : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serverSecret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const urlProjectRef = url
    ? new URL(url).hostname.split(".")[0]
    : null;
  const publicProjectRef = jwtProjectRef(publicKey);
  const serverProjectRef = jwtProjectRef(serverSecret);

  let adminAuthReachable = false;
  let adminAuthError: string | null = null;

  if (url && serverSecret) {
    const admin = createClient(url, serverSecret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    adminAuthReachable = !error;
    adminAuthError = error?.message || null;
  }

  return NextResponse.json({
    publicConfigured: Boolean(url && publicKey),
    serverConfigured: Boolean(url && serverSecret),
    configured: Boolean(url && publicKey && serverSecret),
    urlHost: url ? new URL(url).hostname : null,
    urlProjectRef,
    publicProjectRef,
    serverProjectRef,
    publicKeyMatchesUrl: publicProjectRef ? publicProjectRef === urlProjectRef : null,
    serverKeyMatchesUrl: serverProjectRef ? serverProjectRef === urlProjectRef : null,
    adminAuthReachable,
    adminAuthError,
  });
}
