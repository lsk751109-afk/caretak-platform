"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../../forms.css";

type CareRequest = {
  id: string;
  patient_name: string | null;
  patient_gender: string | null;
  patient_age: number | null;
  service_type: string | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  care_grade: string | null;
  request_status: string | null;
};

type Caregiver = {
  id: string;
  name: string;
  gender: string | null;
  address: string | null;
  career_years: number | null;
  certificate: string | null;
  hourly_rate: number | null;
  status: string | null;
};

type Recommendation = Caregiver & { score: number; reasons: string[] };

function regionToken(address: string | null) {
  return (address || "").trim().split(/\s+/).slice(0, 2).join(" ");
}

function scoreCaregiver(request: CareRequest, caregiver: Caregiver): Recommendation {
  let score = 45;
  const reasons: string[] = [];
  const requestRegion = regionToken(request.address);
  const caregiverRegion = regionToken(caregiver.address);

  if (requestRegion && caregiverRegion && (requestRegion.includes(caregiverRegion) || caregiverRegion.includes(requestRegion))) {
    score += 30;
    reasons.push("지역 일치");
  } else if (request.address && caregiver.address && request.address.split(" ")[0] === caregiver.address.split(" ")[0]) {
    score += 18;
    reasons.push("광역 지역 일치");
  }

  const years = caregiver.career_years || 0;
  score += Math.min(years * 2, 14);
  if (years >= 5) reasons.push(`경력 ${years}년`);

  if (caregiver.certificate) {
    score += 8;
    reasons.push("자격증 보유");
  }

  if (caregiver.status === "approved") {
    score += 3;
    reasons.push("승인 완료");
  }

  return { ...caregiver, score: Math.min(score, 100), reasons };
}

export default function MatchingAdminPage() {
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [assigningId, setAssigningId] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "admin") {
        window.location.href = "/";
        return;
      }

      const [requestResult, caregiverResult] = await Promise.all([
        supabase
          .from("care_requests")
          .select("id,patient_name,patient_gender,patient_age,service_type,address,start_date,end_date,care_grade,request_status")
          .in("request_status", ["waiting", "reviewing", "matching"])
          .order("created_at", { ascending: false }),
        supabase
          .from("caregivers")
          .select("id,name,gender,address,career_years,certificate,hourly_rate,status")
          .eq("status", "approved")
          .order("career_years", { ascending: false }),
      ]);

      if (requestResult.error || caregiverResult.error) {
        setMessage(requestResult.error?.message || caregiverResult.error?.message || "자료를 불러오지 못했습니다.");
      }

      const requestRows = requestResult.data || [];
      setRequests(requestRows);
      setCaregivers(caregiverResult.data || []);
      if (requestRows[0]) setSelectedRequestId(requestRows[0].id);
      setLoading(false);
    }

    load();
  }, []);

  const selectedRequest = requests.find((item) => item.id === selectedRequestId) || null;
  const recommendations = useMemo(() => {
    if (!selectedRequest) return [];
    return caregivers
      .map((caregiver) => scoreCaregiver(selectedRequest, caregiver))
      .sort((a, b) => b.score - a.score);
  }, [selectedRequest, caregivers]);

  async function assignCaregiver(caregiverId: string) {
    if (!selectedRequest) return;
    setAssigningId(caregiverId);
    setMessage("");

    const { error: matchingError } = await supabase.from("matching").insert({
      request_id: selectedRequest.id,
      caregiver_id: caregiverId,
      status: "assigned",
    });

    if (matchingError) {
      setMessage(matchingError.message);
      setAssigningId("");
      return;
    }

    const { error: requestError } = await supabase
      .from("care_requests")
      .update({ request_status: "matched" })
      .eq("id", selectedRequest.id);

    if (requestError) {
      setMessage(requestError.message);
    } else {
      setMessage("간병인 배정이 완료되었습니다.");
      setRequests((current) => current.filter((item) => item.id !== selectedRequest.id));
      const next = requests.find((item) => item.id !== selectedRequest.id);
      setSelectedRequestId(next?.id || "");
    }

    setAssigningId("");
  }

  if (loading) return <main className="authPage"><p className="loadingText">매칭 자료를 불러오는 중입니다...</p></main>;

  return (
    <main className="matchingAdminPage">
      <header className="dashboardHeader">
        <a className="brand" href="/admin"><span className="brandMark">C</span><span>케어택 관리자</span></a>
        <div className="headerActions">
          <a className="textButton" href="/admin">대시보드</a>
          <a className="smallPrimary" href="/">사이트 보기</a>
        </div>
      </header>

      <section className="matchingHero">
        <span className="eyebrow">SMART MATCHING</span>
        <h1>간병인 추천·배정</h1>
        <p>접수된 간병 조건과 승인된 간병인 정보를 비교해 추천 순위를 제공합니다.</p>
      </section>

      <section className="matchingLayout">
        <aside className="requestSidebar">
          <h2>매칭 대기 신청</h2>
          {requests.length === 0 ? <div className="emptyState">매칭을 기다리는 신청이 없습니다.</div> : requests.map((request) => (
            <button
              key={request.id}
              className={`requestSelect ${selectedRequestId === request.id ? "active" : ""}`}
              onClick={() => setSelectedRequestId(request.id)}
            >
              <b>{request.patient_name || "환자"} · {request.service_type || "간병"}</b>
              <span>{request.address || "지역 미입력"}</span>
              <small>{request.start_date || "시작일 미정"}</small>
            </button>
          ))}
        </aside>

        <section className="recommendationPanel">
          {selectedRequest ? (
            <>
              <div className="selectedRequestCard">
                <div>
                  <span className="eyebrow">SELECTED REQUEST</span>
                  <h2>{selectedRequest.patient_name || "환자"}님의 간병 신청</h2>
                  <p>{selectedRequest.address || "지역 미입력"} · {selectedRequest.service_type || "유형 미입력"} · {selectedRequest.start_date || "시작일 미정"}</p>
                </div>
                <span className="historyStatus">추천 {recommendations.length}명</span>
              </div>

              <div className="recommendationList">
                {recommendations.length === 0 ? <div className="emptyState">승인된 간병인이 없습니다.</div> : recommendations.map((caregiver, index) => (
                  <article className="recommendationCard" key={caregiver.id}>
                    <div className="rankBadge">{index + 1}</div>
                    <div className="recommendationInfo">
                      <div className="recommendationTitle">
                        <h3>{caregiver.name}</h3>
                        <strong>{caregiver.score}점</strong>
                      </div>
                      <p>{caregiver.address || "활동 지역 미입력"} · 경력 {caregiver.career_years || 0}년</p>
                      <div className="tagRow">
                        {caregiver.reasons.map((reason) => <span key={reason}>{reason}</span>)}
                        {caregiver.hourly_rate ? <span>시급 {caregiver.hourly_rate.toLocaleString()}원</span> : null}
                      </div>
                    </div>
                    <button
                      className="smallPrimary assignButton"
                      disabled={Boolean(assigningId)}
                      onClick={() => assignCaregiver(caregiver.id)}
                    >
                      {assigningId === caregiver.id ? "배정 중..." : "배정하기"}
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : <div className="emptyState">왼쪽에서 신청 건을 선택하세요.</div>}
        </section>
      </section>

      {message && <p className={`formMessage matchingMessage ${message.includes("완료") ? "" : "error"}`}>{message}</p>}
    </main>
  );
}
