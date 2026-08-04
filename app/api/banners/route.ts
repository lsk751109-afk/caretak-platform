import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { banner: null, error: "Supabase public environment variables are missing." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("site_banners")
    .select("id,title,subtitle,link_url,image_url,is_active,starts_at,ends_at,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { banner: null, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const now = Date.now();
  const isWithinSchedule =
    !data ||
    ((!data.starts_at || new Date(data.starts_at).getTime() <= now) &&
      (!data.ends_at || new Date(data.ends_at).getTime() >= now));

  return NextResponse.json(
    { banner: data && isWithinSchedule ? data : null, deployedAt: "2026-08-05T02:51:00+09:00" },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } },
  );
}
