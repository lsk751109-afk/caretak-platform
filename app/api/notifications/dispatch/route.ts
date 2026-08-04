import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serverClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: NextRequest) {
  const supplied = request.headers.get("x-dispatch-secret");
  const expected = process.env.NOTIFICATION_DISPATCH_SECRET;
  if (!expected || supplied !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = serverClient();
  if (!supabase) return NextResponse.json({ error: "Supabase server credentials are missing." }, { status: 500 });

  const { data: rows, error } = await supabase
    .from("notification_outbox")
    .select("id,user_id,channel,recipient,title,message,payload,attempts")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  let sent = 0;
  let failed = 0;

  for (const row of rows || []) {
    await supabase.from("notification_outbox").update({ status: "processing", attempts: (row.attempts || 0) + 1 }).eq("id", row.id);
    try {
      if (row.channel === "in_app") {
        if (!row.user_id) throw new Error("In-app notification user_id is missing.");
        const result = await supabase.from("notifications").insert({ user_id: row.user_id, title: row.title, message: row.message, is_read: false });
        if (result.error) throw result.error;
      } else {
        if (!webhookUrl) throw new Error("NOTIFICATION_WEBHOOK_URL is not configured.");
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: row.channel, recipient: row.recipient, title: row.title, message: row.message, payload: row.payload }),
        });
        if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
      }
      await supabase.from("notification_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      sent += 1;
    } catch (dispatchError) {
      await supabase.from("notification_outbox").update({ status: "failed", last_error: dispatchError instanceof Error ? dispatchError.message : String(dispatchError) }).eq("id", row.id);
      failed += 1;
    }
  }

  return NextResponse.json({ processed: (rows || []).length, sent, failed });
}
