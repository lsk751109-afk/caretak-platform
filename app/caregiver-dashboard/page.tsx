"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";

type Caregiver = {
  id: string;
  name: string;
  status: string | null;
  address: string | null;
  career_years: number | null;
  hourly_rate: number | null;
};

type Assignment = {
  id: string;
  status: string | null;
  matched_at: string | null;
  care_requests: {
    patient_name: string | null;
    service_type: string | null;
    address: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
};

export default function CaregiverDashboardPage() {
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: caregiverRow, error: caregiverError } = await supabase
      .from("caregivers")
      .select("id,name,status,address,career_years,hourly_rate")
      .eq("user_id", user.id)
      .maybeSingle();

    if (caregiverError) setMessage(caregiverError.message);
    if (!caregiverRow) {
      setLoading(false);
      return;
    }

    setCaregiver(caregiverRow);

    const { data: matchingRows, error: matchingError } = await supabase
      .from("matching")
      .select("id,status,matched_at,care_requests(patient_name,service_type,address,start_date,end_date)")
      .eq("caregiver_id", caregiverRow.id)
      .order("matched_at", { ascending: false });

    if (matchingError) setMessage(matchingError.message);
    setAssignments((matchingRows || []) as Assignment[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function changeStatus(id: string, status: "accepted" | "rejected") {
    setMessage("");
    const { error } = await supabase.from("matching").update({ status }).eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setAssignments((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setMessage(status === "accepted" ? "배정을 수락했습니다." : "배정을 거절했습니다.");
  }

  if (loading) return <main className="authPage"><p className="loadingText">간병인 정보를 불러오는 중입니다...</p></main>;

  return (
    <main className="dashboardPage">
      <header className="dashboardHeader">
        <a className="brand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
        <div className="headerActions">
          <a className="textButton" href="/caregiver-register">내 정보 수정</a>
          <a className="smallPrimary" href="/">사이트 보기</a>
        </div>
      </header>

      <section className="dashboardHero">
        <span className="eyebrow">CAREGIVER CENTER</span>
        <h1>{caregiver?.name || "간병인"}님의 업무 관리</h1>
        <p>승인 상태와 배정 요청, 근무 일정을 확인할 수 있습니다.</p>
      </section>

      {!caregiver ? (
        <section className="dashboardSection">
          <div className="emptyState">등록된 간병인 정보가 없습니다. <a href="/caregiver-register">간병인 등록하기</a></div>
        </section>
      ) : (
        <>
          <section className="dashboardGrid">
            <article className="dashboardCard profileCard">
              <h2>간병인 정보</h2>
              <dl>
                <div><dt>승인 상태</dt><dd>{caregiver.status === "approved" ? "승인 완료" : caregiver.status === "rejected" ? "승인 반려" : "승인 대기"}</dd></div>
                <div><dt>활동 지역</dt><dd>{caregiver.address || "-"}</dd></div>
                <div><dt>경력</dt><dd>{caregiver.career_years || 0}년</dd></div>
                <div><dt>희망 시급</dt><dd>{caregiver.hourly_rate ? `${caregiver.hourly_rate.toLocaleString()}원` : "협의"}</dd></div>
              </dl>
            </article>

            <article className="dashboardCard summaryCard">
              <h2>배정 현황</h2>
              <div className="summaryNumbers">
                <div><b>{assignments.length}</b><span>전체 배정</span></div>
                <div><b>{assignments.filter((item) => item.status === "assigned").length}</b><span>응답 대기</span></div>
                <div><b>{assignments.filter((item) => item.status === "accepted").length}</b><span>수락 완료</span></div>
              </div>
            </article>
          </section>

          <section className="dashboardSection">
            <div className="dashboardTitle"><h2>배정 및 근무 일정</h2></div>
            {assignments.length === 0 ? (
              <div className="emptyState">현재 배정된 간병 일정이 없습니다.</div>
            ) : (
              <div className="historyList">
                {assignments.map((item) => (
                  <article className="historyItem assignmentItem" key={item.id}>
                    <div>
                      <b>{item.care_requests?.patient_name || "환자"} · {item.care_requests?.service_type || "간병 서비스"}</b>
                      <p>{item.care_requests?.address || "지역 미입력"} · {item.care_requests?.start_date || "시작일 미정"}{item.care_requests?.end_date ? ` ~ ${item.care_requests.end_date}` : ""}</p>
                    </div>
                    <div className="assignmentActions">
                      <span className="historyStatus">{item.status === "assigned" ? "응답 대기" : item.status === "accepted" ? "수락 완료" : item.status === "rejected" ? "거절" : item.status || "확인 중"}</span>
                      {item.status === "assigned" && (
                        <div className="inlineButtons">
                          <button className="smallPrimary dashboardButton" onClick={() => changeStatus(item.id, "accepted")}>수락</button>
                          <button className="secondaryButton compactButton" onClick={() => changeStatus(item.id, "rejected")}>거절</button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {message && <p className={`formMessage dashboardMessage ${message.includes("했습니다") ? "" : "error"}`}>{message}</p>}
    </main>
  );
}
