import { NextRequest, NextResponse } from "next/server";
import { createAdminServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json({ error: "로그인 정보가 없습니다." }, { status: 401 });
    }

    const admin = createAdminServerClient();
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    const user = userData.user;

    if (userError || !user) {
      return NextResponse.json({ error: "로그인 정보를 확인할 수 없습니다." }, { status: 401 });
    }

    const metadata = user.user_metadata || {};
    const role = metadata.role === "caregiver" ? "caregiver" : "guardian";
    const name = String(metadata.name || "").trim() || null;
    const phone = String(metadata.phone || "").trim() || null;
    const email = user.email || null;

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        email,
        name,
        phone,
        role,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (role === "guardian") {
      const { data: guardian } = await admin
        .from("guardians")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (guardian) {
        await admin.from("guardians").update({ name, phone }).eq("id", guardian.id);
      } else {
        const { error: guardianError } = await admin
          .from("guardians")
          .insert({ user_id: user.id, name, phone });
        if (guardianError) {
          return NextResponse.json({ error: guardianError.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ synced: true, role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원정보 동기화 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
