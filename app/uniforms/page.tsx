import type { Metadata } from "next";
import UniformPurchaseGate from "@/components/UniformPurchaseGate";

export const metadata: Metadata = {
  title: "간병인 공식 유니폼 | 케어택",
  description: "케어택 간병인을 위한 하복, 동복, 조끼, 모자 상품 안내 및 구매 문의",
};

const products = [
  { name: "케어택 하복 상의", english: "SUMMER TOP", tone: "화이트 · 청록", description: "통기성이 좋은 반팔형으로 따뜻한 계절과 실내 간병 활동에 적합합니다.", sizes: "사이즈 문의", price: "59,000원" },
  { name: "케어택 동복 상의", english: "WINTER TOP", tone: "딥 네이비", description: "단정한 카라와 긴소매 구성으로 환절기와 겨울철 활동에 적합합니다.", sizes: "사이즈 문의", price: "59,000원" },
  { name: "케어택 조끼", english: "CARE VEST", tone: "딥 네이비", description: "수납 포켓을 갖춘 활동형 조끼로 계절에 관계없이 편리하게 착용할 수 있습니다.", sizes: "사이즈 문의", price: "52,000원" },
  { name: "케어택 모자", english: "CARE CAP", tone: "딥 네이비", description: "야외 이동과 방문 간병 시 단정한 인상을 완성하는 공식 모자입니다.", sizes: "프리 사이즈", price: "29,000원" },
];

const salePrices = [
  ["하복·동복 상의", "59,000원", "단품"],
  ["조끼", "52,000원", "단품"],
  ["모자", "29,000원", "단품"],
  ["상의+모자 세트", "82,000원", "개별 구매 대비 6,000원 할인"],
];

export default function UniformsPage() {
  return (
    <main className="uniformPage">
      <header className="uniformHeader"><a href="/" className="uniformLogo"><img src="/caretak-logo.svg" alt="케어택" /><span><b>CARE</b><em>TAEK</em><i>.</i></span></a><nav><a href="/caregiver-register">간병인 등록</a><a className="smallPrimary" href="#uniform-order">구매 자격 확인</a></nav></header>

      <section className="uniformHero"><div><span className="eyebrow">OFFICIAL CAREGIVER WEAR</span><h1>돌봄의 전문성을 입다.</h1><p>움직임은 편안하게, 인상은 단정하게.<br />케어택 간병인을 위한 공식 유니폼 컬렉션입니다.</p><p className="caregiverOnlyBadge">간병인 회원 전용 판매</p><a className="primaryButton" href="#uniform-order">구매 자격 확인</a></div><img src="/caretak-uniform-front.webp" alt="케어택 공식 간병인 유니폼 앞면" /></section>

      <section className="uniformProducts"><div className="uniformTitle"><span className="eyebrow">UNIFORM COLLECTION</span><h2>간병 현장을 위한 공식 구성</h2><p>간병인 회원 전용 판매가이며, 재고와 사이즈는 구매 상담 시 확인합니다.</p></div><div className="uniformProductGrid">{products.map((product, index) => <article key={product.name}><span className="productNo">0{index + 1}</span><div className={`productShape shape${index + 1}`}><span>{index === 0 ? "반팔" : index === 1 ? "긴팔" : index === 2 ? "조끼" : "모자"}</span></div><small>{product.english}</small><h3>{product.name}</h3><p>{product.description}</p><dl><div><dt>색상</dt><dd>{product.tone}</dd></div><div><dt>규격</dt><dd>{product.sizes}</dd></div></dl><strong className="uniformSalePrice">{product.price}</strong><a href="#uniform-order">간병인 구매 안내 <span>→</span></a></article>)}</div></section>

      <section className="uniformCostSection"><div className="uniformTitle"><span className="eyebrow">CAREGIVER MEMBER PRICE</span><h2>간병인 회원 판매가</h2><p>배송비는 구매 상담 시 주문 수량과 지역에 따라 안내합니다.</p></div><div className="uniformCostTable"><table><thead><tr><th>구분</th><th>판매가</th><th>구성 안내</th></tr></thead><tbody>{salePrices.map(([type, price, note]) => <tr key={type}><th>{type}</th><td>{price}</td><td>{note}</td></tr>)}</tbody></table></div></section>

      <section className="uniformBack"><img src="/caretak-uniform-back.webp" alt="케어택 공식 간병인 유니폼 뒷면" /><div><span className="eyebrow">FRONT & BACK DETAIL</span><h2>어느 방향에서도<br />한눈에 보이는 신뢰</h2><p>앞면에는 케어택 심벌을, 뒷면에는 케어택 브랜드명을 배치해 간병 현장에서 소속과 역할을 명확하게 확인할 수 있습니다.</p><ul><li>공식 케어택 브랜드 표시</li><li>현장 활동을 고려한 편안한 구성</li><li>계절과 업무에 맞춘 선택</li></ul></div></section>

      <section className="uniformOrder" id="uniform-order"><div><span>CAREGIVER ONLY</span><h2>유니폼은 간병인 회원만 구입할 수 있습니다.</h2><p>일반 방문자와 보호자 계정은 구매가 제한됩니다. 간병인 회원 확인 후 재고, 사이즈와 판매 가격을 안내해 드립니다.</p></div><UniformPurchaseGate /></section>

      <footer className="uniformFooter"><p>마켓하우스 · 대표 이승규 · 031-868-2436</p><a href="/">케어택 메인으로 돌아가기</a></footer>
    </main>
  );
}
