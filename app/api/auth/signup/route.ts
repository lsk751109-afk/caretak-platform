import { NextRequest, NextResponse } from "next/server";
import { createAdminServerClient } from "@/lib/supabase-server";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  attempts.set(ip, current);
  return current.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
    }

    const ip = clientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "회원가입 요청이 너무 많습니다. 10분 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = body.role === "caregiver" ? "caregiver" : "guardian";

    if (!name || !phone || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json(
        { error: "입력 정보를 확인해주세요. 비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const admin = createAdminServerClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role },
    });

    if (error) {
      const duplicate = /already|registered|exists/i.test(error.message);
      return NextResponse.json(
        { error: duplicate ? "이미 가입된 이메일입니다." : error.message },
        { status: duplicate ? 409 : 400 }
      );
    }

    return NextResponse.json({ userId: data.user.id, created: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
