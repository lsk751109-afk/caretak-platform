"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../../forms.css";
import "../../dashboard.css";

type Notice = { id: string; title: string; content: string; is_published: boolean; created_at: string };
type Faq = { id: string; question: string; answer: string; sort_order: number; is_published: boolean };
type Banner = { id: string; title: string; subtitle: string | null; link_url: string | null; is_active: boolean };

export default function AdminContentPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return void (window.location.href = "/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
      setMessage("관리자 권한이 없습니다.");
      setLoading(false);
      return;
    }

    const [noticeResult, faqResult, bannerResult] = await Promise.all([
      supabase.from("notices").select("id,title,content,is_published,created_at").order("created_at", { ascending: false }),
      supabase.from("faqs").select("id,question,answer,sort_order,is_published").order("sort_order"),
      supabase.from("site_banners").select("id,title,subtitle,link_url,is_active").order("created_at", { ascending: false }),
    ]);
    if (noticeResult.data) setNotices(noticeResult.data);
    if (faqResult.data) setFaqs(faqResult.data);
    if (bannerResult.data) setBanners(bannerResult.data);
    const error = noticeResult.error || faqResult.error || bannerResult.error;
    if (error) setMessage(`${error.message} · Supabase에서 supabase/cms_setup.sql을 먼저 실행해 주세요.`);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("notices").insert({
      title: String(form.get("title") || "").trim(),
      content: String(form.get("content") || "").trim(),
      is_published: form.get("is_published") === "on",
    });
    if (error) return setMessage(error.message);
    event.currentTarget.reset();
    setMessage("공지사항을 등록했습니다.");
    load();
  }

  async function addFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("faqs").insert({
      question: String(form.get("question") || "").trim(),
      answer: String(form.get("answer") || "").trim(),
      sort_order: Number(form.get("sort_order") || 0),
      is_published: form.get("is_published") === "on",
    });
    if (error) return setMessage(error.message);
    event.currentTarget.reset();
    setMessage("FAQ를 등록했습니다.");
    load();
  }

  async function addBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const activate = form.get("is_active") === "on";

    if (activate) {
      const { error: deactivateError } = await supabase.from("site_banners").update({ is_active: false }).eq("is_active", true);
      if (deactivateError) return setMessage(deactivateError.message);
    }

    const { error } = await supabase.from("site_banners").insert({
      title: String(form.get("title") || "").trim(),
      subtitle: String(form.get("subtitle") || "").trim() || null,
      link_url: String(form.get("link_url") || "").trim() || null,
      is_active: activate,
    });
    if (error) return setMessage(error.message);
    event.currentTarget.reset();
    setMessage(activate ? "활성 배너를 등록했습니다." : "배너를 비활성 상태로 등록했습니다.");
    load();
  }

  async function toggleBanner(item: Banner) {
    setMessage("");
    if (!item.is_active) {
      const { error: deactivateError } = await supabase.from("site_banners").update({ is_active: false }).eq("is_active", true);
      if (deactivateError) return setMessage(deactivateError.message);
    }
    const { error } = await supabase.from("site_banners").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) return setMessage(error.message);
    setMessage(item.is_active ? "배너를 비활성화했습니다." : "배너를 활성화했습니다.");
    load();
  }

  async function remove(table: "notices" | "faqs" | "site_banners", id: string) {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setMessage(error.message);
    setMessage("삭제했습니다.");
    load();
  }

  if (loading) return <main className="authPage"><p className="loadingText">콘텐츠를 불러오는 중입니다...</p></main>;

  return <main className="dashboardPage adminPage">
    <header className="dashboardHeader"><a className="brand" href="/"><span>케어택</span></a><div className="headerActions"><a className="textButton" href="/admin">운영 대시보드</a><button className="smallPrimary" onClick={load}>새로고침</button></div></header>
    <section className="dashboardHero"><span className="eyebrow">CARETAK CMS</span><h1>사이트 콘텐츠 관리</h1><p>공지사항, FAQ와 메인 배너를 등록하고 공개 상태를 관리합니다.</p></section>
    {message && <p className="formMessage dashboardMessage">{message}</p>}

    <section className="dashboardSection"><div className="dashboardTitle"><h2>공지사항</h2><span>{notices.length}건</span></div>
      <form className="authForm requestForm" onSubmit={addNotice}><label>제목<input name="title" required /></label><label className="full">내용<textarea name="content" rows={4} required /></label><label className="agreementCheck full"><input name="is_published" type="checkbox" defaultChecked /><span>바로 공개</span></label><button className="primaryButton full">공지 등록</button></form>
      <div className="historyList">{notices.map((item) => <article className="historyItem" key={item.id}><div><b>{item.title}</b><p>{item.is_published ? "공개" : "비공개"} · {new Date(item.created_at).toLocaleDateString("ko-KR")}</p></div><button className="textAction" onClick={() => remove("notices", item.id)}>삭제</button></article>)}</div>
    </section>

    <section className="dashboardSection"><div className="dashboardTitle"><h2>FAQ</h2><span>{faqs.length}건</span></div>
      <form className="authForm requestForm" onSubmit={addFaq}><label>질문<input name="question" required /></label><label>정렬 순서<input name="sort_order" type="number" defaultValue="0" /></label><label className="full">답변<textarea name="answer" rows={4} required /></label><label className="agreementCheck full"><input name="is_published" type="checkbox" defaultChecked /><span>공개</span></label><button className="primaryButton full">FAQ 등록</button></form>
      <div className="historyList">{faqs.map((item) => <article className="historyItem" key={item.id}><div><b>{item.question}</b><p>{item.is_published ? "공개" : "비공개"} · 순서 {item.sort_order}</p></div><button className="textAction" onClick={() => remove("faqs", item.id)}>삭제</button></article>)}</div>
    </section>

    <section className="dashboardSection"><div className="dashboardTitle"><h2>메인 배너</h2><span>{banners.length}건</span></div>
      <form className="authForm requestForm" onSubmit={addBanner}><label>제목<input name="title" required /></label><label>부제목<input name="subtitle" /></label><label className="full">연결 주소<input name="link_url" placeholder="/care-request" /></label><label className="agreementCheck full"><input name="is_active" type="checkbox" defaultChecked /><span>등록 즉시 메인에 표시</span></label><button className="primaryButton full">배너 등록</button></form>
      <div className="historyList">{banners.map((item) => <article className="historyItem" key={item.id}><div><b>{item.title}</b><p>{item.is_active ? "활성 · 메인 표시 중" : "비활성"} · {item.link_url || "연결 없음"}</p></div><div className="adminActions"><button onClick={() => toggleBanner(item)}>{item.is_active ? "숨기기" : "메인에 표시"}</button><button className="textAction" onClick={() => remove("site_banners", item.id)}>삭제</button></div></article>)}</div>
    </section>
  </main>;
}
