"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";
import "../dashboard.css";

type Profile = { name: string | null; email: string | null; phone: string | null; role: string | null };
type Caregiver = { id: string; name: string | null; status: string | null; career_years: number | null; hourly_rate: number | null };
type MatchRow = {
  id: string;
  status: string | null;
  matched_at: string | null;
  request_id: string;
  care_requests: {
    id: string;
    guardian_id: string;
    patient_name: string | null;
    patient_gender: string | null;
    patient_age: number | null;
    care_grade: string | null;
    service_type: string | null;
    address: string | null;
    start_date: string | null;
    end_date: string | null;
    request_status: string | null;
    guardians: { user_id: string; name: string | null; phone: string | null } | null;
  } | null;
};

const statusLabel: Record<string, string> = {
  assigned: "응답 대기",
  accepted: "배정 수락",
  rejected: "배정 거절",
  active: "서비스 진행",
  completed: "서비스 완료",
};

export default function CaregiverDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const [profileResult, caregiverResult] = await Promise.all([
      supabase.from("profiles").select("name,email,phone,role").eq("id", user.id).maybeSingle(),
      supabase.from("caregivers").select("id,name,status,career_years,hourly_rate").eq("user_id", user.id).maybeSingle(),
    ]);

    if (profileResult.error) {
      setMessage(profileResult.error.message);
      setLoading(false);
      return;
    }

    if (profileResult.data?.role !== "caregiver") {
      window.location.href = "/mypage";
      return;
    }

    setProfile(profileResult.data);
    if (!caregiverResult.data) {
      setMessage("간병인 상세 정보가 없습니다. 회원가입 정보를 다시 확인해주세요.");
      setLoading(false);
      return;
    }

    setCaregiver(caregiverResult.data);

    const matchResult = await supabase
      .from("matching")
      .select("id,status,matched_at,request_id,care_requests(id,guardian_id,patient_name,patient_gender,patient_age,care_grade,service_type,address,start_date,end_date,request_status,guardians(user_id,name,phone))")
      .eq("caregiver_id", caregiverResult.data.id)
      .order("matched_at", { ascending: false });

    if (matchResult.error) {
      setMessage(matchResult.error.message);
    } else {
      const normalized = (matchResult.data || []).map((row: any) => ({
        ...row,
        care_requests: Array.isArray(row.care_requests) ? row.care_requests[0] ?? null : row.care_requests ?? null,
      })) as MatchRow[];
      setMatches(normalized);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function respond(match: MatchRow, nextStatus: "accepted" | "rejected") {
    if (!match.care_requests) return;
    setUpdatingId(match.id);
    setMessage("");

    const requestStatus = nextStatus === "accepted" ? "matched" : "matching";
    const [matchUpdate, requestUpdate] = await Promise.all([
      supabase.from("matching").update({ status: nextStatus }).eq("id", match.id),
      supabase.from("care_requests").update({ request_status: requestStatus }).eq("id", match.request_id),
    ]);

    const error = matchUpdate.error || requestUpdate.error;
    if (error) {
      setMessage(`배정 응답 처리 중 오류가 발생했습니다: ${error.message}`);
      setUpdatingId(null);
      return;
    }

    const guardianUserId = match.care_requests.guardians?.user_id;
    if (guardianUserId) {
      await supabase.from("notifications").insert({
        user_id: guardianUserId,
        title: nextStatus === "accepted" ? "간병인이 배정을 수락했습니다" : "간병인 재매칭을 진행합니다",
        message: nextStatus === "accepted"
          ? `${caregiver?.name || "담당 간병인"}님이 ${match.care_requests.patient_name || "환자"}님의 간병 배정을 수락했습니다.`
          : "배정된 간병인이 일정을 수락하지 못해 새로운 간병인을 찾고 있습니다.",
        is_read: false,
      });
    }

    setMatches((items) => items.map((item) => item.id === match.id ? { ...item, status: nextStatus, care_requests: item.care_requests ? { ...item.care_requests, request_status: requestStatus } : null } : item));
    setMessage(nextStatus === "accepted" ? "배정을 수락했습니다. 보호자에게 안내했습니다." : "배정을 거절했습니다. 관리자가 재매칭을 진행합니다.");
    setUpdatingId(null);
  }

  async function changeServiceStatus(match: MatchRow, nextStatus: "active" | "completed") {
    setUpdatingId(match.id);
    setMessage("");
    const requestStatus = nextStatus === "active" ? "active" : "completed";
    const [matchUpdate, requestUpdate] = await Promise.all([
      supabase.from("matching").update({ status: nextStatus }).eq("id", match.id),
      supabase.from("care_requests").update({ request_status: requestStatus }).eq("id", match.request_id),
    ]);
    const error = matchUpdate.error || requestUpdate.error;
    if (error) setMessage(error.message);
    else {
      setMatches((items) => items.map((item) => item.id === match.id ? { ...item, status: nextStatus, care_requests: item.care_requests ? { ...item.care_requests, request_status: requestStatus } : null } : item));
      setMessage(nextStatus === "active" ? "서비스 시작 상태로 변경했습니다." : "서비스를 완료 처리했습니다.");
    }
    setUpdatingId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const stats = useMemo(() => ({
    pending: matches.filter((item) => item.status === "assigned").length,
    accepted: matches.filter((item) => item.status === "accepted").length,
    active: matches.filter((item) => item.status === "active").length,
    completed: matches.filter((item) => item.status === "completed").length,
  }), [matches]);

  if (loading) return <main className="authPage"><p className="loadingText">간병인 정보를 불러오는 중입니다...</p></main>;

  return <main className="dashboardPage">
    <header className="dashboardHeader">
      <a className="brand" href="/"><span className="brandMark">C</span><span>케어택 간병인</span></a>
      <div className="headerActions"><button className="textButton" onClick={load}>새로고침</button><button className="smallPrimary dashboardButton" onClick={logout}>로그아웃</button></div>
    </header>

    <section className="dashboardHero">
      <span className="eyebrow">CAREGIVER WORKSPACE</span>
      <h1>{profile?.name || caregiver?.name || "간병인"}님, 안녕하세요.</h1>
      <p>배정 요청을 확인하고 수락·거절하거나 서비스 진행 상태를 관리하세요.</p>
    </section>

    <section className="adminStats">
      <div><b>{stats.pending}</b><span>응답 대기</span></div>
      <div><b>{stats.accepted}</b><span>배정 확정</span></div>
      <div><b>{stats.active}</b><span>서비스 진행</span></div>
      <div><b>{stats.completed}</b><span>서비스 완료</span></div>
    </section>

    <section className="dashboardGrid">
      <article className="dashboardCard profileCard"><h2>간병인 정보</h2><dl>
        <div><dt>이름</dt><dd>{profile?.name || caregiver?.name || "-"}</dd></div>
        <div><dt>이메일</dt><dd>{profile?.email || "-"}</dd></div>
        <div><dt>승인 상태</dt><dd>{caregiver?.status === "approved" ? "승인 완료" : caregiver?.status === "rejected" ? "승인 반려" : "승인 대기"}</dd></div>
        <div><dt>경력</dt><dd>{caregiver?.career_years || 0}년</dd></div>
        <div><dt>희망 시급</dt><dd>{caregiver?.hourly_rate ? `${caregiver.hourly_rate.toLocaleString()}원` : "협의"}</dd></div>
      </dl></article>
      <article className="dashboardCard summaryCard"><h2>보험 제출 서류</h2><p className="authIntro">완료된 간병 건의 사실확인서와 비용 확인서를 작성해 PDF로 저장할 수 있습니다.</p><a className="smallPrimary" href="/caregiver/documents">보험서류 작성</a></article>
    </section>

    <section className="dashboardSection">
      <div className="dashboardTitle"><h2>배정 및 일정</h2><span>{matches.length}건</span></div>
      {matches.length === 0 ? <div className="emptyState">현재 배정된 간병 일정이 없습니다.</div> : <div className="assignmentGrid">
        {matches.map((match) => {
          const request = match.care_requests;
          const busy = updatingId === match.id;
          return <article className="assignedCaregiverCard" key={match.id}>
            <div className="assignedCardTop"><div className="caregiverAvatar">{request?.patient_name?.slice(0, 1) || "환"}</div><div><h3>{request?.patient_name || "환자 정보 확인 중"}</h3><p>{request?.service_type || "간병 서비스"} · {request?.address || "장소 미정"}</p></div><span className={`historyStatus match-${match.status || "assigned"}`}>{statusLabel[match.status || "assigned"] || match.status}</span></div>
            <dl className="assignmentDetails">
              <div><dt>환자</dt><dd>{request?.patient_name || "-"} / {request?.patient_gender || "-"} / {request?.patient_age ?? "-"}세</dd></div>
              <div><dt>환자 상태</dt><dd>{request?.care_grade || "등록 정보 없음"}</dd></div>
              <div><dt>근무 장소</dt><dd>{request?.address || "-"}</dd></div>
              <div><dt>근무 기간</dt><dd>{request?.start_date || "미정"}{request?.end_date ? ` ~ ${request.end_date}` : ""}</dd></div>
              <div><dt>보호자</dt><dd>{match.status === "accepted" || match.status === "active" || match.status === "completed" ? `${request?.guardians?.name || "보호자"} · ${request?.guardians?.phone || "연락처 없음"}` : "수락 후 공개"}</dd></div>
            </dl>
            <div className="paymentActionRow">
              {match.status === "assigned" && <><button className="secondaryButton compactButton" disabled={busy} onClick={() => respond(match, "rejected")}>거절</button><button className="smallPrimary" disabled={busy} onClick={() => respond(match, "accepted")}>{busy ? "처리 중" : "수락"}</button></>}
              {match.status === "accepted" && <button className="smallPrimary" disabled={busy} onClick={() => changeServiceStatus(match, "active")}>{busy ? "처리 중" : "서비스 시작"}</button>}
              {match.status === "active" && <button className="smallPrimary" disabled={busy} onClick={() => changeServiceStatus(match, "completed")}>{busy ? "처리 중" : "서비스 완료"}</button>}
            </div>
          </article>;
        })}
      </div>}
    </section>
    {message && <p className="formMessage dashboardMessage">{message}</p>}
  </main>;
}
