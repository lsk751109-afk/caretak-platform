import "../../forms.css";
import "../result.css";

export default async function PaymentFailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "결제가 완료되지 않았습니다.";
  const requestId = typeof params.requestId === "string" ? params.requestId : "";

  return (
    <main className="authPage">
      <a className="brand authBrand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
      <section className="authCard compact paymentResultCard">
        <div className="resultIcon failIcon">!</div>
        <span className="eyebrow">PAYMENT NOT COMPLETED</span>
        <h1>결제를 완료하지 못했습니다.</h1>
        <p className="authIntro">{message}</p>
        <div className="resultActions">
          {requestId ? <a className="primaryButton" href={`/payment/${requestId}`}>다시 결제하기</a> : null}
          <a className="secondaryButton" href="/mypage">마이페이지로 이동</a>
        </div>
        <p className="authFoot">반복해서 실패할 경우 고객센터 031-868-2436으로 문의해 주세요.</p>
      </section>
    </main>
  );
}
