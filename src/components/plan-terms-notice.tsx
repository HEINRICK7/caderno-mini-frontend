import { checkoutPlanDetails, type CheckoutPlan } from "@/domain/checkout-plan";

export function PlanTermsNotice({ plan }: { plan?: CheckoutPlan }) {
  const detail = plan ? checkoutPlanDetails[plan] : null;

  return (
    <aside aria-label="Pagamento e política de reembolso" className={`plan-terms-notice${detail ? " plan-terms-notice--selected" : ""}`}>
      {detail ? (
        <>
          <span className="plan-terms-notice__eyebrow">Resumo antes do pagamento</span>
          <h3>Você está prestes a contratar o {detail.name} do Cadernô Express.</h3>
          <p><strong>{detail.price}</strong> · pagamento único · {detail.access}.</p>
          <p>A compra só é concluída depois do pagamento no checkout seguro da Cakto.</p>
        </>
      ) : (
        <p><strong>Pagamento único, sem renovação automática.</strong> Escolha um plano e confira o resumo antes de pagar.</p>
      )}
      <p>Você pode solicitar reembolso à Cakto em até 7 dias corridos após a compra. Quando o reembolso é concluído, o acesso é encerrado.</p>
      <a href="https://reembolso.cakto.com.br/" rel="noreferrer" target="_blank">
        Acessar o portal de reembolso da Cakto <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
