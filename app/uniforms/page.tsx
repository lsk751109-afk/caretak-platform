import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "간병인 공식 유니폼 | 케어택",
  description: "케어택 간병인을 위한 하복, 동복, 조끼, 모자 상품 안내 및 구매 문의",
};

const products = [
  { name: "케어택 하복", english: "SUMMER TOP", tone: "화이트 · 청록", description: "통기성이 좋은 반팔형으로 따뜻한 계절과 실내 간병 활동에 적합합니다.", sizes: "사이즈 문의" },
  { name: "케어택 동복", english: "WINTER TOP", tone: "딥 네이비", description: "단정한 카라와 긴소매 구성으로 환절기와 겨울철 활동에 적합합니다.", sizes: "사이즈 문의" },
  { name: "케어택 조끼", english: "CARE VEST", tone: "딥 네이비", description: "수납 포켓을 갖춘 활동형 조끼로 계절에 관계없이 편리하게 착용할 수 있습니다.", sizes: "사이즈 문의" },
  { name: "케어택 모자", english: "CARE CAP", tone: "딥 네이비", description: "야외 이동과 방문 간병 시 단정한 인상을 완성하는 공식 모자입니다.", sizes: "프리 사이즈 문의" },
];

export default function UniformsPage() {
  return (
    <main className="uniformPage">
      <header className="uniformHeader"><a href="/" className="uniformLogo"><img src="/caretak-logo.svg" alt="케어택" /><span><b>CARE</b><em>TAEK</em><i>.</i></span></a><nav><a href="/caregiver-register">간병인 등록</a><a className="smallPrimary" href="tel:0318682436">구매 문의</a></nav></header>

      <section className="uniformHero"><div><span className="eyebrow">OFFICIAL CAREGIVER WEAR</span><h1>돌봄의 전문성을 입다.</h1><p>움직임은 편안하게, 인상은 단정하게.<br />케어택 간병인을 위한 공식 유니폼 컬렉션입니다.</p><a className="primaryButton" href="tel:0318682436">구매 문의 031-868-2436</a></div><img src="/caretak-uniform-front.webp" alt="케어택 공식 간병인 유니폼 앞면" /></section>

      <section className="uniformProducts"><div className="uniformTitle"><span className="eyebrow">UNIFORM COLLECTION</span><h2>간병 현장을 위한 네 가지 구성</h2><p>판매 가격, 재고, 색상과 사이즈는 구매 상담 시 안내합니다.</p></div><div className="uniformProductGrid">{products.map((product, index) => <article key={product.name}><span className="productNo">0{index + 1}</span><div className={`productShape shape${index + 1}`}><span>{index === 0 ? "반팔" : index === 1 ? "긴팔" : index === 2 ? "조끼" : "모자"}</span></div><small>{product.english}</small><h3>{product.name}</h3><p>{product.description}</p><dl><div><dt>색상</dt><dd>{product.tone}</dd></div><div><dt>규격</dt><dd>{product.sizes}</dd></div></dl><a href="tel:0318682436">구매 문의하기 <span>→</span></a></article>)}</div></section>

      <section className="uniformBack"><img src="/caretak-uniform-back.webp" alt="케어택 공식 간병인 유니폼 뒷면" /><div><span className="eyebrow">FRONT & BACK DETAIL</span><h2>어느 방향에서도<br />한눈에 보이는 신뢰</h2><p>앞면에는 케어택 심벌을, 뒷면에는 케어택 브랜드명을 배치해 간병 현장에서 소속과 역할을 명확하게 확인할 수 있습니다.</p><ul><li>공식 케어택 브랜드 표시</li><li>현장 활동을 고려한 편안한 구성</li><li>계절과 업무에 맞춘 선택</li></ul></div></section>

      <section className="uniformOrder"><div><span>ORDER & SIZE GUIDE</span><h2>구매 전 재고와 사이즈를 확인해 주세요.</h2><p>전화 상담을 통해 상품 종류, 수량, 색상, 사이즈와 판매 가격을 안내해 드립니다.</p></div><a href="tel:0318682436">031-868-2436<br /><small>유니폼 구매 상담</small></a></section>

      <footer className="uniformFooter"><p>마켓하우스 · 대표 이승규 · 031-868-2436</p><a href="/">케어택 메인으로 돌아가기</a></footer>
    </main>
  );
}
