export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const orderId = typeof params.orderId === "string" ? params.orderId : "";

  return (
    <main className="authPage">
      <a className="brand authBrand" href="/"><span className="brandMark">C</span><span>케어택</span></a>
      <section className="authCard compact paymentResultCard">
        <div className="resultIcon successIcon">✓</div>
        <span className="eyebrow">PAYMENT COMPLETE</span>
        <h1>결제가 완료되었습니다.</h1>
        <p className="authIntro">결제 결과를 확인했습니다. 마이페이지에서 결제 상태와 간병 일정을 확인할 수 있습니다.</p>
        {orderId ? <div className="resultOrder"><span>주문번호</span><b>{orderId}</b></div> : null}
        <div className="resultActions">
          <a className="primaryButton" href="/mypage">마이페이지 확인</a>
          <a className="secondaryButton" href="/">메인으로 이동</a>
        </div>
      </section>
    </main>
  );
}
