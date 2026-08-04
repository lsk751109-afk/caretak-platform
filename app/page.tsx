import AuthActions from "@/components/AuthActions";

const services = [
  { icon: "🩺", title: "전문 간병인", text: "경력과 정보를 확인한 간병인을 연결합니다." },
  { icon: "⚡", title: "빠른 매칭", text: "지역과 일정에 맞는 간병인을 신속하게 찾습니다." },
  { icon: "🛡️", title: "안심 관리", text: "신청부터 서비스 종료까지 진행 상황을 관리합니다." },
  { icon: "⭐", title: "VIP 전담간병", text: "전담 코디네이터가 맞춤 간병을 설계합니다." },
];

const steps = ["회원가입", "간병 신청", "간병인 매칭", "서비스 시작"];

export default function Home() {
  return (
    <main>
      <header className="header">
        <a className="brand" href="#top" aria-label="케어택 홈"><span className="brandMark">C</span><span>케어택</span></a>
        <nav className="nav" aria-label="주요 메뉴"><a href="#services">서비스</a><a href="#process">이용방법</a><a href="#vip">VIP 간병</a><a href="#contact">고객센터</a></nav>
        <AuthActions />
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <span className="eyebrow">CARETAK CARE MATCHING</span>
          <h1>돌봄이 필요한 순간,<br /><strong>믿을 수 있는 간병</strong>을 연결합니다.</h1>
          <p>보호자의 상황과 환자의 필요를 확인해 검증된 간병인을 빠르고 안전하게 매칭합니다.</p>
          <div className="heroButtons"><a className="primaryButton" href="/care-request">간병 신청하기</a><a className="secondaryButton" href="/caregivers">간병인 찾아보기</a></div>
          <div className="heroStats"><div><b>24시간</b><span>상담 접수</span></div><div><b>맞춤형</b><span>간병 매칭</span></div><div><b>전담형</b><span>VIP 관리</span></div></div>
        </div>
        <div className="heroPanel" aria-label="실시간 매칭 안내">
          <div className="panelTop"><span className="liveDot" /><span>실시간 매칭 접수</span></div>
          <div className="matchCard"><div className="avatar">간</div><div><b>서울 · 입원 간병</b><p>내일 오전부터 · 7일</p></div><span className="status">접수중</span></div>
          <div className="matchCard"><div className="avatar mint">VIP</div><div><b>인천 · 전담 간병</b><p>전담 코디네이터 배정</p></div><span className="status vip">VIP</span></div>
          <div className="secureBox"><span>✓</span><div><b>안전한 정보 관리</b><p>회원별 권한과 보안정책을 적용합니다.</p></div></div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="sectionHeading"><span className="eyebrow">CARE SERVICES</span><h2>케어택이 간병의 시작부터 끝까지 함께합니다.</h2><p>복잡한 간병 준비를 더 쉽고 명확하게 진행하세요.</p></div>
        <div className="serviceGrid">{services.map((service) => <article className="serviceCard" key={service.title}><div className="serviceIcon">{service.icon}</div><h3>{service.title}</h3><p>{service.text}</p></article>)}</div>
      </section>

      <section className="processSection" id="process">
        <div className="sectionHeading light"><span className="eyebrow">HOW IT WORKS</span><h2>간단한 4단계로 시작하세요.</h2></div>
        <div className="steps">{steps.map((step, index) => <div className="step" key={step}><span>{String(index + 1).padStart(2, "0")}</span><h3>{step}</h3><p>{index === 0 ? "보호자 또는 간병인으로 가입합니다." : index === 1 ? "환자와 일정 정보를 입력합니다." : index === 2 ? "조건에 맞는 간병인을 확인합니다." : "확정된 일정에 맞춰 서비스를 시작합니다."}</p></div>)}</div>
      </section>

      <section className="vipSection" id="vip">
        <div><span className="eyebrow gold">VIP CARE</span><h2>중요한 순간을 위한<br />VIP 전담간병</h2><p>전담 코디네이터가 보호자 상담부터 간병인 배정, 일정 관리까지 세심하게 지원합니다.</p><a className="darkButton" href="/vip">VIP 상담 신청</a></div>
        <div className="vipList"><div><span>01</span><b>1:1 전담 상담</b><p>상황을 자세히 확인해 맞춤 계획을 세웁니다.</p></div><div><span>02</span><b>우선 매칭 관리</b><p>필요 조건에 적합한 간병인을 우선 검토합니다.</p></div><div><span>03</span><b>서비스 진행 확인</b><p>서비스 기간 동안 진행 상황을 확인합니다.</p></div></div>
      </section>

      <section className="cta" id="contact"><div><span className="eyebrow">CARETAK SUPPORT</span><h2>지금 필요한 간병을 상담해보세요.</h2><p>접수 내용을 확인한 뒤 케어택 상담 담당자가 안내합니다.</p></div><div className="ctaButtons"><a className="primaryButton" href="tel:0318682436">전화 상담 031-868-2436</a><a className="secondaryButton white" href="/care-request">온라인 신청</a></div></section>

      <footer className="footer"><div className="brand footerBrand"><span className="brandMark">C</span><span>케어택</span></div><p>마켓하우스 · 대표 이승규 · 031-868-2436</p><p>이메일 lsk75@naver.com</p><p>인천광역시 옹진군 선재로265번길 51 나동 117호</p><small>© 2026 CareTak. All rights reserved.</small></footer>
    </main>
  );
}
