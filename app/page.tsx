"use client";

import { useEffect, useState } from "react";
import AuthActions from "@/components/AuthActions";
import HomeBanner from "@/components/HomeBanner";
import { supabase } from "@/lib/supabase";

type Notice = { id: string; title: string; content: string; created_at: string };
type Faq = { id: string; question: string; answer: string };

const services = [
  { number: "01", icon: "✦", title: "전문 간병 매칭", text: "환자 상태와 일정, 지역을 꼼꼼히 확인해 조건에 맞는 간병인을 연결합니다.", link: "/care-request" },
  { number: "02", icon: "⌁", title: "간병인 찾기", text: "경력과 활동 정보를 살펴보고 우리 가족에게 맞는 간병인을 확인할 수 있습니다.", link: "/caregivers" },
  { number: "03", icon: "✓", title: "안심 진행 관리", text: "신청부터 매칭, 서비스 진행과 종료까지 모든 과정을 한곳에서 관리합니다.", link: "/mypage" },
  { number: "04", icon: "◆", title: "VIP 전담간병", text: "전담 코디네이터가 상담부터 배정과 일정 관리까지 세심하게 동행합니다.", link: "/vip" },
];

const steps = [
  ["01", "간병 신청", "환자 상태와 필요한 일정, 지역을 알려주세요."],
  ["02", "조건 확인", "담당자가 신청 내용을 확인하고 필요한 사항을 안내합니다."],
  ["03", "맞춤 매칭", "조건에 적합한 간병인을 검토하고 연결합니다."],
  ["04", "안심 돌봄", "확정된 일정에 맞춰 간병 서비스를 시작합니다."],
];

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a className={`brand ${footer ? "footerBrand" : ""}`} href="/" aria-label="케어택 홈">
      <img src="/caretak-logo.svg" alt="케어택" />
      <span className="brandWord" aria-hidden="true">
        <span><b>CARE</b><em>TAEK</em><i>.</i></span>
        <small>PROFESSIONAL CARE MATCHING</small>
      </span>
    </a>
  );
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    async function loadCms() {
      const [noticeResult, faqResult] = await Promise.all([
        supabase.from("notices").select("id,title,content,created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(3),
        supabase.from("faqs").select("id,question,answer").eq("is_published", true).order("sort_order", { ascending: true }).limit(6),
      ]);
      if (noticeResult.data) setNotices(noticeResult.data);
      if (faqResult.data) setFaqs(faqResult.data);
    }
    loadCms();
  }, []);

  return (
    <main>
      <div className="topNotice"><span>24시간 간병 상담</span><a href="tel:0318682436">031-868-2436</a><i /> <span>보호자와 간병인을 위한 안전한 연결</span></div>
      <header className="header">
        <Brand />
        <nav className="nav" aria-label="주요 메뉴">
          <a href="#services">간병 서비스</a><a href="#process">이용방법</a><a href="/caregivers">간병인 찾기</a><a href="#vip">VIP 전담간병</a><a className="uniformNavLink" href="/uniforms" aria-label="간병인 유니폼 구입"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.5 8.5h11l1 11h-13l1-11Z"/><path d="M9 9V6.8a3 3 0 0 1 6 0V9"/></svg><span>유니폼 구입</span></a><a href="#support">고객지원</a>
        </nav>
        <AuthActions />
      </header>

      <HomeBanner />

      <section className="quickBar" aria-label="빠른 서비스">
        <div><small>FOR FAMILY</small><b>간병이 필요하신가요?</b><a href="/care-request">간병 신청하기 <span>→</span></a></div>
        <div><small>FOR CAREGIVER</small><b>간병 활동을 찾으시나요?</b><a href="/caregiver-register">간병인 등록하기 <span>→</span></a></div>
        <div className="quickPhone"><small>CARE CONSULTING</small><b>전문 상담이 필요하신가요?</b><a href="tel:0318682436">031-868-2436 <span>→</span></a></div>
      </section>

      <section className="trustStrip">
        <p><span>CARETAK PROMISE</span> 가족을 돌보는 마음으로, 필요한 순간 가장 가까운 곳에서 함께합니다.</p>
        <div><b>24시간</b><small>상담 접수</small></div><div><b>1:1</b><small>맞춤 상담</small></div><div><b>전 과정</b><small>진행 관리</small></div>
      </section>

      <section className="section servicesSection" id="services">
        <div className="sectionIntro splitIntro">
          <div><span className="eyebrow">CARE SERVICES</span><h2>간병의 모든 순간을<br />더 안심할 수 있도록</h2></div>
          <p>처음이라 막막한 간병 준비부터 서비스가 끝나는 순간까지,<br />케어택이 명확하고 따뜻한 기준으로 함께합니다.</p>
        </div>
        <div className="serviceGrid">
          {services.map((service) => <a className="serviceCard" href={service.link} key={service.title}><span className="cardNumber">{service.number}</span><div className="serviceIcon">{service.icon}</div><h3>{service.title}</h3><p>{service.text}</p><b className="cardArrow">자세히 보기 <i>→</i></b></a>)}
        </div>
      </section>

      <section className="careStory">
        <div className="storyImage" role="img" aria-label="가족과 케어택 간병인이 함께하는 모습" />
        <div className="storyCopy"><span className="eyebrow">OUR CARE STANDARD</span><h2>좋은 간병은<br />사람을 이해하는 것에서<br />시작합니다.</h2><p>환자의 상태뿐 아니라 보호자의 걱정까지 세심하게 듣습니다. 케어택은 조건만 연결하는 것을 넘어, 서로 믿고 돌봄을 이어갈 수 있도록 전 과정을 살핍니다.</p><ul><li><b>01</b> 환자와 보호자의 상황을 먼저 듣습니다.</li><li><b>02</b> 필요한 조건을 명확하게 확인합니다.</li><li><b>03</b> 서비스 진행 과정을 꾸준히 관리합니다.</li></ul></div>
      </section>

      <section className="processSection" id="process">
        <div className="sectionIntro centered light"><span className="eyebrow">HOW IT WORKS</span><h2>복잡했던 간병 준비,<br />네 단계면 충분합니다.</h2><p>신청부터 돌봄 시작까지 케어택이 순서대로 안내합니다.</p></div>
        <div className="steps">{steps.map(([number, title, text]) => <article className="step" key={number}><span>{number}</span><div className="stepIcon" /><h3>{title}</h3><p>{text}</p></article>)}</div>
        <div className="processAction"><a className="primaryButton mintButton" href="/care-request">지금 간병 신청하기 <span>→</span></a><small>간단한 정보 입력으로 상담을 시작할 수 있습니다.</small></div>
      </section>

      <section className="trainingSection">
        <div className="trainingCopy"><span className="eyebrow">PROFESSIONAL TRAINING</span><h2>현장에서 필요한<br />돌봄 역량을 준비합니다.</h2><p>환자 이동, 체위 변경, 식사 보조 등 실제 간병 현장에서 필요한 내용을 중심으로 책임감 있는 돌봄을 준비합니다.</p><a className="lineButton" href="/caregiver-register">간병인 등록 안내 <span>→</span></a></div>
        <div className="trainingImage" role="img" aria-label="케어택 간병 전문 교육실" />
      </section>

      <section className="uniformPromo">
        <div className="uniformPromoImage"><img src="/caretak-uniform-front.webp" alt="케어택 간병인 공식 유니폼 하복, 동복, 조끼, 모자" /></div>
        <div className="uniformPromoCopy"><span className="eyebrow">CARETAK UNIFORM</span><h2>현장에서 더 단정하고<br />신뢰감 있게</h2><p>간병 업무의 활동성과 전문적인 인상을 함께 고려한 케어택 간병인 유니폼입니다. 하복, 동복, 조끼, 모자를 구매 문의할 수 있습니다.</p><div className="uniformTags"><span>통기성 하복</span><span>보온 동복</span><span>활동형 조끼</span><span>공식 모자</span></div><a className="primaryButton" href="/uniforms">유니폼 상품 보기 <span>→</span></a></div>
      </section>

      <section className="vipSection" id="vip">
        <div className="vipPhoto" role="img" aria-label="VIP 전담간병 상담 모습"><span>PREMIUM CARE<br /><b>VIP</b></span></div>
        <div className="vipCopy"><span className="eyebrow gold">VIP CARE SERVICE</span><h2>더 세심한 돌봄이<br />필요한 순간</h2><p>중증 환자, 장기 간병, 중요한 일정처럼 특별한 관리가 필요한 경우 전담 코디네이터가 상담부터 간병인 배정, 일정 관리까지 1:1로 지원합니다.</p><div className="vipPoints"><div><b>01</b><span><strong>1:1 전담 상담</strong><small>상황에 맞는 간병 계획 수립</small></span></div><div><b>02</b><span><strong>우선 매칭 관리</strong><small>필요 조건에 맞춘 집중 검토</small></span></div><div><b>03</b><span><strong>진행 상황 확인</strong><small>서비스 기간 동안 세심한 관리</small></span></div></div><a className="darkButton" href="/vip">VIP 상담 신청하기 <span>→</span></a></div>
      </section>

      {(notices.length > 0 || faqs.length > 0) && <section className="section supportSection" id="support">
        <div className="sectionIntro centered"><span className="eyebrow">CARETAK GUIDE</span><h2>도움이 필요하신가요?</h2></div>
        <div className="supportGrid">
          {notices.length > 0 && <div className="noticePanel"><div className="panelHeading"><h3>공지사항</h3><a href="#notice">전체보기 →</a></div>{notices.map((item) => <article key={item.id}><time>{new Date(item.created_at).toLocaleDateString("ko-KR")}</time><div><h4>{item.title}</h4><p>{item.content}</p></div></article>)}</div>}
          {faqs.length > 0 && <div className="faqPanel"><div className="panelHeading"><h3>자주 묻는 질문</h3></div>{faqs.slice(0, 4).map((item) => <details key={item.id}><summary>{item.question}<span>＋</span></summary><p>{item.answer}</p></details>)}</div>}
        </div>
      </section>}

      <section className="cta" id="contact"><div><span className="eyebrow">CARETAK CONSULTING</span><h2>돌봄이 필요한 순간,<br />혼자 고민하지 마세요.</h2><p>케어택 상담 담당자가 필요한 간병을 차분히 안내해 드립니다.</p></div><div className="ctaButtons"><a className="primaryButton" href="tel:0318682436">전화 상담 031-868-2436</a><a className="secondaryButton white" href="/care-request">온라인 간병 신청</a></div></section>

      <footer className="footer"><div className="footerTop"><Brand footer /><div className="footerLinks"><a href="#services">간병 서비스</a><a href="/caregivers">간병인 찾기</a><a href="#vip">VIP 전담간병</a><a href="/uniforms">간병인 유니폼</a><a href="#support">고객지원</a></div></div><div className="footerInfo"><p><b>마켓하우스</b> · 대표 이승규 · 031-868-2436 · lsk75@naver.com</p><p>인천광역시 옹진군 선재로265번길 51 나동 117호</p></div><div className="footerBottom"><small>© 2026 CareTak. All rights reserved.</small><small>보호자와 간병인을 위한 전문 간병 매칭 플랫폼</small></div></footer>
    </main>
  );
}
