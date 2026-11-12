import { checkoutPlanDetails, type CheckoutPlan } from "@/domain/checkout-plan";

export function PlanTermsNotice({ plan }: { plan?: CheckoutPlan }) {
  const detail = plan ? checkoutPlanDetails[plan] : checkoutPlanDetails.annual;

  return (
    <aside aria-label="Pagamento e política de reembolso" className="plan-terms-notice plan-terms-notice--selected">
      <span className="plan-terms-notice__eyebrow">Resumo antes do pagamento</span>
      <h3>Você está prestes a contratar o {detail.name} do Cadernô Express.</h3>
      <p><strong>{detail.price}</strong> · pagamento único · {detail.access}.</p>
      <p>A compra só é concluída depois da confirmação no checkout seguro da AbacatePay.</p>
      <p>Para solicitar um reembolso, entre em contato com o suporte do Cadernô. O acesso associado é encerrado depois que o estorno é confirmado pela AbacatePay.</p>
    </aside>
  );
}
