import { checkoutPlanDetails, type CheckoutPlan } from "@/domain/checkout-plan";

export function PlanTermsNotice({ plan }: { plan?: CheckoutPlan }) {
  const detail = plan ? checkoutPlanDetails[plan] : checkoutPlanDetails.annual;

  return (
    <aside aria-label="Pagamento e política de reembolso" className="plan-terms-notice plan-terms-notice--selected">
      <span className="plan-terms-notice__eyebrow">Resumo do preço e do acesso</span>
      <h3>{detail.price} em pagamento único.</h3>
      <p>Crie, edite, publique e compartilhe quantos cards quiser por 12 meses, sem renovação automática.</p>
      <p>Após 12 meses, os links deixam de abrir se sua conta não tiver outro acesso ativo. Seus rascunhos continuam na conta.</p>
      <p>Você pode personalizar e conferir a prévia sem custo. A compra só é concluída depois da confirmação no checkout seguro da AbacatePay.</p>
      <p>Para solicitar um reembolso, entre em contato com o suporte do Cadernô. O acesso associado é encerrado depois que o estorno é confirmado pela AbacatePay.</p>
    </aside>
  );
}
