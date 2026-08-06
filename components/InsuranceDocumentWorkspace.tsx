"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CaseItem = { id: string; patient: string; service: string; start: string; end: string; place: string; caregiver: string };

export default function InsuranceDocumentWorkspace({ audience }: { audience: "caregiver" | "guardian" }) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const selected = cases.find((item) => item.id === selectedId);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("name,role").eq("id", auth.user.id).maybeSingle();
      if (profile?.role !== audience) { window.location.href = audience === "caregiver" ? "/caregiver" : "/mypage"; return; }
      setOwnerName(profile?.name || "");

      let query = supabase.from("matching").select("id,status,care_requests(id,patient_name,service_type,address,start_date,end_date,guardians(user_id)),caregivers(id,user_id,name)").in("status", ["active", "completed"]);
      if (audience === "caregiver") {
        const { data: caregiver } = await supabase.from("caregivers").select("id").eq("user_id", auth.user.id).maybeSingle();
        if (caregiver?.id) query = query.eq("caregiver_id", caregiver.id);
      }
      const { data, error } = await query.order("matched_at", { ascending: false });
      if (error) setMessage(error.message);
      const normalized = (data || []).filter((row: any) => {
        const request = Array.isArray(row.care_requests) ? row.care_requests[0] : row.care_requests;
        const guardian = request?.guardians && (Array.isArray(request.guardians) ? request.guardians[0] : request.guardians);
        return audience === "caregiver" || guardian?.user_id === auth.user?.id;
      }).map((row: any) => {
        const request = Array.isArray(row.care_requests) ? row.care_requests[0] : row.care_requests;
        const caregiver = Array.isArray(row.caregivers) ? row.caregivers[0] : row.caregivers;
        return { id: row.id, patient: request?.patient_name || "환자", service: request?.service_type || "간병 서비스", start: request?.start_date || "", end: request?.end_date || "", place: request?.address || "", caregiver: caregiver?.name || "간병인" };
      });
      setCases(normalized);
      if (normalized[0]) setSelectedId(normalized[0].id);
      setLoading(false);
    }
    load();
  }, [audience]);

  function printDocuments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return setMessage("서류를 작성할 간병 건을 선택해주세요.");
    setMessage("");
    window.print();
  }

  if (loading) return <main className="formPage"><p className="loadingText">간병 기록을 확인하는 중입니다…</p></main>;

  return <main className="insurancePage">
    <header className="simpleHeader noPrint"><a className="brand" href="/"><span className="brandMark">C</span><span>케어택</span></a><a className="secondaryButton" href={audience === "caregiver" ? "/caregiver" : "/mypage"}>마이페이지</a></header>
    <section className="insuranceHero noPrint"><span className="eyebrow">INSURANCE DOCUMENTS</span><h1>{audience === "caregiver" ? "보험사 제출 서류" : "보험금 청구서류"}</h1><p>완료된 간병 기록을 선택해 공통 확인서류를 작성하고 PDF로 저장할 수 있습니다.</p></section>
    <form className="insuranceWorkspace" onSubmit={printDocuments}>
      <aside className="insuranceControls noPrint">
        <label>간병 건 선택<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">선택해주세요</option>{cases.map((item) => <option value={item.id} key={item.id}>{item.patient} · {item.start || "기간 미정"}</option>)}</select></label>
        <label>보험사<input name="insurer" placeholder="보험사명" /></label>
        <label>증권번호<input name="policyNumber" placeholder="선택 입력" /></label>
        <label>총 간병비<input name="careAmount" type="number" min="0" placeholder="원 단위" required /></label>
        <label>간병 내용<textarea name="careMemo" placeholder="식사 보조, 이동 보조, 야간 돌봄 등" required /></label>
        <label className="consentCheck"><input type="checkbox" required /> 본인과 상대방의 확인을 거쳐 사실대로 작성했습니다.</label>
        <button className="submitButton" disabled={!selected}>서류 인쇄·PDF 저장</button>
        <p className="noticeBox">진단서·입퇴원확인서·진료비 서류는 의료기관 발급 원본을 별도로 첨부해야 합니다.</p>
        {message && <p className="formMessage error">{message}</p>}
      </aside>
      <article className="insuranceDocument">
        <div className="documentBrand"><b>CARETAK</b><span>간병 전문 매칭 플랫폼</span></div>
        <h2>{audience === "caregiver" ? "간병 사실 및 비용 확인서" : "간병비 보험금 청구 확인서"}</h2>
        <p className="documentNumber">문서번호: CT-{selected?.id.slice(0, 8).toUpperCase() || "PREVIEW"}</p>
        <table><tbody>
          <tr><th>환자명</th><td>{selected?.patient || "간병 건을 선택해주세요"}</td><th>서비스</th><td>{selected?.service || "-"}</td></tr>
          <tr><th>간병기간</th><td colSpan={3}>{selected ? `${selected.start || "미정"} ~ ${selected.end || "미정"}` : "-"}</td></tr>
          <tr><th>간병장소</th><td colSpan={3}>{selected?.place || "-"}</td></tr>
          <tr><th>간병인</th><td>{selected?.caregiver || "-"}</td><th>작성자</th><td>{ownerName || "-"}</td></tr>
        </tbody></table>
        <section><h3>확인 내용</h3><p>위 환자에 대해 표시된 기간 동안 간병 서비스가 제공되었음을 확인합니다. 간병비와 상세 수행 내용은 작성자가 입력한 내용 및 당사자 서명을 기준으로 합니다.</p></section>
        <div className="signatureGrid"><div><span>보호자 확인</span><b>서명 __________________</b></div><div><span>간병인 확인</span><b>서명 __________________</b></div></div>
        <footer><p>마켓하우스 · 케어택 · 031-868-2436</p><p>본 문서는 간병 사실 확인용이며 보험금 지급을 보장하지 않습니다.</p></footer>
      </article>
    </form>
  </main>;
}
